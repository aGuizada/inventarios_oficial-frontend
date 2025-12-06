import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Empresa } from '../../../../interfaces';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './empresa-form.component.html',
})
export class EmpresaFormComponent implements OnInit, OnChanges {
  @Input() empresa: Empresa | null = null;

  @Output() save = new EventEmitter<Empresa>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      nit: [''],
      direccion: [''],
      telefono: [''],
      email: ['', [Validators.email]],
      logo: ['']
    });
  }

  ngOnInit(): void {
    this.loadEmpresaData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['empresa'] && !changes['empresa'].firstChange) {
      this.loadEmpresaData();
    }
  }

  loadEmpresaData(): void {
    if (this.empresa) {
      this.isEditing = true;
      this.form.patchValue({
        nombre: this.empresa.nombre,
        nit: this.empresa.nit,
        direccion: this.empresa.direccion,
        telefono: this.empresa.telefono,
        email: this.empresa.email,
        logo: this.empresa.logo
      });
    } else {
      this.isEditing = false;
      this.form.reset();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit(this.form.value);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

