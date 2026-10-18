// @ts-nocheck
// Pieza portada del diseño de Claude Design (Piezas/Medalla Grado.dc.html). Generado con dc2tsx; manda lo que se ve en el diseño.
import React from 'react'
import './MedallaGrado.css'

const DCLogic: any = React.Component
const T = (v) => (<><div style={{ "position": "relative", "width": v.sz, "height": v.sz, "flex": "none" } as React.CSSProperties} className="dib"><svg width="100%" height="100%" viewBox="0 0 120 120" style={{ "overflow": "visible", "filter": "drop-shadow(0 7px 9px rgba(10,14,28,.45))" } as React.CSSProperties}><defs><radialGradient id={`${v.u}f`} cx=".36" cy=".3" r=".9">{(v.fs || []).map((s, __k) => (<React.Fragment key={__k}><stop offset={s.o} stopColor={s.c}></stop></React.Fragment>))}</radialGradient><linearGradient id={`${v.u}r`} x1="0" y1="0" x2="1" y2="1">{(v.rs || []).map((s, __k) => (<React.Fragment key={__k}><stop offset={s.o} stopColor={s.c}></stop></React.Fragment>))}</linearGradient><linearGradient id={`${v.u}r2`} x1="1" y1="0" x2="0" y2="1">{(v.rs || []).map((s, __k) => (<React.Fragment key={__k}><stop offset={s.o} stopColor={s.c}></stop></React.Fragment>))}</linearGradient><radialGradient id={`${v.u}g`}><stop offset="0" stopColor={v.glowC} stopOpacity=".75"></stop><stop offset="1" stopColor={v.glowC} stopOpacity="0"></stop></radialGradient><linearGradient id={`${v.u}sh`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".55"></stop><stop offset=".45" stopColor="#FFFFFF" stopOpacity="0"></stop></linearGradient><filter id={`${v.u}b`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="bl"></feGaussianBlur><feSpecularLighting in="bl" surfaceScale="3.2" specularConstant="1" specularExponent="22" lightingColor="#FFFFFF" result="sp"><feDistantLight azimuth="225" elevation="42"></feDistantLight></feSpecularLighting><feComposite in="sp" in2="SourceAlpha" operator="in" result="sp2"></feComposite><feComposite in="SourceGraphic" in2="sp2" operator="arithmetic" k1="0" k2="1" k3=".75" k4="0"></feComposite></filter><filter id={`${v.u}e`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation=".7" result="bl"></feGaussianBlur><feSpecularLighting in="bl" surfaceScale="2.4" specularConstant="1.1" specularExponent="16" lightingColor="#FFFFFF" result="sp"><feDistantLight azimuth="225" elevation="38"></feDistantLight></feSpecularLighting><feComposite in="sp" in2="SourceAlpha" operator="in" result="sp2"></feComposite><feComposite in="SourceGraphic" in2="sp2" operator="arithmetic" k1="0" k2="1" k3=".9" k4="0"></feComposite><feDropShadow dx=".6" dy="1" stdDeviation=".6" floodColor="#000000" floodOpacity=".55"></feDropShadow></filter></defs><circle cx="60" cy="60" r="64" fill={`url(#${v.u}g)`} opacity={v.glowO}></circle><g filter={`url(#${v.u}b)`}>{(v.leaves || []).map((l, __k) => (<React.Fragment key={__k}><path d="M-8 0Q-2 -4.2 8 0Q-2 4.2 -8 0Z" transform={l} fill={`url(#${v.u}r2)`} stroke="rgba(0,0,0,.35)" strokeWidth=".35"></path></React.Fragment>))}<path d={v.rim} fill={`url(#${v.u}r)`} stroke="rgba(0,0,0,.4)" strokeWidth=".7"></path><path d={v.rimB} fill={`url(#${v.u}r2)`}></path>{(v.nubs || []).map((n, __k) => (<React.Fragment key={__k}><path d="M0 -3.2L1.6 0L0 3.2L-1.6 0Z" transform={n} fill={`url(#${v.u}r)`} stroke="rgba(0,0,0,.35)" strokeWidth=".35"></path></React.Fragment>))}</g><path d={v.groove} fill="rgba(0,0,0,.45)"></path><path d={v.face} fill={`url(#${v.u}f)`}></path><path d={v.ring} fill="none" stroke={v.ringC} strokeWidth=".7" strokeDasharray="1 1.8"></path>{(v.dots || []).map((d, __k) => (<React.Fragment key={__k}><circle cx={d.x} cy={d.y} r={d.r} fill="#FFFFFF" opacity={d.o}></circle></React.Fragment>))}<g filter={`url(#${v.u}e)`}><g transform="translate(37 37.5) scale(1.92)" fill="none" stroke={v.icL} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d={v.icon}></path></g></g><path d={v.face} fill={`url(#${v.u}sh)`} opacity=".7" style={{ "pointerEvents": "none" } as React.CSSProperties}></path><g filter={`url(#${v.u}b)`}>{(v.gems || []).map((g, __k) => (<React.Fragment key={__k}><path d="M0 -7.5L2.6 0L0 7.5L-2.6 0Z" transform={g.t} fill={g.f} stroke="rgba(0,0,0,.3)" strokeWidth=".5"></path></React.Fragment>))}</g>{(v.star) ? (<><path d="M60 -1.5L62.2 4.2L68 4.6L63.5 8.2L65 13.8L60 10.6L55 13.8L56.5 8.2L52 4.6L57.8 4.2Z" fill={`url(#${v.u}r)`} stroke="rgba(0,0,0,.35)" strokeWidth=".5" filter={`url(#${v.u}b)`}></path></>) : null}</svg></div></>)

let UID=0;
const G={
 bronce:[['#F3C79C','#B9784A','#6B3E20'],['#F6CFA8','#9A5A30','#5A3018','#E8B184','#7E4626'],'#FFE6CC',0,'#E3A97B'],
 plata:[['#FFFFFF','#C3C9D0','#6C737D'],['#FFFFFF','#9AA2AC','#4E555E','#E6EAEE','#7A828C'],'#FFFFFF',0,'#F4F6F8'],
 oro:[['#FFF3C8','#E0B55A','#8A6420'],['#FFF4CC','#C8962E','#7A5414','#F6D782','#A27424'],'#FFF4D6',0,'#FFE7A8'],
 noche:[['#4A6FB8','#223C7A','#0C1838'],['#FFFFFF','#A8B4C8','#5A6476','#E2E8F2','#8A96AA'],'#F3D59A',1,'#C9D6F2'],
 magenta:[['#F6B6E8','#B452BE','#561A6A'],['#FFE6F7','#C77AC8','#7A3A86','#F4CDEE','#A55AAE'],'#FFEAF8',1,'#F3A8E2'],
 esmeralda:[['#BDF2CB','#3F9E66','#164A2E'],['#FFF4CC','#C8962E','#7A5414','#F6D782','#A27424'],'#F2FFF4',1,'#B8F0C6'],
 diamante:[['#FFFFFF','#BFE4FF','#5E9BD6'],['#FFFFFF','#CFE9FF','#6FA9E0','#EAF6FF','#8CC0F0'],'#FFFFFF',1,'#CFEAFF'],
 holo:[['#FFE3F3','#D9E7FF','#D7FFF1','#FFF4CF','#EAD9FF'],['#FFFFFF','#CFD7EA','#F6E7FF','#D7FFF1','#FFE3F3'],'#FFFFFF',1,'#EAD9FF']};
const poly=(n,r,rot)=>{let d='';for(let i=0;i<n;i++){const a=(rot+i*360/n)*Math.PI/180;d+=(i?'L':'M')+(60+r*Math.cos(a)).toFixed(2)+' '+(60+r*Math.sin(a)).toFixed(2);}return d+'Z';};
const circ=r=>`M${60-r} 60A${r} ${r} 0 1 0 ${60+r} 60A${r} ${r} 0 1 0 ${60-r} 60Z`;
const shp=(s,r)=>s==='oct'?poly(8,r*1.05,22.5):s==='hex'?poly(6,r*1.1,-90):circ(r);
class MedallaGrado extends DCLogic {
  constructor(p){super(p);this.u='mg'+(++UID);}
  renderVals(){const p=this.props;const g=G[p.grade]||G.bronce;const s=p.shape||'round';const fx=Number(p.fx)||0;const lau=!!(p.lau&&p.lau!=='false'&&p.lau!=='0');
    const st=a=>a.map((c,i)=>({c,o:(i/(a.length-1)).toFixed(2)}));
    const R=lau?43:47;
    const leaves=[];if(lau){for(const side of [-1,1])for(let k=0;k<8;k++){const a=side<0?112+k*14:68-k*14;const rad=a*Math.PI/180;const rr=R+7;const x=60+rr*Math.cos(rad),y=60+rr*Math.sin(rad);leaves.push(`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a+(side<0?-72:72)).toFixed(0)})`);}}
    const nubs=[0,90,180,270].map(a=>{const rad=(a-90)*Math.PI/180;return`translate(${(60+(R-3)*Math.cos(rad)).toFixed(1)} ${(60+(R-3)*Math.sin(rad)).toFixed(1)}) rotate(${a})`;});
    const dots=g[3]?Array.from({length:9},(_,i)=>({x:(60+Math.cos(i*2.3+.4)*26*(.55+(i%4)*.12)).toFixed(1),y:(60+Math.sin(i*2.3+.4)*26*(.55+(i%4)*.12)).toFixed(1),r:(i%3===0?1.3:.7),o:(.45+(i%3)*.2).toFixed(2)})):[];
    const gemC=p.grade==='diamante'?'#EAF8FF':p.grade==='holo'?'#F6E7FF':p.grade==='magenta'?'#FFD3F0':p.grade==='noche'?'#E6ECF6':'#FFF3D0';
    const gp=[];if(fx>=3)gp.push([60-R-2,60],[60+R+2,60]);if(fx>=5){const d=(R+1)*.72;gp.push([60-d,60-d],[60+d,60-d]);}
    return{u:this.u,sz:(Number(p.size)||104)+'px',fs:st(g[0]),rs:st(g[1]),icL:g[2],ringC:g[3]?'rgba(255,255,255,.35)':'rgba(0,0,0,.25)',
      rim:shp(s,R),rimB:shp(s,R-3.5),groove:shp(s,R-6.2),face:shp(s,R-7.4),ring:shp(s,R-11),icon:p.icon||'',leaves,nubs,dots,star:fx>=1,
      gems:gp.map(([x,y])=>({t:`translate(${x} ${y})`,f:gemC})),glowC:g[4],glowO:fx>=4?(fx>=6?'1':'.7'):'0'};}
}

MedallaGrado.defaultProps = {"grade":"oro","shape":"round","icon":"M12 2.5l1.6 7.9 7.9 1.6-7.9 1.6-1.6 7.9-1.6-7.9-7.9-1.6 7.9-1.6z","fx":2,"lau":true,"size":120}

MedallaGrado.prototype.render = function () { return T(this.renderVals()) }
export default MedallaGrado as unknown as React.ComponentType<any>
