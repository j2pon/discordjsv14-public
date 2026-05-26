const inviteEngelPattern = /([h|-|||#|{|🇭]+[t|7|🇹|✝️]{2,}[p|🇵|🅿️]+[s|5|§|🇸]+)/i;
const regex = [
  "([h|\\|\\-\\||#|\\}\\{|🇭]+[t|7|🇹|✝️]{2,}[p|🇵|🅿️]+[s|5|§|🇸]+)",
  "([h|\\|\\-\\||#|\\}\\{|🇭]+[t|7|🇹|✝️]{2,}[p|🇵|🅿️]+)",
  "(w|vv|uu|🇼){3,}.+",
  "([d|🇩]+[i|1|!|l|🇮|ℹ️]?[s|5|§|🇸]+[c|€|🇨|©️]+[o|0|🇴|🅾️⭕]?[r|🇷|®️]+[d|🇩]+.+[g|9|🇬]{2,})",
  "([d|🇩]+[i|1|!|l|🇮|ℹ️]?[s|5|§|🇸]+[c|€|🇨|©️]+[o|0|🇴|🅾️⭕]?[r|🇷|®️]+[d|🇩]+.+[c|€|🇨|©️]+[o|0|🇴|🅾️⭕]?[m|nn|rn|🇲|Ⓜ️]+)",
  "([c|€|🇨|©️]+[o|0|🇴|🅾️⭕]?[m|nn|rn|🇲|Ⓜ️]+:+/+/)",
  "(.+\s*(g|9|🇬){2,}\s*/+)",
  "(.+(c|€|🇨|©️)+(o|0|🇴|🅾️⭕)+(m|nn|rn|🇲|Ⓜ️)+)"
];

// Komut kanalları için liste (ID veya isim tutulabilir; önerilen: kanal ID'leri)
// Setup.BotCommandsChannel sadece uyarı metinleri için kullanılır; sınır kaldırıldığından
// kontrol fonksiyonu her zaman true döner (Ship komutu kendi içinde ayrı kontrol ediyor).
const setup = require("./Setup.json");
const rawKomutKanalIsimleri = [
  setup.BotCommandsChannel || "ᛪ-bot-commands",
];

// includes çağrısını her zaman true döndürecek proxy (eski if (!includes) guard'larını pasifleştirir)
const KomutKullanımKanalİsim = new Proxy(rawKomutKanalIsimleri, {
  get(target, prop, receiver) {
    if (prop === "includes") {
      return function () {
        return true;
      };
    }
    return Reflect.get(target, prop, receiver);
  },
});

// Komut kanal kontrolü: sınırlandırma kaldırıldı, her zaman true
function isAllowedCommandChannel() {
  return true;
}

// Uyarı mesajı için kanal listesini düzgün formatla (sadece Ship vb. için görsel amaçlı)
function formatAllowedChannels(client) {
  return rawKomutKanalIsimleri
    .map((x) => {
      const val = String(x);
      const looksLikeId = /^\d{16,}$/.test(val);

      if (client?.channels?.cache) {
        let chan = null;
        if (looksLikeId) {
          chan = client.channels.cache.get(val) || null;
        }
        if (!chan) {
          chan = client.channels.cache.find(
            (c) =>
              c.name &&
              !looksLikeId &&
              c.name.toLowerCase().includes(val.toLowerCase())
          );
        }
        if (chan) return `${chan}`;
      }

      return looksLikeId ? `<#${val}>` : `\`${val}\``;
    })
    .join(", ");
}

module.exports = {

KomutKullanımKanalİsim,
isAllowedCommandChannel,
formatAllowedChannels,

logs: [
    { name: "guard_log" },
    { name: "message_log" },
    { name: "voice_log" },
    { name: "taglı_log" },
    { name: "rol_log" },
    { name: "boost_log" },
    { name: "yetki_log" },
    { name: "komut_log" },
    { name: "register_log" },
    { name: "mute_log" },
    { name: "vmute_log" },
    { name: "jail_log" },
    { name: "timeout_log" },
    { name: "şüpheli_log" },
    { name: "ban_log" },
    { name: "warn_log" },
    { name: "cezapuan-log" },
    { name: "level_log" },
    { name: "rank_log" },
    { name: "bot_log" }
],

emojis: [
    { name: "server_star", url: "https://cdn.discordapp.com/emojis/1101607452329386004.gif?size=80&quality=lossless" },
    { name: "server_carpi", url: "https://cdn.discordapp.com/emojis/1040686177092644884.gif?size=80&quality=lossless" },
    { name: "server_onay", url: "https://cdn.discordapp.com/emojis/1040686189939789975.gif?size=80&quality=lossless" },
    { name: "server_ok", url: "https://cdn.discordapp.com/emojis/901441275381817426.gif?size=44" },
    { name: "server_loading", url: "https://cdn.discordapp.com/emojis/1126561169923129408.gif?size=80&quality=lossless" },
    { name: "slotgif", url: "https://cdn.discordapp.com/emojis/931686726567612426.gif?v=1" },
    { name: "slotpatlican", url: "https://cdn.discordapp.com/emojis/931686717902192660.png?size=44" },
    { name: "slotkiraz", url: "https://cdn.discordapp.com/emojis/931686708037185546.png?size=44" },
    { name: "slotkalp", url: "https://cdn.discordapp.com/emojis/931686698138603610.png?size=44" },
    { name: "sayiEmoji_sifir", url: "https://cdn.discordapp.com/emojis/1116077425474940958.webp?size=80&quality=lossless" },
    { name: "sayiEmoji_bir", url: "https://cdn.discordapp.com/emojis/1116077394109927514.webp?size=80&quality=lossless" },
    { name: "sayiEmoji_iki", url: "https://cdn.discordapp.com/emojis/1116077397247262881.webp?size=80&quality=lossless" },
    { name: "sayiEmoji_uc", url: "https://cdn.discordapp.com/emojis/1116077400887930910.webp?size=80&quality=lossless" },
    { name: "sayiEmoji_dort", url: "https://cdn.discordapp.com/emojis/1116077404872515594.webp?size=80&quality=lossless" },
    { name: "sayiEmoji_bes", url: "https://cdn.discordapp.com/emojis/1116077408186015774.webp?size=80&quality=lossless" },
    { name: "sayiEmoji_alti", url: "https://cdn.discordapp.com/emojis/1116077411319152660.webp?size=80&quality=lossless" },
    { name: "sayiEmoji_yedi", url: "https://cdn.discordapp.com/emojis/1116077414825603204.webp?size=80&quality=lossless" },
    { name: "sayiEmoji_sekiz", url: "https://cdn.discordapp.com/emojis/1116077419275763803.webp?size=80&quality=lossless" },
    { name: "sayiEmoji_dokuz", url: "https://cdn.discordapp.com/emojis/1116077422417301554.webp?size=80&quality=lossless" },
    { name: "server_spotify", url: "https://cdn.discordapp.com/emojis/899337292840312912.png?size=44" },
    { name: "server_netflix", url: "https://cdn.discordapp.com/emojis/941993358518284298.webp?size=96&quality=lossless" },
    { name: "server_exxen", url: "https://cdn.discordapp.com/emojis/900396713116835900.png?size=44" },
    { name: "server_blutv", url: "https://cdn.discordapp.com/emojis/900396707362246666.png?size=44" },
    { name: "server_nitro", url: "https://cdn.discordapp.com/emojis/1104071976814903358.webp?size=80&quality=lossless" },
    { name: "server_youtube", url: "https://cdn.discordapp.com/emojis/941993963013935115.gif?size=96&quality=lossless" },
    { name: "server_erkek", url: "https://cdn.discordapp.com/emojis/1093482531812278282.webp?size=80&quality=lossless" },
    { name: "server_kadin", url: "https://cdn.discordapp.com/emojis/1101599956982321182.webp?size=80&quality=lossless" },
    { name: "server_nokta", url: "https://cdn.discordapp.com/emojis/1057358623547859045.webp?size=80&quality=lossless" },
    { name: "server_nokta1", url: "https://cdn.discordapp.com/emojis/1056659868502720642.webp?size=80&quality=lossless" },
    { name: "server_nokta2", url: "https://cdn.discordapp.com/emojis/1057358629180801195.webp?size=80&quality=lossless" },
    { name: "BlueStart", url: "https://cdn.discordapp.com/emojis/1056980594707402782.webp?size=80&quality=lossless" },
    { name: "BlueMid", url: "https://cdn.discordapp.com/emojis/1056980428499722270.webp?size=80&quality=lossless" },
    { name: "BlueEnd", url: "https://cdn.discordapp.com/emojis/1056980464788840628.webp?size=80&quality=lossless" },
    { name: "EmptyStart", url: "https://cdn.discordapp.com/emojis/1056636223977959494.webp?size=80&quality=lossless" },
    { name: "EmptyMid", url: "https://cdn.discordapp.com/emojis/1056636233348038686.webp?size=80&quality=lossless" },
    { name: "EmptyEnd", url: "https://cdn.discordapp.com/emojis/1056636221805318164.webp?size=80&quality=lossless" },
    { name: "server_star2", url: "https://cdn.discordapp.com/emojis/1172857590653395044.webp?size=80&quality=lossless" },
    { name: "server_info", url: "https://cdn.discordapp.com/emojis/1172857628825763910.webp?size=80&quality=lossless" },
    { name: "server_members", url: "https://cdn.discordapp.com/emojis/1172857608265269248.webp?size=80&quality=lossless" },
    { name: "j2pon_booster", url : "https://cdn.discordapp.com/emojis/1475452067744059464.webp?size=96&animated=true" },
    { name: "j2pon_bag", url : "https://cdn.discordapp.com/emojis/1475497682964316170.webp?size=96" },
    { name: "j2pon_alt", url : "https://cdn.discordapp.com/emojis/1475908061066428579.webp?size=96" },
    { name: "j2pon_ust", url : "https://cdn.discordapp.com/emojis/1475908024135847976.webp?size=96" },

],

 emojis2: [
    { name: "koc", url: "https://cdn.discordapp.com/emojis/1114231714542268536.webp?size=80&quality=lossless" },
    { name: "boga", url: "https://cdn.discordapp.com/emojis/1114231418919338115.webp?size=80&quality=lossless" },
    { name: "aslan", url: "https://cdn.discordapp.com/emojis/1114231623928516688.webp?size=80&quality=lossless" },
    { name: "balik", url: "https://cdn.discordapp.com/emojis/1114232488475238481.webp?size=80&quality=lossless" },
    { name: "akrep", url: "https://cdn.discordapp.com/emojis/1114233286294769724.webp?size=80&quality=lossless" },
    { name: "ikizler", url: "https://cdn.discordapp.com/emojis/1114232876402217000.webp?size=80&quality=lossless" },
    { name: "kova", url: "https://cdn.discordapp.com/emojis/1114232691743797348.webp?size=80&quality=lossless" },
    { name: "oglak", url: "https://cdn.discordapp.com/emojis/1114231829025804378.webp?size=80&quality=lossless" },
    { name: "terazi", url: "https://cdn.discordapp.com/emojis/1114233107143471115.webp?size=80&quality=lossless" },
    { name: "yay", url: "https://cdn.discordapp.com/emojis/1114231945258356886.webp?size=80&quality=lossless" },
    { name: "basak", url: "https://cdn.discordapp.com/emojis/1114232357738774588.webp?size=80&quality=lossless" },
    { name: "yengec", url: "https://cdn.discordapp.com/emojis/1114232070965833841.webp?size=80&quality=lossless" },
    { name: "beyaz", url: "https://cdn.discordapp.com/emojis/1114580728823431358.webp?size=80&quality=lossless" },
    { name: "kahverengi", url: "https://cdn.discordapp.com/emojis/1114234991241605180.webp?size=80&quality=lossless" },
    { name: "kirmizi", url: "https://cdn.discordapp.com/emojis/1114580727212814446.webp?size=80&quality=lossless" },
    { name: "mor", url: "https://cdn.discordapp.com/emojis/1114580725782556812.webp?size=80&quality=lossless" },
    { name: "mavi", url: "https://cdn.discordapp.com/emojis/1114234989622612052.webp?size=80&quality=lossless" },
    { name: "yesil", url: "https://cdn.discordapp.com/emojis/1114234992864796743.webp?size=80&quality=lossless" },
    { name: "pembe", url: "https://cdn.discordapp.com/emojis/1114234998774583436.webp?size=80&quality=lossless" },
    { name: "siyah", url: "https://cdn.discordapp.com/emojis/1114234987726778451.webp?size=80&quality=lossless" },
    { name: "alone", url: "https://cdn.discordapp.com/emojis/1114230711524798514.webp?size=80&quality=lossless" },
    { name: "couple", url: "https://cdn.discordapp.com/emojis/1114230338353385582.webp?size=80&quality=lossless" },
    { name: "fivem", url: "https://cdn.discordapp.com/emojis/1114236421289554002.webp?size=80&quality=lossless" },
    { name: "fortnite", url: "https://cdn.discordapp.com/emojis/1114236464264396881.webp?size=80&quality=lossless" },
    { name: "gta", url: "https://cdn.discordapp.com/emojis/1114236419934781490.webp?size=80&quality=lossless" },
    { name: "mlbb", url: "https://cdn.discordapp.com/emojis/1114237380182954154.webp?size=80&quality=lossless" },
    { name: "pubg", url: "https://cdn.discordapp.com/emojis/1114236424124903485.webp?size=80&quality=lossless" },
    { name: "valorant", url: "https://cdn.discordapp.com/emojis/1114237293813829673.webp?size=80&quality=lossless" },
    { name: "csgo", url: "https://cdn.discordapp.com/emojis/1114236461936554135.webp?size=80&quality=lossless" },
    { name: "lol", url: "https://cdn.discordapp.com/emojis/1114236422396846233.webp?size=80&quality=lossless" },
    { name: "minecraft", url: "https://cdn.discordapp.com/emojis/1114236425462886420.webp?size=80&quality=lossless" },
    { name: "cekilis", url: "https://cdn.discordapp.com/emojis/1123196444845813800.gif?size=80&quality=lossless" },
    { name: "etkinlik", url: "https://cdn.discordapp.com/emojis/1123196230437175306.gif?size=80&quality=lossless" },
  ],

  
   emojis3: [
  
    { name: "appEmoji_create", url: "https://cdn.discordapp.com/emojis/1118234416121122917.webp?size=80&quality=lossless" },
    { name: "appEmoji_kilidac", url: "https://cdn.discordapp.com/emojis/1117696615298371664.webp?size=80&quality=lossless" },
    { name: "appEmoji_kilitkapat", url: "https://cdn.discordapp.com/emojis/1117696617315831892.webp?size=80&quality=lossless" },
    { name: "appEmoji_cop", url: "https://cdn.discordapp.com/emojis/1117696603466244096.webp?size=80&quality=lossless" },
    { name: "appEmoji_cikar", url: "https://cdn.discordapp.com/emojis/1117696601633333319.webp?size=80&quality=lossless" },
    { name: "appEmoji_ekle", url: "https://cdn.discordapp.com/emojis/1117696607475994646.webp?size=80&quality=lossless" },
    { name: "appEmoji_gorunmez", url: "https://cdn.discordapp.com/emojis/1117696609766092941.webp?size=80&quality=lossless" },
    { name: "appEmoji_gorunur", url: "https://cdn.discordapp.com/emojis/1117696613318672464.webp?size=80&quality=lossless" },
    { name: "appEmoji_duzenle", url: "https://cdn.discordapp.com/emojis/1117696605563387975.webp?size=80&quality=lossless" },
  ],

    emojis4: [
    "server_star",
    "server_carpi",
    "server_onay",
    "server_ok",
    "server_loading",
    "slotgif",
    "slotpatlican",
    "slotkiraz",
    "slotkalp",
    "sayiEmoji_sifir",
    "sayiEmoji_bir",
    "sayiEmoji_iki",
    "sayiEmoji_uc",
    "sayiEmoji_dort",
    "sayiEmoji_bes",
    "sayiEmoji_alti",
    "sayiEmoji_yedi",
    "sayiEmoji_sekiz",
    "sayiEmoji_dokuz",
    "server_spotify",
    "server_netflix",
    "server_exxen",
    "server_blutv",
    "server_nitro",
    "server_youtube",
    "server_erkek",
    "server_kadin",
    "server_nokta",
    "server_nokta1",
    "server_nokta2",
    "BlueStart",
    "BlueMid",
    "BlueEnd",
    "EmptyStart",
    "EmptyMid",
    "EmptyEnd",
    "koc", "boga", "aslan", "balik", "akrep", "ikizler", "kova", "oglak", "terazi", "yay", "basak", "yengec",
    "beyaz", "kahverengi", "kirmizi", "mor", "mavi", "yesil", "pembe", "siyah",
    "alone", "couple", "fivem", "fortnite", "gta", "mlbb", "pubg", "valorant", "csgo", "lol", "minecraft",
    "cekilis", "etkinlik",
    "appEmoji_create", "appEmoji_kilidac", "appEmoji_kilitkapat", "appEmoji_cop", "appEmoji_cikar", "appEmoji_ekle", "appEmoji_gorunmez", "appEmoji_gorunur", "appEmoji_duzenle",
    "appEmoji_kilidac",
    "appEmoji_kilitkapat",
    "appEmoji_cop",
    "appEmoji_cikar",
    "appEmoji_duzenle",
    "appEmoji_gorunmez",
    "appEmoji_gorunur",
    "appEmoji_create",
    "appEmoji_ekle",
    "appEmoji_kilitkapat",
  ],

  roles: [
    { name: "▬▬▬▬▬▬▬▬▬▬▬", color: "000000"},
    { name: "Cekilis Duyuru", color: "#f5f5f5" },
    { name: "Etkinlik Duyuru", color: "#f5f5f5" },
    { name: "▬▬▬▬▬▬▬▬▬▬▬", color: "000000"},
    { name: "Kirmizi", color: "#ff0000" },
    { name: "Siyah", color: "#090909" },
    { name: "Beyaz", color: "#ffffff" },
    { name: "Mavi", color: "#00b4ff" },
    { name: "Yeşil", color: "#10dd28" },
    { name: "Kahverengi", color: "#76400e" },
    { name: "Mor", color: "#9a00ff" },
    { name: "Pembe", color: "#ff00ee" },
    { name: "▬▬▬▬▬▬▬▬▬▬▬", color: "000000"},
    { name: "▬▬▬▬▬▬▬▬▬▬▬", color: "000000"},
    { name: "Couple", color: "#ff0000" },
    { name: "Alone", color: "#2e5a6e" },
    { name: "▬▬▬▬▬▬▬▬▬▬▬", color: "000000"},
    { name: "CSGO", color: "ffa7a7" },
    { name: "LOL", color: "ffa7a7" },
    { name: "Valorant", color: "ffa7a7" },
    { name: "Gta V", color: "ffa7a7"},
    { name: "PUBG", color: "ffa7a7" },
    { name: "Fortnite", color: "ffa7a7" },
    { name: "Minecraft", color: "ffa7a7" },
    { name: "MLBB", color: "ffa7a7" },
    { name: "FiveM" , color: "ffa7a7"},
    { name: "▬▬▬▬▬▬▬▬▬▬▬", color: "000000"},
],

küfürler: ["allahoc","allahoç","allahamk","allahaq","0r0spuc0cu","4n4n1 sk3r1m","p1c","@n@nı skrm","evladi","orsb","orsbcogu","amnskm","anaskm","oc","abaza","abazan","ag",
"a\u011fz\u0131na s\u0131\u00e7ay\u0131m","fuck","shit","ahmak","seks","sex","allahs\u0131z","amar\u0131m","ambiti","am biti","amc\u0131\u011f\u0131","amc\u0131\u011f\u0131n",
"amc\u0131\u011f\u0131n\u0131","amc\u0131\u011f\u0131n\u0131z\u0131","amc\u0131k","amc\u0131k ho\u015faf\u0131","amc\u0131klama","amc\u0131kland\u0131","amcik","amck","amckl",
"amcklama","amcklaryla","amckta","amcktan","amcuk","am\u0131k","am\u0131na","amına","am\u0131nako","am\u0131na koy","am\u0131na koyar\u0131m","am\u0131na koyay\u0131m","am\u0131nakoyim",
"am\u0131na koyyim","am\u0131na s","am\u0131na sikem","am\u0131na sokam","am\u0131n feryad\u0131","am\u0131n\u0131","am\u0131n\u0131 s","am\u0131n oglu","am\u0131no\u011flu","am\u0131n o\u011flu",
"am\u0131s\u0131na","am\u0131s\u0131n\u0131","amina","amina g","amina k","aminako","aminakoyarim","amina koyarim","amina koyay\u0131m","amina koyayim","aminakoyim","aminda",
"amindan","amindayken","amini","aminiyarraaniskiim","aminoglu","amin oglu","amiyum","amk","amkafa","amk \u00e7ocu\u011fu","amlarnzn","aml\u0131","amm","ammak","ammna","amn",
"amna","amnda","amndaki","amngtn","amnn","amona","amq","ams\u0131z","amsiz","amsz","amteri","amugaa","amu\u011fa","amuna","ana","anaaann","anal","analarn","anam","anamla",
"anan","anana","anandan","anan\u0131","anan\u0131","anan\u0131n","anan\u0131n am","anan\u0131n am\u0131","anan\u0131n d\u00f6l\u00fc","anan\u0131nki","anan\u0131sikerim",
"anan\u0131 sikerim","anan\u0131sikeyim","anan\u0131 sikeyim","anan\u0131z\u0131n","anan\u0131z\u0131n am","anani","ananin","ananisikerim","anani sikerim","ananisikeyim",
"anani sikeyim","anann","ananz","anas","anas\u0131n\u0131","anas\u0131n\u0131n am","anas\u0131 orospu","anasi","anasinin","anay","anayin","angut","anneni","annenin","annesiz",
"anuna","aq","a.q","a.q.","aq.","ass","atkafas\u0131","atm\u0131k","att\u0131rd\u0131\u011f\u0131m","attrrm","auzlu","avrat","ayklarmalrmsikerim","azd\u0131m","azd\u0131r",
"azd\u0131r\u0131c\u0131","babaannesi ka\u015far","baban\u0131","baban\u0131n","babani","babas\u0131 pezevenk","baca\u011f\u0131na s\u0131\u00e7ay\u0131m","bac\u0131na",
"bac\u0131n\u0131","bac\u0131n\u0131n","bacini","bacn","bacndan","bacy","bastard","b\u0131z\u0131r","bitch","biting","boner","bosalmak","bo\u015falmak","cenabet",
"cibiliyetsiz","cibilliyetini","cibilliyetsiz","cif","cikar","cim","\u00e7\u00fck","dalaks\u0131z","dallama","daltassak","dalyarak","dalyarrak","dangalak","dassagi",
"diktim","dildo","dingil","dingilini","dinsiz","dkerim","domal","domalan","domald\u0131","domald\u0131n","domal\u0131k","domal\u0131yor","domalmak","domalm\u0131\u015f",
"domals\u0131n","domalt","domaltarak","domalt\u0131p","domalt\u0131r","domalt\u0131r\u0131m","domaltip","domaltmak","d\u00f6l\u00fc","d\u00f6nek","d\u00fcd\u00fck","eben",
"ebeni","ebenin","ebeninki","ebleh","ecdad\u0131n\u0131","ecdadini","embesil","emi","fahise","fahi\u015fe","feri\u015ftah","ferre","fuck","fucker","fuckin","fucking","gavad",
"gavat","giberim","giberler","gibis","gibi\u015f","gibmek","gibtiler","goddamn","godo\u015f","godumun","gotelek","gotlalesi","gotlu","gotten","gotundeki","gotunden","gotune",
"gotunu","gotveren","goyiim","goyum","goyuyim","goyyim","g\u00f6t","g\u00f6t deli\u011fi","g\u00f6telek","g\u00f6t herif","g\u00f6tlalesi","g\u00f6tlek","g\u00f6to\u011flan\u0131",
"g\u00f6t o\u011flan\u0131","g\u00f6to\u015f","g\u00f6tten","g\u00f6t\u00fc","g\u00f6t\u00fcn","g\u00f6t\u00fcne","g\u00f6t\u00fcnekoyim","g\u00f6t\u00fcne koyim","g\u00f6t\u00fcn\u00fc",
"g\u00f6tveren","g\u00f6t veren","g\u00f6t verir","gtelek","gtn","gtnde","gtnden","gtne","gtten","gtveren","hasiktir","hassikome","hassiktir","has siktir","hassittir","haysiyetsiz","hayvan herif",
"ho\u015faf\u0131","h\u00f6d\u00fck","hsktr","huur","\u0131bnel\u0131k","ibina","ibine","ibinenin","ibne","ibnedir","ibneleri","ibnelik","ibnelri","ibneni","ibnenin","ibnerator","ibnesi","idiot",
"idiyot","imansz","ipne","iserim","i\u015ferim","ito\u011flu it","kafam girsin","kafas\u0131z","kafasiz","kahpe","kahpenin","kahpenin feryad\u0131","kaka","kaltak","kanc\u0131k","kancik","kappe",
"karhane","ka\u015far","kavat","kavatn","kaypak","kayyum","kerane","kerhane","kerhanelerde","kevase","keva\u015fe","kevvase","koca g\u00f6t","kodu\u011fmun","kodu\u011fmunun","kodumun","kodumunun",
"koduumun","koyarm","koyay\u0131m","koyiim","koyiiym","koyim","koyum","koyyim","krar","kukudaym","laciye boyad\u0131m","libo\u015f","madafaka","malafat","malak","mcik","meme","memelerini","mezveleli",
"minaamc\u0131k","mincikliyim","mna","monakkoluyum","motherfucker","mudik","oc","oç","ocuu","ocuun","O\u00c7","o\u00e7","o. \u00e7ocu\u011fu","o\u011flan","o\u011flanc\u0131","o\u011flu it","orosbucocuu",
"orospu","orospucocugu","orospu cocugu","orospu \u00e7oc","orospu\u00e7ocu\u011fu","orospu \u00e7ocu\u011fu","orospu \u00e7ocu\u011fudur","orospu \u00e7ocuklar\u0131","orospudur","orospular","orospunun",
"orospunun evlad\u0131","orospuydu","orospuyuz","orostoban","orostopol","orrospu","oruspu","oruspu\u00e7ocu\u011fu","oruspu \u00e7ocu\u011fu","osbir","ossurduum","ossurmak","ossuruk","osur","osurduu",
"osuruk","osururum","otuzbir","\u00f6k\u00fcz","\u00f6\u015fex","patlak zar","penis","pezevek","pezeven","pezeveng","pezevengi","pezevengin evlad\u0131","pezevenk","pezo","pic","pici","picler",
"pi\u00e7","pi\u00e7in o\u011flu","pi\u00e7 kurusu","pi\u00e7ler","pipi","pipi\u015f","pisliktir","porno","pussy","pu\u015ft","pu\u015fttur","rahminde","revizyonist","s1kerim","s1kerm","s1krm",
"sakso","saksofon","saxo","sekis","serefsiz","sevgi koyar\u0131m","sevi\u015felim","sexs","s\u0131\u00e7ar\u0131m","s\u0131\u00e7t\u0131\u011f\u0131m","s\u0131ecem","sicarsin","sie","sik","sikdi",
"sikdi\u011fim","sike","sikecem","sikem","siken","sikenin","siker","sikerim","sikerler","sikersin","sikertir","sikertmek","sikesen","sikesicenin","sikey","sikeydim","sikeyim","sikeym","siki","sikicem",
"sikici","sikien","sikienler","sikiiim","sikiiimmm","sikiim","sikiir","sikiirken","sikik","sikil","sikildiini","sikilesice","sikilmi","sikilmie","sikilmis","sikilmi\u015f","sikilsin","sikim","sikimde",
"sikimden","sikime","sikimi","sikimiin","sikimin","sikimle","sikimsonik","sikimtrak","sikin","sikinde","sikinden","sikine","sikini","sikip","sikis","sikisek","sikisen","sikish","sikismis","siki\u015f",
"siki\u015fen","siki\u015fme","sikitiin","sikiyim","sikiym","sikiyorum","sikkim","sikko","sikleri","sikleriii","sikli","sikm","sikmek","sikmem","sikmiler","sikmisligim","siksem","sikseydin","sikseyidin",
"siksin","siksinbaya","siksinler","siksiz","siksok","siksz","sikt","sikti","siktigimin","siktigiminin","sikti\u011fim","sikti\u011fimin","sikti\u011fiminin","siktii","siktiim","siktiimin","siktiiminin",
"siktiler","siktim","siktim","siktimin","siktiminin","siktir","siktir et","siktirgit","siktir git","siktirir","siktiririm","siktiriyor","siktir lan","siktirolgit","siktir ol git","sittimin","sittir",
"skcem","skecem","skem","sker","skerim","skerm","skeyim","skiim","skik","skim","skime","skmek","sksin","sksn","sksz","sktiimin","sktrr","skyim","slaleni","sokam","sokar\u0131m","sokarim","sokarm",
"sokarmkoduumun","sokay\u0131m","sokaym","sokiim","soktu\u011fumunun","sokuk","sokum","soku\u015f","sokuyum","soxum","sulaleni","s\u00fclaleni","s\u00fclalenizi","s\u00fcrt\u00fck","\u015ferefsiz",
"\u015f\u0131ll\u0131k","taaklarn","taaklarna","tarrakimin","tasak","tassak","ta\u015fak","ta\u015f\u015fak","tipini s.k","tipinizi s.keyim","tiyniyat","toplarm","topsun","toto\u015f","vajina",
"vajinan\u0131","veled","veledizina","veled i zina","verdiimin","weled","weledizina","whore","xikeyim","yaaraaa","yalama","yalar\u0131m","yalarun","yaraaam","yarak","yaraks\u0131z","yaraktr",
"yaram","yaraminbasi","yaramn","yararmorospunun","yarra","yarraaaa","yarraak","yarraam","yarraam\u0131","yarragi","yarragimi","yarragina","yarragindan","yarragm","yarra\u011f",
"yarra\u011f\u0131m","yarra\u011f\u0131m\u0131","yarraimin","yarrak","yarram","yarramin","yarraminba\u015f\u0131","yarramn","yarran","yarrana","yarrrak","yavak","yav\u015f","yav\u015fak",
"yav\u015fakt\u0131r","yavu\u015fak","y\u0131l\u0131\u015f\u0131k","yilisik","yogurtlayam","yo\u011furtlayam","yrrak","z\u0131kk\u0131m\u0131m","zibidi","zigsin","zikeyim","zikiiim","zikiim",
"zikik","zikim","ziksiiin","ziksiin","zulliyetini","zviyetini"],

reklamlar: ["http://","https://","cdn.discordapp.com","discordapp.com","discord.app", "discord.gg","discordapp","discordgg", ".com", ".net", ".xyz", ".pw", ".io", ".gg", "www.", "https", "http", ".gl", ".org", ".com.tr", ".biz", ".party", ".rf.gd", ".az"],
inviteEngel:new RegExp(regex),

 iltifatlar:  [
  "Sevmenin gücünün sınırı yoktur.",
  "Geldiğin yerde aşkı aramak zorunda değilsin. Ben senin için buradayım.",
  "Aşkın en büyük hediyesi, dokunduğu her şeyi kutsal kılma yeteneğidir.",
  "Kısa süre önce aşık olduğumuz insanlarla birlikte olmaktan duyduğumuz derin sevinç gizlenemez.",
  "Bir manzara olduğundan habersiz duruşun.",
  "Öpüyorum gökyüzü gibi bakan gözlerinden.",
  "Güneşi olmayan kalbe gökkuşağı açtırdın güzel insan.",
  "Sonra mucize diye bir şeyden bahsettiler. Gözlerin geldi aklıma.",
  "Biraz güler misin? İlaç alacak param yok da.",
  "Sen yeter ki çocukluk yap. Gönlümde salıncağın hazır.",
  "Dokunmadan sevmenin mümkün olduğunu senden öğrendim.",
  "Senin gülüşün benim en sevdiğim mevsim.",
  "Hayal ettiğim ne varsa seninle yaşamak istiyorum.",
  "Bazen öyle güzel gülüyorsun ki, bütün dünya kör olsun istiyorum.",
  "Mutluluk nedir dediler, yanında geçirdiğim anların anlamını anlatamadım.",
  "Üzerinde pijama olsa bile, nasıl oluyor da her zaman bu kadar güzel görünüyorsun? Merhaba, neden bu kadar güzel olduğunu bilmek istiyorum.",
  "Etrafımda olduğunda başka bir şeye ihtiyacım olmuyor.",
  "Seni hak edecek ne yaptım bilmiyorum. Nasıl bu kadar şanslı olabilirim?",
  "Kahverengi gözlerinle gökyüzü gibi bakıyorsun.",
  "Sen olmadan nasıl var olacağımı bilmiyorum.",
  "Narinliğini gören kelebekler seni kıskanır.",
  "Geceyi aydınlatan ay misali senin parlayan gözlerin ışık saçıyor gönlüme.",
  "Güneşe gerek yok, gözlerindeki sıcaklık içimi ısıtıyor.",
  "Bir insanın gülüşünden cennet mi görünür? Bir gülüyorsun cennetten bir fragman yayınlanıyor sanki.",
  "Güneş mi doğdu yoksa sen mi uyandın?",
  "Sabahları görmek istediğim ilk şey sensin.",
  "Seni senden daha çok seviyorum anlasana.",
  "Hayatım tamamen senin üzerine kurulu.",
  "Gel de, kapında yatayım, git de, kölen olayım.",
  "Gözlerinin renginde boğulmuşum ben.",
  "Burası huzur kokmuş buradan geçmişsin belli.",
  "Manzara seyretmek için gidilen bir yerde bile senden güzel bir görsel olamaz.",
  "Ne kadar fedakar olursanız olsun, adı gün gelir “yapmasaydın” olur.",
  "O kadar iyi bir arkadaşsın ki, tanıştığın herkes için mükemmel bir hediye gibisin.",
  "Su gibi duru güzelliğin karşısında dili tutulur tüm şairlerin.",
  "Sen daha önce hiç yazılamamış bir şiirin en güzel mısrası gibisin. Öyle gizlenmiş, kendine saklanmış, eşsiz.",
  "Kusursuz tavırların var. Korkunç kararlar verdiğimde beni yargılamadığın için sana minnettarım.",
  "Tek bir göz hareketiyle aklımı başımdan alan tek kadınsın.",
  "Ben senin kirpiklerinin rastgele dizildiğine inanmıyorum.",
  "Sen muhteşemin kelime anlamının tam karşılığısın.",
  "Bana şair diyorlar da senin şiir olduğunu göremiyorlar.",
  "Bir gülüşün etrafa ışıklar saçtığını sen de gördüm.",
  "Güzelliğini anlatacak kadar zengin bir lisan yok dünyada.",
  "Yaşanılacak en güzel mevsim sensin.",
  "Sıradanlaşmış her şeyi, ne çok güzelleştiriyorsun.",
  "Gönlüm bir şehir ise o şehrin tüm sokakları sana çıkar.",
  "Birilerinin benim için ettiğinin en büyük kanıtı seninle karşılaşmam.",
  "Denize kıyısı olan şehrin huzuru birikmiş yüzüne.",
  "Ben çoktan şairdim ama senin gibi şiiri ilk defa dinliyorum.",
  "Gece yatağa yattığımda aklımda kalan tek gerçek şey sen oluyorsun.",
  "Ne tatlısın sen öyle. Akşam gel de iki bira içelim.",
  "Bir gamzen var sanki cennette bir çukur.",
  "Gecemi aydınlatan yıldızımsın.",
  "Ponçik burnundan ısırırım seni",
  "Bu dünyanın 8. harikası olma ihtimalin?",
  "Dilek tutman için yıldızların kayması mı gerekiyor illa ki? Gönlüm gönlüne kaydı yetmez mi?",
  "Süt içiyorum yarım yağlı, mutluluğum sana bağlı.",
  "Müsaitsen aklım bu gece sende kalacak.",
  "Gemim olsa ne yazar liman sen olmadıktan sonra...",
  "Gözlerimi senden alamıyorum çünkü benim tüm dünyam sensin.",
  "Sabahları görmek istediğim ilk şey sensin.",
  "lulunun götü cok güzel",
  "Mutluluk ne diye sorsalar, cevabı gülüşünde ve o sıcak bakışında arardım.",
  "Hayatım ne kadar saçma olursa olsun, tüm hayallerimi destekleyecek bir kişi var. O da sensin, mükemmel insan.",
  "Bir adada mahsur kalmak isteyeceğim kişiler listemde en üst sırada sen varsın.",
  "Sesini duymaktan- hikayelerini dinlemekten asla bıkmayacağım. Konuşmaktan en çok zevk aldığım kişi sensin.",
  "Üzerinde pijama olsa bile, nasıl oluyor da her zaman bu kadar güzel görünüyorsun? Merhaba, neden bu kadar güzel olduğunu bilmek istiyorum.",
  "Çok yorulmuş olmalısın. Bütün gün aklımda dolaşıp durdun.",
  "Çocukluk yapsan da gönlüme senin için salıncak mı kursam?",
  "Sen birazcık huzur aradığımda gitmekten en çok hoşlandığım yersin.",
  "Hangi çiçek anlatır güzelliğini? Hangi mevsime sığar senin adın. Hiçbir şey yeterli değil senin güzelliğine erişmeye. Sen eşsizsin...",
  "Rotanızı geçen her geminin ışığıyla değil, yıldızlara göre ayarlayın.",
  "Telaşımı hoş gör, ıslandığım ilk yağmursun.",
  "Gülüşün ne güzel öyle, cumhuriyetin bir gelişi gibi sanki"
]
}