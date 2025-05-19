# Apple Docs Exporter

一个用于将苹果官方文档导出为 Markdown 格式的 Chrome 扩展。

## 功能特点

- 一键将苹果官方文档页面导出为 Markdown 格式
- 支持快速导出功能
- 保留文档的格式和结构
- 简洁的用户界面
- 支持快捷键操作

## 安装方法

1. 下载本仓库的代码
2. 打开 Chrome 浏览器，进入扩展程序页面（chrome://extensions/）
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本仓库的文件夹

## 使用方法

### 方法一：使用扩展图标

1. 访问任意苹果官方文档页面
2. 点击浏览器工具栏中的扩展图标
3. 在弹出的窗口中点击"导出文档"按钮

### 方法二：使用快捷键

- Windows/Linux: `Ctrl + Shift + E`
- macOS: `Command + Shift + E`

### 快速导出

- Windows/Linux/macOS: `Alt + E`

## 权限说明

本扩展需要以下权限：

- `activeTab`: 用于访问当前标签页的内容
- `downloads`: 用于保存导出的文件
- `scripting`: 用于执行页面脚本
- `notifications`: 用于显示操作状态通知

## 支持网站

- https://*.apple.com/*

## 技术栈

- HTML/CSS/JavaScript
- Chrome Extension Manifest V3

## 文件结构

```
├── manifest.json    # 扩展配置文件
├── popup.html      # 弹出窗口界面
├── popup.js        # 弹出窗口逻辑
├── content.js      # 内容脚本
├── background.js   # 后台脚本
└── images/         # 图标资源
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 注意事项

- 本扩展仅支持苹果官方文档网站
- 导出的 Markdown 文件会自动下载到您的下载文件夹
- 建议在导出大型文档时保持网络连接稳定

## 许可证

MIT License 