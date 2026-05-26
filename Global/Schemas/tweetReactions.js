const { Schema, model } = require("mongoose");

const schema = new Schema({
    messageID: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ["like", "dislike"] },
}, { timestamps: true });

schema.index({ messageID: 1, userID: 1 }, { unique: true });
module.exports = model("tweetReactions", schema);
