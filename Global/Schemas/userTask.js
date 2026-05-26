const { model, Schema } = require('mongoose')

module.exports = model('userTasks', 
    new Schema({
        userId: { type: String, required: true },
        roleId: { type: String, required: true },
        startDate: { type: Number, default: Date.now() },
        selectedTask: { type: String, default: "" }, // Seçilen görev tipi
        staffStartDate: { type: Number, default: null }, // Yetkiliye ilk giriş tarihi
        counts: {
            message: { type: Number, default: 0, min: 0 },
            voice: { type: Number, default: 0, min: 0 },
            register: { type: Number, default: 0, min: 0 },
            invite: { type: Number, default: 0, min: 0 },
            staff: { type: Number, default: 0, min: 0 },
            yetkili: { type: Number, default: 0, min: 0 },
            tagli: { type: Number, default: 0, min: 0 },
            stream: { type: Number, default: 0, min: 0 },
            oryantasyon: { type: Number, default: 0, min: 0 },
        },
        completeds: {
            message: { type: Boolean, default: false },
            voice: { type: Boolean, default: false },
            register: { type: Boolean, default: false },
            invite: { type: Boolean, default: false },
            staff: { type: Boolean, default: false },
            yetkili: { type: Boolean, default: false },
            tagli: { type: Boolean, default: false },
            stream: { type: Boolean, default: false },
            oryantasyon: { type: Boolean, default: false },
        }
    }, {
        timestamps: true
    })
)