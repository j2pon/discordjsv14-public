const { EmbedBuilder } = require("discord.js");
const guard = require("../../../../../J2pon-Guard/Schemas/Guard");
const system = require("../../../../../../Global/Settings/System");
const setup = require("../../../../../../Global/Settings/Setup.json");
const emojis = require("../../../../../../Global/Settings/Emojis.json");
const penals = require("../../../../../../Global/Schemas/penals");

module.exports = {
    name: "limitsıfırla",
    description: "Kullanıcının limitlerini ve cezasını sıfırlar",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["limit-sıfırla", "limitreset", "limitsifirla"],
        usage: ".limitsıfırla [@kullanıcı/kullanıcıID]",
    },

    onLoad: function (client) {},

    onCommand: async function (client, message, args, byj2ponembed) {
        if (!system.BotsOwners.includes(message.author.id)) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ 
                content: `${emojis.server_carpi} Bu komutu sadece bot sahipleri kullanabilir!` 
            }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        if (!args[0]) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ 
                content: `${emojis.server_carpi} Lütfen bir kullanıcı belirtin!\n${emojis.server_info} Kullanım: \`.limitsıfırla @kullanıcı\`` 
            }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        const user = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
        if (!user) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ 
                content: `${emojis.server_carpi} Geçerli bir kullanıcı bulunamadı!` 
            }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        const member = await message.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ 
                content: `${emojis.server_carpi} Bu kullanıcı sunucuda bulunamadı!` 
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
            const limitedUserIndex = guardData.limitedWhitelistMembers?.findIndex(x => x.userId === user.id);
            if (limitedUserIndex === -1 || limitedUserIndex === undefined) {
                message.react(`${client.emoji("server_carpi")}`);
                return message.reply({ 
                    content: `${emojis.server_carpi} Bu kullanıcı limitli whitelist'te bulunamadı!` 
                }).then((e) => setTimeout(() => { e.delete(); }, 5000));
            }

            // Limitleri sıfırla
            const limitedUser = guardData.limitedWhitelistMembers[limitedUserIndex];
            if (limitedUser.limits) {
                // Tüm limitlerin used değerlerini sıfırla ve resetAt'ı sıfırla
                Object.keys(limitedUser.limits).forEach(actionType => {
                    if (limitedUser.limits[actionType]) {
                        limitedUser.limits[actionType].used = 0;
                        limitedUser.limits[actionType].resetAt = 0;
                    }
                });
            }
            await guardData.save();

            // Jail cezasını temizle
            const jailPenal = await penals.findOne({ 
                userID: user.id, 
                guildID: message.guild.id, 
                type: "Jail", 
                active: true 
            });

            if (jailPenal) {
                jailPenal.active = false;
                await jailPenal.save();
            }

            // Jail rollerini kaldır
            if (member.manageable) {
                // Booster varsa onu koru
                if (member.roles.cache.has(setup.BoosterRole)) {
                    await member.roles.set([setup.BoosterRole, ...setup.UnRegisteredRoles]).catch(() => {});
                } else {
                    await member.roles.set(setup.UnRegisteredRoles).catch(() => {});
                }
            }

            // Kullanıcıya DM gönder
            try {
                await user.send({
                    content: `${emojis.server_onay} **${message.guild.name}** sunucusunda, limitleriniz ve jail cezanız **${message.author.tag}** tarafından sıfırlandı!`
                });
            } catch (e) {}

            // Başarı mesajı
            message.react(`${client.emoji("server_onay")}`);
            const successEmbed = new EmbedBuilder()
                .setColor("Green")
                .setAuthor({ 
                    name: message.author.tag, 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                })
                .setDescription(`
                    ${emojis.server_onay} **Limit ve Ceza Sıfırlama Başarılı!**
                    
                    ${emojis.server_info} **Kullanıcı:** ${user.toString()} (\`${user.tag}\`)
                    ${emojis.server_info} **İşlemler:**
                    ${emojis.server_ok} Tüm limitler sıfırlandı
                    ${emojis.server_ok} Jail cezası temizlendi
                    ${emojis.server_ok} Jail rolleri kaldırıldı
                `)
                .setTimestamp();

            await message.reply({ embeds: [successEmbed] });

            // Log kanalına bildir
            const logChannel = message.guild.channels.cache.find(x => x.name === "jail_log");
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor("Green")
                    .setAuthor({ 
                        name: user.tag, 
                        iconURL: user.displayAvatarURL({ dynamic: true }) 
                    })
                    .setDescription(`
                        ${emojis.server_onay} **${user.tag}** adlı kullanıcının limitleri ve jail cezası **${message.author.tag}** tarafından sıfırlandı.
                    `)
                    .addFields(
                        { name: "Kullanıcı", value: `${user.toString()}`, inline: true },
                        { name: "İşlemi Yapan", value: `${message.author.toString()}`, inline: true },
                        { name: "Tarih", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                    )
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }

        } catch (error) {
            console.error('Limit sıfırlama hatası:', error);
            message.react(`${client.emoji("server_carpi")}`);
            return message.reply({ 
                content: `${emojis.server_carpi} İşlem sırasında bir hata oluştu: \`${error.message}\`` 
            }).then((e) => setTimeout(() => { e.delete(); }, 10000));
        }
    },
};

