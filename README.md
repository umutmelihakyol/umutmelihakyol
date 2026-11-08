# Günlüğüm

Günlüğüm, oyunları, filmleri, dizileri ve animeleri tek yerde takip edebilmek için hazırladığım kişisel arşiv sitesi. Sadece bir içerik listesi olarak kalmasını istemedim; oynadığım veya izlediğim yapımlara puan verebildiğim, notlarımı ve incelemelerimi saklayabildiğim, geçmişimi inceleyebildiğim ve kendi favorilerimi sergileyebildiğim bir alan hâline getirdim. Technopat Sosyal'de yayımladığım inceleme ve rehberleri de aynı site üzerinden takip ediyorum.

Projeyi mümkün olduğunca sade tutmaya çalıştım. Site HTML, CSS ve JavaScript ile hazırlanıyor; içerikler JSON dosyalarında saklanıyor. Ayrı bir uygulama sunucusu veya derleme işlemi gerekmiyor. Yönetim paneli, gerekli izinler verildiğinde GitHub API üzerinden bu dosyaları okuyup güncelliyor. Bu sayede site GitHub Pages gibi statik barındırma hizmetlerinde çalışabiliyor.

> **Canlı site:** [umutmelihakyol.com](https://umutmelihakyol.com)

---

## İçindekiler

- [Sitenin bölümleri](#sitenin-bölümleri)
- [Öne çıkan özellikler](#öne-çıkan-özellikler)
- [Yönetim paneli](#yönetim-paneli)
- [Yıllara göre favoriler vitrini](#yıllara-göre-favoriler-vitrini)
- [Arşiv verileri ve JSON yapısı](#arşiv-verileri-ve-json-yapısı)
- [Proje klasör yapısı](#proje-klasör-yapısı)
- [Kullanılan teknolojiler ve veri kaynakları](#kullanılan-teknolojiler-ve-veri-kaynakları)
- [Yerel ortamda çalıştırma](#yerel-ortamda-çalıştırma)
- [GitHub Pages üzerinde yayımlama](#github-pages-üzerinde-yayımlama)
- [Yönetim paneli ilk kurulumu](#yönetim-paneli-ilk-kurulumu)
- [Yedekleme ve geri yükleme](#yedekleme-ve-geri-yükleme)
- [Güvenlik ve gizlilik notları](#güvenlik-ve-gizlilik-notları)
- [Bakım ve sorun giderme](#bakım-ve-sorun-giderme)
- [Ek dokümanlar](#ek-dokümanlar)
- [Lisans notu](#lisans-notu)

## Sitenin bölümleri

| Adres | Bölüm | Açıklama |
|---|---|---|
| `/` | Ana sayfa | Kategori vitrinleri, son eklenenler, takip ettiğim içerikler, yıllık favoriler ve site araçları. |
| `/oyun/` | Oyunlarım | Oynadığım, bitirdiğim, yarım bıraktığım veya oynamak için listeme aldığım oyunlar. |
| `/oyun/maliyet/` | Oyun maliyeti | Oyun kütüphanesinin satın alma, edinme yöntemi ve maliyet bilgileri. |
| `/film/` | Filmlerim | İzlediğim ve izleme listeme eklediğim filmler. |
| `/dizi/` | Dizilerim | Takip ettiğim diziler, sezon ve bölüm bilgilerim. |
| `/anime/` | Animelerim | İzlediğim ve izleme listeme aldığım animeler. |
| `/ara/` | Gelişmiş arama | Dört medya arşivinde ortak arama ve filtreleme. |
| `/istatistik/` | İstatistikler | Arşiv sayıları, puanlar, türler, süreler ve tamamlanma geçmişi. |
| `/kisiler/` | Kişiler ve stüdyolar | Arşivdeki geliştirici, yönetmen, yaratıcı ve stüdyo bağlantıları. |
| `/technopat/incelemeler/` | Technopat incelemeleri | Technopat Sosyal'de yayımladığım inceleme bağlantıları. |
| `/technopat/rehberler/` | Technopat rehberleri | Technopat Sosyal'de yayımladığım rehber bağlantıları. |
| `/cekilis/` | Çekiliş | Çekiliş sayfası. Adres doğrudan açılabilir. |
| `/admin/` | Yönetim paneli | Arşiv, site içeriği, yıllık favoriler ve diğer yönetim işlemleri. |
| `/offline/` | Çevrimdışı sayfa | Bağlantı yokken gösterilebilen çevrimdışı bilgilendirme ekranı. |

Sayfaların kaynak dosyaları ilgili klasörlerde `index.html` olarak tutuluyor. Ziyaretçiye gösterilen bağlantılarda `.html` uzantısını kullanmıyorum; örneğin oyun arşivinin adresi `/oyun/` şeklinde.

## Öne çıkan özellikler

### Oyun, film, dizi ve anime arşivi

Dört kategori de aynı temel mantıkla çalışıyor. Her içerik için başlık, kapak görseli, çıkış yılı, türler, durum, puan ve ilgili kategoriye göre platform veya süre gibi bilgiler saklanabiliyor. İçerik ayrıntılarında kişisel not, inceleme bağlantısı, artılar ve eksiler de kullanılabiliyor.

Durumlar arayüzde kategoriye göre Türkçeleştiriliyor. Temel durum anahtarları şunlar:

- `bitirdim`: Oyunu bitirdim veya yapımı izledim.
- `oynuyorum`: Oyunlarda oynuyorum, diğer kategorilerde izliyorum.
- `biraktim`: Yarım bıraktım.
- `istek`: Oyunlarda istek listesi, diğer kategorilerde izleme listesi.

Oyunlarda oynama süresi saat cinsinden; filmlerde süre dakika cinsinden; dizilerde sezon ve bölüm; animelerde bölüm bilgisi tutulabiliyor. Alanlar kategoriye göre değiştiği için her kayıtta bütün alanların bulunması gerekmiyor.

### Ana sayfa vitrinleri

Ana sayfada arşivi daha rahat gezebilmek için birkaç ayrı bölüm bulunuyor:

- **Kategorilerim:** Oyun, film, dizi ve anime arşivlerine hızlı geçiş sağlar.
- **Son eklenenler:** Arşive en son eklediğim yapımları gösterir.
- **Şu an izlediklerim / takip ettiklerim:** Devam ettiğim içerikleri ayrı bir şeritte toplar. Mobil ekranda yatay kaydırma kullanılabilir.
- **Yıllara göre favorilerim:** Her yıl için seçtiğim favori oyunu, diziyi, filmi ve animeyi ayrı kartlarla sergiler.
- **Technopat içerikleri:** Son inceleme ve rehber bağlantılarımı ana sayfada öne çıkarır.

### Yıllık favoriler vitrini

`data/yearly-favorites.json` dosyası, ana sayfadaki yıllık favoriler bölümünün verisini tutar. Her yıl için oyun, dizi, film ve anime kategorilerinden birer kayıt seçebilirim. Seçimler mevcut arşivdeki kayıt kimliklerine bağlanır; bu nedenle aynı içeriğin başlığını veya görselini ikinci kez yazmam gerekmez.

Yönetim panelinde **Yıllık Favoriler** sekmesine girip önce **GitHub'dan Getir / Yenile** düğmesine basıyorum. Ardından yıl ekleyebiliyor, her kategori için arşivden bir kayıt seçebiliyor ve **Değişiklikleri GitHub'a Kaydet** düğmesiyle yayımlayabiliyorum. Başlangıç dosyasında 2025, 2026 ve 2027 yılları bulunuyor. İhtiyaç oldukça başka yıllar da eklenebiliyor.

Bir yılda hiç favori seçilmemişse o yıl ziyaretçiye gösterilmiyor. Boş bırakılan kategoriler de vitrinde kart oluşturmuyor.

Ayrıntılı kullanım: [`README-YILLIK-FAVORILER.md`](README-YILLIK-FAVORILER.md)

### Arama ve filtreleme

Üst menüdeki arama düğmesi yeni bir sayfaya gitmeden, açık sayfanın üzerinde bir arama penceresi açar. Arka plan bulanıklaştırılır; pencere kapatıldığında önceki sayfaya ve konuma dönülür. Klavyeden `Ctrl + K` (macOS'ta `Cmd + K`) kısayolu da kullanılabilir.

Ayrıca `/ara/` sayfasında oyun, film, dizi ve anime kayıtlarını tek yerde arayabilirim. Kategori, durum, tür, yayın yılı, puan, platform, favori ve inceleme gibi alanlara göre filtreleme yapılabilir. Arama bağlantıları sorgu parametreleriyle paylaşılabilir.

### Puanlama, notlar ve geçmiş

Genel puanın yanında desteklenen kayıtlarda alt puanlar da tutulabilir. Oyunlarda oynanış; diğer ortak değerlendirmelerde hikâye, görsellik, ses/müzik, karakterler, özgünlük ve tempo gibi başlıklar kullanılabilir. Bu alanlar zorunlu değil.

Bazı kayıtlar için tekrar oynama veya yeniden izleme geçmişi eklenebilir. Bu geçmişte tarih, platform/izleme yeri, ek süre ya da bölüm sayısı, o turdaki puan ve not yer alabilir. Genel puan değişiklikleri de önceki ve yeni puanla birlikte tarihçe olarak saklanabilir.

### Paylaşılabilir inceleme kartları

Kategori kartlarındaki **Paylaş** özelliği, seçili içerikten PNG biçiminde bir inceleme görseli oluşturur. Üç format bulunur:

- Dikey gönderi: `4:5`
- Kare gönderi: `1:1`
- Hikâye: `9:16`

Kartta genel puan, durum, türler, kişisel notlar ve varsa alt puanlar, artılar ve eksiler gösterilebilir. Görsel Gece, Açık veya Mor Gece temalarından biriyle hazırlanabilir. Tarayıcı destekliyorsa doğrudan paylaşım açılır; desteklemiyorsa PNG indirilir. İçerik bağlantısı da kopyalanabilir.

### İstatistikler

İstatistik sayfası kategori JSON dosyalarını okuyarak toplam kayıtları, durum dağılımını, puanları, türleri ve tamamlanan içerikleri hesaplar. Yıl seçimine göre geçmiş, aylık tamamlama grafiği ve en yüksek puan verdiğim yapımlar gibi bölümler bulunur.

Oyun süreleri kaydedilmiş saatlerden, film süreleri kayıtlı dakika bilgilerinden hesaplanır. Dizi ve anime süreleri, bölüm uzunluğu için kullanılan varsayımlara göre yaklaşık değerlerdir; gerçek izleme süresini birebir göstermez.

### Kişiler ve stüdyolar

`/kisiler/` sayfası arşiv kayıtlarında bulunan geliştirici, yönetmen, yaratıcı ve stüdyo bilgilerini bir araya getirir. Uygun kayıtlar RAWG, TMDB veya Jikan gibi kaynaklarla eşleştirilebilir. Dış kaynaklar yanıt vermediğinde arşivdeki yerel bağlantılar kullanılmaya devam eder.

### Oyun kütüphanesi ve maliyet bilgileri

Oyun kayıtlarında platform ve oynama süresinin yanında edinme yöntemi, sahiplik durumu, satın alma fiyatı, para birimi, mağaza ve satın alma tarihi gibi alanlar bulunabilir. Bu bilgiler oyun maliyeti/kütüphane sayfasında özetlenir. İsteğe bağlı kurulum profilleri ve uygunluk bilgileri de oyun kaydına eklenebilir.

### Technopat içerikleri

Technopat inceleme ve rehber kartlarını `data/technopat.json` dosyasında tutuyorum. Her kartta başlık, kategori, kısa açıklama, etiket ve Technopat Sosyal bağlantısı bulunabilir. Bu kartları yönetim panelindeki **Technopat İçerikleri** sekmesinden ekleyebilir, düzenleyebilir veya silebilirim.

### Çekiliş bölümü

Projede ayrı bir `/cekilis/` sayfası ve yönetim panelinde **Çekiliş Yönetimi** sekmesi bulunuyor. Çekiliş verileri `data/cekilis.json` dosyasında tutulur. Çekiliş katılımcılarının adları herkese açık statik JSON içinde yer alabileceği için bu bölüme hassas veya yayımlanmasını istemediğim kişisel bilgiler eklemiyorum.

## Yönetim paneli

Yönetim paneline `/admin/` adresinden ulaşılıyor. Panel, GitHub deposundaki JSON ve yapılandırma dosyalarını GitHub REST API üzerinden yönetiyor. Kullanılabilir sekmeler:

| Sekme | Ne işe yarıyor? |
|---|---|
| **İçerik Yönetimi** | Oyun, film, dizi ve anime kayıtlarını ekleme, düzenleme, silme ve arşivde arama. |
| **Platformdan İçe Aktar** | Steam, Letterboxd ve MyAnimeList verilerini arşive aktarma. |
| **Genel Bakış & Yedek** | Arşiv istatistiklerini görüntüleme, JSON yedeği indirme ve geri yükleme. |
| **Arşiv Kontrol Merkezi** | Boş/tekrarlanan başlıkları ve ID'leri, geçersiz durum veya puanları, eksik temel bilgileri ve hatalı bağlantı biçimlerini tarama. |
| **Technopat İçerikleri** | Ana sayfadaki inceleme ve rehber kartlarını yönetme. |
| **Yıllık Favoriler** | Ana sayfadaki yıl bazlı favori vitrinini düzenleme. |
| **Çekiliş Yönetimi** | Çekiliş kayıtlarını oluşturma ve yönetme. |
| **Site & API Ayarları** | `config.js` ve kategori tanımlarını düzenleme. |
| **Dosya & Kod Editörü** | Depodaki desteklenen metin dosyalarını görüntüleme ve düzenleme. |

İçerik yönetiminde kategori seçerek ilgili arşivi düzenliyorum. Oyun kayıtlarında maliyet ve kurulum bilgileri gibi kategoriye özel alanlar da bulunuyor. Arşivde toplu işlem, filtreleme ve silinen kayıtları geri alma gibi yardımcı araçlar da kullanılabiliyor; silme öncesinde ve geri yükleme sırasında ekrandaki onayları kontrol etmek gerekiyor.

**Önemli:** Panelde yaptığım değişiklikler önce tarayıcıdaki düzenleme durumuna alınır. Bunların canlı siteye gitmesi için ilgili **GitHub'a Kaydet** düğmesine basmam gerekir. GitHub Pages dağıtımının tamamlanması ve tarayıcı önbelleğinin yenilenmesi birkaç dakika sürebilir.

### Dış platformlardan içe aktarma

- **Steam:** Steam Web API anahtarı ve SteamID64 ile kütüphane aktarılabilir. API isteği tarayıcıda engellenirse Steam'in `GetOwnedGames` JSON çıktısı doğrudan yapıştırılabilir. Oynama süreleri saat olarak alınabilir.
- **Letterboxd:** Dışa aktarılan ZIP içindeki `ratings.csv`, `diary.csv`, `watched.csv` veya `watchlist.csv` dosyası seçilerek filmler aktarılabilir. İstenirse TMDB üzerinden başlık, afiş, yönetmen, süre ve tür bilgileri tamamlanabilir.
- **MyAnimeList:** MAL XML dışa aktarımı veya herkese açık profil kullanıcı adı kullanılabilir. Eksik kapak, stüdyo ve tür bilgileri uygun API kaynaklarından tamamlanabilir.

İçe aktarma sırasında isim eşleşmesi bulunan mevcut kayıtlar tekrar eklenmemek üzere kontrol edilir. Yine de büyük bir aktarım öncesinde yedek almak iyi olur.

## Arşiv verileri ve JSON yapısı

Site içeriğinin ana kaynağı `data/` klasöründeki JSON dosyalarıdır:

| Dosya | İçerik |
|---|---|
| `data/games.json` | Oyun kayıtları. |
| `data/movies.json` | Film kayıtları. |
| `data/series.json` | Dizi kayıtları. |
| `data/anime.json` | Anime kayıtları. |
| `data/technopat.json` | Technopat inceleme ve rehberleri. |
| `data/yearly-favorites.json` | Yıllara göre favori kayıt kimlikleri. |
| `data/cekilis.json` | Çekiliş verileri. |

Kategori dosyaları JSON dizisi biçimindedir. Bir kayıt için örnek temel yapı:

```json
{
  "id": "benzersiz-kayit-kimligi",
  "title": "İçerik başlığı",
  "image": "https://example.com/kapak.jpg",
  "year": 2026,
  "status": "bitirdim",
  "score": 9,
  "platform": "PC",
  "genres": ["Aksiyon", "Macera"],
  "finished": "2026-01-15",
  "favorite": true,
  "recommended": true,
  "note": "Kişisel notum"
}
```

Bu yalnızca örnek bir temel kayıttır. Oyun, film, dizi ve anime dosyalarında kategoriye göre farklı alanlar bulunur. Örneğin oyunlarda `hours`, filmlerde `minutes`, dizilerde `seasons` ve `episodes`, animelerde `episodes` kullanılabilir. Geliştirici, yönetmen, yaratıcı veya stüdyo alanları da kategoriye göre değişir. JSON içinde olmayan isteğe bağlı alanları her kayda eklemek zorunda değilim.

Alt puanlar `ratings` nesnesinde; artılar ve eksiler `pros` / `cons` dizilerinde tutulabilir. Tekrar izleme/oynama kayıtları `repeatHistory`, puan değişiklikleri `scoreHistory` alanında saklanabilir. Yeni alan eklerken ilgili JavaScript kodunun bu alanı okuyup yazabildiğinden emin olmak gerekir.

Yıllık favoriler dosyasının yapısı daha basittir:

```json
{
  "years": [
    {
      "year": 2026,
      "favorites": {
        "oyun": "oyun-kayit-id",
        "dizi": "dizi-kayit-id",
        "film": "film-kayit-id",
        "anime": "anime-kayit-id"
      }
    }
  ]
}
```

Buradaki kimlikler ilgili kategori dosyasındaki `id` alanıyla eşleşmelidir. Yönetim panelini kullanmak, yanlış kimlik yazma ihtimalini azaltır.

Elle JSON düzenlerken virgül, tırnak ve köşeli/parantez işaretlerine dikkat edilmeli. Değişiklikten önce mutlaka yedek alınmalı.

## Proje klasör yapısı

```text
umutmelihakyol-main/
├── index.html                  # Ana sayfa
├── 404.html                    # Bulunamayan adres sayfası
├── offline.html                # Çevrimdışı yedek sayfa
├── manifest.webmanifest        # PWA uygulama tanımı
├── service-worker.js           # Önbellek ve çevrimdışı desteği
├── CNAME                       # Özel alan adı
├── robots.txt
├── sitemap.xml
├── admin/
│   └── index.html              # Yönetim paneli
├── oyun/
│   ├── index.html
│   └── maliyet/index.html
├── film/                       # Film arşivi
├── dizi/                       # Dizi arşivi
├── anime/                      # Anime arşivi
├── ara/                         # Gelişmiş arama
├── istatistik/                 # İstatistikler
├── kisiler/                    # Kişiler ve stüdyolar
├── technopat/
│   ├── incelemeler/
│   └── rehberler/
├── cekilis/                    # Çekiliş sayfası
├── offline/                    # Çevrimdışı sayfa yolu
├── data/                       # Site içeriklerinin JSON dosyaları
├── scripts/                    # Sayfa davranışları ve veri işlemleri
├── assets/
│   ├── css/                    # Tasarım ve responsive stiller
│   └── icons/                  # PWA simgeleri
├── backups/                    # Son otomatik JSON yedeği
└── README*.md / *.txt          # Proje ve özellik dokümanları
```

Öne çıkan JavaScript dosyaları:

| Dosya | Görevi |
|---|---|
| `scripts/config.js` | Site adı, depo bilgileri ve API ayarları. |
| `scripts/categories.js` | Kategorilerin dosya yolları, durum etiketleri ve ortak tanımları. |
| `scripts/app.js` | Oyun, film, dizi ve anime arşivlerinin ortak kart ve detay sistemi. |
| `scripts/search.js` | Gelişmiş arama ve filtreleme. |
| `scripts/search-overlay.js` | Sayfa üzerinde açılan arama penceresi ve klavye kısayolu. |
| `scripts/yearly-favorites.js` | Ana sayfadaki yıllık favoriler vitrini. |
| `scripts/yearly-favorites-admin.js` | Yönetim panelindeki yıllık favori düzenleyicisi. |
| `scripts/stats.js` | Arşiv istatistikleri ve grafikler. |
| `scripts/review-card.js` | Paylaşılabilir PNG inceleme kartları. |
| `scripts/people.js` | Geliştirici, yönetmen, yaratıcı ve stüdyo sayfaları. |
| `scripts/technopat.js` | Technopat içerik kartları. |
| `scripts/giveaway.js` / `scripts/giveaway-core.js` | Çekiliş sayfası ve ortak çekiliş hesaplamaları. |
| `scripts/pwa.js` | Uygulama kurulum arayüzü ve service worker kaydı. |
| `scripts/theme.js` | Tema tercihi. |

Tasarım dosyaları `assets/css/` altında tutuluyor. Ortak görünümün son katmanı `assets/css/arsivim.css` dosyasıdır. Bu dosya ortak yüzey, renk ve kart tutarlılığını belirlediği için sayfalara yeni stil eklerken yükleme sırasını kontrol etmek gerekiyor.

## Kullanılan teknolojiler ve veri kaynakları

- **HTML5:** Sayfa yapıları.
- **CSS:** Koyu/açık tema, kartlar, vitrinler ve mobil uyum.
- **JavaScript:** Arşiv işlemleri, filtreler, grafikler, yönetim paneli ve arayüz etkileşimleri.
- **JSON:** Oyun, film, dizi, anime ve diğer içeriklerin depolanması.
- **GitHub REST API:** Yönetim panelinden depo dosyalarını okuma ve commit oluşturma.
- **GitHub Pages:** Statik site barındırma.
- **Service Worker ve Web App Manifest:** Önbellek, çevrimdışı erişim ve ana ekrana uygulama olarak kurulum.

Dış veri kaynakları:

- **RAWG:** Oyun arama ve oyun bilgileri/görselleri.
- **TMDB:** Film ve dizi arama, detay ve görsel bilgileri.
- **Jikan / MyAnimeList:** Anime bilgileri ve ilgili bağlantılar.
- **AniList görsel CDN'i:** Arşivde kayıtlı anime kapaklarının sunulması.

Dış servislerden alınan başlık, görsel ve diğer bilgiler kaynaklarının kullanım şartlarına tabidir. Sayfalardaki veri kaynağı atıflarını kaldırmıyorum. TMDB atfında sitenin TMDB tarafından onaylanmadığı veya sertifikalandırılmadığı ifadesi korunmalıdır.

## Yerel ortamda çalıştırma

Projeyi bilgisayarda kontrol etmek için dosyaları bir klasöre çıkarmak yeterli. HTML dosyalarını doğrudan çift tıklayarak açmak yerine yerel bir web sunucusu kullanıyorum; böylece göreli dosya yolları, JSON istekleri ve service worker davranışı daha doğru test ediliyor.

Python kuruluysa proje kök klasöründe şu komut çalıştırılabilir:

```bash
python -m http.server 8000
```

Ardından tarayıcıdan şu adres açılır:

```text
http://localhost:8000/
```

Yönetim panelinin şifreli vault özelliği Web Crypto API gerektirir. `localhost` güvenli bağlam olarak desteklenir; canlı ortamda ise mutlaka HTTPS kullanılmalıdır. GitHub API ile gerçek depoya kayıt yapmak için `scripts/config.js` içindeki depo ayarlarının geçerli, vault'un kurulmuş ve token izinlerinin doğru olması gerekir.

## GitHub Pages üzerinde yayımlama

1. Proje klasörünün **içindeki dosyaları** GitHub deposunun yayımlama köküne yükle. `index.html`, `data/`, `scripts/`, `assets/` ve diğer klasörler aynı kök düzende kalmalı.
2. GitHub deposunda **Settings → Pages** bölümünü aç.
3. Yayın kaynağı olarak kullandığın dalı (genellikle `main`) ve kök klasörü (`/`) seç.
4. Özel alan adı kullanıyorsan kökteki `CNAME` dosyasında doğru alan adı bulunmalı.
5. DNS kayıtları ve GitHub Pages HTTPS ayarları tamamlandıktan sonra **Enforce HTTPS** seçeneğini etkinleştir.
6. Dağıtım tamamlandıktan sonra siteyi açıp temel sayfaları ve yönetim panelini kontrol et.

Özel alan adı için DNS ve HTTPS ayrıntıları: [`DOMAIN-KURULUM.txt`](DOMAIN-KURULUM.txt)

## Yönetim paneli ilk kurulumu

Yönetim paneli statik sitenin içinde çalışır. Ayrı bir sunucuya kullanıcı adı/parola göndermez; GitHub token'ını tarayıcıda çözüp GitHub API isteklerinde kullanır. İlk kurulum için:

1. GitHub hesabında yalnızca bu depo için kullanılacak bir token oluştur.
2. Token'a gerekli depo için **Contents: Read and write** izni ver. Gereksiz ek izinler verme; mümkünse token süresi belirle.
3. Siteyi HTTPS üzerinden aç ve `/admin/#kurulum` adresine git.
4. Token'ı ve en az 12 karakterden oluşan güçlü bir parola girerek şifreli vault üret.
5. Oluşan vault metnini `scripts/config.js` içindeki `vault` alanına yapıştır.
6. `owner`, `repo` ve `branch` değerlerinin doğru depoyu gösterdiğini kontrol et.
7. `config.js` dosyasını GitHub'a gönder ve yönetim panelini yeniden yükle.
8. Normal giriş ekranında vault oluştururken kullandığın parolayla giriş yap.

Vault, GitHub token'ını Web Crypto API kullanarak şifreler. Oturum açıldığında çözülen token tarayıcının `sessionStorage` alanında tutulur; panelden çıkış yapıldığında kaldırılır. Tarayıcı sekmesinin/oturumunun kapanması da oturum bilgisinin kalıcı olarak saklanmamasını sağlar.

`config.js` içinde `owner`, `repo`, `branch`, `rawgKey`, `tmdbKey`, `siteTitle`, `tagline`, `suggestUrl`, `goatcounter` ve `vault` gibi ayarlar bulunur. API anahtarları tarayıcıya gönderildiği için gizli sunucu anahtarı olarak değerlendirilmemeli; sağlayıcı panelinden alan adı/kullanım kısıtları ve kota ayarları yapılmalıdır.

## Yedekleme ve geri yükleme

Yönetim panelindeki **Genel Bakış & Yedek** bölümünde:

- Bütün arşiv verilerini JSON olarak indirebilirim.
- GitHub'daki `backups/latest.json` dosyasındaki son yedeği getirebilirim.
- Daha önce indirdiğim JSON yedeğini seçip geri yükleyebilirim.
- Kayıt öncesi otomatik yedeklemeyi etkinleştirebilirim.

Geri yükleme, seçilen yedekte bulunan kategori verilerini mevcut dosyaların üzerine yazabilir. İşlemden önce mevcut durum ayrıca yedeklenir; yine de geri yükleme kapsamını dikkatlice kontrol etmek gerekir. GitHub commit geçmişi de önceki dosya sürümlerine dönmek için kullanılabilir.

Büyük toplu içe aktarma, JSON düzenleme veya çok sayıda kaydı silme işleminden önce ayrıca yerel bir yedek indirmeyi tercih ediyorum.

## Güvenlik ve gizlilik notları

- Bu proje statik olarak yayımlandığı için `data/*.json` dosyaları ziyaretçiler tarafından okunabilir. Kişisel parola, özel mesaj, adres, ödeme bilgisi veya yayımlanmasını istemediğim başka verileri bu dosyalara eklemiyorum.
- Yönetim paneli sunucu tarafında kimlik doğrulama yapmaz. Güvenliği, şifreli vault, güçlü parola ve sınırlı yetkiye sahip GitHub token'ı üzerinden sağlar. Bu nedenle vault parolasını kimseyle paylaşmamak gerekir.
- GitHub token'ını hiçbir zaman düz metin olarak HTML, JavaScript, JSON veya README dosyasına yazmıyorum. Yalnızca şifreli vault değerini kullanıyorum.
- RAWG, TMDB veya Steam gibi servislerin API anahtarları tarayıcı tarafında görünür olabilir. Bunları gizli tutulan yönetici token'larıyla karıştırmıyorum; sağlayıcı tarafında kota ve alan adı kısıtlamaları kullanıyorum.
- Çekiliş katılımcı listeleri statik JSON içinde yayımlanabilir. Katılımcıların adlarını yayımlamadan önce gerekli izni almak gerekir.
- Üçüncü taraf API'ler geçici olarak yanıt vermeyebilir. Arşivde kayıtlı olan yerel veriler, dış kaynak çalışmadığında da kullanılabilecek şekilde saklanır.

## Bakım ve sorun giderme

### Değişiklikler sitede görünmüyor

GitHub commit'inin tamamlandığını kontrol et. Ardından sayfayı `Ctrl + F5` ile yenile. Service Worker eski dosyaları önbellekten sunuyorsa yeni dağıtımın ve service worker güncellemesinin tamamlanmasını beklemeden sayfanın güncellendiğini varsayma.

### Yönetim paneli giriş yapmıyor

- Siteyi `https://` adresinden aç.
- `scripts/config.js` içindeki vault metninin üç parçalı ve eksiksiz olduğundan emin ol.
- Doğru parolayı kullandığını kontrol et. Vault başka bir parolayla üretildiyse yeniden oluşturulması gerekir.
- GitHub token'ının geçerli olduğundan ve depoda **Contents: Read and write** izni bulunduğundan emin ol.
- `owner`, `repo` ve `branch` değerlerini kontrol et.

### GitHub'a kaydetme sırasında 401, 403 veya 404 hatası alıyorum

`401` genellikle geçersiz veya süresi dolmuş token'a; `403` yetki, kota veya politika kısıtına; `404` ise yanlış depo/yol veya erişim izni sorununa işaret edebilir. GitHub depo adresini ve token izinlerini kontrol et.

### JSON dosyası yüklenmiyor

Dosyanın geçerli JSON olduğunu, kategori dosyalarının üst seviyede dizi (`[]`), yıllık favoriler gibi ayar dosyalarının ise beklenen nesne yapısında (`{}`) olduğunu kontrol et. Elle düzenleme yaptıysan son virgül, tırnak veya parantez hatası dosyanın okunmasını engelleyebilir.

### Kapak görseli görünmüyor

Görsel adresinin `http://` veya `https://` ile başladığını, dosyanın kaynakta hâlâ erişilebilir olduğunu ve ilgili kaydın `image` alanının doğru olduğunu kontrol et. Arşiv Kontrol Merkezi bağlantı biçimini denetler ancak görselin uzak sunucudan gerçekten yüklenip yüklenemediğini garanti etmez.

### Arama penceresi veya sayfa düzeni eski görünüyor

Önce `Ctrl + F5` ile yenile. Sorun devam ederse `service-worker.js` önbellek sürümünü ve ilgili HTML dosyasındaki CSS/JavaScript sürüm parametrelerini kontrol et. Stil değişikliklerinde ortak CSS dosyalarının yüklenme sırasını koru.

## Ek dokümanlar

Projede belirli özellikler için ayrı notlar da bulunuyor:

- [`README-YILLIK-FAVORILER.md`](README-YILLIK-FAVORILER.md): Yıllara göre favoriler vitrininin kullanımı.
- [`README-ARAMA-PANELI.txt`](README-ARAMA-PANELI.txt): Arama penceresi hakkında notlar.
- [`README-CEKILIS-KURULUM.md`](README-CEKILIS-KURULUM.md): Çekiliş sayfasının kurulumu ve kullanımı.
- [`README-CEKILIS-GECMIS-SILME.md`](README-CEKILIS-GECMIS-SILME.md): Çekiliş geçmişiyle ilgili bakım notu.
- [`README-TASARIM.md`](README-TASARIM.md), [`README-TASARIM-2026.md`](README-TASARIM-2026.md): Tasarım katmanları ve arayüz notları.
- [`README-GAMECAPSULE-TEMA.md`](README-GAMECAPSULE-TEMA.md): GameCapsule tema uygulamasıyla ilgili notlar.
- [`DOMAIN-KURULUM.txt`](DOMAIN-KURULUM.txt): Özel alan adı ve HTTPS ayarları.
- [`README-GUNCELLEME.txt`](README-GUNCELLEME.txt): Önceki ana sayfa güncellemesi hakkında notlar.

## Lisans notu

Bu proje kişisel kullanımım için geliştirdiğim bir web arşividir. Projede kullanılan üçüncü taraf servislerin, görsellerin, yazı tiplerinin ve kütüphanelerin kendi lisans ve kullanım şartları geçerlidir.

Yerel QR kod motorunun temeli Kazuhiko Arase tarafından geliştirilen `qrcode-generator` çekirdeğine dayanır.

```text
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
```
