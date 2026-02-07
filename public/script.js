// ======================================
// CODE WEB KHÔNG KHÓ - ZALO BOT TESTER PRO
// Fixed & Optimized 2026 - Zalo Bot Ready
// ======================================

document.addEventListener('DOMContentLoaded', function() {
  // Cache DOM elements
  const elements = {
    messageForm: document.getElementById('messageForm'),
    userId: document.getElementById('userId'),
    message: document.getElementById('message'),
    result: document.getElementById('result'),
    sendBtn: document.querySelector('#messageForm button[type="submit"]')
  };

  // Bind events
  elements.messageForm.addEventListener('submit', (e) => handleSubmit(e, elements));
  initInputs(elements);
  initKeyboardShortcuts(elements);
  initAutoResize();
  
  // Auto focus
  elements.userId.focus();
  
  console.log('🚀 Zalo Bot Tester Pro READY!');
});

// ======================================
// FORM SUBMISSION - FIXED
// ======================================
async function handleSubmit(e, elements) {
  e.preventDefault();
  
  const { userId, message, result, sendBtn } = elements;
  const userIdVal = userId.value.trim();
  const msgVal = message.value.trim();
  
  // Validation với UX tốt hơn
  if (!userIdVal) {
    shakeInput(userId);
    return showToast('Nhập User ID trước nhé! 👤', 'warning');
  }
  if (!msgVal) {
    shakeInput(message);
    return showToast('Tin nhắn không được để trống! 💬', 'warning');
  }
  
  // Loading state
  setLoading(true, sendBtn, result);
  
  try {
    const response = await fetch('/send-message', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ 
        user_id: userIdVal, 
        message: msgVal 
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      showSuccess(result, data);
      clearForm(elements);
    } else {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('Submit error:', error);
    showError(result, error.message);
  } finally {
    setLoading(false, sendBtn, result);
  }
}

// ======================================
// INPUTS & UX
// ======================================
function initInputs({ userId, message }) {
  [userId, message].forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement.classList.add('focused');
    });
    input.addEventListener('blur', () => {
      input.parentElement.classList.remove('focused');
    });
    
    input.addEventListener('input', function() {
      this.style.borderColor = this.value.trim() ? '#00d4ff' : '';
    });
  });
}

function initKeyboardShortcuts({ messageForm, userId }) {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      messageForm.dispatchEvent(new Event('submit'));
    }
    if (e.key === 'Escape') {
      userId.value = '';
      userId.focus();
    }
  });
}

function initAutoResize() {
  const textarea = document.getElementById('message');
  textarea.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
  });
}

// ======================================
// STATE MANAGEMENT
// ======================================
function setLoading(loading, btn, result) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Gửi...';
    result.innerHTML = '🔄 Đang gửi tin nhắn Zalo...';
    result.className = 'result loading';
  } else {
    btn.disabled = false;
    btn.innerHTML = 'Gửi Ngay 🚀';
    result.className = '';
  }
}

function showSuccess(result, data) {
  result.innerHTML = `
    ✅ <strong>Gửi thành công!</strong><br>
    <small>${data.user_id_used || 'User'} đã nhận tin</small>
  `;
  result.className = 'result success';
  
  // Success pulse
  result.style.transform = 'scale(1.05)';
  setTimeout(() => result.style.transform = 'scale(1)', 300);
}

function showError(result, error) {
  result.innerHTML = `
    ❌ <strong>Lỗi gửi tin</strong><br>
    <small>${error}</small>
  `;
  result.className = 'result error';
}

function shakeInput(input) {
  input.style.animation = 'shake 0.5s';
  setTimeout(() => input.style.animation = '', 500);
  input.focus();
}

function showToast(message, type = 'info') {
  // Native toast fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Zalo Bot', { body: message });
  }
}

// Clear form
function clearForm({ userId, message, result }) {
  userId.value = '';
  message.value = '';
  message.style.height = 'auto';
  result.innerHTML = '';
}

// Request notification permission
if (Notification.permission === 'default') {
  Notification.requestPermission();
}

// Global shake animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
    20%, 40%, 60%, 80% { transform: translateX(3px); }
  }
  .result { 
    padding: 1rem; border-radius: 12px; margin-top: 1rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .result.success { background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #22c55e; }
  .result.error { background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #ef4444; }
  .result.loading { background: rgba(99, 102, 241, 0.2); border: 1px solid #6366f1; color: #a5b4fc; }
  .input-group.focused { transform: translateY(-2px); }
`;
document.head.appendChild(style);
