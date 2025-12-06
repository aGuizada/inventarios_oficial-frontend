import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-catalog-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalog-form.component.html',
})
export class CatalogFormComponent implements OnInit {
  @Input() title: string = '';
  @Input() item: any = null;
  @Input() isMedida: boolean = false; // Special handling for medidas

  @Output() save = new EventEmitter<{ nombre: string; descripcion: string }>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  isEditing = false;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.isEditing = this.item !== null;

    if (this.isMedida) {
      this.form = this.fb.group({
        nombre_medida: [this.item?.nombre_medida || this.item?.nombre || '', [Validators.required, Validators.maxLength(100)]],
        descripcion: [this.item?.descripcion || '', [Validators.maxLength(255)]]
      });
    } else {
      this.form = this.fb.group({
        nombre: [this.item?.nombre || '', [Validators.required, Validators.maxLength(100)]],
        descripcion: [this.item?.descripcion || '', [Validators.maxLength(255)]]
      });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const value = this.form.value;

      // For medidas, convert nombre_medida to nombre for the API
      if (this.isMedida) {
        this.save.emit({
          nombre: value.nombre_medida,
          descripcion: value.descripcion
        });
      } else {
        this.save.emit(value);
      }
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get nombreControl() {
    return this.form.get(this.isMedida ? 'nombre_medida' : 'nombre');
  }

  get descripcionControl() {
    return this.form.get('descripcion');
  }
}
