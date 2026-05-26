const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const guard = require("../../../../../J2pon-Guard/Schemas/Guard");
const system = require("../../../../../../Global/Settings/System");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

module.exports = {
    name: "twlkaldır",
    description: "Kullanıcıyı limitli whitelist'ten çıkarır",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["twlkaldir", "limitli-whitelist-kaldır", "limitliwhitelistkaldir"],
        usage: ".twlkaldır [@kullanıcı/kullanıcıID]",
    },

    onLoad: function (client) {},

    onCommand: async function (client, message, args, byj2ponembed) {
        // Yetki kontrolü - Administrator veya Safe komutunu kullanabilenler
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            // Safe komutunu kullanabilenler kontrolü
            const guardData = await guard.findOne({ guildID: message.guild.id });
            const fullWhitelist = guardData ? guardData.SafedMembers : system.BotsOwners;
            
            if (!fullWhitelist.includes(message.author.id) && !system.BotsOwners.includes(message.author.id)) {
                message.react(`${client.emoji("server_carpi")}`);
                return message.reply({ 
                    content: `${emojis.server_carpi} Bu komutu kullanmak için yeterli yetkiniz yok!` 
                }).then((e) => setTimeout(() => { e.delete(); }, 5000));
            }
        }

        if (!args[0]) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ 
                content: `${emojis.server_carpi} Lütfen bir kullanıcı belirtin!\n${emojis.server_info} Kullanım: \`.twlkaldır @kullanıcı\`` 
            }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ 
                content: `${emojis.server_carpi} Geçerli bir kullanıcı bulunamadı!` 
            }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        try {
            // Guard verisini al
            const guardData = await guard.findOne({ guildID: message.guild.id });
            if (!guardData) {
                message.react(`${client.emoji("server_carpi")}`);
                return message.reply({ 
                    content: `${emojis.server_carpi} Guard verisi bulunamadı!` 
                }).then((e) => setTimeout(() => { e.delete(); }, 5000));
            }

            // Limitli whitelist'te var mı kontrol et
            const limitedUser = guardData.limitedWhitelistMembers?.find(x => x.userId === user.id);
            if (!limitedUser) {
                message.react(`${client.emoji("server_carpi")}`);
                return message.reply({ 
                    content: `${emojis.server_carpi} Bu kullanıcı limitli whitelist'te bulunamadı!` 
                }).then((e) => setTimeout(() => { e.delete(); }, 5000));
            }

            // Kullanıcıyı listeden çıkar
            await guard.findOneAndUpdate(
                { guildID: message.guild.id },
                { $pull: { limitedWhitelistMembers: { userId: user.id } } },
                { upsert: true }
            );

            // Başarı mesajı
            message.react(`${client.emoji("server_onay")}`);
            const successEmbed = new EmbedBuilder()
                .setColor("Green")
                .setAuthor({ 
                    name: message.author.tag, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`
                    ${emojis.server_onay} **Limitli Whitelist'ten Çıkarma Başarılı!**
                    
                    ${emojis.server_info} **Kullanıcı:** ${user.toString()} (\`${user.tag}\`)
                    ${emojis.server_info} **İşlemi Yapan:** ${message.author.toString()}
                    
                    ${emojis.server_ok} Kullanıcı limitli whitelist'ten çıkarıldı.
                `)
                .setTimestamp();

            await message.reply({ embeds: [successEmbed] });

            // Kullanıcıya DM gönder
            try {
                await user.send({
                    content: `${emojis.server_info} **${message.guild.name}** sunucusunda, limitli whitelist'ten **${message.author.tag}** tarafından çıkarıldınız.`
                });
            } catch (e) {}

        } catch (error) {
            console.error('TWL kaldırma hatası:', error);
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ 
                content: `${emojis.server_carpi} İşlem sırasında bir hata oluştu: \`${error.message}\`` 
            }).then((e) => setTimeout(() => { e.delete(); }, 10000));
        }
    },
};

