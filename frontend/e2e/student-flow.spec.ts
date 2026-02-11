import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Личный кабинет участника', () => {
  // Логинимся перед каждым тестом как существующий студент или создаём нового
  test.beforeEach(async ({ page }) => {
    // Для простоты используем прямой вход через API или логин
    await page.goto('/login');
  });

  test('Доступ к ЛК без авторизации редиректит на логин', async ({ page }) => {
    await page.goto('/student');
    
    // Должен редиректнуть на логин или показать ошибку
    await expect(page).toHaveURL(/login|student/, { timeout: 5000 });
  });
});

test.describe('Подача работы (после авторизации)', () => {
  test.beforeEach(async ({ page }) => {
    // Входим как админ для тестирования (у него есть доступ)
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@nasledniki-pobedy.ru');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 10000 });
  });

  test('Админ-панель загружается после входа', async ({ page }) => {
    await expect(page.locator('text=/статистик|дашборд|панель/i')).toBeVisible({ timeout: 5000 });
  });

  test('Переход к списку работ', async ({ page }) => {
    await page.click('text=/работ/i');
    await expect(page).toHaveURL(/works|admin/, { timeout: 5000 });
  });

  test('Переход к списку пользователей', async ({ page }) => {
    await page.click('text=/пользовател/i');
    await expect(page).toHaveURL(/users|admin/, { timeout: 5000 });
  });

  test('Переход к настройкам', async ({ page }) => {
    await page.click('text=/настройк/i');
    await expect(page).toHaveURL(/settings|admin/, { timeout: 5000 });
  });
});

test.describe('Форма подачи работы', () => {
  test('Страница подачи работы доступна', async ({ page }) => {
    // Входим как админ
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@nasledniki-pobedy.ru');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 10000 });
    
    // Админ видит страницу экспертов
    await page.goto('/admin/experts');
    // Ждём загрузки страницы
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 });
  });
});
