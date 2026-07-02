# コーディング規約

本ファイルはプロジェクト固有の詳細規約を定義します。CLAUDE.mdには最頻出ルールのみ記載し、詳細は本ファイルを参照させます。

## 命名規則

### ファイル名

- `kebab-case`（例: `index.html`、`study-log.json`）

### 変数名・関数名

- `camelCase`（例: `viewDate`、`loadDayState`、`renderAnalysis`）
- イベントハンドラは動詞から始める（例: `toggleTask`、`addManualTask`、`saveStartDate`）

### 定数

- `UPPER_SNAKE_CASE`（例: `PHASES`、`TIPS`）
- モジュールスコープのトップレベルに配置する

### localStorageキー

- `prefix:suffix` 形式（例: `day:20260422`、`start-date`、`notif-time`）
- 新規キーを追加するときは `docs/architecture.md` のキー設計表に追記する

## コードスタイル

### インデント

- スペース2つ（タブ不使用）

### 行長

- 120文字以内を目安とする

### セミコロン

- 必須（省略禁止）

### 文字列

- シングルクォート（`'`）を基本とする。HTMLテンプレートリテラル内はバッククォート可

## コメント

- 「なぜ」を書き、「何を」はコードで表現する
- TODO は `TODO(yyyy-mm-dd): 内容` 形式で日付必須
- コメントは日本語統一（英語との混在禁止）

## HTML

### 構造

- タブは3つ（ホーム・分析・設定）。タブIDは `page-home`、`page-analysis`、`page-settings`
- 各タブのルートは `<div class="page" id="page-xxx">` で統一
- JS から操作する要素には必ず `id` を付ける

### CSS変数

- 色・サイズはすべて `:root` の CSS 変数で管理する（直値の色コード禁止）
- 変数名は `--bg`（背景）、`--text`（テキスト）、`--accent`（アクセント）等の既存命名に合わせる
- ダークモードは `@media (prefers-color-scheme: dark)` で `:root` 変数を上書きする

### XSS対策

- 動的にDOMへ挿入するユーザー入力は必ず `escHtml()` でサニタイズする
- `innerHTML` へのユーザー入力直接代入は禁止

## JavaScript

### DOM操作

- `document.getElementById()` を優先する（`querySelector` は複合セレクタが必要な場合のみ）
- `innerHTML` の差し替えはセクション単位で行う（個別要素のパッチ禁止・`render()` 全体を呼ぶ）

### エラーハンドリング

- `localStorage` の読み書きは `try/catch` でラップし、デフォルト値を返す
- ユーザー向けエラーは `console.error` ではなく画面表示する

### イベント

- インラインの `onclick` 属性は既存コード（タブ切替・日付ナビなど）に限り許容する
- 新規追加する動的要素のイベントは `addEventListener` で登録する

## Git運用

### コミットメッセージ

Conventional Commits 形式（`type(scope): subject`）を採用します。

- `feat`: 機能追加
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `refactor`: 挙動を変えないコード整理
- `test`: テストの追加・修正
- `chore`: ビルド、依存関係、雑務
- `ci`: CI設定変更

本文は日本語で記述し、「なぜこの変更が必要か」を1〜3行で説明します。

### ブランチ名

- `feature/xxx`、`fix/xxx`、`docs/xxx`

### Pull Request

- マージ戦略: squash merge（履歴をきれいに保つ）
