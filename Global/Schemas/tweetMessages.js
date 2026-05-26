const { Schema, model } = require("mongoose");

const schema = new Schema({
    guildID: { type: String, required: true, index: true },
    channelID: { type: String, required: true },
    messageID: { type: String, required: true, unique: true },
    authorID: { type: String, required: true },
    authorName: { type: String, required: true },
    authorHandle: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    theme: { type: String, required: true, enum: ["dark", "light"], default: "dark" },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ guildID: 1, messageID: 1 });
module.exports = model("tweetMessages", schema);
