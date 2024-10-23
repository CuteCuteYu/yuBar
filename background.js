// Store request data using chrome.storage
let currentTabRequest = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ requestCache: {} });

  // Set up initial rules with a default header modification
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [{
      id: 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [{
          header: 'X-Request-Inspector',
          operation: 'set',
          value: 'active'
        }]
      },
      condition: {
        urlFilter: '*',
        resourceTypes: ['main_frame']
      }
    }]
  });
});

// Capture request headers
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    if (details.type === 'main_frame') {
      const requestData = {
        url: details.url,
        method: details.method,
        timestamp: Date.now(),
        headers: details.requestHeaders.map(h => ({
          name: h.name,
          value: h.value
        })),
        tabId: details.tabId
      };
      
      currentTabRequest = requestData;
      
      chrome.storage.local.get('requestCache', (data) => {
        const cache = data.requestCache || {};
        cache[details.tabId] = requestData;
        chrome.storage.local.set({ requestCache: cache });
      });
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

// Capture response headers
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.type === 'main_frame' && currentTabRequest && currentTabRequest.tabId === details.tabId) {
      currentTabRequest.responseHeaders = details.responseHeaders.map(h => ({
        name: h.name,
        value: h.value
      }));
      
      chrome.storage.local.get('requestCache', (data) => {
        const cache = data.requestCache || {};
        if (cache[details.tabId]) {
          cache[details.tabId].responseHeaders = currentTabRequest.responseHeaders;
          chrome.storage.local.set({ requestCache: cache });
        }
      });
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// Clean up cache when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get('requestCache', (data) => {
    const cache = data.requestCache || {};
    delete cache[tabId];
    chrome.storage.local.set({ requestCache: cache });
  });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentRequest') {
    chrome.storage.local.get('requestCache', (data) => {
      const cache = data.requestCache || {};
      const requestData = cache[request.tabId];
      if (requestData) {
        sendResponse({ success: true, data: requestData });
      } else {
        sendResponse({ success: false, error: 'No request data found' });
      }
    });
    return true;
  }

  if (request.action === 'updateHeaders') {
    try {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
        addRules: [{
          id: 1,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: request.headers.map(header => ({
              header: header.name,
              operation: 'set',
              value: header.value
            }))
          },
          condition: {
            urlFilter: request.url || '*',
            resourceTypes: ['main_frame']
          }
        }]
      });
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});