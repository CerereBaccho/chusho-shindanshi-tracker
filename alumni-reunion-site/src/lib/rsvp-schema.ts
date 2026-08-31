// 出欠回答の入力仕様。クライアントのインライン検証とサーバー検証で同じ規則を使う。

export const ATTENDANCE_OPTIONS = ["出席", "欠席", "未定"] as const;
export type Attendance = (typeof ATTENDANCE_OPTIONS)[number];

export type RsvpInput = {
  name: string;
  email: string;
  attendance: Attendance | "";
  maidenName: string;
  graduationYear: string;
  className: string;
  message: string;
  listed: boolean;
};

export const EMPTY_RSVP: RsvpInput = {
  name: "",
  email: "",
  attendance: "",
  maidenName: "",
  graduationYear: "",
  className: "",
  message: "",
  listed: true,
};

export const LIMITS = {
  name: 100,
  email: 254,
  maidenName: 100,
  className: 50,
  message: 200,
} as const;

/** RFC を厳密に追わず、実用上の誤入力を弾く程度のメール形式チェック */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_GRADUATION_YEAR = 1900;
const MAX_GRADUATION_YEAR = 2100;

export type FieldName = keyof RsvpInput;
export type FieldErrors = Partial<Record<FieldName, string>>;

/** 1 項目だけ検証する。フォーム側の blur 時インライン検証で使う。 */
export function validateField(field: FieldName, input: RsvpInput): string | null {
  const value = input[field];

  switch (field) {
    case "name": {
      const name = String(value).trim();
      if (!name) return "お名前を入力してください。";
      if (name.length > LIMITS.name) return `お名前は${LIMITS.name}文字以内で入力してください。`;
      return null;
    }
    case "email": {
      const email = String(value).trim();
      if (!email) return "メールアドレスを入力してください。";
      if (email.length > LIMITS.email) return "メールアドレスが長すぎます。";
      if (!EMAIL_PATTERN.test(email)) return "メールアドレスの形式が正しくありません。";
      return null;
    }
    case "attendance": {
      if (!value) return "出欠を選択してください。";
      if (!ATTENDANCE_OPTIONS.includes(value as Attendance)) return "出欠の値が不正です。";
      return null;
    }
    case "graduationYear": {
      const raw = String(value).trim();
      if (!raw) return null;
      if (!/^\d{4}$/.test(raw)) return "卒業年は西暦4桁で入力してください。";
      const year = Number(raw);
      if (year < MIN_GRADUATION_YEAR || year > MAX_GRADUATION_YEAR) {
        return "卒業年の値が正しくありません。";
      }
      return null;
    }
    case "maidenName":
      return String(value).trim().length > LIMITS.maidenName
        ? `旧姓は${LIMITS.maidenName}文字以内で入力してください。`
        : null;
    case "className":
      return String(value).trim().length > LIMITS.className
        ? `クラスは${LIMITS.className}文字以内で入力してください。`
        : null;
    case "message":
      return String(value).trim().length > LIMITS.message
        ? `メッセージは${LIMITS.message}文字以内で入力してください。`
        : null;
    default:
      return null;
  }
}

/** 必須項目を含む全体検証。サーバー側でも同じ規則で再検証する。 */
export function validateRsvp(input: RsvpInput): FieldErrors {
  const fields: FieldName[] = [
    "name",
    "email",
    "attendance",
    "graduationYear",
    "maidenName",
    "className",
    "message",
  ];
  const errors: FieldErrors = {};
  for (const field of fields) {
    const message = validateField(field, input);
    if (message) errors[field] = message;
  }
  return errors;
}

/** 受信した任意の JSON を RsvpInput の形へ正規化する */
export function normalizeRsvp(body: unknown): RsvpInput {
  const source = (body ?? {}) as Record<string, unknown>;
  const asText = (key: string) => (typeof source[key] === "string" ? (source[key] as string) : "");
  return {
    name: asText("name"),
    email: asText("email"),
    attendance: asText("attendance") as Attendance | "",
    maidenName: asText("maidenName"),
    graduationYear: asText("graduationYear"),
    className: asText("className"),
    message: asText("message"),
    listed: source.listed === true,
  };
}
