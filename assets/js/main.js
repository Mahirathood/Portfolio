(function(){
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const scrollTopBtn = document.getElementById('scrollTop');
  const yearEl = document.getElementById('year');
  const viewCounter = document.getElementById('viewCounter');
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  // Config
  const GITHUB_USERNAME = 'Mahirathood'; // change to your GitHub username if needed
  const MAX_REPOS = 6; // how many to show
  const CHAT_WEBHOOK = window.CHAT_WEBHOOK || ''; // optional backend endpoint

  // Persisted theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if(savedTheme === 'light'){
    root.classList.add('light');
    if(themeToggle) themeToggle.textContent = '🌙';
  } else {
    root.classList.remove('light');
    if(themeToggle) themeToggle.textContent = '🌞';
  }

  // Toggle theme
  themeToggle && themeToggle.addEventListener('click', () => {
    const isLight = root.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeToggle.textContent = isLight ? '🌙' : '🌞';
  });

  // Mobile nav toggle
  if(navToggle && navMenu){
    navToggle.addEventListener('click', () => {
      const willShow = !navMenu.classList.contains('show');
      navMenu.classList.toggle('show', willShow);
      navToggle.setAttribute('aria-expanded', String(willShow));
    });

    // Hide on link click (mobile)
    navMenu.addEventListener('click', (e) => {
      const target = e.target;
      if(target.tagName === 'A'){
        navMenu.classList.remove('show');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Scroll to top button
  const onScroll = () => {
    if(window.scrollY > 300){
      scrollTopBtn.classList.add('show');
    } else {
      scrollTopBtn.classList.remove('show');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  scrollTopBtn && scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Set year
  if(yearEl){ yearEl.textContent = String(new Date().getFullYear()); }

  // Increment and load profile views
  (async function loadViews(){
    if(!viewCounter) return;
    try{
      const base = 'http://localhost:3000';
      await fetch(base + '/views', { method: 'POST' });
      const res = await fetch(base + '/views');
      const data = await res.json();
      const count = Number(data.count || 0);
      viewCounter.textContent = `Profile views: ${count}`;
    } catch(_err){
      // silent fail
    }
  })();

  // Populate Projects from GitHub
  (async function loadRepos(){
    const grid = document.getElementById('projectsGrid');
    const status = document.getElementById('projectsStatus');
    if(!grid) return;
    try{
      const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`);
      if(!res.ok) throw new Error('GitHub API request failed');
      /** @type {Array<any>} */
      const repos = await res.json();
      const filtered = repos
        .filter(r => !r.private && !r.fork && !r.archived)
        .sort((a,b) => new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, MAX_REPOS);

      if(filtered.length === 0){
        if(status) status.textContent = 'No public repositories found.';
        return;
      }

      grid.innerHTML = '';
      if(status) status.textContent = '';

      for(const repo of filtered){
        const description = repo.description || 'No description provided.';
        const language = repo.language || '';
        const homepage = repo.homepage ? `<a class="btn btn-ghost" href="${repo.homepage}" target="_blank" rel="noopener">Live</a>` : '';
        const card = document.createElement('article');
        card.className = 'card project-card';
        card.innerHTML = `
          <div class="card-body">
            <h3 class="card-title">${repo.name}</h3>
            <p class="card-text">${escapeHtml(description)}</p>
            <p class="tech">${escapeHtml(language)}${language ? ' · ' : ''}⭐ ${repo.stargazers_count} · ⑂ ${repo.forks_count}</p>
          </div>
          <div class="card-actions">
            <a class="btn btn-ghost" href="${repo.html_url}" target="_blank" rel="noopener">GitHub</a>
            ${homepage}
          </div>`;
        grid.appendChild(card);
      }
    } catch(err){
      if(status) status.textContent = 'Failed to load repositories. Please try again later.';
      // eslint-disable-next-line no-console
      console.error(err);
    }
  })();

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
  }

  // Contact form (Node.js backend)
  contactForm && contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot
    if(data.get('website')){ return; }

    const name = data.get('name');
    const email = data.get('email');
    const message = data.get('message');

    if(!name || !email || !message){
      formStatus.textContent = 'Please fill out all fields.';
      formStatus.className = 'error';
      return;
    }

    formStatus.textContent = 'Sending your message...';
    formStatus.className = 'sending';

    try{
      const resp = await fetch('http://localhost:3000/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim()
        })
      });
      
      const result = await resp.json();
      
      if (result.success) {
        formStatus.textContent = '✅ Message sent successfully! I\'ll get back to you soon.';
        formStatus.className = 'success';
        form.reset();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          formStatus.textContent = '';
          formStatus.className = '';
        }, 5000);
      } else {
        formStatus.textContent = '❌ ' + (result.message || 'Failed to send. Please try again later.');
        formStatus.className = 'error';
      }
    } catch(err){
      formStatus.textContent = '❌ Failed to send. Please check your connection and try again.';
      formStatus.className = 'error';
      console.error('Contact form error:', err);
    }
  });

  // Chatbot
  const chatToggle = document.getElementById('chatToggle');
  const chatWidget = document.getElementById('chatWidget');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatText');
  const chatClose = document.getElementById('chatClose');

  function setChatOpen(open){
    if(!chatWidget) return;
    chatWidget.classList.toggle('open', !!open);
    chatWidget.setAttribute('aria-hidden', open ? 'false' : 'true');
    if(chatToggle){
      chatToggle.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');
      chatToggle.setAttribute('aria-expanded', String(!!open));
      chatToggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-message"></i>';
    }
    if(open){
      if(chatMessages && !chatMessages.dataset.boot){
        pushMessage("Hi! I'm Mahendar's assistant. Ask me anything.", 'bot');
        chatMessages.dataset.boot = '1';
      }
      chatInput && chatInput.focus();
      document.addEventListener('keydown', onEsc);
      document.addEventListener('pointerdown', onOutsidePointerDown, true);
    } else {
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('pointerdown', onOutsidePointerDown, true);
    }
  }

  function onEsc(e){ if(e.key === 'Escape'){ setChatOpen(false); } }
  function onOutsidePointerDown(e){
    if(!chatWidget || chatWidget.hidden) return;
    const target = e.target;
    const clickedInsideWidget = chatWidget.contains(target);
    const clickedToggle = chatToggle && chatToggle.contains(target);
    if(!clickedInsideWidget && !clickedToggle){
      setChatOpen(false);
    }
  }

  // Prevent inside clicks from bubbling to the document handler
  chatWidget && chatWidget.addEventListener('click', (e) => { e.stopPropagation(); });

  function pushMessage(text, who){
    if(!chatMessages) return;
    const div = document.createElement('div');
    div.className = `chat-msg ${who}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function botReplyTo(q){
    const t = q.trim().toLowerCase();
    if(t.includes('hello') || t.includes('hi')) return 'Hello! How can I help you today?';
    if(t.includes('email')) return 'You can email me at mahendarbit21@gmail.com';
    if(t.includes('phone') || t.includes('contact')) return 'Phone: +91 9160914683';
    if(t.includes('projects') || t.includes('github')) return 'You can see my latest public projects in the Projects section (auto-fetched from GitHub).';
    if(t.includes('resume')) return 'Use the Download Resume button in the header.';
    return "Thanks for your message! I'll get back to you soon.";
  }

  chatToggle && chatToggle.addEventListener('click', () => {
    const isOpen = chatWidget && chatWidget.classList.contains('open');
    setChatOpen(!isOpen);
  });
  chatClose && chatClose.addEventListener('click', () => setChatOpen(false));

  chatForm && chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if(!text) return;
    pushMessage(text, 'user');
    chatInput.value = '';

    if(CHAT_WEBHOOK){
      try{
        const resp = await fetch(CHAT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: text })
        });
        const data = await resp.json();
        pushMessage(String(data.reply || botReplyTo(text)), 'bot');
        return;
      } catch(_err){
        // fallthrough to local reply
      }
    }
    pushMessage(botReplyTo(text), 'bot');
  });
})();
