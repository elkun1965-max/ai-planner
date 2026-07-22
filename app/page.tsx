"use client";

import { useEffect, useRef, useState } from "react";
import {
  Capture,
  KEYS,
  newId,
  ParsedTask,
  Task,
  useStored,
} from "@/lib/store";

export default function CapturePage() {
  const [captures, setCaptures] = useStored<Capture[]>(KEYS.captures, []);
  const [tasks, setTasks] = useStored<Task[]>(KEYS.tasks, []);
  const [text, setText] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  // Тримаємо активний розпізнавач, щоб мати змогу його зупинити.
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => setHint(""), 3200);
    return () => clearTimeout(id);
  }, [hint]);

  // Зупиняємо розпізнавання, якщо компонент розмонтовується під час запису.
  useEffect(() => () => recRef.current?.abort?.(), []);

  function saveDraft() {
    const value = text.trim();
    if (!value) return;
    setCaptures((prev) => [
      { id: newId(), text: value, createdAt: Date.now(), parsed: false },
      ...prev,
    ]);
    setText("");
    setHint("Чернетку збережено в Inbox");
    areaRef.current?.focus();
  }

  async function parse() {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setHint("АІ розбирає…");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const parsed: ParsedTask[] = Array.isArray(data.tasks) ? data.tasks : [];
      if (parsed.length === 0) {
        setHint("АІ не знайшов задач у тексті");
        return;
      }

      const now = Date.now();
      const created: Task[] = parsed.map((t, i) => ({
        id: newId(),
        title: t.title,
        done: false,
        createdAt: now + i,
        bucket: "inbox",
        priority: t.priority,
        deadline: t.deadline,
      }));
      setTasks((prev) => [...created, ...prev]);
      setText("");
      setHint(
        `Додано ${created.length} ${plural(created.length)} у Inbox`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "невідома помилка";
      setHint("Не вдалося розібрати: " + message);
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    const speechWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const Ctor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Ctor) {
      setHint("Голосовий ввід не підтримується цим браузером");
      return;
    }

    const rec = new Ctor();
    rec.lang = "uk-UA";
    rec.interimResults = true;
    rec.continuous = true;
    // Дописуємо розпізнане до вже набраного тексту.
    let base = text ? text.trimEnd() + " " : "";

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const phrase = res[0].transcript;
        if (res.isFinal) base += phrase + " ";
        else interim += phrase;
      }
      setText((base + interim).replace(/\s+/g, " ").trimStart());
    };

    rec.onerror = (event: SpeechRecognitionErrorLike) => {
      setRecording(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setHint("Немає доступу до мікрофона — дозволь його в браузері");
      } else if (event.error === "no-speech") {
        setHint("Не почув голосу, спробуй ще раз");
      } else if (event.error === "aborted") {
        /* зупинили самі — без повідомлення */
      } else {
        setHint("Помилка розпізнавання: " + event.error);
      }
    };

    rec.onend = () => setRecording(false);

    recRef.current = rec;
    try {
      rec.start();
      setRecording(true);
      setHint("Слухаю… натисни ще раз, щоб зупинити");
    } catch {
      // start() кидає, якщо вже запущено — ігноруємо.
    }
  }

  return (
    <main className="screen">
      <header className="screen-head">
        <h1 className="screen-title">Що в голові?</h1>
        <p className="screen-sub">
          Диктуй або пиши потоком — АІ розкладе на задачі
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
            onClick={parse}
            disabled={busy || !text.trim()}
          >
            {busy ? "Розбираю…" : "Розібрати на задачі"}
          </button>
          <button
            className={recording ? "mic recording" : "mic"}
            aria-label={recording ? "Зупинити диктування" : "Диктувати"}
            aria-pressed={recording}
            onClick={toggleMic}
          >
            <MicIcon />
          </button>
        </div>

        <button
          className="link-btn"
          onClick={saveDraft}
          disabled={busy || !text.trim()}
        >
          або зберегти як чернетку без АІ
        </button>
      </div>
    </main>
  );
}

function plural(n: number) {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return "задачу";
  if (d >= 2 && d <= 4 && (dd < 10 || dd >= 20)) return "задачі";
  return "задач";
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
