import DefaultTheme from 'vitepress/theme';
import DemoBox from './DemoBox.vue';
import './custom.css';
import { initIframeResizer } from './iframe-resizer.js';

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        // Register globally under a custom HTML tag name
        app.component('DemoBox', DemoBox);
        
        // This executes once when the documentation app boots up in the browser
        initIframeResizer();
    }
};