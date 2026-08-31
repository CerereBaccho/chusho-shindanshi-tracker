import type { Metadata } from "next";
import { SectionError } from "@/components/SectionError";
import { RsvpForm } from "@/components/RsvpForm";
import { getAttendees } from "@/lib/attendees";
import { getEvent, type EventInfo } from "@/lib/event";
import {
  UNDECIDED,
  buildMapsUrl,
  daysUntil,
  formatDeadline,
  formatEventDate,
  formatFee,
  remainingSeats,
} from "@/lib/format";

// 60 秒ごとに再生成し、Notion API の呼び出し回数を抑える
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const event = await getEvent();
  const name = event.ok ? event.data?.name : null;
  return { title: name ?? "同窓会のご案内" };
}

/** 値が無い項目は「未定」と明示し、推測で埋めない */
function Value({ value }: { value: string | null }) {
  if (!value) return <span className="undecided">{UNDECIDED}</span>;
  return <>{value}</>;
}

function Fact({ label, value }: { label: string; value: string }) {
  const isUndecided = value === UNDECIDED;
  return (
    <li className="fact">
      <span className="fact__label">{label}</span>
      <span className={`fact__value${isUndecided ? " fact__value--undecided" : ""}`}>{value}</span>
    </li>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="details__row">
      <dt className="details__label">{label}</dt>
      <dd className="details__value">{children}</dd>
    </div>
  );
}

export default async function Page() {
  const [eventResult, attendeeResult] = await Promise.all([getEvent(), getAttendees()]);

  const event: EventInfo | null = eventResult.ok ? eventResult.data : null;
  const attendees = attendeeResult.ok ? attendeeResult.data : null;

  const attendingCount = attendees?.attendingCount ?? null;
  const seatsLeft =
    attendingCount === null ? null : remainingSeats(event?.capacity ?? null, attendingCount);
  const remainingDays = daysUntil(event?.deadline ?? null);
  const mapsUrl = buildMapsUrl(event?.address ?? null);

  const hasStatusBar =
    attendingCount !== null || seatsLeft !== null || remainingDays !== null;

  return (
    <>
      <header className="hero">
        <div className="container">
          <p className="hero__eyebrow">Reunion</p>
          <h1 className="hero__title">
            <Value value={event?.name ?? null} />
          </h1>
          {event?.lead && <p className="hero__lead">{event.lead}</p>}

          {/* 日時・場所・料金をファーストビューに置く */}
          <ul className="factGrid">
            <Fact label="日時" value={formatEventDate(event?.startAt ?? null)} />
            <Fact label="場所" value={event?.venue ?? UNDECIDED} />
            <Fact label="料金" value={formatFee(event?.fee ?? null)} />
          </ul>

          <a className="button button--hero" href="#rsvp">
            出欠を回答する
          </a>
        </div>
      </header>

      {!eventResult.ok && (
        <div className="container" style={{ paddingTop: "1.25rem" }}>
          <SectionError message={eventResult.error} />
        </div>
      )}

      {eventResult.ok && !event && (
        <div className="container" style={{ paddingTop: "1.25rem" }}>
          <p className="alert alert--warn" role="status">
            開催情報がまだ公開されていません。決まりしだいこのページに掲載します。
          </p>
        </div>
      )}

      {hasStatusBar && (
        <section className="statusBar" aria-label="回答状況">
          <div className="container">
            <ul className="statusBar__list">
              {attendingCount !== null && (
                <li>
                  <span className="statusBar__value">{attendingCount}名</span>
                  <span className="statusBar__label">出席と回答済み</span>
                </li>
              )}
              {seatsLeft !== null && (
                <li>
                  <span className="statusBar__value">残り{seatsLeft}席</span>
                  <span className="statusBar__label">定員{event?.capacity}名</span>
                </li>
              )}
              {remainingDays !== null && (
                <li>
                  <span className="statusBar__value">
                    {remainingDays >= 0 ? `あと${remainingDays}日` : "受付期限超過"}
                  </span>
                  <span className="statusBar__label">
                    {remainingDays >= 0 ? "回答期限まで" : "遅れてもご相談ください"}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </section>
      )}

      <section className="section" id="details">
        <div className="container">
          <h2 className="section__title">開催概要</h2>
          <div className="card">
            <dl className="details">
              <DetailRow label="日時">{formatEventDate(event?.startAt ?? null)}</DetailRow>
              <DetailRow label="会場">
                <Value value={event?.venue ?? null} />
                {event?.address && <span className="details__note">{event.address}</span>}
                {mapsUrl && (
                  <a className="mapLink" href={mapsUrl} target="_blank" rel="noreferrer noopener">
                    Google マップで開く →
                  </a>
                )}
                {!event?.address && (
                  <span className="details__note undecided">住所：{UNDECIDED}</span>
                )}
              </DetailRow>
              <DetailRow label="料金">
                {formatFee(event?.fee ?? null)}
                {event?.feeNote && <span className="details__note">{event.feeNote}</span>}
              </DetailRow>
              <DetailRow label="回答期限">{formatDeadline(event?.deadline ?? null)}</DetailRow>
              <DetailRow label="定員">
                {event?.capacity !== null && event?.capacity !== undefined
                  ? `${event.capacity}名`
                  : UNDECIDED}
              </DetailRow>
              <DetailRow label="服装">
                <Value value={event?.dressCode ?? null} />
              </DetailRow>
            </dl>
          </div>
        </div>
      </section>

      <section className="section section--muted" id="attendees">
        <div className="container">
          <h2 className="section__title">参加するみなさん</h2>
          <p className="section__lead">
            掲載を許可してくださった方のみ表示しています。
          </p>
          {!attendeeResult.ok ? (
            <SectionError message={attendeeResult.error} />
          ) : attendees && attendees.listed.length > 0 ? (
            <ul className="attendees">
              {attendees.listed.map((attendee) => (
                <li className="attendee" key={attendee.id}>
                  <span className="attendee__name">{attendee.name}</span>
                  {(attendee.maidenName || attendee.graduationYear || attendee.className) && (
                    <span className="attendee__meta">
                      {" "}
                      {[
                        attendee.maidenName ? `旧姓 ${attendee.maidenName}` : null,
                        attendee.graduationYear ? `${attendee.graduationYear}年卒` : null,
                        attendee.className,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </span>
                  )}
                  {attendee.message && <p className="attendee__message">{attendee.message}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">
              まだ表示できる参加者がいません。最初のひとりになってみませんか。
            </p>
          )}
        </div>
      </section>

      <section className="section" id="rsvp">
        <div className="container">
          <h2 className="section__title">出欠のご回答</h2>
          <p className="section__lead">
            必須はお名前・メールアドレス・出欠の3つだけです。1分ほどで終わります。
          </p>
          <div className="card">
            <RsvpForm />
          </div>
        </div>
      </section>

      <section className="section section--muted" id="hesitating">
        <div className="container">
          <h2 className="section__title">参加を迷っている方へ</h2>
          <ul className="faq">
            <li className="faq__item">
              <h3 className="faq__question">ひとりで行っても大丈夫ですか？</h3>
              <p className="faq__answer">
                大丈夫です。ひとりで来られる方が大半です。受付で幹事がお席までご案内します。
              </p>
            </li>
            <li className="faq__item">
              <h3 className="faq__question">まだ予定がはっきりしません。</h3>
              <p className="faq__answer">
                「未定」でご回答ください。人数の目安になりますし、あとから変更していただけます。
              </p>
            </li>
            <li className="faq__item">
              <h3 className="faq__question">会費には何が含まれますか？</h3>
              <p className="faq__answer">
                {event?.feeNote ?? "内訳は決まりしだい、この欄に掲載します。"}
              </p>
            </li>
            <li className="faq__item">
              <h3 className="faq__question">回答期限を過ぎてしまいました。</h3>
              <p className="faq__answer">
                期限を過ぎてからでも、まずは幹事までご相談ください。できる範囲で調整します。
              </p>
            </li>
          </ul>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <h2 className="footer__title">幹事より</h2>
          <p className="footer__row">
            幹事：<Value value={event?.organizers ?? null} />
          </p>
          <p className="footer__row">
            お問い合わせ：
            {event?.contact ? (
              <a href={`mailto:${event.contact}`}>{event.contact}</a>
            ) : (
              <span className="undecided">{UNDECIDED}</span>
            )}
          </p>
          <p className="footer__row">
            キャンセルについて：<Value value={event?.cancellationPolicy ?? null} />
          </p>
          <p className="footer__row">
            いただいた個人情報は本会の運営にのみ使用します。メールアドレスは公開しません。
          </p>
        </div>
      </footer>

      {/* モバイルでは CTA を常時表示する */}
      <div className="stickyCta">
        <a className="button button--block" href="#rsvp">
          出欠を回答する
        </a>
      </div>
    </>
  );
}
