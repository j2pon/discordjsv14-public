const { Schema, model } = require("mongoose");

const schema = new Schema({
    guildID: { type: String, required: true, index: true },
    channelID: { type: String, required: true, index: true },
    userID: { type: String, required: true },
}, { timestamps: true });

schema.index({ channelID: 1, userID: 1 }, { unique: true });
module.exports = model("streamerRoomStreamPerms", schema);
