const canvas=document.getElementById('game');
const scene=new THREE.Scene();
let renderer;
try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(error){document.getElementById('error').style.display='block';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
const camera=new THREE.OrthographicCamera(-10,10,8,-8,.01,200);camera.position.set(13,16,19);camera.lookAt(0,0,0);
const hemi=new THREE.HemisphereLight(0xc7e7ff,0x465572,2.1);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffe4bf,3.2);key.position.set(-3,12,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-10;key.shadow.camera.right=10;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;key.shadow.normalBias=.035;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
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

const lounge=ship,shuttle=new THREE.Group();shuttle.position.set(11.7,0,0);scene.add(shuttle);
function deck(group,w,d){cube(w+.5,.5,d+.5,palette.edge,0,-.3,0,group,.22);cube(w+.1,.18,d+.1,palette.hull,0,-.02,0,group,.12);for(let x=0;x<w;x++)for(let z=0;z<d;z++)cube(.98,.07,.98,(x+z)%2?palette.floor:palette.tile,x-(w-1)/2,.095,z-(d-1)/2,group,.018);cube(w+.4,.22,.15,palette.trim,0,.2,d/2+.14,group);}
deck(lounge,12,9);deck(shuttle,7,6);
// The far walls are broken around the actual observation window.
cube(.25,2.8,9.3,palette.wall,-6.15,1.35,0);cube(.32,.14,9.35,palette.trim,-6.15,2.8,0);
for(const x of [-4.35,4.35])cube(3.6,2.8,.23,palette.wall,x,1.35,-4.6);
cube(5.1,.6,.23,palette.wall,0,.25,-4.6);cube(5.1,.3,.28,palette.trim,0,2.75,-4.6);
const windowFrame=new THREE.Group();windowFrame.position.set(0,1.65,-4.55);lounge.add(windowFrame);
for(const x of [-2.55,2.55])cube(.16,2.35,.25,palette.dark,x,0,0,windowFrame);
for(const y of [-1.1,1.1])cube(5.25,.14,.25,palette.dark,0,y,0,windowFrame);
const glass=new THREE.Mesh(new THREE.PlaneGeometry(5,2.1),new THREE.MeshPhysicalMaterial({color:0x8ad4e0,transparent:true,opacity:.075,roughness:.05,side:THREE.DoubleSide,depthWrite:false}));windowFrame.add(glass);
const windowLight=glow(5.05,.045,.12,0xffca70,0,-1.03,.15,windowFrame);
const winLabel=label('OBSERVATION',2.2,.24,'#64828d');winLabel.position.set(0,3.03,-4.45);lounge.add(winLabel);
// Lounge furniture and PC, all in the same coordinate space as the controls.
cube(2.5,.14,1.25,palette.trim,-3.7,1.1,.35);for(const x of [-4.65,-2.75])cube(.15,1.05,.8,palette.dark,x,.6,.35);obstacle(-3.7,.35,2.65,1.45);
cube(.13,.5,.15,palette.dark,-3.7,1.42,-.04);cube(1.9,1.22,.17,palette.dark,-3.7,1.96,-.09);
const pcCanvas=document.createElement('canvas');pcCanvas.width=960;pcCanvas.height=600;const pcCtx=pcCanvas.getContext('2d'),pcTexture=new THREE.CanvasTexture(pcCanvas);pcTexture.colorSpace=THREE.SRGBColorSpace;
const pcDisplay=new THREE.Mesh(new THREE.PlaneGeometry(1.74,1.08),new THREE.MeshBasicMaterial({map:pcTexture,toneMapped:false}));pcDisplay.position.set(-3.7,1.97,.006);lounge.add(pcDisplay);
cube(1,.05,.38,palette.dark,-3.85,1.22,.67);for(let i=0;i<10;i++)for(let j=0;j<3;j++)cube(.065,.016,.06,palette.trim,-4.25+i*.09,1.25,.56+j*.09,lounge,0);ball(.12,.055,.17,palette.dark,-2.9,1.24,.66);
cube(.8,.18,.75,palette.teal,-3.7,.6,1.95);cube(.8,.65,.18,palette.teal,-3.7,.95,2.27);cylinder(.09,.09,.45,palette.dark,-3.7,.3,1.95); // Seat is passable as Arthur stands.
function drawPC(t){const x=pcCtx;x.fillStyle='#335641';x.fillRect(0,0,960,600);for(let i=0;i<25;i++){x.fillStyle=i%2?'#41684b':'#385c42';x.beginPath();const a=(i*179)%960,b=70+(i*73)%410;x.ellipse(a,b,90,30,-.4,0,7);x.fill();}x.fillStyle='#8b7952';x.beginPath();x.moveTo(100,550);x.lineTo(780,160);x.lineTo(810,175);x.lineTo(140,565);x.fill();for(let i=0;i<30;i++){const a=(i*113+35)%960,b=95+(i*91)%370;x.fillStyle='#1e4135';x.beginPath();x.moveTo(a,b-25);x.lineTo(a-17,b+8);x.lineTo(a+17,b+8);x.fill();}function house(a,b,big){x.fillStyle='#c2b798';x.fillRect(a-35,b-25,big?100:70,55);x.fillStyle='#796749';x.beginPath();x.moveTo(a-46,b-25);x.lineTo(a+10,b-66);x.lineTo(a+(big?78:45),b-25);x.fill();x.fillStyle='#36679c';x.fillRect(a+7,b-75,35,14);x.fillStyle='#5e4935';x.fillRect(a-4,b+2,17,28);}house(455,282,true);house(340,365,false);house(600,320,false);for(let i=0;i<9;i++){const a=430+Math.cos(t*.3+i)*130,b=330+Math.sin(t*.3+i*2)*55;x.fillStyle='#c5ae83';x.beginPath();x.arc(a,b-8,5,0,7);x.fill();x.fillStyle='#75a8e0';x.fillRect(a-4,b-3,8,14);}x.fillStyle='#1b2423';x.fillRect(0,0,960,62);x.fillStyle='#ebd6a2';x.font='bold 27px Georgia';x.fillText('AGE OF EMPIRES',24,41);x.font='18px monospace';x.fillStyle='#d5d9bf';x.fillText('FOOD  240    WOOD  180    GOLD  95',450,38);x.fillStyle='#252e2c';x.fillRect(0,505,960,95);x.strokeStyle='#b59e69';x.strokeRect(15,518,125,68);x.fillStyle='#4d7251';x.fillRect(20,523,115,58);x.fillStyle='#d8c48c';x.font='20px Georgia';x.fillText('Town Centre',175,540);x.font='16px sans-serif';x.fillText('Arthur’s empire is coming along rather nicely.',175,571);pcTexture.needsUpdate=true;}
drawPC(0);
// Sofa, a low table, plant and lockers keep the lounge inhabited.
cube(2.9,.5,1.2,palette.dark,2.1,.4,2.9);cube(2.85,.23,1.17,palette.orange,2.1,.77,2.9);cube(2.95,.75,.23,palette.orange,2.1,1.02,3.45);for(const x of [.57,3.63])cube(.18,.35,1.3,palette.trim,x,.86,2.9);obstacle(2.1,2.9,3.2,1.45);
cylinder(.4,.5,.5,palette.dark,1.9,.4,.9);cube(1.4,.15,1.05,palette.trim,1.9,.72,.9);cube(.44,.045,.6,palette.teal,1.7,.82,.9);obstacle(1.9,.9,1.6,1.25);
for(let i=0;i<2;i++){const z=-2.8+i*1.3;cube(.85,1.8,1,palette.hull,-5.48,1,z);cube(.06,1.55,.83,palette.teal,-5.02,1,z);obstacle(-5.45,z,1.1,1.15);}
cylinder(.33,.24,.6,palette.orange,-5.1,.43,3.1);for(let i=0;i<6;i++){const leaf=ball(.18,.55,.13,0x75a898,-5.1+Math.sin(i)*.18,1.15,-3+6.1+Math.cos(i)*.16);leaf.rotation.z=Math.sin(i)*.5;}obstacle(-5.1,3.1,.95,.95);
const loungeText=label('R E C R E A T I O N',3.8,.36,'#c4d3d1');loungeText.rotation.x=-Math.PI/2;loungeText.position.set(-.4,.139,3.8);lounge.add(loungeText);
// A narrow enclosed connector physically joins lounge and life shuttle.
cube(2.7,.45,2.6,palette.edge,6.85,-.22,0);cube(2.7,.08,2.35,palette.tile,6.85,.1,0);for(const z of [-1.25,1.25])cube(2.7,.3,.16,palette.trim,6.85,.24,z);
for(const z of [-1.25,1.25])cube(.3,2.8,.3,palette.hull,6,1.4,z);cube(.3,.22,2.8,palette.trim,6,2.85,0);
const airDoor=new THREE.Group();airDoor.position.set(6,0,0);lounge.add(airDoor);cube(.18,2.6,2.24,palette.dark,0,1.4,0,airDoor);cube(.2,.14,1.8,palette.amber,0,1.55,0,airDoor);cube(.21,.5,.05,palette.trim,0,1.55,.02,airDoor);
for(const z of [-3.05,3.05])cube(.25,.5,3.3,palette.hull,6,.3,z);
const airPanel=new THREE.Group();airPanel.position.set(4.65,1.65,-2.75);lounge.add(airPanel);cube(1.3,2,.35,palette.dark,0,0,0,airPanel,.13);cube(1.15,1.84,.06,palette.hull,0,0,.2,airPanel);cube(.19,1.17,.07,palette.dark,0,-.04,.27,airPanel);for(const x of [-.14,.14])cube(.035,1.1,.05,palette.trim,x,-.04,.31,airPanel);
const handle=new THREE.Group();handle.position.set(0,.48,.4);airPanel.add(handle);cube(.65,.16,.19,palette.amber,0,0,0,handle,.065);for(const x of [-.34,.34])ball(.11,.13,.11,palette.dark,x,0,0,handle);const handleHalo=new THREE.PointLight(0xffcf6e,1,2);handle.add(handleHalo);
let airStatusMesh=label('PULL TO OPEN',.99,.16,'#ffcf82');airStatusMesh.position.set(0,.77,.25);airPanel.add(airStatusMesh);const airLamp=glow(.7,.045,.035,0xffbb68,0,-.81,.25,airPanel);
// Shuttle interior, visible through the opened door.
cube(7.3,2.2,.2,palette.wall,0,1.05,-3.15,shuttle);cube(.2,.3,6.25,palette.trim,3.65,.2,0,shuttle);cube(7.4,.16,.25,palette.trim,0,2.2,-3.15,shuttle);
for(const x of [-2,0,2]){cube(1.75,1,.15,palette.dark,x,1.45,-3.0,shuttle);glow(1.55,.8,.025,0x214a62,x,1.45,-2.9,shuttle);}
for(const x of [-1.6,.1]){cube(.8,.22,.8,palette.teal,x,.65,-.9,shuttle);cube(.8,.75,.2,palette.teal,x,.95,-.55,shuttle);cylinder(.1,.1,.4,palette.dark,x,.36,-.9,shuttle);obstacle(11.7+x,-.8,1,1.05);}
const launchPanel=new THREE.Group();launchPanel.position.set(1.8,1.5,-1.9);shuttle.add(launchPanel);cube(1.75,1.5,.4,palette.dark,0,0,0,launchPanel,.16);cube(1.58,1.32,.05,palette.hull,0,0,.24,launchPanel);const launchLabel=label('LIFE SHUTTLE 07',1.35,.17,'#d3e9df');launchLabel.position.set(0,.48,.28);launchPanel.add(launchLabel);
const launchButton=cylinder(.29,.29,.14,palette.amber,0,-.03,.36,launchPanel);launchButton.rotation.x=Math.PI/2;launchButton.material=mat(palette.amber,palette.amber);const launchWord=label('LAUNCH',.45,.1,'#382d25');launchWord.position.set(0,-.03,.44);launchPanel.add(launchWord);
const launchMeter=cube(1.2,.06,.03,palette.teal,0,-.5,.29,launchPanel,.01);obstacle(13.5,-1.9,2,.85);
const shuttleText=label('L I F E B O A T   0 7',3,.33,'#c4d3d1');shuttleText.rotation.x=-Math.PI/2;shuttleText.position.set(0,.14,2.1);shuttle.add(shuttleText);
const engines=[];for(const x of [-2.5,2.5]){cube(.95,.6,1.6,palette.hull,x,-.5,2.1,shuttle);const nozzle=cylinder(.3,.4,.4,palette.dark,x,-.5,3,shuttle);nozzle.rotation.x=Math.PI/2;const exhaust=ball(.25,.25,.6,0x83e2f2,x,-.5,3.4,shuttle);exhaust.material=new THREE.MeshBasicMaterial({color:0x83e2f2,transparent:true,opacity:0,toneMapped:false});engines.push(exhaust);}
// Halcyon is an external 3D ship. The lounge attaches to its rear boom.
const halcyon=new THREE.Group();halcyon.position.set(0,2,-24);scene.add(halcyon);
cube(19,2.3,3.8,palette.hull,0,0,0,halcyon,.45);cube(5,2.9,4.5,palette.trim,-3,0,0,halcyon,.4);cube(3,1.2,3.1,palette.dark,8.8,.9,0,halcyon,.3);cube(2.7,.6,2.6,0x74bcc8,8.8,1.5,0,halcyon,.16);
for(const x of [-8,-4,0,4]){cube(.12,.14,3.95,palette.amber,x,.7,0,halcyon);for(const z of [-2.03,2.03])for(let j=0;j<4;j++)glow(.3,.12,.04,0x9cdee0,x+j*.65,-.05,z,halcyon);}
for(const x of [-6,2]){cube(.25,6,.3,palette.dark,x,0,0,halcyon);for(const y of [-4,4]){cube(4,2,.15,0x284e75,x,y,0,halcyon,.08);for(let i=0;i<6;i++)cube(.025,1.9,.18,0x69899b,x-1.7+i*.65,y,0,halcyon,0);}}
for(const z of [-1.2,1.2]){const engine=cylinder(.7,.7,1.6,palette.dark,-10,0,z,halcyon);engine.rotation.z=Math.PI/2;const burn=ball(.2,.5,.5,0x72d5e8,-10.85,0,z,halcyon);burn.material=mat(0x72d5e8,0x72d5e8);}
const hullName=label('H A L C Y O N',5,.45,'#e4e5db');hullName.position.set(1.6,.55,1.93);halcyon.add(hullName);
cube(1.15,.7,14.2,palette.dark,-3,-1.2,-11.8,scene,.12); // visible attachment to the recreation wing
const meteorGroup=new THREE.Group();scene.add(meteorGroup);const impacts=[];
for(let i=0;i<6;i++){const target=new THREE.Vector3(-7+i*2.7,2+(i%2)*.5,-21.5),start=target.clone().add(new THREE.Vector3(12+i*2,9+i*.7,-11));const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.28+(i%3)*.1,0),mat(0x9c8271));rock.visible=false;meteorGroup.add(rock);const tail=new THREE.Mesh(new THREE.CylinderGeometry(.025,.18,3.5,10),new THREE.MeshBasicMaterial({color:0xf5ba73,transparent:true,opacity:.55,depthWrite:false}));tail.visible=false;meteorGroup.add(tail);const flash=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshBasicMaterial({color:0xffd88f,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));flash.position.copy(target);meteorGroup.add(flash);const lamp=new THREE.PointLight(0xffa458,0,10);lamp.position.copy(target);meteorGroup.add(lamp);const scar=new THREE.Mesh(new THREE.CircleGeometry(.5,9),new THREE.MeshBasicMaterial({color:0x253245,side:THREE.DoubleSide}));scar.position.copy(target);scar.position.z=-21.45;scar.rotation.z=i;scar.visible=false;meteorGroup.add(scar);const fragments=[];for(let j=0;j<7;j++){const f=new THREE.Mesh(new THREE.IcosahedronGeometry(.12+(j%3)*.05,0),mat(j%2?0x917c6d:0xdca169));f.visible=false;meteorGroup.add(f);fragments.push({mesh:f,v:new THREE.Vector3(Math.sin(j*17+i)*1.5,Math.cos(j*11)*1.1,Math.sin(j*7)*1.2)})}impacts.push({start,target,rock,tail,flash,lamp,scar,fragments,time:1.5+i*.85,hit:false});}
function updateMeteors(t){for(const a of impacts){const approach=t-a.time;if(approach>=-1.1&&approach<0){a.rock.visible=a.tail.visible=true;a.rock.position.lerpVectors(a.start,a.target,(approach+1.1)/1.1);a.rock.rotation.x+=.05;const dir=a.start.clone().sub(a.target).normalize();a.tail.position.copy(a.rock.position).addScaledVector(dir,1.8);a.tail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);}else{a.rock.visible=a.tail.visible=false;}if(approach>=0){a.hit=true;a.scar.visible=true;const burst=Math.max(0,1-approach/1.25);a.flash.scale.setScalar(.35+(1-burst)*1.6);a.flash.material.opacity=burst*.85;a.lamp.intensity=burst*15;for(const f of a.fragments){f.mesh.visible=approach<20;f.mesh.position.copy(a.target).addScaledVector(f.v,Math.min(approach,15));f.mesh.rotation.set(approach*.3,approach*.7,approach*.2);} }} }

// Arthur: compact, rounded astronaut with an oversized visor.
const player=new THREE.Group();player.position.set(-3.7,0,1.85);scene.add(player);player.rotation.y=Math.PI;const body=new THREE.Group();player.add(body);
ball(.38,.49,.29,palette.white,0,.82,0,body);cube(.57,.56,.25,palette.amber,0,.87,-.32,body,.12);cube(.58,.08,.44,palette.orange,0,.62,0,body,.04);
ball(.45,.43,.39,palette.white,0,1.34,0,body);ball(.373,.26,.16,0x203b50,0,1.36,.31,body);ball(.305,.18,.06,0x659caa,0,1.4,.44,body);const gleam=ball(.135,.045,.018,0xc1e5dd,-.1,1.48,.49,body);gleam.rotation.z=-.2;
cube(.22,.17,.04,palette.amber,0,.95,.29,body,.02);glow(.04,.035,.02,0x8abfb1,-.05,.98,.32,body);
const legs=[],arms=[];for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.2,.45,0);body.add(leg);ball(.16,.25,.17,palette.white,0,-.17,0,leg);cube(.31,.18,.43,palette.orange,0,-.35,.06,leg,.07);legs.push(leg);const arm=new THREE.Group();arm.position.set(side*.4,1.02,0);body.add(arm);ball(.13,.27,.14,palette.white,side*.025,-.14,0,arm);ball(.135,.13,.145,palette.amber,side*.03,-.34,0,arm);arms.push(arm);}
const shadowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,5,64,64,62);g.addColorStop(0,'rgba(12,29,40,.35)');g.addColorStop(1,'rgba(12,29,40,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();const contact=new THREE.Mesh(new THREE.PlaneGeometry(1.3,1.3),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.105;scene.add(contact);
// Distant stars and a small moon provide depth without distracting from the deck.
const positions=[];for(let i=0;i<500;i++){const r=35+Math.random()*30,a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1);positions.push(r*Math.sin(b)*Math.cos(a),r*Math.cos(b),r*Math.sin(b)*Math.sin(a))}const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xb4d1e8,size:.065,transparent:true,opacity:.65,sizeAttenuation:true}));scene.add(stars);
// Marvin is a physical member of the cabin, with a persistent golden glow.
const marvin=new THREE.Group();marvin.position.set(-.7,0,.7);ship.add(marvin);
const marvinBody=new THREE.Group();marvin.add(marvinBody);
const wheel=cylinder(.29,.29,.3,palette.dark,0,.36,0,marvin);wheel.rotation.z=Math.PI/2;
cylinder(.1,.1,.32,palette.amber,0,.36,0,marvin).rotation.z=Math.PI/2;
cube(.74,.64,.54,palette.amber,0,.94,0,marvinBody,.15);
cube(.86,.59,.61,palette.white,0,1.48,.02,marvinBody,.15);
cube(.66,.35,.075,palette.dark,0,1.49,.35,marvinBody,.09);
for(const x of [-.17,.17])glow(.085,.14,.035,0xffd687,x,1.51,.402,marvinBody);
const smile=glow(.16,.02,.025,0xffd687,0,1.37,.405,marvinBody);
for(const x of [-.17,.17]){const lid=cube(.12,.045,.025,palette.dark,x,1.565,.425,marvinBody,.005);lid.rotation.z=x<0?-.18:.18;}
marvinBody.rotation.x=.06;
for(const side of [-1,1]){ball(.13,.13,.13,palette.dark,side*.43,1.04,0,marvinBody);cube(.13,.33,.13,palette.white,side*.48,.88,.03,marvinBody,.05);ball(.12,.11,.12,palette.amber,side*.48,.7,.07,marvinBody);}
cylinder(.025,.025,.27,palette.dark,.21,1.89,0,marvinBody);const antenna=ball(.085,.085,.085,0xffd080,.21,2.05,0,marvinBody);antenna.material=new THREE.MeshBasicMaterial({color:0xffd080,toneMapped:false});
cube(.19,.15,.04,palette.dark,0,.98,.29,marvinBody,.025);glow(.11,.045,.025,0xffd080,0,1,.32,marvinBody);
marvinBody.traverse(o=>{if(o.isMesh&&o.material.color?.getHex()===palette.amber){o.material=o.material.clone();o.material.emissive.setHex(0xe9a943);o.material.emissiveIntensity=.42;}});

function auraTexture(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,205,103,.65)');g.addColorStop(.38,'rgba(255,184,63,.3)');g.addColorStop(1,'rgba(255,168,40,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
const auraMap=auraTexture();const aura=new THREE.Sprite(new THREE.SpriteMaterial({map:auraMap,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,opacity:.52}));aura.position.set(0,1.1,0);aura.scale.set(2.9,3.3,1);marvin.add(aura);
const marvinPool=new THREE.Mesh(new THREE.PlaneGeometry(3,3),new THREE.MeshBasicMaterial({map:auraMap,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,opacity:.75}));marvinPool.rotation.x=-Math.PI/2;marvinPool.position.y=.115;marvin.add(marvinPool);
const marvinRing=new THREE.Mesh(new THREE.RingGeometry(.63,.665,48),new THREE.MeshBasicMaterial({color:0xffcf72,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));marvinRing.rotation.x=-Math.PI/2;marvinRing.position.y=.12;marvin.add(marvinRing);
const marvinLight=new THREE.PointLight(0xffbf65,2,4,2);marvinLight.position.set(0,1.3,.25);marvin.add(marvinLight);
// Coolie: a six-litre reservoir with exactly two litres visible inside it.
const cooler=new THREE.Group();cooler.position.set(-2.3,0,1.75);shuttle.add(cooler);
cube(.82,1.1,.68,palette.trim,0,.72,0,cooler,.12);cube(.66,.45,.06,palette.dark,0,.94,.36,cooler,.06);
for(const x of [-.14,.14])glow(.07,.09,.025,0x92e5d4,x,1.01,.4,cooler);const coolieSmile=label('⌣',.24,.12,'#a3eee0');coolieSmile.position.set(0,.88,.405);cooler.add(coolieSmile);
const reservoir=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.9,32),new THREE.MeshPhysicalMaterial({color:0xc2e6ed,transparent:true,opacity:.2,roughness:.12,side:THREE.DoubleSide,depthWrite:false}));reservoir.position.set(0,1.8,0);cooler.add(reservoir);
const water=cylinder(.285,.285,.3,0x5ac5da,0,1.5,0,cooler);water.material=new THREE.MeshStandardMaterial({color:0x65cde2,emissive:0x248da4,emissiveIntensity:.15,roughness:.2,transparent:true,opacity:.8});
cylinder(.33,.33,.08,palette.teal,0,2.28,0,cooler);cylinder(.33,.33,.07,palette.teal,0,1.32,0,cooler);
const waterLabel=label('2 L / 6 L',.64,.15,'#e0f4ef');waterLabel.position.set(0,1.82,.32);cooler.add(waterLabel);const coolieName=label('COOLIE',.55,.11,'#698782');coolieName.position.set(0,.48,.37);cooler.add(coolieName);
cube(.18,.08,.23,palette.teal,0,.68,.48,cooler);cube(.58,.05,.42,palette.dark,0,.24,.45,cooler);cylinder(.105,.085,.23,palette.white,0,.38,.47,cooler);obstacle(9.4,1.75,1,.88);

const cupWater=cylinder(.08,.08,.012,0x6bcbe3,0,.46,.47,cooler);cupWater.visible=false;
