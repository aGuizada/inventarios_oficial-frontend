import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Industria } from '../../../../interfaces';

@Component({
  selector: 'app-industria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './industria-form.component.html',
})
export class IndustriaFormComponent implements OnInit, OnChanges {
  @Input() industria: Industria | null = null;

  @Output() save = new EventEmitter<Industria>();
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
    this.loadIndustriaData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['industria'] && !changes['industria'].firstChange) {
      this.loadIndustriaData();
    }
  }

  loadIndustriaData(): void {
    if (this.industria) {
      this.isEditing = true;
      this.form.patchValue({
        nombre: this.industria.nombre,
        descripcion: this.industria.descripcion
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

