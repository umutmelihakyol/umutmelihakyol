# Günlüğüm 2B Asistanı — Kurulum

2B, Günlüğüm sitesindeki tüm sayfalarda sağ altta açılan sabit asistandır. Hazır komutlar tarayıcıda çalışır; serbest sohbet Cloudflare Worker üzerinden yapay zekâ servisine bağlanır.

## İlk aşama

- Hazır komutlar API anahtarı olmadan çalışır.
- Arşiv özeti, rastgele oyun seçimi, oyun önerisi ve arşiv içinde arama yerel JSON dosyalarını okur.
- Yapay zekâ sohbeti, Worker adresi tanımlanana kadar kapalı kalır.
- API anahtarı site dosyalarına eklenmez.

## Yapay zekâ bağlantısını etkinleştirme

### 1. Cloudflare Worker oluştur

Cloudflare hesabında Workers & Pages bölümünü aç ve yeni bir Worker oluştur. Örneğin adı gunlugum-2b olabilir.

Bu depodaki cloudflare/2b-worker.js dosyasının içeriğini Worker kod alanına yapıştır ve dağıt.

### 2. Worker değişkenlerini ekle

Worker içindeki Settings → Variables and Secrets alanından aşağıdaki değerleri tanımla:

| Değişken | Tür | Açıklama |
| --- | --- | --- |
| AI_API_KEY | Secret | Yapay zekâ sağlayıcısından aldığın gizli API anahtarı |
| AI_MODEL | Variable | Kullanacağın modelin adı |
| AI_API_URL | Variable, isteğe bağlı | OpenAI uyumlu Chat Completions endpoint adresi |
| ALLOWED_ORIGINS | Variable, isteğe bağlı | İzin verilen web sitesi adresleri |

AI_API_URL girilmezse Worker varsayılan olarak OpenAI uyumlu Chat Completions adresini kullanır. Başka bir sağlayıcı kullanacaksan aynı istek biçimini destekleyen HTTPS endpoint adresini yaz.

ALLOWED_ORIGINS için şu iki adresi virgülle ayırarak kullan:

https://umutmelihakyol.com,https://www.umutmelihakyol.com

API anahtarını AI_API_KEY adıyla Secret olarak ekle. Bu anahtarı GitHub deposuna, assistant-2b-config.js dosyasına veya siteye koyma.

### 3. Siteye Worker adresini tanımla

Worker dağıtıldıktan sonra sana verilecek adresi kopyala. Örneğin:

https://gunlugum-2b.ornek-hesap.workers.dev

Depodaki scripts/assistant-2b-config.js dosyasını aç ve apiUrl satırını şu biçimde güncelle:

apiUrl: "https://gunlugum-2b.ornek-hesap.workers.dev/api/chat"

Örnek adresi kendi Worker adresinle değiştir. Bu alana API anahtarı değil, yalnızca Worker adresi yazılır.

### 4. Test et

Siteyi açıp sağ alttaki 2B düğmesine bas. Önce Arşivimi özetle komutunu dene. Worker bağlantısını tamamladıktan sonra normal bir sohbet mesajı gönder.

Worker sağlık kontrolü için şu adresi aç:

https://gunlugum-2b.ornek-hesap.workers.dev/health

Başarılı yanıt, service alanında gunlugum-2b ve status alanında ok bilgisini göstermelidir.

## Güvenlik ve sınırlar

- API anahtarı yalnızca Cloudflare Worker Secret alanında tutulur.
- Worker yalnızca izin verilen Origin adreslerinden gelen istekleri kabul eder.
- İstek boyutu ve mesaj uzunluğu sınırlandırılmıştır.
- Tarayıcı tarafında anahtar saklanmaz.
- Bu sürümde hazır komutlar yerel çalışır; serbest sohbet için Worker ve sağlayıcı ayarları tamamlanmalıdır.
