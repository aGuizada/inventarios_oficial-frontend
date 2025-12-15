import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateFilter, FilterMode } from '../../../interfaces/date-filter.interface';
import { DashboardService } from '../../../services/dashboard.service';

/**
 * Componente reutilizable para filtros de fecha
 * Permite filtrar por: rango de fechas, mes/año, o fecha específica
 */
@Component({
    selector: 'app-date-filter',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './date-filter.component.html',

})
export class DateFilterComponent implements OnInit {
    @Output() filterChanged = new EventEmitter<DateFilter>();
    @Output() filterReset = new EventEmitter<void>();

    filterForm!: FormGroup;
    filterMode: FilterMode = FilterMode.MONTH_YEAR;
    FilterModeEnum = FilterMode;

    // Estado del modal
    isOpen: boolean = false;

    // Datos para selectores
    years: number[] = [];
    months: { value: number, label: string }[] = [
        { value: 1, label: 'Enero' },
        { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' },
        { value: 12, label: 'Diciembre' }
    ];
    days: number[] = [];
    sucursales: any[] = [];

    constructor(
        private fb: FormBuilder,
        private dashboardService: DashboardService
    ) {
        this.initForm();
        this.generateYears();
    }

    ngOnInit(): void {
        this.loadSucursales();
        // Suscribirse a cambios para actualizar días disponibles
        this.filterForm.get('year')?.valueChanges.subscribe(() => this.updateDays());
        this.filterForm.get('month')?.valueChanges.subscribe(() => this.updateDays());
    }

    private loadSucursales(): void {
        this.dashboardService.getSucursales().subscribe({
            next: (data: any[]) => this.sucursales = data,
            error: (err: any) => console.error('Error cargando sucursales', err)
        });
    }

    /**
     * Inicializa el formulario reactivo
     */
    private initForm(): void {
        const today = new Date();

        this.filterForm = this.fb.group({
            mode: [FilterMode.MONTH_YEAR],
            fecha_inicio: [null],
            fecha_fin: [null],
            year: [today.getFullYear()],
            month: [today.getMonth() + 1],
            day: [today.getDate()],
            sucursal_id: [null]
        });

        this.updateDays();
    }

    /**
     * Actualiza la lista de días disponibles según mes y año
     */
    updateDays(): void {
        const year = this.filterForm.get('year')?.value;
        const month = this.filterForm.get('month')?.value;

        if (!year || !month) {
            this.days = [];
            return;
        }

        const daysInMonth = new Date(year, month, 0).getDate();
        this.days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }

    /**
     * Genera lista de años (últimos 5 años + año actual + próximos 2)
     */
    private generateYears(): void {
        const currentYear = new Date().getFullYear();
        this.years = [];
        for (let i = currentYear - 5; i <= currentYear + 2; i++) {
            this.years.push(i);
        }
    }

    /**
     * Establece valores por defecto (mes actual)
     */
    private setDefaultValues(): void {
        const now = new Date();
        this.filterForm.patchValue({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            sucursal_id: null
        });
        this.updateDays();
    }

    /**
     * Cambia el modo de filtro
     */
    setFilterMode(mode: FilterMode): void {
        this.filterMode = mode;
        // Mantener sucursal al cambiar de modo
        const sucursalId = this.filterForm.get('sucursal_id')?.value;

        this.filterForm.reset();
        this.filterForm.patchValue({ sucursal_id: sucursalId });

        if (mode === FilterMode.MONTH_YEAR || mode === FilterMode.SPECIFIC_DATE) {
            this.setDefaultValues();
            // Restaurar sucursal si setDefaultValues lo borró (aunque lo modifiqué para que no lo haga, mejor asegurar)
            this.filterForm.patchValue({ sucursal_id: sucursalId });
        }
    }

    /**
     * Alterna la visibilidad del modal de filtros
     */
    toggleFilters(): void {
        this.isOpen = !this.isOpen;
    }

    /**
     * Aplica el filtro y emite el evento
     */
    applyFilter(): void {
        const filters: DateFilter = {};

        // Agregar sucursal si está seleccionada
        const sucursalId = this.filterForm.get('sucursal_id')?.value;
        if (sucursalId) {
            filters.sucursal_id = sucursalId;
        }

        if (this.filterMode === FilterMode.RANGE) {
            if (this.filterForm.value.fecha_inicio && this.filterForm.value.fecha_fin) {
                filters.fecha_inicio = this.filterForm.value.fecha_inicio;
                filters.fecha_fin = this.filterForm.value.fecha_fin;
            } else {
                alert('Por favor seleccione ambas fechas para el rango');
                return;
            }
        } else if (this.filterMode === FilterMode.MONTH_YEAR) {
            if (this.filterForm.value.year && this.filterForm.value.month) {
                filters.year = this.filterForm.value.year;
                filters.month = this.filterForm.value.month;
            } else {
                alert('Por favor seleccione año y mes');
                return;
            }
        } else if (this.filterMode === FilterMode.SPECIFIC_DATE) {
            if (this.filterForm.value.year && this.filterForm.value.month && this.filterForm.value.day) {
                filters.year = this.filterForm.value.year;
                filters.month = this.filterForm.value.month;
                filters.day = this.filterForm.value.day;
            } else {
                alert('Por favor seleccione año, mes y día');
                return;
            }
        }

        this.filterChanged.emit(filters);
        this.isOpen = false; // Cerrar modal al aplicar
    }

    /**
     * Resetea el filtro
     */
    resetFilter(): void {
        this.filterForm.reset();
        this.setDefaultValues();
        this.filterReset.emit();
        // No cerramos el modal al resetear para permitir aplicar nuevos filtros
    }

    /**
     * Obtiene los días del mes seleccionado
     * @deprecated Usar updateDays y la propiedad days
     */
    getDaysInMonth(): number[] {
        return this.days;
    }
}
