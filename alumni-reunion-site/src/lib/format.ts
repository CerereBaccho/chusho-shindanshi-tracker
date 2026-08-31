// 表示用の整形ヘルパー。値が無い場合は必ず「未定」を返し、推測で埋めない。
import type { NotionDate } from "./notion";

/** Notion に値が無い項目の表示文言 */
export const UNDECIDED = "未定";

const TIME_ZONE = "Asia/Tokyo";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

/** 開催日時を「2026年11月21日(土) 18:00〜21:00」の形へ。時刻が無ければ日付のみ。 */
export function formatEventDate(date: NotionDate | null): string {
  if (!date) return UNDECIDED;
  const start = new Date(date.start);
  if (Number.isNaN(start.getTime())) return UNDECIDED;

  const head = dateFormatter.format(start);
  if (!date.hasTime) return head;

  let result = `${head} ${timeFormatter.format(start)}`;
  if (date.end) {
    const end = new Date(date.end);
    if (!Number.isNaN(end.getTime())) {
      result += `〜${timeFormatter.format(end)}`;
    }
  }
  return result;
}

/** 回答期限を「2026年11月7日(土)」の形へ */
export function formatDeadline(date: NotionDate | null): string {
  if (!date) return UNDECIDED;
  const value = new Date(date.start);
  if (Number.isNaN(value.getTime())) return UNDECIDED;
  return dateFormatter.format(value);
}

/**
 * 回答期限までの残日数。期限が無い場合は null を返し、UI 側でカウントダウンを出さない。
 * 実在する期限だけを示すため、値を捏造しない。
 */
export function daysUntil(date: NotionDate | null, now: Date = new Date()): number | null {
  if (!date) return null;
  const target = new Date(date.start);
  if (Number.isNaN(target.getTime())) return null;
  const day = 24 * 60 * 60 * 1000;
  const toDayNumber = (value: Date) => Math.floor(value.getTime() / day);
  return toDayNumber(target) - toDayNumber(now);
}

/** 料金を「8,000円」の形へ。0 円は「無料」。 */
export function formatFee(fee: number | null): string {
  if (fee === null) return UNDECIDED;
  if (fee === 0) return "無料";
  return `${fee.toLocaleString("ja-JP")}円`;
}

/** 住所から Google マップの検索リンクを生成する。住所が無ければ null。 */
export function buildMapsUrl(address: string | null): string | null {
  if (!address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** 残席数。定員か出席人数が不明なら null。マイナスにはしない。 */
export function remainingSeats(capacity: number | null, attending: number): number | null {
  if (capacity === null) return null;
  return Math.max(0, capacity - attending);
}
