// Notion の取得に失敗したセクションだけをエラー表示にするための共通部品。
export function SectionError({ message }: { message: string }) {
  return (
    <p className="alert alert--warn" role="status">
      {message}この部分は現在表示できません。時間をおいて再読み込みしてください。
    </p>
  );
}
