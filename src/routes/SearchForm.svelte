<script lang="ts">
	import { browser } from '$app/environment';
	import Searchbar from '$lib/components/kurosearch/searchbar/Searchbar.svelte';
	import ActiveTagList from '$lib/components/kurosearch/tag-list/ActiveTagList.svelte';
	import LoadingAnimation from '$lib/components/pure/loading-animation/LoadingAnimation.svelte';
	import TextButton from '$lib/components/pure/text-button/TextButton.svelte';
	import { getTagSuggestions } from '$lib/logic/api-client/ApiClient';
	import { getTagDetails } from '$lib/logic/api-client/tags/tags';
	import { nextModifier } from '$lib/logic/modifier-utils';
	import { addHistory } from '$lib/logic/use/onpopstate';
	import activeSupertags from '$lib/store/active-supertags-store';
	import activeTags from '$lib/store/active-tags-store';
	import results from '$lib/store/results-store';
	import supertags from '$lib/store/supertags-store';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import CreateSupertagDialog from '$lib/components/kurosearch/dialog-create-supertag/CreateSupertagDialog.svelte';

	let lastScrollY = 0;
	let isVisible = true;
	const hideThreshold = 20; // Pixels to scroll down before hiding
	const showThreshold = 100; // Pixels to scroll up before showing

	const dispatch = createEventDispatcher();
	const submit = () => dispatch('submit');

	export let loading: boolean;

	let createSupertagDialog: HTMLDialogElement;

	const fetchSuggestions = async (term: string) => {
		const matchingTags = await getTagSuggestions(term);
		const matchingSupertags = $supertags.items
			.filter(({ name }) => name.toLowerCase().includes(term.toLowerCase()))
			.map((supertag) => ({
				label: supertag.name,
				count: supertag.tags.length,
				type: 'supertag' as kurosearch.TagType
			}));

		return [...matchingSupertags, ...matchingTags];
	};

	const keybinds = (event: KeyboardEvent) => {
		if (
			(event.key === '/' || event.key === 's') &&
			(!document.activeElement || document.activeElement === document.body)
		) {
			event.preventDefault();
			event.stopPropagation();
			document.getElementById('searchbar')?.focus();
		}

		if (event.ctrlKey && event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			submit();
		}

		if (event.ctrlKey && event.key === 'm') {
			event.preventDefault();
			event.stopPropagation();
			document.getElementById('select-modifier')?.click();
		}
	};

	onMount(async () => {
		if (browser) {
			document.addEventListener('keydown', keybinds);
			document.addEventListener('scroll', handleScroll, { passive: true });
			if ($results.postCount === 0) {
				submit();
			}
		}
	});

	const handleScroll = () => {
		const currentScrollY = window.scrollY;
		const scrollDifference = currentScrollY - lastScrollY;

		// Always show the searchbar at the top
		if (currentScrollY < 500)
			isVisible = true;
		// Scrolling down
		else if (scrollDifference > 0) 
			isVisible = isVisible && scrollDifference < hideThreshold;
		// Scrolling up
		else 
			isVisible = isVisible || scrollDifference < -showThreshold;

		lastScrollY = currentScrollY;
	};

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', keybinds);
			document.removeEventListener('scroll', handleScroll);
		}
	});
</script>

<section id="search" class:hidden={!isVisible}>
	<Searchbar
		placeholder="Search for tags"
		{fetchSuggestions}
		on:pick={async (e) => {
			const suggestion = e.detail;
			if (suggestion.type === 'supertag') {
				const supertag = $supertags.items.find((x) => x.name === suggestion.label);
				if (!supertag) {
					console.warn('Supertag not present.');
					return;
				}
				activeSupertags.addOrReplace(supertag);
			} else {
				const tag = await getTagDetails(e.detail.label);
				activeTags.addOrReplace({
					name: e.detail.label,
					modifier: e.detail.modifier,
					count: e.detail.count,
					type: tag?.type ?? 'tag'
				});
			}
		}}
	/>
	<TextButton id="btn-search" title="Search with the tags above" on:click={submit}>
		{#if loading}
			<LoadingAnimation />
		{:else}
			Search
		{/if}
	</TextButton>
	<ActiveTagList
		tags={[...$activeTags, ...$activeSupertags]}
		on:contextmenu={(e) =>
			'description' in e.detail
				? activeSupertags.removeByName(e.detail.name)
				: activeTags.removeByName(e.detail.name)}
		on:click={(e) => {
			if (!('description' in e.detail)) {
				e.detail.modifier = nextModifier(e.detail.modifier);
				activeTags.addOrReplace(e.detail);
			}
		}}
		on:createSupertag={() => {
			createSupertagDialog.showModal();
			addHistory('dialog');
		}}
	/>
</section>

<CreateSupertagDialog
	bind:dialog={createSupertagDialog}
	tags={$activeTags}
	on:submit={(e) => supertags.add(e.detail)}
/>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--grid-gap);
		padding-inline: var(--small-gap);
		position: sticky;
		top: 0;
		background: var(--background-0);
		z-index: var(--z-searchbar);
		padding-block: var(--small-gap);
		transform: translateY(0);
		transition: transform 0.3s ease-in-out;
	}

	.hidden {
		transform: translateY(-100%);
	}

	:global(#btn-search) {
		width: 10rem;
	}
</style>
