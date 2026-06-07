import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { initTheme } from './lib/theme.svelte.js';

initTheme(); // apply persisted theme before first paint

export default mount(App, { target: document.getElementById('app') });
