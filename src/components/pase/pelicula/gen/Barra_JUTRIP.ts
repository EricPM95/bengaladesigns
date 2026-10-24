// @ts-nocheck
// GENERADO por scripts/destino/generarPelicula.mjs desde docs/diseno/proyecto/Piezas/Barra JUTRIP.dc.html — no editar a mano (se vuelve a generar).
export const plantilla = [{"t":"div","a":{"style":"width:100%;height:64px;border-radius:22px;background:{{ bg }};box-shadow:{{ sh }};display:flex;align-items:center;padding:0 6px;gap:2px;box-sizing:border-box"},"c":["\n  ",{"f":"{{ items }}","as":"n","c":[{"t":"span","a":{"style":"flex:1;height:46px;border-radius:999px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:{{ n.bg }};color:{{ n.c }}"},"c":[{"t":"svg","a":{"width":"20","height":"20","viewBox":"0 0 24 24","fill":"none","stroke":"currentColor","strokeWidth":"1.7","strokeLinecap":"round","strokeLinejoin":"round"},"c":[{"t":"path","a":{"d":"{{ n.d }}"},"c":[]}]},{"t":"span","a":{"style":"font:600 9.5px 'Geist',sans-serif"},"c":["{{ n.n }}"]}]}]}]}]
export const css = ""
export const porDefecto = {"tone":"tinta","act":2}
export const imports = []
export function crearLogica(DCLogic, React, MAPAS) {

class Component extends DCLogic {
  renderVals(){
    const D=[['Hoy','M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],['Ruta','M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 17c6 0 2-8 8-8h2'],['Días','M4 6h16v14H4zM4 10h16M8 3v4M16 3v4'],['Explorar','M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9l-2 5-5 1 2-5z'],['Reservas','M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z']];
    const t=this.props.tone||'tinta',a=this.props.act==null?2:+this.props.act;
    const T={tinta:{bg:'#1C2230',sh:'0 14px 28px -12px rgba(28,34,48,.6)',on:'#FBF3E2',onc:'#A67C52',off:'rgba(251,243,226,.7)'},
      marfil:{bg:'#FFFDF8',sh:'0 10px 24px -10px rgba(111,78,55,.4),inset 0 0 0 1px rgba(166,124,82,.25)',on:'#F1E3BF',onc:'#6F4E37',off:'rgba(28,34,48,.55)'},
      noche:{bg:'#1E222C',sh:'0 14px 28px -12px rgba(0,0,0,.7),inset 0 0 0 1px rgba(233,199,122,.2)',on:'#E9C77A',onc:'#14161C',off:'rgba(243,238,228,.6)'}}[t]||{};
    return{bg:T.bg,sh:T.sh,items:D.map((x,i)=>({n:x[0],d:x[1],bg:i===a?T.on:'transparent',c:i===a?T.onc:T.off}))};
  }
}

return typeof Component !== 'undefined' ? Component : undefined
}
