const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');

startBtn.addEventListener('click', async () => {
  const raw = document.getElementById('phones').value.trim();
  const delay = parseInt(document.getElementById('delay').value) || 3;
  
  // Parse and deduplicate phone numbers
  const phones = [...new Set(
    raw.split(/[,\n\s]+/).map(p => p.trim()).filter(p => p.length > 5)
  )];
  
  if (phones.length === 0) {
    statusEl.textContent = 'לא נמצאו מספרי טלפון';
    return;
  }

  statusEl.textContent = `נמצאו ${phones.length} מספרים ייחודיים. מתחיל...`;
  startBtn.disabled = true;
  startBtn.style.display = 'none';
  stopBtn.style.display = 'block';
  progressEl.style.display = 'block';

  // Get the active WhatsApp Web tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url?.includes('web.whatsapp.com')) {
    statusEl.textContent = '❌ פתח את WhatsApp Web קודם!';
    startBtn.disabled = false;
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    return;
  }

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, {
    action: 'addMembers',
    phones,
    delay
  });
});

stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'stop' });
  }
  statusEl.textContent = '⛔ נעצר על ידי המשתמש';
  startBtn.disabled = false;
  startBtn.style.display = 'block';
  stopBtn.style.display = 'none';
});

// Listen for progress updates from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'progress') {
    const pct = Math.round((msg.current / msg.total) * 100);
    progressBar.style.width = pct + '%';
    statusEl.textContent = msg.text;
  }
  if (msg.type === 'done') {
    startBtn.disabled = false;
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    statusEl.textContent = msg.text;
  }
});
