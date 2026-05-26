const { ActivityType, Events, EmbedBuilder,PresenceUpdateStatus } = require('discord.js');
const System = require('../../../../../../Global/Settings/System');
const j2ponm = require('../../../../../../Global/Settings/Setup.json');
const penals = require('../../../../../../Global/Schemas/penals');
const userTask = require('../../../../../../Global/Schemas/userTask');
const tasks = require('../../../../../../Global/Schemas/tasks');
const client = global.client;



client.on('clientReady', async () => {
    try {
        const getType = (type) => {
            switch (type) {
                case 'COMPETING':
                    return ActivityType.Competing;

                case 'LISTENING':
                    return ActivityType.Listening;

                case 'PLAYING':
                    return ActivityType.Playing;

                case 'WATCHING':
                    return ActivityType.Watching;

                case 'STREAMING':
                    return ActivityType.Streaming;
            }
        };

        setInterval(async () => {
            const data = await userTask.find({
                'completeds.message': true,
                'completeds.voice': true,
                'completeds.register': true,
                'completeds.invite': true,
                'completeds.yetkili': true,
                'completeds.tagli': true,
            });

            if (data && data.length > 0) {
                for (const x of data) {
                    try {
                        const task = await tasks.findOne({ currentRole: x.roleId });
                        if (!task || !task.endOfMissionRole) continue;

                        // Görevin ait olduğu sunucuyu bul (schema'daki guildId, yoksa ana sunucu)
                        const guildId = task.guildId || System.ServerID;
                        const guild = client.guilds.cache.get(guildId);
                        if (!guild) continue;

                        const member = guild.members.cache.get(x.userId);

                        await userTask.findOneAndUpdate(
                            { userId: x.userId },
                            {
                                $set: {
                                    'completeds.message': false,
                                    'completeds.voice': false,
                                    'completeds.register': false,
                                    'completeds.invite': false,
                                    'completeds.yetkili': false,
                                    'completeds.tagli': false,
                                },
                            },
                            { upsert: true, new: true }
                        );

                        if (member) {
                            await member.roles.add(task.endOfMissionRole).catch(() => {});
                        }
                    } catch (err) {
                        console.error('Görev tamamlama rol verme hatası:', err);
                    }
                }
            }
        }, 60000);

        let currentConnection = null;
        
        setInterval(async () => {
            try {
                // Opus encoder'ı açıkça opusscript olarak ayarla
                require('opusscript');
                const voice = require('@discordjs/voice');
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

        await global.startDistributors()

        setInterval(async () => {
            client.user.setPresence({
                status: PresenceUpdateStatus.Idle,
                activities: [
                    {
                        name: System.Presence.Message,
                        type: getType(System.Presence.Type),
                        url: 'https://www.twitch.tv/j2pon',
                    },
                ],
            });

            const penalsData = await penals.find({ finishDate: { $lte: Date.now() }, active: true });

            penalsData.forEach(async (data) => {
                const guild = client.guilds.cache.get(data.guildID);

                if (!guild) return;

                const member = guild.members.cache.get(data.userID);

                if (!member) return;

                const cezaBittiLog = new EmbedBuilder()
                        .setAuthor({
                            name: member.displayName,
                            iconURL: member.user.avatarURL({ dynamic: true }),
                        })
                        .setTimestamp()

                if (data.type == 'Chat-Mute') {
                    await member.roles.remove(j2ponm.MutedRole);

                    let logChannel = client.channels.cache.find((x) => x.name === 'mute_log');

                    cezaBittiLog.setDescription(`${member} adlı üyenin chat mute süresi bitti.`)

                    if (logChannel) {
                        await logChannel.send({ embeds: [cezaBittiLog] })
                    }
                
                }

                if (data.type == 'Voice-Mute') {
                    await member.roles.remove(j2ponm.VMutedRole);
                    if (member.voice.channelId && member.voice.serverMute) member.voice.setMute(false);

                    let logChannel = client.channels.cache.find((x) => x.name === 'vmute_log');
                    cezaBittiLog.setDescription(`${member} adlı üyenin ses mute süresi bitti.`)

                    if (logChannel) {
                        await logChannel.send({ embeds: [cezaBittiLog] })
                    }
                }

                if (data.type == 'Jail') {
                     await member.roles.remove(j2ponm.JailedRoles);
                    let logChannel = client.channels.cache.find((x) => x.name === 'jail_log');

                    cezaBittiLog.setDescription(`${member} adlı üyenin jail süresi bitti.`)

                    if (logChannel) {
                        await logChannel.send({ embeds: [cezaBittiLog] })
                    }
                    
                }

                await penals.findByIdAndUpdate(
                    data._id,
                    {
                        $set: {
                            active: false
                        }
                    },
                    { upsert: true}
                )
            });
        }, 10000);

        setInterval(() => {
            const guild = client.guilds.cache.get(System.ServerID);
            const ROLE_NAMES = ['1 Ay', '3 Ay', '6 Ay', '9 Ay'];

            if (!guild) {
                console.log('Sunucu Yok');
                return;
            }

            guild.members.cache.forEach(async (member) => {
                const joinDate = member.joinedAt;
                const currentDate = new Date();
                const differenceInDays = Math.floor((currentDate - joinDate) / (1000 * 60 * 60 * 24));
    
                let appliedRoles = [];
    
                for (const roleName of ROLE_NAMES) {
                    const role = guild.roles.cache.find(r => r.name === roleName);
                    if (role && differenceInDays >= scat(roleName)) {
                        appliedRoles.push(role);
                    }
                }
    
                const currentRoles = member.roles.cache.filter(role => ROLE_NAMES.includes(role.name));
                    currentRoles.forEach(role => {
                    if (!appliedRoles.includes(role)) {
                        member.roles.remove(role);
                    }
                });
                    appliedRoles.forEach(role => {
                    if (!currentRoles.has(role.id)) {
                        member.roles.add(role);
                    }
                });
            });
            console.log('Kullanıcıya rol filan verdim | ready eventi.');
        }, 24 * 60 * 60 * 1000); 

        // Rol süre hesaplama fonksiyonu
        function scat(roleName) {
            const match = roleName.match(/^(\d+) Ay$/);
            if (match) {
                return parseInt(match[1]) * 30; 
            }
            return 0;
        }
    
        client.guilds.cache.forEach((guild) => {
            guild.invites.fetch().then((invites) => {
                const codeUses = new Map();
                invites.each((inv) => codeUses.set(inv.code, inv.uses));
                client.invites.set(guild.id, codeUses);
            }).catch(() => {});
        });
    } catch (error) {
        // Sessizce hata yakala
    }
});

module.exports.config = {
    Event: 'clientReady',
};
