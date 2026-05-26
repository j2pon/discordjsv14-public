/**
 * Guild Tag kontrolü - tüm ilgili event'lerde tag kontrolü tetiklenir.
 * MongoDB'daki taglı liste öncelikli; mesaj, komut, ses, tepki, presence, member/user güncellemelerinde kontrol.
 * Yasaklı tag kontrolü de aynı tetikleyicilerde (debounce ile) hızlı yakalama için çalışır.
 */
const { Events } = require("discord.js");
const j2poncik = require("../../../../../Global/Settings/System");
const GuildTagService = require("../../../../../Global/Services/GuildTagService");
const { applyBannedTagPunishmentIfNeeded } = require("../../../../../Global/Helpers/BannedTagHelper");

const client = global.client;
const BANNED_TAG_DEBOUNCE_MS = 6000;
const bannedTagCheckLastRun = new Map();

function scheduleCheck(member) {
    if (!member?.user || member.user.bot || !member.guild) return;
    if (member.guild.id !== j2poncik.ServerID) return;
    GuildTagService.checkMember(client, member).catch(() => {});
}

function scheduleBannedTagCheck(member) {
    if (!member?.user || member.user.bot || !member.guild) return;
    if (member.guild.id !== j2poncik.ServerID) return;
    const key = `${member.guild.id}-${member.user.id}`;
    const now = Date.now();
    if (bannedTagCheckLastRun.get(key) > now - BANNED_TAG_DEBOUNCE_MS) return;
    bannedTagCheckLastRun.set(key, now);
    applyBannedTagPunishmentIfNeeded(client, member, { sendDM: false }).catch(() => {});
    setTimeout(() => bannedTagCheckLastRun.delete(key), BANNED_TAG_DEBOUNCE_MS);
}

client.on(Events.ClientReady, async () => {
    try {
        const guild = client.guilds.cache.get(j2poncik.ServerID);
        if (guild) {
            setTimeout(() => GuildTagService.scanAllMembers(client), 60000);
        }
    } catch (e) {
        console.error("[GuildTag] Ready scan:", e?.message);
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    if (member.guild?.id !== j2poncik.ServerID) return;
    setTimeout(() => {
        scheduleCheck(member);
        scheduleBannedTagCheck(member);
    }, 3000);
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (newMember.guild?.id !== j2poncik.ServerID || newMember.user?.bot) return;
    scheduleCheck(newMember);
    scheduleBannedTagCheck(newMember);
});

client.on(Events.GuildMemberRemove, async (member) => {
    if (member.guild?.id !== j2poncik.ServerID) return;
    GuildTagService.removeFromDatabase(member.guild.id, member.user.id).catch(() => {});
});

client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
    if (!newPresence?.guild || newPresence.guild.id !== j2poncik.ServerID) return;
    const member = newPresence.member;
    if (!member || member.user?.bot) return;
    if (oldPresence?.status === "offline" && newPresence.status !== "offline") {
        scheduleCheck(member);
        scheduleBannedTagCheck(member);
    }
});

client.on(Events.UserUpdate, async (oldUser, newUser) => {
    const guild = client.guilds.cache.get(j2poncik.ServerID);
    if (!guild) return;
    const member = guild.members.cache.get(newUser.id);
    if (!member || newUser.bot) return;
    scheduleCheck(member);
    scheduleBannedTagCheck(member);
});

client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.guild.id !== j2poncik.ServerID || message.author?.bot) return;
    const member = message.member;
    if (member) {
        scheduleCheck(member);
        scheduleBannedTagCheck(member);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.guild || interaction.guild.id !== j2poncik.ServerID) return;
    const member = interaction.member;
    if (member?.user?.bot) return;
    if (member) {
        scheduleCheck(member);
        scheduleBannedTagCheck(member);
    }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const member = newState.member;
    if (!member || member.user?.bot) return;
    if (newState.guild?.id !== j2poncik.ServerID) return;
    scheduleCheck(member);
    scheduleBannedTagCheck(member);
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user?.bot) return;
    const guild = reaction.message?.guild;
    if (!guild || guild.id !== j2poncik.ServerID) return;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (member) {
        scheduleCheck(member);
        scheduleBannedTagCheck(member);
    }
});

module.exports.config = { Event: "GuildTag" };
