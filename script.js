const songs = [
    // ── slot 1 ──────────────────────────────────────────────────────
    {
        title:  "Choli Ke Peeche",
        artist: "Diljit Dosanjh, IP Singh, Alka Yagnik",
        cover:  "./assets/card7img.jpeg",
        src:    "./songs/song1.mp3",   // ← your file
    },
    // ── slot 2 ──────────────────────────────────────────────────────
    {
        title:  "A Perfect Day",
        artist: "Various Artists",
        cover:  "./assets/card2img.jpeg",
        src:    "./songs/song2.mp3",
    },
    // ── slot 3 ──────────────────────────────────────────────────────
    {
        title:  "Feel Good Friday",
        artist: "Various Artists",
        cover:  "./assets/card3img.jpeg",
        src:    "./songs/song3.mp3",
    },
    // ── slot 4 ──────────────────────────────────────────────────────
    {
        title:  "All New Indie",
        artist: "Various Artists",
        cover:  "./assets/card4img.jpeg",
        src:    "./songs/song4.mp3",
    },
    // ── slot 5 ──────────────────────────────────────────────────────
    {
        title:  "New Music - Hindi",
        artist: "Various Artists",
        cover:  "./assets/card7img.jpeg",
        src:    "./songs/song5.mp3",
    },
    // ── slot 6 ──────────────────────────────────────────────────────
    {
        title:  "Sunny Leone Hits",
        artist: "Various Artists",
        cover:  "./assets/card8.img.jpg",
        src:    "./songs/song6.mp3",
    },
    // ── slot 7 ──────────────────────────────────────────────────────
    {
        title:  "Top Songs - Global",
        artist: "Various Artists",
        cover:  "./assets/card5img.jpeg",
        src:    "./songs/song7.mp3",
    },
    // ── slot 8 ──────────────────────────────────────────────────────
    {
        title:  "Top Songs - India",
        artist: "Various Artists",
        cover:  "./assets/card6img.jpeg",
        src:    "./songs/song8.mp3",
    },
    // ── slot 9 ──────────────────────────────────────────────────────
    {
        title:  "Top 50 - Global",
        artist: "Various Artists",
        cover:  "./assets/card1img.jpeg",
        src:    "./songs/song9.mp3",
    },
];

// ── State ──────────────────────────────────────────────────────────
let currentIndex = 0;
let isPlaying    = false;
let isShuffle    = false;
let isRepeat     = false;
let savedVolume  = 70;          // remembers volume before mute

const audio = new Audio();

// ── DOM References ─────────────────────────────────────────────────

// Bottom-left: album art + song info
const albumImg    = document.querySelector(".album img");
const albumTitle  = document.querySelector(".album .card-title");
const albumArtist = document.querySelector(".album .card-info");

// Centre: transport buttons (images in order: shuffle, prev, play, next, repeat)
const playerIcons   = document.querySelectorAll(".player-control-icon");
const shuffleIcon   = playerIcons[0];   // player_icon1
const prevIcon      = playerIcons[1];   // player_icon2
const playPauseIcon = playerIcons[2];   // player_icon3
const nextIcon      = playerIcons[3];   // player_icon4
const repeatIcon    = playerIcons[4];   // player_icon5

// Centre: progress / time
const progressBar = document.querySelector(".playback-bar .progress-bar");
const currTimeEl  = document.querySelector(".curr-time");
const totTimeEl   = document.querySelector(".tot-time");

// Right-side controls
const circlePlayBtn = document.querySelector(".fa-circle-play");
const volumeIconEl  = document.querySelector(".fa-volume-high");
const volumeSlider  = document.querySelector(".control-sound");

// ── Helper: format seconds → "m.ss" (matches the existing 0.00 / 3.33 style) ──
function formatTime(secs) {
    if (isNaN(secs) || secs < 0) return "0.00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}.${s < 10 ? "0" + s : s}`;
}

// ── Helper: update the green-fill gradient on a range slider ──────
//    We inject a <style> tag so we can target the ::-webkit-slider-runnable-track
//    pseudo-element dynamically (inline style can't reach pseudo-elements).
function setSliderFill(type, pct) {
    const styleId  = type === "progress" ? "pb-fill-style" : "vol-fill-style";
    const selector = type === "progress"
        ? ".playback-bar .progress-bar"
        : ".control-sound";

    let tag = document.getElementById(styleId);
    if (!tag) {
        tag = document.createElement("style");
        tag.id = styleId;
        document.head.appendChild(tag);
    }
    tag.textContent = `
        ${selector}::-webkit-slider-runnable-track {
            background: linear-gradient(
                to right,
                #1bd760 0%, #1bd760 ${pct}%,
                #ddd    ${pct}%, #ddd 100%
            ) !important;
        }
    `;
}

// ── Core: load a song into the player UI ─────────────────────────
function loadSong(index) {
    const song          = songs[index];
    albumImg.src        = song.cover;
    albumTitle.textContent  = song.title;
    albumArtist.textContent = song.artist;
    audio.src           = song.src;

    // Highlight the matching card with a green border
    document.querySelectorAll(".card").forEach((card, i) => {
        card.style.outline      = (i === index) ? "2px solid #1bd760" : "none";
        card.style.outlineOffset = "2px";
    });
}

// ── Core: play ───────────────────────────────────────────────────
function playSong() {
    isPlaying = true;
    audio.play().catch(() => {
        // Browser may block autoplay until user gesture — that's fine
    });
    // Visual feedback
    playPauseIcon.style.filter = "brightness(2) drop-shadow(0 0 4px #1bd760)";
    circlePlayBtn.classList.replace("fa-circle-play", "fa-circle-pause");
}

// ── Core: pause ──────────────────────────────────────────────────
function pauseSong() {
    isPlaying = false;
    audio.pause();
    playPauseIcon.style.filter = "brightness(1)";
    circlePlayBtn.classList.replace("fa-circle-pause", "fa-circle-play");
}

function togglePlay() {
    isPlaying ? pauseSong() : playSong();
}

// ── Core: next track ────────────────────────────────────────────
function playNext() {
    if (isShuffle) {
        // Pick a random index that is different from the current one
        let rand;
        do { rand = Math.floor(Math.random() * songs.length); }
        while (rand === currentIndex && songs.length > 1);
        currentIndex = rand;
    } else {
        currentIndex = (currentIndex + 1) % songs.length;
    }
    loadSong(currentIndex);
    playSong();
}

// ── Core: previous track ────────────────────────────────────────
function playPrev() {
    if (audio.currentTime > 3) {
        // If more than 3 s in → restart current song
        audio.currentTime = 0;
    } else {
        currentIndex = (currentIndex - 1 + songs.length) % songs.length;
        loadSong(currentIndex);
        playSong();
    }
}

// ── Audio events ────────────────────────────────────────────────

// Update progress bar and time as song plays
audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct              = (audio.currentTime / audio.duration) * 100;
    progressBar.value      = pct;
    currTimeEl.textContent = formatTime(audio.currentTime);
    setSliderFill("progress", pct);
});

// Show total duration once metadata loads
audio.addEventListener("loadedmetadata", () => {
    totTimeEl.textContent = formatTime(audio.duration);
});

// Auto-advance when song ends
audio.addEventListener("ended", () => {
    if (isRepeat) {
        audio.currentTime = 0;
        playSong();
    } else {
        playNext();
    }
});

// ── UI Event Listeners ──────────────────────────────────────────

// Play / Pause — centre image button
playPauseIcon.addEventListener("click", togglePlay);

// Play / Pause — right FA icon
circlePlayBtn.addEventListener("click", togglePlay);

// Prev / Next
prevIcon.addEventListener("click", playPrev);
nextIcon.addEventListener("click", playNext);

// Shuffle toggle
shuffleIcon.addEventListener("click", () => {
    isShuffle = !isShuffle;
    shuffleIcon.style.opacity = isShuffle ? "1" : "0.7";
    shuffleIcon.title         = isShuffle ? "Shuffle: ON" : "Shuffle: OFF";
});

// Repeat toggle
repeatIcon.addEventListener("click", () => {
    isRepeat = !isRepeat;
    repeatIcon.style.opacity = isRepeat ? "1" : "0.7";
    repeatIcon.title         = isRepeat ? "Repeat: ON" : "Repeat: OFF";
});

// Seek bar — drag to scrub
progressBar.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (progressBar.value / 100) * audio.duration;
    setSliderFill("progress", progressBar.value);
});

// Volume slider
volumeSlider.addEventListener("input", () => {
    const v    = Number(volumeSlider.value);
    audio.volume = v / 100;
    setSliderFill("volume", v);

    if (v === 0)     volumeIconEl.className = "fa-solid fa-volume-xmark";
    else if (v < 50) volumeIconEl.className = "fa-solid fa-volume-low";
    else             volumeIconEl.className = "fa-solid fa-volume-high";
});

// Volume icon — click to mute / unmute
volumeIconEl.addEventListener("click", () => {
    if (audio.volume > 0) {
        savedVolume      = audio.volume * 100;
        audio.volume     = 0;
        volumeSlider.value = 0;
        setSliderFill("volume", 0);
        volumeIconEl.className = "fa-solid fa-volume-xmark";
    } else {
        audio.volume     = savedVolume / 100;
        volumeSlider.value = savedVolume;
        setSliderFill("volume", savedVolume);
        volumeIconEl.className = "fa-solid fa-volume-high";
    }
});

// Cards — click any card to play its song
document.querySelectorAll(".card").forEach((card, i) => {
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
        if (i < songs.length) {
            currentIndex = i;
            loadSong(currentIndex);
            playSong();
        }
    });
});

// ── Initialise ──────────────────────────────────────────────────
audio.volume       = 0.7;
volumeSlider.value = 70;
setSliderFill("volume",   70);
setSliderFill("progress",  0);
loadSong(currentIndex);