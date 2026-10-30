(()=> {
  'use strict';

  // ---------- URL 參數 ----------
  function q(name, fallback = '') {
    const v = new URLSearchParams(location.search).get(name);
    return v == null ? fallback : v;
  }

  // ---------- Session / Token（前端示範用） ----------
  function getSession(){ try{ return localStorage.getItem('session') || ''; }catch{ return ''; } }
  function setSession(email){ localStorage.setItem('session', email); }
  function clearSession(){ localStorage.removeItem('session'); }
  function getToken(){ try{ return localStorage.getItem('token') || ''; }catch{ return ''; } }

  // ---------- 履歷儲存（key: job:*，value: {jobId, createdAt, images, ...}） ----------
  const JOB_PREFIX = 'job:';

  function saveJob(jobId, payload){
    if(!jobId) return null;
    const row = { jobId, createdAt: Date.now(), ...payload };
    localStorage.setItem(JOB_PREFIX + jobId, JSON.stringify(row));
    return row;
  }

  function loadJob(jobId){
    if(!jobId) return null;
    try{
      const s = localStorage.getItem(JOB_PREFIX + jobId);
      return s ? JSON.parse(s) : null;
    }catch{ return null; }
  }

  function deleteLocalJob(jobId){
    localStorage.removeItem(JOB_PREFIX + jobId);
  }

  function listLocalJobs(){
    const rows = [];
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(k && k.startsWith(JOB_PREFIX)){
        try{
          const v = JSON.parse(localStorage.getItem(k) || 'null');
          if(v) rows.push(v);
        }catch{}
      }
    }
    rows.sort((a,b)=> (b?.createdAt||0) - (a?.createdAt||0));
    return rows;
  }

  // ---------- 圖片載入（容忍 CORS 失敗 → 回傳 null） ----------
  async function loadImageSafe(url){
    try{
      const res = await fetch(url, { mode:'cors', cache:'no-store' });
      if(!res.ok) throw new Error('HTTP '+res.status);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const img = await new Promise((resolve, reject)=>{
        const im = new Image();
        im.onload = () => { URL.revokeObjectURL(objUrl); resolve(im); };
        im.onerror = reject;
        im.src = objUrl;
      });
      return img;
    }catch{
      return null;
    }
  }

  // ---------- 合成 2×2（回傳 dataURL；缺圖可顯示占位） ----------
  async function compose2x2(urls, { size=1024, allowPlaceholders=true } = {}){
    const src = (Array.isArray(urls) && urls.length === 4)
      ? urls
      : ['demo/1.jpg','demo/2.jpg','demo/3.jpg','demo/4.jpg'];

    const can = document.createElement('canvas');
    can.width = can.height = size;
    const g = can.getContext('2d');

    // 白底
    g.fillStyle = '#fff';
    g.fillRect(0,0,size,size);

    const cell = size/2;
    const pad  = 8;

    const drawPh = (idx)=>{
      const x = (idx % 2) * cell, y = Math.floor(idx/2) * cell;
      g.fillStyle = '#f1f5f9';
      g.fillRect(x+pad, y+pad, cell-2*pad, cell-2*pad);
      g.strokeStyle = '#cbd5e1';
      g.strokeRect(x+pad+.5, y+pad+.5, cell-2*pad-1, cell-2*pad-1);
      g.fillStyle = '#0f172a';
      g.font = 'bold 28px system-ui,-apple-system,Segoe UI,Roboto';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('Panel '+(idx+1), x + cell/2, y + cell/2);
    };

    for(let i=0;i<4;i++){
      const x = (i % 2) * cell, y = Math.floor(i/2) * cell;
      const img = await loadImageSafe(src[i]);
      if(img){
        const box = cell - 2*pad;
        const r = img.width / img.height;
        let w, h;
        if(r >= 1){ w = box; h = box/r; } else { w = box*r; h = box; }
        const sx = x + (cell - w)/2, sy = y + (cell - h)/2;
        g.drawImage(img, sx, sy, w, h);
      }else if(allowPlaceholders){
        drawPh(i);
      }else{
        throw new Error('compose2x2: 圖片載入失敗且未允許占位格');
      }
    }

    return can.toDataURL('image/png');
  }

  // ---------- 下載工具（dataURL / blob: 皆可） ----------
  function downloadDataUrl(dataUrl, filename='download.png'){
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

  // ---------- 導覽列可視控制：登入時顯示「我的漫畫」 ----------
  function setupNavVisibility(){
    const loggedIn = !!(getSession() || getToken());
    const el = document.getElementById('linkMy');
    if(el) el.hidden = !loggedIn;
  }
  document.addEventListener('DOMContentLoaded', setupNavVisibility);

  // ---------- 對外輸出 ----------
  window.q = q;
  window.getSession = getSession;
  window.setSession = setSession;
  window.clearSession = clearSession;
  window.getToken = getToken;

  window.saveJob = saveJob;
  window.loadJob = loadJob;
  window.deleteLocalJob = deleteLocalJob;
  window.listLocalJobs = listLocalJobs;

  window.compose2x2 = compose2x2;
  window.downloadDataUrl = downloadDataUrl;
  window.setupNavVisibility = setupNavVisibility;
})();