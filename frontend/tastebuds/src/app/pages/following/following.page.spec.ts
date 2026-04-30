import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FollowingPage } from './following.page';

describe('FollowingPage', () => {
  let component: FollowingPage;
  let fixture: ComponentFixture<FollowingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
