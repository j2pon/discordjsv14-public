const { Schema, model } = require("mongoose");

const schema = new Schema({
    userID: { type: String, required: true, index: true },
    guildID: { type: String, required: true, index: true },
    theme: { type: String, required: true, enum: ["dark", "light"], default: "dark" },
}, { timestamps: true });

schema.index({ userID: 1, guildID: 1 }, { unique: true });
module.exports = model("tweetThemes", schema);
