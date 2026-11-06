const $ = id => document.getElementById(id);
const button = $('analyze');
chrome.storage.local.get(['bridgeToken'], data => { if (data.bridgeToken) $('token').value = data.bridgeToken; });

function extractVisiblePage() {
  const root = document.querySelector('#content') || document.querySelector('main') || document.body;
  const clone = root.cloneNode(true);
  clone.querySelectorAll('script,style,nav,footer,header,form,input,textarea,button,select,iframe,[hidden],[aria-hidden="true"],.screenreader-only').forEach(el => el.remove());
  const title = document.title.slice(0, 300);
  const text = (clone.innerText || clone.textContent || '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 24000);
  return { title, url: location.href, text };
}

button.addEventListener('click', async () => {
  button.disabled = true;
  $('status').textContent = 'Reading current page…';
  $('result').hidden = true;
  try {
    const token = $('token').value.trim();
    if (!token) throw new Error('Enter the local pairing secret first.');
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    const pageUrl = new URL(tab.url || '');
    if (pageUrl.protocol !== 'https:' || pageUrl.hostname !== 'canvas.umn.edu') {
      throw new Error('Open a page on https://canvas.umn.edu first.');
    }
    const [{result: page}] = await chrome.scripting.executeScript({target:{tabId:tab.id},func:extractVisiblePage});
    if (!page.text || page.text.length < 20) throw new Error('No readable page text found. Open an assignment or course page.');
    // No page content is stored in extension storage.
    await chrome.storage.local.set({bridgeToken:token});
    $('status').textContent = 'Asking the AI…';
    const response = await fetch('http://127.0.0.1:8765/analyze', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      body:JSON.stringify({page,task:$('task').value,question:$('question').value.slice(0,1000)})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || `Backend error ${response.status}`);
    $('result').textContent = data.answer;
    $('result').hidden = false;
    $('status').textContent = 'Done.';
  } catch (error) {
    $('status').textContent = error.message || 'Unexpected error.';
  } finally { button.disabled = false; }
});
