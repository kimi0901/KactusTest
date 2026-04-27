// Phrase dictionary keyed by BCP-47 language tag.
// Each entry: { wait, waitSub, howmuch, discount, morning, noon, evening, thanks, currency }
// Kept hand-written — translations vetted for everyday traveler use.
window.PHRASES = {
  "en-US": {
    wait:     "Please wait a moment.",
    waitSub:  "I'll use a translator.",
    howmuch:  "How much is this?",
    discount: "Can you give me a discount?",
    morning:  "Good morning.",
    noon:     "Hello.",
    evening:  "Good evening.",
    thanks:   "Thank you very much.",
    priceFmt: (n) => "That's " + n + ", right?",
    currency: "$"
  },
  "zh-CN": {
    wait:     "请稍等一下。",
    waitSub:  "我用翻译机。",
    howmuch:  "这个多少钱？",
    discount: "可以便宜一点吗？",
    morning:  "早上好。",
    noon:     "你好。",
    evening:  "晚上好。",
    thanks:   "非常感谢。",
    priceFmt: (n) => "是 " + n + " 元吗？",
    currency: "¥"
  },
  "zh-TW": {
    wait:     "請稍等一下。",
    waitSub:  "我要用翻譯機。",
    howmuch:  "這個多少錢？",
    discount: "可以便宜一點嗎？",
    morning:  "早安。",
    noon:     "你好。",
    evening:  "晚安。",
    thanks:   "非常感謝。",
    priceFmt: (n) => "是 " + n + " 元嗎？",
    currency: "NT$"
  },
  "ko-KR": {
    wait:     "잠시만 기다려 주세요.",
    waitSub:  "번역기를 사용할게요.",
    howmuch:  "이거 얼마예요?",
    discount: "좀 깎아 주실 수 있어요?",
    morning:  "안녕하세요. 좋은 아침이에요.",
    noon:     "안녕하세요.",
    evening:  "안녕하세요. 좋은 저녁이에요.",
    thanks:   "정말 감사합니다.",
    priceFmt: (n) => n + " 원 맞나요?",
    currency: "₩"
  },
  "th-TH": {
    wait:     "กรุณารอสักครู่",
    waitSub:  "ขอใช้เครื่องแปลภาษา",
    howmuch:  "อันนี้ราคาเท่าไหร่",
    discount: "ลดราคาได้ไหมครับ",
    morning:  "สวัสดีตอนเช้า",
    noon:     "สวัสดี",
    evening:  "สวัสดีตอนเย็น",
    thanks:   "ขอบคุณมาก",
    priceFmt: (n) => n + " บาท ใช่ไหม",
    currency: "฿"
  },
  "vi-VN": {
    wait:     "Vui lòng đợi một chút.",
    waitSub:  "Tôi sẽ dùng máy dịch.",
    howmuch:  "Cái này bao nhiêu tiền?",
    discount: "Giảm giá được không?",
    morning:  "Chào buổi sáng.",
    noon:     "Xin chào.",
    evening:  "Chào buổi tối.",
    thanks:   "Cảm ơn rất nhiều.",
    priceFmt: (n) => n + " đồng, phải không?",
    currency: "₫"
  },
  "id-ID": {
    wait:     "Mohon tunggu sebentar.",
    waitSub:  "Saya akan pakai mesin penerjemah.",
    howmuch:  "Ini berapa?",
    discount: "Bisa lebih murah?",
    morning:  "Selamat pagi.",
    noon:     "Selamat siang.",
    evening:  "Selamat malam.",
    thanks:   "Terima kasih banyak.",
    priceFmt: (n) => n + " rupiah, ya?",
    currency: "Rp"
  },
  "fr-FR": {
    wait:     "Un instant, s'il vous plaît.",
    waitSub:  "Je vais utiliser un traducteur.",
    howmuch:  "Combien ça coûte ?",
    discount: "Pouvez-vous faire une remise ?",
    morning:  "Bonjour.",
    noon:     "Bonjour.",
    evening:  "Bonsoir.",
    thanks:   "Merci beaucoup.",
    priceFmt: (n) => "C'est " + n + " euros, c'est ça ?",
    currency: "€"
  },
  "es-ES": {
    wait:     "Un momento, por favor.",
    waitSub:  "Voy a usar un traductor.",
    howmuch:  "¿Cuánto cuesta esto?",
    discount: "¿Me puede hacer un descuento?",
    morning:  "Buenos días.",
    noon:     "Hola.",
    evening:  "Buenas noches.",
    thanks:   "Muchas gracias.",
    priceFmt: (n) => "Son " + n + " euros, ¿verdad?",
    currency: "€"
  },
  "it-IT": {
    wait:     "Un momento, per favore.",
    waitSub:  "Userò un traduttore.",
    howmuch:  "Quanto costa?",
    discount: "Mi può fare uno sconto?",
    morning:  "Buongiorno.",
    noon:     "Salve.",
    evening:  "Buonasera.",
    thanks:   "Grazie mille.",
    priceFmt: (n) => "Sono " + n + " euro, vero?",
    currency: "€"
  },
  "de-DE": {
    wait:     "Einen Moment, bitte.",
    waitSub:  "Ich benutze einen Übersetzer.",
    howmuch:  "Wie viel kostet das?",
    discount: "Können Sie mir einen Rabatt geben?",
    morning:  "Guten Morgen.",
    noon:     "Hallo.",
    evening:  "Guten Abend.",
    thanks:   "Vielen Dank.",
    priceFmt: (n) => "Das sind " + n + " Euro, richtig?",
    currency: "€"
  }
};
