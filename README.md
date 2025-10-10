# Mahendar Bhukya · Portfolio - https://portfolio-mu-virid-94.vercel.app/

A modern, professional, and responsive portfolio for Mahendar Bhukya with sections for About, Education, Projects, Skills, Achievements, and Contact. Includes light/dark mode, scroll-to-top, GitHub projects auto-load, Google Apps Script contact form, and an optional chatbot widget.

## Quick Start

1. Open `index.html` in your browser.
2. Replace assets:
   - `assets/images/personal-photo.jpg` with your photo
   - `assets/images/bit-mesra-campus.jpg` with BIT Mesra campus photo
   - `assets/resume/Mahendar_Bhukya_Resume.pdf` with your latest resume

## GitHub Projects (Auto-Load)
- Configure username in `assets/js/main.js`:
  ```js
  const GITHUB_USERNAME = 'Mahirathood';
  ```

## Contact Form via Google Apps Script
- Set the web app URL in `index.html`:
  ```html
  <script>window.GOOGLE_SCRIPT_URL = 'PASTE_YOUR_WEB_APP_URL';</script>
  ```

## Chatbot Widget
- Optional webhook: point the chat to your backend that returns `{ reply: string }`.

### Built-in Node/Express backend
- Location: `server/`
- Run:
  ```bash
  cd server
  npm install
  npm run start   # runs on http://localhost:3000
  ```
- Hook frontend to backend by adding before the closing body tag in `index.html` or in the head:
  ```html
  <script>window.CHAT_WEBHOOK = 'http://localhost:3000/chat';</script>
  ```

## Deploy
- Static site can go to GitHub Pages/Netlify/Vercel.
- Backend can be deployed to Render/Fly/Heroku, then set `window.CHAT_WEBHOOK` to the deployed URL.
- Link : https://portfolio-mu-virid-94.vercel.app/

## License
MIT
