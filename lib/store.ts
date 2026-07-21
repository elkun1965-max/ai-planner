"use client";

import { useEffect, useState } from "react";

/** Сира нотатка з екрана Capture — те, що користувач надиктував/написав. */
export type Capture = {
  id: string;
  text: string;
  createdAt: number;
  /** Стане true, коли з'явиться АІ-розбір на задачі. */
  parsed: boolean;
};

/** Задача після розбору. Поки що створюється лише вручну/АІ пізніше. */
export type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  /** inbox — розібрана, але не запланована; today — на сьогодні. */
  bucket: "inbox" | "today";
  /** id нотатки, з якої задача народилася. */
  sourceId?: string;
};

export const KEYS = {
  captures: "aiplanner.captures",
  tasks: "aiplanner.tasks",
} as const;

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Стан у React + дзеркало в localStorage.
 * Перший рендер завжди віддає initial — інакше SSR і клієнт розійдуться,
 * тому читання зі сховища відкладене в useEffect (hydrated).
 */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* пошкоджений запис — лишаємо initial */
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* сховище переповнене або заблоковане */
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}
