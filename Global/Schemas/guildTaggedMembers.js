const { Schema, model } = require("mongoose");

const schema = new Schema({
    guildID: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },
    updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

schema.index({ guildID: 1, userID: 1 }, { unique: true });

module.exports = model("guildTaggedMembers", schema);
