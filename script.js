(() => {
  "use strict";

  /* =========================================
     RUHITA'S LITTLE UNIVERSE ❤️
     PHOTO GALLERY + HEARTS + MUSIC
  ========================================= */

  const CONFIG = {
    letter: `Happy Birthday, Ruhita! ♡

One year of knowing you has given me so many funny, crazy, and beautiful little memories. Thank you for the random talks, the nonsense, the laughter, and the moments that made ordinary days special.

I hope this new chapter brings you happiness, peace, exciting surprises, and everything your heart wishes for. Stay caring, stay wonderfully crazy, and never stop being yourself.

You deserve a beautiful life filled with love, laughter, and magic. Today is all about you. ✨`,

    photos: [
      ["IMG-20260914-WA0003.jpg", "A little moment worth keeping.", "A LITTLE MOMENT"],
      ["IMG-20260914-WA0002.jpg", "Ordinary days, extraordinary memories.", "EVERYDAY MAGIC"],
      ["IMG-20260919-WA0001.jpg", "Too much talking. Too much laughing.", "OUR KIND OF CHAOS"],
      ["IMG-20260918-WA0002.jpg", "One for the memory collection.", "KEPT CLOSE"],
      ["IMG-20260914-WA0004.jpg", "Just us being completely ourselves.", "PURE NONSENSE"],
      ["IMG-20260829-WA0017.jpg", "The little things become the big things.", "ONE TO REMEMBER"],
      ["IMG-20260331-WA0006.jpg", "And this is only one chapter.", "MORE TO COME"],
      ["IMG-20260914-WA0006.jpg", "Another memory to keep forever.", "ANOTHER LITTLE MAGIC"],
      ["IMG-20260914-WA0007.jpg", "Because every picture holds a story.", "ONE MORE FOR US"]
    ],

    songs: {
      opening: "music/river-flows-in-you.mp3",
      cake: "music/birthday.mp3",
      memories: "music/perfect-instrumental.mp3"
    }
  };

  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const music = $("music");
  const soundButton = $("soundToggle");
  const heartCanvas = $("heartCanvas");
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let currentTrack = "";
  let desiredTrack = "opening";
  let musicEnabled = true;
  let musicUnlocked = false;
  let switchToken = 0;
  let fadeFrame = 0;
  let cancelFade = null;
  let opened = false;
  let blown = false;
  let typingTimer = null;
  let heartTimer = null;
  let cursorLastTime = 0;
  let cursorLastX = -100;
  let cursorLastY = -100;
  let scrollPending = false;
  let micStream = null;
  let audioContext = null;
  let micFrame = 0;

  /* GENERAL HELPERS */

  function scrollToSection(id) {
    $(id)?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  function setSoundLabel(on) {
    if (!soundButton) return;
    const label = soundButton.querySelector("small");
    if (label) label.textContent = on ? "SOUND ON" : "SOUND OFF";
    soundButton.setAttribute("aria-pressed", String(on));
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  /* MUSIC SYSTEM 🎵 */

  function cancelCurrentFade() {
    if (fadeFrame) {
      cancelAnimationFrame(fadeFrame);
      fadeFrame = 0;
    }

    if (cancelFade) {
      const finish = cancelFade;
      cancelFade = null;
      finish();
    }
  }

  function fadeVolume(target, duration) {
    cancelCurrentFade();
    if (!music) return Promise.resolve();

    const startVolume = music.volume;

    if (reducedMotion || duration <= 0) {
      music.volume = target;
      return Promise.resolve();
    }

    const started = performance.now();

    return new Promise(resolve => {
      let finished = false;

      function finish() {
        if (finished) return;
        finished = true;
        if (cancelFade === finish) cancelFade = null;
        resolve();
      }

      cancelFade = finish;

      function step(now) {
        if (finished) return;

        const progress = Math.min(1, (now - started) / duration);
        const eased = progress * progress * (3 - 2 * progress);

        music.volume = Math.max(
          0,
          Math.min(1, startVolume + (target - startVolume) * eased)
        );

        if (progress < 1) {
          fadeFrame = requestAnimationFrame(step);
        } else {
          fadeFrame = 0;
          music.volume = target;
          finish();
        }
      }

      fadeFrame = requestAnimationFrame(step);
    });
  }

  async function playTrack() {
    if (!music || !musicEnabled) return;

    const track = desiredTrack;
    const filename = CONFIG.songs[track];
    if (!filename) return;

    const token = ++switchToken;

    if (
      currentTrack === track &&
      !music.paused &&
      music.getAttribute("src") === filename
    ) return;

    if (!music.paused && currentTrack) {
      await fadeVolume(0, 650);
    }

    if (token !== switchToken || !musicEnabled) return;

    music.pause();
    music.src = filename;
    music.loop = true;
    music.volume = 0;
    currentTrack = track;
    music.load();

    try {
      await music.play();

      if (token !== switchToken || !musicEnabled) {
        music.pause();
        return;
      }

      musicUnlocked = true;
      setSoundLabel(true);
      await fadeVolume(0.72, 1100);
    } catch (error) {
      console.info("Music needs a visitor interaction:", error);
      setSoundLabel(false);
    }
  }

  function enableMusic() {
    if (!music) return;
    musicEnabled = true;
    musicUnlocked = true;
    setSoundLabel(true);
    playTrack();
  }

  async function disableMusic() {
    if (!music) return;

    musicEnabled = false;
    ++switchToken;
    setSoundLabel(false);
    await fadeVolume(0, 300);

    if (!musicEnabled) {
      music.pause();
      music.volume = 0.72;
    }
  }

  function toggleMusic() {
    if (musicEnabled) disableMusic();
    else enableMusic();
  }

  function chooseTrack(track) {
    if (!CONFIG.songs[track] || desiredTrack === track) return;

    desiredTrack = track;
    if (musicEnabled && musicUnlocked) playTrack();
  }

  function getTrackForScroll() {
    const cake = $("cake");
    const memories = $("memories");

    if (!cake || !memories) return "opening";

    const marker = window.innerHeight * 0.45;

    if (memories.getBoundingClientRect().top <= marker) return "memories";
    if (cake.getBoundingClientRect().top <= marker) return "cake";

    return "opening";
  }

  function setupMusic() {
    if (!music) return;

    music.loop = true;
    music.preload = "auto";
    music.volume = 0.72;
    desiredTrack = "opening";
    setSoundLabel(false);

    music.src = CONFIG.songs.opening;
    music.load();

    const attempt = music.play();

    if (attempt && typeof attempt.then === "function") {
      attempt.then(() => {
        currentTrack = "opening";
        musicUnlocked = true;
        setSoundLabel(true);
      }).catch(() => {
        music.pause();
        setSoundLabel(false);
      });
    }
  }

  /* FORMING HEART ❤️ */

  function setupHeartFormation() {
    const canvas = heartCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles = [];
    let sparkles = [];
    const startedAt = performance.now();

    function heartPoint(t, scale) {
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);

      return {
        x: width / 2 + x * scale,
        y: height / 2 - y * scale
      };
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width || 300;
      height = rect.height || 300;

      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const scale = Math.min(width / 36, height / 34) * 0.88;
      const count = reducedMotion ? 150 : 440;

      particles = Array.from({ length: count }, (_, index) => {
        const t = (index / count) * Math.PI * 2;
        const target = heartPoint(t, scale);

        return {
          targetX: target.x,
          targetY: target.y,
          startX: Math.random() * width,
          startY: Math.random() * height,
          size: 0.55 + Math.random() * 1.35,
          phase: Math.random() * Math.PI * 2,
          delay: Math.random() * 0.65,
          hue: Math.random()
        };
      });

      sparkles = Array.from(
        { length: reducedMotion ? 8 : 42 },
        () => ({
          angle: Math.random() * Math.PI * 2,
          radius: 0.40 + Math.random() * 0.48,
          size: 0.5 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2
        })
      );
    }

    function draw(now) {
      ctx.clearRect(0, 0, width, height);

      const elapsed = (now - startedAt) / 1000;
      const formation = reducedMotion
        ? 1
        : Math.min(1, Math.max(0, (elapsed - 0.25) / 2.6));

      const eased = formation * formation * (3 - 2 * formation);
      const pulse = 1 + Math.sin(now * 0.0017) * 0.018;

      particles.forEach(particle => {
        const localProgress = Math.max(
          0,
          Math.min(1, (formation - particle.delay * 0.35) / 0.65)
        );

        const localEased =
          localProgress * localProgress * (3 - 2 * localProgress);

        const x = particle.startX +
          (particle.targetX - particle.startX) * localEased;

        const y = particle.startY +
          (particle.targetY - particle.startY) * localEased;

        const shimmer = 0.48 +
          (Math.sin(now * 0.002 + particle.phase) + 1) * 0.25;

        const drift = (1 - eased) *
          Math.sin(now * 0.0008 + particle.phase) * 5;

        const drawX = width / 2 + (x - width / 2) * pulse + drift;
        const drawY = height / 2 + (y - height / 2) * pulse;

        const hue = particle.hue > 0.84
          ? "255, 224, 166"
          : particle.hue > 0.5
            ? "243, 185, 224"
            : "218, 188, 255";

        ctx.beginPath();
        ctx.arc(drawX, drawY, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hue}, ${shimmer})`;
        ctx.shadowBlur = particle.size * 5;
        ctx.shadowColor = `rgba(${hue}, 0.7)`;
        ctx.fill();
      });

      ctx.shadowBlur = 0;

      sparkles.forEach(sparkle => {
        const angle = sparkle.angle +
          (reducedMotion ? 0 : now * 0.00012);

        const radius = Math.min(width, height) * sparkle.radius * 0.45;
        const x = width / 2 + Math.cos(angle) * radius;
        const y = height / 2 + Math.sin(angle) * radius;

        const alpha = 0.25 +
          (Math.sin(now * 0.002 + sparkle.phase) + 1) * 0.32;

        ctx.beginPath();
        ctx.arc(x, y, sparkle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 231, 250, ${alpha})`;
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    resize();
    requestAnimationFrame(draw);
    window.addEventListener("resize", resize, { passive: true });
  }

  /* BACKGROUND STARS ✨ */

  function setupStars() {
    const canvas = $("stars");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let stars = [];

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.min(
        180,
        Math.max(65, Math.floor(width * height / 8500))
      );

      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.25 + 0.3,
        phase: Math.random() * 6.28,
        speed: Math.random() * 0.0016 + 0.0004
      }));
    }

    function draw(now) {
      ctx.clearRect(0, 0, width, height);

      stars.forEach(star => {
        const alpha = 0.2 +
          (Math.sin(now * star.speed + star.phase) + 1) * 0.32;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 239, 255, ${alpha})`;
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    resize();
    requestAnimationFrame(draw);
    window.addEventListener("resize", resize, { passive: true });
  }

  /* HEART CURSOR TRAIL 💗 */

  function addCursorHeart(x, y, mobile = false) {
    const container = $("hearts");
    if (!container || reducedMotion) return;

    const heart = document.createElement("span");
    heart.className = "cursor-heart";
    heart.textContent = Math.random() > 0.25 ? "♡" : "♥";
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;

    const size = mobile
      ? 13 + Math.random() * 8
      : 10 + Math.random() * 9;

    heart.style.fontSize = `${size}px`;
    heart.style.setProperty("--drift", `${(Math.random() - 0.5) * 34}px`);
    heart.style.setProperty("--rise", `${28 + Math.random() * 35}px`);
    heart.style.setProperty("--turn", `${(Math.random() - 0.5) * 40}deg`);

    container.appendChild(heart);
    setTimeout(() => heart.remove(), 1500);
  }

  function setupCursorHearts() {
    window.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse") return;

      const now = performance.now();
      const distance = Math.hypot(
        event.clientX - cursorLastX,
        event.clientY - cursorLastY
      );

      if (now - cursorLastTime < 65 || distance < 12) return;

      cursorLastTime = now;
      cursorLastX = event.clientX;
      cursorLastY = event.clientY;
      addCursorHeart(event.clientX, event.clientY);
    }, { passive: true });

    window.addEventListener("pointerdown", event => {
      if (event.pointerType !== "touch") return;

      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          addCursorHeart(
            event.clientX + (Math.random() - 0.5) * 28,
            event.clientY + (Math.random() - 0.5) * 24,
            true
          );
        }, i * 75);
      }
    }, { passive: true });
  }

  /* FLOATING HEART BURSTS */

  function createHeartBurst(amount = 12) {
    const container = $("hearts");
    if (!container || reducedMotion) return;

    const symbols = ["♡", "♥", "✧", "✦"];

    for (let i = 0; i < amount; i++) {
      const heart = document.createElement("span");
      heart.className = "float-heart";
      heart.textContent = symbols[
        Math.floor(Math.random() * symbols.length)
      ];
      heart.style.left = `${Math.random() * 100}%`;
      heart.style.setProperty("--dur", `${3.5 + Math.random() * 2.5}s`);
      heart.style.setProperty("--drift", `${(Math.random() - 0.5) * 100}px`);
      heart.style.fontSize = `${12 + Math.random() * 16}px`;
      heart.style.animationDelay = `${Math.random() * 0.5}s`;

      container.appendChild(heart);
      setTimeout(() => heart.remove(), 7500);
    }
  }

  function startFloatingHearts() {
    if (reducedMotion || heartTimer) return;
    heartTimer = setInterval(() => createHeartBurst(1), 1600);
  }

  /* BIRTHDAY LETTER 💌 */

  function typeLetter() {
    const target = $("typedLetter");
    if (!target) return;

    clearTimeout(typingTimer);
    target.textContent = "";

    if (reducedMotion) {
      target.textContent = CONFIG.letter;
      return;
    }

    let index = 0;

    function typeNext() {
      if (index >= CONFIG.letter.length) return;

      target.textContent += CONFIG.letter[index];
      const character = CONFIG.letter[index];
      index++;

      const delay = character === "\n"
        ? 160
        : /[.!?]/.test(character)
          ? 180
          : 23;

      typingTimer = setTimeout(typeNext, delay);
    }

    typeNext();
  }

  function openLetter() {
    if (opened) return;

    opened = true;
    $("envelope")?.classList.add("open");

    const note = $("letterNote");

    if (note) {
      note.classList.add("visible");
      note.setAttribute("aria-hidden", "false");
    }

    typeLetter();
    createHeartBurst(14);
  }

  /* CAKE AND BIRTHDAY WISH 🎂 */

  function blowCandles() {
    if (blown) return;

    blown = true;
    stopMicrophone();

    $$(".candle").forEach((candle, index) => {
      setTimeout(
        () => candle.classList.add("off"),
        reducedMotion ? 0 : index * 160
      );
    });

    const wish = $("wish");
    if (wish) {
      wish.textContent = "Your wish is on its way to the universe. ✨";
    }

    const birthday = $("birthday");

    if (birthday) {
      birthday.setAttribute("aria-hidden", "false");
      setTimeout(
        () => birthday.classList.add("visible"),
        reducedMotion ? 0 : 450
      );
    }

    $("cake")?.classList.add("celebrating");
    createHeartBurst(28);
  }

  /* OPTIONAL MICROPHONE 🎤 */

  async function enableMicrophone() {
    const note = $("micNote");

    if (!navigator.mediaDevices?.getUserMedia) {
      if (note) {
        note.textContent =
          "Microphone unavailable here. The wish button still works! ♡";
      }
      return;
    }

    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("Audio analysis unavailable");
      }

      audioContext = new AudioContextClass();

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(micStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const samples = new Uint8Array(analyser.fftSize);
      let loudFrames = 0;

      if (note) {
        note.textContent =
          "Microphone ready! Blow gently toward your phone. ♡";
      }

      function listen() {
        if (blown || !analyser) return;

        analyser.getByteTimeDomainData(samples);

        let total = 0;

        for (let i = 0; i < samples.length; i++) {
          const value = (samples[i] - 128) / 128;
          total += value * value;
        }

        const volume = Math.sqrt(total / samples.length);

        loudFrames = volume > 0.12
          ? loudFrames + 1
          : Math.max(0, loudFrames - 1);

        if (loudFrames >= 7) {
          blowCandles();
          return;
        }

        micFrame = requestAnimationFrame(listen);
      }

      listen();
    } catch (error) {
      console.info("Microphone unavailable:", error);

      if (note) {
        note.textContent =
          "No problem! Tap MAKE A WISH to blow out the candles. ♡";
      }

      stopMicrophone();
    }
  }

  function stopMicrophone() {
    if (micFrame) {
      cancelAnimationFrame(micFrame);
      micFrame = 0;
    }

    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      micStream = null;
    }

    if (audioContext) {
      audioContext.close().catch(() => { });
      audioContext = null;
    }
  }

  /* PHOTO GALLERY — FIXED ❤️ */

  function buildGallery() {
    const gallery = $("gallery");
    if (!gallery) return;

    const memories = CONFIG.photos;

    if (!Array.isArray(memories) || memories.length === 0) {
      gallery.textContent = "Photos will appear here soon. ♡";
      return;
    }

    gallery.innerHTML = `
      <div class="memory-universe">
        <div class="universe-glow"></div>
        <div class="universe-orbit orbit-one"></div>
        <div class="universe-orbit orbit-two"></div>

        <div class="universe-heading">
          <span class="universe-eyebrow">A LITTLE UNIVERSE OF US</span>
          <h2>Our <em>little</em> forever.</h2>
          <p>Every picture holds a piece of our story.</p>
        </div>

        <div class="memory-stage">
          <div class="memory-stars" aria-hidden="true">✦　·　♡　·　✧　·　✦</div>

          <div class="featured-memory">
            <button class="portal-photo" type="button"
              data-memory-index="0" aria-label="Open memory 1">
              <span class="portal-aura"></span>
              <span class="portal-frame">
                <img
                  src="photos/${escapeHTML(memories[0][0])}"
                  alt="Ruhita memory 1"
                  loading="eager"
                >
              </span>
              <span class="portal-corner portal-corner-tl"></span>
              <span class="portal-corner portal-corner-tr"></span>
              <span class="portal-corner portal-corner-bl"></span>
              <span class="portal-corner portal-corner-br"></span>
            </button>

            <div class="featured-label">
              <span class="featured-number">01</span>
              <span class="featured-caption">
                ${escapeHTML(memories[0][2])}
              </span>
            </div>
            <p class="featured-description">
              ${escapeHTML(memories[0][1])}
            </p>
          </div>

          <div class="floating-memories">
            ${memories.slice(1).map((memory, i) => `
              <button
                class="orbit-memory orbit-memory-${i + 1}"
                type="button"
                data-memory-index="${i + 1}"
                aria-label="Open memory ${i + 2}: ${escapeHTML(memory[2])}"
                style="--float-delay:${i * -0.7}s"
              >
                <span class="orbit-photo">
                  <img
                    src="photos/${escapeHTML(memory[0])}"
                    alt="Ruhita memory ${i + 2}"
                    loading="lazy"
                  >
                </span>
                <span class="orbit-index">
                  ${String(i + 2).padStart(2, "0")}
                </span>
                <span class="orbit-heart">♡</span>
              </button>
            `).join("")}
          </div>

          <div class="universe-instruction">
            <span class="instruction-sparkle">✧</span>
            TAP ANY MEMORY TO ENTER IT
            <span class="instruction-sparkle">✧</span>
          </div>
        </div>

        <div class="memory-counter">
          <span class="counter-line"></span>
          <span>${memories.length} little pieces of forever</span>
          <span class="counter-line"></span>
        </div>

        <div class="memory-portal" aria-hidden="true">
          <button class="portal-close" type="button"
            aria-label="Close memory">×</button>
          <div class="portal-backdrop"></div>
          <div class="portal-content" role="dialog"
            aria-modal="true" aria-label="Memory detail">
            <span class="portal-detail-eyebrow">A MEMORY TO KEEP</span>
            <div class="portal-detail-photo">
              <img src="" alt="">
            </div>
            <span class="portal-detail-number"></span>
            <h3 class="portal-detail-title"></h3>
            <p class="portal-detail-caption"></p>
            <div class="portal-detail-hearts" aria-hidden="true">♡ ✦ ♡</div>
            <div class="portal-navigation">
              <button class="portal-prev" type="button">← Previous</button>
              <button class="portal-next" type="button">Next memory →</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const portal = gallery.querySelector(".memory-portal");
    const detailImage = portal.querySelector(".portal-detail-photo img");
    const detailNumber = portal.querySelector(".portal-detail-number");
    const detailTitle = portal.querySelector(".portal-detail-title");
    const detailCaption = portal.querySelector(".portal-detail-caption");

    let activeIndex = 0;
    let previousFocus = null;

    function openMemory(index) {
      if (!memories.length) return;

      activeIndex = (index + memories.length) % memories.length;
      const memory = memories[activeIndex];

      previousFocus = document.activeElement;

      detailImage.src = `photos/${memory[0]}`;
      detailImage.alt = `Ruhita memory ${activeIndex + 1}`;

      detailNumber.textContent =
        `${String(activeIndex + 1).padStart(2, "0")} / ` +
        `${String(memories.length).padStart(2, "0")}`;

      detailTitle.textContent = memory[2];
      detailCaption.textContent = memory[1];

      portal.classList.add("is-open");
      portal.setAttribute("aria-hidden", "false");
      document.body.classList.add("memory-portal-open");
      portal.querySelector(".portal-close").focus();
    }

    function closeMemory() {
      portal.classList.remove("is-open");
      portal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("memory-portal-open");

      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    }

    gallery.querySelectorAll("[data-memory-index]").forEach(button => {
      button.addEventListener("click", () => {
        openMemory(Number(button.dataset.memoryIndex));
      });
    });

    portal.querySelector(".portal-close")
      .addEventListener("click", closeMemory);

    portal.querySelector(".portal-backdrop")
      .addEventListener("click", closeMemory);

    portal.querySelector(".portal-prev").addEventListener("click", () => {
      openMemory(activeIndex - 1);
    });

    portal.querySelector(".portal-next").addEventListener("click", () => {
      openMemory(activeIndex + 1);
    });

    portal.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMemory();
      if (event.key === "ArrowLeft") openMemory(activeIndex - 1);
      if (event.key === "ArrowRight") openMemory(activeIndex + 1);
    });

    gallery.querySelectorAll(".memory-universe img").forEach(img => {
      img.addEventListener("error", () => {
        img.classList.add("image-missing");
        img.alt = "Photo unavailable — check the filename in the photos folder.";
        console.warn("Photo failed to load:", img.getAttribute("src"));
      }, { once: true });
    });
  }

  /* SCROLL REVEALS */

  function setupReveals() {
    const elements = $$(".memory, .reveal");

    if (!("IntersectionObserver" in window)) {
      elements.forEach(element => element.classList.add("in-view"));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -25px 0px"
    });

    elements.forEach(element => observer.observe(element));
  }

  /* GALAXY STARS ✨ */

  function buildGalaxyStars() {
    const container = $("galaxyStars");
    if (!container) return;

    container.replaceChildren();

    const count = reducedMotion ? 12 : 55;

    for (let i = 0; i < count; i++) {
      const star = document.createElement("span");
      star.className = "gstar";
      star.textContent = Math.random() > 0.5 ? "✦" : "·";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      container.appendChild(star);
    }
  }

  /* SCROLL PROGRESS + MUSIC SELECTION */

  function updateProgress() {
    const bar = $("progressBar");
    if (!bar) return;

    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    bar.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
  }

  function handleScroll() {
    if (scrollPending) return;
    scrollPending = true;

    requestAnimationFrame(() => {
      updateProgress();
      chooseTrack(getTrackForScroll());
      scrollPending = false;
    });
  }

  /* RESTART THE JOURNEY */

  function restartJourney() {
    clearTimeout(typingTimer);
    stopMicrophone();

    opened = false;
    blown = false;

    $("envelope")?.classList.remove("open");

    const note = $("letterNote");
    if (note) {
      note.classList.remove("visible");
      note.setAttribute("aria-hidden", "true");
    }

    if ($("typedLetter")) $("typedLetter").textContent = "";

    $$(".candle").forEach(candle => candle.classList.remove("off"));

    const wish = $("wish");
    if (wish) wish.textContent = "Blow gently into your microphone…";

    const birthday = $("birthday");
    if (birthday) {
      birthday.classList.remove("visible");
      birthday.setAttribute("aria-hidden", "true");
    }

    $("cake")?.classList.remove("celebrating");

    desiredTrack = "opening";
    if (musicEnabled && musicUnlocked) playTrack();

    scrollToSection("intro");
    createHeartBurst(20);
  }

  /* BUTTONS */

  function bindEvents() {
    $("enter")?.addEventListener("click", () => {
      if (!musicUnlocked || music?.paused) enableMusic();

      startFloatingHearts();
      createHeartBurst(15);
      scrollToSection("letter");
    });

    $("envelope")?.addEventListener("click", openLetter);

    $("goCake")?.addEventListener("click", () => {
      scrollToSection("cake");
    });

    $("makeWish")?.addEventListener("click", blowCandles);
    $("enableMic")?.addEventListener("click", enableMicrophone);

    $("goMemories")?.addEventListener("click", () => {
      scrollToSection("memories");
    });

    $("goGalaxy")?.addEventListener("click", () => {
      scrollToSection("galaxy");
    });

    $("goFinal")?.addEventListener("click", () => {
      scrollToSection("final");
      createHeartBurst(24);
    });

    $("restart")?.addEventListener("click", restartJourney);
    soundButton?.addEventListener("click", toggleMusic);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
  }

  /* START EVERYTHING */

  function init() {
    setupStars();
    setupHeartFormation();
    setupCursorHearts();
    setupMusic();

    buildGallery();
    buildGalaxyStars();
    setupReveals();
    bindEvents();
    updateProgress();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();