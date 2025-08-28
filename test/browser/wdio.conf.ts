// NPM Modules
import type { Options } from '@wdio/types';

export const config = {
  autoCompileOpts: {
    tsNodeOpts: { transpileOnly: true, project: './browser/tsconfig.json' }
  },
  baseUrl: 'http://localhost:8080',
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: ['--headless=new', '--disable-gpu', '--window-size=1400,1000']
      }
    }
  ],
  connectionRetryCount: 2,
  connectionRetryTimeout: 90_000,
  framework: 'mocha',
  logLevel: 'info',
  maxInstances: 1,
  mochaOpts: { ui: 'bdd', timeout: 60_000 },
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'reports/allure-results',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false
      }
    ]
  ],
  runner: 'local',
  services: [
    [
      'static-server',
      {
        folders: [{ mount: '/', path: './test/browser/fixtures' }],
        port: 8080,
        middleware: []
      }
    ]
  ],
  specs: ['./specs/**/*.spec.ts'],
  waitforTimeout: 10_000
} as unknown as Options.Testrunner;
