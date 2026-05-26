const { Schema, model } = require("mongoose");

const schema = new Schema({
    guildID: { type: String, required: true, index: true },
    channelID: { type: String, required: true, unique: true },
    userID: { type: String, required: true },
    ownedAt: { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ guildID: 1, channelID: 1 });
module.exports = model("streamerRoomOwner", schema);
