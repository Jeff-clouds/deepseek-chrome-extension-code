const CONFIG = {
    BUSY_TEXT: '服务器繁忙，请稍后再试。',
    RATE_LIMIT_TEXT: '你发送消息的频率过快，请稍后再发',
    CHECK_INTERVAL: 1000,
    RETRY_DELAY: 60000,      // 服务器繁忙时的重试延迟
    RATE_LIMIT_DELAY: 90000, // 频率限制时的等待时间
    DEBOUNCE_DELAY: 5000
};

const state = {
    isRetrying: false,
    isPaused: false,
    activeNotification: null,
    debounceTimer: null,
    lastRetryTime: 0,
    observer: null
};

const storage = {
    async isPaused() {
        try {
            if (!chrome.runtime?.id) {
                console.log('Extension context invalid');
                return false;
            }
            
            return new Promise((resolve, reject) => {
                try {
                    chrome.storage.local.get(['isPaused'], function(result) {
                        if (chrome.runtime.lastError) {
                            console.log('Storage access error:', chrome.runtime.lastError);
                            resolve(false);
                            return;
                        }
                        resolve(result.isPaused || false);
                    });
                } catch (error) {
                    console.log('Storage get error:', error);
                    resolve(false);
                }
            });
        } catch (error) {
            console.log('Storage access failed:', error);
            return false;
        }
    }
};

function createNotification(message, temporary = true, countdown = 0) {
    if (state.activeNotification && !temporary) {
        return state.activeNotification;
    }

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(139, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 9999;
        transition: opacity 0.3s;
    `;
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    notification.appendChild(messageSpan);

    if (countdown > 0) {
        const countdownSpan = document.createElement('span');
        countdownSpan.style.marginLeft = '10px';
        notification.appendChild(countdownSpan);

        let remainingSeconds = countdown;
        const updateCountdown = () => {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            countdownSpan.textContent = `(${minutes}:${seconds.toString().padStart(2, '0')})`;
            if (remainingSeconds > 0) {
                remainingSeconds--;
                setTimeout(updateCountdown, 1000);
            } else {
                // 倒计时结束后淡出并移除通知
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }
        };
        updateCountdown();
    }

    if (!temporary) {
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            margin-left: 10px;
            cursor: pointer;
            font-weight: bold;
        `;
        closeButton.onclick = () => {
            notification.remove();
            state.activeNotification = null;
            state.isPaused = false;
        };
        notification.appendChild(closeButton);
    }

    document.body.appendChild(notification);
    
    if (!temporary) {
        state.activeNotification = notification;
    }
    
    return notification;
}

function findRetryButton() {
    let parent = document.activeElement;
    while (parent && !parent.querySelector('.ds-icon-button')) {
        parent = parent.parentElement;
    }

    if (!parent) {
        const chatArea = document.querySelector('.f6004764');
        if (chatArea) {
            parent = chatArea;
        }
    }

    if (!parent) return null;

    const btns = Array.from(parent.querySelectorAll('.ds-icon-button'));
    const retryBtns = btns.filter(btn => {
        const svg = btn.querySelector('svg');
        return svg && svg.querySelector('#重新生成');
    });
    
    const lastRetryBtn = retryBtns[retryBtns.length - 1];
    if (!lastRetryBtn) return null;

    const messageBlock = lastRetryBtn.closest('.f9bf7997');
    const allMessageBlocks = Array.from(document.querySelectorAll('.f9bf7997'));
    const isLastMessage = allMessageBlocks[allMessageBlocks.length - 1] === messageBlock;

    return isLastMessage ? lastRetryBtn : null;
}

function setupObserver() {
    if (state.observer) {
        state.observer.disconnect();
    }

    state.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                autoRetry();
            }
        }
    });

    const chatArea = document.querySelector('.f72b0bab');
    if (chatArea) {
        state.observer.observe(chatArea, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
}

function checkBusyStatus() {
    console.log('检查服务器状态...');
    const rateLimitElements = document.querySelectorAll('.ds-toast__content');
    for (const el of rateLimitElements) {
        if (el.textContent && el.textContent.includes(CONFIG.RATE_LIMIT_TEXT)) {
            console.log('检测到频率限制');
            if (state.isRetrying) {
                clearTimeout(state.debounceTimer);
                state.isRetrying = false;
            }
            
            state.isPaused = true;
            createNotification('检测到频率过快，将在1.5分钟后继续尝试', false, 90);
            
            setTimeout(() => {
                if (state.activeNotification) {
                    state.activeNotification.remove();
                    state.activeNotification = null;
                }
                state.isPaused = false;
                autoRetry();
            }, 90000);
            
            return true;
        }
    }

    const chatArea = document.querySelector('.f6004764');
    if (!chatArea) return false;

    const busyMessages = chatArea.querySelectorAll('.ds-markdown.ds-markdown--block p');
    
    const retryButton = findRetryButton();
    if (!retryButton) return false;
    
    const messageBlock = retryButton.closest('.f9bf7997');
    const busyText = messageBlock?.querySelector('.ds-markdown.ds-markdown--block p');
    
    const allMessageBlocks = Array.from(document.querySelectorAll('.f9bf7997'));
    const isLastMessage = allMessageBlocks[allMessageBlocks.length - 1] === messageBlock;
    
    const messageText = busyText?.textContent.trim();
    return isLastMessage && messageText === CONFIG.BUSY_TEXT;
}

async function autoRetry() {
    // 检查是否暂停
    const isPaused = await storage.isPaused();
    if (isPaused) {
        console.log('Auto retry manually paused');
        // 清除当前的倒计时
        if (state.debounceTimer) {
            clearTimeout(state.debounceTimer);
            state.debounceTimer = null;
        }
        // 清除当前的通知
        if (state.activeNotification) {
            state.activeNotification.remove();
            state.activeNotification = null;
        }
        state.isRetrying = false;
        return;
    }

    if (state.isPaused) {
        console.log('System is in pause state, skipping retry check');
        return;
    }

    if (!checkBusyStatus() && state.activeNotification) {
        console.log('服务器状态正常，移除通知');
        state.activeNotification.remove();
        state.activeNotification = null;
        state.isPaused = false;
        return;
    }

    if (checkBusyStatus()) {
        console.log('检测到服务器繁忙状态');
        const now = Date.now();
        if (!state.isRetrying && (now - state.lastRetryTime) >= CONFIG.DEBOUNCE_DELAY) {
            console.log('开始重试流程');
            state.isRetrying = true;
            state.lastRetryTime = now;

            const retryButton = findRetryButton();
            
            if (retryButton) {
                const notification = createNotification(
                    '检测到服务器繁忙，即将自动重试...',
                    true,
                    60
                );
                
                clearTimeout(state.debounceTimer);
                state.debounceTimer = setTimeout(() => {
                    console.log('找到重试按钮,自动点击');
                    retryButton.dispatchEvent(new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    }));
                    
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 300);
                    state.isRetrying = false;
                }, CONFIG.RETRY_DELAY);
            }
        }
    } else {
        state.isRetrying = false;
    }
}

function init() {
    console.log('初始化自动重试脚本...');
    setupObserver();
    
    autoRetry();
    
    setInterval(autoRetry, CONFIG.CHECK_INTERVAL);
    
    const bodyObserver = new MutationObserver(() => {
        if (!document.querySelector('.f72b0bab')) {
            setupObserver();
        }
    });
    
    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 等待页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 修改存储监听器来处理错误
try {
    if (chrome.runtime?.id) {  // 检查扩展上下文是否有效
        chrome.storage.onChanged.addListener((changes, namespace) => {
            try {
                if (!chrome.runtime?.id) {
                    console.log('Extension context invalid in listener');
                    return;
                }
                
                if (namespace === 'local' && changes.isPaused) {
                    if (changes.isPaused.newValue === true) {
                        // 当切换到暂停状态时
                        if (state.debounceTimer) {
                            clearTimeout(state.debounceTimer);
                            state.debounceTimer = null;
                        }
                        if (state.activeNotification) {
                            state.activeNotification.remove();
                            state.activeNotification = null;
                        }
                        state.isRetrying = false;
                    } else {
                        // 当恢复运行时，立即执行一次检查
                        console.log('Auto retry resumed, checking immediately...');
                        autoRetry();
                    }
                }
            } catch (error) {
                console.log('Error in storage change handler:', error);
            }
        });
    }
} catch (error) {
    console.log('Error setting up storage listener:', error);
} 
