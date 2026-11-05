# Günlüğüm — GameCapsule esintili tasarım

Bu güncelleme, GameCapsuleTV sitesindeki koyu arayüz ve kapsül yaklaşımından esinlenen ortak bir tasarım katmanı ekler. GameCapsuleTV'nin logosu, görselleri veya marka varlıkları kopyalanmamıştır.

## Eklenen dosyalar
- `assets/css/gamecapsule-theme.css`: Tüm sayfalar için ortak renk paleti, panel, kart, form, admin ve responsive stilleri.
- `scripts/gamecapsule-theme.js`: Üst gezinme, açılır yan menü, mobil alt gezinme, tema tercihi ve hafif sayfa giriş animasyonları.

Mevcut arşiv verileri, JSON dosyaları, sayfa adresleri, arama, inceleme kartı oluşturucu, istatistik, Technopat içerikleri, çekiliş ve yönetim paneli işlevleri korunmuştur. Yeni dosyalar PWA Service Worker önbellek listesine de eklenmiştir.

Tema varsayılan olarak koyu açılır. Üst sayfa araçlarındaki tema düğmesi koyu varyantlar arasında geçiş yapar.
