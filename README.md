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
