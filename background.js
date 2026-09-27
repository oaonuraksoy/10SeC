/**
 * 10saniyetör — Background Service Worker
 * Manages extension events and opens the main app tab.
 */

// Helper to open the main app interface
function openAppTab() {
  const appUrl = chrome.runtime.getURL('src/app.html');
  chrome.tabs.create({ url: appUrl });
}

// When user clicks the extension action icon in the browser toolbar
chrome.action.onClicked.addListener(() => {
  openAppTab();
});

// When extension is newly installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    openAppTab();
  }
});
