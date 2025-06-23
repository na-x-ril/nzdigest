console.log('allow pasting');
console.log('_legacyUndefinedCheck: true');
let audioNode = null;
let lastDateText = 'Streaming dimulai baru saja';
let latestFetchedData = null;
let lastLoggedViewCount = null;
let countdownInterval = null;

// Tambahan untuk Skip Sponsor
let sponsorSegments = [];
let currentSponsorSegment = null;
let skipButton = null;

// Tambahkan variabel untuk skip settings
let skipSettings = {
  sponsor: 'manual',
  selfpromo: 'manual', 
  interaction: 'manual',
  intro: 'manual',
  outro: 'manual',
  preview: 'manual',
  music_offtopic: 'manual',
  filler: 'manual'
};

// Tambahkan variabel untuk kontrol event listener timeupdate
let shouldAddEventListenerTimeUpdate = true;

// ===== UTILITY FUNCTIONS (Reusable dengan get prefix) =====

// Fungsi untuk mendapatkan elemen dengan selector
function getElement(selector) {
  return document.querySelector(selector);
}

// Fungsi untuk mendapatkan semua elemen dengan selector
function getElements(selector) {
  return document.querySelectorAll(selector);
}

// Fungsi untuk mendapatkan video element
function getVideoElement() {
  return getElement('video');
}

// Fungsi untuk mendapatkan player element
function getPlayerElement() {
  return getElement('#movie_player');
}

// Fungsi untuk mendapatkan current video ID
function getCurrentVideoId() {
  return new URL(location.href).searchParams.get('v');
}

// Fungsi untuk mendapatkan saved time dari localStorage
function getSavedTime(videoId) {
  return localStorage.getItem(`yt_time_${videoId}`);
}

// Fungsi untuk mendapatkan skip settings dari localStorage
function getSkipSettings() {
  try {
    const savedSettings = localStorage.getItem('skipSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      sponsor: 'manual',
      selfpromo: 'manual', 
      interaction: 'manual',
      intro: 'manual',
      outro: 'manual',
      preview: 'manual',
      music_offtopic: 'manual',
      filler: 'manual'
    };
  } catch (error) {
    console.error('Error loading skip settings:', error);
    return {
      sponsor: 'manual',
      selfpromo: 'manual', 
      interaction: 'manual',
      intro: 'manual',
      outro: 'manual',
      preview: 'manual',
      music_offtopic: 'manual',
      filler: 'manual'
    };
  }
}

// Fungsi untuk mendapatkan fetch interval dari localStorage
function getFetchInterval() {
  return localStorage.getItem('fetchInterval') || '';
}

// Fungsi untuk mendapatkan spam interval dari localStorage
function getSpamInterval() {
  return localStorage.getItem('spamInterval');
}

// Fungsi untuk mendapatkan user ID dari localStorage atau generate baru
function getOrCreateUserID() {
  const storageKey = 'sponsorblock_userid';
  let userID = localStorage.getItem(storageKey);
  
  if (!userID) {
    userID = getGeneratedUserID();
    localStorage.setItem(storageKey, userID);
  }
  
  return userID;
}

// Fungsi untuk generate random userID
function getGeneratedUserID() {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 30; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Fungsi untuk mendapatkan video duration
function getVideoDuration() {
  const video = getVideoElement();
  return video ? video.duration : null;
}

// Fungsi untuk mendapatkan current video time
function getCurrentVideoTime() {
  const video = getVideoElement();
  return video ? video.currentTime : 0;
}

// Fungsi untuk mendapatkan video title
function getVideoTitle() {
  const titleElement = getElement('#title > h1');
  return titleElement ? titleElement.textContent : '';
}

// Fungsi untuk mendapatkan channel title
function getChannelTitle() {
  const channelElement = getElement('#channel-name a');
  return channelElement ? channelElement.textContent : '';
}

// Fungsi untuk mendapatkan is playlist
function getIsPlaylist() {
  return new URLSearchParams(window.location.search).has('list');
}

// Fungsi untuk mendapatkan is live dari data
function getIsLiveFromData(data) {
  return data?.items?.[0]?.snippet?.liveBroadcastContent === 'live';
}

// Fungsi untuk mendapatkan is upcoming dari data
function getIsUpcomingFromData(data) {
  return data?.items?.[0]?.snippet?.liveBroadcastContent === 'upcoming';
}

// Fungsi untuk mendapatkan view count dari data
function getViewCountFromData(data) {
  const item = data?.items?.[0];
  if (!item) return '0';
  
  if (getIsLiveFromData(data) || getIsUpcomingFromData(data)) {
    return item.liveStreamingDetails?.concurrentViewers || '0';
  }
  
  return item.statistics?.viewCount || '0';
}

// Fungsi untuk mendapatkan date text dari data
function getDateTextFromData(data) {
  const item = data?.items?.[0];
  if (!item) return 'Dipublikasikan baru saja';
  
  return item.snippet?.publishedAt || 'Dipublikasikan baru saja';
}

// Fungsi untuk mendapatkan channel title dari data
function getChannelTitleFromData(data) {
  const item = data?.items?.[0];
  if (!item) return '';
  
  return item.snippet?.channelTitle || '';
}

// Fungsi untuk mendapatkan segment type label
function getSegmentTypeLabel(segmentType) {
  const labels = {
    'sponsor': 'Sponsor',
    'selfpromo': 'Promosi',
    'interaction': 'Interaksi',
    'intro': 'Intro',
    'outro': 'Outro',
    'preview': 'Preview',
    'music_offtopic': 'Musik/Offtopic',
    'filler': 'Filler'
  };
  return labels[segmentType] || 'Segmen';
}

// Fungsi untuk mendapatkan segment type dari skip settings
function getSegmentSkipSetting(segmentType) {
  const settings = getSkipSettings();
  return settings[segmentType] || 'manual';
}

// Fungsi untuk mendapatkan is auto skip untuk segment type
function getIsAutoSkip(segmentType) {
  return getSegmentSkipSetting(segmentType) === 'auto';
}

// Fungsi untuk mendapatkan is manual skip untuk segment type
function getIsManualSkip(segmentType) {
  return getSegmentSkipSetting(segmentType) === 'manual';
}

// Fungsi untuk mendapatkan current time formatted
function getCurrentTimeFormatted() {
  return getFormattedTime(getCurrentVideoTime());
}

// Fungsi untuk mendapatkan video duration formatted
function getVideoDurationFormatted() {
  const duration = getVideoDuration();
  return duration ? getFormattedTime(duration) : '00:00:00';
}

// Fungsi untuk mendapatkan is video playing
function getIsVideoPlaying() {
  const video = getVideoElement();
  return video ? !video.paused : false;
}

// Fungsi untuk mendapatkan is video muted
function getIsVideoMuted() {
  const video = getVideoElement();
  return video ? video.muted : false;
}

// Fungsi untuk mendapatkan video volume
function getVideoVolume() {
  const video = getVideoElement();
  return video ? video.volume : 0;
}

// Fungsi untuk mendapatkan video playback rate
function getVideoPlaybackRate() {
  const video = getVideoElement();
  return video ? video.playbackRate : 1;
}

// Fungsi untuk mendapatkan is video in fullscreen
function getIsVideoFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
}

// Fungsi untuk mendapatkan is video in theater mode
function getIsVideoTheaterMode() {
  return document.body.classList.contains('watch-wide');
}

// Fungsi untuk mendapatkan is video in miniplayer mode
function getIsVideoMiniplayerMode() {
  return document.body.classList.contains('watch-miniplayer');
}

// Fungsi untuk mendapatkan is video in picture-in-picture mode
function getIsVideoPictureInPicture() {
  return document.pictureInPictureElement === getVideoElement();
}

// ===== PARSING & FORMATTING UTILITIES =====

// Fungsi untuk mendapatkan seconds dari time string (HH:MM:SS)
function getSecondsFromTime(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

// Fungsi untuk mendapatkan time string dari seconds (HH:MM:SS)
function getTimeStringFromSeconds(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

// Fungsi untuk mendapatkan formatted number dengan separator
function getFormattedNumber(number, separator = ',') {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

// Fungsi untuk mendapatkan formatted percentage
function getFormattedPercentage(value, total, decimals = 1) {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

// Fungsi untuk mendapatkan formatted file size
function getFormattedFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Fungsi untuk mendapatkan formatted duration (human readable)
function getFormattedDuration(seconds) {
  if (seconds < 60) return `${Math.floor(seconds)} detik`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam`;
  return `${Math.floor(seconds / 86400)} hari`;
}

// Fungsi untuk mendapatkan formatted date (Indonesian)
function getFormattedDate(date) {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  };
  return new Date(date).toLocaleDateString('id-ID', options);
}

// Fungsi untuk mendapatkan formatted time (Indonesian)
function getFormattedTimeIndonesian(date) {
  const options = { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  };
  return new Date(date).toLocaleTimeString('id-ID', options);
}

// Fungsi untuk mendapatkan formatted datetime (Indonesian)
function getFormattedDateTime(date) {
  return `${getFormattedDate(date)} ${getFormattedTimeIndonesian(date)}`;
}

// ===== VALIDATION & CHECKING UTILITIES =====

// Fungsi untuk mendapatkan is valid time format (HH:MM:SS)
function getIsValidTimeFormat(timeStr) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

// Fungsi untuk mendapatkan is valid URL
function getIsValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Fungsi untuk mendapatkan is valid YouTube URL
function getIsValidYouTubeUrl(url) {
  if (!getIsValidUrl(url)) return false;
  const urlObj = new URL(url);
  return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
}

// Fungsi untuk mendapatkan is valid video ID
function getIsValidVideoId(videoId) {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

// Fungsi untuk mendapatkan is valid fetch code
function getIsValidFetchCode(fetchCode) {
  const urlRegex = /^fetch.*https:\/\//;
  return urlRegex.test(fetchCode);
}

// Fungsi untuk mendapatkan is valid interval
function getIsValidInterval(interval) {
  return /^\d+$/.test(interval) && parseInt(interval, 10) > 0;
}

// Fungsi untuk mendapatkan is valid segment data
function getIsValidSegmentData(segmentData) {
  return segmentData && 
         typeof segmentData.startTime === 'number' && 
         typeof segmentData.endTime === 'number' &&
         segmentData.startTime >= 0 &&
         segmentData.endTime > segmentData.startTime &&
         segmentData.category;
}

// Fungsi untuk mendapatkan is valid notification type
function getIsValidNotificationType(type) {
  return ['info', 'success', 'warning', 'error'].includes(type);
}

// Fungsi untuk mendapatkan is element visible
function getIsElementVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0';
}

// Fungsi untuk mendapatkan is element in viewport
function getIsElementInViewport(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.top >= 0 &&
         rect.left >= 0 &&
         rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
         rect.right <= (window.innerWidth || document.documentElement.clientWidth);
}

// Fungsi untuk mendapatkan is element clickable
function getIsElementClickable(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.pointerEvents !== 'none' && 
         style.cursor !== 'not-allowed' &&
         !element.disabled;
}

// Fungsi untuk mendapatkan is browser supports feature
function getIsBrowserSupportsFeature(feature) {
  const features = {
    'pictureInPicture': 'pictureInPictureEnabled' in document,
    'fullscreen': 'fullscreenEnabled' in document,
    'webAudio': 'AudioContext' in window || 'webkitAudioContext' in window,
    'localStorage': 'localStorage' in window,
    'sessionStorage': 'sessionStorage' in window,
    'fetch': 'fetch' in window,
    'promises': 'Promise' in window,
    'asyncAwait': (() => {
      try {
        new Function('async () => {}');
        return true;
      } catch {
        return false;
      }
    })()
  };
  return features[feature] || false;
}

// Load settings dari localStorage
try {
  const savedSettings = localStorage.getItem('skipSettings');
  if (savedSettings) {
    skipSettings = JSON.parse(savedSettings);
  }
} catch (error) {
  console.error('Error loading skip settings:', error);
}

const $ = getElement;
const $$ = getElements;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Pindahkan fungsi setupSkipSettingsListeners ke scope global
function setupSkipSettingsListeners() {
  const elements = {
    skipSettingsPopup: $('#skip-settings-popup'),
    toggleSkipSettingsButton: $('#toggle-skip-settings'),
    saveSkipSettingsButton: $('#save-skip-settings'),
    closeSkipSettingsButton: $('#close-skip-settings'),
    skipSettingSelects: $$('.skip-setting-item select')
  };

  // Toggle popup
  elements.toggleSkipSettingsButton?.addEventListener('click', () => {
    elements.skipSettingsPopup.style.display = 'block';
  });

  // Close popup
  elements.closeSkipSettingsButton?.addEventListener('click', () => {
    elements.skipSettingsPopup.style.display = 'none';
  });

  // Close on outside click
  elements.skipSettingsPopup?.addEventListener('click', (e) => {
    if (e.target === elements.skipSettingsPopup) {
      elements.skipSettingsPopup.style.display = 'none';
    }
  });

  // Save settings
  elements.saveSkipSettingsButton?.addEventListener('click', () => {
    const currentSkipSettings = getSkipSettings();
    
    elements.skipSettingSelects.forEach(select => {
      const type = select.getAttribute('data-type');
      currentSkipSettings[type] = select.value;
    });
    
    localStorage.setItem('skipSettings', JSON.stringify(currentSkipSettings));
    elements.skipSettingsPopup.style.display = 'none';
    console.log('Skip settings saved:', currentSkipSettings);
  });

  // Tambahkan event listener untuk keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.skipSettingsPopup.style.display === 'block') {
      elements.skipSettingsPopup.style.display = 'none';
    }
  });
}

const getVideoId = async (url) => new URL(url).searchParams.get('v');

function waitForUrlChange() {
  return new Promise((resolve) => {
    let lastUrl = location.href;

    const checkUrl = () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        resolve(lastUrl);
      } else {
        requestAnimationFrame(checkUrl);
      }
    };

    checkUrl();
  });
}

function waitForElement(selector) {
  return new Promise((resolve) => {
    const checkElement = () => {
      const element = getElement(selector);
      if (element) {
        resolve(element);
      } else {
        requestAnimationFrame(checkElement);
      }
    };
    checkElement();
  });
}

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string) => string,
    createScriptURL: (string) => string,
    createScript: (string) => string,
  });
}

async function main() {
  if (!document.body) return requestAnimationFrame(main);
  
  // Header Update
  function updateHeader() {
    const logoIcons = $$('#logo-icon > span');
    if (logoIcons.length) {
      for (const el of logoIcons) {
      if (!el.shadowRoot) {
        const shadow = el.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
          <div injected style="width: 100%; height: 100%; display: block; fill: currentcolor;">
            <?xml version="1.0" encoding="UTF-8"?>
            <svg class="external-icon" display="inherit" pointer-events="none" style="height:100%;width:100%" focusable="false" viewBox="0 0 90 20" xmlns="http://www.w3.org/2000/svg">
              <svg viewBox="0 0 97 20" xmlns="http://www.w3.org/2000/svg">
                <path d="m27.97 3.1232c-0.3293-1.23-1.2959-2.1966-2.5259-2.5259-2.2272-0.59737-11.162-0.59737-11.162-0.59737s-8.9346 2.2429e-7 -11.162 0.59737c-1.2276 0.32926-2.1966 1.2959-2.5259 2.5259-0.59501 2.2272-0.59501 6.8768-0.59501 6.8768s-1.57e-6 4.6496 0.59736 6.8768c0.32926 1.23 1.2959 2.1966 2.5259 2.5258 2.2272 0.5974 11.162 0.5974 11.162 0.5974s8.9347 0 11.162-0.5974c1.2301-0.3292 2.1967-1.2958 2.5259-2.5258 0.5974-2.2272 0.5974-6.8768 0.5974-6.8768s-0.0024-4.6496-0.5997-6.8768z" fill="#f00"/>
                <path d="m11.428 14.285 7.42-4.285-7.42-4.2851v8.5701z" fill="#fff"/>
                <path d="m40.057 6.3452v0.69144c0 3.4548-1.5311 5.4751-4.8824 5.4751h-0.5104v6.0465h-2.7375v-17.135h3.4877c3.1938 0 4.6426 1.35 4.6426 4.9224zm-2.8787 0.24694c0-2.4929-0.4492-3.0856-2.0014-3.0856h-0.5103v6.9661h0.4703c1.4699 0 2.0438-1.063 2.0438-3.3702l-0.0024-0.51035z"/>
                <path d="m46.534 5.8345-0.1435 3.2479c-1.1642-0.24459-2.1261-0.06115-2.5541 0.69144v8.7841h-2.7164v-12.519h2.1661l0.2446 2.714h0.1034c0.2846-1.9802 1.2042-2.9821 2.3895-2.9821 0.1717 0.0047 0.3434 0.02587 0.5104 0.0635z"/>
                <path d="m49.657 13.246v0.6326c0 2.206 0.1223 2.9633 1.0631 2.9633 0.8984 0 1.103-0.6914 1.1241-2.1237l2.4295 0.1435c0.1834 2.6952-1.2253 3.9017-3.6148 3.9017-2.8998 0-3.7582-1.9003-3.7582-5.3504v-2.1896c0-3.6359 0.9595-5.4139 3.8405-5.4139 2.8998 0 3.636 1.5122 3.636 5.2893v2.1472h-4.7202zm0-2.5753v0.8984h2.0626v-0.8937c0-2.3024-0.1646-2.9633-1.0372-2.9633-0.8725 0-1.0254 0.67497-1.0254 2.9633v-0.0047z"/>
                <path d="m68.41 9.099v9.4567h-2.8175v-9.2474c0-1.0207-0.2658-1.531-0.8796-1.531-0.4916 0-0.9408 0.28457-1.2465 0.81609 0.0165 0.16933 0.0235 0.34101 0.0212 0.51035v9.4568h-2.8199v-9.2522c0-1.0207-0.2658-1.531-0.8796-1.531-0.4915 0-0.9219 0.28457-1.2253 0.79727v9.9882h-2.8175v-12.524h2.2272l0.2493 1.5945h0.04c0.6326-1.2041 1.6557-1.858 2.8598-1.858 1.1853 0 1.858 0.59266 2.1661 1.6557 0.6538-1.0818 1.6345-1.6557 2.7563-1.6557 1.7121 0 2.366 1.2253 2.366 3.3231z"/>
                <path d="m69.819 2.8338c0-1.3476 0.4915-1.7357 1.531-1.7357 1.0631 0 1.5311 0.4492 1.5311 1.7357 0 1.3899-0.4704 1.738-1.5311 1.738-1.0395-0.00236-1.531-0.35043-1.531-1.738zm0.1646 3.2056h2.6952v12.524h-2.6952v-12.524z"/>
                <path d="m81.891 6.0396v12.524h-2.2061l-0.2446-1.5311h-0.0611c-0.6326 1.2253-1.5522 1.7357-2.6952 1.7357-1.6745 0-2.4318-1.0631-2.4318-3.3702v-9.3556h2.8175v9.1933c0 1.103 0.2305 1.5522 0.7973 1.5522 0.5174-0.0211 0.9807-0.3292 1.2018-0.7972v-9.9483h2.8222v-0.00235z"/>
                <path d="m96.19 9.0989v9.4568h-2.8175v-9.2474c0-1.0207-0.2658-1.531-0.8796-1.531-0.4915 0-0.9407 0.28457-1.2465 0.81609 0.0165 0.16698 0.0236 0.33631 0.0212 0.50564v9.4568h-2.8175v-9.2474c0-1.0207-0.2657-1.531-0.8796-1.531-0.4915 0-0.9219 0.28457-1.2253 0.79727v9.9882h-2.8175v-12.524h2.2249l0.2446 1.5922h0.0399c0.6327-1.2041 1.6557-1.858 2.8599-1.858 1.1853 0 1.8579 0.59266 2.166 1.6557 0.6538-1.0818 1.6345-1.6557 2.7563-1.6557 1.7216 0.00235 2.3707 1.2277 2.3707 3.3255z"/>
                <path d="m40.057 6.3452v0.69144c0 3.4548-1.5311 5.4751-4.8824 5.4751h-0.5104v6.0465h-2.7375v-17.135h3.4877c3.1938 0 4.6426 1.35 4.6426 4.9224zm-2.8787 0.24694c0-2.4929-0.4492-3.0856-2.0014-3.0856h-0.5103v6.9661h0.4703c1.4699 0 2.0438-1.063 2.0438-3.3702l-0.0024-0.51035z"/>
              </svg>
            </svg>
          </div>
        `;
      }
      }
    }

    // Tetap lakukan perubahan pada elemen lain yang tidak memerlukan Shadow DOM
    const elements = {
      'a.ytd-topbar-logo-renderer': (el) => el.removeAttribute('href'),
      'ytd-topbar-logo-renderer#logo': (el) => el.removeAttribute('show-yoodle'),
      'a#logo.ytd-topbar-logo-renderer>div.ytd-topbar-logo-renderer': (el) => el.removeAttribute('hidden'),
      '#country-code.ytd-topbar-logo-renderer': (el) => el.removeAttribute('hidden'),
      '#logo.ytd-topbar-logo-renderer': (el) => el.setAttribute('title', 'Beranda YouTube Premium')
    };

    for (const [selector, action] of Object.entries(elements)) {
      $$(selector).forEach(action);
    }
  }

  function setupFetchToggle() {
    const endElement = $('#end');
    if (!endElement || $('#toggle-fetch-input') || $('#fetch-popup')) return;
  
    const fetchToggleButton = document.createElement('button');
    fetchToggleButton.id = 'toggle-fetch-input';
    fetchToggleButton.className = 'style-scope toggle-fetch';
    fetchToggleButton.setAttribute('alt', 'Toggle Fetch Input');
    fetchToggleButton.setAttribute('title', 'Spam Web Request');
    fetchToggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1.6em" height="1.6em" viewBox="0 0 14 14">
        <path fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" d="m.5 10.5l10-10H6m7.5 3l-10 10H8" />
      </svg>
    `;
    
    // Tambahkan tombol skip settings
    const skipSettingsButton = document.createElement('button');
    skipSettingsButton.id = 'toggle-skip-settings';
    skipSettingsButton.className = 'style-scope toggle-skip-settings';
    skipSettingsButton.setAttribute('alt', 'Toggle Skip Settings');
    skipSettingsButton.setAttribute('title', 'Atur Skip Sponsor');
    skipSettingsButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1.6em" height="1.6em" viewBox="0 0 24 24">
        <path fill="white" d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.12-.22-.07-.49.12-.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5s-1.57 3.5-3.5 3.5z"/>
      </svg>
    `;

    endElement.insertAdjacentElement('afterbegin', skipSettingsButton);
    endElement.insertAdjacentElement('afterbegin', fetchToggleButton);

    // Tambahkan popup untuk skip settings
    const skipSettingsPopup = document.createElement('div');
    skipSettingsPopup.id = 'skip-settings-popup';
    skipSettingsPopup.className = 'skip-settings-popup';
    skipSettingsPopup.style.display = 'none';
    
    const currentSkipSettings = getSkipSettings();
    
    skipSettingsPopup.innerHTML = `
      <div class="skip-settings-popup-content">
        <h3>Pengaturan Skip Sponsor</h3>
        <div class="skip-settings-list">
          <div class="skip-setting-item">
            <label>Sponsor</label>
            <select data-type="sponsor">
              <option value="manual" ${currentSkipSettings.sponsor === 'manual' ? 'selected' : ''}>Manual</option>
              <option value="auto" ${currentSkipSettings.sponsor === 'auto' ? 'selected' : ''}>Otomatis</option>
            </select>
          </div>
          <div class="skip-setting-item">
            <label>Self Promo</label>
            <select data-type="selfpromo">
              <option value="manual" ${currentSkipSettings.selfpromo === 'manual' ? 'selected' : ''}>Manual</option>
              <option value="auto" ${currentSkipSettings.selfpromo === 'auto' ? 'selected' : ''}>Otomatis</option>
            </select>
          </div>
          <div class="skip-setting-item">
            <label>Interaksi</label>
            <select data-type="interaction">
              <option value="manual" ${currentSkipSettings.interaction === 'manual' ? 'selected' : ''}>Manual</option>
              <option value="auto" ${currentSkipSettings.interaction === 'auto' ? 'selected' : ''}>Otomatis</option>
            </select>
          </div>
          <div class="skip-setting-item">
            <label>Intro</label>
            <select data-type="intro">
              <option value="manual" ${currentSkipSettings.intro === 'manual' ? 'selected' : ''}>Manual</option>
              <option value="auto" ${currentSkipSettings.intro === 'auto' ? 'selected' : ''}>Otomatis</option>
            </select>
          </div>
          <div class="skip-setting-item">
            <label>Outro</label>
            <select data-type="outro">
              <option value="manual" ${currentSkipSettings.outro === 'manual' ? 'selected' : ''}>Manual</option>
              <option value="auto" ${currentSkipSettings.outro === 'auto' ? 'selected' : ''}>Otomatis</option>
            </select>
          </div>
          <div class="skip-setting-item">
            <label>Preview</label>
            <select data-type="preview">
              <option value="manual" ${currentSkipSettings.preview === 'manual' ? 'selected' : ''}>Manual</option>
              <option value="auto" ${currentSkipSettings.preview === 'auto' ? 'selected' : ''}>Otomatis</option>
            </select>
          </div>
          <div class="skip-setting-item">
            <label>Musik/Offtopic</label>
            <select data-type="music_offtopic">
              <option value="manual" ${currentSkipSettings.music_offtopic === 'manual' ? 'selected' : ''}>Manual</option>
              <option value="auto" ${currentSkipSettings.music_offtopic === 'auto' ? 'selected' : ''}>Otomatis</option>
            </select>
          </div>
          <div class="skip-setting-item">
            <label>Filler</label>
            <select data-type="filler">
              <option value="manual" ${currentSkipSettings.filler === 'manual' ? 'selected' : ''}>Manual</option>
              <option value="auto" ${currentSkipSettings.filler === 'auto' ? 'selected' : ''}>Otomatis</option>
            </select>
          </div>
        </div>
        <div class="skip-settings-buttons">
          <button id="close-skip-settings">Tutup</button>
          <button id="save-skip-settings">Simpan</button>
        </div>
      </div>
    `;
    document.body.appendChild(skipSettingsPopup);
    setupSkipSettingsListeners();
  
    const popupDialog = document.createElement('div');
    popupDialog.id = 'fetch-popup';
    popupDialog.className = 'fetch-popup';
    popupDialog.style.display = 'none';
    popupDialog.innerHTML = `
      <div class="fetch-popup-content">
        <h3>Custom Fetch Configuration</h3>
        <div class="fetch-input-group">
          <label for="fetch-input">Fetch URL<span id="url-validation-message">*Invalid Fetch</span></label>
          <input type="text" id="fetch-input" placeholder="Enter fetch URL..." autocomplete="off">
        </div>
        <div class="fetch-input-group">
          <label for="fetch-interval">Interval (ms)<span id="interval-validation-message">*Invalid number</span></label>
          <input type="number" id="fetch-interval" placeholder="Enter interval..." value="${getFetchInterval()}">
        </div>
        <div class="fetch-buttons">
          <button id="close-popup">Close</button>
          <button id="submit-fetch">Start Fetch</button>
          <button id="stop-fetch" style="display: none;">Stop Fetch</button>
        </div>
      </div>
    `;
    document.body.appendChild(popupDialog);
  
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && popupDialog.style.display === 'block') {
        popupDialog.style.display = 'none';
      } else if (e.key === "Enter" && popupDialog.style.display === 'block') {
        $('#submit-fetch')?.click();
      }
    };
  
    document.addEventListener('keydown', handleEscapeKey);
    setupFetchPopupListeners();
  }

  function setupFetchPopupListeners() {
    const elements = {
      fetchPopup: $('#fetch-popup'),
      fetchInput: $('#fetch-input'),
      fetchIntervalInput: $('#fetch-interval'),
      submitFetchButton: $('#submit-fetch'),
      stopFetchButton: $('#stop-fetch'),
      closePopupButton: $('#close-popup'),
      toggleFetchButton: $('#toggle-fetch-input'),
      urlMessage: $('#url-validation-message'),
      intervalMessage: $('#interval-validation-message')
    };
  
    let fetchIntervalId = null;
  
    const validateInputs = (fetchCode, intervalValue) => {
      const isFetchCodeValid = getIsValidFetchCode(fetchCode);
      const isIntervalValid = getIsValidInterval(intervalValue);

      elements.urlMessage.style.display = !isFetchCodeValid ? 'block' : 'none';
      elements.intervalMessage.style.display = !isIntervalValid ? 'block' : 'none';
      
      return isFetchCodeValid && isIntervalValid;
    };

    const toggleFetchButtons = (isStarting) => {
      elements.stopFetchButton.style.display = isStarting ? 'inline-block' : 'none';
      elements.submitFetchButton.style.display = isStarting ? 'none' : 'inline-block';
    };

    const startFetchInterval = (fetchCode, intervalValue) => {
      if (fetchIntervalId) {
        clearInterval(fetchIntervalId);
      }
  
      fetchIntervalId = setInterval(() => {
        try {
          new Function(fetchCode)();
        } catch (error) {
          console.error('Error executing fetch code:', error);
        }
      }, parseInt(intervalValue));
  
      toggleFetchButtons(true);
    };
  
    const stopFetchInterval = () => {
      if (fetchIntervalId) {
        clearInterval(fetchIntervalId);
        fetchIntervalId = null;
        console.info('Fetch interval stopped');
        toggleFetchButtons(false);
      }
    };

    // Event Listeners
    elements.toggleFetchButton?.addEventListener('click', () => {
      elements.fetchPopup.style.display = 'block';
    });

    elements.closePopupButton?.addEventListener('click', () => {
      elements.fetchPopup.style.display = 'none';
    });

    elements.fetchPopup?.addEventListener('click', (e) => {
      if (e.target === elements.fetchPopup) {
        elements.fetchPopup.style.display = 'none';
      }
    });
  
    elements.submitFetchButton?.addEventListener('click', () => {
      const fetchCode = elements.fetchInput.value.trim();
      const intervalValue = elements.fetchIntervalInput.value;

      if (validateInputs(fetchCode, intervalValue)) {
        localStorage.setItem('spamInterval', intervalValue);
        startFetchInterval(fetchCode, intervalValue);
      }
    });

    elements.stopFetchButton?.addEventListener('click', stopFetchInterval);

    // Load saved interval if exists
    const savedInterval = getSpamInterval();
    if (savedInterval && elements.fetchIntervalInput) {
      elements.fetchIntervalInput.value = savedInterval;
    }
  }  

  function renderClock() {
    return new Promise((resolve) => {
      const topbarButtons = $('#end');
      if (!topbarButtons) return resolve();
  
      const header_clock = $('div.header-clock');
      header_clock?.remove();
  
      const time = new Date();
  
      const clockContainer = document.createElement('div');
      clockContainer.className = 'header-clock';
  
      const hours = document.createElement('div');
      hours.className = 'clock-digits';
      hours.innerHTML = time.getHours().toString().padStart(2, '0');
      const minutes = document.createElement('div');
      minutes.className = 'clock-digits';
      minutes.innerHTML = time.getMinutes().toString().padStart(2, '0');
  
      const separator1 = document.createElement('span');
      separator1.textContent = ':';
  
      clockContainer.appendChild(hours);
      clockContainer.appendChild(separator1);
      clockContainer.appendChild(minutes);
  
      topbarButtons.insertAdjacentElement('afterbegin', clockContainer);
  
      const updateClock = () => {
        const now = new Date();
        hours.innerHTML = now.getHours().toString().padStart(2, '0');
        minutes.innerHTML = now.getMinutes().toString().padStart(2, '0');
        setTimeout(updateClock, 1000);
      };
  
      updateClock();
      resolve();
    });
  }

  await waitForElement('#logo-icon > span').then(updateHeader);
  await waitForElement('#logo-icon > span > div').then(setupFetchToggle);
  await waitForElement('#end').then(renderClock);
}

async function watch() {
  const currentVideoId = getCurrentVideoId();
  await handleWatchPage(currentVideoId);
}

async function handleWatchPage(currentVideoId) {
  // Log untuk debugging - sekarang hanya dipanggil 1 kali saat halaman video dimuat
  // Sebelumnya dipanggil 2 kali karena ada pemanggilan langsung di akhir file - SUDAH DIHAPUS
  console.log(`📺 handleWatchPage - Dipanggil dari:`, new Error().stack.split('\n')[2]?.trim() || 'unknown');
  
  // Tambahkan fungsi cleanup di awal
  cleanupVideoElements();
  
  lastLoggedViewCount = null;
  fetchData(currentVideoId);
  await waitForElement('video');
  handleVideoElement();
  initializeSponsorSkip();

  /**
   * Catatan tentang optimasi MutationObserver:
   * 
   * 1. Menggunakan head sebagai target observasi untuk perubahan URL
   *    - Lebih efisien daripada mengamati seluruh document
   *    - Perubahan URL biasanya menyebabkan perubahan pada head (title, meta tags)
   * 
   * 2. Menyimpan semua observer dalam array global (window.activeObservers)
   *    - Memungkinkan pembersihan observer saat berpindah halaman
   *    - Mencegah memory leak yang disebabkan oleh observer yang tidak terpakai
   * 
   * 3. Memanggil disconnect() pada semua observer saat cleanup
   *    - Memastikan tidak ada observer yang tetap berjalan di latar belakang
   *    - Mengoptimalkan performa dengan menghapus callback yang tidak diperlukan
   */
  
  console.log(`Fetching new data for [${currentVideoId}]`);
  interceptFetch();
}

async function handleVideoElement() {
  const urlParams = new URLSearchParams(window.location.search);
  const isPlaylist = getIsPlaylist();
  const player = await waitForElement('#movie_player');
  const video = await waitForElement('video');
  let hasPlayedOnce = false;
  resolutionChange();

  video.addEventListener('play', () => {
    if (!hasPlayedOnce) {
      console.log('video is playing');
      hasPlayedOnce = true;
      setHighestResolution();
      if (!isPlaylist) {
        player.setLoop(true);
        player.setLoopVideo(true);
      }
      player.toggleSubtitles();
      audioNode = createAudioNode(video);
    }
  });

  // Tambahkan event listener untuk memperbarui highlight segmen sponsor
  video.addEventListener('loadedmetadata', () => {
    highlightSponsorSegments();
  });

  // Perbarui highlight saat video di-seek
  video.addEventListener('seeking', () => {
    highlightSponsorSegments();
  });
}

function createAudioNode(videoElement) {
  if (audioNode) return;
  
  // Periksa apakah video sudah memiliki audio node
  if (videoElement.getAttribute('data-audio-processed') === 'true') {
    console.log('Video sudah memiliki audio node');
    return;
  }

  const audioContext = new AudioContext();
  const audioStream = audioContext.createMediaElementSource(videoElement);
  
  const nodes = {
    inGain: audioContext.createGain(),
    biquadFilter: audioContext.createBiquadFilter(),
    outGain: audioContext.createGain()
  };

  const equalizer = [
    { frequency: 31, gain: 15 },
    { frequency: 62, gain: 10 },
    { frequency: 125, gain: 5 },
    { frequency: 250, gain: 0 },
    { frequency: 500, gain: -5 },
    { frequency: 1000, gain: -5 },
    { frequency: 2000, gain: 0 },
    { frequency: 4000, gain: 5 },
    { frequency: 8000, gain: 10 },
    { frequency: 16000, gain: 1 }
  ];

  // Konfigurasi filter
  equalizer.forEach(({ frequency, gain }) => {
    nodes.biquadFilter.frequency.value = frequency;
    nodes.biquadFilter.Q.value = 4.0;
    nodes.biquadFilter.gain.value = gain;
  });

  // Konfigurasi gain
  nodes.inGain.gain.value = 0.2;
  nodes.outGain.gain.value = 6.5;

  // Sambungkan node audio
  audioStream
    .connect(nodes.inGain)
    .connect(nodes.biquadFilter)
    .connect(nodes.outGain)
    .connect(audioContext.destination);

  console.log('Bass Boosted!');
  audioNode = nodes;

  // Tambahkan atribut setelah audio node diberikan
  videoElement.setAttribute('data-audio-processed', 'true');
  videoElement.setAttribute('data-audio-gain', nodes.outGain.gain.value);
  videoElement.setAttribute('data-audio-filter', 'biquad');
  
  return true;
}

function initializeSponsorSkip() {
  const video = document.querySelector('video');
  if (!video) return;

  // Fungsi untuk mengambil data segmen dari API SponsorBlock
  async function fetchSponsorSegments(videoId) {
    try {
      cleanupVideoElements();
      
      const response = await fetch(`https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}`);
      const responseText = await response.text();
      
      // Cek apakah response kosong atau tidak valid
      // Ini menangani kasus ketika API mengembalikan response kosong atau tidak valid
      if (!responseText || responseText.trim() === '' || responseText.trim() === '[]') {
        console.log('No segment found');
        sponsorSegments = [];
        return;
      }
      
      const segments = JSON.parse(responseText);
      console.log(`Segmen sponsor: ${segments}`);
      
      // Cek apakah segments adalah array kosong
      // Ini menangani kasus ketika API mengembalikan array kosong
      if (!segments || !Array.isArray(segments) || segments.length === 0) {
        console.log('No segment found');
        sponsorSegments = [];
        return;
      }
      
      sponsorSegments = segments.filter(segment => 
        ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview', 'music_offtopic', 'filler'].includes(segment.category)
      ).map(segment => ({
        start: segment.segment[0],
        end: segment.segment[1],
        type: segment.category,
        videoDuration: segment.videoDuration
      }));
      
      // Cek apakah ada segmen yang valid setelah filtering
      // Ini menangani kasus ketika ada data tapi tidak ada segmen yang sesuai kategori
      if (sponsorSegments.length === 0) {
        console.log('No segment found');
        return;
      }

      // Hitung durasi tanpa segmen
      if (sponsorSegments.length > 0) {
        const totalDuration = sponsorSegments[0].videoDuration;
        const skipDuration = sponsorSegments.reduce((total, segment) => 
          total + (segment.end - segment.start), 0
        );
        const watchableDuration = totalDuration - skipDuration;

        // Format durasi yang bisa ditonton
        const formatTime = (seconds) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = Math.floor(seconds % 60);
          return h > 0 
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
        };

        // Tambahkan informasi durasi sebagai elemen baru
        const timeWrapper = document.querySelector('.ytp-time-duration');
        if (timeWrapper) {
          const timeContainer = timeWrapper.parentElement;
          
          // Hapus elemen watchable yang mungkin sudah ada
          const existingWatchable = timeContainer.querySelector('.ytp-time-watchable-container');
          if (existingWatchable) {
            existingWatchable.remove();
          }

          // Buat container baru untuk durasi yang bisa ditonton
          const watchableContainer = document.createElement('span');
          watchableContainer.className = 'ytp-time-watchable-container';
          watchableContainer.innerHTML = `<span class="ytp-time-watchable">(${formatTime(watchableDuration)})</span>`;
          
          // Sisipkan setelah durasi total
          timeContainer.appendChild(watchableContainer);
        }
      }

      console.log('Segmen sponsor terdeteksi:', sponsorSegments);
      highlightSponsorSegments();
    } catch (error) {
      // Cek apakah error disebabkan oleh tidak ada segmen sponsor
      // Error ini biasanya terjadi ketika API mengembalikan response yang tidak valid JSON
      if (error.message && (
        error.message.includes('JSON.parse: unexpected character') ||
        error.message.includes('Unexpected token') ||
        error.message.includes('SyntaxError')
      )) {
        console.log('No segment found');
      } else {
        console.error('Gagal mengambil data segmen sponsor:', error);
      }
      sponsorSegments = []; // Reset jika gagal
    }
  }

  // Ambil video ID dan fetch segmen sponsor
  async function initializeSegments() {
    const videoId = getCurrentVideoId();
    if (videoId) {
      await fetchSponsorSegments(videoId);
    }
  }

  // Initialize segments saat video dimuat
  initializeSegments();

  // Modifikasi event listener timeupdate
  video.addEventListener('timeupdate', () => {
    const currentTime = video.currentTime;
    
    // Cek apakah sedang dalam segmen sponsor
    const inSegment = sponsorSegments.find(segment => 
      currentTime >= segment.start && currentTime < segment.end
    );

    if (inSegment && inSegment !== currentSponsorSegment) {
      currentSponsorSegment = inSegment;
      
      // Cek setting untuk tipe segmen ini
      if (getIsAutoSkip(inSegment.type)) {
        // Skip otomatis
        video.currentTime = inSegment.end;
        currentSponsorSegment = null;
      } else {
        // Tampilkan tombol skip manual
        showSkipButton(video, inSegment);
      }
    } else if (!inSegment && currentSponsorSegment) {
      currentSponsorSegment = null;
      hideSkipButton();
    }
  });

  // Event listener untuk keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && currentSponsorSegment) {
      skipCurrentSegment(video);
    }
  });

  // Event listener untuk perubahan URL (saat berpindah video)
  let lastUrl = location.href;
  
  // Gunakan head sebagai target observasi untuk perubahan URL
  // karena URL berubah biasanya menyebabkan perubahan pada head (title, meta tags)
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      initializeSegments();
    }
  });
  
  // Amati head untuk perubahan yang mungkin mengindikasikan navigasi halaman
  const observerTarget = document.querySelector('head');
  if (observerTarget) {
    urlObserver.observe(observerTarget, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['content']
    });
  } else {
    // Fallback ke document jika head tidak tersedia
    urlObserver.observe(document, {
      childList: true,
      subtree: true
    });
  }
  
  // Simpan observer ke daftar global untuk dibersihkan nanti
  if (!window.activeObservers) {
    window.activeObservers = [];
  }
  window.activeObservers.push(urlObserver);
}

function showSkipButton(video, segment) {
  if (!skipButton) {
    skipButton = document.createElement('button');
    skipButton.className = 'sponsor-skip-button';
    skipButton.innerHTML = `(Enter) Skip ${getSegmentTypeLabel(segment.type)}`;
    skipButton.onclick = () => skipCurrentSegment(video);
    document.querySelector('.html5-video-player').appendChild(skipButton);
  } else {
    skipButton.innerHTML = `(Enter) Skip ${getSegmentTypeLabel(segment.type)}`;
  }
  skipButton.style.display = 'flex';
}

function hideSkipButton() {
  if (skipButton) {
    skipButton.style.display = 'none';
  }
}

function skipCurrentSegment(video) {
  if (currentSponsorSegment) {
    video.currentTime = currentSponsorSegment.end;
    currentSponsorSegment = null;
    hideSkipButton();
  }
}

async function highlightSponsorSegments() {
  const progressBar = document.querySelector('.ytp-progress-list');
  if (!progressBar || !document.querySelector('video')) return;
  const videoId = getCurrentVideoId();

  // Hapus highlight yang ada
  const existingHighlights = progressBar.querySelectorAll('.sponsor-segment-highlight');
  existingHighlights.forEach(el => el.remove());

  // Tambahkan highlight untuk setiap segmen
  const videoDuration = document.querySelector('video').duration;
  if (!videoDuration) return;

  sponsorSegments.forEach(segment => {
    const highlight = document.createElement('div');
    highlight.className = 'sponsor-segment-highlight';
    highlight.setAttribute('data-segment-type', segment.type);
    highlight.style.left = `${(segment.start / videoDuration) * 100}%`;
    highlight.style.width = `${((segment.end - segment.start) / videoDuration) * 100}%`;
    progressBar.appendChild(highlight);
  });

  // Tambahkan tombol submit di sebelah kiri tombol subtitle
  const rightControls = document.querySelector('.ytp-right-controls');
  if (rightControls && !document.querySelector('.submit-segment-button')) {
    const submitButton = document.createElement('button');
    submitButton.className = 'ytp-button submit-segment-button';
    submitButton.title = 'Submit Sponsor Segment';
    submitButton.innerHTML = `
      <svg height="75%" version="1.1" viewBox="0 0 36 36" width="75%" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <use class="ytp-svg-shadow" xlink:href="#ytp-id-submit-segment"></use>
        <path d="M18,8 L18,28 M8,18 L28,18" stroke="#fff" stroke-width="2.5" fill="none" id="ytp-id-submit-segment"></path>
      </svg>
    `;
    submitButton.setAttribute('data-priority', '4');
    
    submitButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const video = document.querySelector('video');
      if (video) {
        showSubmitSegmentForm(videoId, video.currentTime);
      }
    });

    // Masukkan tombol sebelum tombol subtitle
    const subtitleButton = rightControls.querySelector('.ytp-subtitles-button');
    if (subtitleButton) {
      rightControls.insertBefore(submitButton, subtitleButton);
    } else {
      rightControls.appendChild(submitButton);
    }
  }
}

async function fetchData(videoId, inputType) {
  // Log untuk debugging - sekarang hanya dipanggil 2 kali:
  // 1. handleWatchPage() memanggil fetchData() untuk load awal
  // 2. Tombol refresh memanggil fetchData() dengan inputType='refresh'
  // 3. Pemanggilan langsung handleWatchPage(getCurrentVideoId()) SUDAH DIHAPUS
  console.log(`🔄 fetchData dipanggil untuk videoId: ${videoId}, inputType: ${inputType || 'undefined'}`);
  console.log(`🔄 fetchData - Dipanggil dari:`, new Error().stack.split('\n')[2]?.trim() || 'unknown');
  
  try {
    const response = await fetch(window.location.href); // youtube video url
    const text = await response.text();

    // Gunakan fungsi utility untuk mendapatkan playerResponse
    const playerResponse = getPlayerResponseData(text);
    
    // Gunakan fungsi utility untuk mendapatkan upcoming date text
    const { upcomingDateText, scheduledStartTime } = getUpcomingDateText(playerResponse) || {};

    // Gunakan fungsi utility untuk mendapatkan ytInitialData
    const ytInitialData = getYtInitialData(text);
    console.log(`🔄 ytInitialData: `, ytInitialData);
    
    if (ytInitialData) {
      // Gunakan fungsi utility untuk mendapatkan video info
      const videoInfo = getVideoInfoFromData(ytInitialData);
      
      if (videoInfo) {
        const { viewCount, isLive, isUpcoming, channelTitle, targetData } = videoInfo;
        
        // Gunakan upcomingDateText jika tersedia untuk video mendatang
        const dateText = isUpcoming && upcomingDateText ? upcomingDateText : 
                        isUpcoming ? (targetData.dateText?.simpleText || 'Tayang dalam waktu dekat') :
                        isLive ? (targetData.dateText?.simpleText || 'Streaming dimulai baru saja') : 
                        (targetData.relativeDateText?.simpleText || targetData.dateText?.simpleText || 'Dipublikasikan baru saja');

        const data = {
          items: [{
            snippet: {
              liveBroadcastContent: isUpcoming ? 'upcoming' : (isLive ? 'live' : 'none'),
              channelTitle: channelTitle,
              publishedAt: dateText
            },
            statistics: isLive || isUpcoming ? {} : { viewCount },
            liveStreamingDetails: isLive || isUpcoming ? { 
              concurrentViewers: viewCount, 
              actualStartTime: dateText,
              isUpcoming: isUpcoming,
              scheduledStartTime: scheduledStartTime
            } : {}
          }],
          timestamp: new Date().getTime()
        };

        console.log(`Data fetched for [${videoId}]`);
        latestFetchedData = data;
        
        // Start countdown if it's an upcoming stream
        if (isUpcoming && scheduledStartTime) {
          startCountdown(scheduledStartTime);
        }
        
        // Terapkan resume playback dengan ytInitialData
        await applyResumePlayback(ytInitialData);
        
        displayData(data, videoId, inputType);
      } else {
        console.warn('⚠️ Video info tidak dapat diambil dari ytInitialData');
        throw new Error('Video info not found');
      }
    } else {
      console.warn('⚠️ ytInitialData tidak ditemukan dalam response');
      throw new Error('ytInitialData not found');
    }
  } catch (error) {
    console.error(`There has been an error when fetching [${videoId}]:`, error);
  }
}

async function displayData(data, videoId, inputType) {
  if (data && data.items && data.items.length > 0) {
    latestFetchedData = data;
    const isLive = data.items[0].snippet.liveBroadcastContent === 'live';
    const isUpcoming = data.items[0].snippet.liveBroadcastContent === 'upcoming';
    let viewCountValue = isLive || isUpcoming ? data.items[0].liveStreamingDetails.concurrentViewers : data.items[0].statistics.viewCount;
    let dateText = data.items[0].snippet.publishedAt;
    dateText = getFormattedRelativeDate(dateText);
    
    if (lastLoggedViewCount !== viewCountValue) {
      console.log(`Views for [${videoId}]: ${viewCountValue}, ${dateText}`);
      lastLoggedViewCount = viewCountValue;
    }
  
    const compressedData = {
      viewCount: viewCountValue,
      date: dateText,
      channelTitle: data.items[0].snippet.channelTitle,
      isLive: isLive,
      isUpcoming: isUpcoming,
      videoId: videoId,
    };
  
    if (inputType === undefined) {
      await addVideoIdAndViews(compressedData);
    } else if (inputType === 'refresh') {
      updateViewDisplay(viewCountValue, isLive, isUpcoming, dateText);
      console.log(`Refreshed views for [${videoId}]`);
    }
  } else {
    console.error(`Invalid data structure in displayData for [${videoId}]`);
  }
}

async function addVideoIdAndViews(compressedData) {
  const { viewCount, date, channelTitle, isLive, isUpcoming, videoId } = compressedData;
  try {
    await new Promise((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve);
    });

    // Tunggu elemen yang muncul terlebih dahulu
    const firstElement = await Promise.race([
      waitForElement('#above-the-fold > #top-row').then(el => ({ element: el, type: 'topRow' })),
      waitForElement('#title > h1').then(el => ({ element: el, type: 'title' }))
    ]);

    // Hapus elemen lama jika ada
    if ($('.view-count-info')) $('.view-count-info').remove();
    if ($('.channelBy2')) $('.channelBy2').remove();
    if ($('.ytp-view-big-mode')) $('.ytp-view-big-mode').remove();

    const formattedViewCount = getFormattedViewCount(viewCount, isLive, isUpcoming);
    const viewCountElement = document.createElement('div');
    viewCountElement.className = 'style-scope view-count-info';
    viewCountElement.innerHTML = `
    <h1 class="style-scope ytd-view-renderer">
      <span class="odometer" data-value="${viewCount}" data-live="${isLive}"></span>
      <span class="odometer-suffix">${formattedViewCount.substring(formattedViewCount.indexOf(' '))}</span>
      <strong class="separator"> • </strong><span id="date_text" class="style-scope ytd-watch-metadata">${date}</span>
    </h1>
    <button id="refresh-view-count" class="style-scope refresh-vc" alt="Refresh viewCount" title="Refresh Viewcount">
      <svg xmlns="http://www.w3.org/2000/svg" width="1.7em" height="1.7em" viewBox="0 0 24 24">
        <path fill="white" d="M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z"></path>
      </svg>
    </button>`;

    // Tempatkan view-count-info berdasarkan elemen yang muncul terlebih dahulu
    if (firstElement.type === 'topRow') {
      firstElement.element.insertAdjacentElement('beforebegin', viewCountElement);
    } else {
      firstElement.element.insertAdjacentElement('afterend', viewCountElement);
    }

    new Odometer({
      el: viewCountElement.querySelector('.odometer'),
      value: parseInt(viewCountElement.querySelector('.odometer').getAttribute('data-value')),
      theme: 'minimal',
      locale: 'id'
    });

    $('#refresh-view-count').addEventListener('click', () => {
      const inputType = 'refresh';
      fetchData(videoId, inputType);
    });

    const videoTitleElement = await waitForElement('div.ytp-title>div');
    if (videoTitleElement) {
      const videoIdSpan = document.createElement('strong');
      videoIdSpan.className = 'channelBy2';
      videoIdSpan.textContent = `- ${channelTitle}`;
      videoTitleElement.appendChild(videoIdSpan);

      const topButtonsContainer = await waitForElement('#movie_player > div.ytp-chrome-top > div.ytp-chrome-top-buttons');
      if (topButtonsContainer) {
        const odometerElement = document.createElement('div');
        odometerElement.className = 'ytp-view-big-mode';
        odometerElement.setAttribute('aria-haspopup', 'true');
        odometerElement.setAttribute('data-tooltip-opaque', 'true');
        odometerElement.innerHTML = `
          <div class="odometer" data-value="${viewCount}" data-live="${isLive}"></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="2em" height="2em" viewBox="0 0 24 24"><path fill="white" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4"/></svg>
        `;
        topButtonsContainer.insertAdjacentElement('beforebegin', odometerElement);

        new Odometer({
          el: odometerElement.querySelector('.odometer'),
          value: parseInt(odometerElement.querySelector('.odometer').getAttribute('data-value')),
          theme: 'minimal',
          locale: 'id'
        });
      }
    }
    console.log(`Video ID and views for [${videoId}] added!`);
  } catch (error) {
    console.error(`Error in addVideoIdAndViews for [${videoId}]:`, error);
  }
}

function updateViewDisplay(viewCountValue, isLive, isUpcoming, dateText) {
  const viewElement = $('h1.ytd-view-renderer .odometer');
  const suffixElement = $('h1.ytd-view-renderer .odometer-suffix');
  const dateTextElement = $('#date_text');
  const viewElementBigMode = $('#movie_player > div.ytp-chrome-top > div.ytp-view-big-mode .odometer');
  
  if (viewElement) {
    viewElement.odometer.update(viewCountValue);
    viewElement.setAttribute('data-value', viewCountValue);
  
    if (suffixElement) {
      const formattedViewCount = getFormattedViewCount(viewCountValue, isLive, isUpcoming);
      suffixElement.textContent = formattedViewCount.substring(formattedViewCount.indexOf(' '));
    }
  
    if (dateTextElement) {
      dateTextElement.textContent = dateText;
    }
  }
  
  if (viewElementBigMode) {
    viewElementBigMode.odometer.update(viewCountValue);
    viewElementBigMode.setAttribute('data-value', viewCountValue);
  }
}

async function resolutionChange() {
  await waitForElement('.ytp-quality-menu .ytp-menuitem');
  $$('.ytp-quality-menu .ytp-menuitem').forEach((el) => {
    el.addEventListener('click', () => {
        let qualityText = el.querySelector('div > div > span').textContent;
        let cleanedQuality = qualityText.match(/\d+p/)?.[0] || qualityText;

        const qualityLabels = {
          '4320p (8K)': 'highres',
          '2880p (5K)': 'hd2880',
          '2160p (4K)': 'hd2160',
          '1440p': 'hd1440',
          '1080p': 'hd1080',
          '720p': 'hd720',
          '480p': 'large',
          '360p': 'medium',
          '240p': 'small',
          '144p': 'tiny'
        };

        const qualityKey = qualityLabels[cleanedQuality];
        localStorage.setItem('resolution', qualityKey);
        console.log(`Quality set to ${qualityKey}`);
    });
  });
}

const setHighestResolution = async() => {
  const player = $('#movie_player');
  if (!player) return requestAnimationFrame(setHighestResolution);
  await new Promise((resolve) => setTimeout(resolve, 200));

  const targetQuality = localStorage.getItem('resolution');
  const qualities = player.getAvailableQualityLevels();
  const quality = qualities.includes(targetQuality) ? targetQuality : qualities[0];
  player.setPlaybackQualityRange(quality);
  player.setPlaybackQuality(quality);

  console.log(`Quality set to ${quality}`);
};

function getFormattedViewCount(viewCount, isLive, isUpcoming) {
  const units = [
    { threshold: 1e12, suffix: ' B' },
    { threshold: 1e9, suffix: ' M' },
    { threshold: 1e6, suffix: ' jt' },
    { threshold: 1e3, suffix: ' rb' }
  ];

  const formatNumber = (num) => {
    const count = Math.floor((num * 10)) / 10;
    return count.toString().replace('.', ',').replace(/,0$/, '');
  };

  viewCount = parseInt(viewCount, 10);
  let displayViewCount = viewCount.toLocaleString('en-US');

  // Cari unit yang sesuai
  const unit = units.find(({ threshold }) => viewCount >= threshold);
  if (unit) {
    const count = formatNumber(viewCount / unit.threshold);
    displayViewCount += ` (${count}${unit.suffix})`;
  }

  // Tambahkan suffix berdasarkan status
  displayViewCount += isUpcoming ? ' menunggu' : (isLive ? ' sedang menonton' : ' x ditonton');
  return displayViewCount;
}

function getFormattedCountdown(scheduledTime) {
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = scheduledTime - now;
  
  if (timeLeft <= 0) return 'Streaming akan dimulai sebentar lagi';
  
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  
  let countdown = 'Live dalam ';
  if (hours > 0) {
    countdown += `${hours} jam `;
  }
  if (minutes > 0 || hours > 0) {
    countdown += `${minutes} menit `;
  }
  countdown += `${seconds} detik`;
  
  return countdown;
}

function startCountdown(scheduledTime) {
  // Clear existing interval if any
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  
  // Start new countdown
  countdownInterval = setInterval(() => {
    const countdownText = getFormattedCountdown(parseInt(scheduledTime));
    updateViewDisplay(lastLoggedViewCount, false, true, countdownText);
  }, 1000);
  
  // Cleanup interval when navigating away
  return () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  };
}

function handleUpdatedMetadataRequest(url, payload, isInitial = false) {
  if (isInitial) {
    if (url.includes('https://www.youtube.com/watch?v=')) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(payload, 'text/html');
        const viewCountElement = doc.querySelector('span.view-count');
        const isLive = !!doc.querySelector('span.live-indicator');
        
        const viewCountText = viewCountElement?.textContent || '';
        const viewCountMatch = viewCountText.match(/([\d,.]+)\s*(sedang menonton|x ditonton)/);
        const viewCount = viewCountMatch ? viewCountMatch[1].replace(/[,.]/g, '') : null;
        const dateText = doc.querySelector('span.date')?.textContent || (isLive ? 'Streaming dimulai baru saja' : 'Dipublikasikan baru saja');
        
        lastDateText = dateText;

        const fetchedData = {
          items: [{
            snippet: {
              liveBroadcastContent: isLive ? 'live' : 'none',
              channelTitle: doc.querySelector('ytd-channel-name')?.textContent || '',
              publishedAt: isLive ? null : dateText
            },
            statistics: isLive ? {} : { viewCount },
            liveStreamingDetails: isLive ? { concurrentViewers: viewCount, actualStartTime: dateText } : {}
          }],
          timestamp: new Date().getTime()
        };
        latestFetchedData = fetchedData;

        return {
          viewership: {
            displayText: viewCount ? getFormattedViewCount(viewCount, isLive, false) : null,
            rawCount: viewCount
          },
          dateText,
          isLive
        };
      } catch (e) {
        console.error('❌ Failed to parse initial watch page:', e.message);
        return null;
      }
    }
    return null;
  }

  if (url.includes('https://www.youtube.com/youtubei/v1/updated_metadata')) {
    try {
      const json = typeof payload === 'string' ? JSON.parse(payload) : payload;

      if (!json.actions || !Array.isArray(json.actions)) return null;

      let result = {
        viewership: null,
        dateText: null,
        isLive: false
      };

      json.actions.forEach(action => {
        if (action.updateViewershipAction) {
          const v = action.updateViewershipAction.viewCount?.videoViewCountRenderer;
          result.isLive = !!v?.isLive;
          if (v) {
            const mainText = v?.viewCount?.simpleText || null;
            const shortText = v?.extraShortViewCount?.simpleText || null;
            const viewCount = mainText ? mainText.split(' ')[0].replace(/[,.]/g, '') : null;
            result.viewership = {
              raw: action.updateViewershipAction,
              displayText: viewCount ? getFormattedViewCount(viewCount, result.isLive, false) : null,
              rawCount: viewCount
            };
          }
        }
        if (action.updateDateTextAction) {
          const newDateText = action.updateDateTextAction.dateText?.simpleText;
          if (newDateText) {
            result.dateText = newDateText;
            lastDateText = newDateText;
          }
        }
      });

      if (result.viewership) {
        const fetchedData = {
          items: [{
            snippet: {
              liveBroadcastContent: result.isLive ? 'live' : 'none',
              channelTitle: latestFetchedData?.items[0]?.snippet.channelTitle || '',
              publishedAt: result.isLive ? null : (result.dateText || lastDateText)
            },
            statistics: result.isLive ? {} : { viewCount: result.viewership.rawCount },
            liveStreamingDetails: result.isLive ? { concurrentViewers: result.viewership.rawCount, actualStartTime: result.dateText || lastDateText } : {}
          }],
          timestamp: new Date().getTime()
        };
        latestFetchedData = fetchedData;
      }

      if (!result.dateText) {
        result.dateText = lastDateText;
      }

      return result.viewership ? result : null;
    } catch (e) {
      console.error('❌ Failed to parse updated_metadata subclause:', e.message);
      return null;
    }
  }
  return null;
}

function interceptFetch() {
  const originalFetch = window.fetch;

  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    const response = await originalFetch(input, init);

    try {
      if (url.includes('https://www.youtube.com/watch?v=')) {
        const cloned = response.clone();
        const text = await cloned.text();
        const result = handleUpdatedMetadataRequest(url, text, true);
        if (result && result.viewership?.rawCount) {
          if (lastLoggedViewCount !== result.viewership.rawCount) {
            console.log('📊 Initial Video Data:', {
              ...(result.viewership?.displayText && { viewerCount: result.viewership.displayText }),
              ...(result.dateText && { startedAt: result.dateText }),
              isLive: result.isLive
            });
            lastLoggedViewCount = result.viewership.rawCount;
          }
          updateViewDisplay(result.viewership.rawCount, result.isLive, false, result.dateText);
        }
      }

      if (url.includes('/youtubei/v1/updated_metadata')) {
        const cloned = response.clone();
        const json = await cloned.json();
        const result = handleUpdatedMetadataRequest(url, json);
        if (result && result.viewership?.rawCount) {
          if (lastLoggedViewCount !== result.viewership.rawCount) {
            console.log('📊 Video Data Update:', {
              ...(result.viewership?.displayText && { viewerCount: result.viewership.displayText }),
              ...(result.dateText && { startedAt: result.dateText }),
              isLive: result.isLive
            });
            lastLoggedViewCount = result.viewership.rawCount;
          }
          updateViewDisplay(result.viewership.rawCount, result.isLive, false, result.dateText);
        }
      }
    } catch (e) {
      console.error('❌ Error in fetch intercept:', e.message);
    }

    return response;
  };
}

// Fungsi untuk mengecek apakah video adalah live stream
function getIsLiveVideo(ytInitialData) {
  try {
    const targetData = ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer;
    if (targetData) {
      const viewCountRenderer = targetData.viewCount?.videoViewCountRenderer;
      const isLive = viewCountRenderer?.isLive || false;
      const viewCountRuns = viewCountRenderer?.viewCount?.runs || [];
      const isUpcoming = viewCountRuns.length > 1 && viewCountRuns[1]?.text?.includes('menunggu');
      
      return isLive || isUpcoming;
    }
  } catch (error) {
    console.error('Error checking live video status:', error);
  }
  return false;
}

// Fungsi untuk menerapkan resume playback dengan pengecualian live video
async function applyResumePlayback(ytInitialData) {
  if (location.pathname === "/watch") {
    const videoId = getCurrentVideoId();
    
    // Cek apakah video adalah live stream
    if (getIsLiveVideo(ytInitialData)) {
      console.log(`🎥 Video ${videoId} adalah live stream, skip resume playback`);
      shouldAddEventListenerTimeUpdate = false;
      return;
    }
    
    // Set true untuk video non-live
    shouldAddEventListenerTimeUpdate = true;
    
    const savedTime = getSavedTime(videoId);
    
    if (savedTime) {
      const videoElement = await waitForElement('video');
      const player = await waitForElement('#movie_player');
      
      // Hapus event listener lama jika ada
      if (videoElement._resumeHandler) {
        videoElement.removeEventListener('loadedmetadata', videoElement._resumeHandler);
      }
      
      // Buat handler baru
      videoElement._resumeHandler = () => {
        // Cek apakah video sudah di-resume untuk mencegah multiple resume
        if (videoElement.getAttribute('data-resumed') === videoId) {
          return;
        }
        
        let timeToSeek = parseFloat(savedTime);
        const duration = videoElement.duration;
        
        if (!isNaN(timeToSeek)) {
          timeToSeek = Math.max(0, timeToSeek - 2);
          
          if (timeToSeek < duration - 5) {
            player.seekTo(timeToSeek, true);
            const formattedTime = getFormattedTime(timeToSeek);
            console.log(`🎬 Resuming playback at ${formattedTime} (original: ${getFormattedTime(parseFloat(savedTime))})`);
            // Tandai bahwa video ini sudah di-resume
            videoElement.setAttribute('data-resumed', videoId);
          } else {
            console.log('📺 Saved position too close to end, starting from beginning');
          }
        }
      };
      
      // Tambahkan event listener baru
      videoElement.addEventListener('loadedmetadata', videoElement._resumeHandler);
    }
  }
}

// Fungsi untuk menyimpan playback position dengan pengecualian live video
async function savePlaybackPosition(ytInitialData) {
  if (!shouldAddEventListenerTimeUpdate) return;
  try {
    if (location.pathname === "/watch") {
      const videoId = getCurrentVideoId();
      
      // Cek apakah video adalah live stream
      if (getIsLiveVideo(ytInitialData)) {
        console.log(`🎥 Video ${videoId} adalah live stream, skip save playback position`);
        return;
      }
      
      const videoElement = await waitForElement('video');
      
      if (videoElement && !isNaN(videoElement.currentTime)) {
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;
        
        if (currentTime > 5 && currentTime < duration - 5) {
          localStorage.setItem(`yt_time_${videoId}`, currentTime.toString());
          const formattedTime = getFormattedTime(currentTime);
          console.log(`💾 Saved playback position (${formattedTime}) for video ${videoId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error saving video time:', error);
  }
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const pad = (num) => num.toString().padStart(2, '0');
  
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function getFormattedTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const pad = (num) => num.toString().padStart(2, '0');
  
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

async function initYouTubeScript() {
  await main();
  if (location.pathname === "/watch") {
    await watch();
  }

  waitForUrlChange().then(() => {
    console.log("URL berubah, menjalankan ulang skrip...");
    // Tambahkan cleanup saat URL berubah
    cleanupVideoElements();
    initYouTubeScript();
  });
}

function handlePageUnload() {
  function resetGlobalVariables() {
    audioNode = null;
    lastLoggedViewCount = null;
    console.log('Global variables reset');
  }

  async function saveCurrentVideoTime() {
    try {
      if (!shouldAddEventListenerTimeUpdate) return;
      if (location.pathname === "/watch") {
        const videoId = getCurrentVideoId();
        const videoElement = await waitForElement('video');
        
        if (videoElement && !isNaN(videoElement.currentTime)) {
          const currentTime = videoElement.currentTime;
          const duration = videoElement.duration;
          
          if (currentTime > 5 && currentTime < duration - 5) {
            localStorage.setItem(`yt_time_${videoId}`, currentTime.toString());
            const formattedTime = getFormattedTime(currentTime);
            console.log(`Saved playback position (${formattedTime}) for video ${videoId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error saving video time:', error);
    }
  }

  resetGlobalVariables();
  saveCurrentVideoTime();

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

window.addEventListener('beforeunload', handlePageUnload);

// Tambahkan fungsi cleanup
function cleanupVideoElements() {
  // Reset sponsor segments
  sponsorSegments = [];
  currentSponsorSegment = null;
  
  // Hapus skip button jika ada
  if (skipButton) {
    skipButton.remove();
    skipButton = null;
  }
  
  // Hapus highlight segments
  const existingHighlights = document.querySelectorAll('.sponsor-segment-highlight');
  existingHighlights.forEach(el => el.remove());
  
  // Hapus watchable time container
  const existingWatchable = document.querySelector('.ytp-time-watchable-container');
  if (existingWatchable) {
    existingWatchable.remove();
  }

  // Disconnect semua observer yang mungkin masih aktif
  if (window.activeObservers && Array.isArray(window.activeObservers)) {
    window.activeObservers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    window.activeObservers = [];
  }
}

function getRelativeDateText(dateString) {
  // Daftar bulan dalam bahasa Indonesia
  const bulan = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5,
    'Jul': 6, 'Agu': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11
  };

  // Cek dan parse format "1 Jun 2025"
  const match = dateString.match(/^(\d{1,2}) (\w{3,}) (\d{4})$/);
  if (match) {
    const [_, tgl, bln, thn] = match;
    const bulanIndex = bulan[bln];
    if (bulanIndex === undefined) return dateString; // fallback jika bulan tidak dikenali

    const tanggal = new Date(thn, bulanIndex, tgl);
    const sekarang = new Date();

    // Hitung selisih dalam milidetik
    const selisihMs = sekarang - tanggal;
    const selisihJam = selisihMs / (1000 * 60 * 60);

    if (selisihJam > 23) {
      const selisihHari = Math.floor(selisihJam / 24);
      return `${selisihHari} hari yang lalu`;
    }
  }
  // Jika tidak cocok format, kembalikan aslinya
  return dateString;
}

// Fungsi untuk format waktu ke hh:mm:ss
function formatTimeToHHMMSS(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

// Fungsi untuk parse waktu dari hh:mm:ss ke detik
function parseTimeToSeconds(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

// Generate random userID
function generateUserID() {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 30; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Get stored userID or generate new one
function getOrCreateUserID() {
  const storageKey = 'sponsorblock_userid';
  let userID = localStorage.getItem(storageKey);
  
  if (!userID) {
    userID = generateUserID();
    localStorage.setItem(storageKey, userID);
  }
  
  return userID;
}

async function submitSponsorSegment(videoId, segmentData) {
  try {
    const video = getVideoElement();
    const videoDuration = getVideoDuration();

    const requestBody = {
      videoID: videoId,
      userID: getOrCreateUserID(),
      userAgent: 'YouTube-Fixed-Extension/1.0.0',
      service: 'YouTube',
      videoDuration: videoDuration,
      segments: [{
        segment: [segmentData.startTime, segmentData.endTime],
        category: segmentData.category,
        actionType: 'skip',
        description: segmentData.description || ''
      }]
    };

    const response = await fetch('https://sponsor.ajay.app/api/skipSegments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error submitting segment:', error);
    throw error;
  }
}

function showSubmitSegmentForm(videoId, currentTime) {
  const popup = document.createElement('div');
  popup.className = 'submit-segment-popup';
  popup.innerHTML = `
    <div class="submit-segment-popup-content">
      <h3>Submit Sponsor Segment</h3>
      <div class="submit-segment-form">
        <div class="form-group">
          <label>Category:</label>
          <select id="segment-category">
            <option value="sponsor">Sponsor</option>
            <option value="selfpromo">Self Promotion</option>
            <option value="interaction">Interaction Reminder</option>
            <option value="intro">Intro</option>
            <option value="outro">Outro</option>
            <option value="preview">Preview</option>
            <option value="music_offtopic">Music/Offtopic</option>
            <option value="filler">Filler</option>
          </select>
        </div>
        <div class="form-group">
          <label>Description (optional):</label>
          <input type="text" id="segment-description" placeholder="Describe the segment...">
        </div>
        <div class="form-group">
          <label>Time Range:</label>
          <div class="time-range-inputs">
            <div class="time-input-group">
              <label>Start Time:</label>
              <input type="text" id="segment-start-time" 
                value="${getTimeStringFromSeconds(currentTime)}" 
                placeholder="HH:MM:SS"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$">
            </div>
            <div class="time-input-group">
              <label>End Time:</label>
              <input type="text" id="segment-end-time" 
                value="${getTimeStringFromSeconds(currentTime)}" 
                placeholder="HH:MM:SS"
                pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$">
            </div>
          </div>
        </div>
        <div class="submit-segment-buttons">
        <button id="cancel-submit-segment" class="cancel-btn">Cancel</button>
        <button id="submit-segment-btn" class="submit-btn">Submit</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // Fungsi untuk menutup popup
  const closePopup = () => {
    popup.remove();
    // Hapus event listener saat popup ditutup
    document.removeEventListener('keydown', handleEscapeKey);
    popup.removeEventListener('click', handleOutsideClick);
  };

  // Handler untuk klik di luar popup
  const handleOutsideClick = (e) => {
    if (e.target === popup) {
      closePopup();
    }
  };

  // Handler untuk tombol Escape
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      closePopup();
    }
  };

  // Tambahkan event listeners
  popup.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleEscapeKey);

  // Validasi input waktu
  const validateTimeInput = (input) => {
    if (!getIsValidTimeFormat(input.value)) {
      input.setCustomValidity('Format waktu harus HH:MM:SS');
      return false;
    }
    input.setCustomValidity('');
    return true;
  };

  const startTimeInput = document.getElementById('segment-start-time');
  const endTimeInput = document.getElementById('segment-end-time');

  startTimeInput.addEventListener('input', () => validateTimeInput(startTimeInput));
  endTimeInput.addEventListener('input', () => validateTimeInput(endTimeInput));

  // Event listeners
  document.getElementById('submit-segment-btn').addEventListener('click', async () => {
    const category = document.getElementById('segment-category').value;
    const description = document.getElementById('segment-description').value;
    
    if (!validateTimeInput(startTimeInput) || !validateTimeInput(endTimeInput)) {
      showNotification('Format waktu tidak valid', 'error');
      return;
    }

    const startTime = getSecondsFromTime(startTimeInput.value);
    const endTime = getSecondsFromTime(endTimeInput.value);

    if (startTime >= endTime) {
      showNotification('Waktu mulai harus lebih kecil dari waktu selesai', 'error');
      return;
    }

    if (!getIsValidSegmentData({
      startTime,
      endTime,
      category,
      description
    })) {
      showNotification('Data segment tidak valid', 'error');
      return;
    }

    try {
      await submitSponsorSegment(videoId, {
        startTime,
        endTime,
        category,
        description
      });
      
      showNotification('Segment berhasil disubmit!', 'success');
      popup.remove();
    } catch (error) {
      showNotification('Gagal submit segment: ' + error.message, 'error');
    }
  });

  document.getElementById('cancel-submit-segment').addEventListener('click', () => {
    closePopup();
  });
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
  // Validasi notification type
  if (!getIsValidNotificationType(type)) {
    type = 'info';
  }
  
  const notification = document.createElement('div');
  notification.className = `segment-notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getFormattedRelativeDate(dateString) {
  // Daftar bulan dalam bahasa Indonesia
  const bulan = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5,
    'Jul': 6, 'Agu': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11
  };

  // Cek dan parse format "1 Jun 2025"
  const match = dateString.match(/^(\d{1,2}) (\w{3,}) (\d{4})$/);
  if (match) {
    const [_, tgl, bln, thn] = match;
    const bulanIndex = bulan[bln];
    if (bulanIndex === undefined) return dateString; // fallback jika bulan tidak dikenali

    const tanggal = new Date(thn, bulanIndex, tgl);
    const sekarang = new Date();

    // Hitung selisih dalam milidetik
    const selisihMs = sekarang - tanggal;
    const selisihJam = selisihMs / (1000 * 60 * 60);

    if (selisihJam > 23) {
      const selisihHari = Math.floor(selisihJam / 24);
      return `${selisihHari} hari yang lalu`;
    }
  }
  // Jika tidak cocok format, kembalikan aslinya
  return dateString;
}

// Fungsi untuk mendapatkan data dari playerResponseMatch dengan fallback
function getPlayerResponseData(text) {
  try {
    // Coba pattern pertama tanpa /var
    let playerResponseMatch = text.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    
    // Jika null, coba pattern dengan /var
    if (!playerResponseMatch) {
      playerResponseMatch = text.match(/var\s+ytInitialPlayerResponse\s*=\s*({.+?});/);
    }
    
    // Jika masih null, coba pattern yang lebih longgar
    if (!playerResponseMatch) {
      playerResponseMatch = text.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]*?});/);
    }
    
    if (playerResponseMatch && playerResponseMatch[1]) {
      const playerResponse = JSON.parse(playerResponseMatch[1]);
      return playerResponse;
    }
    
    console.warn('getPlayerResponseData - Tidak dapat menemukan ytInitialPlayerResponse');
    return null;
  } catch (error) {
    console.error('getPlayerResponseData - Error parsing playerResponse:', error);
    return null;
  }
}

// Fungsi untuk mendapatkan data dari ytInitialDataMatch dengan fallback
function getYtInitialData(text) {
  try {
    // Coba pattern pertama tanpa /var
    let ytInitialDataMatch = text.match(/ytInitialData = ({.*?});<\/script>/s);
    
    // Jika null, coba pattern dengan /var
    if (!ytInitialDataMatch) {
      ytInitialDataMatch = text.match(/var\s+ytInitialData = ({.*?});<\/script>/s);
    }
    
    // Jika masih null, coba pattern yang lebih longgar
    if (!ytInitialDataMatch) {
      ytInitialDataMatch = text.match(/ytInitialData\s*=\s*({[\s\S]*?});/);
    }
    
    // Jika masih null, coba pattern tanpa </script>
    if (!ytInitialDataMatch) {
      ytInitialDataMatch = text.match(/ytInitialData\s*=\s*({[\s\S]*?});/);
    }
    
    if (ytInitialDataMatch && ytInitialDataMatch[1]) {
      const ytInitialData = JSON.parse(ytInitialDataMatch[1]);
      return ytInitialData;
    }
    
    console.warn('getYtInitialData - Tidak dapat menemukan ytInitialData');
    return null;
  } catch (error) {
    console.error('getYtInitialData - Error parsing ytInitialData:', error);
    return null;
  }
}

// Fungsi untuk mendapatkan upcoming date text dari playerResponse
function getUpcomingDateText(playerResponse) {
  try {
    if (!playerResponse) return null;
    
    let upcomingDateText = null;
    let scheduledStartTime = null;
    
    // Cek apakah video mendatang dan ambil mainText
    if (playerResponse.playabilityStatus?.status === 'LIVE_STREAM_OFFLINE' && 
        playerResponse.playabilityStatus?.liveStreamability?.liveStreamabilityRenderer?.offlineSlate?.liveStreamOfflineSlateRenderer) {
      const slateRenderer = playerResponse.playabilityStatus.liveStreamability.liveStreamabilityRenderer.offlineSlate.liveStreamOfflineSlateRenderer;
      scheduledStartTime = slateRenderer.scheduledStartTime;
      
      if (scheduledStartTime) {
        upcomingDateText = getFormattedCountdown(parseInt(scheduledStartTime));
      } else {
        const mainTextRuns = slateRenderer.mainText?.runs || [];
        if (mainTextRuns.length > 0) {
          upcomingDateText = mainTextRuns.map(run => run.text).join('');
        }
      }
    }
    
    return { upcomingDateText, scheduledStartTime };
  } catch (error) {
    console.error('getUpcomingDateText - Error:', error);
    return { upcomingDateText: null, scheduledStartTime: null };
  }
}

// Fungsi untuk mendapatkan video info dari ytInitialData
function getVideoInfoFromData(ytInitialData) {
  try {
    // Call displayTitleWithMentions at the start
    displayTitleWithMentions(ytInitialData);
    
    if (!ytInitialData) return null;
    
    console.log('getVideoInfoFromData - Dipanggil dari:', new Error().stack.split('\n')[2]?.trim() || 'unknown');
    
    // Try different paths to find video info
    let targetData = null;
    
    // Path 1: Standard path
    targetData = ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer;
    
    // Path 2: Alternative path for some layouts
    if (!targetData) {
      targetData = ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find(
        content => content.videoPrimaryInfoRenderer
      )?.videoPrimaryInfoRenderer;
    }
    
    // Path 3: New layout path
    if (!targetData) {
      targetData = ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find(
        content => content.videoSecondaryInfoRenderer
      )?.videoSecondaryInfoRenderer?.metadataRowContainer?.metadataRowContainerRenderer?.rows?.[0]?.metadataRowRenderer;
    }
    
    if (!targetData) {
      console.warn('getVideoInfoFromData - Target data tidak ditemukan di semua path yang dicoba');
      return null;
    }
    
    console.log('getVideoInfoFromData - Target data ditemukan');
    
    // Get view count and status
    const viewCountRenderer = targetData.viewCount?.videoViewCountRenderer;
    const viewCountRuns = viewCountRenderer?.viewCount?.runs || [];
    const isLive = viewCountRenderer?.isLive || false;
    const isUpcoming = viewCountRuns.length > 1 && viewCountRuns[1]?.text?.includes('menunggu');
    
    // Enhanced view count extraction
    let viewCount = '0';
    
    // Try multiple paths to get view count
    if (viewCountRenderer?.originalViewCount && viewCountRenderer.originalViewCount !== '0') {
      viewCount = viewCountRenderer.originalViewCount;
    } 
    else if (viewCountRenderer?.viewCount?.simpleText) {
      const matches = viewCountRenderer.viewCount.simpleText.match(/^([\d.,]+)/);
      if (matches) {
        viewCount = matches[1].replace(/[.,]/g, '');
      }
    }
    else if (viewCountRuns.length > 0 && viewCountRuns[0]?.text) {
      const matches = viewCountRuns[0].text.match(/^([\d.,]+)/);
      if (matches) {
        viewCount = matches[1].replace(/[.,]/g, '');
      }
    }
    else if (targetData.viewCount?.simpleText) {
      const matches = targetData.viewCount.simpleText.match(/^([\d.,]+)/);
      if (matches) {
        viewCount = matches[1].replace(/[.,]/g, '');
      }
    }
    
    // Get channel title from multiple possible paths
    let channelTitle = '';
    
    // Path 1: Standard path
    channelTitle = ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[1]?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text;
    
    // Path 2: Alternative path
    if (!channelTitle) {
      channelTitle = ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find(
        content => content.videoSecondaryInfoRenderer
      )?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text;
    }
    
    // Path 3: New layout path
    if (!channelTitle) {
      channelTitle = ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find(
        content => content.videoSecondaryInfoRenderer
      )?.videoSecondaryInfoRenderer?.metadataRowContainer?.metadataRowContainerRenderer?.rows?.find(
        row => row.metadataRowRenderer?.title?.simpleText === 'Channel'
      )?.metadataRowRenderer?.contents?.[0]?.runs?.[0]?.text;
    }
    
    return {
      viewCount,
      isLive,
      isUpcoming,
      channelTitle: channelTitle || '',
      targetData
    };
  } catch (error) {
    console.error('getVideoInfoFromData - Error:', error);
    return null;
  }
}

// Fungsi untuk mendapatkan data dengan multiple patterns
function getDataWithMultiplePatterns(text, patterns, dataName) {
  try {
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = text.match(pattern);
      
      if (match && match[1]) {
        console.log(`getDataWithMultiplePatterns - ${dataName} found with pattern ${i + 1}`);
        try {
          const parsedData = JSON.parse(match[1]);
          return parsedData;
        } catch (parseError) {
          console.warn(`getDataWithMultiplePatterns - Failed to parse ${dataName} with pattern ${i + 1}:`, parseError);
          continue;
        }
      }
    }
    
    console.warn(`getDataWithMultiplePatterns - ${dataName} tidak ditemukan dengan semua pattern`);
    return null;
  } catch (error) {
    console.error(`getDataWithMultiplePatterns - Error parsing ${dataName}:`, error);
    return null;
  }
}

// Fungsi untuk mendapatkan playerResponse dengan multiple patterns
function getPlayerResponseData(text) {
  const patterns = [
    /ytInitialPlayerResponse\s*=\s*({.+?});/,
    /var\s+ytInitialPlayerResponse\s*=\s*({.+?});/,
    /ytInitialPlayerResponse\s*=\s*({[\s\S]*?});/,
    /window\["ytInitialPlayerResponse"\]\s*=\s*({.+?});/,
    /ytInitialPlayerResponse\s*:\s*({.+?})\s*,/,
    /ytInitialPlayerResponse\s*:\s*({[\s\S]*?})\s*,/,
    /"ytInitialPlayerResponse"\s*:\s*({[\s\S]*?})\s*,/,
    /\bytInitialPlayerResponse\s*=\s*({[\s\S]*?});</
  ];
  
  return getDataWithMultiplePatterns(text, patterns, 'playerResponse');
}

// Fungsi untuk mendapatkan ytInitialData dengan multiple patterns
function getYtInitialData(text) {
  const patterns = [
    /ytInitialData\s*=\s*({.*?});<\/script>/s,
    /var\s+ytInitialData\s*=\s*({.*?});<\/script>/s,
    /ytInitialData\s*=\s*({[\s\S]*?});/,
    /window\["ytInitialData"\]\s*=\s*({.*?});/,
    /ytInitialData\s*:\s*({.*?})\s*,/,
    /ytInitialData\s*:\s*({[\s\S]*?})\s*,/,
    /"ytInitialData"\s*:\s*({[\s\S]*?})\s*,/,
    /\bytInitialData\s*=\s*({[\s\S]*?});</
  ];
  
  return getDataWithMultiplePatterns(text, patterns, 'ytInitialData');
}

// ========================================
// PERUBAHAN YANG DILAKUKAN:
// ========================================
// 1. Hapus pemanggilan handleWatchPage(getCurrentVideoId()) untuk mencegah duplikasi
//    - Sebelumnya: fetchData dipanggil 3 kali (handleWatchPage + refresh button + pemanggilan langsung)
//    - Sekarang: fetchData hanya dipanggil 2 kali (handleWatchPage + refresh button)
//    - Akibatnya: getVideoInfoFromData juga hanya dipanggil 2 kali, bukan 3 kali
//
// 2. Tambahkan log debugging untuk melacak pemanggilan fungsi:
//    - Log di handleWatchPage untuk melacak kapan dipanggil
//    - Log di fetchData untuk melacak kapan dipanggil
//    - Log di getVideoInfoFromData untuk melacak kapan dipanggil
//
// 3. Fungsi utility untuk mendapatkan data dengan multiple patterns:
//    - getPlayerResponseData() dengan 6 pattern berbeda
//    - getYtInitialData() dengan 8 pattern berbeda
//    - Fallback ke pattern /var jika pattern utama null
//
// 4. Kurangi log yang berlebihan untuk mengurangi spam di console
// ========================================
//
// ALUR PEMANGGILAN YANG BENAR:
// 1. initYouTubeScript() dipanggil
// 2. watch() dipanggil
// 3. handleWatchPage(currentVideoId) dipanggil 1x
// 4. fetchData(videoId) dipanggil 1x
// 5. getVideoInfoFromData(ytInitialData) dipanggil 1x
// 6. Tombol refresh: fetchData(videoId, 'refresh') dipanggil 1x
// 7. getVideoInfoFromData(ytInitialData) dipanggil 1x lagi
// TOTAL: getVideoInfoFromData dipanggil 2x (bukan 3x seperti sebelumnya)
// ========================================
//
// MANFAAT PERUBAHAN:
// 1. Mengurangi beban server - tidak ada request yang tidak perlu
// 2. Mengurangi spam di console - log lebih bersih dan mudah dibaca
// 3. Performa lebih baik - tidak ada duplikasi pemanggilan fungsi
// 4. Debugging lebih mudah - alur pemanggilan lebih jelas
// 5. Konsumsi memori lebih efisien - tidak ada fungsi yang dipanggil berulang
// ========================================
//
// SOLUSI LENGKAP UNTUK MASALAH "getVideoInfoFromData muncul 3 kali":
// 
// MASALAH:
// - getVideoInfoFromData dipanggil 3 kali karena fetchData dipanggil 3 kali
// - Pemanggilan ketiga berasal dari handleWatchPage(getCurrentVideoId()) di akhir file
// - Ini menyebabkan duplikasi request dan spam di console
//
// SOLUSI:
// 1. Hapus pemanggilan handleWatchPage(getCurrentVideoId()) di akhir file
// 2. Tambahkan log debugging untuk melacak alur pemanggilan
// 3. Kurangi log yang berlebihan untuk console yang lebih bersih
// 4. Pastikan alur pemanggilan hanya 2x: handleWatchPage + tombol refresh
//
// HASIL:
// - getVideoInfoFromData sekarang hanya dipanggil 2x (sesuai kebutuhan)
// - Console lebih bersih dan mudah dibaca
// - Performa lebih baik tanpa duplikasi
// ========================================

// Fungsi untuk memparse title dengan mentions
function parseTitleWithMentions(titleRuns) {
  if (!titleRuns || !Array.isArray(titleRuns)) return '';
  
  const titleContainer = document.createElement('span');
  
  titleRuns.forEach(run => {
    if (run.navigationEndpoint?.browseEndpoint) {
      // This is a mention
      const mentionLink = document.createElement('a');
      mentionLink.href = run.navigationEndpoint.commandMetadata.webCommandMetadata.url;
      mentionLink.className = 'mention';
      mentionLink.target = '_blank';
      mentionLink.textContent = run.text;
      titleContainer.appendChild(mentionLink);
    } else {
      // This is regular text
      const textNode = document.createTextNode(run.text);
      titleContainer.appendChild(textNode);
    }
  });
  
  return titleContainer;
}

// Fungsi untuk mendapatkan dan menampilkan title dengan mentions
async function displayTitleWithMentions(ytInitialData) {
  try {
    const titleRuns = ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer?.title?.runs;
    
    if (titleRuns) {
      const titleElement = await waitForElement('ytd-watch-metadata[title-headline-xs] h1.ytd-watch-metadata');
      if (titleElement) {
        // Clear existing content
        titleElement.textContent = '';
        // Add new content with mentions
        titleElement.appendChild(parseTitleWithMentions(titleRuns));
      }
    }
  } catch (error) {
    console.error('Error displaying title with mentions:', error);
  }
}

initYouTubeScript();