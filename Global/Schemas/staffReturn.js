const mongoose = require("mongoose");

const staffReturnSchema = mongoose.Schema({
    guildID: String,
    leftUserID: String, // Tagı bırakan kullanıcı
    interestedUserID: String, // İlgilenen yetkili
    date: { type: Number, default: Date.now },
    completed: { type: Boolean, default: false } // Tagı geri alınca true olacak
});

module.exports = mongoose.model("staffReturn", staffReturnSchema);
