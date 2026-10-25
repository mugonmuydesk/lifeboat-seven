const canvas=document.getElementById('game');
const scene=new THREE.Scene();
let renderer;
try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(error){document.getElementById('error').style.display='block';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
const deckCamera=new THREE.OrthographicCamera(-10,10,8,-8,.01,650),windowCamera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.03,650);let camera=deckCamera;camera.position.set(13,16,19);camera.lookAt(0,0,0);
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
// The lounge projects from the starboard flank of one continuous, enormous hull.
// Its near edge touches the lounge at x=-6; its spine recedes over 200 metres.
const halcyon=new THREE.Group();scene.add(halcyon);
cube(40,10,230,palette.hull,-26,-7,-93,halcyon,.7);
cube(38,.7,225,0x52697c,-26,-1.7,-93,halcyon,.25);
// Broad armour plates and repeated human-scale fittings establish distance.
for(let i=0;i<23;i++){
 const z=14-i*10;
 for(let j=0;j<4;j++){const x=-11-j*9;
 cube(8.75,.15,9.75,(i+j)%3===0?0x6c8290:0x5d7383,x,-1.27,z,halcyon,.04);
 }
 cube(.22,.19,9.6,palette.amber,-6.4,-1.18,z,halcyon,.02);
 cube(.45,.7,1.2,palette.dark,-6.4,-.85,z-3.5,halcyon,.08);
 glow(.3,.12,.6,0x9ce8f0,-6.12,-.45,z-3.5,halcyon);
 if(i%3===0){cube(9,1.4,4,palette.dark,-23,-.55,z,halcyon,.22);for(let j=0;j<6;j++)cube(.45,.2,3.4,0x7f949f,-26+j*1.15,.25,z,halcyon,.03);}
}
// Raised centreline towers, antennae and inset windows diminish into the distance.
for(let i=0;i<7;i++){const z=-15-i*28;
 cube(12,4.4,12,palette.hull,-36,.8,z,halcyon,.35);
 cube(9,1.6,8,palette.trim,-36,3.8,z-1,halcyon,.25);
 for(let j=0;j<6;j++)glow(.08,.35,.65,0xa1d9e2,-29.94,1.8,z-4+j*1.5,halcyon);
 cube(.18,5,.18,palette.dark,-36,7,z,halcyon,.02);
 glow(.3,.25,.3,0xffbc77,-36,9.6,z,halcyon);
}
// The recreation bay's load-bearing collar and underside visibly merge into the hull.
cube(3.2,3.5,10,palette.hull,-6.8,-1.6,0,halcyon,.22);
cube(12.8,.65,9.8,palette.dark,0,-.72,0,halcyon,.2);
for(const z of [-3.7,3.7]){cube(8,.6,.65,palette.hull,-3,-1.4,z,halcyon,.1);cube(.3,1.8,.8,palette.trim,-5.9,-.8,z,halcyon);}
cube(12.6,.28,.65,palette.trim,0,-.2,-4.9,halcyon,.1);
const hullName=label('H A L C Y O N',13,1.6,'#bacbd1');hullName.rotation.x=-Math.PI/2;hullName.position.set(-17,-1.16,-22);halcyon.add(hullName);
const bayName=label('07 / RECREATION',4.5,.45,'#c4dce4');bayName.position.set(.2,-.65,4.92);halcyon.add(bayName);
// Reusable GPU particles: hot ejecta expands quickly, smoke lingers over each scar.
const burstTexture=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.2,'rgba(255,255,255,.8)');g.addColorStop(.55,'rgba(255,255,255,.25)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
function particleCloud(count,smoke){const geometry=new THREE.BufferGeometry(),position=new Float32Array(count*3),colour=new Float32Array(count*3),alpha=new Float32Array(count),size=new Float32Array(count),seeds=[];for(let j=0;j<count;j++){const theta=j*2.399963,up=.15+Math.random()*.85,speed=smoke?1+Math.random()*1.3:3+Math.random()*10;seeds.push({v:new THREE.Vector3(Math.cos(theta)*Math.sqrt(1-up*up),up,Math.sin(theta)*Math.sqrt(1-up*up)).multiplyScalar(speed),life:smoke?6+Math.random()*7:.6+Math.random()*2.8,delay:Math.random()*.16,size:smoke?2+Math.random()*3:.13+Math.random()*.55});}
 geometry.setAttribute('position',new THREE.BufferAttribute(position,3));geometry.setAttribute('color',new THREE.BufferAttribute(colour,3));geometry.setAttribute('alpha',new THREE.BufferAttribute(alpha,1));geometry.setAttribute('particleSize',new THREE.BufferAttribute(size,1));
 const material=new THREE.ShaderMaterial({uniforms:{map:{value:burstTexture},viewport:{value:innerHeight}},vertexShader:'attribute float alpha; attribute float particleSize; attribute vec3 color; varying float a; varying vec3 c; uniform float viewport; void main(){a=alpha;c=color;vec4 p=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*p; float depth=projectionMatrix[2][3]==-1.?max(.1,-p.z):1.; gl_PointSize=clamp(particleSize*viewport*projectionMatrix[1][1]/(2.*depth),1.,220.);}',fragmentShader:'uniform sampler2D map; varying float a; varying vec3 c; void main(){gl_FragColor=vec4(c,texture2D(map,gl_PointCoord).a*a);}',transparent:true,depthWrite:false,blending:smoke?THREE.NormalBlending:THREE.AdditiveBlending,toneMapped:false});
 const points=new THREE.Points(geometry,material);points.frustumCulled=false;points.visible=false;return {points,seeds,position,colour,alpha,size,smoke};}
function animateCloud(c,target,t){c.points.visible=t>=0&&t<14;if(!c.points.visible)return;c.points.material.uniforms.viewport.value=renderer.domElement.height;for(let j=0;j<c.seeds.length;j++){const s=c.seeds[j],age=Math.max(0,t-s.delay),f=age/s.life,k=j*3,travel=c.smoke?age:3*(1-Math.exp(-age/3));c.position[k]=target.x+s.v.x*travel;c.position[k+1]=target.y+.2+s.v.y*travel;c.position[k+2]=target.z+s.v.z*travel;c.alpha[j]=t<s.delay?0:Math.max(0,1-f)*(c.smoke?.38:1);c.size[j]=s.size*(c.smoke?1+age*.6:1+age*.12);if(c.smoke){const shade=.17+.14*Math.max(0,1-age/2);c.colour[k]=shade*1.15;c.colour[k+1]=shade;c.colour[k+2]=shade*.95;}else{c.colour[k]=1;c.colour[k+1]=Math.max(.12,.95-f);c.colour[k+2]=Math.max(.015,.65-f*1.8);}}for(const name of ['position','color','alpha','particleSize'])c.points.geometry.attributes[name].needsUpdate=true;}
const meteorGroup=new THREE.Group();scene.add(meteorGroup);const impacts=[];
for(let i=0;i<7;i++){
 const target=new THREE.Vector3(-10-(i%3)*4,-1.12,-22-i*12),start=target.clone().add(new THREE.Vector3(32,29,13));
 const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.6+(i%3)*.2,1),mat(0x8d7766));rock.visible=false;meteorGroup.add(rock);
 const tail=new THREE.Mesh(new THREE.CylinderGeometry(.04,.45,9,12),new THREE.MeshBasicMaterial({color:0xffbd79,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));tail.visible=false;meteorGroup.add(tail);
 const flash=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshBasicMaterial({color:0xffdf9c,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));flash.position.copy(target);meteorGroup.add(flash);
 const lamp=new THREE.PointLight(0xffa458,0,24);lamp.position.copy(target).add(new THREE.Vector3(0,2,0));meteorGroup.add(lamp);
 const scar=new THREE.Mesh(new THREE.CircleGeometry(1.7+(i%2)*.6,11),new THREE.MeshBasicMaterial({color:0x1c2933,side:THREE.DoubleSide}));scar.position.copy(target);scar.rotation.set(-Math.PI/2,0,i);scar.visible=false;meteorGroup.add(scar);
 const sparks=particleCloud(110,false),smoke=particleCloud(32,true);meteorGroup.add(sparks.points,smoke.points);
 const fragments=[];for(let j=0;j<9;j++){const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.15+(j%3)*.12,0),mat(j%2?0x607583:0xb89b79));mesh.visible=false;meteorGroup.add(mesh);fragments.push({mesh,v:new THREE.Vector3(Math.sin(j*17+i)*3,1+Math.random()*3,Math.cos(j*7)*3)});}
 impacts.push({start,target,rock,tail,flash,lamp,scar,sparks,smoke,fragments,time:2+i*1.35,hit:false});
}
function updateMeteors(t){for(const a of impacts){const age=t-a.time;if(age>=-1.8&&age<0){a.rock.visible=a.tail.visible=true;a.rock.position.lerpVectors(a.start,a.target,(age+1.8)/1.8);a.rock.rotation.set(t,t*.6,t*.3);const dir=a.start.clone().sub(a.target).normalize();a.tail.position.copy(a.rock.position).addScaledVector(dir,4.3);a.tail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);}else a.rock.visible=a.tail.visible=false;if(age>=0){a.hit=true;a.scar.visible=true;const burst=Math.max(0,1-age/.65);a.flash.scale.setScalar(.3+(1-burst)*3);a.flash.material.opacity=burst*.9;a.lamp.intensity=burst*90;animateCloud(a.sparks,a.target,age);animateCloud(a.smoke,a.target,age);for(const f of a.fragments){f.mesh.visible=age<18;f.mesh.position.copy(a.target).addScaledVector(f.v,age);f.mesh.rotation.set(age*.7,age*.9,age*.4);}}}}

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

// Shared live feed on two physical wall screens: Captain Mara, in pink.
const commsCanvas=document.createElement('canvas');commsCanvas.width=768;commsCanvas.height=432;
const commsContext=commsCanvas.getContext('2d'),commsTexture=new THREE.CanvasTexture(commsCanvas);commsTexture.colorSpace=THREE.SRGBColorSpace;
function commsScreen(parent,x,y,z){const group=new THREE.Group();group.position.set(x,y,z);parent.add(group);cube(3.35,1.96,.19,palette.dark,0,0,0,group,.12);const face=new THREE.Mesh(new THREE.PlaneGeometry(3.12,1.75),new THREE.MeshBasicMaterial({map:commsTexture,toneMapped:false}));face.position.z=.11;group.add(face);return group;}
const loungeComms=commsScreen(lounge,-4.35,1.7,-4.43),shuttleComms=commsScreen(shuttle,0,1.45,-2.78);
function drawComms(t,on,speaking){const c=commsContext;c.fillStyle='#101e32';c.fillRect(0,0,768,432);c.strokeStyle=on?'#c96b9e':'#345266';c.lineWidth=3;c.strokeRect(14,14,740,404);c.fillStyle=on?'#f1a2cb':'#779da9';c.font='bold 24px monospace';c.textAlign='left';c.fillText(on?'● INCOMING / CAPTAIN MARA':'HALCYON / CREW COMMUNICATIONS',35,53);
 if(on){c.fillStyle='#a94f82';c.fillRect(274,290,220,105);c.fillStyle='#e7a4cd';c.beginPath();c.roundRect(244,112,280,202,38);c.fill();c.fillStyle='#773859';c.fillRect(373,76,22,38);c.fillStyle='#ffd9ef';c.beginPath();c.arc(384,72,14,0,Math.PI*2);c.fill();c.fillStyle='#342039';c.beginPath();c.roundRect(268,143,232,125,24);c.fill();const blink=Math.sin(t*.8)> .994;c.fillStyle='#fff1fc';for(const x of [324,445]){c.beginPath();c.ellipse(x,187,15,blink?3:22,0,0,Math.PI*2);c.fill();}c.fillStyle='#efa5d1';c.beginPath();c.roundRect(351,229,66,speaking?8+Math.abs(Math.sin(t*14))*15:7,5);c.fill();c.fillStyle='#ffd3eb';c.fillRect(366,330,37,22);c.font='18px monospace';c.fillText('COMMAND CHANNEL',35,390);for(let i=0;i<15;i++){const h=speaking?6+Math.abs(Math.sin(t*12+i*.9))*26:5;c.fillRect(566+i*9,385-h,5,h);}}
 else{c.textAlign='center';c.font='bold 52px monospace';c.fillStyle='#83aeb9';c.fillText('H A L C Y O N',384,215);c.font='20px monospace';c.fillStyle='#64828f';c.fillText('CHANNEL OPEN · STANDING BY',384,265);}
 commsTexture.needsUpdate=true;}
drawComms(0,false,false);
// A separate inner airlock belongs to the shuttle and travels with it.
for(const z of [-1.3,1.3])cube(.28,2.8,.25,palette.hull,-3.58,1.4,z,shuttle);cube(.28,.23,2.85,palette.trim,-3.58,2.85,0,shuttle);
const shuttleDoor=new THREE.Group();shuttleDoor.position.set(-3.58,2.9,0);shuttle.add(shuttleDoor);cube(.18,2.6,2.35,palette.dark,0,1.4,0,shuttleDoor);cube(.21,.16,2.1,palette.amber,0,1.5,0,shuttleDoor);shuttleDoor.visible=false;

const antennaGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:auraMap,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,opacity:0}));antennaGlow.position.copy(antenna.position);antennaGlow.scale.set(.8,.8,1);marvinBody.add(antennaGlow);
const antennaLight=new THREE.PointLight(0xffc65e,0,2);antennaLight.position.copy(antenna.position);marvinBody.add(antennaLight);
