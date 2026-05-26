const { MessageStat, MessageUserChannel, VoiceStat, VoiceUserChannel, StreamerStat, StreamerUserChannel, CameraStat, CameraUserChannel } = require("../../../../../Global/Models")

class GetTools {
    /**
     * - Kullanıcının Kaç günlük verisi olduğunu gün olarak döndüren asenkron bir işlev.
     * - userID ve guildID girilmesi zorunludur yoksa undefined dönecektir.
     *
     * @param {string} userID 
     * @returns {Promise<number|undefined>} - Kullanıcının verilerine göre kaç gün önce verisi olduğu. Eğer kullanıcının verileri bulunamazsa, undefined döner.
     * @throws {Error} - Eksik veya geçersiz parametreler olduğunda hata fırlatır.
     */
    static async GetDataAge(guildID, userID) {
        if (!userID) {
            console.log("Eksik veya geçersiz parametreler. - FirstDayGet()");
            return;
        }
        try {
            const userData = await MessageStat.findOne({ guildID: guildID, userID: userID } );

            if (userData && userData.date) {
                const firstDate = userData.date; // İlk veri tarihi
                const today = new Date(); // Şu anki tarih
                const timeDifferenceMs = today - firstDate;
                const daysDifference = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));
                const hoursDifference = Math.floor(timeDifferenceMs / (1000 * 60 * 60));
                const minutesDifference = Math.floor(timeDifferenceMs / (1000 * 60));

                if (daysDifference === 0) {
                    if (hoursDifference === 0) {
                        return minutesDifference + " dakikalık veri";
                    } else {
                        return hoursDifference + " saatlik veri";
                    }
                } else {
                    return daysDifference + " gün " + (hoursDifference % 24) + " saatlik veri";
                }
            } else {
                // Kullanıcının verisi bulunamadıysa 0 döndür
                return undefined;
            }
        } catch (error) {
            throw new Error("Veritabanı işlemi hatası: " + error.message);
        }
    }
}
module.exports = { GetTools }