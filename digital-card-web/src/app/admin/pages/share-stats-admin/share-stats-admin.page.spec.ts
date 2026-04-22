import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AdminService } from '../../../shared/services/admin.service';
import { ShareStatsAdminPageComponent } from './share-stats-admin.page';

describe('ShareStatsAdminPageComponent', () => {
  let admin: { listCards: jasmine.Spy };

  function create(list: any) {
    admin = { listCards: jasmine.createSpy().and.returnValue(list) };
    TestBed.configureTestingModule({
      imports: [ShareStatsAdminPageComponent, TranslateModule.forRoot()],
      providers: [{ provide: AdminService, useValue: admin }]
    });
    const fixture = TestBed.createComponent(ShareStatsAdminPageComponent);
    fixture.componentInstance.ngOnInit();
    return fixture;
  }

  it('loads cards on init', fakeAsync(() => {
    const items = [
      { id: '1', email: 'a@x.com', firstName: 'A', lastName: 'B', shareCount: 5 },
      { id: '2', email: 'b@x.com', shareCount: 10 }
    ];
    const fixture = create(of({ items, total: 2, limit: 1000, offset: 0 }));
    tick();
    expect(fixture.componentInstance.cards().length).toBe(2);
    expect(fixture.componentInstance.total()).toBe(2);
  }));

  it('handles empty result', fakeAsync(() => {
    const fixture = create(of(null));
    tick();
    expect(fixture.componentInstance.cards()).toEqual([]);
    expect(fixture.componentInstance.total()).toBe(0);
  }));

  it('handles error', fakeAsync(() => {
    const fixture = create(throwError(() => new Error('x')));
    tick();
    expect(fixture.componentInstance.error()).toBe('admin.shareStats.errors.loadError');
  }));

  it('filters and sorts', fakeAsync(() => {
    const items = [
      { id: '1', email: 'alpha@x.com', firstName: 'Alice', lastName: 'X', title: 'CEO', shareCount: 5 },
      { id: '2', email: 'beta@x.com', firstName: 'Bob', lastName: 'Y', title: 'CTO', shareCount: 10 },
      { id: '3', email: 'carl@x.com', firstName: 'Carl', lastName: 'Z', title: 'Dir', shareCount: 1 }
    ];
    const fixture = create(of({ items, total: 3, limit: 1000, offset: 0 }));
    tick();
    const c = fixture.componentInstance;

    c.onSearchChange('bob');
    expect(c.filteredCards().length).toBe(1);

    c.onSearchChange('');
    // Initial sort: sortBy='shareCount', sortOrder='desc' — so highest shareCount first
    expect(c.filteredCards()[0].id).toBe('2');

    c.toggleSort('shareCount'); // same column, flip desc -> asc
    expect(c.sortOrder()).toBe('asc');
    expect(c.filteredCards()[0].id).toBe('3');

    c.toggleSort('email'); // new column, resets to desc
    expect(c.sortBy()).toBe('email');
    expect(c.sortOrder()).toBe('desc');

    c.toggleSort('firstName'); // new column, desc
    expect(c.sortBy()).toBe('firstName');
    expect(c.filteredCards()[0].id).toBe('3'); // Carl desc

    expect(c.getFullName({ id: 'x', email: 'x@x', firstName: 'Al', lastName: 'B' } as any)).toBe('Al B');
    expect(c.getFullName({ id: 'x', email: 'x@x' } as any)).toBe('x@x');
    expect(c.getShareCount({ id: '1', email: 'a', shareCount: 3 } as any)).toBe(3);
    expect(c.getShareCount({ id: '1', email: 'a' } as any)).toBe(0);
    expect(c.getTotalShares()).toBe(16);
  }));
});
