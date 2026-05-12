import { defineConfig } from 'vitepress';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '../src');

function serveLibPlugin() {
    return {
        name: 'serve-lib',
        configureServer(server) {
            server.middlewares.use('/src', (req, res, next) => {
                const filePath = path.join(SRC_DIR, req.url.replace(/^\//, ''));
                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                    const ext = path.extname(filePath);
                    const mime = ext === '.js' 
                        ? 'application/javascript' 
                        : ext === '.css' 
                        ? 'text/css' 
                        : 'application/octet-stream';
                    res.setHeader('Content-Type', mime);
                    res.end(fs.readFileSync(filePath));
                } else {
                    next();
                }
            });
        }
    };
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Anilla UI",
    description: "A highly customizable and unopinionated UI components library, for faster web development.",

    // Tells VitePress to look for .md files in the docs folder
    srcDir: 'docs',

    // This keeps your URLs clean (e.g., ://domain.com instead of /docs/guide)
    rewrites: {
        'docs/:path*': ':path*'
    },

    vite: {
        server: {
            fs: { allow: ['..'] }
        },
        resolve: {
            alias: {
                '@anilla/ui': path.resolve(SRC_DIR, 'index.js') // for Vue/MD files
            }
        },
        plugins: [
            tailwindcss(),
            serveLibPlugin() // for iframe HTML files
        ]
    },

    // This removes .html from URLs
    cleanUrls: true,

    head: [
        ['link', { rel: 'manifest', href: '/site.webmanifest' }],
        ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
        ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
        ['link', { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-96x96.png' }],
        ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }]
    ],

    themeConfig: {
        // This enables H2 and H3 in the right sidebar
        outline: {
            level: [2, 3],
            label: 'On this page' // Optional: Customizes the header text
        },

        // https://vitepress.dev/reference/default-theme-config
        logo: '/logo.svg',

        nav: [
            {
                text: 'Home',
                link: '/'
            },
            {
                text: 'Docs',
                link: '/getting-started/introduction'
            },
            {
                text: 'Components',
                link: '/components/accordion'
            }
        ],

        sidebar: [
            {
                text: 'Getting Started',
                collapsed: false,
                items: [
                    {
                        text: 'Introduction',
                        link: '/getting-started/introduction'
                    },
                    {
                        text: 'Markdown Examples',
                        link: '/markdown-examples'
                    },
                    {
                        text: 'Runtime API Examples',
                        link: '/api-examples'
                    }
                ]
            },
            {
                text: 'Components',
                collapsed: false,
                items: [
                    {
                        text: 'Accordion',
                        link: '/components/accordion'
                    },
                    {
                        text: 'Carousel',
                        link: '/components/carousel'
                    },
                    {
                        text: 'Command',
                        link: '/components/command'
                    },
                    {
                        text: 'Context Menu',
                        link: '/components/context-menu'
                    },
                    {
                        text: 'Cropper',
                        link: '/components/cropper'
                    },
                    {
                        text: 'Date Picker',
                        link: '/components/date-picker'
                    },
                    {
                        text: 'Dropdown',
                        link: '/components/dropdown'
                    },
                    {
                        text: 'Input',
                        collapsed: true,
                        items: [
                            {
                                text: 'Auto Grow',
                                link: '/components/input/auto-grow'
                            },
                            {
                                text: 'Bind',
                                link: '/components/input/bind'
                            },
                            {
                                text: 'Check',
                                link: '/components/input/check'
                            },
                            {
                                text: 'Counter',
                                link: '/components/input/counter'
                            }
                        ]
                    },
                    {
                        text: 'Media Player',
                        link: '/components/media-player'
                    },
                    {
                        text: 'Modal',
                        link: '/components/modal'
                    },
                    {
                        text: 'Popover',
                        link: '/components/popover'
                    },
                    {
                        text: 'Resizable',
                        link: '/components/resizable'
                    },
                    {
                        text: 'Select',
                        link: '/components/select'
                    },
                    {
                        text: 'Sheet',
                        link: '/components/sheet'
                    },
                    {
                        text: 'Tabs',
                        link: '/components/tabs'
                    },
                    {
                        text: 'Theme',
                        link: '/components/theme'
                    },
                    {
                        text: 'Toast',
                        link: '/components/toast'
                    },
                    {
                        text: 'Tooltip',
                        link: '/components/tooltip'
                    }
                ]
            }
        ],

        socialLinks: [
            {
                icon: 'github',
                link: 'https://github.com/vuejs/vitepress'
            }
        ]
    }
})
