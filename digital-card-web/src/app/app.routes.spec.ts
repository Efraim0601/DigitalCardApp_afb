import { routes } from './app.routes';

describe('app routes', () => {
  it('redirect root to login', () => {
    expect(routes.find((r) => r.path === '')?.redirectTo).toBe('login');
  });

  it('has lazy-loaded login and card routes', async () => {
    const login = routes.find((r) => r.path === 'login')!;
    expect(await (login as any).loadComponent()).toBeTruthy();
    const card = routes.find((r) => r.path === 'card')!;
    expect(await (card as any).loadComponent()).toBeTruthy();
  });

  it('lazy-loads admin children', async () => {
    const admin = routes.find((r) => r.path === 'admin')!;
    const children = await (admin as any).loadChildren();
    expect(Array.isArray(children)).toBeTrue();
  });

  it('wildcard redirects to login', () => {
    expect(routes.find((r) => r.path === '**')?.redirectTo).toBe('login');
  });
});
