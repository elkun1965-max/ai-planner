# АІ-планер дня

Mobile-first todo-застосунок: вивантажуєш усе, що в голові, — далі це стає
структурованими задачами. Це **каркас**: три екрани, навігація, локальне
сховище. АІ-розбору поки немає.

## Екрани

| Екран | Що робить |
| --- | --- |
| **Capture** (`/`) | Поле «Що в голові?» на весь екран + велика кнопка мікрофона. Нотатка зберігається локально. |
| **Inbox** (`/inbox`) | Список розібраних задач (поки порожній) + сирі нотатки з Capture. |
| **Today** (`/today`) | Чекліст задач на сьогодні (поки порожній). |

Навігація — фіксований нижній таб-бар, три великі зони під палець (68 px +
safe-area для iPhone).

## Запуск

```bash
npm install
npm run dev
```

Далі http://localhost:3000. Щоб подивитися з телефона — DevTools → device
toolbar, або відкрий `http://<IP-компʼютера>:3000` у мережі Wi-Fi.

Потрібен Node.js 18.18+ (постав із https://nodejs.org).

## Стан

Без бекенду: React state + `localStorage`, дзеркалення в хуку
`useStored` ([lib/store.ts](lib/store.ts)). Читання зі сховища відкладене в
`useEffect`, щоб SSR і клієнт не розійшлися при гідратації.

Ключі: `aiplanner.captures` (сирі нотатки), `aiplanner.tasks` (задачі).

## Структура

```
app/
  layout.tsx        глобальний каркас + таб-бар
  globals.css       усі стилі, змінні теми (світла/темна)
  page.tsx          Capture
  inbox/page.tsx    Inbox
  today/page.tsx    Today
components/
  TabBar.tsx        нижня навігація
lib/
  store.ts          типи Capture/Task + useStored
```

## Наступні кроки

1. Голосовий ввід — Web Speech API або запис у файл.
2. Route Handler `app/api/parse/route.ts` → Anthropic API: текст нотатки на
   вході, масив задач на виході. Ключ у змінній оточення `ANTHROPIC_API_KEY`
   (на Vercel — Project Settings → Environment Variables), ніколи не в клієнті.
3. Кнопка «Розібрати» в Inbox, яка ганяє нерозібрані нотатки через цей ендпоінт.
