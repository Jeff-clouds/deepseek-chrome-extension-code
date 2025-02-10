chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "download") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                console.error("No active tab found!");
                return;
            }

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: captureDeepseekChat
            });
        });
    }
});

function captureDeepseekChat() {
    // 获取整个会话的标题
    const titleElement = document.querySelector('.d8ed659a');
    const title = titleElement ? titleElement.textContent.trim() : 'deepseek-chat';

    let markdown = `# ${title}\n\n`;

    // 获取所有用户问题
    const questions = document.querySelectorAll('.fbb737a4');
    // 获取所有AI回答
    const answers = document.querySelectorAll('.f9bf7997');
    
    // 确保问题和回答数量匹配
    const count = Math.min(questions.length, answers.length);
    
    for (let i = 0; i < count; i++) {
        // 添加用户问题
        markdown += `## ${questions[i].textContent.trim()}\n\n`;

        // 添加AI回答
        const answerBlock = answers[i];
        if (answerBlock) {
            // 思考部分（如果存在）
            const thinking = answerBlock.querySelector('.edb250b1');
            if (thinking) {
                markdown += `*思考过程：${thinking.textContent.trim()}*\n\n`;
            }

            // 回答内容 - 保留原始markdown格式
            const answer = answerBlock.querySelector('.ds-markdown.ds-markdown--block');
            if (answer) {
                let markdownContent = '';
                // 遍历所有子节点
                answer.childNodes.forEach(node => {
                    if (node.classList?.contains('md-code-block')) {
                        // 处理代码块
                        const language = node.querySelector('.md-code-block-infostring')?.textContent || '';
                        const codeContent = node.querySelector('pre')?.textContent || '';
                        // 确保代码块前后和结束标记都有换行
                        markdownContent += `\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
                    } else {
                        // 处理其他HTML内容
                        let html = node.outerHTML || node.textContent;
                        if (html) {
                            html = html
                                .replace(/<div[^>]*>/g, '')  // 移除所有div开始标签
                                .replace(/<\/div>/g, '')     // 移除所有div结束标签
                                .replace(/<span[^>]*>/g, '') // 移除所有span开始标签
                                .replace(/<\/span>/g, '')    // 移除所有span结束标签
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
                                // 处理有序列表
                                .replace(/<ol[^>]*start="(\d+)"[^>]*>/g, function(match, start) {
                                    return `<!-- ol-start:${start} -->`;
                                })
                                .replace(/<ol[^>]*>/g, '<!-- ol-start:1 -->')
                                .replace(/<\/ol>/g, '\n')
                                // 处理无序列表（移除重复的处理）
                                .replace(/<ul>/g, '<!-- ul-start -->')
                                .replace(/<\/ul>/g, '\n')
                                // 处理列表项
                                .replace(/<li>/g, function(match, offset, string) {
                                    const beforeLi = string.substring(0, offset);
                                    
                                    // 计算缩进级别（通过计算前面有多少个嵌套的ul/ol）
                                    const indentLevel = (beforeLi.match(/<!-- [ou]l-start/g) || []).length - 1;
                                    const indent = '  '.repeat(Math.max(0, indentLevel));
                                    
                                    // 检查是否在ul中
                                    const lastUlStart = beforeLi.lastIndexOf('<!-- ul-start -->');
                                    const lastUlEnd = beforeLi.lastIndexOf('</ul>');
                                    const inUl = lastUlStart > lastUlEnd;
                                    
                                    if (inUl) {
                                        return `${indent}- `;
                                    }
                                    
                                    // 检查是否在ol中
                                    const olStartMatch = beforeLi.match(/<!-- ol-start:(\d+) -->/);
                                    if (olStartMatch) {
                                        const startNum = parseInt(olStartMatch[1]);
                                        const liCount = beforeLi
                                            .substring(beforeLi.lastIndexOf('<!-- ol-start'))
                                            .match(/<li>/g)?.length || 0;
                                        return `${indent}${startNum + liCount}. `;
                                    }
                                    
                                    return `${indent}- `;
                                })
                                .replace(/<\/li>/g, '\n')
                                // 移除临时标记
                                .replace(/<!-- [ou]l-start(?::\d+)? -->/g, '')
                                .replace(/<br\s*\/?>/g, '\n') // 处理换行标签
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

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "saveFile") {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: false
        });
    }
});
