import { neon } from "@neondatabase/serverless";
import OpenAI from "openai";
import { createHash } from "node:crypto";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

type KnowledgeChunk = {
  content: string;
  sourceName: string;
  chunkIndex: number;
};

export type RetrievedKnowledge = {
  sourceName: string;
  chunkIndex: number;
  content: string;
  similarity: number;
};

let schemaReady = false;

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  return neon(databaseUrl);
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function isRagConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.OPENAI_API_KEY);
}

export async function ensureRagSchema() {
  const sql = getSql();
  if (!sql || schemaReady) return false;

  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      content_hash text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
      source_name text NOT NULL,
      chunk_index integer NOT NULL,
      content text NOT NULL,
      embedding vector(1536) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
    ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS knowledge_chunks_document_id_idx
    ON knowledge_chunks (document_id)
  `;

  schemaReady = true;
  return true;
}

export async function indexKnowledgeDocument({ name, text }: { name: string; text: string }) {
  const sql = getSql();
  const openai = getOpenAI();
  if (!sql || !openai) {
    return { indexed: false, chunks: 0, reason: "DATABASE_URL 또는 OPENAI_API_KEY가 없습니다." };
  }

  await ensureRagSchema();
  const contentHash = await sha256(`${name}:${text}`);
  const chunks = chunkText(text, name);
  if (chunks.length === 0) return { indexed: false, chunks: 0, reason: "인덱싱할 텍스트가 없습니다." };

  const rows = await sql`
    INSERT INTO knowledge_documents (name, content_hash)
    VALUES (${name}, ${contentHash})
    ON CONFLICT (content_hash) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;
  const documentId = rows[0].id as string;

  await sql`DELETE FROM knowledge_chunks WHERE document_id = ${documentId}`;

  for (const chunk of chunks) {
    const embedding = await embedText(openai, chunk.content);
    await sql`
      INSERT INTO knowledge_chunks (document_id, source_name, chunk_index, content, embedding)
      VALUES (${documentId}, ${chunk.sourceName}, ${chunk.chunkIndex}, ${chunk.content}, ${toVector(embedding)}::vector)
    `;
  }

  return { indexed: true, chunks: chunks.length, documentId };
}

export async function retrieveKnowledge(query: string, limit = 8): Promise<RetrievedKnowledge[]> {
  const sql = getSql();
  const openai = getOpenAI();
  if (!sql || !openai || !query.trim()) return [];

  await ensureRagSchema();
  const embedding = await embedText(openai, query.slice(0, 8000));
  const rows = await sql`
    SELECT source_name, chunk_index, content, 1 - (embedding <=> ${toVector(embedding)}::vector) AS similarity
    FROM knowledge_chunks
    ORDER BY embedding <=> ${toVector(embedding)}::vector
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    sourceName: row.source_name as string,
    chunkIndex: row.chunk_index as number,
    content: row.content as string,
    similarity: Number(row.similarity)
  }));
}

export async function getKnowledgeStats() {
  const sql = getSql();
  if (!sql) return { configured: false, documents: 0, chunks: 0 };

  await ensureRagSchema();
  const rows = await sql`
    SELECT
      (SELECT count(*)::int FROM knowledge_documents) AS documents,
      (SELECT count(*)::int FROM knowledge_chunks) AS chunks
  `;

  return {
    configured: true,
    documents: Number(rows[0]?.documents || 0),
    chunks: Number(rows[0]?.chunks || 0)
  };
}

export async function deleteKnowledgeDocument(documentId: string) {
  const sql = getSql();
  if (!sql || !documentId) return { deleted: false };

  await ensureRagSchema();
  const rows = await sql`
    DELETE FROM knowledge_documents
    WHERE id = ${documentId}
    RETURNING id
  `;

  return { deleted: rows.length > 0 };
}

function chunkText(text: string, sourceName: string): KnowledgeChunk[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks: KnowledgeChunk[] = [];
  const size = 1400;
  const overlap = 220;

  for (let start = 0; start < normalized.length; start += size - overlap) {
    const content = normalized.slice(start, start + size).trim();
    if (content.length < 120) continue;
    chunks.push({ content, sourceName, chunkIndex: chunks.length });
    if (chunks.length >= 80) break;
  }

  return chunks;
}

async function embedText(openai: OpenAI, input: string) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input,
    dimensions: EMBEDDING_DIMENSIONS
  });
  return response.data[0].embedding;
}

function toVector(values: number[]) {
  return `[${values.join(",")}]`;
}

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}
