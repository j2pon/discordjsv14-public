const { Client, Partials, Collection, ApplicationCommandType, Options, Events } = require('discord.js');
const { recursiveReadDirSync } = require('../../../../../Global/Helpers/Utils');
const path = require("path");
const { initializeMongoose } = require("../DataBase/Mongoose");

class j2pon extends Client {
    constructor(options) {
        super({
          intents: [ 3276799 ],
          partials: [
            Partials.User, 
            Partials.Channel, 
            Partials.GuildMember,
            Partials.Message,
            Partials.Reaction,
            Partials.GuildScheduledEvent,
            Partials.ThreadMember
          ],
        });

        this.aliases = new Collection();
        this.invites = new Collection(); 

        this.directory = options.Directory;
        this.token = options.token;

        require("../../../../../Global/Helpers/Dates");
        require("../../../../../Global/Helpers/Numbers");

 
        this.sistem = global.system = require("../../../../../Global/Settings/System");
        this.logger = global.logger = require("../../../../../Global/Helpers/Logger");
        this.replys = global.replys = require("../../../../../Global/Helpers/Replys");

        this.on("unhandledRejection", async (err) => {
            // DAVE protokolü hatası normal, görmezden gel
            if (err && err.message && (err.message.includes('DAVE') || err.message.includes('davey'))) {
                return;
            }
            // MongoDB hatalarını atla
            if (err && (err.message && (err.message.includes('MongooseError') || err.message.includes('buffering timed out') || err.message.includes('querySrv') || err.message.includes('ETIMEOUT') || err.message.includes('No compatible encryption modes')))) {
                return;
            }
            this.logger.error(`${this.directory} ERROR => ` + err);
        });

        this.on("guildUnavailable", async (guild) => { this.logger.error(`[UNAVAIBLE GUILD]: ${guild.name}`) });
        this.on("disconnect", async () => { this.logger.error(`Bot is disconnecting...`, this.directory) })
        this.on("reconnecting", async () => { this.logger.error(`Bot reconnecting...`, this.directory) })
        this.on("error", async (e) => { this.logger.error(` => Error`, e)})
        this.on("warn", async (info) => { this.logger.error(` => Warn`, info) })
        this.on("warning", async (warn) => { this.logger.error(` => Warn`, warn) })
        this.on("beforeExit", async () => { this.logger.error("The system is shutting down...", this.directory) })
        this.on("uncaughtException", async (err) => {
            // DAVE protokolü hatası normal, görmezden gel
            if (err && err.message && (err.message.includes('DAVE') || err.message.includes('davey'))) {
                return;
            }
            // MongoDB hatalarını atla
            if (err && (err.message && (err.message.includes('MongooseError') || err.message.includes('buffering timed out') || err.message.includes('querySrv') || err.message.includes('ETIMEOUT') || err.message.includes('No compatible encryption modes')))) {
                return;
            }
            const hata = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
            this.logger.error(` => Unexpected Error`, hata);
        });
        
        // Process-level error handlers
        process.on("unhandledRejection", (err) => {
            // DAVE protokolü hatası normal, görmezden gel
            if (err && err.message && (err.message.includes('DAVE') || err.message.includes('davey'))) {
                return;
            }
            // Discord Giveaways missing embeds.data TypeError hatasını atla
            if (err && err.message && err.message.includes("Cannot read properties of undefined (reading 'data')")) {
                return;
            }
            this.logger.error(` => Unhandled Rejection`, err);
        });
        
        process.on("uncaughtException", (err) => {
            // DAVE protokolü hatası normal, görmezden gel
            if (err && err.message && (err.message.includes('DAVE') || err.message.includes('davey'))) {
                return;
            }
            this.logger.error(` => Uncaught Exception`, err);
        });
    }

    loadClient(options) {
        this.logger.log(`Eventler ve Veri Tabanı Yükleniyor...`);
        if(options.Events) {
            let success = 0;
            let failed = 0;

            const Events = recursiveReadDirSync("src/events");
            for (const file of Events) {
            try {
               const event = require(file);
               delete require.cache[require.resolve(file)];
               success += 1;
            } catch (ex) { failed += 1; this.logger.error(`${file} HATA-EVENT => ${ex.message}`); }
      }
  
            this.logger.debug(`${success + failed} event yüklendi. Başarılı (${success}) Başarısız (${failed})`);
        }


    }
    async registerInteractions(guildId) {
        const toRegister = [];
        
    
        // Register GLobally
        if (!guildId) { await this.application.commands.set(toRegister); }
    
        else if (guildId && typeof guildId === "string") {
          const guild = this.guilds.cache.get(guildId);
          if (!guild) { this.logger.error(`${guildId} sunucusundaki etkileşimler kaydedilemedi`, new Error("Eşleşen lonca yok")); return; }
          await guild.commands.set(toRegister);
        }
    
        else { throw new Error("Etkileşimleri kaydetmek için geçerli bir lonca kimliği sağladınız mı?"); }
    
        this.logger.debug(`Başarıyla ${guildId ? "sunucuya etkileşimler" : " sunuculara etkileşimler"} kaydedildi`);
      }
      
  
    async connect() {
        if(!this.token) {
            this.logger.error(`${this.directory} => Tokeni girilmediğinden dolayı bot kapanıyor...`);
            process.exit()
            return;
        }

        await this.login(this.token).then(() => { 
            this.once(Events.ClientReady, async () => {
                let guild = this.guilds.cache.get(this.sistem.ServerID);
                if(!guild) {
                    return process.exit();
                }
            })
        }).catch(err => { 
            this.logger.log(`${this.directory} => Botun tokeni doğrulanamadı. 5 Saniye sonra tekrardan denenecektir...`)
            setTimeout(() => {
                this.login(this.token).catch(() => {
                    this.logger.error(`${this.directory} => Bot tokeni tamamiyle doğrulanamadı.. Bot kapanıyor...`)
                    process.exit()
                })
            }, 5000 )
        }) 
    };
}
module.exports = { j2pon }
