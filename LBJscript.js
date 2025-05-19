  document.addEventListener('DOMContentLoaded', () => {

  // Footer elements
  const player       = document.getElementById('audio-player');
  const footer       = document.getElementById('player-footer');
  const footerCover  = document.getElementById('footer-cover');
  const footerSong   = document.getElementById('footer-song');
  const footerArtist = document.getElementById('footer-artist');
  const footerPrev   = document.getElementById('footer-prev');
  const footerPause  = document.getElementById('footer-pause');
  const footerNext   = document.getElementById('footer-next');

  // album buttons 
  const playBtn      = document.getElementById('play');
  const shuffleBtn   = document.getElementById('shuffle');

  // Full-screen elements 
  const screen       = document.getElementById('player-screen');
  const grab         = document.getElementById('screen-grab');
  const sCover       = document.getElementById('screen-cover');
  const sSong        = document.getElementById('screen-song');
  const sArtist      = document.getElementById('screen-artist');
  const seekSlider   = document.getElementById('seek-slider');
  const curLabel     = document.getElementById('cur-time');
  const totLabel     = document.getElementById('tot-time');
  const scrPrev      = document.getElementById('screen-prev');
  const scrPlay      = document.getElementById('screen-play');
  const scrNext      = document.getElementById('screen-next');
  const volSlider    = document.getElementById('vol-slider');

  // track list 
  const tracks       = Array.from(document.querySelectorAll('.track'));

  //  Queue state 
  let currentTrack = null;
  let queue        = [];
  let queueIndex   = 0;

  // Restore session
  (function restore () {
    const savedSrc = sessionStorage.getItem('playerSrc');
    if (!savedSrc) return;

    player.src         = savedSrc;
    player.currentTime = parseFloat(sessionStorage.getItem('playerTime')||0);

    const savedQ = JSON.parse(sessionStorage.getItem('queue')||'[]');
    queue = savedQ.map(src=>document.querySelector(`.track[data-src="${src}"]`))
                  .filter(Boolean);
    queueIndex = parseInt(sessionStorage.getItem('queueIndex')||0,10);

    currentTrack = queue.length ? queue[queueIndex]
                                : tracks.find(t=>t.dataset.src===savedSrc);
    currentTrack?.classList.add('playing');
    updateMini();

    if (sessionStorage.getItem('playerPaused')!=='true') player.play();
  })();

  //  Helpers 
  function updateMini () {
    footerCover.src        = 'album_covers/gnx.jpg';
    footerSong.textContent = currentTrack?.querySelector('.song-name')?.textContent || '';
    footerArtist.textContent = currentTrack?.querySelector('.song-artist')?.textContent || '';
    footer.classList.remove('hidden');
  }

  function playTrack (el) {
    player.src = el.dataset.src;
    player.currentTime = 0;
    player.play();

    currentTrack?.classList.remove('playing');
    el.classList.add('playing');
    currentTrack = el;

    updateMini();
    if (screen.classList.contains('show')) updateFull();
  }

  function startQueue (arr) {
    queue = arr.slice();
    queueIndex = 0;
    playTrack(queue[0]);
  }

  // Album buttons 
  playBtn?.addEventListener('click', () => startQueue(tracks));

  shuffleBtn?.addEventListener('click', () => {
    const s = tracks.slice();
    for (let i=s.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [s[i],s[j]]=[s[j],s[i]];
    }
    startQueue(s);
  });

  //Row click 
  tracks.forEach(t=>t.addEventListener('click',()=>{queue=[];playTrack(t);}))

  // Prev / Next 
  function prev(){ const pool=queue.length?queue:tracks;
    let i=pool.indexOf(currentTrack);
    if(i>0){ if(queue.length) queueIndex=i-1; playTrack(pool[i-1]); }
    else player.currentTime=0;
  }
  function next(){ const pool=queue.length?queue:tracks;
    let i=pool.indexOf(currentTrack);
    if(i<pool.length-1){ if(queue.length) queueIndex=i+1; playTrack(pool[i+1]); }
  }
  footerPrev.addEventListener('click',prev);
  footerNext.addEventListener('click',next);

  // Pause / resume
  function togglePlay(){
    if(player.paused){player.play();footerPause.textContent='❚❚';}
    else{player.pause();footerPause.textContent='►';}
  }
  footerPause.addEventListener('click',togglePlay);
  player.addEventListener('play', ()=>footerPause.textContent='❚❚');
  player.addEventListener('pause',()=>footerPause.textContent='►');

  // Auto-advance 
  player.addEventListener('ended',()=>{
    if(queue.length && queueIndex<queue.length-1){queueIndex++;playTrack(queue[queueIndex]);}
    else{currentTrack?.classList.remove('playing');footer.classList.add('hidden');queue=[];}
  });

  // Full screen player
  function fmt(sec){if(!isFinite(sec))return'0:00';const m=Math.floor(sec/60),s=Math.floor(sec%60);return m+':'+String(s).padStart(2,'0');}
  function updateSeek(){
    if(player.duration){seekSlider.value=(player.currentTime/player.duration)*100;
      curLabel.textContent=fmt(player.currentTime);}
  }
  function updateFull(){
    sCover.src='album_covers/gnx.jpg';
    sSong.textContent=footerSong.textContent;
    sArtist.textContent=footerArtist.textContent;
    totLabel.textContent=fmt(player.duration);
    scrPlay.textContent=player.paused?'►':'❚❚';
  }

  function openFull(){ if(!currentTrack) return; updateFull(); volSlider.value=player.volume;
    updateSeek(); screen.classList.add('show'); screen.classList.remove('hidden'); }
  function closeFull(){ screen.classList.remove('show'); }

  footer.addEventListener('click',openFull);
  grab  .addEventListener('click',closeFull);

  // swipe down 
  let startY=0;
  screen.addEventListener('touchstart',e=>startY=e.touches[0].clientY,{passive:true});
  screen.addEventListener('touchmove',e=>{
    if(e.touches[0].clientY-startY>100) closeFull();
  },{passive:true});

  // full-screen transport
  scrPrev.addEventListener('click',()=>footerPrev.click());
  scrNext.addEventListener('click',()=>footerNext.click());
  scrPlay.addEventListener('click',()=>footerPause.click());

  // seek & volume
  player.addEventListener('timeupdate',updateSeek);
  player.addEventListener('loadedmetadata',()=>totLabel.textContent=fmt(player.duration));
  seekSlider.addEventListener('input',()=>{if(player.duration) player.currentTime=(seekSlider.value/100)*player.duration;});
  volSlider .addEventListener('input',()=>player.volume=volSlider.value);

  //  Persist on unload 
  window.addEventListener('beforeunload',()=>{
    sessionStorage.setItem('playerSrc',player.src||'');
    sessionStorage.setItem('playerTime',player.currentTime||0);
    sessionStorage.setItem('playerPaused',player.paused);
    sessionStorage.setItem('queue',JSON.stringify(queue.map(t=>t.dataset.src)));
    sessionStorage.setItem('queueIndex',queueIndex);
  });
});
    