# Oyun Günlüğüm

Statik bir site: sunucu gerekmez. GitHub Pages veya Netlify ile yayınlanır.

## Kurulum
1. **RAWG anahtarı:** https://rawg.io/apidocs adresinden ücretsiz al, `config.js` içindeki `rawgKey` alanına yaz.
2. **GitHub deposu oluştur** ve bu klasördeki dosyaları yükle. `config.js` içinde `owner`, `repo`, `branch` değerlerini düzelt.
3. **Yayınla:** GitHub Pages (Settings > Pages > main) ya da Netlify (depoyu bağla). Her kayıtta site kendiliğinden güncellenir.
4. **GitHub token:** GitHub > Settings > Developer settings > Fine-grained tokens. Sadece bu depo, izin: *Contents: Read and write*.
5. **Şifre kurulumu:** Yayınladıktan sonra `admin.html` sayfasını aç. `config.js` içindeki `vault` boşken kurulum ekranı gelir. Token'ı ve en az 12 karakterlik şifreni gir, çıkan şifreli metni `config.js` içindeki `vault` alanına yapıştırıp dosyayı tekrar yükle. Bundan sonra `admin.html` şifre sorar.

> Token şifreli saklanır ama depo herkese açıksa şifreli metin de görünür. Bu yüzden uzun ve tahmin edilmesi zor bir şifre seç.

## Kullanım
- Herkes `index.html` sayfasını görür.
- Oyun eklemek için ana sayfanın altındaki "Yönetim" bağlantısından `admin.html` sayfasına git ve şifreni gir.
- Oyun adını ara, kapak otomatik gelir; puan, süre, tarih, öneri ve inceleme bağlantısını gir. İnceleme bağlantısı boşsa kartta "İnceleme yok" yazar.

## Yeni özellik eklemek
- Her oyun `games.json` içinde bir nesnedir. Yeni alan (tür, zorluk vb.) eklemek için: `admin.html` formuna alan ekle, `index.html` içindeki `card()` fonksiyonuna göster.
- Uzun notlar kartta 3 satırla sınırlıdır, "Devamını oku" ile tamamı açılır.
- Görünüm renkleri `style.css` başındaki değişkenlerdedir.

## Durum, tür ve paylaşım
- **Durum:** Bitirdim, Oynuyorum, Yarım bıraktım, İstek listesi. Bitirdiysen puan, süre ve tarih zorunlu; diğer durumlarda boş bırakabilirsin.
- **Tür ve platform:** Oyun aramasında türler otomatik gelir (Türkçeye çevrilir). Birden fazla değer virgülle ayrılır. Ana sayfadaki filtre listeleri eklediğin oyunlara göre kendiliğinden oluşur.
- **Paylaşım:** Karta tıklayınca ayrıntı penceresi açılır ve adres `.../index.html#oyunid` olur. "Bağlantıyı kopyala" ile paylaşırsın, bağlantıyı açan kişi doğrudan o oyunu görür. Sosyal medyada oyuna özel önizleme görseli çıkmaz, site genel önizlemesi görünür.

## Oyun öner düğmesi, ziyaretçi sayacı, artılar ve eksiler
- **Oyun öner:** `config.js` içindeki `suggestUrl` alanına bir bağlantı yaz. Google Forms bağlantısı ya da `mailto:adresin@ornek.com?subject=Oyun%20önerisi` olabilir. Alan boşsa düğme görünmez.
- **Ziyaretçi sayacı:** https://www.goatcounter.com adresinde ücretsiz hesap aç (kişisel kullanım için ücretsiz, çerez kullanmaz), seçtiğin kodu `config.js` içindeki `goatcounter` alanına yaz. Sayaç sayfa ziyaretlerini ve hangi oyunun ayrıntı penceresinin açıldığını (`oyun/oyunid`) sayar. Kendi ziyaretlerini saymaması için sitede tarayıcı konsoluna `localStorage.skipgc='t'` yaz. Alan boşsa sayaç yüklenmez.
- **Artılar ve eksiler:** Admin formunda her satıra bir madde yaz. İkisi de isteğe bağlıdır, boş bıraktığın taraf (ya da ikisi birden) ayrıntı penceresinde hiç görünmez.
