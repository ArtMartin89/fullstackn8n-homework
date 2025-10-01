# Инструкция по развертыванию Next.js проекта на autosapiens.by

## Вариант 1: Статический экспорт (рекомендуется для простого хостинга)

### 1. Подготовка проекта для статического экспорта

Добавьте в `next.config.ts`:
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

export default nextConfig
```

### 2. Сборка проекта
```bash
npm run build
```

### 3. Загрузка файлов
- Загрузите содержимое папки `out/` на ваш сервер в директорию `nodajs-test1`
- Убедитесь, что файл `index.html` находится в корне папки `nodajs-test1`

## Вариант 2: Node.js хостинг (если поддерживается)

### 1. Загрузка файлов
- Загрузите все файлы проекта (кроме node_modules) на сервер
- Поместите их в директорию `nodajs-test1`

### 2. Установка зависимостей
```bash
cd nodajs-test1
npm install
```

### 3. Сборка и запуск
```bash
npm run build
npm start
```

## Вариант 3: Vercel (самый простой)

### 1. Подключение к GitHub
- Загрузите проект в GitHub репозиторий
- Подключите репозиторий к Vercel
- Vercel автоматически развернет проект

### 2. Настройка домена
- В настройках Vercel добавьте кастомный домен `autosapiens.by`
- Настройте поддомен `nodajs-test1.autosapiens.by`

## Структура файлов для загрузки

```
nodajs-test1/
├── src/
│   └── app/
│       ├── page.tsx (основной файл с графиком)
│       ├── layout.tsx
│       ├── globals.css
│       └── favicon.ico
├── public/
│   └── (все SVG файлы)
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
└── next-env.d.ts
```

## Важные замечания

1. **API запросы**: Проект делает запросы к `https://clecucuci.beget.app/webhook/...` - убедитесь, что CORS настроен правильно

2. **Зависимости**: Убедитесь, что на сервере установлен Node.js версии 18+

3. **Сборка**: Для статического экспорта используйте `npm run build` - это создаст папку `out/` с готовыми файлами

4. **Проверка**: После загрузки проверьте, что все файлы загружены корректно и нет ошибок 404

## Команды для проверки

```bash
# Проверка версии Node.js
node --version

# Установка зависимостей
npm install

# Сборка проекта
npm run build

# Проверка статического экспорта
npm run export  # если настроен скрипт export
```

