import { persistentWritable } from './persistent-store';
import { StoreKey } from './store-keys';

const getInitial = () => ({
	Loli: false,
	'AI-Generated': false,
	'Animal-Related': false,
	'Non-Consentual': false,
	Gore: true,
	Scat: true,
	Vore: true
});

const createBlockedContentStore = () => {
	const { subscribe, set } = persistentWritable(StoreKey.BlockedContent, getInitial());

	return {
		subscribe,
		set,
		reset: () => set(getInitial())
	};
};

export default createBlockedContentStore();
