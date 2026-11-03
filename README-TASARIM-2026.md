# Günlüğüm — Yeni Tasarım

Bu sürümde sitenin görsel arayüzü baştan sona yenilendi. Veri dosyaları ve mevcut JavaScript iş akışları korunmuştur.

## Tasarım sistemi

- `assets/css/atelier.css`: tüm site için yeni ortak tasarım sistemi.
- Kullanılan görsel dil: editoryal medya arşivi; kırık beyaz yüzeyler, mürekkep tonları ve kontrollü kiremit vurgular.
- Tipografi: DM Sans ve Space Grotesk.
- Açık/koyu tema değişkenleri korunur.

## Yenilenen alanlar

- Ana sayfa ve kategori keşif kartları
- Oyun, film, dizi ve anime arşivleri
- Gelişmiş arama
- İstatistikler
- Kişiler ve stüdyolar
- Technopat incelemeler ve rehberler
- Oyun maliyeti ve kütüphane takibi
- Çekiliş sayfası
- Yönetim paneli ve tüm yönetim sekmeleri
- 404 ve çevrimdışı sayfaları

## Yayına alma

ZIP içindeki `umutmelihakyol-main` klasörünün içeriğini GitHub deposunun kök dizinine yükleyip mevcut dosyalarla değiştir. `CNAME`, `data/` ve `scripts/` klasörlerini de birlikte tut.

Service Worker sürümü artırıldı. Site yayımlandıktan sonra bir kez sert yenileme (`Ctrl + F5`) yap. PWA kullanan cihazlarda yeni stil dosyası güncel önbellek sürümüyle alınır.

## Korunan özellikler

JSON arşivleri, yönetim panelinin giriş ve kayıt akışı, GitHub senkronizasyonu, API içe aktarma, yedekleme, dosya düzenleyici, filtreler, arama, sıralama, liste/kart görünümü, ayrıntı pencereleri, istatistik hesaplamaları ve çekiliş işleyişi değiştirilmedi.
