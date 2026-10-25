// Browser speech synthesis needs no credentials or paid service.
const marvinAudio=(()=>{
 const synth=window.speechSynthesis;
 const supported=!!synth&&typeof SpeechSynthesisUtterance!=='undefined';
 const muteButton=document.getElementById('muteMarvin'),replayButton=document.getElementById('replayMarvin'),voiceSelect=document.getElementById('marvinVoice'),voiceStatus=document.getElementById('voiceStatus');
 let muted=false,savedVoice='',lastLine='',unlocked=false,serial=0,activeUtterance=null,audioContext=null,master=null;
 try{muted=localStorage.getItem('lifeboat-muted')==='true';savedVoice=localStorage.getItem('lifeboat-voice')||'';}catch{}
 function status(text){voiceStatus.textContent=text;}
 function sync(){muteButton.textContent=muted?'Unmute':'Mute';muteButton.setAttribute('aria-pressed',String(muted));replayButton.disabled=!lastLine||!supported||muted;}
 function voices(){return supported?synth.getVoices():[];}
 function refreshVoices(){const available=voices(),current=voiceSelect.value||savedVoice;voiceSelect.replaceChildren();if(!available.length){voiceSelect.add(new Option('Browser default',''));return;}const english=available.filter(v=>v.lang.toLowerCase().startsWith('en'));const choices=english.length?english:available;for(const voice of choices)voiceSelect.add(new Option(`${voice.name} (${voice.lang})`,voice.voiceURI));const pick=choices.find(v=>v.voiceURI===current)||choices.find(v=>v.lang==='en-GB'&&v.localService)||choices.find(v=>v.lang==='en-GB')||choices.find(v=>v.default)||choices[0];voiceSelect.value=pick.voiceURI;}
 function stop(){serial++;if(supported)synth.cancel();activeUtterance=null;if(master&&audioContext)master.gain.cancelScheduledValues(audioContext.currentTime);}
 function speak(text){lastLine=text;sync();if(!unlocked||muted)return;if(!supported){status('Voice unavailable · subtitles on');return;}stop();const ticket=serial,utterance=new SpeechSynthesisUtterance(text),selected=voices().find(v=>v.voiceURI===voiceSelect.value);if(selected)utterance.voice=selected;utterance.lang=selected?.lang||'en-GB';utterance.pitch=1.16;utterance.rate=.98;utterance.volume=.85;activeUtterance=utterance;status('Marvin is speaking…');utterance.onend=()=>{if(ticket===serial){status('Marvin’s voice ready');activeUtterance=null;}};utterance.onerror=e=>{if(ticket!==serial)return;activeUtterance=null;status(e.error==='canceled'||e.error==='interrupted'?'Marvin’s voice ready':'Voice unavailable · subtitles on');};synth.speak(utterance);}
 function ping(){if(!unlocked||muted||!audioContext||!master)return;const start=audioContext.currentTime;[880,1108.73].forEach((frequency,i)=>{const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),t=start+i*.19;oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.045,t+.015);gain.gain.exponentialRampToValueAtTime(.0001,t+.36);oscillator.connect(gain);gain.connect(master);oscillator.start(t);oscillator.stop(t+.38);});}
 function unlock(){unlocked=true;try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio&&!audioContext){audioContext=new Audio();master=audioContext.createGain();master.gain.value=muted?0:1;master.connect(audioContext.destination);}audioContext?.resume().catch(()=>{});}catch{}refreshVoices();sync();status(muted?'Sound muted':supported?'Marvin’s voice ready':'Voice unavailable · subtitles on');}
 muteButton.addEventListener('click',()=>{muted=!muted;try{localStorage.setItem('lifeboat-muted',String(muted));}catch{}if(muted)stop();if(master)master.gain.value=muted?0:1;sync();status(muted?'Sound muted':supported?'Marvin’s voice ready':'Voice unavailable · subtitles on');});
 replayButton.addEventListener('click',()=>{unlock();speak(lastLine);});
 voiceSelect.addEventListener('change',()=>{savedVoice=voiceSelect.value;try{localStorage.setItem('lifeboat-voice',savedVoice);}catch{}if(lastLine)speak(lastLine);});
 if(supported){refreshVoices();synth.addEventListener('voiceschanged',refreshVoices);}else voiceSelect.disabled=true;
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(master)master.gain.value=0;status(muted?'Sound muted':'Marvin’s voice ready');}else if(master)master.gain.value=muted?0:1;});
 addEventListener('pagehide',()=>{stop();audioContext?.suspend().catch(()=>{});});sync();
 return {speak,unlock,ping,stop};
})();
