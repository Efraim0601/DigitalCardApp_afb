import { ADMIN_ROUTES } from './admin.routes';

describe('ADMIN_ROUTES', () => {
  it('exposes expected paths', () => {
    expect(ADMIN_ROUTES.length).toBeGreaterThan(0);
    const root = ADMIN_ROUTES[0];
    expect(root.path).toBe('');
    const children = (root.children ?? []).map((c) => c.path);
    expect(children).toEqual(jasmine.arrayContaining(['cards', 'departments', 'job-titles', 'account', 'share-stats', '']));
  });

  it('wildcard redirects to cards', () => {
    const wildcard = ADMIN_ROUTES[ADMIN_ROUTES.length - 1];
    expect(wildcard.path).toBe('**');
    expect(wildcard.redirectTo).toBe('cards');
  });

  it('lazy-loads each child component', async () => {
    const root = ADMIN_ROUTES[0];
    for (const child of root.children ?? []) {
      if (typeof child.loadComponent === 'function') {
        const mod = await (child.loadComponent as any)();
        expect(mod).toBeTruthy();
      }
    }
    if (typeof (root as any).loadComponent === 'function') {
      const mod = await (root as any).loadComponent();
      expect(mod).toBeTruthy();
    }
  });
});
