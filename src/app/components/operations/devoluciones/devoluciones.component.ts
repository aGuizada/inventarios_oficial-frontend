import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DevolucionService } from '../../../services/devolucion.service';
import { DevolucionVenta } from '../../../interfaces';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-devoluciones',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        PaginationComponent
    ],
    templateUrl: './devoluciones.component.html'
})
export class DevolucionesComponent implements OnInit {
    devoluciones: DevolucionVenta[] = [];
    isLoading = false;

    // Pagination
    currentPage = 1;
    lastPage = 1;
    total = 0;
    perPage = 15;

    // Filters
    fechaDesde = '';
    fechaHasta = '';
    estado = '';

    constructor(private devolucionService: DevolucionService) { }

    ngOnInit(): void {
        this.loadDevoluciones();
    }

    loadDevoluciones(): void {
        this.isLoading = true;

        const params: any = {
            page: this.currentPage,
            per_page: this.perPage
        };

        if (this.fechaDesde) params.fecha_desde = this.fechaDesde;
        if (this.fechaHasta) params.fecha_hasta = this.fechaHasta;
        if (this.estado) params.estado = this.estado;

        this.devolucionService.getAll(params)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: (response) => {
                    if (response.data) {
                        this.devoluciones = response.data.data || [];
                        this.currentPage = response.data.current_page;
                        this.lastPage = response.data.last_page;
                        this.total = response.data.total;
                    }
                },
                error: (error) => console.error('Error loading devoluciones', error)
            });
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadDevoluciones();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadDevoluciones();
    }
}
