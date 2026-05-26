const mongoose = require("mongoose");

const DeletedRoles = mongoose.model("DeletedRoleBackup", mongoose.Schema({
  guildID: String,
  roleID: String,
  name: String,
  color: String,
  hoist: Boolean,
  position: Number,
  permissions: String,
  mentionable: Boolean,
  members: Array,
  channelOverwrites: Array,
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

module.exports = DeletedRoles;

