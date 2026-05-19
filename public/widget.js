(function () {
 const API_URL = 'https://globetrotter-bot.onrender.com/chat';
  let history = [];

  const style = document.createElement('style');
  style.textContent = `
    #gt-btn {
      position:fixed; bottom:24px; right:24px; width:58px; height:58px;
      background:linear-gradient(135deg,#1a6b3c,#2d9e5f);
      border-radius:50%; cursor:pointer; display:flex;
      align-items:center; justify-content:center;
      font-size:24px; box-shadow:0 4px 20px rgba(26,107,60,0.5);
      z-index:999999; border:none; transition:transform .2s;
    }
    #gt-btn:hover { transform:scale(1.1); }
    #gt-box {
      display:none; flex-direction:column; position:fixed;
      bottom:95px; right:24px; width:320px; height:460px;
      background:#fff; border-radius:20px; overflow:hidden;
      box-shadow:0 10px 40px rgba(0,0,0,0.2);
      z-index:999999; font-family:sans-serif;
    }
    #gt-head {
      background:linear-gradient(135deg,#1a6b3c,#2d9e5f);
      padding:14px 16px; color:white;
    }
    #gt-head h4 { margin:0; font-size:15px; }
    #gt-head p {
      margin:3px 0 0; font-size:11px; opacity:.85;
      display:flex; align-items:center; gap:5px;
    }
    #gt-msgs {
      flex:1; overflow-y:auto; padding:14px;
      display:flex; flex-direction:column;
      gap:10px; background:#f8f8f8;
    }
    .gt-bot, .gt-user {
      max-width:82%; padding:10px 13px;
      border-radius:14px; font-size:13px; line-height:1.5;
    }
    .gt-bot {
      background:white; border:1px solid #eee;
      border-radius:4px 14px 14px 14px; align-self:flex-start; color:#333;
    }
    .gt-user {
      background:linear-gradient(135deg,#1a6b3c,#2d9e5f);
      color:white; border-radius:14px 14px 4px 14px; align-self:flex-end;
    }
    #gt-foot {
      padding:10px; border-top:1px solid #eee;
      display:flex; gap:8px; background:white;
    }
    #gt-in {
      flex:1; padding:9px 13px; border:1.5px solid #eee;
      border-radius:16px; font-size:13px; outline:none;
      transition:border .2s;
    }
    #gt-in:focus { border-color:#1a6b3c; }
    #gt-go {
      width:38px; height:38px;
      background:linear-gradient(135deg,#1a6b3c,#2d9e5f);
      border:none; border-radius:50%; color:white;
      font-size:16px; cursor:pointer;
    }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <button id="gt-btn">🌍</button>
    <div id="gt-box">
      <div id="gt-head">
        <h4>🗺️ Team Globetrotter</h4>
        <p>
          <span style="width:7px;height:7px;background:#7FFF00;
            border-radius:50%;display:inline-block;
            box-shadow:0 0 5px #7FFF00"></span>
          Online · Replies instantly
        </p>
      </div>
      <div id="gt-msgs">
        <div class="gt-bot">
          Hey explorer! 👋 Ask me anything about our trips to 
          Ladakh, Kashmir, Bhutan, Goa and more! 🌍
        </div>
      </div>
      <div id="gt-foot">
        <input id="gt-in" placeholder="Ask about trips, adventures..."/>
        <button id="gt-go">➤</button>
      </div>
    </div>
  `);

  document.getElementById('gt-btn').onclick = () => {
    const box = document.getElementById('gt-box');
    box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
  };

  async function send() {
    const input = document.getElementById('gt-in');
    const msgs = document.getElementById('gt-msgs');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    msgs.innerHTML += `<div class="gt-user">${text}</div>`;
    msgs.innerHTML += `<div class="gt-bot" id="gt-typing">Typing...</div>`;
    msgs.scrollTop = msgs.scrollHeight;

    history.push({ role: 'user', content: text });

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-8) })
      });
      const data = await res.json();
      document.getElementById('gt-typing')?.remove();
      msgs.innerHTML += `<div class="gt-bot">${data.reply}</div>`;
      history.push({ role: 'assistant', content: data.reply });
    } catch {
      document.getElementById('gt-typing')?.remove();
      msgs.innerHTML += `<div class="gt-bot">
        Try calling us: +91-7683045211 🙏
      </div>`;
    }

    msgs.scrollTop = msgs.scrollHeight;
  }

  document.getElementById('gt-go').onclick = send;
  document.getElementById('gt-in').onkeypress = (e) => {
    if (e.key === 'Enter') send();
  };
})();