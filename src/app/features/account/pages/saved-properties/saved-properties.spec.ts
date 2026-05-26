import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SavedProperties } from './saved-properties';

describe('SavedProperties', () => {
  let component: SavedProperties;
  let fixture: ComponentFixture<SavedProperties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedProperties],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedProperties);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
