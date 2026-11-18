(function(){
 let current=null, enabled=true, fallback=null, pending=null;
 const btn=document.getElementById('narrationToggle');
 function voiceAudio(src){const a=new Audio(src);a.addEventListener('play',()=>window.musicDuck?.(true));for(const event of ['ended','pause','error'])a.addEventListener(event,()=>window.musicDuck?.(false));return a}
 try{enabled=localStorage.getItem('song-narration')!=='off'}catch(_){}
 function label(){btn.textContent=enabled?'🔊 中文配音':'🔇 中文配音';btn.setAttribute('aria-pressed',String(enabled))}
 window.stopNarration=function(){if('speechSynthesis' in window)speechSynthesis.cancel();clearTimeout(fallback);pending=null;if(current){current.pause();current.currentTime=0;current=null}};
 window.playNarration=function(text,done){window.stopNarration();pending=done||null;if(!enabled){if(done)fallback=setTimeout(done,6000);return}let item=window.songVoices.find(x=>x.lang==='zh'&&x.text===text);if(!item){if(done)fallback=setTimeout(done,6000);return}current=voiceAudio('voice-v4/'+item.file);current.onended=()=>{if(done)fallback=setTimeout(done,1000)};current.play().catch(()=>{if(done)fallback=setTimeout(done,6000)});};
 window.pauseNarration=function(){clearTimeout(fallback);if(current&&!current.paused)current.pause()};
 window.resumeNarration=function(){if(current&&!current.ended){current.play().catch(()=>{});return true}if(pending){fallback=setTimeout(pending,1000);return true}return false};
 window.playGameInstruction=function(id){window.stopNarration();if(!enabled||id!=='dress')return;current=voiceAudio('voice-v4/dress-instruction-user.mp3');current.play().catch(()=>{})};
 window.playCityQuestion=function(){window.stopNarration();if(!enabled)return;current=voiceAudio('voice-v4/city-question-user.mp3');current.play().catch(()=>{})};
 window.playRetry=function(){window.stopNarration();if(!enabled)return;current=voiceAudio('voice-v4/retry.mp3');current.play().catch(()=>{})};
 window.playFeedback=function(ask,done){window.stopNarration();pending=done||null;if(!enabled){if(done)fallback=setTimeout(done,3500);return}let item=window.songFeedback.find(x=>x.ask===ask);if(!item){if(done)fallback=setTimeout(done,3500);return}current=voiceAudio('voice-v4/'+item.file);current.onended=()=>{if(done)fallback=setTimeout(done,1800)};current.play().catch(()=>{if(done)fallback=setTimeout(done,3500)})};
 btn.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('song-narration',enabled?'on':'off')}catch(_){}label();if(!enabled)window.stopNarration();else{let s=window.getCurrentNarrationText?.();if(s)window.playNarration(s,()=>window.resumeAutoNarration?.())}});label();
})();
