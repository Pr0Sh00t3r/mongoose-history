const mongoose = require("mongoose");

const historyModels = {};

/**
 * Create and cache a history mongoose model
 * @param {string} collectionName Name of history collection
 * @return {mongoose.Model} History Model
 */
module.exports.HistoryModel = function(collectionName, options) {
    const historyConnection = options && options.historyConnection;

    let schemaObject = {
        timestamp: {type: Date, required: true, index: true},
        operation: {type: String, required: true, index: true},
        data: {type: mongoose.Schema.Types.Mixed, required: true},
        trackingField: {type: Date, required: false, index: true}
    };
    if (!(collectionName in historyModels)) {
        let schema = new mongoose.Schema(schemaObject, {
            id: true,
            versionKey: false
        });

        if (historyConnection) {
            historyModels[collectionName] = historyConnection.model(
                collectionName,
                schema,
                collectionName
            );
        } else {
            historyModels[collectionName] = mongoose.model(
                collectionName,
                schema,
                collectionName
            );
        }
    }

    return historyModels[collectionName];
};

/**
 * Set name of history collection
 * @param {string} collectionName history collection name
 * @param {string} customCollectionName history collection name defined by user
 * @return {string} Collection name of history
 */
module.exports.historyCollectionName = function(collectionName) {
    return `${collectionName}_history`;
};
