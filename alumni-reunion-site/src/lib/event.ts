// 「同窓会 イベント情報」DB の読み込み。
import "server-only";
import { unstable_cache } from "next/cache";
import {
  getDatabaseId,
  getNotionClient,
  readCheckbox,
  readDate,
  readEmail,
  readNumber,
  readText,
  toResult,
  type NotionDate,
  type Result,
} from "./notion";

/** サイトが表示するイベント情報。Notion に値がなければ全て null（UI では「未定」）。 */
export type EventInfo = {
  name: string | null;
  lead: string | null;
  startAt: NotionDate | null;
  venue: string | null;
  address: string | null;
  fee: number | null;
  feeNote: string | null;
  deadline: NotionDate | null;
  capacity: number | null;
  organizers: string | null;
  contact: string | null;
  cancellationPolicy: string | null;
  dressCode: string | null;
};

/** Notion のページを EventInfo へ写す。値の補完は一切行わない。 */
function toEventInfo(page: unknown): EventInfo {
  const props = (page as { properties?: Record<string, unknown> }).properties ?? {};
  return {
    name: readText(props, "イベント名"),
    lead: readText(props, "リード文"),
    startAt: readDate(props, "開催日時"),
    venue: readText(props, "会場名"),
    address: readText(props, "住所"),
    fee: readNumber(props, "料金"),
    feeNote: readText(props, "料金補足"),
    deadline: readDate(props, "回答期限"),
    capacity: readNumber(props, "定員"),
    organizers: readText(props, "幹事名"),
    contact: readEmail(props, "連絡先"),
    cancellationPolicy: readText(props, "キャンセル規定"),
    dressCode: readText(props, "ドレスコード"),
  };
}

async function fetchEvent(): Promise<EventInfo | null> {
  const notion = getNotionClient();
  const response = await notion.databases.query({
    database_id: getDatabaseId("event"),
    filter: { property: "公開", checkbox: { equals: true } },
    page_size: 1,
  });
  const page = response.results[0];
  if (!page) return null;
  // 「公開」が付いていても保険としてもう一度確認する
  const props = (page as { properties?: Record<string, unknown> }).properties ?? {};
  if (!readCheckbox(props, "公開")) return null;
  return toEventInfo(page);
}

/** API 制限に配慮し、イベント情報は 60 秒キャッシュする。 */
const getCachedEvent = unstable_cache(fetchEvent, ["alumni-event"], {
  revalidate: 60,
  tags: ["event"],
});

export function getEvent(): Promise<Result<EventInfo | null>> {
  return toResult(getCachedEvent);
}
