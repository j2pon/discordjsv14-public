const { Schema, model } = require("mongoose");
const Guild = require("../../../Global/Settings/System");

const schema = Schema({
    guildID: { type: String, required: true },
    database: { type: Boolean, default: false },
    serverGuard: { type: Boolean, default: false },
    rolesGuard: { type: Boolean, default: false },
    channelsGuard: { type: Boolean, default: false },
    banKickGuard: { type: Boolean, default: false },
    emojiStickersGuard: { type: Boolean, default: false },
    UrlSpammer: { type: Boolean, default: false },
    webAndofflineGuard: { type: Boolean, default: false },
    chatGuards: { type: Boolean, default: false },
    // Chat Guard alt ayarları (panelden yönetilir)
    chatGuardSettings: {
        type: Object,
        default: {
            reklam: Guild?.Security?.ReklamEngel ?? true,
            kufur: Guild?.Security?.KufurEngel ?? true,
            spam: Guild?.Security?.SpamEngel ?? true,
            caps: Guild?.Security?.CapsEngel ?? false,
        },
    },
    SafedMembers: { type: Array, default: Guild.BotsOwners },
    serverSafedMembers: { type: Array, default: Guild.BotsOwners },
    roleSafedMembers: { type: Array, default: Guild.BotsOwners },
    channelSafedMembers: { type: Array, default: Guild.BotsOwners },
    banKickSafedMembers: { type: Array, default: Guild.BotsOwners },
    emojiStickers: { type: Array, default: Guild.BotsOwners },
    chatGuard: { type: Array, default: Guild.BotsOwners },
    // Limitli Whitelist: Sağ tık işlemler için limitli yetki (her işlem tipi için ayrı limit ve süre)
    limitedWhitelistMembers: { 
        type: [{
            userId: { type: String, required: true },
            limits: {
                ban: { 
                    limit: { type: Number, default: 10 }, 
                    used: { type: Number, default: 0 },
                    resetAt: { type: Number, default: 0 } // 3 saat sonra reset
                },
                kick: { 
                    limit: { type: Number, default: 10 }, 
                    used: { type: Number, default: 0 },
                    resetAt: { type: Number, default: 0 } // 3 saat sonra reset
                },
                timeout: { 
                    limit: { type: Number, default: 10 }, 
                    used: { type: Number, default: 0 },
                    resetAt: { type: Number, default: 0 } // 1 saat sonra reset
                },
                role_add: { 
                    limit: { type: Number, default: 10 }, 
                    used: { type: Number, default: 0 },
                    resetAt: { type: Number, default: 0 } // 1 saat sonra reset
                },
                role_remove: { 
                    limit: { type: Number, default: 10 }, 
                    used: { type: Number, default: 0 },
                    resetAt: { type: Number, default: 0 } // 1 saat sonra reset
                }
            }
        }], 
        default: [] 
    },
}, {
    timestamps: true
});

module.exports = model("Guard", schema);
