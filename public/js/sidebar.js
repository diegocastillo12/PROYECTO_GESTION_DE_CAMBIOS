/**
 * sidebar.js — Control de navegación interactiva según el rol en sesión
 * GestioCambios G04
 */

(function () {
  'use strict';

  // ─── TOGGLE SIDEBAR (MOBILE) ────────────────────────────────────────────────
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const toggleBtn= document.getElementById('sidebar-toggle');

  function openSidebar() {
    sidebar && sidebar.classList.add('open');
    overlay && overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar && sidebar.classList.remove('open');
    overlay && overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  toggleBtn && toggleBtn.addEventListener('click', () => {
    sidebar && sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  overlay && overlay.addEventListener('click', closeSidebar);

  // ─── MARCAR ENLACE ACTIVO ───────────────────────────────────────────────────
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-item[data-path]');

  navItems.forEach(item => {
    const path = item.getAttribute('data-path');
    if (path && (currentPath === path || (path !== '/' && currentPath.startsWith(path)))) {
      item.classList.add('active');
    }
  });

  // ─── CIERRE DE SESIÓN ───────────────────────────────────────────────────────
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn && logoutBtn.addEventListener('click', () => {
    if (confirm('¿Deseas cerrar sesión?')) {
      window.location.href = '/logout';
    }
  });

  // ─── TEMA CLARO / OSCURO ────────────────────────────────────────────────────
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  const themeToggleText = document.getElementById('theme-toggle-text');

  function updateThemeUI(theme) {
    if (theme === 'light') {
      if (themeToggleIcon) themeToggleIcon.textContent = '🌙';
      if (themeToggleText) themeToggleText.textContent = 'Modo Oscuro';
    } else {
      if (themeToggleIcon) themeToggleIcon.textContent = '☀️';
      if (themeToggleText) themeToggleText.textContent = 'Modo Claro';
    }
  }

  // Inicializar UI al cargar
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateThemeUI(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeUI(newTheme);
    });
  }

  // ─── MODALES ────────────────────────────────────────────────────────────────
  window.openModal = function(id) {
    const overlay = document.getElementById(id + '-overlay');
    overlay && overlay.classList.add('open');
  };

  window.closeModal = function(id) {
    const overlay = document.getElementById(id + '-overlay');
    overlay && overlay.classList.remove('open');
  };

  // Cerrar modal con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  });

  // Cerrar modal al hacer clic en overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // ─── CAMBIO DE ESTADO VIA API ───────────────────────────────────────────────
  window.cambiarEstado = async function(ticketId, nuevoEstado) {
    const form = document.getElementById('form-estado-' + nuevoEstado.replace(/\s+/g, '-'));
    const comentario  = document.getElementById('comentario-' + nuevoEstado.replace(/\s+/g, '-'));
    const asignadoId  = document.getElementById('asignado-' + nuevoEstado.replace(/\s+/g, '-'));
    const mergeReq    = document.getElementById('merge-' + nuevoEstado.replace(/\s+/g, '-'));
    const rama        = document.getElementById('rama-' + nuevoEstado.replace(/\s+/g, '-'));

    const payload = {
      nuevoEstado,
      comentario:  comentario  ? comentario.value.trim()  : '',
      asignadoId:  asignadoId  ? asignadoId.value         : '',
      mergeRequest: mergeReq   ? mergeReq.value.trim()    : '',
      rama:         rama       ? rama.value.trim()         : '',
    };

    // QA fields
    const qaAprobado = document.getElementById('qa-aprobado');
    const qaTests    = document.getElementById('qa-tests');
    const qaFailed   = document.getElementById('qa-failed');
    const qaNotes    = document.getElementById('qa-notes');
    if (qaAprobado) payload.qaAprobado = qaAprobado.value;
    if (qaTests)    payload.qaTests    = qaTests.value;
    if (qaFailed)   payload.qaFailed   = qaFailed.value;
    if (qaNotes)    payload.qaNotes    = qaNotes.value;

    try {
      showToast('Procesando cambio de estado…', 'info');

      const resp = await fetch(`/api/tickets/${ticketId}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        showToast(`Estado actualizado a "${nuevoEstado}" ✓`, 'success');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast(data.error || 'Error al cambiar estado.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión con el servidor.', 'error');
    }
  };

  // ─── CREAR TICKET VIA API ───────────────────────────────────────────────────
  window.crearTicket = async function(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('[type="submit"]') || document.getElementById('btn-crear');
    
    const data = {
      titulo:           form.titulo.value.trim(),
      descripcion:      form.descripcion.value.trim(),
      tipo:             form.tipo.value,
      prioridad:        form.prioridad.value,
      impacto:          form.impacto ? form.impacto.value.trim() : '',
      riesgo:           form.riesgo ? form.riesgo.value.trim() : '',
      estimacionHoras:  form.estimacionHoras ? form.estimacionHoras.value : 0,
      etiquetas:        form.etiquetas ? form.etiquetas.value : '',
    };

    if (!data.titulo || !data.descripcion || !data.tipo || !data.prioridad) {
      showToast('Por favor completa todos los campos requeridos.', 'error');
      return;
    }

    try {
      if (submitBtn) submitBtn.disabled = true;
      showToast('Creando solicitud de cambio…', 'info');

      const resp = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await resp.json();

      if (resp.ok && result.success) {
        showToast(`Ticket ${result.ticket.id} creado exitosamente ✓`, 'success');
        setTimeout(() => window.location.href = '/tickets/' + result.ticket.id, 1200);
      } else {
        showToast(result.error || 'Error al crear el ticket.', 'error');
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión.', 'error');
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  // ─── TOAST NOTIFICATIONS ────────────────────────────────────────────────────
  window.showToast = function(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      });
      document.body.appendChild(container);
    }

    const colors = {
      success: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.35)', text: '#4ade80', icon: '✓' },
      error:   { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', text: '#f87171', icon: '✕' },
      warning: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', text: '#fbbf24', icon: '⚠' },
      info:    { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', text: '#60a5fa', icon: 'ℹ' },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    Object.assign(toast.style, {
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: '10px',
      padding: '0.75rem 1.1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      maxWidth: '360px',
      animation: 'fadeInUp 0.3s ease both',
      fontFamily: 'Inter, sans-serif',
      fontSize: '0.85rem',
    });

    toast.innerHTML = `
      <span style="color:${c.text}; font-weight: 700; flex-shrink:0;">${c.icon}</span>
      <span style="color:#e1e1e6;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'none';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // ─── FILTROS DE TABLA (CLIENTE) ─────────────────────────────────────────────
  const searchInput = document.getElementById('search-tickets');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(function () {
      const q = this.value.toLowerCase();
      document.querySelectorAll('.ticket-row').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    }, 200));
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // ─── ANIMACIONES DE ENTRADA ─────────────────────────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fadein');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stat-card, .card, .table-wrapper').forEach(el => {
    observer.observe(el);
  });

})();
