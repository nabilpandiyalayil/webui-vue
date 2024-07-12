//Work Required
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { resolve, dirname } from 'node:path';
import vue from '@vitejs/plugin-vue';
import basicSsl from '@vitejs/plugin-basic-ssl';
import Components from 'unplugin-vue-components/vite';
import { BootstrapVueNextResolver } from 'unplugin-vue-components/resolvers';
import viteCompression from 'vite-plugin-compression';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import replace from '@rollup/plugin-replace';

const CWD = process.cwd();
const DEV_ENV_CONFIG = loadEnv('developement', CWD);
const {
  VITE_BASE_URL,
  VITE_CUSTOM_STYLES,
  VITE_APP_ENV_NAME,
  VITE_CUSTOM_ROUTER,
  VITE_CUSTOM_APP_NAV,
  VITE_CUSTOM_STORE,
} = loadEnv(DEV_ENV_CONFIG, CWD);
const envStyle = () => {
  const envName = VITE_APP_ENV_NAME;
  const hasCustomStyles = VITE_CUSTOM_STYLES == 'true' ? true : false;
  if (hasCustomStyles && envName !== undefined) {
    // If there is an env name defined, import Sass
    // overrides.
    // It is important that these imports stay in this
    // order to make sure enviroment overrides
    // take precedence over the default BMC styles
    return `
      @use "sass:math";
      @import "@/assets/styles/bmc/helpers";
      @import "@/env/assets/styles/_${envName}";
      @import "@/assets/styles/bootstrap/_helpers";
    `;
  } else {
    return `
      @use "sass:math";
      @import "@/assets/styles/bmc/helpers";
      @import "@/assets/styles/bootstrap/_helpers";
    `;
  }
};

export default defineConfig({
  // other configurations...
  plugins: [
    vue(),
    Components({
      resolvers: [BootstrapVueNextResolver()],
    }),
    basicSsl(),
    viteCompression({ deleteOriginFile: true }),
    VueI18nPlugin({
      /* options */
      // locale messages resource pre-compile option
      include: resolve(
        dirname(fileURLToPath(import.meta.url)),
        './path/to/src/locales/**',
      ),
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: envStyle(),
        includePaths: ['node_modules'],
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['bootstrap'],
  },
  server: {
    https: true, // Enable HTTPS
    port: 8000, // TCP Port 8000 is commonly used for development environments of web server software.
    proxy: {
      // Proxy settings if you need to proxy API requests
      '/api': {
        target: VITE_BASE_URL,
        changeOrigin: true,
        // Bypass SSL certificate validation (for development only)
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          // Custom middleware to modify proxy response headers
          proxy.on('proxyRes', (proxyRes) => {
            const setCookieHeader = proxyRes.headers['set-cookie'];
            if (setCookieHeader) {
              proxyRes.headers['set-cookie'] = setCookieHeader.map(
                (cookie) => cookie + '; Path=/',
              );
            }
            // Remove the 'strict-transport-security' header
            delete proxyRes.headers['strict-transport-security'];
          });
        },
      },
    },
    // Custom middleware to add headers
    middlewares: [
      (req, res, next) => {
        res.setHeader('Connection', 'keep-alive');
        next();
      },
    ],
  },
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const crypto = require('crypto');
      const crypto_orig_createHash = crypto.createHash;
      crypto.createHash = (algorithm) =>
        crypto_orig_createHash(algorithm == 'md4' ? 'sha256' : algorithm);

      const envName = VITE_APP_ENV_NAME;
      const hasCustomStore = VITE_CUSTOM_STORE === 'true' ? true : false;
      const hasCustomRouter = VITE_CUSTOM_ROUTER === 'true' ? true : false;
      const hasCustomAppNav = VITE_CUSTOM_APP_NAV === 'true' ? true : false;

      if (envName !== undefined) {
        if (hasCustomStore) {
          res.locals.config.resolve.alias['./store$'] =
            `@/env/store/${envName}.js`;
          res.locals.config.resolve.alias['../store$'] =
            `@/env/store/${envName}.js`;
        }
        if (hasCustomRouter) {
          res.locals.config.resolve.alias['./routes$'] =
            `@/env/router/${envName}.js`;
        }
        if (hasCustomAppNav) {
          res.locals.config.resolve.alias['./AppNavigationMixin$'] =
            `@/env/components/AppNavigation/${envName}.js`;
        }
      }
      if (process.env.NODE_ENV === 'production') {
        res.locals.config.plugins.push(
          // eslint-disable-next-line no-undef
          new CompressionPlugin({
            deleteOriginalAssets: true,
          }),
        );
      }

      next();
    });
  },
  build: {
    chunkSizeWarningLimit: 1000,
    minify: true,
    rollupOptions: {
      external: ['bootstrap'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id
              .toString()
              .split('node_modules/')[1]
              .split('/')[0]
              .toString();
          }
        },
      },
      plugins: [
        replace({
          include: ['src/store/api.js'],
          '/api': "''",
          delimiters: ["'", "'"],
        }),
      ],
    },
  },
});
