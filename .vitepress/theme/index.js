import DefaultTheme from 'vitepress/theme';
import DemoBox from './DemoBox.vue';
import './custom.css';

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        // Register globally under a custom HTML tag name
        app.component('DemoBox', DemoBox);
    }
};