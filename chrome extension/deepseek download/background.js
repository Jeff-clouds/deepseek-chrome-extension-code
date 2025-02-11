// 添加配置对象
const SELECTORS = {
    TITLE: '.d8ed659a',
    QUESTION: '.fbb737a4',
    ANSWER: '.f9bf7997',
    THINKING: '.edb250b1',
    MARKDOWN_BLOCK: '.ds-markdown.ds-markdown--block',
    CODE_BLOCK: '.md-code-block',
    CODE_LANGUAGE: '.md-code-block-infostring'
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "download") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                console.error("No active tab found!");
                return;
            }

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: captureDeepseekChat,
                args: [SELECTORS]  // 传递配置对象给函数
            });
        });
    }
    return true;
});

function captureDeepseekChat(SELECTORS) {
    // 获取整个会话的标题
    const titleElement = document.querySelector(SELECTORS.TITLE);
    const title = titleElement ? titleElement.textContent.trim() : 'deepseek-chat';

    let markdown = `# ${title}\n\n`;

    // 获取所有用户问题
    const questions = document.querySelectorAll(SELECTORS.QUESTION);
    // 获取所有AI回答
    const answers = document.querySelectorAll(SELECTORS.ANSWER);
    
    // 确保问题和回答数量匹配
    const count = Math.min(questions.length, answers.length);
    
    for (let i = 0; i < count; i++) {
        // 添加用户问题
        markdown += `## ${questions[i].textContent.trim()}\n\n`;

        // 添加AI回答
        const answerBlock = answers[i];
        if (answerBlock) {
            // 思考部分（如果存在）
            const thinking = answerBlock.querySelector(SELECTORS.THINKING);
            if (thinking) {
                // 获取所有段落
                const paragraphs = thinking.querySelectorAll('p');
                let thinkingContent = '';
                
                // 遍历每个段落
                paragraphs.forEach((p, index) => {
                    // 获取段落文本并处理HTML实体
                    let paragraphText = p.textContent
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .trim();
                        
                    // 添加段落文本和换行
                    thinkingContent += paragraphText;
                    // 如果是最后一个段落，添加两个换行符，否则添加一个
                    if (index === paragraphs.length - 1) {
                        thinkingContent += '\n\n';
                    } else {
                        thinkingContent += '\n';
                    }
                });
                
                markdown += `### 思考过程\n\n${thinkingContent}\n\n`;
            }

            // 回答内容 - 保留原始markdown格式
            const answer = answerBlock.querySelector(SELECTORS.MARKDOWN_BLOCK);
            if (answer) {
                let markdownContent = '';
                // 遍历所有子节点
                answer.childNodes.forEach(node => {
                    if (node.classList?.contains('md-code-block')) {
                        // 处理代码块
                        const language = node.querySelector(SELECTORS.CODE_LANGUAGE)?.textContent || '';
                        const codeContent = node.querySelector('pre')?.textContent || '';
                        markdownContent += `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
                    } else {
                        // 其余HTML处理保持不变
                        let html = node.outerHTML || node.textContent;
                        if (html) {
                            html = html
                                .replace(/<div[^>]*>/g, '')  // 移除所有div开始标签
                                .replace(/<\/div>/g, '')     // 移除所有div结束标签
                                .replace(/<span[^>]*>/g, '') // 移除所有span开始标签
                                .replace(/<\/span>/g, '')    // 移除所有span结束标签
                                // 先处理列表结构
                                .replace(/<ol[^>]*start="(\d+)"[^>]*>/g, '<!-- list-start:ol:$1 -->')
                                .replace(/<ol[^>]*>/g, '<!-- list-start:ol:1 -->')
                                .replace(/<\/ol>/g, '<!-- list-end:ol -->')
                                .replace(/<ul>/g, '<!-- list-start:ul -->')
                                .replace(/<\/ul>/g, '<!-- list-end:ul -->')
                                .replace(/<li>/g, function(match, offset, string) {
                                    const before = string.substring(0, offset);
                                    // 统计未闭合的列表层级
                                    const listStarts = (before.match(/<!-- list-start:(ol|ul)(?::(\d+))? -->/g) || []);
                                    const listEnds = (before.match(/<!-- list-end:(ol|ul) -->/g) || []);
                                    const currentLevel = listStarts.length - listEnds.length;
                                    
                                    // 获取当前列表类型和起始值
                                    const lastListStart = listStarts[listStarts.length - 1] || '';
                                    const [_, type, start] = lastListStart.match(/<!-- list-start:(ol|ul)(?::(\d+))? -->/) || ['', 'ul', 1];
                                    
                                    // 计算缩进（每层缩进2空格）
                                    const indent = '  '.repeat(currentLevel - 1);
                                    
                                    // 生成符号
                                    if (type === 'ol') {
                                        // 计算当前序号：起始值 + 当前层级的li数量
                                        const liCount = (before.split(lastListStart)[1]?.match(/<li>/g)?.length || 0);
                                        return `${indent}${parseInt(start) + liCount}. `;
                                    } else {
                                        return `${indent}- `;
                                    }
                                })
                                .replace(/<\/li>/g, '\n')
                                // 清理临时标记
                                .replace(/<!-- list-(start|end):(ol|ul).*?-->/g, '')
                                // 然后再处理其他标签
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
                
                markdown += markdownContent.trim() + '\n\n';
            }
        }

        // 添加分隔线（除了最后一个对话）
        if (i < count - 1) {
            markdown += `---\n\n`;
        }
    }

    // 创建Blob对象
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "saveFile") {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: false
        });
    }
    return true;
});
