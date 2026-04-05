// Universal Supabase Sync — wraps localStorage to also sync to cloud
(async function(){
  const PREFIX = document.title.replace(/[^a-zA-Z]/g,'_').toLowerCase().slice(0,5) + '_';
  let supa=null,ok=false;
  if(typeof SUPABASE_URL!=='undefined' && SUPABASE_URL && !SUPABASE_URL.includes('YOUR_')){
    try{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      document.head.appendChild(s);
      await new Promise(r=>s.onload=r);
      supa=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
      await supa.from('kv_store').select('key').limit(1);
      ok=true;console.log('[Sync] ✅ Connected');
    }catch(e){console.warn('[Sync] Offline:',e.message)}
  }
  // Monkey-patch localStorage
  const _setItem=localStorage.setItem.bind(localStorage);
  const _getItem=localStorage.getItem.bind(localStorage);
  if(ok){
    const origSet=localStorage.setItem;
    localStorage.setItem=function(k,v){
      origSet.call(localStorage,k,v);
      supa.from('kv_store').upsert({key:k,value:JSON.parse(v),updated_at:new Date().toISOString()},{onConflict:'key'}).catch(()=>{});
    };
    // Initial sync from cloud
    try{
      const{data}=await supa.from('kv_store').select('key,value').like('key',PREFIX+'%');
      if(data)for(const r of data)_setItem(r.key,JSON.stringify(r.value));
    }catch{}
  }
  window.SUPABASE_SYNC=ok;
})();
