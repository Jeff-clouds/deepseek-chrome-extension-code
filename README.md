# DeepSeek Chrome Extensions

一个用于增强 DeepSeek Chat 体验的 Chrome 扩展集合。

## 扩展列表

### 1. DeepSeek 自动重试
自动重试对话中的失败请求，提供更流畅的对话体验。

#### 主要功能
- 自动检测并重试服务器繁忙状态
- 智能处理频率限制
- 支持手动暂停/恢复自动重试
- 状态提示和倒计时显示

### 2. DeepSeek Chat Viewer
提供更好的对话导航和内容管理体验。

#### 主要功能
- 快速导航历史问题
- 一键切换思考内容
- 支持快捷键操作（Alt+T）
- 当前问题高亮显示

### 3. DeepSeek 会话导出
支持将对话内容导出为 Markdown 格式。

#### 主要功能
- 完整导出对话内容
- 保留代码块格式
- 支持思考过程导出
- 自动生成文件名

## 安装说明

1. 下载扩展
   - 访问 [Releases](https://github.com/Jeff-clouds/deepseek-chrome-extension-code/releases) 页面
   - 下载需要的扩展压缩包

2. 安装步骤
   - 打开 Chrome 扩展管理页面 (`chrome://extensions/`)
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择解压后的扩展文件夹

## 使用说明

### 自动重试扩展
- 安装后自动在 DeepSeek Chat 页面生效
- 通过扩展图标可以暂停/恢复自动重试
- 支持自定义重试间隔和等待时间

### Chat Viewer
- 点击扩展图标打开导航面板
- 使用上一个/下一个按钮浏览问题
- Alt+T 快捷键切换思考内容
- 点击具体问题直接跳转

### 会话导出
- 在对话页面点击扩展图标
- 自动下载当前会话的 Markdown 文件
- 支持完整的格式化导出

## 权限说明
- `storage`: 存储扩展设置
- `activeTab`: 访问当前标签页
- `host_permissions`: 仅限 DeepSeek Chat 网站

## 隐私声明
这些扩展不会收集、存储或传输任何用户数据，仅在 DeepSeek Chat 页面本地运行。

## 反馈与建议
如有问题或建议，欢迎在 Issues 中反馈！

## 许可证
MIT License
