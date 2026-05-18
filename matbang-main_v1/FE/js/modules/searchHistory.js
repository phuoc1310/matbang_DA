// modules/searchHistory.js
// Dropdown lịch sử tìm kiếm — dùng chung cho Trangchu.html & timkiem.html

/**
 * Khởi tạo dropdown lịch sử tìm kiếm cho ô input
 * @param {string} inputId - ID của input tìm kiếm
 * @param {Function} onSelect - callback khi user click 1 mục lịch sử (nhận object {keyword, city})
 */
export function initSearchHistory(inputId, onSelect) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Tạo dropdown container
  const wrapper = input.closest('.relative') || input.parentElement;
  wrapper.style.position = 'relative';

  const dropdown = document.createElement('div');
  dropdown.id = 'search-history-dropdown';
  dropdown.className = 'search-history-dropdown';
  dropdown.innerHTML = '';
  wrapper.appendChild(dropdown);

  // Inject CSS nếu chưa có
  if (!document.getElementById('search-history-styles')) {
    const style = document.createElement('style');
    style.id = 'search-history-styles';
    style.textContent = `
      .search-history-dropdown {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 999;
        margin-top: 4px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.12);
        overflow: hidden;
        animation: shDropdownIn 0.2s ease;
      }
      .dark .search-history-dropdown {
        background: #1e293b;
        border-color: #334155;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
      }
      @keyframes shDropdownIn {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .search-history-dropdown.show { display: block; }

      .sh-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px 6px 14px;
        border-bottom: 1px solid #f1f5f9;
      }
      .dark .sh-header { border-color: #334155; }
      .sh-header span {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
      }
      .sh-clear {
        font-size: 12px;
        color: #ef4444;
        cursor: pointer;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 6px;
        transition: background 0.15s;
      }
      .sh-clear:hover { background: #fef2f2; }
      .dark .sh-clear:hover { background: #7f1d1d33; }

      .sh-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        cursor: pointer;
        transition: background 0.15s;
        font-size: 14px;
        color: #334155;
      }
      .dark .sh-item { color: #e2e8f0; }
      .sh-item:hover { background: #f1f5f9; }
      .dark .sh-item:hover { background: #334155; }
      .sh-item .sh-icon {
        color: #94a3b8;
        font-size: 18px;
        flex-shrink: 0;
      }
      .sh-item .sh-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
      }
      .sh-item .sh-city {
        font-size: 11px;
        color: #94a3b8;
        background: #f1f5f9;
        padding: 2px 8px;
        border-radius: 6px;
        flex-shrink: 0;
      }
      .dark .sh-item .sh-city { background: #334155; color: #64748b; }
      .sh-empty {
        padding: 20px 14px;
        text-align: center;
        color: #94a3b8;
        font-size: 13px;
      }
    `;
    document.head.appendChild(style);
  }

  // Lấy userId từ session
  function getUserId() {
    try {
      const raw = sessionStorage.getItem('currentUser');
      if (raw) {
        const u = JSON.parse(raw);
        return u.id || u.postgres_id || null;
      }
    } catch (e) {}
    return null;
  }

  // Fetch lịch sử từ API
  async function fetchHistory() {
    const userId = getUserId();
    if (!userId) return [];
    try {
      const res = await fetch(`/api/interactions/history?userId=${userId}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn('Lỗi fetch lịch sử tìm kiếm:', e);
      return [];
    }
  }

  // Xóa lịch sử
  async function clearHistory() {
    const userId = getUserId();
    if (!userId) return;
    try {
      await fetch(`/api/interactions/history?userId=${userId}`, { method: 'DELETE' });
    } catch (e) {}
  }

  // Render dropdown
  async function renderDropdown() {
    const items = await fetchHistory();

    if (items.length === 0) {
      dropdown.innerHTML = `
        <div class="sh-header"><span>Lịch sử tìm kiếm</span></div>
        <div class="sh-empty">
          <span class="material-symbols-outlined" style="font-size:28px;display:block;margin-bottom:4px">history</span>
          Chưa có lịch sử tìm kiếm
        </div>`;
      return;
    }

    let html = `
      <div class="sh-header">
        <span>Lịch sử tìm kiếm</span>
        <span class="sh-clear" id="sh-clear-btn">Xóa tất cả</span>
      </div>`;

    items.forEach(item => {
      const keyword = item.keyword || '';
      const city = item.city || '';
      const display = keyword || city || '(trống)';
      html += `
        <div class="sh-item" data-keyword="${keyword}" data-city="${city}">
          <span class="material-symbols-outlined sh-icon">history</span>
          <span class="sh-text">${display}</span>
          ${city ? `<span class="sh-city">${city}</span>` : ''}
        </div>`;
    });

    dropdown.innerHTML = html;

    // Bind click events
    dropdown.querySelectorAll('.sh-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Ngăn blur input
        const keyword = el.dataset.keyword;
        const city = el.dataset.city;
        input.value = keyword || city || '';
        hideDropdown();
        if (onSelect) onSelect({ keyword, city });
      });
    });

    const clearBtn = dropdown.querySelector('#sh-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('mousedown', async (e) => {
        e.preventDefault();
        await clearHistory();
        await renderDropdown();
      });
    }
  }

  function showDropdown() {
    renderDropdown().then(() => {
      dropdown.classList.add('show');
    });
  }

  function hideDropdown() {
    dropdown.classList.remove('show');
  }

  // Events
  input.addEventListener('focus', () => {
    showDropdown();
  });

  input.addEventListener('blur', () => {
    // Delay để cho phép click vào dropdown
    setTimeout(hideDropdown, 200);
  });

  // Ẩn khi gõ (vẫn giữ focus để khi xóa hết text thì show lại)
  input.addEventListener('input', () => {
    if (input.value.trim().length > 0) {
      hideDropdown();
    } else {
      showDropdown();
    }
  });
}

/**
 * Lưu lịch sử tìm kiếm vào PostgreSQL
 * @param {string} keyword
 * @param {string} city
 */
export async function saveSearchHistory(keyword, city) {
  try {
    const raw = sessionStorage.getItem('currentUser');
    if (!raw) return;
    const user = JSON.parse(raw);
    const userId = user.id || user.postgres_id;
    if (!userId) return;
    if (!keyword && !city) return;

    await fetch('/api/interactions/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, keyword: keyword || null, city: city || null })
    });
  } catch (e) {
    console.warn('Lỗi lưu lịch sử tìm kiếm:', e);
  }
}
