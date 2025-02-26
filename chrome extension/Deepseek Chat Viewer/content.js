// 存储当前问题的索引
let currentQuestionIndex = 0;

// 获取所有问题元素
function getQuestions() {
  return Array.from(document.querySelectorAll('.fbb737a4'));
}

// 滚动到指定问题
function scrollToQuestion(index) {
  const questions = getQuestions();
  if (questions[index]) {
    questions[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    // 高亮当前问题
    questions.forEach((q, i) => {
      if (i === index) {
        q.style.backgroundColor = 'rgba(66, 133, 244, 0.1)';
      } else {
        q.style.backgroundColor = '';
      }
    });
  }
}

// 显示提示消息
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background-color: #333;
    color: white;
    border-radius: 4px;
    z-index: 10000;
    font-size: 14px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// 切换思考内容
function toggleThinkingContent() {
  const containers = document.querySelectorAll('.a6d716f5.db5991dd');
  let count = 0;
  
  containers.forEach(container => {
    if (container.textContent.includes('已深度思考')) {
      try {
        container.click();
        count++;
      } catch (error) {
        console.error('点击失败:', error);
      }
    }
  });

  if (count > 0) {
    showNotification(`成功切换 ${count} 个思考内容`);
  } else {
    showNotification('未找到可切换的思考内容');
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'GET_QUESTIONS':
      sendResponse({
        questions: getQuestions().map(q => q.textContent),
        currentIndex: currentQuestionIndex
      });
      break;
      
    case 'NAVIGATE':
      currentQuestionIndex = request.index;
      scrollToQuestion(currentQuestionIndex);
      sendResponse({ success: true });
      break;
      
    case 'NEXT':
      const questions = getQuestions();
      if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        scrollToQuestion(currentQuestionIndex);
      }
      sendResponse({ currentIndex: currentQuestionIndex });
      break;
      
    case 'PREV':
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        scrollToQuestion(currentQuestionIndex);
      }
      sendResponse({ currentIndex: currentQuestionIndex });
      break;

    case 'TOGGLE_THINKING':
      toggleThinkingContent();
      sendResponse({ success: true });
      break;
  }
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const questions = getQuestions();
  chrome.storage.local.set({ 
    'questionCount': questions.length,
    'currentIndex': 0
  });
}); 