import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SharePopoverComponent } from './share-popover.component';

describe('SharePopoverComponent', () => {
  let fixture: ComponentFixture<SharePopoverComponent>;
  let component: SharePopoverComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharePopoverComponent, TranslateModule.forRoot()]
    }).compileComponents();
    fixture = TestBed.createComponent(SharePopoverComponent);
    component = fixture.componentInstance;
  });

  it('is created with default inputs', () => {
    expect(component.isOpen).toBeFalse();
    expect(component.isBusy).toBeFalse();
    expect(component.isCreator).toBeFalse();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('emits outputs', () => {
    const outputs = ['shareImage', 'shareLink', 'shareQr', 'copyEmployeeLink'] as const;
    for (const name of outputs) {
      const spy = jasmine.createSpy(name);
      component[name].subscribe(spy);
      component[name].emit();
      expect(spy).toHaveBeenCalled();
    }
  });

  it('renders when open with creator features', () => {
    component.isOpen = true;
    component.isCreator = true;
    component.isBusy = true;
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
