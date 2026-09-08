document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const feedback = document.getElementById('loginFeedback');

  if (localStorage.getItem('isLoggedIn') === 'true') {
    window.location.href = 'dashboard.html';
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
      showFeedback('Please enter both username and password.', 'danger');
      return;
    }

    if (username === 'admin' && password === 'password123') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', username);
      showFeedback('Login successful! Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 500);
    } else {
      showFeedback('Invalid username or password.', 'danger');
    }
  });

  function showFeedback(message, type) {
    feedback.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
  }
});
