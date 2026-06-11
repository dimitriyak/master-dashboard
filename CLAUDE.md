# master-dashboard — личный дашборд

Персональный дашборд Дмитрия. Разделы: **«Путь к 1M$»** (1M$ Way), **вишлист** (Wishlist),
**DeFi-портфель и радар** (DeFi / Radar).

## Стек
- Фронтенд: React 18 + Vite + react-router-dom (v7). Точка входа — `src/App.jsx`.
- Бэкенд — Cloudflare Workers (папка `workers/`), каждый со своим `*-wrangler.json`:
  - `ai-proxy.js` — прокси к AI-моделям (единая точка, ключи на стороне воркера).
  - `defi-news.js` — DeFi-новости и APY (эндпоинты `/brief`, `/apys`).
  - `data-sync.js` — синхронизация данных (защищён Bearer-токеном).
  - `tg-bot.js` — вспомогательный воркер.
  - есть и `bybit-proxy` (прокси к Bybit API).

## Деплой
- Фронт: Cloudflare Pages (проект `master-dashboard`). Сборка: `npm run build` → `dist/`,
  деплой `npx wrangler pages deploy dist`.
- Воркеры: `npx wrangler deploy` из соответствующего конфига.
- Репозиторий: github.com/dimitriyak/master-dashboard.

## Команды
- Локально: `npm run dev` (Vite, порт 5173).
- Сборка: `npm run build`.

## Правила
- Все внешние ключи (AI, Bybit, Cloudflare) живут в воркерах/секретах, НЕ во фронте и
  НЕ в репозитории. Фронт ходит только в свои воркеры.
