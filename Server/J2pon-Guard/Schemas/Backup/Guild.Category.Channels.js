const mongoose = require('mongoose');

const channel = mongoose.model("Category", mongoose.Schema({
    guildID: String,
    channelID: String,
    name: String,
    position: Number,
    overwrites: Array,
    snapshotKey: String,
}));

module.exports = channel;