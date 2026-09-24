const STORE = { auth:'mahyar_auth', data:'mahyar_data_v2', notified:'mahyar_notified_v2', user:'mahyar_user_v1' };
const $ = id => document.getElementById(id);
const ids = ['themeLabel','loginView','appView','loginForm','username','password','loginError','authTitle','authDescription','authSubmit','switchAuthBtn','authHint','authMode','logoutBtn','todayText','statusPill','mainTitle','mainDescription','dayValue','periodDayValue','nextValue','startDateInput','startTodayBtn','saveDateBtn','registerStatusText','nextDateInfo','suggestionBadge','suggestionIcon','suggestionTitle','suggestionText','periodLength','cycleLength','saveSettingsBtn','notificationStatus','enableNotificationsBtn','lateCard','lateText','periodStartedBtn','notYetBtn','historyList','clearHistoryBtn','clearAllBtn','toast'];
const els = Object.fromEntries(ids.map(id=>[id,$(id)]));
const THEME_STORE='periodme_theme_v1';
const themeState=()=>{try{return {...{mode:'light',color:'pink'},...JSON.parse(localStorage.getItem(THEME_STORE)||'{}')}}catch{return {mode:'light',color:'pink'}}};
function applyTheme(){
  const t=themeState();
  document.documentElement.dataset.theme=t.mode;
  document.documentElement.dataset.color=t.color;
  const light=$('lightModeBtn'),dark=$('darkModeBtn');
  if(light&&dark){light.classList.toggle('active',t.mode==='light');dark.classList.toggle('active',t.mode==='dark');}
  document.querySelectorAll('.color-dot').forEach(b=>b.classList.toggle('active',b.dataset.color===t.color));
  const toggle=$('themeToggle'); if(toggle){ toggle.setAttribute('aria-pressed',String(t.mode==='dark')); const label=$('themeLabel'); if(label) label.textContent=t.mode==='dark'?'تاریک':'روشن'; }
}
function saveTheme(patch){const t={...themeState(),...patch};localStorage.setItem(THEME_STORE,JSON.stringify(t));applyTheme();toast(t.mode==='dark'?'حالت تاریک فعال شد 🌙':'حالت روشن فعال شد ☀️');}

const defaultData = () => ({currentStart:null,nextPeriod:null,periodLength:7,cycleLength:28,history:[],lateDismissedFor:null});
function loadData(){try{return {...defaultData(),...JSON.parse(localStorage.getItem(STORE.data)||'{}')};}catch{return defaultData();}}
function saveData(d){localStorage.setItem(STORE.data,JSON.stringify(d));}
function localISO(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function dateOnly(v){const [y,m,d]=v.split('-').map(Number);return new Date(y,m-1,d,12);}
function addDays(v,n){const d=dateOnly(v);d.setDate(d.getDate()+n);return localISO(d);}
function diffDays(a,b){return Math.round((dateOnly(a)-dateOnly(b))/86400000);}
function faDate(v){return v?dateOnly(v).toLocaleDateString('fa-IR',{year:'numeric',month:'long',day:'numeric'}):'—';}
function faNum(n){return Number(n).toLocaleString('fa-IR');}
function toast(msg){els.toast.textContent=msg;els.toast.classList.remove('hidden');clearTimeout(window.__toast);window.__toast=setTimeout(()=>els.toast.classList.add('hidden'),2600);}
function getUser(){try{return JSON.parse(localStorage.getItem(STORE.user)||'null');}catch{return null;}}
async function hashPassword(password){
  const data=new TextEncoder().encode(password);
  const hash=await crypto.subtle.digest('SHA-256',data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
let authMode='login';
function updateAuthMode(){
  const hasUser=!!getUser();
  if(!hasUser) authMode='register';
  if(els.authTitle) els.authTitle.textContent=authMode==='register'?'حساب خودت رو بساز 💗':'خوش اومدی 💗';
  if(els.authDescription) els.authDescription.textContent=authMode==='register'?'نام کاربری و رمز عبور دلخواه خودت رو انتخاب کن.':'با نام کاربری و رمز عبوری که قبلاً ساختی وارد شو.';
  if(els.authSubmit) els.authSubmit.textContent=authMode==='register'?'ساخت حساب و ورود ✨':'ورود به پریود من ✨';
  if(els.switchAuthBtn){
    els.switchAuthBtn.classList.toggle('hidden',!hasUser);
    els.switchAuthBtn.textContent=authMode==='login'?'ساخت حساب جدید':'ورود با حساب موجود';
  }
  if(els.password) els.password.autocomplete=authMode==='register'?'new-password':'current-password';
  if(els.authHint) els.authHint.textContent=authMode==='register'?'این اطلاعات فقط روی همین مرورگر ذخیره می‌شود.':'اگر رمز را یادت نیست، می‌توانی از بخش «پاک کردن همه داده‌ها» حساب را هم پاک کنی.';
}
function lateLabel(daysLate){if(daysLate===null||daysLate===undefined)return'';if(daysLate===0)return'درست سر موعد ثبت‌شده';if(daysLate>0)return`${faNum(daysLate)} روز دیرتر از موعد`;return`${faNum(Math.abs(daysLate))} روز زودتر از موعد`;}
function setPeriodStart(value){if(!value)return toast('اول یه تاریخ انتخاب کن 🌷');if(diffDays(value,localISO())>0)return toast('تاریخ شروع نمی‌تونه آینده باشه.');const d=loadData();const expected=d.nextPeriod||null;const daysLate=expected?diffDays(value,expected):null;if(!d.history.some(x=>x.start===value))d.history.unshift({start:value,expected,daysLate,loggedAt:new Date().toISOString()});d.currentStart=value;d.lateDismissedFor=null;d.nextPeriod=addDays(value,d.cycleLength);saveData(d);toast(daysLate===null?'شروع پریود ثبت شد 💗':`ثبت شد؛ ${lateLabel(daysLate)} 💗`);render();}
function updateSuggestion(s){els.suggestionBadge.textContent=s.badge;els.suggestionIcon.textContent=s.icon;els.suggestionTitle.textContent=s.title;els.suggestionText.textContent=s.text;}
function render(){const authed=sessionStorage.getItem(STORE.auth)==='1';els.loginView.classList.toggle('hidden',authed);els.appView.classList.toggle('hidden',!authed);if(!authed)return;const d=loadData(),today=localISO();els.todayText.textContent=`امروز ${new Date().toLocaleDateString('fa-IR',{weekday:'long',month:'long',day:'numeric'})}`;els.startDateInput.value=d.currentStart||today;els.periodLength.value=d.periodLength;els.cycleLength.value=d.cycleLength;
 let cycleDay=0,periodDay=0,nextStart=d.nextPeriod||null,daysToNext=null;
 if(d.currentStart){cycleDay=diffDays(today,d.currentStart)+1;periodDay=cycleDay>=1&&cycleDay<=d.periodLength?cycleDay:0;if(!nextStart)nextStart=addDays(d.currentStart,d.cycleLength);daysToNext=diffDays(nextStart,today);els.dayValue.textContent=cycleDay>0?faNum(cycleDay):'—';els.periodDayValue.textContent=periodDay?faNum(periodDay):'تمام';els.nextValue.textContent=daysToNext>0?`${faNum(daysToNext)} روز`:daysToNext===0?'امروز':`${faNum(Math.abs(daysToNext))} روز دیر`;const end=addDays(d.currentStart,d.periodLength-1);if(cycleDay>=1&&cycleDay<=d.periodLength){els.statusPill.textContent=`روز ${faNum(cycleDay)} پریود`;els.mainTitle.textContent=`امروز روز ${faNum(cycleDay)} ـه 🌷`;els.mainDescription.textContent=`شروع: ${faDate(d.currentStart)} • پایان تقریبی: ${faDate(end)}`;}else if(daysToNext>0){els.statusPill.textContent='پریود این دوره تموم شده 🌸';els.mainTitle.textContent=`روز ${faNum(cycleDay)} چرخه`;els.mainDescription.textContent=`تاریخ محاسبه‌شده پریود بعدی: ${faDate(nextStart)}`;}else{els.statusPill.textContent=daysToNext===0?'امروز موعدشه 👀':'از موعد گذشته';els.mainTitle.textContent=daysToNext===0?'پریود شدی؟ 🌷':`حدود ${faNum(Math.abs(daysToNext))} روز عقب افتاده`;els.mainDescription.textContent='این فقط یک یادآوریه؛ چرخه ممکنه جلو یا عقب بشه.';}
 if(cycleDay===d.periodLength+1)notifyOnce(`ended_${end}`,'پریود من 🌷','۷ روز ثبت‌شده تموم شد. اگر هنوز پریود ادامه داره، مدت پریود رو در تنظیمات تغییر بده.');
 if(daysToNext<=0)notifyOnce(`due_${nextStart}`,'پریود من 👀','زمان پریود بعدی رسیده. پریود شدی؟');
 const show=daysToNext<=0&&d.lateDismissedFor!==nextStart;els.lateCard.classList.toggle('hidden',!show);if(show){const late=Math.max(0,-daysToNext);els.lateText.textContent=late===0?'امروز موعد پریودته. اگر شروع شده، «آره، شروع شد» رو بزن تا تاریخ جدید و میزان تأخیر خودکار ثبت بشه.':`حدود ${faNum(late)} روز از موعد گذشته. چند روز جابه‌جایی ممکنه پیش بیاد. اگر تأخیر طولانی یا نگرانی خاصی داری، بهتره با پزشک یا یک فرد قابل اعتماد صحبت کنی.`;}
 els.registerStatusText.textContent=daysToNext>0?`امروز روز ${faNum(cycleDay)} از چرخه‌ات هست • شروع از ${faDate(d.currentStart)} • ${faNum(daysToNext)} روز تا موعد بعدی (${faDate(nextStart)})`:daysToNext===0?`امروز روز ${faNum(cycleDay)} از چرخه‌ات هست • شروع از ${faDate(d.currentStart)} • امروز موعد بعدیه`:`امروز روز ${faNum(cycleDay)} از چرخه‌ات هست • شروع از ${faDate(d.currentStart)} • ${faNum(Math.abs(daysToNext))} روز از موعد بعدی گذشته`;
 }else{els.statusPill.textContent='هنوز شروع ثبت نشده';els.mainTitle.textContent='اولین روز رو با هم ثبت کنیم؟ 🌸';els.mainDescription.textContent='تاریخ شروع پریود رو وارد کن تا شمارش و راهنمای روزانه فعال بشه.';els.dayValue.textContent=els.periodDayValue.textContent=els.nextValue.textContent='—';els.lateCard.classList.add('hidden');els.registerStatusText.textContent='هنوز تاریخ شروعی ثبت نکردی 🌸';}
 updateSuggestion(suggestionFor(d.currentStart?cycleDay:0,d.periodLength));
 els.nextDateInfo.textContent=d.nextPeriod?`تاریخ محاسبه‌شده: ${faDate(d.nextPeriod)}${daysToNext!==null?(daysToNext>0?` • ${faNum(daysToNext)} روز مونده`:daysToNext===0?' • امروزه':` • ${faNum(Math.abs(daysToNext))} روز از موعد گذشته`):''}`:'هنوز تاریخ شروعی ثبت نکردی تا موعد بعدی محاسبه بشه.';
 if(!('Notification'in window))els.notificationStatus.textContent='این مرورگر اعلان وب رو پشتیبانی نمی‌کنه.';else if(Notification.permission==='granted')els.notificationStatus.textContent='اعلان‌ها فعاله 🔔';else if(Notification.permission==='denied')els.notificationStatus.textContent='اعلان‌ها از طرف مرورگر مسدوده.';else els.notificationStatus.textContent='اگه اعلان رو روشن کنی، پریود من موقع رسیدن تاریخ‌ها بهت یادآوری می‌کنه.';
 els.historyList.innerHTML=d.history.length?d.history.slice(0,12).map((x,i)=>`<div class="history-item"><div><b>چرخه ${faNum(d.history.length-i)}</b><small>روز ثبت: ${faDate(x.start)}${x.daysLate!==undefined&&x.daysLate!==null?' • '+lateLabel(x.daysLate):''}</small></div><span>${faDate(x.start)}</span></div>`).join(''):'<div class="empty">هنوز سابقه‌ای نداری 🌸</div>';
}


$('themeToggle')?.addEventListener('click',()=>{const t=themeState();saveTheme({mode:t.mode==='dark'?'light':'dark'});});
$('lightModeBtn')?.addEventListener('click',()=>saveTheme({mode:'light'}));
$('darkModeBtn')?.addEventListener('click',()=>saveTheme({mode:'dark'}));
document.querySelectorAll('.color-dot').forEach(b=>b.addEventListener('click',()=>saveTheme({color:b.dataset.color})));
applyTheme();

els.loginForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const username=els.username.value.trim();
  const password=els.password.value;
  const existing=getUser();
  els.loginError.classList.add('hidden');
  if(username.length<3){els.loginError.textContent='نام کاربری باید حداقل ۳ کاراکتر باشد.';els.loginError.classList.remove('hidden');return;}
  if(password.length<4){els.loginError.textContent='رمز عبور باید حداقل ۴ کاراکتر باشد.';els.loginError.classList.remove('hidden');return;}
  const hash=await hashPassword(password);
  if(!existing){
    localStorage.setItem(STORE.user,JSON.stringify({username,passwordHash:hash}));
    sessionStorage.setItem(STORE.auth,'1');
    els.username.value='';els.password.value='';
    render();return;
  }
  if(username===existing.username&&hash===existing.passwordHash){
    sessionStorage.setItem(STORE.auth,'1');
    els.username.value='';els.password.value='';
    render();
  }else{
    els.loginError.textContent='نام کاربری یا رمز عبور درست نیست.';
    els.loginError.classList.remove('hidden');
  }
});
els.logoutBtn.onclick=()=>{sessionStorage.removeItem(STORE.auth);updateAuthMode();render();};
els.switchAuthBtn?.addEventListener('click',()=>{
  if(!getUser()) return;
  authMode=authMode==='login'?'register':'login';
  els.loginError.classList.add('hidden');
  updateAuthMode();
});
els.startTodayBtn.onclick=()=>setPeriodStart(localISO());els.saveDateBtn.onclick=()=>setPeriodStart(els.startDateInput.value);
els.saveSettingsBtn.onclick=()=>{const p=Number(els.periodLength.value),c=Number(els.cycleLength.value);if(p<1||p>10||c<20||c>45)return toast('مقدار واردشده معتبر نیست.');const d=loadData();d.periodLength=p;d.cycleLength=c;if(d.currentStart)d.nextPeriod=addDays(d.currentStart,c);saveData(d);toast('تنظیمات ذخیره شد ⚙️');render();};
els.enableNotificationsBtn.onclick=async()=>{if(!('Notification'in window))return toast('این مرورگر اعلان وب رو پشتیبانی نمی‌کنه.');const p=await Notification.requestPermission();if(p==='granted'){notify('پریود من 🌷','اعلان‌ها فعال شدن. حواسمون به تاریخ‌ها هست!');toast('اعلان‌ها فعال شد 🔔');}else toast('اجازه اعلان داده نشد.');render();};
els.periodStartedBtn.onclick=()=>setPeriodStart(localISO());
els.notYetBtn.onclick=()=>{const d=loadData();if(d.nextPeriod)d.lateDismissedFor=d.nextPeriod;saveData(d);toast('باشه، فعلاً صبر می‌کنیم 🌙');render();};
els.clearHistoryBtn.onclick=()=>{if(!confirm('سوابق چرخه‌ها پاک بشه؟'))return;const d=loadData();d.history=[];saveData(d);toast('سوابق پاک شد.');render();};
els.clearAllBtn.onclick=()=>{if(!confirm('همه اطلاعات پریود من از این مرورگر پاک بشه؟'))return;localStorage.removeItem(STORE.data);localStorage.removeItem(STORE.notified);localStorage.removeItem(STORE.user);sessionStorage.removeItem(STORE.auth);authMode='register';updateAuthMode();toast('همه داده‌ها پاک شد.');render();};
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
updateAuthMode();
render();

// Firebase Push: when configured, use the existing notification button for real push setup.
const originalEnableNotifications = els.enableNotificationsBtn?.onclick;
if (els.enableNotificationsBtn) {
  els.enableNotificationsBtn.addEventListener('click', async () => {
    if (typeof window.enableFirebasePush !== 'function') return;
    try {
      await window.enableFirebasePush();
      toast('اعلان‌های واقعی روی این دستگاه فعال شد 🔔');
      render();
    } catch (e) {
      console.warn(e);
      toast('فعال‌سازی اعلان‌ها انجام نشد؛ اجازه اعلان و تنظیمات Firebase را بررسی کن.');
    }
  });
}
