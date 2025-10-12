import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';

// Load .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Email configuration
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log("Email transporter configured successfully");
} else {
  console.log("Email credentials missing - email functionality disabled");
}

// Simple rule-based reply
function replyTo(text){
  const t = String(text || '').trim().toLowerCase();
  if(!t) return "Hello! Ask me anything about Mahendar's portfolio.";
  if(t.includes('hello') || t.includes('hi')) return 'Hello! How can I help you today?';
  if(t.includes('email')) return 'Email: mahendarbit21@gmail.com';
  if(t.includes('phone') || t.includes('contact')) return 'Phone: +91 9160914683';
  if(t.includes('projects') || t.includes('github')) return 'See latest projects on the site; they auto-sync from GitHub.';
  if(t.includes('resume')) return 'Download via the Resume button in the header.';
  return "Thanks for your message! I'll forward this to Mahendar.";
}

app.post('/chat', async (req, res) => {
  try{
    const { q } = req.body || {};
    const reply = replyTo(q);
    res.json({ reply });
  } catch(err){
    res.status(500).json({ reply: 'Sorry, something went wrong on the server.' });
  }
});

// Views counter (JSON-file storage)
const dataDir = path.resolve(process.cwd(), 'data');
const viewsFile = path.join(dataDir, 'views.json');

function ensureViewsFile(){
  if(!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if(!fs.existsSync(viewsFile)){
    fs.writeFileSync(viewsFile, JSON.stringify({ count: 0 }, null, 2));
  }
}

function readViews(){
  ensureViewsFile();
  try{
    const raw = fs.readFileSync(viewsFile, 'utf8');
    const json = JSON.parse(raw || '{}');
    return Number(json.count || 0);
  } catch(_err){
    return 0;
  }
}

function writeViews(count){
  ensureViewsFile();
  fs.writeFileSync(viewsFile, JSON.stringify({ count }, null, 2));
}

app.get('/views', (req, res) => {
  const count = readViews();
  res.json({ count });
});

app.post('/views', (req, res) => {
  const current = readViews();
  const next = current + 1;
  writeViews(next);
  res.json({ count: next });
});

// Test email route
app.get('/test-email', async (req, res) => {
  if (!transporter) {
    console.log('❌ Email functionality disabled - missing credentials');
    return res.status(400).send('❌ Email functionality disabled. Please set EMAIL_USER and EMAIL_PASS in .env file.');
  }
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: '✅ Test Email from Portfolio Server',
      text: 'This is a test email. Your server setup is working!',
    });
    console.log('✅ Test email sent successfully!');
    res.send('✅ Email sent successfully!');
  } catch (err) {
    console.error('❌ Test email failed:', err);
    res.status(500).send('❌ Email failed to send. Check console for details.');
  }
});

// Contact form endpoint
app.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Log the contact form submission
    console.log('Contact form submission:', {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString()
    });
    
    // Send email notification
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, // Your email
          subject: `New Contact Form Message from ${name.trim()}`,
          html: `<h2>New Contact Form Submission</h2><p><strong>Name:</strong> ${name.trim()}</p><p><strong>Email:</strong> ${email.trim()}</p><p><strong>Message:</strong></p><p>${message.trim().replace(/\n/g, '<br>')}</p><hr><p><em>Sent from your portfolio website at ${new Date().toLocaleString()}</em></p>`
        };
        
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the request if email fails, just log it
      }
    } else {
      console.log('Contact form submission received, but email notification disabled (missing credentials)');
    }
    
    res.json({ 
      success: true, 
      message: 'Thank you for your message! I\'ll get back to you soon.' 
    });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Sorry, something went wrong. Please try again later.' 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
  
  // Auto-open browser
  const portfolioPath = path.resolve(process.cwd(), '..', 'index.html');
  const browserCommand = process.platform === 'win32' 
    ? `start "" "${portfolioPath}"`
    : process.platform === 'darwin' 
    ? `open "${portfolioPath}"`
    : `xdg-open "${portfolioPath}"`;
  
  exec(browserCommand, (error) => {
    if (error) {
      console.log('Could not auto-open browser. Please manually open index.html');
    } else {
      console.log('Portfolio opened in browser!');
    }
  });
});
