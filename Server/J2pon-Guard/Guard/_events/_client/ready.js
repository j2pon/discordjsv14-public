const { Event } = require("../../../Structures/Default.Events");
const Guild = require("../../../../../Global/Settings/System");

class ready extends Event {
    constructor(client) {
        super(client, {
            name: "clientReady",
            enabled: true,
        });    
    }    

    async onLoad() {
        try {
            _status(
                [
                    {name: Guild.Presence.Message, type: 3},
                ],
                ["idle"],
                {
                    on: true,
                    activities: 5000,
                    status: 30000
                }
            );
            
            const guild = client.guilds.cache.get(Guild.ServerID);
            if (!guild) {
                return;
            }
            
            let currentConnection = null;
            
            setInterval(async () => {
                try {
                    // Opus encoder'ı açıkça opusscript olarak ayarla
                    require('opusscript');
                    const voice = require('@discordjs/voice');
                    const channel = client.channels.cache.get(Guild.BotVoiceChannel);
                    if (!channel) return;
                    
                    const channelGuild = channel.guild;
                    if (!channelGuild) return;
                    
                    // Mevcut connection'ı kontrol et
                    if (currentConnection && currentConnection.state.status !== 'destroyed' && currentConnection.state.status !== 'disconnected') {
                        return; // Connection zaten aktif, yeni connection oluşturma
                    }
                    
                    currentConnection = voice.joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channelGuild.id,
                        adapterCreator: channelGuild.voiceAdapterCreator,
                        selfMute: true,
                        selfDeaf: true,
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
            }, 1000 * 3);
        } catch (error) {
            // Sessizce hata yakala
        }
    }
}

function _status(activities, status, time) {
    try {
        if (!time.on) {
            client.user.setActivity(activities[0]);
            client.user.setStatus(status[0]);
        } else {
            let i = 0;
            setInterval(() => {
                if (i >= activities.length) i = 0;
                client.user.setActivity(activities[i]);
                i++;
            }, time.activities);
        
            let s = 0;
            setInterval(() => {
                if (s >= activities.length) s = 0;
                client.user.setStatus(status[s]);
                s++;
            }, time.status);
        }
    } catch (error) {
        console.error('Status error:', error);
    }
}

module.exports = ready;