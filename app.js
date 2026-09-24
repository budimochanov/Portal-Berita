const API_URL = 'https://script.google.com/macros/s/AKfycbxNTnU71lz-0LQ1cY5fwWmc2OwVICzZ37BLIwtZMx7e45Emt3iXhIWYUwbbZe0C0k7C/exec';

const DEFAULT_IMG = 'https://via.placeholder.com/600x400/2563EB/ffffff?text=Portal+Berita';

async function api(action, params) {
  params = params || {};
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  Object.keys(params).forEach(function(k) {
    url.searchParams.set(k, params[k]);
  });
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, message: err.message };
  }
}

function formatTanggal(str) {
  if (!str) return '-';
  const d = new Date(str);
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupMenuToggle();
  await loadPengaturan();
  await loadKategori();
  await loadArtikel();
}

function setupMenuToggle() {
  const btn = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav');
  if (btn) {
    btn.addEventListener('click', function() {
      nav.classList.toggle('open');
    });
  }
}

async function loadPengaturan() {
  const res = await api('get_pengaturan');
  if (!res.success) return;
  const p = res.data;
  if (p.nama_situs) {
    document.getElementById('site-name').textContent = p.nama_situs;
    document.title = p.nama_situs;
  }
  if (p.nama_situs) {
    document.getElementById('footer-text').textContent =
      '© ' + new Date().getFullYear() + ' ' + p.nama_situs;
  }
}

async function loadKategori() {
  const res = await api('list_kategori');
  if (!res.success) return;
  const list = document.getElementById('nav-list');
  list.innerHTML = '<li><a href="#">Beranda</a></li>';
  res.data.forEach(function(k) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = k.nama;
    a.addEventListener('click', function(e) {
      e.preventDefault();
      filterByKategori(k.id, k.nama);
    });
    li.appendChild(a);
    list.appendChild(li);
  });
}

async function loadArtikel(kategoriId) {
  const params = { status: 'published', limit: 12 };
  if (kategoriId) params.kategori = kategoriId;

  const res = await api('list_artikel', params);
  const grid = document.getElementById('articles-grid');

  if (!res.success || res.data.length === 0) {
    grid.innerHTML = '<div class="empty-state">Belum ada artikel untuk ditampilkan.</div>';
    document.getElementById('hero-main').innerHTML =
      '<div class="empty-state">Belum ada headline.</div>';
    document.getElementById('ticker-content').textContent =
      'Belum ada berita terbaru.';
    return;
  }

  renderHero(res.data[0]);
  updateTicker(res.data[0]);

  const rest = res.data.slice(1);
  if (rest.length === 0) {
    grid.innerHTML = '<div class="empty-state">Belum ada artikel lain.</div>';
    return;
  }

  grid.innerHTML = '';
  rest.forEach(function(a) {
    grid.appendChild(buildCard(a));
  });
}

function filterByKategori(id, nama) {
  document.getElementById('articles-grid').innerHTML =
    '<div class="empty-state">Memuat...</div>';
  loadArtikel(id);
}

function renderHero(a) {
  const container = document.getElementById('hero-main');
  const img = a.thumbnail_url || DEFAULT_IMG;

  container.innerHTML =
    '<article class="hero-card">' +
      '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(a.judul) + '" ' +
        'onerror="this.src=\'' + DEFAULT_IMG + '\'">' +
      '<div class="hero-body">' +
        '<h3>' + escapeHtml(a.judul) + '</h3>' +
        '<p>' + escapeHtml(a.ringkasan) + '</p>' +
        '<div class="hero-meta">' +
          formatTanggal(a.tgl_tayang || a.tgl_buat) + ' &middot; ' + (a.views || 0) + ' kali dibaca' +
        '</div>' +
      '</div>' +
    '</article>';
}

function buildCard(a) {
  const card = document.createElement('article');
  card.className = 'article-card';
  const img = a.thumbnail_url || DEFAULT_IMG;
  const kategori = a.id_kategori || '';

  card.innerHTML =
    '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(a.judul) + '" ' +
      'onerror="this.src=\'' + DEFAULT_IMG + '\'">' +
    '<div class="card-body">' +
      '<span class="badge" style="background:var(--primary)">' + escapeHtml(kategori) + '</span>' +
      '<h3>' + escapeHtml(a.judul) + '</h3>' +
      '<p>' + escapeHtml(a.ringkasan) + '</p>' +
      '<div class="card-meta">' + formatTanggal(a.tgl_tayang || a.tgl_buat) + '</div>' +
    '</div>';
  return card;
}

function updateTicker(a) {
  document.getElementById('ticker-content').textContent = a.judul;
}