# Розгортання на GitHub Pages

Проєкт **InteractiveDashboard** повністю адаптований для автоматичного деплою на **GitHub Pages** завдяки трьом складовим:

## 1. Базовий шлях у Vite

Файл: [`vite.config.ts`](vite.config.ts) (рядок 8)

```ts
base: '/InteractiveDashboard/',
```

Vite встановлює `base` як підшлях репозиторію. GitHub Pages хостить сайт за адресою `https://<username>.github.io/<repo>/`, тому всі зібрані асети (JS, CSS, зображення) мають посилатися на `/InteractiveDashboard/...`. Без цього вони шукалися б у корені (`/`) і не знайшлися б.

## 2. GitHub Actions workflow

Файл: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
```

Workflow автоматично спрацьовує при push у гілку `main` і виконує:

1. `actions/checkout@v4` — клонує репозиторій
2. `actions/setup-node@v4` з Node 20 — встановлює Node.js
3. `npm ci && npm run build` — чиста інсталяція залежностей і Vite-збірка в папку `dist/`
4. `actions/configure-pages@v4` — налаштовує Pages-оточення
5. `actions/upload-pages-artifact@v3` (path: `dist`) — завантажує зібрану статику як артефакт
6. `actions/deploy-pages@v4` — безпосередньо деплоїть на GitHub Pages

Дозволи (`permissions`): `contents: read`, `pages: write`, `id-token: write` — необхідні для автентифікації деплою.

## 3. Синхронізація шляхів у HTML

Файл: [`index.html`](index.html) (рядок 6)

```html
<link rel="icon" type="image/svg+xml" href="/InteractiveDashboard/favicon.svg" />
```

Пряме посилання на фавікон також використовує префікс `/InteractiveDashboard/`, що узгоджено з `base` у Vite.

## Підсумок

| Компонент | Роль |
|---|---|
| Vite `base` | Корегує шляхи асетів під підшлях репозиторію |
| GitHub Actions | Автоматизує збірку (`npm run build`) і деплой |
| Статична збірка (`dist/`) | GitHub Pages Serve як звичайний статичний хостинг |
