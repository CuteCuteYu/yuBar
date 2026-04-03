# yuBar - HTTP 请求检查器

yuBar 是一款轻量级的 Chrome 浏览器扩展，是 Hackerbar 的替代方案。它可以轻松地在浏览器中修改 HTTP 请求参数，特别适合 Web 开发者和安全测试人员使用。

## 功能特性

- **实时请求捕获** - 自动捕获当前页面的 HTTP 请求信息
- **请求头修改** - 修改任意 HTTP 请求头，包括常用的 User-Agent
- **预设 User-Agent** - 内置多种常用浏览器的 User-Agent 字符串：
  - Chrome (Windows)
  - Firefox (Windows)
  - Safari (macOS)
  - Chrome (Android)
  - Safari (iOS)
  - Edge (Windows)
- **响应头查看** - 查看服务器返回的响应头信息
- **自定义请求** - 支持 GET、POST、PUT、DELETE、HEAD、OPTIONS 等方法

## 项目结构

```
yuBar/
├── src/                    # React 源代码目录
│   ├── App.tsx            # React 主组件
│   ├── main.tsx           # React 入口文件
│   └── index.css          # 全局样式
├── icons/                  # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── background.js           # 扩展后台脚本
├── popup.js               # 弹出窗口逻辑
├── popup.html             # 弹出窗口界面
├── styles.css             # 弹出窗口样式
├── manifest.json          # 扩展配置文件
├── package.json           # 项目依赖配置
├── vite.config.ts         # Vite 构建配置
├── tailwind.config.js     # Tailwind CSS 配置
├── tsconfig.json          # TypeScript 配置
└── eslint.config.js       # ESLint 配置
```

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **图标库**: Lucide React
- **代码规范**: ESLint + TypeScript

## 安装教程

### 方式一：从源码安装

1. 克隆项目到本地：
   ```bash
   git clone https://github.com/CuteCuteYu/yuBar
   ```

2. 进入项目目录：
   ```bash
   cd yuBar
   ```

3. 安装依赖：
   ```bash
   npm install
   ```

4. 构建项目：
   ```bash
   npm run build
   ```

5. 在 Chrome 中安装扩展：
   - 打开 Chrome 浏览器
   - 访问 `chrome://extensions/`
   - 开启右上角的「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择项目目录中的 `dist` 文件夹

### 方式二：直接加载源码（开发模式）

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 yuBar 项目根目录

## 使用说明

1. **打开扩展**：在 Chrome 浏览器中，点击工具栏上的 yuBar 图标打开弹出窗口
2. **捕获请求**：点击「Capture Current」按钮，扩展会自动获取当前活动标签页的 HTTP 请求信息
3. **修改请求头**：
   - 在 Headers 区域可以添加、编辑或删除请求头
   - 选择 Header 名称为「User-Agent」时，会出现预设的浏览器选择下拉框
   - 也可以选择「Custom User-Agent」输入自定义的 User-Agent 字符串
4. **发送请求**：修改完成后，点击「Send Request」按钮，扩展会使用修改后的请求头在新标签页中打开目标 URL
5. **清空表单**：点击「Clear」按钮可以清空所有输入内容

## 扩展权限说明

该扩展请求以下权限：

- `activeTab` - 访问当前活动标签页
- `scripting` - 执行脚本
- `storage` - 存储数据
- `declarativeNetRequest` - 修改网络请求
- `tabs` - 管理标签页
- `webRequest` - 拦截网络请求
- `<all_urls>` - 访问所有网站（用于捕获和修改任意网站的请求）

## 开发相关命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览构建结果
npm run preview
```

## 注意事项

1. 该扩展使用 `declarativeNetRequest` API 来修改请求头，这是一种官方推荐的修改请求头的方式
2. 修改后的请求头规则会在发送请求时自动应用
3. 扩展会自动清理已关闭标签页的缓存数据

## 许可证

MIT License