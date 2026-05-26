const { PermissionsBitField, ChannelType } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");

module.exports = {
    name: "toplantıçek",
    description: "Yetkilileri belirtilen ses kanalına çeker.",
    category: "OWNER",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["toplanticek", "toplanti-cek", "toplantı-çek"],
        usage: ".toplantıçek <kanalID>",
    },

    onLoad: function () { },

    onCommand: async function (client, message, args, byj2ponembed) {
        if (!message.guild || !message.member) return;

        const isAuthorized = Array.isArray(system.BotsOwners) && system.BotsOwners.includes(message.author.id);

        if (!isAuthorized) {
            return message.reply({ content: "Bu komutu sadece bot ownerları kullanabilir." });
        }

        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
            return message.reply({ content: "Üyeleri taşıyabilmem için `Üyeleri Taşı` yetkisine ihtiyacım var." });
        }

        const channelId = args[0]?.replace(/[<#>]/g, "");
        if (!channelId) {
            return message.reply({ content: "Bir ses kanalı ID'si belirtmelisin. Örnek: `.toplantıçek 123456789012345678`" });
        }

        const targetChannel = message.guild.channels.cache.get(channelId);
        if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) {
            return message.reply({ content: "Belirttiğin kanal geçerli bir ses kanalı değil." });
        }

        const sorumlulukRoleIds = new Set();

        if (setup.Sorumluluk?.StaffRoles) {
            for (const key of Object.keys(setup.Sorumluluk.StaffRoles)) {
                const unit = setup.Sorumluluk.StaffRoles[key];
                if (unit?.responsible) sorumlulukRoleIds.add(unit.responsible);
                if (unit?.leader) sorumlulukRoleIds.add(unit.leader);
            }
        }

        if (setup.Sorumluluk?.YetkiSeviyeleri) {
            for (const key of Object.keys(setup.Sorumluluk.YetkiSeviyeleri)) {
                const level = setup.Sorumluluk.YetkiSeviyeleri[key];
                if (Array.isArray(level?.Roller)) {
                    for (const roleId of level.Roller) sorumlulukRoleIds.add(roleId);
                }
            }
        }

        if (setup.AuthRole) sorumlulukRoleIds.add(setup.AuthRole);

        const isYetkili = (member) => {
            if (member.user.bot) return false;
            return [...sorumlulukRoleIds].some(roleId => member.roles.cache.has(roleId));
        };

        const yetkililer = message.guild.members.cache.filter(isYetkili);
        const sesteOlanYetkililer = yetkililer.filter(member => member.voice?.channel);
        const tasinacaklar = sesteOlanYetkililer.filter(member => member.voice.channelId !== targetChannel.id);

        if (tasinacaklar.size === 0) {
            return message.reply({
                embeds: [byj2ponembed.setDescription(
                    `Taşınacak yetkili bulunamadı.\n` +
                    `• Tespit edilen yetkili: **${yetkililer.size}**\n` +
                    `• Seste olan yetkili: **${sesteOlanYetkililer.size}**`
                )]
            });
        }

        let moved = 0;
        let failed = 0;
        let index = 0;

        for (const [, member] of tasinacaklar) {
            setTimeout(async () => {
                try {
                    await member.voice.setChannel(targetChannel.id, `${message.author.tag} tarafından toplantı çekimi yapıldı.`);
                    moved++;
                } catch (error) {
                    failed++;
                    console.error(`${member.user.tag} taşınamadı:`, error?.message || error);
                }
            }, index * 400);
            index++;
        }

        setTimeout(async () => {
            await message.reply({
                embeds: [byj2ponembed.setDescription(
                    `Toplantı çekimi tamamlandı.\n` +
                    `• Hedef kanal: ${targetChannel}\n` +
                    `• Tespit edilen yetkili: **${yetkililer.size}**\n` +
                    `• Seste olan yetkili: **${sesteOlanYetkililer.size}**\n` +
                    `• Taşınan: **${moved}**\n` +
                    `• Başarısız: **${failed}**`
                )]
            });
        }, (tasinacaklar.size * 400) + 1000);
    },
};
