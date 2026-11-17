(function(){
'use strict';
var CARD_ID='manager-performance-center';
var refreshSequence=0;
function el(tag,style,text){
  var n=document.createElement(tag);
  if(style)n.style.cssText=style;
  if(text!==undefined)n.textContent=String(text);
  return n;
}
function list(v){return Array.isArray(v)?v:[];}
function currentManager(){
  var u=window.user;
  return !!(u&&(u.role==='admin'||u.role==='manager'));
}
function data(){
  try{return typeof cache!=='undefined'&&cache?cache:{};}catch(e){return {};}
}
function dateOf(row){
  if(!row)return '';
  if(row.date)return String(row.date);
  if(row.created_at&&typeof persianDateFromJs==='function'){
    try{return persianDateFromJs(new Date(row.created_at));}catch(e){}
  }
  return '';
}
function todayKey(){
  try{return typeof today==='function'?String(today()):'';}catch(e){return '';}
}
function classForRecord(row,studentClass){
  if(row&&row.class_id!=null&&String(row.class_id)!=='')return String(row.class_id);
  if(row&&row.student_id!=null)return studentClass.get(String(row.student_id))||'';
  return '';
}
function countUnique(rows){
  var seen=new Set();
  rows.forEach(function(r,i){seen.add(r&&r.student_id!=null?'s:'+String(r.student_id):(r&&r.id!=null?'i:'+String(r.id):'r:'+i));});
  return seen.size;
}
function addMetric(parent,label,value){
  var tile=el('div','flex:1 1 105px;min-width:95px;padding:8px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc');
  tile.appendChild(el('div','font-size:1.12rem;font-weight:800;color:#1e3a8a',value));
  tile.appendChild(el('div','font-size:.7rem;color:#475569;margin-top:2px',label));
  parent.appendChild(tile);
}
function build(){
  if(!currentManager())return null;
  var dashboard=document.getElementById('page-dashboard');
  if(!dashboard)return null;
  var card=document.getElementById(CARD_ID);
  if(card)return card;
  var anchor=dashboard.querySelector('.sg');
  if(!anchor)return null;
  card=el('section','margin:10px 0;padding:12px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.05)');
  card.id=CARD_ID;
  var head=el('div','display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px');
  head.appendChild(el('strong','font-size:.92rem;color:#0f172a','📊 مرکز پایش عملکرد مدرسه'));
  var btn=el('button','border:1px solid #cbd5e1;background:#f8fafc;color:#1e40af;border-radius:8px;padding:6px 10px;font:inherit;font-size:.75rem;cursor:pointer','به‌روزرسانی نمایش');
  btn.type='button';btn.onclick=function(){window.refreshManagerPerformanceCenter();};
  head.appendChild(btn);card.appendChild(head);
  card.appendChild(el('p','font-size:.72rem;line-height:1.8;color:#64748b;margin:0 0 9px','گزارش فقط‌خواندنی از ثبت‌های موجود در حافظه برنامه؛ هیچ داده‌ای را تغییر یا حذف نمی‌کند.'));
  var summary=el('div','display:flex;flex-wrap:wrap;gap:6px;margin:8px 0');
  summary.id=CARD_ID+'-summary';card.appendChild(summary);
  var source=el('div','font-size:.72rem;line-height:1.8;color:#475569;padding:7px 8px;border-radius:8px;background:#f8fafc;margin-bottom:9px');
  source.id=CARD_ID+'-source';card.appendChild(source);
  var rows=el('div','display:flex;flex-direction:column;gap:7px');
  rows.id=CARD_ID+'-rows';card.appendChild(rows);
  card.appendChild(el('p','font-size:.68rem;line-height:1.8;color:#64748b;margin:9px 0 0','محدودیت گزارش: صف آفلاین گوشی‌های دیگر فقط پس از اتصال و همگام‌سازی قابل مشاهده است. تاریخچه تغییرات و حذف‌های گذشته نیز در ساختار فعلی ثبت حسابرسی مستقلی ندارد.'));
  anchor.insertAdjacentElement('afterend',card);
  return card;
}
window.refreshManagerPerformanceCenter=async function(){
  if(!currentManager()){var hiddenCard=document.getElementById(CARD_ID);if(hiddenCard)hiddenCard.style.display='none';return;}
  var seq=++refreshSequence;
  var card=build();
  if(!card)return;
  var d=data(),classes=list(d.classes),students=list(d.students),attendance=list(d.attendance),activities=list(d.activities),evaluations=list(d.evaluations),discipline=list(d.discipline),documents=list(d.documents);
  var day=todayKey(),studentClass=new Map();
  students.forEach(function(s){if(s&&s.id!=null&&s.class_id!=null)studentClass.set(String(s.id),String(s.class_id));});
  var todayAttendance=attendance.filter(function(r){return dateOf(r)===day;});
  var todayActivities=activities.filter(function(r){return dateOf(r)===day;});
  var qa=todayActivities.filter(function(r){return r&&r.type==='qa';});
  var exams=todayActivities.filter(function(r){return r&&r.type==='exam';});
  var daily=todayActivities.filter(function(r){return r&&r.type!=='qa'&&r.type!=='exam'&&r.type!=='absence_followup'&&r.subject!=='پیگیری غیبت مدیر';});
  var weekEvaluations=evaluations.filter(function(r){try{return typeof isEvaluationInCurrentWeek==='function'?isEvaluationInCurrentWeek(r):dateOf(r)===day;}catch(e){return dateOf(r)===day;}});
  function forClass(rows,cid){return rows.filter(function(r){return classForRecord(r,studentClass)===String(cid);});}
  var summary=document.getElementById(CARD_ID+'-summary');
  var rowsBox=document.getElementById(CARD_ID+'-rows');
  var source=document.getElementById(CARD_ID+'-source');
  if(!summary||!rowsBox||!source)return;
  summary.replaceChildren();rowsBox.replaceChildren();
  var attendanceClasses=new Set(todayAttendance.filter(function(r){return r&&String(r.status||'').trim();}).map(function(r){return String(r.class_id||'');}));
  var pendingCount=null;
  try{if(window.DastyarOffline&&typeof window.DastyarOffline.pending==='function'){var pending=await window.DastyarOffline.pending();pendingCount=list(pending).length;}}catch(e){}
  if(seq!==refreshSequence)return;
  addMetric(summary,'تعداد کلاس‌ها',classes.length);
  addMetric(summary,'کلاس‌های دارای حضور امروز',attendanceClasses.size);
  addMetric(summary,'پرسش‌وپاسخ امروز',qa.length);
  addMetric(summary,'ارزشیابی این هفته',weekEvaluations.length);
  addMetric(summary,'صف اصلی همین گوشی',pendingCount==null?'نامشخص':pendingCount);
  var offline=!!window.isOffline||!navigator.onLine;
  source.textContent='تاریخ گزارش: '+(day||'نامشخص')+' | وضعیت اتصال: '+(offline?'آفلاین؛ مبتنی بر داده محلی':'آنلاین؛ مبتنی بر داده‌های بارگذاری‌شده در برنامه')+' | آخرین به‌روزرسانی نمایش: '+new Date().toLocaleTimeString('fa-IR');
  if(!classes.length){rowsBox.appendChild(el('div','padding:9px;color:#64748b;font-size:.78rem','کلاسی در حافظه برنامه موجود نیست.'));return;}
  classes.forEach(function(c){
    if(!c||c.id==null)return;
    var cid=String(c.id),roster=students.filter(function(s){return s&&String(s.class_id)===cid;});
    var att=forClass(todayAttendance,cid),attN=countUnique(att.filter(function(r){return r&&String(r.status||'').trim();}));
    var qaN=forClass(qa,cid).length,examN=forClass(exams,cid).length,dailyN=forClass(daily,cid).length;
    var evalN=forClass(weekEvaluations,cid).filter(function(r){return !(typeof isDailyQaEvaluationRow==='function'&&isDailyQaEvaluationRow(r));}).length;
    var discN=forClass(discipline,cid).length,docN=forClass(documents,cid).length;
    var box=el('div','border:1px solid #e2e8f0;border-radius:10px;padding:9px;background:#fff');
    var top=el('div','display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap');
    top.appendChild(el('strong','font-size:.82rem;color:#0f172a',c.label||c.name||('کلاس '+cid)));
    var statusText=roster.length?(attN===0?'ثبت حضور امروز مشاهده نشد':attN<roster.length?'ثبت حضور ناقص: '+attN+' از '+roster.length:'برای همه دانش‌آموزان ثبت وجود دارد'):(attN?'ثبت حضور: '+attN:'فهرست دانش‌آموزان در دسترس نیست');
    var statusColor=attN>0&&roster.length&&attN<roster.length?'#b45309':attN>0?'#166534':'#64748b';
    var badge=el('span','font-size:.68rem;padding:3px 7px;border-radius:999px;background:'+(statusColor==='#166534'?'#dcfce7':statusColor==='#b45309'?'#fef3c7':'#f1f5f9')+';color:'+statusColor,statusText);
    top.appendChild(badge);box.appendChild(top);
    var detail=el('div','display:flex;flex-wrap:wrap;gap:5px;margin-top:7px');
    [['دانش‌آموز',roster.length],['حضور امروز',attN],['پرسش‌وپاسخ امروز',qaN],['ارزشیابی هفته',evalN],['فعالیت امروز',dailyN],['آزمون امروز',examN],['انضباط',discN],['فایل',docN]].forEach(function(pair){
      detail.appendChild(el('span','font-size:.68rem;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:4px 6px',pair[0]+': '+pair[1]));
    });
    box.appendChild(detail);rowsBox.appendChild(box);
  });
};
function install(){
  build();
  if(typeof window.refreshDash==='function'&&!window.refreshDash.__managerPerformanceWrapped){
    var original=window.refreshDash;
    var wrapped=function(){var result=original.apply(this,arguments);try{window.refreshManagerPerformanceCenter();}catch(e){}return result;};
    wrapped.__managerPerformanceWrapped=true;window.refreshDash=wrapped;
  }
  window.refreshManagerPerformanceCenter();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(install,250);});
else setTimeout(install,250);
})();
