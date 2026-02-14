import { expect, test } from '@playwright/test';

test('flujo basico de juego', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Adivina el Pokemon' })).toBeVisible();

  await page.getByRole('button', { name: 'Jugar ahora' }).click();
  await expect(page.locator('#game-screen')).toBeVisible();

  const firstOption = page.locator('.option-btn').first();
  await expect(firstOption).toBeVisible();
  await firstOption.click();

  await expect(page.locator('#score-display')).toBeVisible();
});
