const { ActivityType, Events } = require("discord.js");
const System = require("../../../../../../Global/Settings/System");
const client = global.client;
const j2ponm = require("../../../../../../Global/Settings/Setup.json")

module.exports = async (client) => {

client.guilds.cache.forEach(guild => {
    guild.invites.fetch()
    .then(invites => {
      const codeUses = new Map();
      invites.each(inv => codeUses.set(inv.code, inv.uses));
      client.invites.set(guild.id, codeUses);
  })
})},

client.on(Events.ClientReady, async () => {
  const getType = (type) => {
    switch (type) {
      case "COMPETING":
        return ActivityType.Competing;

      case "LISTENING":
        return ActivityType.Listening;

      case "PLAYING":
        return ActivityType.Playing;

      case "WATCHING":
        return ActivityType.Watching;

      case "STREAMING":
        return ActivityType.Streaming;
    }
  };


let currentConnection = null;

setInterval(async () => {
    try {
        // Opus encoder'ı açıkça opusscript olarak ayarla
        require('opusscript');
        const voice = require("@discordjs/voice")
        const channel = client.channels.cache.get(System.BotVoiceChannel);
        if (!channel) return;
        
        const guild = channel.guild;
        if (!guild) return;
        
        // Mevcut connection'ı kontrol et
        if (currentConnection && currentConnection.state.status !== 'destroyed' && currentConnection.state.status !== 'disconnected') {
            return; // Connection zaten aktif, yeni connection oluşturma
        }
        
        currentConnection = voice.joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: true,
            selfDeaf: true
        });
        
        // Listener'ları sadece bir kez ekle
        currentConnection.once('error', (error) => {
            // DAVE protokolü hatası normal, görmezden gel
            if (error.message && error.message.includes('DAVE')) {
                return;
            }
            // Diğer hataları sessizce yakala
        });
        
        currentConnection.once('stateChange', (oldState, newState) => {
            if (newState.status === 'disconnected' || newState.status === 'destroyed') {
                currentConnection = null;
            }
        });
    } catch (error) {
        // Sessizce hata yakala
        currentConnection = null;
    }
}, 1000 * 3)

setInterval(async () => {
    client.user.setPresence({
      status: System.Presence.Status,
      activities: [
        {
          name: System.Presence.Message,
          type: getType(System.Presence.Type),
          url: "https://www.twitch.tv/j2pon"
        },
      ],
    });
  }, 10000);
    client.guilds.cache.forEach(guild => {
        guild.invites.fetch()
        .then(invites => {
          const codeUses = new Map();
          invites.each(inv => codeUses.set(inv.code, inv.uses));
          client.invites.set(guild.id, codeUses);
      })
    })
})

module.exports.config = {
    Event: "clientReady"
};
  