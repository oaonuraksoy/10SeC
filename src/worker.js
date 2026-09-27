/**
 * 10saniyetör — Video Segmenter Web Worker
 *
 * Bu worker, doğrudan lib/ffmpeg/ffmpeg-core.js (Emscripten / WebAssembly) API'sini
 * kullanarak video dosyalarını 9.5 saniyelik parçalara böler ve özel klip kesimi yapar.
 * docs/API.md protokolüne %100 uygundur.
 * Tamamen yerel kütüphanelerle çalışır; harici CDN veya remote script içermez.
 */

// Yerel FFmpeg Core kütüphanesini içe aktar
try {
  importScripts('../lib/ffmpeg/ffmpeg-core.js');
} catch (err) {
  console.error('[Worker] ffmpeg-core.js yüklenemedi:', err);
}

let ffmpegCoreInstance = null;

/**
 * FFmpeg Emscripten Core motorunu yerel dosyalarla başlatır (singleton).
 */
async function getFFmpegCore() {
  if (ffmpegCoreInstance) {
    return ffmpegCoreInstance;
  }

  if (typeof self.createFFmpegCore !== 'function') {
    throw new Error('createFFmpegCore fonksiyonu bulunamadı. ffmpeg-core.js yüklenemedi.');
  }

  const basePath = new URL('../lib/ffmpeg/', self.location.href).href;
  const coreURL = new URL('ffmpeg-core.js', basePath).href;
  const wasmURL = new URL('ffmpeg-core.wasm', basePath).href;
  const mainScriptUrlOrBlob = `${coreURL}#${btoa(JSON.stringify({ wasmURL }))}`;

  ffmpegCoreInstance = await self.createFFmpegCore({
    mainScriptUrlOrBlob
  });

  if (typeof ffmpegCoreInstance.setLogger === 'function') {
    ffmpegCoreInstance.setLogger(({ message }) => {
      // Gerekirse hata ayıklama için: console.debug('[FFmpeg]', message);
    });
  }

  return ffmpegCoreInstance;
}

/**
 * Sanal dosya sisteminden (MEMFS) güvenli dosya silme
 */
function safeUnlink(ffmpeg, filename) {
  try {
    if (ffmpeg && ffmpeg.FS && typeof ffmpeg.FS.unlink === 'function') {
      ffmpeg.FS.unlink(filename);
    }
  } catch (_) {
    // Dosya mevcut değilse veya hata oluşursa yoksay
  }
}

/**
 * Otomatik video bölme işlemi (docs/API.md - PROCESS_VIDEO)
 */
async function handleProcessVideo(data) {
  const {
    fileData,
    fileName = 'video.mp4',
    fileType = 'video/mp4',
    duration = 0,
    segmentDuration = 9.5
  } = data;

  if (!fileData || !(fileData instanceof ArrayBuffer)) {
    self.postMessage({
      type: 'ERROR',
      error: 'Geçersiz video verisi (ArrayBuffer bekleniyor).'
    });
    return;
  }

  if (!duration || duration <= 0) {
    self.postMessage({
      type: 'ERROR',
      error: 'Geçersiz video süresi.'
    });
    return;
  }

  const segDuration = Number(segmentDuration) || 9.5;
  const totalParts = Math.max(1, Math.ceil(duration / segDuration));

  // Dosya uzantısını ve temel adını ayıkla
  const lastDotIndex = fileName.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  const ext = lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1).toLowerCase() : 'mp4';
  const inputFileName = `input.${ext}`;
  const mimeType = fileType || (ext === 'webm' ? 'video/webm' : 'video/mp4');

  let ffmpeg = null;

  try {
    // 1. FFmpeg başlatma durumu bildir
    self.postMessage({
      type: 'PROGRESS',
      percent: 0,
      message: 'Video işleme motoru başlatılıyor...',
      currentPart: 0,
      totalParts
    });

    ffmpeg = await getFFmpegCore();

    // 2. Orijinal dosyayı FFmpeg sanal dosya sistemine yaz
    self.postMessage({
      type: 'PROGRESS',
      percent: 0,
      message: 'Video belleğe yükleniyor...',
      currentPart: 0,
      totalParts
    });

    // Varsa eski giriş dosyasını temizle
    safeUnlink(ffmpeg, inputFileName);

    ffmpeg.FS.writeFile(inputFileName, new Uint8Array(fileData));

    const segments = [];

    // 3. Parçaları döngüyle kes
    for (let i = 0; i < totalParts; i++) {
      const partIndex = i + 1;
      const startTime = i * segDuration;
      const partDuration = Math.min(segDuration, Math.max(0, duration - startTime));
      const outputFileName = `output_${partIndex}.${ext}`;
      const segmentName = `${baseName}_part${partIndex}.${ext}`;

      self.postMessage({
        type: 'PROGRESS',
        percent: Math.round((i / totalParts) * 100),
        message: `Parça ${partIndex} / ${totalParts} işleniyor...`,
        currentPart: partIndex,
        totalParts
      });

      // Varsa eski çıktı dosyasını temizle
      safeUnlink(ffmpeg, outputFileName);

      // Birinci Deneme: Hızlı Stream Copy (-c copy)
      ffmpeg.exec('-ss', String(startTime), '-i', inputFileName, '-t', String(partDuration), '-c', 'copy', outputFileName);
      let exitCode = ffmpeg.ret;
      ffmpeg.reset();

      // İkinci Deneme (Fallback): Keyframe uyuşmazlığı durumunda ultrafast encode
      if (exitCode !== 0) {
        safeUnlink(ffmpeg, outputFileName);
        ffmpeg.exec('-ss', String(startTime), '-i', inputFileName, '-t', String(partDuration), '-preset', 'ultrafast', outputFileName);
        exitCode = ffmpeg.ret;
        ffmpeg.reset();
      }

      if (exitCode !== 0) {
        throw new Error(`Parça ${partIndex} kesilirken FFmpeg hatası oluştu (kod: ${exitCode}).`);
      }

      // Parçayı sanal diskten oku
      const outputData = ffmpeg.FS.readFile(outputFileName);
      const blob = new Blob([outputData.buffer || outputData], { type: mimeType });

      segments.push({
        partIndex,
        name: segmentName,
        blob,
        size: blob.size,
        startTime: Number(startTime.toFixed(2)),
        endTime: Number((startTime + partDuration).toFixed(2))
      });

      // Çıktı dosyasını sanal diskten silerek bellek sızıntısını önle
      safeUnlink(ffmpeg, outputFileName);

      const completedPercent = Math.round((partIndex / totalParts) * 100);
      self.postMessage({
        type: 'PROGRESS',
        percent: completedPercent,
        message: `Parça ${partIndex} / ${totalParts} hazır.`,
        currentPart: partIndex,
        totalParts
      });
    }

    // Giriş dosyasını sanal diskten temizle
    safeUnlink(ffmpeg, inputFileName);

    // 4. İşlem başarıyla tamamlandı
    self.postMessage({
      type: 'COMPLETE',
      mode: 'SPLIT',
      segments,
      originalName: fileName,
      totalDuration: duration
    });

  } catch (err) {
    console.error('[Worker] Hata (PROCESS_VIDEO):', err);

    // Sanal disk temizliğini garantiye al
    if (ffmpeg) {
      safeUnlink(ffmpeg, inputFileName);
    }

    self.postMessage({
      type: 'ERROR',
      error: err && err.message ? err.message : String(err)
    });
  }
}

/**
 * Özel klip çıkarma işlemi (docs/API.md - EXTRACT_CLIP)
 */
async function handleExtractClip(data) {
  const {
    fileData,
    fileName = 'clip.mp4',
    fileType = 'video/mp4'
  } = data;

  if (!fileData || !(fileData instanceof ArrayBuffer)) {
    self.postMessage({
      type: 'ERROR',
      error: 'Geçersiz video verisi (ArrayBuffer bekleniyor).'
    });
    return;
  }

  const startTime = Number(data.startTime);
  const clipDuration = Number(data.duration);

  if (isNaN(startTime) || startTime < 0) {
    self.postMessage({
      type: 'ERROR',
      error: 'Geçersiz başlangıç zamanı (startTime >= 0 olmalıdır).'
    });
    return;
  }

  if (isNaN(clipDuration) || clipDuration <= 0) {
    self.postMessage({
      type: 'ERROR',
      error: 'Geçersiz klip süresi (duration > 0 olmalıdır).'
    });
    return;
  }

  // Dosya uzantısını ve temel adını ayıkla
  const lastDotIndex = fileName.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
  const ext = lastDotIndex !== -1 ? fileName.substring(lastDotIndex + 1).toLowerCase() : 'mp4';
  const inputFileName = `input_clip.${ext}`;
  const outputFileName = `output_clip.${ext}`;
  const segmentName = `${baseName}_clip_${startTime.toFixed(1)}s-${(startTime + clipDuration).toFixed(1)}s.${ext}`;
  const mimeType = fileType || (ext === 'webm' ? 'video/webm' : 'video/mp4');

  let ffmpeg = null;

  try {
    // 1. FFmpeg motorunu başlat
    ffmpeg = await getFFmpegCore();

    // 2. İlerleme mesajı bildir
    self.postMessage({
      type: 'PROGRESS',
      percent: 10,
      message: 'Özel klip kesiliyor...'
    });

    // 3. Dosyayı sanal diske yaz
    safeUnlink(ffmpeg, inputFileName);
    safeUnlink(ffmpeg, outputFileName);
    ffmpeg.FS.writeFile(inputFileName, new Uint8Array(fileData));

    // 4. Hızlı kesim: Stream Copy (-c copy)
    ffmpeg.exec('-ss', String(startTime), '-i', inputFileName, '-t', String(clipDuration), '-c', 'copy', outputFileName);
    let exitCode = ffmpeg.ret;
    ffmpeg.reset();

    // 5. Keyframe fallback: Stream copy başarısız olursa ultrafast encode
    if (exitCode !== 0) {
      safeUnlink(ffmpeg, outputFileName);
      ffmpeg.exec('-ss', String(startTime), '-i', inputFileName, '-t', String(clipDuration), '-preset', 'ultrafast', outputFileName);
      exitCode = ffmpeg.ret;
      ffmpeg.reset();
    }

    if (exitCode !== 0) {
      throw new Error(`Özel klip kesilirken FFmpeg hatası oluştu (kod: ${exitCode}).`);
    }

    // 6. Çıktıyı oku ve Blob oluştur
    const outputData = ffmpeg.FS.readFile(outputFileName);
    const blob = new Blob([outputData.buffer || outputData], { type: mimeType });

    // 7. Sanal disk temizliği
    safeUnlink(ffmpeg, outputFileName);
    safeUnlink(ffmpeg, inputFileName);

    // 8. Yanıtı gönder
    self.postMessage({
      type: 'COMPLETE',
      mode: 'CLIP',
      segments: [{
        partIndex: 1,
        name: segmentName,
        blob,
        size: blob.size,
        startTime: Number(startTime.toFixed(2)),
        endTime: Number((startTime + clipDuration).toFixed(2))
      }],
      originalName: fileName,
      totalDuration: clipDuration
    });

  } catch (err) {
    console.error('[Worker] Hata (EXTRACT_CLIP):', err);

    if (ffmpeg) {
      safeUnlink(ffmpeg, outputFileName);
      safeUnlink(ffmpeg, inputFileName);
    }

    self.postMessage({
      type: 'ERROR',
      error: err && err.message ? err.message : String(err)
    });
  }
}

/**
 * Ana mesaj dinleyicisi — docs/API.md protokolü
 */
self.onmessage = async (e) => {
  const data = e.data;
  if (!data || !data.type) {
    return;
  }

  if (data.type === 'PROCESS_VIDEO') {
    await handleProcessVideo(data);
  } else if (data.type === 'EXTRACT_CLIP') {
    await handleExtractClip(data);
  }
};
