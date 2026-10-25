// Generate Kokoro clips for every line the game can say, reusing existing recordings.
// usage: cd tools && npm install && node gen_voices.mjs <halcyon repo root>
// Reuses clips already in src/recordings.json; synthesises the rest with Kokoro (bm_lewis, af_jessica, bf_isabella).
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {KokoroTTS} from 'kokoro-js';
const root=process.argv[2];
const cast={marvin:'bm_lewis',mara:'af_jessica',coolie:'bf_isabella'};
const lines=JSON.parse(readFileSync(new URL('./lines.json',import.meta.url)));
const out=`${root}/src/recordings.json`;
const old=JSON.parse(readFileSync(out,'utf8'));
const fresh={};
const needed=lines.filter(l=>!old[l.who+':'+l.text]);
console.log(`${lines.length} lines, ${needed.length} to synthesise`);
let tts=null;
mkdirSync('clips',{recursive:true});
for(const [i,l] of lines.entries()){
 const key=l.who+':'+l.text;
 if(old[key]){fresh[key]=old[key];continue;}
 if(!tts)tts=await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8'});
 const voice=cast[l.who],spoken=l.spoken||l.text;
 const audio=await tts.generate(spoken,{voice});
 const wav=`clips/${i}.wav`,mp3=`clips/${i}.mp3`;
 await audio.save(wav);
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',wav,'-codec:a','libmp3lame','-b:a','64k','-ac','1',mp3]);
 const duration=audio.audio.length/audio.sampling_rate;
 fresh[key]={voice,duration:Math.round(duration*1000)/1000,src:'data:audio/mpeg;base64,'+readFileSync(mp3).toString('base64')};
 console.log(`${l.who} ${duration.toFixed(1)}s  ${l.text}`);
}
writeFileSync(out,JSON.stringify(fresh));
console.log(`wrote ${out} with ${Object.keys(fresh).length} recordings`);
