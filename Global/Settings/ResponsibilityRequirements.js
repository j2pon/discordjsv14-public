module.exports = {
    ResponsibilityTasks: {
        AltYetki: {
            duration: 7,
            tasks: {
                yetkili: { label: "Yetkili Alım Sorumlusu", req: { yetkili: 7, invite: 20 } },
                streamer: { label: "Streamer Sorumlusu", req: { stream: 30 * 60 * 60 * 1000 } }, // 30 saat MS
                public: { label: "Public Sorumlusu", req: { voice: 30 * 60 * 60 * 1000, message: 5000 } },
                rehberlik: { label: "Rehber Sorumlusu", req: { oryantasyon: 10 } },
                register: { label: "Teyit Sorumlusu", req: { register: 50, tagli: 10 } },
                sorunCozucu: { label: "Sorun Çözücü", req: { voice: 30 * 60 * 60 * 1000 } },
                etkinlik: { label: "Etkinlik Sorumlusu", req: { voice: 30 * 60 * 60 * 1000 } }
            }
        },
        OrtaYetki: {
            duration: 14,
            tasks: {
                yetkili: { label: "Yetkili Alım Sorumlusu", req: { yetkili: 14, invite: 40 } },
                streamer: { label: "Streamer Sorumlusu", req: { stream: 60 * 60 * 60 * 1000 } },
                register: { label: "Teyit Sorumlusu", req: { register: 100, tagli: 20 } },
                sorunCozucu: { label: "Sorun Çözücü", req: { voice: 60 * 60 * 60 * 1000 } },
                etkinlik: { label: "Etkinlik Sorumlusu", req: { voice: 60 * 60 * 60 * 1000 } }
            }
        },
        UstYetki: {
            duration: 30,
            tasks: {
                yetkili: { label: "Yetkili Alım Sorumlusu", req: { yetkili: 21, invite: 60 } },
                streamer: { label: "Streamer Sorumlusu", req: { stream: 90 * 60 * 60 * 1000 } },
                register: { label: "Teyit Sorumlusu", req: { register: 150, tagli: 30 } },
                sorunCozucu: { label: "Sorun Çözücü", req: { voice: 90 * 60 * 60 * 1000 } },
                etkinlik: { label: "Etkinlik Sorumlusu", req: { voice: 90 * 60 * 60 * 1000 } }
            }
        }
    },
    MainTasks: {
        yetkiliAlim: { label: "YETKİLİ ALIM", req: { yetkili: 5 } },
        invite: { label: "İNVİTE", req: { invite: 10 } },
        chat: { label: "CHAT", req: { message: 5000 } }
    }
}
