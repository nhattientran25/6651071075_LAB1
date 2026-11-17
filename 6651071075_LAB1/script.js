const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('hidden') === false;
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

const filterButtons = document.querySelectorAll('.filter-chip');
const productCards = document.querySelectorAll('#productGrid .product-card');
const productGrid = document.getElementById('productGrid');
const productResultsStatus = document.getElementById('productResultsStatus');
const productEmptyState = document.getElementById('productEmptyState');
const searchCategory = document.getElementById('searchCategory');
const productSearchInput = document.getElementById('productSearchInput');
const productSearchForm = document.getElementById('productSearchForm');
let activeCategory = 'all';
let activeQuery = '';

const normalizeForSearch = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/đ/g, 'd');

const applyProductFilters = () => {
  const query = normalizeForSearch(activeQuery);
  let visibleCount = 0;

  productCards.forEach((card) => {
    const categoryMatches = activeCategory === 'all' || card.dataset.cat === activeCategory;
    const searchableText = normalizeForSearch([
      card.querySelector('h3')?.textContent || '',
      card.querySelector('p.text-soft')?.textContent || '',
      card.dataset.cat || ''
    ].join(' '));
    const queryMatches = !query || searchableText.includes(query);
    const isVisible = categoryMatches && queryMatches;
    card.style.display = isVisible ? '' : 'none';
    if (isVisible) visibleCount += 1;
  });

  filterButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === activeCategory);
  });
  if (searchCategory) searchCategory.value = activeCategory;
  if (productEmptyState) productEmptyState.classList.toggle('hidden', visibleCount > 0);
  if (productResultsStatus) {
    productResultsStatus.textContent = visibleCount
      ? `Tìm thấy ${visibleCount} sản phẩm.`
      : 'Không tìm thấy sản phẩm phù hợp.';
  }
};

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeCategory = button.dataset.filter;
    activeQuery = '';
    if (productSearchInput) productSearchInput.value = '';
    applyProductFilters();
  });
});

const searchButton = document.getElementById('searchBtn');
const searchPanel = document.getElementById('searchPanel');

if (searchButton && searchPanel) {
  searchButton.addEventListener('click', () => {
    const isOpen = searchPanel.classList.toggle('hidden') === false;
    searchButton.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) productSearchInput?.focus();
  });
}

if (productSearchForm && productGrid) {
  productSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    activeCategory = searchCategory?.value || 'all';
    activeQuery = productSearchInput?.value.trim() || '';
    applyProductFilters();
    searchPanel?.classList.add('hidden');
    searchButton?.setAttribute('aria-expanded', 'false');
    const scrollOptions = { block: 'start' };
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scrollOptions.behavior = 'smooth';
    }
    productGrid.scrollIntoView(scrollOptions);
  });
}

const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMsg');

if (contactForm && formMessage) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    formMessage.classList.remove('hidden');
  });
}

const newsletterForm = document.getElementById('newsletterForm');
const newsletterMessage = document.getElementById('newsletterMsg');

if (newsletterForm && newsletterMessage) {
  newsletterForm.addEventListener('submit', (event) => {
    event.preventDefault();
    newsletterMessage.classList.remove('hidden');
  });
}

const revealTargets = document.querySelectorAll(
  '#danhmuc h2, #danhmuc > div > p, #productGrid .product-card, #loiich > div, ' +
  '#danhgia h2, #danhgia article, #lienhe > h2, #lienhe > p, #lienhe > div > div, ' +
  '#lienhe form, #cta h2, #cta p, #cta .mt-7'
);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  revealTargets.forEach((element) => element.classList.add('is-visible'));
} else if ('IntersectionObserver' in window) {
  revealTargets.forEach((element, index) => {
    element.classList.add('reveal-on-scroll');
    element.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`);
  });
  document.body.classList.add('motion-ready');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  revealTargets.forEach((element) => revealObserver.observe(element));
}

const cartButton = document.getElementById('cartBtn');
const loginButton = document.getElementById('loginBtn');
const loginDialog = document.getElementById('loginDialog');
const cartCount = document.getElementById('cartCount');
const cartDialog = document.getElementById('cartDialog');
const cartItemsContainer = document.getElementById('cartItems');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartSubtotalLabel = document.getElementById('cartSubtotalLabel');
const cartPriceNote = document.getElementById('cartPriceNote');
const productDialog = document.getElementById('productDialog');
const notice = document.getElementById('shopNotice');
const cartStorageKey = 'tien-tao-cart';
const products = new Map();
let activeProductId = null;
let cart = [];
let noticeTimer;

const formatPrice = (price) => `${new Intl.NumberFormat('vi-VN').format(price)}đ`;

const productIdFromName = (name) => name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const showNotice = (message) => {
  if (!notice) return;
  notice.textContent = message;
  notice.classList.add('is-visible');
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => notice.classList.remove('is-visible'), 2600);
};

const readCart = () => {
  try {
    const savedCart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
    if (!Array.isArray(savedCart)) throw new Error('Dữ liệu giỏ hàng không hợp lệ.');
    return savedCart.filter((item) => {
      return item && products.has(item.id) && Number.isInteger(item.quantity) && item.quantity > 0;
    }).map((item) => ({ id: item.id, quantity: item.quantity }));
  } catch (error) {
    showNotice('Không thể khôi phục giỏ hàng đã lưu. Bạn có thể tiếp tục mua sắm.');
    return [];
  }
};

const saveCart = () => {
  try {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    return true;
  } catch (error) {
    showNotice('Không thể lưu giỏ hàng trên thiết bị này.');
    return false;
  }
};

const renderCart = () => {
  if (!cartItemsContainer || !cartCount || !cartSubtotal) return;

  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = String(totalQuantity);
  cartCount.setAttribute('aria-label', `${totalQuantity} sản phẩm trong giỏ`);
  cartItemsContainer.replaceChildren();

  if (!cart.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'text-soft text-sm py-5';
    emptyMessage.textContent = 'Giỏ hàng đang trống. Hãy chọn sản phẩm bạn quan tâm.';
    cartItemsContainer.append(emptyMessage);
  }

  cart.forEach((item) => {
    const product = products.get(item.id);
    if (!product) return;

    const row = document.createElement('div');
    row.className = 'cart-item';

    const image = document.createElement('img');
    image.className = 'cart-item-image';
    image.src = product.image;
    image.alt = product.name;
    image.loading = 'lazy';

    const info = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'cart-item-title';
    name.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'cart-item-price';
    price.textContent = product.price === null ? 'Giá cần xác nhận' : formatPrice(product.price);

    const quantity = document.createElement('div');
    quantity.className = 'cart-quantity';
    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.dataset.cartAction = 'decrease';
    decrease.dataset.productId = item.id;
    decrease.setAttribute('aria-label', `Giảm số lượng ${product.name}`);
    decrease.textContent = '−';
    const quantityText = document.createElement('span');
    quantityText.textContent = String(item.quantity);
    const increase = document.createElement('button');
    increase.type = 'button';
    increase.dataset.cartAction = 'increase';
    increase.dataset.productId = item.id;
    increase.setAttribute('aria-label', `Tăng số lượng ${product.name}`);
    increase.textContent = '+';
    quantity.append(decrease, quantityText, increase);

    info.append(name, price, quantity);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'cart-remove';
    remove.dataset.cartAction = 'remove';
    remove.dataset.productId = item.id;
    remove.textContent = 'Xóa';
    row.append(image, info, remove);
    cartItemsContainer.append(row);
  });

  const hasUnpricedProduct = cart.some((item) => products.get(item.id)?.price === null);
  const pricedTotal = cart.reduce((total, item) => {
    const price = products.get(item.id)?.price;
    return price === null || price === undefined ? total : total + price * item.quantity;
  }, 0);

  cartSubtotalLabel.textContent = hasUnpricedProduct ? 'Tạm tính sản phẩm đã có giá' : 'Tạm tính';
  cartSubtotal.textContent = hasUnpricedProduct && pricedTotal === 0
    ? 'Liên hệ báo giá'
    : formatPrice(pricedTotal);
  if (cartPriceNote) cartPriceNote.classList.toggle('hidden', !hasUnpricedProduct);
};

const addToCart = (productId) => {
  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  saveCart();
  renderCart();
  showNotice(`Đã thêm ${products.get(productId).name} vào giỏ hàng.`);
};

productCards.forEach((card) => {
  const name = card.querySelector('h3')?.textContent.trim();
  const description = card.querySelector('p.text-soft')?.textContent.trim();
  const priceText = card.querySelector('.mt-4.flex.items-center.justify-between span')?.textContent.trim();
  const image = card.querySelector('.product-photo');
  const category = card.dataset.cat;
  if (!name || !description || !priceText || !image) return;

  const id = productIdFromName(name);
  const numericPrice = Number(priceText.replace(/[^\d]/g, ''));
  products.set(id, {
    id,
    name,
    description,
    category,
    image: image.getAttribute('src'),
    price: Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : null
  });

  const priceRow = card.querySelector('.mt-4.flex.items-center.justify-between');
  const existingDetailsLink = priceRow?.querySelector('a');
  if (existingDetailsLink) {
    const detailsButton = document.createElement('button');
    detailsButton.type = 'button';
    detailsButton.className = 'detail-button';
    detailsButton.dataset.productAction = 'details';
    detailsButton.dataset.productId = id;
    detailsButton.textContent = 'Xem chi tiết';
    existingDetailsLink.replaceWith(detailsButton);
  }

  const actions = document.createElement('div');
  actions.className = 'product-actions';
  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'add-cart-button';
  addButton.dataset.productAction = 'add';
  addButton.dataset.productId = id;
  addButton.textContent = 'Thêm vào giỏ';
  actions.append(addButton);
  card.append(actions);
});

cart = readCart();
renderCart();

if (cartButton && cartDialog) {
  cartButton.addEventListener('click', () => cartDialog.showModal());
}

if (loginButton && loginDialog) {
  loginButton.addEventListener('click', () => loginDialog.showModal());
}

const loginStatus = document.getElementById('loginStatus');
const showLoginStatus = (message) => {
  if (!loginStatus) return;
  loginStatus.textContent = message;
  loginStatus.hidden = false;
};

document.querySelectorAll('[data-login-method]').forEach((button) => {
  button.addEventListener('click', () => {
    const selectedMethod = button.dataset.loginMethod;
    document.querySelectorAll('[data-login-method]').forEach((methodButton) => {
      const isSelected = methodButton === button;
      methodButton.classList.toggle('is-active', isSelected);
      methodButton.setAttribute('aria-pressed', String(isSelected));
    });
    document.querySelectorAll('[data-login-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.loginPanel !== selectedMethod;
    });
    if (loginStatus) loginStatus.hidden = true;
  });
});

document.getElementById('emailLoginForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  showLoginStatus('Chưa thể xác thực tài khoản: trang chưa kết nối máy chủ đăng nhập. Thông tin bạn nhập không được gửi đi.');
});

document.getElementById('phoneLoginForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  showLoginStatus('Chưa thể gửi mã OTP: trang chưa kết nối nhà cung cấp xác thực qua tin nhắn.');
});

document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
  showLoginStatus('Đăng nhập Google chưa khả dụng vì Tiến Táo chưa được cấu hình OAuth.');
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const productActionButton = target.closest('[data-product-action]');
  if (productActionButton) {
    const { productAction, productId } = productActionButton.dataset;
    if (productAction === 'add' && productId) addToCart(productId);
    if (productAction === 'details' && productId) {
      const product = products.get(productId);
      if (!product || !productDialog) return;
      activeProductId = productId;
      document.getElementById('detailImage').src = product.image;
      document.getElementById('detailImage').alt = product.name;
      document.getElementById('detailCategory').textContent = product.category;
      document.getElementById('productDialogTitle').textContent = product.name;
      document.getElementById('detailPrice').textContent = product.price === null
        ? 'Liên hệ để biết giá'
        : formatPrice(product.price);
      document.getElementById('detailDescription').textContent = product.description;
      productDialog.showModal();
    }
  }

  const cartActionButton = target.closest('[data-cart-action]');
  if (cartActionButton) {
    const { cartAction, productId } = cartActionButton.dataset;
    const cartItem = cart.find((item) => item.id === productId);
    if (!cartItem) return;
    if (cartAction === 'increase') cartItem.quantity += 1;
    if (cartAction === 'decrease') cartItem.quantity -= 1;
    if (cartAction === 'remove' || cartItem.quantity <= 0) {
      cart = cart.filter((item) => item.id !== productId);
    }
    saveCart();
    renderCart();
  }

  const closeButton = target.closest('[data-close-dialog]');
  if (closeButton) closeButton.closest('dialog')?.close();
});

if (productDialog) {
  document.getElementById('detailAddToCart')?.addEventListener('click', () => {
    if (!activeProductId) return;
    addToCart(activeProductId);
    productDialog.close();
  });
}

[cartDialog, productDialog, loginDialog].forEach((dialog) => {
  if (!dialog) return;
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openDialog = document.querySelector('dialog[open]');
  if (openDialog) openDialog.close();
});

document.getElementById('cartContactLink')?.addEventListener('click', () => cartDialog?.close());
document.getElementById('detailContactLink')?.addEventListener('click', () => productDialog?.close());
