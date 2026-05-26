const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const j2ponm = require('../../../../../../Global/Settings/Setup.json');
const j2poncik = require('../../../../../../Global/Settings/System');
const cezapuan = require('../../../../../../Global/Schemas/cezapuan');
const penals = require('../../../../../../Global/Schemas/penals');
const moment = require('moment');
require('moment-duration-format');

module.exports = {
    name: 'cezabuton',
    description: 'Şüpheli buton',
    category: 'OWNER',
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ['cezabutton', 'ceza-button', 'ceza-buton'],
        usage: '.cezabutton',
    },

    onLoad: function (client) {},

    onCommand: async function (client, message, args) {
        client.channels.cache.get(message.channel.id).send({
            content: `**Merhaba!** Aşağıdaki butonlardan cezalarınız hakkında detaylı bilgi alabilirsiniz.`,
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2,
                            custom_id: 'cezapuan',
                            label: 'Ceza Puanım',
                            emoji: { name: '⚠️' },
                        },
                        {
                            type: 2,
                            style: 2,
                            custom_id: 'cezalarim',
                            label: 'Cezalarım',
                            emoji: { name: '📄' },
                        },
                        {
                            type: 2,
                            style: 2,
                            custom_id: 'kalanzamanim',
                            label: 'Kalan Zamanım',
                            emoji: { name: '⏳' },
                        },
                        {
                            type: 2,
                            style: 2,
                            custom_id: 'süpheli',
                            label: 'Şüpheliden Çık',
                            emoji: { name: '✅' },
                        },
                    ],
                },
            ],
        });

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
            const member = await client.guilds.cache
                .get(j2poncik.ServerID)
                .members.fetch(interaction.member.user.id);
            if (!member) return;

            if (interaction.customId === 'cezapuan') {
                const cezapuanData = await cezapuan.findOne({ userID: member.user.id });
                await interaction.reply({
                    content: `${cezapuanData ? cezapuanData.cezapuan : 0} ceza puanın bulunmakta.`,
                    ephemeral: true,
                });
            }

            if (interaction.customId === 'cezalarim') {
                const data = await penals.find({ guildID: j2poncik.ServerID, userID: interaction.member.id }).sort({ date: -1 });
                if (data.length === 0) {
                    return interaction.reply({ content: `🟢 ${member.toString()} üyesinin sicili temiz!`, ephemeral: true });
                }

                const formattedData = data.map((x) =>
                    `#${x.id} **[${x.type}]** ${moment(x.date).format("LLL")} tarihinde, <@${x.staff}> tarafından, \`${x.reason}\` nedeniyle, ${x.type.toLowerCase().replace("-", " ")} cezası almış.\n─────────────────`
                ).join("\n");

                const embed = new EmbedBuilder()
                    .setDescription(formattedData)
                    .setColor("Orange");

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (interaction.customId === 'kalanzamanim') {
                let datas = await penals
                    .find({ guildID: j2poncik.ServerID, userID: member.id, active: true })
                    .sort({ date: -1 });

                datas = datas.map((x) =>
                    `<@${x.staff}> tarafından **${moment(x.date).format('LLL')}** tarihinde işlenen __"#${x.id}"__ numaralı __"${x.type}"__ türündeki cezan <t:${Math.floor(x.finishDate / 1000)}:R> sonlandırılacaktır.`
                ).join('\n');

                if (datas.length === 0) {
                    return interaction.reply({
                        content: `Aktif cezan bulunmamakta.`,
                        ephemeral: true,
                    });
                }

                await interaction.reply({ content: datas, ephemeral: true });
            }

            if (interaction.customId === 'süpheli') {
                if (!j2ponm.SuspectedRoles.some((x) => member.roles.cache.has(x))) {
                    return interaction.reply({
                        content: `Şüpheli Hesap değilsiniz.`,
                        ephemeral: true,
                    });
                }

                let guvenilirlik = Date.now() - member.user.createdTimestamp < 1000 * 60 * 60 * 24 * 7;

                if (guvenilirlik) {
                    return interaction.reply({
                        content: `Hesabınız (<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>) tarihinde oluşturulmuş ve güvenilir değil.`,
                        ephemeral: true,
                    });
                }

                await member.roles.remove(j2ponm.SuspectedRoles).catch(() => {});
                await interaction.reply({
                    content: `Şüpheli rolü üzerinizden alındı.`,
                    ephemeral: true,
                });
            }
        });
    },
};
