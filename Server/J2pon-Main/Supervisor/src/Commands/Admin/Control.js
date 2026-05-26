const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, Collection } = require("discord.js");
const setup = require("../../../../../../Global/Settings/Setup.json");
const system = require("../../../../../../Global/Settings/System");
const GuildTagService = require("../../../../../../Global/Services/GuildTagService");

module.exports = {
    name: "kontrol",
    description: "Kontrol Komudu",
    category: "ADMIN",
    cooldown: 0,
    command: {
        enabled: true,
        aliases: ["control"],
        usage: ".kontrol",
    },

    onLoad: function (client) { },

    onCommand: async function (client, message, args) {

       
        // Yetki kontrolü
        if (!setup.OwnerRoles.some(role => message.member.roles.cache.has(role)) &&
            !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {

            return message.reply({ content: "Yetkin bulunmamakta dostum." })
                .then((e) => setTimeout(() => { e.delete(); }, 5000));
        }

        // Kullanıcıları filtrele (yeni guild-tag sistemine göre DB'den alıp optimize ile işleyelim)
        const taggedUsers = new Collection();
        try {
            const taggedIds = await GuildTagService.getTaggedUserIds(message.guild.id).catch(() => []);
            if (Array.isArray(taggedIds) && taggedIds.length > 0) {
                // Parallel fetch with small concurrency to avoid rate limits
                const concurrency = 20;
                for (let i = 0; i < taggedIds.length; i += concurrency) {
                    const batch = taggedIds.slice(i, i + concurrency);
                    const results = await Promise.allSettled(batch.map((id) => message.guild.members.fetch(id).catch(() => null)));
                    for (const res of results) {
                        const member = res.status === "fulfilled" ? res.value : null;
                        if (!member) continue;
                        if (member.user?.bot) continue;
                        if (!member.roles.cache.has(setup.TaggedRole)) taggedUsers.set(member.id, member);
                    }
                    // small delay between batches to be safe
                    await new Promise((r) => setTimeout(r, 200));
                }
            } else {
                // fallback: eski yöntem (cache üzerinde kontrol) — DB boşsa veya hata olduysa
                for (const [id, member] of message.guild.members.cache) {
                    try {
                        if (member.user.bot) continue;
                        const hasTag = await GuildTagService.memberHasGuildTag(client, member);
                        if (hasTag && !member.roles.cache.has(setup.TaggedRole)) {
                            taggedUsers.set(id, member);
                        }
                    } catch (innerErr) {
                        // continue on per-member error
                        console.error("[Control] memberHasGuildTag error for", member.id, innerErr?.message);
                    }
                }
            }
        } catch (err) {
            console.error("[Control] taggedUsers population error:", err);
        }

        // Kayıtsızları alırken botları hariç tut
        const unregisteredUsers = message.guild.members.cache.filter(member =>
            !member.user.bot && member.roles.cache.filter(role => role.id !== message.guild.id).size === 0
        );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Primary)
                    .setLabel('1')
                    .setCustomId('kayitsiz'),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Primary)
                    .setLabel('2')
                    .setCustomId('tag'),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Primary)
                    .setLabel('3')
                    .setCustomId('tag_isim')
            );

        const embed = new EmbedBuilder()
            .setFooter({ text: system.SubTitle })
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setDescription(`
${message.member.toString()}, ${message.guild.name} Sunucusunda rolü olmayan üyelerin rol dağıtım menüsü aşağıda verilmiştir.

\` 1 \` Kayıtsız Rol: (**${unregisteredUsers.size}** kişi)
\` 2 \` Taglı Rol: (**${taggedUsers.size}** kişi)
\` 3 \` Tag İsim Tara: (İsminde tag olup başında olmayanları düzelt)
            `);

        const msg = await message.channel.send({ embeds: [embed], components: [row] });

        const filter = (button) => button.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

        collector.on("end", (collected, reason) => {
            try {
                console.log(`[Control] collector ended. collected=${collected.size} reason=${reason}`);
            } catch (e) {}
        });

        collector.on("collect", async (button) => {
            console.log(`[Control] collect -> customId=${button.customId} by=${button.user?.tag} (${button.user?.id})`);
            try {
                // Interaction'ı hemen işleyelim (timeout hatası engellenir)
                if (!button.deferred && !button.replied) {
                    await button.deferReply({ ephemeral: false });
                }

                // --------------------
                // TAG İŞLEMİ
                // --------------------
                if (button.customId === 'tag') {

                    const taggedUsersToProcess = new Collection();
                    for (const [id, member] of message.guild.members.cache) {
                        if (member.user.bot) continue;
                        const hasTag = await GuildTagService.memberHasGuildTag(client, member);
                        if (hasTag && !member.roles.cache.has(setup.TaggedRole)) {
                            taggedUsersToProcess.set(id, member);
                        }
                    }

                    let successCount = 0;
                    let failedCount = 0;

                    for (const member of taggedUsersToProcess.values()) {
                        try {
                            await member.roles.add(setup.TaggedRole);
                            await GuildTagService.applyTaggedNickname(member);
                            successCount++;
                        } catch (error) {
                            console.error(`${member.user.tag} kullanıcısına rol/veri verilemedi:`, error);
                            failedCount++;
                        }
                    }

                    let content = `${successCount} kullanıcıya rol verildi ve isimleri güncellendi.`;
                    if (failedCount > 0) content += ` ${failedCount} kullanıcıya işlem uygulanamadı.`;

                    await button.editReply({ content });
                }

                // --------------------
                // KAYITSIZ İŞLEMİ
                // --------------------
                if (button.customId === 'kayitsiz') {

                    const unregisteredUsersToProcess = message.guild.members.cache.filter(member =>
                        member.roles.cache.filter(role => role.id !== message.guild.id).size === 0
                    );

                    let successCount = 0;
                    let failedCount = 0;

                    for (const member of unregisteredUsersToProcess.values()) {
                        try {
                            await member.roles.add(setup.UnRegisteredRoles[0]);
                            successCount++;
                        } catch (error) {
                            console.error(`${member.user.tag} kullanıcısına rol verilemedi:`, error);
                            failedCount++;
                        }
                    }

                    let content = `${successCount} kullanıcıya rol verildi.`;
                    if (failedCount > 0) content += ` ${failedCount} kullanıcıya verilemedi.`;

                    await button.editReply({ content });
                }

                // --------------------
                // TAG İSİM TARA
                // --------------------
                if (button.customId === 'tag_isim') {
                    const { ServerTag } = setup;
                    const tag =
                        Array.isArray(ServerTag) && ServerTag.length
                            ? ServerTag[0]
                            : (ServerTag || "");

                    if (!tag) {
                        return await button.editReply({
                            content: "Setup.ServerTag tanımlı olmadığı için isim taraması yapılamıyor.",
                        });
                    }

                    const candidates = [];
                    for (const [, member] of message.guild.members.cache) {
                        if (!member || member.user.bot) continue;

                        const hasTagProfile = await GuildTagService.memberHasGuildTag(client, member);
                        if (!hasTagProfile) continue;

                        const current =
                            member.displayName ||
                            member.user.globalName ||
                            member.user.username ||
                            member.user.tag;

                        const startsWithTag = current.trim().startsWith(tag);
                        if (!startsWithTag) {
                            candidates.push(member);
                        }
                    }

                    let fixed = 0;
                    let failed = 0;

                    for (const member of candidates) {
                        try {
                            await GuildTagService.applyTaggedNickname(member);
                            fixed++;
                        } catch (e) {
                            failed++;
                        }
                    }

                    let content = `${fixed} kullanıcının ismi taglı formata çekildi.`;
                    if (failed > 0) content += ` ${failed} kullanıcıda hata oluştu.`;

                    await button.editReply({ content });
                }

            } catch (error) {

                console.error("Rol verme işleminde hata:", error);

                // interaction zaten reply edilmemişse
                if (!button.replied && !button.deferred) {
                    await button.reply({ content: "Rol verme işleminde bir hata oluştu!", ephemeral: true });
                } else {
                    await button.editReply({ content: "Rol verme işleminde bir hata oluştu!" });
                }
            }
        });
    },
};
