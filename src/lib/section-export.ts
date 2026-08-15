import JSZip from "jszip";

export type ExportSection = {
  id: string;
  name: string;
  imageUrl?: string;
  copy?: {
    headline?: string;
    subheadline?: string;
    bullets?: string[];
    cta?: string;
  };
};

/** 01_히어로.png 형태의 순번 파일명 */
export function buildZipFileName(index: number, sectionName: string) {
  const safe = sectionName.replace(/^S\d+\s*/, "").replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "");
  return `${String(index + 1).padStart(2, "0")}_${safe || "섹션"}.png`;
}

export async function buildSectionsZip(sections: ExportSection[], title: string): Promise<Blob> {
  const zip = new JSZip();
  let added = 0;

  sections.forEach((section, index) => {
    const base64 = section.imageUrl?.split(",")[1];
    if (!base64) return;
    zip.file(buildZipFileName(index, section.name), base64, { base64: true });
    added += 1;
  });

  if (added === 0) throw new Error("ZIP으로 묶을 이미지가 없습니다.");
  zip.file("카피.md", buildBlueprintMarkdown(sections, title));
  return zip.generateAsync({ type: "blob" });
}

/** 외주·디자이너 전달용 카피 마크다운 */
export function buildBlueprintMarkdown(sections: ExportSection[], title: string) {
  const lines: string[] = [`# ${title} 상세페이지 카피`, ""];

  sections.forEach((section, index) => {
    const copy = section.copy;
    lines.push(`## ${index + 1}. ${section.name}`);
    if (copy?.headline) lines.push(`**헤드라인:** ${copy.headline}`);
    if (copy?.subheadline) lines.push(`**서브헤드:** ${copy.subheadline}`);
    if (copy?.bullets?.length) {
      lines.push("", "**핵심 포인트:**", ...copy.bullets.map((bullet) => `- ${bullet}`));
    }
    if (copy?.cta) lines.push("", `**CTA:** ${copy.cta}`);
    if (!copy?.headline && !copy?.subheadline && !copy?.bullets?.length) {
      lines.push("_이 섹션은 카피 데이터 없이 생성되었습니다._");
    }
    lines.push("");
  });

  return lines.join("\n");
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
