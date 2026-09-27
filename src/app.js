/**
 * 10saniyetör — Ana Uygulama Arayüz Kontrolcüsü (app.js)
 * Web Worker & FFmpeg WASM motoru ile 9.5s video segmentasyonu,
 * Drag-and-drop, UI durum yönetimi, yerel JSZip paketleme ve çoklu dil entegrasyonu.
 * %100 İstemci Taraflı (Client-Side), Sıfır CDN.
 */

// Uygulama Durumu (State)
const state = {
  currentFile: null,
  videoDuration: 0,
  videoWidth: 0,
  videoHeight: 0,
  previewUrl: null,
  segments: [],
  isProcessing: false,
  worker: null,

  // 2. Özellik — Mod ve Özel Klip (Timeline) Durumu
  activeMode: 'split', // 'split' | 'clip'
  clipStartTime: 0,
  clipDuration: 9.5,
  completedMode: null
};

// DOM Elemanları Referansları
const dom = {
  // Dil ve Navigasyon
  langButtons: document.querySelectorAll('[data-lang-btn]'),
  brandLogoHome: document.getElementById('brandLogoHome'),
  headerPrivacyBtn: document.getElementById('headerPrivacyBtn'),
  footerPrivacyBtn: document.getElementById('footerPrivacyBtn'),
  privacyModal: document.getElementById('privacyModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  modalConfirmBtn: document.getElementById('modalConfirmBtn'),

  // Bildirim ve Uyarı
  alertCard: document.getElementById('alertCard'),
  alertTitle: document.getElementById('alertTitle'),
  alertDesc: document.getElementById('alertDesc'),
  alertCloseBtn: document.getElementById('alertCloseBtn'),

  // Dropzone & Dosya Yükleme
  dropzoneContainer: document.getElementById('dropzoneContainer'),
  videoFileInput: document.getElementById('videoFileInput'),
  browseFileBtn: document.getElementById('browseFileBtn'),

  // Önizleme & Kontroller
  previewCard: document.getElementById('previewCard'),
  previewPlayer: document.getElementById('previewPlayer'),
  metaFileName: document.getElementById('metaFileName'),
  metaDuration: document.getElementById('metaDuration'),
  metaResolution: document.getElementById('metaResolution'),
  metaFileSize: document.getElementById('metaFileSize'),
  metaPartsCount: document.getElementById('metaPartsCount'),
  btnStartProcess: document.getElementById('btnStartProcess'),
  btnChangeFile: document.getElementById('btnChangeFile'),

  // Mod Seçici & Paneller
  tabAutoSplit: document.getElementById('tabAutoSplit'),
  tabCustomClip: document.getElementById('tabCustomClip'),
  panelAutoSplit: document.getElementById('panelAutoSplit'),
  panelCustomClip: document.getElementById('panelCustomClip'),

  // İnteraktif Timeline & Özel Klip
  timelineWrapper: document.getElementById('timelineWrapper'),
  timelineTrack: document.getElementById('timelineTrack'),
  timelineRangeBar: document.getElementById('timelineRangeBar'),
  handleLeft: document.getElementById('handleLeft'),
  handleRight: document.getElementById('handleRight'),
  rulerStart: document.getElementById('rulerStart'),
  rulerMid: document.getElementById('rulerMid'),
  rulerEnd: document.getElementById('rulerEnd'),
  clipStartTime: document.getElementById('clipStartTime'),
  clipDuration: document.getElementById('clipDuration'),
  clipEndTime: document.getElementById('clipEndTime'),
  btnExtractClip: document.getElementById('btnExtractClip'),
  btnChangeFileClip: document.getElementById('btnChangeFileClip'),

  // İlerleme Alanı
  progressCard: document.getElementById('progressCard'),
  progressBarFill: document.getElementById('progressBarFill'),
  progressStatusText: document.getElementById('progressStatusText'),
  progressPercentText: document.getElementById('progressPercentText'),

  // Sonuç & Parçalar
  resultsSection: document.getElementById('resultsSection'),
  resultsSubtitle: document.getElementById('resultsSubtitle'),
  btnDownloadAllZip: document.getElementById('btnDownloadAllZip'),
  btnNewVideo: document.getElementById('btnNewVideo'),
  segmentsGrid: document.getElementById('segmentsGrid')
};

/* ==========================================================================
   1. Başlatma ve Worker Kurulumu
   ========================================================================== */

/**
 * Web Worker'ı başlatır ve mesaj dinleyicilerini kurar.
 */
function initWorker() {
  if (state.worker) {
    state.worker.terminate();
  }

  try {
    state.worker = new Worker('worker.js');

    state.worker.onmessage = (event) => {
      handleWorkerMessage(event.data);
    };

    state.worker.onerror = (error) => {
      console.error('[Worker Error]', error);
      handleWorkerError(error && error.message ? error.message : 'Web Worker çalışma hatası');
    };
  } catch (err) {
    console.error('[Worker Init Failed]', err);
    showAlert('danger', 'Worker Hatası', 'Web Worker başlatılamadı: ' + err.message);
  }
}

/**
 * Worker'dan gelen mesajları docs/API.md protokolüne göre işler.
 */
function handleWorkerMessage(data) {
  if (!data || !data.type) return;

  switch (data.type) {
    case 'PROGRESS':
      updateProgress(data.percent, data.message, data.currentPart, data.totalParts);
      break;

    case 'COMPLETE':
      handleComplete(data);
      break;

    case 'ERROR':
      handleWorkerError(data.error);
      break;

    default:
      console.warn('[Worker] Bilinmeyen mesaj tipi:', data.type);
  }
}

/* ==========================================================================
   2. Yardımcı Fonksiyonlar (Formatlayıcılar & İndirme)
   ========================================================================== */

/**
 * Saniyeyi "00:09.5" veya "01:23.4" formatına çevirir.
 */
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  const formattedMins = String(mins).padStart(2, '0');
  const formattedSecs = secs < 10 ? '0' + secs : secs;
  return `${formattedMins}:${formattedSecs}`;
}

/**
 * Dosya boyutunu insan tarafından okunabilir birime dönüştürür.
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Blob verisini tarayıcı indirmesi olarak tetikler.
 */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Kullanıcıya uyarı veya hata bildirimi gösterir.
 */
function showAlert(type, title, desc) {
  if (!dom.alertCard) return;
  dom.alertCard.className = `alert-card ${type} show`;
  dom.alertTitle.textContent = title;
  dom.alertDesc.textContent = desc;
}

/**
 * Bildirim kartını gizler.
 */
function hideAlert() {
  if (dom.alertCard) {
    dom.alertCard.className = 'alert-card';
  }
}

/* ==========================================================================
   3. Video Yükleme ve Doğrulama
   ========================================================================== */

/**
 * Seçilen veya sürüklenen video dosyasını doğrular ve süresini okur.
 */
function handleFileSelected(file) {
  if (!file) return;

  // Format kontrolü (.mp4, .webm, .mov, .mkv)
  const validExtensions = ['.mp4', '.webm', '.mov', '.mkv'];
  const fileNameLower = file.name.toLowerCase();
  const isValidFormat = validExtensions.some(ext => fileNameLower.endsWith(ext)) || file.type.startsWith('video/');

  if (!isValidFormat) {
    const errorText = window.i18n ? window.i18n.t('errorInvalidFileType') : 'Lütfen geçerli bir video dosyası seçin (.mp4, .webm, .mov, .mkv).';
    showAlert('danger', 'Geçersiz Format', errorText);
    resetUpload();
    return;
  }

  hideAlert();

  // Eski nesne URL'sini temizle
  if (state.previewUrl) {
    URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
  }

  state.currentFile = file;
  state.previewUrl = URL.createObjectURL(file);

  // HTML5 Video elementi ile süre ve çözünürlük metadata'sını oku
  const tempVideo = document.createElement('video');
  tempVideo.preload = 'metadata';
  tempVideo.src = state.previewUrl;

  tempVideo.onloadedmetadata = () => {
    const duration = tempVideo.duration;
    const width = tempVideo.videoWidth;
    const height = tempVideo.videoHeight;

    if (isNaN(duration) || duration <= 0) {
      const readErr = window.i18n ? window.i18n.t('errorReadingVideo') : 'Video süresi okunamadı veya dosya bozuk.';
      showAlert('danger', 'Hata', readErr);
      resetUpload();
      return;
    }

    state.videoDuration = duration;
    state.videoWidth = width;
    state.videoHeight = height;

    // 90 Saniye Kuralı Kontrolü
    if (duration > 90) {
      const warnTitle = window.i18n ? window.i18n.t('warningDurationTitle') : 'Video Süresi Sınırı Aşıldı!';
      const warnDesc = window.i18n
        ? window.i18n.t('warningDurationDesc', { duration: duration.toFixed(1) })
        : `Video süresi en fazla 90 saniye olmalıdır. Seçilen: ${duration.toFixed(1)}s`;

      showAlert('warning', warnTitle, warnDesc);
      resetUpload();
      return;
    }

    // Geçerli Video: Bilgileri UI'a yansıt ve önizleme kartını göster
    displayPreviewCard(file, duration, width, height);
  };

  tempVideo.onerror = () => {
    const readErr = window.i18n ? window.i18n.t('errorReadingVideo') : 'Video süresi okunamadı veya dosya bozuk.';
    showAlert('danger', 'Hata', readErr);
    resetUpload();
  };
}

/**
 * Video geçerli olduğunda önizleme kartını hazırlar.
 */
function displayPreviewCard(file, duration, width, height) {
  const estimatedParts = Math.max(1, Math.ceil(duration / 9.5));

  dom.metaFileName.textContent = file.name;
  dom.metaDuration.textContent = `${formatTime(duration)} (${duration.toFixed(1)}s)`;
  dom.metaResolution.textContent = width && height ? `${width} × ${height}` : 'Otomatik / 1080p';
  dom.metaFileSize.textContent = formatFileSize(file.size);

  const partsText = window.i18n
    ? window.i18n.t('badgeEstimatedPartsValue', { count: estimatedParts })
    : `${estimatedParts} Parça (9.5s)`;
  dom.metaPartsCount.textContent = partsText;

  // Önizleme oynatıcısına kaynağı bağla
  dom.previewPlayer.src = state.previewUrl;
  dom.previewPlayer.load();

  // Özel klip için timeline bileşenini ilklendir
  initTimelineForVideo(duration);

  // Dropzone'u gizle, önizleme kartını aç
  dom.dropzoneContainer.style.display = 'none';
  dom.previewCard.classList.add('show');
  dom.progressCard.classList.remove('show');
  dom.resultsSection.classList.remove('show');
}

/**
 * Yükleme alanını başlangıç durumuna döndürür.
 */
function resetUpload() {
  if (state.previewUrl) {
    URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
  }
  state.currentFile = null;
  state.videoDuration = 0;
  state.clipStartTime = 0;
  state.clipDuration = 9.5;
  state.completedMode = null;

  dom.videoFileInput.value = '';
  dom.previewPlayer.removeAttribute('src');
  dom.previewPlayer.load();

  // Modu varsayılan Otomatik Bölme durumuna getir
  switchMode('split');
  if (dom.btnDownloadAllZip) {
    dom.btnDownloadAllZip.style.display = 'inline-flex';
  }

  dom.dropzoneContainer.style.display = 'block';
  dom.previewCard.classList.remove('show');
  dom.progressCard.classList.remove('show');
  dom.resultsSection.classList.remove('show');
}

/* ==========================================================================
   4. Parçalara Bölme İşlemi (Process Video)
   ========================================================================== */

/**
 * "Parçalara Bölmeye Başla" tıklandığında çalışır.
 */
async function startVideoSplitting() {
  if (!state.currentFile || state.videoDuration <= 0) {
    showAlert('warning', 'Uyarı', 'Lütfen önce geçerli bir video dosyası seçin.');
    return;
  }

  if (state.isProcessing) return;
  state.isProcessing = true;

  hideAlert();

  // Arayüzü ilerleme durumuna geçir
  dom.previewCard.classList.remove('show');
  dom.resultsSection.classList.remove('show');
  dom.progressCard.classList.add('show');

  // Başlangıç ilerleme durumunu göster
  const initialMsg = window.i18n ? window.i18n.t('statusInitializing') : 'Video işleme motoru (FFmpeg WASM) hazırlanıyor...';
  updateProgress(0, initialMsg);

  try {
    // Dosyayı ArrayBuffer olarak oku
    const arrayBuffer = await state.currentFile.arrayBuffer();

    // Worker'a docs/API.md formatında PROCESS_VIDEO mesajını gönder
    state.worker.postMessage({
      type: 'PROCESS_VIDEO',
      fileData: arrayBuffer,
      fileName: state.currentFile.name,
      fileType: state.currentFile.type || 'video/mp4',
      duration: state.videoDuration,
      segmentDuration: 9.5
    }, [arrayBuffer]); // Zero-copy ArrayBuffer aktarımı

  } catch (err) {
    console.error('[Start Processing Error]', err);
    handleWorkerError(err.message || 'Dosya verisi okunamadı');
  }
}

/* ==========================================================================
   4.2. Özel Klip Çıkarma İşlemi (Extract Custom Clip)
   ========================================================================== */

/**
 * "Seçili Klibi Çıkart" tıklandığında çalışır.
 */
async function startClipExtraction() {
  if (!state.currentFile || state.videoDuration <= 0) {
    showAlert('warning', 'Uyarı', 'Lütfen önce geçerli bir video dosyası seçin.');
    return;
  }

  // Maksimum 9.5 saniye kuralı doğrulaması
  if (state.clipDuration <= 0 || state.clipDuration > 9.5) {
    showAlert('warning', 'Uyarı', 'Klip süresi en fazla 9.5 saniye olmalıdır.');
    return;
  }

  if (state.isProcessing) return;
  state.isProcessing = true;

  hideAlert();

  // Arayüzü ilerleme durumuna geçir
  dom.previewCard.classList.remove('show');
  dom.resultsSection.classList.remove('show');
  dom.progressCard.classList.add('show');

  // Başlangıç ilerleme durumunu göster
  const initialMsg = window.i18n ? window.i18n.t('extractingClipStatus') : 'Özel klip kesiliyor...';
  updateProgress(0, initialMsg);

  try {
    // Dosyayı ArrayBuffer olarak oku
    const arrayBuffer = await state.currentFile.arrayBuffer();

    // Worker'a docs/API.md formatında EXTRACT_CLIP mesajını gönder
    state.worker.postMessage({
      type: 'EXTRACT_CLIP',
      fileData: arrayBuffer,
      fileName: state.currentFile.name,
      fileType: state.currentFile.type || 'video/mp4',
      startTime: Number(state.clipStartTime.toFixed(2)),
      duration: Number(state.clipDuration.toFixed(2))
    }, [arrayBuffer]); // Zero-copy ArrayBuffer aktarımı

  } catch (err) {
    console.error('[Start Clip Extraction Error]', err);
    handleWorkerError(err.message || 'Dosya verisi okunamadı');
  }
}

/* ==========================================================================
   4.3. Mod Yönetimi ve İnteraktif Timeline Motoru
   ========================================================================== */

/**
 * Aktif çalışma modunu değiştirir ('split' veya 'clip').
 */
function switchMode(mode) {
  state.activeMode = mode;

  if (mode === 'clip') {
    if (dom.tabCustomClip) {
      dom.tabCustomClip.classList.add('active');
      dom.tabCustomClip.setAttribute('aria-selected', 'true');
    }
    if (dom.panelCustomClip) {
      dom.panelCustomClip.classList.add('active');
    }
    if (dom.tabAutoSplit) {
      dom.tabAutoSplit.classList.remove('active');
      dom.tabAutoSplit.setAttribute('aria-selected', 'false');
    }
    if (dom.panelAutoSplit) {
      dom.panelAutoSplit.classList.remove('active');
    }
    updateTimelineUI();
  } else {
    if (dom.tabAutoSplit) {
      dom.tabAutoSplit.classList.add('active');
      dom.tabAutoSplit.setAttribute('aria-selected', 'true');
    }
    if (dom.panelAutoSplit) {
      dom.panelAutoSplit.classList.add('active');
    }
    if (dom.tabCustomClip) {
      dom.tabCustomClip.classList.remove('active');
      dom.tabCustomClip.setAttribute('aria-selected', 'false');
    }
    if (dom.panelCustomClip) {
      dom.panelCustomClip.classList.remove('active');
    }
  }
}

/**
 * Video yüklendiğinde timeline başlangıç değerlerini ve cetvelini kurar.
 */
function initTimelineForVideo(duration) {
  if (!duration || duration <= 0) return;

  state.clipStartTime = 0;
  // Maksimum 9.5 saniye veya video daha kısaysa video süresi
  state.clipDuration = Math.min(9.5, duration);

  // Cetvel işaretlerini güncelle
  if (dom.rulerStart) dom.rulerStart.textContent = '00:00.0';
  if (dom.rulerMid) dom.rulerMid.textContent = formatTime(duration / 2);
  if (dom.rulerEnd) dom.rulerEnd.textContent = formatTime(duration);

  updateTimelineUI();
}

/**
 * Timeline seçim barını ve sayaç etiketlerini günceller.
 */
function updateTimelineUI() {
  if (state.videoDuration <= 0) return;

  const total = state.videoDuration;
  const leftPercent = Math.max(0, Math.min(100, (state.clipStartTime / total) * 100));
  const widthPercent = Math.max(0, Math.min(100 - leftPercent, (state.clipDuration / total) * 100));

  if (dom.timelineRangeBar) {
    dom.timelineRangeBar.style.left = `${leftPercent}%`;
    dom.timelineRangeBar.style.width = `${widthPercent}%`;
  }

  const endTime = state.clipStartTime + state.clipDuration;

  if (dom.clipStartTime) dom.clipStartTime.textContent = formatTime(state.clipStartTime);
  if (dom.clipEndTime) dom.clipEndTime.textContent = formatTime(endTime);
  if (dom.clipDuration) dom.clipDuration.textContent = `${state.clipDuration.toFixed(1)}s`;
}

/**
 * Timeline için sürükleme ve boyutlandırma olaylarını kurar.
 */
function setupTimelineInteractions() {
  let dragTarget = null; // 'left' | 'right' | 'bar'
  let dragStartX = 0;
  let dragStartLeftSec = 0;
  let dragStartDurationSec = 0;

  const onPointerMove = (e) => {
    if (!dragTarget || state.videoDuration <= 0 || !dom.timelineTrack) return;

    const rect = dom.timelineTrack.getBoundingClientRect();
    if (rect.width <= 0) return;

    const deltaPixels = e.clientX - dragStartX;
    const deltaSec = (deltaPixels / rect.width) * state.videoDuration;
    const currentEnd = dragStartLeftSec + dragStartDurationSec;

    if (dragTarget === 'bar') {
      // Barın ortasından sürükleme: Süre sabit, başlangıç ve bitiş kayar
      let newStart = dragStartLeftSec + deltaSec;
      const maxStart = Math.max(0, state.videoDuration - dragStartDurationSec);
      newStart = Math.max(0, Math.min(maxStart, newStart));
      state.clipStartTime = Number(newStart.toFixed(2));
      updateTimelineUI();

      if (dom.previewPlayer) {
        dom.previewPlayer.currentTime = state.clipStartTime;
      }
    } else if (dragTarget === 'left') {
      // Sol tutamaç: Başlangıç değişir, bitiş sabit
      // Minimum süre: 0.5s, Maksimum süre: 9.5s
      let newStart = dragStartLeftSec + deltaSec;
      const minStartAllowed = Math.max(0, currentEnd - 9.5);
      const maxStartAllowed = currentEnd - 0.5;

      newStart = Math.max(minStartAllowed, Math.min(maxStartAllowed, newStart));
      state.clipStartTime = Number(newStart.toFixed(2));
      state.clipDuration = Number((currentEnd - newStart).toFixed(2));
      updateTimelineUI();

      if (dom.previewPlayer) {
        dom.previewPlayer.currentTime = state.clipStartTime;
      }
    } else if (dragTarget === 'right') {
      // Sağ tutamaç: Başlangıç sabit, süre değişir
      // Minimum süre: 0.5s, Maksimum süre: 9.5s
      let newDuration = dragStartDurationSec + deltaSec;
      const maxDurationAllowed = Math.min(9.5, state.videoDuration - dragStartLeftSec);

      newDuration = Math.max(0.5, Math.min(maxDurationAllowed, newDuration));
      state.clipDuration = Number(newDuration.toFixed(2));
      updateTimelineUI();

      if (dom.previewPlayer) {
        dom.previewPlayer.currentTime = state.clipStartTime + state.clipDuration;
      }
    }
  };

  const onPointerUp = () => {
    dragTarget = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  };

  // Sol Tutamaç
  if (dom.handleLeft) {
    dom.handleLeft.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      dragTarget = 'left';
      dragStartX = e.clientX;
      dragStartLeftSec = state.clipStartTime;
      dragStartDurationSec = state.clipDuration;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  // Sağ Tutamaç
  if (dom.handleRight) {
    dom.handleRight.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      dragTarget = 'right';
      dragStartX = e.clientX;
      dragStartLeftSec = state.clipStartTime;
      dragStartDurationSec = state.clipDuration;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  // Barın Ortası (Pencereyi Kaydırma)
  if (dom.timelineRangeBar) {
    dom.timelineRangeBar.addEventListener('pointerdown', (e) => {
      if (
        e.target === dom.handleLeft ||
        dom.handleLeft.contains(e.target) ||
        e.target === dom.handleRight ||
        dom.handleRight.contains(e.target)
      ) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      dragTarget = 'bar';
      dragStartX = e.clientX;
      dragStartLeftSec = state.clipStartTime;
      dragStartDurationSec = state.clipDuration;

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  // Timeline İzi Boşluğuna Tıklama
  if (dom.timelineTrack) {
    dom.timelineTrack.addEventListener('click', (e) => {
      if (
        e.target === dom.timelineRangeBar ||
        dom.timelineRangeBar.contains(e.target)
      ) {
        return;
      }
      if (state.videoDuration <= 0) return;

      const rect = dom.timelineTrack.getBoundingClientRect();
      if (rect.width <= 0) return;

      const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const clickSec = clickRatio * state.videoDuration;

      // Tıklanan noktayı klibin ortasına konumlandır
      let newStart = clickSec - state.clipDuration / 2;
      const maxStart = Math.max(0, state.videoDuration - state.clipDuration);
      newStart = Math.max(0, Math.min(maxStart, newStart));

      state.clipStartTime = Number(newStart.toFixed(2));
      updateTimelineUI();

      if (dom.previewPlayer) {
        dom.previewPlayer.currentTime = state.clipStartTime;
      }
    });
  }
}

/**
 * İlerleme çubuğunu ve metinlerini günceller.
 */
function updateProgress(percent, message, currentPart, totalParts) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
  dom.progressBarFill.style.width = `${safePercent}%`;
  dom.progressPercentText.textContent = `${safePercent}%`;

  let displayMsg = message;
  if (currentPart && totalParts) {
    displayMsg = `${message} (${currentPart}/${totalParts})`;
  }
  dom.progressStatusText.textContent = displayMsg;
}

/**
 * Worker'dan COMPLETE mesajı geldiğinde sonuçları listeler.
 */
function handleComplete(data) {
  state.isProcessing = false;

  // Önceki parçaların nesne URL'lerini temizle
  clearSegmentUrls();

  state.completedMode = data.mode || (state.activeMode === 'clip' ? 'CLIP' : 'SPLIT');

  state.segments = (data.segments || []).map((seg) => {
    return {
      partIndex: seg.partIndex,
      name: seg.name,
      blob: seg.blob,
      size: seg.size,
      startTime: seg.startTime,
      endTime: seg.endTime,
      url: URL.createObjectURL(seg.blob)
    };
  });

  if (state.segments.length === 0) {
    const noSegsMsg = window.i18n ? window.i18n.t('errorNoSegments') : 'Hiçbir video parçası oluşturulamadı.';
    handleWorkerError(noSegsMsg);
    return;
  }

  // Sonuçlar başlığını moda göre güncelle
  if (state.completedMode === 'CLIP') {
    const clipNotice = window.i18n ? window.i18n.t('clipReadyNotice') : 'Özel klibiniz hazır!';
    const timeInfo = `${formatTime(state.clipStartTime)} - ${formatTime(state.clipStartTime + state.clipDuration)} (${state.clipDuration.toFixed(1)}s)`;
    dom.resultsSubtitle.textContent = `${clipNotice} (${timeInfo})`;
    if (dom.btnDownloadAllZip) {
      dom.btnDownloadAllZip.style.display = 'none';
    }
  } else {
    const subtitleMsg = window.i18n
      ? window.i18n.t('resultsSubtitle', { count: state.segments.length })
      : `Videonuz başarıyla ${state.segments.length} parçaya ayrıldı.`;
    dom.resultsSubtitle.textContent = subtitleMsg;
    if (dom.btnDownloadAllZip) {
      dom.btnDownloadAllZip.style.display = 'inline-flex';
    }
  }

  // Parça kartlarını oluştur
  renderSegmentCards();

  // İlerleme alanını gizle, sonuçlar alanını göster
  dom.progressCard.classList.remove('show');
  dom.resultsSection.classList.add('show');
}

/**
 * Worker hatası durumunda arayüzü günceller.
 */
function handleWorkerError(errorMsg) {
  state.isProcessing = false;
  dom.progressCard.classList.remove('show');

  const formattedMsg = window.i18n
    ? window.i18n.t('errorWorkerFailed', { error: errorMsg })
    : `İşlem sırasında bir hata oluştu: ${errorMsg}`;

  showAlert('danger', 'İşlem Başarısız', formattedMsg);

  // Önizleme kartını tekrar aç ki kullanıcı yeniden deneyebilsin
  if (state.currentFile && state.previewUrl) {
    dom.previewCard.classList.add('show');
  } else {
    dom.dropzoneContainer.style.display = 'block';
  }
}

/**
 * Parçaların Blob URL'lerini bellekten serbest bırakır.
 */
function clearSegmentUrls() {
  if (state.segments && state.segments.length > 0) {
    state.segments.forEach((seg) => {
      if (seg.url) {
        URL.revokeObjectURL(seg.url);
      }
    });
    state.segments = [];
  }
}

/* ==========================================================================
   5. Sonuç Parçalarını Ekrana Çizme (Rendering)
   ========================================================================== */

/**
 * Her video segmenti için video oynatıcı ve indirme butonu içeren kart üretir.
 */
function renderSegmentCards() {
  dom.segmentsGrid.innerHTML = '';

  state.segments.forEach((seg) => {
    const card = document.createElement('div');
    card.className = 'segment-card';

    const partBadgeText = window.i18n
      ? window.i18n.t('partBadge', { number: seg.partIndex })
      : `Parça ${seg.partIndex}`;

    const timeRangeText = window.i18n
      ? window.i18n.t('labelTimeRange', { start: seg.startTime, end: seg.endTime })
      : `${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}`;

    const downloadBtnText = window.i18n ? window.i18n.t('btnDownloadPart') : 'İndir';

    card.innerHTML = `
      <div class="segment-header">
        <span class="segment-badge">${partBadgeText}</span>
        <span class="segment-time-pill">${timeRangeText}</span>
      </div>
      <div class="segment-video-box">
        <video class="segment-video-player" src="${seg.url}" controls playsinline preload="metadata"></video>
      </div>
      <div class="segment-footer">
        <span class="segment-size">${formatFileSize(seg.size)}</span>
        <button type="button" class="btn-download-part" data-download-part="${seg.partIndex}">
          <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          <span>${downloadBtnText}</span>
        </button>
      </div>
    `;

    // Tekil parça indirme butonu dinleyicisi
    const downloadBtn = card.querySelector(`[data-download-part="${seg.partIndex}"]`);
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        triggerDownload(seg.blob, seg.name);
      });
    }

    dom.segmentsGrid.appendChild(card);
  });
}

/* ==========================================================================
   6. Toplu ZIP İndirme (JSZip Entegrasyonu)
   ========================================================================== */

/**
 * Tüm parçaları yerel JSZip kütüphanesiyle paketleyip indirir.
 */
async function downloadAllAsZip() {
  if (!state.segments || state.segments.length === 0) return;

  if (typeof window.JSZip === 'undefined') {
    showAlert('danger', 'Hata', 'JSZip kütüphanesi yüklenemedi. Parçaları lütfen tek tek indirin.');
    return;
  }

  const btn = dom.btnDownloadAllZip;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;

  try {
    const zip = new window.JSZip();

    // Segmentleri ZIP dosyasına ekle
    state.segments.forEach((seg) => {
      zip.file(seg.name, seg.blob);
    });

    // ZIP arşivini üret
    // NOT: MP4 dosyaları zaten sıkıştırılmış akışlar olduğu için DEFLATE yerine
    // STORE sıkıştırması kullanılarak gereksiz CPU yükü önlenir ve anında paketlenir.
    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'STORE'
      },
      (metadata) => {
        const percent = Math.round(metadata.percent);
        const prepText = window.i18n
          ? window.i18n.t('zipPreparing', { percent })
          : `ZIP Hazırlanıyor (%${percent})...`;
        btn.querySelector('span').textContent = prepText;
      }
    );

    // Orijinal dosya adından ZIP adını üret
    const originalBaseName = state.currentFile && state.currentFile.name
      ? state.currentFile.name.substring(0, state.currentFile.name.lastIndexOf('.')) || 'video'
      : 'video';
    const zipFileName = `${originalBaseName}_parts.zip`;

    // İndirmeyi başlat
    triggerDownload(zipBlob, zipFileName);

  } catch (err) {
    console.error('[ZIP Export Error]', err);
    showAlert('danger', 'ZIP Hatası', 'ZIP arşivi oluşturulurken hata meydana geldi: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/* ==========================================================================
   7. Olay Dinleyicileri (Event Listeners)
   ========================================================================== */

function setupEventListeners() {
  // Sürükle ve Bırak (Dropzone) Dinleyicileri
  const dropzone = dom.dropzoneContainer;

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleFileSelected(dt.files[0]);
    }
  });

  // Pencere genelinde varsayılan sürükle-bırak davranışını engelle
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => e.preventDefault());

  // Dosya Seçici Butonu
  dom.browseFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dom.videoFileInput.click();
  });

  dropzone.addEventListener('click', () => {
    dom.videoFileInput.click();
  });

  dom.videoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Uyarı Kartını Kapat
  if (dom.alertCloseBtn) {
    dom.alertCloseBtn.addEventListener('click', hideAlert);
  }

  // Önizleme Kartı Aksiyon Butonları
  dom.btnStartProcess.addEventListener('click', startVideoSplitting);
  dom.btnChangeFile.addEventListener('click', resetUpload);

  // Mod Seçici & Özel Klip Buton Dinleyicileri
  if (dom.tabAutoSplit) {
    dom.tabAutoSplit.addEventListener('click', () => switchMode('split'));
  }
  if (dom.tabCustomClip) {
    dom.tabCustomClip.addEventListener('click', () => switchMode('clip'));
  }
  if (dom.btnExtractClip) {
    dom.btnExtractClip.addEventListener('click', startClipExtraction);
  }
  if (dom.btnChangeFileClip) {
    dom.btnChangeFileClip.addEventListener('click', resetUpload);
  }

  // Timeline Etkileşimlerini Başlat
  setupTimelineInteractions();

  // Sonuç Alanı Aksiyon Butonları
  dom.btnDownloadAllZip.addEventListener('click', downloadAllAsZip);
  dom.btnNewVideo.addEventListener('click', () => {
    clearSegmentUrls();
    resetUpload();
  });

  // Dil Değiştirici Butonları
  dom.langButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedLang = btn.getAttribute('data-lang-btn');
      if (window.i18n && selectedLang) {
        window.i18n.applyLanguage(selectedLang);
      }
    });
  });

  // Dil Değiştiğinde Dinamik Metinleri Güncelle
  window.addEventListener('languageChanged', () => {
    if (state.currentFile && state.videoDuration > 0) {
      const estimatedParts = Math.max(1, Math.ceil(state.videoDuration / 9.5));
      const partsText = window.i18n
        ? window.i18n.t('badgeEstimatedPartsValue', { count: estimatedParts })
        : `${estimatedParts} Parça (9.5s)`;
      dom.metaPartsCount.textContent = partsText;
      updateTimelineUI();
    }

    if (state.segments && state.segments.length > 0) {
      if (state.completedMode === 'CLIP') {
        const clipNotice = window.i18n ? window.i18n.t('clipReadyNotice') : 'Özel klibiniz hazır!';
        const timeInfo = `${formatTime(state.clipStartTime)} - ${formatTime(state.clipStartTime + state.clipDuration)} (${state.clipDuration.toFixed(1)}s)`;
        dom.resultsSubtitle.textContent = `${clipNotice} (${timeInfo})`;
      } else {
        const subtitleMsg = window.i18n
          ? window.i18n.t('resultsSubtitle', { count: state.segments.length })
          : `Videonuz başarıyla ${state.segments.length} parçaya ayrıldı.`;
        dom.resultsSubtitle.textContent = subtitleMsg;
      }
      renderSegmentCards();
    }
  });

  // Gizlilik Politikası Modal Olayları
  const openModal = () => dom.privacyModal.classList.add('show');
  const closeModal = () => dom.privacyModal.classList.remove('show');

  if (dom.headerPrivacyBtn) dom.headerPrivacyBtn.addEventListener('click', openModal);
  if (dom.footerPrivacyBtn) dom.footerPrivacyBtn.addEventListener('click', openModal);
  if (dom.modalCloseBtn) dom.modalCloseBtn.addEventListener('click', closeModal);
  if (dom.modalConfirmBtn) dom.modalConfirmBtn.addEventListener('click', closeModal);

  // Modal dışına tıklandığında veya Esc tuşuna basıldığında kapat
  dom.privacyModal.addEventListener('click', (e) => {
    if (e.target === dom.privacyModal) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.privacyModal.classList.contains('show')) {
      closeModal();
    }
  });

  // Logo tıklandığında ana ekrana dön
  if (dom.brandLogoHome) {
    dom.brandLogoHome.addEventListener('click', () => {
      clearSegmentUrls();
      resetUpload();
    });
  }
}

/* ==========================================================================
   8. Sayfa Yüklendiğinde Başlatma
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Dil modülünü başlat
  if (window.i18n && typeof window.i18n.initI18n === 'function') {
    await window.i18n.initI18n();
  }

  // 2. Web Worker'ı başlat
  initWorker();

  // 3. Olay dinleyicilerini bağla
  setupEventListeners();
});
