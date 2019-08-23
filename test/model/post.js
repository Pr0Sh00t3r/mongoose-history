const mongoose = require("mongoose");

const {Schema} = mongoose;
const history = require("../../lib/mongoose-history");

const PostSchema = new Schema({
    updatedFor: String,
    title: String,
    message: String
});
PostSchema.plugin(history);

module.exports = mongoose.model("Post", PostSchema);
