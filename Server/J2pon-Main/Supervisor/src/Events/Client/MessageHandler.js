const { EmbedBuilder, Events, codeBlock } = require('discord.js');
const { timeformat } = require('../../../../../../Global/Helpers/Utils');
const cooldownCache = new Map();
const { green } = require('../../../../../../Global/Settings/Emojis.json');
const j2ponm = require('../../../../../../Global/Settings/Setup.json');
const system = require('../../../../../../Global/Settings/System');
const client = global.client;
const moment = require('moment');
require("moment-duration-format");
moment.duration("hh:mm:ss").format();

// Maksimum listener sayısını arttırmak
client.setMaxListeners(20);

function applyCooldown(memberId, cmd) {
    const key = cmd.name + '|' + memberId;
    cooldownCache.set(key, Date.now());
}

function getRemainingCooldown(memberId, cmd) {
    const key = cmd.name + '|' + memberId;
    if (cooldownCache.has(key)) {
        const remaining = (Date.now() - cooldownCache.get(key)) * 0.001;
        if (remaining > cmd.cooldown) {
            cooldownCache.delete(key);
            return 0;
        }
        return cmd.cooldown - remaining;
    }
    return 0;
}

client.on('messageCreate', async (message) => {
    try {
        let prefix = system.Mainframe.Prefixs.find((x) => message.content.toLowerCase().startsWith(x));
        if (
            !message.guild ||
            message.author.bot ||
            !prefix ||
            j2ponm.UnRegisteredRoles.some((x) => message.member.roles.cache.has(x)) ||
            j2ponm.JailedRoles.some((x) => message.member.roles.cache.has(x))
        )
            return;

        if (['.tag'].includes(message.content.toLowerCase()))
            return message.channel.send({ content: `${j2ponm.ServerTag}` });

        let args = message.content.substring(system.Mainframe.Prefixs.some((x) => x.length)).split(' ');
        let j2ponxsrd = args[0].toLocaleLowerCase();
        args = args.splice(1);

        let command = client.commands.get(j2ponxsrd) || client.aliases.get(j2ponxsrd);
        
        // Embed oluşturulması
        const byj2ponembed = new EmbedBuilder()
            .setAuthor({
                name: message.member.displayName,
                iconURL: message.author.avatarURL({ dynamic: true, size: 2048 }),
            })
            .setFooter({
                text: system.SubTitle ? system.SubTitle : `J2pon was here¿`,
                iconURL: message.author.avatarURL({ dynamic: true, size: 2048 }),
            })
            .setColor('Random');

        if (command) {
            // Sadece gerçek komutlar için log gönder
            let komutLog = client.channels.cache.find((x) => x.name == 'komut_log');

            const byj2pon = new EmbedBuilder()
                .setColor('Random')
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 2048 }))
                .setDescription(`
                    ${message.author} tarafından ${message.channel} kanalında \`${prefix}${j2ponxsrd}\` komutu kullanıldı.`)
                .addFields(
                    { name: `Kullanılan Komut`, value: `${codeBlock("fix", prefix + j2ponxsrd)}`, inline: false },
                    { name: `Kullanan Kişi`, value: `${codeBlock("fix", message.author.username)}`, inline: false },
                    { name: `Kullandığı Tarih`, value: `${codeBlock("fix", moment(Date.now()).format("LLL"))}`, inline: false }
                );
            
            if (komutLog) komutLog.send({ embeds: [byj2pon] });
            if (command.category === 'OWNER' && !system.BotsOwners.includes(message.author.id)) {
                return message.reply({ content: 'Bu komuta yalnızca bot sahipleri erişebilir' });
            }

            if (command.cooldown > 0) {
                const remaining = getRemainingCooldown(message.author.id, command);
                if (remaining > 0) {
                    return message.reply({
                        content: `Bekleme süresindesin. Bu komudu tekrar \`${timeformat(remaining)}\` sonra kullanabilirsiniz.`,
                    });
                }
            }

            try {
                await command.onCommand(client, message, args, byj2ponembed);
                if (command.cooldown > 0) applyCooldown(message.author.id, command);
            } catch (ex) {
                console.error('MessageHandler error:', ex);
            }
        }
    } catch (error) {
        console.error('MessageHandler genel hata:', error);
    }
});
