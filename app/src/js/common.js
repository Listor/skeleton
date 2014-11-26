require.config({
    config: {
        i18n: {
            locale: 'de'
        }
    },
    shim: {
    },
    paths: {
        requirejs: 'lib/requirejs/require',
        text: 'lib/requirejs/text',
        comp: 'components'
    }
});
require(['css', 'main']);