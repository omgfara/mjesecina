/* Mjesečina – logika aplikacije. Podaci se čuvaju u localStorage. */
(function(){
'use strict';
/* ---------- pomoćne ---------- */
var MS=864e5;
var pad=function(n){return String(n).padStart(2,'0')};
var key=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
var parse=function(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2],12)};
var addDays=function(s,n){var d=parse(s);d.setDate(d.getDate()+n);return key(d)};
var diff=function(a,b){return Math.round((parse(a)-parse(b))/MS)};
var today=function(){return key(new Date())};
var MJ=['januar','februar','mart','april','maj','juni','juli','august','septembar','oktobar','novembar','decembar'];
var MJ3=['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
var DAN=['nedjelja','ponedjeljak','utorak','srijeda','četvrtak','petak','subota'];
var DAN3=['ned','pon','uto','sri','čet','pet','sub'];
var fmt=function(s){var d=parse(s);return d.getDate()+'. '+MJ[d.getMonth()]};
var fmtShort=function(s){var d=parse(s);return d.getDate()+'. '+MJ3[d.getMonth()]};
var fmtLong=function(s){var d=parse(s);return DAN[d.getDay()]+', '+d.getDate()+'. '+MJ[d.getMonth()]};
var fmtRange=function(a,b){var x=parse(a),y=parse(b);if(a===b)return fmtShort(a);if(x.getMonth()===y.getMonth())return x.getDate()+'.–'+y.getDate()+'. '+MJ3[x.getMonth()];return fmtShort(a)+' – '+fmtShort(b)};
var dn=function(n){return (n%10===1&&n%100!==11)?'dan':'dana'};
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
var avg=function(a){return a.reduce(function(x,y){return x+y},0)/a.length};
var dec=function(n){return n.toFixed(1).replace('.',',')};
var reduced=false;try{reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- podaci o opcijama ---------- */
var PHN={mens:'Menstruacija',fol:'Folikularna faza',ovu:'Ovulacija',lut:'Lutealna faza'};
var PHI={
  mens:{p:.03,en:2,t:'Sluznica materice se odbacuje, a estrogen i progesteron su najniži. Grčevi i umor su česti; pomažu toplina, odmor i hrana bogata željezom.'},
  fol:{p:.25,en:4,t:'Estrogen raste, a s njim energija, koncentracija i raspoloženje. Koža je obično mirnija, pa je dobro vrijeme za nove planove i jače treninge.'},
  ovu:{p:.5,en:5,t:'Jajna ćelija se oslobađa, najčešće oko sredine ciklusa. Mnoge se osjećaju društvenije i sjajnije; moguć je blag bol s jedne strane trbuha.'},
  lut:{p:.78,en:3,t:'Progesteron raste, a pred kraj faze oba hormona padaju. Nadutost, osjetljive grudi, promjene raspoloženja i žudnja za slatkim najčešći su pred menstruaciju.'}
};
var PHO=['mens','fol','ovu','lut'];
var FLOW=[[0,'Nema'],[1,'Mrlje'],[2,'Lagano'],[3,'Srednje'],[4,'Jako']];
var PILLS=[['active','Aktivna tableta'],['sugar','Šećerna tableta'],['missed','Nisam uzela']];
var CATS={
 mood:{t:'Raspoloženje',c:'--lut',o:[['sretna','Sretna'],['mirna','Mirna'],['energicna','Puna energije'],['motivisana','Motivisana'],['osjetljiva','Osjetljiva',1],['razdrazljiva','Razdražljiva',1],['anksiozna','Anksiozna',1],['tuzna','Tužna',1],['umorna','Umorna',1],['preplavljena','Preplavljena',1]]},
 social:{t:'Društvene aktivnosti',c:'--fol',o:[['prijatelji','Družila se s prijateljima'],['izlazak','Izlazak'],['porodica','Vrijeme s porodicom'],['partner','Vrijeme s partnerom'],['posao','Posao / učenje'],['sama','Željela biti sama'],['izbjegavala','Izbjegavala društvo',1]]},
 activity:{t:'Fizička aktivnost',c:'--fol',o:[['bez','Bez vježbanja'],['setnja','Šetnja'],['trcanje','Trčanje'],['teretana','Teretana'],['joga','Joga / istezanje'],['plivanje','Plivanje'],['biciklizam','Biciklizam'],['ples','Ples'],['pilates','Pilates']]},
 pain:{t:'Bol i tegobe',c:'--mens',o:[['grcevi','Grčevi u stomaku',1],['glavobolja','Glavobolja',1],['migrena','Migrena',1],['ledja','Bol u leđima',1],['grudi','Osjetljive grudi',1],['zglobovi','Bol u zglobovima',1],['noge','Bol u nogama',1],['mucnina','Mučnina',1],['vrtoglavica','Vrtoglavica',1],['ovulacijski','Bol pri ovulaciji',1]]},
 skin:{t:'Koža',c:'--ovu',o:[['cista','Čista koža'],['sjajna','Sjajna koža'],['bubuljice','Bubuljice',1],['masna','Masna koža',1],['suha','Suha koža',1],['osjetljiva_k','Osjetljiva koža',1],['crvenilo','Crvenilo',1]]},
 hair:{t:'Kosa',c:'--ovu',o:[['normalna_h','Normalna kosa'],['sjajna_h','Sjajna kosa'],['masna_h','Masna kosa',1],['suha_h','Suha kosa',1],['opadanje','Pojačano opadanje',1],['neposlusna','Neposlušna kosa',1]]},
 stool:{t:'Stolica',c:'--fol',o:[['normalna_s','Normalna'],['zatvor','Zatvor',1],['proljev','Proljev',1],['meka','Meka stolica',1],['tvrda','Tvrda stolica',1],['ucestala','Učestala',1]]},
 digest:{t:'Probava i apetit',c:'--lut',o:[['dobra','Dobra probava'],['nadutost','Nadutost',1],['plinovi','Plinovi',1],['zgaravica','Žgaravica',1],['mucnina_d','Mučnina',1],['apetit_vise','Pojačan apetit',1],['slatko','Žudnja za slatkim',1],['apetit_manje','Slabiji apetit',1]]}
};
var ORDER=['mood','social','activity','pain','skin','hair','stool','digest'];
var HINT={mood:'Označi sve što te opisuje danas.',social:'S kim si bila i šta si radila.',activity:'Šta si danas radila za tijelo.',pain:'Sve tegobe koje si primijetila.',skin:'Kako ti izgleda koža.',hair:'Kako ti je kosa.',stool:'Kako ti je stolica.',digest:'Probava, apetit i žudnje.'};

/* ---------- stanje ---------- */
var LSK='mjesecina:v1';
function fresh(){return {v:1,updatedAt:0,settings:{configured:false,lastStart:addDays(today(),-4),cycleLen:28,periodLen:5,pill:true,pillType:'21'},logs:{}}}
function lsLoad(){try{var r=localStorage.getItem(LSK);if(r){var s=JSON.parse(r);if(s&&s.settings&&s.logs)return s}}catch(e){}return null}
function lsSave(){try{localStorage.setItem(LSK,JSON.stringify(state))}catch(e){}}
var state=lsLoad()||fresh();
var dirtyYears={};
var ui={view:'cycle',logDate:today(),calMonth:today().slice(0,7),calSel:today(),anCat:'pain',sheet:null,form:null,confirm:false,animate:true};
var syncMsg='Podaci se čuvaju samo na ovom uređaju.';

/* ---------- model ciklusa ---------- */
function ovOf(L,P){return Math.min(Math.max(L-14,P+3),L-2)}
function phaseOfDay(day,L,P){var ov=ovOf(L,P);return day<=P?'mens':day<=ov-2?'fol':day<=ov+1?'ovu':'lut'}
function has(e){if(!e)return false;if(e.flow||e.pill||e.note)return true;for(var i=0;i<ORDER.length;i++){if(e[ORDER[i]]&&e[ORDER[i]].length)return true}return false}
function model(){
  var st=state,t=today(),S=st.settings,set={};set[S.lastStart]=1;
  Object.keys(st.logs).forEach(function(k){var f=st.logs[k].flow;if(f>=2){var pe=st.logs[addDays(k,-1)];if(!(pe&&pe.flow>=2))set[k]=1}});
  var raw=Object.keys(set).filter(function(k){return k<=t}).sort(),starts=[];
  raw.forEach(function(k){if(!starts.length||diff(k,starts[starts.length-1])>=12)starts.push(k)});
  if(!starts.length)starts.push(S.lastStart);
  function run(s){var n=0;while(n<10){var e=st.logs[addDays(s,n)];if(e&&e.flow>=2)n++;else break}return n}
  var lens=[];for(var i=0;i<starts.length-1;i++)lens.push(diff(starts[i+1],starts[i]));
  var good=lens.filter(function(l){return l>=15&&l<=60}).slice(-6);
  var L=good.length?Math.round(avg(good)):S.cycleLen;
  var runs=[];starts.forEach(function(s,i){var r=run(s);if(r>0&&(i<starts.length-1||addDays(s,r)<t))runs.push(r)});
  var P=runs.length?clamp(Math.round(avg(runs.slice(-6))),2,10):S.periodLen;
  var cycles=starts.map(function(s,i){var last=i===starts.length-1;var r=run(s);return {start:s,len:last?L:diff(starts[i+1],s),P:(!last&&r>0)?clamp(r,2,10):P}});
  var ns=addDays(starts[starts.length-1],L);if(ns<=t)ns=addDays(t,1);
  return {starts:starts,L:L,P:P,cycles:cycles,lenCount:good.length,runCount:runs.length,nextStart:ns,lens:lens};
}
function mk(start,day,L,P,status,ds){var ov=ovOf(L,P);return {start:start,day:day,L:L,P:P,ov:ov,phase:phaseOfDay(day,L,P),fertile:day>=ov-5&&day<=ov+1,status:status,date:ds}}
function cycleAt(M,ds){
  var s=M.starts,t=today();if(ds<s[0])return null;
  var i=-1;for(var j=0;j<s.length;j++){if(s[j]<=ds)i=j}
  if(i<s.length-1){var c=M.cycles[i];return mk(c.start,diff(ds,c.start)+1,c.len,c.P,'actual',ds)}
  var last=s[i],L=M.L,P=M.P,day=diff(ds,last)+1;
  if(day<=L)return mk(last,day,L,P,ds<=t?'actual':'predicted',ds);
  var first=M.nextStart;
  if(ds<first){var r=mk(last,day,L,P,'actual',ds);r.phase='late';r.late=day-L-1;return r}
  var k=Math.floor(diff(ds,first)/L),st=addDays(first,k*L);
  return mk(st,diff(ds,st)+1,L,P,'predicted',ds);
}

/* ---------- mjesec ---------- */
function moonPath(p,r){
  var q=p>.5?1-p:p,flip=p>.5,c=Math.cos(2*Math.PI*q),rx=Math.abs(c)*r,sw=c>=0?0:1;
  return {d:'M0 '+(-r)+'A'+r+' '+r+' 0 0 1 0 '+r+'A'+rx.toFixed(2)+' '+r+' 0 0 '+sw+' 0 '+(-r)+'Z',flip:flip};
}
function miniMoon(p,color){var m=moonPath(p,16);return '<svg class="mm" viewBox="-20 -20 40 40" aria-hidden="true"><circle r="16" style="fill:var(--moon-dark)"/><path d="'+m.d+'"'+(m.flip?' transform="scale(-1 1)"':'')+' style="fill:'+color+'"/><circle r="16" fill="none" style="stroke:var(--line)"/></svg>'}
function animMoon(p){
  var el=document.getElementById('litPath');if(!el)return;
  function set(q){var m=moonPath(q,38);el.setAttribute('d',m.d);if(m.flip)el.setAttribute('transform','scale(-1 1)');else el.removeAttribute('transform')}
  if(reduced){set(p);return}
  var t0=performance.now(),dur=1500;
  function step(now){var k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,3);set(p*e);if(k<1&&document.getElementById('litPath')===el)requestAnimationFrame(step)}
  set(0);requestAnimationFrame(step);
}

/* ---------- tekstovi ---------- */
function headline(ci){
  var d=ci.day,P=ci.P,ov=ci.ov,L=ci.L,r,n;
  if(ci.phase==='late')return {h:ci.late<=0?'Menstruacija se očekuje danas':'Kasni '+ci.late+' '+dn(ci.late),s:'Dan '+d+' ciklusa'};
  if(ci.phase==='mens'){r=P-d;return {h:r<=0?'Zadnji dan menstruacije':r===1?'Još 1 dan menstruacije':'Još '+r+' '+dn(r)+' menstruacije',s:'Menstruacija · dan '+d}}
  if(ci.phase==='fol'){n=ov-d;return {h:'Ovulacija za '+n+' '+dn(n),s:'Folikularna faza · dan '+d}}
  if(ci.phase==='ovu'){return {h:d===ov?'Ovulacija je danas':d===ov-1?'Ovulacija sutra':d<ov?'Ovulacija za '+(ov-d)+' '+dn(ov-d):'Ovulacija je prošla',s:'Ovulacija · dan '+d}}
  n=L-d+1;return {h:n<=1?'Menstruacija sutra':'Menstruacija za '+n+' '+dn(n),s:'Lutealna faza · dan '+d};
}
function inDays(n){return n===0?'danas':n===1?'sutra':n===-1?'jučer':n>1?'za '+n+' '+dn(n):'prije '+(-n)+' '+dn(-n)}
function forecast(M,ci,t){
  var late=ci.phase==='late',next=late?null:addDays(ci.start,ci.L);
  var ovD=addDays(ci.start,ci.ov-1),base=ci.start;
  if(late||ovD<t){base=M.nextStart;ovD=addDays(base,ci.ov-1)}
  return {next:next,late:late,ov:ovD,fertA:addDays(ovD,-5),fertB:addDays(ovD,1)};
}
var ICON={
  drop:'<svg viewBox="0 0 24 30" fill="currentColor"><path d="M12 2C12 2 3 12.5 3 19a9 9 0 0 0 18 0C21 12.5 12 2 12 2Z"/></svg>',
  star:'<svg viewBox="-10 -10 20 20" fill="currentColor"><path d="M0 -9L2.4 -2.4 9 0 2.4 2.4 0 9-2.4 2.4-9 0-2.4-2.4Z"/></svg>',
  seed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 17c0-6 4-11 14-12 0 10-5 14-11 14"/><path d="M5 19c3-5 6-8 11-10"/></svg>'
};
function demoBanner(){var any=Object.keys(state.logs).some(function(k){return state.logs[k].demo});return any?'<div class="banner rise" style="--i:0"><div><strong>Prikazani su primjeri podataka.</strong> Služe samo da vidiš kako analiza izgleda.</div><button class="btn sm" data-a="cleardemo">Obriši primjere</button></div>':''}

/* ---------- pogled: ciklus ---------- */
function ringSVG(ci){
  var L=ci.L,R=158,cx=200,cy=200,step=360/L,capDeg=(7/R)*180/Math.PI,i;
  function pol(deg,r){var a=(deg-90)*Math.PI/180;return [cx+r*Math.cos(a),cy+r*Math.sin(a)]}
  var o='<svg viewBox="0 0 400 400" role="img" aria-label="Prsten ciklusa, dan '+ci.day+'"><defs><radialGradient id="glow"><stop offset="0" style="stop-color:var(--moon-glow)"/><stop offset="1" style="stop-color:var(--moon-glow);stop-opacity:0"/></radialGradient><clipPath id="litClip"><path id="litPath" d=""/></clipPath></defs>';
  o+='<circle class="guide" cx="200" cy="200" r="'+(R-34)+'"/><circle class="orbit" cx="200" cy="200" r="'+(R-52)+'"/>';
  for(i=1;i<=L;i++){var a=pol((i-.5)*step,R-26);o+='<circle class="tick" cx="'+a[0].toFixed(1)+'" cy="'+a[1].toFixed(1)+'" r="1.5"/>'}
  for(i=1;i<=L;i++){
    var a0=(i-1)*step+capDeg+.6,a1=i*step-capDeg-.6;if(a1<a0+.3){var m=(a0+a1)/2;a0=m-.15;a1=m+.15}
    var p0=pol(a0,R),p1=pol(a1,R),ph=phaseOfDay(i,L,ci.P),cls=i<ci.day?'past':i===ci.day?'now':'next';
    o+='<path class="seg '+cls+'" pathLength="1" style="--i:'+i+';stroke:var(--'+ph+')" d="M'+p0[0].toFixed(2)+' '+p0[1].toFixed(2)+'A'+R+' '+R+' 0 0 1 '+p1[0].toFixed(2)+' '+p1[1].toFixed(2)+'"/>';
  }
  var ds=pol(.5*step,R+27);o+='<g transform="translate('+ds[0].toFixed(1)+' '+ds[1].toFixed(1)+')" style="color:var(--mens)"><path d="M0 -9C4 -3 7 1 7 4.5A7 7 0 0 1 -7 4.5C-7 1 -4 -3 0 -9Z" fill="currentColor"/></g>';
  var os=pol((ci.ov-.5)*step,R+27);o+='<g transform="translate('+os[0].toFixed(1)+' '+os[1].toFixed(1)+')" style="color:var(--ovu)"><path d="M0 -8L2.2 -2.2 8 0 2.2 2.2 0 8-2.2 2.2-8 0-2.2-2.2Z" fill="currentColor"/></g>';
  var bd=Math.min(ci.day,L),bp=pol((bd-.5)*step,R),bc=ci.phase==='late'?'--mens':'--'+ci.phase;
  o+='<g transform="translate('+bp[0].toFixed(1)+' '+bp[1].toFixed(1)+')" style="--c:var('+bc+')"><circle class="halo" r="22"/><circle class="bead-bg" r="22" style="stroke:var('+bc+')"/><text class="bead-t1" y="-4">Dan</text><text class="bead-t2" y="15">'+ci.day+'</text></g>';
  o+='<g transform="translate(200 118)"><circle r="74" fill="url(#glow)"/><circle r="38" style="fill:var(--moon-dark)"/><g style="fill:var(--crater-d)"><circle cx="-12" cy="-10" r="6"/><circle cx="12" cy="-17" r="4"/><circle cx="15" cy="9" r="7"/><circle cx="-7" cy="16" r="5"/><circle cx="-21" cy="6" r="3"/></g>';
  o+='<g clip-path="url(#litClip)"><circle r="38" style="fill:var(--moon-lit)"/><g style="fill:var(--crater)"><circle cx="-12" cy="-10" r="6"/><circle cx="12" cy="-17" r="4"/><circle cx="15" cy="9" r="7"/><circle cx="-7" cy="16" r="5"/><circle cx="-21" cy="6" r="3"/></g></g><circle r="38" fill="none" style="stroke:var(--line)"/></g></svg>';
  return o;
}
function vCycle(){
  var M=model(),t=today(),ci=cycleAt(M,t),H=headline(ci),fc=forecast(M,ci,t);
  var todayLog=state.logs[t],showStart=!(todayLog&&todayLog.flow>=2)&&ci.phase!=='mens';
  var legend=PHO.map(function(p){return '<span style="--c:var(--'+p+')"><i></i>'+PHN[p]+'</span>'}).join('');
  var rows='';
  rows+='<li><span class="fc-ic" style="--c:var(--mens)">'+ICON.drop+'</span><div><p class="fc-l">Sljedeća menstruacija</p><p class="fc-v">'+(fc.late?(ci.late<=0?'Očekuje se danas':'Kasni '+ci.late+' '+dn(ci.late)):fmtLong(fc.next))+'</p></div><span class="fc-d">'+(fc.late?'':inDays(diff(fc.next,t)))+'</span></li>';
  rows+='<li><span class="fc-ic" style="--c:var(--ovu)">'+ICON.star+'</span><div><p class="fc-l">Procijenjena ovulacija</p><p class="fc-v">'+fmtLong(fc.ov)+'</p></div><span class="fc-d">'+inDays(diff(fc.ov,t))+'</span></li>';
  rows+='<li><span class="fc-ic" style="--c:var(--fol)">'+ICON.seed+'</span><div><p class="fc-l">Plodni dani</p><p class="fc-v">'+fmtRange(fc.fertA,fc.fertB)+'</p></div><span class="fc-d">'+(t>=fc.fertA&&t<=fc.fertB?'traju sada':inDays(diff(fc.fertA,t)))+'</span></li>';
  var src=M.lenCount?'Dužina ciklusa je prosjek tvojih zadnjih '+M.lenCount+' '+(M.lenCount===1?'ciklusa':'ciklusa')+' ('+M.L+' '+dn(M.L)+').':'Dok nema dovoljno zabilježenih ciklusa, koristi se dužina koju si postavila ('+M.L+' '+dn(M.L)+').';
  var pillNote=state.settings.pill?' Hormonska kontracepcija obično potiskuje ovulaciju, pa su ovulacija i plodni dani samo okvirna procjena.':'';
  var c=ci.start,P=ci.P,ov=ci.ov,L=ci.L;
  var ranges={mens:[1,P],fol:[P+1,ov-2],ovu:[ov-1,ov+1],lut:[ov+2,L]};
  var ph=PHO.map(function(p){
    var r=ranges[p],cur=ci.phase===p,done=ci.phase!=='late'&&ci.day>r[1]||(ci.phase==='late'&&p!=='lut');
    var dots='';for(var i=1;i<=5;i++)dots+='<i class="'+(i<=PHI[p].en?'on':'')+'"></i>';
    return '<li class="ph'+(cur?' cur':'')+'" style="--c:var(--'+p+')">'+miniMoon(PHI[p].p,'var(--'+p+')')+'<div><p class="ph-n">'+PHN[p]+(cur?'<span class="badge">Sada</span>':'')+'</p><p class="ph-r">'+fmtRange(addDays(c,r[0]-1),addDays(c,r[1]-1))+' · '+(r[1]-r[0]+1)+' '+dn(r[1]-r[0]+1)+'</p><p class="ph-t">'+PHI[p].t+'</p><div class="en"><span>Energija</span>'+dots+'</div></div></li>';
  }).join('');
  return demoBanner()+'<div class="cycle-grid">'+
   '<section class="ringcol rise" style="--i:0"><div class="ringwrap">'+ringSVG(ci)+'<div class="core"><p class="eyebrow">Danas, '+fmt(t)+'</p><h2 class="big">'+H.h+'</h2><p class="sub">'+H.s+'</p></div></div>'+
   '<div class="legend">'+legend+'</div><div class="actions"><button class="btn" data-a="go" data-v="log">Zabilježi danas</button>'+(showStart?'<button class="btn ghost" data-a="pstart">Menstruacija je počela</button>':'')+'</div></section>'+
   '<section class="stack"><div class="rise" style="--i:1"><div class="sec-h"><h3 class="h3">Prognoza</h3></div><ul class="fc">'+rows+'</ul><p class="note">'+src+pillNote+'</p></div>'+
   '<div class="rise" style="--i:2"><div class="sec-h"><h3 class="h3">Faze tvog ciklusa</h3></div><ul>'+ph+'</ul></div></section></div>';
}

/* ---------- pogled: kalendar ---------- */
function summaryTags(e){
  var tg=[];
  if(e.flow){tg.push('Krvarenje: '+FLOW[e.flow][1].toLowerCase())}
  if(e.pill){PILLS.forEach(function(p){if(p[0]===e.pill)tg.push(p[1])})}
  ORDER.forEach(function(ck){(e[ck]||[]).forEach(function(id){CATS[ck].o.forEach(function(o){if(o[0]===id)tg.push(o[1])})})});
  return tg;
}
function vCalendar(){
  var M=model(),t=today(),ym=ui.calMonth.split('-').map(Number),Y=ym[0],Mo=ym[1];
  var first=new Date(Y,Mo-1,1,12),dim=new Date(Y,Mo,0).getDate(),lead=(first.getDay()+6)%7,cells='',i;
  for(i=0;i<lead;i++)cells+='<span class="cell blank"></span>';
  for(var d=1;d<=dim;d++){
    var ds=Y+'-'+pad(Mo)+'-'+pad(d),ci=cycleAt(M,ds),e=state.logs[ds],cls='cell',c='';
    if(ci){var ph=ci.phase==='late'?null:ci.phase;if(ph){c='--c:var(--'+ph+');';if(ph==='mens'){cls+=(e&&e.flow>=2)?' pd':' pm'+(ds>t?' fut':'')}if(ci.day===ci.ov)cls+=' ovd';else if(ci.fertile&&ph!=='mens')cls+=' fert'}}
    if(e&&e.flow>=2&&!/ pd/.test(cls))cls+=' pd';
    if(ds===t)cls+=' today';if(ds===ui.calSel)cls+=' sel';
    cells+='<button class="'+cls+'" style="'+c+'" data-a="calsel" data-d="'+ds+'" aria-label="'+fmt(ds)+'"><span class="n">'+d+'</span>'+(has(e)?'<i class="lg"></i>':'')+'</button>';
  }
  var dow=['pon','uto','sri','čet','pet','sub','ned'].map(function(x){return '<span class="dow">'+x+'</span>'}).join('');
  var sel=ui.calSel,sci=cycleAt(M,sel),se=state.logs[sel],future=sel>t,tg=se?summaryTags(se):[];
  var pn=sci?(sci.phase==='late'?'Menstruacija kasni':PHN[sci.phase]+(sci.status==='predicted'?' (prognoza)':'')):'Prije prvog zabilježenog ciklusa';
  var card='<div class="daycard"><p class="eyebrow">'+(sel===t?'Danas':'Odabrani dan')+'</p><h3 class="h3" style="margin-top:4px">'+fmtLong(sel)+'</h3><p class="sub" style="margin-top:4px">'+(sci?'Dan '+sci.day+' ciklusa · '+pn+(sci.fertile&&sci.phase!=='mens'?' · plodni dan':'')+(sci.day===sci.ov?' · procijenjena ovulacija':''):pn)+'</p>'+
    (tg.length?'<div class="tags">'+tg.map(function(x){return '<span class="tag2">'+esc(x)+'</span>'}).join('')+'</div>':'<p class="hint" style="margin-bottom:0">'+(future?'Ovaj dan tek dolazi, prikazana je samo prognoza.':'Za ovaj dan još nema zabilješki.')+'</p>')+
    (se&&se.note?'<p class="note">'+esc(se.note)+'</p>':'')+
    '<div class="actions" style="justify-content:flex-start"><button class="btn sm" data-a="editday" data-d="'+sel+'"'+(future?' disabled':'')+'>'+(has(se)?'Uredi u dnevniku':'Zabilježi taj dan')+'</button></div></div>';
  var legend='<div class="legend l2"><span><i class="sw" style="background:var(--mens)"></i>Menstruacija</span><span><i class="sw" style="border:1.5px dashed var(--mens)"></i>Prognoza menstruacije</span><span><i class="sw" style="box-shadow:inset 0 0 0 2px var(--ovu)"></i>Ovulacija</span><span><i class="sw" style="background:color-mix(in srgb,var(--ovu) 25%,var(--surface))"></i>Plodni dani</span></div>';
  return demoBanner()+'<div class="cal-grid"><div class="cal-wrap rise" style="--i:0"><div class="calhead"><button class="iconbtn" data-a="calstep" data-n="-1" aria-label="Prethodni mjesec"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><h2 class="h2" style="font-size:34px">'+MJ[Mo-1].charAt(0).toUpperCase()+MJ[Mo-1].slice(1)+' '+Y+'</h2><button class="iconbtn" data-a="calstep" data-n="1" aria-label="Sljedeći mjesec"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div><div class="cal">'+dow+cells+'</div>'+legend+'</div><div class="rise" style="--i:1">'+card+'<div class="actions" style="justify-content:flex-start"><button class="btn ghost sm" data-a="caltoday">Skoči na danas</button></div></div></div>';
}

/* ---------- pogled: dnevnik ---------- */
function dropSVG(f,id){
  var h=26*f/4;
  return '<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M12 2C12 2 3 12.5 3 19a9 9 0 0 0 18 0C21 12.5 12 2 12 2Z" fill="none" style="stroke:var(--mens)" stroke-width="1.6"/>'+(f>0?'<rect x="0" y="'+(28-h)+'" width="24" height="'+h+'" clip-path="url(#dropclip)" style="fill:var(--mens)"/>':'<path d="M7 19h10" style="stroke:var(--ink-3)" stroke-width="1.6" stroke-linecap="round"/>')+'</svg>';
}
function pillSVG(k){
  if(k==='active')return '<svg class="pill" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" style="fill:var(--lut)"/></svg>';
  if(k==='sugar')return '<svg class="pill" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10" style="fill:var(--surface);stroke:var(--ink-2)" stroke-width="2"/><circle cx="16" cy="16" r="3" style="fill:var(--ink-3)"/></svg>';
  return '<svg class="pill" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10" fill="none" style="stroke:var(--mens)" stroke-width="2" stroke-dasharray="3 3"/><path d="M12 12l8 8M20 12l-8 8" style="stroke:var(--mens)" stroke-width="2" stroke-linecap="round"/></svg>';
}
function chipsHTML(ck,e){var sel=e[ck]||[];return '<div class="chips" style="--c:var('+CATS[ck].c+')">'+CATS[ck].o.map(function(o){return '<button class="chip" data-a="chip" data-k="'+ck+'" data-id="'+o[0]+'" aria-pressed="'+(sel.indexOf(o[0])>-1)+'">'+o[1]+'</button>'}).join('')+'</div>'}
function panel(title,c,hint,inner){return '<section class="panel" style="--c:var('+c+')"><h3>'+title+'</h3>'+(hint?'<p class="hint">'+hint+'</p>':'')+inner+'</section>'}
function vLog(){
  var M=model(),t=today(),d=ui.logDate,e=state.logs[d]||{},ci=cycleAt(M,d),i,strip='';
  for(i=-27;i<=0;i++){
    var ds=addDays(t,i),c=cycleAt(M,ds),dd=parse(ds);
    strip+='<button class="dchip'+(has(state.logs[ds])?' has':'')+'" data-a="pickday" data-d="'+ds+'" aria-pressed="'+(ds===d)+'" style="'+(c&&c.phase!=='late'?'--c:var(--'+c.phase+')':'')+'"><small>'+DAN3[dd.getDay()]+'</small><b>'+dd.getDate()+'</b><i></i><em></em></button>';
  }
  var ctx=ci?(ci.phase==='late'?'Menstruacija kasni':'Dan '+ci.day+' ciklusa · '+PHN[ci.phase]):'Prije prvog zabilježenog ciklusa';
  var flow='<div class="opts" style="--c:var(--mens)">'+FLOW.map(function(f){return '<button class="opt" data-a="flow" data-v="'+f[0]+'" aria-pressed="'+((e.flow||0)===f[0])+'">'+dropSVG(f[0])+f[1]+'</button>'}).join('')+'</div>';
  var pill='';
  if(state.settings.pill){
    var pt=state.settings.pillType;
    pill=panel('Kontracepcijska pilula','--lut',pt==='21'?'Šećerna (placebo) tableta je tableta u pauzi između pakovanja.':pt==='24'?'Šećerna (placebo) tableta je tableta u zadnja 4 dana pakovanja.':'Označi jesi li danas uzela tabletu.','<div class="opts three" style="--c:var(--lut)">'+PILLS.map(function(p){return '<button class="opt" data-a="pill" data-v="'+p[0]+'" aria-pressed="'+(e.pill===p[0])+'">'+pillSVG(p[0])+p[1]+'</button>'}).join('')+'</div>');
  } else pill='<section class="panel" style="--c:var(--lut)"><h3>Kontracepcijska pilula</h3><p class="hint">Uzimaš li pilulu? Uključi praćenje i bilježi aktivne i šećerne tablete.</p><button class="btn ghost sm" data-a="pillon">Uključi praćenje pilule</button></section>';
  var secs=panel('Jačina krvarenja','--mens','Koliko si danas krvarila.',flow)+
    ['mood','social','activity'].map(function(k){return panel(CATS[k].t,CATS[k].c,HINT[k],chipsHTML(k,e))}).join('')+pill+
    ['pain','skin','hair','stool','digest'].map(function(k){return panel(CATS[k].t,CATS[k].c,HINT[k],chipsHTML(k,e))}).join('')+
    '<section class="panel" style="--c:var(--ink-3)"><h3>Bilješka</h3><textarea class="notes" id="noteBox" placeholder="Bilo šta što želiš zapamtiti o ovom danu" maxlength="600">'+esc(e.note||'')+'</textarea></section>';
  return demoBanner()+'<div class="narrow"><div class="datebar rise" style="--i:0"><button class="iconbtn" data-a="daystep" data-n="-1" aria-label="Prethodni dan"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><div><p class="eyebrow">'+(d===t?'Danas':'Dnevnik')+'</p><h2 class="h2" style="font-size:clamp(26px,6vw,36px)">'+fmtLong(d)+'</h2><p class="sub">'+ctx+'</p></div><button class="iconbtn" data-a="daystep" data-n="1" aria-label="Sljedeći dan"'+(d>=t?' disabled style="opacity:.35"':'')+'><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div>'+
   '<div class="strip rise" style="--i:1" id="strip">'+strip+'</div><div class="jump rise" style="--i:1"><label for="jumpDate">Drugi datum:</label><input type="date" id="jumpDate" value="'+d+'" max="'+t+'"></div><div class="rise" style="--i:2">'+secs+'</div></div>';
}

/* ---------- analiza ---------- */
function analyze(){
  var M=model(),rows=[],ph0={mens:0,fol:0,ovu:0,lut:0};
  Object.keys(state.logs).sort().forEach(function(d){var e=state.logs[d];if(!has(e))return;var ci=cycleAt(M,d);rows.push({d:d,e:e,ph:ci&&ci.phase!=='late'?ci.phase:null})});
  var n=rows.length,phaseDays={mens:0,fol:0,ovu:0,lut:0},items=[];
  rows.forEach(function(r){if(r.ph)phaseDays[r.ph]++});
  ORDER.forEach(function(ck){CATS[ck].o.forEach(function(o){
    var cnt=0,pc={mens:0,fol:0,ovu:0,lut:0};
    rows.forEach(function(r){var a=r.e[ck];if(a&&a.indexOf(o[0])>-1){cnt++;if(r.ph)pc[r.ph]++}});
    if(cnt)items.push({ck:ck,id:o[0],label:o[1],s:!!o[2],n:cnt,pc:pc});
  })});
  var sym=items.filter(function(x){return x.s}).sort(function(a,b){return b.n-a.n});
  return {M:M,rows:rows,n:n,phaseDays:phaseDays,items:items,sym:sym};
}
function topPhase(it,pd){var best=null,bv=0;PHO.forEach(function(p){if(pd[p]>=2){var v=it.pc[p]/pd[p];if(v>bv){bv=v;best=p}}});return best}
function vAnalysis(){
  var A=analyze(),M=A.M,n=A.n;
  var head='<div class="rise" style="--i:0"><p class="eyebrow">Analiza</p><h2 class="h2" style="margin-top:6px">Šta tvoje tijelo govori</h2><p class="lead" style="margin-top:10px">Obrasci iz tvog dnevnika, razvrstani po fazama ciklusa.</p></div>';
  if(n<5){
    return demoBanner()+head+'<div class="empty rise" style="--i:1"><svg width="64" height="64" viewBox="-20 -20 40 40"><circle r="16" style="fill:var(--moon-dark)"/><path d="M0 -16A16 16 0 0 1 0 16A10 16 0 0 0 0 -16Z" style="fill:var(--moon-lit)"/></svg><h3 class="h3">Treba mi još malo podataka</h3><p>Analiza počinje nakon pet zabilježenih dana. Što duže bilježiš, to su obrasci jasniji.</p><div class="prog"><i style="width:'+(n/5*100)+'%"></i></div><p class="sub">Zabilježeno '+n+' od 5 dana</p><div class="actions"><button class="btn" data-a="go" data-v="log">Zabilježi danas</button><button class="btn ghost" data-a="demo">Učitaj primjer podataka</button></div></div>';
  }
  var syms=A.sym.slice(0,10),top=syms[0],insights=[];
  if(top){var tp=topPhase(top,A.phaseDays);insights.push('Najčešći simptom: <b>'+top.label+'</b> ('+top.n+' od '+n+' zabilježenih dana, '+Math.round(top.n/n*100)+'%)'+(tp?', najviše u fazi <b>'+PHN[tp]+'</b>':'')+'.')}
  var burden=PHO.map(function(p){var c=0;A.rows.forEach(function(r){if(r.ph!==p)return;ORDER.forEach(function(ck){(r.e[ck]||[]).forEach(function(id){CATS[ck].o.forEach(function(o){if(o[0]===id&&o[2])c++})})})});return {p:p,v:A.phaseDays[p]>=2?c/A.phaseDays[p]:-1}}).sort(function(a,b){return b.v-a.v});
  if(burden[0].v>0)insights.push('Najviše tegoba bilježiš u fazi <b>'+PHN[burden[0].p]+'</b>, u prosjeku '+dec(burden[0].v)+' po zabilježenom danu.');
  var good=['sretna','energicna','motivisana'],gb=PHO.map(function(p){var c=0;A.rows.forEach(function(r){if(r.ph===p&&(r.e.mood||[]).some(function(m){return good.indexOf(m)>-1}))c++});return {p:p,v:A.phaseDays[p]>=2?c/A.phaseDays[p]:-1}}).sort(function(a,b){return b.v-a.v});
  if(gb[0].v>0)insights.push('Najviše energije i dobrog raspoloženja imaš u fazi <b>'+PHN[gb[0].p]+'</b> ('+Math.round(gb[0].v*100)+'% dana).');
  var ls=M.lens.filter(function(l){return l>=15&&l<=60});
  if(ls.length>=2)insights.push('Tvoji ciklusi traju od <b>'+Math.min.apply(null,ls)+'</b> do <b>'+Math.max.apply(null,ls)+'</b> dana, u prosjeku '+M.L+'.');
  var pc={active:0,sugar:0,missed:0},pt=0;A.rows.forEach(function(r){if(r.e.pill){pc[r.e.pill]++;pt++}});
  if(pt>=5)insights.push('Pilulu (aktivnu ili šećernu tabletu) si zabilježila kao uzetu <b>'+Math.round((pc.active+pc.sugar)/pt*100)+'%</b> dana; propušteno: '+pc.missed+'.');
  var stats='<div class="stats rise" style="--i:1"><div class="stat"><b>'+M.L+'</b><span>prosječan ciklus (dana)</span></div><div class="stat"><b>'+M.P+'</b><span>prosječna menstruacija (dana)</span></div><div class="stat"><b>'+n+'</b><span>zabilježenih dana</span></div><div class="stat"><b>'+M.starts.length+'</b><span>ciklusa u dnevniku</span></div></div>';
  var ins='<div class="an rise" style="--i:2"><h3 class="h3">Ukratko</h3><div class="insights">'+insights.map(function(x){return '<p class="insight">'+x+'</p>'}).join('')+'</div></div>';
  var rank='<div class="an rise" style="--i:3"><h3 class="h3">Najčešći simptomi</h3><p class="hint">Udio zabilježenih dana u kojima se simptom pojavio.</p><ul class="rank">'+syms.map(function(s,i){var p=topPhase(s,A.phaseDays);return '<li><span class="no">'+(i+1)+'</span><div><span class="nm">'+s.label+'</span><span class="ct">'+CATS[s.ck].t+'</span><div class="bar" style="--c:var('+(p?'--'+p:CATS[s.ck].c)+')"><i style="--i:'+i+';width:'+Math.max(4,Math.round(s.n/n*100))+'%"></i></div></div><div class="rt">'+s.n+' '+dn(s.n)+'<small>'+(p?'najviše: '+PHN[p].toLowerCase():'')+'</small></div></li>'}).join('')+'</ul></div>';
  var hm='<div class="an rise" style="--i:4"><h3 class="h3">Simptomi kroz faze</h3><p class="hint">Koliko često se simptom javlja u svakoj fazi (udio dana u toj fazi).</p><div class="scroll-x"><div class="heat"><span></span>'+PHO.map(function(p){return '<span class="hh" style="--c:var(--'+p+')">'+PHN[p].replace(' faza','')+'</span>'}).join('');
  syms.slice(0,8).forEach(function(s){hm+='<span class="hl">'+s.label+'</span>';PHO.forEach(function(p){if(A.phaseDays[p]<3){hm+='<span class="hc na">–</span>'}else{var v=s.pc[p]/A.phaseDays[p];hm+='<span class="hc" style="--c:var(--'+p+');--a:'+Math.round(6+v*86)+'%">'+Math.round(v*100)+'%</span>'}})});
  hm+='</div></div></div>';
  var tabs=ORDER.map(function(k){return '<button class="tab" data-a="ancat" data-k="'+k+'" aria-pressed="'+(ui.anCat===k)+'">'+CATS[k].t+'</button>'}).join('');
  var cat=A.items.filter(function(x){return x.ck===ui.anCat}).sort(function(a,b){return b.n-a.n});
  var catList=cat.length?'<ul class="rank">'+cat.map(function(s,i){return '<li><span class="no">'+(i+1)+'</span><div><span class="nm">'+s.label+'</span><div class="bar" style="--c:var('+CATS[s.ck].c+')"><i style="--i:'+i+';width:'+Math.max(4,Math.round(s.n/n*100))+'%"></i></div></div><div class="rt">'+s.n+' '+dn(s.n)+'<small>'+Math.round(s.n/n*100)+'%</small></div></li>'}).join('')+'</ul>':'<p class="hint">U ovoj kategoriji još nema zabilješki.</p>';
  var byc='<div class="an rise" style="--i:5"><h3 class="h3">Po kategorijama</h3><div class="tabs">'+tabs+'</div>'+catList+'</div>';
  var fl=[],k;for(k=0;k<8;k++){var vals=[];M.starts.forEach(function(s){var e=state.logs[addDays(s,k)];if(e&&e.flow)vals.push(e.flow)});fl.push(vals.length?avg(vals):0)}
  var flowHTML='';
  if(fl.some(function(v){return v>0})){flowHTML='<div class="an rise" style="--i:6"><h3 class="h3">Jačina krvarenja po danima</h3><p class="hint">Prosjek po danu menstruacije (1 mrlje, 4 jako).</p><div class="cols" style="--c:var(--mens)">'+fl.map(function(v,i){return '<div class="col"><em>'+(v?dec(v):'')+'</em><div class="cb" style="--i:'+i+';height:'+(v/4*100*.78)+'%;opacity:'+(v?(.45+v/4*.55):.15)+'"></div><span>'+(i+1)+'.</span></div>'}).join('')+'</div></div>'}
  var cyc='';
  if(M.lens.length>=1){var mx=Math.max.apply(null,M.lens.concat([M.L]));cyc='<div class="an rise" style="--i:7"><h3 class="h3">Dužina ciklusa</h3><p class="hint">Zadnji završeni ciklusi, od prvog dana menstruacije do sljedećeg.</p><div class="cols" style="--c:var(--lut)">'+M.lens.slice(-8).map(function(l,i,a){var st=M.starts[M.lens.length-a.length+i];return '<div class="col"><em>'+l+'</em><div class="cb" style="--i:'+i+';height:'+(l/mx*100*.78)+'%"></div><span>'+fmtShort(st).replace(/\. /,'. ')+'</span></div>'}).join('')+'</div></div>'}
  var pillHTML='';
  if(pt>=3){pillHTML='<div class="an rise" style="--i:8"><h3 class="h3">Pilula</h3><p class="hint">Raspodjela zabilježenih dana.</p><div class="seg3"><i style="width:'+(pc.active/pt*100)+'%;background:var(--lut)"></i><i style="width:'+(pc.sugar/pt*100)+'%;background:var(--ink-3);opacity:.6"></i><i style="width:'+(pc.missed/pt*100)+'%;background:var(--mens)"></i></div><div class="legend l2"><span style="--c:var(--lut)"><i></i>Aktivne: '+pc.active+'</span><span style="--c:var(--ink-3)"><i></i>Šećerne: '+pc.sugar+'</span><span style="--c:var(--mens)"><i></i>Nisam uzela: '+pc.missed+'</span></div></div>'}
  return demoBanner()+head+stats+ins+rank+hm+byc+flowHTML+cyc+pillHTML;
}

/* ---------- postavke (sheet) ---------- */
function openSheet(kind){
  var S=state.settings;
  ui.sheet=kind;ui.confirm=false;
  ui.form={lastStart:S.lastStart,cycleLen:S.cycleLen,periodLen:S.periodLen,pill:S.pill,pillType:S.pillType};
  drawSheet();
}
function closeSheet(){ui.sheet=null;document.getElementById('sheetRoot').innerHTML=''}
function drawSheet(){
  var root=document.getElementById('sheetRoot');
  if(!ui.sheet){root.innerHTML='';return}
  var f=ui.form,first=ui.sheet==='onboard',t=today();
  var anyDemo=Object.keys(state.logs).some(function(k){return state.logs[k].demo});
  var html='<div class="ov" data-a="ovclose"><div class="sheet" role="dialog" aria-modal="true" aria-label="'+(first?'Dobrodošla':'Postavke')+'"><p class="eyebrow">'+(first?'Dobrodošla':'Postavke')+'</p><h2 class="h3" style="margin-top:6px">'+(first?'Hajde da namjestimo tvoj ciklus':'Tvoj ciklus')+'</h2>'+(first?'<p class="lead" style="margin-top:8px">Treba mi samo nekoliko podataka. Poslije ih računam iz tvog dnevnika.</p>':'')+
   '<div class="field"><label for="fLast">Prvi dan zadnje menstruacije</label><input type="date" id="fLast" value="'+f.lastStart+'" max="'+t+'"></div>'+
   '<div class="field"><span class="fl">Uobičajena dužina ciklusa</span><div class="stepper"><button data-a="step" data-f="cycleLen" data-n="-1" aria-label="Manje">−</button><b>'+f.cycleLen+'</b><button data-a="step" data-f="cycleLen" data-n="1" aria-label="Više">+</button><span class="sub">dana</span></div><small>Koristi se dok nema dovoljno zabilježenih ciklusa.</small></div>'+
   '<div class="field"><span class="fl">Trajanje menstruacije</span><div class="stepper"><button data-a="step" data-f="periodLen" data-n="-1" aria-label="Manje">−</button><b>'+f.periodLen+'</b><button data-a="step" data-f="periodLen" data-n="1" aria-label="Više">+</button><span class="sub">dana</span></div></div>'+
   '<div class="field"><div class="sw-row"><div><span class="fl">Uzimam kontracepcijsku pilulu</span><br><small>Dodaje bilježenje aktivnih i šećernih tableta.</small></div><button class="toggle" data-a="pilltoggle" aria-pressed="'+f.pill+'" aria-label="Pilula"></button></div></div>'+
   (f.pill?'<div class="field"><label for="fPack">Vrsta pakovanja</label><select id="fPack"><option value="21"'+(f.pillType==='21'?' selected':'')+'>21 aktivna + 7 dana pauze (šećerne)</option><option value="24"'+(f.pillType==='24'?' selected':'')+'>24 aktivne + 4 šećerne</option><option value="28"'+(f.pillType==='28'?' selected':'')+'>Neprekidno, bez pauze</option></select></div>':'')+
   '<div class="sheet-actions"><button class="btn" data-a="savesettings">'+(first?'Počnimo':'Sačuvaj')+'</button><button class="btn ghost" data-a="sheetclose">'+(first?'Kasnije':'Zatvori')+'</button></div>';
  if(!first){
    html+='<div class="hr"></div><div class="field"><span class="fl">Podaci</span>'+(anyDemo?'<button class="btn ghost sm" data-a="cleardemo">Obriši primjere podataka</button>':'<button class="btn ghost sm" data-a="demo">Učitaj primjer podataka</button>')+
      (ui.confirm?'<p class="sub">Ovo briše sve tvoje zabilješke i postavke. Sigurna si?</p><div class="sheet-actions" style="margin-top:0"><button class="btn danger" data-a="clearall2">Da, obriši sve</button><button class="btn ghost" data-a="clearno">Odustani</button></div>':'<button class="btn danger sm" data-a="clearall">Obriši sve podatke</button>')+'</div><p class="sync">'+esc(syncMsg)+'</p>';
  }
  html+='</div></div>';
  root.innerHTML=html;
}
function readForm(){var a=document.getElementById('fLast'),b=document.getElementById('fPack');if(a&&a.value)ui.form.lastStart=a.value>today()?today():a.value;if(b)ui.form.pillType=b.value}

/* ---------- mijenjanje podataka ---------- */
var toastT=null;
function toast(msg){var el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){el.classList.remove('show')},1500)}
function changed(d,silent){
  state.updatedAt=Date.now();if(d)dirtyYears[d.slice(0,4)]=1;
  lsSave();queueSync();if(!silent)toast('Sačuvano');
}
function mutate(d,fn){
  var e=state.logs[d]?JSON.parse(JSON.stringify(state.logs[d])):{};
  fn(e);delete e.demo;
  ORDER.forEach(function(k){if(e[k]&&!e[k].length)delete e[k]});
  if(!e.flow)delete e.flow;if(!e.pill)delete e.pill;if(!e.note)delete e.note;
  if(Object.keys(e).length)state.logs[d]=e;else delete state.logs[d];
  changed(d);
}
function genDemo(){
  var t=today(),R=rng(42),last=state.settings.lastStart,lens=[28,27,29,28],starts=[last],s=last,i;
  for(i=0;i<4;i++){s=addDays(s,-lens[i]);starts.unshift(s)}
  var Ps=[5,4,5,6,state.settings.periodLen],FL=[2,4,3,3,2,1,1];
  var PR={
    mens:{pain:{grcevi:.72,ledja:.35,glavobolja:.22,mucnina:.15},mood:{umorna:.5,osjetljiva:.35,razdrazljiva:.2,tuzna:.18,mirna:.2},digest:{nadutost:.35,slatko:.3,plinovi:.2,apetit_manje:.15},stool:{proljev:.25,meka:.2,normalna_s:.35},skin:{cista:.3,masna:.15},hair:{normalna_h:.4,masna_h:.15},social:{sama:.4,izbjegavala:.3,porodica:.2},activity:{bez:.5,setnja:.3,joga:.3}},
    fol:{mood:{sretna:.5,energicna:.55,motivisana:.45,mirna:.3},skin:{cista:.6,sjajna:.2},hair:{normalna_h:.5,sjajna_h:.2},digest:{dobra:.6},stool:{normalna_s:.65},social:{prijatelji:.45,izlazak:.25,posao:.4},activity:{trcanje:.3,teretana:.35,setnja:.3},pain:{glavobolja:.05}},
    ovu:{mood:{sretna:.5,energicna:.5,motivisana:.3},pain:{ovulacijski:.3,grudi:.1},skin:{sjajna:.4,cista:.35},digest:{dobra:.5,nadutost:.12},social:{izlazak:.4,prijatelji:.5,partner:.35},activity:{ples:.25,teretana:.3,trcanje:.25},hair:{sjajna_h:.3},stool:{normalna_s:.6}},
    lut:{mood:{razdrazljiva:.45,osjetljiva:.4,anksiozna:.25,tuzna:.25,umorna:.35,mirna:.15},skin:{bubuljice:.45,masna:.4},hair:{masna_h:.35,opadanje:.1},digest:{nadutost:.55,slatko:.55,apetit_vise:.35,plinovi:.2},stool:{zatvor:.3,normalna_s:.3},pain:{glavobolja:.3,grudi:.38,grcevi:.1,ledja:.12},social:{sama:.35,izbjegavala:.25,partner:.2},activity:{bez:.45,joga:.3,setnja:.3}}
  };
  for(var d=starts[0];d<=t;d=addDays(d,1)){
    if(state.logs[d]&&!state.logs[d].demo)continue;
    var ci0=0;for(var j=0;j<starts.length;j++){if(starts[j]<=d)ci0=j}
    var L=ci0<starts.length-1?diff(starts[ci0+1],starts[ci0]):state.settings.cycleLen,P=Ps[ci0],day=diff(d,starts[ci0])+1,ph=phaseOfDay(day,L,P);
    var e={demo:true},flow=0;
    if(day<=P)flow=FL[Math.min(day-1,6)];else if(day===P+1&&R()<.3)flow=1;
    if(ph!=='mens'&&flow===0&&R()<.2)continue;
    if(flow)e.flow=flow;
    var tbl=PR[ph];
    Object.keys(tbl).forEach(function(ck){var arr=[];Object.keys(tbl[ck]).forEach(function(id){if(R()<tbl[ck][id])arr.push(id)});if(arr.length)e[ck]=arr});
    if(state.settings.pill&&R()<.93){var pd=day,pk=state.settings.pillType;e.pill=R()<.05?'missed':(pk==='28'?'active':(pk==='24'?(pd<=24?'active':'sugar'):(pd<=21?'active':'sugar')))}
    if(has(e))state.logs[d]=e;
  }
  changed(null,true);
}

/* ---------- sinhronizacija (privatno, po korisniku) ---------- */
var dbc=null,syncing=false,again=false,syncT=null;
function queueSync(){if(!dbc)return;clearTimeout(syncT);syncT=setTimeout(pushDb,1200)}
async function pushDb(){
  if(!dbc)return;if(syncing){again=true;return}
  syncing=true;
  try{
    await dbc.meta.set({settings:state.settings,updatedAt:state.updatedAt});
    var years=Object.keys(dirtyYears);dirtyYears={};
    for(var i=0;i<years.length;i++){
      var y=years[i],o={};Object.keys(state.logs).forEach(function(k){if(k.slice(0,4)===y)o[k]=state.logs[k]});
      var ref=dbc.col.doc('y'+y);
      if(Object.keys(o).length)await ref.set({logs:o});else await ref.delete();
    }
    syncMsg='Podaci su sinhronizovani s tvojim računom i vidljivi samo tebi.';
  }catch(e){syncMsg='Sinhronizacija nije uspjela, podaci su sačuvani na ovom uređaju.'}
  syncing=false;if(again){again=false;queueSync()}
}
async function initDb(){
  if(typeof claude==='undefined'||!claude.use)return;
  try{
    var api=await Promise.all([claude.use('db'),claude.use('user')]),db=api[0],user=api[1];
    if(!db||!user)return;var id=await user.id();if(!id)return;
    var col=db.collection('data/users/'+id);dbc={col:col,meta:col.doc('meta')};
    var snap=await col.get(),remote=null,logs={};
    snap.docs.forEach(function(s){var dt=s.data();if(s.id==='meta')remote=dt;else if(dt&&dt.logs)Object.keys(dt.logs).forEach(function(k){logs[k]=dt.logs[k]})});
    if(remote&&remote.updatedAt>state.updatedAt){
      state={v:1,updatedAt:remote.updatedAt,settings:Object.assign({},state.settings,remote.settings),logs:logs};
      lsSave();syncMsg='Podaci su sinhronizovani s tvojim računom i vidljivi samo tebi.';
      if(!ui.sheet)render();
    }else if(state.updatedAt>0){
      var yrs={};Object.keys(state.logs).forEach(function(k){yrs[k.slice(0,4)]=1});dirtyYears=yrs;pushDb();
    }else{syncMsg='Podaci će se sinhronizovati s tvojim računom čim počneš bilježiti.'}
  }catch(e){dbc=null}
}

/* ---------- iscrtavanje ---------- */
var view=document.getElementById('view');
function render(){
  applySky();
  var fn={cycle:vCycle,calendar:vCalendar,log:vLog,analysis:vAnalysis}[ui.view];
  view.className='view'+(ui.animate?' enter':'');
  view.innerHTML=fn();
  ui.animate=false;
  document.querySelectorAll('.nav [data-v]').forEach(function(b){if(b.dataset.v===ui.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  if(ui.view==='cycle'){var ci=cycleAt(model(),today());animMoon(clamp(((ci.day-.5)/ci.L),0,.98))}
  if(ui.view==='log'){var s=document.getElementById('strip'),sel=s&&s.querySelector('[aria-pressed="true"]');if(s&&sel)s.scrollLeft=sel.offsetLeft-s.clientWidth/2+sel.clientWidth/2}
}
function goto(v){ui.view=v;ui.animate=true;window.scrollTo(0,0);render()}
function refreshStrip(d){
  var b=document.querySelector('.dchip[data-d="'+d+'"]');if(b)b.classList.toggle('has',has(state.logs[d]));
}

/* ---------- događaji ---------- */
document.addEventListener('click',function(ev){
  var b=ev.target.closest('[data-a]');if(!b)return;
  var a=b.dataset.a;
  if(a==='ovclose'){if(ev.target===b&&ui.sheet!=='onboard')closeSheet();return}
  switch(a){
    case 'go':goto(b.dataset.v);break;
    case 'settings':openSheet('settings');break;
    case 'sheetclose':if(ui.sheet==='onboard'){state.settings.configured=true;changed(null,true)}closeSheet();break;
    case 'step':readForm();var f=b.dataset.f,lim=f==='cycleLen'?[21,45]:[2,10];ui.form[f]=clamp(ui.form[f]+Number(b.dataset.n),lim[0],lim[1]);drawSheet();break;
    case 'pilltoggle':readForm();ui.form.pill=!ui.form.pill;drawSheet();break;
    case 'savesettings':
      readForm();var wasFirst=ui.sheet==='onboard';
      state.settings=Object.assign({},state.settings,ui.form,{configured:true});
      changed(null,true);closeSheet();ui.animate=true;render();toast(wasFirst?'Spremno, hvala!':'Postavke su sačuvane');break;
    case 'demo':genDemo();closeSheet();ui.animate=true;render();toast('Učitani su primjeri podataka');break;
    case 'cleardemo':Object.keys(state.logs).forEach(function(k){if(state.logs[k].demo){dirtyYears[k.slice(0,4)]=1;delete state.logs[k]}});
      changed(null,true);closeSheet();ui.animate=true;render();toast('Primjeri su obrisani');break;
    case 'clearall':ui.confirm=true;drawSheet();break;
    case 'clearno':ui.confirm=false;drawSheet();break;
    case 'clearall2':
      var yrs2=parseInt(today().slice(0,4),10);for(var y2=yrs2-5;y2<=yrs2;y2++)dirtyYears[y2]=1;
      state=fresh();state.updatedAt=Date.now();state.settings.configured=true;lsSave();queueSync();closeSheet();ui.animate=true;render();toast('Svi podaci su obrisani');break;
    case 'pstart':mutate(today(),function(e){e.flow=3});ui.animate=true;render();break;
    case 'pillon':state.settings.pill=true;changed(null);render();break;
    case 'pickday':ui.logDate=b.dataset.d;ui.animate=true;render();break;
    case 'daystep':var nd=addDays(ui.logDate,Number(b.dataset.n));if(nd<=today()){ui.logDate=nd;ui.animate=false;render()}break;
    case 'calstep':var p=ui.calMonth.split('-').map(Number),dt=new Date(p[0],p[1]-1+Number(b.dataset.n),1,12);ui.calMonth=dt.getFullYear()+'-'+pad(dt.getMonth()+1);ui.animate=false;render();break;
    case 'caltoday':ui.calMonth=today().slice(0,7);ui.calSel=today();render();break;
    case 'calsel':ui.calSel=b.dataset.d;ui.animate=false;render();break;
    case 'editday':ui.logDate=b.dataset.d;goto('log');break;
    case 'ancat':ui.anCat=b.dataset.k;ui.animate=false;render();break;
    case 'chip':
      var k=b.dataset.k,id=b.dataset.id,d=ui.logDate;
      mutate(d,function(e){var arr=e[k]||[],ix=arr.indexOf(id);if(ix>-1)arr.splice(ix,1);else arr.push(id);e[k]=arr});
      b.setAttribute('aria-pressed',String(((state.logs[d]||{})[k]||[]).indexOf(id)>-1));b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');refreshStrip(d);break;
    case 'flow':
      var v=Number(b.dataset.v),dd2=ui.logDate;
      mutate(dd2,function(e){e.flow=v});
      b.parentNode.querySelectorAll('.opt').forEach(function(o){o.setAttribute('aria-pressed',String(o===b))});b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');refreshStrip(dd2);break;
    case 'pill':
      var pv=b.dataset.v,dd3=ui.logDate,cur=(state.logs[dd3]||{}).pill;
      mutate(dd3,function(e){e.pill=cur===pv?'':pv});
      b.parentNode.querySelectorAll('.opt').forEach(function(o){o.setAttribute('aria-pressed',String(((state.logs[dd3]||{}).pill===o.dataset.v)))});b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');refreshStrip(dd3);break;
  }
});
var noteT=null;
document.addEventListener('input',function(ev){
  if(ev.target.id==='noteBox'){
    var val=ev.target.value,d=ui.logDate;clearTimeout(noteT);
    noteT=setTimeout(function(){mutate(d,function(e){e.note=val.trim()?val:''});refreshStrip(d)},700);
  }
});
document.addEventListener('change',function(ev){
  var t=ev.target;
  if(t.id==='jumpDate'&&t.value){ui.logDate=t.value>today()?today():t.value;ui.animate=false;render()}
  if(t.id==='fLast'||t.id==='fPack'){readForm()}
});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&ui.sheet&&ui.sheet!=='onboard')closeSheet()});

/* ---------- nebo koje prati fazu ---------- */
var PHC={mens:'#F4608A',fol:'#4CCDB8',ovu:'#F7B551',lut:'#AB91FF'};
var Sky=(function(){
  var cv=document.getElementById('skyc'),cx=cv&&cv.getContext?cv.getContext('2d'):null;
  if(!cx)return {set:function(){}};
  var W=0,H=0,phase='lut',cur=.62,last=0,raf=0,colT=-9999,acc=0,cols=null,ps=[],shoot=null,nextShoot=4000,clock=0,i;
  var STR={mens:.4,fol:.75,ovu:1,lut:.62};
  var CFG={
    mens:{rate:.07,col:'mens',vy:[.2,.55],vx:[-.1,.1],r:[1.6,3.6],life:[420,700],kind:'drop',al:.5},
    fol:{rate:.09,col:'fol',vy:[-.65,-.25],vx:[-.15,.15],r:[1,2.4],life:[300,520],kind:'spark',al:.75},
    ovu:{rate:.11,col:'ovu',vy:[-.18,.18],vx:[-.2,.2],r:[.9,2.4],life:[260,480],kind:'dust',al:.6},
    lut:{rate:.05,col:'lut',vy:[-.05,.1],vx:[.15,.45],r:[2.5,5],life:[500,800],kind:'wisp',al:.16}
  };
  var R=rng(7),stars=[];
  for(i=0;i<80;i++)stars.push({x:R(),y:R(),r:.5+R()*1.3,ph:R()*6.28,sp:.0006+R()*.0016});
  function rr(a,b){return a+R()*(b-a)}
  function hex(h){h=(h||'').trim();if(h.charAt(0)!=='#')return [255,255,255];if(h.length===4)h='#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}
  function readCols(){var s=getComputedStyle(document.documentElement),g=function(n){return s.getPropertyValue(n)};cols={mens:hex(g('--mens')),fol:hex(g('--fol')),ovu:hex(g('--ovu')),lut:hex(g('--lut')),star:hex(g('--star-c')),sa:parseFloat(g('--star-a'))||1}}
  function rgba(c,a){return 'rgba('+c[0]+','+c[1]+','+c[2]+','+Math.max(0,Math.min(1,a)).toFixed(3)+')'}
  function resize(){var d=Math.min(2,window.devicePixelRatio||1);W=window.innerWidth;H=window.innerHeight;cv.width=Math.round(W*d);cv.height=Math.round(H*d);cx.setTransform(d,0,0,d,0,0)}
  function spawn(scatter){
    var c=CFG[phase],p={k:c.kind,c:cols[c.col],al:c.al,r:rr(c.r[0],c.r[1]),vx:rr(c.vx[0],c.vx[1]),vy:rr(c.vy[0],c.vy[1]),age:0,life:rr(c.life[0],c.life[1]),sw:R()*6.28};
    if(scatter){p.x=R()*W;p.y=R()*H;p.age=R()*p.life}
    else if(phase==='mens'){p.x=R()*W;p.y=-8}
    else if(phase==='fol'){p.x=R()*W;p.y=H+8}
    else if(phase==='lut'){p.x=-30;p.y=R()*H}
    else{p.x=R()*W;p.y=R()*H}
    ps.push(p);
  }
  function draw(t,f,dt){
    cx.clearRect(0,0,W,H);
    var a0=cols.sa*cur,j,p,s,tw;
    for(i=0;i<stars.length;i++){s=stars[i];tw=.5+.5*Math.sin(t*s.sp+s.ph);cx.fillStyle=rgba(cols.star,(.2+.8*tw)*a0*(s.r>1.2?1:.8));cx.beginPath();cx.arc(s.x*W,s.y*H,s.r,0,6.2832);cx.fill()}
    var lite=.5+.5*cols.sa;
    for(j=ps.length-1;j>=0;j--){
      p=ps[j];p.age+=f;
      if(p.age>=p.life){ps.splice(j,1);continue}
      p.x+=p.vx*f+(p.k==='drop'?Math.sin(p.age*.02+p.sw)*.15*f:0);p.y+=p.vy*f;
      var al=Math.sin(Math.PI*p.age/p.life)*p.al*lite;
      cx.fillStyle=rgba(p.c,al);cx.beginPath();
      if(p.k==='drop'){cx.ellipse(p.x,p.y,p.r*.75,p.r*1.2,0,0,6.2832);cx.fill()}
      else if(p.k==='spark'){var r=p.r*1.8;cx.moveTo(p.x,p.y-r);cx.lineTo(p.x+r*.28,p.y-r*.28);cx.lineTo(p.x+r,p.y);cx.lineTo(p.x+r*.28,p.y+r*.28);cx.lineTo(p.x,p.y+r);cx.lineTo(p.x-r*.28,p.y+r*.28);cx.lineTo(p.x-r,p.y);cx.lineTo(p.x-r*.28,p.y-r*.28);cx.closePath();cx.fill()}
      else if(p.k==='dust'){cx.arc(p.x,p.y,p.r,0,6.2832);cx.fill();cx.fillStyle=rgba(p.c,al*.22);cx.beginPath();cx.arc(p.x,p.y,p.r*2.8,0,6.2832);cx.fill()}
      else{cx.ellipse(p.x,p.y,p.r*5,p.r*1.4,0,0,6.2832);cx.fill()}
    }
    if(dt>0&&!shoot&&(phase==='ovu'||phase==='fol')){nextShoot-=dt;if(nextShoot<=0){shoot={x:W*(.35+R()*.6),y:H*R()*.35,vx:-(7+R()*3),vy:3+R()*2,age:0,life:46};nextShoot=phase==='ovu'?rr(5000,9000):rr(14000,22000)}}
    if(shoot){
      shoot.age+=f;shoot.x+=shoot.vx*f;shoot.y+=shoot.vy*f;
      var e=Math.sin(Math.PI*Math.min(1,shoot.age/shoot.life)),c=phase==='ovu'?cols.ovu:cols.star,tx=shoot.x-shoot.vx*7,ty=shoot.y-shoot.vy*7,g=cx.createLinearGradient(shoot.x,shoot.y,tx,ty);
      g.addColorStop(0,rgba(c,.95*e));g.addColorStop(1,rgba(c,0));
      cx.strokeStyle=g;cx.lineWidth=1.8;cx.lineCap='round';cx.beginPath();cx.moveTo(shoot.x,shoot.y);cx.lineTo(tx,ty);cx.stroke();
      if(shoot.age>=shoot.life)shoot=null;
    }
  }
  function frame(now){
    raf=requestAnimationFrame(frame);
    var dt=Math.min(60,now-last||16);last=now;clock+=dt;var f=dt/16.7;
    cur+=(STR[phase]-cur)*Math.min(1,dt/900);
    if(clock-colT>1200){readCols();colT=clock}
    acc+=CFG[phase].rate*f;while(acc>=1&&ps.length<90){spawn(false);acc-=1}if(acc>=1)acc=0;
    draw(clock,f,dt);
  }
  function start(){stop();last=0;raf=requestAnimationFrame(frame)}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0}
  var primed=false;
  resize();readCols();
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',function(){if(!primed)return;if(document.hidden)stop();else if(!reduced)start()});
  return {set:function(p){
    if(!primed){primed=true;phase=p;cur=STR[p];ps=[];for(i=0;i<22;i++)spawn(true);if(reduced)draw(0,0,0);else start();return}
    if(p===phase)return;phase=p;if(reduced){cur=STR[p];readCols();draw(0,0,0)}
  }};
})();
function iconSVG(p,ph,bg){
  var m=moonPath(p,15),c=PHC[ph],sz=bg?180:64;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+sz+'" height="'+sz+'" viewBox="-20 -20 40 40">'+(bg?'<rect x="-20" y="-20" width="40" height="40" fill="#1D1530"/>':'<circle r="20" fill="#1D1530"/>')+'<circle r="15" fill="#3A2C57"/><path d="'+m.d+'"'+(m.flip?' transform="scale(-1 1)"':'')+' fill="#FFF0C4"/><circle r="17.4" fill="none" stroke="'+c+'" stroke-width="1.6"/></svg>';
}
var iconKey='';
function setIcon(p,ph){
  var k=ph+Math.round(p*60);if(k===iconKey)return;iconKey=k;
  try{
    var l=document.querySelector('link[rel~="icon"]');
    if(!l){l=document.createElement('link');l.rel='icon';document.head.appendChild(l)}
    l.type='image/svg+xml';l.href='data:image/svg+xml,'+encodeURIComponent(iconSVG(p,ph,false));
    var img=new Image();
    img.onload=function(){try{
      var c=document.createElement('canvas');c.width=c.height=180;c.getContext('2d').drawImage(img,0,0,180,180);
      var a=document.querySelector('link[rel="apple-touch-icon"]');
      if(!a){a=document.createElement('link');a.rel='apple-touch-icon';document.head.appendChild(a)}
      a.href=c.toDataURL('image/png');
    }catch(e){}};
    img.src='data:image/svg+xml,'+encodeURIComponent(iconSVG(p,ph,true));
  }catch(e){}
}
function applySky(){
  try{
    var ci=cycleAt(model(),today()),ph=ci.phase==='late'?'lut':ci.phase,p=clamp((ci.day-.5)/ci.L,0,.98);
    var el=document.getElementById('sky');
    el.setAttribute('data-phase',ph);
    el.style.setProperty('--lum',((1-Math.cos(2*Math.PI*p))/2).toFixed(2));
    var bl=document.getElementById('brandLit'),bm=moonPath(p,16);
    if(bl){bl.setAttribute('d',bm.d);if(bm.flip)bl.setAttribute('transform','scale(-1 1)');else bl.removeAttribute('transform')}
    Sky.set(ph);setIcon(p,ph);
  }catch(e){}
}

render();
if(!state.settings.configured)openSheet('onboard');
initDb();
})();
