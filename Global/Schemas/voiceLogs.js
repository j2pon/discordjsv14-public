const mongoose = require("mongoose");

const voiceLogSchema = mongoose.Schema({
    guildID: String,
    userID: String,
    channelID: String,
    type: String, // "JOIN", "LEAVE", "MOVE", "MUTE", "UNMUTE", "DEAF", "UNDEAF", "STREAM-START", "STREAM-STOP", "CAMERA-START", "CAMERA-STOP"
    oldChannelID: String,
    date: { type: Number, default: Date.now }
});

module.exports = mongoose.model("voiceLogs", voiceLogSchema);
