require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_BASE = 'https://bot.zapps.me/api';

// ✅ SEND MESSAGE (Giữ nguyên)
app.post('/send-message', async (req, res) => {
  const { user_id, message } = req.body;
  if (!user_id || !message) {
    return res.status(400).json({ error: 'Thiếu user_id hoặc message' });
  }

  try {
    const response = await axios.post(`${API_BASE}/sendMessage`, {
      token: BOT_TOKEN,
      chat_id: user_id,
      message: { text: message }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Send error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

// ✅ WEBHOOK ZALO - FIXED RAW BODY
app.post('/webhook', (req, res) => {
  let body = [];
  
  req.on('data', (chunk) => {
    body.push(chunk);
  });
  
  req.on('end', () => {
    const buffer = Buffer.concat(body);
    const data = buffer.toString();
    
    try {
      const parsed = JSON.parse(data);
      console.log('📨 ZALO WEBHOOK RAW:', data);
      console.log('🆔 USER_ID:', parsed.user_id || parsed.from_uid || parsed.sender?.id || 'Not found');
      console.log('👤 USER INFO:', parsed);
      
      // Reply auto để test
      if (parsed.user_id) {
        setTimeout(() => {
          axios.post(`${API_BASE}/sendMessage`, {
            token: BOT_TOKEN,
            chat_id: parsed.user_id,
            message: { text: '✅ Bot nhận webhook OK! UserID của bạn: ' + parsed.user_id }
          }).catch(console.error);
        }, 1000);
      }
      
      res.status(200).json({ status: 'OK' });
    } catch (e) {
      console.log('Webhook raw (not JSON):', data.slice(0, 500));
      res.status(200).json({ status: 'OK' });
    }
  });
  
  req.on('error', (err) => {
    console.error('Webhook stream error:', err);
    res.status(500).send('Error');
  });
});

// ✅ Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
  console.log(`📡 Webhook: http://localhost:${PORT}/webhook`);
  console.log(`🧪 Test UI: http://localhost:${PORT}`);
});
