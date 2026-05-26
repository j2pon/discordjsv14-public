/**
 * Yasaklı tag normalizasyonu ve kontrolü.
 * - type "isim": username/displayName/nickname içinde value aranır.
 * - type "guild": (ESKİ DAVRANIŞ) Discord clan identity_guild_id üzerinden kontrol ederdi.
 *   Clan/identity sistemi artık kullanılmadığı için şu an "guild" tipleri sadece isme göre kontrol edilir.
 */

const GuildTagService = require("../Services/GuildTagService"); // Şu an sadece text tag fonksiyonları için kullanılıyor
const { ChannelType } = require("discord.js");
const bannedTagModel = require("../Schemas/bannedTag");
const j2ponm = require("../Settings/Setup.json");
const j2poncik = require("../Settings/System");
const emojis = require("../Settings/Emojis.json");

/** Tek bir tag kaydını normalize eder (eski string format -> { value, type }). */
function normalizeTagEntry(entry) {
    if (entry && typeof entry === "object" && typeof entry.value === "string") {
        return { value: entry.value, type: entry.type === "guild" ? "guild" : "isim" };
    }
    if (typeof entry === "string") {
        return { value: entry, type: "isim" };
    }
    return null;
}

/** taglar dizisini { value, type } dizisine çevirir. */
function normalizeTaglar(taglar) {
    if (!Array.isArray(taglar)) return [];
    return taglar.map(normalizeTagEntry).filter(Boolean);
}

/**
 * İsim tag kontrolü (username, displayName, nickname).
 * @param {{ username: string, displayName?: string }} user
 * @param {string} nickname
 * @param {{ value: string, type: string }} entry
 * @param {{ caseSensitive?: boolean, checkUsername?: boolean, checkDisplayName?: boolean, checkNickname?: boolean }} config
 */
function checkIsimTag(user, nickname, entry, config) {
    const caseSensitive = config.caseSensitive || false;
    const checkUsername = config.checkUsername !== false;
    const checkDisplayName = config.checkDisplayName !== false;
    const checkNickname = config.checkNickname !== false;
    const kontrolTag = caseSensitive ? entry.value : entry.value.toLowerCase();

    if (checkUsername && user.username) {
        const username = caseSensitive ? user.username : user.username.toLowerCase();
        if (username.includes(kontrolTag)) return true;
    }
    if (checkDisplayName && user.displayName) {
        const displayName = caseSensitive ? user.displayName : user.displayName.toLowerCase();
        if (displayName.includes(kontrolTag)) return true;
    }
    if (checkNickname && nickname) {
        const nick = caseSensitive ? nickname : nickname.toLowerCase();
        if (nick.includes(kontrolTag)) return true;
    }
    return false;
}

/**
 * Üyenin yasaklı tag (isim veya guild) taşıyıp taşımadığını kontrol eder.
 * @param {import("discord.js").Client} client - Guild tag (clan) kontrolü için gerekli
 * @param {import("discord.js").GuildMember} member
 * @param {Array<string|{ value: string, type: string }>} taglar
 * @param {object} config - ForbiddenTagConfig (caseSensitive, checkUsername, checkDisplayName, checkNickname)
 * @returns {Promise<{ has: boolean, found: { value: string, type: string } | null }>}
 */
async function checkMemberBannedTag(client, member, taglar, config = {}) {
    const entries = normalizeTaglar(taglar);
    const nickname = member.nickname ?? member.user?.displayName ?? null;
    const user = member.user || member;

    for (const entry of entries) {
        // "guild" tipi için de artık sadece isim kontrolü yapılır (clan API devre dışı)
        if (checkIsimTag(user, nickname, entry, config)) {
            return { has: true, found: entry };
        }
    }
    return { has: false, found: null };
}

/**
 * Senkron sadece isim tag kontrolü (guild tag için client ve async gerekir).
 * Sadece isim taglarını kontrol eder; guild tag kontrolü yapmaz.
 */
function checkMemberBannedTagIsimOnly(member, taglar, config = {}) {
    const entries = normalizeTaglar(taglar).filter((e) => e.type === "isim");
    const user = member.user || member;
    const nickname = member.nickname ?? user?.displayName ?? null;

    for (const entry of entries) {
        if (checkIsimTag(user, nickname, entry, config)) {
            return { has: true, found: entry };
        }
    }
    return { has: false, found: null };
}

/**
 * Yasaklı tag uygulandığında log kanalına mesaj atar (ForbiddenTagConfig.logKanalId).
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").GuildMember} member
 * @param {{ value: string, type: string } | null} foundEntry - Tespit edilen tag bilgisi
 * @param {string} [source] - Kaynak: "userUpdate", "guildMemberUpdate", "guildMemberAdd", "otomatik" vb.
 */
function sendBannedTagLog(client, member, foundEntry, source = "otomatik") {
    const config = j2ponm.ForbiddenTagConfig || {};
    const logKanalId = config.logKanalId;
    if (!member?.guild) return;

    // Önce isme göre kanal bul (bannedtag_log), yoksa ID'den devam et
    let channel =
        member.guild.channels.cache.find(
            (ch) =>
                ch.name === "bannedtag_log" &&
                (ch.type === ChannelType.GuildText || ch.isTextBased?.())
        ) || (logKanalId ? member.guild.channels.cache.get(logKanalId) : null);

    if (!channel) return;
    const tagVal = foundEntry ? foundEntry.value : "";
    const tagType = foundEntry ? (foundEntry.type === "guild" ? "Guild Tag" : "İsim Tag") : "";
    const e = emojis;
    const embed = {
        color: 0xed4245,
        title: `${e.server_carpi || "🚫"} Yasaklı Tag Tespit Edildi`,
        description: [
            `${e.server_info || "ℹ️"} ${member} kullanıcısında yasaklı tag tespit edildi ve **Yasaklı Tag** rolü verildi.`,
            "",
            `${e.server_nokta || "•"} Tespit edilen tag: \`${tagVal}\` [${tagType}]`,
        ].join("\n"),
        fields: [
            { name: `${e.server_members || "👤"} Kullanıcı`, value: `${member.user.tag}\n\`${member.user.id}\``, inline: true },
            { name: `${e.appEmoji_duzenle || "🏷️"} Tag`, value: `\`${tagVal}\`\n[${tagType}]`, inline: true },
            { name: `${e.server_info || "📋"} Kaynak`, value: source, inline: true },
        ],
        thumbnail: { url: member.user.displayAvatarURL({ size: 256 }) },
        footer: { text: `${e.server_star2 || ""} ${member.guild.name}`.trim() },
        timestamp: new Date().toISOString(),
    };
    channel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Yasaklı tag varsa cezayı uygular (rolleri al, yasaklı tag rolü ver, nickname set).
 * Diğer kontrollerde (mesaj, etkileşim, ses, presence vb.) hızlı yakalama için kullanılır.
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").GuildMember} member
 * @param {{ sendDM?: boolean }} options - sendDM: true ise kullanıcıya DM atar (varsayılan false, tekrarlı çağrılarda spam önlenir)
 * @returns {Promise<boolean>} - Ceza uygulandıysa true, yoksa false
 */
async function applyBannedTagPunishmentIfNeeded(client, member, options = {}) {
    if (!member?.guild?.id || !member.user || member.user.bot) return false;
    const guildId = j2poncik.ServerID || member.guild.id;
    if (member.guild.id !== guildId) return false;

    const data = await bannedTagModel.findOne({ guildID: guildId }).catch(() => null);
    if (!data?.taglar?.length) return false;

    const config = j2ponm.ForbiddenTagConfig || {};
    const forbiddenTagRoleId = Array.isArray(j2ponm.ForbiddenTagRoles) ? j2ponm.ForbiddenTagRoles[0] : j2ponm.ForbiddenTagRoles;
    if (!forbiddenTagRoleId) return false;

    const { has: hasBannedTag, found: foundEntry } = await checkMemberBannedTag(client, member, data.taglar, config);
    if (!hasBannedTag || member.roles.cache.has(j2ponm.BoosterRole)) return false;
    if (member.roles.cache.has(forbiddenTagRoleId)) return false;

    try {
        const kaldirilacakRoller = member.roles.cache
            .filter(r => r.id !== member.guild.id && r.id !== forbiddenTagRoleId && r.editable)
            .map(r => r);
        if (kaldirilacakRoller.length > 0) await member.roles.remove(kaldirilacakRoller);
        if (!member.roles.cache.has(forbiddenTagRoleId)) await member.roles.add(forbiddenTagRoleId).catch(() => {});
        await member.setNickname("Yasaklı Tag").catch(() => {});
        const tagVal = foundEntry ? foundEntry.value : "";
        if (options.sendDM) {
            member.send({
                content: `**Merhaba** ${member}\n\nBu yazı, sunucumuz kurallarına aykırı bir sembol (${tagVal}) hesabınızda tespit edildiği için yasaklı kategorisine alındığınızı bildirmek amacıyla yazılmıştır. Sembolü kaldırmanız gerekmektedir.\n\n**${member.guild.name}** Moderasyon Ekibi`,
            }).catch(() => {});
        }
        sendBannedTagLog(client, member, foundEntry, "otomatik");
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    normalizeTagEntry,
    normalizeTaglar,
    checkIsimTag,
    checkMemberBannedTag,
    checkMemberBannedTagIsimOnly,
    applyBannedTagPunishmentIfNeeded,
    sendBannedTagLog,
};
