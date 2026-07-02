# 中小企業診断士 学習トラッカー

本ファイルはプロジェクト固有の作業ルールと文脈を定義します。ユーザー全体の `%USERPROFILE%\.claude\CLAUDE.md` を継承し、本ファイルの記述が優先されます。詳細仕様は `docs/` 配下に分割配置し、本ファイルは目次として機能させます（段階的開示）。

## プロジェクト概要

- 目的: 中小企業診断士試験の学習を管理するトラッカー。平日22:00-23:00の1時間学習・2026〜2028年2年計画に対応
- 対象: 個人利用（ブラウザで開くだけで動作）
- 成果物: `index.html`（単一ファイル SPA）

## カテゴリ

- [x] その他: 個人学習ツール

## ディレクトリ構成

```
./
├── CLAUDE.md              # 本ファイル（目次）
├── index.html             # アプリ本体（HTML/CSS/JS を1ファイルに内包）
├── .claude/
│   └── settings.json      # 権限設定
├── .claudeignore
├── .gitignore
├── .textlintrc.json
├── data/
│   ├── pdf/               # 原本 PDF（問題集・テキスト等）
│   └── questions/         # PDF から変換した問題データ（JSON）
│       └── schema.example.json  # JSON スキーマのサンプル
└── docs/
    ├── architecture.md    # 設計判断、全体構成
    ├── conventions.md     # コーディング規約、命名規則
    ├── glossary.md        # 用語集
    ├── lessons-learned.md # 失敗パターン DB
    └── troubleshooting.md # 頻出エラーと対処法
```

## 技術スタック

- 言語: HTML5 / CSS3 / JavaScript (ES2020)
- フレームワーク: なし（Vanilla JS）
- データ永続化: `localStorage`（外部サーバー不要）
- 通知: Web Notifications API
- バンドラー: なし（単一ファイル配布）

## 検証コマンド

作業後は以下のコマンドで必ず検証します。コマンド失敗時は原因を特定してから次の作業へ進みます。

### 共通

```bash
# 変更ファイルの確認
git status

# 差分確認
git diff
```

### Markdown ドキュメント

```powershell
# Markdown の書き方チェック
markdownlint "docs/**/*.md"

# 日本語文書の表記ゆれ・文法チェック
textlint "docs/**/*.md"
```

### HTML

```bash
# ブラウザで直接開いて動作確認（サーバー不要）
# index.html をダブルクリック、または以下でローカルサーバーを立てる
python -m http.server 8080
```

## コーディング規約

詳細は `docs/conventions.md` を参照します。最頻出ルールのみ記載します。

- 関数名・変数名は `camelCase`、定数は `UPPER_SNAKE_CASE`
- CSS 変数（`:root` の `--var`）で色・サイズを一元管理し、直値の色コードを禁止
- コメントは日本語統一（1ファイル内での混在禁止）
- `localStorage` キーは `prefix:suffix` 形式（例: `day:20260422`）

## 用語

プロジェクト固有の用語は `docs/glossary.md` で管理します。略語は初出時に正式名称を併記します。

## 作業ルール

### ブランチ戦略

- `main` を保護ブランチとし、直接 push 禁止
- 機能追加は `feature/xxx`、バグ修正は `fix/xxx`

### コミット粒度

- 1コミット1目的、動作する単位で区切る

### Pull Request

- タイトルは Conventional Commits 形式（`feat:`, `fix:` 等）
- 変更の意図（なぜ）を本文に1〜3行で記述

## 禁止事項

以下の操作は本プロジェクトで禁止します。必要が生じた場合はユーザーへ確認します。

- 認証情報、API キー、トークンをコードやコミットに含めること
- `.env` ファイル、`credentials/`、`secrets/` 配下のファイルをコンテキストに読み込むこと
- 本番環境への直接的な変更操作
- `main` ブランチへの直接 push

## MCPサーバー利用範囲

本プロジェクトでは MCP サーバーは使用しません。

## 参照

- 設計判断: `docs/architecture.md`
- コーディング規約: `docs/conventions.md`
- 用語集: `docs/glossary.md`
- 頻出エラー: `docs/troubleshooting.md`
- 失敗記録: `docs/lessons-learned.md`
