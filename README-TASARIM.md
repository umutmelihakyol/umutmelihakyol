# Günlüğüm — Yeni Tasarım

Bu sürümde sitenin herkese açık sayfalarının tasarımı yenilendi.

## Görsel değişiklikler
- Daha editoryal bir görünüm için sıcak nötr renk paleti ve kiremit vurgu rengi kullanıldı.
- Başlıklarda Archivo, gövde metinlerinde IBM Plex Sans ve küçük etiketlerde IBM Plex Mono kullanıldı.
- Ana sayfanın hero alanı, kategori koleksiyonları, arşiv araçları ve Technopat bölümü yeniden düzenlendi.
- Arşiv kartları, filtreler, düğmeler, tablolar, istatistikler, arama, kişiler ve Technopat sayfaları aynı tasarım diline getirildi.
- Mobil ekranlarda menüler ve ızgaralar yeniden düzenlendi.
- Çevrimdışı ve 404 sayfaları da yeni görsel dile uyarlandı.

## Teknik notlar
- Mevcut kayıtlar, JSON veri dosyaları, arama/filtreleme, kart oluşturucu, tema değiştirme, yönetim paneli ve çekiliş akışı korunmuştur.
- Yeni ortak stil dosyası: `assets/css/redesign.css`
- Service Worker önbellek sürümü `v31` olarak güncellendi ve yeni stil dosyası önbelleğe eklendi.
- Google Fonts üzerinden Archivo ve IBM Plex fontları yüklenir.

## Yayına alma
Arşivdeki dosyaları mevcut GitHub Pages deposunun üzerine yükleyin. Yeni `assets/css/redesign.css` dosyasının da yüklendiğinden emin olun. Yayından sonra tarayıcıda sert yenileme yapmak eski dosyaların önbellekten gelmesini önler.
