export type HeroCopy = {
  headline: string;
  subheadline?: string;
  bullets?: string[];
  cta?: string;
};

const FONT = '"Pretendard Variable", Pretendard, "Noto Sans KR", -apple-system, sans-serif';

const TONE = {
  scrim: "rgba(17,24,39,0.85)",
  text: "#ffffff",
  accent: "#34d399",
  chipText: "#0b1f17"
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("배경 이미지를 불러오지 못했습니다."));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** 텍스트 없는 배경 이미지(dataURL) 위에 히어로 카피를 합성해 PNG dataURL을 반환한다. */
export async function renderHeroOverlay(baseImage: string, copy: HeroCopy): Promise<string> {
  const img = await loadImage(baseImage);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 컨텍스트 생성에 실패했습니다.");

  try {
    await document.fonts?.load(`800 ${Math.round(W * 0.062)}px ${FONT}`);
    await document.fonts?.load(`500 ${Math.round(W * 0.032)}px ${FONT}`);
  } catch {
    // 폰트 미로드 시 시스템 폰트로 폴백
  }

  ctx.drawImage(img, 0, 0);

  const pad = W * 0.06;
  const headlineSize = Math.round(W * 0.062);
  const subSize = Math.round(W * 0.032);
  const chipSize = Math.round(W * 0.028);

  const scrimH = H * 0.42;
  const grad = ctx.createLinearGradient(0, H - scrimH, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.45, TONE.scrim);
  grad.addColorStop(1, TONE.scrim);
  ctx.fillStyle = grad;
  ctx.fillRect(0, H - scrimH, W, scrimH);

  ctx.textAlign = "left";
  let y = H - pad;

  if (copy.cta) {
    ctx.font = `700 ${chipSize}px ${FONT}`;
    const chipW = ctx.measureText(copy.cta).width + chipSize * 2;
    const chipH = chipSize * 2.2;
    ctx.fillStyle = TONE.accent;
    ctx.beginPath();
    ctx.roundRect(pad, y - chipH, chipW, chipH, chipH / 2);
    ctx.fill();
    ctx.fillStyle = TONE.chipText;
    ctx.textBaseline = "middle";
    ctx.fillText(copy.cta, pad + chipSize, y - chipH / 2);
    ctx.textBaseline = "alphabetic";
    y -= chipH + subSize;
  }

  if (copy.subheadline) {
    ctx.font = `500 ${subSize}px ${FONT}`;
    ctx.fillStyle = TONE.text;
    ctx.globalAlpha = 0.9;
    const lines = wrapText(ctx, copy.subheadline, W - pad * 2).slice(0, 2);
    for (const line of [...lines].reverse()) {
      ctx.fillText(line, pad, y);
      y -= subSize * 1.5;
    }
    ctx.globalAlpha = 1;
    y -= subSize * 0.5;
  }

  ctx.font = `800 ${headlineSize}px ${FONT}`;
  ctx.fillStyle = TONE.text;
  const headlineLines = wrapText(ctx, copy.headline, W - pad * 2).slice(0, 3);
  for (const line of [...headlineLines].reverse()) {
    ctx.fillText(line, pad, y);
    y -= headlineSize * 1.28;
  }

  return canvas.toDataURL("image/png");
}
