const { Schema, model } = require("mongoose");

const schema = new Schema({
    guildID: { type: String, required: true, unique: true },
    activeChannelID: { type: String, default: null },
    positionBeforeUp: { type: Number, default: null },
}, { timestamps: true });

module.exports = model("etkinlikState", schema);
