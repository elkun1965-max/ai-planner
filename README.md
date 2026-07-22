# АІ-планер дня

Mobile-first todo-застосунок: вивантажуєш усе, що в голові (голосом або
текстом), а АІ перетворює це на структуровані задачі.

## Екрани

| Екран | Що робить |
| --- | --- |
| **Capture** (`/`) | Поле «Що в голові?» на весь екран + мікрофон (Web Speech API). Кнопка «Розібрати на задачі» шле текст на сервер, АІ повертає задачі → Inbox. Є й «зберегти як чернетку» без АІ. |
| **Inbox** (`/inbox`) | Розібрані задачі з пріоритетом і дедлайном + сирі чернетки з Capture. Кнопка «→» переносить задачу в Today. |
| **Today** (`/today`) | Чекліст задач на сьогодні. |

Навігація — фіксований нижній таб-бар, три великі зони під палець (68 px +
safe-area для iPhone).

## Голосовий ввід

Кнопка мікрофона використовує **Web Speech API** (`SpeechRecognition` /
`webkitSpeechRecognition`, мова `uk-UA`). Перше натискання просить дозвіл на
мікрофон; розпізнане дописується в поле, повторне натискання зупиняє. Обробляються
відмова в доступі, тиша та відсутність підтримки браузером. Найкраще працює в
Chrome/Edge; Firefox наразі не підтримує API — застосунок покаже підказку і
залишить текстовий ввід.

## АІ-розбір (серверний)

Route Handler [app/api/parse/route.ts](app/api/parse/route.ts) викликає Anthropic
API (`claude-opus-4-8`) через офіційний SDK **на сервері** — ключ у браузер не
потрапляє. На вхід — сирий текст, на вихід — масив задач
`{ title, priority, deadline }`. Відповідь моделі валідується й санітизується
перед поверненням.

Потрібна змінна оточення `ANTHROPIC_API_KEY`:

- **Локально:** `cp .env.example .env.local` і встав ключ.
- **Vercel:** Project Settings → Environment Variables → `ANTHROPIC_API_KEY`.

Без ключа ендпоінт повертає 500, а Capture показує помилку — текст можна
зберегти чернеткою і розібрати пізніше.

## Запуск

```bash
npm install
npm run dev
```

Далі http://localhost:3000. Потрібен Node.js 18.18+ (з https://nodejs.org).
Для мобільного вигляду — DevTools → device toolbar, або `http://<IP>:3000` у Wi-Fi.

> ⚠️ Голосовий ввід і мікрофон вимагають захищеного контексту (HTTPS або
> `localhost`). На проді Vercel це працює автоматично.

## Стан

Без власної БД: React state + `localStorage`, дзеркалення в хуку `useStored`
([lib/store.ts](lib/store.ts)). Читання зі сховища відкладене в `useEffect`, щоб
SSR і клієнт не розійшлися при гідратації.

Ключі: `aiplanner.captures` (чернетки), `aiplanner.tasks` (задачі).

## Структура

```
app/
  layout.tsx           глобальний каркас + таб-бар
  globals.css          усі стилі, змінні теми (світла/темна)
  page.tsx             Capture (голос + виклик /api/parse)
  inbox/page.tsx       Inbox
  today/page.tsx       Today
  api/parse/route.ts   серверний виклик Anthropic API
components/
  TabBar.tsx           нижня навігація
lib/
  store.ts             типи Capture/Task/ParsedTask + useStored
types/
  speech.d.ts          типи Web Speech API
```
