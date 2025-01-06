// Audio handling
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioSources = {
    click: './audios/click.mp3',
};

const audioBuffers = {};

// Load audio files
Promise.all(Object.entries(audioSources).map(([key, source]) => 
    fetch(source)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            audioBuffers[key] = audioBuffer;
        })
)).then(() => {
    assetsLoaded = true;
    document.body.classList.add('loaded');
}).catch(error => console.error('Error loading assets:', error));

// Play audio function
function playSound(soundName) {
    if (audioBuffers[soundName]) {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers[soundName];
        source.connect(audioContext.destination);
        source.start();
    }
}

// DOM elements
const pos = document.documentElement;
const title = document.getElementById("title");
const lightElement = document.getElementById("light");
const socialIconsDev = document.getElementById("social_icons");
const hiddenElements = document.querySelectorAll(".hidden-element");
const cursorTorch = document.createElement("div");
cursorTorch.classList.add("cursor-torch");
document.body.appendChild(cursorTorch);

// Constants
const LIGHT_REVEAL_RADIUS = 120;
const MAX_PARTICLES = 500;
const ABOUT_ME_TEXT = `I'm Zuhaz, a student who began in medicine but found my passion in computer science. Coding excites me because it's both fun and challenging, and I enjoy exploring different areas like app development, web development, etc. I like learning a variety of things while becoming skilled in a few. Outside of programming, I love drawing, reading, history, and anime, always seeking to expand my knowledge.`;

// State variables
let velocity = { x: 0, y: 0 };
let position = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let lastMousePosition = { x: position.x, y: position.y };
let particles = [];
let isTyping = false;
let isFloating = false;
let assetsLoaded = false;

// Animation parameters
const ACCELERATION = 0.5;
const FRICTION = 0.25;

// Particle system
function createParticle(x, y) {
    return {
        x, y,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 1 - 0.5,
        life: 40
    };
}

function updateParticles() {
    // Use a single loop for filtering and updating
    const newParticles = [];
    particles.forEach(p => {
        if (p.life > 0) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.life--;

            // Optimize distance calculation by avoiding square root when possible
            let dx = position.x - p.x;
            let dy = position.y - p.y;
            let distanceSquared = dx * dx + dy * dy;
            if (distanceSquared < 10000) { // 100 * 100
                p.speedX += dx * 0.001;
                p.speedY += dy * 0.001;
            }
            newParticles.push(p);
        }
    });
    particles = newParticles;
}

function drawParticles() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life / 30})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.3, 0, Math.PI * 1.5);
        ctx.fill();
    });
}

// Cursor and light effect
function updateCursor() {
    let dx = lastMousePosition.x - position.x;
    let dy = lastMousePosition.y - position.y;

    velocity.x += dx * ACCELERATION;
    velocity.y += dy * ACCELERATION;

    velocity.x *= FRICTION;
    velocity.y *= FRICTION;

    position.x += velocity.x;
    position.y += velocity.y;

    cursorTorch.style.left = `${position.x}px`;
    cursorTorch.style.top = `${position.y}px`;

    pos.style.setProperty("--x", `${position.x}px`);
    pos.style.setProperty("--y", `${position.y}px`);

    torchEffect(position.x, position.y);
}

function torchEffect(x, y) {
    if (lightElement.dataset.toggled === "true") {
        return; // Don't apply torch effect when light is on
    }

    const LIGHT_REVEAL_RADIUS = 120;
    hiddenElements.forEach((element) => {
        let rect = element.getBoundingClientRect();
        let isInRange =
            x > rect.left - LIGHT_REVEAL_RADIUS &&
            x < rect.right + LIGHT_REVEAL_RADIUS &&
            y > rect.top - LIGHT_REVEAL_RADIUS &&
            y < rect.bottom + LIGHT_REVEAL_RADIUS;
        element.classList.toggle("visible-element", isInRange);
    });
}

// Toggle torch function
function toggleTorch() {
    let tooltip = document.getElementById("tooltip");
    let mainContainer = document.querySelector(".main_container");
    let titleUnderline = document.querySelector(".title-underline");
    let aboutMeBox = document.querySelector(".about-me-box");
    let aboutMeText = document.getElementById("about-me-text");
    
    const isLightOn = lightElement.dataset.toggled === "true";
    
    playSound('click');
    hiddenElements.forEach(e => e.classList.toggle("light-on", !isLightOn));
    mainContainer.classList.toggle("light-on", !isLightOn);
    lightElement.dataset.toggled = isLightOn ? "false" : "true";
    lightElement.style.visibility = isLightOn ? "visible" : "hidden";
    tooltip.textContent = isLightOn ? "Lights turned off" : "Lights turned on";
    
    if (!isLightOn) {
        setTimeout(() => {
            titleUnderline.style.clipPath = 'inset(0 0 0 0)';
            titleUnderline.style.opacity = "1";
        }, 100);
        
        setTimeout(() => {
            aboutMeBox.style.opacity = "1";
            aboutMeBox.style.transform = "translateX(-50%) translateY(0)";
            
            aboutMeBox.classList.add("visible");
            
            aboutMeText.innerHTML = ABOUT_ME_TEXT.replace(/\n/g, '<br>');
            
            wrapWordsInSpans(aboutMeText);
            
            const words = document.querySelectorAll('.word');
            words.forEach(word => {
                word.style.opacity = 1;
                word.style.color = '#fff';
                word.style.transition = 'transform 0.5s ease-out';
            });

            addVacuumEffect(aboutMeBox);
        }, 500);
    } else {
        // Hide underline when light turns off
        titleUnderline.style.clipPath = 'inset(0 50% 0 50%)';
        titleUnderline.style.opacity = "0";
        
        aboutMeBox.style.opacity = "0";
        aboutMeBox.style.transform = "translateX(-50%) translateY(20px)";
        
        // Make words invisible but keep them dispersed
        const words = document.querySelectorAll('.word');
        words.forEach(word => {
            word.style.opacity = 0;
            word.style.color = '#000';
        });
    }
    tooltip.classList.add("visible");
}
// Add these new functions
function addScatterEffect(element) {
  const text = element.querySelector('p');
  const words = ABOUT_ME_TEXT.match(/\S+|\s+/g);
  text.innerHTML = words.map(word => `<span class="word">${word}</span>`).join('');
  const wordSpans = text.querySelectorAll('.word');
  
  let hasScattered = false;

  element.addEventListener('mouseenter', () => {
    if (!hasScattered) scatterWords();
  });
  element.addEventListener('mouseleave', resetWords);
  
  function scatterWords() {
    hasScattered = true;
    wordSpans.forEach((span, index) => {
      if (span.textContent.trim() !== '') {
        const angle = (index / wordSpans.length) * Math.PI * 2;
        const distance = 150 + Math.random() * 200;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        span.style.setProperty('--x', `${x}px`);
        span.style.setProperty('--y', `${y}px`);
        span.style.setProperty('--delay', `${index * 0.02}s`);
        span.classList.add('scattered');
      }
    });
  }
  
  function resetWords() {
    wordSpans.forEach(span => {
      span.style.setProperty('--delay', '0s');
      span.classList.remove('scattered');
      span.classList.add('returning');
    });
  }
}

// Add this function to create spans for each character
function wrapWordsInSpans(element) {
    const lines = element.textContent.split('\n');
    element.innerHTML = lines.map(line => 
        line.split(' ').map((word, index) => 
            `<span class="word" data-index="${index}">${word}</span>`
        ).join(' ')
    ).join('<br>');
}

// Event listeners
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

pos.addEventListener("mousemove", debounce((e) => {
    lastMousePosition.x = e.clientX;
    lastMousePosition.y = e.clientY;
}, 16)); // Approximately 60fps

document.addEventListener("click", (e) => {
  if (!e.target.closest('.social-link') && !e.target.closest('.word')) {
    toggleTorch();
  }
});

function addParticlesOnMouseMove(e) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    for (let i = 0; i < 5; i++) {
        if (particles.length < MAX_PARTICLES) {
            particles.push(createParticle(mouseX, mouseY));
        }
    }
}

document.addEventListener('mousemove', addParticlesOnMouseMove);

window.addEventListener('load', () => {
    toggleTorch();
    updateCursor();
    animationLoop();
});

window.addEventListener('resize', () => {
    const canvas = document.getElementById('particleCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('click', (e) => e.stopPropagation());
});

// Main animation loop
function animationLoop() {
    updateCursor();
    updateParticles();
    drawParticles();
    requestAnimationFrame(animationLoop);
}


function stopFloating() {
    isFloating = false;
}

function startFloating(word, index, totalWords) {
    let time = index * 0.001;
    const baseX = (Math.random() - 0.5) * window.innerWidth * 0.6;
    const baseY = (Math.random() - 0.5) * window.innerHeight * 0.4;
    const speedX = Math.random() * 2 - 1;
    const speedY = Math.random() * 0.5 - 1;
    const phaseOffset = Math.random() * Math.PI * 2;

    function animate() {
        if (!isFloating) return;
        time += 0.02;
        
        // Create chaotic movement
        const x = baseX + Math.sin(time * speedX + phaseOffset) * 60;
        const y = baseY + Math.cos(time * speedY + phaseOffset) * 80;

        word.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(animate);
    }

    animate();
}

function toggleWordDispersion(element, shouldDisperse) {
    const words = element.querySelectorAll('.word');
    const totalWords = words.length;
    isFloating = shouldDisperse;

    words.forEach((word, index) => {
        if (shouldDisperse) {
            word.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
            startFloating(word, index, totalWords);
        } else {
            word.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            word.style.transform = 'translate(0, 0) rotate(0deg)';
        }
    });
}

function addVacuumEffect(element) {
    element.addEventListener('mouseenter', () => toggleWordDispersion(element, true));
    element.addEventListener('mouseleave', () => toggleWordDispersion(element, false));
}

// Call this after creating the about-me-box
addVacuumEffect(document.querySelector('.about-me-box'));

