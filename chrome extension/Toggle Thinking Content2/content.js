// 主要的切换功能
function toggleAllThinkingContent() {
    const containers = document.querySelectorAll('.a6d716f5.db5991dd');
    
    containers.forEach(container => {
        if (container.textContent.includes('已深度思考')) {
            try {
                container.click();
            } catch (error) {
                console.error('点击失败:', error);
            }
        }
    });
}

// 监听扩展消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggle') {
        toggleAllThinkingContent();
    }
});

// 初始化消息
console.log('内容脚本已加载 v1.3');