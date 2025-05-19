chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Received message:', request.action);

    if (request.action === "saveFile") {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('Download failed:', chrome.runtime.lastError);
            } else {
                console.log('Download started:', downloadId);
            }
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

// 处理快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'quick_export') {
        // 获取当前活动标签页
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            // 发送导出消息到content script
            chrome.tabs.sendMessage(tab.id, { action: "export" });
        }
    }
});