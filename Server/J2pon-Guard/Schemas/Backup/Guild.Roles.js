const mongoose = require('mongoose');

const Roles = mongoose.model("Role", mongoose.Schema({
  guildID: String,
  roleID: String,
  name: String,
  color: String,
  hoist: Boolean,
  position: Number,
  permissions: String,
  mentionable: Boolean,
  date: Number,
  members: Array,
  channelOverwrites: Array,
  snapshotKey: String,
}));

module.exports = Roles;