const mongoose = require("mongoose");

const BackupLogSchema = new mongoose.Schema({
  guildID: String,
  snapshotKey: String,
  type: {
    type: String,
    enum: ["manual", "auto"],
    default: "manual",
  },
  source: String, // örn: "backupal", "clientReady", "24h-interval"
  createdBy: String, // manuel yedeklerde komutu kullanan kişi
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BackupLogs", BackupLogSchema);

