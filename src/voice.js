const marvinAudio=(()=>{
 // Dialogue rendered locally with Kokoro-82M v1.0 (q8, Apache-2.0).
 // https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
 const muteButton=document.getElementById('muteMarvin'),replayButton=document.getElementById('replayMarvin'),voiceStatus=document.getElementById('voiceStatus');
 const cast={marvin:{name:'Lewis',id:'bm_lewis'},mara:{name:'Jessica',id:'af_jessica'},coolie:{name:'Isabella',id:'bf_isabella'}};
 let muted=false,lastLine='',lastSpeaker='marvin',unlocked=false,serial=0,active=null,audioContext=null,master=null;
 try{muted=localStorage.getItem('lifeboat-muted')==='true';}catch{}
 function status(text){voiceStatus.textContent=text;}
 function sync(){muteButton.textContent=muted?'Unmute':'Mute';muteButton.setAttribute('aria-pressed',String(muted));replayButton.disabled=!lastLine||muted;}
 for(const [who,voice] of Object.entries(cast)){const select=document.getElementById(who+'Voice');select.replaceChildren(new Option(voice.name+' · Kokoro',voice.id));}
 function stop(){serial++;if(active){active.pause();active.src='';active=null;}}
 function speak(text,who='marvin'){lastLine=text;lastSpeaker=who;sync();if(!unlocked||muted)return;stop();const recording=VOICE_RECORDINGS[who+':'+text];if(!recording){status('Voice unavailable · subtitles on');return;}const ticket=serial,a=new Audio(recording.src);a.volume=.85;active=a;status((who==='marvin'?'Marvin':who==='mara'?'Mara':'Coolie')+' is speaking…');a.onended=()=>{if(ticket===serial){active=null;status('Voices ready');}};a.onerror=()=>{if(ticket===serial){active=null;status('Voice unavailable · subtitles on');}};a.play().catch(()=>{if(ticket===serial){active=null;status('Press Replay line to hear the voice');}});}
 function duration(text,who='marvin'){return VOICE_RECORDINGS[who+':'+text]?.duration||0;}
 function tone(frequency,t,duration,volume,type='sine',endFrequency=frequency){const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=type;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(endFrequency,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(master);o.start(t);o.stop(t+duration+.02);}
 function effect(kind){if(!unlocked||muted||!audioContext||!master)return;const t=audioContext.currentTime;if(kind==='clunk'){tone(150,t,.2,.09,'triangle',48);tone(65,t+.12,.25,.05,'sine',40);}else if(kind==='launch'){tone(70,t,2.5,.08,'triangle',210);tone(110,t+.2,2.8,.04,'sine',340);}else if(kind==='impact'){tone(85,t,.45,.035,'triangle',35);}else {tone(740,t,.4,.035);tone(880,t+.24,.4,.025);}}
 function ping(){effect('ping')}
 function unlock(){unlocked=true;try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio&&!audioContext){audioContext=new Audio();master=audioContext.createGain();master.gain.value=muted?0:1;master.connect(audioContext.destination);}audioContext?.resume().catch(()=>{});}catch{}sync();status(muted?'Sound muted':'Voices ready');}
 muteButton.addEventListener('click',()=>{muted=!muted;try{localStorage.setItem('lifeboat-muted',String(muted));}catch{}if(muted)stop();if(master)master.gain.value=muted?0:1;sync();status(muted?'Sound muted':'Voices ready');});replayButton.addEventListener('click',()=>{unlock();speak(lastLine,lastSpeaker)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(master)master.gain.value=0;}else if(master)master.gain.value=muted?0:1;});addEventListener('pagehide',()=>{stop();audioContext?.suspend().catch(()=>{});});sync();return {speak,unlock,ping,stop,effect,duration,isSpeaking:()=>!!active};
})();
