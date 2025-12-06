import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArqueoCajaService } from '../../../services/arqueo-caja.service';
import { CajaService } from '../../../services/caja.service';
import { AuthService } from '../../../services/auth.service';
import { ArqueoCaja, Caja } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { ArqueosListComponent } from './arqueos-list/arqueos-list.component';
import { ArqueoFormComponent } from './arqueo-form/arqueo-form.component';

@Component({
  selector: 'app-arqueo-caja',
  standalone: true,
  imports: [
    CommonModule,
    ArqueosListComponent,
    ArqueoFormComponent
  ],
  templateUrl: './arqueo-caja.component.html',
})
export class ArqueoCajaComponent implements OnInit {
  arqueos: ArqueoCaja[] = [];
  cajas: Caja[] = [];
  isFormModalOpen = false;
  isLoading = false;

  constructor(
    private arqueoService: ArqueoCajaService,
    private cajaService: CajaService,
    private authService: AuthService
  ) { }

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

  openFormModal(): void {
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
  }

  onSave(arqueoData: any): void {
    const data = {
      ...arqueoData,
      user_id: this.authService.getCurrentUser()?.id
    };

    this.isLoading = true;
    this.arqueoService.create(data)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.loadArqueos();
          this.closeFormModal();
        },
        error: (error: any) => console.error('Error creating arqueo', error)
      });
  }
}
