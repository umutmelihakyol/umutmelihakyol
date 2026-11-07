Gelişmiş arama, kullanıcıyı mevcut sayfadan çıkarmadan modal panel olarak açılır.

Davranışlar:
- Üst arama düğmesi, ana sayfadaki arama kartı, ortak gezinme menüsündeki Arama bağlantısı ve arama sayfasına giden diğer site içi bağlantılar aynı paneli açar.
- Panel ekranın önünde görünür; arka plan koyulaşır ve blur efekti uygulanır.
- Panel kapatılınca aynı sayfa, adres ve kaydırma konumu korunur.
- ESC, kapatma düğmesi veya panel dışındaki alana tıklama paneli kapatır.
- Arama sorgusu/filtreler mevcut sayfanın URL'sine yazılmaz; panel kapatılıp tekrar açıldığında panel durumu korunur.
- Ctrl+K / Cmd+K arama panelini açar.
- Panel yüklenemezse kullanıcı otomatik olarak yeni bir sayfaya yönlendirilmez; ekranda hata bildirimi gösterilir.
- Bir sonuca tıklanırsa ilgili kategori sayfasına gidilir ve kayıt kimliği URL parçasına eklenir.
- /ara/ adresi doğrudan açıldığında tam sayfa gelişmiş arama ekranı olarak çalışmayı sürdürür.
- Ortak gezinme menüsünün bulunduğu tüm sayfalarda panel betiği yüklenir.

Service Worker önbellek sürümü: v47.
