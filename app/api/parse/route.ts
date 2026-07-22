import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ParsedTask, Priority } from "@/lib/store";

// Ключ і виклик API — лише на сервері. Node runtime потрібен для SDK.
export const runtime = "nodejs";

const PRIORITIES: Priority[] = ["high", "medium", "low"];

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[/api/parse] ANTHROPIC_API_KEY відсутній у середовищі");
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY не налаштовано на сервері" },
      { status: 500 },
    );
  }

  let text = "";
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text : "";
  } catch {
    /* тіло не JSON — обробимо як порожнє */
  }
  text = text.trim();
  if (!text) {
    return NextResponse.json({ error: "Порожній текст" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const today = new Date().toISOString().slice(0, 10);

  const system = [
    "Ти асистент-планувальник. Користувач диктує або пише потік думок.",
    "Розбий його на окремі, конкретні, дієві задачі.",
    "Для кожної задачі визнач:",
    '- title: коротке формулювання дії тією ж мовою, що й у користувача;',
    '- priority: "high", "medium" або "low" (терміновість/важливість; за замовчуванням "medium");',
    '- deadline: дата у форматі YYYY-MM-DD, якщо її згадано, інакше порожній рядок "".',
    `Сьогодні ${today}. Відносні дати ("завтра", "у пʼятницю", "через тиждень") переводь у конкретну дату.`,
    "Не вигадуй задач, яких немає в тексті. Одна думка може дати кілька задач.",
    'Відповідай ЛИШЕ валідним JSON без markdown, у форматі:',
    '{"tasks":[{"title":"...","priority":"medium","deadline":""}]}',
  ].join("\n");

  let response;
  try {
    response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: text }],
    });
  } catch (err) {
    // Дістаємо максимум деталей у Vercel Runtime Logs: статус, тип, request-id.
    const status =
      err instanceof Anthropic.APIError ? err.status : undefined;
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/parse] Anthropic API помилка:", {
      status,
      name: err instanceof Error ? err.name : "unknown",
      message,
      requestId:
        err instanceof Anthropic.APIError ? err.request_id : undefined,
    });
    return NextResponse.json(
      { error: "Помилка виклику Anthropic API: " + message },
      { status: 502 },
    );
  }

  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");

  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error(
      "[/api/parse] У відповіді немає JSON. rawText:",
      rawText.slice(0, 500),
    );
    return NextResponse.json(
      { error: "Модель повернула відповідь без JSON" },
      { status: 502 },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch (err) {
    console.error(
      "[/api/parse] JSON.parse впав:",
      err instanceof Error ? err.message : err,
      "| фрагмент:",
      match[0].slice(0, 500),
    );
    return NextResponse.json(
      { error: "Не вдалося розібрати JSON із відповіді моделі" },
      { status: 502 },
    );
  }

  const rawTasks = (parsed as { tasks?: unknown }).tasks;
  const tasks: ParsedTask[] = Array.isArray(rawTasks)
    ? rawTasks
        .map((t): ParsedTask | null => {
          if (!t || typeof (t as { title?: unknown }).title !== "string") {
            return null;
          }
          const title = String((t as { title: string }).title).trim();
          if (!title) return null;
          const p = (t as { priority?: unknown }).priority;
          const priority: Priority = PRIORITIES.includes(p as Priority)
            ? (p as Priority)
            : "medium";
          const d = (t as { deadline?: unknown }).deadline;
          const deadline = typeof d === "string" ? d : "";
          return { title, priority, deadline };
        })
        .filter((t): t is ParsedTask => t !== null)
    : [];

  console.log(`[/api/parse] Розібрано задач: ${tasks.length}`);
  return NextResponse.json({ tasks });
}
