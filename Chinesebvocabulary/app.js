(function(){
'use strict';
const EDIT_KEY='bsl-theme-words-edit-v1';
const EDIT_PWD='bsl2026';
let DATA = loadLocalData();
function loadLocalData(){
  try{
    const raw=localStorage.getItem(EDIT_KEY);
    if(raw){
      const obj=JSON.parse(raw);
      if(obj && obj.version===window.BSL_DATA.version && Array.isArray(obj.topics)) return obj;
    }
  }catch(e){}
  return window.BSL_DATA;
}
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const ESC = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>ESC[c]);
/* ---------- 自測遮罩 ---------- */
function maskField(key, html){
  if(!state.maskOn || !state.mask[key]) return html;
  return `<span class="masked-field" data-mask-field="${key}" title="${T('點一下顯示')}">${html}</span>`;
}

/* ---------- 繁简 ---------- */
const FALLBACK = {'這':'这','個':'个','與':'与','為':'为','們':'们','國':'国','學':'学','說':'说','話':'话','時':'时','間':'间','來':'来','後':'后','現':'现','會':'会','進':'进','車':'车','開':'开','關':'关','裡':'里','過':'过','發':'发','對':'对','於':'于','經':'经','濟':'济','際':'际','動':'动','傳':'传','統':'统','衛':'卫','術':'术','廳':'厅','樹':'树','葉':'叶','綠':'绿','張':'张','買':'买','賣':'卖','價':'价','錢':'钱','婦':'妇','兒':'儿','鄰':'邻','顧':'顾','靜':'静','聲':'声','響':'响','遠':'远','近':'近','線':'线','臉':'脸','顏':'颜','樣':'样','內':'内','兩':'两','種':'种','廚':'厨','電':'电','腦':'脑','機':'机','驗':'验','習':'习','慣':'惯','寶':'宝','記':'记','憶':'忆','規':'规','訓':'训','練':'练','級':'级','嚴':'严','紅':'红','褲':'裤','雖':'虽','卻':'却','認':'认','識':'识','別':'别','問':'问','題':'题','應':'应','該':'该','選':'选','擇':'择','標':'标','誌':'志','續':'续','爭':'争','傷':'伤','害':'害','淚':'泪','聽':'听','見':'见','講':'讲','誰':'谁','無':'无','論':'论','則':'则','總':'总','結':'结','環':'环','境':'境','護':'护','染':'染','膠':'胶','資':'资','源':'源','節':'节','約':'约','減':'减','氣':'气','體':'体','變':'变','衝':'冲','擊':'击','議':'议','證':'证','據':'据','點':'点','積':'积','極':'极','值':'值','觀':'观','念':'念','承':'承','歷':'历','史':'史','責':'责','任':'任','義':'义','務':'务','權':'权','益':'益','參':'参','網':'网','絡':'络','銷':'销','售':'售','費':'费','額':'额','準':'准','備':'备','態':'态','構':'构','滅':'灭','絕':'绝','類':'类','聯':'联','繫':'系','監':'监','測':'测','審':'审','查':'查','處':'处','理':'理','策':'策','評':'评','估':'估','項':'项','計':'计','劃':'划','訊':'讯','息':'息','靈':'灵','活':'活','質':'质','量':'量','優':'优','劣':'劣','勢':'势','確':'确','鋒':'锋','語':'语','詞':'词','句':'句','重':'重','點':'点','漢':'汉','華':'华','臺':'台','灣':'湾','風':'风','俗':'俗','習':'习','慣':'惯','傳':'传','統':'统','價':'价','值':'值'};
const urlLang = new URLSearchParams(location.search).get('lang');
let lang = urlLang==='hans' || urlLang==='hant' ? urlLang : (localStorage.getItem('bsl-lang')==='hans'?'hans':'hant');
let converter = null, converterToTrad = null;
try{
  converter = window.OpenCC && OpenCC.Converter && OpenCC.Converter({from:'tw',to:'cn'});
  converterToTrad = window.OpenCC && OpenCC.Converter && OpenCC.Converter({from:'cn',to:'tw'});
}catch(e){}
function T(s){
  s = s==null ? '' : String(s);
  if(lang!=='hans') return s;
  if(converter){ try{ return converter(s); }catch(e){} }
  return [...s].map(c=>FALLBACK[c]||c).join('');
}
function setLang(next){
  lang = next;
  localStorage.setItem('bsl-lang',lang);
  document.documentElement.lang = lang==='hans'?'zh-CN':'zh-Hant';
  $$('#langSeg button').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
  $('#search').placeholder = T($('#search').dataset.phHant);
  $$('[data-zh]').forEach(el=>{
    if(!el.dataset.hant) el.dataset.hant=el.textContent;
    el.textContent = T(el.dataset.hant);
  });
  render();
}

/* ---------- state / index ---------- */
const state = {theme:'all', topic:'all', query:'', revealAll:false, shuffle:false, limit:80, editing:false, flash:false, flashHint:'en', maskOn:false, mask:{py:false,en:false,term:false}};
let index = []; // {id,item,topic,theme}
let themeById = {};
let idxMap = {};
function rebuildIndex(){
  index = []; themeById = {};
  DATA.themes.forEach(th=>{
    themeById[th.id]=th;
    DATA.topics.filter(t=>t.theme===th.id).forEach(tp=>{
      tp.items.forEach((it,i)=>index.push({id:tp.id+'#'+i,item:it,topic:tp,theme:th}));
    });
  });
  idxMap = Object.fromEntries(index.map(x=>[x.id,x]));
}
rebuildIndex();
const favKey='bsl-theme-words-fav-v1';
let fav = new Set();
try{ fav = new Set(JSON.parse(localStorage.getItem(favKey)||'[]')); }catch(e){}
function saveFav(){ localStorage.setItem(favKey,JSON.stringify([...fav])); $('#favCount').textContent=fav.size; $('#drawerCount').textContent=fav.size; }

/* ---------- helpers ---------- */
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),1900); }
function primaryText(entry){
  const it=entry.item;
  if(it.kind==='sentence') return it.answer||it.en;
  return it.term||it.text||'';
}
function searchBlob(entry){
  const it=entry.item;
  return [it.term,it.py,it.en,it.meaning,it.ex,it.keywords,it.answer,it.text,it.cat,
          entry.topic.title,entry.theme.name].filter(Boolean).join(' ').toLowerCase();
}
function filtered(){
  let q=state.query.trim().toLowerCase();
  // 简体中输入的关键词先转回繁体，才能匹配原文数据
  if(lang==='hans' && converterToTrad && /[\u4e00-\u9fff]/.test(q)){
    try{ q=converterToTrad(q).toLowerCase(); }catch(e){}
  }
  let list = index;
  if(q){
    list = list.filter(e=>searchBlob(e).includes(q));
    const scored = list.map(e=>{
      const t=(e.item.term||'').toLowerCase();
      return {e,score:t.startsWith(q)?0:(t.includes(q)?1:3)};
    }).sort((a,b)=>a.score-b.score);
    return scored.map(x=>x.e);
  }
  if(state.theme!=='all') list=list.filter(e=>e.theme.id===state.theme);
  if(state.topic!=='all') list=list.filter(e=>e.topic.id===state.topic);
  if(state.shuffle) list=[...list].sort(()=>Math.random()-.5);
  return list;
}
function kindLabel(entry){
  if(entry.item.kind==='sentence') return T('重點句');
  if(entry.item.kind==='note') return T('知識點');
  return /成語|俗語/.test(entry.topic.title) ? T('成語俗語') : T('詞語');
}
/* ---------- 朗讀（語音合成） ---------- */
let voicesCache=[];
function loadVoices(){ try{ voicesCache=speechSynthesis.getVoices()||[]; }catch(e){} }
if('speechSynthesis' in window){
  loadVoices();
  try{ speechSynthesis.onvoiceschanged=loadVoices; }catch(e){}
  // 部分瀏覽器語音異步載入，稍後再抓一次
  setTimeout(loadVoices,500); setTimeout(loadVoices,1500);
}
function pickVoice(targetLang){
  if(!voicesCache.length) loadVoices();
  const want=targetLang.toLowerCase();
  let v=voicesCache.find(x=>x.lang.toLowerCase()===want);
  if(v) return v;
  const prefix=want.split('-')[0]; // en / zh
  return voicesCache.find(x=>x.lang.toLowerCase().startsWith(prefix))||null;
}
function speak(text){
  if(!text || !('speechSynthesis' in window)) { toast(T('這個瀏覽器不支援朗讀')); return; }
  const targetLang=lang==='hans'?'zh-CN':'zh-TW'; // 只用中文語音
  try{ speechSynthesis.cancel(); }catch(e){}
  // Chrome 的 cancel→speak 競態：延遲一點再讀，否則第一次常沒聲音
  setTimeout(()=>{
    try{
      const u=new SpeechSynthesisUtterance(text);
      u.lang=targetLang;
      const v=pickVoice(targetLang);
      if(v) u.voice=v;
      u.rate=0.92;
      u.onerror=(ev)=>{ if(ev && ev.error!=='interrupted' && ev.error!=='canceled') toast(T('朗讀失敗，請檢查瀏覽器語音設定')); };
      speechSynthesis.speak(u);
      // 若語音列表此刻為空，註冊一次就緒後重試
      if(!voicesCache.length && speechSynthesis.onvoiceschanged!==undefined){
        const retry=()=>{ loadVoices(); speechSynthesis.onvoiceschanged=null; };
        speechSynthesis.onvoiceschanged=retry;
      }
    }catch(e){ toast(T('朗讀失敗，請檢查瀏覽器語音設定')); }
  },120);
}

/* ---------- rendering ---------- */
function renderThemes(){
  const grid=$('#themeGrid');
  grid.innerHTML = DATA.themes.map(th=>{
    const ratio=Math.round(th.count/DATA.total*100);
    return `<button class="theme-card ${state.theme===th.id?'active':''}" style="--tc:${th.color}" data-theme="${th.id}">
      <span class="theme-num">${th.num} / ${esc(T(th.en))}</span><span class="theme-icon">${th.icon}</span>
      <h3>${esc(T(th.name))}</h3><div class="theme-en">${esc(T(th.desc))}</div>
      <div class="theme-foot"><span>${th.count} ${T('筆重點')}</span><span>${ratio}%</span></div>
      <div class="bar"><i style="width:${ratio}%"></i></div></button>`;
  }).join('');
  grid.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{
    state.theme = state.theme===b.dataset.theme?'all':b.dataset.theme;
    state.topic='all'; state.limit=80; state.query=''; $('#search').value='';
    $('#clearSearch').classList.remove('show');
    render();
    $('#workspace').scrollIntoView({behavior:'smooth',block:'start'});
  }));
}
function renderTabs(){
  const box=$('#topicTabs');
  if(state.theme==='all' || state.query){ box.innerHTML=''; return; }
  const list=DATA.topics.filter(t=>t.theme===state.theme);
  box.innerHTML = `<button class="tab ${state.topic==='all'?'active':''}" data-topic="all">${T('全部')}<span class="n">${themeById[state.theme].count}</span></button>`+
    list.map(t=>`<button class="tab ${state.topic===t.id?'active':''}" data-topic="${t.id}">${esc(T(t.title))}<span class="n">${t.items.length}</span></button>`).join('');
  box.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{
    state.topic=b.dataset.topic; state.limit=80; render();
  }));
}
function renderStats(){
  $('#heroStats').innerHTML=`
    <div class="stat"><b>${DATA.themes.length}</b><span>${T('大主題')}</span></div>
    <div class="stat"><b>${DATA.topics.length}</b><span>${T('個話題')}</span></div>
    <div class="stat"><b>${DATA.total}</b><span>${T('筆重點內容')}</span></div>`;
}
function cardHTML(entry,idx){
  const it=entry.item, id=entry.id, saved=fav.has(id);
  const zhHidden = ((it.kind==='sentence' && !state.revealAll) || (state.flash && it.kind==='word') || (state.maskOn && state.mask.term && it.kind!=='sentence')) ? ' hidden' : '';
  const tools=`<div class="card-tools">
      <button class="icon-btn speak speak-zh"${zhHidden} data-say="${esc(T(primaryText(entry)))}" title="${T('朗讀')}">🔊</button>
      <button class="icon-btn fav ${saved?'saved':''}" data-fav="${id}" title="${T('加入我的詞表')}">${saved?'★':'☆'}</button>
    </div>`;
  const top=`<div class="card-top"><span class="kind">${kindLabel(entry)}</span>
      ${it.cat?`<span class="cat">${esc(T(it.cat))}</span>`:''}${tools}</div>`;
  let body='';
  if(it.kind==='sentence'){
    const kwHTML = it.keywords
      ? `<div class="keywords">${it.keywords.split(/[、,，]/).map(k=>`<span class="kw">${esc(T(k.trim()))}</span>`).join('')}</div>`
      : '';
    body=`<div class="en-prompt">${esc(it.en)}</div>
      <div class="answer-cover${state.revealAll?' revealed':''}">
        <button class="cover-btn" data-reveal>${T(state.revealAll?'👁 收起答案':'👁 顯示參考答案（先自己翻譯）')}</button>
        <div class="answer-inner"${state.revealAll?'':' hidden'}>${kwHTML}<div class="answer-box">${esc(T(it.answer))}</div></div>
      </div>`;
  }else if(it.kind==='note'){
    body=`<div class="term" style="font-size:${it.term&&it.term.length>16?'17px':'23px'}">${it.star?'<span class="mark">★</span>':''}${maskField('term',esc(T(it.term)))}</div>
      <div class="note-text">${maskField('term',esc(T(it.text)))}</div>`;
  }else if(state.flash){
    // 詞卡測試：正面顯示提示，點一下翻到背面看答案
    const hintText = state.flashHint==='en' ? it.en
                   : state.flashHint==='ex' ? it.ex
                   : it.meaning;
    const available = [it.en,it.ex,it.meaning].filter(Boolean).length>0;
    const front = available
      ? `<div class="flash-hint-label">${T(state.flashHint==='en'?'英文提示':state.flashHint==='ex'?'例句提示':'釋義提示')}</div>
         <div class="flash-hint-text">${esc(hintText||T('（這筆沒有此類提示，點我看答案）'))}</div>
         <div class="flash-tap">👆 ${T('點一下，想一想答案再翻面')}</div>`
      : `<div class="flash-hint-text">${T('這筆沒有提示，直接看答案')}</div>`;
    const back = `<div class="term">${it.star?'<span class="mark">★</span>':''}${esc(T(it.term))}</div>
      <div class="py">${esc(it.py)}</div>
      ${it.meaning?`<div class="row"><span class="lbl">${T('釋義')}</span>${esc(T(it.meaning))}</div>`:''}
      ${it.en?`<div class="row en"><span class="lbl">EN</span>${esc(it.en)}</div>`:''}
      ${it.ex?`<div class="row ex">${esc(T(it.ex))}</div>`:''}`;
    body=`<div class="flipcard" data-flip>
      <div class="flip-face flip-front">${front}</div>
      <div class="flip-face flip-back">${back}</div>
    </div>`;
  }else{
    body=`<div class="term">${it.star?'<span class="mark">★</span>':''}${maskField('term',esc(T(it.term)))}</div>
      ${it.py?`<div class="py">${maskField('py',esc(it.py))}</div>`:''}
      ${it.meaning?`<div class="row"><span class="lbl">${T('釋義')}</span>${maskField('term',esc(T(it.meaning)))}</div>`:''}
      ${it.en?`<div class="row en"><span class="lbl">EN</span>${maskField('en',esc(it.en))}</div>`:''}
      ${it.ex?`<div class="row ex">${maskField('term',esc(T(it.ex)))}</div>`:''}`;
  }
  const editTools = state.editing
    ? `<span class="cardTools-edit"><button class="icon-btn editing" data-edit="${id}" title="${T('編輯')}">✎</button><button class="icon-btn delin" data-del="${id}" title="${T('刪除')}">🗑</button></span>`
    : '';
  return `<article class="card ${it.kind==='sentence'?'sentence':''} ${state.flash&&it.kind==='word'?'flashcard':''}" style="--tc:${entry.theme.color}" data-id="${id}">
    ${top}${body}<div class="card-foot"><span class="src">${esc(T(entry.theme.name))} · ${esc(T(entry.topic.title))}</span>${editTools}</div></article>`;
}
function render(){
  renderThemes(); renderTabs(); renderStats();
  const list=filtered();
  let title, hint;
  if(state.query){
    title=T('搜尋結果'); hint=`「${esc(state.query)}」 · ${list.length} ${T('筆符合')}`;
  }else if(state.theme==='all'){
    title=T('全部重點'); hint=T('選擇上方主題，或用搜尋列直接找詞。');
  }else{
    const th=themeById[state.theme];
    title=th.num+' '+T(th.name);
    const tp=DATA.topics.find(t=>t.id===state.topic);
    hint=tp?T(tp.title):T('這個主題的全部重點');
  }
  $('#workspaceTitle').textContent=title;
  $('#workspaceHint').innerHTML=hint;
  let metaHtml = `<span class="pill">${list.length} ${T('筆')}</span>`;
  if(state.flash){
    metaHtml += `<span class="flash-hints"><span class="fh-label">${T('提示')}：</span>
      <button class="fh ${state.flashHint==='en'?'active':''}" data-fh="en">${T('英文')}</button>
      <button class="fh ${state.flashHint==='ex'?'active':''}" data-fh="ex">${T('例句')}</button>
      <button class="fh ${state.flashHint==='mean'?'active':''}" data-fh="mean">${T('釋義')}</button></span>
      <span>${T('點詞卡翻面看答案')}</span>`;
  }else{
    metaHtml += `<span>${state.revealAll?T('已顯示全部參考答案'):T('重點句先自己翻譯，點按鈕核對答案')}</span>`;
  }
  if(state.maskOn){
    const hiddenList=[state.mask.term&&T('中文詞語'),state.mask.py&&T('拼音'),state.mask.en&&T('英文')].filter(Boolean);
    metaHtml += `<span class="mask-status">🙈 ${hiddenList.length?T('已遮住')+'：'+esc(hiddenList.join('、')):T('點上方選擇要遮住的欄位')}</span>`;
  }
  $('#contentMeta').innerHTML = list.length ? metaHtml : '';
  const shown=list.slice(0,state.limit);
  $('#cards').innerHTML=shown.map(cardHTML).join('') +
    (list.length>shown.length?`<button class="tab" id="moreBtn" style="justify-self:start">${T('載入更多')}（${list.length-shown.length}）</button>`:'');
  $('#empty').hidden=list.length>0;
  const more=$('#moreBtn');
  if(more) more.addEventListener('click',()=>{state.limit+=80;render();});
  saveFav();
}

/* ---------- drawer ---------- */
function renderDrawer(){
  const ids=[...fav];
  const body=$('#drawerBody');
  if(!ids.length){ body.innerHTML=`<div class="fav-empty">${T('還沒有收藏。點卡片右上角的 ☆ 就可以加入。')}</div>`; return; }
  body.innerHTML=ids.map(id=>{
    const e=idxMap[id]; if(!e) return '';
    return `<div class="fav-item"><button class="fx" data-remove="${id}" title="${T('移除')}">×</button>
      <div class="ft">${esc(T(primaryText(e)).slice(0,60))}</div>
      <div class="fm">${esc(T(e.theme.name))} · ${esc(T(e.topic.title))}</div></div>`;
  }).join('');
}
function openDrawer(){ renderDrawer(); $('#drawer').classList.add('open'); $('#drawerMask').hidden=false; }
function closeDrawer(){ $('#drawer').classList.remove('open'); $('#drawerMask').hidden=true; }

/* ---------- events ---------- */
$('#langSeg').addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(b)setLang(b.dataset.lang);});
$('#search').addEventListener('input',e=>{
  state.query=e.target.value; state.limit=80;
  $('#clearSearch').classList.toggle('show',!!state.query);
  render();
});
$('#clearSearch').addEventListener('click',()=>{ $('#search').value='';state.query='';$('#clearSearch').classList.remove('show');render();$('#search').focus(); });
$('#homeBtn').addEventListener('click',e=>{e.preventDefault();state.theme='all';state.topic='all';state.query='';$('#search').value='';$('#clearSearch').classList.remove('show');render();window.scrollTo({top:0,behavior:'smooth'});});
$('#favBtn').addEventListener('click',openDrawer);
$('#closeDrawer').addEventListener('click',closeDrawer);
$('#drawerMask').addEventListener('click',closeDrawer);
$('#flashBtn').addEventListener('click',()=>{
  state.flash=!state.flash;
  $('#flashBtn').classList.toggle('on',state.flash);
  document.body.classList.toggle('flash-mode',state.flash);
  if(state.flash && state.maskOn){ // 词卡测试与遮罩互斥
    state.maskOn=false; $('#maskBtn').classList.remove('on'); $('#maskBar').hidden=true;
  }
  render();
});
$('#contentMeta').addEventListener('click',e=>{
  const b=e.target.closest('[data-fh]');
  if(b){ state.flashHint=b.dataset.fh; render(); }
});
$('#maskBtn').addEventListener('click',()=>{
  state.maskOn=!state.maskOn;
  $('#maskBtn').classList.toggle('on',state.maskOn);
  $('#maskBar').hidden=!state.maskOn;
  if(state.maskOn && state.flash){ // 遮罩与词卡测试互斥
    state.flash=false; $('#flashBtn').classList.remove('on'); document.body.classList.remove('flash-mode');
  }
  syncMaskToggles(); render();
});
function syncMaskToggles(){
  $$('#maskBar .mask-toggle[data-mask]').forEach(b=>{
    const k=b.dataset.mask;
    b.classList.toggle('active', k==='all' ? state.mask.py&&state.mask.en&&state.mask.term
      : k==='none' ? !state.mask.py&&!state.mask.en&&!state.mask.term : !!state.mask[k]);
  });
}
$('#maskBar').addEventListener('click',e=>{
  const b=e.target.closest('[data-mask]'); if(!b) return;
  const k=b.dataset.mask;
  if(k==='all'){ state.mask={py:true,en:true,term:true}; }
  else if(k==='none'){ state.mask={py:false,en:false,term:false}; }
  else{ state.mask[k]=!state.mask[k]; }
  syncMaskToggles(); render();
});
$('#revealBtn').addEventListener('click',()=>{
  state.revealAll=!state.revealAll;
  $('#revealBtn').classList.toggle('on',state.revealAll);
  $('#revealBtn .lbl-reveal').hidden=state.revealAll;
  $('#revealBtn .lbl-hide').hidden=!state.revealAll;
  $('#revealBtn .en-reveal').hidden=state.revealAll;
  $('#revealBtn .en-hide').hidden=!state.revealAll;
  render();
});
$('#shuffleBtn').addEventListener('click',()=>{ state.shuffle=!state.shuffle; $('#shuffleBtn').classList.toggle('on',state.shuffle); render(); });
$('#printBtn').addEventListener('click',()=>window.print());
$('#printFav').addEventListener('click',()=>window.print());
$('#clearFav').addEventListener('click',()=>{ if(!fav.size)return; if(confirm(T('確定清空我的詞表？'))){fav.clear();saveFav();render();renderDrawer();} });
$('#exportFav').addEventListener('click',()=>{
  const rows=[['主題','話題','類型','詞語／句子','拼音','英文','解釋','例句／答案'].map(T)];
  [...fav].forEach(id=>{const e=idxMap[id];if(!e)return;const it=e.item;
    rows.push([e.theme.name,e.topic.title,kindLabel(e),primaryText(e),it.py||'',it.en||'',it.meaning||it.keywords||it.text||'',it.ex||it.answer||'']);});
  const csv='\ufeff'+rows.map(r=>r.map(c=>'"'+String(c).replaceAll('"','""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download='BSL_我的詞表.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast(T('詞表已匯出'));
});
document.addEventListener('click',e=>{
  const mf=e.target.closest('[data-mask-field]');
  if(mf){ mf.classList.add('revealed'); mf.removeAttribute('title'); return; }
  const say=e.target.closest('[data-say]');
  if(say){ speak(say.dataset.say); return; }
  const f=e.target.closest('[data-fav]');
  if(f){
    const id=f.dataset.fav;
    if(fav.has(id)){fav.delete(id);toast(T('已從詞表移除'));}
    else{fav.add(id);toast(T('已加入我的詞表 ★'));}
    saveFav();render();if($('#drawer').classList.contains('open'))renderDrawer();
    return;
  }
  const rm=e.target.closest('[data-remove]');
  if(rm){fav.delete(rm.dataset.remove);saveFav();render();renderDrawer();return;}
  const rv=e.target.closest('[data-reveal]');
  if(rv){
    const wrap=rv.closest('.answer-cover');
    const inner=wrap.querySelector('.answer-inner');
    const showing=!inner.hidden;
    inner.hidden=showing;
    wrap.classList.toggle('revealed',!showing);
    rv.textContent=T(showing?'👁 顯示參考答案（先自己翻譯）':'👁 收起答案');
    const zh=rv.closest('.card').querySelector('.speak-zh');
    if(zh) zh.hidden=showing;
    return;
  }
  const flip=e.target.closest('[data-flip]');
  if(flip && !state.editing){
    if(e.target.closest('.card-tools,.cardTools-edit')) return; // 點工具列不翻面
    flip.classList.toggle('flipped');
    const zh=flip.closest('.card').querySelector('.speak-zh');
    if(zh) zh.hidden = !flip.classList.contains('flipped'); // 翻到答案面才出現中文朗讀
    return;
  }
  const ed=e.target.closest('[data-edit]');
  if(ed){ openForm('edit',ed.dataset.edit); return; }
  const dl=e.target.closest('[data-del]');
  if(dl){ deleteEntry(dl.dataset.del); return; }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ if($('#drawer').classList.contains('open'))closeDrawer(); else if(state.query){$('#search').value='';state.query='';$('#clearSearch').classList.remove('show');render();} }
  if(e.key==='/' && document.activeElement!==$('#search')){ e.preventDefault(); $('#search').focus(); }
});

/* ---------- print ---------- */
window.addEventListener('beforeprint',()=>{
  $$('.answer-inner').forEach(el=>el.hidden=false);
});
window.addEventListener('afterprint',()=>{ if(!state.revealAll) render(); });

/* ---------- 編輯模式 ---------- */
function persistEdit(){
  try{
    localStorage.setItem(EDIT_KEY,JSON.stringify(DATA));
    return true;
  }catch(e){ toast(T('本機儲存失敗，可能空間不足')); return false; }
}
function refreshAfterEdit(){ rebuildIndex(); saveFav(); render(); }
function setEditMode(on){
  state.editing=on;
  document.body.classList.toggle('edit-mode',on);
  $('#editBar').hidden=!on;
  render();
}
function fillThemeSelect(){
  $('#fTheme').innerHTML=DATA.themes.map(th=>`<option value="${th.id}">${esc(T(th.name))}</option>`).join('');
  fillTopicSelect();
}
function fillTopicSelect(selId){
  const tid=$('#fTheme').value;
  const topics=DATA.topics.filter(t=>t.theme===tid);
  $('#fTopic').innerHTML=topics.map(t=>`<option value="${t.id}" ${t.id===selId?'selected':''}>${esc(T(t.title))}</option>`).join('');
}
function toggleFormFields(kind){
  const show={
    word:['fWordRow','fPyRow','fEnRow','fMeanRow','fExRow','fCatRow'],
    note:['fWordRow','fMeanRow','fCatRow'],
    sentence:['fEnRow','fKwRow','fAnsRow','fCatRow']
  }[kind]||[];
  ['fWordRow','fPyRow','fEnRow','fMeanRow','fExRow','fKwRow','fAnsRow','fCatRow'].forEach(id=>{
    $('#'+id).hidden=!show.includes(id);
  });
}
let editingId=null;
function openForm(mode,id){
  editingId = mode==='edit'?id:null;
  let entry = mode==='edit'?idxMap[id]:null;
  const it = entry?entry.item:null;
  const kind = it?it.kind:'word';
  $('#formTitle').textContent = mode==='edit'?T('編輯內容'):T('新增內容');
  $('#fKind').value=kind;
  toggleFormFields(kind);
  const themeId = entry?entry.theme.id:DATA.themes[0].id;
  $('#fTheme').value=themeId;
  fillTopicSelect(entry?entry.topic.id:null);
  $('#fTerm').value=it?(it.term||''):'';
  $('#fPy').value=it?(it.py||''):'';
  $('#fEn').value=it?(it.en||''):'';
  $('#fMean').value=it?(it.meaning!==undefined?it.meaning:(it.text||'')):'';
  $('#fEx').value=it?(it.ex||''):'';
  $('#fKw').value=it?(it.keywords||''):'';
  $('#fAns').value=it?(it.answer||''):'';
  $('#fCat').value=it?(it.cat||''):'';
  $('#formMask').hidden=false;
}
function closeForm(){ $('#formMask').hidden=true; editingId=null; }
function saveForm(){
  const kind=$('#fKind').value;
  const topicId=$('#fTopic').value;
  const tp=DATA.topics.find(t=>t.id===topicId);
  if(!tp){ toast(T('請選擇話題')); return; }
  const term=$('#fTerm').value.trim(), py=$('#fPy').value.trim(), en=$('#fEn').value.trim();
  const mean=$('#fMean').value.trim(), ex=$('#fEx').value.trim(), kw=$('#fKw').value.trim();
  const ans=$('#fAns').value.trim(), cat=$('#fCat').value.trim();
  let item;
  if(kind==='sentence'){
    if(!en || !ans){ toast(T('英文句子與中文答案都要填')); return; }
    item={kind:'sentence',en,keywords:kw,answer:ans,cat};
  }else if(kind==='note'){
    if(!term && !mean){ toast(T('標題或內容至少要填一項')); return; }
    item={kind:'note',term:term||mean.slice(0,24),text:mean,cat};
  }else{
    if(!term){ toast(T('請填寫詞語')); return; }
    item={kind:'word',term,py,en,meaning:mean,ex,cat,star:false};
  }
  if(editingId){
    const entry=idxMap[editingId];
    if(entry){
      const oldTp=entry.topic;
      const oldIdx=oldTp.items.indexOf(entry.item);
      // 若換了話題，先從舊話題移除
      if(oldTp.id!==topicId && oldIdx>=0) oldTp.items.splice(oldIdx,1);
      Object.keys(entry.item).forEach(k=>delete entry.item[k]);
      Object.assign(entry.item,item);
      if(oldTp.id!==topicId) tp.items.push(entry.item);
    }
  }else{
    tp.items.push(item);
  }
  persistEdit(); refreshAfterEdit(); closeForm();
  toast(T(editingId?'已更新':'已新增'));
}
function deleteEntry(id){
  const entry=idxMap[id];
  if(!entry) return;
  const idx=entry.topic.items.indexOf(entry.item);
  if(idx>=0) entry.topic.items.splice(idx,1);
  fav.delete(id); saveFav();
  persistEdit(); refreshAfterEdit();
  toast(T('已刪除'));
}
function exportData(){
  persistEdit();
  const payload=JSON.stringify(DATA);
  const code='window.BSL_DATA='+payload+';\n';
  const blob=new Blob([code],{type:'text/javascript;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='data.js';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast(T('已匯出 data.js，請傳給管理員部署'));
}
function importData(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      let txt=String(reader.result).trim();
      txt=txt.replace(/^window\.BSL_DATA\s*=\s*/,'').replace(/;\s*$/,'');
      const obj=JSON.parse(txt);
      if(!obj || !Array.isArray(obj.topics) || !Array.isArray(obj.themes)) throw new Error('bad');
      if(obj.version!==window.BSL_DATA.version){ toast(T('版本不符，請使用最新匯出的資料')); return; }
      DATA=obj;
      persistEdit(); refreshAfterEdit();
      toast(T('已匯入資料'));
    }catch(e){ toast(T('匯入失敗：檔案格式不正確')); }
  };
  reader.readAsText(file);
}

/* ---------- 編輯事件綁定 ---------- */
$('#editBtn').addEventListener('click',()=>{ $('#pwdMask').hidden=false; $('#pwdInput').value=''; $('#pwdInput').focus(); });
$('#pwdCancel').addEventListener('click',()=>{ $('#pwdMask').hidden=true; });
$('#pwdOk').addEventListener('click',()=>{
  if($('#pwdInput').value===EDIT_PWD){ $('#pwdMask').hidden=true; setEditMode(true); }
  else toast(T('密碼不正確'));
});
$('#pwdInput').addEventListener('keydown',e=>{ if(e.key==='Enter') $('#pwdOk').click(); });
$('#exitEditBtn').addEventListener('click',()=>setEditMode(false));
$('#addBtn').addEventListener('click',()=>openForm('add'));
$('#fKind').addEventListener('change',e=>toggleFormFields(e.target.value));
$('#fTheme').addEventListener('change',()=>fillTopicSelect());
$('#formCancel').addEventListener('click',closeForm);
$('#formSave').addEventListener('click',saveForm);
$('#exportDataBtn').addEventListener('click',exportData);
$('#importDataBtn').addEventListener('click',()=>$('#importFile').click());
$('#importFile').addEventListener('change',e=>{ if(e.target.files[0]) importData(e.target.files[0]); e.target.value=''; });
$('#resetEditBtn').addEventListener('click',()=>{
  localStorage.removeItem(EDIT_KEY);
  DATA=window.BSL_DATA;
  fav.clear(); saveFav();
  refreshAfterEdit();
  toast(T('已還原官方資料'));
});

/* ---------- 全屏模式 ---------- */
const FS_KEY='bsl-theme-words-fullscreen';
function applyFullscreen(on){
  document.body.classList.toggle('fullscreen',on);
  const btn=$('#fullscreenBtn');
  if(btn){
    const icon=btn.querySelector('.fs-icon'), label=btn.querySelector('.fs-label');
    if(icon) icon.textContent=on?'⛶':'⛶';
    if(label){ label.dataset.hant=on?'退出全屏':'全屏'; label.textContent=T(on?'退出全屏':'全屏'); }
    btn.title=on?'退出全屏 / Exit Fullscreen':'全屏模式 / Fullscreen';
  }
}
$('#fullscreenBtn').addEventListener('click',()=>{
  const on=!document.body.classList.contains('fullscreen');
  localStorage.setItem(FS_KEY,on?'1':'0');
  applyFullscreen(on);
});

/* ---------- init ---------- */
try{ const fs=localStorage.getItem(FS_KEY); if(fs!=='0') applyFullscreen(true); }catch(e){}
setLang(lang);
})();
