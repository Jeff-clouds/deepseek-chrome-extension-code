document.addEventListener('DOMContentLoaded', () => {
    const downloadButton = document.getElementById('download');
    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: "download" });
        });
    } else {
        console.error("Download button not found!");
    }
});
