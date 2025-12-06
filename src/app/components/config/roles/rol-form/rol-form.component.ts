import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Rol } from '../../../../interfaces';

@Component({
  selector: 'app-rol-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rol-form.component.html',
})
export class RolFormComponent implements OnInit, OnChanges {
  @Input() rol: Rol | null = null;

  @Output() save = new EventEmitter<Rol>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      estado: [true]
    });
  }

  ngOnInit(): void {
    this.loadRolData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rol'] && !changes['rol'].firstChange) {
      this.loadRolData();
    }
  }

  loadRolData(): void {
    if (this.rol) {
      this.isEditing = true;
      this.form.patchValue({
        nombre: this.rol.nombre,
        descripcion: this.rol.descripcion,
        estado: this.rol.estado
      });
    } else {
      this.isEditing = false;
      this.form.reset({ estado: true });
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

