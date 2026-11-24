// Each object has its own durability. Damage is measured in the same units.
const objects = {
  plate: { name: 'CERAMIC PLATE', durability: 12, number: '01 / 03' },
  bottle: { name: 'GLASS BOTTLE', durability: 8, number: '02 / 03' },
  cup: { name: 'CERAMIC CUP', durability: 16, number: '03 / 03' }
};
let selectedObject = 'plate';
let personalMessage = '';
let impactStrength = 3;
let objectDurability = objects[selectedObject].durability;
let accumulatedDamage = 0;
let numberOfHits = 0;
let objectState = 'intact';
let soundEnabled = false;
const activeSounds = new Set();
let breakTimer;
let cracks = [];
let previousPattern = null;
let lastImpact = { x: 200, y: 200 };

const room = document.querySelector('#room');
const stage = document.querySelector('#stage');
const objectWrap = document.querySelector('#objectWrap');
const objectArt = document.querySelector('#objectArt');
const messageInput = document.querySelector('#message');
const strikeHint = document.querySelector('#strikeHint');
const brokenCopy = document.querySelector('#brokenCopy');

// Each object supplies its silhouette, which also clips generated fractures.
function objectSVG(type) {
  const shapes = {
    plate: `<circle cx="200" cy="200" r="145" fill="url(#ceramic)" stroke="#91a5b0" stroke-width="3"/><circle cx="200" cy="200" r="119" fill="none" stroke="#f8f6e7" stroke-opacity=".58" stroke-width="5"/><circle cx="200" cy="200" r="108" fill="#dbe6e9" fill-opacity=".24" stroke="#a8bdc8" stroke-width="2"/><ellipse cx="151" cy="116" rx="67" ry="20" fill="#fff" opacity=".12" transform="rotate(-32 151 116)"/>`,
    bottle: `<path d="M178 48 Q178 41 184 41 H216 Q222 41 222 48 V99 Q223 113 239 128 Q256 145 256 166 V325 Q256 344 239 348 Q200 356 161 348 Q144 344 144 325 V166 Q144 145 161 128 Q177 113 178 99 Z" fill="url(#glass)" stroke="#9cc6d0" stroke-width="3"/><path d="M178 62 H222 M178 91 H222" fill="none" stroke="#d1e9ed" stroke-width="4" opacity=".55"/><path d="M160 158 Q164 144 174 137 V320" fill="none" stroke="#e4f7fa" stroke-width="8" stroke-linecap="round" opacity=".25"/><path d="M235 164 V319" stroke="#102f40" stroke-width="8" opacity=".2"/>`,
    cup: `<path d="M267 158 Q324 149 323 202 Q322 253 272 252" fill="none" stroke="#8da4b0" stroke-width="21"/><path d="M267 158 Q324 149 323 202 Q322 253 272 252" fill="none" stroke="#e0eaec" stroke-width="13"/><path d="M108 133 H278 L268 284 Q265 321 235 326 H153 Q123 321 120 284 Z" fill="url(#ceramic)" stroke="#91a7b2" stroke-width="3"/><ellipse cx="193" cy="133" rx="85" ry="15" fill="#edf4f4" stroke="#9eb4be" stroke-width="3"/><ellipse cx="193" cy="133" rx="74" ry="8" fill="#748e9b"/><path d="M127 156 L136 274 Q139 302 153 307" fill="none" stroke="#fff" stroke-width="8" opacity=".22"/>`
  };
  const clips = {plate:'<circle cx="200" cy="200" r="145"/>',bottle:'<path d="M178 48 H222 V99 Q223 113 239 128 Q256 145 256 166 V325 Q256 344 239 348 Q200 356 161 348 Q144 344 144 325 V166 Q144 145 161 128 Q177 113 178 99 Z"/>',cup:'<path d="M108 133 H278 L268 284 Q265 321 235 326 H153 Q123 321 120 284 Z"/><path d="M267 147 Q334 138 334 202 Q333 264 270 263 L270 241 Q312 243 312 202 Q313 163 269 169 Z"/>'};
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ceramic" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8faf9"/><stop offset=".23" stop-color="#e4eced"/><stop offset=".58" stop-color="#aebfc7"/><stop offset=".84" stop-color="#899da8"/><stop offset="1" stop-color="#667c8b"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#183948"/><stop offset=".16" stop-color="#568997"/><stop offset=".28" stop-color="#a5c8c9"/><stop offset=".44" stop-color="#4e7e8c"/><stop offset=".72" stop-color="#2a596a"/><stop offset=".9" stop-color="#6a9aa5"/><stop offset="1" stop-color="#183b4a"/></linearGradient><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="3" seed="8"/></filter><clipPath id="surface">${clips[type]}</clipPath></defs>${shapes[type]}<rect x="45" y="35" width="310" height="325" clip-path="url(#surface)" filter="url(#grain)" opacity=".045"/><g class="fractures" clip-path="url(#surface)" fill="none" stroke-linejoin="round" stroke-linecap="round">${cracks.map(crack => `<path d="${crack}"/>`).join('')}</g></svg>`;
}
function renderObject() {
  objectWrap.dataset.object = selectedObject;
  objectWrap.className = 'object-wrap ' + objectState;
  objectArt.innerHTML = objectSVG(selectedObject) + '<div class="object-message"><span></span></div>';
  // textContent treats personal words as text, never as HTML.
  updateMessage();
  document.querySelector('#objectCaption').textContent = objects[selectedObject].name;
  document.querySelector('#stageNumber').textContent = objects[selectedObject].number;
  document.querySelector('#stateLabel').textContent = ({intact:'INTACT',light:'LIGHTLY CRACKED',heavy:'HEAVILY CRACKED',broken:'COMPLETELY BROKEN'})[objectState];
  document.querySelector('#hitCount').textContent = String(numberOfHits).padStart(2, '0');
}
// First try one line down to a readable size. If that would be too small,
// allow normal word wrapping, then shrink until the whole message fits.
function updateMessage() {
  const area = objectArt.querySelector('.object-message');
  if (!area) return;
  const words = area.querySelector('span');
  words.textContent = personalMessage;
  const limits = { plate: 0.095, bottle: 0.072, cup: 0.085 };
  const maxSize = Math.max(8, Math.floor(objectWrap.clientWidth * limits[selectedObject]));
  const oneLineMinimum = Math.min(maxSize, Math.max(12, objectWrap.clientWidth * 0.035));
  let size = maxSize;
  words.style.whiteSpace = 'pre';
  words.style.fontSize = `${size}px`;
  while (size > oneLineMinimum && (words.scrollWidth > area.clientWidth || words.scrollHeight > area.clientHeight)) {
    size = Math.max(oneLineMinimum, size - 1);
    words.style.fontSize = `${size}px`;
  }
  if (words.scrollWidth > area.clientWidth || words.scrollHeight > area.clientHeight) {
    // Wrap only at normal word boundaries. Long unbroken words are made
    // smaller instead of being split into arbitrary pieces.
    words.style.whiteSpace = 'pre-wrap';
    size = maxSize;
    words.style.fontSize = `${size}px`;
    while (size > 1 && (words.scrollWidth > area.clientWidth || words.scrollHeight > area.clientHeight)) {
      size = Math.max(1, size - 0.5);
      words.style.fontSize = `${size}px`;
    }
  }
}
window.addEventListener('resize', updateMessage);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateMessage);
function resetObject() {
  clearTimeout(breakTimer);
  objectWrap.querySelectorAll('.shard, .impact-mark').forEach(element => element.remove());
  accumulatedDamage = 0;
  cracks = [];
  previousPattern = null;
  numberOfHits = 0;
  objectState = 'intact';
  objectDurability = objects[selectedObject].durability;
  brokenCopy.hidden = true;
  objectArt.style.visibility = 'visible';
  objectWrap.setAttribute('aria-disabled', 'false');
  objectWrap.setAttribute('aria-label', `Strike the ${objects[selectedObject].name.toLowerCase()}`);
  strikeHint.textContent = 'Click the object to strike it';
  renderObject();
}
// Five distinct arrangements for each material. Strength changes their size,
// ray count and branching; the previous arrangement is not picked twice in a row.
const fracturePatterns = {
  plate: [
    { angles: [0, 1.25, 2.7, 4.2, 5.3], bend: .30, branches: [0, 3] },
    { angles: [.35, 1.1, 2.1, 3.45, 4.8, 5.7], bend: -.45, branches: [1, 4] },
    { angles: [.1, 1.6, 2.3, 3.05, 4.3], bend: .55, branches: [2, 3] },
    { angles: [.5, 1.9, 3.3, 4.05, 5.4], bend: -.25, branches: [0, 2, 4] },
    { angles: [.2, .95, 2.5, 3.7, 4.65, 5.5], bend: .4, branches: [1, 3, 5] }
  ],
  bottle: [
    { angles: [0, 1.05, 2.1, 3.15, 4.2, 5.25], rings: [0.42, .75], bend: .1 },
    { angles: [.2, .85, 1.8, 2.8, 3.8, 4.7, 5.65], rings: [.55], bend: -.25 },
    { angles: [.4, 1.25, 2.05, 3.1, 4.35, 5.4], rings: [.32, .68], bend: .3 },
    { angles: [.1, .7, 1.65, 2.6, 3.4, 4.5, 5.6], rings: [.48, .85], bend: -.15 },
    { angles: [.3, 1.3, 2.4, 3.3, 4.05, 4.9, 5.8], rings: [.38, .62], bend: .2 }
  ],
  cup: [
    { angles: [1.3, 1.85, 4.5, 5.0], bend: .15, branches: [0, 2] },
    { angles: [.8, 1.7, 2.25, 4.25, 5.0], bend: -.35, branches: [1, 3] },
    { angles: [1.1, 2.0, 3.9, 4.6, 5.4], bend: .4, branches: [0, 4] },
    { angles: [.55, 1.5, 2.15, 4.4, 5.2], bend: -.2, branches: [1, 2, 4] },
    { angles: [1.25, 2.4, 3.7, 4.8, 5.5], bend: .3, branches: [0, 2, 3] }
  ]
};
function addCracks(x, y, strength) {
  const choices = fracturePatterns[selectedObject];
  // Choosing from four alternatives guarantees a different pattern each hit.
  let patternIndex = Math.floor(Math.random() * (choices.length - 1));
  if (previousPattern === null) patternIndex = Math.floor(Math.random() * choices.length);
  else if (patternIndex >= previousPattern) patternIndex++;
  previousPattern = patternIndex;
  const pattern = choices[patternIndex];
  const count = strength === 1 ? Math.max(3, pattern.angles.length - 2) :
    strength === 3 ? pattern.angles.length - 1 : pattern.angles.length;
  const length = 19 + strength * 11;
  const rotation = (Math.random() - .5) * (selectedObject === 'cup' ? .16 : .42);
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = pattern.angles[i] + rotation;
    const reach = length * (.78 + Math.random() * .4);
    const middleAngle = angle + pattern.bend;
    const mid = { x: x + Math.cos(middleAngle) * reach * .48, y: y + Math.sin(middleAngle) * reach * .48 };
    const end = { x: mid.x + Math.cos(angle - pattern.bend * .4) * reach * .52, y: mid.y + Math.sin(angle - pattern.bend * .4) * reach * .52 };
    points.push({ mid, end });
    cracks.push(`M ${x} ${y} L ${mid.x.toFixed(1)} ${mid.y.toFixed(1)} L ${end.x.toFixed(1)} ${end.y.toFixed(1)}`);
    if (strength > 1 && pattern.branches && pattern.branches.includes(i)) {
      const branchAngle = angle + (i % 2 ? -.9 : .9);
      const branchLength = reach * (strength === 5 ? .45 : .27);
      cracks.push(`M ${mid.x.toFixed(1)} ${mid.y.toFixed(1)} l ${(Math.cos(branchAngle) * branchLength).toFixed(1)} ${(Math.sin(branchAngle) * branchLength).toFixed(1)}`);
    }
  }
  if (selectedObject === 'cup') {
    // A strike on the handle leaves a mark across its narrow ceramic band.
    // Nearby body strikes also travel through the closest handle joint.
    if (x > 275 && y >= 145 && y <= 265) {
      const tilt = (Math.random() - .5) * 12;
      cracks.push(`M ${(x - 12).toFixed(1)} ${(y - 4).toFixed(1)} l 24 ${(8 + tilt).toFixed(1)}`);
    }
    const joints = [{ x: 272, y: 158, endX: 302, endY: 159 },
                    { x: 271, y: 252, endX: 301, endY: 248 }];
    joints.forEach(joint => {
      if (Math.hypot(x - joint.x, y - joint.y) < 38 + strength * 3) {
        cracks.push(`M ${x.toFixed(1)} ${y.toFixed(1)} L ${joint.x} ${joint.y} L ${joint.endX} ${joint.endY}`);
      }
    });
  }
  if (selectedObject === 'bottle') {
    // Curved-looking web rings join adjacent rays, while retaining the strike as origin.
    const rings = strength === 1 ? pattern.rings.slice(0, 1) : pattern.rings;
    rings.forEach(ratio => {
      const ringPoints = points.map(({end}) => ({ x: x + (end.x - x) * ratio, y: y + (end.y - y) * ratio }));
      let path = `M ${ringPoints[0].x.toFixed(1)} ${ringPoints[0].y.toFixed(1)}`;
      ringPoints.slice(1).forEach(point => { path += ` L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`; });
      cracks.push(path + ' Z');
    });
  }
}
function shatter() {
  // Split around the final strike. Shared jagged edges are also drawn as
  // fracture lines, so the scattering pieces follow those final cracks.
  const center = lastImpact;
  const edge = [[0,0],[200,0],[400,0],[400,200],[400,400],[200,400],[0,400],[0,200]];
  const joints = edge.map(([x,y]) => ({
    x: center.x + (x - center.x) * (.48 + Math.random() * .12) + (Math.random() - .5) * 25,
    y: center.y + (y - center.y) * (.48 + Math.random() * .12) + (Math.random() - .5) * 25
  }));
  edge.forEach(([x,y], i) => cracks.push(`M ${center.x} ${center.y} L ${joints[i].x} ${joints[i].y} L ${x} ${y}`));
  renderObject();
  edge.forEach(([x,y], index) => {
    const next = (index + 1) % edge.length;
    const shard = objectArt.cloneNode(true);
    shard.removeAttribute('id');
    shard.className = 'shard';
    const point = (x, y) => `${x / 4}% ${y / 4}%`;
    shard.style.clipPath = `polygon(${point(center.x,center.y)}, ${point(joints[index].x,joints[index].y)}, ${point(x,y)}, ${point(edge[next][0],edge[next][1])}, ${point(joints[next].x,joints[next].y)})`;
    const midX = (x + edge[next][0]) / 2 - center.x;
    const midY = (y + edge[next][1]) / 2 - center.y;
    const distance = Math.hypot(midX, midY) || 1;
    const force = 65 + impactStrength * 14 + Math.random() * 45;
    shard.style.setProperty('--x', `${midX / distance * force}px`);
    shard.style.setProperty('--y', `${midY / distance * force + 95 + Math.random() * 45}px`);
    shard.style.setProperty('--r', `${(Math.random() - .5) * 110}deg`);
    shard.style.setProperty('--delay', `${Math.random() * 90}ms`);
    objectWrap.appendChild(shard);
  });
  objectArt.style.visibility = 'hidden';
  brokenCopy.hidden = false;
  breakTimer = setTimeout(() => objectWrap.querySelectorAll('.shard').forEach(shard => shard.remove()), 1500);
}
// Short, layered recorded fragments replace ringing taps. Different strengths
// use different fracture and debris recordings, not just a volume change.
const soundLibrary = {
  // Different recordings lead each level; extra short layers shape the material.
  plate: {
    1: [{ file: 'bfh1_rock_hit_01.ogg', length: .18, volume: .64, rate: 1.25 }, { file: 'plate-taps.mp3', length: .11, volume: .3, delay: 15 }],
    3: [{ file: 'bfh1_rock_breaking_03.ogg', length: .34, volume: .74, rate: 1.18 }, { file: 'ceramic-break.mp3', length: .17, volume: .5, delay: 25 }],
    5: [{ file: 'ceramic-break.mp3', length: .53, volume: .83, rate: 1.08 }, { file: 'bfh1_rock_breaking_01.ogg', length: .37, volume: .62, delay: 20 }, { file: 'bfh1_glass_falling_03.ogg', length: .2, volume: .25, delay: 100 }],
    broken: [{ file: 'ceramic-break.mp3', volume: .85 }, { file: 'bfh1_rock_falling_06.ogg', volume: .43, delay: 110 }, { file: 'bfh1_glass_falling_03.ogg', volume: .22, delay: 220 }]
  },
  cup: {
    1: [{ file: 'bfh1_hit_09.ogg', length: .19, volume: .7, rate: .78 }, { file: 'cup-taps.mp3', length: .12, volume: .22, rate: .8, delay: 15 }],
    3: [{ file: 'bfh1_hit_03.ogg', length: .32, volume: .78, rate: .8 }, { file: 'bfh1_rock_breaking_03.ogg', length: .24, volume: .35, rate: .75, delay: 35 }],
    5: [{ file: 'bfh1_rock_falling_04.ogg', length: .48, volume: .82, rate: .8 }, { file: 'bfh1_rock_breaking_01.ogg', length: .45, volume: .6, rate: .75, delay: 25 }, { file: 'ceramic-break.mp3', length: .23, volume: .3, rate: .8, delay: 75 }],
    broken: [{ file: 'ceramic-break.mp3', volume: .85, rate: .8 }, { file: 'bfh1_rock_falling_06.ogg', volume: .52, rate: .8, delay: 110 }, { file: 'bfh1_rock_breaking_03.ogg', length: .35, volume: .35, delay: 220 }]
  },
  bottle: {
    1: [{ file: 'bfh1_glass_hit_01.ogg', length: .19, volume: .55, rate: 1.15 }, { file: 'bfh1_glass_breaking_02.ogg', length: .1, volume: .23, delay: 25 }],
    3: [{ file: 'bfh1_glass_breaking_03.ogg', length: .32, volume: .67, rate: 1.1 }, { file: 'bfh1_glass_hit_02.ogg', length: .18, volume: .35, delay: 20 }],
    5: [{ file: 'bfh1_glass_breaking_02.ogg', length: .48, volume: .8 }, { file: 'bfh1_glass_breaking_03.ogg', length: .35, volume: .5, delay: 35 }, { file: 'bfh1_glass_falling_01.ogg', length: .22, volume: .3, delay: 100 }],
    broken: [{ file: 'bfh1_glass_breaking_01.ogg', volume: .82 }, { file: 'bfh1_glass_falling_01.ogg', volume: .5, delay: 100 }, { file: 'bfh1_glass_falling_03.ogg', volume: .4, delay: 220 }]
  }
};
const soundTimers = new Set();
// Build a mix from the condition before the strike. As damage rises, the
// solid impact recedes and longer, more numerous fracture sounds take over.
function buildSoundLayers(material, strength, broken, priorDamageRatio) {
  const damage = Math.max(0, Math.min(priorDamageRatio, 1));
  const base = soundLibrary[material][broken ? 'broken' : strength];
  if (broken) return base.map(layer => ({ ...layer }));
  const layers = base.map(layer => ({ ...layer, volume: layer.volume * (1 - damage * .5) }));
  if (damage === 0) return layers;
  const glass = material === 'bottle';
  const rate = glass ? 1.12 : material === 'cup' ? .78 : 1.05;
  layers.push({
    file: glass ? 'bfh1_glass_breaking_03.ogg' : 'bfh1_rock_breaking_03.ogg',
    length: .16 + damage * .38,
    volume: .3 + damage * .5,
    rate, delay: 45
  });
  if (damage >= .25) {
    layers.push({
      file: glass ? 'bfh1_glass_falling_01.ogg' : 'bfh1_rock_falling_06.ogg',
      length: .22 + damage * .3,
      volume: .32 + damage * .4,
      rate, delay: 145
    });
  }
  if (damage >= .5) {
    layers.push({
      file: glass ? 'bfh1_glass_breaking_02.ogg' : 'ceramic-break.mp3',
      length: .18 + damage * .25,
      volume: .35 + damage * .35,
      rate, delay: 290
    });
  }
  if (damage >= .75) {
    layers.push({
      file: glass ? 'bfh1_glass_falling_03.ogg' : 'bfh1_rock_falling_02.ogg',
      length: .4, volume: .62, rate, delay: 470
    });
  }
  return layers;
}
function playImpact(strength, broken, priorDamageRatio) {
  if (!soundEnabled) return;
  const material = selectedObject;
  const layers = buildSoundLayers(material, strength, broken, priorDamageRatio);
  layers.forEach(layer => {
    const startLayer = () => {
      if (!soundEnabled) return;
      const audio = new Audio();
      const fallback = material === 'bottle' && !broken ? 'glass-tap.mp3' : 'ceramic-break.mp3';
      const file = layer.file.endsWith('.ogg') && !audio.canPlayType('audio/ogg; codecs="vorbis"') ? fallback : layer.file;
      audio.src = `assets/audio/${file}`;
      audio.playbackRate = layer.rate || 1;
      audio.volume = layer.volume;
      activeSounds.add(audio);
      let stopTimer;
      const cleanup = () => { clearTimeout(stopTimer); audio.pause(); activeSounds.delete(audio); };
      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', cleanup, { once: true });
      audio.play().then(() => {
        if (!soundEnabled) { cleanup(); return; }
        if (layer.length) stopTimer = setTimeout(cleanup, layer.length * 1000 / audio.playbackRate);
      }).catch(cleanup);
    };
    if (layer.delay) {
      const timer = setTimeout(() => { soundTimers.delete(timer); startLayer(); }, layer.delay);
      soundTimers.add(timer);
    } else startLayer();
  });
}
function smash(x, y) {
  if (objectState === 'broken') return;
  const priorDamageRatio = Math.min(accumulatedDamage / objectDurability, 1);
  numberOfHits++;
  lastImpact = { x, y };
  addCracks(x, y, impactStrength);
  accumulatedDamage += impactStrength;
  const damageRatio = accumulatedDamage / objectDurability;
  // Thresholds combine object durability, the selected strength, and all prior hits.
  if (damageRatio >= 1) objectState = 'broken';
  else if (damageRatio >= .65) objectState = 'heavy';
  else if (damageRatio >= .25) objectState = 'light';
  else objectState = 'intact';
  renderObject();
  playImpact(impactStrength, objectState === 'broken', priorDamageRatio);
  stage.style.setProperty('--force', `${impactStrength * 2}px`);
  stage.style.setProperty('--duration', `${180 + impactStrength * 35}ms`);
  stage.classList.remove('shake'); objectWrap.classList.remove('impact');
  void stage.offsetWidth; // Restart CSS animations on every click.
  stage.classList.add('shake'); objectWrap.classList.add('impact');
  if (objectState === 'broken') {
    objectWrap.setAttribute('aria-disabled', 'true');
    objectWrap.setAttribute('aria-label', 'Object broken');
    strikeHint.textContent = 'Reset or choose another object to begin again';
    shatter();
  }
}

document.querySelector('#objectOptions').addEventListener('click', event => {
  const button = event.target.closest('[data-object]');
  if (!button) return;
  selectedObject = button.dataset.object;
  document.querySelectorAll('.object-option').forEach(option => {
    const active = option === button;
    option.classList.toggle('active', active); option.setAttribute('aria-pressed', active);
  });
  resetObject();
});
messageInput.addEventListener('input', () => {
  personalMessage = messageInput.value;
  document.querySelector('#characterCount').textContent = `${personalMessage.length} / 80`;
  // Do not recreate an object that has already shattered.
  if (objectState !== 'broken') updateMessage();
});
// The three options map to the same damage units as the former slider.
document.querySelector('#strengthOptions').addEventListener('click', event => {
  const button = event.target.closest('[data-strength]');
  if (!button) return;
  impactStrength = Number(button.dataset.strength);
  document.querySelectorAll('[data-strength]').forEach(option => {
    const active = option === button;
    option.classList.toggle('active', active);
    option.setAttribute('aria-pressed', String(active));
  });
});
function strikeAt(x, y) {
  if (objectState === 'broken') return;
  // Position visual feedback relative to the object, at the user's click.
  const spark = document.createElement('span');
  spark.className = 'impact-mark';
  spark.style.left = `${x}px`;
  spark.style.top = `${y}px`;
  spark.style.setProperty('--impact-size', `${32 + impactStrength * 12}px`);
  spark.setAttribute('aria-hidden', 'true');
  objectWrap.appendChild(spark);
  spark.addEventListener('animationend', () => spark.remove(), { once: true });
  smash(x / objectWrap.clientWidth * 400, y / objectWrap.clientHeight * 400);
}
objectWrap.addEventListener('click', event => {
  const bounds = objectWrap.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width * 400;
  const y = (event.clientY - bounds.top) / bounds.height * 400;
  const svg = objectArt.querySelector('svg');
  const point = svg.createSVGPoint(); point.x = x; point.y = y;
  // Ignore clicks in the empty space surrounding the object's surface.
  if (![...svg.querySelectorAll('#surface > *')].some(surface => surface.isPointInFill(point))) return;
  strikeAt(event.clientX - bounds.left, event.clientY - bounds.top);
});
objectWrap.addEventListener('keydown', event => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  const bounds = objectWrap.getBoundingClientRect();
  strikeAt(bounds.width / 2, bounds.height / 2);
});
document.querySelector('#resetButton').addEventListener('click', () => {
  personalMessage = ''; messageInput.value = ''; document.querySelector('#characterCount').textContent = '0 / 80';
  resetObject();
});
document.querySelector('#soundButton').addEventListener('click', event => {
  soundEnabled = !soundEnabled;
  if (!soundEnabled) { soundTimers.forEach(clearTimeout); soundTimers.clear(); activeSounds.forEach(audio => audio.pause()); activeSounds.clear(); }
  event.currentTarget.innerHTML = `<span aria-hidden="true">◖</span> SOUND ${soundEnabled ? 'ON' : 'OFF'}`;
  event.currentTarget.setAttribute('aria-pressed', String(!soundEnabled));
  event.currentTarget.setAttribute('aria-label', `Turn sound ${soundEnabled ? 'off' : 'on'}`);
});
renderObject();
