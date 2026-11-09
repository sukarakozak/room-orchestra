# Key Orchestra / Agency

Bu bağımsız deney yalnız kendi mekânını ve oyununu yükler; ada sahnesini yüklemez.

## Çalıştırma

Bu klasörde `python -m http.server 8000` çalıştırın, sonra http://localhost:8000 adresini açın. Python yalnız dosyaları sunar; uygulama tarayıcıda çalışır.

## Düzenleme

- `script.js`: bu oyunun tasarım parametreleri, kuralları, girdi ve çıktı kodu. `design`, `knobs`, `tasks` ve `make(ctx)` bölümlerinden başlayın.
- `style.css`: görünüm.
- `index.html`: sayfa ve arayüz.
- `runner.js`: deneyin kamera, sahne ve yaşam döngüsü.
- `engine.js`, `shell.js`: ortak karakter/atlas motoru ve oyun arayüzü.
- `vendor/`, `fonts/`, `licenses/`: yerel bağımlılıklar ve lisanslar.

CODE sekmesindeki parametreler anında denenebilir; kalıcı değişiklik için `script.js` dosyasını düzenleyin. Kamera/mikrofon deneylerinde izin verilmeden cihaz açılmaz; alternatif giriş seçeneği kullanılabilir.
