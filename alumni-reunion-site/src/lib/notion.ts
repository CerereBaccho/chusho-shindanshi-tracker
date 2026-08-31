// Notion API クライアント。サーバー側でのみ読み込まれることを server-only で保証する。
import "server-only";
import { Client } from "@notionhq/client";

/** Notion 連携に必要な環境変数が揃っていないことを表すエラー */
export class NotionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotionConfigError";
  }
}

let cachedClient: Client | null = null;

/**
 * Notion クライアントを取得する。
 * トークンはサーバー側の環境変数からのみ読み込み、クライアントには一切渡さない。
 */
export function getNotionClient(): Client {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new NotionConfigError("環境変数 NOTION_TOKEN が設定されていません。");
  }
  if (!cachedClient) {
    cachedClient = new Client({ auth: token, notionVersion: "2022-06-28" });
  }
  return cachedClient;
}

/** 環境変数からデータベース ID を取得する */
export function getDatabaseId(kind: "event" | "rsvp"): string {
  const key = kind === "event" ? "NOTION_EVENT_DB_ID" : "NOTION_RSVP_DB_ID";
  const value = process.env[key];
  if (!value) {
    throw new NotionConfigError(`環境変数 ${key} が設定されていません。`);
  }
  return value;
}

/** 取得処理の結果。失敗してもページ全体を落とさず、該当箇所だけエラー表示にするために使う。 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** 例外を Result に畳み込む。Notion 障害時もサイトを落とさない。 */
export async function toResult<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof NotionConfigError) {
      return { ok: false, error: error.message };
    }
    console.error("[notion] 取得に失敗しました", error);
    return { ok: false, error: "Notion からの情報取得に失敗しました。" };
  }
}

/* ------------------------------------------------------------------ *
 * プロパティ値の取り出しヘルパー
 * Notion に存在しない／空の項目は必ず null を返し、推測で補完しない。
 * ------------------------------------------------------------------ */

type AnyProps = Record<string, unknown>;

function prop(props: AnyProps, name: string): AnyProps | null {
  const value = props[name];
  return value && typeof value === "object" ? (value as AnyProps) : null;
}

/** rich_text / title を平文へ。空文字は null に正規化する。 */
export function readText(props: AnyProps, name: string): string | null {
  const p = prop(props, name);
  if (!p) return null;
  const runs = (p.rich_text ?? p.title) as { plain_text?: string }[] | undefined;
  if (!Array.isArray(runs)) return null;
  const text = runs.map((run) => run.plain_text ?? "").join("").trim();
  return text.length > 0 ? text : null;
}

export function readNumber(props: AnyProps, name: string): number | null {
  const p = prop(props, name);
  const value = p?.number;
  return typeof value === "number" ? value : null;
}

export function readCheckbox(props: AnyProps, name: string): boolean {
  const p = prop(props, name);
  return p?.checkbox === true;
}

export function readEmail(props: AnyProps, name: string): string | null {
  const p = prop(props, name);
  const value = p?.email;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function readSelect(props: AnyProps, name: string): string | null {
  const p = prop(props, name);
  const select = p?.select as { name?: string } | null | undefined;
  return select?.name ?? null;
}

export type NotionDate = { start: string; end: string | null; hasTime: boolean };

export function readDate(props: AnyProps, name: string): NotionDate | null {
  const p = prop(props, name);
  const date = p?.date as { start?: string; end?: string | null } | null | undefined;
  if (!date?.start) return null;
  return {
    start: date.start,
    end: date.end ?? null,
    // Notion の日付は時刻を含む場合のみ "T" を持つ
    hasTime: date.start.includes("T"),
  };
}

export function readCreatedTime(props: AnyProps, name: string): string | null {
  const p = prop(props, name);
  const value = p?.created_time;
  return typeof value === "string" ? value : null;
}
