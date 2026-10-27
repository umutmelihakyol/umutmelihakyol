# Günlüğüm

Günlüğüm; oyun, film, dizi ve anime arşivini; kişisel puanları, notları, izleme/oynama durumlarını ve Technopat Sosyal yazılarını tek yerde toplayan statik bir web sitesidir. Sunucu veya derleme adımı gerektirmez; GitHub Pages üzerinde yayımlanabilir.

## Sayfalar

- `index.html` — ana sayfa, kategori kartları, son eklenen kayıtlar ve inceleme kartı oluşturucu.
- `oyun/index.html` — oyun arşivi; oyun maliyeti ve kütüphane özeti `oyun/maliyet/index.html` adresindedir.
- `film/index.html`, `dizi/index.html`, `anime/index.html` — ilgili medya arşivleri.
- `ara/index.html` — bütün medya arşivlerinde kategori, durum, tür, yayın yılı, puan, platform, favori ve inceleme filtresiyle gelişmiş arama.
- `istatistik/index.html` — genel istatistiklere ek olarak yıl seçimi, aylık tamamlama grafiği ve gelişmiş alt puan ortalamaları.
- `technopat/incelemeler/index.html`, `technopat/rehberler/index.html` — Technopat Sosyal yazı arşivi.
- `admin/index.html` — parola ile açılan, GitHub deposundaki JSON ve yapılandırma dosyalarını yönetmeye yarayan panel.
- `offline.html` ve `service-worker.js` — PWA/çevrimdışı desteği.

## Dosya yapısı

- `data/games.json`, `data/movies.json`, `data/series.json`, `data/anime.json` — arşiv kayıtları.
- `data/technopat.json` — Technopat inceleme ve rehber kartları.
- `scripts/config.js` — site ayarları ve API anahtarları.
- `scripts/categories.js` — kategori adları, sayfa adresleri, durum etiketleri ve görsel URL yardımcıları.
- `scripts/app.js` — oyun/film/dizi/anime kategori sayfalarının ortak arayüzü, yenilenen kart sistemi ve kayıt ayrıntısındaki alt puan dökümü.
- `scripts/review-card.js` — inceleme kartlarını 4:5, kare veya hikâye formatında PNG olarak üretir; üç renk teması, alt puanlar, kişisel notlar ve paylaşım/bağlantı seçenekleri sunar.
- `scripts/search.js` — çok kategorili gelişmiş arama/filtreleme ve paylaşılabilir arama parametreleri.
- `scripts/stats.js` — toplam ve yıllık istatistik hesaplamaları, puan dağılımı, alt puan ve süre analizleri.
- `assets/css/` — tasarım, kartlar, medya ekleri ve responsive stiller.
- `backups/latest.json` — yönetim panelinin son otomatik veri yedeği.

## Yerel ayarlar

`scripts/config.js` içindeki `siteTitle`, `tagline`, `suggestUrl`, `goatcounter`, `rawgKey` ve `tmdbKey` değerleri site davranışını belirler. `suggestUrl` boşsa öneri bağlantısı görünmez; `goatcounter` boşsa ziyaretçi sayacı kullanılmaz. API anahtarları tarayıcıya gönderildiği için gizli kabul edilmemelidir; sağlayıcı panelinde kullanım kısıtlamalarını ve kotaları kontrol et.

`owner`, `repo` ve `branch` değerleri yönetim panelinin GitHub API ile çalışacağı depoyu belirtir. `vault`, GitHub token'ının Web Crypto API ile şifrelenmiş metnidir. Token'ı doğrudan HTML/JavaScript dosyasına veya `config.js` içine düz metin olarak koyma. Vault oluşturma/yenileme işlemi `https://umutmelihakyol.com/admin/#kurulum` üzerinden yapılabilir; yönetim paneli HTTPS gerektirir. Token yalnızca bu statik panelin tarayıcı tarafında çözülür ve oturum süresince `sessionStorage` içinde tutulur.

## Kayıtları yönetme

1. `https://umutmelihakyol.com/admin/` sayfasını aç ve vault oluştururken belirlediğin parolayla giriş yap.
2. Gerekli kategoriyi seçip kayıt ekle veya düzenle. API araması desteklenen kategorilerde başlığa göre arama yapabilirsin.
3. Kaydetme işlemi ilgili JSON dosyasını GitHub deposuna yazar. Yayına yansıması GitHub Pages dağıtımına bağlı olarak kısa bir süre alabilir.
4. Geri yükleme işlemleri mevcut kayıtları değiştirebilir. Yönetim panelindeki yedekleme seçeneklerini kullan ve geri yüklemeden önce veri kapsamını kontrol et.

Elle düzenleme yapıyorsan JSON sözdizimini koru. Kategori dosyaları JSON dizisi olmalıdır. Yönetim paneline erişim için GitHub token'ında ilgili depo için gerekli içerik okuma/yazma yetkisi bulunmalıdır.

## Eski bağlantılar

Eski `index.html#oyunid` bağlantıları, oyun ayrıntı bağlantısı olarak `oyun/index.html#oyunid` adresine yönlendirilir. Yeni bağlantılarda doğrudan kategori adresini kullan.

## Yayımlama ve özel alan adı

Deponun yayımlama kökünde `CNAME` dosyası `umutmelihakyol.com` alan adını belirtmelidir. DNS ve GitHub Pages HTTPS ayarları için `DOMAIN-KURULUM.txt` dosyasındaki adımları izle. Yayımlamadan sonra tarayıcıda `Ctrl+F5` ile yenile; servis çalışanı güncellemesi yeni önbellek sürümünü kullanır.

## Veri kaynakları ve atıflar

Oyun bilgileri RAWG, film/dizi bilgileri TMDB ve anime bilgileri Jikan/MyAnimeList kaynaklarıyla ilişkilidir. İlgili kategori sayfalarında bulunan kaynak atıflarını kaldırma; TMDB bu sitenin TMDB tarafından onaylandığı anlamına gelmediğini belirten atfı özellikle korumalıdır.

## QR kod bileşeni lisansı

Yerel QR motorunun temeli Kazuhiko Arase tarafından geliştirilen `qrcode-generator` çekirdeğine dayanır.

Copyright (c) 2009 Kazuhiko Arase

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Kart görünümü ve paylaşılabilir inceleme görselleri

Kategori kartları puan, favori, durum, yıl/platform, türler, süre ve kişisel notları kart üzerinde doğrudan gösterir. Her karttaki **Paylaş** düğmesi, seçili kayıttan paylaşılabilir bir inceleme görseli oluşturucuyu açar. Görsel; dikey gönderi (4:5), kare (1:1) veya hikâye (9:16) formatında ve Gece, Açık ya da Mor Gece temasıyla hazırlanabilir. Kartta genel puan, uygun durum etiketleri, türler, kişisel notlar, kayıtlı alt puanlar ve varsa artılar/eksiler yer alır. PNG indirme tüm desteklenen modern tarayıcılarda sunulur; dosya paylaşımı cihaz/tarayıcı destekliyorsa yerel paylaşım menüsü açılır, aksi durumda PNG indirilir.

## İstatistik sayfası

`istatistik/index.html`, `data/games.json`, `data/series.json`, `data/movies.json` ve `data/anime.json` dosyalarını okuyarak arşiv sayıları, puan dağılımı, türler, tamamlanma durumları, yıl seçimine göre bitirme geçmişi, aylık aktivite grafiği, yıllık en yüksek puanlı yapımlar ve kayıtlı alt puan ortalamalarını hesaplar. `ara/index.html` tüm kategorileri tek bir arama ekranında filtreler. Yönetim panelinde her kayda genel puana ek olarak hikâye, görsellik, ses/müzik, karakter, özgünlük ve tempo; oyunlarda ayrıca oynanış alt puanı eklenebilir. Bu alanlar isteğe bağlıdır ve eski kayıtlarla uyumludur. Oyun saatleri girilen kayıtlı sürelerden; film süreleri tamamlanan filmlerin uzunluklarından; dizi ve anime süreleri ise sırasıyla bölüm başına 42 ve 24 dakika varsayımından hesaplanır. Dizi/anime süreleri tahminidir ve devam eden içeriklerin gerçek izlenen bölüm sayısını göstermez.


## Temiz sayfa adresleri

Tarayıcıda kullanılan sayfa yolları `.html` uzantısını göstermez: `/`, `/oyun/`, `/oyun/maliyet/`, `/film/`, `/dizi/`, `/anime/`, `/istatistik/`, `/ara/`, `/admin/`, `/technopat/incelemeler/`, `/technopat/rehberler/` ve `/offline/`. Kaynak dosyalar, GitHub Pages statik barındırma yapısı nedeniyle klasörlerde `index.html` olarak tutulur. Eski `.../index.html` adresleri açıldığında sayfa yolu da temiz URL biçimine çevrilir.
