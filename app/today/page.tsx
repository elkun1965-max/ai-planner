"use client";

import { KEYS, Task, useStored } from "@/lib/store";

export default function TodayPage() {
  const [tasks, setTasks, ready] = useStored<Task[]>(KEYS.tasks, []);

  const today = tasks.filter((t) => t.bucket === "today");
  const left = today.filter((t) => !t.done).length;

  function toggle(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  return (
    <main className="screen">
      <header className="screen-head">
        <h1 className="screen-title">Today</h1>
        <p className="screen-sub">
          {today.length === 0
            ? new Date().toLocaleDateString("uk-UA", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : `Лишилось ${left} з ${today.length}`}
        </p>
      </header>

      <div className="screen-body">
        {!ready ? null : today.length === 0 ? (
          <div className="empty">
            <div className="empty-icon" aria-hidden>
              ✓
            </div>
            <div className="empty-title">На сьогодні нічого</div>
            <p className="empty-text">
              Перекинь сюди задачі з Inbox — або почни з Capture і вивантаж, що
              в голові.
            </p>
          </div>
        ) : (
          <ul className="list">
            {today.map((t) => (
              <li key={t.id} className={t.done ? "task done" : "task"}>
                <button
                  className={t.done ? "task-check done" : "task-check"}
                  aria-label={t.done ? "Повернути" : "Виконано"}
                  onClick={() => toggle(t.id)}
                >
                  ✓
                </button>
                <span className="task-title">{t.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
