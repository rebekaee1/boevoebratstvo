import { test, expect } from '@playwright/test';

test.describe('Аутентификация', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Главная страница загружается', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Наследники Победы/i);
  });

  test('Переход на страницу входа', async ({ page }) => {
    await page.click('text=Войти');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1, h2')).toContainText(/Вход|Авторизация/i);
  });

  test('Переход на страницу регистрации', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1, h2')).toContainText(/Регистрация/i);
  });

  test('Ошибка входа с неверными данными', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // После попытки входа должны остаться на странице логина
    await page.waitForTimeout(2000); // Ждём ответа от сервера
    await expect(page).toHaveURL(/login/);
  });

  test('Успешный вход администратора', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"], input[name="email"]', 'admin@nasledniki-pobedy.ru');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Должен перенаправить на админ-панель
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
  });

  test('Переход на страницу восстановления пароля', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('text=/забыл|восстанов/i');
    await expect(page).toHaveURL('/forgot-password');
  });
});

test.describe('Регистрация нового участника', () => {
  test('Форма регистрации содержит все необходимые поля', async ({ page }) => {
    await page.goto('/register');
    
    // Проверяем наличие заголовка
    await expect(page.locator('h1')).toContainText(/Регистрация/i);
    
    // Проверяем наличие полей по label или placeholder
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('Валидация email формата', async ({ page }) => {
    await page.goto('/register');
    
    // Заполняем невалидный email и пытаемся отправить
    await page.locator('input[type="email"]').fill('invalid-email');
    await page.click('button[type="submit"]');
    
    // Форма не должна отправиться, остаёмся на странице регистрации
    await expect(page).toHaveURL(/register/);
  });

  test('Требуется согласие на обработку ПДн', async ({ page }) => {
    await page.goto('/register');
    
    // Заполняем все поля кроме чекбокса
    await page.locator('input[type="text"]').first().fill('Тест Тестов');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').first().fill('password123');
    await page.locator('input[type="password"]').last().fill('password123');
    
    // Пытаемся отправить без согласия
    await page.click('button[type="submit"]');
    
    // Форма не должна отправиться, появится ошибка или останемся на странице
    await expect(page).toHaveURL(/register/);
  });
});
