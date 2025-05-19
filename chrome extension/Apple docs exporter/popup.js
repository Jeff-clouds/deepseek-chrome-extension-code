document.addEventListener('DOMContentLoaded', function() {
    const exportButton = document.getElementById('export');
    
    exportButton.addEventListener('click', async () => {
        try {
            // 获取当前标签页
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                console.error("No active tab found!");
                return;
            }

            // 检查是否是苹果网站
            if (!tab.url.includes('apple.com')) {
                exportButton.textContent = '非苹果官网';
                setTimeout(() => {
                    exportButton.textContent = '导出文档';
                }, 2000);
                return;
            }

            // 更新按钮状态
            exportButton.textContent = '导出中...';

            // 发送导出消息
            chrome.tabs.sendMessage(tab.id, { action: "export" });

            // 关闭弹窗（可选）
            // setTimeout(() => window.close(), 1000);

        } catch (error) {
            console.error('Error:', error);
            exportButton.textContent = '导出失败';
            setTimeout(() => {
                exportButton.textContent = '导出文档';
            }, 2000);
        }
    });
});