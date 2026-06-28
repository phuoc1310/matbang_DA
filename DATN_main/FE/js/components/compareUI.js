import { interactionService } from '../services/interactionService.js';

let compareList = new Set();
let isInitialized = false;

function getUserId() {
  try {
    const raw = sessionStorage.getItem('currentUser');
    if (raw) return JSON.parse(raw).id || JSON.parse(raw).postgres_id;
  } catch {}
  return null;
}


function initWidgetDOM() {
  if (document.getElementById('compare-widget')) return;

  const style = document.createElement('style');
  style.textContent = `
    #compare-widget {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 50;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 10px 16px;
      border-radius: 9999px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transform: translateY(150%);
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      opacity: 0;
    }
    .dark #compare-widget {
      background: rgba(30, 41, 59, 0.95);
      border-color: rgba(51, 65, 85, 0.8);
    }
    #compare-widget.show {
      transform: translateY(0);
      opacity: 1;
    }
    #compare-widget .compare-count {
      background: #137fec;
      color: white;
      font-weight: bold;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 14px;
    }
    .compare-icon-btn.active {
      color: #137fec;
      background: #eff6ff;
    }
    .dark .compare-icon-btn.active {
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }
  `;
  document.head.appendChild(style);

  const widget = document.createElement('div');
  widget.id = 'compare-widget';
  widget.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="material-symbols-outlined text-primary">compare_arrows</span>
      <span class="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">So sánh</span>
      <div id="compare-count" class="compare-count">0</div>
    </div>
    <div class="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
    <a href="/js/views/sosanh.html" class="text-sm font-bold text-primary hover:text-blue-700 dark:hover:text-blue-400 whitespace-nowrap">
      Xem ngay
    </a>
  `;
  document.body.appendChild(widget);
}

function updateWidget() {
  const widget = document.getElementById('compare-widget');
  const countEl = document.getElementById('compare-count');
  if (!widget || !countEl) return;

  const count = compareList.size;
  countEl.textContent = count;

  if (count > 0) {
    widget.classList.add('show');
  } else {
    widget.classList.remove('show');
  }

  
  document.querySelectorAll('[class*="compare-btn-"]').forEach(btn => {
    
    const match = btn.className.match(/compare-btn-(\d+)/);
    if (match) {
      const id = match[1];
      if (compareList.has(String(id))) {
        btn.classList.add('active', 'text-primary');
        btn.classList.remove('text-gray-700');
        const icon = btn.querySelector('.material-symbols-outlined');
        if(icon) {
          
        }
      } else {
        btn.classList.remove('active', 'text-primary');
        btn.classList.add('text-gray-700');
        const icon = btn.querySelector('.material-symbols-outlined');
        if(icon) {
          
        }
      }
    }
  });

  
  const detailBtn = document.getElementById('btn-compare-detail');
  if (detailBtn) {
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get('id');
    if (compareList.has(String(listingId))) {
      detailBtn.classList.add('border-primary', 'bg-blue-50', 'dark:bg-blue-900/20');
      detailBtn.classList.remove('border-slate-200', 'dark:border-slate-700');
      detailBtn.querySelector('span').classList.add('text-primary');
      detailBtn.querySelector('span').classList.remove('text-slate-400');
    } else {
      detailBtn.classList.remove('border-primary', 'bg-blue-50', 'dark:bg-blue-900/20');
      detailBtn.classList.add('border-slate-200', 'dark:border-slate-700');
      detailBtn.querySelector('span').classList.remove('text-primary');
      detailBtn.querySelector('span').classList.add('text-slate-400');
    }
  }
}

async function loadCompareList() {
  const userId = getUserId();
  if (!userId) return;

  try {
    const list = await interactionService.getCompareList(userId);
    compareList.clear();
    if (Array.isArray(list)) {
      list.forEach(item => {
        compareList.add(String(item.listing_id || item.propertyId || item.id));
      });
    }
    updateWidget();
  } catch (e) {
    console.error('Lỗi load compare list', e);
  }
}

window.toggleCompare = async function(propertyId) {
  const userId = getUserId();
  if (!userId) {
    alert('Vui lòng đăng nhập để sử dụng tính năng so sánh!');
    return;
  }

  propertyId = String(propertyId);
  const isSelected = compareList.has(propertyId);

  
  if (!isSelected && compareList.size >= 4) {
    alert('Bạn chỉ có thể so sánh tối đa 4 mặt bằng cùng lúc.');
    return;
  }

  
  if (isSelected) {
    compareList.delete(propertyId);
  } else {
    compareList.add(propertyId);
  }
  updateWidget();

  try {
    const success = await interactionService.toggleCompare(userId, propertyId);
    if (!success) {
      
      if (isSelected) compareList.add(propertyId);
      else compareList.delete(propertyId);
      updateWidget();
      alert('Đã xảy ra lỗi, vui lòng thử lại.');
    }
  } catch (e) {
    console.error('Toggle compare error', e);
    
    if (isSelected) compareList.add(propertyId);
    else compareList.delete(propertyId);
    updateWidget();
  }
};

window.clearCompareList = async function() {
    const userId = getUserId();
    if(!userId) return;
    
    if(confirm('Bạn có chắc muốn xóa tất cả mặt bằng đang so sánh?')) {
        try {
            await interactionService.clearCompare(userId);
            compareList.clear();
            updateWidget();
            if(window.location.pathname.includes('sosanh.html')) {
                window.location.reload();
            }
        } catch(e) {
            console.error(e);
        }
    }
}

function initAll() {
  if (!isInitialized) {
    isInitialized = true;
    initWidgetDOM();
    setTimeout(loadCompareList, 500); 
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}


const _origRenderPage = window.renderPage;
if (_origRenderPage) {
  window.renderPage = function() {
    _origRenderPage();
    setTimeout(updateWidget, 100);
  };
}
