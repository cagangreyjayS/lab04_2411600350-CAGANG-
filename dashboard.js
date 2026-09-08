document.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'index.html';
    return;
  }

  const username = localStorage.getItem('user') || 'User';
  document.getElementById('userName').textContent = username;
  updateGreeting(username);

  DataManager.initializeData();
  populateCategories();
  setupFilters();
  setupLogout();
  renderAll();

  // Simulated asynchronous retrieval / real-time update.
  setInterval(() => {
    DataManager.simulateUpdate();
    renderAll();
    showToast('New dashboard data was received.');
  }, 30000);
});

let charts = {};

function updateGreeting(username) {
  const hour = new Date().getHours();
  const time = hour >= 5 && hour < 12 ? 'Good Morning' :
               hour < 17 ? 'Good Afternoon' :
               hour < 21 ? 'Good Evening' : 'Good Night';
  document.getElementById('greeting').textContent = `${time}, ${username}!`;
}

function populateCategories() {
  const select = document.getElementById('categoryFilter');
  DataManager.getCategories().forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function setupFilters() {
  ['searchInput', 'categoryFilter', 'statusFilter'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderAll);
    document.getElementById(id).addEventListener('change', renderAll);
  });

  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    renderAll();
  });

  document.getElementById('exportCsvBtn').addEventListener('click', exportCurrentCSV);
}

function getFilteredData() {
  return DataManager.applyFilters({
    query: document.getElementById('searchInput').value,
    category: document.getElementById('categoryFilter').value,
    status: document.getElementById('statusFilter').value
  });
}

function renderAll() {
  const data = getFilteredData();
  renderTable(data);
  renderStats();
  renderCharts(data);
  renderAlert();
  document.getElementById('resultCount').textContent = data.length;
  document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
}

function renderStats() {
  const stats = DataManager.getStatistics();
  const values = [stats.gpa, stats.courses, stats.assignments, `${stats.attendance}%`];
  const titles = ['🎓 GPA', '📚 Courses', '📝 Assignments', '📅 Attendance'];
  values.forEach((value, i) => {
    document.getElementById(`stat${i+1}-title`).textContent = titles[i];
    document.getElementById(`stat${i+1}-value`).textContent = value;
  });
}

function renderTable(data) {
  const body = document.getElementById('activityTableBody');
  const empty = document.getElementById('emptyState');
  body.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    if (item.score !== null && item.score < 90) row.classList.add('low-performance-row');
    row.innerHTML = `
      <td>${item.date}</td>
      <td>${escapeHTML(item.category)}</td>
      <td>${highlight(escapeHTML(item.activity), document.getElementById('searchInput').value)}</td>
      <td><span class="badge ${badgeClass(item.status)}">${item.status}</span></td>
      <td>${item.score ?? '—'}</td>`;
    body.appendChild(row);
  });
  empty.classList.toggle('d-none', data.length !== 0);
}

function badgeClass(status) {
  return {completed: 'bg-success', pending: 'bg-warning text-dark', overdue: 'bg-danger'}[status] || 'bg-secondary';
}

function highlight(text, query) {
  if (!query.trim()) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${safe})`, 'ig'), '<mark>$1</mark>');
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

function renderAlert() {
  const alert = document.getElementById('lowStockAlert');
  const low = DataManager.getLowPerformanceItems();
  if (!low.length) {
    alert.classList.add('d-none');
    return;
  }
  alert.classList.remove('d-none');
  alert.innerHTML = `<strong>Performance alert:</strong> ${low.length} scored activity item(s) are below 90. Review the highlighted rows.`;
}

function renderCharts(data) {
  const completed = data.filter(x => x.status === 'completed').length;
  const pending = data.filter(x => x.status === 'pending').length;
  const overdue = data.filter(x => x.status === 'overdue').length;

  const categories = [...new Set(data.map(x => x.category))];
  const categoryScores = categories.map(c => {
    const scores = data.filter(x => x.category === c && typeof x.score === 'number').map(x => x.score);
    return scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
  });

  const trend = [...data].sort((a,b) => a.date.localeCompare(b.date));
  const labels = trend.map(x => x.date.slice(5));
  const attendance = trend.map((_, i) => Math.min(100, 88 + i));

  destroyCharts();
  charts.performance = new Chart(document.getElementById('performanceChart'), {
    type: 'bar',
    data: {labels: categories, datasets: [{label: 'Average Score', data: categoryScores}]},
    options: {responsive: true, maintainAspectRatio: false, scales: {y: {beginAtZero: true, max: 100}}}
  });
  charts.assignment = new Chart(document.getElementById('assignmentChart'), {
    type: 'doughnut',
    data: {labels: ['Completed', 'Pending', 'Overdue'], datasets: [{data: [completed, pending, overdue]}]},
    options: {responsive: true, maintainAspectRatio: false}
  });
  charts.attendance = new Chart(document.getElementById('attendanceChart'), {
    type: 'line',
    data: {labels, datasets: [{label: 'Attendance %', data: attendance, tension: 0.3, fill: false}]},
    options: {responsive: true, maintainAspectRatio: false, scales: {y: {beginAtZero: false, min: 80, max: 100}}}
  });
}

function destroyCharts() {
  Object.values(charts).forEach(chart => chart.destroy());
  charts = {};
}

function exportCurrentCSV() {
  const csv = DataManager.exportToCSV(getFilteredData());
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `student_portal_export_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('CSV export completed.');
}

function showToast(message) {
  document.getElementById('toastMessage').textContent = message;
  bootstrap.Toast.getOrCreateInstance(document.getElementById('updateToast')).show();
}

function setupLogout() {
  const logout = event => {
    event.preventDefault();
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  };
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('logoutLink').addEventListener('click', logout);
}
