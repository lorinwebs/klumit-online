let shouldStop = false;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function report(type, data) {
  try { chrome.runtime.sendMessage({ type, ...data }); } catch (e) {}
}

// ===== DOM HELPERS =====

// Click the "New Chat" button (pencil icon at top)
async function clickNewChat() {
  // Try data-icon attributes
  for (const name of ['new-chat-outline', 'new-chat', 'chat']) {
    const icon = document.querySelector(`[data-icon="${name}"]`);
    if (icon) {
      const btn = icon.closest('button, [role="button"], div[tabindex]') || icon;
      btn.click();
      await sleep(800);
      return true;
    }
  }
  // Try aria-label
  for (const el of document.querySelectorAll('[aria-label]')) {
    const label = el.getAttribute('aria-label').toLowerCase();
    if (label.includes('new chat') || label.includes('צ\'אט חדש') || label.includes('שיחה חדשה')) {
      el.click();
      await sleep(800);
      return true;
    }
  }
  return false;
}

// Find search input in the New Chat panel
function findSearchInput() {
  // Contenteditable divs near top of screen
  for (const el of document.querySelectorAll('div[contenteditable="true"]')) {
    const r = el.getBoundingClientRect();
    if (r.top > 30 && r.top < 250 && r.height > 0 && r.height < 60) {
      return { el, type: 'contenteditable' };
    }
  }
  // Regular inputs
  for (const input of document.querySelectorAll('input')) {
    const ph = (input.placeholder || '').toLowerCase();
    if (ph.includes('search') || ph.includes('חיפוש') || ph.includes('name') || ph.includes('number')) {
      const r = input.getBoundingClientRect();
      if (r.height > 0) return { el: input, type: 'input' };
    }
  }
  return null;
}

// Type text into a search field
async function typeInSearch(searchObj, text) {
  const { el, type } = searchObj;
  el.focus();
  await sleep(200);

  if (type === 'input') {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
    return el.value.includes(text.substring(0, 5));
  }

  // contenteditable
  el.focus();
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand('delete', false, null);
  el.textContent = '';
  await sleep(100);

  // Try insertText
  document.execCommand('insertText', false, text);
  await sleep(300);
  if ((el.innerText || '').includes(text.substring(0, 5))) return true;

  // Fallback: textInput event
  el.dispatchEvent(new InputEvent('textInput', {
    bubbles: true, cancelable: true, data: text, view: window
  }));
  await sleep(300);
  return (el.innerText || '').includes(text.substring(0, 5));
}

// Click the first visible contact in search results
function clickFirstContact() {
  // role=listitem contacts
  for (const item of document.querySelectorAll('div[role="listitem"]')) {
    const r = item.getBoundingClientRect();
    if (r.height > 0 && r.top > 150 && r.top < 700) {
      item.click();
      return true;
    }
  }
  // role=option
  for (const opt of document.querySelectorAll('[role="option"]')) {
    const r = opt.getBoundingClientRect();
    if (r.height > 0 && r.top > 150 && r.top < 700) {
      opt.click();
      return true;
    }
  }
  // Any clickable row with the phone number text
  for (const span of document.querySelectorAll('span[title]')) {
    const r = span.getBoundingClientRect();
    if (r.height > 0 && r.top > 150 && r.top < 700) {
      const row = span.closest('div[role="listitem"], div[role="option"], div[tabindex]');
      if (row) { row.click(); return true; }
    }
  }
  return false;
}

// Find the message compose box (bottom of chat area)
function findComposeBox() {
  let best = null;
  let bestTop = 0;
  for (const el of document.querySelectorAll('div[contenteditable="true"]')) {
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.top > 300 && r.top > bestTop) {
      best = el;
      bestTop = r.top;
    }
  }
  return best;
}

// Type message and click send
async function typeMessageAndSend(message) {
  // Wait for compose box
  let compose = null;
  for (let i = 0; i < 10; i++) {
    compose = findComposeBox();
    if (compose) break;
    await sleep(500);
  }
  if (!compose) return false;

  compose.focus();
  await sleep(200);

  // Clear
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(compose);
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand('delete', false, null);
  await sleep(100);

  // Type message - handle newlines with Shift+Enter
  const lines = message.split('\n');
  for (let j = 0; j < lines.length; j++) {
    if (lines[j]) {
      document.execCommand('insertText', false, lines[j]);
      await sleep(50);
    }
    if (j < lines.length - 1) {
      compose.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13, shiftKey: true, bubbles: true, cancelable: true
      }));
      compose.dispatchEvent(new KeyboardEvent('keypress', {
        key: 'Enter', code: 'Enter', keyCode: 13, shiftKey: true, bubbles: true, cancelable: true
      }));
      compose.dispatchEvent(new KeyboardEvent('keyup', {
        key: 'Enter', code: 'Enter', keyCode: 13, shiftKey: true, bubbles: true, cancelable: true
      }));
      await sleep(100);
    }
  }
  await sleep(500);

  // Verify something was typed
  const text = compose.innerText || '';
  if (text.length < 5) {
    console.log('[WA Sender] Message not typed properly, trying fallback...');
    compose.focus();
    compose.dispatchEvent(new InputEvent('textInput', {
      bubbles: true, cancelable: true, data: message.replace(/\n/g, ' '), view: window
    }));
    await sleep(500);
  }

  // Click send button
  await sleep(300);
  const sendIcon = document.querySelector('[data-icon="send"]');
  if (sendIcon) {
    const btn = sendIcon.closest('button, [role="button"], span') || sendIcon;
    btn.click();
    await sleep(1000);
    return true;
  }

  // Fallback: press Enter
  compose.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true
  }));
  await sleep(1000);
  return true;
}

// Go back / close the new chat panel
async function goBack() {
  for (const name of ['back', 'arrow-back', 'back-light']) {
    const icon = document.querySelector(`[data-icon="${name}"]`);
    if (icon) {
      const btn = icon.closest('button, [role="button"], span') || icon;
      btn.click();
      await sleep(500);
      return;
    }
  }
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await sleep(500);
}

// ===== MAIN =====

async function sendMessages(phones, message, delaySeconds) {
  shouldStop = false;
  const total = phones.length;
  const results = { sent: [], failed: [] };

  report('progress', { current: 0, total, text: `מתחיל... ${total} מספרים` });

  for (let i = 0; i < phones.length; i++) {
    if (shouldStop) {
      report('done', { text: `⛔ נעצר. נשלח: ${results.sent.length} | נכשל: ${results.failed.length}`, failed: results.failed });
      return;
    }

    const phone = phones[i];
    report('progress', { current: i + 1, total, text: `${i + 1}/${total}: פותח צ'אט עם ${phone}...` });

    try {
      // 1. Open New Chat
      const opened = await clickNewChat();
      if (!opened) {
        console.log('[WA Sender] ❌ Cannot open new chat');
        results.failed.push(phone);
        continue;
      }
      await sleep(1000);

      // 2. Find search input
      const searchObj = findSearchInput();
      if (!searchObj) {
        console.log('[WA Sender] ❌ Search input not found');
        results.failed.push(phone);
        await goBack();
        continue;
      }

      // 3. Type phone number
      const typed = await typeInSearch(searchObj, phone);
      if (!typed) {
        console.log('[WA Sender] ❌ Cannot type number:', phone);
        results.failed.push(phone);
        await goBack();
        continue;
      }

      // 4. Wait for search results
      await sleep(2500);

      // 5. Click on the contact
      const clicked = clickFirstContact();
      if (!clicked) {
        console.log('[WA Sender] ❌ Contact not found:', phone);
        results.failed.push(phone);
        await goBack();
        continue;
      }

      // 6. Wait for chat to open
      await sleep(2000);

      // 7. Type message and send
      const sent = await typeMessageAndSend(message);
      if (sent) {
        results.sent.push(phone);
        console.log('[WA Sender] ✅', phone);
      } else {
        results.failed.push(phone);
        console.log('[WA Sender] ❌ Send failed:', phone);
      }

      report('progress', {
        current: i + 1, total,
        text: `${i + 1}/${total}: ${phone} ${sent ? '✅' : '❌'} | נשלח: ${results.sent.length} | נכשל: ${results.failed.length}`
      });

    } catch (err) {
      console.error('[WA Sender]', phone, err);
      results.failed.push(phone);
    }

    // Delay before next
    if (i < phones.length - 1 && !shouldStop) {
      await sleep(delaySeconds * 1000);
    }
  }

  report('done', {
    text: `✅ סיום! נשלח: ${results.sent.length} | נכשל: ${results.failed.length}`,
    failed: results.failed
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'sendMessages') {
    sendMessages(msg.phones, msg.message, msg.delay);
    sendResponse({ ok: true });
  }
  if (msg.action === 'stop') {
    shouldStop = true;
    sendResponse({ ok: true });
  }
  return true;
});

console.log('[WA Sender] Content script loaded');
