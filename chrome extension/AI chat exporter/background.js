// 添加配置对象
const SELECTORS = {
    // DeepSeek selectors
    DEEPSEEK: {
        TITLE: '.d8ed659a',
        QUESTION: '.fbb737a4',
        ANSWER: '._43c05b5',
        THINKING: '._48edb25',
        SEARCH: '.a6d716f5.db5991dd',
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
        SIMPLE_ANSWER: '.agent-chat__speech-text, .agent-chat__speech-card__text',
        CODE_BLOCK: '.hyc-common-markdown__code pre.hyc-common-markdown__code-lan',
        CODE_LANGUAGE: '.hyc-common-markdown__code__hd__l'
    },
    // ChatGPT selectors
    CHATGPT: {
        QUESTION: '[data-message-author-role="user"] .whitespace-pre-wrap',
        ANSWER: '[data-message-author-role="assistant"]',
        MARKDOWN_BLOCK: '.markdown.prose',
        CODE_BLOCK: 'pre code',
        CODE_LANGUAGE: 'code[class*="language-"]'
    },
    // 豆包 selectors
    DOUBAO: {
        QUESTION: '.message-content.message-box-content-otxGGw.send-message-box-content-N1r3Gh.samantha-message-box-content-Qjmpja',
        ANSWER: '.message-content.message-box-content-otxGGw.receive-message-box-content-_lREFj.samantha-message-box-content-Qjmpja',
        SEARCH: '.search-result-collapse-header-O_cFO3'
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
            } else if (url.includes('chatgpt.com')) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: captureChatGPTChat,
                    args: [SELECTORS.CHATGPT]
                });
            } else if (url.includes('doubao.com')) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: captureDoubaoChat,
                    args: [SELECTORS.DOUBAO]
                });
            } else {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'images/icon48.png',
                    title: '导出失败',
                    message: '此插件仅支持 DeepSeek Chat、元宝AI、ChatGPT 和豆包网站。'
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
            // 处理搜索结果
            const search = answerBlock.querySelector(SELECTORS.SEARCH);
            if (search && search.textContent.trim()) {
                const searchText = search.textContent.trim();
                if (searchText.includes('网页')) {
                    markdown += `### 搜索结果\n\n${searchText}\n\n`;
                }
            }

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
                markdown += `### 回答内容\n\n`;
                let markdownContent = '';
                answer.childNodes.forEach(node => {
                    if (node.classList?.contains('md-code-block')) {
                        // 处理代码块
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
        markdown += `## ${questions[i].textContent.trim()}\n\n`;

        const answerBlock = answers[i];
        if (answerBlock) {
            // 检查是否为深度回答
            const isDeepAnswer = answerBlock.querySelector(SELECTORS.MARKDOWN_BLOCK);
            
            if (isDeepAnswer) {
                // 处理深度回答
                // 处理搜索结果（如果存在）
                const search = answerBlock.querySelector(SELECTORS.SEARCH);
                if (search && search.textContent.trim()) {
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
                    markdown += `### 回答内容\n\n`;
                    answer.childNodes.forEach(node => {
                        // 检查是否是代码块容器
                        if (node.querySelector && node.querySelector(SELECTORS.CODE_BLOCK)) {
                            const codeBlock = node.querySelector(SELECTORS.CODE_BLOCK);
                            const languageElement = node.querySelector(SELECTORS.CODE_LANGUAGE);
                            const language = languageElement ? languageElement.textContent.trim() : '';
                            const codeContent = codeBlock.textContent.trim();
                            
                            markdown += `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
                        } else {
                            // 处理其他内容的逻辑保持不变
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
                                markdown += html + '\n\n';
                            }
                        }
                    });
                }
            } else {
                // 处理非深度回答
                const simpleAnswer = answerBlock.querySelector(SELECTORS.SIMPLE_ANSWER);
                if (simpleAnswer) {
                    let markdownContent = '';
                    
                    // 遍历所有子节点
                    const contentNodes = simpleAnswer.querySelectorAll('.hyc-content-md > .hyc-common-markdown > *');
                    contentNodes.forEach(node => {
                        // 检查是否是代码块容器
                        if (node.querySelector && node.querySelector('.hyc-common-markdown__code')) {
                            const codeBlock = node.querySelector('.hyc-common-markdown__code');
                            const languageElement = codeBlock.querySelector('.hyc-common-markdown__code__hd__l');
                            const codeElement = codeBlock.querySelector('.hyc-common-markdown__code-lan code');
                            
                            if (codeElement) {
                                const language = languageElement ? languageElement.textContent.trim() : '';
                                const codeContent = codeElement.textContent.trim();
                                markdownContent += `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
                            }
                        } else {
                            // 处理普通文本内容
                            let html = node.outerHTML || node.textContent;
                            if (html) {
                                html = html
                                    .replace(/<div[^>]*>/g, '')
                                    .replace(/<\/div>/g, '')
                                    .replace(/<span[^>]*>/g, '')
                                    .replace(/<\/span>/g, '')
                                    .replace(/<p>/g, '')
                                    .replace(/<\/p>/g, '\n\n')
                                    .replace(/<h3>/g, '### ')
                                    .replace(/<\/h3>/g, '\n\n')
                                    .replace(/<ul>/g, '')
                                    .replace(/<\/ul>/g, '\n')
                                    .replace(/<li>/g, '- ')
                                    .replace(/<\/li>/g, '\n')
                                    .replace(/<code>/g, '`')
                                    .replace(/<\/code>/g, '`')
                                    .replace(/<strong>/g, '**')
                                    .replace(/<\/strong>/g, '**')
                                    .replace(/<em>/g, '*')
                                    .replace(/<\/em>/g, '*')
                                    .replace(/<pre>/g, '')
                                    .replace(/<\/pre>/g, '\n')
                                    .replace(/<br\s*\/?>/g, '\n')
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&amp;/g, '&')
                                    .replace(/&quot;/g, '"')
                                    .trim();
                                
                                if (html) {
                                    markdownContent += html + '\n\n';
                                }
                            }
                        }
                    });
                    
                    markdown += markdownContent;
                }
            }
        }

        // 添加分隔线
        if (i < count - 1) {
            markdown += `---\n\n`;
        }
    }

    // 在创建Blob之前，添加处理连续换行的代码
    markdown = markdown.replace(/\n{4,}/g, '\n\n\n');
    
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

// ChatGPT 专用处理函数
function captureChatGPTChat(SELECTORS) {
    // 获取所有问题和回答
    const questions = document.querySelectorAll(SELECTORS.QUESTION);
    const answers = document.querySelectorAll(SELECTORS.ANSWER);
    
    if (questions.length === 0 || answers.length === 0) {
        chrome.runtime.sendMessage({ 
            action: "error", 
            message: "未找到对话内容，请确保当前页面是 ChatGPT 对话页面。" 
        });
        return;
    }

    // 使用第一个问题作为标题
    let title = questions[0].textContent.trim();
    
    // 处理文件名
    title = title.replace(/^[\/\.]+/, '')
                 .replace(/[\x00-\x1F<>:"/\\|?*]/g, '-')
                 .replace(/\s+/g, '_')
                 .replace(/-{2,}/g, '-')
                 .substring(0, 50); // 限制标题长度

    if (!title) {
        title = 'chatgpt-chat';
    }

    let markdown = `# ${title}\n\n`;
    
    const count = Math.min(questions.length, answers.length);
    
    for (let i = 0; i < count; i++) {
        // 添加问题
        markdown += `## ${questions[i].textContent.trim()}\n\n`;

        // 处理回答
        const answerBlock = answers[i];
        if (answerBlock) {
            const markdownContent = answerBlock.querySelector(SELECTORS.MARKDOWN_BLOCK);
            if (markdownContent) {
                markdown += `### 回答内容\n\n`;
                
                // 遍历回答内容的所有子节点
                markdownContent.childNodes.forEach(node => {
                    if (node.tagName === 'PRE') {
                        // 处理代码块
                        const codeElement = node.querySelector('code');
                        if (codeElement) {
                            const languageClass = Array.from(codeElement.classList)
                                .find(cls => cls.startsWith('language-'));
                            const language = languageClass ? languageClass.replace('language-', '') : '';
                            const codeContent = codeElement.textContent.trim();
                            markdown += `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
                        }
                    } else {
                        // 处理普通文本内容
                        let html = node.outerHTML || node.textContent;
                        if (html) {
                            html = html
                                .replace(/<div[^>]*>/g, '')
                                .replace(/<\/div>/g, '')
                                .replace(/<span[^>]*>/g, '')
                                .replace(/<\/span>/g, '')
                                .replace(/<p>/g, '')
                                .replace(/<\/p>/g, '\n\n')
                                .replace(/<code>/g, '`')
                                .replace(/<\/code>/g, '`')
                                .replace(/<strong>/g, '**')
                                .replace(/<\/strong>/g, '**')
                                .replace(/<em>/g, '*')
                                .replace(/<\/em>/g, '*')
                                .replace(/<ol[^>]*>/g, '\n')
                                .replace(/<\/ol>/g, '\n')
                                .replace(/<ul[^>]*>/g, '\n')
                                .replace(/<\/ul>/g, '\n')
                                .replace(/<li[^>]*>/g, '- ')
                                .replace(/<\/li>/g, '\n')
                                .replace(/<br\s*\/?>/g, '\n')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&amp;/g, '&')
                                .replace(/&quot;/g, '"')
                                .trim();
                            
                            if (html) {
                                markdown += html + '\n\n';
                            }
                        }
                    }
                });
            }
        }

        // 添加分隔线
        if (i < count - 1) {
            markdown += `---\n\n`;
        }
    }

    // 处理连续换行
    markdown = markdown.replace(/\n{4,}/g, '\n\n\n');
    
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

// 豆包专用处理函数
function captureDoubaoChat(SELECTORS) {
    // 获取所有问题和回答
    const questions = document.querySelectorAll(SELECTORS.QUESTION);
    const answers = document.querySelectorAll(SELECTORS.ANSWER);
    
    if (questions.length === 0 || answers.length === 0) {
        chrome.runtime.sendMessage({ 
            action: "error", 
            message: "未找到对话内容，请确保当前页面是豆包对话页面。" 
        });
        return;
    }

    // 使用第一个问题作为标题
    let title = questions[0].textContent.trim();
    
    // 处理文件名
    title = title.replace(/^[\/\.]+/, '')
                 .replace(/[\x00-\x1F<>:"/\\|?*]/g, '-')
                 .replace(/\s+/g, '_')
                 .replace(/-{2,}/g, '-')
                 .substring(0, 50);

    if (!title) {
        title = 'doubao-chat';
    }

    let markdown = `# ${title}\n\n`;
    
    const count = Math.min(questions.length, answers.length);
    
    for (let i = 0; i < count; i++) {
        // 添加问题
        markdown += `## ${questions[i].textContent.trim()}\n\n`;

        // 处理回答
        const answerBlock = answers[i];
        if (answerBlock) {
            const searchResults = answerBlock.querySelector(SELECTORS.SEARCH);
            if (searchResults) {
                markdown += `### 搜索结果\n\n${searchResults.textContent.trim()}\n\n`;
            }

            markdown += `### 回答内容\n\n${answerBlock.textContent.trim()}\n\n`;
        }

        // 添加分隔线
        if (i < count - 1) {
            markdown += `---\n\n`;
        }
    }

    // 处理连续换行
    markdown = markdown.replace(/\n{4,}/g, '\n\n\n');
    
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

