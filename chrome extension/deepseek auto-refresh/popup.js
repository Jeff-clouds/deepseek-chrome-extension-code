document.addEventListener('DOMContentLoaded', function() {
  const button = document.getElementById('toggleButton');
  const status = document.getElementById('status');

  // Get current state
  chrome.storage.local.get(['isPaused'], function(result) {
    updateUI(result.isPaused);
  });

  button.addEventListener('click', function() {
    chrome.storage.local.get(['isPaused'], function(result) {
      const newState = !result.isPaused;
      chrome.storage.local.set({ isPaused: newState });
      updateUI(newState);
    });
  });

  function updateUI(isPaused) {
    button.textContent = isPaused ? 'Paused' : 'Running';
    button.className = isPaused ? 'paused' : '';
    status.textContent = isPaused ? 'Auto retry disabled' : 'Auto retry enabled';
  }
}); 