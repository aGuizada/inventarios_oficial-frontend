import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria } from '../../../../interfaces';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categoria-form.component.html',
})
export class CategoriaFormComponent implements OnInit, OnChanges {
  @Input() categoria: Categoria | null = null;

  @Output() save = new EventEmitter<Categoria>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategoriaData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoria'] && !changes['categoria'].firstChange) {
      this.loadCategoriaData();
    }
  }

  loadCategoriaData(): void {
    if (this.categoria) {
      this.isEditing = true;
      this.form.patchValue({
        nombre: this.categoria.nombre,
        descripcion: this.categoria.descripcion
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

