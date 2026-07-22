"use client";

import { Capture, KEYS, Priority, Task, useStored } from "@/lib/store";

const PRIORITY_LABEL: Record<Priority, string> = {
  high: "високий",
  medium: "середній",
  low: "низький",
};

export default function InboxPage() {
  const [tasks, setTasks, tasksReady] = useStored<Task[]>(KEYS.tasks, []);
  const [captures, setCaptures] = useStored<Capture[]>(KEYS.captures, []);

  const inbox = tasks.filter((t) => t.bucket === "inbox");

  function moveToToday(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, bucket: "today" as const } : t)),
    );
  }

  function removeCapture(id: string) {
    setCaptures((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <main className="screen">
      <header className="screen-head">
        <h1 className="screen-title">Inbox</h1>
        <p className="screen-sub">Розібрані задачі, які ще не заплановані</p>
      </header>

      <div className="screen-body">
        {!tasksReady ? null : inbox.length === 0 ? (
          <div className="empty">
            <div className="empty-icon" aria-hidden>
              ☰
            </div>
            <div className="empty-title">Поки порожньо</div>
            <p className="empty-text">
              Тут з&apos;являться задачі, коли АІ розбере твої нотатки з Capture.
            </p>
          </div>
        ) : (
          <ul className="list">
            {inbox.map((t) => (
              <li key={t.id} className="task">
                <div className="task-main">
                  <span className="task-title">{t.title}</span>
                  {(t.priority || t.deadline) && (
                    <div className="task-meta">
                      {t.priority && (
                        <span className={"prio " + t.priority}>
                          {PRIORITY_LABEL[t.priority]}
                        </span>
                      )}
                      {t.deadline && (
                        <span className="deadline">до {t.deadline}</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  className="task-check"
                  aria-label="На сьогодні"
                  onClick={() => moveToToday(t.id)}
                >
                  →
                </button>
              </li>
            ))}
          </ul>
        )}

        {captures.length > 0 && (
          <>
            <p className="screen-sub" style={{ marginTop: 8 }}>
              Нерозібрані нотатки · {captures.length}
            </p>
            <ul className="list">
              {captures.map((c) => (
                <li key={c.id} className="card">
                  <div className="card-text">{c.text}</div>
                  <div className="card-meta">
                    {new Date(c.createdAt).toLocaleString("uk-UA", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    <button
                      onClick={() => removeCapture(c.id)}
                      style={{ color: "var(--muted)", padding: "6px 0" }}
                    >
                      видалити
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
