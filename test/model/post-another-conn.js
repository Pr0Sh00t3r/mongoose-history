const mongoose = require("mongoose");

const {Schema} = mongoose;
const history = require("../../lib/mongoose-history");

const secondConnectionUri =
    process.env.SECONDARY_CONNECTION_URI ||
    "mongodb://localhost/mongoose-history-test-second";
const secondConn = mongoose.createConnection(secondConnectionUri);

const PostSchema = new Schema({
    updatedFor: String,
    title: String,
    message: String
});

PostSchema.plugin(history, {
    historyConnection: secondConn,
    customCollectionName: "posts_another_conn_history"
});

module.exports = mongoose.model("PostAnotherConn", PostSchema);
