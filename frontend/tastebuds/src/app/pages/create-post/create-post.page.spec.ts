import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreatePostPage } from './create-post.page';

describe('CreatePostPage', () => {
  let component: CreatePostPage;
  let fixture: ComponentFixture<CreatePostPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatePostPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
