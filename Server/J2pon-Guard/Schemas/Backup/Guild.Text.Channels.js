const mongoose = require('mongoose');

const TextChannels = mongoose.model("Text", mongoose.Schema({
    guildID: String,
    channelID: String,
    name: String,
    nsfw: Boolean,
    parentID: String,
    position: Number,
    rateLimit: Number,
    overwrites: Array,
    snapshotKey: String,
}));

module.exports = TextChannels;