# Günlüğüm — Site genelinde temiz URL düzenlemesi

## Yapılanlar

- Ana sayfa, oyun, film, dizi, anime, istatistik, oyun maliyetleri, yönetim paneli ve Technopat arşiv bağlantıları `.html` uzantısız ve klasör URL'leriyle çalışacak şekilde güncellendi.
- Kategori bağlantılarının ortak üretildiği `scripts/categories.js`, gezinme menüsü, istatistik sayfası ve oyun maliyet sayfasındaki dinamik bağlantılar temiz URL kullanıyor.
- Ana sayfadan açılan eski hash bağlantıları `/oyun/#...` biçimine yönlendiriliyor.
- Sayfalara, doğrudan `/index.html` veya `/klasor/index.html` adresi açıldığında adres çubuğunu temiz URL biçimine dönüştüren uyumluluk betiği eklendi.
- Çevrimdışı sayfa `/offline/` altında da sunuluyor. Eski `/offline.html` sayfası geriye dönük uyumluluk için korundu ve temiz URL'ye geçiyor.
- `404.html` eklendi. Eskimiş veya artık kullanılmayan `.html` sayfa yolları temiz karşılıklarına yönlendirilmeye çalışılıyor; başka bir sayfa yoksa uzantısız adresle 404 ekranı gösteriliyor.
- PWA manifestinin başlangıç adresi ve kısayol bağlantıları temiz URL'lere geçirildi.
- Service Worker önbellek sürümü `v11` yapıldı; ana sayfa, kategori sayfaları, maliyet, istatistik, Technopat arşivleri ve çevrimdışı sayfa temiz URL üzerinden önbelleğe alınıyor.
- Yönetim panelindeki dosya seçici etiketlerinde sayfa adresleri uzantısız gösteriliyor. Gerçek depo dosya yolları panelin çalışması için `index.html` değerleri olarak korunuyor.
- README'ye temiz sayfa adreslerini açıklayan bölüm eklendi.

## Doğrulama

- JavaScript dosyalarının sözdizimi kontrol edildi.
- HTML içindeki satır içi JavaScript blokları Node.js sözdizimi kontrolünden geçirildi.
- Veri JSON dosyaları, `manifest.webmanifest` ve `sitemap.xml` ayrıştırılarak doğrulandı.
- HTML bağlantıları yerel dosya/klasör hedefleriyle karşılaştırıldı; kırık yerel bağlantı bulunmadı.
- Kullanıcıya görünen yerel sayfa bağlantılarında `.html` uzantısı tarandı; sonuç bulunmadı.
- Site sayfalarına eklenen URL normalleştirme betiği ve 404 geriye dönük uyumluluk yönlendirmesi kontrol edildi.

## Yayın notu

Bu arşiv GitHub deposuna yüklenmeye hazırlandı. Canlı `umutmelihakyol.com` alan adına doğrudan dağıtım yapılmadı; son davranışın yayından sonra gerçek tarayıcıda kontrol edilmesi gerekir. GitHub Pages klasörlerdeki `index.html` dosyalarını `/klasor/` adresiyle sunar; URL normalleştirme betiği eski `index.html` adreslerini de tarayıcı adres çubuğunda temizler.
