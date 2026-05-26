// MP3 decode için ffmpeg yolu (Windows'ta özellikle gerekli olabiliyor)
try {
    process.env.FFMPEG_PATH ??= require('ffmpeg-static');
} catch (_) {}

// Voice encryption için libsodium preload (@discordjs/voice require-time detection)
try {
    require('libsodium-wrappers');
} catch (_) {}

const DEBUG_WELCOME = process.env.DEBUG_WELCOME === '1';
const wlog = (...args) => { if (DEBUG_WELCOME) console.log(...args); };
const werr = (...args) => { console.error(...args); };

async function ensureSodiumReady() {
    try {
        const sodium = require('libsodium-wrappers');
        await sodium.ready;
    } catch (_) {}
}

const { Client, VoiceChannel, GuildMember, PermissionFlagsBits, GatewayIntentBits, Partials, ActivityType, Events } = require('discord.js');
const conf = require('./System');
const c3gcik = require("../../Global/Settings/System");
const {
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  joinVoiceChannel,
} = require('@discordjs/voice');
const play = require('play-dl');
const path = require('path');
const fs = require('fs');

class ceegg extends Client {
    constructor(options) {
        super({
            options,
            intents: Object.keys(GatewayIntentBits),
            partials: Object.keys(Partials),
            presence: {
                activities: [{
                  name: c3gcik.Presence.Message,
                  type: ActivityType.Watching,
                  url:"https://www.twitch.tv/c3g"
                }],
                status: 'idle'
              }
        })

        this.player = createAudioPlayer({
            behaviors: { noSubscriber: NoSubscriberBehavior.Play },
        });
        this.url = conf.youtubeURL;
        this.stream;
        this.message;
        this.channelId;
        this.playing;
        this.voiceConnection;
        this.staffJoined = false;
        this.welcomeChannelId = null; // Welcome channel ID'yi sakla
        this._isStarting = false;
        this._lastResourceType = null;
        
        // Loop: @discordjs/voice v0.16 uses AudioPlayerStatus.Idle (NOT 'idle')
        this.player.on(AudioPlayerStatus.Idle, async () => {
            if (this.staffJoined) return;
            await this._playOnce().catch(() => {});
        });

        this.player.on('error', (error) => {
            // "No compatible encryption modes" hatasını filtrele
            if (error && error.message && error.message.includes('No compatible encryption modes')) return;
            werr(`🔴 [WELCOME-PLAYER] ${this.user?.tag || 'bot'} player error:`, error?.message || error);
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
         process.on("warning", (warn) => { console.log(warn) });
         process.on("beforeExit", () => { console.log("Sistem Kapanıyor!")});
        this.on("rateLimit", (rate) => { console.log("Client Rate Limit'e Uğradı; "+rate)})
        this.on(Events.Error,(err) => { console.log("Beklenmedik Bir Hata Gerçekleşti; "+err)});
        this.on(Events.Warn,(warn) => { })
        
        // Şarkı başlatma komutu - DEVRE DIŞI
        // this.on(Events.MessageCreate, async (message) => {
        //     if (message.author.bot) return;
        //     if (!message.content.startsWith('.welcomestart') && !message.content.startsWith('.wstart')) return;
        //     
        //     // Yetki kontrolü
        //     const Setup = require("../../../../Global/Settings/Setup.json");
        //     if (!Setup.OwnerRoles.some(role => message.member.roles.cache.has(role)) && 
        //         !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        //         return;
        //     }

        //     try {
        //         const channelId = this.welcomeChannelId || message.member.voice?.channel?.id;
        //         if (!channelId) {
        //             await message.reply({ content: "❌ Kanal bulunamadı!" }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        //             return;
        //         }
        //         await this.start(channelId);
        //         await message.reply({ content: "✅ Şarkı başlatıldı!" }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        //     } catch (error) {
        //         await message.reply({ content: `❌ Hata: ${error.message}` }).then((e) => setTimeout(() => { e.delete(); }, 5000));
        //     }
        // });
    }

    _getMp3Path() {
        // conf.file: "./byc3g.mp3" → always resolve to same directory as this file
        return path.join(__dirname, path.basename(conf.file));
    }

    async _createResource() {
        if (conf.mp3) {
            const mp3Path = this._getMp3Path();
            if (!fs.existsSync(mp3Path)) throw new Error(`MP3 dosyası bulunamadı: ${mp3Path}`);
            this._lastResourceType = 'mp3';
            return createAudioResource(mp3Path, { inlineVolume: true });
        }

        const stream = await play.stream(this.url);
        this._lastResourceType = 'stream';
        return createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
    }

    async _playOnce() {
        // Connection yoksa veya kopmuşsa tekrar başlatmayı dene
        if (!this.voiceConnection || this.voiceConnection.state.status === VoiceConnectionStatus.Destroyed) return;

        // Disconnected durumda direkt play etmeye çalışma
        if (this.voiceConnection.state.status === VoiceConnectionStatus.Disconnected) return;

        // Subscription yoksa bağla
        try {
            if (!this.voiceConnection.state.subscription) {
                this.voiceConnection.subscribe(this.player);
            }
        } catch (_) {}

        const resource = await this._createResource();
        this.player.play(resource);
    }

    async start(channelId, a) {
        let guild = this.guilds.cache.get(c3gcik.ServerID);
        if(!guild) return;
        let channel = guild.channels.cache.get(channelId);
        if(!channel) return;
        this.channelId = channelId;

        if (this._isStarting) return;
        this._isStarting = true;

        let connection = this.voiceConnection;
        
        // Opusscript zaten yüklü, libsodium gerekli değil
        console.log('✅ opusscript kullanılacak');
        
        // Connection kontrolü
        if(!connection || connection.state.status === 'disconnected' || connection.state.status === 'destroyed') {
            try {
                await ensureSodiumReady();
                connection = this.voiceConnection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                    group: this.user.id,
                    selfDeaf: true,
                    selfMute: false,
                });
                
                connection.once('error', (error) => {
                    // DAVE protokolü hatası normal, görmezden gel
                    if (error && error.message && error.message.includes('DAVE')) {
                        return;
                    }
                    // "No compatible encryption modes" hatasını da filtrele
                    if (error && error.message && error.message.includes('No compatible encryption modes')) {
                        return;
                    }
                    // Diğer hataları sessizce yakala
                });
                
                connection.once('stateChange', (oldState, newState) => {
                    if (newState.status === VoiceConnectionStatus.Disconnected || newState.status === VoiceConnectionStatus.Destroyed) {
                        this.voiceConnection = null;
                    }
                });
                
                // Connection'ın ready olmasını bekle - ZORUNLU
                try {
                    await entersState(connection, VoiceConnectionStatus.Ready, 30000);
                    wlog(`✅ Voice bağlantısı hazır: ${channel.name}`);
                } catch (error) {
                    // "No compatible encryption modes" hatasını filtrele
                    if (error && error.message && error.message.includes('No compatible encryption modes')) {
                        this.voiceConnection = null;
                        this._isStarting = false;
                        return;
                    }
                    // Diğer hataları sessizce yakala (loglama yapma)
                    this.voiceConnection = null;
                    this._isStarting = false;
                    return;
                }
            } catch (error) {
                // "No compatible encryption modes" hatasını filtrele
                if (error && error.message && error.message.includes('No compatible encryption modes')) {
                    this._isStarting = false;
                    return;
                }
                // Diğer hataları sessizce yakala
                this._isStarting = false;
                return;
            }
        }
        
        try {
            // Connection ready, şarkıyı başlat (loop Idle event'i tekrar başlatacak)
            await entersState(connection, VoiceConnectionStatus.Ready, 30000);
            connection.subscribe(this.player);
            await this._playOnce();
            wlog(`🎵 Şarkı çalmaya başladı: ${channel.name} (MP3: ${conf.mp3 ? 'Evet' : 'Hayır'})`);
        } catch (e) {
            if (e && e.message && e.message.includes('No compatible encryption modes')) {
                this.voiceConnection = null;
            }
            werr(`🔴 [WELCOME-START] ${this.user?.tag || 'bot'} start/play failed:`, e?.message || e);
        }

        this._isStarting = false;
    }
}
module.exports = { ceegg };
VoiceChannel.prototype.hasStaff = function(checkMember = false) {
if(this.members.some(m => (checkMember !== false ? m.user.id !== checkMember.id : true) && !m.user.bot && m.roles.highest.position >= m.guild.roles.cache.get(c3gcik.Welcome.Staff).position)) return true;
return false;
}
VoiceChannel.prototype.getStaffs = function(checkMember = false) {
return this.members.filter(m => (checkMember !== false ? m.user.id !== checkMember.id : true) && !m.user.bot && m.roles.highest.position >= m.guild.roles.cache.get(c3gcik.Welcome.Staff).position).size
}
GuildMember.prototype.isStaff = function() {
if(!this.user.bot && (this.permissions.has(PermissionFlagsBits.Administrator) || this.roles.highest.position >= this.guild.roles.cache.get(c3gcik.Welcome.Staff).position)) return true;
return false;
}