<script lang="ts">
	import activeTagsStore from '$lib/store/active-tags-store';
	import SimpleTag from '../tag-simple/SimpleTag.svelte';
	import { getShareUrl } from '$lib/logic/url-parsing';

	export let tags: kurosearch.Tag[];

	const openTagInNewTab = (tag: kurosearch.Tag) => {
		const url = getShareUrl([{modifier: '+', ...tag}]);
		window.open(url, '_blank');
	};
</script>

<ul class="tags">
	{#each tags as tag}
		{@const active = $activeTagsStore.find((t) => t.name === tag.name) !== undefined}
		<SimpleTag
			{tag}
			on:click={() =>
				active
					? activeTagsStore.removeByName(tag.name)
					: activeTagsStore.addOrReplace({ ...tag, modifier: '+' })}
			on:contextmenu={() => openTagInNewTab(tag)}
			{active}
		/>
	{/each}
</ul>

<style>
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
</style>
