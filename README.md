# Oyun Günlüğüm

Statik bir site: sunucu gerekmez. GitHub Pages veya Netlify ile yayınlanır.

## Kurulum
1. **RAWG anahtarı:** https://rawg.io/apidocs adresinden ücretsiz al, `config.js` içindeki `rawgKey` alanına yaz.
2. **GitHub deposu oluştur** ve bu klasördeki dosyaları yükle. `config.js` içinde `owner`, `repo`, `branch` değerlerini düzelt.
3. **Yayınla:** GitHub Pages (Settings > Pages > main) ya da Netlify (depoyu bağla). Her kayıtta site kendiliğinden güncellenir.
4. **Yönetim anahtarı:** GitHub > Settings > Developer settings > Fine-grained tokens. Sadece bu depo, izin: *Contents: Read and write*. Anahtarı `admin.html` sayfasındaki kutuya yapıştır.

## Kullanım
- Herkes `index.html` sayfasını görür.
- Oyun eklemek için `admin.html` sayfasını aç (bağlantısı ana sayfada yok, adresi sadece sen bilirsin).
- Oyun adını ara, kapak otomatik gelir; puan, süre, tarih, öneri ve inceleme bağlantısını gir. İnceleme bağlantısı boşsa kartta "İnceleme yok" yazar.

## Yeni özellik eklemek
- Her oyun `games.json` içinde bir nesnedir. Yeni alan (tür, zorluk vb.) eklemek için: `admin.html` formuna alan ekle, `index.html` içindeki `card()` fonksiyonuna göster.
- Görünüm renkleri `style.css` başındaki değişkenlerdedir.
