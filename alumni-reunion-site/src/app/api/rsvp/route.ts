// 出欠回答の受け口。Notion への書き込みはこのサーバー側ルートでのみ行う。
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getDatabaseId, getNotionClient, NotionConfigError } from "@/lib/notion";
import { normalizeRsvp, validateRsvp, type RsvpInput } from "@/lib/rsvp-schema";

export const runtime = "nodejs";
// 回答は常に即時処理する
export const dynamic = "force-dynamic";

/** 空文字を送らないよう、値があるときだけ rich_text プロパティを組み立てる */
function richText(value: string) {
  return { rich_text: [{ type: "text" as const, text: { content: value } }] };
}

function buildProperties(input: RsvpInput) {
  const properties: Record<string, unknown> = {
    氏名: { title: [{ type: "text", text: { content: input.name.trim() } }] },
    メールアドレス: { email: input.email.trim() },
    出欠: { select: { name: input.attendance } },
    一覧掲載可否: { checkbox: input.listed },
  };

  const maidenName = input.maidenName.trim();
  if (maidenName) properties["旧姓"] = richText(maidenName);

  const className = input.className.trim();
  if (className) properties["クラス"] = richText(className);

  const message = input.message.trim();
  if (message) properties["ひとことメッセージ"] = richText(message);

  const graduationYear = input.graduationYear.trim();
  if (graduationYear) properties["卒業年"] = { number: Number(graduationYear) };

  return properties;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }

  const input = normalizeRsvp(body);
  const errors = validateRsvp(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, message: "入力内容をご確認ください。", errors },
      { status: 400 },
    );
  }

  try {
    const notion = getNotionClient();
    await notion.pages.create({
      parent: { database_id: getDatabaseId("rsvp") },
      // Notion SDK の型は動的なプロパティ名を表現できないためキャストする
      properties: buildProperties(input) as never,
    });
  } catch (error) {
    if (error instanceof NotionConfigError) {
      console.error("[rsvp] 設定不足のため保存できません", error);
      return NextResponse.json(
        { ok: false, message: "サーバー側の設定が未完了のため保存できませんでした。幹事へご連絡ください。" },
        { status: 503 },
      );
    }
    console.error("[rsvp] Notion への保存に失敗しました", error);
    return NextResponse.json(
      { ok: false, message: "送信に失敗しました。時間をおいて再度お試しください。" },
      { status: 502 },
    );
  }

  // 参加者一覧のキャッシュを破棄し、次の表示で反映させる
  revalidateTag("attendees");

  return NextResponse.json({
    ok: true,
    message: "出欠を受け付けました。ありがとうございます。",
  });
}
