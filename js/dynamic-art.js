/* =========================================================
   作品 02 · 交互动态
   ---------------------------------------------------------
   交互（3 种）：
   1. 鼠标移动 —— 点阵以光标为圆心起伏，珊瑚圆盘缓动跟随
   2. 鼠标点击 —— 在点击处炸开扩散水波（最多叠加 8 个）
   3. 键盘     —— 空格暂停 / N 昼夜切换 / ↑↓ 调速 / R 重置

   画面稳定做法：所有运动由 sin(时间) 驱动，无随机抖动；
   跟随使用指数缓动，切换主题只改颜色不改位置。
   ========================================================= */

/* 同一套 5 色配色（与 static.html 一致） */
const PALETTE = {
  ink:   '#0E1B2A',
  paper: '#F3EDE3',
  coral: '#E4572E',
  blue:  '#3D7EA6',
  sand:  '#D8C3A5',
};

/* ---------------- 状态 ---------------- */
let phaseTime = 0;        // 动画时间（秒），暂停时冻结
let speed = 1;            // 动画倍速，可用 ↑↓ 调整
let isPaused = false;     // 空格控制
let isNight = true;       // N 键在墨蓝与米白之间切换
let hasPointerMoved = false;

const disc = { x: 0, y: 0, radius: 96, pulse: 0 }; // 跟随光标的珊瑚圆盘
const ripples = [];                               // 点击产生的水波

/* 点阵颜色按透明度分档预生成，避免每帧解析颜色字符串 */
const DOT_ALPHA_LEVELS = 10;
const dotColorCache = { sand: [], ink: [] };

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('stage');
  pixelDensity(Math.min(2, window.devicePixelRatio || 1));
  noStroke();

  disc.x = width * 0.5;
  disc.y = height * 0.42;

  dotColorCache.sand = buildAlphaSteps(PALETTE.sand);
  dotColorCache.ink = buildAlphaSteps(PALETTE.ink);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  disc.x = constrain(disc.x, 0, width);
  disc.y = constrain(disc.y, 0, height);
}

/* 预生成 N+1 档透明度的同色，供点阵按距离取用
   基础透明度 55：保证远离圆盘的点也可见，靠近时再增强到 225 */
function buildAlphaSteps(hexColor) {
  const steps = [];
  for (let level = 0; level <= DOT_ALPHA_LEVELS; level++) {
    const stepColor = color(hexColor);
    stepColor.setAlpha(55 + (level / DOT_ALPHA_LEVELS) * 170);
    steps.push(stepColor);
  }
  return steps;
}

/* ======================= 主循环 ======================= */
function draw() {
  if (!isPaused) {
    phaseTime += (deltaTime / 1000) * speed;
    disc.pulse *= 0.93; // 点击后圆盘轻微回弹，自然衰减
  }

  background(isNight ? PALETTE.ink : PALETTE.paper);

  followPointer();
  drawRings(phaseTime);
  drawDotField(phaseTime);
  drawRipples();
  drawDisc(phaseTime);
}

/* 圆盘指数缓动跟随光标：与帧率无关，运动平滑不抖 */
function followPointer() {
  if (!hasPointerMoved) return;
  const smoothing = 1 - Math.exp(-6 * (deltaTime / 1000));
  disc.x = lerp(disc.x, mouseX, smoothing);
  disc.y = lerp(disc.y, mouseY, smoothing);
}

/* 以圆盘为圆心的同心弧，正反方向缓慢旋转 */
function drawRings(now) {
  push();
  translate(disc.x, disc.y);
  noFill();

  for (let ringIndex = 0; ringIndex < 6; ringIndex++) {
    const radius = 118 + ringIndex * 46;
    const direction = ringIndex % 2 === 0 ? 1 : -1;
    const rotation = now * (0.25 + ringIndex * 0.05) * direction;
    const sweep = HALF_PI * (0.55 + 0.3 * Math.sin(now * 0.6 + ringIndex));

    strokeWeight(ringIndex % 3 === 0 ? 2.2 : 1.2);
    stroke(ringColor(ringIndex, 90));
    arc(0, 0, radius * 2, radius * 2, rotation, rotation + sweep);
    arc(0, 0, radius * 2, radius * 2, rotation + PI, rotation + PI + sweep);
  }

  pop();
  noStroke();
}

/* 点阵：用嵌套 for 循环铺满画布，越靠近圆盘越亮、偏移越大 */
function drawDotField(now) {
  const dotColors = isNight ? dotColorCache.sand : dotColorCache.ink;
  const gridStep = 46;

  for (let gridX = gridStep / 2; gridX < width; gridX += gridStep) {
    for (let gridY = gridStep / 2; gridY < height; gridY += gridStep) {
      const distanceToDisc = dist(gridX, gridY, disc.x, disc.y);
      const influence = Math.max(0, 1 - distanceToDisc / 300);
      const wave = Math.sin(now * 2.0 - distanceToDisc * 0.03) * 18 * influence;
      const direction = Math.atan2(gridY - disc.y, gridX - disc.x);

      const dotX = gridX + Math.cos(direction) * wave;
      const dotY = gridY + Math.sin(direction) * wave;

      fill(dotColors[Math.round(influence * DOT_ALPHA_LEVELS)]);
      circle(dotX, dotY, 3 + influence * 5);
    }
  }
}

/* 点击水波：扩散 + 淡出，结束后自动移除 */
function drawRipples() {
  const elapsed = deltaTime / 1000;
  noFill();

  for (let index = ripples.length - 1; index >= 0; index--) {
    const ripple = ripples[index];

    if (!isPaused) {
      ripple.age += elapsed;
      ripple.radius += 300 * elapsed * speed;
    }

    const life = 1 - ripple.age / 1.8;
    if (life <= 0) {
      ripples.splice(index, 1);
      continue;
    }

    strokeWeight(1.6);
    stroke(ringColor(0, 150 * life));
    circle(ripple.x, ripple.y, ripple.radius * 2);
    stroke(ringColor(1, 110 * life));
    circle(ripple.x, ripple.y, ripple.radius * 1.6);
  }

  noStroke();
}

/* 珊瑚圆盘：外圈呼吸、内圈留一个底色"瞳孔" */
function drawDisc(now) {
  const breathe = (1 + Math.sin(now * 1.5) * 0.05) * (1 + disc.pulse);
  const diameter = disc.radius * 2 * breathe;

  fill(PALETTE.coral);
  circle(disc.x, disc.y, diameter);

  fill(isNight ? PALETTE.ink : PALETTE.paper);
  circle(disc.x, disc.y, diameter * 0.32);

  noFill();
  stroke(ringColor(1, 120));
  strokeWeight(1.4);
  circle(disc.x, disc.y, diameter + 18);
  noStroke();
}

/* 环线颜色：珊瑚橙与湖蓝交替 */
function ringColor(index, alphaValue) {
  const baseColor = index % 2 === 0 ? PALETTE.coral : PALETTE.blue;
  const mixed = color(baseColor);
  mixed.setAlpha(alphaValue);
  return mixed;
}

/* ======================= 交互 ======================= */
function mouseMoved() {
  hasPointerMoved = true;
}

function mousePressed() {
  hasPointerMoved = true;
  if (ripples.length >= 8) ripples.shift(); // 最多同时保留 8 个水波
  ripples.push({ x: mouseX, y: mouseY, radius: 18, age: 0 });
  disc.pulse = 0.18;                        // 点击瞬间圆盘轻微放大
}

function keyPressed() {
  if (key === ' ') {
    isPaused = !isPaused;
    return false; // 阻止空格滚动页面
  }

  if (key === 'n' || key === 'N') {
    isNight = !isNight;
  }

  if (keyCode === UP_ARROW) {
    speed = min(3, speed + 0.25);
  }

  if (keyCode === DOWN_ARROW) {
    speed = max(0.25, speed - 0.25);
  }

  if (key === 'r' || key === 'R') {
    ripples.length = 0;
    phaseTime = 0;
    speed = 1;
    hasPointerMoved = false;
    disc.x = width * 0.5;
    disc.y = height * 0.42;
    disc.pulse = 0;
  }
}
