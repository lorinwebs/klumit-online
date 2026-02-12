let shouldStop = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function report(type, data) {
  chrome.runtime.sendMessage({ type, ...data });
}

// Wait for an element to appear in the DOM
async function waitForSelector(selector, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    await sleep(300);
  }
  return null;
}

// Wait for element containing specific text
async function waitForText(selector, text, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const els = document.querySelectorAll(selector);
    for (const el of els) {
      if (el.textContent.includes(text)) return el;
    }
    await sleep(300);
  }
  return null;
}

// Click on group header to open group info
async function openGroupInfo() {
  // The group header is the clickable area at the top of the chat
  const header = document.querySelector('header span[title]');
  if (header) {
    header.click();
    await sleep(1500);
    return true;
  }
  return false;
}

// Find and click the "Add participants" / "הוסף משתתפים" button
async function clickAddParticipants() {
  // Try multiple selectors for the add participants button
  // Look for the button with the add icon in the group info panel
  await sleep(1000);
  
  // Method 1: Look for the add participants text/button in the side panel
  const spans = document.querySelectorAll('div[role="button"] span, button span');
  for (const span of spans) {
    const text = span.textContent.trim();
    if (text === 'Add participant' || text === 'הוספת משתתפים' || text === 'Add participants') {
      span.closest('div[role="button"], button').click();
      await sleep(1500);
      return true;
    }
  }

  // Method 2: Look for the icon-based add button in group info
  const addButtons = document.querySelectorAll('[data-icon="add-participant"], [data-icon="add-user"]');
  for (const btn of addButtons) {
    const clickable = btn.closest('div[role="button"], button') || btn.parentElement;
    clickable.click();
    await sleep(1500);
    return true;
  }

  // Method 3: Try finding by the contact search within group info
  const allDivs = document.querySelectorAll('div[role="button"]');
  for (const div of allDivs) {
    if (div.textContent.includes('הוסף') || div.textContent.includes('Add participant')) {
      div.click();
      await sleep(1500);
      return true;
    }
  }

  return false;
}

// Type a phone number in the search box and select the result
async function searchAndSelectContact(phone) {
  // Find the search input in the add participants dialog
  const searchInput = document.querySelector(
    'div[contenteditable="true"][data-tab]'
  ) || document.querySelector(
    'input[type="text"][placeholder]'
  ) || document.querySelector(
    '[role="textbox"]'
  );
  
  if (!searchInput) {
    // Try to find any editable field in the current modal/panel
    const editables = document.querySelectorAll('[contenteditable="true"]');
    if (editables.length === 0) return 'no_input';
    // Use the last one (usually the search in the modal)
    const input = editables[editables.length - 1];
    return await typeAndSelect(input, phone);
  }
  
  return await typeAndSelect(searchInput, phone);
}

async function typeAndSelect(input, phone) {
  // Format phone with + prefix
  const formattedPhone = phone.startsWith('+') ? phone : '+' + phone;
  
  // Clear existing text
  input.focus();
  input.textContent = '';
  
  // Use execCommand for WhatsApp's React-based input
  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);
  
  // Type the phone number
  document.execCommand('insertText', false, formattedPhone);
  
  // Dispatch input event
  input.dispatchEvent(new Event('input', { bubbles: true }));
  
  await sleep(2000); // Wait for search results
  
  // Check if "No contacts found" message appears
  const noResult = document.querySelector('[class*="no-results"]');
  if (noResult) return 'not_found';

  // Check for various "not found" text patterns
  const allText = document.body.innerText;
  
  // Look for the search result and click it
  // WhatsApp shows matching contacts in a list
  const results = document.querySelectorAll(
    'div[role="listitem"], div[role="option"], div._ajv6, div[data-testid="cell-frame-container"]'
  );
  
  if (results.length > 0) {
    // Click the first result
    results[0].click();
    await sleep(500);
    
    // Clear the search for next number
    input.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(500);
    
    return 'added';
  }
  
  // If no clickable result, the contact might not exist on WhatsApp
  // Clear and move on
  input.focus();
  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(500);
  
  return 'not_found';
}

// Click the confirm/checkmark button to finalize adding
async function clickConfirm() {
  // Look for the green checkmark / confirm button
  const confirmBtn = document.querySelector(
    '[data-icon="checkmark-large"], [data-icon="checkmark"], span[data-icon="check"]'
  );
  if (confirmBtn) {
    const clickable = confirmBtn.closest('div[role="button"], button') || confirmBtn.parentElement;
    clickable.click();
    await sleep(2000);
    return true;
  }
  
  // Try finding a confirm button by role
  const buttons = document.querySelectorAll('div[role="button"]');
  for (const btn of buttons) {
    const icon = btn.querySelector('[data-icon]');
    if (icon) {
      const iconName = icon.getAttribute('data-icon');
      if (iconName && iconName.includes('check')) {
        btn.click();
        await sleep(2000);
        return true;
      }
    }
  }
  
  return false;
}

// Close the group info / side panel
async function closePanel() {
  const closeBtn = document.querySelector(
    '[data-icon="x"], [data-icon="x-alt"]'
  );
  if (closeBtn) {
    const clickable = closeBtn.closest('div[role="button"], button') || closeBtn.parentElement;
    clickable.click();
    await sleep(500);
  }
}

// Main flow
async function addMembersToGroup(phones, delaySeconds) {
  shouldStop = false;
  const total = phones.length;
  const results = { added: [], not_found: [], error: [] };

  report('progress', { current: 0, total, text: 'פותח מידע על הקבוצה...' });

  // Step 1: Open group info
  const infoOpened = await openGroupInfo();
  if (!infoOpened) {
    report('done', { text: '❌ לא הצלחתי לפתוח את מידע הקבוצה. ודא שאתה בצ\'אט של הקבוצה.' });
    return;
  }

  // Step 2: Click "Add participants"
  const addClicked = await clickAddParticipants();
  if (!addClicked) {
    report('done', { text: '❌ לא מצאתי את כפתור "הוסף משתתפים". ודא שיש לך הרשאת אדמין.' });
    return;
  }

  // Step 3: Loop through phone numbers
  for (let i = 0; i < phones.length; i++) {
    if (shouldStop) {
      report('done', { 
        text: `⛔ נעצר. נוספו: ${results.added.length}, לא נמצאו: ${results.not_found.length}, שגיאות: ${results.error.length}` 
      });
      return;
    }

    const phone = phones[i];
    report('progress', { 
      current: i + 1, 
      total, 
      text: `מוסיף ${i + 1}/${total}: +${phone}` 
    });

    try {
      const result = await searchAndSelectContact(phone);
      results[result === 'added' ? 'added' : 'not_found'].push(phone);
      
      report('progress', { 
        current: i + 1, 
        total, 
        text: `${i + 1}/${total} | +${phone}: ${result === 'added' ? '✅' : '❌ לא נמצא'} | סה"כ ✅${results.added.length} ❌${results.not_found.length}` 
      });
    } catch (err) {
      results.error.push(phone);
      report('progress', { 
        current: i + 1, 
        total, 
        text: `${i + 1}/${total} | +${phone}: ⚠️ שגיאה` 
      });
    }

    // Delay between numbers
    if (i < phones.length - 1 && !shouldStop) {
      await sleep(delaySeconds * 1000);
    }
  }

  // Step 4: Click the confirm button to add all selected contacts
  report('progress', { current: total, total, text: 'לוחץ אישור...' });
  await clickConfirm();

  // Handle the "Add to group?" confirmation dialog if it appears
  await sleep(1000);
  const addGroupBtn = await waitForText('div[role="button"], button', 'Add', 3000) 
    || await waitForText('div[role="button"], button', 'הוסף', 3000);
  if (addGroupBtn) {
    addGroupBtn.click();
    await sleep(2000);
  }

  report('done', { 
    text: `✅ הסתיים! נוספו: ${results.added.length}, לא נמצאו: ${results.not_found.length}, שגיאות: ${results.error.length}` 
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'addMembers') {
    addMembersToGroup(msg.phones, msg.delay);
  }
  if (msg.action === 'stop') {
    shouldStop = true;
  }
});
