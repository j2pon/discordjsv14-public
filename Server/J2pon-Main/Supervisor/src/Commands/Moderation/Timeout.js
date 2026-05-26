const {
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require("discord.js");
const ceza = require("../../../../../../Global/Schemas/ceza");
const cezapuan = require("../../../../../../Global/Schemas/cezapuan");
const moment = require("moment");
const ms = require("ms");
const j2ponm = require("../../../../../../Global/Settings/Setup.json");
const j2poncik = require("../../../../../../Global/Settings/System");
const kanal = require("../../../../../../Global/Settings/AyarName");
const emojis = require("../../../../../../Global/Settings/Emojis.json");

moment.locale("tr");

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000; // 28 gün Discord limiti

module.exports = {
    name: "timeout",
    description: "Belirttiğiniz kullanıcıyı süreli olarak timeout (susturma) cezası verir.",
    category: "STAFF",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["sustur", "tmute"],
        usage: ".timeout <@user/ID> [süre] [sebep] | .timeout kaldır <@user/ID>",
    },

    onLoad: function (client) {},

    onCommand: async function (client, message, args) {
        const kanallar = kanal.KomutKullanımKanalİsim || [];
        const canUseHere =
            message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
            (kanal.isAllowedCommandChannel
                ? kanal.isAllowedCommandChannel(message.channel.name)
                : kanallar.includes(message.channel.name));
        if (!canUseHere) {
            const allowedText = kanal.formatAllowedChannels
                ? kanal.formatAllowedChannels(client)
                : kanallar
                      .map((x) => {
                          const found = client.channels.cache.find(
                              (chan) => chan.name && chan.name === x
                          );
                          return found ? `${found}` : `\`${x}\``;
                      })
                      .join(", ");
            return message
                .reply({
                    content: `${emojis.server_carpi} ${allowedText} kanallarında kullanabilirsiniz.`,
                })
                .then((e) => setTimeout(() => { e.delete(); }, 10000));
        }

        const hasTimeoutPerm =
            message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers) ||
            message.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!hasTimeoutPerm) {
            message.react(emojis.server_carpi);
            return message.channel
                .send({
                    content: `${emojis.server_carpi} **Yeterli yetkin bulunmuyor!** (Üye susturma / Administrator gerekli)`,
                })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        // .timeout kaldır @user
        if (args[0] && args[0].toLowerCase() === "kaldır") {
            const target = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
            if (!target) {
                message.react(emojis.server_carpi);
                return message.channel
                    .send({ content: `${emojis.server_carpi} **Bir üye belirtmelisin!** Kullanım: \`.timeout kaldır @user\`` })
                    .then((e) => setTimeout(() => { e.delete(); }, 5000));
            }
            if (!target.communicationDisabledUntil || target.communicationDisabledUntilTimestamp <= Date.now()) {
                message.react(emojis.server_carpi);
                return message.channel
                    .send({ content: `${emojis.server_carpi} **Bu üye zaten timeout'ta değil!**` })
                    .then((e) => setTimeout(() => { e.delete(); }, 5000));
            }
            if (message.member.roles.highest.position <= target.roles.highest.position && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                message.react(emojis.server_carpi);
                return message.channel
                    .send({ content: `${emojis.server_carpi} **Kendinle aynı yetkide ya da daha yetkili birinin timeout'unu kaldıramazsın!**` })
                    .then((e) => setTimeout(() => { e.delete(); }, 5000));
            }
            if (!target.moderatable) {
                message.react(emojis.server_carpi);
                return message.channel
                    .send({ content: `${emojis.server_carpi} **Bu üyenin timeout'unu kaldıramıyorum!**` })
                    .then((e) => setTimeout(() => { e.delete(); }, 5000));
            }
            try {
                await target.timeout(null, `${message.author.tag} tarafından kaldırıldı`);
                message.react(emojis.server_onay);
                await message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`${emojis.server_onay} ${target.toString()} kullanıcısının **timeout** cezası ${message.author.toString()} tarafından kaldırıldı.`)
                            .setColor(0x57f287),
                    ],
                });
                const logChannel = client.channels.cache.find((x) => x.name === "timeout_log");
                if (logChannel) {
                    const log = new EmbedBuilder()
                        .setDescription(
                            `${emojis.server_info} **${target.user.tag}** adlı kullanıcının timeout'u **${message.author.tag}** tarafından kaldırıldı.`
                        )
                        .addFields(
                            { name: "Üye", value: target.toString(), inline: true },
                            { name: "Kaldıran", value: message.author.toString(), inline: true }
                        )
                        .setFooter({ text: moment(Date.now()).format("LLL") })
                        .setTimestamp();
                    await logChannel.send({ embeds: [log] });
                }
            } catch (err) {
                message.react(emojis.server_carpi);
                message.channel
                    .send({ content: `${emojis.server_carpi} **Timeout kaldırılırken hata:** ${err.message}` })
                    .then((e) => setTimeout(() => { e.delete(); }, 7000));
            }
            return;
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            message.react(emojis.server_carpi);
            return message.channel
                .send({ content: `${emojis.server_carpi} **Bir üye belirtmelisin!** Kullanım: \`.timeout @user [süre] [sebep]\`` })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }
        if (message.member.roles.highest.position <= member.roles.highest.position && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            message.react(emojis.server_carpi);
            return message.channel
                .send({ content: `${emojis.server_carpi} **Kendinle aynı yetkide ya da daha yetkili birini timeout'layamazsın!**` })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }
        if (!member.moderatable) {
            message.react(emojis.server_carpi);
            return message.channel
                .send({ content: `${emojis.server_carpi} **Bu üyeyi timeout'layamıyorum!**` })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        const logChannel = client.channels.cache.find((x) => x.name === "timeout_log");
        const punishmentLogChannel = client.channels.cache.find((x) => x.name === "cezapuan-log");
        if (!logChannel) console.error("[Timeout] timeout_log kanalı bulunamadı. AyarName logs'a ekleyin.");

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("timeout_menu")
                .setPlaceholder("Timeout ceza sebepleri")
                .addOptions([
                    { label: "Kışkırtma, Trol ve Dalgacı Davranış", description: "5 Dakika", value: "timeout_5m", emoji: emojis.server_carpi },
                    { label: "Flood, Spam ve Rahatsız Edici Davranış", description: "10 Dakika", value: "timeout_10m", emoji: emojis.server_carpi },
                    { label: "Küfür, Argo ve Hakaret", description: "1 Saat", value: "timeout_1h", emoji: emojis.server_carpi },
                    { label: "Sunucu kurallarına uyumsuzluk", description: "6 Saat", value: "timeout_6h", emoji: emojis.server_carpi },
                    { label: "Tekrarlayan ihlaller", description: "1 Gün", value: "timeout_1d", emoji: emojis.server_carpi },
                    { label: "Ağır ihlal", description: "3 Gün", value: "timeout_3d", emoji: emojis.server_carpi },
                    { label: "Ciddi ihlal", description: "1 Hafta", value: "timeout_1w", emoji: emojis.server_carpi },
                ])
        );

        const duration = args[1] ? ms(args[1]) : undefined;
        const reason = duration ? (args.slice(2).join(" ") || "Belirtilmedi!") : null;

        async function applyTimeout(durationMs, reasonText) {
            if (durationMs <= 0 || durationMs > MAX_TIMEOUT_MS) {
                message.react(emojis.server_carpi);
                return message.channel
                    .send({
                        content: `${emojis.server_carpi} **Geçersiz süre!** En fazla **28 gün** timeout verilebilir. Örnek: \`5m\`, \`1h\`, \`1d\`, \`7d\``,
                    })
                    .then((e) => setTimeout(() => { e.delete(); }, 7000));
            }
            try {
                await ceza.findOneAndUpdate(
                    { guildID: message.guild.id, userID: member.user.id },
                    { $push: { ceza: 1 }, $inc: { top: 1 } },
                    { upsert: true }
                );
                // Yetkili tarafı verilen timeout sayısı (ceza şemasında TimeoutAmount yoksa isteğe bağlı eklenebilir)
                await cezapuan.findOneAndUpdate(
                    { guildID: message.guild.id, userID: member.user.id },
                    { $inc: { cezapuan: 5 } },
                    { upsert: true }
                );
                const cezapuanData = await cezapuan.findOne({ guildID: message.guild.id, userID: member.user.id });
                if (punishmentLogChannel) {
                    punishmentLogChannel.send({
                        content: `${emojis.server_info} ${member} üyesi \`timeout cezası\` alarak toplam \`${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanına\` ulaştı!`,
                    });
                }
                await member.timeout(durationMs, reasonText);
                const penal = await client.penalize(
                    message.guild.id,
                    member.id,
                    "Timeout",
                    true,
                    message.author.id,
                    reasonText,
                    true,
                    Math.floor(Date.now() + durationMs)
                );
                message.react(emojis.server_onay);
                await message.channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `${emojis.server_onay} ${member.toString()} kullanıcısı **"${reasonText}"** sebebiyle <t:${Math.floor((Date.now() + durationMs) / 1000)}:R> süre boyunca **timeout** cezası aldı. (Ceza Numarası: \`#${penal.id}\`)`
                            )
                            .setColor(0x57f287),
                    ],
                });
                if (j2poncik.Mainframe.dmMessages) {
                    member
                        .send({
                            content: `${emojis.server_info} **${message.guild.name}** sunucusunda, **${message.author.tag}** tarafından, **${reasonText}** sebebiyle <t:${Math.floor((Date.now() + durationMs) / 1000)}:R>'ya kadar **timeout** (üye susturma) cezası aldınız.`,
                        })
                        .catch(() => {});
                }
                if (logChannel) {
                    const log = new EmbedBuilder()
                        .setDescription(
                            `${emojis.server_info} **${member.user.tag}** adlı kullanıcıya **${message.author.tag}** tarafından Timeout atıldı.`
                        )
                        .addFields(
                            { name: "Cezalandırılan", value: member.toString(), inline: true },
                            { name: "Cezalandıran", value: message.author.toString(), inline: true },
                            { name: "Ceza Bitiş", value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>`, inline: true },
                            { name: "Ceza Sebebi", value: `\`\`\`fix\n${reasonText}\n\`\`\``, inline: false }
                        )
                        .setFooter({ text: `${moment(Date.now()).format("LLL")} (Ceza ID: #${penal.id})` })
                        .setTimestamp();
                    await logChannel.send({ embeds: [log] });
                }
            } catch (err) {
                message.react(emojis.server_carpi);
                message.channel
                    .send({
                        content: `${emojis.server_carpi} **Timeout uygulanamadı:** ${err.message}`,
                    })
                    .then((e) => setTimeout(() => { e.delete(); }, 7000));
            }
        }

        if (duration && reason) {
            const clamped = Math.min(Math.max(duration, 1000), MAX_TIMEOUT_MS);
            await applyTimeout(clamped, reason);
            return;
        }

        if (duration && !reason) {
            const clamped = Math.min(Math.max(duration, 1000), MAX_TIMEOUT_MS);
            await applyTimeout(clamped, "Belirtilmedi!");
            return;
        }

        const msg = await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
                    .setDescription(
                        `${emojis.server_info} Aşağıdaki menüden ${member.toString()} kullanıcısı için **timeout** ceza sebebini ve süresini seçin.`
                    )
                    .setColor(0x5865f2),
            ],
            components: [row],
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

        const menuMap = {
            timeout_5m: { ms: ms("5m"), reason: "Kışkırtma, Trol ve Dalgacı Davranış" },
            timeout_10m: { ms: ms("10m"), reason: "Flood, Spam ve Rahatsız Edici Davranış" },
            timeout_1h: { ms: ms("1h"), reason: "Küfür, Argo ve Hakaret" },
            timeout_6h: { ms: ms("6h"), reason: "Sunucu kurallarına uyumsuzluk" },
            timeout_1d: { ms: ms("1d"), reason: "Tekrarlayan ihlaller" },
            timeout_3d: { ms: ms("3d"), reason: "Ağır ihlal" },
            timeout_1w: { ms: ms("1w"), reason: "Ciddi ihlal" },
        };

        collector.on("collect", async (interaction) => {
            const val = interaction.values[0];
            const preset = menuMap[val];
            if (!preset) return;
            await interaction.deferUpdate();
            if (msg) msg.delete().catch(() => {});
            await applyTimeout(preset.ms, preset.reason);
        });

        collector.on("end", (collected, reason) => {
            if (reason === "time" && msg) msg.edit({ components: [] }).catch(() => {});
        });
    },
};
