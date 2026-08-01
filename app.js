/* =========================================================================
   GUARDIAN X — Fully Automatic Cinematic Animation Engine (Apple Keynote Style)
   Pure JavaScript. 60 FPS, requestAnimationFrame, State Machine, Cached DOM.
   ========================================================================= */

(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     1. STATE MACHINE & CONFIGURATION
     ------------------------------------------------------------------------- */
  const STATE = {
    scene: 1,
    timeInScene: 0,
    elapsedTotal: 0,
    isPaused: false
  };

  const CONFIG = {
    sceneDurations: [5000, 4000, 5000, 8000, 8000, 5000, 3000], // Scene 1 to 7 in ms
    totalLoopTime: 38000 // Sum of all scenes
  };

  /* -------------------------------------------------------------------------
     2. DOM CACHE
     ------------------------------------------------------------------------- */
  const DOM = {};

  function cacheDOM() {
    DOM.stage = document.querySelector('.gx-stage');
    DOM.clouds = document.querySelectorAll('.gx-cloud');
    DOM.cityFar = document.querySelector('.gx-city-layer--far');
    DOM.cityNear = document.querySelector('.gx-city-layer--near');
    DOM.roadMarkings = document.querySelector('.gx-road-markings');
    DOM.propsLayer = document.querySelector('.gx-props-layer');
    DOM.carsLayer = document.querySelector('.gx-cars-layer');
    DOM.walker = document.querySelector('.gx-walker');
    DOM.walkerWrap = document.querySelector('.gx-walker-wrap');
    DOM.notification = document.querySelector('.gx-notification');
    DOM.danger = document.querySelector('.gx-danger');
    DOM.aiCard = document.querySelector('.gx-ai-card');
    DOM.aiLine = document.querySelector('.gx-ai-line');
    DOM.sweep = document.querySelector('.gx-sweep');
    DOM.routeOld = document.querySelector('.gx-route-old');
    DOM.routeNew = document.querySelector('.gx-route-new');
    DOM.destination = document.querySelector('.gx-destination');
    DOM.success = document.querySelector('.gx-success');
    DOM.railItems = document.querySelectorAll('.gx-rail-item');
  }

  /* -------------------------------------------------------------------------
     3. ANIMATION ENGINE (Scene Manager & Updaters)
     ------------------------------------------------------------------------- */
  let lastTimestamp = 0;
  let worldOffset = 0;
  let carOffset = 0;
  let cloudOffsets = [0, 0, 0];

  function initEngine() {
    cacheDOM();
    if (!DOM.stage) return;
    
    // Initialize cloud initial positions
    DOM.clouds.forEach((cloud, i) => {
      cloudOffsets[i] = i * 400;
    });

    window.requestAnimationFrame(tick);
  }

  function tick(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    if (!STATE.isPaused) {
      updateTimeline(delta);
      updateWorldPhysics(delta);
      renderSceneState();
    }

    window.requestAnimationFrame(tick);
  }

  function updateTimeline(delta) {
    STATE.elapsedTotal += delta;
    
    // Check loop completion (Scene 7 finished + 3s wait = totalLoopTime)
    if (STATE.elapsedTotal >= CONFIG.totalLoopTime) {
      STATE.elapsedTotal = 0;
      worldOffset = 0;
    }

    // Determine current scene based on cumulative durations
    let cumulative = 0;
    let currentSceneIndex = 1;
    for (let i = 0; i < CONFIG.sceneDurations.length; i++) {
      cumulative += CONFIG.sceneDurations[i];
      if (STATE.elapsedTotal <= cumulative) {
        currentSceneIndex = i + 1;
        STATE.timeInScene = delta + (STATE.timeInScene || 0); // Accumulate within scene or calculate precisely
        break;
      }
    }

    // Precise time in current scene calculation
    let prevCumulative = 0;
    for (let i = 0; i < currentSceneIndex - 1; i++) {
      prevCumulative += CONFIG.sceneDurations[i];
    }
    STATE.timeInScene = STATE.elapsedTotal - prevCumulative;
    STATE.scene = currentSceneIndex;
  }

  /* -------------------------------------------------------------------------
     4. WORLD PHYSICS & PARALLAX (Running at 60 FPS via Transforms)
     ------------------------------------------------------------------------- */
  function updateWorldPhysics(delta) {
    // Determine walking / movement speed factor based on scene
    let moveSpeed = 0.15; // pixels per ms
    if (STATE.scene === 3) moveSpeed = 0.02; // Slowing down near danger
    if (STATE.scene === 4) moveSpeed = 0; // Stopped at danger
    if (STATE.scene === 5 || STATE.scene === 6) moveSpeed = 0.18; // Resuming walk along safe route

    worldOffset += moveSpeed * delta;
    carOffset += (moveSpeed * 1.8) * delta;

    // Apply transforms using CSS transforms (Never left/top)
    if (DOM.cityFar) DOM.cityFar.style.transform = `translateX(${-worldOffset * 0.15}px)`;
    if (DOM.cityNear) DOM.cityNear.style.transform = `translateX(${-worldOffset * 0.35}px)`;
    if (DOM.roadMarkings) DOM.roadMarkings.style.transform = `translateX(${-worldOffset * 1.2}px)`;
    if (DOM.propsLayer) DOM.propsLayer.style.transform = `translateX(${-worldOffset}px)`;
    if (DOM.carsLayer) DOM.carsLayer.style.transform = `translateX(${-carOffset * 1.2}px)`;

    // Clouds drift independently
    DOM.clouds.forEach((cloud, i) => {
      cloudOffsets[i] += (0.04 + i * 0.02) * delta;
      if (cloudOffsets[i] > window.innerWidth + 300) cloudOffsets[i] = -300;
      cloud.style.transform = `translateX(${cloudOffsets[i]}px)`;
    });
  }

  /* -------------------------------------------------------------------------
     5. SCENE STATE MACHINE & CINEMATIC CHOREOGRAPHY
     ------------------------------------------------------------------------- */
  let activeSceneState = 0;

  function renderSceneState() {
    const scene = STATE.scene;

    // Update Rail UI indicators
    if (DOM.railItems.length > 0) {
      DOM.railItems.forEach((item, idx) => {
        if (idx + 1 === scene) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    // Trigger one-time actions per scene entry
    if (activeSceneState !== scene) {
      activeSceneState = scene;
      onSceneEnter(scene);
    }
  }

  function onSceneEnter(scene) {
    // Reset or trigger specific scene behaviors
    switch (scene) {
      case 1:
        // Morning intro, walking naturally, phone floating
        if (DOM.walker) {
          DOM.walker.classList.add('is-walking');
          DOM.walker.classList.remove('is-alert', 'is-vibrating');
        }
        if (DOM.notification) DOM.notification.classList.remove('is-visible');
        if (DOM.danger) DOM.danger.classList.remove('is-visible');
        if (DOM.aiCard) {
          DOM.aiCard.classList.remove('is-visible', 'stats-visible');
        }
        if (DOM.sweep) DOM.sweep.classList.remove('is-active');
        if (DOM.routeOld) DOM.routeOld.classList.remove('is-faded');
        if (DOM.routeNew) DOM.routeNew.classList.remove('is-drawn');
        if (DOM.destination) DOM.destination.classList.remove('is-visible');
        if (DOM.success) DOM.success.classList.remove('is-visible');
        break;

      case 2:
        // Phone vibrates, Guardian X notification slides in
        if (DOM.walker) {
          DOM.walker.classList.add('is-vibrating', 'is-alert');
          DOM.walker.classList.remove('is-walking');
        }
        if (DOM.notification) {
          DOM.notification.classList.add('is-visible');
        }
        break;

      case 3:
        // Danger appears, danger pulse, particles, user stops and looks ahead
        if (DOM.notification) DOM.notification.classList.remove('is-visible');
        if (DOM.danger) DOM.danger.classList.add('is-visible');
        if (DOM.walker) {
          DOM.walker.classList.remove('is-walking', 'is-vibrating');
        }
        break;

      case 4:
        // Guardian AI appears, glass card, typing animation, risk analysis
        if (DOM.aiCard) {
          DOM.aiCard.classList.add('is-visible');
          runTypingEffect();
        }
        if (DOM.sweep) {
          DOM.sweep.classList.add('is-active');
        }
        break;

      case 5:
        // Blue safe route draws itself, cars and environment continue, user resumes walk
        if (DOM.aiCard) DOM.aiCard.classList.remove('is-visible');
        if (DOM.sweep) DOM.sweep.classList.remove('is-active');
        if (DOM.routeOld) DOM.routeOld.classList.add('is-faded');
        if (DOM.routeNew) DOM.routeNew.classList.add('is-drawn');
        if (DOM.walker) {
          DOM.walker.classList.add('is-walking');
          DOM.walker.classList.remove('is-alert');
        }
        break;

      case 6:
        // Destination reached, Guardian X Success animation, particles, glow
        if (DOM.destination) DOM.destination.classList.add('is-visible');
        if (DOM.walker) {
          DOM.walker.classList.remove('is-walking');
        }
        if (DOM.success) {
          DOM.success.classList.add('is-visible');
        }
        break;

      case 7:
        // Fade out / Wait before loop restart
        if (DOM.success) DOM.success.classList.remove('is-visible');
        if (DOM.destination) DOM.destination.classList.remove('is-visible');
        if (DOM.routeNew) DOM.routeNew.classList.remove('is-drawn');
        if (DOM.routeOld) DOM.routeOld.classList.remove('is-faded');
        break;
    }
  }

  /* -------------------------------------------------------------------------
     6. ADVANCED TYPING EFFECT & AI CARD REVEAL
     ------------------------------------------------------------------------- */
  let typingTimeout = null;

  function runTypingEffect() {
    if (!DOM.aiLine) return;
    const fullText = "Analyzing ... Threat detected ahead. Rerouting instantly.";
    DOM.aiLine.innerHTML = '<span class="text"></span><span class="caret"></span>';
    const textSpan = DOM.aiLine.querySelector('.text');
    
    let charIndex = 0;
    function typeChar() {
      if (charIndex < fullText.length) {
        textSpan.textContent += fullText.charAt(charIndex);
        charIndex++;
        typingTimeout = setTimeout(typeChar, 35);
      } else {
        // Reveal stats grid and foot after typing completes
        if (DOM.aiCard) {
          DOM.aiCard.classList.add('stats-visible');
        }
      }
    }
    typeChar();
  }

  /* -------------------------------------------------------------------------
     7. INITIALIZATION ON DOM LOAD
     ------------------------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }

})();
