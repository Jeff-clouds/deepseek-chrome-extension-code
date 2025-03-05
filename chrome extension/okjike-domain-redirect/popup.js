// 页面元素选择器配置
const SELECTORS = {
  USER_LINK: '.jsx-3802438259.wrap a[href^="/users/"]',
  // 可以在这里添加更多选择器配置
};

// URL配置
const URL_CONFIG = {
  OLD_DOMAIN: /^https?:\/\/m\.okjike\.com/,
  NEW_DOMAIN: 'https://web-next.okjike.com',
  POST_PATH_PREFIX: '/originalPosts/',
};

document.addEventListener('DOMContentLoaded', async () => {
  const messageElement = document.getElementById('message');
  const urlDisplayElement = document.getElementById('urlDisplay');
  const redirectButton = document.getElementById('redirectButton');

  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url) {
    messageElement.textContent = '无法获取当前页面信息';
    return;
  }

  // 检查是否是目标域名
  if (tab.url.match(URL_CONFIG.OLD_DOMAIN)) {
    try {
      // 获取页面内容
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (selector) => {
          // 查找用户ID
          const userLink = document.querySelector(selector);
          return userLink ? userLink.getAttribute('href').split('/users/')[1] : null;
        },
        args: [SELECTORS.USER_LINK] // 传入选择器
      });

      if (!result) {
        messageElement.textContent = '无法从页面提取用户信息';
        return;
      }

      const userId = result;
      // 从URL中提取帖子ID
      const postId = tab.url.split(URL_CONFIG.POST_PATH_PREFIX)[1];
      
      if (!postId) {
        messageElement.textContent = '无法从URL提取帖子信息';
        return;
      }

      const newUrl = `${URL_CONFIG.NEW_DOMAIN}/u/${userId}/post/${postId}`;

      messageElement.textContent = '检测到旧版即刻域名：';
      urlDisplayElement.textContent = newUrl;
      urlDisplayElement.style.display = 'block';
      redirectButton.style.display = 'block';

      // 添加跳转按钮点击事件
      redirectButton.addEventListener('click', () => {
        chrome.tabs.update(tab.id, { url: newUrl });
        window.close(); // 关闭弹出面板
      });
    } catch (error) {
      console.error('Error:', error);
      messageElement.textContent = '处理页面时发生错误';
    }
  } else {
    messageElement.textContent = '当前页面不是即刻旧版域名';
  }
}); 