const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');

startBtn.addEventListener('click', async () => {
  const raw = document.getElementById('phones').value.trim();
  const message = document.getElementById('message').value.trim();
  const delay = Math.max(3, parseInt(document.getElementById('delay').value) || 5);

  if (!message) {
    statusEl.textContent = 'נא להזין הודעה';
    return;
  }

  const phones = [...new Set(
    raw.split(/[,\n\s]+/).map(p => p.trim()).filter(p => p.length > 5)
  )];

  if (phones.length === 0) {
    statusEl.textContent = 'לא נמצאו מספרי טלפון';
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url?.includes('web.whatsapp.com')) {
    statusEl.textContent = '❌ פתח את WhatsApp Web קודם!';
    return;
  }

  statusEl.textContent = `נמצאו ${phones.length} מספרים. מתחיל...`;
  startBtn.disabled = true;
  startBtn.style.display = 'none';
  stopBtn.style.display = 'block';
  progressEl.style.display = 'block';

  // Inject content script
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (e) { /* already injected */ }

  await new Promise(r => setTimeout(r, 500));

  // Send to content script
  chrome.tabs.sendMessage(tab.id, {
    action: 'sendMessages',
    phones,
    message,
    delay
  }, (response) => {
    if (chrome.runtime.lastError) {
      statusEl.textContent = '❌ שגיאת תקשורת. רענן את WhatsApp Web ונסה שוב.';
      startBtn.disabled = false;
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
    }
  });
});

stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { action: 'stop' });
  statusEl.textContent = '⛔ עוצר...';
  startBtn.disabled = false;
  startBtn.style.display = 'block';
  stopBtn.style.display = 'none';
});

// Listen for progress from content script
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
    if (msg.failed?.length > 0) {
      statusEl.textContent += '\nנכשלו: ' + msg.failed.join(', ');
    }
  }
});
