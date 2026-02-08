require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(express.static('public'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const BOT_TOKEN = process.env.BOT_TOKEN;

/**
 * ✅ SEND MESSAGE ROUTE
 * Sends a text message to a specific user_id
 */
app.post('/send-message', async (req, res) => {
  const { user_id, message } = req.body;
  
  console.log('📤 Sending to:', user_id);
  
  // Validation: Check for required fields
  if (!user_id || !message) {
    return res.status(400).json({ error: 'Missing user_id or message' });
  }

  try {
    // Correct Zalo Bot API endpoint
    const sendUrl = `https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`;
    
    const response = await axios.post(sendUrl, {
      chat_id: user_id,
      text: message  // Simplified message format
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
      error: 'Zalo API 500 - Invalid user_id or bot hasn\'t interacted with this user yet',
      user_id: user_id,
      fix: '1. Send "hello" from Zalo to the Bot → 2. Use the updated user_id'
    });
  }
});


/**
 * 🆕 GET UPDATES ROUTE
 * Fetches messages and user IDs from the bot (Long Polling)
 */
app.get('/get-updates', async (req, res) => {
  const { offset } = req.query;
  
  try {
    console.log('📨 Fetching updates...', { offset });
    
    const response = await axios.post(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/getUpdates`, {
      timeout: 30000,
      ...(offset && { offset: parseInt(offset) })
    });
    
    console.log('📄 Raw response:', JSON.stringify(response.data, null, 2).slice(0, 500));
    
    // SAFE PARSING according to Zalo documentation
    const apiResult = response.data;
    if (!apiResult.ok) {
      throw new Error(apiResult.description || 'API returned not OK');
    }
    
    // Ensure the result is an array before processing
    const updates = Array.isArray(apiResult.result) ? apiResult.result : [];
    
    console.log(`✅ ${updates.length} updates retrieved successfully`);
    
    // Process updates to extract unique user information
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
        console.warn('Error parsing individual update:', e);
      }
    });
    
    res.json({
      success: true,
      ok: apiResult.ok,
      total_updates: updates.length,
      users: Object.values(users),
      // Calculate next_offset to avoid duplicate messages in next call
      next_offset: updates.length ? (updates[updates.length - 1].update_id || 0) + 1 : parseInt(offset) || 0,
      raw_result_length: Array.isArray(apiResult.result) ? apiResult.result.length : 'not an array'
    });
    
  } catch (error) {
    console.error('❌ Full error detail:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(500).json({
      error: true,
      message: error.message,
      details: error.response?.data?.description || 'Unknown server error'
    });
  }
});


/**
 * ✅ Health Check
 * Basic endpoint to verify server status
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🧪 Test UI: http://localhost:${PORT}`);
});