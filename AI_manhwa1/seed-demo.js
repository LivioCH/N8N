// ===== 僅在前端示範環境使用（正式上線請移除）=====
(function seedDemoForFrontend(){
  try{
    // 1) 注入示範用戶（若未存在）
    const USERS_KEY = 'users';
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if(!users.some(u => u.email === 'demo@example.com')){
      users.push({ name:'示範用戶', email:'demo@example.com', pw:'demo1234' });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // 2) 注入 2 筆示範漫畫（若尚無 job:*）
    const hasAnyJob = Array.from({length: localStorage.length}, (_,i)=>localStorage.key(i))
      .some(k => k && k.startsWith('job:'));
    if(!hasAnyJob && typeof window.saveJob === 'function'){
      const now = Date.now();
      [now-600000, now-300000].forEach((id, idx)=>{
        window.saveJob(String(id), {
          images: ['demo/1.jpg','demo/2.jpg','demo/3.jpg','demo/4.jpg'],
          prompts: { title: 'DEMO '+(idx+1) }
        });
      });
    }

    // 3) 依登入狀態顯示「我的漫畫」
    if(typeof window.setupNavVisibility === 'function'){
      window.setupNavVisibility();
    }
  }catch(e){
    console.warn('demo seed skipped:', e);
  }
})();