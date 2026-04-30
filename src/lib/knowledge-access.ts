import { timingSafeEqual } from "node:crypto";

function parseKeys(value?: string) {
  return (value || "")
    .split(/[\n,]/)
    .map((key) => key.trim())
    .filter(Boolean);
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isKnowledgeAccessRequired() {
  return parseKeys(process.env.KNOWLEDGE_ACCESS_KEYS || process.env.KNOWLEDGE_ACCESS_KEY).length > 0;
}

export function canUseCommonKnowledge(inputKey: string) {
  const keys = parseKeys(process.env.KNOWLEDGE_ACCESS_KEYS || process.env.KNOWLEDGE_ACCESS_KEY);
  if (keys.length === 0) return true;
  const normalized = inputKey.trim();
  if (!normalized) return false;
  return keys.some((key) => secureEquals(key, normalized));
}

export function isKnowledgeAdminRequired() {
  return Boolean((process.env.KNOWLEDGE_ADMIN_KEY || "").trim());
}

export function canManageCommonKnowledge(inputKey: string) {
  const adminKey = (process.env.KNOWLEDGE_ADMIN_KEY || "").trim();
  if (!adminKey) return true;
  return secureEquals(adminKey, inputKey.trim());
}
