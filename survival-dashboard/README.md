# Survival Language Dashboard

旅行中の『焦り』を解決する、3日間の短期集中サバイバル UI。
学習ではなく「現場での意思疎通」を最優先する。

## Run

This is a static prototype — no build step.

```sh
# from the repo root
python3 -m http.server 8000 --directory survival-dashboard
# then open http://localhost:8000/
```

iOS Safari and Android Chrome both support the Web Speech API used for
on-device text-to-speech in the destination language. (Some Linux desktops
have no installed voices; phrases will still display on screen.)

## Screen layout

| Zone | Component | Behavior |
| --- | --- | --- |
| Top | **Emergency Bar — 「ちょっと待って」** | Tap → fullscreen pulsing screen showing "Please wait a moment" in the local language at huge size, plus "I'll use a translator." Tap anywhere or press ESC to dismiss. |
| Center | **Shop Utility** | 0–9 keypad with C / ⌫. Each digit speaks aloud in the local language. Quick buttons: 「これいくら？」 (asks the question, or — if a price is typed — confirms "Is it ¥1,234?") and 「安くして」. |
| Bottom | **Connect Panel** | Greeting toggle: 朝 / 昼 / 晩 / ありがとう, each tappable for instant local-language audio. |

## Files

- `index.html` — markup for the three zones + emergency overlay
- `style.css` — dark high-contrast theme, large tap targets (≥80 px), safe-area padding
- `phrases.js` — hand-written translations + currency symbol per locale (en, zh-CN, zh-TW, ko, th, vi, id, fr, es, it, de)
- `app.js` — keypad logic, TTS voice picking, language persistence (localStorage), overlay control
