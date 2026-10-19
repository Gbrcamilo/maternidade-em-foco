import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Falha em vez de ficar carregando para sempre quando a rede ou a leitura da sessão trava. */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: () => T | Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => { Promise.resolve().then(fallback).then(resolve, reject); }, ms);
    promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}
