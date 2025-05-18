
document.addEventListener('DOMContentLoaded', () => {
  /* ——— DOM handles —— */
  const player       = document.getElementById('audio-player');

  const footer       = document.getElementById('player-footer');
  const footerCover  = document.getElementById('footer-cover');
  const footerSong   = document.getElementById('footer-song');
  const footerArtist = document.getElementById('footer-artist');
  const footerPause  = document.getElementById('footer-pause');
  const footerPrev   = document.getElementById('footer-prev');  // NEW
  const footerNext   = document.getElementById('footer-next');  // NEW

  const playBtn      = document.getElementById('play');
  const shuffleBtn   = document.getElementById('shuffle');

  const tracks       = Array.from(document.querySelectorAll('.track'));

  /* ——— Queue state ——— */
  let currentTrack = null;   // <div class="track"> currently playing
  let queue        = [];     // array of track elements
  let queueIndex   = 0;      // position in queue

  // Core helper — play a given track row
  function playTrack(trackEl) {
    player.src         = trackEl.dataset.src;
    player.currentTime = 0;
    player.play();

    if (currentTrack) currentTrack.classList.remove('playing');
    trackEl.classList.add('playing');
    currentTrack = trackEl;

    footerCover.src        = 'album_covers/gnx.jpg';
    footerSong.textContent = trackEl.querySelector('.song-name').textContent;
    footerArtist.textContent = trackEl.querySelector('.song-artist').textContent;
    footerPause.textContent  = '❚❚';
    footer.classList.remove('hidden');
  }

  /* Start a queue (ordered or shuffled) */
  function startQueue(arr) {
    queue      = arr.slice();
    queueIndex = 0;
    playTrack(queue[0]);
  }

  /* Album-level controls */
  function playAlbum()   { startQueue(tracks); }

  function shuffleAlbum() {
    const shuffled = tracks.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    startQueue(shuffled);
  }

  playBtn   .addEventListener('click', playAlbum);
  shuffleBtn.addEventListener('click', shuffleAlbum);
  window.playAlbum    = playAlbum;      // keep existing inline onclicks working
  window.shuffleAlbum = shuffleAlbum;

  /*  Row click overrides queue  */
  tracks.forEach(t =>
    t.addEventListener('click', () => { queue = []; playTrack(t); })
  );

  /* ⏮ / ⏭ navigation  */
  function prevTrack() {
    /* If in a queue, step back; otherwise use full album order */
    const list = queue.length ? queue : tracks;
    let idx    = list.indexOf(currentTrack);
    if (idx > 0) {
      if (queue.length) queueIndex = idx - 1;
      playTrack(list[idx - 1]);
    } else {
      player.currentTime = 0;  // at first track → just restart
    }
  }

  function nextTrack() {
    const list = queue.length ? queue : tracks;
    let idx    = list.indexOf(currentTrack);
    if (idx < list.length - 1) {
      if (queue.length) queueIndex = idx + 1;
      playTrack(list[idx + 1]);
    }
  }

  footerPrev.addEventListener('click', prevTrack);
  footerNext.addEventListener('click', nextTrack);

  /* auto-advance at end of song*/
  player.addEventListener('ended', () => {
    if (queue.length && queueIndex < queue.length - 1) {
      queueIndex += 1;
      playTrack(queue[queueIndex]);
    } else {
      currentTrack.classList.remove('playing');
      currentTrack = null;
      footerPause.textContent = '►';
      footer.classList.add('hidden');
      queue = [];
    }
  });

  /* Pause / resume from footer */
  footerPause.addEventListener('click', () => {
    if (player.paused) {
      player.play();
      footerPause.textContent = '❚❚';
    } else {
      player.pause();
      footerPause.textContent = '►';
    }
  });
});
