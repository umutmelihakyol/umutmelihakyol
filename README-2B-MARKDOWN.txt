Günlüğüm 2B — Markdown ve yazı rengi desteği

ZIP içindeki üç dosyayı klasör yollarını koruyarak sitenin ana dizinine kopyalayın:
- scripts/assistant-2b.js
- assets/css/assistant-2b.css
- scripts/site-nav.js

Mevcut dosyaların üzerine yazın, siteyi yayınlayın ve Ctrl+F5 ile yenileyin.

Desteklenen biçimlendirmeler:
- **Kalın yazı**
- *İtalik yazı*
- ~~Üstü çizili~~
- # Başlık, ## Alt başlık, ### Küçük başlık
- - Madde işaretli liste
- 1. Numaralı liste
- > Alıntı
- `kod` ve üç ters tırnakla kod bloğu
- [Bağlantı metni](https://ornek.com)
- [renk=#ff6b6b]Kırmızı metin[/renk]

Renk için hazır adlar da kullanılabilir:
[renk=mavi]Mavi[/renk], [renk=yeşil]Yeşil[/renk], [renk=mor]Mor[/renk], [renk=sarı]Sarı[/renk], [renk=pembe]Pembe[/renk].

Güvenlik:
- Ham HTML çalıştırılmaz; metin önce HTML karakterlerinden arındırılır.
- Linklerde yalnızca HTTP, HTTPS ve mailto adreslerine izin verilir.
- Renkler yalnızca bilinen renk adları veya #RRGGBB biçimindeki hex kodlarla uygulanır.

Gemini Worker, model ayarları ve API anahtarı değişmez. Yalnızca 2B mesajlarının gösterim biçimi güncellenir.
