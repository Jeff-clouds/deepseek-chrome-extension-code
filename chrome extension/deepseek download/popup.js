document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded');
    const downloadButton = document.getElementById('download');
    if (downloadButton) {
        console.log('Download button found');
        downloadButton.addEventListener('click', async () => {
            console.log('Button clicked');
            try {
                // 获取当前标签页
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab) {
                    console.error('No active tab found');
                    return;
                }
                
                chrome.runtime.sendMessage({ action: "download" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Runtime error:', chrome.runtime.lastError);
                        return;
                    }
                    console.log('Message sent successfully', response);
                });
            } catch (error) {
                console.error('Error in click handler:', error);
            }
        });
    } else {
        console.error("Download button not found!");
    }
});
