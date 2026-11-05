# Günlüğüm — Archive Editorial Tasarım Sistemi

Bu sürüm, sitenin önceki parlak/yuvarlatılmış arayüzünü kaldırıp daha sakin, editoryal bir kişisel arşiv görünümüne geçirir.

## Tasarım dili

- Sıcak kırık beyaz ve kâğıt tonları; koyu temada kömür ve yosun tonları.
- Mat kiremit vurgu rengi, düşük kontrastlı çizgiler ve düz yüzeyler.
- Başlıklarda Fraunces, arayüz ve gövde metinlerinde IBM Plex Sans.
- Daha köşeli kartlar, sade düğmeler, çizgi tabanlı bölüm ayrımları ve ortak gezinme çubuğu.
- Mobil ekranda yatay kaydırılabilir gezinme ve tek/iki sütunlu içerik düzenleri.

## Dosyalar

- `assets/css/archive-editorial.css`: tüm siteyi kapsayan yeni görsel sistem.
- `scripts/site-nav.js`: sayfalar arasında tutarlı ana gezinme menüsü.
- `service-worker.js`: önbellek sürümü v34; yeni stil ve navigasyon dosyaları çevrimdışı temel varlıklara dahil.
- `manifest.webmanifest`: yeni açık tema arka plan ve araç çubuğu rengi.

## Kapsam

Ana sayfa, oyun/film/dizi/anime arşivleri, gelişmiş arama, istatistikler, kişiler ve stüdyolar, Technopat incelemeleri/rehberleri, çekiliş, oyun maliyeti/kütüphane, yönetim paneli, 404 ve çevrimdışı sayfaları ortak tasarım sistemini kullanır.

## Korunan işlevler

JSON arşivleri, mevcut kayıtlar, filtreler, sıralama, kart/liste görünümü, ayrıntı pencereleri, istatistik hesaplamaları, yönetim paneli, GitHub senkronizasyonu, yedekleme, içe aktarma ve çekiliş işleyişine müdahale edilmedi. Değişiklikler görünüm katmanı, ortak gezinme ve PWA varlık listesini kapsar.

## Yayına alma

ZIP içindeki `umutmelihakyol-main` klasörünün içeriğini GitHub deposunun kök dizinine yükle. `CNAME`, `data/`, `scripts/` ve `assets/` klasörlerini birlikte koru. Yayından sonra bir kez `Ctrl + F5` ile sert yenileme yap; PWA kullanan cihazlarda Service Worker yeni v34 önbelleğini kurar.

## 5 Kasım 2026 küçük etkileşim güncellemesi

- Ana sayfadaki dört kategori kartı, ilgili arşivdeki en yeni `updatedAt` kaydının kapak görselini kullanır; eşitlik/fallback durumunda `addedAt`, `createdAt` ve `finished` tarihleri değerlendirilir. Favori olma durumu bu sıralamayı etkilemez.
- Kartlarda son eklenen içeriğin adı da görünür.
- Technopat ana sayfa kartları fareyle üzerine gelindiğinde sıcak bakır tonunda kenarlık/parıltı ve ikon vurgusu gösterir; klavye odağında da aynı geri bildirim sağlanır.
- Service Worker önbelleği v35'e yükseltildi.
