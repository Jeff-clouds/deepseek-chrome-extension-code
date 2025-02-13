// 当扩展被安装或更新时
chrome.runtime.onInstalled.addListener(() => {
  console.log('扩展已安装/更新');
});

// 处理图标点击
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 先尝试注入 content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (e) {
    console.log('脚本可能已经注入');
  }
  
  // 然后发送切换消息
  chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
}); 