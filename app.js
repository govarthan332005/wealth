// ============================================================
//  SLICE INVEST — Enhanced App v4.3 (FULLY FIXED)
//  FIXES: Splash/Login race condition, missing CSS classes,
//         variable shadowing, async error handling,
//         page visibility on reload, referral dashboard,
//         withdraw modal restore, and many more
// ============================================================

// ─── SPLASH SCREEN (FIX: Multiple safety nets) ────────────
window.__sliceAutoLoginSucceeded = false;
window.__sliceBackendReady = false;
window.__sliceLoginPageShown = false;

// ═══ FIX #1: Guarantee page visibility even if JS crashes later ═══
// This runs IMMEDIATELY before anything else and ensures login shows
(function guaranteePageVisibility() {
  // Ultimate safety: after 6 seconds, force show login page no matter what
  window.__ultimateSafetyTimeout = setTimeout(function() {
    try {
      var splash = document.getElementById("splashScreen");
      var login = document.getElementById("loginPage");
      var dashboard = document.getElementById("userDashboard");
      var dashboardVisible = dashboard && !dashboard.classList.contains("hidden");
      
      // Only intervene if nothing is visible
      if (!dashboardVisible && login && login.classList.contains("hidden")) {
        console.warn("[SliceInvest] Ultimate safety: forcing login page visible");
        if (splash && !splash.classList.contains("hidden")) {
          splash.style.opacity = "0";
          splash.style.transition = "opacity 0.3s ease";
          setTimeout(function() { splash.classList.add("hidden"); }, 300);
        }
        login.classList.remove("hidden");
        window.__sliceLoginPageShown = true;
      }
    } catch(e) { console.error("[SliceInvest] Safety timeout error:", e); }
  }, 6000);
})();

(function handleSplash() {
  // v13: Slightly longer splash to enjoy the premium animation,
  // but still feels snappy thanks to cached config/data on dashboard.
  // Safety: force-remove splash after 8 seconds no matter what
  var safetyTimeout = setTimeout(function() {
    var splash = document.getElementById("splashScreen");
    if (splash && !splash.classList.contains("hidden")) {
      console.warn("[SliceInvest] Splash safety timeout triggered");
      splash.style.opacity = "0";
      splash.style.transition = "opacity 0.4s ease";
      setTimeout(function() {
        splash.classList.add("hidden");
        var dashboard = document.getElementById("userDashboard");
        if (!dashboard || dashboard.classList.contains("hidden")) {
          document.getElementById("loginPage").classList.remove("hidden");
          window.__sliceLoginPageShown = true;
        }
      }, 400);
    }
  }, 8000);

  setTimeout(function() {
    var splash = document.getElementById("splashScreen");
    if (!splash) return;
    // If auto-login already handled it, just hide splash
    if (window.__sliceAutoLoginSucceeded) {
      splash.style.opacity = "0";
      splash.style.transform = "scale(1.04)";
      splash.style.transition = "opacity 0.45s ease, transform 0.45s ease";
      setTimeout(function() { splash.classList.add("hidden"); }, 450);
      clearTimeout(safetyTimeout);
      return;
    }
    splash.style.opacity = "0";
    splash.style.transform = "scale(1.04)";
    splash.style.transition = "opacity 0.7s ease, transform 0.7s ease";
    setTimeout(function() {
      splash.classList.add("hidden");
      clearTimeout(safetyTimeout);
      var dashboard = document.getElementById("userDashboard");
      if (!dashboard || dashboard.classList.contains("hidden")) {
        document.getElementById("loginPage").classList.remove("hidden");
        window.__sliceLoginPageShown = true;
      }
    }, 700);
  }, 2600);
})();

// ─── TAB SWITCHING (Login) ──────────────────────────────────
document.querySelectorAll(".tab-btn").forEach(function(btn) {
  btn.addEventListener("click", function() {
    document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
    document.querySelectorAll(".login-form").forEach(function(f) { f.classList.remove("active"); });
    btn.classList.add("active");
    var formId = btn.dataset.tab + "LoginForm";
    var form = document.getElementById(formId);
    if (form) form.classList.add("active");
  });
});

window.switchToSignup = function(e) {
  if (e) e.preventDefault();
  document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
  document.querySelectorAll(".login-form").forEach(function(f) { f.classList.remove("active"); });
  var signupTab = document.querySelector('.tab-btn[data-tab="signup"]');
  var signupForm = document.getElementById("signupLoginForm");
  if (signupTab) signupTab.classList.add("active");
  if (signupForm) signupForm.classList.add("active");
};

window.switchToLogin = function(e) {
  if (e) e.preventDefault();
  document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
  document.querySelectorAll(".login-form").forEach(function(f) { f.classList.remove("active"); });
  var userTab = document.querySelector('.tab-btn[data-tab="user"]');
  var userForm = document.getElementById("userLoginForm");
  if (userTab) userTab.classList.add("active");
  if (userForm) userForm.classList.add("active");
};

// ─── MODAL CLOSE ON OVERLAY CLICK ──────────────────────────
document.querySelectorAll(".modal-overlay").forEach(function(overlay) {
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) overlay.classList.add("hidden");
  });
});

// ─── TOGGLE PASSWORD ────────────────────────────────────────
window.togglePass = function(id, btn) {
  var el = document.getElementById(id);
  if (!el) return;
  if (el.type === "password") {
    el.type = "text";
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    el.type = "password";
    btn.innerHTML = '<i class="fas fa-eye"></i>';
  }
};

// ─── MODAL helpers ──────────────────────────────────────────
window.openModal  = function(id) { var m = document.getElementById(id); if(m) m.classList.remove("hidden"); };
window.closeModal = function(id) { var m = document.getElementById(id); if(m) m.classList.add("hidden"); };

// ─── BANK TYPE SWITCH ───────────────────────────────────────
window.switchBankType = function(type, btn) {
  document.querySelectorAll(".bt-tab").forEach(function(b) { b.classList.remove("active"); });
  btn.classList.add("active");
  var bankFields = document.getElementById("bankFields");
  var upiFields = document.getElementById("upiFields");
  if (bankFields) bankFields.classList.toggle("hidden", type !== "bank");
  if (upiFields) upiFields.classList.toggle("hidden", type !== "upi");
};

// ─── SCREENSHOT UPLOAD HANDLING ─────────────────────────────
var uploadedScreenshot = null;

window.handleScreenshotUpload = function(event) {
  event.stopPropagation();
  var file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    if (window._showToast) window._showToast("Please upload an image file.", "error");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    if (window._showToast) window._showToast("File too large. Max 5MB.", "error");
    return;
  }

  uploadedScreenshot = file;

  var reader = new FileReader();
  reader.onload = function(e) {
    var placeholder = document.getElementById("screenshotPlaceholder");
    var preview = document.getElementById("screenshotPreview");
    var previewImg = document.getElementById("screenshotPreviewImg");

    if (placeholder) placeholder.classList.add("hidden");
    if (preview) preview.classList.remove("hidden");
    if (previewImg) previewImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

window.removeScreenshot = function(event) {
  event.stopPropagation();
  uploadedScreenshot = null;

  var placeholder = document.getElementById("screenshotPlaceholder");
  var preview = document.getElementById("screenshotPreview");
  var previewImg = document.getElementById("screenshotPreviewImg");
  var input = document.getElementById("screenshotInput");

  if (placeholder) placeholder.classList.remove("hidden");
  if (preview) preview.classList.add("hidden");
  if (previewImg) previewImg.src = "";
  if (input) input.value = "";
};

window.copyDepositUpi = function() {
  var upiId = document.getElementById("depositUpiId");
  if (!upiId) return;
  var text = upiId.textContent;
  navigator.clipboard.writeText(text).then(function() {
    if (window._showToast) window._showToast("UPI ID copied! 📋", "success");
  }).catch(function() {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    if (window._showToast) window._showToast("UPI ID copied! 📋", "success");
  });
};

// ═══════════════════════════════════════════════════════════════
//  MAIN APP — Initialized after backend is ready
// ═══════════════════════════════════════════════════════════════

(async function() {
  var backend;
  try {
    backend = await (window.SliceInvestBackendReady || Promise.reject(new Error("Backend missing.")));
  } catch (e) {
    console.error("Backend failed:", e);
    // ═══ FIX: If backend fails, STILL show login page instead of staying stuck ═══
    window.__sliceBackendReady = false;
    var splashEl = document.getElementById("splashScreen");
    if (splashEl && !splashEl.classList.contains("hidden")) {
      splashEl.style.opacity = "0";
      splashEl.style.transition = "opacity 0.4s ease";
      setTimeout(function() {
        splashEl.classList.add("hidden");
        var lp = document.getElementById("loginPage");
        if (lp) lp.classList.remove("hidden");
      }, 400);
    } else {
      var lp = document.getElementById("loginPage");
      if (lp) lp.classList.remove("hidden");
    }
    // Define stub functions so buttons don't throw errors
    window.userLogin = function() { if(window._showToast) window._showToast("Connection failed. Please reload the page.", "error"); };
    window.userSignup = function() { if(window._showToast) window._showToast("Connection failed. Please reload the page.", "error"); };
    function showToastFallback(msg, type) { var t=document.getElementById("toast"); if(!t)return; t.textContent=msg; t.className="toast show "+(type||"info"); clearTimeout(t._timer); t._timer=setTimeout(function(){t.className="toast";},3500); }
    window._showToast = showToastFallback;
    showToastFallback("Failed to connect. Please reload.", "error");
    return;
  }
  window.__sliceBackendReady = true;

  // ═══ FIX: Clear ultimate safety timeout since backend loaded ═══
  if (window.__ultimateSafetyTimeout) {
    clearTimeout(window.__ultimateSafetyTimeout);
  }

  var db = backend.db;
  var auth = backend.auth;
  var backendMode = backend.backendMode;
  var collection = backend.collection;
  var doc = backend.doc;
  var getDoc = backend.getDoc;
  var getDocs = backend.getDocs;
  var setDoc = backend.setDoc;
  var addDoc = backend.addDoc;
  var updateDoc = backend.updateDoc;
  var deleteDoc = backend.deleteDoc;
  var query = backend.query;
  var where = backend.where;
  var orderBy = backend.orderBy;
  var limit = backend.limit;
  var onSnapshot = backend.onSnapshot;
  var serverTimestamp = backend.serverTimestamp;
  var Timestamp = backend.Timestamp;
  var signInWithEmailAndPassword = backend.signInWithEmailAndPassword;
  var createUserWithEmailAndPassword = backend.createUserWithEmailAndPassword;
  var signOut = backend.signOut;
  var onAuthStateChanged = backend.onAuthStateChanged;

  // ─── DEFAULT INVESTMENT PLANS (Fallback if admin hasn't configured) ───
  var DEFAULT_PLANS = [
    {
      id: "basic", name: "Basic Plan", amount: 500, dailyReturnFixed: 90, duration: 15,
      icon: "fas fa-rocket", badge: "basic", badgeClass: "badge-basic", maxPurchases: 2,
      features: ["₹500 Investment","₹90 Daily Returns","Daily Withdraw Available","Term: 15 Days","Max 2 Purchases"]
    },
    {
      id: "standard", name: "Standard Plan", amount: 1000, dailyReturnFixed: 200, duration: 15,
      icon: "fas fa-gem", badge: "standard", badgeClass: "badge-standard", maxPurchases: 2,
      features: ["₹1,000 Investment","₹200 Daily Returns","Daily Withdraw Available","Term: 15 Days","Max 2 Purchases"]
    },
    {
      id: "premium", name: "Premium Plan", amount: 2500, dailyReturnFixed: 550, duration: 15,
      icon: "fas fa-crown", badge: "premium", badgeClass: "badge-premium", maxPurchases: 2,
      features: ["₹2,500 Investment","₹550 Daily Returns","Daily Withdraw Available","Term: 15 Days","Max 2 Purchases"]
    }
  ];

  // ═══ DYNAMIC PLANS — loaded from Firestore, fallback to defaults ═══
  var PLANS = DEFAULT_PLANS.slice();
  var MAX_PURCHASES_PER_PLAN = 2;

  // ─── STATE ────────────────────────────────────────────────────
  var currentUser      = null;
  var currentUserData  = null;
  var selectedPlan     = null;
  // ═══ FIX v9: Realtime listener handle for live balance/profile updates ═══
  // Without this, when the admin releases daily returns the user UI keeps
  // showing the OLD balance until they manually refresh. We attach an
  // onSnapshot to the user's own doc and re-render the wallet cards in real
  // time whenever Firestore changes (admin credit, returns release, etc.).
  var _userDocUnsub    = null;
  var _lastRenderedBalance = null;
  var bankAccounts     = [];
  var allTransactions  = [];
  var portfolioChart   = null;
  var isInvestProcessing = false;
  var isWithdrawProcessing = false;
  var isDepositProcessing = false;
  var MAX_REWARD_STREAK = 7;
  var DEFAULT_PLATFORM_CONFIG = {
    minDeposit: 100,
    minWithdraw: 100,
    referralBonus: 50,
    referralPercentage: 25,
    withdrawFeePercent: 3,
    baseReward: 10,
    streakBonus: 2,
    maxReward: 50,
    slipUploadBonus: 10
  };
  var runtimePlatformConfig = Object.assign({}, DEFAULT_PLATFORM_CONFIG);
  var runtimeUpiConfig = { upiId: "wealth@ybl", displayName: "WEALTH Private Capital" };
  var runtimeDepositConfig = { enableUpi: true, enableQr: false, enableBank: false, qrCodeImage: '', bankAccountName: '', bankAccountNumber: '', bankIfsc: '', bankName: '', bankAccounts: [] };
  var runtimeLinksConfig = { telegramLink: '', customerCareLink: '' };
  var runtimeWithdrawConfig = { apiWithdrawEnabled: true, upiWithdrawEnabled: true, bankWithdrawEnabled: true };
  var runtimeConfigLoaded = false;
  // ═══ v13 REALTIME LISTENERS for instant config sync ═══
  var _platformConfigUnsub = null;
  var _plansConfigUnsub = null;

  // ═══ v13 PERFORMANCE CACHE ═══════════════════════════════════
  // In-memory cache + localStorage persistence to make the app
  // feel instant when navigating between sections. Cached data
  // is shown FIRST while a fresh fetch happens in the background.
  var APP_CACHE = {
    user: null,
    transactions: null,
    investments: null,
    bankAccounts: null,
    notifications: null,
    plans: null,
    proofs: null,
    referralFriends: null,
    config: null
  };
  var CACHE_KEY = 'sliceinvest_cache_v1';
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  function _userScopedCacheKey() {
    return CACHE_KEY + '__' + (currentUser || 'anon');
  }
  function loadCacheFromDisk() {
    try {
      var raw = localStorage.getItem(_userScopedCacheKey());
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        APP_CACHE = Object.assign(APP_CACHE, parsed);
      }
    } catch(e) { /* ignore */ }
  }
  function persistCacheToDisk() {
    try {
      localStorage.setItem(_userScopedCacheKey(), JSON.stringify(APP_CACHE));
    } catch(e) { /* quota or serialization fail — silent */ }
  }
  function setCache(key, value) {
    APP_CACHE[key] = { data: value, ts: Date.now() };
    // Debounce writes to avoid blocking UI
    if (window.__cachePersistTimer) clearTimeout(window.__cachePersistTimer);
    window.__cachePersistTimer = setTimeout(persistCacheToDisk, 400);
  }
  function getCache(key, maxAge) {
    var entry = APP_CACHE[key];
    if (!entry || !entry.ts) return null;
    if (typeof maxAge === 'number' && (Date.now() - entry.ts) > maxAge) return null;
    return entry.data;
  }
  function clearCache() {
    APP_CACHE = { user: null, transactions: null, investments: null, bankAccounts: null, notifications: null, plans: null, proofs: null, referralFriends: null, config: null };
    try { localStorage.removeItem(_userScopedCacheKey()); } catch(e) {}
  }
  window.__sliceCache = { get: getCache, set: setCache, clear: clearCache };
  // ═══ FIX: Store original withdraw modal HTML for restoration ═══
  var originalWithdrawModalBody = '';
  var originalWithdrawModalFooter = '';

  // ─── UTILITY FUNCTIONS ────────────────────────────────────────
  function showToast(msg, type) {
    type = type || "info";
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "toast show " + type;
    clearTimeout(t._timer);
    t._timer = setTimeout(function() { t.className = "toast"; }, 3500);
  }
  window._showToast = showToast;

  function fmt(n) {
    return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtDate(ts) {
    if (!ts) return "—";
    var d;
    try { d = ts.toDate ? ts.toDate() : new Date(ts); } catch(e) { return "—"; }
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  }

  function fmtDateTime(ts) {
    if (!ts) return "—";
    var d;
    try { d = ts.toDate ? ts.toDate() : new Date(ts); } catch(e) { return "—"; }
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  }

  function sortDocsByCreatedAt(docs, limitCount) {
    var sorted = docs.slice().sort(function(a, b) {
      var aData = a.data();
      var bData = b.data();
      var aTime, bTime;
      try { aTime = aData && aData.createdAt && aData.createdAt.toDate ? aData.createdAt.toDate().getTime() : new Date(aData && aData.createdAt || 0).getTime(); } catch(e) { aTime = 0; }
      try { bTime = bData && bData.createdAt && bData.createdAt.toDate ? bData.createdAt.toDate().getTime() : new Date(bData && bData.createdAt || 0).getTime(); } catch(e) { bTime = 0; }
      return bTime - aTime;
    });
    return typeof limitCount === "number" ? sorted.slice(0, limitCount) : sorted;
  }

  function generateReferralCode(name) {
    var prefix = (name || "USER").replace(/\s+/g, "").toUpperCase().slice(0, 4);
    var suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return prefix + suffix;
  }

  function getTodayString() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,'0') + "-" + String(d.getDate()).padStart(2,'0');
  }

  function maskName(name) {
    if (!name || name.length <= 2) return name || "User";
    return name[0] + "*".repeat(Math.min(name.length - 2, 4)) + name.slice(-1);
  }

  // ═══ LOAD DYNAMIC PLANS FROM FIRESTORE ═══
  async function loadDynamicPlans() {
    try {
      var plansSnap = await getDoc(doc(db, "config", "plans"));
      if (plansSnap.exists()) {
        var data = plansSnap.data();
        if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          PLANS = data.plans;
          if (data.maxPurchasesPerPlan) MAX_PURCHASES_PER_PLAN = data.maxPurchasesPerPlan;
          console.log("Loaded", PLANS.length, "plans from admin config");
          // ═══ FIX: Sync active investments with updated plan daily returns ═══
          syncActiveInvestmentsWithPlans();
        }
      }
    } catch(err) {
      console.warn("Failed to load dynamic plans, using defaults:", err);
    }
  }

  // ═══ SYNC: Update active investments when admin changes plan daily returns ═══
  // FIXED: Now also syncs planName and duration (not just dailyReturnFixed)
  async function syncActiveInvestmentsWithPlans() {
    if (!currentUser) return;
    try {
      var investSnap = await getDocs(
        query(collection(db, "investments"), where("userId", "==", currentUser), where("status", "==", "active"))
      );
      if (investSnap.empty) return;

      for (var i = 0; i < investSnap.docs.length; i++) {
        var invDoc = investSnap.docs[i];
        var inv = invDoc.data();
        var matchedPlan = PLANS.find(function(p) { return p.id === inv.planId; });
        if (!matchedPlan) continue;
        var updates = {};
        var changed = false;
        if (matchedPlan.dailyReturnFixed !== inv.dailyReturnFixed) {
          updates.dailyReturnFixed = matchedPlan.dailyReturnFixed;
          changed = true;
        }
        if (matchedPlan.name && matchedPlan.name !== inv.planName) {
          updates.planName = matchedPlan.name;
          changed = true;
        }
        if (matchedPlan.duration && matchedPlan.duration !== inv.duration) {
          updates.duration = matchedPlan.duration;
          changed = true;
        }
        if (changed) {
          console.log("[SliceInvest] Syncing investment", invDoc.id, updates);
          await updateDoc(doc(db, "investments", invDoc.id), updates);
        }
      }
    } catch(err) {
      console.warn("Sync investments with plans failed:", err);
    }
  }

  function applyRuntimeConfigToUI() {
    var upiEl = document.getElementById("depositUpiId");
    if (upiEl) upiEl.textContent = runtimeUpiConfig.upiId || "wealth@ybl";

    var depositAmountInput = document.getElementById("depositAmount");
    if (depositAmountInput) depositAmountInput.min = String(runtimePlatformConfig.minDeposit || DEFAULT_PLATFORM_CONFIG.minDeposit);

    var withdrawAmountInput = document.getElementById("withdrawAmount");
    if (withdrawAmountInput) withdrawAmountInput.min = String(runtimePlatformConfig.minWithdraw || DEFAULT_PLATFORM_CONFIG.minWithdraw);

    applyDepositMethodsUI();

    var telegramItem = document.getElementById('settingsTelegramItem');
    var ccItem = document.getElementById('settingsCustomerCareItem');
    if (telegramItem) telegramItem.style.display = runtimeLinksConfig.telegramLink ? 'flex' : 'none';
    if (ccItem) ccItem.style.display = runtimeLinksConfig.customerCareLink ? 'flex' : 'none';

    var referralPct = runtimePlatformConfig.referralPercentage || DEFAULT_PLATFORM_CONFIG.referralPercentage || 25;
    ['referralPctDisplay', 'refModalPct'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = referralPct + '%';
    });

    var planBadge = document.getElementById("planCountBadge");
    if (planBadge) planBadge.textContent = PLANS.length + " Plans";
  }

  // Escape HTML for safe rendering
  function escapeHtmlUser(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Get list of enabled bank accounts (multi-bank + legacy fallback)
  function getEnabledBankAccounts(cfg) {
    var list = [];
    if (Array.isArray(cfg.bankAccounts) && cfg.bankAccounts.length > 0) {
      list = cfg.bankAccounts.filter(function(a) { return a && a.enabled !== false && a.accountNumber; });
    }
    if (list.length === 0 && cfg.bankAccountNumber) {
      // Legacy fallback — synthesize one account from old fields
      list = [{
        id: 'legacy',
        bankName: cfg.bankName || '',
        holderName: cfg.bankAccountName || '',
        accountNumber: cfg.bankAccountNumber || '',
        ifsc: cfg.bankIfsc || '',
        enabled: true
      }];
    }
    return list;
  }

  function applyDepositMethodsUI() {
    var cfg = runtimeDepositConfig;
    var tabsContainer = document.getElementById('depositMethodTabs');
    var upiSection = document.getElementById('depositUpiSection');
    var qrSection = document.getElementById('depositQrSection');
    var bankSection = document.getElementById('depositBankSection');

    var banks = cfg.enableBank ? getEnabledBankAccounts(cfg) : [];
    var hasBanks = banks.length > 0;

    var methods = [];
    if (cfg.enableUpi) methods.push('upi');
    if (cfg.enableQr && cfg.qrCodeImage) methods.push('qr');
    if (hasBanks) methods.push('bank');

    if (methods.length <= 1) {
      if (tabsContainer) tabsContainer.innerHTML = '';
    } else {
      if (tabsContainer) {
        var tabsHtml = '';
        if (cfg.enableUpi) tabsHtml += '<button class="deposit-method-tab active" onclick="switchDepositMethod(\'upi\', this)"><i class="fas fa-mobile-screen"></i>UPI</button>';
        if (cfg.enableQr && cfg.qrCodeImage) tabsHtml += '<button class="deposit-method-tab' + (!cfg.enableUpi ? ' active' : '') + '" onclick="switchDepositMethod(\'qr\', this)"><i class="fas fa-qrcode"></i>QR Code</button>';
        if (hasBanks) tabsHtml += '<button class="deposit-method-tab' + (!cfg.enableUpi && !(cfg.enableQr && cfg.qrCodeImage) ? ' active' : '') + '" onclick="switchDepositMethod(\'bank\', this)"><i class="fas fa-building-columns"></i>Bank</button>';
        tabsContainer.innerHTML = tabsHtml;
      }
    }

    if (upiSection) upiSection.classList.toggle('hidden', !cfg.enableUpi);
    if (qrSection) qrSection.classList.add('hidden');
    if (bankSection) bankSection.classList.add('hidden');

    if (!cfg.enableUpi && methods.length > 0) {
      if (methods[0] === 'qr' && qrSection) qrSection.classList.remove('hidden');
      if (methods[0] === 'bank' && bankSection) bankSection.classList.remove('hidden');
    }

    if (cfg.qrCodeImage) {
      var qrImg = document.getElementById('depositQrImage');
      if (qrImg) qrImg.src = cfg.qrCodeImage;
    }

    // Render bank accounts (supports multiple) — with bank-picker UI when more than 1
    var bankContainer = document.getElementById('depositBankDetails');
    if (bankContainer) {
      if (hasBanks) {
        // Cache enabled banks for switching by index
        window.__depositBanksCache = banks;
        var multi = banks.length > 1;

        // Build bank-picker chips (only when multiple banks)
        var pickerHtml = '';
        if (multi) {
          pickerHtml = '<div class="deposit-bank-picker"><div class="dbp-label"><i class="fas fa-building-columns"></i> Select a Bank</div><div class="dbp-options">' +
            banks.map(function(acc, idx) {
              var bn = escapeHtmlUser(acc.bankName || ('Bank ' + (idx + 1)));
              var last4 = (acc.accountNumber || '').slice(-4);
              return '<button type="button" class="dbp-option' + (idx === 0 ? ' active' : '') + '" data-bank-idx="' + idx + '" onclick="selectDepositBank(' + idx + ', this)">' +
                '<i class="fas fa-building-columns"></i>' +
                '<span class="dbp-bank-name">' + bn + '</span>' +
                (last4 ? '<span class="dbp-bank-last4">•••• ' + escapeHtmlUser(last4) + '</span>' : '') +
              '</button>';
            }).join('') +
          '</div></div>';
        }

        // Build details container; show only first bank initially
        var detailsHtml = '<div id="depositBankDetailsInner">' + renderSingleDepositBank(banks[0], 0, multi) + '</div>';
        bankContainer.innerHTML = pickerHtml + detailsHtml;
      } else {
        window.__depositBanksCache = [];
        bankContainer.innerHTML = '';
      }
    }
  }

  // Render a single bank's details card (helper)
  function renderSingleDepositBank(acc, idx, multi) {
    if (!acc) return '';
    var bn = escapeHtmlUser(acc.bankName || '—');
    var hn = escapeHtmlUser(acc.holderName || '—');
    var an = escapeHtmlUser(acc.accountNumber || '—');
    var ic = escapeHtmlUser(acc.ifsc || '—');
    var header = multi ? ('<div class="deposit-bank-card-header"><i class="fas fa-building-columns"></i><span>' + bn + '</span><span class="dbk-tag">Account ' + (idx + 1) + '</span></div>') : '';
    return '<div class="deposit-bank-card-user">' + header +
      '<div class="deposit-bank-row"><span class="dbr-label">Bank Name</span><span class="dbr-value">' + bn + '</span><button class="deposit-bank-copy" onclick="copyToClipboard(\'' + (acc.bankName || '').replace(/'/g, "\\'") + '\')"><i class="fas fa-copy"></i></button></div>' +
      '<div class="deposit-bank-row"><span class="dbr-label">Account Name</span><span class="dbr-value">' + hn + '</span><button class="deposit-bank-copy" onclick="copyToClipboard(\'' + (acc.holderName || '').replace(/'/g, "\\'") + '\')"><i class="fas fa-copy"></i></button></div>' +
      '<div class="deposit-bank-row"><span class="dbr-label">Account No.</span><span class="dbr-value">' + an + '</span><button class="deposit-bank-copy" onclick="copyToClipboard(\'' + (acc.accountNumber || '').replace(/'/g, "\\'") + '\')"><i class="fas fa-copy"></i></button></div>' +
      '<div class="deposit-bank-row"><span class="dbr-label">IFSC Code</span><span class="dbr-value">' + ic + '</span><button class="deposit-bank-copy" onclick="copyToClipboard(\'' + (acc.ifsc || '').replace(/'/g, "\\'") + '\')"><i class="fas fa-copy"></i></button></div>' +
    '</div>';
  }

  // User selects a bank from the picker - shows only that bank's details
  window.selectDepositBank = function(idx, btn) {
    var banks = window.__depositBanksCache || [];
    if (!banks[idx]) return;
    // Update active chip
    document.querySelectorAll('.dbp-option').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    // Replace details
    var inner = document.getElementById('depositBankDetailsInner');
    if (inner) inner.innerHTML = renderSingleDepositBank(banks[idx], idx, banks.length > 1);
  };

  window.switchDepositMethod = function(method, btn) {
    document.querySelectorAll('.deposit-method-tab').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var upiSection = document.getElementById('depositUpiSection');
    var qrSection = document.getElementById('depositQrSection');
    var bankSection = document.getElementById('depositBankSection');
    if (upiSection) upiSection.classList.toggle('hidden', method !== 'upi');
    if (qrSection) qrSection.classList.toggle('hidden', method !== 'qr');
    if (bankSection) bankSection.classList.toggle('hidden', method !== 'bank');
  };

  async function loadRuntimeConfig(force) {
    if (runtimeConfigLoaded && !force) {
      applyRuntimeConfigToUI();
      return { platform: runtimePlatformConfig, upi: runtimeUpiConfig };
    }

    try {
      var results = await Promise.all([
        getDoc(doc(db, "config", "platform")),
        getDoc(doc(db, "config", "upi")),
        getDoc(doc(db, "config", "deposit")),
        getDoc(doc(db, "config", "links")),
        getDoc(doc(db, "config", "withdraw"))
      ]);

      var platformSnap = results[0];
      var upiSnap = results[1];
      var depositSnap = results[2];
      var linksSnap = results[3];
      var withdrawSnap = results[4];

      runtimePlatformConfig = Object.assign({}, DEFAULT_PLATFORM_CONFIG, platformSnap.exists() ? platformSnap.data() : {});
      runtimeUpiConfig = Object.assign({ upiId: "wealth@ybl", displayName: "WEALTH Private Capital" }, upiSnap.exists() ? upiSnap.data() : {});
      if (depositSnap.exists()) runtimeDepositConfig = Object.assign({}, runtimeDepositConfig, depositSnap.data());
      if (linksSnap.exists()) runtimeLinksConfig = Object.assign({}, runtimeLinksConfig, linksSnap.data());
      if (withdrawSnap.exists()) runtimeWithdrawConfig = Object.assign({}, runtimeWithdrawConfig, withdrawSnap.data());
    } catch (err) {
      console.warn("Runtime config load failed:", err);
    }

    runtimeConfigLoaded = true;
    applyRuntimeConfigToUI();
    // Cache for instant boot on next session
    try {
      setCache('config', {
        platform: runtimePlatformConfig,
        upi: runtimeUpiConfig,
        deposit: runtimeDepositConfig,
        links: runtimeLinksConfig,
        withdraw: runtimeWithdrawConfig
      });
    } catch(e) {}
    return { platform: runtimePlatformConfig, upi: runtimeUpiConfig };
  }

  async function ensureRuntimeConfigLoaded() {
    return loadRuntimeConfig(false);
  }

  // ═══ v13 REALTIME PLATFORM CONFIG LISTENER ═══════════════════
  // Subscribe to config/platform doc so admin changes (withdraw
  // fee %, referral %, min deposit/withdraw, etc.) reflect in the
  // user app INSTANTLY without a manual reload.
  function startPlatformConfigListener() {
    stopPlatformConfigListener();
    try {
      var ref = doc(db, 'config', 'platform');
      _platformConfigUnsub = onSnapshot(ref, function(snap) {
        if (!snap || typeof snap.exists !== 'function' || !snap.exists()) return;
        var data = snap.data() || {};
        runtimePlatformConfig = Object.assign({}, DEFAULT_PLATFORM_CONFIG, data);
        applyRuntimeConfigToUI();
        // Refresh withdraw modal preview live (fee % may have changed)
        if (typeof updateWithdrawLivePreview === 'function') {
          try { updateWithdrawLivePreview(); } catch(e) {}
        }
        // Update fee info note to reflect new percentage
        var feeRate = Number(runtimePlatformConfig.withdrawFeePercent || 3);
        var feeNoteEl = document.getElementById('withdrawFeeInfo');
        if (feeNoteEl) {
          feeNoteEl.innerHTML = '<i class="fas fa-percent"></i> <span>A <strong>' + feeRate + '% withdraw fee</strong> will be deducted from your withdrawal amount.</span>';
        }
        try { setCache('config', { platform: runtimePlatformConfig, upi: runtimeUpiConfig, deposit: runtimeDepositConfig, links: runtimeLinksConfig, withdraw: runtimeWithdrawConfig }); } catch(e) {}
      });
    } catch(err) {
      console.warn('[SliceInvest] Platform config realtime listener failed:', err);
    }
  }
  function stopPlatformConfigListener() {
    if (typeof _platformConfigUnsub === 'function') {
      try { _platformConfigUnsub(); } catch(e) {}
    }
    _platformConfigUnsub = null;
  }

  // ═══ v13 REALTIME PLANS CONFIG LISTENER ═══════════════════════
  // Subscribe to config/plans so admin changes to plans (incl.
  // investor counts, daily returns, durations) appear instantly.
  function startPlansConfigListener() {
    stopPlansConfigListener();
    try {
      var ref = doc(db, 'config', 'plans');
      _plansConfigUnsub = onSnapshot(ref, function(snap) {
        if (!snap || typeof snap.exists !== 'function' || !snap.exists()) return;
        var data = snap.data() || {};
        if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          PLANS = data.plans;
          if (data.maxPurchasesPerPlan) MAX_PURCHASES_PER_PLAN = data.maxPurchasesPerPlan;
          try { setCache('plans', PLANS); } catch(e) {}
          try { renderPlans(); } catch(e) {}
          try { syncActiveInvestmentsWithPlans(); } catch(e) {}
        }
      });
    } catch(err) {
      console.warn('[SliceInvest] Plans config realtime listener failed:', err);
    }
  }
  function stopPlansConfigListener() {
    if (typeof _plansConfigUnsub === 'function') {
      try { _plansConfigUnsub(); } catch(e) {}
    }
    _plansConfigUnsub = null;
  }

  // ─── PAGE MANAGEMENT ──────────────────────────────────────────
  function showPage(pageId) {
    ["loginPage", "userDashboard"].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
    var target = document.getElementById(pageId);
    if (target) target.classList.remove("hidden");
  }

  // ═══════════════════════════════════════════════════════════════
  //  v13 SESSION HOOKS — bind cache to currentUser
  // ═══════════════════════════════════════════════════════════════
  function _onUserSessionStart() {
    try { loadCacheFromDisk(); } catch(e) {}
    // Apply cached config FIRST so navigation feels instant
    var cachedConfig = getCache('config', 60 * 60 * 1000);
    if (cachedConfig && cachedConfig.platform) {
      runtimePlatformConfig = Object.assign({}, DEFAULT_PLATFORM_CONFIG, cachedConfig.platform);
      if (cachedConfig.upi)      runtimeUpiConfig      = cachedConfig.upi;
      if (cachedConfig.deposit)  runtimeDepositConfig  = Object.assign({}, runtimeDepositConfig, cachedConfig.deposit);
      if (cachedConfig.links)    runtimeLinksConfig    = Object.assign({}, runtimeLinksConfig, cachedConfig.links);
      if (cachedConfig.withdraw) runtimeWithdrawConfig = Object.assign({}, runtimeWithdrawConfig, cachedConfig.withdraw);
      try { applyRuntimeConfigToUI(); } catch(e) {}
    }
    var cachedPlans = getCache('plans', 60 * 60 * 1000);
    if (cachedPlans && Array.isArray(cachedPlans) && cachedPlans.length) {
      PLANS = cachedPlans;
      try { renderPlans(); } catch(e) {}
    }
    // Start realtime listeners for instant config sync
    startPlatformConfigListener();
    startPlansConfigListener();
  }
  function _onUserSessionEnd() {
    stopPlatformConfigListener();
    stopPlansConfigListener();
    try { clearCache(); } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════════
  //  SESSION PERSISTENCE — Auto-login on reload
  // ═══════════════════════════════════════════════════════════════
  var SESSION_KEY = "sliceinvest_user_session";
  var sessionCheckTimer = null;

  // Generate a unique, random session token (invalidated on password change)
  function generateSessionToken() {
    return 'tok_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  }

  function saveUserSession(userId, token) {
    try {
      var payload = { userId: userId, timestamp: Date.now() };
      if (token) payload.sessionToken = token;
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    } catch(e) { console.warn("Save session failed:", e); }
  }

  function clearUserSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch(e) {}
  }

  function getSavedSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var session = JSON.parse(raw);
      if (Date.now() - session.timestamp > 30 * 24 * 60 * 60 * 1000) {
        clearUserSession();
        return null;
      }
      return session;
    } catch(e) { return null; }
  }

  // ═══ Force-logout this session (called when server token doesn't match local) ═══
  function forceLogoutWithMessage(msg) {
    stopSessionChecker();
    stopUserDocListener();
    _onUserSessionEnd();   // v13: stop config listeners + clear cache
    currentUser     = null;
    currentUserData = null;
    bankAccounts    = [];
    allTransactions = [];
    uploadedScreenshot = null;
    clearUserSession();
    document.body.classList.remove("dark-mode");
    showPage("loginPage");
    showToast(msg || "Your session has expired. Please log in again.", "warning");
  }

  // ═══════════════════════════════════════════════════════════════
  //  FIX v9 — REALTIME USER DOC LISTENER (LIVE BALANCE SYNC)
  // ═══════════════════════════════════════════════════════════════
  // Subscribes to the logged-in user's document. Whenever the admin
  // (or any process) updates balance / withdrawableBalance / totalReturns
  // / activePlans / disabled flags, this fires and we re-render the
  // wallet UI immediately — no manual refresh needed.
  function startUserDocListener() {
    stopUserDocListener();
    if (!currentUser) return;
    try {
      var ref = doc(db, "users", currentUser);
      _userDocUnsub = onSnapshot(ref, function(snap) {
        if (!snap || typeof snap.exists !== "function" || !snap.exists()) return;
        var fresh = snap.data();
        if (!fresh) return;

        // If admin disabled the user, force logout
        if (fresh.disabled) {
          forceLogoutWithMessage("Your account has been disabled. Please contact support.");
          return;
        }

        // Detect a balance change vs. last render — show toast if returns landed
        var prevBalance = currentUserData ? Number(currentUserData.balance || 0) : null;
        var newBalance  = Number(fresh.balance || 0);
        var newWithdrawable = Number(fresh.withdrawableBalance || 0);
        currentUserData = Object.assign({ id: snap.id }, fresh);

        // Update DOM live (cheap selectors — no full reload)
        var elName  = document.getElementById("userNameDisplay");
        var elBal1  = document.getElementById("walletBalance");
        var elBal2  = document.getElementById("walletBalance2");
        var elInv   = document.getElementById("totalInvested");
        var elRet   = document.getElementById("totalReturns");
        var elAP    = document.getElementById("activePlans");
        var elWB    = document.getElementById("withdrawableBalance");
        var elDepC  = document.getElementById("depositCurrentBalance");
        var elWdrAv = document.getElementById("withdrawAvailableBalance");
        if (elName) elName.textContent = fresh.name || "Investor";
        if (elBal1) elBal1.textContent = fmt(newBalance);
        if (elBal2) elBal2.textContent = fmt(newBalance);
        if (elInv)  elInv.textContent  = fmt(fresh.totalInvested || 0);
        if (elRet)  elRet.textContent  = fmt(fresh.totalReturns  || 0);
        if (elAP)   elAP.textContent   = String(fresh.activePlans || 0);
        if (elWB)   elWB.textContent   = fmt(newWithdrawable);
        if (elDepC) elDepC.textContent = fmt(newBalance);
        if (elWdrAv) elWdrAv.textContent = fmt(newWithdrawable);
        if (typeof _ensureBalanceVisible === "function") _ensureBalanceVisible();

        // Pulse the balance card briefly if balance increased (returns released)
        if (prevBalance !== null && newBalance > prevBalance) {
          var diff = newBalance - prevBalance;
          [elBal1, elBal2].forEach(function(el) {
            if (!el) return;
            el.classList.remove("balance-pulse");
            void el.offsetWidth; // restart animation
            el.classList.add("balance-pulse");
          });
          // Only toast if the diff looks like a real credit (not a deduction reload)
          if (diff >= 1) {
            showToast("💰 " + fmt(diff) + " credited to your wallet!", "success");
            // Refresh transactions/notifs in the background so the user sees the entry
            try { loadTransactions(); } catch(e) {}
            try { loadNotifications(); } catch(e) {}
            try { loadMyInvestments(); } catch(e) {}
          }
        }
        _lastRenderedBalance = newBalance;
      });
    } catch(err) {
      console.warn("[SliceInvest] Realtime user listener failed (will fall back to manual refresh):", err);
    }
  }

  function stopUserDocListener() {
    if (typeof _userDocUnsub === "function") {
      try { _userDocUnsub(); } catch(e) {}
    }
    _userDocUnsub = null;
    _lastRenderedBalance = null;
    if (_balancePollTimer) {
      clearInterval(_balancePollTimer);
      _balancePollTimer = null;
    }
  }

  // ═══ BALANCE POLLING FALLBACK ═══
  // In local (demo) mode, onSnapshot only fires once — so we poll every 8s
  // to keep balance / returns / active plans in sync. In Firebase mode,
  // onSnapshot already pushes updates, so polling is redundant but harmless.
  var _balancePollTimer = null;
  function startBalancePolling() {
    if (_balancePollTimer) clearInterval(_balancePollTimer);
    _balancePollTimer = setInterval(function() {
      if (!currentUser) return;
      if (document.hidden) return; // don't poll when tab is hidden
      // Only refresh the user doc — not the whole dashboard — to keep it cheap
      try {
        getDoc(doc(db, "users", currentUser)).then(function(snap) {
          if (!snap || !snap.exists || !snap.exists()) return;
          var fresh = snap.data();
          if (!fresh) return;
          if (fresh.disabled) { forceLogoutWithMessage("Your account has been disabled. Please contact support."); return; }
          var prev = currentUserData ? Number(currentUserData.balance || 0) : null;
          var next = Number(fresh.balance || 0);
          var nextWdr = Number(fresh.withdrawableBalance || 0);
          // Only re-render if anything changed
          if (currentUserData &&
              Number(currentUserData.balance || 0) === next &&
              Number(currentUserData.withdrawableBalance || 0) === nextWdr &&
              Number(currentUserData.totalReturns || 0) === Number(fresh.totalReturns || 0) &&
              Number(currentUserData.activePlans || 0) === Number(fresh.activePlans || 0)) {
            return;
          }
          currentUserData = Object.assign({ id: snap.id }, fresh);
          _setText("walletBalance",  fmt(next));
          _setText("walletBalance2", fmt(next));
          _setText("totalInvested",  fmt(fresh.totalInvested || 0));
          _setText("totalReturns",   fmt(fresh.totalReturns || 0));
          _setText("activePlans",    String(fresh.activePlans || 0));
          _setText("depositCurrentBalance",   fmt(next));
          _setText("withdrawAvailableBalance", fmt(nextWdr));
          if (typeof _ensureBalanceVisible === "function") _ensureBalanceVisible();
          if (prev !== null && next > prev + 0.5) {
            showToast("💰 " + fmt(next - prev) + " credited to your wallet!", "success");
            try { loadTransactions(); } catch(e) {}
          }
        }).catch(function(){});
      } catch(e) {}
    }, 8000);
  }

  // ═══ Periodic check: ensures local sessionToken matches server; if not → force logout ═══
  async function verifySessionToken() {
    if (!currentUser) return;
    var session = getSavedSession();
    if (!session || !session.sessionToken) return; // legacy session — skip
    try {
      var snap = await getDoc(doc(db, "users", currentUser));
      if (!snap.exists()) {
        forceLogoutWithMessage("Account no longer exists. Please log in again.");
        return;
      }
      var data = snap.data();
      if (data.disabled) {
        forceLogoutWithMessage("Your account has been disabled. Please contact support.");
        return;
      }
      if (data.sessionToken && data.sessionToken !== session.sessionToken) {
        forceLogoutWithMessage("Your password was changed on another device. Please log in again with the new password.");
      }
    } catch(err) {
      console.warn("Session verify failed:", err);
    }
  }

  function startSessionChecker() {
    stopSessionChecker();
    // Check every 15 seconds while logged in
    sessionCheckTimer = setInterval(verifySessionToken, 15000);
    // Also check immediately when tab becomes visible
    document.addEventListener("visibilitychange", onVisibilityChangeCheck);
  }

  function stopSessionChecker() {
    if (sessionCheckTimer) {
      clearInterval(sessionCheckTimer);
      sessionCheckTimer = null;
    }
    document.removeEventListener("visibilitychange", onVisibilityChangeCheck);
  }

  function onVisibilityChangeCheck() {
    if (document.visibilityState === "visible") verifySessionToken();
  }

  // Try auto-login from saved session
  async function tryAutoLogin() {
    var session = getSavedSession();
    if (!session || !session.userId) return false;

    try {
      var userSnap = await getDoc(doc(db, "users", session.userId));
      if (!userSnap.exists()) {
        clearUserSession();
        return false;
      }
      var userData = userSnap.data();
      if (userData.disabled) {
        clearUserSession();
        return false;
      }

      currentUser     = userSnap.id;
      currentUserData = Object.assign({ id: userSnap.id }, userData);

      saveUserSession(currentUser);

      if (userData.darkMode) {
        document.body.classList.add("dark-mode");
        var toggle = document.getElementById("darkModeToggle");
        if (toggle) toggle.checked = true;
      }

      console.log("[SliceInvest] Auto-login successful for:", userData.name);
      window.__sliceAutoLoginSucceeded = true;

      // ═══ FIX: Also hide splash immediately if still visible ═══
      var splashEl = document.getElementById("splashScreen");
      if (splashEl && !splashEl.classList.contains("hidden")) {
        splashEl.style.opacity = "0";
        splashEl.style.transition = "opacity 0.4s ease";
        setTimeout(function() { splashEl.classList.add("hidden"); }, 400);
      }

      showPage("userDashboard");
      initUserDashboard();
      showToast("Welcome back, " + userData.name + "! 👋", "success");
      return true;
    } catch(err) {
      console.warn("Auto-login failed:", err);
      clearUserSession();
      return false;
    }
  }

  // ═══ Run auto-login check ═══
  tryAutoLogin();

  if (backendMode === "local") {
    var demoInterval = setInterval(function() {
      var loginPage = document.getElementById("loginPage");
      if (loginPage && !loginPage.classList.contains("hidden")) {
        showToast("Demo mode • User: +919876543210 / 123456", "warning");
        clearInterval(demoInterval);
      }
    }, 500);
    setTimeout(function() { clearInterval(demoInterval); }, 10000);
  }

  // ─── USER SIGNUP ──────────────────────────────────────────────
  window.userSignup = async function() {
    var name       = document.getElementById("signupName").value.trim();
    var phoneRaw   = document.getElementById("signupPhone").value.trim();
    var pass       = document.getElementById("signupPassword").value.trim();
    var confirmPass = document.getElementById("signupConfirmPassword").value.trim();
    var referral   = (document.getElementById("signupReferral") || {}).value;
    referral = referral ? referral.trim() : "";

    if (!name)                          return showToast("Please enter your full name.", "error");
    if (name.length < 2)                return showToast("Name must be at least 2 characters.", "error");
    if (!phoneRaw)                      return showToast("Please enter your phone number.", "error");

    var cleanPhone = phoneRaw.replace(/\s/g, "").replace(/^\+91/, "");
    if (!/^[0-9]{10}$/.test(cleanPhone)) return showToast("Please enter a valid 10-digit phone number.", "error");
    cleanPhone = "+91" + cleanPhone;

    if (!pass)                          return showToast("Please enter a password.", "error");
    if (pass.length < 6)                return showToast("Password must be at least 6 characters.", "error");
    if (pass !== confirmPass)           return showToast("Passwords do not match.", "error");

    showToast("Creating your account…", "info");
    try {
      await ensureRuntimeConfigLoaded();
      var usersRef = collection(db, "users");
      var q = query(usersRef, where("phone", "==", cleanPhone));
      var snap = await getDocs(q);
      if (!snap.empty) return showToast("Account already exists. Please login.", "error");

      var refCode = generateReferralCode(name);
      var newToken = generateSessionToken();

      var newUserRef = await addDoc(collection(db, "users"), {
        name: name, phone: cleanPhone, password: pass,
        balance: 0, withdrawableBalance: 0, totalInvested: 0, totalReturns: 0, activePlans: 0,
        withdrawPassword: null, disabled: false,
        referralCode: refCode, referredBy: referral || null,
        referralBonusPaid: false,
        dailyRewardStreak: 0, lastRewardDate: null, rewardHistory: [],
        darkMode: false, notificationsEnabled: true,
        sessionToken: newToken,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "notifications"), {
        userId: newUserRef.id,
        message: "Welcome to WEALTH! 🎉 Start by making a deposit to begin investing.",
        type: "success", read: false, createdAt: serverTimestamp()
      });

      ["signupName", "signupPhone", "signupPassword", "signupConfirmPassword", "signupReferral"].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = "";
      });

      showToast("Account created! 🎉 Logging you in…", "success");

      currentUser = newUserRef.id;
      currentUserData = {
        id: newUserRef.id, name: name, phone: cleanPhone,
        balance: 0, withdrawableBalance: 0, totalInvested: 0, totalReturns: 0, activePlans: 0,
        withdrawPassword: null, referralCode: refCode,
        referralBonusPaid: false,
        dailyRewardStreak: 0, lastRewardDate: null, rewardHistory: [],
        sessionToken: newToken
      };

      saveUserSession(currentUser, newToken);
      startSessionChecker();
      setTimeout(function() { showPage("userDashboard"); initUserDashboard(); }, 800);
    } catch (err) {
      console.error("Signup error:", err);
      showToast("Registration failed: " + err.message, "error");
    }
  };

  // ─── USER LOGIN ───────────────────────────────────────────────
  window.userLogin = async function() {
    var phoneRaw = document.getElementById("userPhone").value.trim();
    var pass  = document.getElementById("userPassword").value.trim();
    if (!phoneRaw || !pass) return showToast("Please fill all fields.", "error");

    var phone = phoneRaw.replace(/\s/g, "").replace(/^\+91/, "");
    if (!/^[0-9]{10}$/.test(phone)) return showToast("Please enter a valid 10-digit phone number.", "error");
    phone = "+91" + phone;

    showToast("Logging in…", "info");
    try {
      var usersRef = collection(db, "users");
      var q = query(usersRef, where("phone", "==", phone));
      var snap = await getDocs(q);
      if (snap.empty) return showToast("No account found.", "error");

      var userDoc  = snap.docs[0];
      var userData = userDoc.data();

      if (userData.password !== pass) return showToast("Incorrect password.", "error");
      if (userData.disabled) return showToast("Account disabled.", "error");

      currentUser     = userDoc.id;
      currentUserData = Object.assign({ id: userDoc.id }, userData);

      saveUserSession(currentUser);

      if (userData.darkMode) {
        document.body.classList.add("dark-mode");
        var toggle = document.getElementById("darkModeToggle");
        if (toggle) toggle.checked = true;
      }

      showToast("Welcome back, " + userData.name + "! 👋", "success");
      showPage("userDashboard");
      initUserDashboard();
    } catch(err) {
      console.error(err);
      showToast("Login failed: " + err.message, "error");
    }
  };

  // ─── LOGOUT ───────────────────────────────────────────────────
  window.logout = function() {
    stopSessionChecker();
    stopUserDocListener();   // ═══ FIX v9: detach realtime listener ═══
    _onUserSessionEnd();      // v13: stop config listeners + clear cache
    currentUser     = null;
    currentUserData = null;
    bankAccounts    = [];
    allTransactions = [];
    uploadedScreenshot = null;

    clearUserSession();

    ["userPhone","userPassword","signupName","signupPhone","signupPassword","signupConfirmPassword","signupReferral"].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.value = "";
    });
    document.querySelectorAll(".bottom-nav .nav-item").forEach(function(b) { b.classList.remove("active"); });
    var homeBtn = document.querySelector('.bottom-nav .nav-item[data-page="home"]');
    if (homeBtn) homeBtn.classList.add("active");
    document.body.classList.remove("dark-mode");
    showPage("loginPage");
    showToast("Logged out successfully.", "info");
  };

  // ═══════════════════════════════════════════════════════════════
  //  USER DASHBOARD
  // ═══════════════════════════════════════════════════════════════

  async function initUserDashboard() {
    // ═══ FIX: Save original withdraw modal HTML for restoration ═══
    var wmBody = document.querySelector('#withdrawModal .modal-body');
    var wmFooter = document.querySelector('#withdrawModal .modal-footer');
    if (wmBody && !originalWithdrawModalBody) originalWithdrawModalBody = wmBody.innerHTML;
    if (wmFooter && !originalWithdrawModalFooter) originalWithdrawModalFooter = wmFooter.innerHTML;

    // v13: Bind cache + start realtime config listeners
    _onUserSessionStart();

    await loadDynamicPlans();
    await loadRuntimeConfig();   // ═══ FIX: await so config is ready before render ═══
    renderPlans();
    await loadBankAccounts();    // ═══ FIX: load bank accounts BEFORE user data so profile completion is accurate ═══
    loadUserData();
    // ═══ FIX v9: Start realtime listener so balance/profile updates from
    // admin (e.g. daily returns release) reflect in UI without a refresh ═══
    startUserDocListener();
    startBalancePolling();   // ═══ fallback poller — keeps balance fresh in local mode and as a safety net in Firebase mode ═══
    loadMyInvestments();
    loadTransactions();
    loadNotifications();
    loadDailyRewardStatus();
    renderDailyCalendar();
    loadMyUploadedSlips();
    processAutoDailyReturns();
    loadReferralDashboard();
    switchUserTab("home", document.querySelector('.nav-item[data-page="home"]'));
  }

  // Helper: safely set textContent on an element (no crash if it's missing)
  function _setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
    return el;
  }

  // ═══ BALANCE VISIBILITY WATCHDOG ═══
  // Some browsers/devices fail to render `background-clip: text` correctly,
  // which can leave the wallet balance literally invisible (transparent text).
  // After every render, we verify the balance element actually has visible
  // pixels. If not, we fall back to a solid color via inline style override.
  function _ensureBalanceVisible() {
    var ids = ["walletBalance", "walletBalance2", "depositCurrentBalance", "withdrawAvailableBalance"];
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      try {
        var cs = window.getComputedStyle(el);
        var fillColor = cs.getPropertyValue("-webkit-text-fill-color") || cs.color;
        var color = cs.color;
        // "transparent" / rgba(*,*,*,0) means the text won't render visibly
        var isTransparent =
          (fillColor && fillColor.indexOf("rgba(0, 0, 0, 0)") !== -1) ||
          (fillColor && fillColor === "transparent") ||
          (color && color.indexOf("rgba(0, 0, 0, 0)") !== -1) ||
          (color === "transparent");
        // Also check whether background-clip:text actually painted: by reading
        // backgroundClip and the rendered text width. If the clip mode is on
        // but text is visually hidden, the inline override wins.
        var clip = cs.getPropertyValue("-webkit-background-clip") || cs.backgroundClip || "";
        var usesClip = clip && clip.indexOf("text") !== -1;
        if (isTransparent || (usesClip && !el.offsetWidth)) {
          // Force a visible solid color as a last-resort fallback
          el.style.color = "#FFFFFF";
          el.style.webkitTextFillColor = "#FFFFFF";
          el.style.background = "none";
          el.style.backgroundClip = "initial";
          el.style.webkitBackgroundClip = "initial";
        }
      } catch(e) { /* ignore — watchdog should never throw */ }
    });
  }

  // v13: Render user-card UI from a data object (used both for cached + fresh paint)
  function _renderUserDataUI(userData) {
    if (!userData) return;
    var name = userData.name || "Investor";
    var balance        = Number(userData.balance || 0);
    var withdrawable   = Number(userData.withdrawableBalance || 0);
    var totalInvested  = Number(userData.totalInvested || 0);
    var totalReturns   = Number(userData.totalReturns || 0);
    var activePlansN   = Number(userData.activePlans || 0);
    _setText("userNameDisplay", name);
    _setText("walletBalance",   fmt(balance));
    _setText("walletBalance2",  fmt(balance));
    _setText("totalInvested",   fmt(totalInvested));
    _setText("totalReturns",    fmt(totalReturns));
    _setText("activePlans",     String(activePlansN));
    _setText("depositCurrentBalance",   fmt(balance));
    _setText("withdrawAvailableBalance", fmt(withdrawable));
    _setText("withdrawableBalance",     fmt(withdrawable));
    _setText("settingsUserName",  name);
    _setText("settingsUserPhone", userData.phone || "");
    var refCodeEl = document.getElementById("referralCode");
    if (refCodeEl && userData.referralCode) refCodeEl.textContent = userData.referralCode;
    var initials = name.split(" ").map(function(w) { return w[0]; }).join("").toUpperCase().slice(0,2);
    ["headerAvatar", "settingsAvatar"].forEach(function(elId) {
      var el = document.getElementById(elId);
      if (el) el.textContent = initials;
    });
  }

  async function loadUserData() {
    if (!currentUser) {
      console.warn("[SliceInvest] loadUserData skipped — no currentUser");
      return;
    }
    // v13 PERFORMANCE: paint cached data INSTANTLY (zero-lag feel)
    var cachedUser = getCache('user', CACHE_TTL);
    if (cachedUser && !currentUserData) {
      currentUserData = cachedUser;
      try { _renderUserDataUI(cachedUser); } catch(e) {}
    }
    try {
      var snap = await getDoc(doc(db, "users", currentUser));
      if (!snap.exists()) {
        console.warn("[SliceInvest] User doc not found:", currentUser);
        return;
      }
      currentUserData = Object.assign({ id: snap.id }, snap.data());
      try { setCache('user', currentUserData); } catch(e) {}

      var name = currentUserData.name || "Investor";
      var balance        = Number(currentUserData.balance || 0);
      var withdrawable   = Number(currentUserData.withdrawableBalance || 0);
      var totalInvested  = Number(currentUserData.totalInvested || 0);
      var totalReturns   = Number(currentUserData.totalReturns || 0);
      var activePlansN   = Number(currentUserData.activePlans || 0);

      // ═══ BALANCE DISPLAY — update every element that shows balance ═══
      _setText("userNameDisplay", name);
      _setText("walletBalance",   fmt(balance));
      _setText("walletBalance2",  fmt(balance));
      _setText("totalInvested",   fmt(totalInvested));
      _setText("totalReturns",    fmt(totalReturns));
      _setText("activePlans",     String(activePlansN));

      // Modal balance chips (visible when modals open)
      _setText("depositCurrentBalance",   fmt(balance));
      _setText("withdrawAvailableBalance", fmt(withdrawable));
      _setText("withdrawableBalance",     fmt(withdrawable));

      // ═══ Run watchdog so balance is GUARANTEED visible ═══
      _ensureBalanceVisible();
      // Run again after CSS animations settle, in case a transition hides it
      setTimeout(_ensureBalanceVisible, 350);

      // Withdrawable info row (settings)
      var wInfo = document.getElementById("withdrawableInfo");
      if (wInfo) wInfo.textContent = "Withdrawable balance (from plan earnings): " + fmt(withdrawable);

      // FIX: Auto-generate & persist referralCode if missing (so share button works first time)
      if (!currentUserData.referralCode) {
        var freshCode = generateReferralCode(name);
        currentUserData.referralCode = freshCode;
        try { await updateDoc(doc(db, "users", currentUser), { referralCode: freshCode }); } catch(e) { console.warn('Persist refCode failed:', e); }
      }
      var refCodeEl = document.getElementById("referralCode");
      if (refCodeEl) refCodeEl.textContent = currentUserData.referralCode;
      var shareCodeEl = document.getElementById("shareReferralCode");
      if (shareCodeEl) shareCodeEl.textContent = currentUserData.referralCode;

      _setText("settingsUserName",  name);
      _setText("settingsUserPhone", currentUserData.phone || "");

      var completion = 20;
      if (currentUserData.name) completion += 20;
      if (currentUserData.email) completion += 15;
      if (currentUserData.withdrawPassword) completion += 20;
      if (bankAccounts.length > 0) completion += 15;
      if (currentUserData.totalInvested > 0) completion += 10;
      completion = Math.min(100, completion);
      var pcFill = document.getElementById("pcFill");
      var pcText = document.querySelector(".pc-text");
      if (pcFill) pcFill.style.width = completion + "%";
      if (pcText) pcText.textContent = completion + "% Complete";

      var initials = name.split(" ").map(function(w) { return w[0]; }).join("").toUpperCase().slice(0,2);
      ["headerAvatar", "settingsAvatar"].forEach(function(elId) {
        var el = document.getElementById(elId);
        if (el) el.textContent = initials;
      });

      renderPortfolioChart();
    } catch(err) { console.error("loadUserData:", err); }
  }

  // ─── Render Plans (DYNAMIC from admin) — Premium Trust Design ──
  function renderPlans() {
    var grid = document.getElementById("plansGrid");
    if (!grid) return;
    var planBadge = document.getElementById("planCountBadge");
    if (planBadge) planBadge.textContent = PLANS.length + " Plans";

    grid.innerHTML = PLANS.map(function(p, idx) {
      var amountNum = Number(p.amount) || 0;
      var dailyNum = Number(p.dailyReturnFixed) || 0;
      var dur = Number(p.duration) || 15;
      var totalReturn = dailyNum * dur;
      var roiPct = amountNum > 0 ? Math.round((totalReturn / amountNum) * 100) : 0;
      // ═══ v13: Investor count is now ADMIN-CONTROLLABLE per plan ═══
      // If admin set p.investorCount → use it. Otherwise fall back to
      // the deterministic seed-based count (visual trust signal).
      var investorCount;
      var isCustomCount = false;
      if (p.investorCount !== undefined && p.investorCount !== null && p.investorCount !== '' && !isNaN(Number(p.investorCount))) {
        investorCount = Math.max(0, Math.floor(Number(p.investorCount)));
        isCustomCount = true;
      } else {
        var seed = 0;
        for (var si = 0; si < (p.id || '').length; si++) seed = (seed * 31 + (p.id || '').charCodeAt(si)) >>> 0;
        investorCount = 840 + (seed % 2400); // between 840 and ~3240
      }
      var investorText = investorCount >= 1000 ? (investorCount/1000).toFixed(1) + 'k' : String(investorCount);

      // Image or icon fallback (image from admin)
      var imageBlock;
      if (p.image) {
        imageBlock = '<div class="plan-media">' +
          '<img src="' + p.image + '" alt="' + (p.name || 'Plan') + '" class="plan-media-img" loading="lazy" decoding="async"/>' +
          '<div class="plan-media-overlay"></div>' +
          '<div class="plan-media-badge"><i class="fas fa-shield-halved"></i> Verified Plan</div>' +
          '<div class="plan-media-icon"><i class="' + (p.icon || 'fas fa-rocket') + '"></i></div>' +
        '</div>';
      } else {
        imageBlock = '<div class="plan-media plan-media-fallback">' +
          '<div class="plan-media-pattern"></div>' +
          '<div class="plan-media-badge"><i class="fas fa-shield-halved"></i> Verified Plan</div>' +
          '<div class="plan-media-icon big"><i class="' + (p.icon || 'fas fa-rocket') + '"></i></div>' +
        '</div>';
      }

      return '<div class="plan-card ' + p.badge + '">' +
        imageBlock +
        '<div class="plan-body">' +
          '<div class="plan-top-row">' +
            '<div class="plan-name-wrap">' +
              '<div class="plan-name">' + p.name + '</div>' +
              '<span class="plan-badge ' + p.badgeClass + '">' + p.badge + '</span>' +
            '</div>' +
            '<div class="plan-trust-investors' + (isCustomCount ? ' is-custom' : '') + '" title="Active investors">' +
              '<i class="fas fa-users"></i> <strong>' + investorText + '</strong><span>investors</span>' +
            '</div>' +
          '</div>' +

          '<div class="plan-amount-row">' +
            '<div class="plan-amount-label">Investment Amount</div>' +
            '<div class="plan-amount">' + fmt(p.amount).replace(".00","") + '</div>' +
          '</div>' +

          '<div class="plan-stats-grid">' +
            '<div class="plan-stat">' +
              '<div class="plan-stat-label"><i class="fas fa-coins"></i> Daily Return</div>' +
              '<div class="plan-stat-val">₹' + dailyNum + '</div>' +
            '</div>' +
            '<div class="plan-stat">' +
              '<div class="plan-stat-label"><i class="fas fa-calendar-check"></i> Duration</div>' +
              '<div class="plan-stat-val">' + dur + ' Days</div>' +
            '</div>' +
            '<div class="plan-stat highlight">' +
              '<div class="plan-stat-label"><i class="fas fa-chart-line"></i> Total Return</div>' +
              '<div class="plan-stat-val">' + fmt(totalReturn).replace(".00","") + '</div>' +
            '</div>' +
            '<div class="plan-stat highlight">' +
              '<div class="plan-stat-label"><i class="fas fa-percent"></i> ROI</div>' +
              '<div class="plan-stat-val">' + roiPct + '%</div>' +
            '</div>' +
          '</div>' +

          '<div class="plan-features">' +
            (p.features || []).map(function(f) { return '<div class="plan-feature"><i class="fas fa-circle-check"></i>' + f + '</div>'; }).join("") +
          '</div>' +

          '<div class="plan-trust-row">' +
            '<div class="plan-trust-item"><i class="fas fa-shield-halved"></i> SSL Secured</div>' +
            '<div class="plan-trust-item"><i class="fas fa-bolt"></i> Daily Payout</div>' +
            '<div class="plan-trust-item"><i class="fas fa-circle-check"></i> Admin Verified</div>' +
          '</div>' +

          '<button class="plan-invest-btn" onclick="openInvestModal(\'' + p.id + '\')">' +
            '<span class="pib-shine"></span>' +
            '<i class="fas fa-seedling"></i> Invest Now — Start Earning' +
          '</button>' +
          '<div class="plan-guarantee"><i class="fas fa-lock"></i> 100% Capital Protected • Withdraw Anytime</div>' +
        '</div>' +
      '</div>';
    }).join("");
  }

  // ─── Invest ───────────────────────────────────────────────────
  window.openInvestModal = function(planId) {
    selectedPlan = PLANS.find(function(p) { return p.id === planId; });
    if (!selectedPlan) return;
    var maxP = selectedPlan.maxPurchases || MAX_PURCHASES_PER_PLAN;
    document.getElementById("selectedPlanPreview").innerHTML =
      '<div class="spp-name">' + selectedPlan.name + '</div>' +
      '<div class="spp-amount">' + fmt(selectedPlan.amount) + '</div>' +
      '<div class="spp-detail"><i class="fas fa-coins"></i> ₹' + selectedPlan.dailyReturnFixed + ' Daily Returns</div>' +
      '<div class="spp-detail"><i class="fas fa-arrow-right-arrow-left"></i> Daily Withdraw Available</div>' +
      '<div class="spp-detail"><i class="fas fa-calendar-days"></i> Term: ' + selectedPlan.duration + ' Days</div>' +
      '<div class="spp-detail"><i class="fas fa-repeat"></i> Max ' + maxP + ' Purchases</div>';
    openModal("investModal");
  };

  window.confirmInvest = async function() {
    if (!selectedPlan) return;
    if (isInvestProcessing) return showToast("Processing your investment, please wait...", "warning");
    isInvestProcessing = true;

    try {
      var maxP = selectedPlan.maxPurchases || MAX_PURCHASES_PER_PLAN;
      var investSnap = await getDocs(
        query(collection(db, "investments"),
          where("userId", "==", currentUser),
          where("planId", "==", selectedPlan.id),
          where("status", "==", "active")
        )
      );
      if (investSnap.size >= maxP) {
        isInvestProcessing = false;
        return showToast("You can only have " + maxP + " active purchases of " + selectedPlan.name + ".", "error");
      }

      var freshSnap = await getDoc(doc(db, "users", currentUser));
      if (!freshSnap.exists()) { isInvestProcessing = false; return showToast("User not found.", "error"); }
      var freshData = freshSnap.data();
      var balance = freshData.balance || 0;

      if (balance < selectedPlan.amount) { isInvestProcessing = false; return showToast("Insufficient balance. Deposit first.", "error"); }

      var newBalance    = balance - selectedPlan.amount;
      var totalInvested = (freshData.totalInvested || 0) + selectedPlan.amount;
      var activePlans   = (freshData.activePlans   || 0) + 1;

      var now = new Date();
      var endDate = new Date(now.getTime() + selectedPlan.duration * 24 * 60 * 60 * 1000);

      await updateDoc(doc(db, "users", currentUser), { balance: newBalance, totalInvested: totalInvested, activePlans: activePlans });

      await addDoc(collection(db, "investments"), {
        userId: currentUser, planId: selectedPlan.id, planName: selectedPlan.name,
        amount: selectedPlan.amount, dailyReturnFixed: selectedPlan.dailyReturnFixed,
        duration: selectedPlan.duration,
        startDate: serverTimestamp(),
        endDate: Timestamp.fromDate(endDate),
        daysCompleted: 0, lastDisbursedDate: null,
        status: "active", createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "transactions"), {
        userId: currentUser, type: "invest", amount: selectedPlan.amount,
        plan: selectedPlan.name, status: "approved", createdAt: serverTimestamp()
      });

      currentUserData.balance       = newBalance;
      currentUserData.totalInvested = totalInvested;
      currentUserData.activePlans   = activePlans;

      closeModal("investModal");
      loadUserData(); loadMyInvestments(); loadTransactions();
      showToast("Invested " + fmt(selectedPlan.amount) + " in " + selectedPlan.name + "! 🎉", "success");
    } catch(err) {
      console.error(err);
      showToast("Investment failed: " + err.message, "error");
    } finally {
      isInvestProcessing = false;
    }
  };

  // ═══ AUTO DAILY RETURNS DISPERSAL (FIXED) ═══
  // FIX: Per-investment atomic processing — mark disbursed FIRST (idempotency lock),
  // then credit balance. If crediting fails for one investment, only that investment
  // is affected on retry — not all. Also guards against concurrent runs via processing lock.
  var _dailyReturnsInProgress = false;
  async function processAutoDailyReturns() {
    if (!currentUser) return;
    if (_dailyReturnsInProgress) {
      console.log("[SliceInvest] Daily returns already processing, skipping duplicate run");
      return;
    }
    _dailyReturnsInProgress = true;

    var now = new Date();
    // Skip if between 00:00 and 00:03 to let midnight rollover settle
    if (now.getHours() === 0 && now.getMinutes() < 3) { _dailyReturnsInProgress = false; return; }
    var today = getTodayString();
    var todayCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 3, 0);

    try {
      var investSnap = await getDocs(
        query(collection(db, "investments"), where("userId", "==", currentUser), where("status", "==", "active"))
      );
      if (investSnap.empty) { _dailyReturnsInProgress = false; return; }

      var totalDailyCredit = 0;
      var plansCompleted = 0;
      var creditedInvestments = [];

      for (var idx = 0; idx < investSnap.docs.length; idx++) {
        var invDoc = investSnap.docs[idx];
        var inv = invDoc.data();
        var lastDisbursed = inv.lastDisbursedDate || null;
        if (lastDisbursed === today) continue; // already processed today

        var investCreatedAt = inv.createdAt || inv.startDate;
        if (investCreatedAt) {
          var createdDate;
          try { createdDate = investCreatedAt.toDate ? investCreatedAt.toDate() : new Date(investCreatedAt); } catch(e) { createdDate = new Date(0); }
          // Skip plans bought after today's 00:03 cutoff (give them tomorrow's return)
          if (createdDate >= todayCutoff) continue;
        }

        var daysCompleted = inv.daysCompleted || 0;
        var duration = inv.duration || 15;

        if (daysCompleted >= duration) {
          await updateDoc(doc(db, "investments", invDoc.id), { status: "completed" });
          plansCompleted++;
          continue;
        }

        var dailyReturn = Number(inv.dailyReturnFixed || 0);
        var newDays = daysCompleted + 1;
        var invUpdate = { daysCompleted: newDays, lastDisbursedDate: today };
        if (newDays >= duration) invUpdate.status = "completed";

        // ═══ STEP 1: Mark investment as disbursed FIRST (idempotency lock) ═══
        // This prevents double-crediting if user refreshes during processing
        try {
          await updateDoc(doc(db, "investments", invDoc.id), invUpdate);
        } catch(markErr) {
          console.error("[SliceInvest] Failed to mark investment " + invDoc.id + ":", markErr);
          continue; // skip — don't credit balance without successful mark
        }

        // ═══ STEP 2: Credit user balance immediately (per-investment) ═══
        if (dailyReturn > 0) {
          try {
            var freshSnapInner = await getDoc(doc(db, "users", currentUser));
            if (freshSnapInner.exists()) {
              var fdInner = freshSnapInner.data();
              await updateDoc(doc(db, "users", currentUser), {
                balance: Number(fdInner.balance || 0) + dailyReturn,
                withdrawableBalance: Number(fdInner.withdrawableBalance || 0) + dailyReturn,
                totalReturns: Number(fdInner.totalReturns || 0) + dailyReturn
              });
              totalDailyCredit += dailyReturn;
              creditedInvestments.push({ id: invDoc.id, amount: dailyReturn, planName: inv.planName });
            }
          } catch(creditErr) {
            // Credit failed — REVERT the investment mark so user gets credited on next run
            console.error("[SliceInvest] Credit failed for " + invDoc.id + ", reverting mark:", creditErr);
            try {
              await updateDoc(doc(db, "investments", invDoc.id), {
                daysCompleted: daysCompleted,
                lastDisbursedDate: lastDisbursed || null,
                status: "active"
              });
            } catch(revErr) { console.error("Revert also failed:", revErr); }
            continue;
          }
        }

        if (newDays >= duration) plansCompleted++;
      }

      // Update active plans counter
      if (plansCompleted > 0) {
        try {
          var apSnap = await getDoc(doc(db, "users", currentUser));
          if (apSnap.exists()) {
            await updateDoc(doc(db, "users", currentUser), {
              activePlans: Math.max(0, Number(apSnap.data().activePlans || 0) - plansCompleted)
            });
          }
        } catch(apErr) { console.warn("activePlans update failed:", apErr); }
      }

      // Log single aggregated transaction + notification
      if (totalDailyCredit > 0) {
        try {
          await addDoc(collection(db, "transactions"), {
            userId: currentUser, type: "daily_return", amount: totalDailyCredit,
            plan: "Daily Investment Returns", status: "approved",
            source: "auto", investmentCount: creditedInvestments.length,
            createdAt: serverTimestamp()
          });
          await addDoc(collection(db, "notifications"), {
            userId: currentUser,
            message: "💰 Daily returns of " + fmt(totalDailyCredit) + " credited to your wallet!",
            type: "success", read: false, createdAt: serverTimestamp()
          });
        } catch(logErr) { console.warn("Transaction/notif log failed:", logErr); }

        loadUserData(); loadTransactions(); loadMyInvestments();
        showToast("💰 Daily returns " + fmt(totalDailyCredit) + " credited!", "success");
      }
    } catch(err) {
      console.error("Auto daily returns error:", err);
    } finally {
      _dailyReturnsInProgress = false;
    }
  }

  // ─── Deposit ──────────────────────────────────────────────────
  window.setDepositAmount = function(val) {
    document.getElementById("depositAmount").value = val;
    if (typeof updateDepositLivePreview === 'function') updateDepositLivePreview();
  };

  window.submitDeposit = async function() {
    if (isDepositProcessing) return showToast("Processing your deposit, please wait...", "warning");
    await ensureRuntimeConfigLoaded();
    var amount = parseFloat(document.getElementById("depositAmount").value);
    var utr    = document.getElementById("depositUTR").value.trim();
    var minDeposit = Number(runtimePlatformConfig.minDeposit || DEFAULT_PLATFORM_CONFIG.minDeposit);

    if (!amount || isNaN(amount) || amount < minDeposit) return showToast("Minimum deposit is " + fmt(minDeposit) + ".", "error");
    if (amount > 1000000) return showToast("Maximum single deposit is ₹10,00,000.", "error");
    if (!uploadedScreenshot) return showToast("Please upload payment screenshot.", "error");
    if (!utr) return showToast("Please enter UTR / Transaction ID.", "error");
    if (utr.length < 6) return showToast("Please enter a valid UTR number (min 6 chars).", "error");
    if (utr.length > 32) return showToast("UTR number is too long.", "error");

    isDepositProcessing = true;
    var depositBtn = document.getElementById("depositSubmitBtn");
    if (depositBtn) { depositBtn.disabled = true; depositBtn.classList.add("btn-loading"); depositBtn.innerHTML = '<div class="btn-spinner"></div> Submitting...'; }

    try {
      var screenshotData = await new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.readAsDataURL(uploadedScreenshot);
      });

      await addDoc(collection(db, "requests"), {
        userId: currentUser, userName: currentUserData.name, userPhone: currentUserData.phone,
        type: "deposit", amount: amount, method: "upi", reference: utr,
        screenshot: screenshotData, screenshotName: uploadedScreenshot.name, hasScreenshot: true,
        status: "pending", createdAt: serverTimestamp()
      });
      await addDoc(collection(db, "transactions"), {
        userId: currentUser, type: "deposit", amount: amount, method: "upi",
        reference: utr, hasScreenshot: true, status: "pending", createdAt: serverTimestamp()
      });

      if (depositBtn) { depositBtn.classList.remove("btn-loading"); depositBtn.classList.add("btn-success-anim"); depositBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submitted!'; }
      await new Promise(function(r) { setTimeout(r, 800); });

      closeModal("depositModal");
      document.getElementById("depositAmount").value = "";
      document.getElementById("depositUTR").value = "";
      uploadedScreenshot = null;
      var ph = document.getElementById("screenshotPlaceholder"); if (ph) ph.classList.remove("hidden");
      var pr = document.getElementById("screenshotPreview"); if (pr) pr.classList.add("hidden");
      var pi = document.getElementById("screenshotPreviewImg"); if (pi) pi.src = "";
      var inp = document.getElementById("screenshotInput"); if (inp) inp.value = "";
      loadTransactions();
      showToast("Deposit request submitted! 📤", "success");
    } catch(err) {
      console.error(err);
      showToast("Failed: " + err.message, "error");
    } finally {
      isDepositProcessing = false;
      if (depositBtn) { depositBtn.disabled = false; depositBtn.classList.remove("btn-loading", "btn-success-anim"); depositBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Deposit'; }
    }
  };

  // ─── Withdraw ─────────────────────────────────────────────────
  window.setWithdrawAmount = function(val) {
    document.getElementById("withdrawAmount").value = val;
    if (typeof updateWithdrawLivePreview === 'function') updateWithdrawLivePreview();
  };

  window.submitWithdrawal = async function() {
    await ensureRuntimeConfigLoaded();
    if (!runtimeWithdrawConfig.apiWithdrawEnabled) return showToast("Withdrawals are currently disabled.", "error");

    var amountEl = document.getElementById("withdrawAmount");
    var bankSelEl = document.getElementById("withdrawBankSelect");
    var wPassEl = document.getElementById("withdrawPassword");
    if (!amountEl || !bankSelEl || !wPassEl) return showToast("Withdraw form error. Please reload.", "error");

    var amount  = parseFloat(amountEl.value);
    var bankSel = bankSelEl.value;
    var wPass   = wPassEl.value.trim();
    var minWithdraw = Number(runtimePlatformConfig.minWithdraw || DEFAULT_PLATFORM_CONFIG.minWithdraw);

    if (!amount || isNaN(amount) || amount < minWithdraw) return showToast("Minimum withdrawal is " + fmt(minWithdraw) + ".", "error");
    // FIX: validate bank account selected BEFORE asking for password (better UX)
    if (!bankSel) return showToast("Please select a saved bank account first.", "error");
    if (!wPass) return showToast("Withdraw password required.", "error");

    var storedWP = currentUserData ? currentUserData.withdrawPassword : null;
    if (!storedWP) return showToast("Set a withdraw password first in Settings.", "warning");
    if (storedWP !== wPass) return showToast("Incorrect withdraw password.", "error");

    if (isWithdrawProcessing) return showToast("Processing your withdrawal, please wait...", "warning");
    isWithdrawProcessing = true;

    try {
      var freshSnap = await getDoc(doc(db, "users", currentUser));
      if (!freshSnap.exists()) { isWithdrawProcessing = false; return showToast("User not found.", "error"); }
      var freshData = freshSnap.data();
      var balance = freshData.balance || 0;
      var withdrawableBalance = freshData.withdrawableBalance || 0;

      if (withdrawableBalance < amount) { isWithdrawProcessing = false; return showToast("Insufficient withdrawable funds. Available: " + fmt(withdrawableBalance), "error"); }
      if (balance < amount) { isWithdrawProcessing = false; return showToast("Insufficient balance.", "error"); }

      var account = "";
      var bankDetails = null;
      var withdrawMethod = "unknown";

      if (bankSel && bankSel !== "new" && bankSel !== "") {
        var bank = bankAccounts.find(function(b) { return b.id === bankSel; });
        if (bank) {
          if (bank.type === "upi") {
            if (!runtimeWithdrawConfig.upiWithdrawEnabled) { isWithdrawProcessing = false; return showToast("UPI withdrawals disabled.", "error"); }
            account = "UPI: " + bank.upiId;
            bankDetails = { type: "upi", upiId: bank.upiId, displayName: bank.displayName || "" };
            withdrawMethod = "upi";
          } else {
            if (!runtimeWithdrawConfig.bankWithdrawEnabled) { isWithdrawProcessing = false; return showToast("Bank withdrawals disabled.", "error"); }
            account = bank.bankName + " | " + bank.accountNumber + " | " + (bank.ifsc || "") + " | " + bank.holderName;
            bankDetails = { type: "bank", bankName: bank.bankName || "", accountNumber: bank.accountNumber || "", ifsc: bank.ifsc || "", holderName: bank.holderName || "" };
            withdrawMethod = "bank";
          }
        }
      }

      if (!account) { isWithdrawProcessing = false; return showToast("Please select a saved bank account.", "error"); }

      // ═══ WITHDRAW FEE CALCULATION (v13: pulls live from admin config) ═══
      // Re-fetch the latest fee % right at submission time so we never
      // use a stale value if the admin just updated it.
      var liveFeePct = Number(runtimePlatformConfig.withdrawFeePercent);
      try {
        var feeSnap = await getDoc(doc(db, 'config', 'platform'));
        if (feeSnap.exists()) {
          var fd = feeSnap.data();
          if (fd && fd.withdrawFeePercent !== undefined && fd.withdrawFeePercent !== null) {
            liveFeePct = Number(fd.withdrawFeePercent);
            runtimePlatformConfig.withdrawFeePercent = liveFeePct;
          }
        }
      } catch(e) { /* fall back to runtime value */ }
      var withdrawFeePercent = (isNaN(liveFeePct) || liveFeePct < 0) ? 3 : liveFeePct;
      // FIX: use 2-decimal precision (not Math.round) so paise are not lost
      var withdrawFee = +(amount * withdrawFeePercent / 100).toFixed(2);
      var totalDeduction = amount;
      var userReceives = +(amount - withdrawFee).toFixed(2);

      var newBalance = balance - totalDeduction;
      var newWithdrawable = withdrawableBalance - totalDeduction;
      await updateDoc(doc(db, "users", currentUser), { balance: newBalance, withdrawableBalance: newWithdrawable });
      currentUserData.balance = newBalance;
      currentUserData.withdrawableBalance = newWithdrawable;

      var withdrawRequest = {
        userId: currentUser, userName: currentUserData.name, userPhone: currentUserData.phone,
        type: "withdraw", amount: amount, withdrawFee: withdrawFee, withdrawFeePercent: withdrawFeePercent,
        userReceives: userReceives, account: account, withdrawMethod: withdrawMethod,
        status: "pending", balanceDeducted: true, createdAt: serverTimestamp()
      };
      if (bankDetails) withdrawRequest.bankDetails = bankDetails;
      await addDoc(collection(db, "requests"), withdrawRequest);
      await addDoc(collection(db, "transactions"), { userId: currentUser, type: "withdraw", amount: amount, withdrawFee: withdrawFee, userReceives: userReceives, account: account, status: "pending", createdAt: serverTimestamp() });

      closeModal("withdrawModal");
      document.getElementById("withdrawAmount").value = "";
      document.getElementById("withdrawPassword").value = "";
      loadUserData(); loadTransactions();
      showToast("Withdrawal request submitted! 📨", "success");
    } catch(err) {
      console.error(err);
      showToast("Failed: " + err.message, "error");
    } finally {
      isWithdrawProcessing = false;
    }
  };

  // ─── Withdraw Password ────────────────────────────────────────
  window.setWithdrawPassword = async function() {
    var curr    = document.getElementById("currentWithdrawPass").value.trim();
    var newPass = document.getElementById("newWithdrawPass").value.trim();
    var confirmVal = document.getElementById("confirmWithdrawPass").value.trim();

    if (!newPass)               return showToast("New password cannot be empty.", "error");
    if (newPass !== confirmVal) return showToast("Passwords do not match.", "error");
    if (newPass.length < 4)     return showToast("Minimum 4 characters.", "error");
    if (currentUserData && currentUserData.withdrawPassword && curr !== currentUserData.withdrawPassword) return showToast("Current password is incorrect.", "error");

    try {
      await updateDoc(doc(db, "users", currentUser), { withdrawPassword: newPass });
      currentUserData.withdrawPassword = newPass;
      ["currentWithdrawPass","newWithdrawPass","confirmWithdrawPass"].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ""; });
      closeModal("withdrawPassModal");
      showToast("Withdraw password saved! 🔐", "success");
      loadUserData();
    } catch(err) { showToast("Failed: " + err.message, "error"); }
  };

  // ─── Change Login Password (FIX: renamed shadow variable) ─────
  window.changeLoginPassword = async function() {
    var curr    = document.getElementById("currLoginPass").value.trim();
    var newPass = document.getElementById("newLoginPass").value.trim();
    var confirmPassVal = document.getElementById("confirmLoginPass").value.trim(); // ═══ FIX: was 'confirm' which shadows built-in ═══

    if (!curr) return showToast("Enter current password.", "error");
    if (currentUserData && curr !== currentUserData.password) return showToast("Current password incorrect.", "error");
    if (!newPass || newPass.length < 6) return showToast("New password min 6 chars.", "error");
    if (newPass !== confirmPassVal) return showToast("Passwords don't match.", "error");

    try {
      await updateDoc(doc(db, "users", currentUser), { password: newPass });
      currentUserData.password = newPass;
      ["currLoginPass","newLoginPass","confirmLoginPass"].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ""; });
      closeModal("changePasswordModal");
      showToast("Password updated! ✅", "success");
    } catch(err) { showToast("Failed: " + err.message, "error"); }
  };

  // ─── Edit Profile ─────────────────────────────────────────────
  window.saveProfile = async function() {
    var name  = document.getElementById("editName").value.trim();
    var email = document.getElementById("editEmail").value.trim();
    if (!name || name.length < 2) return showToast("Name too short.", "error");
    try {
      await updateDoc(doc(db, "users", currentUser), { name: name, email: email });
      currentUserData.name = name;
      currentUserData.email = email;
      closeModal("editProfileModal");
      loadUserData();
      showToast("Profile updated! ✅", "success");
    } catch(err) { showToast("Failed: " + err.message, "error"); }
  };

  // ─── BANK ACCOUNTS ───────────────────────────────────────────
  async function loadBankAccounts() {
    // v13 PERFORMANCE: cache-first instant paint
    var cachedBanks = getCache('bankAccounts', CACHE_TTL);
    if (cachedBanks && Array.isArray(cachedBanks) && !bankAccounts.length) {
      bankAccounts = cachedBanks;
      try { renderBankAccounts(); updateBankSelect(); } catch(e) {}
      var c0 = document.getElementById("bankAccountCount");
      if (c0) c0.textContent = bankAccounts.length;
    }
    try {
      var q = query(collection(db, "bankAccounts"), where("userId","==",currentUser));
      var snap = await getDocs(q);
      bankAccounts = snap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
      try { setCache('bankAccounts', bankAccounts); } catch(e) {}
      renderBankAccounts();
      updateBankSelect();
      var countEl = document.getElementById("bankAccountCount");
      if (countEl) countEl.textContent = bankAccounts.length;
    } catch(err) { console.error("loadBankAccounts:", err); bankAccounts = []; }
  }

  function renderBankAccounts() {
    var container = document.getElementById("bankAccountsList");
    if (!container) return;
    if (!bankAccounts.length) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-credit-card"></i><p>No saved accounts</p></div>';
      return;
    }
    container.innerHTML = bankAccounts.map(function(b) {
      var isUPI = b.type === "upi";
      var icon  = isUPI ? "fa-mobile-screen" : "fa-building-columns";
      var title = isUPI ? b.upiId : (b.bankName || "Bank") + " ****" + (b.accountNumber || "").slice(-4);
      var sub   = isUPI ? (b.displayName || "UPI") : (b.holderName || "—");
      return '<div class="bank-account-item"><div class="ba-icon"><i class="fas ' + icon + '"></i></div><div class="ba-info"><div class="ba-name">' + title + '</div><div class="ba-detail">' + sub + '</div></div><button class="ba-delete" onclick="deleteBankAccount(\'' + b.id + '\')"><i class="fas fa-trash"></i></button></div>';
    }).join("");
  }

  function updateBankSelect() {
    var sel = document.getElementById("withdrawBankSelect");
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select saved account —</option>';
    bankAccounts.forEach(function(b) {
      var isUPI = b.type === "upi";
      var label = isUPI ? "UPI: " + b.upiId : b.bankName + " ****" + (b.accountNumber || "").slice(-4);
      sel.innerHTML += '<option value="' + b.id + '">' + label + '</option>';
    });
  }

  window.saveBankAccount = async function() {
    var activeBankTab = document.querySelector(".bt-tab.active");
    var isUPI = activeBankTab && activeBankTab.textContent && activeBankTab.textContent.includes("UPI");
    try {
      if (isUPI) {
        var upiId = document.getElementById("upiId").value.trim();
        var upiName = document.getElementById("upiDisplayName").value.trim();
        if (!upiId) return showToast("Enter UPI ID.", "error");
        await addDoc(collection(db, "bankAccounts"), { userId: currentUser, type: "upi", upiId: upiId, displayName: upiName, createdAt: serverTimestamp() });
      } else {
        var holder  = document.getElementById("bankHolderName").value.trim();
        var bankNm  = document.getElementById("bankName").value.trim();
        var accNum  = document.getElementById("bankAccountNumber").value.trim();
        var accConf = document.getElementById("bankAccountConfirm").value.trim();
        var ifsc    = document.getElementById("bankIFSC").value.trim();
        if (!holder || !bankNm || !accNum || !ifsc) return showToast("Fill all bank fields.", "error");
        if (accNum !== accConf) return showToast("Account numbers don't match.", "error");
        await addDoc(collection(db, "bankAccounts"), { userId: currentUser, type: "bank", holderName: holder, bankName: bankNm, accountNumber: accNum, ifsc: ifsc, createdAt: serverTimestamp() });
      }
      closeModal("addBankModal");
      ["bankHolderName","bankName","bankAccountNumber","bankAccountConfirm","bankIFSC","upiId","upiDisplayName"].forEach(function(id) { var el = document.getElementById(id); if (el) el.value = ""; });
      await loadBankAccounts();
      loadUserData();
      showToast("Bank account saved! 🏦", "success");
    } catch(err) { showToast("Failed: " + err.message, "error"); }
  };

  window.deleteBankAccount = async function(accountId) {
    if (!window.confirm("Delete this bank account?")) return;
    try {
      await deleteDoc(doc(db, "bankAccounts", accountId));
      await loadBankAccounts();
      showToast("Account removed.", "info");
    } catch(err) { showToast("Failed: " + err.message, "error"); }
  };

  // ─── Load My Investments (v13: cache-first paint) ─────────────
  function _renderInvestmentsList(invList, container) {
    if (!invList || !invList.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No investments yet</p></div>'; return; }
    container.innerHTML = invList.map(function(inv) {
      var plan = PLANS.find(function(p) { return p.id === inv.planId; }) || {};
      var dailyReturn = inv.dailyReturnFixed || (plan.dailyReturnFixed || 0);
      var daysCompleted = inv.daysCompleted || 0;
      var duration = inv.duration || 15;
      var progressPct = Math.min(100, Math.round((daysCompleted / duration) * 100));
      return '<div class="investment-item"><div class="inv-icon"><i class="' + (plan.icon || 'fas fa-chart-line') + '"></i></div><div class="inv-info"><div class="inv-name">' + (inv.planName || '—') + '</div><div class="inv-date">Started: ' + fmtDate(inv.startDate) + ' • ₹' + dailyReturn + '/day • ' + daysCompleted + '/' + duration + ' days</div><div class="inv-progress-bar" style="background:rgba(108,92,231,0.1);height:6px;border-radius:3px;margin-top:6px;overflow:hidden;"><div style="width:' + progressPct + '%;height:100%;background:linear-gradient(90deg,#6C5CE7,#00B894);border-radius:3px;transition:width 0.3s;"></div></div><span class="txn-status status-' + inv.status + '">' + inv.status + '</span></div><div class="inv-amount">' + fmt(inv.amount) + '</div></div>';
    }).join("");
  }
  window.loadMyInvestments = async function() {
    var container = document.getElementById("investmentsList");
    if (!container) return;
    // v13 PERFORMANCE: cache-first instant paint
    var cachedInv = getCache('investments', CACHE_TTL);
    if (cachedInv && Array.isArray(cachedInv)) _renderInvestmentsList(cachedInv, container);
    try {
      var q = query(collection(db, "investments"), where("userId","==", currentUser));
      var snap = await getDocs(q);
      var docs = sortDocsByCreatedAt(snap.docs, 10);
      var invList = docs.map(function(d) { return d.data(); });
      try { setCache('investments', invList); } catch(e) {}
      _renderInvestmentsList(invList, container);
    } catch(err) {
      console.error(err);
      if (!cachedInv) container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>' + err.message + '</p></div>';
    }
  };

  // ─── Load Transactions (v13: cache-first paint) ───────────────
  async function loadTransactions() {
    // v13 PERFORMANCE: cache-first instant paint
    var cachedTxns = getCache('transactions', CACHE_TTL);
    if (cachedTxns && Array.isArray(cachedTxns) && !allTransactions.length) {
      allTransactions = cachedTxns;
      try {
        renderTransactions(allTransactions.slice(0, 10), "transactionsList");
        renderTransactions(allTransactions, "walletTransactionsList");
      } catch(e) {}
    }
    try {
      var q = query(collection(db, "transactions"), where("userId","==",currentUser));
      var snap = await getDocs(q);
      allTransactions = sortDocsByCreatedAt(snap.docs, 50).map(function(d) { return Object.assign({ id: d.id }, d.data()); });
      try { setCache('transactions', allTransactions); } catch(e) {}
      renderTransactions(allTransactions.slice(0, 10), "transactionsList");
      renderTransactions(allTransactions, "walletTransactionsList");
    } catch(err) { console.error(err); }
  }

  function renderTransactions(transactions, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    if (!transactions.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No transactions yet</p></div>'; return; }
    container.innerHTML = transactions.map(function(t) {
      var isCredit = t.type === "deposit" || t.type === "daily_return" || t.type === "referral_bonus";
      var typeIcon, iconClass, label;
      if (t.type === "deposit") { typeIcon = "deposit"; iconClass = "fa-circle-arrow-down"; label = "Deposit"; }
      else if (t.type === "withdraw") { typeIcon = "withdraw"; iconClass = "fa-arrow-up-from-bracket"; label = "Withdrawal"; }
      else if (t.type === "daily_return") { typeIcon = "deposit"; iconClass = "fa-coins"; label = "Daily Return"; }
      else if (t.type === "referral_bonus") { typeIcon = "referral"; iconClass = "fa-user-group"; label = "Refer Bonus 🎁"; }
      else { typeIcon = "invest"; iconClass = "fa-seedling"; label = "Investment — " + (t.plan || ""); }
      var displayStatus = (t.type === "withdraw" && t.status === "approved") ? "Successful" : t.status;
      var statusClass = (t.type === "withdraw" && t.status === "approved") ? "successful" : t.status;
      // Show withdraw fee info if present
      var feeInfo = "";
      if (t.type === "withdraw" && t.withdrawFee > 0) {
        feeInfo = '<div class="txn-fee-info"><i class="fas fa-percent"></i> Fee: ' + fmt(t.withdrawFee) + '</div>';
      }
      return '<div class="txn-item"><div class="txn-icon ' + typeIcon + '"><i class="fas ' + iconClass + '"></i></div><div class="txn-info"><div class="txn-type">' + label + '</div><div class="txn-date">' + fmtDateTime(t.createdAt) + '</div>' + feeInfo + '<span class="txn-status status-' + statusClass + '">' + displayStatus + '</span></div><div><div class="txn-amount ' + (isCredit ? 'credit':'debit') + '">' + (isCredit?'+':'-') + fmt(t.amount) + '</div></div></div>';
    }).join("");
  }

  window.filterTransactions = function(type, btn) {
    document.querySelectorAll(".txn-filter").forEach(function(b) { b.classList.remove("active"); });
    btn.classList.add("active");
    var filtered;
    if (type === "all") { filtered = allTransactions; }
    else if (type === "referral_bonus") { filtered = allTransactions.filter(function(t) { return t.type === "referral_bonus"; }); }
    else { filtered = allTransactions.filter(function(t) { return t.type === type; }); }
    renderTransactions(filtered, "walletTransactionsList");
  };

  // ─── Notifications ────────────────────────────────────────────
  var notificationDocs = [];

  function _renderNotifsFromList(notifs) {
    var listEl = document.getElementById("notificationsList");
    if (!listEl) return;
    var badge = document.getElementById("notifBadge");
    var markAllBtn = document.getElementById("markAllReadBtn");
    if (!notifs.length) {
      if (badge) badge.classList.add("hidden");
      if (markAllBtn) markAllBtn.style.display = "none";
      listEl.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No notifications</p></div>';
      return;
    }
    var unread = notifs.filter(function(n) { return !n.read; }).length;
    if (badge) { if (unread > 0) { badge.textContent = unread; badge.classList.remove("hidden"); } else { badge.classList.add("hidden"); } }
    if (markAllBtn) markAllBtn.style.display = unread > 0 ? "inline-flex" : "none";
    listEl.innerHTML = notifs.map(function(n) {
      var isRead = n.read === true;
      var color = n.type === "success" ? "dot-green" : n.type === "warning" ? "dot-orange" : n.type === "error" ? "dot-red" : "dot-blue";
      var readClass = isRead ? "notif-read" : "notif-unread";
      return '<div class="notif-item ' + readClass + '" data-notif-id="' + n.id + '" onclick="markNotificationRead(\'' + n.id + '\', this)"><div class="notif-dot ' + color + '"></div><div style="flex:1;min-width:0;"><div class="notif-text">' + n.message + '</div><div class="notif-time">' + fmtDateTime(n.createdAt) + '</div></div><span class="notif-read-check"><i class="fas fa-check-circle"></i></span></div>';
    }).join("");
  }
  async function loadNotifications() {
    // v13 PERFORMANCE: cache-first paint
    var cachedNotifs = getCache('notifications', CACHE_TTL);
    if (cachedNotifs && Array.isArray(cachedNotifs)) {
      try { _renderNotifsFromList(cachedNotifs); } catch(e) {}
    }
    try {
      var q = query(collection(db, "notifications"), where("userId","==",currentUser));
      var snap = await getDocs(q);
      var docs = sortDocsByCreatedAt(snap.docs, 20);
      notificationDocs = docs;
      try { setCache('notifications', docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); })); } catch(e) {}
      var badge = document.getElementById("notifBadge");
      var markAllBtn = document.getElementById("markAllReadBtn");
      if (!docs.length) {
        if (badge) badge.classList.add("hidden");
        if (markAllBtn) markAllBtn.style.display = "none";
        document.getElementById("notificationsList").innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No notifications</p></div>';
        return;
      }
      var unread = docs.filter(function(d) { return !d.data().read; }).length;
      if (badge) { if (unread > 0) { badge.textContent = unread; badge.classList.remove("hidden"); } else { badge.classList.add("hidden"); } }
      if (markAllBtn) markAllBtn.style.display = unread > 0 ? "inline-flex" : "none";

      document.getElementById("notificationsList").innerHTML = docs.map(function(d) {
        var n = d.data();
        var isRead = n.read === true;
        var color = n.type === "success" ? "dot-green" : n.type === "warning" ? "dot-orange" : n.type === "error" ? "dot-red" : "dot-blue";
        var readClass = isRead ? "notif-read" : "notif-unread";
        return '<div class="notif-item ' + readClass + '" data-notif-id="' + d.id + '" onclick="markNotificationRead(\'' + d.id + '\', this)"><div class="notif-dot ' + color + '"></div><div style="flex:1;min-width:0;"><div class="notif-text">' + n.message + '</div><div class="notif-time">' + fmtDateTime(n.createdAt) + '</div></div><span class="notif-read-check"><i class="fas fa-check-circle"></i></span></div>';
      }).join("");
    } catch(err) { console.error("Notifications:", err); }
  }

  window.markNotificationRead = async function(notifId, element) {
    if (!notifId || !element) return;
    if (element.classList.contains("notif-read")) return;
    try {
      element.classList.remove("notif-unread"); element.classList.add("notif-marking-read");
      await updateDoc(doc(db, "notifications", notifId), { read: true });
      setTimeout(function() { element.classList.remove("notif-marking-read"); element.classList.add("notif-read"); }, 400);
      var badge = document.getElementById("notifBadge");
      if (badge && !badge.classList.contains("hidden")) {
        var currentCount = parseInt(badge.textContent) || 0;
        var newCount = Math.max(0, currentCount - 1);
        if (newCount > 0) { badge.textContent = newCount; }
        else { badge.classList.add("hidden"); var markAllBtn = document.getElementById("markAllReadBtn"); if (markAllBtn) markAllBtn.style.display = "none"; }
      }
    } catch(err) { console.error("Mark notification read error:", err); }
  };

  window.markAllNotificationsRead = async function() {
    try {
      var unreadItems = document.querySelectorAll(".notif-item.notif-unread");
      if (unreadItems.length === 0) { showToast("All notifications already read! ✅", "info"); return; }
      unreadItems.forEach(function(item) { item.classList.remove("notif-unread"); item.classList.add("notif-marking-read"); });
      var updatePromises = [];
      for (var i = 0; i < notificationDocs.length; i++) {
        var nd = notificationDocs[i];
        if (!nd.data().read) updatePromises.push(updateDoc(doc(db, "notifications", nd.id), { read: true }));
      }
      await Promise.all(updatePromises);
      setTimeout(function() { unreadItems.forEach(function(item) { item.classList.remove("notif-marking-read"); item.classList.add("notif-read"); }); }, 400);
      var badge = document.getElementById("notifBadge"); if (badge) badge.classList.add("hidden");
      var markAllBtn = document.getElementById("markAllReadBtn"); if (markAllBtn) markAllBtn.style.display = "none";
      showToast("All notifications marked as read ✅", "success");
    } catch(err) { console.error("Mark all read error:", err); showToast("Failed to mark notifications.", "error"); }
  };

  window.showNotifications = function() { loadNotifications(); openModal("notificationsModal"); };

  // ─── Portfolio Chart ──────────────────────────────────────────
  async function renderPortfolioChart() {
    var canvas = document.getElementById("portfolioChart");
    var emptyEl = document.getElementById("portfolioEmpty");
    if (!canvas) return;
    try {
      var q = query(collection(db, "investments"), where("userId","==",currentUser));
      var snap = await getDocs(q);
      if (snap.empty) { canvas.style.display = "none"; if (emptyEl) emptyEl.classList.remove("hidden"); return; }
      canvas.style.display = "block"; if (emptyEl) emptyEl.classList.add("hidden");
      var planCounts = {};
      snap.docs.forEach(function(d) { var name = d.data().planName || "Unknown"; planCounts[name] = (planCounts[name] || 0) + 1; });
      if (portfolioChart) portfolioChart.destroy();
      var colors = ["#00B894","#6C5CE7","#E17055","#00CEC9","#FD79A8","#FDCB6E","#74B9FF"];
      portfolioChart = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: { labels: Object.keys(planCounts), datasets: [{ data: Object.values(planCounts), backgroundColor: colors.slice(0, Object.keys(planCounts).length), borderWidth: 0, hoverOffset: 8 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { family: "Poppins", size: 12, weight: "600" }, padding: 16 } } } }
      });
    } catch(err) { console.error("Portfolio chart:", err); }
  }

  // ─── Daily Reward / 7-Day Signup Bonus ───────────────────────────────
  var _claimInFlight = false;

  function _computeNextBonusAmount(nextStreak) {
    var baseR = Number(runtimePlatformConfig.baseReward || DEFAULT_PLATFORM_CONFIG.baseReward);
    var streakB = Number(runtimePlatformConfig.streakBonus || DEFAULT_PLATFORM_CONFIG.streakBonus);
    var maxR = Number(runtimePlatformConfig.maxReward || DEFAULT_PLATFORM_CONFIG.maxReward);
    return Math.min(baseR + nextStreak * streakB, maxR);
  }

  function _isClaimedToday(lastReward, rewardHistory) {
    // PRIMARY check: today's date-string in rewardHistory (deterministic, immune to serverTimestamp race)
    try {
      var today = getTodayString();
      if (Array.isArray(rewardHistory) && rewardHistory.indexOf(today) !== -1) return true;
    } catch (e) {}
    // SECONDARY check: timestamp comparison (kept for backwards compatibility)
    if (!lastReward) return false;
    try {
      var d = lastReward.toDate ? lastReward.toDate() : new Date(lastReward);
      if (isNaN(d.getTime())) return false;
      return d.toDateString() === new Date().toDateString();
    } catch (e) { return false; }
  }

  function _setClaimBtnState(state, opts) {
    opts = opts || {};
    var btn = document.getElementById("claimRewardBtn");
    var textEl = document.getElementById("claimBtnText");
    var amtEl = document.getElementById("claimBtnAmount");
    var hintEl = document.getElementById("claimBtnHint");
    if (!btn) return;
    btn.classList.remove("is-ready","is-claimed","is-loading","is-complete");
    btn.disabled = false;
    if (state === "ready") {
      btn.classList.add("is-ready");
      if (textEl) textEl.textContent = opts.text || "CLAIM TODAY'S BONUS";
      if (amtEl) { amtEl.style.display = ""; amtEl.textContent = "+ ₹" + (opts.amount || 0); }
      if (hintEl) hintEl.textContent = opts.hint || "Come back every day to maximize your reward";
    } else if (state === "claimed") {
      btn.classList.add("is-claimed");
      btn.disabled = true;
      if (textEl) textEl.textContent = opts.text || "✓ CLAIMED TODAY";
      if (amtEl) { amtEl.style.display = "none"; }
      if (hintEl) hintEl.textContent = opts.hint || "Come back tomorrow to continue your streak 🔥";
    } else if (state === "loading") {
      btn.classList.add("is-loading");
      btn.disabled = true;
      if (textEl) textEl.textContent = "CLAIMING…";
      if (amtEl) amtEl.style.display = "none";
    } else if (state === "complete") {
      btn.classList.add("is-complete");
      btn.disabled = true;
      if (textEl) textEl.textContent = opts.text || "🏆 7-DAY STREAK COMPLETE";
      if (amtEl) amtEl.style.display = "none";
      if (hintEl) hintEl.textContent = opts.hint || "Amazing! You completed all 7 days 🎉";
    }
  }

  function _updateBonusProgress(streak, claimedToday) {
    var fill = document.getElementById("bonusProgressFill");
    var label = document.getElementById("bonusProgressLabel");
    var pct = document.getElementById("bonusProgressPct");
    var progress = Math.min(streak, MAX_REWARD_STREAK);
    var percent = Math.round((progress / MAX_REWARD_STREAK) * 100);
    if (fill) fill.style.width = percent + "%";
    if (pct) pct.textContent = percent + "%";
    if (label) {
      if (progress === 0) label.textContent = "Start your streak today";
      else if (progress >= MAX_REWARD_STREAK) label.textContent = "🏆 7-day streak complete!";
      else if (claimedToday) label.textContent = "Day " + progress + " claimed — keep going!";
      else label.textContent = "Day " + (progress + 1) + " ready to claim";
    }
  }

  function loadDailyRewardStatus() {
    var streak = currentUserData ? (currentUserData.dailyRewardStreak || 0) : 0;
    if (streak > MAX_REWARD_STREAK) streak = MAX_REWARD_STREAK;
    var lastReward = currentUserData ? currentUserData.lastRewardDate : null;
    var rewardHistory = currentUserData ? (currentUserData.rewardHistory || []) : [];
    var claimedToday = _isClaimedToday(lastReward, rewardHistory);

    // Check if streak was broken (missed a day)
    var streakBroken = false;
    if (lastReward && !claimedToday) {
      try {
        var lastDate = lastReward.toDate ? lastReward.toDate() : new Date(lastReward);
        var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate.toDateString() !== yesterday.toDateString()) streakBroken = true;
      } catch(e) {}
    }

    var streakEl = document.getElementById("rewardStreak");
    if (streakEl) streakEl.textContent = "🔥 Day " + streak + "/" + MAX_REWARD_STREAK;

    var subtextEl = document.getElementById("dailyRewardSubtext");
    if (subtextEl) {
      if (claimedToday) subtextEl.textContent = "✅ Bonus claimed — see you tomorrow!";
      else if (streak === 0) subtextEl.textContent = "Claim free cash for 7 days straight 🎉";
      else if (streakBroken) subtextEl.textContent = "Streak reset — start fresh today 💪";
      else subtextEl.textContent = "Your bonus is ready to claim 🎁";
    }

    _updateBonusProgress(streak, claimedToday);

    // Compact-card mini claim amount + claimed-state styling
    var card = document.getElementById("dailyRewardBanner");
    var miniEl = document.getElementById("bonusClaimMini");

    // Button state
    if (claimedToday) {
      if (streak >= MAX_REWARD_STREAK) _setClaimBtnState("complete");
      else _setClaimBtnState("claimed");
      if (card) card.classList.add("is-claimed");
      if (miniEl) miniEl.textContent = "✓ Claimed";
    } else {
      var effectiveStreak = streakBroken ? 0 : streak;
      if (effectiveStreak >= MAX_REWARD_STREAK) effectiveStreak = 0;
      var nextStreak = effectiveStreak + 1;
      var nextBonus = _computeNextBonusAmount(nextStreak);
      _setClaimBtnState("ready", {
        amount: nextBonus,
        text: "CLAIM DAY " + nextStreak + " BONUS",
        hint: nextStreak === MAX_REWARD_STREAK
          ? "🏆 Final day — claim your biggest bonus!"
          : "Tap to claim " + nextStreak + "/" + MAX_REWARD_STREAK + " of your signup reward"
      });
      if (card) card.classList.remove("is-claimed");
      if (miniEl) miniEl.textContent = "+ ₹" + nextBonus;
    }
  }

  // Toggle compact daily-reward card open/closed
  window.toggleDailyReward = function(forceOpen) {
    var card = document.getElementById("dailyRewardBanner");
    var btn = document.getElementById("bonusToggleBtn");
    if (!card) return;
    var willOpen;
    if (forceOpen === true) willOpen = true;
    else if (forceOpen === false) willOpen = false;
    else willOpen = card.classList.contains("is-collapsed");
    if (willOpen) {
      card.classList.remove("is-collapsed");
      if (btn) btn.setAttribute("aria-expanded", "true");
      try { renderDailyCalendar(); } catch(e) {}
    } else {
      card.classList.add("is-collapsed");
      if (btn) btn.setAttribute("aria-expanded", "false");
    }
  };

  window.claimDailyReward = async function() {
    if (_claimInFlight) return;
    if (!currentUser) { showToast("Please log in to claim your bonus", "warning"); return; }

    try {
      _claimInFlight = true;
      _setClaimBtnState("loading");
      await ensureRuntimeConfigLoaded();

      var lastReward = currentUserData ? currentUserData.lastRewardDate : null;
      var rewardHistory = currentUserData ? (currentUserData.rewardHistory || []) : [];
      if (_isClaimedToday(lastReward, rewardHistory)) {
        showToast("Already claimed today! Come back tomorrow 🕐", "warning");
        loadDailyRewardStatus();
        return;
      }

      // ═══ FIX: Re-fetch fresh user data to prevent double-claim race conditions ═══
      try {
        var freshSnap = await getDoc(doc(db, "users", currentUser));
        if (freshSnap && freshSnap.exists()) {
          var freshData = freshSnap.data() || {};
          var freshHistory = freshData.rewardHistory || [];
          var freshLast = freshData.lastRewardDate || null;
          if (_isClaimedToday(freshLast, freshHistory)) {
            // Sync local cache and bail
            if (currentUserData) {
              currentUserData.rewardHistory = freshHistory;
              currentUserData.lastRewardDate = freshLast;
              currentUserData.dailyRewardStreak = freshData.dailyRewardStreak || 0;
              currentUserData.balance = freshData.balance || 0;
            }
            showToast("Already claimed today! Come back tomorrow 🕐", "warning");
            loadDailyRewardStatus();
            return;
          }
          // Use freshest data for streak / balance calculations
          lastReward = freshLast;
          rewardHistory = freshHistory;
          if (currentUserData) {
            currentUserData.balance = freshData.balance || currentUserData.balance || 0;
            currentUserData.dailyRewardStreak = freshData.dailyRewardStreak || 0;
          }
        }
      } catch (refetchErr) {
        console.warn("Fresh re-fetch before claim failed (continuing):", refetchErr);
      }

      // Determine streak: reset if broke, cap at MAX
      var currentStreak = currentUserData ? (currentUserData.dailyRewardStreak || 0) : 0;
      if (lastReward) {
        try {
          var lastDate = lastReward.toDate ? lastReward.toDate() : new Date(lastReward);
          if (!isNaN(lastDate.getTime())) {
            var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
            if (lastDate.toDateString() !== yesterday.toDateString()) currentStreak = 0;
          }
        } catch(e) { currentStreak = 0; }
      }
      if (currentStreak >= MAX_REWARD_STREAK) currentStreak = 0;
      var streak = currentStreak + 1;
      var bonus = _computeNextBonusAmount(streak);
      if (!isFinite(bonus) || bonus <= 0) bonus = Number(DEFAULT_PLATFORM_CONFIG.baseReward) || 10;

      var newBalance = (currentUserData ? Number(currentUserData.balance) || 0 : 0) + bonus;
      var todayStr = getTodayString();
      if (rewardHistory.indexOf(todayStr) === -1) rewardHistory.push(todayStr);
      var recentHistory = rewardHistory.slice(-30);

      await updateDoc(doc(db, "users", currentUser), {
        balance: newBalance,
        dailyRewardStreak: streak,
        lastRewardDate: serverTimestamp(),
        rewardHistory: recentHistory
      });

      if (currentUserData) {
        currentUserData.balance = newBalance;
        currentUserData.dailyRewardStreak = streak;
        currentUserData.rewardHistory = recentHistory;
        currentUserData.lastRewardDate = { toDate: function() { return new Date(); } };
      }

      // ═══ FIX: Record transaction so user sees it in history ═══
      try {
        await addDoc(collection(db, "transactions"), {
          userId: currentUser,
          type: "daily_reward",
          amount: bonus,
          status: "approved",
          description: "Daily Reward — Day " + streak + "/" + MAX_REWARD_STREAK,
          createdAt: serverTimestamp()
        });
      } catch(txErr) { console.warn("daily reward transaction record failed", txErr); }

      // Notification (non-blocking)
      try {
        await addDoc(collection(db, "notifications"), {
          userId: currentUser,
          message: "🎁 Daily reward Day " + streak + "/" + MAX_REWARD_STREAK + " claimed! ₹" + bonus + " added to your wallet.",
          type: "success",
          read: false,
          createdAt: serverTimestamp()
        });
      } catch(notifErr) { console.warn("notification failed", notifErr); }

      // Trigger celebration
      _fireClaimCelebration();

      // Refresh UI
      try { loadUserData(); } catch(e) {}
      loadDailyRewardStatus();
      try { renderDailyCalendar(); } catch(e) {}

      showToast("🎁 ₹" + bonus + " bonus claimed! Day " + streak + "/" + MAX_REWARD_STREAK + "!", "success");
    } catch (err) {
      console.error("Claim failed:", err);
      showToast("Could not claim bonus: " + (err && err.message ? err.message : "please try again"), "error");
      // Restore button state
      try { loadDailyRewardStatus(); } catch(e) { _setClaimBtnState("ready"); }
    } finally {
      _claimInFlight = false;
    }
  };

  function _fireClaimCelebration() {
    var card = document.getElementById("dailyRewardBanner");
    if (!card) return;
    card.classList.add("celebrate");
    // Confetti burst
    var burst = document.createElement("div");
    burst.className = "confetti-burst";
    var colors = ["#7C3AED","#10B981","#FB923C","#3B82F6","#EC4899","#F59E0B"];
    for (var i = 0; i < 24; i++) {
      var p = document.createElement("span");
      p.className = "confetti-piece";
      var angle = (i / 24) * 360;
      var dist = 80 + Math.random() * 60;
      p.style.setProperty("--x", Math.cos(angle * Math.PI/180) * dist + "px");
      p.style.setProperty("--y", Math.sin(angle * Math.PI/180) * dist + "px");
      p.style.setProperty("--c", colors[i % colors.length]);
      p.style.setProperty("--d", (Math.random() * 0.3) + "s");
      burst.appendChild(p);
    }
    card.appendChild(burst);
    setTimeout(function() {
      card.classList.remove("celebrate");
      if (burst.parentNode) burst.parentNode.removeChild(burst);
    }, 1600);
  }

  function renderDailyCalendar() {
    var container = document.getElementById("dailyCalendar");
    if (!container) return;
    var streak = currentUserData ? (currentUserData.dailyRewardStreak || 0) : 0;
    var lastReward = currentUserData ? currentUserData.lastRewardDate : null;
    var rewardHistoryArr = currentUserData ? (currentUserData.rewardHistory || []) : [];
    var claimedToday = _isClaimedToday(lastReward, rewardHistoryArr);
    var completedDays = streak; if (completedDays > MAX_REWARD_STREAK) completedDays = 0;
    var html = "";
    for (var day = 1; day <= MAX_REWARD_STREAK; day++) {
      var classes = "daily-day"; var icon = "";
      if (day < completedDays || (day === completedDays && claimedToday)) { classes += " checked"; icon = "✅"; }
      else if (day === completedDays + 1 && !claimedToday && completedDays > 0) { classes += " today"; icon = "🎁"; }
      else if (day === 1 && completedDays === 0 && !claimedToday) { classes += " today"; icon = "🎁"; }
      else { classes += " missed"; icon = "⬜"; }
      var baseR = Number(runtimePlatformConfig.baseReward || DEFAULT_PLATFORM_CONFIG.baseReward);
      var streakB = Number(runtimePlatformConfig.streakBonus || DEFAULT_PLATFORM_CONFIG.streakBonus);
      var maxR = Number(runtimePlatformConfig.maxReward || DEFAULT_PLATFORM_CONFIG.maxReward);
      var dayReward = Math.min(baseR + day * streakB, maxR);
      html += '<div class="' + classes + '"><span class="day-num">Day ' + day + '</span><span class="day-icon">' + icon + '</span><span class="day-num">₹' + dayReward + '</span></div>';
    }
    container.innerHTML = html;
  }

  // ═══ REFERRAL DASHBOARD ═══
  function _renderReferralFromCache(cached) {
    if (!cached) return;
    var friendsEl = document.getElementById("refTotalFriends"); if (friendsEl) friendsEl.textContent = cached.friendsCount || 0;
    var depositsEl = document.getElementById("refTotalDeposits"); if (depositsEl) depositsEl.textContent = fmt(cached.totalDeposits || 0);
    var earningsEl = document.getElementById("refTotalEarnings"); if (earningsEl) earningsEl.textContent = fmt(cached.totalEarnings || 0);
    var mFriends = document.getElementById("refModalFriends"); if (mFriends) mFriends.textContent = cached.friendsCount || 0;
    var mEarnings = document.getElementById("refModalEarnings"); if (mEarnings) mEarnings.textContent = fmt(cached.totalEarnings || 0);
  }
  async function loadReferralDashboard() {
    if (!currentUser || !currentUserData || !currentUserData.referralCode) return;
    // v13 cache-first paint
    var cachedRef = getCache('referralFriends', CACHE_TTL);
    if (cachedRef) { try { _renderReferralFromCache(cachedRef); } catch(e) {} }
    try {
      var refSnap = await getDocs(query(collection(db, "users"), where("referredBy", "==", currentUserData.referralCode)));
      var friends = [];
      var totalDeposits = 0;
      var totalEarnings = 0;
      var referralPct = runtimePlatformConfig.referralPercentage || DEFAULT_PLATFORM_CONFIG.referralPercentage || 25;

      for (var i = 0; i < refSnap.docs.length; i++) {
        var friendDoc = refSnap.docs[i];
        var fData = friendDoc.data();
        var friendTotalDeposits = 0;
        try {
          var depSnap = await getDocs(query(collection(db, "requests"), where("userId", "==", friendDoc.id), where("type", "==", "deposit"), where("status", "==", "approved")));
          depSnap.docs.forEach(function(d) { friendTotalDeposits += Number(d.data().amount || 0); });
        } catch(e) { /* skip */ }
        var friendEarnings = Math.floor(friendTotalDeposits * referralPct / 100);
        totalDeposits += friendTotalDeposits;
        totalEarnings += friendEarnings;
        friends.push({ name: fData.name || "User", phone: fData.phone || "", totalDeposits: friendTotalDeposits, earnings: friendEarnings });
      }

      try { setCache('referralFriends', { friendsCount: friends.length, totalDeposits: totalDeposits, totalEarnings: totalEarnings }); } catch(e) {}

      var friendsEl = document.getElementById("refTotalFriends"); if (friendsEl) friendsEl.textContent = friends.length;
      var depositsEl = document.getElementById("refTotalDeposits"); if (depositsEl) depositsEl.textContent = fmt(totalDeposits);
      var earningsEl = document.getElementById("refTotalEarnings"); if (earningsEl) earningsEl.textContent = fmt(totalEarnings);
      var mFriends = document.getElementById("refModalFriends"); if (mFriends) mFriends.textContent = friends.length;
      var mEarnings = document.getElementById("refModalEarnings"); if (mEarnings) mEarnings.textContent = fmt(totalEarnings);

      var listEl = document.getElementById("referralFriendsList");
      if (listEl) {
        if (!friends.length) {
          listEl.innerHTML = '<div class="empty-state sm"><i class="fas fa-user-plus"></i><p>No referrals yet. Share your code!</p></div>';
        } else {
          listEl.innerHTML = friends.map(function(f) {
            var initials = (f.name || "U").split(" ").map(function(w) { return w[0]; }).join("").toUpperCase().slice(0,2);
            var maskedPhone = f.phone ? f.phone.slice(0,4) + "****" + f.phone.slice(-3) : "";
            var safeName = escapeHtmlUser(f.name || 'User');
            return '<div class="ref-friend-item referral-friend-item"><div class="ref-friend-avatar rfi-avatar">' + initials + '</div><div class="ref-friend-info rfi-info"><div class="ref-friend-name rfi-name">' + safeName + '</div><div class="ref-friend-deposits rfi-date">' + maskedPhone + ' · Deposited: ' + fmt(f.totalDeposits) + '</div></div><div class="ref-friend-earned"><span class="ref-friend-earned-val rfi-earnings">' + fmt(f.earnings) + '</span><span class="ref-friend-earned-label">Earned</span></div></div>';
          }).join("");
        }
      }
    } catch(err) { console.error("Referral dashboard error:", err); }
  }

  // ─── Calculator ───────────────────────────────────────────────
  window.calculateReturns = function() {
    var amount = parseFloat((document.getElementById("calcAmount") || {}).value) || 0;
    var rate   = parseFloat((document.getElementById("calcRate") || {}).value) || 0;
    var days   = parseInt((document.getElementById("calcDays") || {}).value) || 0;
    var daily = amount * rate / 100; var total = daily * days; var final_ = amount + total;
    document.getElementById("crDaily").textContent = fmt(daily);
    document.getElementById("crTotal").textContent = fmt(total);
    document.getElementById("crFinal").textContent = fmt(final_);
  };

  // ─── Copy Referral ────────────────────────────────────────────
  window.copyReferral = function() {
    var codeEl = document.getElementById("referralCode");
    var code = codeEl ? codeEl.textContent : "";
    if (!code || code === "—") return showToast("No referral code yet.", "warning");
    navigator.clipboard.writeText(code).then(function() { showToast("Referral code copied! 📋", "success"); }).catch(function() {
      var ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast("Referral code copied! 📋", "success");
    });
  };

  // ============================================================
  //  SHARE & EARN — Premium Referral Sharing (admin-controlled)
  // ============================================================
  function _safeCopyToClipboard(text, successMsg) {
    successMsg = successMsg || 'Copied! 📋';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ showToast(successMsg, 'success'); }).catch(function(){
        var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch(e){} document.body.removeChild(ta); showToast(successMsg, 'success');
      });
    } else {
      var ta2 = document.createElement('textarea'); ta2.value = text; document.body.appendChild(ta2); ta2.select(); try { document.execCommand('copy'); } catch(e){} document.body.removeChild(ta2); showToast(successMsg, 'success');
    }
  }

  function buildShareInviteLink() {
    var code = (currentUserData && currentUserData.referralCode) ? String(currentUserData.referralCode) : '';
    var base = (runtimeLinksConfig.shareBaseLink || 'https://wealth.app/signup').trim();
    if (!code) return base;
    var sep = base.indexOf('?') === -1 ? '?' : '&';
    return base + sep + 'ref=' + encodeURIComponent(code);
  }

  function buildShareMessage() {
    var code = (currentUserData && currentUserData.referralCode) ? String(currentUserData.referralCode) : '';
    var pct = runtimePlatformConfig.referralPercentage || DEFAULT_PLATFORM_CONFIG.referralPercentage || 25;
    var link = buildShareInviteLink();
    var name = (currentUserData && currentUserData.name) ? String(currentUserData.name) : 'A friend';
    var template = runtimeLinksConfig.shareMessageTemplate || "💎 Join me on GROWVEST!\n\nUse my referral code *{CODE}* and start earning daily returns.\n\n🔗 {LINK}";
    return template
      .replace(/\{CODE\}/g, code || '—')
      .replace(/\{LINK\}/g, link)
      .replace(/\{PCT\}/g, String(pct))
      .replace(/\{NAME\}/g, name);
  }

  window.openShareReferralModal = function() {
    if (!currentUserData || !currentUserData.referralCode) {
      return showToast('No referral code yet. Please reload.', 'warning');
    }
    var codeEl = document.getElementById('shareReferralCode');
    if (codeEl) codeEl.textContent = currentUserData.referralCode;
    var linkEl = document.getElementById('shareInviteLink');
    if (linkEl) linkEl.textContent = buildShareInviteLink();
    var msgEl = document.getElementById('shareMessagePreview');
    if (msgEl) msgEl.textContent = buildShareMessage();
    var pct = runtimePlatformConfig.referralPercentage || DEFAULT_PLATFORM_CONFIG.referralPercentage || 25;
    var pctEl = document.getElementById('shareEarnPct');
    if (pctEl) pctEl.textContent = pct + '%';
    if (typeof window.openModal === 'function') window.openModal('shareReferralModal');
  };

  window.copyShareReferralCode = function() {
    var code = (currentUserData && currentUserData.referralCode) ? String(currentUserData.referralCode) : '';
    if (!code) return showToast('No referral code yet.', 'warning');
    _safeCopyToClipboard(code, 'Referral code copied! 📋');
  };

  window.copyShareInviteLink = function() {
    var link = buildShareInviteLink();
    _safeCopyToClipboard(link, 'Invite link copied! 🔗');
  };

  window.shareVia = function(channel) {
    if (!currentUserData || !currentUserData.referralCode) {
      return showToast('No referral code yet. Please reload.', 'warning');
    }
    var msg = buildShareMessage();
    var link = buildShareInviteLink();
    var title = runtimeLinksConfig.shareTitle || 'Join GROWVEST';
    var encMsg = encodeURIComponent(msg);
    var encLink = encodeURIComponent(link);
    var encTitle = encodeURIComponent(title);
    var url = '';
    switch (channel) {
      case 'whatsapp':
        url = 'https://wa.me/?text=' + encMsg; break;
      case 'telegram':
        url = 'https://t.me/share/url?url=' + encLink + '&text=' + encMsg; break;
      case 'facebook':
        url = 'https://www.facebook.com/sharer/sharer.php?u=' + encLink + '&quote=' + encMsg; break;
      case 'twitter':
        url = 'https://twitter.com/intent/tweet?url=' + encLink + '&text=' + encMsg; break;
      case 'instagram':
        _safeCopyToClipboard(msg, 'Message copied! Paste it on Instagram 📸');
        setTimeout(function(){ window.open('https://www.instagram.com/', '_blank'); }, 600);
        return;
      case 'sms':
        url = 'sms:?&body=' + encMsg; break;
      case 'email':
        url = 'mailto:?subject=' + encTitle + '&body=' + encMsg; break;
      case 'native':
        if (navigator.share) {
          navigator.share({ title: title, text: msg, url: link }).catch(function(){});
          return;
        }
        _safeCopyToClipboard(msg, 'Message copied to clipboard! 📋');
        return;
      default: return;
    }
    if (url) window.open(url, '_blank');
  };

  // ─── Dark Mode ────────────────────────────────────────────────
  window.toggleDarkMode = async function() {
    var isDark = document.getElementById("darkModeToggle") ? document.getElementById("darkModeToggle").checked : false;
    document.body.classList.toggle("dark-mode", isDark);
    try { await updateDoc(doc(db, "users", currentUser), { darkMode: isDark }); } catch(err) { console.error(err); }
  };

  window.toggleNotifications = async function() {
    var enabled = document.getElementById("notifToggle") ? document.getElementById("notifToggle").checked : true;
    try { await updateDoc(doc(db, "users", currentUser), { notificationsEnabled: enabled }); showToast(enabled ? "Notifications enabled" : "Notifications disabled", "info"); } catch(err) { console.error(err); }
  };

  // ═══ WITHDRAW SLIP UPLOAD ═══
  var uploadedWithdrawSlip = null;

  window.handleWithdrawSlipUpload = function(event) {
    event.stopPropagation();
    var file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast("Please upload an image file.", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("File too large. Max 5MB.", "error"); return; }
    uploadedWithdrawSlip = file;
    var reader = new FileReader();
    reader.onload = function(e) {
      var ph = document.getElementById("slipUploadPlaceholder"); if (ph) ph.classList.add("hidden");
      var pr = document.getElementById("slipUploadPreview"); if (pr) pr.classList.remove("hidden");
      var pi = document.getElementById("slipUploadPreviewImg"); if (pi) pi.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.removeWithdrawSlip = function(event) {
    event.stopPropagation();
    uploadedWithdrawSlip = null;
    var ph = document.getElementById("slipUploadPlaceholder"); if (ph) ph.classList.remove("hidden");
    var pr = document.getElementById("slipUploadPreview"); if (pr) pr.classList.add("hidden");
    var pi = document.getElementById("slipUploadPreviewImg"); if (pi) pi.src = "";
    var inp = document.getElementById("slipUploadInput"); if (inp) inp.value = "";
  };

  window.submitWithdrawSlip = async function() {
    if (!uploadedWithdrawSlip) return showToast("Please upload a withdraw slip image.", "error");
    var amount = parseFloat((document.getElementById("slipAmount") || {}).value);
    if (!amount || amount <= 0) return showToast("Please enter the amount received.", "error");
    showToast("Uploading withdraw slip...", "info");
    try {
      var slipData = await new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function(e) { resolve(e.target.result); };
        reader.readAsDataURL(uploadedWithdrawSlip);
      });
      await addDoc(collection(db, "withdrawSlips"), { userId: currentUser, userName: currentUserData.name, userPhone: currentUserData.phone, amount: amount, slipImage: slipData, slipFileName: uploadedWithdrawSlip.name, status: "pending", bonusAllocated: 0, createdAt: serverTimestamp() });
      uploadedWithdrawSlip = null;
      var ph = document.getElementById("slipUploadPlaceholder"); if (ph) ph.classList.remove("hidden");
      var pr = document.getElementById("slipUploadPreview"); if (pr) pr.classList.add("hidden");
      var amtEl = document.getElementById("slipAmount"); if (amtEl) amtEl.value = "";
      var inpEl = document.getElementById("slipUploadInput"); if (inpEl) inpEl.value = "";
      loadMyUploadedSlips();
      showToast("Withdraw slip uploaded! 📤", "success");
    } catch(err) { console.error(err); showToast("Upload failed: " + err.message, "error"); }
  };

  async function loadMyUploadedSlips() {
    var container = document.getElementById("myUploadedSlipsList");
    if (!container || !currentUser) return;
    try {
      var q = query(collection(db, "withdrawSlips"), where("userId", "==", currentUser));
      var snap = await getDocs(q);
      var docs = sortDocsByCreatedAt(snap.docs, 10);
      if (!docs.length) { container.innerHTML = '<div class="empty-state sm"><i class="fas fa-receipt"></i><p>No slips uploaded yet</p></div>'; return; }
      container.innerHTML = docs.map(function(d) {
        var data = d.data();
        var statusClass = data.status === "verified" ? "status-approved" : data.status === "rejected" ? "status-rejected" : "status-pending";
        var bonusText = data.bonusAllocated > 0 ? '<span style="color:#00B894;font-size:11px;"> +₹' + data.bonusAllocated + ' bonus</span>' : '';
        return '<div class="slip-item"><div class="slip-icon"><i class="fas fa-receipt"></i></div><div class="slip-info"><div class="slip-amount">' + fmt(data.amount) + '</div><div class="slip-date">' + fmtDateTime(data.createdAt) + '</div></div><span class="txn-status ' + statusClass + '">' + data.status + bonusText + '</span></div>';
      }).join("");
    } catch(err) { console.error("Load slips:", err); }
  }

  // ═══ WITHDRAW PROOFS (Public) ═══
  async function loadWithdrawProofs() {
    var container = document.getElementById("withdrawProofsList");
    if (!container) return;
    try {
      var q = query(collection(db, "withdrawSlips"), where("status", "==", "verified"));
      var snap = await getDocs(q);
      var docs = sortDocsByCreatedAt(snap.docs, 30);

      var totalAmount = 0;
      var uniqueUsers = {};
      docs.forEach(function(d) { var data = d.data(); totalAmount += Number(data.amount || 0); if (data.userId) uniqueUsers[data.userId] = true; });
      var countEl = document.getElementById("proofTotalCount"); if (countEl) countEl.textContent = docs.length;
      var amountEl = document.getElementById("proofTotalAmount"); if (amountEl) amountEl.textContent = fmt(totalAmount);
      var usersEl = document.getElementById("proofUniqueUsers"); if (usersEl) usersEl.textContent = Object.keys(uniqueUsers).length;

      if (!docs.length) { container.innerHTML = '<div class="empty-state sm"><i class="fas fa-shield-check"></i><p>No verified proofs yet</p></div>'; return; }
      container.innerHTML = docs.map(function(d) {
        var data = d.data();
        var maskedName = maskName(data.userName || "User");
        var adminComment = data.adminComment || "";
        var hasImage = !!data.slipImage;
        // Honor admin-set custom time-ago override for manual entries
        var timeAgo = data.timeAgoOverride ? data.timeAgoOverride : getTimeAgo(data.verifiedAt || data.createdAt);
        return '<div class="proof-feed-card" onclick="viewProofImage(\'' + d.id + '\')">' +
          '<div class="proof-feed-top"><div class="proof-feed-avatar"><i class="fas fa-user-check"></i></div><div class="proof-feed-user"><div class="proof-feed-name">' + maskedName + '</div><div class="proof-feed-time">' + timeAgo + '</div></div><div class="proof-feed-verified"><i class="fas fa-circle-check"></i> Verified</div></div>' +
          (hasImage ? '<div class="proof-feed-image-wrap"><img src="' + data.slipImage + '" alt="Payment Proof" loading="lazy"/><div class="proof-image-overlay"><i class="fas fa-expand"></i> Tap to view</div></div>' : '') +
          '<div class="proof-feed-bottom"><div class="proof-feed-amount-row"><span class="proof-feed-label">Withdrawal Amount</span><span class="proof-feed-amount">' + fmt(data.amount) + '</span></div>' +
          (adminComment ? '<div class="proof-feed-comment"><i class="fas fa-comment-dots"></i><span>' + adminComment + '</span></div>' : '') +
          '<div class="proof-feed-badges"><span class="proof-mini-badge green"><i class="fas fa-circle-check"></i> Admin Verified</span><span class="proof-mini-badge blue"><i class="fas fa-shield-halved"></i> Genuine</span></div></div></div>';
      }).join("");
    } catch(err) {
      console.error("Load proofs:", err);
      container.innerHTML = '<div class="empty-state sm"><i class="fas fa-exclamation-circle"></i><p>Could not load proofs</p></div>';
    }
  }

  function getTimeAgo(ts) {
    if (!ts) return "Recently";
    var d;
    try { d = ts.toDate ? ts.toDate() : new Date(ts); } catch(e) { return "Recently"; }
    if (isNaN(d.getTime())) return "Recently";
    var now = new Date();
    var diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return Math.floor(diff / 60) + " min ago";
    if (diff < 86400) return Math.floor(diff / 3600) + " hr ago";
    if (diff < 604800) return Math.floor(diff / 86400) + " days ago";
    return fmtDate(ts);
  }

  window.viewProofImage = async function(slipId) {
    try {
      var snap = await getDoc(doc(db, "withdrawSlips", slipId));
      if (!snap.exists()) return showToast("Proof not found.", "error");
      var data = snap.data();
      if (!data.slipImage) return showToast("No image available.", "error");

      var modal = document.getElementById("proofViewModal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "proofViewModal";
        modal.className = "modal-overlay hidden";
        modal.innerHTML = '<div class="modal-card"><div class="modal-header"><h3><i class="fas fa-shield-check"></i> Withdraw Proof</h3><button class="modal-close" onclick="closeModal(\'proofViewModal\')"><i class="fas fa-xmark"></i></button></div><div class="modal-body" style="text-align:center;padding:16px;"><div id="proofViewInfo" style="margin-bottom:12px;text-align:left;"></div><img id="proofViewImg" src="" alt="Withdraw Proof" style="max-width:100%;max-height:400px;border-radius:12px;border:2px solid #e2e8f0;"/><div id="proofViewComment" style="margin-top:12px;text-align:left;"></div></div><div class="modal-footer"><button class="btn-secondary" onclick="closeModal(\'proofViewModal\')">Close</button></div></div>';
        modal.addEventListener("click", function(e) { if (e.target === modal) modal.classList.add("hidden"); });
        document.body.appendChild(modal);
      }

      var infoEl = document.getElementById("proofViewInfo");
      if (infoEl) {
        infoEl.innerHTML = '<div style="background:rgba(0,184,148,0.08);border:1px solid rgba(0,184,148,0.2);border-radius:12px;padding:12px;margin-bottom:8px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><span style="font-weight:700;color:var(--text);">' + maskName(data.userName) + '</span><span style="font-size:20px;font-weight:900;color:#00B894;">' + fmt(data.amount) + '</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><span style="background:rgba(0,184,148,0.15);color:#00B894;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;"><i class="fas fa-circle-check"></i> Admin Verified</span><span style="font-size:11px;color:var(--text-3);">' + fmtDateTime(data.verifiedAt || data.createdAt) + '</span></div></div>';
      }
      var commentEl = document.getElementById("proofViewComment");
      if (commentEl && data.adminComment) {
        commentEl.innerHTML = '<div style="background:rgba(108,92,231,0.06);border:1px solid rgba(108,92,231,0.15);border-radius:12px;padding:12px;"><div style="font-size:10px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;"><i class="fas fa-comment-dots"></i> Admin Comment</div><p style="font-size:13px;color:var(--text);font-weight:500;margin:0;">' + data.adminComment + '</p></div>';
      } else if (commentEl) { commentEl.innerHTML = ''; }
      var img = document.getElementById("proofViewImg");
      if (img) img.src = data.slipImage;
      openModal("proofViewModal");
    } catch(err) { showToast("Failed to load proof: " + err.message, "error"); }
  };

  // ─── Edit Profile Modal Prefill ───────────────────────────────
  var origOpenModal = window.openModal;
  window.openModal = function(id) {
    origOpenModal(id);
    if (id === "editProfileModal") {
      document.getElementById("editName").value  = currentUserData ? currentUserData.name || "" : "";
      document.getElementById("editEmail").value = currentUserData ? currentUserData.email || "" : "";
      document.getElementById("editPhone").value = currentUserData ? currentUserData.phone || "" : "";
    }
    if (id === "withdrawModal") {
      // ═══ FIX: RESTORE withdraw modal HTML if it was replaced by disabled message ═══
      var wmBody = document.querySelector('#withdrawModal .modal-body');
      var wmFooter = document.querySelector('#withdrawModal .modal-footer');
      if (originalWithdrawModalBody && wmBody && wmBody.querySelector('.withdraw-disabled-banner')) {
        wmBody.innerHTML = originalWithdrawModalBody;
        if (wmFooter && originalWithdrawModalFooter) wmFooter.innerHTML = originalWithdrawModalFooter;
      }
      updateBankSelect();

      // ═══ Check if disabled ═══
      if (!runtimeWithdrawConfig.apiWithdrawEnabled) {
        if (wmBody) wmBody.innerHTML = '<div class="withdraw-disabled-banner"><i class="fas fa-ban"></i><h4>Withdrawals Temporarily Disabled</h4><p>Withdrawals are currently disabled. Please check back later or contact support.</p></div>';
        if (wmFooter) wmFooter.innerHTML = '<button class="btn-secondary full" onclick="closeModal(\'withdrawModal\')">Close</button>';
      } else {
        var withdrawableInfo = document.getElementById('withdrawableInfo');
        if (withdrawableInfo && currentUserData) {
          var wb = currentUserData.withdrawableBalance || 0;
          withdrawableInfo.textContent = "Withdrawable balance (from plan earnings): " + fmt(wb);
        }
        // ═══ v9: populate the hero balance chip + reset live preview ═══
        var heroBalEl = document.getElementById('withdrawAvailableBalance');
        if (heroBalEl && currentUserData) {
          heroBalEl.textContent = fmt(currentUserData.withdrawableBalance || 0);
        }
        var amtInput = document.getElementById('withdrawAmount');
        if (amtInput) amtInput.value = '';
        if (typeof updateWithdrawLivePreview === 'function') updateWithdrawLivePreview();
      }
    }
    if (id === "depositModal") {
      uploadedScreenshot = null;
      var ph = document.getElementById("screenshotPlaceholder"); if (ph) ph.classList.remove("hidden");
      var pr = document.getElementById("screenshotPreview"); if (pr) pr.classList.add("hidden");
      // ═══ v9: populate hero balance chip ═══
      var depBalEl = document.getElementById('depositCurrentBalance');
      if (depBalEl && currentUserData) depBalEl.textContent = fmt(currentUserData.balance || 0);
      var depAmtInput = document.getElementById('depositAmount');
      if (depAmtInput) depAmtInput.value = '';
    }
  };

  // ═══════════════════════════════════════════════════════════════
  //  v9: Live preview for withdraw modal — shows fee + final receivable
  // ═══════════════════════════════════════════════════════════════
  window.updateWithdrawLivePreview = function() {
    var amtInput = document.getElementById('withdrawAmount');
    var amt = amtInput ? parseFloat(amtInput.value) : 0;
    if (!amt || isNaN(amt) || amt < 0) amt = 0;
    // v13 FIX: ALWAYS use the live admin-controlled withdraw fee %.
    // Previously this was hard-coded to 3, so when the admin changed
    // the percentage the user app kept showing the old value.
    var feeRate = Number(runtimePlatformConfig.withdrawFeePercent);
    if (isNaN(feeRate) || feeRate < 0) feeRate = 3;
    var fee = +(amt * feeRate / 100).toFixed(2);
    var finalAmt = +(amt - fee).toFixed(2);
    var elReq   = document.getElementById('wpcRequest');
    var elFee   = document.getElementById('wpcFee');
    var elFinal = document.getElementById('wpcFinal');
    var elRate  = document.getElementById('wpcFeeRate');
    if (elReq)   elReq.textContent   = fmt(amt);
    if (elFee)   elFee.textContent   = '− ' + fmt(fee);
    if (elFinal) elFinal.textContent = fmt(finalAmt > 0 ? finalAmt : 0);
    if (elRate)  elRate.textContent  = String(feeRate);
    // Also keep the static info-note text in sync
    var feeNoteEl = document.getElementById('withdrawFeeInfo');
    if (feeNoteEl) {
      feeNoteEl.innerHTML = '<i class="fas fa-percent"></i> <span>A <strong>' + feeRate + '% withdraw fee</strong> will be deducted from your withdrawal amount.</span>';
    }
  };
  window.updateDepositLivePreview = function() {
    // Hook for future enhancements (e.g. animated thumb on amount input)
    var amtInput = document.getElementById('depositAmount');
    if (!amtInput) return;
    var v = parseFloat(amtInput.value || '0');
    if (v && v > 0) amtInput.classList.add('has-value');
    else amtInput.classList.remove('has-value');
  };

  // ─── User Tab Switching ───────────────────────────────────────
  // PREMIUM NAV PILL MOVER
  function moveNavPill(activeBtn) {
    var nav = document.querySelector(".bottom-nav");
    var pill = nav ? nav.querySelector(".nav-pill") : null;
    if (!nav || !pill || !activeBtn) return;
    var navRect = nav.getBoundingClientRect();
    var btnRect = activeBtn.getBoundingClientRect();
    var x = btnRect.left - navRect.left;
    pill.style.width = btnRect.width + "px";
    pill.style.transform = "translateX(" + x + "px)";
  }
  window.addEventListener("resize", function() {
    var active = document.querySelector(".bottom-nav .nav-item.active");
    if (active) moveNavPill(active);
  });

  window.switchUserTab = function(tab, btn) {
    document.querySelectorAll(".bottom-nav .nav-item").forEach(function(b) { b.classList.remove("active"); });
    if (btn) btn.classList.add("active");
    var activeBtn = btn || document.querySelector('.bottom-nav .nav-item[data-page="' + tab + '"]');
    requestAnimationFrame(function() { moveNavPill(activeBtn); });
    // Second pass (in case nav layout wasn't ready at first paint, e.g. fresh dashboard mount)
    setTimeout(function() { moveNavPill(activeBtn); }, 80);

    ["homeSection","investSection","walletSection","settingsSection","proofsSection"].forEach(function(id) {
      var el = document.getElementById(id); if (el) el.classList.add("hidden");
    });

    var sectionMap = { home: "homeSection", invest: "investSection", wallet: "walletSection", settings: "settingsSection", proofs: "proofsSection" };
    var sectionId = sectionMap[tab];
    if (sectionId) { var el = document.getElementById(sectionId); if (el) el.classList.remove("hidden"); }

    if (tab === "home")     { loadUserData(); renderDailyCalendar(); loadReferralDashboard(); }
    if (tab === "invest")   { loadMyInvestments(); }
    if (tab === "proofs")   { loadWithdrawProofs(); }
    if (tab === "wallet")   { loadTransactions(); }
    if (tab === "settings") { loadBankAccounts(); loadUserData(); loadRuntimeConfig(true); loadMyUploadedSlips(); }
  };

  // ─── App Ready ────────────────────────────────────────────────
  window._refreshDashboard = async function() {
    await loadDynamicPlans();
    await loadRuntimeConfig(true);
    await loadUserData();
    renderPlans();
    await loadMyInvestments();
    await loadTransactions();
    await loadNotifications();
    await loadBankAccounts();
    loadDailyRewardStatus();
    renderDailyCalendar();
    loadMyUploadedSlips();
    processAutoDailyReturns();
    loadReferralDashboard();
  };

  // ═══ PULL-TO-REFRESH ═══
  (function setupPullToRefresh() {
    var mainEl = document.getElementById('userMainContent');
    var ptrEl = document.getElementById('pullToRefresh');
    var ptrText = document.getElementById('ptrText');
    var ptrArrow = document.getElementById('ptrArrow');
    var ptrSpinner = document.getElementById('ptrSpinner');
    if (!mainEl || !ptrEl) return;

    var PTR_THRESHOLD = 70; var PTR_MAX_PULL = 110; var PTR_RESISTANCE = 2.5;
    var touchStartY = 0; var isPulling = false; var isRefreshing = false; var pullDistance = 0;

    function getActiveSection() { var sections = ['homeSection', 'investSection', 'walletSection']; for (var i = 0; i < sections.length; i++) { var el = document.getElementById(sections[i]); if (el && !el.classList.contains('hidden')) return sections[i]; } return null; }
    function isAtTop() { return mainEl.scrollTop <= 2; }

    async function performRefresh() {
      try {
        await loadDynamicPlans();
        await loadRuntimeConfig(true);
        await loadUserData();
        var activeSection = getActiveSection();
        if (activeSection === 'homeSection') { await loadTransactions(); await loadNotifications(); loadDailyRewardStatus(); renderDailyCalendar(); processAutoDailyReturns(); }
        else if (activeSection === 'walletSection') { await loadTransactions(); await loadBankAccounts(); }
        else if (activeSection === 'investSection') { await loadMyInvestments(); renderPlans(); }
        showToast('Refreshed! ✨', 'success');
      } catch(err) { console.warn('Pull-to-refresh error:', err); showToast('Refresh failed.', 'error'); }
    }

    mainEl.addEventListener('touchstart', function(e) { if (isRefreshing) return; if (!getActiveSection()) return; if (!isAtTop()) return; touchStartY = e.touches[0].clientY; isPulling = true; pullDistance = 0; }, { passive: true });
    mainEl.addEventListener('touchmove', function(e) { if (!isPulling || isRefreshing) return; if (!isAtTop()) { resetPull(); return; } var rawDistance = e.touches[0].clientY - touchStartY; if (rawDistance <= 0) { resetPull(); return; } pullDistance = Math.min(PTR_MAX_PULL, rawDistance / PTR_RESISTANCE); if (pullDistance > 5 && isAtTop()) e.preventDefault(); ptrEl.style.height = pullDistance + 'px'; ptrEl.classList.add('pulling'); mainEl.classList.add('ptr-active', 'ptr-pulling'); if (ptrSpinner) ptrSpinner.style.transform = 'rotate(' + ((pullDistance / PTR_MAX_PULL) * 360) + 'deg)'; if (pullDistance >= PTR_THRESHOLD) { ptrEl.classList.add('release-ready'); if (ptrText) ptrText.textContent = 'Release to refresh'; } else { ptrEl.classList.remove('release-ready'); if (ptrText) ptrText.textContent = 'Pull down to refresh'; } }, { passive: false });
    mainEl.addEventListener('touchend', function() { if (!isPulling || isRefreshing) return; isPulling = false; if (pullDistance >= PTR_THRESHOLD) triggerRefresh(); else resetPull(); }, { passive: true });
    mainEl.addEventListener('touchcancel', function() { if (isPulling) resetPull(); }, { passive: true });

    function resetPull() { isPulling = false; pullDistance = 0; ptrEl.classList.remove('pulling', 'release-ready'); ptrEl.style.height = '0px'; mainEl.classList.remove('ptr-active', 'ptr-pulling'); if (ptrSpinner) ptrSpinner.style.transform = ''; if (ptrText) ptrText.textContent = 'Pull down to refresh'; }

    async function triggerRefresh() {
      isRefreshing = true; ptrEl.classList.remove('pulling', 'release-ready'); ptrEl.classList.add('refreshing'); ptrEl.style.height = '64px'; mainEl.classList.remove('ptr-pulling'); if (ptrSpinner) ptrSpinner.style.transform = ''; if (ptrText) ptrText.textContent = 'Refreshing...'; if (ptrArrow) ptrArrow.style.display = 'none';
      await performRefresh();
      setTimeout(function() { isRefreshing = false; ptrEl.classList.remove('refreshing'); ptrEl.style.height = '0px'; mainEl.classList.remove('ptr-active'); if (ptrText) ptrText.textContent = 'Pull down to refresh'; if (ptrArrow) ptrArrow.style.display = ''; }, 500);
    }
  })();

  // Telegram & Customer Care
  window.openTelegramLink = function() { var link = runtimeLinksConfig.telegramLink; if (link) window.open(link, '_blank'); else showToast('Telegram link not available.', 'warning'); };
  window.openCustomerCareLink = function() { var link = runtimeLinksConfig.customerCareLink; if (link) window.open(link, '_blank'); else showToast('Customer care link not available.', 'warning'); };

  window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(function() { showToast('Copied! 📋', 'success'); }).catch(function() {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast('Copied! 📋', 'success');
    });
  };

  // ═══ FLOATING CUSTOMER CARE BUTTON ═══
  (function setupFloatingCustomerCare() {
    var btn = document.getElementById('floatingCustomerCare');
    if (!btn) return;
    var isDragging = false; var wasDragged = false; var startX = 0; var startY = 0; var btnStartX = 0; var btnStartY = 0; var DRAG_THRESHOLD = 8;

    function getPosition() { var rect = btn.getBoundingClientRect(); return { x: rect.left, y: rect.top }; }
    function constrainPosition(x, y) { var w = btn.offsetWidth; var h = btn.offsetHeight; return { x: Math.max(0, Math.min(x, window.innerWidth - w)), y: Math.max(0, Math.min(y, window.innerHeight - h)) }; }
    function snapToEdge(x) { var w = btn.offsetWidth; return (x + w / 2) < window.innerWidth / 2 ? 14 : window.innerWidth - w - 14; }
    function applyPosition(x, y, animate) { btn.style.transition = animate ? 'left 0.3s ease, top 0.3s ease' : 'none'; btn.style.position = 'fixed'; btn.style.left = x + 'px'; btn.style.top = y + 'px'; btn.style.right = 'auto'; btn.style.bottom = 'auto'; }

    btn.addEventListener('touchstart', function(e) { if (e.touches.length !== 1) return; isDragging = true; wasDragged = false; startX = e.touches[0].clientX; startY = e.touches[0].clientY; var pos = getPosition(); btnStartX = pos.x; btnStartY = pos.y; }, { passive: true });
    btn.addEventListener('touchmove', function(e) { if (!isDragging) return; var dx = e.touches[0].clientX - startX; var dy = e.touches[0].clientY - startY; if (!wasDragged && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) { wasDragged = true; btn.classList.add('dragging'); } if (wasDragged) { e.preventDefault(); var pos = constrainPosition(btnStartX + dx, btnStartY + dy); applyPosition(pos.x, pos.y, false); } }, { passive: false });
    btn.addEventListener('touchend', function() { if (!isDragging) return; isDragging = false; if (wasDragged) { var pos = getPosition(); var constrained = constrainPosition(snapToEdge(pos.x), pos.y); applyPosition(constrained.x, constrained.y, true); btn.classList.remove('dragging'); } else { openCustomerCareFromFloat(); } }, { passive: true });
    btn.addEventListener('mousedown', function(e) { isDragging = true; wasDragged = false; startX = e.clientX; startY = e.clientY; var pos = getPosition(); btnStartX = pos.x; btnStartY = pos.y; e.preventDefault(); });
    document.addEventListener('mousemove', function(e) { if (!isDragging) return; var dx = e.clientX - startX; var dy = e.clientY - startY; if (!wasDragged && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) { wasDragged = true; btn.classList.add('dragging'); } if (wasDragged) { var pos = constrainPosition(btnStartX + dx, btnStartY + dy); applyPosition(pos.x, pos.y, false); } });
    document.addEventListener('mouseup', function() { if (!isDragging) return; isDragging = false; if (wasDragged) { var pos = getPosition(); var constrained = constrainPosition(snapToEdge(pos.x), pos.y); applyPosition(constrained.x, constrained.y, true); btn.classList.remove('dragging'); } else { openCustomerCareFromFloat(); } });

    function openCustomerCareFromFloat() { var link = runtimeLinksConfig.customerCareLink; if (link) window.open(link, '_blank'); else showToast('Customer care link not available.', 'warning'); }
    function updateVisibility() { btn.style.display = runtimeLinksConfig.customerCareLink ? 'flex' : 'none'; }
    updateVisibility();
    setTimeout(updateVisibility, 3000);
    setInterval(updateVisibility, 10000);
  })();

  // ═══ BUTTON GUARD ═══
  (function setupButtonGuard() {
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      if (btn.classList.contains('modal-close') || btn.classList.contains('eye-btn') || btn.classList.contains('copy-btn') || btn.classList.contains('tab-btn') || btn.classList.contains('txn-filter') || btn.classList.contains('nav-item') || btn.classList.contains('bt-tab') || btn.classList.contains('deposit-method-tab') || btn.classList.contains('icon-btn') || btn.classList.contains('see-all-btn') || btn.classList.contains('remove-file-btn')) return;
      var onclick = btn.getAttribute('onclick') || '';
      if (!onclick) return;
      if (onclick.indexOf('switch') !== -1 || onclick.indexOf('filter') !== -1 || onclick.indexOf('toggle') !== -1 || onclick.indexOf('setDepositAmount') !== -1 || onclick.indexOf('setWithdrawAmount') !== -1 || onclick.indexOf('openModal') !== -1 || onclick.indexOf('closeModal') !== -1 || onclick.indexOf('copyReferral') !== -1 || onclick.indexOf('copyDepositUpi') !== -1 || onclick.indexOf('copyToClipboard') !== -1) return;
      if (btn._lastClickTime && (Date.now() - btn._lastClickTime) < 800) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      btn._lastClickTime = Date.now();
    }, true);
  })();

  console.log("WEALTH v5.0 initialized (" + backendMode + " mode) — Premium Edition · All bugs fixed");
})();
