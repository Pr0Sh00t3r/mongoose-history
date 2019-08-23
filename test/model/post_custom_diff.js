const mongoose = require("mongoose");

const {Schema} = mongoose;
const history = require("../../lib/mongoose-history");

const PostSchema = new Schema({
    updatedFor: String,
    title: String,
    tags: [],
    message: String
});

const sortIfArray = function(a) {
    if (Array.isArray(a)) {
        return a.sort();
    }
    return a;
};

const options = {
    diffOnly: true,
    customDiffAlgo(key, newValue, oldValue) {
        const v1 = sortIfArray(oldValue);
        const v2 = sortIfArray(newValue);
        if (String(v1) !== String(v2)) {
            return {
                diff: newValue
            };
        }
        // no diff should be recorded for this key
        return null;
    }
};

PostSchema.plugin(history, options);
module.exports = mongoose.model("Post_custom_diff", PostSchema);
