import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ClassService } from '../core/services/class.service';
import { StudentsComponent } from './students.component';

describe('StudentsComponent', () => {
  let component: StudentsComponent;
  let fixture: ComponentFixture<StudentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentsComponent],
      providers: [
        provideRouter([]),
        importProvidersFrom(MatDialogModule),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({})),
          },
        },
        {
          provide: ClassService,
          useValue: {
            getClasses: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
