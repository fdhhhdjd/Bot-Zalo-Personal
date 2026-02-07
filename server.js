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

// ✅ SEND MESSAGE (Giữ nguyên)
app.post('/send-message', async (req, res) => {
  const { user_id, message } = req.body;
  
  console.log('📤 Sending to:', user_id);
  
  if (!user_id || !message) {
    return res.status(400).json({ error: 'Thiếu user_id/message' });
  }

  try {
    // ✅ Zalo Bot API endpoint đúng
    const sendUrl = `https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await axios.post(sendUrl, {
      chat_id: user_id,
      text: message  // Format đơn giản hơn
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ SUCCESS:', response.data);
    res.json({ success: true, data: response.data });
    
  } catch (error) {
    console.error('❌ ERROR:', {
      status: error.response?.status,
      data: error.response?.data?.toString().slice(0, 200),
      url: 'bot-api.zaloplatforms.com/sendMessage'
    });
    
    res.status(500).json({ 
      error: 'Zalo API 500 - user_id sai hoặc bot chưa chat user này',
      user_id: user_id,
      fix: '1. Chat "hello" từ Zalo → 2. Dùng user_id mới'
    });
  }
});


// 🆕 GET UPDATES - Lấy tin nhắn + user_id từ bot
app.get('/get-updates', async (req, res) => {
  const { offset } = req.query;
  
  try {
    console.log('📨 Fetching updates...', { offset });
    
    const response = await axios.post(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/getUpdates`, {
      timeout: 30000,
      ...(offset && { offset: parseInt(offset) })
    });
    
    console.log('📄 Raw response:', JSON.stringify(response.data, null, 2).slice(0, 500));
    
    // ✅ SAFE PARSING theo Zalo docs
    const apiResult = response.data;
    if (!apiResult.ok) {
      throw new Error(apiResult.description || 'API not OK');
    }
    
    // Fix: Kiểm tra result là array
    const updates = Array.isArray(apiResult.result) ? apiResult.result : [];
    
    console.log(`✅ ${updates.length} updates OK`);
    
    // ✅ SAFE forEach với array check
    const users = {};
    updates.forEach((update, index) => {
      try {
        const msg = update.message;
        if (msg && typeof msg === 'object') {
          const userId = msg.chat?.id?.toString() || msg.from?.id?.toString();
          const userName = msg.from?.first_name || msg.chat?.title || `User #${index}`;
          
          if (userId) {
            users[userId] = { 
              user_id: userId, 
              user_name: userName, 
              last_message: (msg.text || '').slice(0, 100),
              date: msg.date 
            };
          }
        }
      } catch (e) {
        console.warn('Parse update error:', e);
      }
    });
    
    res.json({
      success: true,
      ok: apiResult.ok,
      total_updates: updates.length,
      users: Object.values(users),
      next_offset: updates.length ? (updates[updates.length - 1].update_id || 0) + 1 : parseInt(offset) || 0,
      raw_result_length: Array.isArray(apiResult.result) ? apiResult.result.length : 'not array'
    });
    
  } catch (error) {
    console.error('❌ Full error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(500).json({
      error: true,
      message: error.message,
      details: error.response?.data?.description || 'Unknown error'
    });
  }
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
