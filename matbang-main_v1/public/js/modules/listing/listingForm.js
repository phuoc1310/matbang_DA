// public/asset/js/listingForm.js
// Xu ly form dang tin mat bang

import { createListing, updateListing } from './listingService.js';
import { auth } from './auth/firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email
    }));
  } else {
    localStorage.removeItem('currentUser');
  }
});

export function openListingForm(editData = null) {
  console.log('openListingForm called', { editData, currentUser });
  
  if (!currentUser) {
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) {
      alert('Vui long dang nhap de dang tin');
      window.location.href = '/dangnhap.html';
      return;
    }
  }

  let modal = document.getElementById('listingModal');
  if (!modal) {
    console.log('Tao modal moi...');
    createModal();
    setTimeout(() => {
      modal = document.getElementById('listingModal');
      if (modal) {
        openListingForm(editData);
      } else {
        console.error('Khong the tao modal');
      }
    }, 150);
    return;
  }

  const form = document.getElementById('listingForm');
  if (form) {
    form.reset();
    document.getElementById('previewImages').innerHTML = '';
    uploadedImageUrls = [];
    const progressDiv = document.getElementById('uploadProgress');
    if (progressDiv) {
      progressDiv.classList.add('hidden');
      progressDiv.textContent = '';
    }
  }

  if (editData) {
    fillForm(editData);
    document.getElementById('modalTitle').textContent = 'Chinh sua tin dang';
    document.getElementById('submitBtn').textContent = 'Cap nhat';
    document.getElementById('listingForm').dataset.editId = editData.id;
  } else {
    document.getElementById('modalTitle').textContent = 'Dang tin mat bang';
    document.getElementById('submitBtn').textContent = 'Dang tin';
    delete document.getElementById('listingForm').dataset.editId;
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  
  console.log('Modal da duoc hien thi');
}

export function closeListingForm() {
  const modal = document.getElementById('listingModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

if (typeof window !== 'undefined') {
  window.openListingForm = openListingForm;
  window.closeListingForm = closeListingForm;
}

function fillForm(data) {
  document.getElementById('listingTitle').value = data.title || '';
  document.getElementById('listingDescription').value = data.description || '';
  document.getElementById('businessType').value = data.businessType || '';
  document.getElementById('area').value = data.area_m2 || data.area || '';
  document.getElementById('price').value = data.price || '';
  document.getElementById('address').value = data.address || '';
  document.getElementById('district').value = data.district || '';
  document.getElementById('ward').value = data.ward || '';
  document.getElementById('region').value = data.region || '';
  
  if (data.images && data.images.length > 0) {
    displayPreviewImages(data.images);
  }
}

function createModal() {
  const modalHTML = `
    <div id="listingModal" class="hidden fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onclick="window.closeListingForm && window.closeListingForm()"></div>

        <div class="inline-block align-bottom bg-white dark:bg-surface-dark rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div class="bg-white dark:bg-surface-dark px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 id="modalTitle" class="text-lg font-bold text-slate-900 dark:text-white">Dang tin mat bang</h3>
              <button onclick="window.closeListingForm && window.closeListingForm()" class="text-gray-400 hover:text-gray-600">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form id="listingForm" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tieu de <span class="text-red-500">*</span>
                </label>
                <input type="text" id="listingTitle" required
                  class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="VD: Cho thue mat bang kinh doanh tai quan 1">
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mo ta
                </label>
                <textarea id="listingDescription" rows="3"
                  class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Mo ta chi tiet ve mat bang..."></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Loai hinh kinh doanh <span class="text-red-500">*</span>
                  </label>
                  <select id="businessType" required
                    class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Chon loai hinh</option>
                    <option value="Đất">Đất</option>
                    <option value="Văn phòng">Văn phòng</option>
                    <option value="Cửa hàng">Cửa hàng</option>
                    <option value="Kho xưởng">Kho xưởng</option>
                    <option value="Co-working">Co-working</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dien tich (m²)
                  </label>
                  <input type="number" id="area" min="0"
                    class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="VD: 50">
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Gia thue/thang (VND) <span class="text-red-500">*</span>
                </label>
                <input type="number" id="price" required min="0"
                  class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="VD: 5000000">
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dia chi <span class="text-red-500">*</span>
                </label>
                <input type="text" id="address" required
                  class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                  placeholder="So nha, ten duong">
                
                <div class="grid grid-cols-3 gap-2">
                  <input type="text" id="ward" 
                    class="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Phuong/Xa">
                  <input type="text" id="district" 
                    class="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Quan/Huyen">
                  <input type="text" id="region" 
                    class="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tinh/Thanh pho">
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hinh anh
                </label>
                <div class="space-y-2">
                  <div class="flex gap-2">
                    <input type="file" id="imageFiles" multiple accept="image/*"
                      class="flex-1 px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Chon hinh anh">
                    <button type="button" id="btnUploadImages" 
                      class="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition">
                      Upload
                    </button>
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">
                    Hoac nhap URL (cach nhau bang dau phay):
                  </div>
                  <input type="text" id="imageUrls"
                    class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg">
                </div>
                <div id="uploadProgress" class="hidden mt-2 text-sm text-primary"></div>
                <div id="previewImages" class="mt-2 grid grid-cols-4 gap-2"></div>
              </div>

              <div class="flex gap-3 pt-4">
                <button type="button" onclick="window.closeListingForm && window.closeListingForm()"
                  class="flex-1 px-4 py-2 rounded-lg border border-border-light dark:border-border-dark text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  Huy
                </button>
                <button type="submit" id="submitBtn"
                  class="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition">
                  Dang tin
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const form = document.getElementById('listingForm');
  form.addEventListener('submit', handleFormSubmit);

  const imageInput = document.getElementById('imageUrls');
  imageInput.addEventListener('input', () => {
    const urls = imageInput.value.split(',').map(url => url.trim()).filter(url => url);
    displayPreviewImages(urls);
  });

  const btnUploadImages = document.getElementById('btnUploadImages');
  const imageFilesInput = document.getElementById('imageFiles');
  
  if (btnUploadImages && imageFilesInput) {
    btnUploadImages.addEventListener('click', async () => {
      const files = imageFilesInput.files;
      if (files.length === 0) {
        alert('Vui long chon it nhat mot hinh anh');
        return;
      }
      
      await uploadImages(files);
    });
  }
}

let uploadedImageUrls = [];

async function uploadImages(files) {
  const progressDiv = document.getElementById('uploadProgress');
  const btnUpload = document.getElementById('btnUploadImages');
  const imageUrlsInput = document.getElementById('imageUrls');
  const imageFilesInput = document.getElementById('imageFiles');
  
  if (files.length === 0) {
    alert('Vui long chon it nhat mot hinh anh');
    return;
  }

  try {
    btnUpload.disabled = true;
    btnUpload.textContent = 'Dang upload...';
    progressDiv.classList.remove('hidden');
    progressDiv.textContent = `Dang upload ${files.length} anh...`;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    console.log('Uploading images...', files.length, 'files');
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    console.log('Upload response status:', response.status, response.statusText);

    const contentType = response.headers.get('content-type');
    let result;
    
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        try {
          const error = await response.json();
          throw new Error(error.error || 'Loi upload anh');
        } catch (parseError) {
          const text = await response.text();
          throw new Error(text || 'Loi upload anh');
        }
      } else {
        const text = await response.text();
        throw new Error(text || `Loi upload anh (${response.status})`);
      }
    }

    if (contentType && contentType.includes('application/json')) {
      try {
        result = await response.json();
      } catch (parseError) {
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error('Loi parse response tu server: ' + parseError.message);
      }
    } else {
      const text = await response.text();
      throw new Error('Server khong tra ve JSON. Response: ' + text.substring(0, 100));
    }
    const urls = result.urls.map(url => {
      if (url.startsWith('/')) {
        return window.location.origin + url;
      }
      return url;
    });

    uploadedImageUrls = [...uploadedImageUrls, ...urls];

    const existingUrls = imageUrlsInput.value.split(',').map(url => url.trim()).filter(url => url);
    const allUrls = [...existingUrls, ...urls];
    imageUrlsInput.value = allUrls.join(', ');

    displayPreviewImages(allUrls);

    progressDiv.textContent = `✅ ${result.message || `Da upload ${urls.length} anh thanh cong!`}`;
    progressDiv.classList.remove('hidden');
    
    if (imageFilesInput) {
      imageFilesInput.value = '';
    }

    setTimeout(() => {
      progressDiv.classList.add('hidden');
    }, 3000);

  } catch (error) {
    console.error('Error uploading images:', error);
    
    let errorMessage = error.message || 'Loi upload anh';
    
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      errorMessage = 'Khong the ket noi den server. Vui long kiem tra:\n1. Server dang chay?\n2. URL dung khong?\n3. Firewall/CORS?';
    } else if (error.message.includes('404')) {
      errorMessage = 'Khong tim thay endpoint upload. Server co the chua duoc restart.';
    } else if (error.message.includes('500')) {
      errorMessage = 'Loi server khi xu ly upload. Vui long kiem tra console server.';
    }
    
    alert('Loi upload anh: ' + errorMessage);
    progressDiv.textContent = '❌ Loi upload anh: ' + errorMessage;
    progressDiv.classList.remove('hidden');
  } finally {
    btnUpload.disabled = false;
    btnUpload.textContent = 'Upload';
  }
}

function displayPreviewImages(urls) {
  const preview = document.getElementById('previewImages');
  if (!preview) return;

  preview.innerHTML = '';
  urls.forEach((url, index) => {
    if (url) {
      const container = document.createElement('div');
      container.className = 'relative';
      
      const img = document.createElement('img');
      img.src = url;
      img.className = 'w-full h-20 object-cover rounded border';
      img.onerror = function() { this.style.display = 'none'; };
      
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600';
      removeBtn.innerHTML = '×';
      removeBtn.onclick = () => {
        const imageUrlsInput = document.getElementById('imageUrls');
        const urls = imageUrlsInput.value.split(',').map(u => u.trim()).filter(u => u && u !== url);
        imageUrlsInput.value = urls.join(', ');
        displayPreviewImages(urls);
      };
      
      container.appendChild(img);
      container.appendChild(removeBtn);
      preview.appendChild(container);
    }
  });
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Dang xu ly...';

    const form = e.target;
    
    const titleEl = form.querySelector('#listingTitle');
    const businessTypeEl = form.querySelector('#businessType');
    const priceEl = form.querySelector('#price');
    const addressEl = form.querySelector('#address');
    const areaEl = form.querySelector('#area');
    const descriptionEl = form.querySelector('#listingDescription');
    const districtEl = form.querySelector('#district');
    const wardEl = form.querySelector('#ward');
    const regionEl = form.querySelector('#region');
    const imageUrlsEl = form.querySelector('#imageUrls');

    if (!titleEl || !businessTypeEl || !priceEl || !addressEl) {
      console.error('Missing form elements:', { titleEl, businessTypeEl, priceEl, addressEl });
      alert('Loi: Khong tim thay mot so truong trong form. Vui long thu lai.');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }

    const title = (titleEl.value || titleEl.textContent || '').trim();
    const businessType = (businessTypeEl.value || '').trim();
    
    let priceValue = priceEl.value;
    if (!priceValue && priceEl.type === 'number') {
      priceValue = priceEl.valueAsNumber ? String(priceEl.valueAsNumber) : '';
    }
    priceValue = (priceValue || '').trim();
    const price = priceValue ? Number(priceValue) : 0;
    
    const address = (addressEl.value || '').trim();
    const area = areaEl ? (Number(areaEl.value) || 0) : 0;
    const description = descriptionEl ? (descriptionEl.value || '').trim() : '';
    const district = districtEl ? (districtEl.value || '').trim() : '';
    const ward = wardEl ? (wardEl.value || '').trim() : '';
    const region = regionEl ? (regionEl.value || '').trim() : '';
    const imageUrls = imageUrlsEl ? (imageUrlsEl.value || '') : '';
    const images = imageUrls.split(',').map(url => url.trim()).filter(url => url);

    console.log('Form values (raw):', { 
      titleElValue: titleEl.value,
      businessTypeElValue: businessTypeEl.value,
      priceElValue: priceEl.value,
      addressElValue: addressEl.value,
      title, 
      businessType, 
      priceValue, 
      price, 
      address
    });

    const listingData = {
      title,
      description,
      businessType,
      area,
      price,
      address,
      district,
      ward,
      region,
      images: images.length > 0 ? images : []
    };

    console.log('Submitting listing data:', listingData);

    let result;
    const editId = form.dataset.editId;
    
    if (editId) {
      result = await updateListing(editId, listingData);
      alert('Cap nhat tin dang thanh cong!');
    } else {
      result = await createListing(listingData);
      alert('Dang tin thanh cong! Tin dang dang cho duoc duyet.');
    }

    closeListingForm();
    
    if (window.location.pathname.includes('quanly.html')) {
      window.location.reload();
    } else if (typeof window.loadListings === 'function') {
      window.loadListings();
    }

  } catch (error) {
    console.error('Error submitting form:', error);
    alert('Loi: ' + (error.message || 'Khong the dang tin. Vui long thu lai.'));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

if (typeof window !== 'undefined') {
  window.openListingForm = openListingForm;
  window.closeListingForm = closeListingForm;
}
