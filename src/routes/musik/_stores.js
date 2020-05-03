import { writable } from 'svelte/store';

export const aPlayer = writable();
export const audioFrequencies = writable(new Uint8Array(1024));
