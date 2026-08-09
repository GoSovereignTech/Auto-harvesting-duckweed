/* ===========================================================
   GoSovereign Admin — App shell
   Renders the sidebar + topbar into every page and exposes
   small shared UI helpers (toast, locate-robot modal).
=========================================================== */

(function(){
  const ICONS = {
    dashboard:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-5H4v5Zm10-11h6V4h-6v5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    robots:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="5" y="8" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M9 8V5a3 3 0 0 1 6 0v3M9 13h.01M15 13h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    racks:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="10" width="16" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="17" width="16" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>',
    queue:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h10M4 18h13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    controls:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h6M14 6h6M4 12h10M18 12h2M4 18h4M12 18h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="6" r="2" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="12" r="2" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="18" r="2" stroke="currentColor" stroke-width="1.6"/></svg>',
    snapshots:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 6 10 3h4l2 3" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.2" stroke="currentColor" stroke-width="1.6"/></svg>',
    reports:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12h6M9 16h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    menu:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };

  const NAV = [
    {id:'dashboard', href:'index.html', label:'Dashboard', icon:ICONS.dashboard},
    {id:'robots', href:'robots.html', label:'Robots', icon:ICONS.robots},
    {id:'racks', href:'racks.html', label:'Racks & Tiers', icon:ICONS.racks},
    {id:'queue', href:'queue.html', label:'Harvest Queue', icon:ICONS.queue},
    {id:'controls', href:'controls.html', label:'Admin Controls', icon:ICONS.controls},
    {id:'snapshots', href:'snapshots.html', label:'Image Review', icon:ICONS.snapshots},
    {id:'reports', href:'reports.html', label:'Reports & Alerts', icon:ICONS.reports},
  ];

  function rackGlyphSVG(){
    return `<svg class="brand-mark" viewBox="0 0 30 34" fill="none">
      <rect x="1" y="1" width="28" height="3.2" rx="1" fill="var(--duckweed)"/>
      <rect x="1" y="6" width="28" height="3.2" rx="1" fill="var(--duckweed)" opacity=".85"/>
      <rect x="1" y="11" width="20" height="3.2" rx="1" fill="var(--duckweed)" opacity=".7"/>
      <rect x="1" y="16" width="25" height="3.2" rx="1" fill="var(--duckweed)" opacity=".55"/>
      <rect x="1" y="21" width="14" height="3.2" rx="1" fill="var(--amber)" opacity=".8"/>
      <rect x="1" y="26" width="28" height="3.2" rx="1" fill="var(--duckweed)" opacity=".35"/>
      <rect x="1" y="30.5" width="28" height="3" rx="1.5" fill="var(--water)"/>
    </svg>`;
  }

  function renderShell(active){
    const alertCount = (window.MOCK ? window.MOCK.alerts.filter(a=>!a.acknowledged).length : 0);
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('topbar');
    if(sidebar){
      sidebar.innerHTML = `
        <div class="brand">
          ${rackGlyphSVG()}
          <div class="brand-text">GoSovereign<span>DUCKWEED OPS</span></div>
        </div>
        <div class="nav-group">
          <div class="eyebrow nav-label">Operate</div>
          ${NAV.slice(0,5).map(navLink).join('')}
        </div>
        <div class="nav-group">
          <div class="eyebrow nav-label">Review</div>
          ${NAV.slice(5).map(navLink).join('')}
        </div>
        <div class="sidebar-foot mono">FACILITY A · 12 RACKS · 5 ROBOTS<br>build v0.1 — mock data</div>
      `;
      function navLink(item){
        const badge = item.id==='reports' && alertCount>0 ? `<span class="nav-badge alert">${alertCount}</span>` : '';
        return `<a class="nav-link ${item.id===active?'active':''}" href="${item.href}">${item.icon}<span>${item.label}</span>${badge}</a>`;
      }
    }
    if(topbar){
      const title = NAV.find(n=>n.id===active);
      topbar.innerHTML = `
        <button class="menu-btn" id="menuBtn" aria-label="Toggle navigation">${ICONS.menu}</button>
        <div class="topbar-title">${title?title.label:'GoSovereign'}<span>Facility A — live mock feed</span></div>
        <div class="status-chip"><span class="status-dot pulse"></span>WiFi backbone nominal</div>
        <div class="status-chip"><span class="status-dot ${alertCount>0?'warn':''}"></span>${alertCount} open alert${alertCount===1?'':'s'}</div>
        <div class="status-chip mono" id="clockChip">--:--</div>
      `;
      const menuBtn = document.getElementById('menuBtn');
      if(menuBtn) menuBtn.addEventListener('click', ()=> sidebar.classList.toggle('open'));
      const clock = document.getElementById('clockChip');
      if(clock){
        const tick = ()=> clock.textContent = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
        tick(); setInterval(tick, 1000);
      }
    }
    if(!document.getElementById('toast-host')){
      const host = document.createElement('div');
      host.id = 'toast-host';
      document.body.appendChild(host);
    }
  }

  function toast(message, opts){
    opts = opts || {};
    const host = document.getElementById('toast-host');
    const el = document.createElement('div');
    el.className = 'toast';
    el.style.borderLeftColor = opts.color || 'var(--water)';
    el.textContent = message;
    host.appendChild(el);
    setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .25s'; setTimeout(()=>el.remove(),250); }, opts.duration || 3200);
  }

  function locateRobot(robot){
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal">
        <div class="row-between" style="margin-bottom:14px;">
          <h3 style="margin:0;">Locate ${robot.id}</h3>
          <span class="status-dot pulse" style="background:var(--water-bright)"></span>
        </div>
        <p class="muted" style="margin:0 0 14px;font-size:13px;">Sending an audible chirp + status-LED strobe to the unit and requesting a fresh position fix.</p>
        <div class="card card-tight mono" style="font-size:12.5px;line-height:1.9;">
          RACK/AISLE&nbsp;&nbsp;${robot.position}<br>
          GPS&nbsp;&nbsp;${robot.gps.lat.toFixed(4)}, ${robot.gps.lng.toFixed(4)}<br>
          LAST SEEN&nbsp;&nbsp;${window.MOCK.fmtRel(robot.lastSeen)}
        </div>
        <div class="row" style="margin-top:18px;justify-content:flex-end;">
          <button class="btn btn-ghost" id="locateClose">Close</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
    backdrop.querySelector('#locateClose').addEventListener('click', ()=> backdrop.remove());
    toast(`Locate signal sent to ${robot.id} — chirp + LED strobe active`, {color:'var(--water-bright)'});
  }

  window.APP = { renderShell, toast, locateRobot, NAV };
})();
