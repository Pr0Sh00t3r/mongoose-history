const mongoose = require("mongoose");

const {Schema} = mongoose;
const history = require("../../lib/mongoose-history");

const PostSchema = new Schema({
    updatedFor: String,
    title: String,
    message: String
});

PostSchema.plugin(history, {
    indexes: [{timestamp: 1, "data._id": 1}],
    customCollectionName: "posts_idx_history"
});

module.exports = mongoose.model("PostWithIdx", PostSchema);
