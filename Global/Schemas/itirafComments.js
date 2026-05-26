const { Schema, model } = require("mongoose");

const schema = new Schema({
    messageID: { type: String, required: true, index: true },
    userID: { type: String, required: true },
    userTag: { type: String, default: "" },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = model("itirafComments", schema);
