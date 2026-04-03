document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('url');
  const methodSelect = document.getElementById('method');
  const headersContainer = document.getElementById('headers-container');
  const requestBodyTextarea = document.getElementById('request-body');
  const responseContent = document.getElementById('response-content');
  
  if (!urlInput || !methodSelect || !headersContainer || !requestBodyTextarea || !responseContent) {
    console.error('Required DOM elements not found');
    return;
  }

  const userAgents = {
    'Chrome (Windows)': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Firefox (Windows)': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Safari (macOS)': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Chrome (Android)': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    'Safari (iOS)': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Edge (Windows)': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
  };

  document.getElementById('capture')?.addEventListener('click', () => captureCurrentRequest());
  document.getElementById('send')?.addEventListener('click', () => sendRequest());
  document.getElementById('clear')?.addEventListener('click', clearForm);
  document.getElementById('add-header')?.addEventListener('click', () => addHeaderRow());

  captureCurrentRequest();

  function createUserAgentSelect(value = '') {
    const select = document.createElement('select');
    select.className = 'header-value user-agent-select';

    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Custom User-Agent';
    select.appendChild(customOption);

    Object.entries(userAgents).forEach(([name, ua]) => {
      const option = document.createElement('option');
      option.value = ua;
      option.textContent = name;
      if (ua === value) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    if (value && !Object.values(userAgents).includes(value)) {
      customOption.selected = true;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'header-value custom-ua-input';
      input.value = value;
      input.style.display = 'block';
      select.parentNode?.insertBefore(input, select.nextSibling);
    }

    select.addEventListener('change', function() {
      const customInput = this.parentNode?.querySelector('input.custom-ua-input');
      if (this.value === 'custom') {
        if (!customInput) {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'header-value custom-ua-input';
          this.parentNode?.insertBefore(input, this.nextSibling);
        } else {
          customInput.style.display = 'block';
        }
      } else if (customInput) {
        customInput.style.display = 'none';
      }
    });

    return select;
  }

  function addHeaderRow(name = '', value = '') {
    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Header Name';
    nameInput.value = name;
    nameInput.className = 'header-name';

    let valueElement;
    if (name.toLowerCase() === 'user-agent') {
      valueElement = createUserAgentSelect(value);
    } else {
      valueElement = document.createElement('input');
      valueElement.type = 'text';
      valueElement.placeholder = 'Header Value';
      valueElement.value = value;
      valueElement.className = 'header-value';
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-header';
    removeBtn.textContent = '×';
    removeBtn.onclick = () => headerRow.remove();

    nameInput.addEventListener('change', () => {
      if (nameInput.value.toLowerCase() === 'user-agent') {
        const oldValue = valueElement.value || valueElement.querySelector('option:checked')?.value || '';
        const newValueElement = createUserAgentSelect(oldValue);
        headerRow.replaceChild(newValueElement, valueElement);
        valueElement = newValueElement;
      } else if (valueElement.tagName === 'SELECT') {
        const customInput = headerRow.querySelector('input.custom-ua-input');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Header Value';
        input.className = 'header-value';
        input.value = valueElement.value === 'custom' ? customInput?.value || '' : valueElement.value;
        headerRow.replaceChild(input, valueElement);
        valueElement = input;
      }
    });

    headerRow.appendChild(nameInput);
    headerRow.appendChild(valueElement);
    headerRow.appendChild(removeBtn);
    headersContainer.appendChild(headerRow);
  }

  async function captureCurrentRequest() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        responseContent.textContent = 'No active tab found';
        return;
      }

      const response = await chrome.runtime.sendMessage({ action: 'getCurrentRequest', tabId: tab.id });
      
      if (response?.success) {
        const { url, method, headers, responseHeaders } = response.data;
        
        urlInput.value = url || '';
        methodSelect.value = method || 'GET';
        
        headersContainer.innerHTML = '';
        
        if (Array.isArray(headers)) {
          headers.forEach(header => {
            addHeaderRow(header.name, header.value);
          });
        }

        if (Array.isArray(responseHeaders)) {
          const headersList = responseHeaders
            .map(header => `${header.name}: ${header.value}`)
            .join('\n');
          responseContent.textContent = `Response Headers:\n${headersList}`;
        } else {
          responseContent.textContent = '';
        }
      } else {
        responseContent.textContent = response?.error || 'No request data found';
      }
    } catch (error) {
      responseContent.textContent = `Error capturing request: ${error.message}`;
    }
  }

  async function sendRequest() {
    try {
      const url = urlInput.value.trim();
      if (!url) {
        responseContent.textContent = 'Error: URL is required';
        return;
      }

      const headers = [];
      document.querySelectorAll('.header-row').forEach(row => {
        const nameInput = row.querySelector('.header-name');
        const valueSelect = row.querySelector('select.user-agent-select');
        const valueInput = row.querySelector('input.header-value');

        if (nameInput?.value) {
          let headerValue;
          if (valueSelect) {
            if (valueSelect.value === 'custom') {
              const customInput = row.querySelector('input.custom-ua-input');
              headerValue = customInput?.value || '';
            } else {
              headerValue = valueSelect.value;
            }
          } else if (valueInput) {
            headerValue = valueInput.value;
          }

          if (headerValue) {
            headers.push({
              name: nameInput.value,
              value: headerValue
            });
          }
        }
      });

      const method = methodSelect.value;
      const body = requestBodyTextarea.value;

      const response = await chrome.runtime.sendMessage({
        action: 'sendRequest',
        url,
        method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(method) ? body : ''
      });

      if (response?.success) {
        if (response.redirected) {
          responseContent.textContent = `Request sent successfully!\nMethod: ${method}\nURL: ${url}\nTab ID: ${response.tabId}`;
        } else if (response.response) {
          const { status, statusText, headers: respHeaders, body: respBody } = response.response;
          const headersText = Object.entries(respHeaders).map(([k, v]) => `${k}: ${v}`).join('\n');
          responseContent.textContent = `Status: ${status} ${statusText}\n\nResponse Headers:\n${headersText}\n\nResponse Body:\n${respBody}`;
        } else {
          responseContent.textContent = `Request sent successfully!\nMethod: ${method}\nURL: ${url}`;
        }
      } else {
        responseContent.textContent = `Error: ${response?.error || 'Failed to send request'}`;
      }
    } catch (error) {
      responseContent.textContent = `Error: ${error.message}`;
    }
  }

  function clearForm() {
    urlInput.value = '';
    methodSelect.value = 'GET';
    headersContainer.innerHTML = '';
    requestBodyTextarea.value = '';
    responseContent.textContent = '';
  }
});