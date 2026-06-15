import * as vite from 'vite';
import { defineConfig } from "vite";
import type { ConfigEnv } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";

import {
  makeTagger,
  injectedGuiListenerPlugin,
  injectOnErrorPlugin,
  monitorPlugin
} from "miaoda-sc-plugin";

export default defineConfig((env: ConfigEnv) => {
  const viteVersionInfo = {
    version: vite.version,
    rollupVersion: (vite as any).rollupVersion ?? null,
    rolldownVersion: (vite as any).rolldownVersion ?? null,
    isRolldownVite: 'rolldownVersion' in vite
  };

  return {
    define: {
      __VITE_INFO__: JSON.stringify(viteVersionInfo)
    },

    cacheDir: path.resolve(__dirname, "node_modules/.vite"),

    server: {
      port: 5173,
      strictPort: true,
      warmup: {
        clientFiles: ["./src/main.tsx"]
      }
    },

    plugins: [
      makeTagger(),

      injectedGuiListenerPlugin({
        path: 'https://miaoda-resource-static.s3cdn.medo.dev/common/v2/injected.js'
      }),

      injectOnErrorPlugin(),

      // 🔧 HMR toggle plugin
      {
        name: 'hmr-toggle',
        configureServer(server) {
          let hmrEnabled = true;

          const _send = server.ws.send;

          server.ws.send = (payload) => {
            if (!hmrEnabled) return;
            return _send.call(server.ws, payload);
          };

          server.middlewares.use('/innerapi/v1/sourcecode/__hmr_off', (req, res) => {
            hmrEnabled = false;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 0, msg: 'HMR disabled' }));
          });

          server.middlewares.use('/innerapi/v1/sourcecode/__hmr_on', (req, res) => {
            hmrEnabled = true;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 0, msg: 'HMR enabled' }));
          });

          server.middlewares.use('/innerapi/v1/sourcecode/__hmr_reload', (req, res) => {
            if (hmrEnabled) {
              server.ws.send({
                type: 'full-reload',
                path: '*'
              });
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 0, msg: 'Reload triggered' }));
          });
        },

        load(id) {
          if (id === 'virtual:after-update') {
            return `
              if (import.meta.hot) {
                import.meta.hot.on('vite:afterUpdate', () => {
                  window.postMessage({ type: 'editor-update' }, '*');
                });
              }
            `;
          }
        },

        transformIndexHtml(html) {
          return {
            html,
            tags: [
              {
                tag: 'script',
                attrs: {
                  type: 'module',
                  src: '/@id/virtual:after-update'
                },
                injectTo: 'body'
              }
            ]
          };
        }
      },

      monitorPlugin({
        scriptSrc: 'https://miaoda-resource-static.s3cdn.medo.dev/sentry/browser.sentry.min.js',
        sentryDsn: 'https://e3c07b90fcb5207f333d50ac24a99d3e@sentry.miaoda.cn/233',
        environment: 'development',
        appId: 'app-ai3sybx9mo01'
      })
    ]
  };
});