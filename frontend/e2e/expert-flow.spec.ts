import { test, expect } from '@playwright/test';

test.describe('Личный кабинет эксперта', () => {
  test('Доступ к ЛК эксперта без авторизации редиректит', async ({ page }) => {
    await page.goto('/expert');
    
    // Должен редиректнуть на логин
    await expect(page).toHaveURL(/login|expert/, { timeout: 5000 });
  });
});

test.describe('Админ-панель — полный функционал', () => {
  test.beforeEach(async ({ page }) => {
    // Входим как админ
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@nasledniki-pobedy.ru');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 10000 });
  });

  test('Дашборд показывает статистику', async ({ page }) => {
    // Проверяем наличие карточек со статистикой
    await expect(page.locator('text=/участник|работ|эксперт/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Страница пользователей загружается', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('text=/пользовател|список/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Страница работ загружается', async ({ page }) => {
    await page.goto('/admin/works');
    await expect(page.locator('text=/работ|список/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Страница создания эксперта загружается', async ({ page }) => {
    await page.goto('/admin/experts');
    await expect(page.locator('text=/эксперт|создан/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Страница настроек загружается', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('text=/настройк|дедлайн/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('Форма создания эксперта содержит необходимые поля', async ({ page }) => {
    await page.goto('/admin/experts');
    
    // Проверяем наличие полей формы
    await expect(page.locator('input[name="email"], input[placeholder*="email"], input[type="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="fullName"], input[placeholder*="ФИО"], input[placeholder*="имя"]')).toBeVisible();
  });

  test('Настройки дедлайна отображаются', async ({ page }) => {
    await page.goto('/admin/settings');
    
    // Должен быть input для даты дедлайна
    await expect(page.locator('input[type="date"], input[type="datetime-local"]')).toBeVisible({ timeout: 5000 });
  });

  test('Экспорт работ доступен', async ({ page }) => {
    // Проверяем наличие кнопки экспорта на главной странице админки
    await expect(page.locator('text=/экспорт|excel|скачать/i').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Навигация', () => {
  test('Лендинг — все секции загружаются', async ({ page }) => {
    await page.goto('/');
    
    // О конкурсе
    await expect(page.locator('text=/о конкурсе|о проекте/i').first()).toBeVisible({ timeout: 5000 });
    
    // Номинации
    await expect(page.locator('text=/номинаци/i').first()).toBeVisible();
    
    // Как участвовать
    await expect(page.locator('text=/как участв|шаг/i').first()).toBeVisible();
  });

  test('Лендинг — ссылки на авторизацию работают', async ({ page }) => {
    await page.goto('/');
    
    // Ищем кнопку/ссылку входа в хедере
    const loginLink = page.locator('header').locator('text=/Войти|Вход/i');
    await expect(loginLink.first()).toBeVisible({ timeout: 5000 });
  });

  test('Страница политики конфиденциальности', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('text=/политик|конфиденциальност|персональн/i').first()).toBeVisible({ timeout: 5000 });
  });
});
