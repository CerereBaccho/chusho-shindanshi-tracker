# 同窓会 特設サイト（alumni-reunion-site）

高校の同窓会の特設サイトです。**イベント情報（日時・場所・料金など）と参加者一覧を Notion から読み込み**、
**出欠回答を Notion へ書き込み**ます。日時・場所・料金はコードに一切埋め込まれておらず、
Notion に値が無い項目は「未定」と表示されます。

## 技術スタック

| 項目 | 採用 |
|---|---|
| フレームワーク | Next.js 15（App Router） |
| 言語 | TypeScript |
| Notion 連携 | `@notionhq/client` |
| スタイル | 素の CSS（`src/app/globals.css` の CSS 変数で色・サイズを一元管理） |

## 環境変数

`.env.example` をコピーして `.env.local` を作り、値を入れてください。
`.env.local` は `.gitignore` によりコミットされません。**トークンは絶対にコミットしないでください。**

```bash
cp .env.example .env.local
```

| 変数名 | 内容 |
|---|---|
| `NOTION_TOKEN` | Notion インテグレーションの内部シークレット（`ntn_` で始まる文字列） |
| `NOTION_EVENT_DB_ID` | 「同窓会 イベント情報」データベースの ID |
| `NOTION_RSVP_DB_ID` | 「同窓会 出欠回答」データベースの ID |

いずれもサーバー側でのみ読み込まれます（`src/lib/notion.ts` が `server-only` を import しているため、
クライアントバンドルへ混入するとビルドが失敗します）。

## Notion インテグレーションの設定手順

1. <https://www.notion.so/my-integrations> で「新しいインテグレーション」を作成する。
   - 種類：**内部インテグレーション**
   - 機能：**コンテンツを読み取る** と **コンテンツを挿入する** を有効にする
2. 発行された「内部インテグレーションシークレット」を `.env.local` の `NOTION_TOKEN` に貼る。
3. Notion で「同窓会 イベント情報」DB を開き、右上の `…` →「接続」→ 手順1で作ったインテグレーションを追加する。
4. 「同窓会 出欠回答」DB についても同じく接続を追加する。
5. 各 DB の URL からデータベース ID（`https://www.notion.so/<ワークスペース>/<ここが32桁のID>?v=...`）を取り出し、
   `NOTION_EVENT_DB_ID` / `NOTION_RSVP_DB_ID` に設定する。

### イベント情報 DB のプロパティ

| プロパティ | 型 | 用途 |
|---|---|---|
| イベント名 | title | 見出し |
| リード文 | rich_text | ヒーローのキャッチコピー |
| 開催日時 | date | 日時表示（時刻・範囲に対応） |
| 会場名 | rich_text | 会場表示 |
| 住所 | rich_text | Google マップリンクの生成元 |
| 料金 | number | 料金表示 |
| 料金補足 | rich_text | 会費の内訳・割引などの注記 |
| 回答期限 | date | 残日数の表示 |
| 定員 | number | 残席数の算出 |
| 幹事名 | rich_text | フッターに表示 |
| 連絡先 | email | 問い合わせ先 |
| キャンセル規定 | rich_text | フッターに表示 |
| ドレスコード | rich_text | 服装欄 |
| 公開 | checkbox | **チェックが付いた1件だけ**がサイトに表示される |

### 出欠回答 DB のプロパティ

| プロパティ | 型 | 用途 |
|---|---|---|
| 氏名 | title | 回答者名（必須） |
| 旧姓 | rich_text | 任意 |
| 卒業年 | number | 任意 |
| クラス | rich_text | 任意 |
| 出欠 | select（出席 / 欠席 / 未定） | 集計 |
| メールアドレス | email | 連絡用。**サイトには表示しない** |
| 一覧掲載可否 | checkbox | **true のときだけ**参加者一覧に載る |
| ひとことメッセージ | rich_text | 参加者一覧に掲載 |
| 回答日時 | created_time | 並び順・重複判定 |

## ローカルでの起動

```bash
npm install          # 依存パッケージの導入
npm run dev          # 開発サーバー（http://localhost:3000）
npm run typecheck    # 型チェック
npm run build        # 本番ビルド
npm run start        # 本番ビルドの起動
```

Notion の設定前でもサイトは起動します。その場合、日時・場所・料金は「未定」と表示され、
該当セクションにのみ取得エラーの注意書きが出ます（サイト全体は落ちません）。

## 実装メモ

- **キャッシュ**：イベント情報・参加者一覧は `unstable_cache` で 60 秒キャッシュし、Notion の API 制限に配慮しています。
  出欠が送信されると `revalidateTag("attendees")` で参加者一覧のキャッシュを破棄します。
- **障害時の挙動**：Notion の呼び出しは `Result` 型に畳み込まれ、失敗したセクションだけがエラー表示になります。
- **参加者一覧**：`出欠 = 出席` かつ `一覧掲載可否 = true` の回答のみを表示します。
  掲載を許可していない方は、氏名もメッセージも一切表示されません。
- **公開範囲**：限定 URL 運用を前提に、`X-Robots-Tag: noindex, nofollow` と `robots` メタタグを付与しています。
  URL を知っている人は誰でも閲覧できるため、共有先にはご注意ください。

## ディレクトリ構成

```
src/
├── app/
│   ├── api/rsvp/route.ts   # 出欠回答の受け口（Notion への書き込み）
│   ├── globals.css         # 全体スタイル（CSS 変数で色・サイズを管理）
│   ├── layout.tsx          # ルートレイアウト、noindex メタ
│   └── page.tsx            # 特設サイト本体
├── components/
│   ├── RsvpForm.tsx        # 出欠フォーム（インライン検証・二重送信防止）
│   └── SectionError.tsx    # セクション単位のエラー表示
└── lib/
    ├── attendees.ts        # 参加者一覧の取得
    ├── event.ts            # イベント情報の取得
    ├── format.ts           # 日時・料金・地図リンクの整形
    ├── notion.ts           # Notion クライアントとプロパティ読み取り
    └── rsvp-schema.ts      # 入力仕様（クライアント／サーバー共通）
```
