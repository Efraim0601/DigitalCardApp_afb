import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CardsService } from '../../../shared/services/cards.service';
import { CardPageComponent } from './card-page.component';

describe('CardPageComponent', () => {
  let cards: { getByEmail: jasmine.Spy };
  let router: any;
  let queryParamMap$: BehaviorSubject<any>;

  function makeRoute(initial: Record<string, string>) {
    queryParamMap$ = new BehaviorSubject(convertToParamMap(initial));
    return {
      queryParamMap: queryParamMap$.asObservable(),
      snapshot: { queryParamMap: convertToParamMap(initial) }
    } as unknown as ActivatedRoute;
  }

  function setup(params: Record<string, string>) {
    cards = { getByEmail: jasmine.createSpy().and.returnValue(of({ id: '1', email: params['email'] ?? '' })) };
    router = { navigate: jasmine.createSpy('navigate'), url: '/card?email=' + (params['email'] ?? '') };

    TestBed.configureTestingModule({
      imports: [CardPageComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ActivatedRoute, useValue: makeRoute(params) },
        { provide: CardsService, useValue: cards },
        { provide: Router, useValue: router }
      ]
    });
    return TestBed.createComponent(CardPageComponent);
  }

  it('sets errorKey when email missing', () => {
    const fixture = setup({});
    expect(fixture.componentInstance.errorKey()).toBe('card.errors.missingEmail');
    expect(fixture.componentInstance.isLoading()).toBeFalse();
  });

  it('loads card when email present', () => {
    const fixture = setup({ email: 'a@b.com' });
    expect(cards.getByEmail).toHaveBeenCalledWith('a@b.com');
    expect(fixture.componentInstance.card()?.email).toBe('a@b.com');
    expect(fixture.componentInstance.isLoading()).toBeFalse();
  });

  it('sets not-found when getByEmail errors', () => {
    cards = { getByEmail: jasmine.createSpy().and.returnValue(throwError(() => new Error('nope'))) };
    router = { navigate: jasmine.createSpy(), url: '/card?email=a' };
    TestBed.configureTestingModule({
      imports: [CardPageComponent, TranslateModule.forRoot()],
      providers: [
        { provide: ActivatedRoute, useValue: makeRoute({ email: 'a@b.com' }) },
        { provide: CardsService, useValue: cards },
        { provide: Router, useValue: router }
      ]
    });
    const fixture = TestBed.createComponent(CardPageComponent);
    expect(fixture.componentInstance.errorKey()).toBe('card.errors.notFound');
  });

  it('marks isCreator when owner=1 and employee!=1', () => {
    const fixture = setup({ email: 'a@b.com', owner: '1' });
    expect(fixture.componentInstance.isCreator()).toBeTrue();
  });

  it('backToLogin navigates to /login', () => {
    const fixture = setup({ email: 'a@b.com' });
    fixture.componentInstance.backToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('publicUrl excludes owner/employee', () => {
    const fixture = setup({ email: 'a@b.com', owner: '1', employee: '1' });
    const pub = fixture.componentInstance.publicUrl();
    expect(pub).not.toContain('owner');
    expect(pub).not.toContain('employee');
    expect(fixture.componentInstance.employeeUrl()).toContain('employee=1');
  });
});
