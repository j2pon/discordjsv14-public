const mongoose = require('mongoose');

const VoiceChannels = mongoose.model("Voice", mongoose.Schema({
    guildID: String,
    channelID: String,
    name: String,
    bitrate: Number,
    parentID: String,
    position: Number,
    userLimit: Number,
    overwrites: Array,
    snapshotKey: String,
}));

module.exports = VoiceChannels;