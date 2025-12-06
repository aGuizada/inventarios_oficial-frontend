import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Medida } from '../../../../interfaces';

@Component({
  selector: 'app-medida-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medida-form.component.html',
})
export class MedidaFormComponent implements OnInit, OnChanges {
  @Input() medida: Medida | null = null;

  @Output() save = new EventEmitter<Medida>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre_medida: ['', [Validators.required, Validators.minLength(2)]],
      abreviatura: ['', [Validators.maxLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadMedidaData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['medida'] && !changes['medida'].firstChange) {
      this.loadMedidaData();
    }
  }

  loadMedidaData(): void {
    if (this.medida) {
      this.isEditing = true;
      this.form.patchValue({
        nombre_medida: this.medida.nombre_medida,
        abreviatura: this.medida.abreviatura
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

