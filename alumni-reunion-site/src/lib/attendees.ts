// 「同窓会 出欠回答」DB の読み込み。
import "server-only";
import { unstable_cache } from "next/cache";
import {
  getDatabaseId,
  getNotionClient,
  readCheckbox,
  readCreatedTime,
  readNumber,
  readSelect,
  readText,
  toResult,
  type Result,
} from "./notion";

/** 参加者一覧に載せる 1 名分。掲載を許可した出席者のみが対象。 */
export type Attendee = {
  id: string;
  name: string;
  maidenName: string | null;
  graduationYear: number | null;
  className: string | null;
  message: string | null;
  answeredAt: string | null;
};

export type AttendeeSummary = {
  /** 掲載を許可した出席者（表示用） */
  listed: Attendee[];
  /** 出席と回答した総数（掲載可否を問わない。人数カウント用） */
  attendingCount: number;
};

const ATTENDING = "出席";

/** 出席かつ掲載可の回答のみを取得する。掲載可否のチェックは表示直前でも再確認する。 */
async function fetchAttendees(): Promise<AttendeeSummary> {
  const notion = getNotionClient();
  const databaseId = getDatabaseId("rsvp");

  const listed: Attendee[] = [];
  let attendingCount = 0;
  let cursor: string | undefined = undefined;

  // 出席者は全件走査して人数を数える（1 ページ 100 件）
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: { property: "出欠", select: { equals: ATTENDING } },
      sorts: [{ property: "回答日時", direction: "ascending" }],
      start_cursor: cursor,
      page_size: 100,
    });

    for (const page of response.results) {
      const props = (page as { properties?: Record<string, unknown> }).properties ?? {};
      if (readSelect(props, "出欠") !== ATTENDING) continue;
      attendingCount += 1;

      // 一覧掲載を許可していない回答者は、氏名もメッセージも一切表示しない
      if (!readCheckbox(props, "一覧掲載可否")) continue;
      const name = readText(props, "氏名");
      if (!name) continue;

      listed.push({
        id: (page as { id: string }).id,
        name,
        maidenName: readText(props, "旧姓"),
        graduationYear: readNumber(props, "卒業年"),
        className: readText(props, "クラス"),
        message: readText(props, "ひとことメッセージ"),
        answeredAt: readCreatedTime(props, "回答日時"),
      });
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return { listed, attendingCount };
}

/** 参加者一覧も 60 秒キャッシュする。回答送信時にタグで無効化する。 */
const getCachedAttendees = unstable_cache(fetchAttendees, ["alumni-attendees"], {
  revalidate: 60,
  tags: ["attendees"],
});

export function getAttendees(): Promise<Result<AttendeeSummary>> {
  return toResult(getCachedAttendees);
}
