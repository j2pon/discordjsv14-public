const { Events } = require("discord.js");
const chatFriend = require("../../../../../../Global/Schemas/chatFriend");
const MessageStat  = require("../../../../../../Global/Models/MessageStat");
const MessageUserChannel = require("../../../../../../Global/Models/MessageUserChannel");
const System = require("../../../../../../Global/Settings/System");
const userTask = require("../../../../../../Global/Schemas/userTask");
const tasks = require("../../../../../../Global/Schemas/tasks");

const client = global.client;

client.on(Events.MessageCreate, async (message) => {
    try {
        if (message.author.bot || !message.guild || message.content.startsWith(...System.Mainframe.Prefixs)) return;

    // Ana Görev Güncelleme
    const data = await userTask.findOne({ userId: message.author.id });
    if (data) {
        const activeTask = await tasks.findOne({ currentRole: data.roleId });
        if (activeTask) {
            await userTask.findOneAndUpdate(
                { userId: message.author.id },
                { $inc: { 'counts.message': 1 } },
                { upsert: true }
            );
        }
    }

    // Sorumluluk Görevleri Güncelleme (Sadece Public Sorumlusu chat sayar)
    await require("../../../../../../Global/Schemas/userResponsibilityTask").findOneAndUpdate(
        { userId: message.author.id, responsibilityKey: "public" },
        { $inc: { 'counts.message': 1 } }
    );


const repliedMessage = message.reference?.messageId ? message.channel.messages.cache.get(message.reference.messageId) : null;
if (repliedMessage) {
const repliedUserID = repliedMessage.author.id;
const userId = repliedUserID;
await chatFriend.findOneAndUpdate({ userID: userId, repliedUser: message.author.id },{ $inc: { yanitSayi: 1 } }, { new: true, upsert: true })
}
        await MessageStat.findOneAndUpdate({ guildID: System.ServerID, userID: message.author.id }, { $inc: { TotalStat: 1, DailyStat: 1, WeeklyStat: 1, MonthlyStat: 1 } },  { upsert: true });
        await MessageUserChannel.findOneAndUpdate({ guildID: System.ServerID, userID: message.author.id, ChannelID: message.channel.id, ChannelName: message.channel.name }, { $inc: { ChannelData: 1 } },{upsert: true });
    } catch (error) {
        console.error('MessageStat error:', error);
    }
});
