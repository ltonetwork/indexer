import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationErrorComponent } from './verification-error.component';

describe('VerificationErrorComponent', () => {
  let component: VerificationErrorComponent;
  let fixture: ComponentFixture<VerificationErrorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VerificationErrorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VerificationErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
