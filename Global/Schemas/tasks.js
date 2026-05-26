const { model, Schema } = require('mongoose')

module.exports = model('tasks', 
    new Schema({
        guildId: { type: String, required: true },
        currentRole: { type: String, required: true },
        endOfMissionRole: { type: String, required: true },
        requiredCounts: {
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
        duration: { type: Number, default: 7 },
    }, {
        timestamps: true
    })
)