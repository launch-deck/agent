import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileGridComponent } from './tile-grid.component';

describe('TileGridComponent', () => {
  let component: TileGridComponent;
  let fixture: ComponentFixture<TileGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TileGridComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TileGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
