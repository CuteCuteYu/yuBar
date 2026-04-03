const REQUEST_RULE_ID = 1;
let currentTabRequest = null;

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.storage.local.set({ requestCache: {} });
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [REQUEST_RULE_ID],
      addRules: [{
        id: REQUEST_RULE_ID,
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
    console.log('Extension installed and rules initialized');
  } catch (error) {
    console.error('Failed to initialize extension:', error);
  }
});

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
      
      chrome.storage.local.get('requestCache').then(data => {
        const cache = data.requestCache || {};
        cache[details.tabId] = requestData;
        chrome.storage.local.set({ requestCache: cache });
      });
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.type === 'main_frame' && currentTabRequest && currentTabRequest.tabId === details.tabId) {
      currentTabRequest.responseHeaders = details.responseHeaders.map(h => ({
        name: h.name,
        value: h.value
      }));
      
      chrome.storage.local.get('requestCache').then(data => {
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

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.get('requestCache').then(data => {
    const cache = data.requestCache || {};
    delete cache[tabId];
    chrome.storage.local.set({ requestCache: cache });
  });
  if (currentTabRequest && currentTabRequest.tabId === tabId) {
    currentTabRequest = null;
  }
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  chrome.storage.local.get('requestCache').then(data => {
    const cache = data.requestCache || {};
    if (cache[removedTabId]) {
      cache[addedTabId] = cache[removedTabId];
      delete cache[removedTabId];
      chrome.storage.local.set({ requestCache: cache });
    }
  });
  if (currentTabRequest && currentTabRequest.tabId === removedTabId) {
    currentTabRequest = null;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentRequest') {
    chrome.storage.local.get('requestCache').then(data => {
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
    (async () => {
      try {
        const headers = request.headers || [];
        const urlFilter = request.url ? request.url : '*';
        
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [REQUEST_RULE_ID],
          addRules: [{
            id: REQUEST_RULE_ID,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              requestHeaders: headers.map(header => ({
                header: header.name,
                operation: 'set',
                value: header.value
              }))
            },
            condition: {
              urlFilter: urlFilter,
              resourceTypes: ['main_frame']
            }
          }]
        });
        
        if (request.openTab && request.url) {
          const tab = await chrome.tabs.create({ url: request.url });
          sendResponse({ success: true, tabId: tab.id });
        } else {
          sendResponse({ success: true });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (request.action === 'sendRequest') {
    (async () => {
      try {
        const headers = request.headers || [];
        const url = request.url;
        const method = request.method || 'GET';
        
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [REQUEST_RULE_ID],
          addRules: [{
            id: REQUEST_RULE_ID,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              requestHeaders: headers.map(header => ({
                header: header.name,
                operation: 'set',
                value: header.value
              }))
            },
            condition: {
              urlFilter: url || '*',
              resourceTypes: ['main_frame']
            }
          }]
        });

        if (method === 'GET') {
          const tab = await chrome.tabs.create({ url });
          sendResponse({ success: true, tabId: tab.id, redirected: true });
        } else {
          const requestBody = (method === 'POST' || method === 'PUT' || method === 'PATCH') ? request.body : '';
          
          const fetchOptions = {
            method: method,
            headers: headers.reduce((acc, h) => {
              acc[h.name] = h.value;
              return acc;
            }, {})
          };
          
          if (requestBody) {
            fetchOptions.body = requestBody;
          }
          
          try {
            const response = await fetch(url, fetchOptions);
            const responseHeaders = {};
            response.headers.forEach((value, name) => {
              responseHeaders[name] = value;
            });
            
            let responseBody = '';
            try {
              responseBody = await response.text();
            } catch (e) {
              responseBody = '[Unable to read response body]';
            }
            
            sendResponse({ 
              success: true, 
              redirected: false,
              response: {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                body: responseBody
              }
            });
          } catch (fetchError) {
            sendResponse({ 
              success: false, 
              error: `Request failed: ${fetchError.message}` 
            });
          }
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
});