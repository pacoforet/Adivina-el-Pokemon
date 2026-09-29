import { expect, test } from '@playwright/test';
import { getPokemon } from '../../src/js/pokemon.js';

const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);
const CORS = { 'Access-Control-Allow-Origin': '*' };

async function mockAssets(page, { failImages = false } = {}) {
  await page.route('https://raw.githubusercontent.com/**', (route) => {
    const url = route.request().url();
    if (url.endsWith('.png') && !failImages) {
      return route.fulfill({ status: 200, contentType: 'image/png', headers: CORS, body: PIXEL });
    }
    return route.fulfill({ status: 404, headers: CORS, body: '' });
  });
}

async function currentName(page) {
  await expect(page.locator('#pokemon-image')).toHaveAttribute('src', /\d+\.png$/);
  const src = await page.locator('#pokemon-image').getAttribute('src');
  return getPokemon(Number(src.match(/(\d+)\.png$/)[1])).name;
}

async function answerCorrectly(page) {
  await expect(page.locator('.option-btn').first()).toBeEnabled();
  const name = await currentName(page);
  await page.locator(`.option-btn[data-name="${name}"]`).click();
  return name;
}

test.beforeEach(async ({ page }) => {
  await mockAssets(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('flujo básico: acertar suma puntos y muestra el nombre y los tipos', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Adivina el Pokémon' })).toBeVisible();
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  await expect(page.locator('#pokemon-counter')).toHaveText('1/20');
  await expect(page.locator('.option-btn')).toHaveCount(4);

  const name = await answerCorrectly(page);
  await expect(page.locator('#score-display')).toHaveText('1');
  await expect(page.locator('#reveal-info')).toContainText(name);
  await expect(page.locator('.type-chip').first()).toBeVisible();
  await expect(page.locator('#pokemon-counter')).toHaveText('2/20', { timeout: 5000 });
});

test('un fallo desactiva esa opción y deja reintentar', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  await expect(page.locator('.option-btn').first()).toBeEnabled();
  const name = await currentName(page);
  const wrong = page.locator(`.option-btn:not([data-name="${name}"])`).first();
  await wrong.click();
  await expect(page.locator('#failed-display')).toHaveText('1');
  await expect(wrong).toBeDisabled();
  await expect(page.locator(`.option-btn[data-name="${name}"]`)).toBeEnabled();
  await page.locator(`.option-btn[data-name="${name}"]`).click();
  await expect(page.locator('#score-display')).toHaveText('1');
});

test('salir justo después de acertar no sigue jugando por detrás', async ({ page }) => {
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  await answerCorrectly(page);
  await page.getByRole('button', { name: /Salir/ }).click();
  await page.waitForTimeout(2500);
  await expect(page.locator('#game-screen')).toBeHidden();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('pokemon_game_state_v4'))
  );
  expect(saved.index).toBe(1);
  await expect(page.locator('#continue-button')).toContainText('ronda 2/20');

  await page.locator('#continue-button').click();
  await expect(page.locator('#pokemon-counter')).toHaveText('2/20');
  await expect(page.locator('#score-display')).toHaveText('1');
});

test('al acabarse el tiempo se enseña la respuesta y se bloquean las opciones', async ({
  page
}) => {
  await page.clock.install();
  await page.locator('[data-difficulty="hard"]').click();
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  await expect(page.locator('.option-btn').first()).toBeEnabled();
  const name = await currentName(page);
  await page.clock.runFor(10500);
  await expect(page.locator('.option-btn.answer')).toHaveAttribute('data-name', name);
  await expect(page.locator('.option-btn:enabled')).toHaveCount(0);
  await expect(page.locator('#failed-display')).toHaveText('1');
});

test('sin imágenes no se salta la partida: pide reintentar o saltar', async ({ page }) => {
  await page.unrouteAll();
  await mockAssets(page, { failImages: true });
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  await expect(page.locator('#network-panel')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('#pokemon-counter')).toHaveText('1/20');
  await page.getByRole('button', { name: 'Saltar' }).click();
  await expect(page.locator('#pokemon-counter')).toHaveText('2/20');
});

test('modo escribir acepta el nombre con faltas pequeñas', async ({ page }) => {
  await page.locator('[data-mode="write"]').click();
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  await expect(page.locator('#write-input')).toBeEnabled();
  const name = await currentName(page);
  await page.locator('#write-input').fill(name.toLowerCase());
  await page.keyboard.press('Enter');
  await expect(page.locator('#score-display')).toHaveText('1');
});

test('partida de 10 rondas termina con el resultado y guarda la Pokédex', async ({ page }) => {
  await page.locator('[data-rounds="10"]').click();
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  for (let i = 0; i < 10; i += 1) {
    await expect(page.locator('#pokemon-counter')).toHaveText(`${i + 1}/10`, { timeout: 5000 });
    await answerCorrectly(page);
  }
  await expect(page.locator('#end-screen')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#final-score')).toHaveText('10/10');
  await expect(page.locator('#final-meta')).toContainText('Puntos: 12');

  await page.getByRole('button', { name: 'Menú' }).click();
  await expect(page.locator('#dex-count')).toHaveText('10');
  await page.getByRole('button', { name: 'Pokédex y logros' }).click();
  await expect(page.locator('#pokedex-progress')).toHaveText('10/151 descubiertos');
  await expect(page.locator('.achievement.done')).toContainText('Racha Caliente');
});

test('dos jugadores se turnan', async ({ page }) => {
  await page.locator('[data-players="2"]').click();
  await page.locator('#player-name-1').fill('Ana');
  await page.locator('#player-name-1').blur();
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  await expect(page.locator('.player-pill.active')).toContainText('Lucas');
  await answerCorrectly(page);
  await expect(page.locator('.player-pill.active')).toContainText('Ana', { timeout: 5000 });
  await expect(page.locator('#points-label')).toHaveText('ANA');
});

test('el repaso solo se activa con fallos guardados', async ({ page }) => {
  await page.locator('[data-mode="review"]').click();
  await page.getByRole('button', { name: 'Nueva partida' }).click();
  await expect(page.locator('#toast')).toContainText('No tienes fallos');
  await expect(page.locator('#start-screen')).toBeVisible();
});
