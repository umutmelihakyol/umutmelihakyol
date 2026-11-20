# Günlüğüm 2B — Tam Kurulum Paketi (Gemini)

Bu ZIP, 2B asistanının bütün yeni/değiştirilen site dosyalarını ve Gemini için Cloudflare Worker kodunu içerir. Günlüğüm sitesinin tamamını içermez.

## Paketteki dosyalar

| Dosya | Ne işe yarar? |
|---|---|
| `scripts/site-nav.js` | 2B'yi ortak gezinme üzerinden bütün sayfalara yükler. |
| `scripts/assistant-2b.js` | Asistan arayüzü, hazır komutlar ve sohbet mantığı. |
| `scripts/assistant-2b-config.js` | Cloudflare Worker adresinin girileceği ayar dosyası. |
| `assets/css/assistant-2b.css` | Chibi karakteri ve sohbet penceresinin tasarımı. |
| `assets/images/2b/chibi-mascot.webp` | Tıklanabilir 2B chibi karakteri. |
| `service-worker.js` | Yeni dosyaları PWA önbelleğine ekler; sürüm v78. |
| `cloudflare/2b-worker.js` | Gemini API'ye güvenli bağlantı sağlayan Worker. |
| `README-2B-KURULUM.md` | Bu kurulum belgesi. |

## A. Site dosyalarını yükle

1. ZIP dosyasını aç.
2. İçindeki klasörleri ve dosyaları Günlüğüm sitesinin ana dizinine, klasör yollarını bozmadan kopyala.
3. Aynı isimde dosya varsa üzerine yaz.
4. Dosyaları GitHub deposuna yükleyip `main` dalına gönder. GitHub Pages dağıtımı tamamlandığında ortak gezinme bulunan sayfalarda 2B görünür.
5. Tarayıcıda `Ctrl + F5` ile yenile. PWA kullanıyorsan Service Worker'ın v78 sürümüne geçişi için siteyi çevrimiçiyken bir kez yenile.

## B. Gemini API anahtarı oluştur

1. Google AI Studio API Keys sayfasını aç: https://aistudio.google.com/apikey
2. Google hesabınla oturum aç ve bir Gemini API anahtarı oluştur.
3. Anahtarı kopyala; GitHub'a, site dosyalarına veya sohbete yazma.

## C. Cloudflare Worker'ı kur

1. Cloudflare hesabında **Workers & Pages** bölümüne gir.
2. `gunlugum-2b` adında bir Worker oluştur.
3. Bu paketteki `cloudflare/2b-worker.js` dosyasının tamamını Worker kod alanına yapıştır ve dağıt.
4. Worker'ın **Settings → Variables and Secrets** bölümünde şu ayarları ekle:

| Ad | Tür | Değer |
|---|---|---|
| `AI_API_KEY` | Secret | Google AI Studio'dan oluşturduğun API anahtarı |
| `AI_MODEL` | Variable | `gemini-3.8-flash` |
| `ALLOWED_ORIGINS` | Variable | `https://umutmelihakyol.com,https://www.umutmelihakyol.com` |

`AI_MODEL` girilmezse Worker varsayılan olarak `gemini-3.8-flash` modelini kullanır. Model adını daha sonra Cloudflare'deki bu değişkenden değiştirebilirsin.

**Önemli:** API anahtarı mutlaka `AI_API_KEY` adıyla Secret olarak kaydedilmeli. Normal metin değişkeni, JavaScript dosyası veya HTML içine yazılmamalı.

Bu Worker, Google'ın güncel önerdiği Gemini **Interactions API** arayüzünü kullanır ve `store: false` ile sohbet geçmişini istekte taşır.

## D. 2B'yi Worker'a bağla

1. Worker dağıtılınca Cloudflare sana `https://gunlugum-2b.<hesap>.workers.dev` biçiminde bir adres verir.
2. `scripts/assistant-2b-config.js` dosyasını aç.
3. `apiUrl` alanına kendi adresini `/api/chat` ile bitirecek şekilde yaz. Örnek:

```js
window.GUNLUGUM_2B_CONFIG = window.GUNLUGUM_2B_CONFIG || {
  apiUrl: "https://gunlugum-2b.ornek-hesap.workers.dev/api/chat",
  assistantName: "2B"
};
```

`ornek-hesap` kısmını Cloudflare'ın verdiği gerçek hesap adresiyle değiştir. Buraya Gemini API anahtarı değil, yalnızca Worker adresi yazılır. Bu dosyayı tekrar site deposuna yükle.

## E. Test

1. Tarayıcıdan `https://KENDI-WORKER-ADRESIN.workers.dev/health` adresini aç.
2. `status: "ok"` ve `service: "gunlugum-2b-gemini"` görünmeli.
3. Günlüğüm'ü yenile, chibi karaktere tıkla.
4. Önce `Arşivimi özetle` hazır komutunu dene; sonra serbest bir sohbet mesajı gönder.

## Güvenlik

- Gemini API anahtarı sadece Cloudflare Worker Secret alanında tutulur.
- Worker yalnızca `ALLOWED_ORIGINS` içindeki tarayıcı Origin adreslerine CORS izni verir. CORS tek başına doğrudan bot isteklerini engellemez.
- Yayına açmadan önce Cloudflare'de `/api/chat` yolu için Rate Limiting kuralı eklemeni öneririm.
- İstek gövdesi ve mesaj uzunluğu Worker içinde sınırlandırılmıştır.
- Bu paket Cloudflare Worker'ı otomatik dağıtmaz; Worker kodunu ve Secret ayarını Cloudflare panelinde senin yapman gerekir.
