(function () {
  const TOKEN_KEY = 'alko_admin_token';
  const apiBase = '';

  let products = [];
  let editIndex = -1;
  let serverStatus = null;

  const $ = (sel) => document.querySelector(sel);

  function isLocalDev() {
    const h = window.location.hostname;
    return h === '127.0.0.1' || h === 'localhost';
  }

  function downloadCatalogJson() {
    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      products: products,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadServerStatus() {
    const banner = $('#env-banner');
    if (!banner) return;
    try {
      const res = await fetch(apiBase + '/api/admin-status', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'status error');
      serverStatus = data;

      if (data.canSave && data.host === 'local') {
        banner.className = 'env-banner env-banner--ok';
        banner.innerHTML = '✓ Локальный сервер — сохранение работает (файлы catalog.json и catalog.html).';
        banner.hidden = false;
        return;
      }

      if (data.canSave && data.host === 'vercel') {
        banner.className = 'env-banner env-banner--ok';
        banner.innerHTML = '✓ Продакшен (Vercel Blob) — сохранение обновит каталог на сайте без деплоя.';
        banner.hidden = false;
        return;
      }

      banner.className = 'env-banner env-banner--warn';
      const hints = (data.hints || []).map(function (h) {
        return '<li>' + h + '</li>';
      }).join('');
      banner.innerHTML =
        '<strong>Сохранение на этом адресе недоступно.</strong>' +
        (hints ? '<ul>' + hints + '</ul>' : '') +
        (!isLocalDev()
          ? ' <p style="margin:8px 0 0">Откройте <a href="http://127.0.0.1:3000/admin/">127.0.0.1:3000/admin/</a> после <code>npm run dev</code>.</p>'
          : '');
      banner.hidden = false;
    } catch {
      if (!isLocalDev()) {
        banner.className = 'env-banner env-banner--err';
        banner.innerHTML =
          'API недоступен (открыт не dev-сервер). Запустите <code>npm run dev</code> и откройте <a href="http://127.0.0.1:3000/admin/">127.0.0.1:3000/admin/</a>.';
        banner.hidden = false;
      }
    }
  }

  function token() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(t) {
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token(),
    };
  }

  function setStatus(msg, type) {
    const el = $('#status-msg');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status-msg' + (type ? ' status-msg--' + type : '');
  }

  function setBtnLoading(btn, loading, label) {
    if (!btn) return;
    if (loading) {
      if (!btn.dataset.label) btn.dataset.label = btn.textContent;
      btn.disabled = true;
      btn.textContent = label || 'Подождите…';
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.label || label || btn.textContent;
    }
  }

  function categoryLabel(cat) {
    const map = { strong: 'Крепкий', wine: 'Вино', beer: 'Пиво', snacks: 'Закуски' };
    return map[cat] || cat;
  }

  function formatRub(n) {
    return (Number(n) || 0).toLocaleString('ru-RU') + ' ₽';
  }

  function makeId(name) {
    return (
      String(name || 'item')
        .toLowerCase()
        .replace(/[«»"']/g, '')
        .replace(/[^a-z0-9а-яё]+/gi, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) +
      '-' +
      Date.now().toString(36).slice(-4)
    );
  }

  function filteredProducts() {
    const q = ($('#search') && $('#search').value.trim().toLowerCase()) || '';
    const cat = $('#filter-category') ? $('#filter-category').value : 'all';
    const onlyOut = $('#filter-outstock') && $('#filter-outstock').checked;
    return products.filter(function (p) {
      if (cat !== 'all' && p.category !== cat) return false;
      if (onlyOut && p.inStock !== false) return false;
      if (q && p.name.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function renderTable() {
    const tbody = $('#product-tbody');
    const countEl = $('#product-count');
    if (!tbody) return;
    const list = filteredProducts();
    if (countEl) countEl.textContent = products.length + ' товаров';
    tbody.innerHTML = '';
    list.forEach(function (p) {
      const idx = products.indexOf(p);
      const tr = document.createElement('tr');
      const inStock = p.inStock !== false;
      tr.innerHTML =
        '<td><img class="product-thumb" src="/' +
        (p.image || '').replace(/^\//, '') +
        '" alt="" loading="lazy" onerror="this.src=\'/favicon.svg\'"></td>' +
        '<td class="product-name">' +
        escapeHtml(p.name) +
        '</td>' +
        '<td>' +
        categoryLabel(p.category) +
        '</td>' +
        '<td><strong>' +
        formatRub(p.price) +
        '</strong></td>' +
        '<td>' +
        (inStock
          ? '<span class="in-stock-pill">В наличии</span>'
          : '<span class="out-stock-pill">Нет в наличии</span>') +
        '</td>' +
        '<td>' +
        '<button type="button" class="btn btn-sm btn-primary" data-edit="' +
        idx +
        '">Изменить</button> ' +
        '<button type="button" class="btn btn-sm btn-danger" data-del="' +
        idx +
        '">Удалить</button>' +
        '</td>';
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEdit(parseInt(btn.getAttribute('data-edit'), 10));
      });
    });
    tbody.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const i = parseInt(btn.getAttribute('data-del'), 10);
        if (confirm('Удалить «' + products[i].name + '»?')) {
          products.splice(i, 1);
          renderTable();
          setStatus('Товар удалён. Нажмите «Сохранить на сайт».', 'ok');
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function openEdit(index) {
    editIndex = index;
    const p = index >= 0 ? products[index] : null;
    $('#modal-title').textContent = p ? 'Редактировать товар' : 'Новый товар';
    $('#edit-id').value = p ? p.id : '';
    $('#edit-name').value = p ? p.name : '';
    $('#edit-category').value = p ? p.category : 'strong';
    $('#edit-price').value = p ? p.price : '';
    $('#edit-desc').value = p ? p.desc || '' : '';
    $('#edit-alt').value = p ? p.alt || '' : '';
    $('#edit-image').value = p ? p.image || '' : '';
    $('#edit-instock').checked = p ? p.inStock !== false : true;
    updatePreview();
    $('#edit-modal').hidden = false;
  }

  function closeEdit() {
    $('#edit-modal').hidden = true;
    editIndex = -1;
  }

  function updatePreview() {
    const img = $('#edit-image').value.trim();
    const prev = $('#edit-preview');
    if (!prev) return;
    prev.src = img ? '/' + img.replace(/^\//, '') : '/favicon.svg';
  }

  async function loadCatalog() {
    setStatus('Загрузка…');
    try {
      const res = await fetch(apiBase + '/api/catalog');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      products = data.products || [];
      renderTable();
      setStatus('Загружено ' + products.length + ' товаров', 'ok');
    } catch (e) {
      setStatus('Ошибка: ' + e.message, 'err');
    }
  }

  async function saveCatalog() {
    const btn = $('#btn-save');
    setBtnLoading(btn, true, 'Сохранение…');
    setStatus('Сохранение…');
    try {
      if (!isLocalDev() && serverStatus && !serverStatus.canSave) {
        throw new Error(
          'На alkodostavka24.online сохранение не работает без Blob Storage. Запустите npm run dev и откройте http://127.0.0.1:3000/admin/'
        );
      }

      const res = await fetch(apiBase + '/api/catalog', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ products: products }),
      });
      let data = {};
      const raw = await res.text();
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        if (res.status === 404 || res.status === 405) {
          throw new Error(
            'API не найден. Откройте http://127.0.0.1:3000/admin/ (команда npm run dev), не Live Server и не файл с диска.'
          );
        }
        throw new Error('Сервер вернул некорректный ответ');
      }
      if (!res.ok) {
        const msg = data.error || 'Ошибка сохранения';
        if (data.code === 'NO_BLOB' || data.code === 'READONLY_FS') {
          downloadCatalogJson();
          throw new Error(msg + ' JSON каталога скачан — не потеряйте изменения.');
        }
        throw new Error(msg);
      }
      const hint =
        data.storage === 'blob'
          ? 'Изменения уже на сайте (каталог подгружается с API).'
          : 'Файл catalog.html обновлён.';
      setStatus('✓ Сохранено ' + data.count + ' товаров. ' + hint, 'ok');
      await loadCatalog();
    } catch (e) {
      setStatus('Ошибка: ' + e.message, 'err');
    } finally {
      setBtnLoading(btn, false);
    }
  }

  async function uploadImage(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(apiBase + '/api/admin-upload', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token() },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
    return data.path;
  }

  function showApp(show) {
    $('#login-screen').hidden = show;
    $('#admin-app').hidden = !show;
  }

  $('#login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const errEl = $('#login-error');
    const submitBtn = this.querySelector('button[type="submit"]');
    errEl.hidden = true;
    setBtnLoading(submitBtn, true, 'Вход…');
    try {
      const res = await fetch(apiBase + '/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: $('#login-password').value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка входа');
      setToken(data.token);
      showApp(true);
      loadServerStatus();
      await loadCatalog();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    } finally {
      setBtnLoading(submitBtn, false, 'Войти');
    }
  });

  $('#btn-logout').addEventListener('click', function () {
    setToken('');
    showApp(false);
    $('#login-password').value = '';
  });

  $('#btn-add').addEventListener('click', function () {
    openEdit(-1);
  });

  $('#btn-save').addEventListener('click', saveCatalog);

  $('#btn-export').addEventListener('click', function () {
    downloadCatalogJson();
    setStatus('Файл catalog.json скачан', 'ok');
  });

  $('#search').addEventListener('input', renderTable);
  $('#filter-category').addEventListener('change', renderTable);
  $('#filter-outstock').addEventListener('change', renderTable);

  $('#edit-image').addEventListener('input', updatePreview);

  $('#edit-upload').addEventListener('change', async function () {
    const file = this.files && this.files[0];
    if (!file) return;
    setStatus('Загрузка фото…');
    try {
      const path = await uploadImage(file);
      $('#edit-image').value = path;
      updatePreview();
      setStatus('Фото загружено: ' + path, 'ok');
    } catch (e) {
      setStatus('Ошибка загрузки: ' + e.message, 'err');
    }
    this.value = '';
  });

  $('#edit-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const item = {
      id: $('#edit-id').value || makeId($('#edit-name').value),
      name: $('#edit-name').value.trim(),
      category: $('#edit-category').value,
      price: parseInt($('#edit-price').value, 10) || 0,
      desc: $('#edit-desc').value.trim(),
      alt: $('#edit-alt').value.trim() || $('#edit-name').value.trim(),
      image: $('#edit-image').value.trim(),
      inStock: $('#edit-instock').checked,
    };
    if (!item.name) return;
    if (editIndex >= 0) products[editIndex] = item;
    else products.push(item);
    closeEdit();
    renderTable();
    setStatus('Изменения применены. Нажмите «Сохранить на сайт».', 'ok');
  });

  document.querySelectorAll('[data-close-modal]').forEach(function (el) {
    el.addEventListener('click', closeEdit);
  });

  if (token()) {
    showApp(true);
    loadServerStatus();
    loadCatalog();
  } else {
    showApp(false);
    loadServerStatus();
  }
})();
