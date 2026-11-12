/**
 * ZENITH AUTH - Production Single Page Application Engine
 * Next-Generation Authentication, License Management & Security SaaS Console
 */

const ZenithApp = {
  user: null,
  activeAppId: 1,
  apps: [],
  currentRoute: 'dashboard',
  currentSdkLang: 'csharp',
  billingCycle: 'monthly',
  sseConnection: null,
  activeChatChannel: 1,

  // Initialize Application
  async init() {
    this.bindGlobalShortcuts();
    await this.checkAuth();
  },

  // Check Session Status & Router Handling
  async checkAuth() {
    const hash = (window.location.hash || '').replace('#', '').trim();
    if (hash === 'landing' || hash === 'features' || hash === 'pricing') {
      this.renderLandingPage();
      return;
    }

    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        this.user = data.user;
        this.activeAppId = this.user.app_id || 1;
        await this.loadApplications();
        this.renderAuthenticatedLayout();
        const validRoutes = [
          'dashboard', 'applications', 'users', 'licenses', 'hwid', 'sessions', 
          'variables', 'files', 'webhooks', 'integrations', 'team', 'resellers', 
          'logs', 'analytics', 'subscription', 'settings', 'profile'
        ];
        const targetRoute = validRoutes.includes(hash) ? hash : 'dashboard';
        this.navigate(targetRoute);
      } else {
        if (hash === 'signup' || hash === 'register') {
          this.renderAuthSplitPage('register');
        } else {
          this.renderAuthSplitPage('login');
        }
      }
    } catch {
      this.renderAuthSplitPage('login');
    }
  },

  // Global Keyboard Shortcuts (Ctrl + K)
  bindGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openGlobalSearch();
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    window.addEventListener('hashchange', () => {
      const hash = (window.location.hash || '').replace('#', '').trim();
      if (hash === 'landing') {
        this.renderLandingPage();
      } else if (hash === 'login') {
        if (!this.user) this.renderAuthSplitPage('login');
        else this.navigate('dashboard');
      } else if (hash === 'signup' || hash === 'register') {
        if (!this.user) this.renderAuthSplitPage('register');
        else this.navigate('dashboard');
      } else if (this.user && hash) {
        this.navigate(hash);
      }
    });
  },

  // Fetch list of available applications
  async loadApplications() {
    try {
      const res = await fetch('/api/apps');
      if (res.ok) {
        this.apps = await res.json();
      }
    } catch (err) {
      console.error('Failed to load apps:', err);
    }
  },

  // Switch Active Application Context
  async setActiveApplication(appId) {
    try {
      const res = await fetch('/api/apps/' + appId + '/set-active', { method: 'POST' });
      if (res.ok) {
        this.activeAppId = parseInt(appId, 10);
        if (this.user) this.user.app_id = this.activeAppId;
        const app = this.apps.find(a => a.id === this.activeAppId);
        this.showToast('Switched active app to: ' + (app ? app.name : 'App #' + appId), 'success');
        this.renderAuthenticatedLayout();
        this.navigate(this.currentRoute);
      }
    } catch (err) {
      this.showToast('Failed to switch application context', 'danger');
    }
  },

  // Toast Notification System
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'zenith-toast toast-' + type;
    
    let iconSvg = ZenithIcons.info || ZenithIcons.shield;
    if (type === 'success') iconSvg = ZenithIcons.check;
    if (type === 'danger') iconSvg = ZenithIcons.close;
    if (type === 'warning') iconSvg = ZenithIcons.shield;

    toast.innerHTML = 
      '<div class="toast-icon" style="color: ' + (type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#6366f1') + '">' + iconSvg + '</div>' +
      '<div class="toast-message">' + message + '</div>';

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Copy Value Helper
  copyToClipboard(text, label = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(label, 'success');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast(label, 'success');
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /* ====================================================================
     1. LANDING PAGE RENDERER (REFERENCE IMAGE 1)
     ==================================================================== */
  renderLandingPage() {
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = `
      <div class="landing-page-wrap">
        <!-- Top Navigation Bar -->
        <header class="landing-nav">
          <a href="#landing" class="landing-nav-logo">
            <span style="color:#6366f1;">${ZenithIcons.shield}</span>
            <span>ZENITH AUTH</span>
          </a>
          <nav class="landing-nav-links">
            <a href="#landing" class="landing-nav-link" style="color:#fff;">Home</a>
            <a href="#landing" class="landing-nav-link">Features</a>
            <a href="#landing" class="landing-nav-link">Pricing</a>
            <a href="#landing" class="landing-nav-link">Plans</a>
            <a href="#landing" class="landing-nav-link">Contact</a>
          </nav>
          <div class="landing-nav-actions">
            <a href="#login" class="landing-btn-login">
              <span>Login</span>
              <span>→</span>
            </a>
            <a href="#signup" class="landing-btn-signup">Sign Up</a>
          </div>
        </header>

        <!-- Hero Section -->
        <section class="landing-hero">
          <h1 class="landing-hero-title">Simplify Your Authentication</h1>
          <p class="landing-hero-subtitle">
            Secure your applications with cloud-native subscriptions, flexible access controls and a beautiful developer-friendly API.
          </p>
          <div class="landing-hero-actions">
            <a href="#signup" class="btn-landing-primary">Get Started</a>
            <a href="#login" class="btn-landing-secondary">Documentation</a>
          </div>
        </section>

        <!-- Perspective Dashboard Mockup Preview -->
        <div class="landing-preview-container">
          <div class="landing-preview-card">
            <!-- Simulated Top Bar -->
            <div style="background:#131317; border-bottom:1px solid #232328; padding:12px 20px; display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:10px; font-size:12px; color:#929292;">
                <span>${ZenithIcons.shield}</span>
                <span style="color:#fff; font-weight:600;">Zenith Auth Console</span>
                <span>/</span>
                <span>Production Security Node</span>
              </div>
              <div style="display:flex; gap:6px;">
                <span style="width:10px; height:10px; border-radius:50%; background:#ef4444; opacity:0.8;"></span>
                <span style="width:10px; height:10px; border-radius:50%; background:#f59e0b; opacity:0.8;"></span>
                <span style="width:10px; height:10px; border-radius:50%; background:#10b981; opacity:0.8;"></span>
              </div>
            </div>
            <!-- Mock Content -->
            <div style="padding:24px; background:#0e0f13;">
              <div style="background:linear-gradient(135deg, #0e1224 0%, #171d3a 100%); border:1px solid #1f274a; border-radius:10px; padding:20px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h3 style="color:#fff; font-size:18px; font-weight:700;">Welcome back, Operator!</h3>
                  <p style="color:#818cf8; font-size:12.5px; margin-top:2px;">Role: Seller [PRO] • Cloud Cluster Status: 100% Operational</p>
                </div>
                <span style="background:#22c55e22; border:1px solid #22c55e55; color:#4ade80; padding:6px 14px; border-radius:9999px; font-size:12px; font-weight:600;">ACTIVE</span>
              </div>
              <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:12px;">
                <div style="background:#141418; border:1px solid #23232a; border-radius:8px; padding:14px;">
                  <div style="font-size:11px; color:#6b7280; font-weight:700;">APPLICATIONS</div>
                  <div style="font-size:22px; color:#fff; font-weight:800; margin-top:4px;">13 Active</div>
                </div>
                <div style="background:#141418; border:1px solid #23232a; border-radius:8px; padding:14px;">
                  <div style="font-size:11px; color:#6b7280; font-weight:700;">CURRENT PLAN</div>
                  <div style="font-size:22px; color:#a5b4fc; font-weight:800; margin-top:4px;">Seller</div>
                </div>
                <div style="background:#141418; border:1px solid #23232a; border-radius:8px; padding:14px;">
                  <div style="font-size:11px; color:#6b7280; font-weight:700;">SUBSCRIPTION</div>
                  <div style="font-size:22px; color:#fff; font-weight:800; margin-top:4px;">365 Days</div>
                </div>
                <div style="background:#141418; border:1px solid #23232a; border-radius:8px; padding:14px;">
                  <div style="font-size:11px; color:#6b7280; font-weight:700;">APP INSIGHTS</div>
                  <div style="font-size:22px; color:#10b981; font-weight:800; margin-top:4px;">2,840 Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /* ====================================================================
     2. SPLIT-SCREEN AUTHENTICATION PAGE (REFERENCE IMAGE 2)
     ==================================================================== */
  renderAuthSplitPage(mode = 'login') {
    const isRegister = mode === 'register';
    const appRoot = document.getElementById('app-root');

    appRoot.innerHTML = `
      <div class="auth-split-wrapper">
        <!-- Left Hero Showcase Column -->
        <div class="auth-split-left">
          <div class="auth-brand-masthead">
            <span style="color:#6366f1;">${ZenithIcons.shield}</span>
            <span>ZENITH AUTH</span>
          </div>

          <div class="auth-pitch">
            <h1 class="auth-pitch-title">Join the future of authentication</h1>
            <p class="auth-pitch-desc">
              Create an account today and start building secure applications in minutes.
            </p>
          </div>

          <div style="font-size:12.5px; color:#6b7280;">
            © 2026 Zenith Auth Inc. All rights reserved.
          </div>
        </div>

        <!-- Right White/Clean Card Column -->
        <div class="auth-split-right">
          <div class="auth-clean-card">
            <h2 class="auth-card-title">${isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p class="auth-card-subtitle">${isRegister ? 'Sign up to get started' : 'Sign in to access your dashboard'}</p>

            <form id="auth-split-form">
              ${isRegister ? `
                <div style="margin-bottom:14px;">
                  <label style="display:block; font-size:12.5px; font-weight:600; color:#374151; margin-bottom:6px;">Username</label>
                  <input type="text" id="auth-username" class="auth-input-light" placeholder="e.g. quantum_coder" required />
                </div>
              ` : ''}

              <div style="margin-bottom:14px;">
                <label style="display:block; font-size:12.5px; font-weight:600; color:#374151; margin-bottom:6px;">Email Address or Username</label>
                <input type="text" id="auth-identity" class="auth-input-light" placeholder="you@example.com" required />
              </div>

              <div style="margin-bottom:14px;">
                <label style="display:block; font-size:12.5px; font-weight:600; color:#374151; margin-bottom:6px;">Password</label>
                <input type="password" id="auth-password" class="auth-input-light" placeholder="••••••••••••" required />
              </div>

              <!-- Cloudflare Verification Mockup -->
              <div class="auth-cf-turnstile">
                <div class="cf-left">
                  <div class="cf-spinner"></div>
                  <span>Verifying human browser...</span>
                </div>
                <div style="display:flex; align-items:center; gap:6px; font-size:10.5px; color:#6b7280;">
                  <span style="font-weight:700; color:#f97316;">CLOUDFLARE</span>
                  <span>Privacy • Help</span>
                </div>
              </div>

              <button type="submit" id="auth-submit-btn" class="btn-auth-submit">
                ${isRegister ? 'Create Account & Continue' : 'Send Verification Code'}
              </button>
            </form>

            <div class="auth-divider-light">OR CONTINUE WITH</div>

            <button type="button" class="btn-social-google" onclick="ZenithApp.showToast('Google OAuth simulated successfully', 'info')">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24Z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15Z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"/></svg>
              <span>Continue with Google</span>
              <span style="position:absolute; right:12px; background:#eff6ff; color:#3b82f6; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px;">LAST USED</span>
            </button>

            <div class="social-icons-row">
              <button class="btn-social-mini" title="Discord" onclick="ZenithApp.showToast('Discord Auth available', 'info')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </button>
              <button class="btn-social-mini" title="GitHub" onclick="ZenithApp.showToast('GitHub Auth available', 'info')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/></svg>
              </button>
              <button class="btn-social-mini" title="Telegram" onclick="ZenithApp.showToast('Telegram Auth available', 'info')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0Zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.128.832.942Z"/></svg>
              </button>
            </div>

            <div style="margin-top:24px; text-align:center; font-size:13px; color:#4b5563;">
              ${isRegister ? `
                Already have an account? <a href="#login" style="color:#5046e5; font-weight:600; text-decoration:none;">Sign in</a>
              ` : `
                Don't have an account? <a href="#signup" style="color:#5046e5; font-weight:600; text-decoration:none;">Create account</a>
              `}
            </div>

            <div style="margin-top:14px; text-align:center;">
              <a href="#landing" style="font-size:12px; color:#9ca3af; text-decoration:none;">← Back to Overview</a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Form Event
    document.getElementById('auth-split-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('auth-submit-btn');
      btn.disabled = true;
      btn.innerText = 'Processing...';

      if (isRegister) {
        const username = document.getElementById('auth-username').value.trim();
        const email = document.getElementById('auth-identity').value.trim();
        const password = document.getElementById('auth-password').value;

        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            this.user = data.user;
            this.activeAppId = this.user.app_id || 1;
            this.showToast('Account registered successfully! Welcome to Zenith Auth.', 'success');
            await this.loadApplications();
            this.renderAuthenticatedLayout();
            this.navigate('dashboard');
          } else {
            this.showToast(data.error || 'Registration failed', 'danger');
            btn.disabled = false;
            btn.innerText = 'Create Account & Continue';
          }
        } catch {
          this.showToast('Network error during registration', 'danger');
          btn.disabled = false;
          btn.innerText = 'Create Account & Continue';
        }
      } else {
        const identity = document.getElementById('auth-identity').value.trim();
        const password = document.getElementById('auth-password').value;

        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity, password })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            this.user = data.user;
            this.activeAppId = this.user.app_id || 1;
            this.showToast('Welcome back, ' + this.user.username + '!', 'success');
            await this.loadApplications();
            this.renderAuthenticatedLayout();
            this.navigate('dashboard');
          } else {
            this.showToast(data.error || 'Invalid credentials', 'danger');
            btn.disabled = false;
            btn.innerText = 'Send Verification Code';
          }
        } catch {
          this.showToast('Network error during login', 'danger');
          btn.disabled = false;
          btn.innerText = 'Send Verification Code';
        }
      }
    });
  },

  /* ====================================================================
     3. AUTHENTICATED WORKSPACE LAYOUT (16 DISTINCT PAGES IN SIDEBAR)
     ==================================================================== */
  renderAuthenticatedLayout() {
    const appRoot = document.getElementById('app-root');
    const activeApp = this.apps.find(a => a.id === this.activeAppId) || { name: 'Zenith Core Engine', version: '1.0' };
    const userRole = this.user ? this.user.role : 'Administrator';
    const userPlan = this.user ? (this.user.account_plan || 'TESTER') : 'TESTER';

    appRoot.innerHTML = `
      <div id="app-layout">
        <!-- Collapsible Dark Sidebar -->
        <aside id="sidebar">
          <div class="sidebar-header">
            <a href="#dashboard" class="brand-wrapper">
              <div class="brand-logo-icon">
                ${ZenithIcons.shield}
              </div>
              <div class="brand-title">
                ZENITH AUTH
                <span class="brand-badge">${userPlan}</span>
              </div>
            </a>
            <button class="sidebar-toggle-btn" id="sidebar-toggle" title="Toggle Sidebar">
              ${ZenithIcons.menu}
            </button>
          </div>

          <div class="sidebar-nav">
            <div class="nav-section-title">Main</div>
            <a class="nav-item ${this.currentRoute === 'dashboard' ? 'active' : ''}" href="#dashboard">
              ${ZenithIcons.dashboard}
              <span class="nav-text">Dashboard</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'applications' ? 'active' : ''}" href="#applications">
              ${ZenithIcons.apps}
              <span class="nav-text">Applications</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'users' ? 'active' : ''}" href="#users">
              ${ZenithIcons.users}
              <span class="nav-text">Users</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'licenses' ? 'active' : ''}" href="#licenses">
              ${ZenithIcons.licenses}
              <span class="nav-text">Licenses</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'hwid' ? 'active' : ''}" href="#hwid">
              ${ZenithIcons.security}
              <span class="nav-text">HWID Management</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'sessions' ? 'active' : ''}" href="#sessions">
              ${ZenithIcons.sessions}
              <span class="nav-text">Sessions</span>
            </a>

            <div class="nav-section-title">Configuration</div>
            <a class="nav-item ${this.currentRoute === 'variables' ? 'active' : ''}" href="#variables">
              ${ZenithIcons.globalVars}
              <span class="nav-text">Variables</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'files' ? 'active' : ''}" href="#files">
              ${ZenithIcons.files}
              <span class="nav-text">File Management</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'webhooks' ? 'active' : ''}" href="#webhooks">
              ${ZenithIcons.loader}
              <span class="nav-text">Webhooks</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'integrations' ? 'active' : ''}" href="#integrations">
              ${ZenithIcons.chat}
              <span class="nav-text">Integrations</span>
            </a>

            <div class="nav-section-title">Commerce & Team</div>
            <a class="nav-item ${this.currentRoute === 'team' ? 'active' : ''}" href="#team">
              ${ZenithIcons.team}
              <span class="nav-text">Team Management</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'resellers' ? 'active' : ''}" href="#resellers">
              ${ZenithIcons.sellerKey}
              <span class="nav-text">Resellers</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'logs' ? 'active' : ''}" href="#logs">
              ${ZenithIcons.sellerLogs}
              <span class="nav-text">Logs</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'analytics' ? 'active' : ''}" href="#analytics">
              ${ZenithIcons.dashboard}
              <span class="nav-text">Analytics</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'subscription' ? 'active' : ''}" href="#subscription">
              ${ZenithIcons.plans}
              <span class="nav-text">Subscription</span>
            </a>
            <a class="nav-item ${this.currentRoute === 'settings' ? 'active' : ''}" href="#settings">
              ${ZenithIcons.profile}
              <span class="nav-text">Account Settings</span>
            </a>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div id="main-wrapper">
          <!-- Top Header -->
          <header id="top-header">
            <div class="header-left">
              <div class="breadcrumb-nav">
                <span style="color:#929292;">Zenith Auth</span>
                <span class="breadcrumb-separator">/</span>
                <span style="color:#6366f1; font-weight:600;">${activeApp.name}</span>
                <span class="breadcrumb-separator">/</span>
                <span class="breadcrumb-current" id="header-breadcrumb">${this.currentRoute.toUpperCase()}</span>
              </div>

              <!-- Application Selector Dropdown -->
              <div class="app-selector-box">
                ${ZenithIcons.apps}
                <select class="app-selector-select" id="global-app-selector">
                  ${this.apps.map(a => `<option value="${a.id}" ${a.id === this.activeAppId ? 'selected' : ''}>${a.name} (v${a.version})</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="header-right">
              <!-- Global Search Button (Ctrl + K) -->
              <button class="global-search-btn" onclick="ZenithApp.openGlobalSearch()">
                ${ZenithIcons.search}
                <span>Search projects...</span>
                <span class="kbd-shortcut">Ctrl K</span>
              </button>

              <!-- Notifications Bell -->
              <button class="header-action-btn" onclick="ZenithApp.openNotificationsModal()" title="Notifications">
                ${ZenithIcons.bell}
                <span class="header-badge-dot"></span>
              </button>

              <!-- User Profile Pill -->
              <div class="user-profile-btn" onclick="ZenithApp.navigate('settings')">
                <div class="user-avatar-circle">
                  ${(this.user.username || 'U')[0].toUpperCase()}
                </div>
                <div class="user-meta">
                  <span class="user-name-text">${this.user.username}</span>
                  <span class="user-role-badge">${userPlan}</span>
                </div>
              </div>

              <!-- Logout Button -->
              <button class="header-action-btn" onclick="ZenithApp.logout()" title="Sign Out">
                ${ZenithIcons.logout}
              </button>
            </div>
          </header>

          <!-- Dynamic Workspace Page Container -->
          <main id="content-container">
            <!-- Injected by router -->
          </main>
        </div>
      </div>
    `;

    // Sidebar Collapse
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
      document.getElementById('main-wrapper').classList.toggle('expanded');
    });

    // App Switcher
    document.getElementById('global-app-selector').addEventListener('change', (e) => {
      this.setActiveApplication(e.target.value);
    });
  },

  // Router Dispatcher
  async navigate(route) {
    if (!this.user) return this.renderAuthSplitPage('login');
    this.currentRoute = route || 'dashboard';

    // Update active nav class
    document.querySelectorAll('.nav-item').forEach(el => {
      const href = el.getAttribute('href');
      if (href === '#' + this.currentRoute) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update breadcrumb
    const bc = document.getElementById('header-breadcrumb');
    if (bc) {
      const titles = {
        dashboard: 'Dashboard Overview',
        applications: 'Applications',
        users: 'Users Manager',
        licenses: 'License Manager',
        hwid: 'HWID Management',
        sessions: 'Active Sessions',
        variables: 'Variables',
        files: 'File Management',
        webhooks: 'Webhooks',
        integrations: 'Bot Integrations',
        team: 'Team Management',
        resellers: 'Reseller Network',
        logs: 'Logs Console',
        analytics: 'Analytics & Insights',
        subscription: 'Subscription & Plans',
        settings: 'Account Settings',
        profile: 'Account Settings'
      };
      bc.innerText = titles[this.currentRoute] || this.currentRoute.toUpperCase();
    }

    const container = document.getElementById('content-container');
    if (!container) return;

    switch (this.currentRoute) {
      case 'dashboard':
        await this.renderDashboard(container);
        break;
      case 'applications':
        await this.renderApplications(container);
        break;
      case 'users':
        await this.renderUsers(container);
        break;
      case 'licenses':
        await this.renderLicenses(container);
        break;
      case 'hwid':
        await this.renderHwidManagement(container);
        break;
      case 'sessions':
        await this.renderSessions(container);
        break;
      case 'variables':
        await this.renderVariables(container);
        break;
      case 'files':
        await this.renderFiles(container);
        break;
      case 'webhooks':
        await this.renderWebhooks(container);
        break;
      case 'integrations':
        await this.renderIntegrations(container);
        break;
      case 'team':
        await this.renderTeam(container);
        break;
      case 'resellers':
        await this.renderResellers(container);
        break;
      case 'logs':
        await this.renderLogs(container);
        break;
      case 'analytics':
        await this.renderAnalytics(container);
        break;
      case 'subscription':
        await this.renderSubscription(container);
        break;
      case 'settings':
      case 'profile':
        await this.renderSettings(container);
        break;
      default:
        await this.renderDashboard(container);
    }
  },

  /* ====================================================================
     4. PAGE 1: DASHBOARD OVERVIEW (REFERENCE IMAGE 4)
     ==================================================================== */
  async renderDashboard(container) {
    const statsRes = await fetch('/api/dashboard/stats?app_id=' + this.activeAppId);
    const stats = statsRes.ok ? await statsRes.json() : {};

    const licRes = await fetch('/api/dashboard/recent-licenses?app_id=' + this.activeAppId);
    const recentLicenses = licRes.ok ? await licRes.json() : [];

    const userRes = await fetch('/api/dashboard/recent-users?app_id=' + this.activeAppId);
    const recentUsers = userRes.ok ? await userRes.json() : [];

    const activeApp = this.apps.find(a => a.id === this.activeAppId) || { name: 'ZS COVER SILENT', version: '1.0' };
    const remainingDays = stats.subscription ? stats.subscription.remainingDays : 365;
    const userPlan = this.user ? (this.user.account_plan || 'TESTER') : 'TESTER';

    container.innerHTML = `
      <!-- Top Promo Offer Banner (Image 4) -->
      <div class="promo-banner">
        <div class="promo-left">
          <span style="color:#a855f7;">✨</span>
          <div>
            <div class="promo-title">Developer Welcome Offer — Developer Plan 50% OFF</div>
            <div class="promo-sub">$2.49/month instead of $4.99/month • Offer valid until Dec 2026</div>
          </div>
        </div>
        <button class="promo-claim-btn" onclick="ZenithApp.openUpgradeModal('DEVELOPER')">
          Claim Developer Offer →
        </button>
      </div>

      <!-- Welcome Banner (Image 4) -->
      <div class="welcome-banner-ref">
        <div class="welcome-info-wrap">
          <div class="welcome-wave-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 11v2"/></svg>
          </div>
          <div>
            <h2 class="welcome-heading">Welcome back, ${this.user.username}!</h2>
            <div class="welcome-subinfo">
              <span>Role: <strong class="role-tag">${this.user.role.toLowerCase()}</strong></span>
              <span> • </span>
              <span>Expiry: <strong>${remainingDays} Days Remaining</strong></span>
            </div>
          </div>
        </div>
        <button class="btn-edit-profile" onclick="ZenithApp.navigate('settings')">
          ${ZenithIcons.edit} Edit Profile
        </button>
      </div>

      <!-- Four Wireframe Stat Cards (Image 4) -->
      <div class="wireframe-stats-row">
        <!-- 1. Applications -->
        <div class="wireframe-stat-card">
          <div class="stat-label-upper">APPLICATIONS</div>
          <div class="stat-metric-val">${stats.applications ? stats.applications.total : this.apps.length}</div>
          <div class="stat-metric-sub">Active Projects</div>
          <div class="stat-vector-art">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
          </div>
        </div>

        <!-- 2. Current Plan -->
        <div class="wireframe-stat-card">
          <div class="stat-label-upper">CURRENT PLAN</div>
          <div class="stat-metric-val" style="color:#a5b4fc; font-size:24px;">${userPlan}</div>
          <div class="stat-metric-sub">Subscription: ${userPlan === 'TESTER' ? 'Free' : 'Paid'}</div>
          <div class="stat-vector-art">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="1.2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </div>
        </div>

        <!-- 3. Subscription -->
        <div class="wireframe-stat-card">
          <div class="stat-label-upper">SUBSCRIPTION</div>
          <div class="stat-metric-val" style="font-size:24px;">${userPlan === 'TESTER' ? 'Free Forever' : remainingDays + ' Days Left'}</div>
          <div class="stat-metric-sub">
            <a href="javascript:void(0)" onclick="ZenithApp.navigate('subscription')" style="color:#6366f1; text-decoration:none;">Status Check →</a>
          </div>
          <div class="stat-vector-art">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
        </div>

        <!-- 4. App Insights -->
        <div class="wireframe-stat-card">
          <div class="stat-label-upper">APP INSIGHTS</div>
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:6px;">
            <span style="color:#929292; font-size:13px;">Users</span>
            <span style="font-size:20px; font-weight:800; color:#fff;">${stats.insights ? stats.insights.totalUsers : 0}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px;">
            <span style="color:#929292; font-size:13px;">Licenses</span>
            <span style="font-size:20px; font-weight:800; color:#a5b4fc;">${stats.insights ? stats.insights.totalLicenses : 0}</span>
          </div>
          <div class="stat-vector-art">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.2"><circle cx="12" cy="12" r="8"/><path d="m10 15 5-3-5-3v6Z"/></svg>
          </div>
        </div>
      </div>

      <!-- Integration Code Constructor (Image 4) -->
      <div class="constructor-card">
        <div class="constructor-header">
          <div class="constructor-title">
            <span style="color:#6366f1;">&lt;/&gt;</span>
            <span>Integration: <strong>${activeApp.name}</strong></span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="ZenithApp.openRevealSecretModal(${activeApp.id})">
            ${ZenithIcons.eye} Reveal App Secret
          </button>
        </div>

        <!-- Language Scroller Tabs -->
        <div class="constructor-lang-bar" id="lang-bar-scroller">
          ${['C#', 'C++', 'Java', 'Python', 'PHP', 'VB.Net', 'JavaScript', 'TypeScript', 'Rust', 'Go', 'Ruby', 'Perl', 'Lua'].map((lang, idx) => `
            <button class="lang-tab ${lang.toLowerCase() === this.currentSdkLang.toLowerCase() ? 'active' : ''}" onclick="ZenithApp.selectDashboardSdkLang('${lang}')">
              ${lang}
            </button>
          `).join('')}
        </div>

        <!-- Code Block -->
        <pre class="constructor-code-area" id="constructor-code-view"><code>${this.escapeHtml(ZenithSDKSnippets.getConstructor(this.currentSdkLang, activeApp.name, this.user.owner_id || 'PC1B6P1TTA', '••••••••••••••••••••••••••••••••', activeApp.version || '1.0'))}</code></pre>

        <!-- Actions Row -->
        <div class="constructor-actions-row">
          <button class="btn-constructor-action" onclick="ZenithApp.copyConstructorCredentials()">
            ${ZenithIcons.copy} Copy Credentials
          </button>
          <button class="btn-constructor-action" onclick="ZenithApp.copyCurrentSdkCode()">
            ${ZenithIcons.loader} View Examples
          </button>
          <button class="btn-constructor-action" onclick="ZenithApp.showToast('Documentation tutorial loaded in background', 'info')">
            ${ZenithIcons.chat} Watch Tutorial
          </button>
        </div>
      </div>

      <!-- Quick Tables Row -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap:18px;">
        <!-- Recent Licenses -->
        <div class="zenith-card">
          <div class="card-header">
            <div>
              <div class="card-title">${ZenithIcons.licenses} Recent Licenses</div>
              <div class="card-desc">Cryptographic keys ready for client activation</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ZenithApp.navigate('licenses')">View All</button>
          </div>
          <div class="table-responsive">
            <table class="zenith-table">
              <thead>
                <tr>
                  <th>License Key</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${recentLicenses.length > 0 ? recentLicenses.map(l => `
                  <tr>
                    <td><code class="font-mono" style="color:#a5b4fc;">${l.license_key}</code></td>
                    <td><span class="badge badge-${l.status === 'active' ? 'success' : l.status === 'unused' ? 'info' : 'danger'}">${l.status}</span></td>
                    <td>${l.duration_days} days</td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="ZenithApp.copyToClipboard('${l.license_key}')">
                        ${ZenithIcons.copy}
                      </button>
                    </td>
                  </tr>
                `).join('') : `<tr><td colspan="4" style="text-align:center; color:#666;">No recent licenses found</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Users -->
        <div class="zenith-card">
          <div class="card-header">
            <div>
              <div class="card-title">${ZenithIcons.users} Recent User Registrations</div>
              <div class="card-desc">Latest clients enrolled in this application</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ZenithApp.navigate('users')">View All</button>
          </div>
          <div class="table-responsive">
            <table class="zenith-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>HWID Locked</th>
                </tr>
              </thead>
              <tbody>
                ${recentUsers.length > 0 ? recentUsers.map(u => `
                  <tr>
                    <td><strong>${u.username}</strong><br><small style="color:#6b7280;">${u.email}</small></td>
                    <td><span class="badge badge-info">${u.role}</span></td>
                    <td><span class="badge badge-${u.status === 'active' ? 'success' : 'danger'}">${u.status}</span></td>
                    <td style="color:#10b981; font-weight:600;">${u.hwid ? 'Bound' : 'Pending'}</td>
                  </tr>
                `).join('') : `<tr><td colspan="4" style="text-align:center; color:#666;">No users registered yet</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  selectDashboardSdkLang(lang) {
    this.currentSdkLang = lang;
    const activeApp = this.apps.find(a => a.id === this.activeAppId) || { name: 'ZS COVER SILENT', version: '1.0' };
    const code = ZenithSDKSnippets.getConstructor(lang, activeApp.name, this.user.owner_id || 'PC1B6P1TTA', '••••••••••••••••••••••••••••••••', activeApp.version || '1.0');
    
    document.querySelectorAll('.lang-tab').forEach(b => {
      b.classList.toggle('active', b.innerText.trim().toLowerCase() === lang.toLowerCase());
    });

    const codeEl = document.getElementById('constructor-code-view');
    if (codeEl) {
      codeEl.innerHTML = '<code>' + this.escapeHtml(code) + '</code>';
    }
  },

  copyConstructorCredentials() {
    const activeApp = this.apps.find(a => a.id === this.activeAppId) || { name: 'ZS COVER SILENT', version: '1.0' };
    const text = `App Name: ${activeApp.name}\nOwner ID: ${this.user.owner_id}\nPublic Key: ${activeApp.public_key}`;
    this.copyToClipboard(text, 'Copied App Credentials to clipboard!');
  },

  copyCurrentSdkCode() {
    const activeApp = this.apps.find(a => a.id === this.activeAppId) || { name: 'ZS COVER SILENT', version: '1.0' };
    const snippet = ZenithSDKSnippets[this.currentSdkLang.toLowerCase()] || ZenithSDKSnippets.csharp;
    this.copyToClipboard(snippet.code, 'Copied full SDK implementation code!');
  },

  /* ====================================================================
     5. PAGE 2: APPLICATIONS (REFERENCE IMAGE 3)
     ==================================================================== */
  async renderApplications(container) {
    const res = await fetch('/api/apps');
    const apps = res.ok ? await res.json() : [];
    this.apps = apps;

    container.innerHTML = `
      <!-- Applications Header Row (Image 3) -->
      <div class="apps-header-row">
        <div class="apps-title-block">
          <h1>Applications</h1>
          <p>Manage your integrated software and keys. <a href="javascript:void(0)" onclick="ZenithApp.showToast('Documentation reference loaded', 'info')" style="color:#6366f1; text-decoration:none;">Learn More</a></p>
        </div>
        <div class="apps-count-badge">${apps.length} Applications</div>
      </div>

      <!-- Toolbar Row (Image 3) -->
      <div class="apps-toolbar-row">
        <div class="apps-search-wrap">
          <span class="apps-search-icon">${ZenithIcons.search}</span>
          <input type="text" id="apps-search-box" class="apps-search-input" placeholder="Search Projects..." />
        </div>

        <button class="apps-btn-tool" onclick="ZenithApp.showToast('Filtered by Newest', 'info')">
          <span>≡ Newest</span>
        </button>

        <div style="display:flex; gap:2px;">
          <button class="apps-btn-tool" style="padding:9px 10px;" title="Grid View">${ZenithIcons.apps}</button>
          <button class="apps-btn-tool" style="padding:9px 10px;" title="List View">${ZenithIcons.dashboard}</button>
        </div>

        <button class="apps-btn-tool" onclick="ZenithApp.sortAppsAlphabetical()">
          <span>⇅ A → Z</span>
        </button>

        <button class="apps-btn-create" onclick="ZenithApp.openCreateAppModal()">
          <span>+ Application</span>
        </button>
      </div>

      <!-- Info Alert Banner (Image 3) -->
      <div class="apps-info-banner" id="apps-alert-banner">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:#6366f1;">ℹ️</span>
          <span>Click a card to set as Active. Click ⚙️ for Settings.</span>
        </div>
        <button style="background:none; border:none; color:#6b7280; cursor:pointer;" onclick="document.getElementById('apps-alert-banner').remove()">×</button>
      </div>

      <!-- Applications Grid (Image 3) -->
      <div class="apps-ref-grid" id="apps-cards-grid">
        ${apps.map(app => `
          <div class="app-ref-card ${app.id === this.activeAppId ? 'active-app-card' : ''}" onclick="if(!event.target.closest('.app-card-actions')) ZenithApp.setActiveApplication(${app.id})">
            <div>
              <div class="app-card-title-row">
                <span class="app-card-name">${app.name}</span>
                <span style="color:#6b7280; font-size:16px;">›</span>
              </div>
              <div class="app-card-ver">Version: ${app.version}</div>
            </div>

            <div class="app-card-bottom-row">
              <span class="app-card-date">Created ${app.created_at ? app.created_at.split(' ')[0] : 'Sep 20, 2026'}</span>
              <div class="app-card-actions">
                <button class="app-card-icon-btn" title="Application Settings" onclick="event.stopPropagation(); ZenithApp.openAppSettingsModal(${app.id})">
                  ${ZenithIcons.settings}
                </button>
                <button class="app-card-icon-btn" title="Actions Menu" onclick="event.stopPropagation(); ZenithApp.openAppActionsMenu(${app.id})">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Search filter
    document.getElementById('apps-search-box').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.app-ref-card').forEach(card => {
        const name = card.querySelector('.app-card-name').innerText.toLowerCase();
        card.style.display = name.includes(q) ? 'flex' : 'none';
      });
    });
  },

  sortAppsAlphabetical() {
    this.apps.sort((a, b) => a.name.localeCompare(b.name));
    this.renderApplications(document.getElementById('content-container'));
  },

  openAppActionsMenu(appId) {
    const app = this.apps.find(a => a.id === appId);
    if (!app) return;

    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:440px;">
          <div class="modal-header">
            <h3 style="font-size:16px; font-weight:700;">${app.name} — Actions</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:8px;">
            <button class="btn btn-secondary" style="justify-content:flex-start;" onclick="ZenithApp.closeAllModals(); ZenithApp.openRevealSecretModal(${app.id})">
              ${ZenithIcons.eye} Reveal App Secret Key (64-char)
            </button>
            <button class="btn btn-secondary" style="justify-content:flex-start;" onclick="ZenithApp.closeAllModals(); ZenithApp.openRegenerateSecretModal(${app.id})">
              ${ZenithIcons.refresh} Rotate App Secret Key
            </button>
            <button class="btn btn-secondary" style="justify-content:flex-start;" onclick="ZenithApp.closeAllModals(); ZenithApp.openAppSettingsModal(${app.id})">
              ${ZenithIcons.settings} Configure Security & Settings
            </button>
            <button class="btn btn-secondary" style="justify-content:flex-start;" onclick="ZenithApp.closeAllModals(); ZenithApp.openEditAppModal(${app.id})">
              ${ZenithIcons.edit} Edit Name & Version
            </button>
            <button class="btn btn-danger" style="justify-content:flex-start;" onclick="ZenithApp.closeAllModals(); ZenithApp.deleteApp(${app.id})">
              ${ZenithIcons.trash} Delete Application
            </button>
          </div>
        </div>
      </div>
    `);
  },

  /* ====================================================================
     6. PAGE 3: USERS MANAGER
     ==================================================================== */
  async renderUsers(container) {
    const res = await fetch('/api/users?app_id=' + this.activeAppId);
    const data = res.ok ? await res.json() : { users: [] };
    const users = data.users || [];

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Users Manager</h2>
          <p class="card-desc">Inspect, filter, and manage software client credentials and active device bindings</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="ZenithApp.exportUsers()">
            ${ZenithIcons.download} Export
          </button>
          <button class="btn btn-primary btn-sm" onclick="ZenithApp.openCreateUserModal()">
            ${ZenithIcons.plus} Add User
          </button>
        </div>
      </div>

      <div class="zenith-card">
        <div class="table-responsive">
          <table class="zenith-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Hardware ID (HWID)</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.length > 0 ? users.map(u => `
                <tr>
                  <td>
                    <strong>${u.username}</strong>
                    <div style="font-size:12px; color:#6b7280;">${u.email}</div>
                  </td>
                  <td><span class="badge badge-info">${u.role}</span></td>
                  <td>
                    <code style="font-size:11px; color:#a5b4fc;">${u.hwid ? u.hwid.substring(0, 18) + '...' : 'Unbound'}</code>
                  </td>
                  <td style="color:#929292;">${u.expiry_date || 'Lifetime'}</td>
                  <td>
                    <span class="badge badge-${u.status === 'active' ? 'success' : 'danger'}">${u.status}</span>
                  </td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-secondary btn-sm" title="Toggle Ban Status" onclick="ZenithApp.toggleUserStatus(${u.id})">
                        ${ZenithIcons.shield}
                      </button>
                      <button class="btn btn-secondary btn-sm" title="Reset HWID" onclick="ZenithApp.resetUserHwid(${u.id})">
                        ${ZenithIcons.refresh}
                      </button>
                      <button class="btn btn-secondary btn-sm" title="Delete" onclick="ZenithApp.deleteUser(${u.id})">
                        ${ZenithIcons.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="6" style="text-align:center; color:#666;">No registered users found</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async toggleUserStatus(id) {
    const res = await fetch('/api/users/' + id + '/status', { method: 'POST' });
    if (res.ok) {
      this.showToast('User status updated', 'success');
      this.renderUsers(document.getElementById('content-container'));
    }
  },

  async resetUserHwid(id) {
    const res = await fetch('/api/users/' + id + '/reset-hwid', { method: 'POST' });
    if (res.ok) {
      this.showToast('User HWID unlinked successfully', 'success');
      this.renderUsers(document.getElementById('content-container'));
    }
  },

  async deleteUser(id) {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    const res = await fetch('/api/users/' + id, { method: 'DELETE' });
    if (res.ok) {
      this.showToast('User deleted', 'info');
      this.renderUsers(document.getElementById('content-container'));
    }
  },

  exportUsers() {
    window.location.href = '/api/users/export?app_id=' + this.activeAppId + '&format=csv';
  },

  /* ====================================================================
     7. PAGE 4: LICENSE MANAGER (XXXX-XXXX-XXXX-XXXX)
     ==================================================================== */
  async renderLicenses(container) {
    const res = await fetch('/api/licenses?app_id=' + this.activeAppId);
    const data = res.ok ? await res.json() : { licenses: [] };
    const licenses = data.licenses || [];

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">License Manager</h2>
          <p class="card-desc">Cryptographically generated 16-character keys formatted as XXXX-XXXX-XXXX-XXXX</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="window.location.href='/api/licenses/export?app_id=' + ZenithApp.activeAppId + '&format=csv'">
            ${ZenithIcons.download} Export CSV
          </button>
          <button class="btn btn-primary btn-sm" onclick="ZenithApp.openLicenseGeneratorModal()">
            ${ZenithIcons.plus} Generate License Batch
          </button>
        </div>
      </div>

      <div class="zenith-card">
        <div class="table-responsive">
          <table class="zenith-table">
            <thead>
              <tr>
                <th>License Key</th>
                <th>Plan Tier</th>
                <th>Duration</th>
                <th>Bound Client</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${licenses.length > 0 ? licenses.map(l => `
                <tr>
                  <td>
                    <code class="font-mono" style="color:#a5b4fc; font-weight:600; font-size:13px;">${l.license_key}</code>
                  </td>
                  <td>${l.plan_name || 'Standard'}</td>
                  <td>${l.duration_days} days</td>
                  <td style="color:#929292;">${l.used_by || 'Unclaimed'}</td>
                  <td>
                    <span class="badge badge-${l.status === 'active' ? 'success' : l.status === 'unused' ? 'info' : 'danger'}">${l.status}</span>
                  </td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-secondary btn-sm" title="Copy Key" onclick="ZenithApp.copyToClipboard('${l.license_key}')">
                        ${ZenithIcons.copy}
                      </button>
                      <button class="btn btn-secondary btn-sm" title="Ban License" onclick="ZenithApp.banLicense(${l.id})">
                        ${ZenithIcons.close}
                      </button>
                      <button class="btn btn-secondary btn-sm" title="Renew (+30 Days)" onclick="ZenithApp.renewLicense(${l.id})">
                        ${ZenithIcons.refresh}
                      </button>
                      <button class="btn btn-secondary btn-sm" title="Delete" onclick="ZenithApp.deleteLicense(${l.id})">
                        ${ZenithIcons.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="6" style="text-align:center; color:#666;">No license keys found for this application</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async banLicense(id) {
    const res = await fetch('/api/licenses/' + id + '/ban', { method: 'POST' });
    if (res.ok) {
      this.showToast('License key flagged as banned', 'warning');
      this.renderLicenses(document.getElementById('content-container'));
    }
  },

  async renewLicense(id) {
    const res = await fetch('/api/licenses/' + id + '/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 30 })
    });
    if (res.ok) {
      this.showToast('License extended by +30 days', 'success');
      this.renderLicenses(document.getElementById('content-container'));
    }
  },

  async deleteLicense(id) {
    if (!confirm('Delete license key?')) return;
    const res = await fetch('/api/licenses/' + id, { method: 'DELETE' });
    if (res.ok) {
      this.showToast('License removed', 'info');
      this.renderLicenses(document.getElementById('content-container'));
    }
  },

  /* ====================================================================
     8. PAGE 5: HWID MANAGEMENT
     ==================================================================== */
  async renderHwidManagement(container) {
    const res = await fetch('/api/hwid/records?app_id=' + this.activeAppId);
    const data = res.ok ? await res.json() : { records: [] };
    const records = data.records || [];

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Hardware ID (HWID) Management</h2>
          <p class="card-desc">Device lock enforcement, authorized hardware whitelists, and machine ban lists</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="ZenithApp.openAddHwidModal('whitelisted')">
            + Whitelist HWID
          </button>
          <button class="btn btn-danger btn-sm" onclick="ZenithApp.openAddHwidModal('blacklisted')">
            + Blacklist HWID
          </button>
        </div>
      </div>

      <div class="zenith-card">
        <div class="table-responsive">
          <table class="zenith-table">
            <thead>
              <tr>
                <th>Hardware ID</th>
                <th>Assigned User</th>
                <th>IP Address</th>
                <th>Policy Status</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${records.length > 0 ? records.map(r => `
                <tr>
                  <td><code class="font-mono" style="color:#a5b4fc; font-size:12px;">${r.hwid}</code></td>
                  <td><strong>${r.username || 'System Node'}</strong></td>
                  <td style="color:#929292;">${r.ip_address}</td>
                  <td>
                    <span class="badge badge-${r.status === 'whitelisted' ? 'success' : r.status === 'blacklisted' ? 'danger' : 'info'}">${r.status.toUpperCase()}</span>
                  </td>
                  <td style="color:#6b7280; font-size:12px;">${r.note || '-'}</td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-secondary btn-sm" title="Reset HWID Binding" onclick="ZenithApp.resetHwidRecord(${r.id})">
                        ${ZenithIcons.refresh}
                      </button>
                      <button class="btn btn-secondary btn-sm" title="Remove" onclick="ZenithApp.deleteHwidRecord(${r.id})">
                        ${ZenithIcons.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="6" style="text-align:center; color:#666;">No HWID records configured for this application</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async resetHwidRecord(id) {
    const res = await fetch('/api/hwid/' + id + '/reset', { method: 'POST' });
    if (res.ok) {
      this.showToast('HWID record reset successfully', 'success');
      this.renderHwidManagement(document.getElementById('content-container'));
    }
  },

  async deleteHwidRecord(id) {
    const res = await fetch('/api/hwid/' + id, { method: 'DELETE' });
    if (res.ok) {
      this.showToast('HWID record deleted', 'info');
      this.renderHwidManagement(document.getElementById('content-container'));
    }
  },

  /* ====================================================================
     9. PAGE 6: ACTIVE SESSIONS
     ==================================================================== */
  async renderSessions(container) {
    const res = await fetch('/api/sessions?app_id=' + this.activeAppId);
    const sessions = res.ok ? await res.json() : [];

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Active Client Sessions</h2>
          <p class="card-desc">Inspect live connections, IP origins, and terminate suspicious sockets</p>
        </div>
        <button class="btn btn-danger btn-sm" onclick="ZenithApp.terminateAllSessions()">
          Terminate All Sessions
        </button>
      </div>

      <div class="zenith-card">
        <div class="table-responsive">
          <table class="zenith-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Client User</th>
                <th>IP Address</th>
                <th>Device / OS</th>
                <th>Last Heartbeat</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.length > 0 ? sessions.map(s => `
                <tr>
                  <td><code class="font-mono" style="color:#a5b4fc;">${s.session_id.substring(0, 16)}...</code></td>
                  <td><strong>${s.username}</strong></td>
                  <td>${s.ip_address}</td>
                  <td style="color:#929292; font-size:12px;">${s.device_info || 'Windows 11 Client'}</td>
                  <td><span class="badge badge-success">Online</span></td>
                  <td>
                    <button class="btn btn-danger btn-sm" onclick="ZenithApp.terminateSession(${s.id})">
                      Terminate
                    </button>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="6" style="text-align:center; color:#666;">No active client sessions at this moment</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async terminateSession(id) {
    const res = await fetch('/api/sessions/' + id, { method: 'DELETE' });
    if (res.ok) {
      this.showToast('Session terminated', 'info');
      this.renderSessions(document.getElementById('content-container'));
    }
  },

  async terminateAllSessions() {
    if (!confirm('Force disconnect all current sessions?')) return;
    const res = await fetch('/api/sessions/terminate-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: this.activeAppId })
    });
    if (res.ok) {
      this.showToast('All active sessions terminated', 'success');
      this.renderSessions(document.getElementById('content-container'));
    }
  },

  /* ====================================================================
     10. PAGE 7: VARIABLES (GLOBAL & USER)
     ==================================================================== */
  async renderVariables(container) {
    const [gRes, uRes] = await Promise.all([
      fetch('/api/variables/global?app_id=' + this.activeAppId),
      fetch('/api/variables/user?app_id=' + this.activeAppId)
    ]);
    const gVars = gRes.ok ? await gRes.json() : [];
    const uVars = uRes.ok ? await uRes.json() : [];

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Variables Management</h2>
          <p class="card-desc">Dynamic server-side variables distributed to authenticated client sessions</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="ZenithApp.openAddVariableModal()">
          ${ZenithIcons.plus} Add Variable
        </button>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap:20px;">
        <!-- Global Variables -->
        <div class="zenith-card">
          <div class="card-header">
            <div class="card-title">${ZenithIcons.globalVars} Global Variables</div>
          </div>
          <div class="table-responsive">
            <table class="zenith-table">
              <thead>
                <tr>
                  <th>Key Name</th>
                  <th>Value</th>
                  <th>Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${gVars.length > 0 ? gVars.map(v => `
                  <tr>
                    <td><strong style="color:#a5b4fc;">${v.name}</strong></td>
                    <td><code>${v.value}</code></td>
                    <td><span class="badge badge-info">${v.data_type}</span></td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="ZenithApp.deleteGlobalVar(${v.id})">${ZenithIcons.trash}</button>
                    </td>
                  </tr>
                `).join('') : `<tr><td colspan="4" style="text-align:center; color:#666;">No global variables</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <!-- User Variables -->
        <div class="zenith-card">
          <div class="card-header">
            <div class="card-title">${ZenithIcons.userVars} User-Specific Variables</div>
          </div>
          <div class="table-responsive">
            <table class="zenith-table">
              <thead>
                <tr>
                  <th>Target User</th>
                  <th>Key Name</th>
                  <th>Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${uVars.length > 0 ? uVars.map(v => `
                  <tr>
                    <td><strong>${v.username}</strong></td>
                    <td><strong style="color:#a5b4fc;">${v.name}</strong></td>
                    <td><code>${v.value}</code></td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="ZenithApp.deleteUserVar(${v.id})">${ZenithIcons.trash}</button>
                    </td>
                  </tr>
                `).join('') : `<tr><td colspan="4" style="text-align:center; color:#666;">No user variables</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async deleteGlobalVar(id) {
    const res = await fetch('/api/variables/global/' + id, { method: 'DELETE' });
    if (res.ok) {
      this.showToast('Global variable removed', 'info');
      this.renderVariables(document.getElementById('content-container'));
    }
  },

  async deleteUserVar(id) {
    const res = await fetch('/api/variables/user/' + id, { method: 'DELETE' });
    if (res.ok) {
      this.showToast('User variable removed', 'info');
      this.renderVariables(document.getElementById('content-container'));
    }
  },

  /* ====================================================================
     11. PAGE 8: FILE MANAGEMENT
     ==================================================================== */
  async renderFiles(container) {
    const res = await fetch('/api/files?app_id=' + this.activeAppId);
    const files = res.ok ? await res.json() : [];

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Encrypted File Management</h2>
          <p class="card-desc">Encrypted cloud assets, updates, and custom dynamic payloads</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="ZenithApp.openUploadFileModal()">
          ${ZenithIcons.upload} Upload Encrypted Asset
        </button>
      </div>

      <div class="zenith-card">
        <div class="table-responsive">
          <table class="zenith-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>MIME Type</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${files.length > 0 ? files.map(f => `
                <tr>
                  <td>
                    <strong>${f.original_name}</strong>
                    <div style="font-size:11px; color:#6b7280;">${f.filename}</div>
                  </td>
                  <td style="color:#a5b4fc;">${(f.file_size / 1024).toFixed(1)} KB</td>
                  <td><span class="badge badge-info">${f.mime_type}</span></td>
                  <td style="color:#929292;">${f.upload_date ? f.upload_date.split(' ')[0] : 'Today'}</td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <a href="/api/files/${f.id}/download" class="btn btn-secondary btn-sm" title="Download">
                        ${ZenithIcons.download}
                      </a>
                      <button class="btn btn-secondary btn-sm" title="Delete" onclick="ZenithApp.deleteFile(${f.id})">
                        ${ZenithIcons.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="5" style="text-align:center; color:#666;">No uploaded files currently hosted</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async deleteFile(id) {
    const res = await fetch('/api/files/' + id, { method: 'DELETE' });
    if (res.ok) {
      this.showToast('File removed from server', 'info');
      this.renderFiles(document.getElementById('content-container'));
    }
  },

  /* ====================================================================
     12. PAGE 9: WEBHOOKS
     ==================================================================== */
  async renderWebhooks(container) {
    const res = await fetch('/api/webhooks?app_id=' + this.activeAppId);
    const data = res.ok ? await res.json() : { webhooks: [] };
    const webhooks = data.webhooks || [];
    const userPlan = this.user ? (this.user.account_plan || 'TESTER') : 'TESTER';

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Outbound Webhooks</h2>
          <p class="card-desc">Real-time JSON event dispatches to external servers, APIs, or Discord channels</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="ZenithApp.openAddWebhookModal()">
          ${ZenithIcons.plus} Add Webhook
        </button>
      </div>

      <!-- Plan Webhook Quota Notice -->
      ${userPlan === 'TESTER' ? `
        <div class="apps-info-banner" style="border-color:#f59e0b44; background:#f59e0b11; margin-bottom:18px;">
          <span>⚡ <strong>TESTER Plan Quota:</strong> Maximum 2 outbound webhooks allowed. Upgrade to Developer or Seller for unlimited webhooks.</span>
          <button class="btn btn-secondary btn-sm" onclick="ZenithApp.navigate('subscription')">Upgrade Plan</button>
        </div>
      ` : ''}

      <div class="zenith-card">
        <div class="table-responsive">
          <table class="zenith-table">
            <thead>
              <tr>
                <th>Webhook Name</th>
                <th>Destination URL</th>
                <th>Subscribed Events</th>
                <th>Status</th>
                <th>Last Triggered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${webhooks.length > 0 ? webhooks.map(w => `
                <tr>
                  <td><strong>${w.name}</strong></td>
                  <td><code style="font-size:12px; color:#a5b4fc;">${w.webhook_url.substring(0, 36)}...</code></td>
                  <td><span class="badge badge-info">${w.events}</span></td>
                  <td><span class="badge badge-success">${w.status}</span></td>
                  <td style="color:#929292;">${w.last_fired_at || 'Never'}</td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-secondary btn-sm" title="Dispatch Test Ping" onclick="ZenithApp.testWebhook(${w.id})">
                        ${ZenithIcons.loader} Test
                      </button>
                      <button class="btn btn-secondary btn-sm" title="Delete" onclick="ZenithApp.deleteWebhook(${w.id})">
                        ${ZenithIcons.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="6" style="text-align:center; color:#666;">No outbound webhooks registered</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async testWebhook(id) {
    const res = await fetch('/api/webhooks/' + id + '/test', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      this.showToast(data.message || 'Test ping dispatched successfully!', 'success');
      this.renderWebhooks(document.getElementById('content-container'));
    }
  },

  async deleteWebhook(id) {
    const res = await fetch('/api/webhooks/' + id, { method: 'DELETE' });
    if (res.ok) {
      this.showToast('Webhook removed', 'info');
      this.renderWebhooks(document.getElementById('content-container'));
    }
  },

  /* ====================================================================
     13. PAGE 10: INTEGRATIONS (DISCORD & TELEGRAM BOTS)
     ==================================================================== */
  async renderIntegrations(container) {
    const res = await fetch('/api/integrations?app_id=' + this.activeAppId);
    const data = res.ok ? await res.json() : { integrations: [] };
    const items = data.integrations || [];
    const discord = items.find(i => i.type === 'discord_bot') || {};
    const telegram = items.find(i => i.type === 'telegram_bot') || {};
    const userPlan = this.user ? (this.user.account_plan || 'TESTER') : 'TESTER';
    const isSeller = userPlan === 'SELLER' || (this.user && this.user.role === 'Administrator');

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Bot Integrations</h2>
          <p class="card-desc">Automated license dispensing bots for Discord guilds and Telegram channels</p>
        </div>
        <span class="brand-badge">${isSeller ? 'ENABLED' : 'SELLER PLAN REQUIRED'}</span>
      </div>

      ${!isSeller ? `
        <div class="apps-info-banner" style="border-color:#f59e0b44; background:#f59e0b11; margin-bottom:20px;">
          <span>🔒 <strong>Seller Feature:</strong> Discord and Telegram bot auto-vending requires the SELLER plan ($3.49/mo).</span>
          <button class="btn btn-secondary btn-sm" onclick="ZenithApp.navigate('subscription')">Upgrade to Seller</button>
        </div>
      ` : ''}

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap:20px;">
        <!-- Discord Bot Card -->
        <div class="zenith-card">
          <div class="card-header">
            <div>
              <div class="card-title">${ZenithIcons.chat} Discord Bot Integration</div>
              <div class="card-desc">Auto-vend licenses upon payment and assign Discord subscriber roles</div>
            </div>
            <span class="badge badge-${discord.enabled ? 'success' : 'info'}">${discord.enabled ? 'Active' : 'Standby'}</span>
          </div>

          <form id="discord-bot-form" style="display:flex; flex-direction:column; gap:14px;">
            <div class="form-group">
              <label class="form-label">Discord Bot Token</label>
              <input type="password" id="discord-token" class="form-control" value="${discord.bot_token || ''}" placeholder="OTk4...G9X8Y7" ${!isSeller ? 'disabled' : ''} />
            </div>
            <div class="form-group">
              <label class="form-label">Guild / Client ID</label>
              <input type="text" id="discord-client-id" class="form-control" value="${discord.client_id || ''}" placeholder="109283746501928374" ${!isSeller ? 'disabled' : ''} />
            </div>
            <div class="form-group">
              <label class="form-label">Notification Channel ID</label>
              <input type="text" id="discord-channel-id" class="form-control" value="${discord.channel_id || ''}" placeholder="109283746501928375" ${!isSeller ? 'disabled' : ''} />
            </div>
            <div style="display:flex; gap:10px; margin-top:10px;">
              <button type="submit" class="btn btn-primary btn-sm" ${!isSeller ? 'disabled' : ''}>
                Save Discord Settings
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.testBot('Discord')" ${!isSeller ? 'disabled' : ''}>
                Test Handshake
              </button>
            </div>
          </form>
        </div>

        <!-- Telegram Bot Card -->
        <div class="zenith-card">
          <div class="card-header">
            <div>
              <div class="card-title">${ZenithIcons.bot || ZenithIcons.chat} Telegram Bot Integration</div>
              <div class="card-desc">Dispense activation keys via /license command in Telegram chats</div>
            </div>
            <span class="badge badge-${telegram.enabled ? 'success' : 'info'}">${telegram.enabled ? 'Active' : 'Standby'}</span>
          </div>

          <form id="telegram-bot-form" style="display:flex; flex-direction:column; gap:14px;">
            <div class="form-group">
              <label class="form-label">Telegram Bot Token</label>
              <input type="password" id="telegram-token" class="form-control" value="${telegram.bot_token || ''}" placeholder="718293849:AAFX987sample" ${!isSeller ? 'disabled' : ''} />
            </div>
            <div class="form-group">
              <label class="form-label">Telegram Channel / Chat ID</label>
              <input type="text" id="telegram-channel-id" class="form-control" value="${telegram.channel_id || ''}" placeholder="-100192837465" ${!isSeller ? 'disabled' : ''} />
            </div>
            <div style="display:flex; gap:10px; margin-top:10px;">
              <button type="submit" class="btn btn-primary btn-sm" ${!isSeller ? 'disabled' : ''}>
                Save Telegram Settings
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.testBot('Telegram')" ${!isSeller ? 'disabled' : ''}>
                Test Handshake
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (isSeller) {
      document.getElementById('discord-bot-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await fetch('/api/integrations/discord', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bot_token: document.getElementById('discord-token').value.trim(),
            client_id: document.getElementById('discord-client-id').value.trim(),
            channel_id: document.getElementById('discord-channel-id').value.trim(),
            enabled: 1,
            app_id: this.activeAppId
          })
        });
        if (res.ok) this.showToast('Discord Bot configuration saved!', 'success');
      });

      document.getElementById('telegram-bot-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await fetch('/api/integrations/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bot_token: document.getElementById('telegram-token').value.trim(),
            channel_id: document.getElementById('telegram-channel-id').value.trim(),
            enabled: 1,
            app_id: this.activeAppId
          })
        });
        if (res.ok) this.showToast('Telegram Bot configuration saved!', 'success');
      });
    }
  },

  async testBot(type) {
    const res = await fetch('/api/integrations/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    const data = await res.json();
    if (res.ok) this.showToast(data.message || `${type} Bot online!`, 'success');
  },

  /* ====================================================================
     14. PAGE 11: TEAM MANAGEMENT
     ==================================================================== */
  async renderTeam(container) {
    const res = await fetch('/api/team');
    const team = res.ok ? await res.json() : [];

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Team Management</h2>
          <p class="card-desc">Role-based access delegation for co-developers, managers, and resellers</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="ZenithApp.openAddTeamModal()">
          ${ZenithIcons.plus} Add Member
        </button>
      </div>

      <div class="zenith-card">
        <div class="table-responsive">
          <table class="zenith-table">
            <thead>
              <tr>
                <th>Member Email</th>
                <th>Role</th>
                <th>Key Balance</th>
                <th>Assigned Apps</th>
                <th>Permissions</th>
                <th>Expiry</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${team.length > 0 ? team.map(m => `
                <tr>
                  <td><strong>${m.email}</strong></td>
                  <td><span class="badge badge-info">${m.role}</span></td>
                  <td style="color:#10b981; font-weight:600;">${m.key_balance} keys</td>
                  <td>App #${m.assigned_apps}</td>
                  <td style="font-size:11px; color:#a5b4fc;">${m.permissions_json ? m.permissions_json.substring(0, 24) + '...' : 'All'}</td>
                  <td style="color:#929292;">${m.expiry_date ? m.expiry_date.split(' ')[0] : 'Permanent'}</td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="ZenithApp.deleteTeamMember(${m.id})">
                      ${ZenithIcons.trash}
                    </button>
                  </td>
                </tr>
              `).join('') : `<tr><td colspan="7" style="text-align:center; color:#666;">No team members added yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async deleteTeamMember(id) {
    const res = await fetch('/api/team/' + id, { method: 'DELETE' });
    if (res.ok) {
      this.showToast('Team member removed', 'info');
      this.renderTeam(document.getElementById('content-container'));
    }
  },

  /* ====================================================================
     15. PAGE 12: RESELLERS & SELLER CREDENTIALS
     ==================================================================== */
  async renderResellers(container) {
    const res = await fetch('/api/seller/credentials');
    const creds = res.ok ? await res.json() : {};

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Reseller Network & API</h2>
          <p class="card-desc">Programmatic REST API keys and external storefront vending integration</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="ZenithApp.resetSellerKey()">
          ${ZenithIcons.refresh} Rotate Seller Key
        </button>
      </div>

      <div class="zenith-card" style="margin-bottom:20px;">
        <div class="card-header">
          <div class="card-title">${ZenithIcons.sellerKey} Seller API Credentials</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div>
            <label style="font-size:12px; color:#6b7280; font-weight:600;">Seller REST Key</label>
            <div style="display:flex; gap:8px; margin-top:4px;">
              <input type="password" id="seller-key-in" class="form-control font-mono" value="${creds.seller_key || 'zenith_sk_sample'}" readonly />
              <button class="btn btn-secondary btn-sm" onclick="ZenithApp.togglePasswordVisibility('seller-key-in')">
                ${ZenithIcons.eye}
              </button>
              <button class="btn btn-secondary btn-sm" onclick="ZenithApp.copyToClipboard(document.getElementById('seller-key-in').value)">
                ${ZenithIcons.copy}
              </button>
            </div>
          </div>
          <div>
            <label style="font-size:12px; color:#6b7280; font-weight:600;">Base Endpoint URL</label>
            <div style="display:flex; gap:8px; margin-top:4px;">
              <input type="text" class="form-control font-mono" value="${window.location.origin}/api/v1/seller" readonly />
              <button class="btn btn-secondary btn-sm" onclick="ZenithApp.copyToClipboard(window.location.origin + '/api/v1/seller')">
                ${ZenithIcons.copy}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  togglePasswordVisibility(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
  },

  async resetSellerKey() {
    if (!confirm('Rotate your seller API key? External bots will need updating.')) return;
    const res = await fetch('/api/seller/credentials/reset', { method: 'POST' });
    if (res.ok) {
      this.showToast('Seller API key rotated', 'success');
      this.renderResellers(document.getElementById('content-container'));
    }
  },

  /* ====================================================================
     16. PAGE 13: LOGS CONSOLE (EVENT, ACCOUNT, SELLER, AUDIT)
     ==================================================================== */
  async renderLogs(container) {
    const [evRes, accRes, auditRes] = await Promise.all([
      fetch('/api/logs/events?app_id=' + this.activeAppId),
      fetch('/api/logs/account'),
      fetch('/api/security/audit-logs')
    ]);

    const evData = evRes.ok ? await evRes.json() : { events: [] };
    const accData = accRes.ok ? await accRes.json() : { logs: [] };
    const auditData = auditRes.ok ? await auditRes.json() : { logs: [] };

    const events = evData.events || [];
    const accounts = accData.logs || [];
    const audits = auditData.logs || [];

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Logs Console</h2>
          <p class="card-desc">Forensic audit trail of authentication events, policy triggers, and account security</p>
        </div>
      </div>

      <div class="zenith-card">
        <div class="card-header">
          <div class="card-title">${ZenithIcons.sellerLogs} Application Security Event Logs</div>
        </div>
        <div class="table-responsive">
          <table class="zenith-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Description</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              ${events.length > 0 ? events.map(e => `
                <tr>
                  <td style="color:#6b7280; font-size:12px;">${e.created_at}</td>
                  <td><span class="badge badge-info">${e.event_type}</span></td>
                  <td><strong>${e.description}</strong></td>
                  <td style="color:#a5b4fc;">${e.ip_address}</td>
                </tr>
              `).join('') : `<tr><td colspan="4" style="text-align:center; color:#666;">No event logs recorded</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /* ====================================================================
     17. PAGE 14: ANALYTICS & INSIGHTS
     ==================================================================== */
  async renderAnalytics(container) {
    const res = await fetch('/api/analytics?app_id=' + this.activeAppId);
    const data = res.ok ? await res.json() : {};
    const summary = data.summary || { totalUsers: 0, activeUsers: 0, totalLicenses: 0, totalSessions: 0, hwidLockRate: 98.4 };
    const timeline = data.timeline || [];
    const osDist = data.osDistribution || [];

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Analytics & Insights</h2>
          <p class="card-desc">Real-time telemetry, authentication frequency, and device architecture distribution</p>
        </div>
      </div>

      <!-- Metric Highlights -->
      <div class="wireframe-stats-row" style="margin-bottom:20px;">
        <div class="wireframe-stat-card">
          <div class="stat-label-upper">TOTAL CLIENTS</div>
          <div class="stat-metric-val">${summary.totalUsers}</div>
          <div class="stat-metric-sub">${summary.activeUsers} currently active</div>
        </div>
        <div class="wireframe-stat-card">
          <div class="stat-label-upper">LICENSES</div>
          <div class="stat-metric-val">${summary.totalLicenses}</div>
          <div class="stat-metric-sub">${summary.activeLicenses || 0} claimed</div>
        </div>
        <div class="wireframe-stat-card">
          <div class="stat-label-upper">HWID LOCK RATE</div>
          <div class="stat-metric-val" style="color:#10b981;">${summary.hwidLockRate}%</div>
          <div class="stat-metric-sub">Strict hardware binding</div>
        </div>
        <div class="wireframe-stat-card">
          <div class="stat-label-upper">LIVE SESSIONS</div>
          <div class="stat-metric-val" style="color:#6366f1;">${summary.totalSessions}</div>
          <div class="stat-metric-sub">Online nodes</div>
        </div>
      </div>

      <!-- Activity Timeline & OS Bars -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap:20px;">
        <!-- Timeline Chart -->
        <div class="zenith-card">
          <div class="card-header">
            <div class="card-title">${ZenithIcons.dashboard} 7-Day Activity Trends</div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; height:180px; padding:20px 10px 0; border-bottom:1px solid #252528;">
            ${timeline.map(t => `
              <div style="display:flex; flex-direction:column; align-items:center; gap:8px; flex:1;">
                <div style="display:flex; gap:4px; align-items:flex-end; height:130px;">
                  <div style="width:14px; background:#6366f1; border-radius:3px 3px 0 0; height:${Math.min(120, t.logins * 3)}px;" title="Logins: ${t.logins}"></div>
                  <div style="width:14px; background:#10b981; border-radius:3px 3px 0 0; height:${Math.min(120, t.activations * 6)}px;" title="Activations: ${t.activations}"></div>
                </div>
                <span style="font-size:11px; color:#6b7280; font-weight:600;">${t.day}</span>
              </div>
            `).join('')}
          </div>
          <div style="display:flex; justify-content:center; gap:24px; margin-top:14px; font-size:12px;">
            <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; background:#6366f1; border-radius:2px;"></span> Client Logins</span>
            <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; background:#10b981; border-radius:2px;"></span> Key Activations</span>
          </div>
        </div>

        <!-- OS Distribution -->
        <div class="zenith-card">
          <div class="card-header">
            <div class="card-title">${ZenithIcons.loader} Operating System Telemetry</div>
          </div>
          <div style="display:flex; flex-direction:column; gap:16px; padding-top:10px;">
            ${osDist.map(o => `
              <div>
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;">
                  <span><strong>${o.os}</strong></span>
                  <span style="color:#a5b4fc; font-weight:600;">${o.percent}%</span>
                </div>
                <div style="background:#222228; border-radius:9999px; height:8px; overflow:hidden;">
                  <div style="background:linear-gradient(90deg, #6366f1, #8b5cf6); width:${o.percent}%; height:100%;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  /* ====================================================================
     18. PAGE 15: SUBSCRIPTION & THREE ACCOUNT MODES
     ==================================================================== */
  async renderSubscription(container) {
    const res = await fetch('/api/subscription/plans');
    const data = res.ok ? await res.json() : { plans: [] };
    const plans = data.plans || [];
    const currentPlan = this.user ? (this.user.account_plan || 'TESTER') : 'TESTER';

    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Account Subscription</h2>
          <p class="card-desc">Choose the plan that fits your engineering scope. Strict backend enforcement protects every tier.</p>
        </div>

        <!-- Monthly / Yearly Toggle -->
        <div style="background:#151518; border:1px solid #27272e; border-radius:9999px; padding:4px; display:inline-flex; align-items:center;">
          <button id="cycle-monthly-btn" class="btn btn-sm" style="border-radius:9999px; background:${this.billingCycle === 'monthly' ? '#6366f1' : 'transparent'}; color:#fff;" onclick="ZenithApp.setBillingCycle('monthly')">
            Monthly
          </button>
          <button id="cycle-yearly-btn" class="btn btn-sm" style="border-radius:9999px; background:${this.billingCycle === 'yearly' ? '#6366f1' : 'transparent'}; color:#fff; display:flex; align-items:center; gap:6px;" onclick="ZenithApp.setBillingCycle('yearly')">
            <span>Yearly</span>
            <span style="background:#22c55e; color:#000; font-size:10px; font-weight:800; padding:1px 6px; border-radius:9999px;">SAVE 50%</span>
          </button>
        </div>
      </div>

      <!-- Three Plan Cards Grid -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
        ${plans.map(p => {
          const isCurrent = currentPlan.toUpperCase() === p.id.toUpperCase();
          const price = this.billingCycle === 'yearly' ? p.yearly_price : p.monthly_price;
          const periodLabel = this.billingCycle === 'yearly' ? '/year' : '/month';

          return `
            <div class="zenith-card" style="display:flex; flex-direction:column; justify-content:space-between; position:relative; ${p.badge === 'POPULAR' ? 'border-color:#6366f1; box-shadow:0 0 25px rgba(99,102,241,0.2);' : ''}">
              ${p.badge === 'POPULAR' ? `
                <div style="position:absolute; top:-12px; right:20px; background:#6366f1; color:#fff; font-size:10.5px; font-weight:800; padding:2px 10px; border-radius:9999px; letter-spacing:0.5px;">
                  MOST POPULAR
                </div>
              ` : ''}

              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <h3 style="font-size:18px; font-weight:700; color:#fff;">${p.name}</h3>
                  <span class="badge badge-info">${p.badge}</span>
                </div>

                <div style="display:flex; align-items:baseline; gap:4px; margin-bottom:12px;">
                  <span style="font-size:34px; font-weight:800; color:#fff;">$${price.toFixed(2)}</span>
                  <span style="color:#929292; font-size:13px;">${periodLabel}</span>
                </div>

                <p style="color:#929292; font-size:13px; line-height:1.5; margin-bottom:20px;">
                  ${p.description}
                </p>

                <div style="border-top:1px solid #232328; padding-top:16px; margin-bottom:20px;">
                  <div style="font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; margin-bottom:10px;">INCLUDED CAPABILITIES</div>
                  <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px; font-size:13px;">
                    ${p.features.map(f => `
                      <li style="display:flex; align-items:center; gap:8px;">
                        <span style="color:${f.startsWith('No ') ? '#ef4444' : '#10b981'}; font-weight:700;">${f.startsWith('No ') ? '✕' : '✓'}</span>
                        <span style="color:${f.startsWith('No ') ? '#6b7280' : '#e5e7eb'};">${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              </div>

              <div>
                ${isCurrent ? `
                  <button class="btn btn-secondary" style="width:100%; border-color:#6366f1; color:#a5b4fc;" disabled>
                    Current Active Plan
                  </button>
                ` : `
                  <button class="btn ${p.badge === 'POPULAR' ? 'btn-primary' : 'btn-secondary'}" style="width:100%;" onclick="ZenithApp.openUpgradeModal('${p.id}')">
                    Upgrade to ${p.name}
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  setBillingCycle(cycle) {
    this.billingCycle = cycle;
    this.renderSubscription(document.getElementById('content-container'));
  },

  openUpgradeModal(planId) {
    const cycle = this.billingCycle || 'monthly';
    let price = planId === 'DEVELOPER' ? (cycle === 'yearly' ? 12.99 : 2.49) : (cycle === 'yearly' ? 23.99 : 3.49);

    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:480px;">
          <div class="modal-header">
            <h3 style="font-size:17px; font-weight:700;">Confirm Plan Upgrade</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="upgrade-checkout-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
              <div style="background:#16161b; border:1px solid #272732; border-radius:10px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-weight:700; color:#fff; font-size:16px;">${planId} Plan</div>
                  <div style="font-size:12px; color:#929292;">Billing frequency: ${cycle.toUpperCase()}</div>
                </div>
                <div style="font-size:24px; font-weight:800; color:#10b981;">$${price.toFixed(2)}</div>
              </div>

              <div class="form-group">
                <label class="form-label">Payment Method</label>
                <select id="checkout-method" class="form-control">
                  <option value="Credit Card">Credit / Debit Card</option>
                  <option value="Crypto">Cryptocurrency (BTC / USDT / ETH)</option>
                  <option value="PayPal">PayPal Commerce</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Transaction / Voucher Reference ID</label>
                <input type="text" id="checkout-ref" class="form-control font-mono" placeholder="TXN-VERIFY-998124" value="TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}" required />
                <div style="font-size:11.5px; color:#6b7280; margin-top:4px;">Backend verifies payment transactions before applying features</div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" id="confirm-upgrade-btn" class="btn btn-primary btn-sm">
                Verify & Activate ${planId}
              </button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('upgrade-checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('confirm-upgrade-btn');
      btn.disabled = true;
      btn.innerText = 'Verifying with payment node...';

      const method = document.getElementById('checkout-method').value;
      const ref = document.getElementById('checkout-ref').value.trim();

      try {
        const res = await fetch('/api/subscription/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_name: planId,
            billing_cycle: cycle,
            payment_method: method,
            transaction_reference: ref
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.user.account_plan = planId;
          this.showToast(data.message || 'Upgraded successfully!', 'success');
          this.closeAllModals();
          this.renderAuthenticatedLayout();
          this.navigate('subscription');
        } else {
          this.showToast(data.error || 'Upgrade failed', 'danger');
          btn.disabled = false;
          btn.innerText = 'Verify & Activate ' + planId;
        }
      } catch {
        this.showToast('Network error during transaction verification', 'danger');
        btn.disabled = false;
        btn.innerText = 'Verify & Activate ' + planId;
      }
    });
  },

  /* ====================================================================
     19. PAGE 16: ACCOUNT SETTINGS & PERMANENT OWNER ID
     ==================================================================== */
  async renderSettings(container) {
    container.innerHTML = `
      <div class="card-header" style="margin-bottom:18px;">
        <div>
          <h2 style="font-size:22px; font-weight:700;">Account Settings</h2>
          <p class="card-desc">Security preferences, credentials, and your permanent Master Owner ID</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap:20px;">
        <!-- Owner ID Card -->
        <div class="zenith-card">
          <div class="card-header">
            <div>
              <div class="card-title">${ZenithIcons.shield} Permanent Owner ID</div>
              <div class="card-desc">Permanent 10-character alphanumeric identity tied to your account</div>
            </div>
          </div>
          <div style="background:#0f0f13; border:1px solid #232328; border-radius:8px; padding:18px; margin-bottom:16px;">
            <div style="font-size:12px; color:#6b7280; margin-bottom:6px;">MASTER OWNER ID (CLIENT SDK BINDING)</div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <code class="font-mono" style="font-size:20px; font-weight:800; color:#a5b4fc; letter-spacing:1px;">
                ${this.user.owner_id || 'PC1B6P1TTA'}
              </code>
              <button class="btn btn-secondary btn-sm" onclick="ZenithApp.copyToClipboard('${this.user.owner_id || 'PC1B6P1TTA'}')">
                ${ZenithIcons.copy} Copy Owner ID
              </button>
            </div>
          </div>
          <p style="font-size:12.5px; color:#929292; line-height:1.5;">
            ℹ️ All applications created under your Gmail address share this permanent Owner ID. Clients use this in tandem with unique Application Secret Keys to securely authenticate handshakes.
          </p>
        </div>

        <!-- Password Change -->
        <div class="zenith-card">
          <div class="card-header">
            <div class="card-title">${ZenithIcons.profile} Update Credentials</div>
          </div>
          <form id="change-pwd-form" style="display:flex; flex-direction:column; gap:12px;">
            <div class="form-group">
              <label class="form-label">Current Password</label>
              <input type="password" id="old-pwd" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" id="new-pwd" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-primary btn-sm" style="margin-top:6px;">
              Update Password
            </button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('change-pwd-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('old-pwd').value;
      const newPassword = document.getElementById('new-pwd').value;

      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        this.showToast('Password updated successfully', 'success');
        document.getElementById('change-pwd-form').reset();
      } else {
        this.showToast(data.error || 'Failed to update password', 'danger');
      }
    });
  },

  /* ====================================================================
     20. MODALS & DIALOG CONTROLLERS
     ==================================================================== */
  openModal(html) {
    const container = document.getElementById('modal-root');
    container.innerHTML = html;
    const backdrop = container.querySelector('.modal-backdrop');
    setTimeout(() => { if (backdrop) backdrop.classList.add('open'); }, 10);
  },

  closeAllModals() {
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      setTimeout(() => {
        const root = document.getElementById('modal-root');
        if (root) root.innerHTML = '';
      }, 200);
    }
  },

  // Open Global Search (Ctrl + K)
  openGlobalSearch() {
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:540px;">
          <div style="padding:14px 18px; border-bottom:1px solid #252525; display:flex; align-items:center; gap:10px;">
            ${ZenithIcons.search}
            <input type="text" id="global-search-input" class="form-control" style="border:none; background:transparent; font-size:15px; padding:0;" placeholder="Search applications, users, license keys, files..." autofocus />
          </div>
          <div id="search-results-box" style="padding:12px; max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
            <div style="text-align:center; padding:20px; color:#666; font-size:13px;">Type to search across entire Zenith Auth platform</div>
          </div>
        </div>
      </div>
    `);

    const input = document.getElementById('global-search-input');
    input.focus();
    input.addEventListener('input', async (e) => {
      const q = e.target.value.trim();
      if (!q) return;

      const res = await fetch('/api/search?q=' + encodeURIComponent(q));
      if (res.ok) {
        const { results } = await res.json();
        const box = document.getElementById('search-results-box');
        if (results.length === 0) {
          box.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">No records found</div>';
          return;
        }

        box.innerHTML = results.map(r => `
          <div style="padding:10px 14px; background:#121212; border:1px solid #222; border-radius:6px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="ZenithApp.closeAllModals(); ZenithApp.navigate('${r.category === 'app' ? 'applications' : r.category === 'user' ? 'users' : 'licenses'}')">
            <div>
              <strong style="color:#fff;">${r.name || r.username || r.license_key}</strong>
              <div style="font-size:11px; color:#888;">${r.email || r.status || ''}</div>
            </div>
            <span class="badge badge-info">${r.category}</span>
          </div>
        `).join('');
      }
    });
  },

  // Reveal Secret Key Modal
  async openRevealSecretModal(appId) {
    try {
      const res = await fetch('/api/apps/' + appId + '/reveal-secret', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.secret_key) {
        this.showToast(data.error || 'Unable to retrieve secret key', 'danger');
        return;
      }

      this.openModal(`
        <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
          <div class="modal-container" style="max-width:540px;">
            <div class="modal-header">
              <h3 style="font-size:17px; font-weight:700;">Application Secret Key (64-char Hex)</h3>
              <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
            </div>
            <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
              <p style="font-size:13px; color:#929292;">
                Keep this key strictly confidential. Client applications use this secret to sign initialization requests.
              </p>
              <div style="background:#0c0d10; border:1px solid #232328; border-radius:8px; padding:14px; word-break:break-all;">
                <code class="font-mono" style="color:#22c55e; font-size:13px; line-height:1.6;">${data.secret_key}</code>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Close</button>
              <button class="btn btn-primary btn-sm" onclick="ZenithApp.copyToClipboard('${data.secret_key}')">
                ${ZenithIcons.copy} Copy Secret Key
              </button>
            </div>
          </div>
        </div>
      `);
    } catch {
      this.showToast('Network error while requesting secret key', 'danger');
    }
  },

  // Regenerate Secret Key Modal
  openRegenerateSecretModal(appId) {
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:480px;">
          <div class="modal-header">
            <h3 style="font-size:17px; font-weight:700; color:#ef4444;">Rotate Application Secret Key?</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <div class="modal-body">
            <p style="font-size:13.5px; color:#d1d5db; line-height:1.6;">
              Rotating the secret key will immediately invalidate the previous 64-character secret. Existing client binaries will fail handshake until updated with the new key.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
            <button class="btn btn-danger btn-sm" onclick="ZenithApp.confirmRegenerateSecret(${appId})">
              Confirm & Generate New Secret
            </button>
          </div>
        </div>
      </div>
    `);
  },

  async confirmRegenerateSecret(appId) {
    try {
      const res = await fetch('/api/apps/' + appId + '/regenerate-secret', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        this.closeAllModals();
        this.showToast('Secret rotated successfully!', 'success');
        this.openRevealSecretModal(appId);
      } else {
        this.showToast(data.error || 'Failed to rotate secret', 'danger');
      }
    } catch {
      this.showToast('Network error during secret rotation', 'danger');
    }
  },

  // Create Application Modal
  openCreateAppModal() {
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:480px;">
          <div class="modal-header">
            <h3 style="font-size:17px; font-weight:700;">Create New Application</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="create-app-modal-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
              <div class="form-group">
                <label class="form-label">Application Name</label>
                <input type="text" id="new-app-name" class="form-control" placeholder="e.g. ZS COVER SILENT" required />
              </div>
              <div class="form-group">
                <label class="form-label">Initial Version</label>
                <input type="text" id="new-app-version" class="form-control" value="1.0" required />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea id="new-app-desc" class="form-control" rows="2" placeholder="Brief project description..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" id="btn-save-new-app" class="btn btn-primary btn-sm">Create Application</button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('create-app-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-new-app');
      btn.disabled = true;

      const name = document.getElementById('new-app-name').value.trim();
      const version = document.getElementById('new-app-version').value.trim();
      const description = document.getElementById('new-app-desc').value.trim();

      try {
        const res = await fetch('/api/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, version, description })
        });
        const data = await res.json();
        if (res.ok) {
          this.showToast('Application created successfully!', 'success');
          this.closeAllModals();
          await this.loadApplications();
          this.setActiveApplication(data.id);
        } else {
          this.showToast(data.error || 'Failed to create application', 'danger');
          btn.disabled = false;
        }
      } catch {
        this.showToast('Network error creating application', 'danger');
        btn.disabled = false;
      }
    });
  },

  // License Generator Modal
  openLicenseGeneratorModal() {
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:480px;">
          <div class="modal-header">
            <h3 style="font-size:17px; font-weight:700;">Generate License Keys</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="gen-lic-modal-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
              <div class="form-group">
                <label class="form-label">Key Prefix (optional)</label>
                <input type="text" id="lic-prefix" class="form-control" placeholder="ZENITH" value="ZENITH" />
              </div>
              <div class="form-group">
                <label class="form-label">Batch Count</label>
                <input type="number" id="lic-count" class="form-control" value="5" min="1" max="50" required />
              </div>
              <div class="form-group">
                <label class="form-label">Duration (Days)</label>
                <input type="number" id="lic-duration" class="form-control" value="30" min="1" required />
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="lic-hwid-lock" checked />
                <label for="lic-hwid-lock" style="font-size:13px; color:#d1d5db; cursor:pointer;">Enforce Hardware ID (HWID) binding</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" id="btn-submit-gen-lic" class="btn btn-primary btn-sm">Generate Keys</button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('gen-lic-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit-gen-lic');
      btn.disabled = true;

      const prefix = document.getElementById('lic-prefix').value.trim();
      const count = parseInt(document.getElementById('lic-count').value, 10);
      const duration_days = parseInt(document.getElementById('lic-duration').value, 10);
      const hwid_bound = document.getElementById('lic-hwid-lock').checked ? 1 : 0;

      try {
        const res = await fetch('/api/licenses/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prefix, count, duration_days, hwid_bound, app_id: this.activeAppId })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.closeAllModals();
          this.showToast('Generated ' + data.count + ' license keys!', 'success');
          this.renderLicenses(document.getElementById('content-container'));
        } else {
          this.showToast(data.error || 'Failed to generate licenses', 'danger');
          btn.disabled = false;
        }
      } catch {
        this.showToast('Network error generating licenses', 'danger');
        btn.disabled = false;
      }
    });
  },

  // Add HWID Modal
  openAddHwidModal(type = 'whitelisted') {
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:440px;">
          <div class="modal-header">
            <h3 style="font-size:16px; font-weight:700;">Add ${type.toUpperCase()} HWID</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="add-hwid-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group">
                <label class="form-label">Hardware ID (HWID)</label>
                <input type="text" id="hwid-val-in" class="form-control font-mono" placeholder="HWID-XXXX-XXXX-XXXX" required />
              </div>
              <div class="form-group">
                <label class="form-label">User / Device Identifier</label>
                <input type="text" id="hwid-user-in" class="form-control" placeholder="Developer Workstation" />
              </div>
              <div class="form-group">
                <label class="form-label">Note / Reason</label>
                <input type="text" id="hwid-note-in" class="form-control" placeholder="Primary engineering test rig" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save HWID</button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('add-hwid-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const endpoint = type === 'blacklisted' ? '/api/hwid/blacklist' : '/api/hwid/whitelist';
      const hwid = document.getElementById('hwid-val-in').value.trim();
      const username = document.getElementById('hwid-user-in').value.trim();
      const note = document.getElementById('hwid-note-in').value.trim();

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hwid, username, note, app_id: this.activeAppId })
      });
      if (res.ok) {
        this.closeAllModals();
        this.showToast('HWID added to ' + type, 'success');
        this.renderHwidManagement(document.getElementById('content-container'));
      }
    });
  },

  // Add Webhook Modal
  openAddWebhookModal() {
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:460px;">
          <div class="modal-header">
            <h3 style="font-size:16px; font-weight:700;">Add Outbound Webhook</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="add-webhook-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group">
                <label class="form-label">Webhook Name</label>
                <input type="text" id="wh-name-in" class="form-control" placeholder="e.g. Discord Production Alerts" required />
              </div>
              <div class="form-group">
                <label class="form-label">Destination URL</label>
                <input type="url" id="wh-url-in" class="form-control" placeholder="https://discord.com/api/webhooks/..." required />
              </div>
              <div class="form-group">
                <label class="form-label">Events</label>
                <select id="wh-events-in" class="form-control">
                  <option value="login,register,license_activate">All Events (Login, Register, Activate)</option>
                  <option value="login">Logins Only</option>
                  <option value="license_activate">License Activations Only</option>
                  <option value="ban,hwid_mismatch">Security Alerts (Ban, HWID Mismatch)</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Create Webhook</button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('add-webhook-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('wh-name-in').value.trim();
      const webhook_url = document.getElementById('wh-url-in').value.trim();
      const events = document.getElementById('wh-events-in').value;

      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, webhook_url, events, app_id: this.activeAppId })
      });
      const data = await res.json();
      if (res.ok) {
        this.closeAllModals();
        this.showToast('Webhook registered successfully!', 'success');
        this.renderWebhooks(document.getElementById('content-container'));
      } else {
        this.showToast(data.error || 'Failed to create webhook', 'danger');
      }
    });
  },

  // Application Settings Modal
  async openAppSettingsModal(appId) {
    const res = await fetch('/api/apps/' + appId + '/settings');
    const settings = res.ok ? await res.json() : {};

    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:500px;">
          <div class="modal-header">
            <h3 style="font-size:16px; font-weight:700;">Application Security Policies</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="app-settings-modal-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:14px;">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-weight:600; color:#fff; font-size:13.5px;">Enforce HWID Binding</div>
                  <div style="font-size:12px; color:#6b7280;">Lock client license to first registered machine</div>
                </div>
                <input type="checkbox" id="set-hwid-lock" ${settings.hwid_lock ? 'checked' : ''} />
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-weight:600; color:#fff; font-size:13.5px;">Token Validation</div>
                  <div style="font-size:12px; color:#6b7280;">Require JWT signed headers on client calls</div>
                </div>
                <input type="checkbox" id="set-token-val" ${settings.token_validation ? 'checked' : ''} />
              </div>
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                  <div style="font-weight:600; color:#fff; font-size:13.5px;">Blacklist Enforcement</div>
                  <div style="font-size:12px; color:#6b7280;">Block hardware IDs on security blacklist</div>
                </div>
                <input type="checkbox" id="set-blacklist" ${settings.blacklist_enabled ? 'checked' : ''} />
              </div>
              <div class="form-group" style="margin-top:8px;">
                <label class="form-label">Client Session Timeout (Minutes)</label>
                <input type="number" id="set-session-timeout" class="form-control" value="${settings.session_timeout || 60}" min="5" max="1440" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save Policies</button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('app-settings-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const hwid_lock = document.getElementById('set-hwid-lock').checked ? 1 : 0;
      const token_validation = document.getElementById('set-token-val').checked ? 1 : 0;
      const blacklist_enabled = document.getElementById('set-blacklist').checked ? 1 : 0;
      const session_timeout = parseInt(document.getElementById('set-session-timeout').value, 10);

      const sRes = await fetch('/api/apps/' + appId + '/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hwid_lock, token_validation, blacklist_enabled, session_timeout })
      });
      if (sRes.ok) {
        this.closeAllModals();
        this.showToast('Security policies saved!', 'success');
      }
    });
  },

  // Edit App Modal
  async openEditAppModal(appId) {
    const app = this.apps.find(a => a.id === appId);
    if (!app) return;

    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:440px;">
          <div class="modal-header">
            <h3 style="font-size:16px; font-weight:700;">Edit Application</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="edit-app-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group">
                <label class="form-label">Application Name</label>
                <input type="text" id="edit-app-name" class="form-control" value="${app.name}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Version</label>
                <input type="text" id="edit-app-ver" class="form-control" value="${app.version}" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('edit-app-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-app-name').value.trim();
      const version = document.getElementById('edit-app-ver').value.trim();

      const res = await fetch('/api/apps/' + appId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, version })
      });
      if (res.ok) {
        this.closeAllModals();
        this.showToast('Application updated', 'success');
        await this.loadApplications();
        this.renderApplications(document.getElementById('content-container'));
      }
    });
  },

  async deleteApp(appId) {
    if (!confirm('Are you certain you want to delete this application and all associated licenses?')) return;
    const res = await fetch('/api/apps/' + appId, { method: 'DELETE' });
    if (res.ok) {
      this.showToast('Application deleted', 'info');
      await this.loadApplications();
      if (this.apps.length > 0) this.activeAppId = this.apps[0].id;
      this.renderApplications(document.getElementById('content-container'));
    }
  },

  // Create User Modal
  openCreateUserModal() {
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:440px;">
          <div class="modal-header">
            <h3 style="font-size:16px; font-weight:700;">Add New User</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="create-user-modal-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" id="nu-name" class="form-control" placeholder="client_user" required />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="nu-email" class="form-control" placeholder="client@domain.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="nu-pass" class="form-control" placeholder="••••••••••••" required />
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select id="nu-role" class="form-control">
                  <option value="Client">Client</option>
                  <option value="Reseller">Reseller</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Create User</button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('create-user-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('nu-name').value.trim();
      const email = document.getElementById('nu-email').value.trim();
      const password = document.getElementById('nu-pass').value;
      const role = document.getElementById('nu-role').value;

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role, app_id: this.activeAppId })
      });
      const data = await res.json();
      if (res.ok) {
        this.closeAllModals();
        this.showToast('User created successfully', 'success');
        this.renderUsers(document.getElementById('content-container'));
      } else {
        this.showToast(data.error || 'Failed to create user', 'danger');
      }
    });
  },

  // Add Variable Modal
  openAddVariableModal() {
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:440px;">
          <div class="modal-header">
            <h3 style="font-size:16px; font-weight:700;">Add Global Variable</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="add-var-modal-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group">
                <label class="form-label">Key Name</label>
                <input type="text" id="var-key-in" class="form-control font-mono" placeholder="CONFIG_PAYLOAD_URL" required />
              </div>
              <div class="form-group">
                <label class="form-label">Value</label>
                <input type="text" id="var-val-in" class="form-control" placeholder="https://cdn.domain.com/v1" required />
              </div>
              <div class="form-group">
                <label class="form-label">Data Type</label>
                <select id="var-type-in" class="form-control">
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save Variable</button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('add-var-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('var-key-in').value.trim();
      const value = document.getElementById('var-val-in').value.trim();
      const data_type = document.getElementById('var-type-in').value;

      const res = await fetch('/api/variables/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value, data_type, app_id: this.activeAppId })
      });
      if (res.ok) {
        this.closeAllModals();
        this.showToast('Global variable added!', 'success');
        this.renderVariables(document.getElementById('content-container'));
      }
    });
  },

  // Upload File Modal
  openUploadFileModal() {
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:440px;">
          <div class="modal-header">
            <h3 style="font-size:16px; font-weight:700;">Upload Encrypted Asset</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="upload-file-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group">
                <label class="form-label">Asset Name / Title</label>
                <input type="text" id="upload-name-in" class="form-control" placeholder="payload_v2.dll" required />
              </div>
              <div class="form-group">
                <label class="form-label">Select File</label>
                <input type="file" id="upload-binary-in" class="form-control" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Upload File</button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('upload-file-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileIn = document.getElementById('upload-binary-in');
      const nameIn = document.getElementById('upload-name-in').value.trim();
      if (!fileIn.files.length) return;

      const formData = new FormData();
      formData.append('file', fileIn.files[0]);
      formData.append('original_name', nameIn);
      formData.append('app_id', this.activeAppId);

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        this.closeAllModals();
        this.showToast('Encrypted asset uploaded successfully!', 'success');
        this.renderFiles(document.getElementById('content-container'));
      }
    });
  },

  // Add Team Member Modal
  openAddTeamModal() {
    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:440px;">
          <div class="modal-header">
            <h3 style="font-size:16px; font-weight:700;">Add Team Member</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <form id="add-team-form">
            <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
              <div class="form-group">
                <label class="form-label">Member Email Address</label>
                <input type="email" id="tm-email" class="form-control" placeholder="partner@domain.com" required />
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select id="tm-role" class="form-control">
                  <option value="Manager">Manager (Full App Delegated Access)</option>
                  <option value="Reseller">Reseller (License Vending Only)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Initial Key Balance (for Resellers)</label>
                <input type="number" id="tm-keys" class="form-control" value="100" min="0" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="ZenithApp.closeAllModals()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Invite Member</button>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('add-team-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('tm-email').value.trim();
      const role = document.getElementById('tm-role').value;
      const key_balance = parseInt(document.getElementById('tm-keys').value, 10);

      const endpoint = role === 'Reseller' ? '/api/team/reseller' : '/api/team/manager';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, key_balance, app_id: this.activeAppId })
      });
      if (res.ok) {
        this.closeAllModals();
        this.showToast('Team member invited successfully', 'success');
        this.renderTeam(document.getElementById('content-container'));
      }
    });
  },

  // Notifications Modal
  async openNotificationsModal() {
    const res = await fetch('/api/notifications');
    const notes = res.ok ? await res.json() : [];

    this.openModal(`
      <div class="modal-backdrop" onclick="if(event.target === this) ZenithApp.closeAllModals()">
        <div class="modal-container" style="max-width:440px;">
          <div class="modal-header">
            <h3 style="font-size:16px; font-weight:700;">System Notifications</h3>
            <button class="sidebar-toggle-btn" onclick="ZenithApp.closeAllModals()">${ZenithIcons.close}</button>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:8px;">
            ${notes.length > 0 ? notes.map(n => `
              <div style="background:#141416; border:1px solid #232328; border-radius:8px; padding:12px;">
                <div style="font-weight:600; color:#fff; font-size:13px;">${n.title}</div>
                <div style="font-size:12px; color:#929292; margin-top:3px;">${n.message}</div>
                <div style="font-size:10.5px; color:#6b7280; margin-top:6px;">${n.created_at || 'Just now'}</div>
              </div>
            `).join('') : '<div style="text-align:center; padding:20px; color:#666;">No unread notifications</div>'}
          </div>
        </div>
      </div>
    `);
  },

  // Logout Function
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    this.user = null;
    this.showToast('Signed out of session', 'info');
    this.renderAuthSplitPage('login');
  }
};

// Global Bootstrapper
document.addEventListener('DOMContentLoaded', () => {
  ZenithApp.init();
});

window.ZenithApp = ZenithApp;
