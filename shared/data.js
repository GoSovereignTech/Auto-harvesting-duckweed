/* ===========================================================
   GoSovereign Admin — Mock Data Layer
   Everything here is generated in-browser so the pages run
   standalone (no backend yet). Data model mirrors the spec's
   hierarchical ID scheme: rack-group / rack / tier.
   When the WiFi bridge is wired in, this file is the seam:
   replace MOCK.* getters with real fetch()/socket calls and
   the pages above should keep working unchanged.
=========================================================== */

(function(){

  // ---- seeded PRNG so the mock world is stable across reloads ----
  function mulberry32(seed){
    return function(){
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0;}return h;}
  function rand(seedStr){return mulberry32(hashStr(seedStr));}
  function pick(rng, arr){return arr[Math.floor(rng()*arr.length)];}
  function round1(n){return Math.round(n*10)/10;}

  const NOW = new Date('2026-08-09T14:20:00');
  function minutesAgo(m){return new Date(NOW.getTime() - m*60000);}
  function fmtTime(d){return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}
  function fmtRel(d){
    const mins = Math.round((NOW - d)/60000);
    if(mins < 1) return 'just now';
    if(mins < 60) return mins+'m ago';
    const hrs = Math.round(mins/60);
    if(hrs < 24) return hrs+'h ago';
    return Math.round(hrs/24)+'d ago';
  }

  // ---- Racks & tiers -----------------------------------------
  // Naming follows the rack-group/rack/tier scheme: A1-R01 etc.
  const AISLES = ['A1','A2'];
  const RACKS_PER_AISLE = 6;
  const TIERS = 7;

  const racks = [];
  AISLES.forEach((aisle, ai)=>{
    for(let r=1; r<=RACKS_PER_AISLE; r++){
      const id = `${aisle}-R${String(r).padStart(2,'0')}`;
      const rng = rand(id);
      const tiers = [];
      for(let t=1; t<=TIERS; t++){
        const tierId = `${id}-T${t}`;
        const trng = rand(tierId);
        let coverage = round1(trng()*100);
        // bias a few tiers high so the queue has real candidates
        if(trng() < 0.22) coverage = round1(78 + trng()*20);
        const anaerobicRoll = trng();
        const anaerobic = anaerobicRoll < 0.05;
        const damageRoll = trng();
        const damage = damageRoll < 0.08;
        const status = anaerobic ? 'anaerobic'
          : coverage >= 80 ? 'ready'
          : (trng() < 0.1 ? 'harvesting' : 'growing');
        tiers.push({
          id: tierId, tier: t, coverage, status, anaerobic, damageFlag: damage,
          lastInspected: minutesAgo(Math.round(trng()*180)),
          lastHarvest: minutesAgo(Math.round(2000 + trng()*8000)),
        });
      }
      racks.push({
        id, aisle, num:r,
        gps: { lat: round1(6.52 + ai*0.004 + r*0.0007), lng: round1(-1.61 - r*0.0006) },
        position: `Aisle ${aisle} · Bay ${r}`,
        ph: round1(6.4 + rng()*1.3),
        dox: round1(3.5 + rng()*4.5),
        orp: Math.round(120 + rng()*180),
        reservoirLevel: Math.round(55 + rng()*40),
        makeupActive: rng() < 0.15,
        tiers,
      });
    }
  });

  function allTiers(){
    return racks.flatMap(r => r.tiers.map(t => ({...t, rackId:r.id, position:r.position})));
  }

  // ---- Robots --------------------------------------------------
  const ROBOT_STATUSES = ['harvesting','traveling','inspecting','idle','charging','cleaning','error'];
  const robots = ['HR-01','HR-02','HR-03','HR-04','HR-05'].map((id,i)=>{
    const rng = rand(id);
    const rack = racks[Math.floor(rng()*racks.length)];
    const tier = 1 + Math.floor(rng()*TIERS);
    const status = i===3 ? 'error' : i===4 ? 'charging' : pick(rng, ['harvesting','traveling','inspecting','idle']);
    const battery = status==='charging' ? Math.round(20+rng()*30) : Math.round(48+rng()*50);
    const log = [];
    let t = 0;
    const events = [
      'Departed dock, en route to assigned rack',
      'Arrived at rack, beginning tier sweep',
      'RGB scan complete — coverage logged',
      'Spectral scan complete — no anomalies',
      'Spectral scan flagged possible vascular damage',
      'Antibacterial spray cycle triggered',
      'Skimmer deployed, harvest in progress',
      'Harvest complete, transferring to wagon coupling',
      'Returned to charge dock',
      'Full rack cleaning protocol started',
      'PAA soak cycle 3 of 5 in progress',
    ];
    for(let e=0; e<6; e++){
      t += Math.round(6 + rng()*40);
      log.push({ time: minutesAgo(t), message: pick(rng, events) });
    }
    log.sort((a,b)=> a.time - b.time);
    return {
      id, label:`Harvest Robot ${id.split('-')[1]}`,
      status, battery,
      rackId: rack.id, tier,
      position: `${rack.position} · Tier ${tier}`,
      gps: rack.gps,
      task: status==='harvesting' ? `Harvesting ${rack.id} T${tier}`
        : status==='inspecting' ? `Scanning ${rack.id} T${tier}`
        : status==='traveling' ? `Repositioning to ${rack.id}`
        : status==='cleaning' ? `Full clean cycle — ${rack.id}`
        : status==='error' ? `Fault: rack-and-pinion drive stall`
        : status==='charging' ? 'On dock, charging' : 'Awaiting dispatch',
      lastSeen: minutesAgo(Math.round(rng()*6)),
      log,
    };
  });

  // ---- Harvest queue --------------------------------------------
  const queue = allTiers()
    .filter(t => t.status==='ready' || t.status==='harvesting')
    .sort((a,b)=> b.coverage - a.coverage)
    .map((t,i)=>({
      id:`Q-${t.id}`, rackId:t.rackId, tier:t.tier, tierRef:t.id,
      coverage:t.coverage, position:i+1,
      status: t.status==='harvesting' ? 'in-progress' : (i<2 ? 'next-up' : 'queued'),
      queuedAt: minutesAgo(Math.round(10+i*35)),
      etaMin: 6 + i*11,
    }));

  // ---- Alerts ------------------------------------------------
  const alerts = [];
  racks.forEach(r=>{
    r.tiers.forEach(t=>{
      if(t.anaerobic){
        alerts.push({
          id:`AL-${t.id}-ana`, severity:'critical', rackId:r.id, tier:t.tier,
          title:'Tier gone anaerobic', detail:`${t.id} dissolved-oxygen reading collapsed — full rack cleaning protocol recommended.`,
          time: minutesAgo(Math.round(3+Math.random()*40)), acknowledged:false,
        });
      }
      if(t.damageFlag){
        alerts.push({
          id:`AL-${t.id}-dmg`, severity:'warning', rackId:r.id, tier:t.tier,
          title:'Vascular damage flagged', detail:`Spectral scan on ${t.id} flagged possible midge damage. Antibacterial spray armed pending confirmation.`,
          time: minutesAgo(Math.round(5+Math.random()*90)), acknowledged:false,
        });
      }
    });
    if(r.reservoirLevel < 60){
      alerts.push({
        id:`AL-${r.id}-lvl`, severity:'info', rackId:r.id, tier:null,
        title:'Reservoir make-up water running', detail:`${r.id} main reservoir below target level — make-up valve active.`,
        time: minutesAgo(Math.round(2+Math.random()*20)), acknowledged:false,
      });
    }
  });
  robots.filter(r=>r.status==='error').forEach(r=>{
    alerts.push({
      id:`AL-${r.id}-err`, severity:'critical', rackId:r.rackId, tier:r.tier, robotId:r.id,
      title:`${r.id} reporting a fault`, detail:r.task+'. Robot has parked in place and is awaiting manual review.',
      time: r.lastSeen, acknowledged:false,
    });
  });
  alerts.sort((a,b)=> b.time - a.time);

  // ---- Snapshot / imaging history -----------------------------
  const snapshots = [];
  allTiers().forEach(t=>{
    const rng = rand(t.id+'-snap');
    const n = 1 + Math.floor(rng()*3);
    for(let i=0;i<n;i++){
      const id = `${t.id}-S${i}`;
      snapshots.push({
        id, rackId:t.rackId, tier:t.tier, tierId:t.id,
        robotId: pick(rng, robots).id,
        time: minutesAgo(Math.round(i*300 + rng()*600)),
        coverageReading: round1(Math.max(0, t.coverage - i*6 + (rng()*6-3))),
        damageDetected: rng() < 0.1,
        reviewed: rng() < 0.35 ? (rng()<0.85 ? 'confirmed' : 'overridden') : null,
      });
    }
  });
  snapshots.sort((a,b)=> b.time - a.time);

  // ---- System-wide metrics -------------------------------------
  const system = {
    tempC: 27.4, humidity: 68, electricityPct: 74, waterCatchmentPct: 61,
    commsHealth: 'nominal', // nominal | degraded | offline
    activeRobots: robots.filter(r=>['harvesting','traveling','inspecting'].includes(r.status)).length,
    totalRobots: robots.length,
    harvestsQueued: queue.length,
    racksAnaerobic: racks.filter(r=>r.tiers.some(t=>t.anaerobic)).length,
    generatedAt: NOW,
  };

  // ---- Canvas thumbnail renderers (stand-in for real camera feed) --
  function drawRGB(canvas, coveragePct, seed){
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const rng = rand(seed+'-rgb');
    const water = ctx.createLinearGradient(0,0,0,h);
    water.addColorStop(0,'#1c4a52'); water.addColorStop(1,'#0d2b30');
    ctx.fillStyle = water; ctx.fillRect(0,0,w,h);
    const blobCount = Math.round((coveragePct/100) * 90);
    for(let i=0;i<blobCount;i++){
      const x = rng()*w, y = rng()*h, r = 2.2 + rng()*3.4;
      const g = 130 + Math.floor(rng()*70);
      ctx.fillStyle = `rgba(${60+rng()*40|0},${g},${40+rng()*30|0},0.9)`;
      ctx.beginPath(); ctx.ellipse(x,y,r,r*0.8,rng()*Math.PI,0,Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.strokeRect(0,0,w,h);
  }
  function drawSpectral(canvas, damage, seed){
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const rng = rand(seed+'-spec');
    const img = ctx.createImageData(w,h);
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const idx = (y*w+x)*4;
        const n = (Math.sin(x*0.15+seed.length)+Math.sin(y*0.2)+rng()*0.6)/2.6; // -ish 0..1 noise
        const v = Math.max(0, Math.min(1, 0.5 + n*0.5));
        // turbo-ish colormap: blue -> green -> yellow -> red
        let r,g,b;
        if(v < 0.33){ r=20; g=Math.floor(60+v*3*180); b=180-Math.floor(v*3*100); }
        else if(v < 0.66){ const k=(v-0.33)*3; r=Math.floor(k*230); g=200; b=40; }
        else { const k=(v-0.66)*3; r=230; g=Math.floor(200-k*180); b=30; }
        img.data[idx]=r; img.data[idx+1]=g; img.data[idx+2]=b; img.data[idx+3]=255;
      }
    }
    ctx.putImageData(img,0,0);
    if(damage){
      const cx = w*(0.3+rng()*0.4), cy = h*(0.3+rng()*0.4);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx,cy,10,0,Math.PI*2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(cx,cy,16,0,Math.PI*2); ctx.stroke();
    }
  }

  window.MOCK = {
    NOW, racks, robots, queue, alerts, snapshots, system,
    allTiers, fmtTime, fmtRel, rand, pick,
    findRack:(id)=> racks.find(r=>r.id===id),
    findRobot:(id)=> robots.find(r=>r.id===id),
    findTier:(id)=> allTiers().find(t=>t.id===id),
    drawRGB, drawSpectral,
  };
})();
