# BRFF Auto

Учебный концепт сайта-визитки для мини-автосалона Владимира Братишкина (не официальный сайт, контакты вымышлены): 3D-номерной знак с конструктором номера, режим с Dodge Challenger SRT Hellcat, услуги и контакты.

## Стек

- Astro 5
- Tailwind CSS 4
- Three.js

## Запуск

```bash
npm install
npm run dev
```

Сайт публикуется в ветку `gh-pages` через `gh-pages`. Адрес и путь задаются в `astro.config.mjs` (`site`, `base`).

## Структура

- `src/site.ts` — название, контакты и тексты услуг
- `src/pages/index.astro` — разметка страницы
- `src/scripts/stage.ts` — сцена, дорога, камера, цикл отрисовки
- `src/scripts/plate.ts` — номерной знак и конструктор номера
- `src/scripts/car.ts` — модель Dodge (загружается при переключении в режим «Додж»)
- `src/scripts/page.ts` — интерфейс страницы