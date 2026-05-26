const mongoose = require("mongoose");

const DeletedChannels = mongoose.model("DeletedChannelBackup", mongoose.Schema({
  guildID: String,
  channelID: String,
  type: Number,
  name: String,
  topic: String,
  nsfw: Boolean,
  parentID: String,
  position: Number,
  rateLimit: Number,
  bitrate: Number,
  userLimit: Number,
  overwrites: Array,
  deletedBy: String,
  deletedAt: {
    type: Number,
    default: () => Date.now(),
  },
  restored: {
    type: Boolean,
    default: false,
  },
}));

module.exports = DeletedChannels;

