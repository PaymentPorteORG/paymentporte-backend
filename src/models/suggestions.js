
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
 
const SeggestionSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true, auto: true, },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    subject : {type: String},
    message : {type : String},
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true }  
});

let SeggestionModel =  mongoose.model('Suggestions',SeggestionSchema)
module.exports = SeggestionModel