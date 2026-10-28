# Günlüğüm — Çekiliş sayfası

## Sayfaya erişim

Çekiliş sayfası yalnızca doğrudan `https://umutmelihakyol.com/cekilis/` adresinden açılacak şekilde hazırlanmıştır. Ana menüye, ana sayfadaki araçlara, sitemap'e veya herkese açık başka bir bağlantıya eklenmemiştir. Yönetim tarafında ise `/admin/` içindeki **Çekiliş Yönetimi** sekmesi bulunur.

## İlk kurulum

1. Bu paketteki dosyaları GitHub deposunun kök dizinine, klasör yapısını koruyarak yükleyin.
2. GitHub deposunda **Actions** özelliğinin açık olduğundan emin olun.
3. `Settings → Actions → General → Workflow permissions` bölümünde iş akışına içerik yazma izni verilmelidir. `.github/workflows/finalize-giveaways.yml` dosyası `contents: write` iznini tanımlar; depo/organizasyon ayarları bunu daha fazla kısıtlayabilir.
4. İlk dağıtım tamamlanıp `https://umutmelihakyol.com/cekilis/` açılabilir hâle geldikten sonra `/admin/` paneline giriş yapıp **Çekiliş Yönetimi** sekmesini açın.

## Çekiliş oluşturma

- Başlık, açıklama ve yerel başlangıç tarih/saatini girin.
- Çark süresini 5–3600 saniye arasında seçin.
- Kazanan sayısını girin.
- Her katılımcının adını ayrı satıra yazın. İsimler büyük/küçük harf duyarsız olarak yineleniyorsa tek kayıt sayılır.
- GitHub Pages yayını ve önbellek dağıtımı için başlangıç en az 5 dakika ileriye planlanmalıdır.
- Oluşturulan çekiliş, başlangıç saati gelene kadar düzenlenebilir veya iptal edilebilir. Başlangıç saati geldiğinde katılımcı listesi, süre ve kazanan sayısı kilitlenir.

## Çark ve kazananların sabitlenmesi

Herkese açık sayfa, planlanan saat geldiğinde çarkı döndürür. Süre dolunca, çekiliş başlatılırken kaydedilen taahhütle eşleşen katılımcı listesini kullanır ve belirlenen çekiliş bitişinden sonraki drand quicknet turunu alır. Uygulama iki ayrı drand uç noktasının aynı imza/rastgelelik değerini vermesini ve rastgelelik değerinin imza özetine eşleşmesini bekler. Bir kaynak erişilemezse kazanan uydurmak yerine yeniden dener.

`.github/workflows/finalize-giveaways.yml` iş akışı her 5 dakikada bir ve `workflow_dispatch` ile elle çalıştırılabilir. Süresi bitmiş kayıtları `data/cekilis.json` içine sonuçlarıyla yazar ve geçmişe taşır. GitHub, zamanlanmış iş akışlarını yoğunlukta geciktirebilir; dolayısıyla **çarkın sayfada dönmesi planlanan saate göre yapılır, dosyaya kalıcı arşiv kaydı yazılması sonraki başarılı Actions çalışmasına kadar gecikebilir**. Arşiv kaydı için bir kullanıcının yönetim panelini açık tutması artık zorunlu değildir.

Sonuçlar, bu uygulamadaki yönetim panelinde düzenlenemez. Katılımcı listesi ve ayarlar başlangıçta kilitlenir; tamamlanmış sonuçlar yeni bir değerle değiştirilmez. Depo sahibi dosyayı doğrudan GitHub üzerinden düzenleyebilir; statik bir site üzerinde, depo sahibine karşı sunucu tarafında mutlak değişmezlik garantisi yoktur.

## Veri ve bakım

- Kayıt dosyası: `data/cekilis.json`
- Kamu sayfası: `cekilis/index.html`
- Yönetim arayüzü: `admin/index.html` içindeki Çekiliş Yönetimi sekmesi
- Tarayıcı çarkı ve ortak hesaplama: `scripts/giveaway-core.js`, `scripts/giveaway.js`
- GitHub Actions sonuç arşivleyicisi: `.github/scripts/finalize-giveaways.mjs`
- Zamanlanmış görev: `.github/workflows/finalize-giveaways.yml`

Çekiliş verileri herkesin okuyabildiği statik JSON dosyasında tutulur; bu nedenle hassas kişisel bilgi eklemeyin. İsimlerin yayımlanmasına katılımcılardan izin alın. drand veri kaynağına ulaşılamazsa sonuçlar kaynağa erişim gelene kadar bekletilir.
