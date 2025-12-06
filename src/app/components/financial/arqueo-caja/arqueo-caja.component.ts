import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArqueoCajaService } from '../../../services/arqueo-caja.service';
import { CajaService } from '../../../services/caja.service';
import { AuthService } from '../../../services/auth.service';
import { ArqueoCaja, Caja } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-arqueo-caja',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './arqueo-caja.component.html',
})
export class ArqueoCajaComponent implements OnInit {
  arqueos: ArqueoCaja[] = [];
  cajas: Caja[] = [];
  form: FormGroup;
  isModalOpen = false;
  isLoading = false;
  totalCalculado = 0;

  constructor(
    private arqueoService: ArqueoCajaService,
    private cajaService: CajaService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      caja_id: ['', Validators.required],
      billete200: [0, [Validators.required, Validators.min(0)]],
      billete100: [0, [Validators.required, Validators.min(0)]],
      billete50: [0, [Validators.required, Validators.min(0)]],
      billete20: [0, [Validators.required, Validators.min(0)]],
      billete10: [0, [Validators.required, Validators.min(0)]],
      moneda5: [0, [Validators.required, Validators.min(0)]],
      moneda2: [0, [Validators.required, Validators.min(0)]],
      moneda1: [0, [Validators.required, Validators.min(0)]],
      moneda050: [0, [Validators.required, Validators.min(0)]],
      moneda020: [0, [Validators.required, Validators.min(0)]],
      moneda010: [0, [Validators.required, Validators.min(0)]],
    });

    this.form.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
  }

  ngOnInit(): void {
    this.loadArqueos();
    this.loadCajas();
  }

  loadCajas(): void {
    this.cajaService.getAll().subscribe(res => this.cajas = res.data);
  }

  loadArqueos(): void {
    this.isLoading = true;
    this.arqueoService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.arqueos = response.data;
        },
        error: (error) => console.error('Error loading arqueos', error)
      });
  }

  calculateTotal(): void {
    const v = this.form.value;
    this.totalCalculado =
      (v.billete200 || 0) * 200 +
      (v.billete100 || 0) * 100 +
      (v.billete50 || 0) * 50 +
      (v.billete20 || 0) * 20 +
      (v.billete10 || 0) * 10 +
      (v.moneda5 || 0) * 5 +
      (v.moneda2 || 0) * 2 +
      (v.moneda1 || 0) * 1 +
      (v.moneda050 || 0) * 0.50 +
      (v.moneda020 || 0) * 0.20 +
      (v.moneda010 || 0) * 0.10;
  }

  openModal(): void {
    this.isModalOpen = true;
    this.form.reset({
      billete200: 0, billete100: 0, billete50: 0, billete20: 0, billete10: 0,
      moneda5: 0, moneda2: 0, moneda1: 0, moneda050: 0, moneda020: 0, moneda010: 0
    });
    this.totalCalculado = 0;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) return;

    const arqueoData = {
      ...this.form.value,
      user_id: this.authService.getCurrentUser()?.id,
      total_efectivo: this.totalCalculado
    };

    this.arqueoService.create(arqueoData).subscribe({
      next: () => {
        this.loadArqueos();
        this.closeModal();
      },
      error: (error: any) => console.error('Error creating arqueo', error)
    });
  }
}
