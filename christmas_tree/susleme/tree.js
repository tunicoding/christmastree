import * as T from './vendor/three.module.js';
const $=id=>document.getElementById(id), stage=$('stage'), axis=new T.Vector3(0,1,0), V=(x,y,z)=>new T.Vector3(x,y,z);
const motion=matchMedia('(prefers-reduced-motion: reduce)'), snow=$('snowfall'), snowToggle=$('snow-toggle');
let snowOn=true;
for(let i=0;i<26;i++){const f=document.createElement('span');f.className='flake';f.style.setProperty('--x',(7.37+i*37.71)%100+'%');f.style.setProperty('--s',(1.2+(i*13%9)*.32)+'px');f.style.setProperty('--d',(12+(i*7%17))+'s');f.style.setProperty('--delay',-(i*11%22)+'s');f.style.setProperty('--o',(.23+(i*5%7)*.075).toFixed(2));f.style.setProperty('--drift',((i*19%55)-22)+'px');snow.append(f)}
function updateSnow(){snowToggle.hidden=motion.matches;snow.hidden=!snowOn||motion.matches;snowToggle.setAttribute('aria-pressed',String(!snow.hidden));snowToggle.textContent=snow.hidden?'Kar: Kapalı':'Kar: Açık'}
snowToggle.onclick=()=>{snowOn=!snowOn;updateSnow()};updateSnow();
const scene=new T.Scene();scene.fog=new T.FogExp2('#192f28',.045);
const camera=new T.PerspectiveCamera(35,1,.1,45);
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;renderer.outputColorSpace=T.SRGBColorSpace;
const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Ağacı çevirmek için okları kullan; seçilen süsü takmak için Enter’a bas.');stage.prepend(canvas);
const hemi=new T.HemisphereLight('#e4efd1','#293025',2.5);scene.add(hemi);
function light(col,intensity,x,y,z){const l=new T.DirectionalLight(col,intensity);l.position.set(x,y,z);scene.add(l);return l}
const key=light('#ffe0a6',3.4,-4,7,5), rimLight=light('#a2e5d4',2.6,3,5,-4), fill=light('#ffe3bc',.65,5,1,4);
// Broad reflection sources keep glass and metal ornaments readable without external textures.
const envPixels=new Uint8Array(128*64*4);
for(let y=0;y<64;y++)for(let x=0;x<128;x++){
 const gl=(cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
 const warm=gl(93,21,10,7), cold=gl(37,22,13,11), floor=gl(66,49,36,21), i=(y*128+x)*4;
 envPixels.set([27+210*warm+77*cold+31*floor,36+154*warm+99*cold+25*floor,37+104*warm+119*cold+17*floor,255],i)
}
const studioReflection=new T.DataTexture(envPixels,128,64);studioReflection.mapping=T.EquirectangularReflectionMapping;studioReflection.colorSpace=T.SRGBColorSpace;studioReflection.needsUpdate=true;scene.environment=studioReflection;scene.environmentIntensity=.5;
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=96;const sh=shadowCanvas.getContext('2d'),sg=sh.createRadialGradient(48,48,1,48,48,46);sg.addColorStop(0,'#020b08df');sg.addColorStop(.58,'#020b0866');sg.addColorStop(1,'#020b0800');sh.fillStyle=sg;sh.fillRect(0,0,96,96);
const shade=new T.Mesh(new T.PlaneGeometry(6.3,4.2),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shade.rotation.x=-Math.PI/2;shade.position.set(.25,-.028,.06);scene.add(shade);
const tree=new T.Group();scene.add(tree);const hung=new T.Group();tree.add(hung);
const mat=(color,metalness=0,roughness=.65)=>new T.MeshStandardMaterial({color,metalness,roughness});
const wood=mat('#70422e',0,.93), bark=mat('#38291d',0,1), gold=mat('#e3af60',.48,.26), deep=mat('#704323',.12,.53);
function mesh(geo,material,parent,x=0,y=0,z=0){const m=new T.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m}
function limb(a,b,r1,r2,m,par){const d=b.clone().sub(a),msh=mesh(new T.CylinderGeometry(r2,r1,d.length(),6),m,par);msh.position.copy(a).lerp(b,.5);msh.quaternion.setFromUnitVectors(axis,d.normalize());return msh}
mesh(new T.CylinderGeometry(.026,.086,3.65,12),wood,tree,0,1.88,0);
for(let i=0;i<5;i++){const a=i*Math.PI*.4;limb(V(0,.07,0),V(Math.sin(a)*.43,.02,Math.cos(a)*.43),.075,.036,bark,tree)}
let seed=16027;const rng=()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;
const needlePos=[],needleCols=[],anchors=[],boughs=[];
const greens=['#113d28','#184c32','#215d3d','#316f4b','#448559','#547d46','#194b38','#638353','#214e35'].map(x=>new T.Color(x));
function needle(o,d,len,w,color){const a=V(d.z,0,-d.x).normalize().multiplyScalar(w),p=o.clone().addScaledVector(d,len);needlePos.push(o.x+a.x,o.y+a.y,o.z+a.z,o.x-a.x,o.y-a.y,o.z-a.z,p.x,p.y,p.z);needleCols.push(color.r*.63,color.g*.7,color.b*.67,color.r*.79,color.g*.84,color.b*.79,color.r,color.g,color.b)}
function spray(a,b,n,scale){const vec=b.clone().sub(a),heading=vec.clone().normalize(),cross=V(-heading.z,0,heading.x).normalize();for(let i=0;i<n;i++){const t=rng(),o=a.clone().addScaledVector(vec,t);o.y+=(rng()-.5)*.025;const d=heading.clone().multiplyScalar(.36+rng()*.47).addScaledVector(cross,(rng()-.5)*2.4);d.y+=(rng()-.27)*1.25;d.normalize();const len=(.085+rng()*.16)*scale*(1-.34*t);needle(o,d,len,(.008+rng()*.012)*scale,greens[(rng()*greens.length)|0]);}}
const levels=19;
for(let k=0;k<levels;k++){const y=.48+k*.179,r=1.51*Math.pow(1-k/20,.88),n=k<11?10:8;for(let j=0;j<n;j++){
 const theta=j/n*Math.PI*2+k*1.73+(rng()-.5)*.23;const dx=Math.sin(theta),dz=Math.cos(theta), reach=r*(.80+rng()*.28),yy=y+(rng()-.5)*.15;
 const a=V(dx*.04,yy+.08,dz*.04),b=V(dx*reach,yy-.20+(rng()-.4)*.19,dz*reach);limb(a,b,.022*(1-k*.027),.0036,bark,tree);spray(a,b,86,1.12);
 for(let p=0;p<9;p++){const t=.19+p*.085,o=a.clone().lerp(b,t),s=(p%2?1:-1),fan=theta+s*(.38+rng()*.8),len=(.23+rng()*.10)*(1-t*.59)*(1-k*.022);const q=o.clone().add(V(Math.sin(fan)*len,.025+(rng()-.48)*.11,Math.cos(fan)*len));spray(o,q,21,1.08-k*.019)}
 boughs.push({a,b,k,theta});
 if(k%2===0||j%2===0){const p=b.clone().multiply(V(1.02,1,1.02));p.y-=.035;anchors.push({p,cap:false});}
 }}
spray(V(0,3.57,0),V(.01,4.02,0),118,.66);anchors.push({p:V(0,4.05,0),cap:true});
// Layer uneven short, upswept tips over the original shape. Anchor indices stay stable.
for(const {a,b,k,theta} of boughs){
 if(rng()<.13)continue;
 const o=a.clone().lerp(b,.48+rng()*.24), sign=rng()<.5?-1:1, f=theta+sign*(.12+rng()*.41);
 const scale=1-k*.024,len=(.19+rng()*.18)*scale;
 const tip=o.clone().add(V(Math.sin(f)*len,.11+rng()*.15,Math.cos(f)*len));
 spray(o,tip,39,scale*.91);
 const end=a.clone().lerp(b,.82), bend=b.clone().add(V(Math.sin(theta)*.035,.044+sinN(theta+k)*.033,Math.cos(theta)*.035));
 spray(end,bend,25,scale*.86);
}
function sinN(a){return Math.sin(a*1.83)}
const foliageGeo=new T.BufferGeometry();foliageGeo.setAttribute('position',new T.Float32BufferAttribute(needlePos,3));foliageGeo.setAttribute('color',new T.Float32BufferAttribute(needleCols,3));foliageGeo.computeVertexNormals();
mesh(foliageGeo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1}),tree);
const pot=mat('#a65739',.04,.84),rim=mat('#ba7250',.07,.8);
mesh(new T.CylinderGeometry(.425,.342,.28,48),pot,tree,0,.135,0);mesh(new T.CylinderGeometry(.46,.449,.079,48),rim,tree,0,.264,0);mesh(new T.CylinderGeometry(.413,.4,.018,32),bark,tree,0,.305,0);
const chain=new T.Group();chain.visible=false;tree.add(chain);
const cordPoints=[], ledPoints=[];
for(let i=0;i<=180;i++){
 const u=i/180,a=u*Math.PI*2*4.2+.5,y=.58+3.04*u+.045*Math.sin(a*2.4),r=1.53*Math.pow(1-u,.87)*.97+.08+Math.sin(a*2+.8)*.035;
 const pos=V(Math.sin(a)*r,y,Math.cos(a)*r);cordPoints.push(pos);if(i%4===0)ledPoints.push(pos);
}
mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cordPoints),180,.007,5,false),mat('#28372b',.12,.65),chain);
const socketGeo=new T.SphereGeometry(.019,10,8), haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=64;
const hc=haloCanvas.getContext('2d'), hg=hc.createRadialGradient(32,32,0,32,32,31);hg.addColorStop(0,'#ffffff');hg.addColorStop(.19,'#ffffff9c');hg.addColorStop(.51,'#ffffff38');hg.addColorStop(1,'#ffffff00');hc.fillStyle=hg;hc.fillRect(0,0,64,64);
const haloMap=new T.CanvasTexture(haloCanvas), bulbColors=['#ffdaa0','#fff1ba','#ffc37b'];
for(const [i,p] of ledPoints.entries()){
 const col=bulbColors[i%3];mesh(socketGeo,new T.MeshBasicMaterial({color:col,toneMapped:false}),chain,p.x,p.y,p.z);
 const s=new T.Sprite(new T.SpriteMaterial({map:haloMap,color:col,transparent:true,opacity:.62,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
 s.position.copy(p);s.scale.setScalar(.23+(i%5)*.015);chain.add(s);
}
const kinds=[
 ['ruby','Kırmızı','#ac2639','ball'],['gold','Altın','#dda145','ball'],['pearl','İnci','#eadbc3','ball'],
 ['jade','Yeşil','#3b805a','ball'],['blue','Mavi','#426fac','ball'],['rose','Pembe','#c15a78','ball'],
 ['star','Yıldız','#e9af4d','star'],['snow','Kar tanesi','#d8e8ef','snow'],['cane','Baston','#ad2e42','cane'],
 ['bow','Kurdele','#b32c44','bow'],['bell','Çan','#edb65b','bell'],['pine','Kozalak','#986340','pine']
].map(([id,name,color,shape])=>({id,name,color,shape}));
const starPath='M24 4l5.8 12 13.2 1.9-9.6 9.3 2.3 13.1-11.7-6.2-11.7 6.2 2.3-13.1L5 17.9 13.2-1.9z'.replace('L5 17.9 13.2-1.9z','L5 17.9l13.2-1.9z');
function icon(k){
 const c=k.color;
 let svg='';
 if(k.shape==='ball')svg='<defs><radialGradient id="a" cx="33%" cy="28%"><stop stop-color="#fff6db"/><stop offset=".41" stop-color="'+c+'"/><stop offset="1" stop-color="'+c+'"/></radialGradient></defs><path d="M20 9V6h8v3" stroke="#956944" fill="none" stroke-width="2"/><circle cx="24" cy="25" r="15" fill="url(#a)" stroke="#4b302c" stroke-opacity=".3"/><path d="M12 30q12 10 24 0M12 22q12 10 24 0" fill="none" stroke="#fff0c9" stroke-opacity=".55"/>';
 if(k.shape==='star')svg='<path d="'+starPath+'" fill="'+c+'" stroke="#906437"/>';
 if(k.shape==='snow')svg='<g stroke="#4d839b" stroke-width="2" stroke-linecap="round">'+[0,60,120,180,240,300].map(a=>'<path transform="rotate('+a+' 24 24)" d="M24 24V6m-5 5 5 5 5-5" fill="none"/>').join('')+'</g>';
 if(k.shape==='cane')svg='<path d="M20 39V16c0-12 15-12 15 0v4" fill="none" stroke="#fff7e4" stroke-width="9" stroke-linecap="round"/><path d="M20 39V16c0-12 15-12 15 0v4" fill="none" stroke="#af2f43" stroke-width="8" stroke-dasharray="5 4"/>';
 if(k.shape==='bow')svg='<path d="M23 22 8 11Q2 13 7 28l14-2-7 14 9-4 4 4 1-13 13 1q6-16-1-17l-14 10z" fill="'+c+'" stroke="#7d2938"/><circle cx="24" cy="23" r="4" fill="#ed8b83"/>';
 if(k.shape==='bell')svg='<path d="M11 33q5-7 5-17c0-11 16-11 16 0q0 10 5 17z" fill="'+c+'" stroke="#947043"/><circle cx="24" cy="36" r="4" fill="'+c+'"/><path d="M13 32h22" stroke="#fff1ad"/>';
 if(k.shape==='pine')svg='<path d="M24 7Q9 18 13 30q4 12 11 12t11-12Q39 18 24 7z" fill="'+c+'" stroke="#74442b"/><path d="m16 19 8 6 8-6m-17 8 9 7 9-7m-14 9 5 4 5-4" fill="none" stroke="#e7b77d" stroke-width="2"/>';
 return 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">'+svg+'</svg>');
}
function extrude(points,material,group){const path=new T.Shape();points.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));path.closePath();return mesh(new T.ExtrudeGeometry(path,{depth:.035,bevelEnabled:true,bevelSegments:2,bevelSize:.013,bevelThickness:.009}),material,group)}
function ornament(k){
 const g=new T.Group(),color=mat(k.color,k.shape==='ball'?.3:.24,.28),cream=mat('#fff0d2',.03,.49);
 if(k.shape==='ball'){
   mesh(new T.SphereGeometry(.126,24,16),color,g,0,-.161,0);
   const hoop=mesh(new T.TorusGeometry(.12,.009,6,32),gold,g,0,-.171,0);hoop.rotation.x=Math.PI/2;
   mesh(new T.CylinderGeometry(.036,.042,.035,10),gold,g,0,-.031,0);
 }else if(k.shape==='star'){
   const v=Array.from({length:10},(_,i)=>{const a=Math.PI/2+i*Math.PI/5,r=i%2?.078:.18;return [Math.cos(a)*r,Math.sin(a)*r-.153]});
   extrude(v,color,g);
 }else if(k.shape==='snow'){
   for(let i=0;i<6;i++){const a=i*Math.PI/3,pt=(r,f=a)=>V(Math.sin(f)*r,Math.cos(f)*r-.15,0),o=V(0,-.15,0);limb(o,pt(.16),.014,.009,color,g);for(const f of [-.55,.55])limb(pt(.078),pt(.145,a+f),.012,.007,color,g);}
 }else if(k.shape==='cane'){
   const points=[V(-.071,-.30,0),V(-.071,-.12,0)];
   for(let i=0;i<=12;i++){const a=Math.PI*(1-i/12);points.push(V(.012+Math.cos(a)*.081,-.11+Math.sin(a)*.087,0))}
   points.push(V(.093,-.15,0));const curve=new T.CatmullRomCurve3(points);const tgeo=new T.TubeGeometry(curve,36,.028,9,false);
   tgeo.clearGroups();for(let i=0;i<36;i++)tgeo.addGroup(i*54,54,Math.floor(i/3)%2);
   mesh(tgeo,[color,cream],g);
 }else if(k.shape==='bow'){
   extrude([[-.015,-.12],[-.17,-.042],[-.18,-.17],[-.038,-.16],[-.09,-.30],[-.02,-.267],[.036,-.31],[.036,-.16],[.177,-.177],[.178,-.046],[.016,-.119]],color,g);mesh(new T.SphereGeometry(.042,12,10),gold,g,0,-.143,.037);
 }else if(k.shape==='bell'){
   mesh(new T.LatheGeometry([[.019,0],[.049,.016],[.064,.06],[.076,.13],[.13,.182],[.127,.199]].map(([x,y])=>new T.Vector2(x,-.026-y)).reverse(),26),color,g);
   mesh(new T.SphereGeometry(.033,12,10),gold,g,0,-.248,0);
 }else if(k.shape==='pine'){
   mesh(new T.SphereGeometry(.095,16,12),color,g,0,-.16,0).scale.set(1,1.43,1);
   for(let l=0;l<5;l++)for(let j=0;j<7;j++){const a=j/7*Math.PI*2+l*.45,r=.055+.039*Math.sin((l+1)*Math.PI/6);const m=mesh(new T.SphereGeometry(.043,9,6),l%2?color:deep,g,Math.sin(a)*r,-.074-l*.042,Math.cos(a)*r);m.scale.set(1,.58,1);}
 }
 limb(V(0,.027,0),V(0,-.026,0),.006,.006,gold,g);return g
}
let angle=-.13, selected=null, drag=null, orbit=null, list=[], history=[], frame=0, active=null, turn=null;
const swinging=new Map();
const dom=new Map(), ghost=$('ghost'), copyVec=new T.Vector3(), projected=new T.Vector3();
const marker=new T.Mesh(new T.SphereGeometry(.048,12,8),new T.MeshBasicMaterial({color:'#ffd189',depthTest:false}));marker.visible=false;marker.renderOrder=20;tree.add(marker);
function draw(now=performance.now()){
 frame=0;
 if(turn){const t=Math.min(1,(now-turn.start)/320);setAngle(turn.from+(turn.to-turn.from)*(1-Math.pow(1-t,3)));if(t===1)turn=null}
 for(const [g,start] of swinging){const t=Math.max(0,(now-start)/1000);g.rotation.z=t>=1?0:Math.sin(t*14+.55)*.29*(1-t)*(1-t);if(t>=1)swinging.delete(g)}
 renderer.render(scene,camera);
 if(turn||swinging.size)invalidate();
}
function invalidate(){if(!frame)frame=requestAnimationFrame(draw)}
motion.addEventListener('change',()=>{updateSnow();if(motion.matches){if(turn)setAngle(turn.to);turn=null;for(const g of swinging.keys())g.rotation.z=0;swinging.clear();invalidate()}});

function size(){const {width:w,height:h}=stage.getBoundingClientRect();if(!w||!h)return;const aspect=w/h, d=Math.max(7.9,5.85/aspect);camera.aspect=aspect;camera.position.set(0,2.64,d);camera.lookAt(0,1.96,0);camera.updateProjectionMatrix();renderer.setSize(w,h,false);snow.style.setProperty('--fall',Math.ceil(h*1.08)+'px');invalidate();}
new ResizeObserver(size).observe(stage);size();
function setAngle(a){angle=a;tree.rotation.y=angle;active=-1;marker.visible=false}
function spin(n){turn=null;setAngle(angle+n);invalidate()}
function animateTurn(n){if(motion.matches){spin(n);return}turn={from:angle,to:(turn?.to??angle)+n,start:performance.now()};invalidate()}
spin(0);
function setSelected(k){selected=k;stage.dataset.armed=String(Boolean(k));for(const [id,b] of dom)b.setAttribute('aria-pressed',String(id===k?.id));$('hint').textContent=k?k.name+' seçildi. Bir dala dokun veya bırak.':'Ağacı çevirmek için sahneyi sürükle.';}
function displayCount(){const n=list.length;$('count').textContent=n+' süs';$('clear').disabled=!n;$('undo').disabled=!history.length}
function free(value){return !list.some(o=>o.i===value)}
function decoration(k,i){const anchor=anchors[i],a=anchor.p,g=ornament(k);g.position.copy(a);g.rotation.y=Math.atan2(a.x,a.z);if(anchor.cap){g.position.y+=.143;g.scale.setScalar(1.36);g.rotation.y=0}hung.add(g);return {id:k.id,i,g}}
function release(g){swinging.delete(g);g.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)for(const m of [].concat(o.material))if(m!==gold&&m!==deep)m.dispose()});hung.remove(g)}
function snapshot(){return list.map(({id,i})=>({id,i}))}
function persist(){try{localStorage.setItem('kis-atolyesi-v1',JSON.stringify(snapshot()))}catch{}}
function restore(data){for(const x of list)release(x.g);list=[];for(const {id,i} of data.slice(0,anchors.length)){const k=kinds.find(k=>k.id===id);if(k&&Number.isInteger(i)&&anchors[i]&&free(i)&&(!anchors[i].cap||k.shape==='star'))list.push(decoration(k,i))}displayCount();invalidate();}
try{const old=JSON.parse(localStorage.getItem('kis-atolyesi-v1')||'[]');if(Array.isArray(old))restore(old)}catch{}
function nearest(x,y,k,keyboard=false){
 const box=canvas.getBoundingClientRect();if(!keyboard&&(x<box.left||x>box.right||y<box.top||y>box.bottom))return -1;
 tree.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 let best=-1,dist=Infinity;for(let i=0;i<anchors.length;i++){const a=anchors[i];if(!free(i)||(a.cap&&k.shape!=='star'))continue;
 copyVec.copy(a.p).applyMatrix4(tree.matrixWorld);if(!a.cap&&copyVec.z<-.06)continue;
 projected.copy(copyVec).project(camera);const px=box.left+(projected.x+1)*box.width/2,py=box.top+(1-projected.y)*box.height/2;
 const d=Math.hypot(x-px,y-py);if(d>(keyboard?box.height:Math.max(27,box.height*.105)))continue;
 const score=d-copyVec.z*2.8;if(score<dist){dist=score;best=i}}
 return best;
}
function showMarker(i){if(active===i)return;active=i;marker.visible=i>=0;if(i>=0)marker.position.copy(anchors[i].p);invalidate()}
function place(k,i){showMarker(-1);if(i<0||!free(i)){$('hint').textContent='Süsü bir dalın ucuna bırak.';return}history.push(snapshot());const o=decoration(k,i);list.push(o);if(!motion.matches)swinging.set(o.g,performance.now());persist();setSelected(null);displayCount();$('hint').textContent=k.name+' ağaca takıldı.';invalidate()}
const iconStudio=new T.Scene(), iconCamera=new T.OrthographicCamera(-.24,.24,.235,-.235,.05,5);
iconCamera.position.set(.115,.065,2);iconCamera.lookAt(0,-.15,0);
iconStudio.environment=studioReflection;iconStudio.environmentIntensity=.65;
iconStudio.add(new T.HemisphereLight('#fff2db','#9d8c79',2.65));
const iconKey=new T.DirectionalLight('#fff6e6',3.3);iconKey.position.set(-2,3,3);iconStudio.add(iconKey);
const iconRim=new T.DirectionalLight('#e4f2ff',1.3);iconRim.position.set(1,1,-2);iconStudio.add(iconRim);
function photo(k){
 const g=ornament(k);iconStudio.add(g);
 renderer.setSize(84,84,false);renderer.render(iconStudio,iconCamera);
 let src;try{src=canvas.toDataURL('image/png')}catch{src=icon(k)}
 iconStudio.remove(g);release(g);return src
}
for(const k of kinds){
 const b=document.createElement('button');b.className='item';b.type='button';b.dataset.kind=k.id;b.setAttribute('aria-pressed','false');const img=new Image();img.src=photo(k);img.alt='';img.draggable=false;const sp=document.createElement('span');sp.textContent=k.name;b.append(img,sp);$('items').append(b);dom.set(k.id,b);
 b.addEventListener('click',e=>{if(!e.detail)setSelected(selected?.id===k.id?null:k)});
 b.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;drag={id:e.pointerId,k,b,x:e.clientX,y:e.clientY,started:false};});
 window.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId||drag.b!==b)return;if(!drag.started&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;if(!drag.started){drag.started=true;setSelected(k);ghost.replaceChildren(img.cloneNode());ghost.hidden=false;stage.classList.add('dragging')}ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';showMarker(nearest(e.clientX,e.clientY,k))});
 function finish(e,cancel){if(drag?.id!==e.pointerId||drag.b!==b)return;const started=drag.started;drag=null;ghost.hidden=true;stage.classList.remove('dragging');if(cancel){showMarker(-1);return}if(started){place(k,nearest(e.clientX,e.clientY,k));return}setSelected(selected?.id===k.id?null:k)}
 window.addEventListener('pointerup',e=>finish(e,false));window.addEventListener('pointercancel',e=>finish(e,true));
}
size();
canvas.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;canvas.setPointerCapture(e.pointerId);orbit={id:e.pointerId,start:e.clientX,x:e.clientX,move:false}});
canvas.addEventListener('pointermove',e=>{if(orbit?.id===e.pointerId){if(Math.abs(e.clientX-orbit.start)>5)orbit.move=true;if(orbit.move)spin((e.clientX-orbit.x)*.012);orbit.x=e.clientX}else if(selected)showMarker(nearest(e.clientX,e.clientY,selected));});
canvas.addEventListener('pointerup',e=>{if(orbit?.id!==e.pointerId)return;const moved=orbit.move;orbit=null;if(selected&&!moved)place(selected,nearest(e.clientX,e.clientY,selected))});canvas.addEventListener('pointercancel',()=>{orbit=null;showMarker(-1)});
canvas.addEventListener('pointerleave',()=>showMarker(-1));
canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();spin(e.key==='ArrowLeft'?-.45:.45)}if(e.key==='Escape'){setSelected(null);showMarker(-1)}if(e.key==='Enter'&&selected){const b=canvas.getBoundingClientRect();place(selected,nearest(b.left+b.width/2,b.top+b.height*.55,selected,true));}});
const looks={
 classic:{key:'#ffe0a6',rim:'#a2e5d4',fill:'#ffe3bc',sky:'#e4efd1',ground:'#293025',power:[3.4,2.6,.65,2.5],exp:1.22},
 ember:{key:'#ffb172',rim:'#a9c8bb',fill:'#ffc87c',sky:'#b4a59b',ground:'#542b20',power:[4.1,1.9,.4,1.64],exp:1.13},
 frost:{key:'#d9eeff',rim:'#9dd9f3',fill:'#fbe5bb',sky:'#c5ddeb',ground:'#405154',power:[3.3,2.85,.52,2.65],exp:1.32},
};
let look='classic';
const lookButtons=[...document.querySelectorAll('button[data-look]')];
function updateLook(name){const m=looks[name];if(!m)return;look=name;stage.dataset.look=name;
 for(const [l,c,j] of [[key,m.key,0],[rimLight,m.rim,1],[fill,m.fill,2]]){l.color.set(c);l.intensity=m.power[j]}
 hemi.color.set(m.sky);hemi.groundColor.set(m.ground);hemi.intensity=m.power[3];renderer.toneMappingExposure=m.exp;
 for(const b of lookButtons)b.setAttribute('aria-pressed',String(b.dataset.look===name));invalidate()
}
function saveLook(){try{localStorage.setItem('kis-atolyesi-look-v1',JSON.stringify({look,chain:chain.visible}))}catch{}}
function toggleLights(on){chain.visible=Boolean(on);$('lights').setAttribute('aria-pressed',String(chain.visible));invalidate()}
for(const b of lookButtons)b.onclick=()=>{updateLook(b.dataset.look);saveLook()};
$('lights').onclick=()=>{toggleLights(!chain.visible);saveLook()};
try{const prefs=JSON.parse(localStorage.getItem('kis-atolyesi-look-v1')||'{}');updateLook(prefs.look??'classic');toggleLights(prefs.chain)}catch{}
const palettes=[
 {name:'Klasik',ids:['ruby','gold','pearl','bow','bell','cane']},
 {name:'Buzlu çam',ids:['blue','pearl','snow','jade','gold']},
 {name:'Şeker vitrini',ids:['rose','ruby','cane','pearl','bow','bell']},
 {name:'Orman',ids:['gold','jade','pine','pearl','bell']},
];
let lastPalette=-1;
function randomize(){
 const p=(lastPalette+1+Math.floor(Math.random()*(palettes.length-1)))%palettes.length;
 const theme=palettes[p];lastPalette=p;
 const azimuth=Math.random()*Math.PI*2, plan=[{id:'star',i:anchors.findIndex(a=>a.cap)}];
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 for(let tier=0;tier<6;tier++){
   const y=.57+tier*.53, n=tier>3?4:5;
   for(let j=0;j<n;j++){
     const phi=azimuth+(j/n+tier*.17)*Math.PI*2+(Math.random()-.5)*.49;
     let best=-1,score=Infinity;
     for(const [i,{p:q,cap}] of anchors.entries()){
       if(cap||plan.some(s=>s.i===i)||Math.abs(q.y-y)>.39)continue;
       const d=Math.abs(wrap(Math.atan2(q.x,q.z)-phi))*.28+Math.abs(y-q.y)*1.22-Math.hypot(q.x,q.z)*.045+Math.random()*.035;
       if(d<score){score=d;best=i}
     }
     if(best>=0)plan.push({i:best,id:theme.ids[(Math.random()*theme.ids.length)|0]});
   }
 }
 history.push(snapshot());restore(plan);persist();setSelected(null);showMarker(-1);
 if(!motion.matches){const t=performance.now();for(const o of list)swinging.set(o.g,t-Math.random()*180);invalidate()}
 $('hint').textContent=theme.name+' düzeni hazır. İstersen geri alabilirsin.';
}
$('random').onclick=randomize;
$('left').onclick=()=>animateTurn(-.57);$('right').onclick=()=>animateTurn(.57);
$('undo').onclick=()=>{if(!history.length)return;restore(history.pop());persist();$('hint').textContent='Son değişiklik geri alındı.'}
$('clear').onclick=()=>{if(!list.length)return;history.push(snapshot());restore([]);persist();$('hint').textContent='Ağaç yeniden boş. İstersen geri alabilirsin.'}
invalidate();
