// MP3 decode için ffmpeg yolu (Windows'ta özellikle gerekli olabiliyor)
// ÖNEMLİ: @discordjs/voice / prism-media yüklenmeden önce set edilmeli.
try {
    process.env.FFMPEG_PATH ??= require('ffmpeg-static');
} catch (_) {}

const DEBUG_WELCOME = process.env.DEBUG_WELCOME === '1';
const wlog = (...args) => { if (DEBUG_WELCOME) console.log(...args); };
const werr = (...args) => { console.error(...args); };

// Voice encryption için libsodium (Node 22 + yeni voice şifreleme modlarında gerekli)
// ÖNEMLİ: @discordjs/voice yüklenmeden önce preload edilmeli (require-time detection).
try {
    require('libsodium-wrappers');
} catch (_) {}

let _sodiumReady = null;
async function ensureSodiumReady() {
    if (_sodiumReady) return _sodiumReady;
    _sodiumReady = (async () => {
        try {
            const sodium = require('libsodium-wrappers');
            await sodium.ready;
            wlog('✅ libsodium-wrappers hazır');
        } catch (e) {
            werr(`🔴 libsodium-wrappers yüklenemedi: ${e?.message || e}`);
        }
    })();
    return _sodiumReady;
}

const c3gm = require("../../Global/Settings/System");
const {Events,ActivityType} = require("discord.js")
let { ceegg } = require('./c3gcik');
const { joinVoiceChannel, VoiceConnectionStatus, entersState, AudioPlayerStatus } = require('@discordjs/voice');

// Opus encoder'ı açıkça opusscript olarak ayarla
try {
    const opusscript = require('opusscript');
    // @discordjs/voice otomatik olarak opusscript'i kullanacak
} catch (e) {
    console.warn('opusscript yüklenemedi, fallback kullanılacak');
}

// Process-level error handlers for DAVE protocol and MongoDB
process.on("unhandledRejection", (err) => {
    // DAVE protokolü hatası normal, görmezden gel
    if (err && err.message && (err.message.includes('DAVE') || err.message.includes('davey'))) {
        return;
    }
    // MongoDB hatalarını atla
    if (err && (err.message && (err.message.includes('MongooseError') || err.message.includes('buffering timed out') || err.message.includes('querySrv') || err.message.includes('ETIMEOUT') || err.message.includes('No compatible encryption modes')))) {
        return;
    }
});

process.on("uncaughtException", (err) => {
    // DAVE protokolü hatası normal, görmezden gel
    if (err && err.message && (err.message.includes('DAVE') || err.message.includes('davey'))) {
        return;
    }
    // MongoDB hatalarını atla
    if (err && (err.message && (err.message.includes('MongooseError') || err.message.includes('buffering timed out') || err.message.includes('querySrv') || err.message.includes('ETIMEOUT') || err.message.includes('No compatible encryption modes')))) {
        return;
    }
});
// Welcome botlarını global olarak sakla
global.welcomeBots = global.welcomeBots || [];

for (let index = 0; index < c3gm.Welcome.Tokens.length; index++) {
    let token = c3gm.Welcome.Tokens[index]
    let channel = c3gm.Welcome.Channels.length < 1 ? c3gm.Welcome.Channels[0] : c3gm.Welcome.Channels[index]
    if(channel) {
        let client = new ceegg();
        client.welcomeChannelId = channel; // Channel ID'yi sakla
        global.welcomeBots = global.welcomeBots || [];
        global.welcomeBots.push(client); // Global array'e ekle
        client.login(token).catch(err => {console.log(`🔴 | Bot Giriş Yapamadı -> Sebep: ${err}`)})
        client.on(Events.VoiceStateUpdate, async (oldState, newState) => { 
            if(oldState.member.id == client.user.id && oldState.channelId && !newState.channelId) { 
            let guild = client.guilds.cache.get(c3gm.ServerID);
            if(!guild) return;
            let Channel = global.Voice = guild.channels.cache.get(channel);
            if(!Channel) return console.error("🔴 | Kanal Bulunamadı!");
            try {
                client.voiceConnection = await joinVoiceChannel({channelId: Channel.id,guildId: Channel.guild.id,adapterCreator: Channel.guild.voiceAdapterCreator,group: client.user.id});
                client.voiceConnection.once('error', (error) => {
                    // DAVE protokolü hatası normal, görmezden gel
                    if (error && error.message && error.message.includes('DAVE')) {
                        return;
                    }
                    console.error(`🔴 VoiceConnection error (reconnect): ${client.user.tag} -> ${error?.message || error}`);
                });
                client.voiceConnection.on('stateChange', (oldState, newState) => {
                    if (newState.status === 'disconnected') {
                        client.voiceConnection.destroy().catch(() => {});
                    }
                });
            } catch (error) {
                // Voice bağlantı hatası
            }
        }})
        client.on(Events.ClientReady, async () => {
            console.log(`🟢 | ${client.user.tag} Başarıyla Giriş Yaptı!`)
            
            // Opus encoder
            wlog('✅ opusscript kullanılacak');

            // Voice encryption için sodium hazır et
            await ensureSodiumReady();
            
            // Welcome channel ID'yi sakla
            client.welcomeChannelId = channel;
            
            let guild = client.guilds.cache.get(c3gm.ServerID);
            if(!guild) {
                werr(`🔴 Guild bulunamadı: ServerID=${c3gm.ServerID} | bot=${client.user.tag}`);
                return;
            }
            let Channel = global.Voice = guild.channels.cache.get(channel);
            if(!Channel) {
                werr(`🔴 Kanal bulunamadı: channelId=${channel} | bot=${client.user.tag}`);
                return;
            }
            try {
                wlog(`✅ Hedef kanal bulundu: ${Channel.name} (${Channel.id}) | bot=${client.user.tag}`);
                client.voiceConnection = joinVoiceChannel({channelId: Channel.id,guildId: Channel.guild.id,adapterCreator: Channel.guild.voiceAdapterCreator,group: client.user.id});
                
                client.voiceConnection.once('error', (error) => {
                    // DAVE protokolü hatası normal, görmezden gel
                    if (error && error.message && error.message.includes('DAVE')) {
                        return;
                    }
                    werr(`🔴 VoiceConnection error: ${client.user.tag} -> ${error?.message || error}`);
                });
                
                client.voiceConnection.once('stateChange', (oldState, newState) => {
                    if (newState.status === 'disconnected' || newState.status === 'destroyed') {
                        client.voiceConnection = null;
                    }
                });
                
                // Şarkı çalma devre dışı - sadece voice connection oluştur
                // Connection'ın ready olmasını bekle (maksimum 30 saniye)
                try {
                    await entersState(client.voiceConnection, VoiceConnectionStatus.Ready, 30000);
                    wlog(`✅ Voice bağlantısı hazır (pre-start): ${Channel.name} | ${client.user.tag}`);
                    // Connection ready, şarkıyı başlat
                    await client.start(channel);
                } catch (error) {
                    werr(`🔴 Voice ready beklenemedi: ${client.user.tag} -> ${error?.message || error}`);
                    // Connection ready olmadı, stateChange event'ini dinle
                    if (client.voiceConnection && client.voiceConnection.state.status !== 'disconnected' && 
                        client.voiceConnection.state.status !== 'destroyed') {
                        client.voiceConnection.once('stateChange', async (oldState, newState) => {
                            if (newState.status === VoiceConnectionStatus.Ready) {
                                wlog(`✅ Voice bağlantısı hazır (stateChange): ${Channel.name} | ${client.user.tag}`);
                                await client.start(channel);
                            }
                        });
                    }
                }

                // Stabilite: çalmıyorsa kendini toparla (staff yoksa)
                setInterval(async () => {
                    try {
                        if (!client.voiceConnection) return;
                        if (client.staffJoined) return;
                        if (client.voiceConnection.state.status !== VoiceConnectionStatus.Ready) return;
                        const status = client.player?.state?.status;
                        if (status !== AudioPlayerStatus.Playing && status !== AudioPlayerStatus.Buffering) {
                            await client.start(client.welcomeChannelId || channel);
                        }
                    } catch (_) {}
                }, 20000);
            } catch (error) {
                werr(`🔴 Ready->joinVoiceChannel hata: ${client.user.tag} -> ${error?.message || error}`);
            }
        })
        // Şarkı başlatma komutu - DEVRE DIŞI
        // client.on(Events.MessageCreate, async (message) => {
        //     if (message.author.bot) return;
        //     if (!message.content.startsWith('.welcomestart') && !message.content.startsWith('.wstart')) return;
        //     
        //     // Yetki kontrolü
        //     const Setup = require("../../../../Global/Settings/Setup.json");
        //     if (!Setup.OwnerRoles.some(role => message.member.roles.cache.has(role)) && 
        //         !message.member.permissions.has(require('discord.js').PermissionsBitField.Flags.Administrator)) {
        //         return;
        //     }

        //     try {
        //         const channelId = client.welcomeChannelId || channel;
        //         await client.start(channelId);
        //         await message.reply({ content: "✅ Şarkı başlatıldı!" }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        //     } catch (error) {
        //         await message.reply({ content: `❌ Hata: ${error.message}` }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        //     }
        // });

        // Staff geldiğinde durdur / staff çıkınca devam ettir (stabil)
        client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
            try {
                const welcomeChannelId = client.welcomeChannelId || channel;
                if (!welcomeChannelId) return;

                const member = newState.member || oldState.member;
                if (!member) return;

                // Staff kanala girdi
                if (newState.channelId === welcomeChannelId && oldState.channelId !== welcomeChannelId) {
                    if (member.isStaff && member.isStaff()) {
                        client.staffJoined = true;
                        try { client.player?.pause(true); } catch (_) {}
                    }
                    return;
                }

                // Staff kanaldan çıktı
                if (oldState.channelId === welcomeChannelId && newState.channelId !== welcomeChannelId) {
                    if (member.isStaff && member.isStaff()) {
                        const guild = member.guild;
                        const ch = guild.channels.cache.get(welcomeChannelId);
                        // Kanalda staff kalmadıysa devam ettir
                        if (ch && ch.hasStaff && !ch.hasStaff()) {
                            client.staffJoined = false;
                            try { client.player?.unpause(); } catch (_) {}
                            // Eğer player Idle kaldıysa yeniden başlat
                            try {
                                if (client.player?.state?.status === AudioPlayerStatus.Idle) {
                                    await client.start(welcomeChannelId);
                                }
                            } catch (_) {}
                        }
                    }
                    return;
                }
            } catch (_) {}
        });
    }
}

