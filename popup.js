document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI elements
  const urlInput = document.getElementById('url');
  const methodSelect = document.getElementById('method');
  const headersContainer = document.getElementById('headers-container');
  const requestBodyTextarea = document.getElementById('request-body');
  const responseContent = document.getElementById('response-content');
  
  // Common User-Agent strings
  const userAgents = {
    'Chrome (Windows)': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Firefox (Windows)': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Safari (macOS)': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Chrome (Android)': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    'Safari (iOS)': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Edge (Windows)': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0'
  };
  
  // Button handlers
  document.getElementById('capture').addEventListener('click', captureCurrentRequest);
  document.getElementById('send').addEventListener('click', sendRequest);
  document.getElementById('clear').addEventListener('click', clearForm);
  document.getElementById('add-header').addEventListener('click', () => addHeaderRow());

  // Auto-capture current request when popup opens
  captureCurrentRequest();

  function createUserAgentSelect(value = '') {
    const select = document.createElement('select');
    select.className = 'header-value user-agent-select';

    // Add custom option
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Custom User-Agent';
    select.appendChild(customOption);

    // Add predefined options
    Object.entries(userAgents).forEach(([name, ua]) => {
      const option = document.createElement('option');
      option.value = ua;
      option.textContent = name;
      if (ua === value) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // Handle custom value
    if (value && !Object.values(userAgents).includes(value)) {
      customOption.selected = true;
      setTimeout(() => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'header-value';
        input.value = value;
        select.parentNode.insertBefore(input, select.nextSibling);
        
        select.addEventListener('change', () => {
          if (select.value === 'custom') {
            input.style.display = 'block';
            input.focus();
          } else {
            input.style.display = 'none';
          }
        });
      }, 0);
    }

    select.addEventListener('change', function() {
      const customInput = this.parentNode.querySelector('input.header-value');
      if (this.value === 'custom') {
        if (!customInput) {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'header-value';
          input.value = value;
          this.parentNode.insertBefore(input, this.nextSibling);
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

    // Add name change listener to handle User-Agent conversion
    nameInput.addEventListener('change', () => {
      if (nameInput.value.toLowerCase() === 'user-agent') {
        const oldValue = valueElement.value;
        const newValueElement = createUserAgentSelect(oldValue);
        headerRow.replaceChild(newValueElement, valueElement);
        valueElement = newValueElement;
      } else if (valueElement.tagName === 'SELECT') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Header Value';
        input.className = 'header-value';
        input.value = valueElement.value === 'custom' ? 
          headerRow.querySelector('input.header-value')?.value || '' : 
          valueElement.value;
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
      
      chrome.runtime.sendMessage({ action: 'getCurrentRequest', tabId: tab.id }, (response) => {
        if (response && response.success) {
          const { url, method, headers, responseHeaders } = response.data;
          
          // Update UI with captured data
          urlInput.value = url;
          methodSelect.value = method || 'GET';
          
          // Clear existing headers
          headersContainer.innerHTML = '';
          
          // Add captured request headers
          if (Array.isArray(headers)) {
            headers.forEach(header => {
              addHeaderRow(header.name, header.value);
            });
          }

          // Display response headers if available
          if (Array.isArray(responseHeaders)) {
            const headersList = responseHeaders
              .map(header => `${header.name}: ${header.value}`)
              .join('\n');
            responseContent.textContent = `Response Headers:\n${headersList}`;
          }
        }
      });
    } catch (error) {
      responseContent.textContent = `Error capturing request: ${error.message}`;
    }
  }

  async function sendRequest() {
    try {
      const headers = [];
      document.querySelectorAll('.header-row').forEach(row => {
        const nameInput = row.querySelector('.header-name');
        const valueSelect = row.querySelector('select.user-agent-select');
        const valueInput = row.querySelector('input.header-value');
        
        if (nameInput.value) {
          let headerValue;
          if (valueSelect && valueSelect.style.display !== 'none') {
            headerValue = valueSelect.value === 'custom' ? valueInput.value : valueSelect.value;
          } else {
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

      // First update the header rules
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'updateHeaders',
          headers: headers,
          url: urlInput.value
        }, response => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error));
          }
        });
      });

      // Then make the request
      const fetchOptions = {
        method: methodSelect.value,
        credentials: 'include'
      };

      if (methodSelect.value !== 'GET' && requestBodyTextarea.value) {
        fetchOptions.body = requestBodyTextarea.value;
      }

      const response = await fetch(urlInput.value, fetchOptions);
      const responseText = await response.text();
      
      // Format response headers
      const headersList = Array.from(response.headers.entries())
        .map(([name, value]) => `${name}: ${value}`)
        .join('\n');

      responseContent.textContent = `Status: ${response.status} ${response.statusText}\n\nHeaders:\n${headersList}\n\nBody:\n${responseText}`;
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