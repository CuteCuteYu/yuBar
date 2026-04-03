# yuBar - HTTP Request Inspector

yuBar is a lightweight Chrome browser extension, an alternative to Hackerbar, that makes it easy to modify HTTP request parameters in the browser. It is particularly useful for web developers and security testers.

## Features

- **Real-time Request Capture** - Automatically capture HTTP request information from the current page
- **Request Header Modification** - Modify any HTTP request headers, including commonly used User-Agent
- **Preset User-Agents** - Built-in User-Agent strings for multiple popular browsers:
  - Chrome (Windows)
  - Firefox (Windows)
  - Safari (macOS)
  - Chrome (Android)
  - Safari (iOS)
  - Edge (Windows)
- **Response Header Viewing** - View server response headers
- **Custom Requests** - Support for GET, POST, PUT, DELETE, HEAD, OPTIONS methods

> **中文**: [查看中文版 README](./README_CN.md)

## Project Structure

```
yuBar/
├── src/                    # React source code
│   ├── App.tsx            # React main component
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styles
├── icons/                  # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── background.js           # Extension background script
├── popup.js               # Popup window logic
├── popup.html             # Popup window UI
├── styles.css             # Popup window styles
├── manifest.json          # Extension manifest
├── package.json           # Project dependencies
├── vite.config.ts         # Vite build config
├── tailwind.config.js     # Tailwind CSS config
├── tsconfig.json          # TypeScript config
└── eslint.config.js       # ESLint config
```

## Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Code Quality**: ESLint + TypeScript

## Installation

### Option 1: Install from Source

1. Clone the project:
   ```bash
   git clone https://github.com/CuteCuteYu/yuBar
   ```

2. Navigate to the project directory:
   ```bash
   cd yuBar
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Install in Chrome:
   - Open Chrome browser
   - Go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `dist` folder in the project directory

### Option 2: Load Source Directly (Development Mode)

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the yuBar project root directory

## Usage

1. **Open Extension**: Click the yuBar icon in the Chrome toolbar to open the popup
2. **Capture Request**: Click the "Capture Current" button to automatically fetch HTTP request info from the active tab
3. **Modify Headers**:
   - In the Headers section, you can add, edit, or delete request headers
   - When selecting "User-Agent" as the header name, a preset browser selection dropdown will appear
   - You can also select "Custom User-Agent" to enter a custom User-Agent string
4. **Send Request**: After modifications, click "Send Request" to open the target URL in a new tab with the modified headers
5. **Clear Form**: Click "Clear" to reset all inputs

## Permissions

This extension requests the following permissions:

- `activeTab` - Access current active tab
- `scripting` - Execute scripts
- `storage` - Store data
- `declarativeNetRequest` - Modify network requests
- `tabs` - Manage tabs
- `webRequest` - Intercept network requests
- `<all_urls>` - Access all websites (for capturing and modifying requests from any site)

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview build
npm run preview
```

## Notes

1. The extension uses the `declarativeNetRequest` API to modify request headers, which is the officially recommended approach
2. Modified header rules are automatically applied when sending requests
3. The extension automatically cleans up cached data for closed tabs

## License

MIT License