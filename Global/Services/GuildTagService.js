/**
 * Guild Tag kontrol servisi.
 * - Discord Clan / identity_guild_id sistemi KAPALI.
 * - Sadece Setup.json içindeki `ServerTag` değer(ler)i üzerinden;
 *   kullanıcının kullanıcı adı / görünür adı / rumuzunda tag geçiyorsa "taglı" kabul edilir.
 * - Family (TaggedRole) bu text tag'e göre verilir/alınır.
 * - MongoDB'da taglı üye listesi tutulur (öncelikli kontrol).
 */

const { EmbedBuilder } = require("discord.js");
const j2ponm = require("../Settings/Setup.json");
const j2poncik = require("../Settings/System");
const guildTaggedMembers = require("../Schemas/guildTaggedMembers");

const CHECK_DEBOUNCE_MS = 5000;
const RATE_LIMIT_SLEEP_MS = 600;
const SCAN_BATCH_SIZE = 15;
const SCAN_BATCH_DELAY_MS = 2000;
const userCheckDebounce = new Map();

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// ─── MongoDB ─────────────────────────────────────────────────────────────────

async function addToDatabase(guildId, userId) {
    try {
        await guildTaggedMembers.findOneAndUpdate(
            { guildID: guildId, userID: userId },
            { $set: { updatedAt: new Date() } },
            { upsert: true, new: true }
        );
    } catch (e) {
        console.error("[GuildTag] addToDatabase:", e?.message);
    }
}

async function removeFromDatabase(guildId, userId) {
    try {
        await guildTaggedMembers.deleteOne({ guildID: guildId, userID: userId });
    } catch (e) {
        console.error("[GuildTag] removeFromDatabase:", e?.message);
    }
}

async function isInDatabase(guildId, userId) {
    try {
        const doc = await guildTaggedMembers.findOne({ guildID: guildId, userID: userId });
        return !!doc;
    } catch (e) {
        return false;
    }
}

async function getTaggedCount(guildId) {
    try {
        return await guildTaggedMembers.countDocuments({ guildID: guildId });
    } catch (e) {
        return 0;
    }
}

async function getTaggedUserIds(guildId) {
    try {
        const list = await guildTaggedMembers.find({ guildID: guildId }).select("userID").lean();
        return list.map((d) => d.userID);
    } catch (e) {
        return [];
    }
}

// ─── Text Tag (Setup.ServerTag) kontrolü ─────────────────────────────────────

function getServerTags() {
    const raw = j2ponm.ServerTag;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter((t) => typeof t === "string" && t.length > 0);
    if (typeof raw === "string" && raw.length > 0) return [raw];
    return [];
}

/**
 * Üyenin kullanıcı adı / görüntülenen adı / rumuzunda Setup.ServerTag geçiyor mu?
 * - Büyük/küçük harf duyarsız kontrol edilir.
 * - Clan / identity_guild_id sistemi KULLANILMAZ.
 */
async function hasOurGuildTag(client, member, guildId) { // eslint-disable-line no-unused-vars
    if (!member?.user || member.user.bot) return false;

    const tags = getServerTags();
    if (!tags.length) return false;

    const lowerTags = tags.map((t) => t.toLowerCase());

    const names = [];
    const user = member.user;

    // Kullanıcının profil ismi (globalName) ve kullanıcı adı (username) üzerinden kontrol
    // Sunucu içi nick / displayName dikkate alınmaz.
    if (user.globalName && typeof user.globalName === "string") {
        names.push(user.globalName);
    }
    if (user.username && typeof user.username === "string") {
        names.push(user.username);
    }

    if (!names.length) return false;

    return names.some((name) => {
        const ln = String(name).toLowerCase();
        return lowerTags.some((tag) => ln.includes(tag));
    });
}

function getTagSymbols() {
    const tag = Array.isArray(j2ponm.ServerTag)
        ? j2ponm.ServerTag[0]
        : (j2ponm.ServerTag || "");
    const untag = j2ponm.ServerUntagged || "•";
    return { tag, untag };
}

async function applyTaggedNickname(member) {
    const { tag, untag } = getTagSymbols();
    if (!tag || !member?.manageable) return;

    const current =
        member.displayName ||
        member.user.globalName ||
        member.user.username ||
        member.user.tag;

    let base = String(current);
    // İsim içinde geçen tüm tag/untag sembollerini temizle
    if (tag) {
        base = base.replace(new RegExp(escapeRegex(tag), "g"), "");
    }
    if (untag) {
        base = base.replace(new RegExp(escapeRegex(untag), "g"), "");
    }
    base = base.replace(/\s+/g, " ").trim();

    if (!base.length) {
        base =
            member.user.globalName ||
            member.user.username ||
            member.user.tag;
    }

    const next = `${tag} ${base}`.trim();
    if (next && next !== current) {
        await member.setNickname(next).catch(() => { });
    }
}

async function applyUntaggedNickname(member) {
    const { tag, untag } = getTagSymbols();
    if (!untag || !member?.manageable) return;

    const current =
        member.displayName ||
        member.user.globalName ||
        member.user.username ||
        member.user.tag;

    let base = String(current);
    if (tag) {
        base = base.replace(new RegExp(escapeRegex(tag), "g"), "");
    }
    if (untag) {
        base = base.replace(new RegExp(escapeRegex(untag), "g"), "");
    }
    base = base.replace(/\s+/g, " ").trim();

    if (!base.length) {
        base =
            member.user.globalName ||
            member.user.username ||
            member.user.tag;
    }

    const next = `${untag} ${base}`.trim();
    if (next && next !== current) {
        await member.setNickname(next).catch(() => { });
    }
}

// ─── Log embed ──────────────────────────────────────────────────────────────

async function sendLogEmbed(client, member, action) {
    const logChannelId = j2ponm.GuildTagLogChannel;
    const guild = client.guilds.cache.get(j2poncik.ServerID);
    const logChannel = logChannelId
        ? guild?.channels.cache.get(logChannelId)
        : guild?.channels.cache.find((c) => c.name === "taglı_log" || c.name === "guild-tag-log");
    if (!logChannel) return;

    const isAdded = action === "added";
    const count = await getTaggedCount(member.guild?.id || j2poncik.ServerID);

    const embed = new EmbedBuilder()
        .setColor(isAdded ? 0x57f287 : 0xed4245)
        .setAuthor({
            name: member.user.tag,
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
        })
        .setTitle(isAdded ? "🏷️ Sunucu Tag Rolü Verildi" : "🚫 Sunucu Tag Rolü Alındı")
        .setDescription(
            isAdded
                ? `${member} sunucu tag'ını aldı ve rol verildi.`
                : `${member} sunucu tag'ını kaldırdı ve rol alındı.`
        )
        .addFields(
            { name: "Kullanıcı ID", value: member.user.id, inline: true },
            {
                name: "Hesap Oluşturma",
                value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                inline: true,
            }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: `Toplam tag sahibi: ${count}` })
        .setTimestamp();

    try {
        await logChannel.send({ embeds: [embed] });
    } catch (e) {
        console.error("[GuildTag] sendLogEmbed:", e?.message);
    }
}

// ─── Korunacak roller: erkek, kız, booster (guild tag bırakınca sadece bunlar kalır) ───
function getProtectedRoleIds() {
    const man = Array.isArray(j2ponm.ManRoles) ? j2ponm.ManRoles : (j2ponm.ManRoles ? [j2ponm.ManRoles] : []);
    const girl = Array.isArray(j2ponm.GirlRoles) ? j2ponm.GirlRoles : (j2ponm.GirlRoles ? [j2ponm.GirlRoles] : []);
    const booster = j2ponm.BoosterRole ? [j2ponm.BoosterRole] : [];
    return new Set([...man, ...girl, ...booster]);
}

/** Guild tag'ı bırakan kullanıcıdan erkek/kız/booster hariç tüm roller alınır. */
async function stripRolesExceptProtected(member) {
    const protectedIds = getProtectedRoleIds();
    const kaldirilacak = member.roles.cache.filter(
        (r) => r.id !== member.guild.id && !protectedIds.has(r.id) && r.editable
    );
    if (kaldirilacak.size === 0) return;
    try {
        await member.roles.remove(kaldirilacak);
        console.log(`[GuildTag] ${member.user.tag} guild tag bıraktı, ${kaldirilacak.size} rol alındı (erkek/kız/booster korundu).`);
    } catch (e) {
        console.error("[GuildTag] stripRolesExceptProtected:", e?.message);
    }
}

// ─── Rol güncelle + DB + log: Sadece hasClanTag true ise rol verilir (sunucu clan tag'ini taşıyanlar) ───

async function updateMemberRole(client, member, hasClanTag) {
    const guildId = member.guild?.id || j2poncik.ServerID;
    const roleId = j2ponm.TaggedRole;
    if (!roleId) return;

    const role = member.guild.roles.cache.get(roleId);
    if (!role) return;

    const hasRole = member.roles.cache.has(roleId);
    const wasInDb = await isInDatabase(guildId, member.user.id);

    try {
        if (hasClanTag && !wasInDb) {
            await addToDatabase(guildId, member.user.id);

            // Return Stat Kontrolü
            const staffReturn = require("../Schemas/staffReturn");
            const returnStats = require("../Schemas/returnStats");
            const returnData = await staffReturn.findOne({ guildID: guildId, leftUserID: member.id, completed: false });
            if (returnData) {
                await returnStats.findOneAndUpdate(
                    { guildID: guildId, userID: returnData.interestedUserID },
                    { $inc: { count: 1 }, $push: { totalReturns: { userID: member.id, date: Date.now() } } },
                    { upsert: true }
                );
                await staffReturn.updateOne({ _id: returnData._id }, { $set: { completed: true } });

                // Bilgilendirme Logu
                const logChannel = member.guild.channels.cache.get(j2ponm.Sorumluluk?.LogKanal);
                if (logChannel) {
                    const helper = member.guild.members.cache.get(returnData.interestedUserID);
                    logChannel.send({
                        embeds: [new EmbedBuilder()
                            .setColor(0x57f287)
                            .setTitle("🎉 Başarılı Return!")
                            .setDescription(`${helper ? helper : `\`${returnData.interestedUserID}\``} yetkilisi, tagı bırakan ${member} kullanıcısını geri kazandırdı!`)
                            .addFields(
                                { name: "Kazandırılan Kullanıcı", value: `${member}`, inline: true },
                                { name: "Yetkili", value: `${helper ? helper : `\`${returnData.interestedUserID}\``}`, inline: true },
                                { name: "Yeni Return Statı", value: `+1`, inline: true }
                            )
                            .setTimestamp()
                        ]
                    });
                }
            }

            if (!hasRole) await member.roles.add(role).catch(() => { });
            await sendLogEmbed(client, member, "added");
            await applyTaggedNickname(member);
        } else if (!hasClanTag && wasInDb) {
            await removeFromDatabase(guildId, member.user.id);

            // Yetki Bırakma Kontrolü (Log ve Buton)
            const staffRoles = [
                ...j2ponm.PromotionRoles.AltYetki,
                ...j2ponm.PromotionRoles.OrtaYetki,
                ...j2ponm.PromotionRoles.UstYetki,
                ...Object.values(j2ponm.Sorumluluk?.StaffRoles || {}).flatMap(s => [s.responsible, s.leader])
            ].filter(Boolean);

            const isStaff = member.roles.cache.some(r => staffRoles.includes(r.id));
            if (isStaff) {
                const logChannel = member.guild.channels.cache.get(j2ponm.YetkiBirakanlarlog);
                if (logChannel) {
                    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`staff_leave_interest_${member.id}`)
                            .setLabel("İlgilen")
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji("📨")
                    );

                    const staffLeaveEmbed = new EmbedBuilder()
                        .setColor(0xed4245)
                        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                        .setTitle("⚠️ Yetkili Tag Bıraktı!")
                        .setDescription(`${member} (\`${member.id}\`) isimli yetkili sunucu tagını bıraktı ve tüm yetkileri alındı.`)
                        .addFields(
                            { name: "Kullanıcı", value: `${member}`, inline: true },
                            { name: "ID", value: `\`${member.id}\``, inline: true },
                            { name: "Durum", value: "Tüm yetkileri sistem tarafından geri alındı.", inline: false }
                        )
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp();

                    await logChannel.send({ embeds: [staffLeaveEmbed], components: [row] });
                }
            }

            if (hasRole) await member.roles.remove(role).catch(() => { });
            await stripRolesExceptProtected(member);
            await sendLogEmbed(client, member, "removed");
            await applyUntaggedNickname(member);

        } else if (hasClanTag && !hasRole) {
            await member.roles.add(role).catch(() => { });
        } else if (!hasClanTag && hasRole) {
            await member.roles.remove(role).catch(() => { });
            await stripRolesExceptProtected(member);
        }
    } catch (e) {
        console.error("[GuildTag] updateMemberRole:", e?.message);
    }
}

// ─── Tek üye kontrol (ana giriş) ─────────────────────────────────────────────

async function checkMember(client, member) {
    if (!member?.guild || !member.user || member.user.bot) return;
    if (member.guild.id !== j2poncik.ServerID) return;

    const key = `${member.guild.id}-${member.user.id}`;
    const now = Date.now();
    if (userCheckDebounce.get(key) > now) return;
    userCheckDebounce.set(key, now + CHECK_DEBOUNCE_MS);

    try {
        const hasClanTag = await hasOurGuildTag(client, member, member.guild.id);
        await updateMemberRole(client, member, hasClanTag);
    } catch (e) {
        console.error("[GuildTag] checkMember:", e?.message);
    } finally {
        setTimeout(() => userCheckDebounce.delete(key), CHECK_DEBOUNCE_MS);
    }
}

// ─── Senkron: DB'deki üyeleri önce tara, sonra tüm sunucu ──────────────────

async function checkDatabaseMembers(client, guild) {
    const guildId = guild.id || j2poncik.ServerID;
    const userIds = await getTaggedUserIds(guildId);
    let removed = 0;

    for (const userId of userIds) {
        const member = guild.members.cache.get(userId);
        if (!member) {
            await removeFromDatabase(guildId, userId);
            continue;
        }
        const hasTag = await hasOurGuildTag(client, member, guildId);
        if (!hasTag) {
            await updateMemberRole(client, member, false);
            removed++;
        }
        await sleep(RATE_LIMIT_SLEEP_MS);
    }
    return removed;
}

async function scanAllMembers(client) {
    const guild = client.guilds.cache.get(j2poncik.ServerID);
    if (!guild) return;

    try {
        await checkDatabaseMembers(client, guild);
        const taggedIds = await getTaggedUserIds(guild.id);
        const members = guild.members.cache;
        let processed = 0;

        for (const [, member] of members) {
            if (member.user.bot) continue;
            if (taggedIds.includes(member.user.id)) continue;
            const hasTag = await hasOurGuildTag(client, member, guild.id);
            if (hasTag) await updateMemberRole(client, member, true);
            processed++;
            await sleep(RATE_LIMIT_SLEEP_MS);
            if (processed % SCAN_BATCH_SIZE === 0) {
                await sleep(SCAN_BATCH_DELAY_MS);
            }
        }
    } catch (e) {
        if (e?.message?.includes("rate limit") || e?.code === 429) {
            const retryAfter = (e.retryAfter ?? e.retry_after ?? 15) * 1000;
            await sleep(Math.min(retryAfter, 60000));
        }
        console.error("[GuildTag] scanAllMembers:", e?.message);
    }
}

// ─── Senkron kontrol: "Bu üye taglı mı?" (komutlar için) ───────────────────

async function memberHasGuildTag(client, member) {
    if (!member?.user || member.user.bot) return false;
    return hasOurGuildTag(client, member, member.guild?.id || j2poncik.ServerID);
}

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
    addToDatabase,
    removeFromDatabase,
    isInDatabase,
    getTaggedCount,
    getTaggedUserIds,
    hasOurGuildTag,
    updateMemberRole,
    checkMember,
    checkDatabaseMembers,
    scanAllMembers,
    sendLogEmbed,
    memberHasGuildTag,
    applyTaggedNickname,
    applyUntaggedNickname,
};
