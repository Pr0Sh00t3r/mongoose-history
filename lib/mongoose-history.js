const lodash = require("lodash");
const mongoose = require("mongoose");
const hm = require("./history-model");

module.exports = function historyPlugin(schema, options) {
    const defaults = {};

    let historySchemas = {};
    let trackingFields = {};

    const opts = lodash.defaults(options, defaults);
    if (!opts.collectionName) {
        throw new mongoose.Error(
            "Collection name of patch schema not specified"
        );
    }

    schema.eachPath((path, schemaType) => {
        const trackBy = lodash.get(schemaType, "options.trackBy", null);
        if (trackBy) {
            if (checkIfFieldCanBeTracked(trackBy)) {
                if (!Array.isArray(trackingFields[trackBy]))
                    trackingFields[trackBy] = [];
                trackingFields[trackBy] = [...trackingFields[trackBy], path];
                createSchema(trackBy);
            }
        }
    });

    function checkIfFieldCanBeTracked(field) {
        let isIncluded = false;
        Object.keys(schema.paths).forEach(key => {
            if (key === field && schema.paths[key].instance === "Date")
                isIncluded = true;
        });
        return isIncluded;
    }

    function createSchema(field) {
        const collectionName = hm.historyCollectionName(
            opts.collectionName,
            field
        );

        const historySchema = hm.HistoryModel(collectionName);

        historySchemas[collectionName] = historySchema;
    }

    // Clear all history documents from history collection
    schema.statics.clearHistory = async function() {
        try {
            const History = hm.HistoryModel(
                hm.historyCollectionName(opts.collectionName),
                opts
            );
            await History.remove({});
            return {result: true, error: null};
        } catch (err) {
            return {result: false, error: err};
        }
    };

    // Create a copy when insert or update, or a diff log
    schema.pre("save", async function(next) {
        let historyDoc = {};
        let data;
        let newData;
        if (!this.isNew) {
            newData = this.toObject();
            const currentObject = await mongoose.connection.db
                .collection(this.collection.name)
                .findOne(this._id);

            historyDoc = createDiffDoc(currentObject, newData);
            if (historyDoc && historyDoc.length)
                saveHistoryModel(historyDoc, this.collection.name, next);
            else next();
        } else {
            data = this.toObject();
            let operation = "insert";
            historyDoc = createHistoryDoc(data, operation, null);
            saveHistoryModel(historyDoc, this.collection.name, next);
        }
    });

    function createHistoryDoc(data, operation, trackingField) {
        if (data) data.__v = undefined;

        let historyDoc = {};
        historyDoc["timestamp"] = new Date();
        historyDoc["operation"] = operation;
        historyDoc["trackingField"] = trackingField;
        historyDoc["data"] = data ? normalizeObject(data) : null;

        return historyDoc;
    }

    function saveHistoryModel(historyDoc, collectionName, next) {
        let history = historySchemas[hm.historyCollectionName(collectionName)];
        if (!history) next();

        history.insertMany(historyDoc, next);
    }

    function normalizeObject(object) {
        const normalizedObject = {};
        Object.keys(object).forEach(key => {
            const normalizedKey = key.replace("$", "");
            normalizedObject[normalizedKey] = object[key];
        });

        return normalizedObject;
    }

    function getTrackByField(field) {
        let trackByField = null;
        Object.keys(trackingFields).forEach(key => {
            if (trackingFields[key].indexOf(field) > -1) trackByField = key;
            if (key === field) trackByField = key;
        });
        return trackByField;
    }

    function createDiffDoc(oldDoc, newDoc) {
        let historyDocs = {};
        let diff = {};
        diff["_id"] = oldDoc["_id"];
        Object.keys(newDoc).forEach(key => {
            const trackByField = getTrackByField(key);
            if (trackByField && trackingFields[trackByField].length) {
                if (
                    JSON.stringify(oldDoc[key]) !==
                        JSON.stringify(newDoc[key]) ||
                    key === trackByField
                ) {
                    if (!historyDocs[trackByField])
                        historyDocs[trackByField] = {};
                    historyDocs[trackByField][key] = newDoc[key];
                }
            }
        });
        const diffDocs = Object.keys(historyDocs).map(key => {
            return createHistoryDoc(
                historyDocs[key],
                "update",
                historyDocs[key][key]
            );
        });
        return diffDocs;
    }
};
