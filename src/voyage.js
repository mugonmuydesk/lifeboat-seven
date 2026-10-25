// Voyage: from launch to rescue. One hinged instrument, four small sets, ten stations.
// Every number the player sees is a label on geometry; every station changes the hand feel.
const voyage=(()=>{
const C={angle:0xe8b16d,diag:0xeee9d9,fwd:0x62b8b2,opp:0xb48ee0,ok:0x8de0a4,bad:0xe07a7a,zone:0x62b8b2};
const HEX=c=>'#'+c.toString(16).padStart(6,'0');
const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI,fmt=v=>Math.abs(v).toFixed(1)+' m',clamp=THREE.MathUtils.clamp;
const panel=$('stationPanel'),panelTitle=$('stationTitle'),panelBody=$('stationBody'),fade=$('fade');
new ResizeObserver(()=>document.body.style.setProperty('--station-panel-height',panel.offsetHeight+'px')).observe(panel);
// ---------- speech queue: lines play one after another, never over each other ----------
const queue=[];
const misses={};
function talk(who,text,seconds=6){if(who==='coolie'&&/^(Too short|Too long|Off target|Blocked)\.$/.test(text)){const id=currentStation()?.id;if(id)misses[id]=(misses[id]||0)+1;}queue.push([text,who,seconds]);}
function after(fn){queue.push(fn);}
function tickQueue(){if(!queue.length||dialogueOpen||playTime<captionUntil||marvinAudio.isSpeaking())return;const next=queue.shift();if(typeof next==='function')next();else say(...next);}
// ---------- live text as a sprite: numbers sit on the geometry, not in a panel ----------
function liveLabel(color,scale=1){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,depthTest:false,toneMapped:false}));s.scale.set(2.6*scale,.65*scale,1);s.renderOrder=6;let last='';s.set=(text,col=color)=>{if(text===last)return;last=text;x.clearRect(0,0,512,128);x.font='bold 54px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';const w=Math.min(500,x.measureText(text).width+56);x.fillStyle='#0b1527d9';x.beginPath();x.roundRect(256-w/2,18,w,92,24);x.fill();x.strokeStyle=col;x.lineWidth=4;x.stroke();x.fillStyle=col;x.fillText(text,256,66);tex.needsUpdate=true;};return s;}
function dashed(color){const g=new THREE.BufferGeometry().setFromPoints([V(0,0,0),V(1,0,0)]);const l=new THREE.Line(g,new THREE.LineDashedMaterial({color,dashSize:.32,gapSize:.2,toneMapped:false,depthTest:false}));l.renderOrder=4;l.set=(a,b)=>{const p=g.attributes.position;p.setXYZ(0,a.x,a.y,a.z);p.setXYZ(1,b.x,b.y,b.z);p.needsUpdate=true;l.computeLineDistances();};return l;}
function basisQuat(fwd,opp){const c3=new THREE.Vector3().crossVectors(fwd,opp);return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(fwd.clone().normalize(),opp.clone().normalize(),c3));}
function glowMat(color,opacity=1){return new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,toneMapped:false,depthWrite:false,side:THREE.DoubleSide});}
// ---------- the instrument: pivot, arm, tip, two rails, two drop-lines, one right-angle corner ----------
function makeSegment(o){
 const g=new THREE.Group();g.position.copy(o.position);g.quaternion.copy(basisQuat(o.fwd,o.opp));(o.parent||scene).add(g);g.userData.instrument=true;
 const s=o.labelScale||1,maxLen=o.maxLen||10;
 const pivot=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.3,24),mat(palette.dark));pivot.rotation.x=Math.PI/2;g.add(pivot);
 const arm=new THREE.Mesh(new THREE.BoxGeometry(1,.17,.17),mat(C.diag,C.diag));g.add(arm);
 const tip=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),mat(C.diag,C.diag));g.add(tip);
 const arc=new THREE.Mesh(new THREE.RingGeometry(1,1.32,48,1,0,.01),glowMat(C.angle,.9));arc.renderOrder=3;g.add(arc);
 function rail(color,along){const r=new THREE.Group();const bar=new THREE.Mesh(new THREE.BoxGeometry(maxLen,.07,.07),glowMat(color,.8));bar.position.x=maxLen/2;r.add(bar);for(let i=1;i<=maxLen;i++){const t=new THREE.Mesh(new THREE.BoxGeometry(.04,i%5?.22:.4,.07),glowMat(color,.8));t.position.set(i,0,0);r.add(t);}if(along==='y')r.rotation.z=Math.PI/2;g.add(r);return r;}
 const railF=rail(C.fwd,'x'),railO=rail(C.opp,'y');
 const dropO=dashed(C.opp),dropF=dashed(C.fwd);g.add(dropO,dropF);
 const footF=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),glowMat(C.fwd)),footS=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),glowMat(C.opp));g.add(footF,footS);
 const corner=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(0,0,0),V(-.38,0,0),V(-.38,.38,0),V(0,.38,0)]),new THREE.LineBasicMaterial({color:C.diag,toneMapped:false,depthTest:false}));corner.renderOrder=5;g.add(corner);
 const angL=liveLabel(HEX(C.angle),s),lenL=liveLabel(HEX(C.diag),s),fwdL=liveLabel(HEX(C.fwd),s),oppL=liveLabel(HEX(C.opp),s);g.add(angL,lenL,fwdL,oppL);
 const seg={group:g,angle:0,length:0,maxLen,names:o.names||{fwd:'FORWARD',opp:'SIDEWAYS',len:'RANGE'},show:{angle:true,len:true,fwd:true,opp:true,rails:true,corner:true},tint(color){arm.material=mat(color,color);tip.material=arm.material;},
  set(angle,length){seg.angle=angle;seg.length=length;const a=rad(angle),L=length,x=L*Math.cos(a),y=L*Math.sin(a);
   arm.scale.x=Math.max(.001,L);arm.rotation.z=a;arm.position.set(x/2,y/2,0);tip.position.set(x,y,0);
   arc.geometry.dispose();arc.geometry=new THREE.RingGeometry(1,1.32,48,1,0,Math.max(.001,((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2)));
   dropO.set(V(x,y,0),V(x,0,0));dropF.set(V(x,y,0),V(0,y,0));footF.position.set(x,0,0);footS.position.set(0,y,0);
   corner.position.set(x,0,0);corner.scale.set(Math.sign(x)||1,Math.sign(y)||1,1);
   angL.position.set(2.1*Math.cos(a/2),2.1*Math.sin(a/2),0);angL.set(Math.round(angle)+'°');
   const n=V(-Math.sin(a),Math.cos(a),0);lenL.position.set(x/2+n.x*.95*s,y/2+n.y*.95*s,0);lenL.set(seg.names.len+' '+fmt(L));
   fwdL.position.set(x/2,-.85*s,0);fwdL.set(seg.names.fwd+' '+fmt(x));oppL.position.set(-1.25*s,y/2,0);oppL.set(seg.names.opp+' '+fmt(y));
   const sh=seg.show,tiny=L<.05;arc.visible=angL.visible=sh.angle;lenL.visible=sh.len&&!tiny;fwdL.visible=footF.visible=dropO.visible=sh.fwd&&!tiny;oppL.visible=footS.visible=dropF.visible=sh.opp&&!tiny;railF.visible=sh.rails&&sh.fwd;railO.visible=sh.rails&&sh.opp;corner.visible=sh.corner&&sh.fwd&&sh.opp&&!tiny;},
  local(x,y){return g.localToWorld(V(x,y,0));},
  // Screen-space angle of a pointer around the pivot, in the instrument's own frame.
  screenAngle(e){const r=canvas.getBoundingClientRect(),P=toScreen(seg.local(0,0)),F=toScreen(seg.local(1,0)),O=toScreen(seg.local(0,1));const f=[F[0]-P[0],F[1]-P[1]],o=[O[0]-P[0],O[1]-P[1]],d=[e.clientX-r.left-P[0],e.clientY-r.top-P[1]];const nf=Math.hypot(...f)||1,no=Math.hypot(...o)||1;return deg(Math.atan2((d[0]*o[0]+d[1]*o[1])/no,(d[0]*f[0]+d[1]*f[1])/nf));},
  screenLength(e){const r=canvas.getBoundingClientRect(),P=toScreen(seg.local(0,0)),F=toScreen(seg.local(Math.cos(rad(seg.angle)),Math.sin(rad(seg.angle))));const f=[F[0]-P[0],F[1]-P[1]],d=[e.clientX-r.left-P[0],e.clientY-r.top-P[1]],nf=Math.hypot(...f)||1;return (d[0]*f[0]+d[1]*f[1])/nf/nf;}};
 seg.set(0,0);return seg;}
function toScreen(p){const v=p.clone().project(camera);return [(v.x*.5+.5)*width,(-v.y*.5+.5)*height];}
// ---------- panel controls: lever, dial, strip, number, cards, buttons ----------
function el(tag,props={},...kids){const e=document.createElement(tag);Object.assign(e,props);e.append(...kids);return e;}
function showPanel(title,build){panelTitle.textContent=title;panelBody.replaceChildren();build(panelBody);panel.hidden=!inFocus;}
function hint(text){return el('p',{className:'hint',textContent:text});}
function dial(label,min,max,step,value,oninput,unit=''){const input=el('input',{type:'range',min,max,step,value});const out=el('output',{textContent:value+unit});input.addEventListener('input',()=>{out.textContent=input.value+unit;oninput(+input.value);});const wrap=el('label',{className:'dial'},el('span',{textContent:label}),input,out);wrap.input=input;wrap.out=out;return wrap;}
function lever(label,oninput){const input=el('input',{type:'range',min:0,max:90,step:1,value:0,className:'lever'});const out=el('output',{textContent:'0°'});input.addEventListener('input',()=>{out.textContent=input.value+'°';oninput(+input.value);});const wrap=el('label',{className:'lever-wrap'},el('span',{textContent:label}),input,out);wrap.input=input;wrap.out=out;return wrap;}
function numberBox(label,value,step,min,max,unit='m'){const input=el('input',{type:'number',value,step,min,max});const wrap=el('label',{className:'number'},el('span',{textContent:label}),input,el('b',{textContent:unit}));wrap.input=input;return wrap;}
function button(text,onclick,cls=''){const b=el('button',{type:'button',textContent:text,className:cls});b.addEventListener('click',onclick);return b;}
function strip(rows,onpick){const list=el('div',{className:'strip'});for(const r of rows){const b=button(r.text,()=>{for(const c of list.children)c.classList.remove('picked');b.classList.add('picked');onpick(r);});list.append(b);}return list;}
function cards(items,onpick){const list=el('div',{className:'cards'});for(const it of items){const b=button(it.text,()=>{for(const c of list.children)c.classList.remove('picked');b.classList.add('picked');onpick(it);});list.append(b);}return list;}
// ---------- sets: small rooms built at the origin and shown one at a time ----------
const sets={};
function makeSet(name,build){const g=new THREE.Group();g.visible=false;scene.add(g);const s={name,group:g,floor:[],obstacles:[],place:'',status:'',location:'',pose:{center:V(0,.25,0),h:14},spawn:V(0,0,0),marvinAt:V(-1.5,0,1.5),coolieAt:null,shuttleAt:null,enter(){}};build(s,g);sets[name]=s;return s;}
function block(w,h,d,color,x,y,z,g,r=.08){return cube(w,h,d,color,x,y,z,g,r);}
function console_(g,x,z,text,facing=0){const k=new THREE.Group();k.position.set(x,0,z);k.rotation.y=facing;g.add(k);cube(1.2,1.25,.42,palette.dark,0,.62,0,k,.1);cube(1.05,.72,.05,palette.hull,0,.8,.22,k);glow(.9,.5,.02,0x214a62,0,.8,.25,k);const t=label(text,1.1,.15,'#d3e9df');t.position.set(0,1.33,.1);k.add(t);return k;}
function rock(r,color,x,y,z,g){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),mat(color));m.position.set(x,y,z);m.rotation.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
let current=null,stationIndex=0,route=null,active=false,inFocus=false,seg=null,vkeys=new Set(),dragging=false,anim=null;
// Cockpit: the shuttle itself, seen from above, with a beam from its nose.
const cockpit=makeSet('cockpit',(s,g)=>{s.floor=[[8.05,15.22,-2.87,2.87]];s.obstacles=colliders.filter(c=>c.x>8);s.place='Life shuttle 07';s.status='Under way';s.location='Life shuttle 07 · Open space';s.pose={center:V(11.5,.25,0),h:11.5};s.spawn=V(10.6,0,.6);s.marvinAt=V(9.3,0,.1);s.shuttleAt=V(11.7,0,0);
 const seg=makeSegment({parent:g,position:V(11.7,1.3,-3.6),fwd:V(0,0,-1),opp:V(1,0,0),maxLen:12,labelScale:1.6});s.seg=seg;
 for(let i=0;i<40;i++){const a=rad(-70+i*3.6);if(Math.abs(-70+i*3.6-40)<8)continue;const r=12.5+Math.sin(i*7)*1.3;rock(.45+(i%3)*.25,i%2?0x607583:0x7b6a57,11.7+Math.sin(a)*r,1+Math.cos(i)*.4,-3.6-Math.cos(a)*r,g);}
 const gap=new THREE.Mesh(new THREE.RingGeometry(.7,.9,32),glowMat(0xffd27a,.9));gap.rotation.x=-Math.PI/2;gap.position.set(11.7+Math.sin(rad(40))*10,1.2,-3.6-Math.cos(rad(40))*10);g.add(gap);s.gap=gap;
 const mark=(a,text,color)=>{const m=new THREE.Group();m.position.set(11.7+Math.sin(rad(a))*10,1.2,-3.6-Math.cos(rad(a))*10);g.add(m);const ring=new THREE.Mesh(new THREE.RingGeometry(.75,.95,32),glowMat(color,.9));ring.rotation.x=-Math.PI/2;m.add(ring);const t=label(text,3.2,.4,HEX(color));t.position.y=1.4;t.rotation.x=-Math.PI/2;m.add(t);m.visible=false;m.ring=ring;return m;};
 s.moonMark=mark(30,'MOON · FAR SIDE',0xb6d6ff);s.stationMark=mark(60,'SALVAGE STATION',0xe8b16d);
 const moon=new THREE.Mesh(new THREE.SphereGeometry(9,32,24),mat(0x9fb1c4));moon.position.set(0,-40,-70);g.add(moon);
 s.console=console_(shuttle,-2,-2.55,'SCANNER');s.consoleWorld=V(9.7,0,-2.55);});
// Moon: a landing plateau, a cliff with ledges below it, and a misted fissure behind.
const moon=makeSet('moon',(s,g)=>{s.floor=[[-5,3.4,-2.6,2.6]];s.place='Moon · far side';s.status='Landed';s.location='Icy plateau · Moon far side';s.pose={center:V(0,.25,0),h:15};s.spawn=V(-2,0,0);s.marvinAt=V(-3.5,0,1.6);s.shuttleAt=V(-10,0,0);
 block(20,1,8,0xa9b8c6,-4,-.5,0,g,.3);block(24,.6,30,0x8fa0b1,0,-9.3,-8,g,.5);block(2.6,8.8,8,0x9eafbf,5.3,-4.4,0,g,.3);
 for(let i=0;i<14;i++)rock(.3+(i%4)*.18,0xb7c4cf,-11+i*1.9,.15,3.2+(i%3)*.5,g);
 s.ledges=[];const ledge=(x,top,w=1.1)=>{const m=block(w,.5,2.4,0xc9d7e0,x,top-.25,0,g,.12);m.visible=false;s.ledges.push(m);return m;};
 s.ledge1=ledge(4.3+4*Math.cos(rad(30)),.3-2);s.ledge2=ledge(4.3+8*Math.cos(rad(30)),.3-4,1.3);s.ledge3=ledge(4.3+6*Math.cos(rad(45)),.3-6*Math.sin(rad(45)));
 s.ramp=makeSegment({parent:g,position:V(4.3,.3,0),fwd:V(1,0,0),opp:V(0,-1,0),maxLen:9,labelScale:1,names:{fwd:'RUN',opp:'DROP',len:'RAMP'}});s.ramp.group.visible=false;
 s.rampConsole=console_(g,3.6,-1.6,'RAMP',0);
 // Fissure behind the plateau: a dark cut with mist over it, and an anchor post across it.
 block(20,.6,9,0x1b2634,0,-.6,-8.5,g,0);const mist=new THREE.Mesh(new THREE.PlaneGeometry(20,8.6),new THREE.MeshBasicMaterial({color:0xcdd9e3,transparent:true,opacity:.86,depthWrite:false}));mist.rotation.x=-Math.PI/2;mist.position.set(0,.55,-8.4);g.add(mist);s.mist=mist;
 block(20,1,4,0xa9b8c6,0,-.5,-14,g,.3);
 const anchor=new THREE.Group();anchor.position.set(6,0,-3.6-6*Math.tan(rad(30)));g.add(anchor);cylinder(.12,.12,2.2,palette.dark,0,1.1,0,anchor);glow(.3,.3,.3,0xffd27a,0,2.3,0,anchor);cube(.9,.3,.9,palette.hull,0,.15,0,anchor);s.anchor=anchor;
 const post=cube(.22,.6,.22,palette.amber,6,.3,-3.3,g);const six=label('6 m',.9,.18,'#62b8b2');six.position.set(6,.9,-3.2);g.add(six);
 s.sight=makeSegment({parent:g,position:V(0,.35,-3.6),fwd:V(1,0,0),opp:V(0,0,-1),maxLen:9,labelScale:1,names:{fwd:'ALONG RIM',opp:'ACROSS',len:'SIGHT'}});s.sight.group.visible=false;
 s.cable=makeSegment({parent:g,position:V(6,.35,-3.6),fwd:V(0,0,-1),opp:V(1,0,0),maxLen:9,labelScale:1,names:{fwd:'CABLE',opp:'',len:'CABLE'}});s.cable.group.visible=false;
 s.cableConsole=console_(g,0,-2.2,'CABLE',Math.PI);});
// Salvage station: an open bay with a tractor beam, a salvage arm and a dusty pod lane.
const salvage=makeSet('station',(s,g)=>{s.floor=[[-5,5,-3,3]];s.place='Asteroid salvage station';s.status='Docked';s.location='Salvage bay · Asteroid station';s.pose={center:V(0,.25,0),h:15};s.spawn=V(-2,0,1);s.marvinAt=V(-4,0,-1.5);s.shuttleAt=V(12,0,5);s.coolieAt=V(1,0,1.8);
 block(12,1,8,0x5e6c7a,0,-.5,0,g,.3);for(const x of [-6.3,6.3])block(.6,2.6,8,0x46535f,x,1.3,0,g,.2);
 for(let i=0;i<9;i++)rock(1.6+(i%3)*.8,0x6b5c4e,-14+i*4,-3-(i%2)*2,-14-(i%3)*3,g);
 s.tractor=makeSegment({parent:g,position:V(5.6,.5,-1.2),fwd:V(1,0,0),opp:V(0,0,-1),maxLen:10,labelScale:1,names:{fwd:'FORWARD',opp:'SIDEWAYS',len:'RANGE'}});s.tractor.group.visible=false;
 const zone=new THREE.Mesh(new THREE.PlaneGeometry(1,9),glowMat(C.zone,.22));zone.rotation.x=-Math.PI/2;zone.position.set(5.6+4,.4,-1.2-4.5);g.add(zone);s.zone=zone;zone.visible=false;
 const pod=new THREE.Group();pod.position.set(5.6+8*Math.cos(rad(60)),.5,-1.2-8*Math.sin(rad(60)));g.add(pod);cube(1.1,.8,1.1,palette.orange,0,0,0,pod,.2);glow(.3,.12,.3,0xffd27a,0,.5,0,pod);s.pod=pod;pod.visible=false;
 s.tractorConsole=console_(g,4.6,-1.2,'TRACTOR',-Math.PI/2);
 s.arm=makeSegment({parent:g,position:V(-4,.5,-3.6),fwd:V(1,0,0),opp:V(0,0,-1),maxLen:10,labelScale:1,names:{fwd:'FORWARD',opp:'SIDEWAYS',len:'ARM'}});s.arm.group.visible=false;
 s.bulkhead=new THREE.Group();g.add(s.bulkhead);block(.3,1.6,2.6,0x46535f,0,.8,-3.6-1.3,s.bulkhead,.05);block(.3,1.6,2.4,0x46535f,0,.8,-3.6-9.2,s.bulkhead,.05);block(.3,1.6,1.4,0x5a4a44,0,.8,-3.6-3.3,s.bulkhead,.05);s.bulkhead.visible=false;
 s.cells=[V(0,.5,-3.6-4),V(0,.5,-3.6-4*Math.tan(rad(60)))].map(p=>{const c=new THREE.Group();c.position.copy(p);g.add(c);cube(.6,.6,.6,palette.teal,0,0,0,c,.1);glow(.2,.2,.2,0x9ce8f0,0,.45,0,c);c.visible=false;return c;});
 s.armConsole=console_(g,-4,-2.2,'SALVAGE ARM',Math.PI);
 s.aim=makeSegment({parent:g,position:V(-4,.5,3.6),fwd:V(1,0,0),opp:V(0,0,1),maxLen:10,labelScale:1,names:{fwd:'FORWARD',opp:'SIDEWAYS',len:'BEAM'}});s.aim.group.visible=false;
 const dust=new THREE.Mesh(new THREE.PlaneGeometry(14,8),new THREE.MeshBasicMaterial({color:0x8d8273,transparent:true,opacity:.9,depthWrite:false}));dust.rotation.x=-Math.PI/2;dust.position.set(0,.9,3.6+4.3);g.add(dust);s.dust=dust;dust.visible=false;
 const lostPod=new THREE.Group();lostPod.position.set(-4+6,.5,3.6+6*Math.tan(rad(30)));g.add(lostPod);cube(1.1,.8,1.1,palette.orange,0,0,0,lostPod,.2);glow(.3,.12,.3,0xffd27a,0,.5,0,lostPod);s.lostPod=lostPod;lostPod.visible=false;
 const cone=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(10,.9),new THREE.Vector2(10,-.9)])),glowMat(0xfff1c0,.35));cone.visible=false;s.aim.group.add(cone);s.cone=cone;
 s.aimConsole=console_(g,-4,2.2,'AIMING HEAD',0);});
// Beacon: a mast on a ridge, a cable, a dish, and a rock the docking arm must clear.
const beacon=makeSet('beacon',(s,g)=>{s.floor=[[-5.5,5.5,-2.6,2.6]];s.place='Rescue beacon';s.status='Beacon damaged';s.location='Beacon ridge · Moon';s.pose={center:V(0,.25,0),h:15};s.spawn=V(-3,0,.5);s.marvinAt=V(-4.5,0,1.8);s.shuttleAt=V(-11,0,-2);s.coolieAt=V(0,0,2);
 block(22,1,8,0xa9b8c6,0,-.5,0,g,.3);for(let i=0;i<10;i++)rock(.3+(i%3)*.2,0xb7c4cf,-9+i*2.1,.15,2.9,g);
 const mast=cylinder(.22,.3,6.4,palette.hull,0,3.2,-1,g);glow(.5,.5,.5,0xff8e8e,0,6.5,-1,g);s.mastLamp=g.children.at(-1);
 s.maint=makeSegment({parent:g,position:V(0,.3,-1),fwd:V(1,0,0),opp:V(0,1,0),maxLen:8,labelScale:1,names:{fwd:'FORWARD',opp:'HEIGHT',len:'ARM'}});s.maint.group.visible=false;
 const panelMesh=cube(.7,.7,.2,palette.amber,6*Math.cos(rad(30)),.3+6*Math.sin(rad(30)),-1,g,.06);panelMesh.visible=false;s.loosePanel=panelMesh;
 s.camBottom=makeSegment({parent:g,position:V(8,.3,-1),fwd:V(-1,0,0),opp:V(0,1,0),maxLen:10,labelScale:1,names:{fwd:'ADJACENT',opp:'OPPOSITE',len:'HYPOTENUSE'}});s.camBottom.group.visible=false;
 s.camTop=makeSegment({parent:g,position:V(0,6.3,-1),fwd:V(0,-1,0),opp:V(1,0,0),maxLen:10,labelScale:1,names:{fwd:'ADJACENT',opp:'OPPOSITE',len:'HYPOTENUSE'}});s.camTop.group.visible=false;
 s.dish=makeSegment({parent:g,position:V(0,1.2,-1),fwd:V(1,0,0),opp:V(0,1,0),maxLen:9,labelScale:1,names:{fwd:'FORWARD',opp:'HEIGHT',len:'SLANT'}});s.dish.group.visible=false;
 const beam=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(11,.8),new THREE.Vector2(11,-.8)])),glowMat(0xfff1c0,.3));beam.visible=false;s.dish.group.add(beam);s.dishBeam=beam;
 const ship=new THREE.Group();ship.position.set(8*Math.cos(rad(30)),1.2+8*Math.sin(rad(30)),-1);g.add(ship);cube(2.2,.6,.9,palette.white,0,0,0,ship,.2);cube(.8,.35,.6,palette.teal,.4,.45,0,ship,.1);for(const x of [-1.3,1.3])glow(.2,.2,.2,0x9ce8f0,x,0,0,ship);ship.visible=false;s.rescueShip=ship;
 s.dock=makeSegment({parent:g,position:V(0,.3,-1),fwd:V(1,0,0),opp:V(0,1,0),maxLen:9,labelScale:1,names:{fwd:'FORWARD',opp:'HEIGHT',len:'ARM'}});s.dock.group.visible=false;
 const outcrop=rock(1,0x8a98a6,1.5,.5,-1,g);outcrop.scale.set(.5,.4,.9);outcrop.visible=false;s.outcrop=outcrop;
 const platform=new THREE.Group();platform.position.set(4.5,4.3,-1);g.add(platform);cube(3,.25,1.6,palette.trim,0,0,0,platform,.08);for(const x of [-1.2,1.2])cube(.12,2.4,.12,palette.dark,x,1.3,0,platform,.02);platform.visible=false;s.platform=platform;
 s.maintConsole=console_(g,-1.2,-2,'MAINTENANCE',0);s.camConsole=console_(g,2.5,-2,'CABLE CAMERAS',0);s.dishConsole=console_(g,-3.5,1.8,'BEACON',Math.PI);s.dockConsole=console_(g,3,1.8,'DOCKING ARM',Math.PI);});
// ---------- stations ----------
const stations=[];
function station(def){stations.push(def);return def;}
const angDiff=(a,b)=>((a-b+540)%360)-180;
function viewFor(st){const v=st.view;setView(v.eye,v.target,v.h,1.1);}
function keyTurn(dt,rate=55){let d=0;if(vkeys.has('arrowleft')||vkeys.has('a'))d-=1;if(vkeys.has('arrowright')||vkeys.has('d'))d+=1;return d*rate*dt;}
function keyReach(dt,rate=4){let d=0;if(vkeys.has('arrowup')||vkeys.has('w'))d+=1;if(vkeys.has('arrowdown')||vkeys.has('s'))d-=1;return d*rate*dt;}
function tween(from,to,duration,onDone){return anim={from,to,t:0,duration,onDone};}
function tickAnim(dt){if(!anim)return;const cur=anim;anim.t+=dt;const f=Math.min(1,anim.t/anim.duration),e=f*f*(3-2*f);const a=anim.from.angle+(anim.to.angle-anim.from.angle)*e,l=anim.from.length+(anim.to.length-anim.from.length)*e;seg.set(a,l);if(cur.step&&cur.step(a,l)===false){if(anim===cur)anim=null;return;}if(f>=1){const done=anim.onDone;anim=null;done?.();}}
function lock(body){for(const b of body.querySelectorAll('button,input'))b.disabled=true;}
function near(a,b,tol){return Math.abs(a-b)<tol;}
// 1 · Scanner: an angle is a turn from straight ahead.
station({id:'scanner',set:'cockpit',name:'scanner',label:'Use the scanner',objective:'Find the gap in the debris',point:V(9.7,1.2,-2.55),approach:V(9.7,0,-1.6),height:1.1,
 view:{eye:V(11.7,32,-6.4),target:V(11.7,0,-9.6),h:27},
 enter(){seg=cockpit.seg;seg.group.visible=true;seg.names={fwd:'FORWARD',opp:'SIDEWAYS',len:'RANGE'};seg.show={angle:true,len:false,fwd:false,opp:false,rails:false,corner:false};this.angle=this.angle??0;seg.set(this.angle,10);this.held=0;showPanel('Scanner · turn the beam until it passes through the gap',b=>b.append(hint('Drag the beam round, or hold ← →')));if(!this.spoken){this.spoken=true;talk('mara','Lifeboat Seven, the rescue site is on the moon ahead. The direct line is full of debris. I’m marking a gap. Find it with your scanner.',9);talk('marvin','A moon. How restful.',4);}},
 update(dt){if(this.complete)return;this.angle=(this.angle+keyTurn(dt)+360)%360;seg.set(this.angle,10);const ok=Math.abs(angDiff(this.angle,40))<4;cockpit.gap.material.color.setHex(ok?C.ok:0xffd27a);if(ok){this.held+=dt;if(this.held>1.1)this.finish();}else this.held=0;},
 pointer(e){this.angle=(seg.screenAngle(e)+360)%360;},
 finish(){this.complete=true;lock(panelBody);talk('mara','That’s it. Hold there.',4);talk('coolie','Scanner angle forty degrees.',4);talk('marvin','Forty degrees from straight ahead. Even I can follow that.',5);after(()=>advance());}});
// 2 · Rangefinder: one diagonal reach has a forward part and a sideways part.
station({id:'rangefinder',set:'cockpit',name:'rangefinder',label:'Use the rangefinder',objective:'Extend the rangefinder to the gap',point:V(9.7,1.2,-2.55),approach:V(9.7,0,-1.6),height:1.1,
 view:{eye:V(11.7,32,-6.4),target:V(11.7,0,-9.6),h:27},
 enter(){seg=cockpit.seg;seg.group.visible=true;seg.show={angle:true,len:true,fwd:true,opp:true,rails:true,corner:true};this.length=this.length??0;seg.set(40,this.length);this.held=0;showPanel('Rangefinder · extend the beam until it reaches the gap',b=>b.append(hint('Drag the tip along the beam, or hold ↑ ↓ · angle locked at 40°')));if(!this.spoken){this.spoken=true;talk('marvin','Before we trust the Captain’s coordinates, test the rangefinder. Extend it until it touches the gap.',7);}},
 update(dt){if(this.complete)return;this.length=clamp(this.length+keyReach(dt),0,12);seg.set(40,this.length);const ok=near(this.length,10,.25);cockpit.gap.material.color.setHex(ok?C.ok:0xffd27a);if(ok){this.held+=dt;if(this.held>.9)this.finish();}else this.held=0;},
 pointer(e){this.length=clamp(seg.screenLength(e),0,12);},
 finish(){this.complete=true;lock(panelBody);talk('coolie','Range ten metres. Forward seven point seven. Sideways six point four.',6);talk('marvin','One beam, two shadows. Interesting.',4);after(()=>advance());}});
// 3 · Route beam: the diagonal stays the same; forward and sideways trade places.
station({id:'route',set:'cockpit',name:'course plotter',label:'Plot a course',objective:'Choose a landing: sweep the beam onto a marker',point:V(9.7,1.2,-2.55),approach:V(9.7,0,-1.6),height:1.1,
 view:{eye:V(11.7,32,-6.4),target:V(11.7,0,-9.6),h:27},
 enter(){seg=cockpit.seg;seg.group.visible=true;seg.show={angle:true,len:true,fwd:true,opp:true,rails:true,corner:true};this.angle=this.angle??40;seg.set(this.angle,10);cockpit.moonMark.visible=cockpit.stationMark.visible=true;cockpit.gap.visible=false;this.lo=this.hi=this.angle;this.onMark=null;
  showPanel('Course · rotate the beam between the two markers, then commit',b=>{b.append(hint('Drag or hold ← → · range locked at 10 m'));this.commitButton=button('Commit course · Space',()=>this.commit(),'primary');this.commitButton.disabled=true;b.append(this.commitButton);});
  if(!this.spoken){this.spoken=true;talk('mara','Two landing options. The salvage station at sixty degrees, or the far side of the moon at thirty. I recommend the station. It has procedures.',9);talk('marvin','It has people. The far side has none. Sweep the beam and choose.',6);}},
 update(dt){if(this.complete)return;this.angle=clamp(this.angle+keyTurn(dt),0,90);seg.set(this.angle,10);this.lo=Math.min(this.lo,this.angle);this.hi=Math.max(this.hi,this.angle);if(!this.swept&&this.lo<32&&this.hi>58){this.swept=true;talk('coolie','Forward falls. Sideways rises. Range unchanged.',5);}
  const onMoon=near(this.angle,30,3),onStation=near(this.angle,60,3);cockpit.moonMark.ring.material.color.setHex(onMoon?C.ok:0xb6d6ff);cockpit.stationMark.ring.material.color.setHex(onStation?C.ok:0xe8b16d);this.onMark=onMoon?'A':onStation?'B':null;this.commitButton.disabled=!this.onMark;},
 pointer(e){this.angle=clamp(seg.screenAngle(e),0,90);},
 key(k){if(k===' '||k==='enter')this.commit();},
 commit(){if(this.complete||!this.onMark)return;this.complete=true;route=this.onMark;lock(panelBody);talk('marvin',route==='A'?'The far side. Thank you.':'The station. I hope they have a water policy.',4);after(()=>advance());}});
// A4 · Landing ramp: the same angle gives the same ratio, whatever the ramp length.
station({id:'ramp',set:'moon',route:'A',name:'ramp control',label:'Lower the ramp',objective:'Lower the ramp until its foot touches the ledge',point:V(3.6,1,-1.6),approach:V(2.8,0,-.5),height:1.3,
 view:{eye:V(8.2,-1.4,30),target:V(8.2,-1.6,0),h:11},
 enter(){seg=moon.ramp;seg.group.visible=true;seg.show={angle:true,len:true,fwd:false,opp:true,rails:true,corner:false};this.phase=this.phase??1;this.angle=this.angle??0;this.rampLen=this.phase===1?4:8;moon.ledge1.visible=this.phase===1;moon.ledge2.visible=this.phase===2;seg.set(this.angle,this.rampLen);this.held=0;
  showPanel('Landing ramp · pull the lever down until the foot touches the ledge',b=>{this.lever=lever('LEVER',v=>{this.angle=v;});this.lever.input.value=this.angle;this.lever.out.textContent=this.angle+'°';b.append(this.lever,hint('Drag the lever, or hold ↓ ↑'));});
  if(!this.spoken){this.spoken=true;talk('mara','Landed. There’s a ledge two metres below the door. Lower the ramp until it touches.',6);talk('marvin','Carefully. Coolie is watching.',4);}},
 update(dt){if(this.complete||this.waiting)return;const k=-keyReach(dt,30);if(k){this.angle=clamp(this.angle+k,0,90);this.lever.input.value=Math.round(this.angle);this.lever.out.textContent=Math.round(this.angle)+'°';}seg.set(this.angle,this.rampLen);const drop=this.rampLen*Math.sin(rad(this.angle)),target=this.phase===1?2:4,ledge=this.phase===1?moon.ledge1:moon.ledge2,ok=near(drop,target,.12);ledge.material=mat(ok?C.ok:0xc9d7e0,ok?C.ok:0);if(ok){this.held+=dt;if(this.held>.9)this.finish();}else this.held=0;},
 finish(){if(this.phase===1){this.waiting=true;this.held=0;talk('coolie','Ramp four metres. Drop two metres.',4);talk('marvin','Same slope, longer ramp. Try the eight-metre one.',5);after(()=>{this.phase=2;this.waiting=false;this.angle=0;this.lever.input.value=0;this.lever.out.textContent='0°';this.rampLen=8;moon.ledge1.visible=false;moon.ledge2.visible=true;});return;}
  this.complete=true;lock(panelBody);talk('coolie','Ramp eight metres. Drop four metres. Same angle, same ratio: zero point five.',7);talk('marvin','She’s done it again.',3);after(()=>advance());}});
// A5 · Ramp controller: the ratio gets a name, and a table turns a ratio back into an angle.
const sineRows=[0,15,30,45,60,75,90].map(a=>({angle:a,text:a+'°  →  '+Math.sin(rad(a)).toFixed(2)}));
station({id:'rampController',set:'moon',route:'A',name:'ramp controller',label:'Use the ramp controller',objective:'Pick the angle that reaches the lower ledge, then deploy',point:V(3.6,1,-1.6),approach:V(2.8,0,-.5),height:1.3,
 view:{eye:V(8.2,-2,30),target:V(8.2,-2.2,0),h:12},
 enter(){seg=moon.ramp;seg.group.visible=true;seg.show={angle:true,len:true,fwd:false,opp:true,rails:true,corner:false};moon.ledge1.visible=moon.ledge2.visible=false;moon.ledge3.visible=true;seg.set(0,6);this.pick=null;
  showPanel('Ramp controller · ramp is 6 m, the ledge is 4.2 m down · choose a row, then deploy',b=>{b.append(el('p',{className:'hint',textContent:'DROP ÷ RAMP, measured by Coolie:'}),strip(sineRows,r=>{this.pick=r.angle;this.deploy.disabled=false;}));this.deploy=button('Deploy ramp',()=>this.commit(),'primary');this.deploy.disabled=true;b.append(this.deploy);});
  if(!this.spoken){this.spoken=true;talk('coolie','I have recorded your ratios on the controller. Drop divided by ramp. The ratio is called sine.',8);talk('marvin','She has a table, Arthur.',4);talk('mara','Next ledge is four point two metres down. Ramp is six.',5);}},
 update(){},
 commit(){if(this.complete||this.pick===null||anim)return;lock(panelBody);tween({angle:0,length:6},{angle:this.pick,length:6},1.3,()=>{const drop=6*Math.sin(rad(this.pick));if(near(drop,6*Math.sin(rad(45)),.16)){moon.ledge3.material=mat(C.ok,C.ok);this.complete=true;talk('marvin','Finally, a member of this expedition worth protecting.',5);after(()=>{scene.attach(cooler);cooler.position.set(-2.6,0,1.9);cooler.rotation.set(0,0,0);advance();});}else{talk('coolie',drop<4.24?'Too short.':'Too long.',3);after(()=>{for(const b of panelBody.querySelectorAll('button,input'))b.disabled=false;this.deploy.disabled=true;this.pick=null;for(const c of panelBody.querySelectorAll('.picked'))c.classList.remove('picked');tween({angle:seg.angle,length:6},{angle:0,length:6},.8);});}});}});
// A6 · Cable launcher: sideways over forward is tangent, and it finds a distance you cannot see.
station({id:'cable',set:'moon',route:'A',name:'cable launcher',label:'Use the cable launcher',objective:'Measure the turn to the anchor, then set the cable and fire',point:V(0,1,-2.2),approach:V(0,0,-1.2),height:1.3,
 view:{eye:V(3,32,-5.2),target:V(3,0,-8),h:15},
 enter(){seg=moon.sight;seg.group.visible=true;seg.show={angle:true,len:false,fwd:false,opp:false,rails:false,corner:false};this.angle=this.angle??0;seg.set(this.angle,4);this.phase=this.phase??1;this.held=0;
  if(this.phase===1)showPanel('Cable launcher · turn the sight until it points at the anchor lamp',b=>b.append(hint('Drag or hold ← → · the rim is 6 m to the launch point')));else this.phase2Panel();
  if(!this.spoken){this.spoken=true;talk('mara','There’s a fissure between you and the beacon. Anchor on the far side, six metres along the rim. The mist hides the width.',8);talk('marvin','Then measure what you can see.',4);}},
 phase2Panel(){seg=moon.cable;seg.group.visible=true;seg.show={angle:false,len:true,fwd:false,opp:false,rails:false,corner:false};seg.set(0,0);showPanel('Cable launcher · set the payout, then fire straight across',b=>{this.winch=dial('WINCH PAYOUT',0,10,.1,0,v=>{this.payout=v;},' m');this.payout=0;this.fire=button('Fire cable',()=>this.commit(),'primary');b.append(this.winch,hint('Across = along × tan 30° · turn the winch, or ← →'),this.fire);});},
 update(dt){if(this.complete)return;if(this.phase===1){this.angle=clamp(this.angle+keyTurn(dt),0,90);seg.set(this.angle,4);if(near(this.angle,30,2)){this.held+=dt;if(this.held>.9){this.phase=2;talk('coolie','Turn to the anchor: thirty degrees. Sideways divided by forward. The ratio is called tangent.',8);after(()=>this.phase2Panel());}}else this.held=0;}else if(!anim){const k=keyTurn(dt,2);if(k&&this.winch){this.payout=clamp(this.payout+k,0,10);this.winch.input.value=this.payout.toFixed(1);this.winch.out.textContent=this.payout.toFixed(1)+' m';}}},
 pointer(e){if(this.phase===1)this.angle=clamp(seg.screenAngle(e),0,90);},
 commit(){if(this.complete||anim||this.phase!==2)return;lock(panelBody);const want=6*Math.tan(rad(30));tween({angle:0,length:0},{angle:0,length:this.payout},1.1,()=>{if(near(this.payout,want,.2)){this.complete=true;seg.tint(C.ok);moon.mist.material.opacity=.25;talk('marvin','Across. Nobody fell in. Coolie least of all.',5);after(()=>advance());}else{seg.tint(C.bad);tween({angle:0,length:this.payout},{angle:this.payout<want?-28:0,length:this.payout},.5);talk('coolie',this.payout<want?'Too short.':'Too long.',3);after(()=>{seg.tint(C.diag);seg.set(0,0);for(const b of panelBody.querySelectorAll('button,input'))b.disabled=false;});}});}});
// B4 · Tractor beam: forward over range is cosine, and it stays put for a given angle.
station({id:'tractor',set:'station',route:'B',name:'tractor beam',label:'Use the tractor beam',objective:'Catch the pod: keep the forward reach inside the capture zone',point:V(4.6,1,-1.2),approach:V(3.6,0,-1.2),height:1.3,
 view:{eye:V(10,32,-3.2),target:V(10,0,-6),h:16},
 enter(){seg=salvage.tractor;seg.group.visible=true;seg.show={angle:true,len:true,fwd:true,opp:true,rails:true,corner:true};salvage.zone.visible=salvage.pod.visible=true;this.angle=this.angle??10;seg.set(this.angle,8);this.held=0;showPanel('Tractor beam · steer with the joystick until the beam holds the pod inside the zone',b=>b.append(hint('Drag anywhere around the pivot, or hold ← → · range locked at 8 m')));
  if(!this.spoken){this.spoken=true;talk('mara','Salvage control here. Catch the drifting pod. Keep the beam’s forward reach inside the capture zone.',7);talk('marvin','A zone. They would have a zone.',4);}},
 update(dt){if(this.complete)return;this.angle=clamp(this.angle+keyTurn(dt),0,90);seg.set(this.angle,8);const fwd=8*Math.cos(rad(this.angle)),inZone=fwd>3.5&&fwd<4.5,onPod=near(this.angle,60,3);salvage.zone.material.opacity=inZone?.45:.22;if(inZone&&onPod){this.held+=dt;if(this.held>1.1)this.finish();}else this.held=0;},
 pointer(e){this.angle=clamp(seg.screenAngle(e),0,90);},
 finish(){this.complete=true;lock(panelBody);seg.tint(C.ok);talk('coolie','Forward divided by range: zero point five. At sixty degrees it is always zero point five. The ratio is called cosine.',9);talk('marvin','She finds the one thing that doesn’t change. I admire that.',5);after(()=>advance());}});
// B5 · Salvage arm: the same ratio run backwards gives the length you need.
station({id:'salvageArm',set:'station',route:'B',name:'salvage arm',label:'Use the salvage arm',objective:'Work out the extension, then reach the power cell',point:V(-4,1,-2.2),approach:V(-4,0,-1.2),height:1.3,
 view:{eye:V(0,32,-4.4),target:V(0,0,-7.6),h:16},
 enter(){seg=salvage.arm;seg.group.visible=true;seg.show={angle:true,len:true,fwd:true,opp:false,rails:true,corner:false};salvage.bulkhead.visible=true;this.phase=this.phase??1;salvage.cells[0].visible=this.phase===1;salvage.cells[1].visible=this.phase===2;this.lockAngle=this.phase===1?45:60;seg.set(this.lockAngle,0);
  showPanel('Salvage arm · forward distance 4 m · the arm can only swing to '+this.lockAngle+'° · set the extension',b=>{this.box=numberBox('EXTENSION',0,.1,0,10);b.append(this.box,hint('Arm = forward ÷ cos '+this.lockAngle+'°'));this.go=button('Extend arm',()=>this.commit(),'primary');b.append(this.go);});
  if(!this.spoken){this.spoken=true;talk('mara','A power cell behind the damaged bulkhead. Forward distance four metres. The arm can only swing at forty-five degrees.',8);talk('marvin','So how long must the arm be? Ask the machine with the table.',5);}},
 update(){},
 commit(){if(this.complete||anim)return;const L=clamp(+this.box.input.value||0,0,10),want=4/Math.cos(rad(this.lockAngle));lock(panelBody);tween({angle:this.lockAngle,length:0},{angle:this.lockAngle,length:L},1.2,()=>{if(near(L,want,.2)){seg.tint(C.ok);if(this.phase===1){this.phase=2;talk('coolie','Extension five point six six. Forward four. Four divided by cosine forty-five.',7);talk('mara','Second cell. Same forward distance. Sixty degrees this time.',5);after(()=>{seg.tint(C.diag);this.lockAngle=60;salvage.cells[0].visible=false;salvage.cells[1].visible=true;seg.set(60,0);this.enter();});}else{this.complete=true;talk('marvin','More sideways, more arm. Obvious once somebody says it.',5);after(()=>advance());}}else{seg.tint(C.bad);talk('coolie',L<want?'Too short.':'Too long.',3);after(()=>{seg.tint(C.diag);tween({angle:this.lockAngle,length:L},{angle:this.lockAngle,length:0},.6);for(const b of panelBody.querySelectorAll('button,input'))b.disabled=false;});}});}});
// B6 · Aiming head: two distances give an angle, through the inverse tangent.
station({id:'aim',set:'station',route:'B',name:'aiming head',label:'Use the aiming head',objective:'Set the beam angle from the station’s numbers, then light it up',point:V(-4,1,2.2),approach:V(-4,0,1.2),height:1.3,
 view:{eye:V(0,32,6.6),target:V(0,0,7.6),h:16},
 enter(){seg=salvage.aim;seg.group.visible=true;seg.show={angle:true,len:false,fwd:false,opp:false,rails:true,corner:false};salvage.dust.visible=true;salvage.lostPod.visible=false;this.angle=this.angle??0;seg.set(this.angle,10);
  showPanel('Aiming head · station data: forward 6.0 m, sideways 3.5 m · set the angle, then light',b=>{const ratio=numberBox('SIDEWAYS ÷ FORWARD',0,.01,0,10,'');const out=el('output',{textContent:'tan⁻¹ → ?'});const inv=button('tan⁻¹',()=>{out.textContent='tan⁻¹ → '+deg(Math.atan(+ratio.input.value||0)).toFixed(0)+'°';});this.dialEl=dial('BEAM ANGLE',0,90,1,this.angle,v=>{this.angle=v;seg.set(v,10);},'°');this.light=button('Light',()=>this.commit(),'primary');b.append(el('div',{className:'row'},ratio,inv,out),this.dialEl,this.light);});
  if(!this.spoken){this.spoken=true;talk('mara','Last pod. The dust hides it. Forward six metres, sideways three point five. Set your angle, then light it up.',8);talk('marvin','Two distances. No angle. Marvellous.',4);}},
 update(dt){if(this.complete||anim)return;const k=keyTurn(dt);if(k){this.angle=clamp(this.angle+k,0,90);this.dialEl.input.value=Math.round(this.angle);this.dialEl.out.textContent=Math.round(this.angle)+'°';seg.set(this.angle,10);}},
 commit(){if(this.complete||anim)return;lock(panelBody);salvage.cone.rotation.z=rad(this.angle);salvage.cone.visible=true;const ok=near(this.angle,30,2);salvage.lostPod.visible=true;salvage.lostPod.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=ok?1:.3;}});if(ok){this.complete=true;salvage.dust.material.opacity=.3;talk('coolie','Sideways divided by forward: zero point five eight. Inverse tangent: thirty degrees.',7);talk('marvin','The inverse. Working backwards. My natural state.',5);after(()=>advance());}else{talk('coolie','Off target.',3);after(()=>{salvage.cone.visible=false;salvage.lostPod.visible=false;for(const b of panelBody.querySelectorAll('button,input'))b.disabled=false;});}}});
// 7 · Maintenance arm: sine and cosine answer different questions about the same arm.
station({id:'maintenance',set:'beacon',name:'maintenance arm',label:'Use the maintenance arm',objective:'Reach the loose panel: 3 m up and 5.2 m along',point:V(-1.2,1,-2),approach:V(-1.2,0,-.9),height:1.3,
 view:{eye:V(3.5,2.2,30),target:V(3.5,2,0),h:11},
 enter(){seg=beacon.maint;seg.group.visible=true;seg.show={angle:true,len:true,fwd:true,opp:true,rails:true,corner:true};beacon.loosePanel.visible=true;this.angle=this.angle??0;this.length=this.length??0;seg.set(this.angle,this.length);this.held=0;
  showPanel('Maintenance arm · two sliders: angle and length',b=>{this.a=dial('ANGLE',0,90,1,this.angle,v=>{this.angle=v;},'°');this.l=dial('ARM LENGTH',0,8,.1,this.length,v=>{this.length=v;},' m');b.append(this.a,this.l,hint('← → angle · ↑ ↓ length'));});
  if(!this.spoken){this.spoken=true;talk('mara','Beacon’s damaged. A panel has come loose, three metres up and five along. The maintenance arm will reach it.',7);talk('marvin','Coolie comes with us. She is essential. You are a passenger.',5);}},
 update(dt){if(this.complete)return;const ka=keyTurn(dt),kl=keyReach(dt,2.5);if(ka){this.angle=clamp(this.angle+ka,0,90);this.a.input.value=Math.round(this.angle);this.a.out.textContent=Math.round(this.angle)+'°';}if(kl){this.length=clamp(this.length+kl,0,8);this.l.input.value=this.length.toFixed(1);this.l.out.textContent=this.length.toFixed(1)+' m';}seg.set(this.angle,this.length);const tip=seg.local(this.length*Math.cos(rad(this.angle)),this.length*Math.sin(rad(this.angle))),ok=tip.distanceTo(beacon.loosePanel.getWorldPosition(new THREE.Vector3()))<.3;beacon.loosePanel.material=mat(ok?C.ok:palette.amber,ok?C.ok:0);if(ok){this.held+=dt;if(this.held>.9)this.finish();}else this.held=0;},
 finish(){this.complete=true;lock(panelBody);if(route==='A')talk('coolie','Forward divided by length: zero point eight seven. The ratio is called cosine.',7);else{talk('coolie','Height divided by length: zero point five. The ratio is called sine.',7);talk('coolie','Height divided by forward: zero point five eight. The ratio is called tangent.',7);}talk('marvin','Same arm, same angle, two questions.',4);after(()=>advance());}});
// 8 · Cable cameras: opposite and adjacent depend on which angle you stand at.
station({id:'cameras',set:'beacon',name:'cable cameras',label:'Use the cable cameras',objective:'Look at the cable from both ends',point:V(2.5,1,-2),approach:V(2.5,0,-.9),height:1.3,
 view:{eye:V(4,3.2,30),target:V(4,3,0),h:11},
 enter(){this.end=this.end??'bottom';this.seen=this.seen??new Set();if(!this.spoken){this.spoken=true;talk('marvin','The beacon cable. Look at it from each end. Press Tab.',5);}this.show();showPanel('Cable cameras · the structure stays still; the marked angle moves',b=>{this.swap=button('Swap camera · Tab',()=>this.toggle());this.go=button('Continue',()=>this.finish(),'primary');this.go.disabled=this.seen.size<2;b.append(this.swap,this.go);});
  },
 show(){beacon.camBottom.group.visible=this.end==='bottom';beacon.camTop.group.visible=this.end==='top';seg=this.end==='bottom'?beacon.camBottom:beacon.camTop;seg.show={angle:true,len:true,fwd:true,opp:true,rails:false,corner:true};seg.set(this.end==='bottom'?deg(Math.atan2(6,8)):deg(Math.atan2(8,6)),10);(this.seen??=new Set()).add(this.end);if(this.go)this.go.disabled=this.seen.size<2;const v=this.end==='bottom'?{eye:V(5,2.4,30),target:V(5,2.2,0),h:10}:{eye:V(3,4,30),target:V(3,3.8,0),h:10};setView(v.eye,v.target,v.h,.9);
  if(!this.said?.has(this.end)){(this.said??=new Set()).add(this.end);talk('coolie',this.end==='bottom'?'From the ground: the ground is adjacent. The mast is opposite. The cable is the hypotenuse.':'From the top: the mast is adjacent. The ground is opposite. The cable is still the hypotenuse.',7);if(this.said.size===2)talk('marvin','It depends where you’re standing. Story of my life.',5);}},
 toggle(){this.end=this.end==='bottom'?'top':'bottom';this.show();},
 key(k){if(k==='tab')this.toggle();},
 update(){},
 finish(){if(this.seen.size<2||this.complete)return;this.complete=true;lock(panelBody);advance();}});
// 9 · Elevation: inverse sine and inverse cosine recover an angle from the readings you have.
station({id:'elevation',set:'beacon',name:'beacon',label:'Aim the beacon',objective:'Pick a sensor, find the elevation, point the beacon at the ship',point:V(-3.5,1,1.8),approach:V(-3.5,0,.7),height:1.3,
 view:{eye:V(4,3.4,30),target:V(4,3.2,0),h:12},
 enter(){seg=beacon.dish;seg.group.visible=true;seg.show={angle:true,len:false,fwd:false,opp:false,rails:false,corner:false};beacon.rescueShip.visible=true;this.angle=this.angle??0;seg.set(this.angle,9);beacon.dishBeam.visible=false;this.sensor=null;
  showPanel('Beacon · choose a working sensor, work out the elevation, then commit',b=>{const readout=el('p',{className:'hint',textContent:'Pick a sensor to read it.'});const picks=cards([{id:'h',text:'SENSOR A · height & slant'},{id:'f',text:'SENSOR B · forward & slant'},{id:'t',text:'SENSOR C · height & forward'}],it=>{this.sensor=it.id;readout.textContent=it.id==='h'?'HEIGHT 4.0 m · SLANT 8.0 m':it.id==='f'?'FORWARD 6.9 m · SLANT 8.0 m':'HEIGHT 4.0 m · FORWARD 6.9 m';});const ratio=numberBox('RATIO',0,.01,0,10,'');const out=el('output',{textContent:'→ ?'});const sinv=button('sin⁻¹',()=>out.textContent='sin⁻¹ → '+deg(Math.asin(clamp(+ratio.input.value||0,-1,1))).toFixed(0)+'°'),cinv=button('cos⁻¹',()=>out.textContent='cos⁻¹ → '+deg(Math.acos(clamp(+ratio.input.value||0,-1,1))).toFixed(0)+'°'),tinv=button('tan⁻¹',()=>out.textContent='tan⁻¹ → '+deg(Math.atan(+ratio.input.value||0)).toFixed(0)+'°');this.dialEl=dial('ELEVATION',0,90,1,this.angle,v=>{this.angle=v;seg.set(v,9);},'°');b.append(picks,readout,el('div',{className:'row'},ratio,sinv,cinv,tinv,out),this.dialEl,button('Commit',()=>this.commit(),'primary'));});
  if(!this.spoken){this.spoken=true;talk('mara','Rescue ship inbound. Point the beacon at it. Three sensors still work. Pick one.',6);talk('marvin','Height and slant. Forward and slant. Height and forward. Any pair will do. Choose.',7);}},
 update(dt){if(this.complete||anim)return;const k=keyTurn(dt);if(k){this.angle=clamp(this.angle+k,0,90);this.dialEl.input.value=Math.round(this.angle);this.dialEl.out.textContent=Math.round(this.angle)+'°';seg.set(this.angle,9);}},
 commit(){if(this.complete||anim)return;lock(panelBody);beacon.dishBeam.rotation.z=rad(this.angle);beacon.dishBeam.visible=true;const a=this.angle;tween({angle:0,length:9},{angle:a,length:9},1,()=>{beacon.dishBeam.rotation.z=rad(this.angle);const ok=near(a,30,2);if(ok){this.complete=true;beacon.dishBeam.material.color.setHex(C.ok);talk('coolie','Elevation thirty degrees.',3);talk('mara','We see you, Lifeboat Seven.',4);after(()=>advance());}else{talk('coolie','Off target.',3);after(()=>{beacon.dishBeam.visible=false;for(const b of panelBody.querySelectorAll('button,input'))b.disabled=false;});}});},
 leave(){}});
// 10 · Docking arm: choose the angle, work out the reach, clear the rock, commit.
station({id:'dock',set:'beacon',name:'docking arm',label:'Use the docking arm',objective:'Bring the platform into reach without hitting the rock',point:V(3,1,1.8),approach:V(3,0,.7),height:1.3,
 view:{eye:V(3.2,2.6,30),target:V(3.2,2.4,0),h:11},
 enter(){seg=beacon.dock;seg.group.visible=true;seg.show={angle:true,len:true,fwd:true,opp:true,rails:true,corner:true};beacon.outcrop.visible=beacon.platform.visible=true;this.angle=this.angle??0;this.length=this.length??0;seg.set(this.angle,this.length);
  showPanel('Docking arm · the deck is 4 m up, 3 to 6 m along · the rock is 0.8 m high at 1–2 m',b=>{this.a=dial('ANGLE',0,90,1,this.angle,v=>{this.angle=v;seg.set(this.angle,0);},'°');this.l=numberBox('REACH',this.length||0,.1,0,9);b.append(this.a,this.l,hint('Height = reach × sin · forward = reach × cos'),button('Commit',()=>this.commit(),'primary'));});
  if(!this.spoken){this.spoken=true;talk('mara','Platform lowering. Your docking arm has to clear the rock. Choose an angle, work out the reach, then commit.',7);talk('marvin','Get it right. Coolie boards first.',4);}},
 update(){},
 commit(){if(this.complete||anim)return;const a=this.angle,L=clamp(+this.l.input.value||0,0,9);lock(panelBody);seg.tint(C.diag);tween({angle:a,length:0},{angle:a,length:L},1.4);anim.step=(ang,len)=>{const x=len*Math.cos(rad(ang)),y=len*Math.sin(rad(ang));if(x>1&&x<2&&y<.85){seg.tint(C.bad);talk('coolie','Blocked.',3);this.reset();return false;}return true;};anim.onDone=()=>{const x=L*Math.cos(rad(a)),y=L*Math.sin(rad(a));if(y>3.85&&y<4.2&&x>3&&x<6.1){this.complete=true;seg.tint(C.ok);talk('marvin','Platform secured. Coolie goes up first. Then me. You may take the next one.',6);after(()=>finale());}else{seg.tint(C.bad);talk('coolie',y<3.85?'Too short.':y>4.2?'Too long.':'Off target.',3);this.reset();}};},
 reset(){seg.tint(C.diag);tween({angle:this.angle,length:seg.length},{angle:this.angle,length:0},.6);for(const b of panelBody.querySelectorAll('button,input'))b.disabled=false;}});
// ---------- flow ----------
function planned(){return stations.filter(s=>!s.route||s.route===route);}
function currentStation(){const list=planned();return list[stationIndex]||null;}
function stationFor(){const st=currentStation();if(!st||!active||st.set!==current?.name)return null;return {name:st.name,point:st.point,approach:st.approach,label:st.label,height:st.height,station:st};}
function setObjective(){const st=currentStation();if(st)objectiveText.textContent=st.objective;}
function enterSet(name){const s=sets[name];fade.classList.add('on');setTimeout(()=>{for(const k in sets)sets[k].group.visible=false;s.group.visible=true;current=s;
 ship.visible=halcyon.visible=meteorGroup.visible=false;shuttle.visible=true;if(s.shuttleAt)shuttle.position.copy(s.shuttleAt);shuttleDoor.visible=true;shuttleDoor.position.y=2.9;airOpen=true;shuttleSealed=false;for(const e of engines)e.material.opacity=0;
 if(player.parent!==scene)scene.attach(player);if(marvin.parent!==scene)scene.attach(marvin);if(contact.parent!==scene)scene.attach(contact);
 player.position.copy(s.spawn);player.rotation.y=Math.PI;marvin.position.copy(s.marvinAt);marvin.rotation.y=0;if(s.coolieAt){scene.attach(cooler);cooler.position.copy(s.coolieAt);}
 setFloor(s.floor,s.coolieAt?[...s.obstacles,{x:s.coolieAt.x,z:s.coolieAt.z,w:.5,d:.44}]:s.obstacles);$('placeStatus').textContent=s.place;$('shipStatus').textContent=s.status;$('locationText').textContent=s.location;$('modeLabel').textContent='ADVENTURE / '+s.place.toUpperCase();
 mode='adventure';focus=null;keys.clear();path=[];const p=adventurePose();camera.position.copy(p.eye);viewTarget.copy(p.target);viewHeight=p.h;cameraTween=null;setObjective();setCue();s.enter?.();fade.classList.remove('on');},650);}
function jump(id){const st=stations.find(x=>x.id===id);if(!st)return;if(st.route)route=st.route;if(!route)route='A';active=true;stage='voyage';stationIndex=planned().indexOf(st);$('endOverlay').hidden=true;cockpit.obstacles=colliders.filter(c=>c.x>8);enterSet(st.set);}
function start(){active=true;stage='voyage';stationIndex=0;$('endOverlay').hidden=true;cockpit.obstacles=colliders.filter(c=>c.x>8);enterSet('cockpit');}
function enter(){const st=currentStation();if(!st||st.set!==current?.name||inFocus)return;current.group.traverse(o=>{if(o.userData.instrument)o.visible=false;});inFocus=true;mode='focus';focus='station';keys.clear();path=[];backButton.hidden=false;$('modeLabel').textContent='STATION / '+st.name.toUpperCase();viewFor(st);st.enter();canvas.focus({preventScroll:true});}
function leave(){const st=currentStation();if(!inFocus)return;inFocus=false;st?.leave?.();panel.hidden=true;vkeys.clear();dragging=false;current?.group.traverse(o=>{if(o.userData.instrument)o.visible=false;});}
function advance(){const st=currentStation();if(inFocus)returnToAdventure();stationIndex++;const next=currentStation();if(next&&next.set!==st.set){setTimeout(()=>enterSet(next.set),900);}else{setObjective();setCue();}}
function finale(){if(inFocus)returnToAdventure();talk('marvin','Rescued. I’ve checked the ship’s Wi-Fi. Two bars. We should have stayed in the mist.',7);talk('mara','Welcome aboard, all three of you.',4);after(()=>{active=false;setStage('end');$('shipStatus').textContent='Rescued';const done=planned().filter(st=>st.id!=='cameras');const clean=done.filter(st=>!misses[st.id]).map(st=>st.name),retried=done.filter(st=>misses[st.id]).map(st=>st.name+' ×'+misses[st.id]);$('endSummary').textContent='Route '+(route==='A'?'A, the moon’s far side':'B, the salvage station')+' · first time: '+(clean.length?clean.join(', '):'none')+(retried.length?' · retried: '+retried.join(', '):'');$('endOverlay').hidden=false;$('replayOpening').focus();});}
function update(dt){if(!active)return;tickQueue();tickAnim(dt);if(inFocus&&!cameraTween){const st=currentStation();st?.update?.(dt);}}
function key(e){const k=e.key.toLowerCase();if(e.target.closest?.('#stationPanel,.sound-tools,button,input,select,a,summary'))return;if(k==='tab'){if(!e.repeat)currentStation()?.key?.(k);return;}if(k===' '||k==='enter'||k.startsWith('arrow')||['w','a','s','d'].includes(k)){e.preventDefault();if(!e.repeat)currentStation()?.key?.(k);vkeys.add(k);}}
addEventListener('keyup',e=>vkeys.delete(e.key.toLowerCase()));
function release(){vkeys.clear();dragging=false;}addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});panel.addEventListener('focusin',release);
function pointer(type,e){const st=currentStation();if(!inFocus||!st?.pointer||anim)return;if(type==='down'){dragging=true;st.pointer(e);}else if(type==='move'&&dragging)st.pointer(e);else if(type==='up')dragging=false;}
canvas.addEventListener('pointerdown',e=>{if(inFocus&&e.button===0){canvas.setPointerCapture(e.pointerId);pointer('down',e);}});canvas.addEventListener('pointermove',e=>pointer('move',e));for(const t of ['pointerup','pointercancel'])canvas.addEventListener(t,e=>pointer('up',e));
return {start,jump,enter,leave,update,key,station:stationFor,get active(){return active;},pose(){return current?{eye:current.pose.center.clone().add(adventureOffset),target:current.pose.center.clone(),h:Math.max(current.pose.h,current.pose.h*1.2/(width/height))}:null;},place(){return current?current.place.toUpperCase():'';},get inFocus(){return inFocus;},_stations:stations,_sets:sets};
})();
window.voyage=voyage;
