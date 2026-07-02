# トラブルシューティング

Claude Codeの運用中に発生したエラーと対処法を記録します。同じ問題が再発したときにここを参照してください。

新しいエラーが発生したら、解決後に必ず以下のフォーマットで追記します。週次の棚卸しで同じエラーが2週以上続く場合は `CLAUDE.md` のルールへ昇格させます。

---

## 記載フォーマット

```
### エラー名または症状の一言説明

**発生状況**: どんな操作をしたときに起きたか
**エラーメッセージ**: 表示されたメッセージをそのままコピー
**原因**: なぜ起きたか
**対処法**: どう解決したか (コマンドがあれば記載)
**再発防止**: CLAUDE.mdやsettings.jsonへの反映有無
```

---

## リンター関連

> リンターとは: コードや文章の「書き方の誤り」を自動で指摘してくれるツールのことです。

### markdownlint: 対象ファイルが見つからない

**発生状況**: `markdownlint "**/*.md"` を実行したとき  
**エラーメッセージ**: `No files matching the pattern were found`  
**原因**: カレントディレクトリ (現在作業中のフォルダ) にMarkdownファイルが存在しないか、パスの指定が誤っている  
**対処法**:
```powershell
# Markdownファイルの存在を確認する
Get-ChildItem -Recurse -Filter "*.md"

# サブフォルダ(下位フォルダ)にある場合はパスを絞る
markdownlint "docs/**/*.md"
```
**再発防止**: CLAUDE.mdの検証コマンドに対象パスを明示する

---

### textlint: 設定ファイルが見つからない

**発生状況**: `textlint "**/*.md"` を実行したとき  
**エラーメッセージ**: `No textlintrc found` または `Cannot find module`  
**原因**: textlintの設定ファイル (`.textlintrc.json`) がプロジェクト直下にない  
**対処法**:
```powershell
# 1. 設定ファイルを作成する
New-Item .textlintrc.json
# 2. 以下の内容を貼り付けて保存する
```
```json
{
  "rules": {
    "ja-no-redundant-expression": true,
    "no-doubled-joshi": true
  }
}
```
```powershell
# 3. ルールをインストールする (npm: JavaScriptのパッケージ管理ツール)
npm install --save-dev textlint textlint-rule-ja-no-redundant-expression textlint-rule-no-doubled-joshi
```
**再発防止**: プロジェクトテンプレートに `.textlintrc.json` の雛形を追加する (タスク4-1 Skill化候補)

---

### PSScriptAnalyzer: コマンドが認識されない

**発生状況**: `Invoke-ScriptAnalyzer` を実行したとき  
**エラーメッセージ**: `The term 'Invoke-ScriptAnalyzer' is not recognized`  
**原因**: PSScriptAnalyzerモジュールがPCにインストールされていない  
**対処法**:
```powershell
# モジュールをインストールする (初回のみ実行すればよい)
# -Scope CurrentUser: このPCのログイン中のユーザーのみに適用する設定
Install-Module -Name PSScriptAnalyzer -Scope CurrentUser -Force

# インストール後、確認する
Get-Module -ListAvailable PSScriptAnalyzer
```
**再発防止**: README の初期セットアップ手順にインストールコマンドを追記する

---

## Permission (権限) 関連

> Permissionとは: Claude Codeがどのコマンドを実行してよいかを制御する設定のことです。`settings.json` で管理します。

### settings.json の deny ルールで意図しないコマンドがブロックされた

**発生状況**: 通常の作業コマンドを実行しようとしたときにブロックされた  
**エラーメッセージ**: `Permission denied` または `This command is not allowed`  
**原因**: `deny` リストのパターンが広すぎて、無害なコマンドまで引っかかっている  
**対処法**:
1. `%USERPROFILE%\.claude\settings.json` を開いて `deny` セクションを確認する
2. ブロックされたコマンドが本当に危険か判断する
3. 安全なコマンドであれば、プロジェクト別の `.claude\settings.json` の `allow` に追加する
4. `deny` パターンが広すぎる場合はより具体的な文字列に書き換える

**再発防止**: `deny` パターンを変更したら変更内容をこのファイルに記録する

---

### secrets/ 配下のテスト用ファイルが読み取れない

**発生状況**: テスト用の一時ファイルを `secrets/` フォルダに置いたところ Claude Code が読み取れなかった  
**原因**: `.claudeignore` または `.gitignore` で `secrets/` 配下が除外対象になっている  
**対処法**: テスト用ファイルを `secrets/` 以外のフォルダ (例: `tests/fixtures/`) に移動する  
**再発防止**: `secrets/` フォルダは機密情報専用とし、テストデータは置かないルールをCLAUDE.mdに追記する

---

## Windows 環境固有

### PowerShell 実行ポリシーでスクリプトがブロックされた

> 実行ポリシーとは: Windowsがスクリプトファイル (.ps1) の実行を許可するかどうかを制御するセキュリティ設定のことです。

**発生状況**: PowerShellスクリプト (`.ps1` ファイル) を実行しようとしたとき  
**エラーメッセージ**: `cannot be loaded because running scripts is disabled on this system`  
**原因**: Windowsの実行ポリシーがスクリプト実行を禁止している  
**対処法**:
```powershell
# 現在の設定を確認する
Get-ExecutionPolicy

# 現在のユーザーのみスクリプト実行を許可する
# RemoteSigned: 自分で作ったスクリプトは実行可、インターネットからダウンロードしたものは署名が必要
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
**注意**: `Unrestricted` や `Bypass` には設定しない。`RemoteSigned` が安全な最小設定です。  
**再発防止**: README の初期セットアップ手順に追記する

---

*最終更新: 2026-04-22 (フェーズ3 タスク3-4 初版作成)*
