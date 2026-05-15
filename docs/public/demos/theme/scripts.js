import { Theme, Registry } from '../../src/index.js';

const theme = new Theme('html', {
    trigger: '[theme-trigger]',
    showTitle: false
});

// theme.on('change', (instance) => console.log(instance));

// document.documentElement.addEventListener('ui:change', (e) => console.log(e));