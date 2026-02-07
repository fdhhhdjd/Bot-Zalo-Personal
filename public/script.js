// ======================================
// CODE WEB KHÔNG KHÓ - ZALO BOT TESTER PRO
// Full Featured JavaScript 2026
// ======================================

document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const elements = {
      themeToggle: document.getElementById('themeToggle'),
      messageForm: document.getElementById('messageForm'),
      userId: document.getElementById('userId'),
      message: document.getElementById('message'),
      result: document.getElementById('result'),
      html: document.documentElement
    };
  
    // Theme Management (Dark/Light Mode)
    initTheme(elements);
    
    // Form Handler
    elements.messageForm.addEventListener('submit', handleSubmit.bind(null, elements));
    
    // Input Enhancements
    initInputs(elements);
    
    // Keyboard Shortcuts
    initKeyboardShortcuts(elements);
    
    // Auto-resize textarea
    initAutoResize();
    
    console.log('🚀 Zalo Bot Tester Pro loaded successfully!');
  });
  
  // ======================================
  // THEME MANAGEMENT
  // ======================================
  function initTheme(elements) {
    const themeToggle = elements.themeToggle;
    const html = elements.html;
    
    // Load saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
      html.classList.remove('dark');
      themeToggle.textContent = '🌙';
    } else {
      html.classList.add('dark');
      themeToggle.textContent = '☀️';
    }
    
    // Toggle handler
    themeToggle.addEventListener('click', function() {
      html.classList.toggle('dark');
      const isDark = html.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      this.textContent = isDark ? '☀️' : '🌙';
      
      // Smooth transition feedback
      this.style.transform = 'scale(0.95)';
      setTimeout(() => this.style.transform = '', 150);
    });
    
    // Listen for system theme change
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        html.classList.toggle('dark', e.matches);
        themeToggle.textContent = e.matches ? '☀️' : '🌙';
      }
    });
  }
  
  // ======================================
  // FORM SUBMISSION HANDLER
  // ======================================
  async function handleSubmit(elements, e) {
    e.preventDefault();
    
    const { userId, message, result, messageForm } = elements;
    const btn = messageForm.querySelector('button');
    const btnText = btn.querySelector('span');
    const ripple = btn.querySelector('.btn-ripple');
    
    // Validation
    if (!userId.value.trim()) {
      showNotification('Vui lòng nhập User ID!', 'error');
      userId.focus();
      return;
    }
    if (!message.value.trim()) {
      showNotification('Vui lòng nhập nội dung tin nhắn!', 'error');
      message.focus();
      return;
    }
    
    // UI Feedback - Loading State
    setLoadingState(true, btn, btnText, ripple, result);
    
    try {
      const response = await fetch('/send-message', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ 
          user_id: userId.value.trim(), 
          message: message.value.trim() 
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showSuccess(result, data);
        clearForm(elements);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (error) {
      showError(result, error.message);
    } finally {
      setLoadingState(false, btn, btnText, ripple, result);
    }
  }
  
  // ======================================
  // INPUT ENHANCEMENTS
  // ======================================
  function initInputs(elements) {
    const { userId, message } = elements;
    
    // Auto-focus first input
    userId.focus();
    
    // Input focus animations
    [userId, message].forEach(input => {
      input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'translateY(-2px)';
      });
      input.addEventListener('blur', function() {
        this.parentElement.style.transform = '';
      });
      
      // Real-time validation feedback
      input.addEventListener('input', function() {
        if (this.value.trim()) {
          this.style.borderColor = '#6366f1';
        } else {
          this.style.borderColor = 'rgba(255,255,255,0.2)';
        }
      });
    });
  }
  
  // ======================================
  // KEYBOARD SHORTCUTS
  // ======================================
  function initKeyboardShortcuts(elements) {
    document.addEventListener('keydown', function(e) {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        elements.messageForm.dispatchEvent(new Event('submit'));
      }
      
      // Escape to clear
      if (e.key === 'Escape') {
        clearForm(elements);
        elements.userId.focus();
      }
    });
  }
  
  // ======================================
  // AUTO-RESIZE TEXTAREA
  // ======================================
  function initAutoResize() {
    const textarea = document.getElementById('message');
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
  }
  
  // ======================================
  // UTILITY FUNCTIONS
  // ======================================
  function setLoadingState(loading, btn, btnText, ripple, result) {
    if (loading) {
      btn.disabled = true;
      btnText.textContent = '⏳ Đang gửi...';
      result.innerHTML = '<div class="loading">🔄 Gửi tin nhắn Zalo...</div>';
      result.className = 'result loading';
      
      // Ripple animation
      ripple.style.width = '300px';
      ripple.style.height = '300px';
    } else {
      btn.disabled = false;
      btnText.textContent = 'Gửi Ngay';
      ripple.style.width = '0';
      ripple.style.height = '0';
    }
  }
  
  function showSuccess(result, data) {
    result.innerHTML = `
      <div class="success-icon">✅</div>
      <div>Gửi thành công!</div>
      <small>Response: ${formatResponse(data.data)}</small>
    `;
    result.className = 'result success';
    
    // Success animation
    result.style.transform = 'scale(1.02)';
    setTimeout(() => result.style.transform = 'scale(1)', 200);
  }
  
  function showError(result, error) {
    result.innerHTML = `
      <div class="error-icon">❌</div>
      <div>Lỗi gửi tin nhắn</div>
      <small>${error}</small>
    `;
    result.className = 'result error';
    
    // Shake animation
    result.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => result.style.animation = '', 500);
  }
  
  function showNotification(message, type = 'info') {
    // Browser notification (optional)
    if (Notification.permission === 'granted') {
      new Notification('Zalo Bot Pro', {
        body: message,
        icon: '/logo.jpg',
        badge: type === 'success' ? '✅' : '❌'
      });
    }
  }
  
  function clearForm(elements) {
    elements.userId.value = '';
    elements.message.value = '';
    elements.result.innerHTML = '';
    elements.result.className = '';
    elements.userId.focus();
  }
  
  function formatResponse(data) {
    try {
      return JSON.stringify(data, null, 2).slice(0, 200) + '...';
    } catch {
      return 'Data received successfully';
    }
  }
  
  // Request Notification Permission
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // PWA Ready - Service Worker (Optional)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  
  // Error boundary
  window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    document.getElementById('result').innerHTML = '💥 Có lỗi xảy ra. Reload trang để tiếp tục.';
  });
  
  // ======================================
  // CSS ANIMATIONS (Inline for completeness)
  // ======================================
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    .loading { display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; }
    .success-icon, .error-icon { font-size: 2rem; margin-bottom: 0.5rem; display: block; }
  `;
  document.head.appendChild(style);
  