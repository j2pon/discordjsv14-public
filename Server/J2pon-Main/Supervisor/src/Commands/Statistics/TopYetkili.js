const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const tagliStats = require("../../../../../../Global/Schemas/tagliStats");
const yetkiliStats = require("../../../../../../Global/Schemas/yetkiliStats");
const davetStats = require("../../../../../../Global/Schemas/davetStats");
const sorunCozmeStats = require("../../../../../../Global/Schemas/sorunCozmeStats");
const oryantasyonStats = require("../../../../../../Global/Schemas/oryantasyonStats");
const regstats = require("../../../../../../Global/Schemas/registerStats");

module.exports = {
    name: "topyetkili",
    description: "Yetkili performans sıralama paneli.",
    category: "STAT",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["top-yetkili", "yetkilitop"],
        usage: ".topyetkili",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args, byj2ponembed) {
        const isStaff =
            (setup.AuthRole && message.member.roles.cache.has(setup.AuthRole)) ||
            message.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!isStaff) {
            return message
                .reply({
                    content: `${client.emoji("server_carpi")} Bu komutu sadece yetkililer kullanabilir.`,
                })
                .then((e) => setTimeout(() => { e.delete(); }, 10000));
        }

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId("topyetkili_menu")
                .setPlaceholder("Görüntülemek istediğiniz istatistiği seçin.")
                .addOptions([
                    { label: "Taglı Çekme", value: "tagli", emoji: client.emoji("j2pon_bag") || "🏷️" },
                    { label: "Yetkili Çekme", value: "yetkili", emoji: client.emoji("server_members") || "🛡️" },
                    { label: "Kayıt Yapma", value: "kayit", emoji: client.emoji("j2pon_ust") || "📋" },
                    { label: "Davet Yapma", value: "davet", emoji: client.emoji("j2pon_zil") || "📨" },
                    { label: "Oryantasyon", value: "oryantasyon", emoji: client.emoji("server_info") || "📚" },
                    { label: "Sorun Çözme", value: "sorun", emoji: client.emoji("server_star2") || "🛠️" },
                    { label: "Genel Panel", value: "panel", emoji: client.emoji("server_star") || "📊" },
                ])
        );

        const infoEmoji = client.emoji("server_info");

        const baseEmbed = new EmbedBuilder()
            .setColor("#2F3136")
            .setAuthor({
                name: message.guild.name,
                iconURL: message.guild.iconURL({ dynamic: true, size: 2048 }),
            })
            .setDescription(
                `${infoEmoji} **Yetkili Performans Paneli**\n\n` +
                "Menüden bir istatistik türü seçerek sıralamaları görüntüleyebilirsiniz.\n\n" +
                "• Taglı Çekme\n" +
                "• Yetkili Çekme\n" +
                "• Kayıt Yapma\n" +
                "• Davet Yapma\n" +
                "• Oryantasyon\n" +
                "• Sorun Çözme"
            )
            .setFooter({ text: "J2pon was here ❤️" });

        const msg = await message.reply({ embeds: [baseEmbed], components: [row] });

        const filter = (i) => i.user.id === message.author.id && i.customId === "topyetkili_menu";
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on("collect", async (interaction) => {
            await interaction.deferUpdate();
            const value = interaction.values[0];

            if (value === "panel") {
                const embed = await buildPanelEmbed(client, message.guild);
                return msg.edit({ embeds: [embed], components: [row] });
            }

            const embed = await buildSingleStatEmbed(client, message.guild, value);
            if (!embed) return;
            msg.edit({ embeds: [embed], components: [row] });
        });

        collector.on("end", async () => {
            try {
                await msg.edit({ components: [] }).catch(() => { });
            } catch { }
        });
    },
};

async function buildSingleStatEmbed(client, guild, type) {
    let Model;
    let label;
    let fieldLabel;

    switch (type) {
        case "tagli":
            Model = tagliStats;
            label = "Taglı Çekme";
            fieldLabel = "Çekilen Taglı";
            break;
        case "yetkili":
            Model = yetkiliStats;
            label = "Yetkili Çekme";
            fieldLabel = "Çekilen Yetkili";
            break;
        case "davet":
            Model = davetStats;
            label = "Davet Yapma";
            fieldLabel = "Davet Edilen Üye";
            break;
        case "oryantasyon":
            Model = oryantasyonStats;
            label = "Oryantasyon";
            fieldLabel = "Oryantasyon";
            break;
        case "sorun":
            Model = sorunCozmeStats;
            label = "Sorun Çözme";
            fieldLabel = "Çözülen Sorun";
            break;
        case "kayit":
            Model = regstats;
            label = "Kayıt Yapma";
            fieldLabel = "Kayıt";
            break;
        default:
            return null;
    }

    let docs = await Model.find({ guildID: guild.id });

    if (!docs.length) {
        const noDataEmbed = new EmbedBuilder()
            .setColor("#2F3136")
            .setAuthor({
                name: guild.name,
                iconURL: guild.iconURL({ dynamic: true, size: 2048 }),
            })
            .setDescription(`Bu istatistik için kayıtlı veri bulunamadı.`);
        return noDataEmbed;
    }

    const isRegister = type === "kayit";
    // Tüm yetkilileri sırala, embed limitine göre kesilecek
    const mapped = docs
        .map((d) => {
            const member = guild.members.cache.get(d.userID || d.userId || d.userId);
            if (!member) return null;
            const value = isRegister ? d.top || 0 : d.count || 0;
            return { member, value };
        })
        .filter(Boolean)
        .sort((a, b) => b.value - a.value);

    if (!mapped.length) {
        const noDataEmbed = new EmbedBuilder()
            .setColor("#2F3136")
            .setAuthor({
                name: guild.name,
                iconURL: guild.iconURL({ dynamic: true, size: 2048 }),
            })
            .setDescription(`Bu istatistik için görüntülenecek yetkili bulunamadı.`);
        return noDataEmbed;
    }

    const lines = mapped.map((entry, index) => {
        const rankEmoji = client.sayıEmoji ? client.sayıEmoji(index + 1) : `\`${index + 1}.\``;
        return `${rankEmoji} ${entry.member}: \`${entry.value}\` ${fieldLabel}`;
    });

    const titleEmoji = client.emoji("server_info");

    const embed = new EmbedBuilder()
        .setColor("#2F3136")
        .setAuthor({
            name: guild.name,
            iconURL: guild.iconURL({ dynamic: true, size: 2048 }),
        })
        .setTitle(`${titleEmoji} ${label} Sıralaması`)
        .setDescription(trimToEmbed(lines.join("\n")))
        .setFooter({ text: "J2pon was here ❤️" });

    return embed;
}

async function buildPanelEmbed(client, guild) {
    const types = ["tagli", "yetkili", "kayit", "davet", "oryantasyon", "sorun"];
    const labels = {
        tagli: "Taglı Çekme",
        yetkili: "Yetkili Çekme",
        kayit: "Kayıt Yapma",
        davet: "Davet Yapma",
        oryantasyon: "Oryantasyon",
        sorun: "Sorun Çözme",
    };

    const models = {
        tagli: tagliStats,
        yetkili: yetkiliStats,
        kayit: regstats,
        davet: davetStats,
        oryantasyon: oryantasyonStats,
        sorun: sorunCozmeStats,
    };

    const fields = [];

    for (const type of types) {
        const Model = models[type];
        const docs = await Model.find({ guildID: guild.id });
        if (!docs.length) continue;

        const isRegister = type === "kayit";
        const top = docs
            .map((d) => {
                const member = guild.members.cache.get(d.userID || d.userId || d.userId);
                if (!member) return null;
                const value = isRegister ? d.top || 0 : d.count || 0;
                return { member, value };
            })
            .filter(Boolean)
            .sort((a, b) => b.value - a.value);

        if (!top.length) continue;

        const value = top
            .map((entry, index) => {
                const rankEmoji = client.sayıEmoji ? client.sayıEmoji(index + 1) : `\`${index + 1}.\``;
                return `${rankEmoji} ${entry.member}: \`${entry.value}\``;
            })
            .join("\n");

        fields.push({
            name: labels[type],
            value: trimToField(value),
            inline: false,
        });
    }

    if (!fields.length) {
        return new EmbedBuilder()
            .setColor("#2F3136")
            .setAuthor({
                name: guild.name,
                iconURL: guild.iconURL({ dynamic: true, size: 2048 }),
            })
            .setDescription("Herhangi bir yetkili istatistiği bulunamadı.");
    }

    const infoEmoji = client.emoji("server_info");

    const embed = new EmbedBuilder()
        .setColor("#2F3136")
        .setAuthor({
            name: guild.name,
            iconURL: guild.iconURL({ dynamic: true, size: 2048 }),
        })
        .setTitle(`${infoEmoji} Yetkili Performans Paneli`)
        .addFields(fields)
        .setFooter({ text: "Tüm yetkililer sıralanmıştır. Uzun listeler kısaltılabilir." });

    return embed;
}

function trimToEmbed(text) {
    const max = 4000;
    if (!text) return "Veri bulunamadı.";
    if (text.length <= max) return text;
    return text.slice(0, max - 50) + "\n...\nListe çok uzun olduğu için kısaltıldı.";
}

function trimToField(text) {
    const max = 1000;
    if (!text) return "Veri bulunamadı.";
    if (text.length <= max) return text;
    return text.slice(0, max - 30) + "\n...\nDevamı için ilgili istatistiği menüden açın.";
}
