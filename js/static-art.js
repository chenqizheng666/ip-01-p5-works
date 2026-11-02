/* =========================================================
   作品 01 · 几何构成（静态）
   ---------------------------------------------------------
   规则：只用形状、颜色、位置。
   全文件没有 draw() 循环，画面只在 setup() 里绘制一次，
   窗口变化时仅重新缩放画布（不改动构图本身）。
   ========================================================= */

/* 配色：共 5 色。冷色打底（墨蓝/湖蓝），暖色点睛（珊瑚橙），
   米白负责留白，沙色作为低饱和过渡。 */
const PALETTE = {
  ink:   '#0E1B2A', // 深墨蓝：左侧结构竖带与三角
  paper: '#F3EDE3', // 米白：底色与细线
  coral: '#E4572E', // 珊瑚橙：唯一的高饱和暖色，视觉焦点
  blue:  '#3D7EA6', // 湖蓝：底部半圆，压住画面
  sand:  '#D8C3A5', // 沙色：小方阵，弱化节奏
};

// 画布的逻辑尺寸（固定比例，避免不同屏幕下构图比例变化）
const ART_WIDTH = 1200;
const ART_HEIGHT = 800;

function setup() {
  const canvas = createCanvas(ART_WIDTH, ART_HEIGHT);
  canvas.parent('stage');
  noStroke();

  fitCanvasToStage(); // 先按窗口缩放，再绘制
  compose();          // 只绘制一次
}

/* 窗口尺寸变化时，只调整画布的显示大小，不重绘构图 */
function windowResized() {
  fitCanvasToStage();
}

/* 让 1200×800 的画布等比缩放到可视区域，四周留一点呼吸边距 */
function fitCanvasToStage() {
  const stage = document.getElementById('stage');
  const scale = Math.min(
    stage.clientWidth / ART_WIDTH,
    stage.clientHeight / ART_HEIGHT
  ) * 0.92;

  const canvasElement = document.querySelector('canvas');
  canvasElement.style.width = ART_WIDTH * scale + 'px';
  canvasElement.style.height = ART_HEIGHT * scale + 'px';
}

/* ---------------------------------------------------------
   构图：从左到右建立三段节奏
   左（结构）— 中（焦点与节奏）— 右（体块与压底）
   --------------------------------------------------------- */
function compose() {
  background(PALETTE.paper);

  // 1. 左侧墨蓝竖带：整幅画面的"承重墙"
  fill(PALETTE.ink);
  rect(0, 0, 300, ART_HEIGHT);

  // 2. 竖带里的三条米白细线：用 for 循环生成，避免手写重复
  stroke(PALETTE.paper);
  strokeWeight(2);
  for (let lineIndex = 0; lineIndex < 3; lineIndex++) {
    const lineY = 96 + lineIndex * 300;
    line(0, lineY, 300, lineY);
  }
  noStroke();

  // 3. 珊瑚橙主圆：骑在竖带边缘上，是全图唯一的暖色焦点
  fill(PALETTE.coral);
  circle(300, 250, 300);

  // 4. 沙色小方阵：6 列 × 3 行，用嵌套 for 循环生成
  const cellSize = 28;
  const cellGap = 12;
  fill(PALETTE.sand);
  for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
    for (let columnIndex = 0; columnIndex < 6; columnIndex++) {
      const cellX = 620 + columnIndex * (cellSize + cellGap);
      const cellY = 150 + rowIndex * (cellSize + cellGap);
      rect(cellX, cellY, cellSize, cellSize);
    }
  }

  // 5. 墨蓝三角形：右上角的锐角，与圆形形成对比
  fill(PALETTE.ink);
  triangle(1030, 96, 1168, 96, 1099, 236);

  // 6. 珊瑚橙横线：给画面一条明确的地平线
  stroke(PALETTE.coral);
  strokeWeight(7);
  line(340, 430, 1180, 430);
  noStroke();

  // 7. 湖蓝半圆：从底边抬起，稳住画面重心
  fill(PALETTE.blue);
  arc(640, ART_HEIGHT, 620, 620, PI, TWO_PI, CHORD);

  // 8. 点阵：8 个圆，直径交替变化，用 for 循环生成
  for (let dotIndex = 0; dotIndex < 8; dotIndex++) {
    const dotX = 620 + dotIndex * 38;
    const dotY = 352;
    const dotDiameter = dotIndex % 2 === 0 ? 14 : 24;
    fill(dotIndex % 2 === 0 ? PALETTE.ink : PALETTE.coral);
    circle(dotX, dotY, dotDiameter);
  }
}
