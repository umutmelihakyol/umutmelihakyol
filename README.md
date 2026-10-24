# Günlüğüm

Oyun, film, dizi ve anime arşivimi; kişisel puanlarımı, notlarımı, incelemelerimi ve Technopat içeriklerimi tek yerde tuttuğum kişisel medya arşivi.

**Canlı depo:** [umutmelihakyol/umutmelihakyol](https://github.com/umutmelihakyol/umutmelihakyol)

Günlüğüm, sunucu tarafında bir uygulama gerektirmeyen, HTML, CSS, JavaScript ve JSON dosyalarıyla çalışan statik bir web projesidir. GitHub Pages gibi statik barındırma servislerinde yayınlanabilir.

## İçindekiler

- [Öne çıkan özellikler](#öne-çıkan-özellikler)
- [Proje yapısı](#proje-yapısı)
- [Yerel olarak çalıştırma](#yerel-olarak-çalıştırma)
- [GitHub Pages üzerinde yayınlama](#github-pages-üzerinde-yayınlama)
- [Yönetim paneli](#yönetim-paneli)
- [Yapılandırma](#yapılandırma)
- [Veri dosyaları](#veri-dosyaları)
- [Kullanılan veri kaynakları](#kullanılan-veri-kaynakları)
- [Güvenlik ve gizlilik](#güvenlik-ve-gizlilik)
- [Sorun giderme](#sorun-giderme)

## Öne çıkan özellikler

### Medya arşivi

- Oyun, film, dizi ve anime için ayrı kategori sayfaları.
- Kayıt arama, kategoriye uygun filtreler ve sıralama seçenekleri.
- Kart ve liste görünümü; görüntüleme tercihi tarayıcıda saklanır.
- İzleme/oynama durumu, kişisel puan, tamamlanma tarihi, notlar, artılar ve eksiler.
- Favori ve öneri işaretleri.
- İçerik ayrıntılarında ilgili bağlantılar ve — oyun kayıtları için — PC kurulum profilleri.
- Aydınlık ve koyu tema.

### Oyun maliyeti ve kütüphane

`oyun/maliyet/index.html` sayfasında oyunların edinilme şekli, sahiplik durumu, satın alma fiyatı, para birimi, satın alma tarihi ve liste fiyatı gibi kayıtlı bilgiler incelenebilir. Özetler yalnızca girilmiş veriler üzerinden hesaplanır; farklı para birimleri otomatik olarak birbirine çevrilmez. Maliyet verileri CSV biçiminde dışa aktarılabilir.

### Technopat içerikleri

Technopat'ta yayımlanan incelemeler ve rehberler, `data/technopat.json` dosyasından beslenen ayrı sayfalarda sunulur. Yönetim panelinden bu kartlar eklenebilir, düzenlenebilir ve kaldırılabilir.

### Gelişmiş yönetim paneli

`admin/index.html` üzerinden aşağıdaki işlemler yapılabilir:

- Medya kayıtlarını oluşturma, düzenleme ve silme; seçili kayıtlar üzerinde toplu işlem uygulama.
- Son silinenler listesinden kayıtları geri yükleme.
- Kayıt istatistiklerini görüntüleme ve arşiv kontrolü yapma.
- JSON yedeği indirme, GitHub'daki son yedeği yükleme ve yedekten geri dönme.
- Steam kütüphanesini, Letterboxd dışa aktarım dosyalarını ve MyAnimeList verilerini içe aktarma.
- Site/API ayarlarını, kategori tanımlarını ve desteklenen depo dosyalarını düzenleme.
- Technopat inceleme ve rehber kartlarını yönetme.
- İçeriklere ilgili bağlantılar ve oyunlara kurulum profilleri ekleme.

Yönetim paneli ziyaretçi menüsünde bağlantı olarak gösterilmez; adres doğrudan açılır. Yetkilendirme ve GitHub'a yazma işlemleri için [Güvenlik ve gizlilik](#güvenlik-ve-gizlilik) bölümünü de okuyun.

### PWA ve çevrimdışı destek

Manifest, uygulama simgeleri, servis çalışanı ve çevrimdışı sayfası sayesinde site desteklenen tarayıcılarda uygulama gibi kurulabilir. Servis çalışanı temel sayfaları ve yerel kaynakları önbelleğe alarak bağlantı sorunlarında yardımcı olur. Harici API'ler ve görseller çevrimdışı durumda her zaman erişilebilir olmayabilir.

> Not: QR kodu oluşturma sistemi bu sürümde bulunmuyor.

## Proje yapısı

```text
.
├── index.html                     # Ana sayfa
├── admin/
│   └── index.html                 # Yönetim paneli
├── oyun/
│   ├── index.html                 # Oyun arşivi
│   └── maliyet/
│       └── index.html             # Oyun maliyeti ve kütüphane
├── film/index.html                # Film arşivi
├── dizi/index.html                # Dizi arşivi
├── anime/index.html               # Anime arşivi
├── technopat/
│   ├── incelemeler/index.html     # Technopat incelemeleri
│   └── rehberler/index.html       # Technopat rehberleri
├── data/
│   ├── games.json                 # Oyun kayıtları
│   ├── movies.json                # Film kayıtları
│   ├── series.json                # Dizi kayıtları
│   ├── anime.json                 # Anime kayıtları
│   └── technopat.json             # İnceleme ve rehber listeleri
├── backups/
│   └── latest.json                # En son otomatik yedek (oluşturulduğunda)
├── assets/
│   ├── css/                       # Tema, kartlar ve sayfa stilleri
│   └── icons/                     # PWA simgeleri
├── scripts/
│   ├── config.js                  # Site ve API yapılandırması
│   ├── categories.js              # Kategori tanımları ve görsel URL işlemleri
│   ├── app.js                     # Ortak medya listeleme uygulaması
│   ├── media-extras.js            # İlgili bağlantılar ve kurulum profilleri
│   ├── anime-detail.js            # Anime ayrıntıları
│   ├── technopat.js               # Technopat içeriklerini görüntüleme
│   ├── theme.js                   # Tema yönetimi
│   ├── intro-loader.js            # Açılış/yükleme ekranı
│   └── pwa.js                     # PWA/servis çalışanı yönetimi
├── manifest.webmanifest           # PWA tanımı
├── service-worker.js              # Önbellek ve çevrimdışı davranışı
└── offline.html                   # Çevrimdışı bilgilendirme sayfası
```

## Yerel olarak çalıştırma

Siteyi `file://` adresinden açmak yerine yerel HTTP sunucusu kullanın. Python 3 kuruluysa depo kök klasöründe şu komut yeterlidir:

```bash
python -m http.server 8000
```

Ardından tarayıcıda `http://localhost:8000/` adresini açın. Yönetim paneli `http://localhost:8000/admin/` konumundadır.

Site verilerinin ve yönetim panelinin GitHub üzerinden yaptığı işlemlerin çalışması için internet bağlantısı gerekir. Yerel testte yapılan dosya değişiklikleri otomatik olarak GitHub'a yayımlanmaz.

## GitHub Pages üzerinde yayınlama

1. Depodaki dosyaları ve klasörleri koruyarak `main` dalına gönderin.
2. GitHub deposunda **Settings → Pages** bölümünü açın.
3. Yayınlama kaynağını deponuzun kullandığı düzene göre yapılandırın. Kök dizinden yayın yapılıyorsa `main` dalı ve `/ (root)` seçilebilir.
4. GitHub Pages dağıtımı tamamlandığında Pages ayarlarında gösterilen site adresini açın.

Yeni HTML, CSS, JavaScript veya JSON dosyaları eklerken ilgili sayfalardaki göreli yolların doğru olduğundan emin olun. Sayfalar proje köküne göre farklı derinliklerde bulunduğu için CSS, JavaScript ve veri dosyası yolları her sayfada aynı olmayabilir.

## Yönetim paneli

### İlk kurulum ve GitHub erişimi

Yönetim paneli depo içeriğini GitHub Contents API üzerinden okuyup günceller. Bu nedenle `scripts/config.js` içindeki `owner`, `repo` ve `branch` değerleri doğru olmalıdır.

Panelin ilk kurulum ekranında GitHub token'ı ve en az 12 karakterli bir parola kullanılarak şifreli `vault` değeri oluşturulur. Panelin gösterdiği şifreli metin `scripts/config.js` dosyasının `vault` alanına kaydedilir; **ham token'ı doğrudan JavaScript dosyasına veya herkese açık bir dosyaya yazmayın.** Token için mümkün olan en düşük yetkileri verin ve yalnızca bu depoya erişim tanımlayın.

İlk kurulum sırasında panelde gösterilen yönergeleri izleyin. Daha sonra panelde oturum açmak için belirlediğiniz parolayı kullanın. Token'ın depo izinleri yoksa, dal koruması yazmayı engelliyorsa veya ayarlardaki depo adı hatalıysa kayıt işlemi başarısız olabilir.

### İçerik ekleme ve güncelleme

1. `admin/` adresini açın ve giriş yapın.
2. **İçerik Yönetimi** bölümünde kategori seçin.
3. Başlığa göre arama yapın veya desteklenen dış kaynaklardan sonuç getirin.
4. Durum, kişisel puan, tarih, not ve diğer gerekli alanları düzenleyin.
5. İlgili bağlantıları ve oyunlara ait kurulum profillerini gerekirse ekleyin.
6. Kaydedin; panel kayıtları ilgili `data/*.json` dosyasına GitHub commit'i olarak yazar.

Yayının siteye yansıması GitHub Pages dağıtımına ve önbelleğe bağlı olarak kısa bir süre alabilir.

### Yedekleme ve geri yükleme

Panelin yedekleme özelliği, desteklenen kategori verilerini JSON olarak dışa aktarmayı ve yedekten geri yüklemeyi sağlar. Otomatik yedekleme etkinse kayıt öncesi yedek `backups/latest.json` dosyasına yazılabilir. Tarayıcıda tutulan yerel yedekler yalnızca o tarayıcıda bulunur; tarayıcı verilerinin temizlenmesi bu kopyaları silebilir.

Geri yükleme işlemi yedekte yer alan kategorilerin mevcut verilerini değiştirebilir. Yüklemeden önce yedek önizlemesini ve kategori sayılarını kontrol edin.

## Yapılandırma

Genel ayarlar `scripts/config.js` dosyasında `window.CONFIG` nesnesinde tutulur:

| Alan | Açıklama |
|---|---|
| `siteTitle` | Site başlığı |
| `owner` | GitHub depo sahibi/kullanıcısı |
| `repo` | GitHub depo adı |
| `branch` | İçeriklerin yazıldığı dal (mevcut yapılandırmada `main`) |
| `rawgKey` | RAWG oyun arama API anahtarı |
| `tmdbKey` | TMDB film ve dizi API anahtarı |
| `tagline` | Ana sayfadaki ek başlık/metin alanı |
| `suggestUrl` | Öneri düğmesinin hedef adresi; boşsa düğme gösterilmez |
| `goatcounter` | İsteğe bağlı GoatCounter site kodu; boşsa sayaç yüklenmez |
| `vault` | Yönetim paneli için şifrelenmiş GitHub token verisi |

`config.js` dosyasını değiştirirken dosyanın JavaScript sözdizimini ve virgülleri koruyun. Yönetim panelindeki ayar ekranı desteklenen yapılandırma değerlerini depo üzerinden güncelleyebilir.

## Veri dosyaları

- `data/games.json`, `data/movies.json`, `data/series.json` ve `data/anime.json` dosyaları kayıt dizileri içerir.
- `data/technopat.json` inceleme ve rehber listelerini ayrı gruplar hâlinde tutar.
- `backups/latest.json` otomatik yedekleme kullanıldığında oluşturulan son yedektir.

Medya kayıtlarında kullanılan alanlar kategoriye göre değişebilir. Yaygın alanlar arasında `id`, `title`, `status`, `image`, `platform`, `genres`, `score`, `finished`, `recommended`, `review`, `note`, `year`, `favorite`, `pros`, `cons` ve `updatedAt` bulunur. İlgili bağlantılar `links` alanında; oyun kurulum profilleri `installProfiles` alanında tutulur. Oyun kayıtlarında edinim ve maliyet takibi için ek alanlar bulunabilir.

Mümkün olduğunda kayıtları elle JSON düzenlemek yerine yönetim panelini kullanın. JSON'ı elle değiştirirseniz dosyanın geçerli JSON olması, virgül/tırnakların doğru kullanılması ve dosyanın dizi veya nesne yapısının korunması gerekir.

## Kullanılan veri kaynakları

- **Oyun arama ve metadata:** RAWG API.
- **Film ve dizi arama/metadata:** The Movie Database (TMDB) API.
- **Anime arama ve metadata:** AniList GraphQL ve Jikan/MyAnimeList kaynakları.
- **Dışa aktarma:** Steam kütüphanesi, Letterboxd CSV dosyaları ve MyAnimeList XML/kullanıcı listesi yönetim panelinden içe aktarılabilir.

Verilerin ve kapak görsellerinin erişilebilirliği ilgili dış hizmetlere, API limitlerine ve ağ bağlantısına bağlıdır. Kaynakların kullanım koşullarına uyun ve sayfalarda gösterilen kaynak/atıf metinlerini kaldırmayın. Günlüğüm, TMDB tarafından onaylanmış veya sertifikalandırılmış bir ürün değildir.

## Güvenlik ve gizlilik

- Statik bir sitenin tarayıcıda çalışan JavaScript'i ziyaretçiler tarafından görüntülenebilir. `rawgKey` ve `tmdbKey` gibi istemci tarafında kullanılan API anahtarlarını gizli sunucu sırları olarak değerlendirmeyin; ilgili sağlayıcıların kısıtlamalarını ve kullanım limitlerini yapılandırın.
- GitHub token'ını sohbetlere, issue'lara, ekran görüntülerine veya herkese açık dosyalara koymayın. Ham token'ı `config.js` içine yapıştırmayın; yönetim panelinin şifreli `vault` akışını kullanın.
- Şifreli `vault` değeri, güçlü parolanın yerini tutmaz. Parolayı güvenli saklayın ve paylaşmayın. Şüpheli bir durumda GitHub token'ını iptal edip yenisini oluşturun.
- Depo herkese açıksa `data/*.json` ve `backups/latest.json` içindeki kişisel notlar, puanlar, fiyat kayıtları ve diğer içerikler de herkese açık kabul edilmelidir. Herkese açık depoya özel veya hassas bilgi eklemeyin.
- Bu projede sunucu tarafında kullanıcı yönetimi bulunmadığından, panel güvenliği yalnızca bir sunucu oturumuna dayalı değildir. Üretim ortamında yüksek hassasiyetli verilere erişim veya daha sıkı yetkilendirme gerekiyorsa sunucu taraflı bir mimari değerlendirilmelidir.

## Sorun giderme

**Değişiklikler sitede görünmüyor**

- GitHub commit'inin başarılı olduğunu ve Pages dağıtımının tamamlandığını kontrol edin.
- Sayfayı `Ctrl + F5` ile yenileyin.
- CSS/JavaScript dosyalarında sürüm sorgusu (`?v=...`) kullanılıyorsa güncellenen dosyanın sürümünü artırın.
- Çevrimdışı kullanım veya eski kaynaklar devam ediyorsa `service-worker.js` içindeki önbellek sürümünü ve önbelleğe alınan dosya listesini kontrol edin.

**Kapaklar veya API araması çalışmıyor**

- İnternet bağlantısını, ilgili API anahtarını ve sağlayıcının hizmet durumunu kontrol edin.
- API limitleri, engelleyiciler, CORS kısıtlamaları veya harici servis değişiklikleri sonuçları etkileyebilir.
- Harici görseller site dosyalarına gömülü değildir; kaynak sunucuda sorun varsa yüklenmeyebilir.

**Yönetim paneli GitHub'a kaydedemiyor**

- `owner`, `repo` ve `branch` değerlerini kontrol edin.
- Giriş parolasını ve şifreli `vault` değerini doğrulayın.
- Token'ın hedef depoda içerik okuma/yazma yetkisi bulunduğundan emin olun.
- Hata sürüyorsa dal koruma kurallarını, depo izinlerini ve GitHub API yanıtını kontrol edin.

**PWA eski görünümü gösteriyor**

- İnternet bağlantısıyla sayfayı yenileyin ve servis çalışanının güncellenmesine izin verin.
- Geliştirme sırasında tarayıcı geliştirici araçlarındaki Application/Service Workers bölümünden servis çalışanını ve önbelleği inceleyebilirsiniz.

---

Günlüğüm kişisel kullanım ve içerik düzenleme odaklı geliştirilmektedir. Yeni özellik eklerken mevcut veri dosyalarını ve göreli dosya yollarını korumak, değişiklikleri küçük tutmak ve yedek alarak ilerlemek önerilir.
