import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Issue } from '../lib/types';

test('home page is accessible and renders the dashboard', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find your first contribution');
	await expect(page.getByRole('status')).toContainText('of');
	await expect(page.getByRole('table')).toBeVisible();

	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();

	expect(results.violations).toEqual([]);
});

test('filters work without JavaScript-driven state', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel('Search').fill('accessibility');
	await page.getByRole('button', { name: 'Apply filters' }).click();

	await expect(page).toHaveURL(/search=accessibility/);
	await expect(page.getByRole('status')).toContainText('issues');
});

test('theme toggle exposes its state', async ({ page }) => {
	await page.goto('/');
	const toggle = page.getByRole('button', { name: 'Dark theme' });
	await expect(toggle).toHaveAttribute('aria-pressed', 'false');
	await toggle.click();
	await expect(page.getByRole('button', { name: 'Light theme' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});

test('REST API returns JSON with cache headers', async ({ request }) => {
	const response = await request.get('/api/issues?perPage=10&sort=comments');
	expect(response.ok()).toBeTruthy();
	expect(response.headers()['content-type']).toContain('application/json');
	expect(response.headers()['cache-control']).toContain('max-age');
	const body = (await response.json()) as { data: { items: Issue[] } };
	expect(body.data.items).toHaveLength(10);
});
