(function(){
 const music=new Audio('assets/song-background.mp3');
 music.loop=true; music.volume=0.09;
 const btn=document.getElementById('musicToggle');
 let enabled=true;
 try{enabled=localStorage.getItem('song-music')!=='off'}catch(_){}
 function display(){btn.textContent=enabled?'🎵 背景音樂':'🔇 背景音樂';btn.setAttribute('aria-pressed',String(enabled))}
 function play(){if(enabled)music.play().catch(()=>{})}
 window.pauseBackgroundMusic=function(){music.pause()};
 window.resumeBackgroundMusic=play;
 window.musicDuck=function(active){music.volume=active?0.025:0.09};
 document.getElementById('start').addEventListener('click',play);
 btn.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem('song-music',enabled?'on':'off')}catch(_){}display();if(enabled)play();else music.pause()});
 display();
})();
