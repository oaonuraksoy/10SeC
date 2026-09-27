# CONTEXT.md — Aktif Durum ve Faz Takibi

## Mevcut Durum (Proje Tamamlandı & Canlıda — 10SeC v1.0.0)
- **Tarih:** 2026-09-27
- **Uygulama Adı:** **10SeC** (9.5s Video Splitter & Timeline Trimmer)
- **GitHub Repo:** [https://github.com/oaonuraksoy/10SeC](https://github.com/oaonuraksoy/10SeC)
- **GitHub Pages:** [https://oaonuraksoy.github.io/10SeC/](https://oaonuraksoy.github.io/10SeC/)
- **GitHub Release:** [v1.0.0 Release](https://github.com/oaonuraksoy/10SeC/releases/tag/v1.0.0)
- **Paketler:** `dist/10SeC-v1.0.0.zip` ve `dist/10saniyetor-v1.0.0.zip` (Release'e yüklendi)

---

## Tamamlanan Özellikler ve Dağıtım

1. **İnteraktif Zaman Çizelgesi (Timeline Trimmer):** Maksimum 9.5s sınırı olan sürüklenebilir ve boyutlandırılabilir aralık barı, canlı video önizleme senkronizasyonu ve tek tıkla özel klip kesimi.
2. **Otomatik 9.5s Video Bölücü:** 90 saniyeye kadar tüm videoyu eşit 9.5 saniyelik parçalara kayıpsız remuxing ile böler.
3. **Program Adı:** Tüm UI, dil sözlükleri (`_locales/tr`, `_locales/en`, `src/i18n.js`), manifest, README ve dokümanlarda **10SeC** olarak güncellendi.
4. **Temiz Açık Kaynak Repo:** Son kullanıcının işine yaramayacak iç analiz dokümanları (`specs/`, `plans/`, `decisions/`, `agents/`, `tests/`, `scripts/` vb.) `.gitignore` ile gizlendi. Sadece temiz eklenti ve doküman kodları `main` branch'e push edildi.
5. **GitHub Pages Landing Page:** `docs/index.html` üzerinden tanıtım, özellikler, gizlilik politikası ve kurulum rehberi yayına alındı.
6. **Resmi v1.0.0 Release:** GitHub üzerinden oluşturuldu ve ZIP paketleri release asset olarak yüklendi.
7. **Edge Add-ons 132 Karakter Sınırı Uyumluluğu:** `_locales/tr/messages.json` (101 karakter) ve `_locales/en/messages.json` (111 karakter) mağaza açıklama alanları Edge Partner Center'ın katı 132 karakter sınırına uygun hale getirildi. Test ve Strict Auditor doğrulaması tamamlandı; kullanılmayan `src/814.ffmpeg.js` temizlenerek paketler güncellendi.
8. **Microsoft Edge Add-ons Mağaza Başvurusu Tamamlandı (In Review):**
   - **Durum:** In review (İncelemede)
   - **Store ID:** `0RDCKCK8QBRZ`
   - **CRX ID:** `eooacplpamongbimoibjkmgnbjmcbdjk`
   - **Product ID:** `c28c593b-5307-4a94-9ece-72d98f6fefe3`
   - **Logo:** Tam zeminli, sıfır şeffaflık / sıfır beyaz kenar full-bleed 300x300 logo başarıyla yüklendi.
