document.addEventListener('DOMContentLoaded', function() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const questionList = document.getElementById('questionList');
  const toggleBtn = document.getElementById('toggleBtn');
  
  let currentIndex = 0;
  
  // 检查当前是否在 DeepSeek 网站
  async function checkDeepSeekSite() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    return tab.url?.includes('deepseek.com') || false;
  }
  
  // 显示非 DeepSeek 网站的提示
  function showNotSupportedMessage() {
    questionList.innerHTML = '<div style="padding: 10px; color: #666; text-align: center;">此扩展仅支持 DeepSeek Chat 网站</div>';
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    toggleBtn.disabled = true;
  }
  
  // 获取当前标签页
  function getCurrentTab() {
    return chrome.tabs.query({active: true, currentWindow: true});
  }
  
  // 更新问题列表
  async function updateQuestionList() {
    try {
      const isDeepSeek = await checkDeepSeekSite();
      if (!isDeepSeek) {
        showNotSupportedMessage();
        return;
      }

      const [tab] = await getCurrentTab();
      chrome.tabs.sendMessage(tab.id, { action: 'GET_QUESTIONS' }, response => {
        if (response) {
          questionList.innerHTML = '';
          response.questions.forEach((question, index) => {
            const div = document.createElement('div');
            div.className = `question-item ${index === response.currentIndex ? 'current' : ''}`;
            div.textContent = question;
            div.addEventListener('click', () => {
              navigateToQuestion(index);
            });
            questionList.appendChild(div);
          });
          
          currentIndex = response.currentIndex;
          updateButtonStates(response.questions.length);
        }
      });
    } catch (error) {
      console.log('通信错误:', error);
      showNotSupportedMessage();
    }
  }
  
  // 更新按钮状态
  function updateButtonStates(totalQuestions) {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === totalQuestions - 1;
  }
  
  // 导航到特定问题
  async function navigateToQuestion(index) {
    try {
      const [tab] = await getCurrentTab();
      chrome.tabs.sendMessage(tab.id, { 
        action: 'NAVIGATE',
        index: index
      }, () => {
        if (chrome.runtime.lastError) return;
        currentIndex = index;
        updateQuestionList();
      });
    } catch (error) {
      console.log('导航错误:', error);
    }
  }
  
  // 绑定按钮事件
  prevBtn.addEventListener('click', async () => {
    try {
      const [tab] = await getCurrentTab();
      chrome.tabs.sendMessage(tab.id, { action: 'PREV' }, response => {
        if (chrome.runtime.lastError) return;
        if (response) {
          currentIndex = response.currentIndex;
          updateQuestionList();
        }
      });
    } catch (error) {
      console.log('上一个按钮错误:', error);
    }
  });
  
  nextBtn.addEventListener('click', async () => {
    try {
      const [tab] = await getCurrentTab();
      chrome.tabs.sendMessage(tab.id, { action: 'NEXT' }, response => {
        if (chrome.runtime.lastError) return;
        if (response) {
          currentIndex = response.currentIndex;
          updateQuestionList();
        }
      });
    } catch (error) {
      console.log('下一个按钮错误:', error);
    }
  });

  // 切换思考内容按钮
  toggleBtn.addEventListener('click', async () => {
    try {
      const [tab] = await getCurrentTab();
      chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_THINKING' }, () => {
        if (chrome.runtime.lastError) return;
      });
    } catch (error) {
      console.log('切换按钮错误:', error);
    }
  });
  
  // 初始化
  updateQuestionList();
}); 