"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ATTENDANCE_OPTIONS,
  EMPTY_RSVP,
  LIMITS,
  validateField,
  validateRsvp,
  type Attendance,
  type FieldErrors,
  type FieldName,
  type RsvpInput,
} from "@/lib/rsvp-schema";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function RsvpForm() {
  const router = useRouter();
  const [values, setValues] = useState<RsvpInput>(EMPTY_RSVP);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // 二重送信防止。state の反映を待たずに同期的に弾く。
  const submittingRef = useRef(false);

  const isSubmitting = status.kind === "submitting";

  function update<K extends FieldName>(field: K, value: RsvpInput[K]) {
    const next = { ...values, [field]: value };
    setValues(next);
    // 一度触れた項目は入力のたびに再検証し、直った時点でエラーを消す
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, next) ?? undefined }));
    }
  }

  function handleBlur(field: FieldName) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values) ?? undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const found = validateRsvp(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setTouched({
        name: true,
        email: true,
        attendance: true,
        maidenName: true,
        graduationYear: true,
        className: true,
        message: true,
      });
      setStatus({ kind: "error", message: "入力内容をご確認ください。" });
      return;
    }

    submittingRef.current = true;
    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; errors?: FieldErrors }
        | null;

      if (!response.ok || !payload?.ok) {
        if (payload?.errors) setErrors(payload.errors);
        setStatus({
          kind: "error",
          message: payload?.message ?? "送信に失敗しました。時間をおいて再度お試しください。",
        });
        return;
      }

      setValues(EMPTY_RSVP);
      setErrors({});
      setTouched({});
      setStatus({
        kind: "success",
        message: payload.message ?? "出欠を受け付けました。ありがとうございます。",
      });
      // 参加者一覧を最新化する
      router.refresh();
    } catch {
      setStatus({
        kind: "error",
        message: "通信に失敗しました。電波状況をご確認のうえ、再度お試しください。",
      });
    } finally {
      submittingRef.current = false;
    }
  }

  function errorProps(field: FieldName) {
    const message = errors[field];
    return {
      "aria-invalid": message ? true : undefined,
      "aria-describedby": message ? `${field}-error` : undefined,
      className: `field__control${message ? " field__control--invalid" : ""}`,
    };
  }

  function fieldError(field: FieldName) {
    const message = errors[field];
    if (!message) return null;
    return (
      <span className="field__error" id={`${field}-error`} role="alert">
        {message}
      </span>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field__label" htmlFor="rsvp-name">
          お名前
          <span className="field__required">必須</span>
        </label>
        <input
          id="rsvp-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={LIMITS.name}
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          onBlur={() => handleBlur("name")}
          {...errorProps("name")}
        />
        {fieldError("name")}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="rsvp-email">
          メールアドレス
          <span className="field__required">必須</span>
        </label>
        <input
          id="rsvp-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={LIMITS.email}
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          onBlur={() => handleBlur("email")}
          {...errorProps("email")}
        />
        <span className="field__hint">幹事からのご連絡にのみ使用し、サイトには表示しません。</span>
        {fieldError("email")}
      </div>

      <fieldset
        className="field"
        style={{ border: "none", margin: 0, padding: 0 }}
        aria-describedby={errors.attendance ? "attendance-error" : undefined}
      >
        <legend className="field__label" style={{ padding: 0 }}>
          出欠
          <span className="field__required">必須</span>
        </legend>
        <div className="choices">
          {ATTENDANCE_OPTIONS.map((option) => (
            <label className="choice" key={option}>
              <input
                type="radio"
                name="attendance"
                value={option}
                checked={values.attendance === option}
                onChange={() => {
                  setTouched((prev) => ({ ...prev, attendance: true }));
                  update("attendance", option as Attendance);
                }}
              />
              {option}
            </label>
          ))}
        </div>
        <span className="field__hint">
          いまは決めきれない場合も「未定」でご回答ください。あとから変更できます。
        </span>
        {fieldError("attendance")}
      </fieldset>

      <label className="checkboxField">
        <input
          type="checkbox"
          name="listed"
          checked={values.listed}
          onChange={(event) => update("listed", event.target.checked)}
        />
        <span>
          参加者一覧に名前を載せてよい
          <span className="field__hint" style={{ display: "block" }}>
            外すと一覧には一切表示されません（幹事のみが確認します）。
          </span>
        </span>
      </label>

      <details className="optionalBlock">
        <summary>
          任意の項目を入力する
          <span className="field__optional">任意</span>
        </summary>
        <div className="optionalBlock__body">
          <div className="field">
            <label className="field__label" htmlFor="rsvp-maiden">
              旧姓
            </label>
            <input
              id="rsvp-maiden"
              name="maidenName"
              type="text"
              maxLength={LIMITS.maidenName}
              value={values.maidenName}
              onChange={(event) => update("maidenName", event.target.value)}
              onBlur={() => handleBlur("maidenName")}
              {...errorProps("maidenName")}
            />
            {fieldError("maidenName")}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="rsvp-year">
              卒業年（西暦）
            </label>
            <input
              id="rsvp-year"
              name="graduationYear"
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={values.graduationYear}
              onChange={(event) => update("graduationYear", event.target.value)}
              onBlur={() => handleBlur("graduationYear")}
              {...errorProps("graduationYear")}
            />
            {fieldError("graduationYear")}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="rsvp-class">
              クラス
            </label>
            <input
              id="rsvp-class"
              name="className"
              type="text"
              maxLength={LIMITS.className}
              value={values.className}
              onChange={(event) => update("className", event.target.value)}
              onBlur={() => handleBlur("className")}
              {...errorProps("className")}
            />
            {fieldError("className")}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="rsvp-message">
              ひとことメッセージ
            </label>
            <textarea
              id="rsvp-message"
              name="message"
              maxLength={LIMITS.message}
              value={values.message}
              onChange={(event) => update("message", event.target.value)}
              onBlur={() => handleBlur("message")}
              {...errorProps("message")}
            />
            <span className="field__hint">
              一覧に掲載されます（{values.message.length} / {LIMITS.message} 文字）。
            </span>
            {fieldError("message")}
          </div>
        </div>
      </details>

      <button className="button button--block" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "送信中…" : "この内容で回答する"}
      </button>

      {/* 成功・失敗のどちらも必ず表示する */}
      <div aria-live="polite">
        {status.kind === "success" && (
          <p className="alert alert--success">{status.message}</p>
        )}
        {status.kind === "error" && <p className="alert alert--error">{status.message}</p>}
      </div>
    </form>
  );
}
