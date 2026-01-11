import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { FfsjAlertService } from 'ffsj-web-components';
import { FirebaseStorageService } from '../../../services/storage.service';
import { VotacionesFormComponent } from './votaciones-form.component';

describe('VotacionesFormComponent', () => {
  let fixture: ComponentFixture<VotacionesFormComponent>;
  let component: VotacionesFormComponent;
  let fb: FormBuilder;
  let storageMock: { uploadImage: jasmine.Spy };

  beforeEach(async () => {
    storageMock = {
      uploadImage: jasmine.createSpy('uploadImage').and.resolveTo('https://example.com/image.png')
    };

    await TestBed.configureTestingModule({
      imports: [VotacionesFormComponent],
      providers: [
        FormBuilder,
        { provide: FirebaseStorageService, useValue: storageMock },
        { provide: FfsjAlertService, useValue: { danger: () => {} } }
      ]
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
    fixture = TestBed.createComponent(VotacionesFormComponent);
    component = fixture.componentInstance;
    component.votacionesForm = fb.group({
      title: [''],
      totalVotes: [10],
      winnersCount: [1],
      voteOptions: [1],
      candidaturas: fb.array([])
    });
    fixture.detectChanges();
  });

  it('adds a simple candidatura when label is provided', () => {
    component.typeControl.setValue('simple');
    component.labelControl.setValue('Opcion A');
    component.addCandidatura();

    const candidaturas = component.candidaturas as FormArray;
    expect(candidaturas.length).toBe(1);
    expect(candidaturas.at(0).get('label')?.value).toBe('Opcion A');
  });

  it('rejects a multiple candidatura without valid fields', () => {
    component.typeControl.setValue('multiple');
    component.addField();
    component.addCandidatura();

    const candidaturas = component.candidaturas as FormArray;
    expect(candidaturas.length).toBe(0);

    const field = component.fieldsControls.at(0) as FormGroup;
    field.get('key')?.setValue('nombre');
    field.get('value')?.setValue('Valor');
    component.addCandidatura();

    expect(candidaturas.length).toBe(1);
  });

  it('requires nombre and foguera for jurado candidaturas', () => {
    component.typeControl.setValue('jurado');
    component.addCandidatura();
    expect(component.candidaturas.length).toBe(0);

    component.juradoGroup.get('nombre')?.setValue('Ana');
    component.juradoGroup.get('foguera')?.setValue('Foguera X');
    component.addCandidatura();
    expect(component.candidaturas.length).toBe(1);
  });

  it('shows label for jurado candidaturas', () => {
    const group = fb.group({
      type: ['jurado'],
      label: [''],
      jurado: fb.group({
        nombre: ['Luis'],
        foguera: ['Centro']
      })
    });

    expect(component.getCandidaturaLabel(group)).toBe('Luis - Centro');
  });

  it('updates an existing candidatura when editing', () => {
    component.typeControl.setValue('simple');
    component.labelControl.setValue('Opcion A');
    component.addCandidatura();

    const first = component.candidaturas.at(0);
    component.editCandidatura(first, 0);
    component.labelControl.setValue('Opcion B');
    component.addCandidatura();

    expect(component.candidaturas.at(0).get('label')?.value).toBe('Opcion B');
  });

  it('keeps candidaturas when type change is cancelled', () => {
    component.labelControl.setValue('Opcion A');
    component.addCandidatura();
    expect(component.candidaturas.length).toBe(1);

    spyOn(window, 'confirm').and.returnValue(false);
    component.typeControl.setValue('jurado');

    expect(component.candidaturas.length).toBe(1);
    expect(component.typeControl.value).toBe('simple');
  });

  it('clears candidaturas when type change is accepted', () => {
    component.labelControl.setValue('Opcion A');
    component.addCandidatura();
    expect(component.candidaturas.length).toBe(1);

    spyOn(window, 'confirm').and.returnValue(true);
    component.typeControl.setValue('jurado');

    expect(component.candidaturas.length).toBe(0);
    expect(component.typeControl.value).toBe('jurado');
  });
});
