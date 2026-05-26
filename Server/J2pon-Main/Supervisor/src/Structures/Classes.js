const j2poncik = require("../../../../../Global/Settings/System");
const mainleaderboard = require("../../../../../Global/Schemas/mainleaderboard");
const { MessageStat, MessageUserChannel, VoiceStat, VoiceUserChannel, StreamerStat, StreamerUserChannel, CameraStat, CameraUserChannel } = require("../../../../../Global/Models");
const leaderboardCmd = require("../Commands/Root/Leaderboard");

class Tasks {
    constructor(client) {
        this.client = client;
    }

    async updateLeaderboards() {
        const guild = this.client.guilds.cache.get(j2poncik.ServerID);
        if (!guild) return;

        try {
            const doc = await mainleaderboard.findOne({ guildID: guild.id }).lean();
            const channelId = doc?.messageChannel || null;

            const channel = channelId
                ? guild.channels.cache.get(channelId)
                : guild.systemChannel || guild.channels.cache.find(c => c.isTextBased && c.permissionsFor(guild.members.me).has('SendMessages'));

            if (!channel) return;

            await leaderboardCmd.generateAndPost(this.client, channel);
        } catch (e) {
            console.error("[Tasks.updateLeaderboards] error:", e?.message);
        }
    }
}

module.exports = {
    Tasks
}