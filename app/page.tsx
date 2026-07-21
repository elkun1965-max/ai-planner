"use client";

import { useEffect, useRef, useState } from "react";
import { Capture, KEYS, newId, useStored } from "@/lib/store";

export default function CapturePage() {
  const [captures, setCaptures] = useStored<Capture[]>(KEYS.captures, []);
  const [text, setText] = useState("");
  const [hint, setHint] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => setHint(""), 2600);
    return () => clearTimeout(id);
  }, [hint]);

  function save() {
    const value = text.trim();
    if (!value) return;
    setCaptures((prev) => [
      { id: newId(), text: value, createdAt: Date.now(), parsed: false },
      ...prev,
    ]);
    setText("");
    setHint("Збережено в Inbox");
    areaRef.current?.focus();
  }

  return (
    <main className="screen">
      <header className="screen-head">
        <h1 className="screen-title">Що в голові?</h1>
        <p className="screen-sub">
          Пиши потоком — розбирати на задачі будемо потім
        </p>
      </header>

      <div className="screen-body">
        <textarea
          ref={areaRef}
          className="capture-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Купити молоко, подзвонити мамі, дописати звіт до п'ятниці…"
          autoFocus
        />

        <div className="hint">{hint}</div>

        <div className="capture-actions">
          <button
            className="btn-primary"
            onClick={save}
            disabled={!text.trim()}
          >
            Зберегти
          </button>
          <button
            className="mic"
            aria-label="Диктувати"
            onClick={() => setHint("Голосовий ввід з'явиться разом з АІ")}
          >
            <MicIcon />
          </button>
        </div>
      </div>
    </main>
  );
}

function MicIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v4" />
    </svg>
  );
}
