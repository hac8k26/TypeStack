(function () {
  const SYSTEM_PROMPT = `You are a helpful assistant for TypeStack, a free font and icon library website.
TypeStack lets users preview 1000+ Google Fonts, copy CSS snippets, download fonts, and browse Lucide icons.
Answer questions about fonts, icons, how to use the site, CSS usage, licensing, and general typography.
Keep answers concise and friendly. If asked something unrelated to TypeStack or web development, politely redirect.`;

  // --- Inject styles ---
  const style = document.createElement('style');
  style.textContent = `
    #ts-chat-btn {
      position: fixed; bottom: 24px; left: 24px; z-index: 998;
      width: 44px; height: 44px; border-radius: 50%;
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.8); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    }
    #ts-chat-btn:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.25); color: #fff; }
    #ts-chat-btn .ts-notif {
      position: absolute; top: -3px; right: -3px;
      width: 10px; height: 10px; border-radius: 50%;
      background: #818cf8; border: 2px solid #07080f;
    }
    #ts-chat-box {
      position: fixed; bottom: 80px; left: 24px; z-index: 998;
      width: 300px; height: 420px;
      background: rgba(10,10,18,0.97); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; display: flex; flex-direction: column;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
      font-family: 'Inter', sans-serif; overflow: hidden;
      transform: scale(0.95) translateY(8px); opacity: 0;
      transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); pointer-events: none;
    }
    #ts-chat-box.open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }
    #ts-chat-header {
      padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex; align-items: center; justify-content: space-between;
    }
    #ts-chat-header .ts-title { display: flex; align-items: center; gap: 9px; }
    #ts-chat-header .ts-avatar {
      width: 28px; height: 28px; border-radius: 8px;
      background: transparent;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    #ts-chat-header h4 { font-size: 13px; font-weight: 600; color: #fff; margin: 0; }
    #ts-chat-header p { font-size: 10px; color: rgba(255,255,255,0.35); margin: 0; }
    #ts-chat-close {
      background: none; border: none; color: rgba(255,255,255,0.35);
      cursor: pointer; padding: 4px; border-radius: 6px; transition: all 0.15s;
      display: flex; align-items: center;
    }
    #ts-chat-close:hover { color: #fff; background: rgba(255,255,255,0.07); }
    #ts-chat-messages {
      flex: 1; overflow-y: auto; padding: 14px 14px 8px;
      display: flex; flex-direction: column; gap: 10px;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
      min-height: 0;
    }
    .ts-bubble {
      padding: 9px 13px; border-radius: 12px; font-size: 12.5px; line-height: 1.6;
      word-break: break-word; white-space: pre-wrap; overflow-wrap: anywhere;
    }
    .ts-msg { display: flex; flex-direction: column; gap: 3px; max-width: 88%; }
    .ts-msg.user { align-self: flex-end; align-items: flex-end; }
    .ts-msg.bot  { align-self: flex-start; align-items: flex-start; }
    .ts-msg.user .ts-bubble { background: rgba(255,255,255,0.1); color: #fff; border-radius: 12px 12px 3px 12px; }
    .ts-msg.bot  .ts-bubble { background: rgba(129,140,248,0.12); color: rgba(255,255,255,0.85); border: 1px solid rgba(129,140,248,0.15); border-radius: 12px 12px 12px 3px; }
    .ts-typing span {
      display: inline-block; width: 5px; height: 5px; border-radius: 50%;
      background: rgba(255,255,255,0.4); margin: 0 1.5px;
      animation: ts-bounce 1.2s infinite;
    }
    .ts-typing span:nth-child(2) { animation-delay: 0.2s; }
    .ts-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes ts-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
    #ts-chat-footer {
      padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.07);
      display: flex; gap: 8px; align-items: flex-end;
    }
    #ts-chat-input {
      flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px; padding: 9px 12px; color: #fff; font-size: 12.5px;
      font-family: 'Inter', sans-serif; outline: none; resize: none;
      max-height: 80px; line-height: 1.5; transition: border-color 0.2s;
    }
    #ts-chat-input::placeholder { color: rgba(255,255,255,0.25); }
    #ts-chat-input:focus { border-color: rgba(129,140,248,0.4); }
    #ts-chat-send {
      width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
      background: #fff; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; color: #0f172a;
    }
    #ts-chat-send:hover { background: #e2e8f0; }
    #ts-chat-send:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.2); cursor: not-allowed; }
    @media (max-width: 400px) {
      #ts-chat-box { width: calc(100vw - 32px); left: 16px; bottom: 116px; }
      #ts-chat-btn { left: 16px; }
    }
  `;
  document.head.appendChild(style);

  // --- Inject HTML ---
  document.body.insertAdjacentHTML('beforeend', `
    <button id="ts-chat-btn" aria-label="Open TypeStack assistant">
      <span class="ts-notif"></span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>
    <div id="ts-chat-box" role="dialog" aria-label="TypeStack Assistant">
      <div id="ts-chat-header">
        <div class="ts-title">
          <div class="ts-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28">
              <rect width="32" height="32" rx="8" fill="#0a0a0f"/>
              <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
              <circle cx="7.5" cy="22" r="2" fill="#ffffff"/>
              <rect x="12" y="9" width="14" height="2.2" rx="1.1" fill="#ffffff"/>
              <rect x="17.9" y="9" width="2.2" height="13.5" rx="1.1" fill="#ffffff"/>
            </svg>
          </div>
          <div>
            <h4>TypeStack</h4>
            <p>Ask me anything about fonts &amp; icons</p>
          </div>
        </div>
        <button id="ts-chat-close" aria-label="Close chat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div id="ts-chat-messages"></div>
      <div id="ts-chat-footer">
        <textarea id="ts-chat-input" placeholder="Ask about fonts, icons, CSS…" rows="1"></textarea>
        <button id="ts-chat-send" aria-label="Send">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `);

  // --- State ---
  const API_KEY = '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';
  const history = [{ role: 'system', content: SYSTEM_PROMPT }];
  let open = false, loading = false;

  const box    = document.getElementById('ts-chat-box');
  const btn    = document.getElementById('ts-chat-btn');
  const close  = document.getElementById('ts-chat-close');
  const msgs   = document.getElementById('ts-chat-messages');
  const input  = document.getElementById('ts-chat-input');
  const send   = document.getElementById('ts-chat-send');

  // --- Helpers ---
  function addMsg(role, text) {
    const wrap = document.createElement('div');
    wrap.className = `ts-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'ts-bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return bubble;
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'ts-msg bot'; wrap.id = 'ts-typing-indicator';
    wrap.innerHTML = '<div class="ts-bubble ts-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('ts-typing-indicator');
    if (el) el.remove();
  }

  async function ask(userText) {
    if (loading || !userText.trim()) return;
    loading = true; send.disabled = true;
    addMsg('user', userText);
    history.push({ role: 'user', content: userText });
    showTyping();

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`, 'HTTP-Referer': window.location.origin, 'X-Title': 'TypeStack' },
        body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages: history, max_tokens: 400, temperature: 0.7 })
      });
      const data = await res.json();
      removeTyping();
      if (!res.ok) {
        const errMsg = data.error?.message || `API error ${res.status}`;
        if (res.status === 401) addMsg('bot', 'Invalid API key. Please update the key in chatbot.js.');
        else if (res.status === 429) addMsg('bot', 'Rate limit reached. Please wait a moment and try again.');
        else addMsg('bot', `Error: ${errMsg}`);
      } else if (data.choices && data.choices[0]) {
        const reply = data.choices[0].message.content.trim();
        history.push({ role: 'assistant', content: reply });
        addMsg('bot', reply);
      } else {
        addMsg('bot', 'Unexpected response from API. Please try again.');
      }
    } catch (err) {
      removeTyping();
      addMsg('bot', 'Network error — check your internet connection and try again.');
    }

    loading = false; send.disabled = false;
    input.focus();
  }

  // --- Events ---
  btn.addEventListener('click', () => {
    open = !open;
    box.classList.toggle('open', open);
    btn.querySelector('.ts-notif').style.display = open ? 'none' : '';
    if (open && msgs.children.length === 0) {
      addMsg('bot', 'Hi! Ask me anything about TypeStack — fonts, icons, CSS usage, or how to use the site.');
      // FAQ chips
      const faqs = [
        'How do I copy a font CSS?',
        'How do I download a font?',
        'Are the fonts free to use?',
        'How do I use an icon?',
        'What fonts are available?',
      ];
      const chipWrap = document.createElement('div');
      chipWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;';
      faqs.forEach(q => {
        const chip = document.createElement('button');
        chip.textContent = q;
        chip.style.cssText = 'padding:5px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);font-size:11px;font-family:Inter,sans-serif;cursor:pointer;transition:all 0.15s;white-space:nowrap;';
        chip.onmouseover = () => { chip.style.background='rgba(255,255,255,0.1)'; chip.style.color='#fff'; };
        chip.onmouseout  = () => { chip.style.background='rgba(255,255,255,0.05)'; chip.style.color='rgba(255,255,255,0.6)'; };
        chip.onclick = () => { chipWrap.remove(); ask(q); };
        chipWrap.appendChild(chip);
      });
      msgs.appendChild(chipWrap);
      msgs.scrollTop = msgs.scrollHeight;
    }
    if (open) input.focus();
  });

  close.addEventListener('click', () => { open = false; box.classList.remove('open'); });

  send.addEventListener('click', () => { ask(input.value); input.value = ''; input.style.height = 'auto'; });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); ask(input.value); input.value = ''; input.style.height = 'auto';
    }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });
})();
