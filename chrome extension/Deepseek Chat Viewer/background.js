// 当扩展安装或更新时，注入到所有匹配的标签页
chrome.runtime.onInstalled.addListener(async () => {
  // 获取所有匹配的标签页
  const tabs = await chrome.tabs.query({
    url: ["*://*.deepseek.com/*"]
  });

  // 为每个匹配的标签页注入content script
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (err) {
      console.error(`Failed to inject script into tab ${tab.id}:`, err);
    }
  }
});

// 监听快捷键
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle_thinking') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0].url.includes('deepseek.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'TOGGLE_THINKING' });
      }
    });
  }
});

// 更新图标状态
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const isDeepSeek = tab.url?.includes('deepseek.com');
    chrome.action.setIcon({
      path: {
        16: `icons/icon16${isDeepSeek ? '' : '_disabled'}.png`,
        48: `icons/icon48${isDeepSeek ? '' : '_disabled'}.png`,
        128: `icons/icon128${isDeepSeek ? '' : '_disabled'}.png`
      },
      tabId: tab.id
    });
  }
}); 