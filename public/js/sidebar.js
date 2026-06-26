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
  // Theme toggle is handled inline in footer.ejs — sidebar.js only syncs if needed
  const _savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', _savedTheme);

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
      id_proyecto:      form.id_proyecto ? form.id_proyecto.value : null
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
      success: { bg: 'var(--bg-success)', border: 'var(--border-success)', text: 'var(--text-success)', icon: '&#10003;' },
      error:   { bg: 'var(--bg-danger)',  border: 'var(--border-danger)',  text: 'var(--text-danger)',  icon: '&#10005;' },
      warning: { bg: 'var(--bg-warning)', border: 'var(--border-warning)', text: 'var(--text-warning)', icon: '!' },
      info:    { bg: 'var(--bg-accent)',  border: 'var(--border-accent)',  text: 'var(--text-accent)',  icon: 'i' },
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    Object.assign(toast.style, {
      background: c.bg,
      border: `0.5px solid ${c.border}`,
      borderRadius: '6px',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '340px',
      animation: 'fadein 0.25s ease both',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '13px',
    });

    toast.innerHTML = `
      <span style="color:${c.text}; font-weight:600; flex-shrink:0; font-size:12px;">${c.icon}</span>
      <span style="color:var(--text-primary);">${message}</span>
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

  // ─── CAMPANA DE NOTIFICACIONES PARA NUEVAS SOLICITUDES ──────────────────────
  const profileRoleEl = document.querySelector('.sidebar-profile-role');
  if (profileRoleEl) {
    const userRole = profileRoleEl.textContent.trim();
    if (userRole === 'Administrador') {
      setupNotificationBell();
    }
  }

  async function setupNotificationBell() {
    const topbarActions = document.querySelector('.topbar-actions');
    if (!topbarActions) return;

    // Inyectar estilos CSS dinámicamente
    const style = document.createElement('style');
    style.textContent = `
      .notification-bell-container {
        position: relative;
        margin-right: 12px;
        display: flex;
        align-items: center;
      }
      .notification-bell-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 1.25rem;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        transition: background 0.2s;
        color: var(--text-primary);
      }
      .notification-bell-btn:hover {
        background: var(--surface-1);
      }
      .notification-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        width: 300px;
        background: var(--surface-2);
        border: 0.5px solid var(--border-strong);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        display: none;
        padding: 0.75rem;
      }
      .notification-badge {
        position: absolute;
        top: 0px;
        right: 0px;
        background: #ef4444;
        color: white;
        font-size: 9px;
        font-weight: 800;
        padding: 2px 5px;
        border-radius: 99px;
        line-height: 1;
      }
      .notification-item {
        padding: 8px 10px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s ease;
        border: 0.5px solid var(--border);
        background: var(--surface-0);
        margin-bottom: 6px;
      }
      .notification-item:hover {
        background: var(--surface-1);
        border-color: var(--border-strong);
        transform: translateY(-1px);
      }
    `;
    document.head.appendChild(style);

    // Crear la estructura de la campana en el DOM
    const bellContainer = document.createElement('div');
    bellContainer.className = 'notification-bell-container';

    const bellBtn = document.createElement('button');
    bellBtn.className = 'notification-bell-btn';
    bellBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

    const badge = document.createElement('span');
    badge.className = 'notification-badge';
    badge.style.display = 'none';
    bellBtn.appendChild(badge);
    bellContainer.appendChild(bellBtn);

    const dropdown = document.createElement('div');
    dropdown.className = 'notification-dropdown';
    dropdown.innerHTML = `
      <div style="font-weight:500; font-size:12px; margin-bottom:8px; display:flex; justify-content:space-between; border-bottom:0.5px solid var(--border); padding-bottom:8px; color:var(--text-primary);">
        <span>Nuevas Solicitudes</span>
        <span style="color:var(--text-accent); cursor:pointer; font-size:11px;" id="ver-todos-notif">Ver todas</span>
      </div>
      <div class="notification-list" style="display:flex; flex-direction:column; gap:4px; max-height:250px; overflow-y:auto;">
        <div style="text-align:center; color:var(--text-muted); font-size:11px; padding:16px 0;">Cargando...</div>
      </div>
    `;
    bellContainer.appendChild(dropdown);

    // Insertar la campana en la barra de acciones
    topbarActions.insertBefore(bellContainer, topbarActions.firstChild);

    // Manejar el toggle del dropdown
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });

    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const viewAllLink = dropdown.querySelector('#ver-todos-notif');
    if (viewAllLink) {
      viewAllLink.addEventListener('click', () => {
        window.location.href = '/tickets?estado=Solicitado';
      });
    }

    // Consultar solicitudes desde la API
    try {
      const res = await fetch('/api/tickets');
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;

      // Filtrar tickets en estado 'Solicitado'
      const solicitados = json.data.filter(t => t.estado === 'Solicitado');
      const listContainer = dropdown.querySelector('.notification-list');

      if (solicitados.length > 0) {
        badge.textContent = solicitados.length;
        badge.style.display = 'block';

        listContainer.innerHTML = '';
        solicitados.slice(0, 5).forEach(t => {
          const item = document.createElement('div');
          item.className = 'notification-item';
          
          item.addEventListener('click', () => {
            if (t.id_proyecto) {
              window.location.href = `/admin/proyectos/${t.id_proyecto}/config?tab=tickets`;
            } else {
              window.location.href = `/tickets/${t.id}`;
            }
          });

          item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
              <span style="font-weight:500; color:var(--text-accent); font-size:11px; font-family:monospace;">${t.id}</span>
              <span class="badge badge-blue" style="font-size:10px;">Nuevo</span>
            </div>
            <div style="font-weight:500; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:12px; margin-bottom:2px;">
              ${t.titulo}
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted);">
              <span>${t.solicitanteNombre || 'Solicitante'}</span>
              <span style="max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.proyectoNombre || 'Global'}</span>
            </div>
          `;
          listContainer.appendChild(item);
        });

        if (solicitados.length > 5) {
          const moreItem = document.createElement('div');
          moreItem.style.textAlign = 'center';
          moreItem.style.fontSize = '0.65rem';
          moreItem.style.color = 'var(--text-muted)';
          moreItem.style.paddingTop = '0.3rem';
          moreItem.textContent = `+ ${solicitados.length - 5} más solicitudes`;
          listContainer.appendChild(moreItem);
        }
      } else {
        badge.style.display = 'none';
        listContainer.innerHTML = `
          <div style="text-align:center; color:var(--text-muted); font-size:11px; padding:20px 0;">
            Sin nuevas solicitudes pendientes
          </div>
        `;
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }

})();
