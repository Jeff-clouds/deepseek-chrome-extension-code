// 添加调试日志
function log(message) {
    console.log(`[Apple Docs Exporter] ${message}`);
}

// HTML 转 Markdown 的辅助函数
function convertToMarkdown(element) {
    log('开始转换内容为 Markdown');
    let markdown = '';
    
    try {
        // 按照 DOM 顺序处理所有子元素
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            switch (node.tagName.toLowerCase()) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                    const level = node.tagName[1];
                    const text = node.textContent.trim();
                    markdown += `${'#'.repeat(level)} ${text}\n\n`;
                    break;
                    
                case 'p':
                    const pText = node.textContent.trim();
                    if (pText) {
                        markdown += `${pText}\n\n`;
                    }
                    break;
                    
                case 'ul':
                case 'ol':
                    const items = node.querySelectorAll('li');
                    items.forEach(item => {
                        if (node.tagName === 'UL') {
                            markdown += `- ${item.textContent.trim()}\n`;
                        } else {
                            markdown += `1. ${item.textContent.trim()}\n`;
                        }
                    });
                    markdown += '\n';
                    break;
                    
                case 'img':
                    const alt = node.alt || '';
                    const src = node.src || '';
                    markdown += `![${alt}](${src})\n\n`;
                    break;
                    
                case 'a':
                    // 只处理直接包含文本的链接，避免重复处理嵌套在其他元素中的链接
                    if (node.parentElement.tagName.toLowerCase() === 'p') {
                        const linkText = node.textContent.trim();
                        const href = node.href;
                        markdown += `[${linkText}](${href})\n\n`;
                    }
                    break;
            }
        }

        log('内容转换完成');
        return markdown;

    } catch (error) {
        log('转换过程中出错：' + error.message);
        throw error;
    }
}

// 导出内容
function exportContent() {
    log('开始导出内容');
    
    try {
        const content = document.querySelector('.AppleTopic.apd-topic.book.book-content');
        if (!content) {
            log('未找到目标内容元素');
            chrome.runtime.sendMessage({ 
                action: "error", 
                message: "未找到可导出的内容。请确保当前页面是苹果文档页面。" 
            });
            return;
        }

        log('找到目标内容元素，开始处理');

        // 获取 h1 标题作为文件名
        const h1Title = content.querySelector('h1');
        let title = h1Title ? h1Title.textContent.trim() : document.title;
        
        // 处理文件名
        title = title.replace(/[^\w\s\u4e00-\u9fa5-]/g, '') // 保留中文字符、字母、数字、空格和连字符
                     .trim()
                     .replace(/\s+/g, '-')
                     .substring(0, 100); // 增加长度限制以适应中文标题

        // 如果标题为空，使用默认名称
        if (!title) {
            title = 'apple-doc';
        }

        // 转换内容为 Markdown
        const markdown = convertToMarkdown(content);

        // 创建 Blob 对象
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        
        log('创建文件对象，文件名：' + title);

        // 使用 URL.createObjectURL 而不是 FileReader
        const url = URL.createObjectURL(blob);
        
        chrome.runtime.sendMessage({ 
            action: "saveFile", 
            url: url,
            filename: `${title}.md` 
        });

        log('发送保存文件请求');

    } catch (error) {
        log('导出过程中出错：' + error.message);
        chrome.runtime.sendMessage({ 
            action: "error", 
            message: "导出过程中出错：" + error.message 
        });
    }
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    log('收到消息：' + request.action);
    
    if (request.action === "export") {
        exportContent();
    }
    return true;
});

log('内容脚本已加载');