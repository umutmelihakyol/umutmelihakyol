# Çekiliş geçmişini silme güncellemesi

Bu paket yalnızca değişen dosyaları içerir. ZIP'i deponun kök dizinine çıkarıp mevcut dosyaların üzerine yazın.

Değişen dosyalar:
- `admin/index.html`
- `scripts/giveaway-admin.js`
- `assets/css/giveaway-admin.css`
- `service-worker.js`

`data/cekilis.json` pakete dahil değildir; mevcut çekiliş kayıtlarınız korunur.

Yönetim panelindeki Çekiliş Yönetimi sekmesinde tamamlanmış veya iptal edilmiş geçmiş kayıtlarında **Geçmişten sil** düğmesi görünür. İşlem onay ister ve seçilen kaydı depodaki geçmişten kalıcı olarak kaldırır. Kazanan adları ve diğer kilitli alanlar düzenlenemez; yalnızca tüm tarihsel kayıt silinebilir.
