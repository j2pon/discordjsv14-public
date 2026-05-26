const { EmbedBuilder, Events } = require("discord.js");
const j2ponm = require('../../../../../../Global/Settings/Setup.json');
const system = require('../../../../../../Global/Settings/System');
const isimler = require('../../../../../../Global/Schemas/names');
const regstats = require('../../../../../../Global/Schemas/registerStats');
const GuildTagService = require('../../../../../../Global/Services/GuildTagService');
const client = global.client;

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (!oldMember || !newMember) return;
    if (newMember.user?.bot) return;

    const boosterRoleId = j2ponm.BoosterRole;
    if (!boosterRoleId) return;

    const hadBoost = oldMember.roles.cache.has(boosterRoleId);
    const hasBoost = newMember.roles.cache.has(boosterRoleId);
    if (hadBoost === hasBoost) return;

    const guild = client.guilds.cache.get(system.ServerID);
    const kanal = guild?.channels?.cache?.find(c => c?.name === "boost_log");
    if (!kanal) return;

    // Tag mode bilgisi (yoksa false kabul et)
    const tagModedata = await regstats.findOne({ guildID: system.ServerID }).catch(() => null);
    const isTagMode = !!tagModedata?.tagMode;

    const user = newMember;
    if (j2ponm.OwnerRoles?.some?.(x => user.roles.cache.has(x))) return;

    // Boost basıldı
    if (!hadBoost && hasBoost) {
        const embed = new EmbedBuilder()
            .setColor("#57F287")
            .setTitle("🚀 Boost Basıldı")
            .setDescription(`${user} (\`${user.user.tag}\` - \`${user.user.id}\`) sunucuya **boost bastı**.`)
            .addFields(
                { name: "Tag Mode", value: isTagMode ? "Açık" : "Kapalı", inline: true },
                { name: "İşlem", value: "Sadece log", inline: true },
            )
            .setTimestamp();

        kanal.send({ embeds: [embed] }).catch(() => {});
        return;
    }

    // Boost düştü
    if (hadBoost && !hasBoost) {
        const data = await isimler.findOne({ guildID: system.ServerID, userID: user.user.id }).catch(() => null);

        // TagMode açıkken: eski davranış (kayıtsıza atma) sadece şartlar uygunsa
        if (isTagMode) {
            const hasServerTag = await GuildTagService.memberHasGuildTag(client, user);
            const isVip = !!j2ponm.VipRole && user.roles.cache.has(j2ponm.VipRole);

            if (!hasServerTag && !isVip) {
                const embed = new EmbedBuilder()
                    .setColor("#ED4245")
                    .setTitle("💔 Boost Düştü")
                    .setDescription(`${user} (\`${user.user.tag}\` - \`${user.user.id}\`) üye takviyesini **kaybetti**.`)
                    .addFields(
                        { name: "Tag Mode", value: "Açık", inline: true },
                        { name: "İşlem", value: "Kayıtsıza atılmadı (tag/vip şartı sağlanmadı)", inline: false },
                    )
                    .setTimestamp();

                kanal.send({ embeds: [embed] }).catch(() => {});
                return;
            }

            // Log + mevcut işlem
            kanal.send({
                content: `${user} (\` ${user.user.tag} - ${user.user.id}\`) üye takviyesini kaybetti ve kayıtsıza atıldı.`
            }).catch(() => {});

            if (j2ponm.ChatChannel && client.channels.cache.has(j2ponm.ChatChannel)) {
                client.channels.cache.get(j2ponm.ChatChannel)
                    .send({ content: `${user.user.username} üyesinin takviyesi çekildiğinden dolayı isim ve yaşı düzeltildi.` })
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), 30000))
                    .catch(() => {});
            }

            await user.voice.disconnect().catch(() => {});
            if (user.manageable) await user.setNickname(`${j2ponm.ServerUntagged} Kayıtsız`).catch(() => {});
            // discord.js v14: member.setRoles yok, member.roles.set kullanılır
            await user.roles.set(j2ponm.UnRegisteredRoles).catch(() => {});
            return;
        }

        // TagMode kapalıyken: sadece logla, kayıtsıza atma yok
        const embed = new EmbedBuilder()
            .setColor("#FEE75C")
            .setTitle("💔 Boost Düştü")
            .setDescription(`${user} (\`${user.user.tag}\` - \`${user.user.id}\`) üye takviyesini **kaybetti**.`)
            .addFields(
                { name: "Tag Mode", value: "Kapalı", inline: true },
                { name: "İşlem", value: "Kayıtsıza atılmadı (sadece log)", inline: true },
            )
            .setTimestamp();

        kanal.send({ embeds: [embed] }).catch(() => {});

        // İstersen eski ismi geri bas (kayıtsıza atma yok) — mevcut davranışı koruyoruz
        if (data && data.names && data.names.length) {
            const isim = data.names.slice(-1).map((x) => `${x.name}`).join(" ");
            if (isim && user.manageable) {
                await user.setNickname(`${j2ponm.ServerUntagged} ${isim}`).catch(() => {});
            }
        }
    }
})