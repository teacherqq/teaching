(function () {
  const stage = document.getElementById('stage');
  const button = document.getElementById('celebrationSound');
  let soundOn = true;
  try { soundOn = localStorage.getItem('song-celebration-sound') !== 'off'; } catch (_) {}
  function updateButton() {
    button.textContent = soundOn ? '🔊 鼓勵聲' : '🔇 鼓勵聲';
    button.setAttribute('aria-pressed', String(soundOn));
    button.title = soundOn ? '關閉答對鼓勵聲' : '開啟答對鼓勵聲';
  }
  button.addEventListener('click', function () {
    soundOn = !soundOn;
    try { localStorage.setItem('song-celebration-sound', soundOn ? 'on' : 'off'); } catch (_) {}
    updateButton();
  });
  updateButton();

  window.celebrate = function (withEncouragement = true) {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const layer = document.createElement('div');
      layer.className = 'celebration-confetti';
      layer.setAttribute('aria-hidden', 'true');
      const colors = ['#d85847', '#e8ad3d', '#6e9c78', '#78a8bd', '#df91a0'];
      for (let i = 0; i < 45; i++) {
        const piece = document.createElement('i');
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = Math.random() * .35 + 's';
        piece.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
        piece.style.setProperty('--spin', (Math.random() * 900 - 450) + 'deg');
        layer.appendChild(piece);
      }
      stage.appendChild(layer);
      setTimeout(() => layer.remove(), 2600);
    }
    if (!soundOn) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        [523.25, 659.25, 783.99].forEach((frequency, i) => {
          const oscillator = ctx.createOscillator(), gain = ctx.createGain();
          const start = ctx.currentTime + i * .11;
          oscillator.type = 'sine'; oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(.0001, start);
          gain.gain.exponentialRampToValueAtTime(.11, start + .025);
          gain.gain.exponentialRampToValueAtTime(.0001, start + .22);
          oscillator.connect(gain); gain.connect(ctx.destination);
          oscillator.start(start); oscillator.stop(start + .23);
        });
        setTimeout(() => ctx.close(), 1200);
      }
    } catch (_) {}
    if (withEncouragement) { try { const a=new Audio('voice-v4/encourage.mp3');a.addEventListener('play',()=>window.musicDuck?.(true));for(const e of ['ended','pause','error'])a.addEventListener(e,()=>window.musicDuck?.(false));a.play().catch(() => {}); } catch (_) {} }
  };
})();
