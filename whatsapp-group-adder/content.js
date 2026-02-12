let shouldStop = false;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function report(type, data) {
  try { chrome.runtime.sendMessage({ type, ...data }); } catch(e) {}
}

// Debug: log all interactive elements so we know what we're dealing with
function debugInputs() {
  console.log('[WA Adder] === DEBUG: All interactive elements ===');
  document.querySelectorAll('input').forEach((el, i) => {
    const r = el.getBoundingClientRect();
    console.log(`[WA Adder] input[${i}]: type=${el.type} placeholder="${el.placeholder}" visible=${r.height > 0} top=${Math.round(r.top)}`);
  });
  document.querySelectorAll('[contenteditable="true"]').forEach((el, i) => {
    const r = el.getBoundingClientRect();
    console.log(`[WA Adder] editable[${i}]: tag=${el.tagName} role=${el.getAttribute('role')} data-tab=${el.getAttribute('data-tab')} top=${Math.round(r.top)} text="${el.innerText.substring(0, 20)}"`);
  });
  document.querySelectorAll('[role="textbox"]').forEach((el, i) => {
    const r = el.getBoundingClientRect();
    console.log(`[WA Adder] textbox[${i}]: tag=${el.tagName} editable=${el.contentEditable} top=${Math.round(r.top)}`);
  });
  console.log('[WA Adder] === END DEBUG ===');
}

// Find the search input in Add Member panel
function findSearchInput() {
  // 1. Look for <input> with search placeholder
  for (const input of document.querySelectorAll('input')) {
    const ph = (input.placeholder || '').toLowerCase();
    if (ph.includes('search') || ph.includes('name') || ph.includes('number') || ph.includes('חיפוש')) {
      console.log('[WA Adder] ✅ Found <input> placeholder:', input.placeholder);
      return { el: input, type: 'input' };
    }
  }

  // 2. Contenteditable with data-tab (WhatsApp uses data-tab for their inputs)
  for (const el of document.querySelectorAll('div[contenteditable="true"][data-tab]')) {
    const r = el.getBoundingClientRect();
    if (r.top < 250 && r.height > 0) {
      console.log('[WA Adder] ✅ Found contenteditable data-tab at top:', r.top);
      return { el, type: 'contenteditable' };
    }
  }

  // 3. Any role=textbox near the top
  for (const el of document.querySelectorAll('[role="textbox"]')) {
    const r = el.getBoundingClientRect();
    if (r.top < 250 && r.height > 0 && r.height < 80) {
      console.log('[WA Adder] ✅ Found textbox at top:', r.top);
      return { el, type: 'contenteditable' };
    }
  }

  return null;
}

// Type text and verify it worked
async function typeText(searchObj, text) {
  const { el, type } = searchObj;
  el.focus();
  await sleep(200);

  if (type === 'input') {
    // React native value setter
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
    
    if (el.value.includes(text.substring(0, 5))) return true;
    
    // Fallback: char by char with React setter
    setter.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    for (const ch of text) {
      setter.call(el, el.value + ch);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(20);
    }
    await sleep(200);
    return el.value.includes(text.substring(0, 5));
  } 
  
  // contenteditable - ensure it's completely empty first
  el.focus();
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand('delete', false, null);
  el.textContent = '';
  await sleep(100);

  // Try textInput event
  el.dispatchEvent(new InputEvent('textInput', {
    bubbles: true, cancelable: true, data: text, view: window
  }));
  await sleep(300);
  if ((el.innerText || '').includes(text.substring(0, 5))) return true;

  // Try execCommand
  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);
  document.execCommand('insertText', false, text);
  await sleep(300);
  if ((el.innerText || '').includes(text.substring(0, 5))) return true;

  // Try direct + input event
  el.innerText = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(300);
  return (el.innerText || '').includes(text.substring(0, 5));
}

// Clear the search input
async function clearSearch(searchObj) {
  const { el, type } = searchObj;

  // Strategy 1: Find ANY X/close icon near top of page (the search box area)
  const allIcons = document.querySelectorAll('[data-icon]');
  for (const icon of allIcons) {
    const name = icon.getAttribute('data-icon');
    const rect = icon.getBoundingClientRect();
    // X button should be near top (within search area) and have x-related name
    if (rect.top > 50 && rect.top < 250 && rect.height > 0 &&
        (name.includes('x') || name.includes('cancel') || name.includes('clear') || name.includes('close'))) {
      console.log('[WA Adder] Found X icon:', name, 'at y:', Math.round(rect.top));
      const clickable = icon.closest('[role="button"], button, span') || icon;
      clickable.click();
      await sleep(500);
      return;
    }
  }

  // Strategy 2: Find a visible × button by text near search
  const buttons = document.querySelectorAll('button, [role="button"], span');
  for (const btn of buttons) {
    const rect = btn.getBoundingClientRect();
    if (rect.top > 50 && rect.top < 250 && btn.textContent.trim() === '×') {
      btn.click();
      await sleep(500);
      return;
    }
  }

  // Strategy 3: Manual clear via select all + delete
  el.focus();
  await sleep(100);
  
  // Select all text and delete
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
  await sleep(50);
  
  // Delete selected
  document.execCommand('delete', false, null);
  await sleep(100);
  
  // Also set empty
  el.textContent = '';
  el.dispatchEvent(new InputEvent('textInput', {
    bubbles: true, cancelable: true, data: '', view: window
  }));
  el.dispatchEvent(new Event('input', { bubbles: true }));

  await sleep(400);
  console.log('[WA Adder] After clear:', JSON.stringify(el.textContent));
}

// Click the first selectable contact in results
// The "Not in your contacts" section shows contacts with a fake checkbox div
function clickFirstContact() {
  // WhatsApp's contact rows in "Add member" are clickable divs
  // Look for the contact row under search results
  const listItems = document.querySelectorAll('div[role="listitem"]');
  
  for (const item of listItems) {
    const rect = item.getBoundingClientRect();
    // Must be visible and in the contacts area (below search box, above bottom)
    if (rect.height > 0 && rect.top > 150 && rect.top < 700) {
      console.log('[WA Adder] Clicking contact row at y:', Math.round(rect.top));
      item.click();
      return true;
    }
  }

  // Fallback: try clicking any checkbox-like element  
  const cb = document.querySelector('input[type="checkbox"]');
  if (cb) { cb.click(); return true; }

  // Fallback: role=option
  const opt = document.querySelector('[role="option"]');
  if (opt) { opt.click(); return true; }

  return false;
}

// ========== MAIN ==========

async function addMembersToGroup(phones, delaySeconds) {
  shouldStop = false;
  const total = phones.length;
  const results = { added: [], not_found: [], error: [] };

  debugInputs(); // Log all elements for debugging

  const searchObj = findSearchInput();
  if (!searchObj) {
    report('done', { text: '❌ לא מצאתי שדה חיפוש. פתח "Add member" ונסה שוב. בדוק Console.' });
    return;
  }

  report('progress', { current: 0, total, text: `מתחיל (${searchObj.type})...` });

  // Test typing with first number
  console.log('[WA Adder] Testing type with first number...');
  const testTyped = await typeText(searchObj, phones[0]);
  console.log('[WA Adder] Test type result:', testTyped, '| Value:', searchObj.el.value || searchObj.el.innerText);
  
  if (!testTyped) {
    report('done', { text: '❌ לא הצלחתי להקליד בשדה. בדוק Console ושלח לי את הלוגים.' });
    return;
  }
  
  // Clear the test
  await clearSearch(searchObj);
  await sleep(500);

  for (let i = 0; i < phones.length; i++) {
    if (shouldStop) {
      report('done', { text: `⛔ נעצר. ✅${results.added.length} ❌${results.not_found.length}` });
      return;
    }

    const phone = phones[i];
    report('progress', { current: i + 1, total, text: `${i + 1}/${total}: ${phone}...` });

    try {
      // 1. Clear search
      await clearSearch(searchObj);
      await sleep(300);

      // 2. Type number
      const typed = await typeText(searchObj, phone);
      console.log(`[WA Adder] ${i + 1}/${total}: ${phone} typed=${typed}`);
      if (!typed) { results.error.push(phone); continue; }

      // 3. Wait 2 seconds for results
      await sleep(2000);

      // 4. Try to click the contact
      const clicked = clickFirstContact();
      if (clicked) {
        results.added.push(phone);
        console.log(`[WA Adder] ✅ ${phone}`);
        await sleep(500); // let the selection register
      } else {
        results.not_found.push(phone);
        console.log(`[WA Adder] ❌ ${phone}`);
      }

      report('progress', {
        current: i + 1, total,
        text: `${i + 1}/${total}: ${phone} ${clicked ? '✅' : '❌'} | ✅${results.added.length} ❌${results.not_found.length}`
      });

    } catch (err) {
      console.error('[WA Adder]', phone, err);
      results.error.push(phone);
    }

    // 5. Always clear and wait before next number
    await clearSearch(searchObj);
    if (i < phones.length - 1 && !shouldStop) {
      await sleep(delaySeconds * 1000);
    }
  }

  report('done', { text: `✅ סיום! ✅${results.added.length} ❌${results.not_found.length} ⚠️${results.error.length}. לחץ V ירוק.` });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'addMembers') {
    addMembersToGroup(msg.phones, msg.delay);
    sendResponse({ ok: true });
  }
  if (msg.action === 'stop') {
    shouldStop = true;
    sendResponse({ ok: true });
  }
  return true;
});

console.log('[WA Adder] Content script loaded');
