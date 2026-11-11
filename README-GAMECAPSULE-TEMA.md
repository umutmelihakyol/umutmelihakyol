# Günlüğüm — GameCapsuleTV tasarım uyarlaması

Bu sürümde GameCapsuleTV'nin koyu arayüz yaklaşımı, mor/mavi vurgu paleti, sabit üst gezinmesi, açılır tüm-site menüsü, mobil alt gezinme ve kart/panel dili Günlüğüm'e uyarlandı.

## Kapsanan sayfalar

Ana sayfa, oyunlar, oyun maliyeti, filmler, diziler, animeler, gelişmiş arama, istatistikler, kişiler ve stüdyolar, Technopat incelemeleri, Technopat rehberleri, çekiliş, yönetim paneli, çevrimdışı ekranlar ve 404 sayfası aynı tasarım katmanını kullanır.

## Tasarım dosyaları

- `assets/css/gamecapsule-theme.css`: ortak görünüm, sayfa bileşenleri, yönetim ekranı, mobil düzen ve açık/koyu görünüm stilleri.
- `scripts/gamecapsule-theme.js`: ortak üst menü, açılır yan menü, mobil gezinme, erişilebilir menü klavye davranışı ve tema tercihi.
- `service-worker.js`: yeni CSS/JS sürümünün eski PWA önbelleğinden ayrılması için `v39`.

## Mevcut özellikler

Arşiv verileri, filtreleme ve sıralama, detay pencereleri, istatistikler, Technopat içerikleri, çekiliş akışı, oyun maliyetleri, inceleme kartı oluşturucu ve yönetim paneli işlevleri korunmuştur. Tema katmanı mevcut sayfa işlevlerinin yerine geçmez; tüm sayfalarda ortak görsel sistem sağlar.

Varsayılan görünüm koyudur. Sayfalardaki mevcut tema düğmeleri ve yönetim panelindeki tema düğmesi aynı tercihi paylaşır.

## 5 Kasım 2026 — Görsel tutarlılık güncellemesi

`assets/css/gamecapsule-consistency.css` tüm sayfalarda GameCapsule koyu lacivert, mor ve mavi tasarım dilini tek renk değişkeni kaynağı olarak uygular. Eski matte/atelier değişkenlerinin kartlara, admin ekranına ve ayrıntı pencerelerine sızması önlendi. Açık tema da aynı bileşen dilinin açık renk karşılığına geçirildi. Service Worker önbelleği `v40` sürümüne yükseltildi.
