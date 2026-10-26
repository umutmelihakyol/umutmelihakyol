# Günlüğüm (oyun, film, dizi, anime)

Statik bir site: sunucu gerekmez. GitHub Pages veya Netlify ile yayınlanır.

## Sayfalar
- `index.html`: Ana sayfa. Oyun, Film, Dizi ve Anime düğmeleri ve "Son eklenenler".
- `oyun.html`, `film.html`, `dizi.html`, `anime.html`: Kategori sayfaları (hepsi `app.js` kodunu kullanır).
- `admin.html`: Tek yönetim paneli. Üstteki düğmelerden kategoriyi seçip veri girersin.
- `categories.js`: Kategorilerin ortak tanımı (etiketler, alanlar, durum adları).
- Veri dosyaları: `games.json`, `movies.json`, `series.json`, `anime.json`.

## Güncelleme (eski kurulumdan geçiş)
1. Bu klasördeki **tüm dosyaları** depona yükle. Yalnızca **`config.js` dosyasının üzerine yazma**: kendi `config.js` dosyana şu iki satırı ekle:
   ```
   tmdbKey: "",
   tagline: "",
   ```
2. `games.json` dosyana dokunma, mevcut oyunların aynen çalışır. `movies.json`, `series.json`, `anime.json` boş olarak gelir.
3. `config.js` içindeki `path` alanı artık kullanılmıyor (dosya adları `categories.js` içinde).
4. Eskiden paylaştığın `index.html#oyunid` bağlantıları ana sayfaya gelir ve otomatik olarak `oyun.html#oyunid` adresine yönlenir.
5. `siteTitle` değerini genel bir isimle değiştirebilirsin (ör. "Günlüğüm").

## API anahtarları
- **Oyun:** RAWG (`rawgKey`), zaten var.
- **Film ve dizi:** TMDB. themoviedb.org'da ücretsiz hesap aç, Ayarlar > API bölümünden **API Anahtarı (v3)** al, `config.js` içindeki `tmdbKey` alanına yaz. Türler, yönetmen, süre, sezon ve bölüm sayısı Türkçe olarak otomatik gelir.
- **Anime:** Jikan (MyAnimeList). Anahtar gerekmez. Bölüm sayısı, stüdyo ve türler otomatik gelir.

## Kullanım
- `admin.html` sayfasına şifrenle gir, üstten kategoriyi seç (Oyun, Film, Dizi, Anime).
- Ada göre ara, çıkan sonuca tıkla: kapak, tür, yıl, yönetmen/yaratıcı/stüdyo ve süre ya da bölüm bilgisi forma dolar. Durumu, puanı ve tarihi girip kaydet.
- Her kategori kendi dosyasına kaydedilir. Kayıt sonrası site 1-2 dakika içinde güncellenir.

## Diğer ayarlar (`config.js`)
- `suggestUrl`: "Bana öner" düğmesi (Google Forms bağlantısı ya da `mailto:`). Boşsa düğme görünmez.
- `goatcounter`: Çerezsiz ziyaretçi sayacı. Hangi kayıtların açıldığı da sayılır. Boşsa kapalı. Kendi ziyaretlerini saymamak için konsola `localStorage.skipgc='t'` yaz.
- `tagline`: Ana sayfadaki başlık cümlesi.

## Yeni kategori eklemek
`categories.js` içine yeni bir blok ekle, `oyun.html` dosyasını kopyalayıp `data-cat` ve `cat-` sınıfını değiştir, boş bir `.json` dosyası oluştur. Arama kaynağı gerekiyorsa `admin.html` içindeki `search` fonksiyonuna ekle.

## Kaynak belirtme
Sayfa altlarında RAWG, TMDB ve Jikan kaynakları belirtilir. TMDB kullanım şartları gereği bu bilgiyi kaldırma.


## Klasör yapısı

- `index.html` — ana sayfa
- `admin/index.html` — doğrudan adresle açılan yönetim paneli (site menülerinde bağlantısı yoktur)
- `oyun/index.html`, `film/index.html`, `dizi/index.html`, `anime/index.html` — kategori sayfaları
- `data/` — kategori kayıtlarını tutan JSON dosyaları
- `assets/css/style.css` — görsel tasarım
- `scripts/` — uygulama, tema, yapılandırma ve kategori JavaScript dosyaları

GitHub üzerinden kayıt güncellerken veri dosyalarının depo yolları `data/games.json`, `data/movies.json`, `data/series.json` ve `data/anime.json` olarak kullanılır. Sayfalardaki veri yükleme adresleri site kök dizinine göre oluşturulur.

## QR kod oluşturma bileşeni hakkında
==================================

Günlüğüm paketindeki yerel QR motorunun temeli, Kazuhiko Arase tarafından geliştirilen qrcode-generator uygulamasının QRCode çekirdeğine dayanır.

Copyright (c) 2009 Kazuhiko Arase
MIT License

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

## Özel alan adı ve HTTPS

Bu proje GitHub Pages üzerinde `umutmelihakyol.com` alan adını kullanır. Dal üzerinden yayımlama yapılıyorsa depo kökündeki `CNAME` dosyası yalnızca `umutmelihakyol.com` satırını içermelidir.

1. GitHub deposunda **Settings → Pages → Custom domain** alanına `umutmelihakyol.com` yazıldığını kontrol et.
2. Alan adı sağlayıcısında kök alan adı (`@`) için GitHub Pages'in önerdiği A kayıtlarını yapılandır: `185.199.108.153`, `185.199.109.153`, `185.199.110.153` ve `185.199.111.153`. Sağlayıcı destekliyorsa GitHub'ın resmi belgelerindeki IPv6 kayıtlarını da ekleyebilirsin. Eski/çakışan kayıtları, mevcut DNS durumunu doğrulamadan silme.
3. GitHub Pages ayarlarında sertifika hazır olduğunda **Enforce HTTPS** seçeneğini etkinleştir. DNS ve sertifika değişikliklerinin yayılması zaman alabilir.
4. Yönetim panelini `https://umutmelihakyol.com/admin/` adresinden aç. HTTP ve `www` girişleri ana HTTPS adresine yönlendirilir. Giriş anahtarını çözmek için tarayıcının Web Crypto özelliği güvenli bağlam (HTTPS) gerektirir.
5. Dağıtımdan sonra tarayıcıda `Ctrl+F5` yap. Günlüğüm servis çalışanının önbellek sürümü de yükseltilmiştir.

> Not: Özel alan adı ilk kez bağlandığında `localStorage` ve `sessionStorage` önceki `github.io` origin'inden ayrı tutulur. Tema tercihi veya açık yönetim oturumu yeni alan adına otomatik taşınmaz; yönetim panelinde yeniden giriş yapmak gerekir. GitHub token'ını doğrudan HTML/JS içine düz metin olarak koyma.

Daha fazla bilgi: [GitHub Pages özel alan adlarını yönetme](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) ve [GitHub Pages için HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

