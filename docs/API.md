# API.md — Bileşenler Arası İletişim & Worker Protokolü

Bu belge, **10saniyetör** uygulamasının UI katmanı (`src/app.js`) ile arka plan video işleme Web Worker'ı (`src/worker.js`) arasındaki mesaj protokolü sözleşmesini tanımlar.

---

## 1. UI -> Worker İstekleri

### 1.1 `PROCESS_VIDEO` (Otomatik Bölme Modu)
Video dosyasını baştan sona 9.5 saniyelik parçalara bölmek için gönderilir.

```typescript
interface ProcessVideoPayload {
  type: "PROCESS_VIDEO";
  fileData: ArrayBuffer;      // Orijinal videonun ikili verisi
  fileName: string;           // ör. "tatil_videosu.mp4"
  fileType: string;           // ör. "video/mp4"
  duration: number;           // Video süresi (saniye cinsinden, ör. 45.2)
  segmentDuration: number;    // Parça süresi (varsayılan: 9.5)
}
```

### 1.2 `EXTRACT_CLIP` (Özel Klip Çıkarma Modu)
Kullanıcının zaman çizelgesinde (Timeline) seçtiği belirli bir aralığı (maksimum 9.5s) tek bir klip olarak çıkartmak için gönderilir.

```typescript
interface ExtractClipPayload {
  type: "EXTRACT_CLIP";
  fileData: ArrayBuffer;      // Orijinal videonun ikili verisi
  fileName: string;           // ör. "tatil_videosu.mp4"
  fileType: string;           // ör. "video/mp4"
  startTime: number;          // Başlangıç saniyesi (ör. 14.2)
  duration: number;           // Çıkartılacak klip süresi (ör. 8.2 — maksimum: 9.5)
}
```

---

## 2. Worker -> UI Yanıtları ve Olayları

### 2.1 `PROGRESS`
İşlem sırasında UI'a anlık ilerleme durumu bildirmek için gönderilir.

```typescript
interface ProgressPayload {
  type: "PROGRESS";
  percent: number;            // 0 - 100 arası tam sayı
  message: string;            // Kullanıcıya gösterilecek durum metni
  currentPart?: number;       // İşlenmekte olan parça numarası
  totalParts?: number;        // Toplam parça sayısı
}
```

### 2.2 `COMPLETE`
İşlem tamamlandığında oluşturulan segment veya klibi UI'a iletir.

```typescript
interface SegmentResult {
  partIndex: number;          // 1, 2, 3...
  name: string;               // ör. "tatil_videosu_part1.mp4" veya "tatil_videosu_clip_14.2s-22.4s.mp4"
  blob: Blob;                 // Segmentin video Blob'u
  size: number;               // Bayt cinsinden boyut
  startTime: number;          // Başlangıç saniyesi (ör. 14.2)
  endTime: number;            // Bitiş saniyesi (ör. 22.4)
}

interface CompletePayload {
  type: "COMPLETE";
  segments: SegmentResult[];
  originalName: string;
  totalDuration: number;
  mode?: "SPLIT" | "CLIP";    // Otomatik bölme mi yoksa özel klip mi
}
```

### 2.3 `ERROR`
İşlem sırasında bir hata meydana geldiğinde gönderilir.

```typescript
interface ErrorPayload {
  type: "ERROR";
  error: string;              // Hata mesajı
}
```
