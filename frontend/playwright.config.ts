import { defineConfig, devices } from '@playwright/test';

/**
 * Конфигурация Playwright для E2E тестов
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Максимальное время выполнения одного теста */
  timeout: 30 * 1000,
  
  /* Максимальное время для expect() */
  expect: {
    timeout: 5000,
  },
  
  /* Запуск тестов в файлах параллельно */
  fullyParallel: true,
  
  /* Не fail при первой ошибке в CI */
  forbidOnly: !!process.env.CI,
  
  /* Повторные попытки только в CI */
  retries: process.env.CI ? 2 : 0,
  
  /* Один worker в CI для стабильности */
  workers: process.env.CI ? 1 : undefined,
  
  /* Отчёт */
  reporter: 'html',
  
  /* Общие настройки для всех проектов */
  use: {
    /* Базовый URL для действий типа `await page.goto('/')` */
    baseURL: 'http://localhost:5173',
    
    /* Собирать trace при неудачных тестах */
    trace: 'on-first-retry',
    
    /* Скриншоты при ошибках */
    screenshot: 'only-on-failure',
  },

  /* Настройки браузеров */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Запуск dev-сервера перед тестами */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true, // Всегда использовать существующий сервер
    timeout: 120 * 1000,
  },
});
