import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = '../docs/screenshots';

test.describe('Скриншоты всех страниц', () => {
  // ============================================
  // Публичные страницы
  // ============================================

  test('01 - Главная страница (лендинг)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-landing.png`, fullPage: true });
  });

  test('02 - Страница входа', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login.png`, fullPage: true });
  });

  test('03 - Страница регистрации', async ({ page }) => {
    await page.goto('/register');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-register.png`, fullPage: true });
  });

  test('04 - Забыли пароль', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-forgot-password.png`, fullPage: true });
  });

  test('05 - Политика конфиденциальности', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-privacy.png`, fullPage: true });
  });

  // ============================================
  // Админ-панель (все страницы в одном тесте)
  // ============================================

  test('06-10 - Все страницы админ-панели', async ({ page }) => {
    // Логин
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@nasledniki-pobedy.ru');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin', { timeout: 15000 });
    
    // Дашборд
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-admin-dashboard.png`, fullPage: true });
    
    // Пользователи
    await page.goto('/admin/users');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-admin-users.png`, fullPage: true });
    
    // Работы
    await page.goto('/admin/works');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-admin-works.png`, fullPage: true });
    
    // Создание эксперта
    await page.goto('/admin/experts');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-admin-experts.png`, fullPage: true });
    
    // Настройки
    await page.goto('/admin/settings');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-admin-settings.png`, fullPage: true });
  });

  // ============================================
  // Остальные страницы
  // ============================================

  test('11-17 - Остальные страницы', async ({ page }) => {
    // Swagger API
    await page.goto('http://localhost:3000/api/docs');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-swagger-api.png`, fullPage: true });
    
    // MailHog
    try {
      await page.goto('http://localhost:8025', { timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/12-mailhog.png`, fullPage: true });
    } catch (e) {
      console.log('MailHog not available');
    }
    
    // MinIO
    try {
      await page.goto('http://localhost:9001', { timeout: 5000 });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/13-minio.png`, fullPage: true });
    } catch (e) {
      console.log('MinIO not available');
    }
  });
});
