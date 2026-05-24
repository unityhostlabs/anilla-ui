        import { Theme } from '../../src/components/Theme.js';

        let theme = undefined;
        let reloaded = false;
        let mode = 'light';

        window.addEventListener('message', (e) => {
            if (!theme) {
                theme = new Theme('html', {
                    storageKey: e.data?.id,
                    storageType: 'session'
                });
            }
            
            if (!reloaded) {
                mode = sessionStorage.getItem(e.data?.id);
                reloaded = true;
            } else {
                mode = e.data?.uiTheme;
            }

            if (theme) {
                theme.change(mode);
            }
        })