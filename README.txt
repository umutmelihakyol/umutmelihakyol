Günlüğüm — Mayın Tarlası ve Sudoku

Bu paket iki yeni mini oyun ekler, Mini Oyunlar listesini sekiz oyuna günceller ve ana sayfadaki eğlence kartını Mini Oyunlar merkezine yönlendirir.

ZIP içindeki klasörleri GitHub deposunun kök dizinine, mevcut dizin yapısını koruyarak yükle.

Yeni dosyalar:
- mini-oyunlar/mayin-tarlasi/index.html
- mini-oyunlar/sudoku/index.html
- scripts/mini-game-minesweeper.js
- scripts/mini-game-sudoku.js
- assets/css/mini-game-minesweeper-sudoku.css

Güncellenen dosyalar:
- index.html (ana sayfadaki kart artık /mini-oyunlar/ adresini açar)
- mini-oyunlar/index.html (Mayın Tarlası ve Sudoku kartları eklendi, sayı 08 olarak güncellendi)

Mayın Tarlası:
- Kolay 9×9 (10 mayın), Orta 16×16 (40 mayın), Zor 16×30 (99 mayın)
- İlk tıklama ve çevresindeki hücreler güvenlidir
- Sağ tıkla veya mobil Bayrak moduyla işaretleme
- Süre, mayın/bayrak sayacı, kazanma oranı ve zorluk bazlı en iyi süre

Sudoku:
- Kolay, Orta, Zor ve Uzman seviyeleri
- Her yeni bulmaca tek çözümlüdür
- Not modu, ipucu, hata kontrolü, hücre temizleme
- Klavye okları, 1–9 tuşları ve ekrandaki sayı tuşları
- Süre, ilerleme, çözüm serisi ve zorluk bazlı en iyi süre

Oyun istatistikleri ve kişisel rekorlar tarayıcının localStorage alanında saklanır. Sunucu veya harici servis gerekmez.
