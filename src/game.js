const canvas=document.getElementById('game');
const scene=new THREE.Scene();
let renderer;
try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(error){document.getElementById('error').style.display='block';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
const camera=new THREE.OrthographicCamera(-10,10,8,-8,.01,200);camera.position.set(13,16,19);camera.lookAt(0,0,0);
const hemi=new THREE.HemisphereLight(0xc7e7ff,0x465572,2.1);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffe4bf,3.2);key.position.set(-3,12,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-10;key.shadow.camera.right=10;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;key.shadow.normalBias=.035;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
const fill=new THREE.DirectionalLight(0x79c8ff,1.4);fill.position.set(2,7,-9);scene.add(fill);
const palette={hull:0x63778b,edge:0x35465f,floor:0x7f99a7,tile:0x91a9b2,wall:0xc8d6d6,trim:0xe3e5dc,dark:0x283d55,teal:0x62b8b2,amber:0xe8b16d,orange:0xd99260,white:0xeee9d9};
const mats={};function mat(color,emissive=0){const k=color+':'+emissive;return mats[k]??=new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.08,emissive,emissiveIntensity:emissive?.65:0});}
const ship=new THREE.Group();scene.add(ship);const colliders=[];
function cube(w,h,d,color,x,y,z,parent=ship,r=.08){let geo;if(r){const shape=new THREE.Shape(),rr=Math.min(r,w/4,h/4,d/4),a=w/2-rr,b=h/2-rr;shape.moveTo(-a+rr,-b);shape.lineTo(a-rr,-b);shape.quadraticCurveTo(a,-b,a,-b+rr);shape.lineTo(a,b-rr);shape.quadraticCurveTo(a,b,a-rr,b);shape.lineTo(-a+rr,b);shape.quadraticCurveTo(-a,b,-a,b-rr);shape.lineTo(-a,-b+rr);shape.quadraticCurveTo(-a,-b,-a+rr,-b);geo=new THREE.ExtrudeGeometry(shape,{depth:d-2*rr,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:rr,bevelThickness:rr,curveSegments:3});geo.translate(0,0,-(d-2*rr)/2);}else geo=new THREE.BoxGeometry(w,h,d);const o=new THREE.Mesh(geo,mat(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function ball(rx,ry,rz,color,x,y,z,parent=ship){const o=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat(color));o.scale.set(rx,ry,rz);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cylinder(rt,rb,height,color,x,y,z,parent=ship){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,height,32),mat(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function glow(w,h,d,color,x,y,z,parent=ship){const o=cube(w,h,d,color,x,y,z,parent,.02);o.material=mat(color,color);o.castShadow=false;return o;}
function obstacle(x,z,w,d){colliders.push({x,z,w:w/2,d:d/2});}
function label(text,w,h,color='#e5ece7',bg=null){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');if(bg){x.fillStyle=bg;x.fillRect(0,0,512,128)}x.fillStyle=color;x.font='bold 62px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,66);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});return new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);}
// Cutaway shell and softly bevelled deck.
cube(12.6,.65,9.6,palette.edge,0,-.48,0,ship,.25);cube(12.25,.26,9.25,palette.hull,0,-.1,0,ship,.18);
for(let x=0;x<12;x++)for(let z=0;z<9;z++)cube(.98,.07,.98,(x+z)%2?palette.floor:palette.tile,x-5.5,.045,z-4,ship,.025);
// Front walls are cut down to a lip, keeping the player visible.
cube(12.6,.3,.2,palette.trim,0,.16,4.65);cube(.2,.3,9.3,palette.trim,6.2,.16,0);
cube(.3,2.55,9.4,palette.wall,-6.2,1.15,0);cube(12.5,2.55,.3,palette.wall,0,1.15,-4.65);
cube(.36,.16,9.4,palette.trim,-6.2,2.45,0);cube(12.55,.16,.36,palette.trim,0,2.45,-4.65);
cube(.15,.26,9.15,palette.dark,-6.0,.22,0);cube(12.1,.26,.15,palette.dark,0,.22,-4.45);
// Panoramic rear windows, set into thick frames.
for(const x of [-3.8,0,3.8]){cube(3.3,1.2,.16,palette.dark,x,1.7,-4.44);glow(3.04,.94,.025,0x183e58,x,1.7,-4.34);for(let i=0;i<12;i++){const sx=x-1.35+((i*73)%100)/100*2.7,sy=1.34+((i*31)%100)/100*.7;glow(.018,.018,.015,0xaedce3,sx,sy,-4.31)}cube(.06,1,.06,palette.hull,x,1.7,-4.28);glow(2.8,.025,.035,0x83d7d7,x,1.14,-4.3);}
// Rear pilot consoles and upholstered captain's chair.
function consoleBank(x,z,w){cube(w,.8,1,palette.dark,x,.48,z);cube(w+.1,.13,1.08,palette.trim,x,.94,z);const screen=glow(w-.35,.035,.61,0x4c999f,x,1.03,z-.09);screen.rotation.x=.11;for(let i=0;i<4;i++)glow(.15,.03,.09,i===0?0xedb775:0xa7dfe2,x-w*.32+i*.24,1.05,z+.33);cube(.08,.34,.08,palette.hull,x,.85,z-.43);obstacle(x,z,w+.15,1.15);}
consoleBank(-1.65,-3.65,2.6);consoleBank(1.65,-3.65,2.6);
const middle=label('07',.68,.19,'#f6d5a0');middle.position.set(0,2.65,-4.44);ship.add(middle);
cylinder(.38,.48,.17,palette.dark,0,.17,-2.22);cylinder(.09,.09,.5,palette.hull,0,.43,-2.22);cube(.9,.23,.85,palette.teal,0,.7,-2.22);cube(.9,.85,.24,palette.teal,0,1.08,-1.9);cube(.13,.15,.76,palette.trim,-.54,.93,-2.2);cube(.13,.15,.76,palette.trim,.54,.93,-2.2);obstacle(0,-2.2,1.25,1.1);
// Empty equipment bays: no tasks or interactions yet.
for(let i=0;i<3;i++){const z=-2.7+i*1.35;cube(1.0,1.8,1.08,palette.hull,-5.42,.98,z);cube(.09,1.48,.83,i===1?palette.teal:palette.trim,-4.86,1.0,z);cube(.06,.35,.07,palette.dark,-4.79,1.15,z+.25);glow(.035,.055,.2,0xa8e5bf,-4.73,1.62,z);obstacle(-5.4,z,1.3,1.15);}
// Twin oxygen tanks nestled in the left-hand corner.
for(const z of [2.1,3.05]){cylinder(.35,.35,1.15,palette.teal,-5.35,.77,z);ball(.35,.25,.35,palette.trim,-5.35,1.35,z);cylinder(.13,.13,.16,palette.dark,-5.35,1.61,z);cylinder(.37,.37,.13,palette.dark,-5.35,.47,z);obstacle(-5.35,z,.85,.85)}
// A compact bench, a folded blanket, and a small porthole-side plant.
cube(1.35,.55,2.7,palette.dark,4.8,.36,.15);cube(1.2,.24,2.62,palette.orange,4.75,.74,.15);cube(.22,.78,2.8,palette.orange,5.42,1,.15);for(const z of [-1.25,1.55])cube(1.42,.28,.2,palette.trim,4.8,.86,z);cube(.75,.07,.85,0xd8bf9e,4.7,.92,.75);obstacle(4.8,.15,1.65,3.1);
cube(1.1,.7,1.1,palette.trim,4.8,.44,-2.4);cylinder(.24,.18,.4,palette.orange,4.8,1,-2.4);for(let i=0;i<6;i++){const leaf=ball(.16,.45,.11,0x75a898,4.8+Math.sin(i)*.17,1.4+(i%2)*.1,-2.4+Math.cos(i)*.13);leaf.rotation.z=Math.sin(i)*.6;}obstacle(4.8,-2.4,1.3,1.3);
// Low central equipment table leaves generous routes around both sides.
cylinder(.54,.66,.45,palette.dark,1.9,.32,.5);cube(1.6,.18,1.3,palette.trim,1.9,.67,.5);cube(1.15,.035,.83,palette.dark,1.9,.79,.5);glow(.78,.018,.035,0x80c9ca,1.9,.82,.35);glow(.035,.018,.45,0x80c9ca,1.9,.82,.5);obstacle(1.9,.5,1.85,1.55);
// A few cargo blocks, recessed floor strips and an entry threshold.
cube(.9,.72,.85,palette.amber,-3.6,.46,2.85);cube(.92,.09,.88,palette.trim,-3.6,.85,2.85);cube(.11,.75,.89,palette.dark,-3.6,.47,2.85);obstacle(-3.6,2.85,1.05,1.05);
for(const x of [-3.3,3.3])for(const z of [-1.8,1.5,3.2])glow(.055,.012,.8,0xb7ded3,x,.097,z);
cube(2.3,.05,.65,palette.dark,0,.105,4.2);for(const x of [-.85,-.42,0,.42,.85])cube(.2,.01,.5,palette.amber,x,.14,4.2);
const floorText=label('L B  /  0 7',1.8,.45,'#c6d6d5');floorText.rotation.x=-Math.PI/2;floorText.position.set(-1.35,.094,2.9);ship.add(floorText);
// Exterior supports and engine glow visible below the cutaway.
for(const x of [-4.5,4.5]){cube(1.3,.6,2.6,palette.hull,x,-.75,1.4);const engine=cylinder(.37,.45,.45,palette.dark,x,-.77,2.87);engine.rotation.x=Math.PI/2;const light=cylinder(.28,.28,.035,0x65d2e0,x,-.77,3.11);light.rotation.x=Math.PI/2;light.material=mat(0x6bdde4,0x6bdde4);}
// Freddie: compact, rounded astronaut with an oversized visor.
const player=new THREE.Group();player.position.set(-1,0,1.15);scene.add(player);const body=new THREE.Group();player.add(body);
ball(.38,.49,.29,palette.white,0,.82,0,body);cube(.57,.56,.25,palette.amber,0,.87,-.32,body,.12);cube(.58,.08,.44,palette.orange,0,.62,0,body,.04);
ball(.45,.43,.39,palette.white,0,1.34,0,body);ball(.373,.26,.16,0x203b50,0,1.36,.31,body);ball(.305,.18,.06,0x659caa,0,1.4,.44,body);const gleam=ball(.135,.045,.018,0xc1e5dd,-.1,1.48,.49,body);gleam.rotation.z=-.2;
cube(.22,.17,.04,palette.amber,0,.95,.29,body,.02);glow(.04,.035,.02,0x8abfb1,-.05,.98,.32,body);
const legs=[],arms=[];for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.2,.45,0);body.add(leg);ball(.16,.25,.17,palette.white,0,-.17,0,leg);cube(.31,.18,.43,palette.orange,0,-.35,.06,leg,.07);legs.push(leg);const arm=new THREE.Group();arm.position.set(side*.4,1.02,0);body.add(arm);ball(.13,.27,.14,palette.white,side*.025,-.14,0,arm);ball(.135,.13,.145,palette.amber,side*.03,-.34,0,arm);arms.push(arm);}
const shadowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,5,64,64,62);g.addColorStop(0,'rgba(12,29,40,.35)');g.addColorStop(1,'rgba(12,29,40,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();const contact=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.3),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.105;scene.add(contact);
// Distant stars and a small moon provide depth without distracting from the deck.
const positions=[];for(let i=0;i<500;i++){const r=35+Math.random()*30,a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);positions.push(r*Math.sin(b)*Math.cos(a),r*Math.cos(b),r*Math.sin(b)*Math.sin(a))}const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xb4d1e8,size:.065,transparent:true,opacity:.65,sizeAttenuation:true}));scene.add(stars);
// Pip is a physical member of the cabin, with a persistent golden glow.
const pip=new THREE.Group();pip.position.set(-3.6,0,.5);ship.add(pip);
const pipBody=new THREE.Group();pip.add(pipBody);
const wheel=cylinder(.29,.29,.3,palette.dark,0,.36,0,pip);wheel.rotation.z=Math.PI/2;
cylinder(.1,.1,.32,palette.amber,0,.36,0,pip).rotation.z=Math.PI/2;
cube(.74,.64,.54,palette.amber,0,.94,0,pipBody,.15);
cube(.86,.59,.61,palette.white,0,1.48,.02,pipBody,.15);
cube(.66,.35,.075,palette.dark,0,1.49,.35,pipBody,.09);
for(const x of [-.17,.17])glow(.085,.14,.035,0xffd687,x,1.51,.402,pipBody);
const smile=glow(.13,.025,.025,0xffd687,0,1.39,.405,pipBody);
for(const side of [-1,1]){ball(.13,.13,.13,palette.dark,side*.43,1.04,0,pipBody);cube(.13,.33,.13,palette.white,side*.48,.88,.03,pipBody,.05);ball(.12,.11,.12,palette.amber,side*.48,.7,.07,pipBody);}
cylinder(.025,.025,.27,palette.dark,.21,1.89,0,pipBody);const antenna=ball(.085,.085,.085,0xffd080,.21,2.05,0,pipBody);antenna.material=new THREE.MeshBasicMaterial({color:0xffd080,toneMapped:false});
cube(.19,.15,.04,palette.dark,0,.98,.29,pipBody,.025);glow(.11,.045,.025,0xffd080,0,1,.32,pipBody);
pipBody.traverse(o=>{if(o.isMesh&&o.material.color?.getHex()===palette.amber){o.material=o.material.clone();o.material.emissive.setHex(0xe9a943);o.material.emissiveIntensity=.42;}});
obstacle(pip.position.x,pip.position.z,.88,.74);
function auraTexture(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,205,103,.65)');g.addColorStop(.38,'rgba(255,184,63,.3)');g.addColorStop(1,'rgba(255,168,40,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
const auraMap=auraTexture();const aura=new THREE.Sprite(new THREE.SpriteMaterial({map:auraMap,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,opacity:.52}));aura.position.set(0,1.1,0);aura.scale.set(2.9,3.3,1);pip.add(aura);
const pipPool=new THREE.Mesh(new THREE.PlaneGeometry(3,3),new THREE.MeshBasicMaterial({map:auraMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,opacity:.75}));pipPool.rotation.x=-Math.PI/2;pipPool.position.y=.115;pip.add(pipPool);
const pipRing=new THREE.Mesh(new THREE.RingGeometry(.63,.665,48),new THREE.MeshBasicMaterial({color:0xffcf72,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));pipRing.rotation.x=-Math.PI/2;pipRing.position.y=.12;pip.add(pipRing);
const pipLight=new THREE.PointLight(0xffbf65,2,4,2);pipLight.position.set(0,1.3,.25);pip.add(pipLight);
// Moving floor chevrons: 0.5 seconds in, 2 seconds held, 0.5 seconds out.
function arrowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.strokeStyle='#ffdc84';x.shadowColor='#ffbe42';x.shadowBlur=17;x.lineWidth=10;x.lineJoin='round';x.lineCap='round';for(let i=0;i<2;i++){x.beginPath();x.moveTo(30,86);x.lineTo(64,47);x.lineTo(98,86);x.stroke()}return new THREE.CanvasTexture(c)}
const cueOrigin=new THREE.Vector3(-1,.135,1.15),cueVector=pip.position.clone().sub(cueOrigin);cueVector.y=0;const cueLength=cueVector.length()-.85;cueVector.normalize();
const chevrons=[];const arrowMap=arrowTexture();for(let i=0;i<4;i++){const m=new THREE.MeshBasicMaterial({map:arrowMap,transparent:true,opacity:0,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});const arrow=new THREE.Mesh(new THREE.PlaneGeometry(.64,.64),m);arrow.rotation.set(-Math.PI/2,0,0);arrow.rotateZ(Math.atan2(-cueVector.x,-cueVector.z));ship.add(arrow);chevrons.push(arrow)}
let gameStarted=false,cueStarted=Infinity;let questState='available',dialogueOpen=false,pipArmed=true,toastUntil=0;
const dialogue=document.getElementById('pipDialogue'),pipTag=document.getElementById('pipName'),questToast=document.getElementById('questToast'),questStatus=document.getElementById('questStatus');
function openPipDialogue(){dialogueOpen=true;pipArmed=false;path=[];keys.clear();mouseDown=false;destination.visible=false;dialogue.hidden=false;document.body.classList.add('talking');document.getElementById('acceptQuest').focus({preventScroll:true});pipAudio.ping();pipAudio.speak(document.getElementById('pipWords').textContent);}
function choosePipQuest(accept){if(!dialogueOpen)return;questState=accept?'accepted':'available';dialogueOpen=false;dialogue.hidden=true;document.body.classList.remove('talking');questToast.textContent=accept?'Pip: “That’s my pilot. We’ll get her steady.”':'Pip: “All right. I’ll be here when you’re ready.”';pipAudio.speak(accept?'That’s my pilot. We’ll get her steady.':'All right. I’ll be here when you’re ready.');questToast.hidden=false;toastUntil=performance.now()+6500;questStatus.hidden=!accept;canvas.focus({preventScroll:true});}
pipTag.addEventListener('click',()=>{if(!gameStarted||dialogueOpen)return;path=routeTo(pip.position.x,pip.position.z);if(path.length){const end=path[path.length-1];destination.position.set(end.x,.12,end.z);destination.visible=true;markMoved();canvas.focus({preventScroll:true});}});
document.getElementById('acceptQuest').addEventListener('click',()=>choosePipQuest(true));document.getElementById('rejectQuest').addEventListener('click',()=>choosePipQuest(false));
function updatePip(now){if(!gameStarted){for(const arrow of chevrons)arrow.visible=false;return;}const elapsed=(now-cueStarted)/1000,opacity=elapsed<.5?elapsed/.5:elapsed<2.5?1:Math.max(0,1-(elapsed-2.5)/.5);for(let i=0;i<chevrons.length;i++){const distance=((i/chevrons.length+elapsed*.42)%1)*cueLength;const arrow=chevrons[i];arrow.position.copy(cueOrigin).addScaledVector(cueVector,distance);arrow.material.opacity=opacity*Math.min(1,distance/.18,(cueLength-distance)/.18);arrow.visible=opacity>0&&!dialogueOpen;}
const distance=player.position.distanceTo(pip.position);if(distance>1.65)pipArmed=true;if(distance<1.25&&pipArmed&&!dialogueOpen&&questState==='available')openPipDialogue();
pipBody.position.y=Math.sin(now*.0025)*.035;aura.material.opacity=.5+Math.sin(now*.002)*.055;pipPool.material.opacity=.7+Math.sin(now*.002)*.07;
const targetAngle=Math.atan2(player.position.x-pip.position.x,player.position.z-pip.position.z);pipBody.rotation.y=targetAngle;
const p=pip.position.clone().add(new THREE.Vector3(0,2.37,0)).project(camera);pipTag.style.left=((p.x*.5+.5)*width)+'px';pipTag.style.top=((-p.y*.5+.5)*height)+'px';
if(toastUntil&&now>toastUntil){questToast.hidden=true;toastUntil=0;}canvas.dataset.quest=questState;canvas.dataset.dialogue=String(dialogueOpen);canvas.dataset.cue=elapsed<.5?'fade-in':elapsed<2.5?'hold':elapsed<3?'fade-out':'finished';}

// Screen-relative walking. Camera is deliberately fixed as the game's isometric view.
const radius=.3,bounds={x:5.83,z:4.25};
function walkable(x,z,padding=0){const clearance=radius+padding;return Math.abs(x)<=bounds.x-clearance&&Math.abs(z)<=bounds.z-clearance&&!colliders.some(c=>{const dx=Math.max(Math.abs(x-c.x)-c.w,0),dz=Math.max(Math.abs(z-c.z)-c.d,0);return dx*dx+dz*dz<clearance*clearance});}
const step=.25,nx=47,nz=35,minX=-5.75,minZ=-4.25;
function coord(i){return {x:minX+(i%nx)*step,z:minZ+Math.floor(i/nx)*step}}
const nav=Array.from({length:nx*nz},(_,i)=>{const p=coord(i);return walkable(p.x,p.z,.08)});
function nearest(x,z){let best=-1,d=Infinity;for(let i=0;i<nav.length;i++){if(!nav[i])continue;const p=coord(i),dd=(p.x-x)**2+(p.z-z)**2;if(dd<d){d=dd;best=i}}return best;}
function clearLine(a,b){const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.08);for(let i=1;i<=n;i++)if(!walkable(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,.06))return false;return true;}
function routeTo(x,z){const start=nearest(player.position.x,player.position.z),end=nearest(x,z);if(start<0||end<0)return [];const target=coord(end);if(clearLine(player.position,target))return [target];const open=new Set([start]),from=new Int32Array(nav.length).fill(-1),g=new Float32Array(nav.length).fill(Infinity);g[start]=0;while(open.size){let current=-1,best=Infinity;for(const i of open){const p=coord(i),f=g[i]+Math.hypot(p.x-target.x,p.z-target.z);if(f<best){best=f;current=i}}if(current===end){const result=[];for(let i=end;i!==start;i=from[i])result.unshift(coord(i));let simplified=[],anchor={x:player.position.x,z:player.position.z};for(let i=0;i<result.length;){let furthest=i;while(furthest+1<result.length&&clearLine(anchor,result[furthest+1]))furthest++;simplified.push(result[furthest]);anchor=result[furthest];i=furthest+1}return simplified;}open.delete(current);const cx=current%nx,cz=Math.floor(current/nx);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const xx=cx+dx,zz=cz+dz,j=zz*nx+xx;if(xx<0||xx>=nx||zz<0||zz>=nz||!nav[j])continue;if(dx&&dz&&(!nav[cz*nx+xx]||!nav[zz*nx+cx]))continue;const next=g[current]+Math.hypot(dx,dz)*step;if(next<g[j]){g[j]=next;from[j]=current;open.add(j)}}}return [];}
const destination=new THREE.Mesh(new THREE.RingGeometry(.18,.23,32),new THREE.MeshBasicMaterial({color:0xf5ca80,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));destination.rotation.x=-Math.PI/2;destination.position.y=.11;destination.visible=false;scene.add(destination);
let path=[],mouseDown=false,lastPointer=0,hasMoved=false;const keys=new Set(),mouse=new THREE.Vector2(),ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.1),hit=new THREE.Vector3();
function markMoved(){if(!hasMoved){hasMoved=true;document.getElementById('hint').style.opacity='0'}}
function pointerTarget(e){if(!gameStarted||dialogueOpen)return;const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);if(!ray.ray.intersectPlane(plane,hit))return;path=routeTo(hit.x,hit.z);if(path.length){const end=path[path.length-1];destination.position.set(end.x,.12,end.z);destination.visible=true;markMoved()}}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!gameStarted||dialogueOpen)return;mouseDown=true;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});pointerTarget(e)});canvas.addEventListener('pointermove',e=>{if(mouseDown&&performance.now()-lastPointer>100){pointerTarget(e);lastPointer=performance.now()}});canvas.addEventListener('pointerup',()=>mouseDown=false);canvas.addEventListener('pointercancel',()=>mouseDown=false);
const movementKeys=['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'];addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(!gameStarted||dialogueOpen||e.target.closest?.('button,select,summary,input'))return;if(movementKeys.includes(k)){e.preventDefault();keys.add(k);path=[];destination.visible=false;markMoved()}});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();mouseDown=false;path=[];destination.visible=false});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();mouseDown=false;path=[];destination.visible=false}});
const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);right.y=0;right.normalize();const up=new THREE.Vector3(-right.z,0,right.x).negate();
let last=performance.now(),walkPhase=0,motion=0;const nameTag=document.getElementById('name');let width=innerWidth,height=innerHeight;
function resize(){width=innerWidth;height=innerHeight;renderer.setSize(width,height);const aspect=width/height,vertical=Math.max(14.7,19/aspect);camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical/2;camera.bottom=-vertical/2;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;if(document.hidden)return;let dx=0,dz=0;const kx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),ky=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));
if(!gameStarted||dialogueOpen){path=[];keys.clear();}else if(kx||ky){dx=right.x*kx+up.x*ky;dz=right.z*kx+up.z*ky;}else if(path.length){const p=path[0],x=p.x-player.position.x,z=p.z-player.position.z;if(Math.hypot(x,z)<.008){path.shift();if(!path.length)destination.visible=false;}else{dx=x;dz=z;}}
const length=Math.hypot(dx,dz),oldX=player.position.x,oldZ=player.position.z;if(length>.001){const speed=Math.min(3.25*dt,path.length?length:Infinity);dx=dx/length*speed;dz=dz/length*speed;if(walkable(player.position.x+dx,player.position.z+dz)){player.position.x+=dx;player.position.z+=dz;}else{if(walkable(player.position.x+dx,player.position.z))player.position.x+=dx;if(walkable(player.position.x,player.position.z+dz))player.position.z+=dz;}}
const distance=Math.hypot(player.position.x-oldX,player.position.z-oldZ),moving=distance>.0001;motion=THREE.MathUtils.damp(motion,moving?1:0,14,dt);if(moving){walkPhase+=distance*10;const angle=Math.atan2(player.position.x-oldX,player.position.z-oldZ),diff=Math.atan2(Math.sin(angle-player.rotation.y),Math.cos(angle-player.rotation.y));player.rotation.y+=diff*Math.min(1,dt*16);}body.position.y=Math.abs(Math.sin(walkPhase))*motion*.065+Math.sin(now*.002)*.009*(1-motion);body.rotation.z=Math.sin(walkPhase)*motion*.035;legs[0].rotation.x=Math.sin(walkPhase)*motion*.6;legs[1].rotation.x=-Math.sin(walkPhase)*motion*.6;arms[0].rotation.x=-Math.sin(walkPhase)*motion*.35;arms[1].rotation.x=Math.sin(walkPhase)*motion*.35;contact.position.set(player.position.x,.105,player.position.z);destination.material.opacity=.55+Math.sin(now*.006)*.2;
const screen=player.position.clone().add(new THREE.Vector3(0,2,0)).project(camera);nameTag.style.left=((screen.x*.5+.5)*width)+'px';nameTag.style.top=((-screen.y*.5+.5)*height)+'px';stars.rotation.y=now*.000002;updatePip(now);renderer.render(scene,camera);
// Visible canvas metadata supports checking actual movement without exposing game internals.
canvas.dataset.position=player.position.x.toFixed(3)+','+player.position.z.toFixed(3);canvas.dataset.walking=moving?'true':'false';
}requestAnimationFrame(frame);

document.getElementById('startAdventure').addEventListener('click',()=>{if(gameStarted)return;gameStarted=true;cueStarted=performance.now();document.getElementById('startOverlay').hidden=true;document.body.classList.remove('not-started');pipAudio.unlock();pipAudio.ping();const line='Freddie! Over here. I need a hand.';document.getElementById('hint').textContent='Pip: “'+line+'”';pipAudio.speak(line);canvas.focus({preventScroll:true});});
