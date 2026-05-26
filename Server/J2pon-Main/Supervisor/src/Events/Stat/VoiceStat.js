const { Events } = require("discord.js");
const { JoinedAt, VoiceStat, VoiceUserChannel  } = require("../../../../../../Global/Models");
const System = require("../../../../../../Global/Settings/System");
const tasks = require("../../../../../../Global/Schemas/tasks");
const userTask = require("../../../../../../Global/Schemas/userTask");

const client = global.client;

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    try {
        if (!oldState.guild || !newState.guild) return;
        if ((oldState.member && oldState.member.user.bot) || (newState.member && newState.member.user.bot)) return;

if (!oldState.channelId && newState.channelId) await JoinedAt.findOneAndUpdate({ userID: newState.id },{ $set: { Date: Date.now() } },  { upsert: true });

let joinedAtData = await JoinedAt.findOne({ userID: oldState.id });
if (!joinedAtData) {
    await JoinedAt.findOneAndUpdate({ userID: oldState.id },{ $set: { Date: Date.now() } },  { upsert: true });
    joinedAtData = await JoinedAt.findOne({ userID: oldState.id });
}
if (!joinedAtData || !joinedAtData.Date) {
    joinedAtData = { Date: Date.now() };
    await JoinedAt.findOneAndUpdate({ userID: oldState.id },{ $set: { Date: Date.now() } },  { upsert: true });
}
const data = Date.now() - joinedAtData.Date;

if (oldState.channelId && !newState.channelId) {
if (oldState.channel) await DbSave(oldState, oldState.channel, data);
await JoinedAt.deleteOne({ userID: oldState.id });

// Görev ve Sorumluluk Güncelleme Fonksiyonu
async function updateTasks(userId, duration, channel) {
    // Ana Görev Güncelleme
    const dataForTask = await userTask.findOne({ userId });
    if (dataForTask) {
        const activeTask = await tasks.findOne({ currentRole: dataForTask.roleId });
        if (activeTask) {
            await userTask.findOneAndUpdate(
                { userId },
                { $inc: { 'counts.voice': duration } },
                { upsert: true }
            );
        }
    }

    // Sorumluluk Görevleri Güncelleme
    const userRespTasks = await require("../../../../../../Global/Schemas/userResponsibilityTask").find({ userId });
    for (const task of userRespTasks) {
        let shouldInc = true;
        
        // Kategori Kontrolü
        if (task.responsibilityKey === "sorunCozucu") {
            const troubleshootingCats = System.TroubleshootingCategory || [];
            if (!troubleshootingCats.includes(channel.parentId)) shouldInc = false;
        } else if (task.responsibilityKey === "etkinlik") {
            const activityCats = System.ActivityCategorys || [];
            if (!activityCats.includes(channel.parentId)) shouldInc = false;
        }

        if (shouldInc) {
            await require("../../../../../../Global/Schemas/userResponsibilityTask").findOneAndUpdate(
                { userId, responsibilityKey: task.responsibilityKey },
                { $inc: { 'counts.voice': duration } }
            );
        }
    }
}

if (oldState.channelId && !newState.channelId) {
    if (oldState.channel) {
        await DbSave(oldState, oldState.channel, data);
        await updateTasks(oldState.id, data, oldState.channel);
    }
    await JoinedAt.deleteOne({ userID: oldState.id });
} else if (oldState.channelId && newState.channelId) {
    if (oldState.channel) {
        await DbSave(oldState, oldState.channel, data);
        await updateTasks(oldState.id, data, oldState.channel);
    }
    await JoinedAt.updateOne({ userID: oldState.id },{ $set: { Date: Date.now() } },  { upsert: true });
}


}

        async function DbSave(user, channel, data) {
            try {
                if (!user || !user.id) return;
                if (!channel || !channel.id) return;
                
                await VoiceStat.findOneAndUpdate({ guildID: System.ServerID, userID: user.id },{ $inc: { TotalStat: data, DailyStat: data, WeeklyStat: data, MonthlyStat: data } }, { upsert: true });
                await VoiceUserChannel.findOneAndUpdate({ guildID: System.ServerID, userID: user.id, ChannelID: channel.id}, { $inc: { ChannelData: data } }, { upsert: true });
            } catch (error) {
                console.error('DbSave error:', error);
            }
        }
    } catch (error) {
        // Sessizce hata yakala
    }
});

