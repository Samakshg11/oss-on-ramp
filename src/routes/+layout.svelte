<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '../lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	let dark = $state(false);

	$effect(() => {
		const saved = localStorage.getItem('theme');
		dark = saved === 'dark';
		document.body.classList.toggle('is-dark', dark);
	});

	function toggleTheme() {
		dark = !dark;
		localStorage.setItem('theme', dark ? 'dark' : 'light');
		document.body.classList.toggle('is-dark', dark);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip-link" href="#main-content">Skip to main content</a>

<header class="p-strip--light site-header">
	<div class="u-fixed-width">
		<div class="row">
			<div class="col-6">
				<a href={resolve('/')} class="brand">Open Source On-Ramp</a>
				<p class="brand-tagline">Find your first contribution in Canonical projects</p>
			</div>
			<div class="col-6 u-align--right">
				<nav aria-label="Main navigation" class="site-nav">
					<a href={resolve('/')}>Browse issues</a>
					<a href={resolve('/api/issues')}>API</a>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href="https://github.com/Samakshg11/oss-on-ramp">Source</a>
					<button
						type="button"
						class="p-button u-no-margin--bottom"
						onclick={toggleTheme}
						aria-pressed={dark}
					>
						{dark ? 'Light theme' : 'Dark theme'}
					</button>
				</nav>
			</div>
		</div>
	</div>
</header>

<main id="main-content" tabindex="-1">
	{@render children()}
</main>

<footer class="p-strip site-footer">
	<div class="u-fixed-width">
		<p>
			Built with SvelteKit, TypeScript and
			<a href="https://vanillaframework.io/">Vanilla Framework</a>. Data from the public
			<a href="https://docs.github.com/en/rest/search">GitHub REST API</a>.
		</p>
	</div>
</footer>

<style>
	.skip-link {
		left: -10000px;
		position: absolute;
		top: 0;
		z-index: 100;
	}

	.skip-link:focus {
		background: #fff;
		left: 1rem;
		padding: 0.75rem 1rem;
		top: 1rem;
	}

	.site-header {
		border-bottom: 1px solid var(--vf-color-border, #cdcdcd);
		padding-bottom: 1rem;
		padding-top: 1rem;
	}

	.brand {
		font-size: 1.25rem;
		font-weight: 700;
	}

	.brand-tagline {
		font-size: 0.875rem;
		margin-bottom: 0;
		opacity: 0.75;
	}

	.site-nav {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: flex-end;
	}

	main {
		min-height: 60vh;
	}

	.site-footer {
		font-size: 0.875rem;
		margin-top: 2rem;
	}
</style>
