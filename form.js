/* ==================== KONFIGURASI ==================== */
var API_URL = 'https://script.google.com/macros/s/AKfycbxNTnU71lz-0LQ1cY5fwWmc2OwVICzZ37BLIwtZMx7e45Emt3iXhIWYUwbbZe0C0k7C/exec';

/* ==================== API HELPER ==================== */
async function api(action, params) {
  params = params || {};
  var url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.keys(params).forEach(function (k) {
    if (params[k] !== undefined && params[k] !== null) {
      url.searchParams.set(k, params[k]);
    }
  });
  try {
    var res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: 'Gagal menghubungi server' };
  }
}

/* ==================== UTIL ==================== */
function showMessage(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = 'message ' + (type || '');
}

function getCurrentUser() {
  var raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

/* ==================== DETEKSI HALAMAN ==================== */
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('login-form')) initLoginPage();
  if (document.getElementById('artikel-form')) initTulisPage();
});

/* ==================== LOGIN PAGE ==================== */
function initLoginPage() {
  var form = document.getElementById('login-form');
  form.addEventListener('submit', handleLogin);

  // Kalau sudah login, langsung alihkan
  var user = getCurrentUser();
  if (user) {
    location.href = 'tulis.html';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('email').value.trim().toLowerCase();
  var msg = document.getElementById('message');
  var btn = document.getElementById('btn-login');

  if (!email) return showMessage(msg, 'Masukkan email dulu.', 'error');

  btn.disabled = true;
  btn.textContent = 'Memproses...';
  showMessage(msg, '', '');

  var res = await api('login', { email: email });

  btn.disabled = false;
  btn.textContent = 'Masuk';

  if (!res.success) {
    return showMessage(msg, res.message || 'Login gagal.', 'error');
  }

  localStorage.setItem('user', JSON.stringify(res.user));
  showMessage(msg, 'Login berhasil! Mengalihkan...', 'success');
  setTimeout(function () { location.href = 'tulis.html'; }, 700);
}

/* ==================== TULIS PAGE ==================== */
async function initTulisPage() {
  var user = getCurrentUser();
  if (!user) {
    location.href = 'login.html';
    return;
  }

  // Tampilkan nama user
  document.getElementById('user-name').textContent = user.nama_lengkap || user.email;

  // Logout
  document.getElementById('btn-logout').addEventListener('click', function () {
    localStorage.removeItem('user');
    location.href = 'index.html';
  });

  // Isi dropdown kategori dari API
  await loadKategoriDropdown();

  // Auto-generate slug dari judul
  var judulEl = document.getElementById('judul');
  var slugEl = document.getElementById('slug');
  var slugManual = false;

  slugEl.addEventListener('input', function () { slugManual = true; });

  judulEl.addEventListener('input', function () {
    var count = document.getElementById('judul-count');
    if (count) count.textContent = judulEl.value.length;
    if (!slugManual) {
      slugEl.value = slugify(judulEl.value);
    }
  });

  // Counter ringkasan
  var ringkasanEl = document.getElementById('ringkasan');
  ringkasanEl.addEventListener('input', function () {
    document.getElementById('ringkasan-count').textContent = ringkasanEl.value.length;
  });

  // Submit
  document.getElementById('artikel-form').addEventListener('submit', function (e) {
    submitArtikel(e, user);
  });
}

async function loadKategoriDropdown() {
  var res = await api('list_kategori');
  var select = document.getElementById('id_kategori');
  if (!res.success) return;
  res.data.forEach(function (k) {
    var opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = k.nama;
    select.appendChild(opt);
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

async function submitArtikel(e, user) {
  e.preventDefault();
  var msg = document.getElementById('form-message');
  var btn = document.getElementById('btn-submit');

  var data = {
    slug: document.getElementById('slug').value.trim(),
    judul: document.getElementById('judul').value.trim(),
    ringkasan: document.getElementById('ringkasan').value.trim(),
    isi: document.getElementById('isi').value.trim(),
    id_kategori: document.getElementById('id_kategori').value,
    tags: document.getElementById('tags').value.trim(),
    thumbnail_url: document.getElementById('thumbnail_url').value.trim(),
    id_penulis: user.id,
    status: document.getElementById('langsung_tayang').checked ? 'published' : 'draft'
  };

  // Validasi
  if (!data.judul || !data.slug || !data.isi || !data.id_kategori) {
    return showMessage(msg, 'Lengkapi semua field bertanda bintang.', 'error');
  }
  if (data.isi.length < 300) {
    return showMessage(msg, 'Isi artikel minimal 300 karakter.', 'error');
  }

  // Cek hak publish
  var bolehPublish = user.role === 'editor' || user.role === 'admin';
  if (data.status === 'published' && !bolehPublish) {
    data.status = 'draft';
  }

  btn.disabled = true;
  btn.textContent = 'Menyimpan...';
  showMessage(msg, '', '');

  var res = await api('create_artikel', data);

  btn.disabled = false;
  btn.textContent = 'Simpan Artikel';

  if (!res.success) {
    return showMessage(msg, res.message || 'Gagal menyimpan artikel.', 'error');
  }

  showMessage(msg, 'Artikel berhasil disimpan sebagai ' + data.status + '!', 'success');
  setTimeout(function () { location.href = 'index.html'; }, 1500);
}form
