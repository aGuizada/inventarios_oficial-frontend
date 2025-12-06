import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Marca } from '../../../../interfaces';

@Component({
  selector: 'app-marca-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './marca-form.component.html',
})
export class MarcaFormComponent implements OnInit, OnChanges {
  @Input() marca: Marca | null = null;

  @Output() save = new EventEmitter<Marca>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    this.loadMarcaData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['marca'] && !changes['marca'].firstChange) {
      this.loadMarcaData();
    }
  }

  loadMarcaData(): void {
    if (this.marca) {
      this.isEditing = true;
      this.form.patchValue({
        nombre: this.marca.nombre,
        descripcion: this.marca.descripcion
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

