import { appConfig } from './app.config';

describe('appConfig', () => {
  it('exports a providers array', () => {
    expect(Array.isArray(appConfig.providers)).toBeTrue();
    expect(appConfig.providers.length).toBeGreaterThan(0);
  });
});
