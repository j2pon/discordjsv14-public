const { Schema, model } = require("mongoose");

const schema = new Schema({
    guildID: { type: String, required: true, index: true },
    channelID: { type: String, required: true },
    messageID: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    authorID: { type: String, required: true },
    authorNickname: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ guildID: 1, messageID: 1 });
module.exports = model("itirafMessages", schema);
