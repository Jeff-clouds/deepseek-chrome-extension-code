// 添加配置对象
const SELECTORS = {
    // DeepSeek selectors
    DEEPSEEK: {
        TITLE: '.d8ed659a',
        QUESTION: '.fbb737a4',
        ANSWER: '.f9bf7997',
        THINKING: '.edb250b1',
        MARKDOWN_BLOCK: '.ds-markdown.ds-markdown--block',
        CODE_BLOCK: '.md-code-block',
        CODE_LANGUAGE: '.md-code-block-infostring'
    },
    // 元宝AI selectors
    YUANBAO: {
        TITLE: '.agent-dialogue__content--common__header',
        QUESTION: '.agent-chat__bubble--human',
        ANSWER: '.agent-chat__bubble--ai',
        THINKING: '.hyc-component-reasoner__think',
        SEARCH: '.hyc-component-reasoner__search-list',
        MARKDOWN_BLOCK: '.hyc-component-reasoner__text',
        CODE_BLOCK: '.hyc-common-markdown__code'
    }
};

// 第一个监听器
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "download") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                console.error("No active tab found!");
                return;
            }

            // 检查网站类型并执行相应的脚本
            const url = tabs[0].url;
            if (url.includes('deepseek')) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: captureDeepseekChat,
                    args: [SELECTORS.DEEPSEEK]
                });
            } else if (url.includes('yuanbao.tencent')) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: captureYuanbaoChat,
                    args: [SELECTORS.YUANBAO]
                });
            } else {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'images/icon48.png',
                    title: '导出失败',
                    message: '此插件仅支持 DeepSeek Chat 和元宝AI 网站。'
                });
            }
        });
    } 
    else if (request.action === "saveFile") {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: false
        });
    }
    else if (request.action === "error") {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon48.png',
            title: '导出失败',
            message: request.message
        });
    }
    return true;
});

// DeepSeek 专用处理函数
function captureDeepseekChat(SELECTORS) {
    // 获取整个会话的标题
    const titleElement = document.querySelector(SELECTORS.TITLE);
    let title = titleElement ? titleElement.textContent.trim() : 'deepseek-chat';
    
    // 处理文件名
    title = title.replace(/^[\/\.]+/, '')
                 .replace(/[\x00-\x1F<>:"/\\|?*]/g, '-')
                 .replace(/\s+/g, '_')
                 .replace(/-{2,}/g, '-');

    if (!title) {
        title = 'deepseek-chat';
    }

    let markdown = `# ${title}\n\n`;
    
    // 获取所有问题和回答
    const questions = document.querySelectorAll(SELECTORS.QUESTION);
    const answers = document.querySelectorAll(SELECTORS.ANSWER);
    
    if (questions.length === 0 || answers.length === 0) {
        chrome.runtime.sendMessage({ 
            action: "error", 
            message: "未找到对话内容，请确保当前页面是 DeepSeek 对话页面。" 
        });
        return;
    }

    const count = Math.min(questions.length, answers.length);
    
    for (let i = 0; i < count; i++) {
        // 添加问题
        markdown += `## ${questions[i].textContent.trim()}\n\n`;

        // 处理回答
        const answerBlock = answers[i];
        if (answerBlock) {
            // 处理思考过程
            const thinking = answerBlock.querySelector(SELECTORS.THINKING);
            if (thinking) {
                const paragraphs = thinking.querySelectorAll('p');
                let thinkingContent = '';
                paragraphs.forEach((p, index) => {
                    let paragraphText = p.textContent
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .trim();
                    thinkingContent += paragraphText + (index === paragraphs.length - 1 ? '\n\n' : '\n');
                });
                markdown += `### 思考过程\n\n${thinkingContent}`;
            }

            // 处理回答内容
            const answer = answerBlock.querySelector(SELECTORS.MARKDOWN_BLOCK);
            if (answer) {
                let markdownContent = '';
                answer.childNodes.forEach(node => {
                    if (node.classList?.contains(SELECTORS.CODE_BLOCK)) {
                        const language = node.querySelector(SELECTORS.CODE_LANGUAGE)?.textContent || '';
                        const codeContent = node.querySelector('pre')?.textContent || '';
                        markdownContent += `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
                    } else {
                        let html = node.outerHTML || node.textContent;
                        if (html) {
                            html = html
                                .replace(/<div[^>]*>/g, '')
                                .replace(/<\/div>/g, '')
                                .replace(/<span[^>]*>/g, '')
                                .replace(/<\/span>/g, '')
                                .replace(/<ol[^>]*start="(\d+)"[^>]*>/g, '<!-- list-start:ol:$1 -->')
                                .replace(/<ol[^>]*>/g, '<!-- list-start:ol:1 -->')
                                .replace(/<\/ol>/g, '<!-- list-end:ol -->')
                                .replace(/<ul>/g, '<!-- list-start:ul -->')
                                .replace(/<\/ul>/g, '<!-- list-end:ul -->')
                                .replace(/<li>/g, function(match, offset, string) {
                                    const before = string.substring(0, offset);
                                    const listStarts = (before.match(/<!-- list-start:(ol|ul)(?::(\d+))? -->/g) || []);
                                    const listEnds = (before.match(/<!-- list-end:(ol|ul) -->/g) || []);
                                    const currentLevel = listStarts.length - listEnds.length;
                                    
                                    const lastListStart = listStarts[listStarts.length - 1] || '';
                                    const [_, type, start] = lastListStart.match(/<!-- list-start:(ol|ul)(?::(\d+))? -->/) || ['', 'ul', 1];
                                    
                                    const indent = ' '.repeat(currentLevel - 1);
                                    
                                    if (type === 'ol') {
                                        const liCount = (before.split(lastListStart)[1]?.match(/<li>/g)?.length || 0);
                                        return `${indent}${parseInt(start) + liCount}. `;
                                    } else {
                                        return `${indent}- `;
                                    }
                                })
                                .replace(/<\/li>/g, '\n')
                                .replace(/<!-- list-(start|end):(ol|ul).*?-->/g, '')
                                .replace(/<p>/g, '')
                                .replace(/<\/p>/g, '\n\n')
                                .replace(/<code>/g, '`')
                                .replace(/<\/code>/g, '`')
                                .replace(/<strong>/g, '**')
                                .replace(/<\/strong>/g, '**')
                                .replace(/<em>/g, '*')
                                .replace(/<\/em>/g, '*')
                                .replace(/<h1>/g, '# ')
                                .replace(/<\/h1>/g, '\n\n')
                                .replace(/<h2>/g, '## ')
                                .replace(/<\/h2>/g, '\n\n')
                                .replace(/<h3>/g, '### ')
                                .replace(/<\/h3>/g, '\n\n')
                                .replace(/<h4>/g, '#### ')
                                .replace(/<\/h4>/g, '\n\n')
                                .replace(/<br\s*\/?>/g, '\n')
                                .replace(/<hr[^>]*>/g, '---\n\n')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&amp;/g, '&')
                                .replace(/&quot;/g, '"')
                                .trim();
                            markdownContent += html + '\n\n';
                        }
                    }
                });
                markdown += markdownContent;
            }
        }

        // 添加分隔线
        if (i < count - 1) {
            markdown += `---\n\n`;
        }
    }

    // 创建Blob对象并发送保存消息
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const reader = new FileReader();
    reader.onload = function() {
        chrome.runtime.sendMessage({ 
            action: "saveFile", 
            url: reader.result, 
            filename: `${title}.md` 
        });
    };
    reader.readAsDataURL(blob);
}

// 元宝AI 专用处理函数
function captureYuanbaoChat(SELECTORS) {
    // 获取整个会话的标题
    const titleElement = document.querySelector(SELECTORS.TITLE);
    let title = titleElement ? titleElement.textContent.trim() : 'yuanbao-chat';
    
    // 处理文件名
    title = title.replace(/^[\/\.]+/, '')
                 .replace(/[\x00-\x1F<>:"/\\|?*]/g, '-')
                 .replace(/\s+/g, '_')
                 .replace(/-{2,}/g, '-');

    if (!title) {
        title = 'yuanbao-chat';
    }

    let markdown = `# ${title}\n\n`;
    
    // 获取所有问题和回答
    const questions = document.querySelectorAll(SELECTORS.QUESTION);
    const answers = document.querySelectorAll(SELECTORS.ANSWER);
    
    if (questions.length === 0 || answers.length === 0) {
        chrome.runtime.sendMessage({ 
            action: "error", 
            message: "未找到对话内容，请确保当前页面是元宝AI对话页面。" 
        });
        return;
    }

    const count = Math.min(questions.length, answers.length);
    
    for (let i = 0; i < count; i++) {
        // 添加问题
        markdown += `## ${questions[i].textContent.trim()}\n\n`;

        // 处理回答
        const answerBlock = answers[i];
        if (answerBlock) {
            // 处理搜索结果（如果存在）
            const search = answerBlock.querySelector(SELECTORS.SEARCH);
            if (search) {
                let content = '### 搜索结果\n\n';
                const header = search.querySelector('.hyc-card-box-search-ref__content__header');
                if (header) {
                    content += header.textContent.trim() + '\n\n';
                }
                const references = search.querySelectorAll('ul li.hyc-card-box-search-ref-content-detail');
                references.forEach((ref, index) => {
                    const title = ref.getAttribute('data-title');
                    const url = ref.getAttribute('data-url');
                    content += `${index + 1}. [${title}](${url})\n`;
                });
                content += '\n';
                markdown += content;
            }

            // 处理思考过程
            const thinking = answerBlock.querySelector(SELECTORS.THINKING);
            if (thinking) {
                const paragraphs = thinking.querySelectorAll('p');
                let content = '### 思考过程\n\n';
                paragraphs.forEach(p => {
                    content += p.textContent.trim() + '\n\n';
                });
                markdown += content;
            }

            // 处理回答内容
            const answer = answerBlock.querySelector(SELECTORS.MARKDOWN_BLOCK);
            if (answer) {
                const elements = answer.children;
                for (let element of elements) {
                    switch (element.tagName.toLowerCase()) {
                        case 'p':
                            markdown += element.textContent.trim() + '\n\n';
                            break;
                        case 'pre':
                            const codeBlock = element.querySelector('code');
                            if (codeBlock) {
                                const language = codeBlock.className.replace('language-', '');
                                markdown += `\`\`\`${language || ''}\n${codeBlock.textContent}\n\`\`\`\n\n`;
                            }
                            break;
                        case 'ul':
                            element.querySelectorAll('li').forEach(li => {
                                markdown += `- ${li.textContent.trim()}\n`;
                            });
                            markdown += '\n';
                            break;
                        case 'ol':
                            let index = 1;
                            element.querySelectorAll('li').forEach(li => {
                                markdown += `${index}. ${li.textContent.trim()}\n`;
                                index++;
                            });
                            markdown += '\n';
                            break;
                        default:
                            markdown += element.textContent.trim() + '\n\n';
                    }
                }
            }
        }

        // 添加分隔线
        if (i < count - 1) {
            markdown += `---\n\n`;
        }
    }

    // 创建Blob对象，并发送保存消息
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const reader = new FileReader();
    reader.onload = function() {
        chrome.runtime.sendMessage({ 
            action: "saveFile", 
            url: reader.result, 
            filename: `${title}.md` 
        });
    };
    reader.readAsDataURL(blob);
}

