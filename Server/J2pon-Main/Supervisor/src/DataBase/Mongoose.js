const mongoose = require("mongoose");
const { log, success, error, debug } = require("../../../../../Global/Helpers/Logger");
const System = require("../../../../../Global/Settings/System");

mongoose.connect(System.MongoURL, { 
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
}).catch((err) => {
    // connect() Promise reject -> unhandledRejection olmasın
    console.error("Database bağlantısı kurulamadı:", err?.message || err);
});

mongoose.connection.on("connected", () => {
    debug("Database bağlantısı tamamlandı!");
});
mongoose.connection.on("error", (err) => {
    console.error("Database bağlantısı kurulamadı:", err.message);
});
mongoose.connection.on("disconnected", () => {
    debug("Database bağlantısı kesildi!");
});