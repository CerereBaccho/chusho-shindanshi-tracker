"""
第1章 財務諸表 の問題をClaude APIで抽出してJSONに変換するスクリプト
"""
import anthropic
import base64
import json
import os
from pathlib import Path

client = anthropic.Anthropic()

# 第1章: PDFページ20-32 (ファイル名 page_020.png〜page_032.png)
CHAPTER1_PAGES = list(range(20, 33))
PAGES_DIR = Path("data/tmp_pages")
OUTPUT_PATH = Path("data/questions/bookkeeping3_chapter1.json")


def load_image_base64(page_num: int) -> str:
    path = PAGES_DIR / f"page_{page_num:03d}.png"
    with open(path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def extract_questions() -> dict:
    # 全ページをまとめてAPIに送信
    content = []

    content.append({
        "type": "text",
        "text": (
            "以下は日商簿記3級問題集「基本編 第1章 財務諸表（貸借対照表と損益計算書）」の"
            "PDFページ画像です（問題1-1〜1-6）。\n\n"
            "各問題を読み取り、以下のJSON形式で全問題を抽出してください。\n\n"
            "出力形式（純粋なJSONのみ。説明文は不要）:\n"
            "{\n"
            '  "meta": {\n'
            '    "subject": "日商簿記3級",\n'
            '    "section": "基本編",\n'
            '    "chapter": 1,\n'
            '    "chapterTitle": "財務諸表（貸借対照表と損益計算書）",\n'
            '    "source": "簿記３級問題集",\n'
            '    "createdAt": "2026-04-22"\n'
            "  },\n"
            '  "questions": [\n'
            "    {\n"
            '      "id": "1-1",\n'
            '      "title": "財務諸表の基礎知識",\n'
            '      "type": "fill-in",\n'
            "      // typeは fill-in / table-creation / classification / comprehensive のいずれか\n"
            '      "text": "問題文（資料・条件を含む）",\n'
            '      "subQuestions": [\n'
            "        // 問1・問2など複数設問がある場合のみ。単問の場合は空配列\n"
            '        {"no": "問1", "text": "設問文"}\n'
            "      ],\n"
            '      "answer": {\n'
            '        "description": "解答の概要説明",\n'
            '        "items": [\n'
            "          // fill-inなら {\"no\": 1, \"value\": \"財政状態\"}\n"
            "          // table-creationなら行データのリスト\n"
            "          // classificationなら {\"category\": \"借方\", \"items\": [\"①\",\"④\"]}\n"
            "        ]\n"
            "      },\n"
            '      "points": ["ポイント1", "ポイント2"],\n'
            '      "tags": ["財務諸表", "貸借対照表"]\n'
            "    }\n"
            "  ]\n"
            "}\n\n"
            "注意事項:\n"
            "- 問題文・解答・ポイントはすべて正確に読み取ること\n"
            "- 表形式の解答は items 配列で行ごとに表現すること\n"
            "- 金額は数値のまま（カンマなし）\n"
            "- JSONのみ出力すること（前後の説明文・コードブロック記法は不要）"
        )
    })

    for page_num in CHAPTER1_PAGES:
        img_b64 = load_image_base64(page_num)
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": img_b64,
            }
        })

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        messages=[{"role": "user", "content": content}]
    )

    raw = response.content[0].text.strip()

    # コードブロック記法を除去
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])

    return json.loads(raw)


def main():
    print("Claude APIで第1章を抽出中...")
    data = extract_questions()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    q_count = len(data.get("questions", []))
    print(f"完了: {q_count}問を {OUTPUT_PATH} に保存しました")


if __name__ == "__main__":
    main()
