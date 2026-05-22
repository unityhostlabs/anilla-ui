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
                console.log('new');
                // console.log(e.data?.uiTheme);
                mode = sessionStorage.getItem(e.data?.id);
                reloaded = true;
            } else {
                mode = e.data?.uiTheme;
            }
            // let mode = sessionStorage.getItem(e.data?.id);
            // console.log(mode);
            // console.log(e.data);
            theme.change(mode);
        })