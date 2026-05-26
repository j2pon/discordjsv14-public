require("../../../Global/Helpers/Extenders/Prototypes");

// EventEmitter dinleyici limitini artır (interactionCreate vs. için uyarıları sustur)
require("events").defaultMaxListeners = 50;

// Node.js uyarılarını (MaxListeners, deprecation, ephemeral vb.) konsola bastırma
process.on("warning", () => {});

const System = global.system = require("../../../Global/Settings/System");
const { j2pon } = require("./src/Structures/j2pon");
const { Tasks } = require("./src/Structures/Classes");
const { Collection, GuildMember, Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField, Intents, ButtonStyle, Events } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const guard = require("../../J2pon-Guard/Schemas/Guard");
const query = require("../../J2pon-Guard/Additions/Distributors");
const Distributors = global.Distributors = [];

// Opus encoder'ı açıkça opusscript olarak ayarla
try {
    const opusscript = require('opusscript');
    // @discordjs/voice otomatik olarak opusscript'i kullanacak
} catch (e) {
    console.warn('opusscript yüklenemedi, fallback kullanılacak');
}

let client = global.client = new j2pon({ 
   Directory: "Server Moderation Bot", 
   token: System.Mainframe.Moderation,
});

// interactionCreate gibi yoğun kullanılan EventEmitter'lar için listener limitini yükselt
client.setMaxListeners(50);

client.loadClient({
Events   : true,
Commands : true,
Database : true,
});

client.rolbul = function (rolisim) {
  let rol = client.guilds.cache.get(System.ServerID).roles.cache.find(byj2pon => byj2pon.name === rolisim)
  if (!rol) return false;
  return rol;
}

client.emoji = function (emojiName)  {
  const emoji = client.emojis.cache.find(x => x.name && x.name.includes(emojiName));
  if (!emoji) return null;
  try {
    return `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
  } catch {
    return null;
  }
};

client.progressBar = function progressBar(value, maxValue, size){
  const ratio = value / maxValue > 1 ? 1 : value / maxValue;
  const progress = Math.round(size * ratio);
  const emptyProgress = size - progress;

  const fillEmoji = client.emoji("BlueMid") || "█";
  const emptyEmoji = client.emoji("EmptyMid") || "░";

  return `${fillEmoji.repeat(progress)}${emptyEmoji.repeat(emptyProgress)}`;
}; 

client.sayıEmoji = (sayi) => {
  const numberString = sayi.toString().replace(/ /g, "     ");
  const numberMatch = numberString.match(/([0-9])/g);
  let result = numberString.replace(/([a-zA-Z])/g, "Belirlenemiyor").toLowerCase();
  
  if (numberMatch) {
    result = result.replace(/([0-9])/g, d => {
      const emojiMap = {
        '0': client.emoji("sayiEmoji_sifir") || "` 0 `",
        '1': client.emoji("sayiEmoji_bir") || "` 1 `",
        '2': client.emoji("sayiEmoji_iki") || "` 2 `",
        '3': client.emoji("sayiEmoji_uc") || "` 3 `",
        '4': client.emoji("sayiEmoji_dort") || "` 4 `",
        '5': client.emoji("sayiEmoji_bes") || "` 5 `",
        '6': client.emoji("sayiEmoji_alti") || "` 6 `",
        '7': client.emoji("sayiEmoji_yedi") || "` 7 `",
        '8': client.emoji("sayiEmoji_sekiz") || "` 8 `",
        '9': client.emoji("sayiEmoji_dokuz") || "` 9 `"
      };
      return emojiMap[d];
    });
  }
  return result;
};

const emojiBul = global.emojiBul = async (name) => {
  return await client.emojis.cache.find(x => x.name.includes(name));
};

const { GiveawaysManager } = require('discord-giveaways');
const manager = new GiveawaysManager(client, {
  storage: './../../../Global/Settings/giveaways.json',
  default: {
    botsCanWin: false,
    embedColor: '#00ff00',
    embedColorEnd: '#ff0000',
    reaction: '🎉',
    lastChance: {
      enabled: true,
      content: 'KATILIM İÇİN SON ŞANS!',
      threshold: 20000,
      embedColor: '#FF0000'
    }

  }
});
client.giveawaysManager = manager;

const tasks = new Tasks(client)

// Leaderboard'ları saatlik olarak güncelle (leaderboard komutundaki yapı ile aynı)
setInterval(async () => {
  await tasks.updateLeaderboards()
}, 60 * 60 * 1000)




  const penals = require("../../../Global/Schemas/penals");
  client.penalize = async (guildID, userID, type, active = true, staff, reason, temp = false, finishDate = undefined) => {
    let id = await penals.find({ guildID });
    id = id ? id.length + 1 : 1;
    return await new penals({ id, userID, guildID, type, active, staff, reason, temp, finishDate }).save();
  };

  client.fetchUser = async (userID) => {
    try {
      return await client.users.fetch(userID);
    } catch (err) {
      return undefined;
    }
  };

  client.fetchBan = async (guild, userID) => {
    try {
      return await guild.bans.fetch(userID);
    } catch (err) {
      return undefined;
    }
  };

  const chunkify = global.chunkify = (array, chunkSize) => {
    if (!array || !chunkSize) return array;
    
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  };

  const startDistributors = global.startDistributors = async () => {
    const system = require("../../../Global/Settings/System");
    
    for (const token of system.Security.Dis) {
      if (!token) continue;
      
      const botClient = new Client({ 
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] 
      });
      
      botClient.once(Events.ClientReady, () => {
        botClient.user.setActivity(System.Presence.Message, { type: 3 });
        botClient.queryTasks = new query();
        botClient.queryTasks.init(1000);
        Distributors.push(botClient);
        
        for (const distributor of Distributors) {
          // Güvenlik: distributor tanımsızsa veya guilds objesi yoksa atla
          if (!distributor || !distributor.guilds) continue;
          
          distributor.on(Events.ClientReady, async () => {
            const guild = distributor.guilds.cache.get(system.ServerID);
            if (!guild) return;
            
            const channel = guild.channels.cache.get(system.BotVoiceChannel);
            if (!channel) return;
            
            try {
              // Opus encoder'ı açıkça opusscript olarak ayarla
              require('opusscript');
              const connection = joinVoiceChannel({
                channelId: System.BotVoiceChannel,
                guildId: System.ServerID,
                adapterCreator: channel.guild.voiceAdapterCreator,
              });
              
              // Listener'ları sadece bir kez ekle
              connection.once('error', (error) => {
                // DAVE protokolü hatası normal, görmezden gel
                if (error.message && error.message.includes('DAVE')) {
                  return;
                }
                // Diğer hataları sessizce yakala
              });
              
              connection.once('stateChange', (oldState, newState) => {
                if (newState.status === 'disconnected' || newState.status === 'destroyed') {
                  connection.destroy().catch(() => {});
                }
              });
            } catch (error) {
              // Sessizce hata yakala
            }
          });
        }
      });
      
      try {
        await botClient.login(token);
      } catch (err) {
        console.log(`Dağıtıcı Token Arızası: ${err.message}`);
      }
    }
  };

    const fs = require('fs');
    const path = require('path');
    const { GlobalFonts } = require('@napi-rs/canvas');
    
    /**
     * Registers fonts from a specified directory using the @napi-rs/canvas library.
     * @param {string} fontsDirectory - The path to the directory containing font files.
     */
    const registerFontsFromDirectory = (fontsDirectory) => {
      try {
        const files = fs.readdirSync(fontsDirectory);
        const fontFiles = files.filter(file => /\.(ttf|otf)$/.test(file));
        
        fontFiles.forEach(fontFile => {
          const fontName = path.basename(fontFile, path.extname(fontFile));
          const fontPath = path.join(fontsDirectory, fontFile);
          GlobalFonts.registerFromPath(fontPath, fontName);
        });
      } catch (err) {
        global.client.logger.error('Error reading directory:', err.message);
      }
    };
    
    // Register fonts
    const fontsDirectory = path.join(__dirname, './../../../Global/Assets');
    registerFontsFromDirectory(fontsDirectory);



// Process-level error handlers for DAVE protocol and MongoDB
process.on("unhandledRejection", (err) => {
    // Silinmiş mesaj / bilinmeyen mesaj (gecikmeli delete vb.) — zararsız
    if (
        err &&
        (err.code === 10008 ||
            err.rawError?.code === 10008 ||
            err.cause?.code === 10008 ||
            (typeof err.message === "string" &&
                err.message.includes("Unknown Message") &&
                err.constructor?.name === "DiscordAPIError"))
    ) {
        return;
    }
    // DAVE protokolü hatası normal, görmezden gel
    if (err && err.message && (err.message.includes('DAVE') || err.message.includes('davey'))) {
        return;
    }
    // MongoDB hatalarını atla
    if (err && (err.message && (err.message.includes('MongooseError') || err.message.includes('buffering timed out') || err.message.includes('querySrv') || err.message.includes('ETIMEOUT') || err.message.includes('No compatible encryption modes')))) {
        return;
    }
    // Canvas/Image loading 404 hatalarını atla
    if (err && (err.message && (err.message.includes('remote source rejected with status code 404') || err.message.includes('status code 404')))) {
        return;
    }
    // Discord Giveaways missing embeds.data TypeError hatasını atla
    if (err && err.message && err.message.includes("Cannot read properties of undefined (reading 'data')")) {
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

module.exports = client;
client.connect();
