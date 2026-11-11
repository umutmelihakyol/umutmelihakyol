# Yıllara Göre Favoriler Vitrini

Anasayfadaki “Yıllara göre favorilerim” bölümü `data/yearly-favorites.json` dosyasını kullanır. Dosyadaki `years` listesinde her yıl için kategori başına bir arşiv kayıt kimliği tutulur.

## Yönetim

1. `/admin/` sayfasını açıp yönetim paneline giriş yap.
2. **Yıllık Favoriler** sekmesine geç ve **GitHub'dan Getir / Yenile** düğmesine bas.
3. 2025, 2026 ve 2027 yılları başlangıç olarak hazır gelir. Gerekirse yeni yıl ekle.
4. Her yıl için oyun, dizi, film ve anime açılır listelerinden favorilerini seç.
5. **Değişiklikleri GitHub'a Kaydet** düğmesine bas.

Açılır listeler `data/games.json`, `data/series.json`, `data/movies.json` ve `data/anime.json` arşivlerinden gelir. Bu nedenle yeni bir görsel veya başlık girmek gerekmez. Seçilen içerik kartı anasayfada ilgili arşiv kaydına bağlanır.

Vitrin, en az bir favori seçimi olan yıllarda görünür. Boş bırakılan kategori kartları ziyaretçilere gösterilmez.
