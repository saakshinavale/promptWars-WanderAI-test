/* ===== LANDING PAGE - main.js ===== */

// Form interaction handlers
function selectPill(el, groupName) {
  const group = el.parentElement;
  group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('budget').value = el.dataset.value;
}

function toggleChip(el) {
  el.classList.toggle('active');
}

function step(type, delta) {
  const valueEl = document.getElementById(type + '-value');
  let val = parseInt(valueEl.textContent) + delta;
  if (val < 0) val = 0;
  if (val > 20) val = 20;
  valueEl.textContent = val;
}

// Set min date to today
function initDates() {
  const today = new Date().toISOString().split('T')[0];
  const startEl = document.getElementById('start-date');
  const endEl = document.getElementById('end-date');
  if (startEl) startEl.min = today;
  if (endEl) endEl.min = today;

  startEl?.addEventListener('change', () => {
    endEl.min = startEl.value;
    if (endEl.value && endEl.value < startEl.value) endEl.value = startEl.value;
  });
}

// Validate form
function validateForm() {
  let valid = true;

  const dest = document.getElementById('destination').value.trim();
  const destError = document.getElementById('destination-error');
  if (!dest) {
    destError.textContent = 'Please enter a destination';
    valid = false;
  } else {
    destError.textContent = '';
  }

  const start = document.getElementById('start-date').value;
  const end = document.getElementById('end-date').value;
  const dateError = document.getElementById('date-error');
  if (!start || !end) {
    dateError.textContent = 'Please select both start and end dates';
    valid = false;
  } else if (start > end) {
    dateError.textContent = 'End date must be after start date';
    valid = false;
  } else {
    dateError.textContent = '';
  }

  return valid;
}

// Gather form data
function getFormData() {
  const styles = [];
  document.querySelectorAll('.chip.active').forEach(c => styles.push(c.dataset.value));

  return {
    destination: document.getElementById('destination').value.trim(),
    startDate: document.getElementById('start-date').value,
    endDate: document.getElementById('end-date').value,
    budget: document.getElementById('budget').value,
    styles: styles,
    adults: parseInt(document.getElementById('adults-value').textContent),
    children: parseInt(document.getElementById('children-value').textContent),
    constraints: document.getElementById('constraints').value.trim()
  };
}

// Calculate trip days
function getDayCount(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1);
}

// Handle form submit
function handleSubmit(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const data = getFormData();
  const days = getDayCount(data.startDate, data.endDate);

  // Store in sessionStorage for results page
  sessionStorage.setItem('tripData', JSON.stringify({ ...data, days }));

  // Navigate to results
  window.location.href = 'results.html';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  initDates();
  const form = document.getElementById('trip-form');
  if (form) form.addEventListener('submit', handleSubmit);
});
