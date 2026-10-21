// La página para revisar las 126 rutas de Roma (docs/dias/RUTAS_REVISION.html). La hace `rutasRevision.mjs` con los datos que acaba de sacar; también se puede hacer aparte:
//   node scripts/destino/rutasRevisionPagina.mjs   (lee scripts/destino/_rutasRevisionViajes.json)
// Una sola página, sin nada de fuera, que se abre sola en el navegador: los datos van dentro. Solo enseña: no cambia ninguna ruta.
import fs from 'node:fs'

export function escribirPagina({ resumen, viajes, generado, largos = false }) {
  const datos = JSON.stringify({ resumen, viajes, generado, largos }).replace(/</g, '\\u003c')
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${largos ? 'Viajes largos de Roma para revisar' : 'Rutas de Roma para revisar'}</title>
<style>
:root{--fondo:#f5efe4;--tarjeta:#fffdf8;--tinta:#1c2230;--suave:rgba(28,34,48,.6);--linea:rgba(28,34,48,.12);
--titulo:#7c3aed;--repetida:#ea580c;--cerrada:#dc2626;--andando:#2563eb;--tarde:#92400e;--entra:#16a34a;--entra-fondo:#dcfce7}
*{box-sizing:border-box}
body{margin:0;background:var(--fondo);color:var(--tinta);font:15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}
header{background:var(--fondo);border-bottom:1px solid var(--linea);padding:10px 14px 10px}
@media(min-width:900px){header{position:sticky;top:0;z-index:20}}
h1{margin:0 0 8px;font:600 20px/1.2 Georgia,serif}
.selectores{display:flex;flex-wrap:wrap;gap:8px;align-items:end}
.selectores label{display:flex;flex-direction:column;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--suave);gap:2px}
select{font:500 15px system-ui;padding:8px 10px;border-radius:10px;border:1px solid var(--linea);background:#fff;min-height:40px;max-width:100%}
.marcas{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center}
.chip{display:inline-flex;gap:6px;align-items:center;border:0;border-radius:999px;padding:6px 10px;font:600 12.5px system-ui;color:#fff;cursor:pointer;min-height:34px}
.chip small{font-weight:500;opacity:.9}
.chip.titulo{background:var(--titulo)}.chip.repetida{background:var(--repetida)}.chip.cerrada{background:var(--cerrada)}.chip.andando{background:var(--andando)}.chip.tarde{background:var(--tarde)}
.chip.otra{background:var(--tinta)}
.nota{font-size:12px;color:var(--suave);margin:6px 0 0}
main{padding:12px 14px 60px}
.fila{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;padding-bottom:10px}
.dia{flex:0 0 min(92vw,370px);scroll-snap-align:start;background:var(--tarjeta);border-radius:18px;box-shadow:0 1px 3px rgba(28,34,48,.12);padding:12px 12px 14px}
.dia h2{margin:0;font:600 18px/1.2 Georgia,serif}
.sub{font-size:12px;color:var(--suave);margin:2px 0 6px}
.eleccion{font-size:12px;background:#f1eadc;border-radius:8px;padding:6px 8px;margin:6px 0}
.avisoDia{font-size:12.5px;background:#fff4d6;border-radius:8px;padding:6px 8px;margin:6px 0}
ol{list-style:none;margin:8px 0 0;padding:0}
.parada{border-top:1px solid var(--linea);padding:8px 4px 6px;border-radius:8px;position:relative}
.parada.entra{background:var(--entra-fondo);border-top-color:#86efac}
.parada .n{display:inline-block;min-width:22px;color:var(--suave);font-weight:600}
.nombre{font-weight:650}
.base{font-size:12px;color:var(--titulo)}
.min{font-size:12px;color:var(--suave);white-space:nowrap}
.tipo{font-size:11px;border-radius:6px;padding:1px 6px;background:#e5e7eb;margin-left:4px}
.tipo.noche{background:#1c2230;color:#fff}.tipo.free_tour{background:#fde68a}.tipo.comida,.tipo.cena{background:#fed7aa}
.porque{margin:3px 0 0;padding-left:16px;font-size:12.5px;color:var(--suave)}
.porque li{margin:1px 0;list-style:disc}
.titulo-escrito{font-size:12px;margin-top:2px}
.pill{display:inline-block;font-size:11.5px;font-weight:600;border-radius:999px;padding:2px 8px;margin:3px 4px 0 0;color:#fff}
.pill.titulo{background:var(--titulo)}.pill.repetida{background:var(--repetida)}.pill.cerrada{background:var(--cerrada)}.pill.andando{background:var(--andando)}.pill.tarde{background:var(--tarde)}
.aviso{font-size:12px;background:#fef3c7;border-radius:6px;padding:2px 6px;margin:3px 4px 0 0;display:inline-block}
.trayecto{font-size:12px;color:var(--suave);padding:2px 0 2px 26px}
.trayecto.larga{color:var(--andando);font-weight:700}
.marcado{outline:2px solid currentColor}
details{margin-top:10px;font-size:13px}
summary{cursor:pointer;font-weight:600}
.sale{margin-top:16px;background:var(--tarjeta);border-radius:16px;padding:12px 14px;max-width:760px}
.sale h3{margin:0 0 6px;font-size:15px}
.sale span{display:inline-block;background:#fee2e2;border-radius:6px;padding:2px 8px;margin:2px 4px 2px 0;font-size:13px}
.leyenda{font-size:12px;color:var(--suave);margin-top:12px}
.actual{outline:3px solid #facc15;outline-offset:2px}
@media(min-width:900px){.dia{flex-basis:340px}}
</style>
</head>
<body>
<header>
<h1>${largos ? 'Viajes largos de Roma, tal cual salen en la app' : 'Rutas de Roma, tal cual salen en la app'}</h1>
<div class="selectores">
 <label>Días<select id="dias"></select></label>
 ${largos ? '<label>Día 4<select id="dia4"></select></label>' : ''}
 <label>Experiencias<select id="combo"></select></label>
 <label>Día de inicio<select id="inicio"></select></label>
</div>
<div class="marcas" id="marcas"></div>
<p class="nota" id="nota"></p>
</header>
<main>
 <div id="ruta"></div>
 <p class="leyenda">Sin horas: la app ya no las enseña, solo el orden. El nombre grande es el que sale en DÍAS; lo de color violeta es el nombre del sitio cuando el día escrito le da otro título. En verde, lo que entra respecto a la base (A, mismos días y mismo inicio).</p>
</main>
<script id="datos" type="application/json">${datos}</script>
<script>
(function(){
var D=JSON.parse(document.getElementById('datos').textContent);
var V=D.viajes, R=D.resumen;
var NOMBRES={titulo:'Nombre ≠ título escrito',repetida:'Parada repetida',cerrada:'Cerrada ese día',andando:'Andando > 20 min',tarde:'Día muy tarde'};
var ORDEN=['titulo','repetida','cerrada','andando','tarde'];
var COMBOS={};V.forEach(function(v){COMBOS[v.combo]=v.nombre_combo});
var LARGOS=!!D.largos;
var elD=document.getElementById('dias'),elD4=document.getElementById('dia4'),elC=document.getElementById('combo'),elI=document.getElementById('inicio'),elR=document.getElementById('ruta'),elM=document.getElementById('marcas'),elN=document.getElementById('nota');
(LARGOS?[4,5,6]:[2,3,4]).forEach(function(n){elD.add(new Option(n+' días',n))});
function llenaDia4(){if(!LARGOS)return;var antes=elD4.value;elD4.innerHTML='';if(elD.value!=='4')elD4.add(new Option('Roma','roma'));elD4.add(new Option('Excursión','excursion'));if(antes&&Array.prototype.some.call(elD4.options,function(o){return o.value===antes}))elD4.value=antes}
llenaDia4();
Object.keys(COMBOS).forEach(function(k){elC.add(new Option(k+' · '+COMBOS[k]+(k==='A'?' (la base)':''),k))});
var iniciosVistos={};V.forEach(function(v){if(!iniciosVistos[v.inicio]){iniciosVistos[v.inicio]=1;var f=v.inicio.split('-');elI.add(new Option(v.dia_semana_inicio+' '+Number(f[2])+' nov',v.inicio))}});
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function actual(){return V.find(function(v){return v.n==elD.value&&(!LARGOS||v.dia4===elD4.value)&&v.combo===elC.value&&v.inicio===elI.value})}
function indiceDe(v){return V.indexOf(v)}
function tieneMarca(v,m){return v.dias.some(function(d){return (m==='tarde'&&d.acaba_tarde)||d.paradas.some(function(p){return (p.marcas||[]).indexOf(m)>=0})})}
function pintaMarcas(){
 elM.innerHTML='';
 ORDEN.forEach(function(m){
  var b=document.createElement('button');b.className='chip '+m;b.type='button';
  b.innerHTML=NOMBRES[m]+' <small>'+R[m].total+' en '+R[m].rutas+' rutas</small> ▸ siguiente';
  b.onclick=function(){siguiente(m)};elM.appendChild(b)});
 var o=document.createElement('button');o.className='chip otra';o.type='button';o.textContent='Siguiente marca (cualquiera) ▸';o.onclick=function(){siguiente(null)};elM.appendChild(o)}
function marcasDe(m){return Array.prototype.slice.call(elR.querySelectorAll(m?'[data-m~="'+m+'"]':'[data-m]'))}
var ultima=null;
function saltaA(el){if(ultima)ultima.classList.remove('actual');ultima=el;el.classList.add('actual');el.scrollIntoView({block:'center',inline:'center',behavior:'smooth'})}
function siguiente(m){
 var lista=marcasDe(m);
 var i=ultima?lista.indexOf(ultima):-1;
 if(i>=0&&i<lista.length-1){saltaA(lista[i+1]);return}
 if(i<0&&lista.length&&!ultima){saltaA(lista[0]);return}
 // Ya no quedan en esta ruta: la siguiente ruta que tenga esa marca.
 var v=actual(),k=indiceDe(v);
 for(var j=1;j<=V.length;j++){var w=V[(k+j)%V.length];var ok=m?tieneMarca(w,m):ORDEN.some(function(x){return tieneMarca(w,x)});
  if(ok){elD.value=w.n;llenaDia4();if(LARGOS)elD4.value=w.dia4;elC.value=w.combo;elI.value=w.inicio;ultima=null;pinta();var l=marcasDe(m);if(l.length)saltaA(l[0]);return}}}
function pinta(){
 var v=actual();location.hash=v.n+'-'+(LARGOS?v.dia4+'-':'')+v.combo+'-'+v.inicio;
 var h='';
 h+='<div class="fila">';
 v.dias.forEach(function(d){
  var marcasDia=d.acaba_tarde?' data-m="tarde"':'';
  h+='<section class="dia"'+marcasDia+'><h2>Día '+d.numero+' · '+esc(d.nombre)+'</h2><div class="sub">'+d.dia_semana+' '+Number(d.fecha.slice(8))+' nov'+(d.acaba_tarde?' <span class="pill tarde">día muy tarde</span>':'')+'</div>';
  if(d.eleccion)h+='<div class="eleccion">'+esc(d.eleccion)+'</div>';
  (d.avisos_dia||[]).forEach(function(a){h+='<div class="avisoDia">'+esc(a)+'</div>'});
  h+='<ol>';var n=0;
  d.paradas.forEach(function(p,i){
   var esParada=(p.tipo==='parada'||p.tipo==='noche'||p.tipo==='free_tour'||p.tipo==='pausa');
   if(esParada)n++;
   var ms=(p.marcas||[]).join(' ');
   h+='<li class="parada'+(p.entra?' entra':'')+'"'+(ms?' data-m="'+ms+'"':'')+'>';
   h+='<span class="n">'+(esParada?n:'·')+'</span><span class="nombre">'+esc(p.tipo==='comida'||p.tipo==='cena'?p.nombre_app+(p.restaurante?' · '+p.restaurante:' · (sin restaurante)'):p.nombre_app)+'</span>';
   if(p.tipo==='noche'||p.tipo==='free_tour'||p.tipo==='pausa'||p.tipo==='de_camino')h+='<span class="tipo '+p.tipo+'">'+(p.tipo==='noche'?'de noche':p.tipo==='free_tour'?'Free Tour':p.tipo==='de_camino'?'de camino (sin número)':'pausa')+'</span>';
   if(p.minutos!=null)h+=' <span class="min">'+p.minutos+' min</span>';
   if(p.entra)h+=' <span class="pill" style="background:var(--entra)">entra</span>';
   if(p.zona)h+='<div class="sub">'+esc(p.zona)+'</div>';
   if(p.trayecto_comida)h+='<div class="sub">'+esc(p.trayecto_comida)+'</div>';
   if(p.horario)h+='<div class="sub">'+esc(p.horario)+'</div>';
   if(p.nombre_base)h+='<div class="base">nombre del sitio: '+esc(p.nombre_base)+(p.titulo_escrito?' · título del día escrito: «'+esc(p.titulo_escrito)+'»':'')+'</div>';
   (p.marcas||[]).forEach(function(m){if(m==='titulo'||m==='repetida'||m==='cerrada')h+='<span class="pill '+m+'">'+NOMBRES[m]+'</span>'});
   (p.avisos||[]).forEach(function(a){h+='<span class="aviso">'+esc(a)+'</span>'});
   if(p.por_que&&p.por_que.length){h+='<ul class="porque">';p.por_que.forEach(function(r){h+='<li>'+esc(r)+'</li>'});h+='</ul>'}
   h+='</li>';
   if(p.trayecto){var larga=(p.marcas||[]).indexOf('andando')>=0;h+='<li class="trayecto'+(larga?' larga':'')+'"'+(larga?' data-m="andando"':'')+'>↓ '+esc(p.trayecto)+(larga?' · <span class="pill andando">más de 20 min andando</span>':'')+'</li>'}
  });
  h+='</ol>';
  if(d.plan_lluvia||(d.plan_lluvia_quita&&d.plan_lluvia_quita.length)){h+='<details><summary>Si llueve</summary><p>'+esc(d.plan_lluvia||'')+'</p>'+((d.plan_lluvia_quita||[]).length?'<p>Sale: '+d.plan_lluvia_quita.map(esc).join(', ')+'</p>':'')+((d.plan_lluvia_pone||[]).length?'<p>Entra: '+d.plan_lluvia_pone.map(esc).join(', ')+'</p>':'')+'</details>'}
  if((d.deja_fuera||[]).length)h+='<details open><summary>No te dio tiempo</summary><p>'+d.deja_fuera.map(esc).join(', ')+'</p></details>';
  h+='</section>'});
 h+='</div>';
 h+='<div class="sale"><h3>'+(v.combo==='A'?'Es la base (A): contra ella se compara lo demás.':'Lo que sale respecto a la base (A, '+v.n+' días'+(LARGOS?', día 4: '+(v.dia4==='roma'?'Roma':'excursión'):'')+', mismo inicio)')+'</h3>';
 if(v.combo!=='A'){h+=(v.sale&&v.sale.length)?v.sale.map(function(x){return '<span>'+esc(x)+'</span>'}).join(''):'<em>Nada: las mismas paradas, en otro orden o con otras comidas.</em>'}
 h+='</div>';
 elR.innerHTML=h;ultima=null;
 var tot=0;v.dias.forEach(function(d){d.paradas.forEach(function(p){tot+=(p.marcas||[]).length});if(d.acaba_tarde)tot++});
 elN.textContent=v.n+' días'+(LARGOS?' (día 4: '+(v.dia4==='roma'?'Roma':'excursión')+')':'')+' · '+v.nombre_combo+' · empieza el '+v.dia_semana_inicio+' · '+tot+' marcas en esta ruta ('+V.length+' rutas en total; datos del '+D.generado+').'}
elD.onchange=function(){llenaDia4();pinta()};[elC,elI].concat(LARGOS?[elD4]:[]).forEach(function(e){e.onchange=function(){pinta()}});
var h0=(location.hash||'').slice(1).split('-');
if(LARGOS&&h0.length>=6){elD.value=h0[0];llenaDia4();elD4.value=h0[1];elC.value=h0[2];elI.value=h0.slice(3).join('-')}else if(!LARGOS&&h0.length>=5){elD.value=h0[0];elC.value=h0[1];elI.value=h0.slice(2).join('-')}else{elD.value=LARGOS?5:3;llenaDia4();if(LARGOS)elD4.value='roma';elC.value='A';elI.selectedIndex=0}
pintaMarcas();pinta();
})();
</script>
</body>
</html>
`
  fs.writeFileSync(largos ? 'docs/dias/RUTAS_REVISION_LARGOS.html' : 'docs/dias/RUTAS_REVISION.html', html)
  return html.length
}

if (process.argv[1] && process.argv[1].endsWith('rutasRevisionPagina.mjs')) {
  const largos = process.argv.includes('--set=largos')
  const d = JSON.parse(fs.readFileSync(largos ? 'scripts/destino/_rutasRevisionLargosViajes.json' : 'scripts/destino/_rutasRevisionViajes.json', 'utf8'))
  const bytes = escribirPagina({ resumen: d.resumen, viajes: d.viajes, generado: d.generado ?? new Date().toISOString().slice(0, 10), largos })
  console.log(`docs/dias/RUTAS_REVISION.html escrita (${(bytes / 1024).toFixed(0)} KB)`)
}
