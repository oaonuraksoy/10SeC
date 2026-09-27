/**
 * 10saniyetör — Uluslararasılaştırma (i18n) Modülü
 * Türkçe (TR) ve İngilizce (EN) tam sözlük desteği.
 * chrome.storage.local ile kalıcı dil tercihi.
 */

const translations = {
  tr: {
    // Üst Başlık & Marka
    appName: "10SeC",
    appTagline: "9.5 Saniyelik Video Parçalayıcı",
    badgeClientSide: "100% İstemci Taraflı & Güvenli",

    // Hero / Bilgi Alanı
    heroHeadline: "Videolarınızı 9.5 saniyelik parçalara bölün.",
    heroSubline: "WhatsApp Durum ve Instagram Hikayeleri için tarayıcınızda sunucusuz ve %100 gizli şekilde bölün.",
    featureFast: "Sıfır Sunucu — %100 Yerel",
    featureStories: "9.5s WhatsApp & Instagram Uyumlu",
    featureLossless: "Hızlı & Kayıpsız Remux",

    // Yükleme & Dropzone
    dropzoneTitle: "Videonuzu buraya sürükleyin veya seçin",
    dropzoneSubtitle: "MP4, WebM, MOV veya MKV formatlarını destekler",
    dropzoneBrowseBtn: "Video Dosyası Seç",
    dropzoneMaxDurationBadge: "Azami Süre: 90 Saniye",
    dropzoneHint: "Tüm işlemler doğrudan cihazınızın işlemcisinde gerçekleşir. Dosyalarınız asla internete yüklenmez.",

    // Hata & Uyarı Mesajları
    warningDurationTitle: "Video Süresi Sınırı Aşıldı!",
    warningDurationDesc: "Video süresi en fazla 90 saniye olmalıdır. Seçilen: {duration}s",
    errorInvalidFileType: "Lütfen geçerli bir video dosyası seçin (.mp4, .webm, .mov, .mkv).",
    errorReadingVideo: "Video süresi okunamadı veya dosya bozuk.",
    errorWorkerFailed: "İşlem sırasında bir hata oluştu: {error}",
    errorNoSegments: "Hiçbir video parçası oluşturulamadı.",

    // Video Önizleme & Kontrol
    previewTitle: "Seçilen Video Bilgileri",
    labelFileName: "Dosya Adı",
    labelDuration: "Süre",
    labelResolution: "Çözünürlük",
    labelFileSize: "Dosya Boyutu",
    labelEstimatedParts: "Tahmini Parça",
    badgeEstimatedPartsValue: "{count} Parça (9.5s)",
    btnStartSplitting: "Parçalara Bölmeye Başla",
    btnChangeVideo: "Farklı Video Seç",

    // Mod Seçici & Özel Klip (Timeline)
    modeAutoSplit: "Otomatik Bölme (9.5s)",
    modeCustomClip: "Özel Klip Çıkar",
    timelineHint: "Zaman çizelgesindeki barı sürükleyin veya kenarlarından tutup süresini ayarlayın (Maks. 9.5 sn).",
    startTimeLabel: "Başlangıç",
    endTimeLabel: "Bitiş",
    clipDurationLabel: "Klip Süresi",
    maxLimitBadge: "Maks. 9.5s",
    btnExtractClip: "Seçili Klibi Çıkart",
    extractingClipStatus: "Özel klip kesiliyor...",
    clipReadyNotice: "Özel klibiniz hazır!",

    // İlerleme Alanı
    progressTitle: "Video Bölünüyor...",
    progressSubtext: "Lütfen işlem tamamlanana kadar bu sekmeyi açık tutun.",
    statusInitializing: "Video işleme motoru (FFmpeg WASM) hazırlanıyor...",
    statusLoadingMemory: "Video belleğe yükleniyor...",
    statusProcessingPart: "Parça {current} / {total} remux ediliyor...",
    statusPartReady: "Parça {current} / {total} hazır.",
    statusFinalizing: "Son kontroller tamamlanıyor...",

    // Sonuç & Parçalar Alanı
    resultsTitle: "Parçalama Tamamlandı!",
    resultsSubtitle: "Videonuz başarıyla {count} parçaya ayrıldı.",
    btnDownloadAllZip: "Tüm Parçaları ZIP Olarak İndir",
    btnNewVideo: "Yeni Video Böl",
    partBadge: "Parça {number}",
    labelTimeRange: "Aralık: {start}s - {end}s",
    btnDownloadPart: "İndir",
    zipPreparing: "ZIP dosyası hazırlanıyor (%{percent})...",

    // Geliştirici & Sosyal Alanı
    devSectionTitle: "Geliştirici & İletişim",
    developerName: "Onur Aksoy",
    developerRole: "Yazılım Geliştirici & Tasarımcı",
    socialLinksTitle: "Sosyal Medya & Bağlantılar",
    linkWebsite: "Kişisel Web Sitesi",
    linkEmail: "Destek & İletişim E-Postası",
    privacyPolicyBtn: "Gizlilik Politikası",
    privacyDocsBtn: "Web'de Oku",
    privacyModalTitle: "10SeC — Gizlilik Politikası",
    privacyModalClose: "Kapat",
    footerOpenSourceNotice: "Açık Kaynak & %100 İstemci Taraflı (Client-Side) — Hiçbir video sunucuya gönderilmez.",
    copyright: "© 2026 Onur Aksoy. Tüm hakları saklıdır."
  },

  en: {
    // Header & Brand
    appName: "10SeC",
    appTagline: "9.5s Video Splitter",
    badgeClientSide: "100% Client-Side & Secure",

    // Hero / Info Area
    heroHeadline: "Split your videos into 9.5-second clips.",
    heroSubline: "Split locally in your browser for WhatsApp Status and Instagram Stories, completely serverless and private.",
    featureFast: "Zero Server — 100% Local",
    featureStories: "9.5s WhatsApp & Instagram Ready",
    featureLossless: "Fast & Lossless Remux",

    // Upload & Dropzone
    dropzoneTitle: "Drag & drop your video here, or browse",
    dropzoneSubtitle: "Supports MP4, WebM, MOV, or MKV formats",
    dropzoneBrowseBtn: "Choose Video File",
    dropzoneMaxDurationBadge: "Max Duration: 90 Seconds",
    dropzoneHint: "All processing runs directly on your device. Your videos are never uploaded to the internet.",

    // Warning & Error Messages
    warningDurationTitle: "Video Duration Limit Exceeded!",
    warningDurationDesc: "Video duration must be 90 seconds or less. Selected: {duration}s",
    errorInvalidFileType: "Please select a valid video file (.mp4, .webm, .mov, .mkv).",
    errorReadingVideo: "Could not read video metadata or file is corrupted.",
    errorWorkerFailed: "An error occurred during processing: {error}",
    errorNoSegments: "No video segments could be generated.",

    // Video Preview & Controls
    previewTitle: "Selected Video Details",
    labelFileName: "File Name",
    labelDuration: "Duration",
    labelResolution: "Resolution",
    labelFileSize: "File Size",
    labelEstimatedParts: "Estimated Clips",
    badgeEstimatedPartsValue: "{count} Clips (9.5s)",
    btnStartSplitting: "Start Splitting Clips",
    btnChangeVideo: "Choose Another Video",

    // Mode Selector & Custom Clip (Timeline)
    modeAutoSplit: "Auto Split (9.5s)",
    modeCustomClip: "Custom Clip Trimmer",
    timelineHint: "Drag the bar or adjust handles to select your clip (Max 9.5s).",
    startTimeLabel: "Start",
    endTimeLabel: "End",
    clipDurationLabel: "Clip Duration",
    maxLimitBadge: "Max 9.5s",
    btnExtractClip: "Extract Selected Clip",
    extractingClipStatus: "Extracting custom clip...",
    clipReadyNotice: "Your custom clip is ready!",

    // Progress Area
    progressTitle: "Splitting Video...",
    progressSubtext: "Please keep this tab open until processing is complete.",
    statusInitializing: "Initializing video engine (FFmpeg WASM)...",
    statusLoadingMemory: "Loading video into memory...",
    statusProcessingPart: "Remuxing part {current} / {total}...",
    statusPartReady: "Part {current} / {total} ready.",
    statusFinalizing: "Finalizing segments...",

    // Results & Segments Area
    resultsTitle: "Splitting Completed!",
    resultsSubtitle: "Your video has been successfully split into {count} clips.",
    btnDownloadAllZip: "Download All as ZIP Archive",
    btnNewVideo: "Split Another Video",
    partBadge: "Clip {number}",
    labelTimeRange: "Range: {start}s - {end}s",
    btnDownloadPart: "Download",
    zipPreparing: "Preparing ZIP archive ({percent}%)...",

    // Developer & Social Area
    devSectionTitle: "Developer & Contact",
    developerName: "Onur Aksoy",
    developerRole: "Software Developer & Designer",
    socialLinksTitle: "Social Media & Links",
    linkWebsite: "Personal Website",
    linkEmail: "Support & Contact Email",
    privacyPolicyBtn: "Privacy Policy",
    privacyDocsBtn: "Read on Web",
    privacyModalTitle: "10SeC — Privacy Policy",
    privacyModalClose: "Close",
    footerOpenSourceNotice: "Open Source & 100% Client-Side — No videos are ever sent to a server.",
    copyright: "© 2026 Onur Aksoy. All rights reserved."
  }
};

let currentLang = 'tr';

/**
 * Belirtilen anahtar ve parametrelere göre çeviri metnini döndürür.
 * @param {string} key Çeviri anahtarı
 * @param {Object} [params] Şablon değişkenleri ör: { duration: 45 }
 * @returns {string}
 */
function t(key, params = {}) {
  const dict = translations[currentLang] || translations.tr;
  let text = dict[key] || translations.tr[key] || key;

  if (params && typeof params === 'object') {
    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
    });
  }

  return text;
}

/**
 * Sayfadaki tüm data-i18n ve data-i18n-attr özniteliklerini günceller.
 * @param {string} lang 'tr' veya 'en'
 */
function applyLanguage(lang) {
  if (lang !== 'tr' && lang !== 'en') {
    lang = 'tr';
  }
  currentLang = lang;

  if (typeof document === 'undefined') return;

  // HTML lang özniteliğini güncelle
  document.documentElement.lang = lang;

  // data-i18n etiketlerini güncelle
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key && translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // data-i18n-placeholder etiketlerini güncelle
  const placeholderEls = document.querySelectorAll('[data-i18n-placeholder]');
  placeholderEls.forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && translations[lang] && translations[lang][key]) {
      el.setAttribute('placeholder', translations[lang][key]);
    }
  });

  // data-i18n-title etiketlerini güncelle
  const titleEls = document.querySelectorAll('[data-i18n-title]');
  titleEls.forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key && translations[lang] && translations[lang][key]) {
      el.setAttribute('title', translations[lang][key]);
    }
  });

  // Dil seçici butonların aktif durumunu güncelle
  const langButtons = document.querySelectorAll('[data-lang-btn]');
  langButtons.forEach((btn) => {
    const btnLang = btn.getAttribute('data-lang-btn');
    if (btnLang === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Tercihi chrome.storage.local veya localStorage ile sakla
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ preferredLang: lang });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem('10sec_lang', lang);
    }
  } catch (err) {
    console.warn('[i18n] Dil tercihi saklanamadı:', err);
  }

  // Özel olay tetikle
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

/**
 * Kullanıcının kayıtlı dilini yükler veya tarayıcı diline göre varsayılanı belirler.
 */
async function initI18n() {
  let detectedLang = 'tr';

  // 1. chrome.storage kontrol et
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      const stored = await chrome.storage.local.get(['preferredLang']);
      if (stored && stored.preferredLang) {
        applyLanguage(stored.preferredLang);
        return stored.preferredLang;
      }
    } catch (_) {}
  }

  // 2. localStorage kontrol et
  if (typeof localStorage !== 'undefined') {
    const local = localStorage.getItem('10sec_lang');
    if (local === 'tr' || local === 'en') {
      applyLanguage(local);
      return local;
    }
  }

  // 3. Tarayıcı dilini kontrol et
  if (typeof navigator !== 'undefined' && navigator.language) {
    const navLang = navigator.language.toLowerCase();
    if (navLang.startsWith('tr')) {
      detectedLang = 'tr';
    } else {
      detectedLang = 'en';
    }
  }

  applyLanguage(detectedLang);
  return detectedLang;
}

// Global nesneye bağla
if (typeof window !== 'undefined') {
  window.i18n = {
    t,
    applyLanguage,
    initI18n,
    getCurrentLanguage: () => currentLang,
    translations
  };
}

// Node.js ortamında test için export desteği
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    translations,
    t,
    applyLanguage,
    initI18n,
    getCurrentLanguage: () => currentLang
  };
}
