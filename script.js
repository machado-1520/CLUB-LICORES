(() => {
  "use strict";

  const AGE_KEY = "elClubLicoreria.ageVerified.v8";
  const gate = document.getElementById("ageGate");
  const app = document.getElementById("app");
  const enter = document.getElementById("enterBtn");
  const exit = document.getElementById("exitBtn");
  const error = document.getElementById("ageError");
  const ageDescription = document.getElementById("ageDescription");
  const menu = document.getElementById("menuBtn");
  const mobileNav = document.getElementById("mobileNav");

  const header = document.querySelector(".header");
  const heroBrand = document.querySelector(".hero__brand");
  const updateBrandOnScroll = () => {
    const isScrolled = window.scrollY > 100;
    header?.classList.toggle("is-scrolled", isScrolled);
    if (heroBrand) {
      heroBrand.style.opacity = isScrolled ? "0" : "1";
      heroBrand.style.transform = isScrolled
        ? "translateX(-50%) translateY(-10px) scale(.94)"
        : "translateX(-50%) translateY(0) scale(1)";
      heroBrand.style.pointerEvents = isScrolled ? "none" : "auto";
    }
  };
  window.addEventListener("scroll", updateBrandOnScroll, { passive: true });
  updateBrandOnScroll();

  let ageWarningShown = false;

  const unlock = () => {
    gate.remove();
    app.setAttribute("aria-hidden", "false");
    app.removeAttribute("inert");
    document.body.classList.remove("locked");
  };

  const showGate = () => {
    document.body.classList.add("locked");
    app.setAttribute("aria-hidden", "true");
    app.setAttribute("inert", "");
    gate.hidden = false;
    gate.removeAttribute("aria-hidden");
    window.requestAnimationFrame(() => enter.focus());
  };

  const verifyAge = () => {
    try {
      localStorage.setItem(AGE_KEY, "true");
    } catch (_) {
      // La confirmación se mantiene durante esta visita si el almacenamiento no está disponible.
    }
    unlock();
  };

  let ageVerified = false;
  try {
    ageVerified = localStorage.getItem(AGE_KEY) === "true";
  } catch (_) {
    // Si el almacenamiento está bloqueado, se solicita confirmación en cada visita.
  }

  if (ageVerified) {
    unlock();
  } else {
    showGate();
  }

  // Mientras no se confirme la edad, ninguna interacción fuera de los botones
  // del diálogo puede cerrar el aviso ni activar elementos de la página.
  const isAgeChoiceButton = target =>
    target instanceof Element &&
    Boolean(target.closest("#ageGate .age-gate__panel #enterBtn, #ageGate .age-gate__panel #exitBtn"));

  const blockOutsideAgeGate = event => {
    if (!gate.isConnected) return;
    if (!isAgeChoiceButton(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
  };

  ["pointerdown", "pointerup", "click", "touchstart", "touchend"].forEach(type => {
    document.addEventListener(type, blockOutsideAgeGate, { capture: true, passive: false });
  });

  document.addEventListener("keydown", event => {
    if (gate.isConnected && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }
  }, true);

  gate.addEventListener("submit", event => event.preventDefault());

  enter.addEventListener("click", verifyAge);

  exit.addEventListener("click", () => {
    if (!ageWarningShown) {
      ageWarningShown = true;
      ageDescription.textContent = "El alcohol es perjudicial para la salud. Prohibida la venta y el suministro de bebidas alcohólicas a menores de 18 años. Si eres menor de edad, no ingreses.";
      error.textContent = "No se permite el acceso al catálogo a menores de 18 años.";
      error.hidden = false;
      exit.textContent = "Volver";
      exit.setAttribute("aria-label", "Volver a la pregunta de verificación de edad");
      error.focus();
      return;
    }

    ageWarningShown = false;
    ageDescription.textContent = "Este sitio es para personas mayores de edad. Confirma para continuar.";
    error.textContent = "Debes ser mayor de edad para ingresar.";
    error.hidden = true;
    exit.textContent = "No, salir";
    exit.removeAttribute("aria-label");
  });

  // Mantiene el foco dentro del diálogo mientras se muestra la verificación.
  gate.addEventListener("keydown", event => {
    if (event.key !== "Tab" || gate.hidden) return;
    const focusable = [...gate.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const toggleMenu = () => {
    const open = !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", String(open));
    mobileNav.classList.toggle("is-open", open);
    mobileNav.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("mobile-menu-open", open);
    if (open) {
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      mobileNav.style.top = `${Math.ceil(headerBottom + 8)}px`;
    }
  };

  menu.addEventListener("click", toggleMenu);

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("is-open");
      mobileNav.setAttribute("aria-hidden", "true");
      document.body.classList.remove("mobile-menu-open");
      menu.focus({ preventScroll: true });
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      menu.classList.remove("is-open");
      menu.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("is-open");
      mobileNav.setAttribute("aria-hidden", "true");
      document.body.classList.remove("mobile-menu-open");
      menu.focus({ preventScroll: true });
    }
  });


  // Configuración y datos del catálogo.
  const catalog = (() => {
    const base = Array.isArray(window.PRODUCT_CATALOG) ? window.PRODUCT_CATALOG : [];
    try {
      const saved = JSON.parse(localStorage.getItem("elClubLicoreria.adminCatalog.v1") || "null");
      if (Array.isArray(saved)) return saved;
    } catch (_) {}
    return base;
  })();
  const grid = document.getElementById("catalogGrid");
  const searchInput = document.getElementById("catalogSearch");
  const filters = document.getElementById("categoryFilters");
  const count = document.getElementById("catalogCount");
  const empty = document.getElementById("catalogEmpty");
  const loadMore = document.getElementById("loadMoreProducts");
  const clearSearch = document.getElementById("clearSearch");
  const sortSelect = document.getElementById("catalogSort");
  const PAGE_SIZE = 48;
  // Configura aquí el número de WhatsApp del negocio en formato internacional,
  // solo dígitos y sin +, espacios ni guiones. Ejemplo de formato: 57XXXXXXXXXX.
  const WHATSAPP_NUMBER = "573105258221"; 
  const CART_KEY = "elClubLicoreria.cart.v6";
  const cartFab = document.getElementById("cartFab");
  const cartPanel = document.getElementById("cartPanel");
  const cartBackdrop = document.getElementById("cartBackdrop");
  const cartItems = document.getElementById("cartItems");
  const cartEmpty = document.getElementById("cartEmpty");
  const cartFabCount = document.getElementById("cartFabCount");
  const cartTotalItems = document.getElementById("cartTotalItems");
  const productById = new Map(catalog.map(product => [product.id, product]));
  let cart = {};
  try {
    const currentCart = JSON.parse(localStorage.getItem(CART_KEY) || "null");
    if (currentCart && typeof currentCart === "object" && !Array.isArray(currentCart)) {
      cart = currentCart;
    } else {
      // Migra el carrito anterior basado en índices a IDs permanentes.
      const legacyCart = JSON.parse(localStorage.getItem("elClubLicoreria.cart.v5") || "{}");
      if (legacyCart && typeof legacyCart === "object" && !Array.isArray(legacyCart)) {
        Object.entries(legacyCart).forEach(([legacyIndex, quantity]) => {
          const product = catalog[Number(legacyIndex)];
          if (product && Number.isInteger(quantity) && quantity > 0) cart[product.id] = quantity;
        });
      }
    }
  } catch (_) {
    cart = {};
  }
  let activeCategory = "__all";
  let visibleCount = PAGE_SIZE;
  let searchTerm = "";
  let selectedBrand = null;

  const categories = [...new Set(catalog.map(product => product.category).filter(Boolean))]
    .sort((a, b) => {
      if (a === "Aguardientes") return -1;
      if (b === "Aguardientes") return 1;
      return a.localeCompare(b, "es");
    });

  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-chip";
    button.dataset.category = category;
    button.setAttribute("aria-pressed", "false");
    button.textContent = category;
    filters.appendChild(button);
  });

  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  const categoryIcon = category => ({
    "Aguardientes": "🥃", "Ron": "🥃", "Rones": "🥃", "Tequila": "🍸", "Whisky": "🥃",
    "Vodka": "🍸", "Vinos": "🍷", "Cervezas": "🍺", "Brandy y coñac": "🥃",
    "Espumosos y champaña": "🥂", "Bebidas sin alcohol": "🥤",
    "Dulces y confitería": "🍬", "Mecato y snacks": "🍿"
  })[category] || "✦";

  const normalized = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const filteredProducts = () => catalog.filter(product => {
    if (product.visible === false) return false;
    const matchesCategory = activeCategory === "__all" || product.category === activeCategory;
    const matchesSearch = !searchTerm || normalized(`${product.name} ${product.category} ${product.section}`).includes(normalized(searchTerm));
    return matchesCategory && matchesSearch;
  });

    // Agrupa por marca solo al entrar a una categoría. "Ver todo" conserva
  // cada presentación como producto independiente.
  const brandRules = [
    ["Aguardiente Antioqueño", /aguardiente antioqueño/i],
    ["Aguardiente Amarillo de Manzanares", /aguardiente amarillo de manzanares/i],
    ["Los Cuates", /los cuates/i],
    ["Cinco Estrellas", /cinco estrellas/i],
    ["Domecq", /domecq/i],
    ["Ron Viejo de Caldas", /ron viejo de caldas/i],
    ["Ron Medellín", /ron medell[ií]n/i],
    ["Cheers", /\bcheers\b/i],
    ["Alteza", /alteza/i],
    ["Redd’s", /redd['’]?s/i],
    ["Poker", /\bpoker\b/i],
    ["Águila", /[áa]guila/i],
    ["Club Colombia", /club colombia/i],
    ["Andina", /\bandina\b/i],
    ["Budweiser", /budweiser/i],
    ["Corona", /\bcorona\b/i],
    ["Michelob Ultra", /michelob ultra/i],
    ["Pilsen", /\bpilsen\b/i],
    ["Costeñita", /costeñita|costena/i],
    ["BBC", /\bbbc\b/i],
    ["Stella Artois", /stella artois/i],
    ["Sol", /\b(sol|cerveza sol)\b/i],
    ["Ambrosía", /amaretto ambros[ií]a/i],
    ["Baileys", /\bbaileys\b/i],
    ["Brissart", /\bbrissart\b/i],
    ["Convier", /\bconvier\b/i],
    ["Coloma", /\bcoloma\b/i],
    ["Hot Brother's", /hot brother'?s/i],
    ["Jägermeister", /j[aä]germeister/i],
    ["Libertador", /\blibertador\b/i],
    ["Like", /\blike\b/i],
    ["Sanson", /\bsanson\b|bacarl[eé]s/i]
  ];
  const getBrand = product => {
    const match = brandRules.find(([, pattern]) => pattern.test(product.name));
    return match ? match[0] : null;
  };
  const brandProducts = (products) => {
    const grouped = new Map();
    products.forEach(product => {
      const brand = getBrand(product);
      // Los nombres sin marca inequívoca quedan como producto individual.
      const key = brand || `__single_${product.id}`;
      if (!grouped.has(key)) grouped.set(key, { brand: brand || product.name, products: [] });
      grouped.get(key).products.push(product);
    });
    return [...grouped.values()];
  };
  const renderProductCard = (product, index) => {
    const name = escapeHtml(product.name);
    const category = escapeHtml(product.category);
    const image = product.image ? `<img src="${escapeHtml(product.image)}" alt="${name}" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('product__visual--placeholder');this.remove()">` : "";
    const placeholder = product.image ? "" : `<span class="catalog-placeholder__icon" aria-hidden="true">${categoryIcon(product.category)}</span><span class="catalog-placeholder__note">Imagen por agregar</span>`;
    return `<article class="product catalog-product">
      <div class="product__visual catalog-product__visual ${product.image ? "" : "product__visual--placeholder"}">
        <span class="product__category">${category}</span>${product.stockStatus === "out" ? '<span class="stock-badge stock-badge--out">Agotado</span>' : product.stockStatus === "low" ? '<span class="stock-badge stock-badge--low">Quedan 5</span>' : ""}${image}${placeholder}
        <span class="product__index">${String(index + 1).padStart(2, "0")}</span>
      </div>
      <div class="product__info product__info--stacked"><span>${category}</span><h3>${name}</h3>
        <button class="add-to-cart" type="button" data-add-to-cart="${escapeHtml(product.id)}" ${product.stockStatus === "out" ? "disabled" : ""} aria-label="Agregar ${name} al carrito">${product.stockStatus === "out" ? "Agotado" : "＋ Agregar al carrito"}</button>
      </div>
    </article>`;
  };
  const sortProducts = products => {
    const result = [...products];
    switch (sortSelect?.value) {
      case "name-asc":
        return result.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
      case "name-desc":
        return result.sort((a, b) => b.name.localeCompare(a.name, "es", { sensitivity: "base" }));
      case "category":
        return result.sort((a, b) =>
          a.category.localeCompare(b.category, "es", { sensitivity: "base" }) ||
          a.name.localeCompare(b.name, "es", { sensitivity: "base" })
        );
      default:
        return result;
    }
  };

  const renderCatalog = () => {
    const matches = filteredProducts();
    const categoryView = activeCategory !== "__all";
    const selectedProducts = sortProducts(selectedBrand
      ? matches.filter(product => (getBrand(product) || product.name) === selectedBrand)
      : matches);
    const groupedView = categoryView && !selectedBrand && !searchTerm;
    const entries = groupedView ? brandProducts(selectedProducts) : null;
    if (entries && sortSelect?.value !== "featured") {
      entries.sort((a, b) => {
        if (sortSelect.value === "name-desc") return b.brand.localeCompare(a.brand, "es", { sensitivity: "base" });
        if (sortSelect.value === "category") {
          const categoryA = a.products[0]?.category || "";
          const categoryB = b.products[0]?.category || "";
          return categoryA.localeCompare(categoryB, "es", { sensitivity: "base" }) ||
            a.brand.localeCompare(b.brand, "es", { sensitivity: "base" });
        }
        return a.brand.localeCompare(b.brand, "es", { sensitivity: "base" });
      });
    }
    const displayCount = groupedView ? entries.length : selectedProducts.length;
    count.textContent = `${displayCount.toLocaleString("es-CO")} ${groupedView ? "marcas o grupos" : displayCount === 1 ? "producto" : "productos"}${categoryView ? ` · ${activeCategory}` : ""}`;
    empty.hidden = displayCount !== 0;
    if (displayCount === 0) empty.textContent = "No hay productos que coincidan con la búsqueda.";

    let html = "";
    if (selectedBrand) {
      html += `<div class="brand-detail-heading"><button type="button" class="brand-back" data-back-brands>← Todas las marcas</button><div><span class="kicker">${escapeHtml(activeCategory)}</span><h2>${escapeHtml(selectedBrand)}</h2><p>Elige la presentación que necesitas.</p></div></div>`;
      html += selectedProducts.slice(0, visibleCount).map(renderProductCard).join("");
    } else if (groupedView) {
      html += entries.slice(0, visibleCount).map((group, index) => {
        const representative = group.products.find(product =>
          !/sixpack|bandeja|canasta|empaque|caja|pack/i.test(product.name)
        ) || group.products[0];
        if (!getBrand(representative)) return renderProductCard(representative, index);
        const brand = escapeHtml(group.brand);
        const category = escapeHtml(representative.category);
        const image = representative.image
          ? `<img src="${escapeHtml(representative.image)}" alt="Cervezas ${brand}" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('product__visual--placeholder');this.remove()">`
          : `<span class="catalog-placeholder__icon" aria-hidden="true">${categoryIcon(representative.category)}</span>`;
        return `<article class="product catalog-product brand-card">
          <button type="button" class="brand-card__open" data-open-brand="${brandRules.find(([name])=>name===group.brand)?.[0] ? escapeHtml(group.brand) : escapeHtml(group.brand)}" aria-label="Ver productos de ${brand}">
            <div class="product__visual catalog-product__visual">${`<span class="product__category">${category}</span>`}${image}<span class="product__index">${String(index+1).padStart(2,"0")}</span></div>
            <div class="product__info product__info--stacked"><span>${category}</span><h3>${category === "Cervezas" ? `Cervezas ${brand}` : brand}</h3><p class="brand-card__count">${group.products.length} presentaciones disponibles</p><span class="brand-card__cta">Ver opciones <b>→</b></span></div>
          </button>
        </article>`;
      }).join("");
    } else {
      html = selectedProducts.slice(0, visibleCount).map(renderProductCard).join("");
    }
    grid.innerHTML = html;
    loadMore.hidden = displayCount <= visibleCount;
  };

  const MAX_QUANTITY_PER_PRODUCT = 99;
  const safeCartEntries = () => Object.entries(cart).filter(([id, quantity]) =>
    productById.has(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= MAX_QUANTITY_PER_PRODUCT
  );
  const saveCart = () => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {
      // El carrito continúa disponible durante la sesión aunque no pueda persistirse.
    }
  };
  const openCart = () => {
    cartPanel.classList.add("is-open");
    cartBackdrop.hidden = false;
    cartPanel.setAttribute("aria-hidden", "false");
    cartFab.setAttribute("aria-expanded", "true");
    document.body.classList.add("cart-open");
  };
  const closeCart = () => {
    cartPanel.classList.remove("is-open");
    cartBackdrop.hidden = true;
    cartPanel.setAttribute("aria-hidden", "true");
    cartFab.setAttribute("aria-expanded", "false");
    document.body.classList.remove("cart-open");
    cartFab.focus({ preventScroll: true });
  };
  const updateCart = () => {
    const entries = safeCartEntries();
    const total = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
    cartFabCount.textContent = String(total);
    cartTotalItems.textContent = `${total} ${total === 1 ? "unidad" : "unidades"}`;
    cartEmpty.hidden = entries.length > 0;
    cartItems.innerHTML = entries.map(([id, quantity]) => {
      const product = productById.get(id);
      const title = escapeHtml(product.name);
      const category = escapeHtml(product.category);
      const image = product.image
        ? `<img src="${escapeHtml(product.image)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">`
        : `<span class="cart-item__placeholder">${categoryIcon(product.category)}</span>`;
      return `<article class="cart-item">
        <div class="cart-item__image">${image}</div>
        <div class="cart-item__details"><strong>${title}</strong><span>${category}</span>
          <div class="quantity-control" aria-label="Cantidad de ${title}">
            <button type="button" data-cart-action="decrease" data-cart-id="${escapeHtml(id)}" aria-label="Quitar una unidad">−</button>
            <span>${quantity}</span>
            <button type="button" data-cart-action="increase" data-cart-id="${escapeHtml(id)}" aria-label="Agregar una unidad">＋</button>
          </div>
        </div>
        <button class="cart-item__remove" type="button" data-cart-action="remove" data-cart-id="${escapeHtml(id)}">Quitar</button>
      </article>`;
    }).join("");
    saveCart();
  };

  grid.addEventListener("click", event => {
    const brandButton = event.target.closest("[data-open-brand]");
    if (brandButton) {
      selectedBrand = brandButton.dataset.openBrand;
      visibleCount = PAGE_SIZE;
      renderCatalog();
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (event.target.closest("[data-back-brands]")) {
      selectedBrand = null;
      visibleCount = PAGE_SIZE;
      renderCatalog();
      return;
    }
    const button = event.target.closest("[data-add-to-cart]");
    if (!button) return;
    const id = button.dataset.addToCart;
    cart[id] = Math.min((Number(cart[id]) || 0) + 1, MAX_QUANTITY_PER_PRODUCT);
    updateCart();
    button.classList.add("is-added");
    button.textContent = "✓ Agregado";
    window.setTimeout(() => {
      if (!button.isConnected) return;
      button.classList.remove("is-added");
      button.textContent = "＋ Agregar al carrito";
    }, 1100);
  });
  cartItems.addEventListener("click", event => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;
    const id = button.dataset.cartId;
    const action = button.dataset.cartAction;
    if (action === "increase") cart[id] = Math.min((Number(cart[id]) || 0) + 1, MAX_QUANTITY_PER_PRODUCT);
    if (action === "decrease") {
      cart[id] = (Number(cart[id]) || 0) - 1;
      if (cart[id] <= 0) delete cart[id];
    }
    if (action === "remove") delete cart[id];
    updateCart();
  });
  cartFab.addEventListener("click", () => cartPanel.classList.contains("is-open") ? closeCart() : openCart());
  document.getElementById("cartClose").addEventListener("click", closeCart);
  cartBackdrop.addEventListener("click", closeCart);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && cartPanel.classList.contains("is-open")) closeCart();
  });

  document.getElementById("checkoutWhatsApp").addEventListener("click", () => {
    const entries = safeCartEntries();
    if (!entries.length) {
      alert("Tu carrito está vacío. Agrega al menos un producto para continuar.");
      return;
    }

    // WhatsApp exige el número internacional sin +, espacios ni signos.
    const phone = String(WHATSAPP_NUMBER).replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(phone)) {
      alert("El número de WhatsApp de la tienda no está configurado correctamente. Contáctanos por otro medio.");
      return;
    }

    const lines = entries.map(([id, quantity]) => {
      const product = productById.get(id);
      if (!product) return null;
      return `• ${product.name} (${product.category}) — cantidad: ${quantity}`;
    }).filter(Boolean);

    if (!lines.length) {
      alert("No encontramos productos válidos en tu carrito. Vuelve a agregarlos e inténtalo de nuevo.");
      return;
    }

    const totalUnits = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
    const message = [
      "¡Hola, El Club Licorería! 🛒 Quiero hacer este pedido:",
      "",
      ...lines,
      "",
      `Total de unidades: ${totalUnits}`,
      "",
      "¿Me confirman disponibilidad y me indican el proceso para coordinar el domicilio? Les comparto la dirección cuando me contacten."
    ].join("\n");

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Navegación en la misma pestaña: evita bloqueadores de pop-ups y funciona
    // de forma consistente desde Safari iOS, Chrome Android y navegadores de escritorio.
    window.location.assign(whatsappUrl);
  });
  cart = Object.fromEntries(safeCartEntries());
  updateCart();

  filters.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    selectedBrand = null;
    visibleCount = PAGE_SIZE;
    filters.querySelectorAll("[data-category]").forEach(item => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    renderCatalog();
  });

  searchInput.addEventListener("input", () => {
    searchTerm = searchInput.value.trim();
    selectedBrand = null;
    clearSearch.hidden = !searchInput.value;
    visibleCount = PAGE_SIZE;
    renderCatalog();
  });
  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchTerm = "";
    selectedBrand = null;
    clearSearch.hidden = true;
    visibleCount = PAGE_SIZE;
    renderCatalog();
    searchInput.focus();
  });
  loadMore.addEventListener("click", () => {
    visibleCount += PAGE_SIZE;
    renderCatalog();
  });
  sortSelect?.addEventListener("change", () => {
    visibleCount = PAGE_SIZE;
    renderCatalog();
  });
  renderCatalog();

  document.getElementById("year").textContent = new Date().getFullYear();
})();
