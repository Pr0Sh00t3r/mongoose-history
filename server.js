const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
const {Schema} = mongoose;
const auditPlugin = require("./lib/mongoose-history");

const DB_URL = "mongodb://127.0.0.1/mongoose-audit";
const mongooseOptions = {
    useFindAndModify: false,
    useCreateIndex: true,
    useNewUrlParser: true
};

const connection = mongoose.createConnection(DB_URL, mongooseOptions);

mongoose.connect(DB_URL, mongooseOptions);
mongoose.connection.on("open", () => {
    start();
});

async function start() {
    const ASchema = new Schema({
        id: Number,
        val: String
    });
    const AModel = connection.model("ASchema", ASchema);
    await AModel.create({val: "hello"});

    const salarySchema = new Schema({
        Name: {type: String, trackBy: "EffectiveDate1"},
        Amount: {type: Number, trackBy: "EffectiveDate2"},
        EffectiveDate1: Date,
        EffectiveDate2: Date
    });
    const options = {
        collectionName: "salary"
    };
    salarySchema.plugin(auditPlugin, options);
    const salaryModel = connection.model("Salary", salarySchema, "salary");
    const objectId1 = mongoose.Types.ObjectId();
    const objectId2 = mongoose.Types.ObjectId();
    await salaryModel.create({
        _id: objectId1,
        Name: "Ram Prasad",
        Amount: 1000
    });
    await salaryModel.create({_id: objectId2, Name: "Pavithra", Amount: 1000});

    const doc = await salaryModel.findById(objectId1);
    doc.Amount = 2000;
    doc.Name = "Ram";
    doc.EffectiveDate1 = new Date();
    doc.EffectiveDate2 = new Date();
    await doc.save();
    // await salaryModel.deleteOne({_id: objectId1});
    // await salaryModel.findOneAndUpdate({Name: "Pavithra"}, {Amount: 500});
    // await Promise.all(
    //     [1, 2, 3].map(() =>
    //         salaryModel.findOneAndUpdate(
    //             {Name: "Pavithra"},
    //             {$inc: {Amount: 10}}
    //         )
    //     )
    // );

    await mongoose.connection.db.dropDatabase();
}
