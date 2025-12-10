import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogTableComponent } from './catalog-table/catalog-table.component';
import { CatalogFormComponent } from './catalog-form/catalog-form.component';
import { CategoriaService } from '../../../services/categoria.service';
import { MarcaService } from '../../../services/marca.service';
import { MedidaService } from '../../../services/medida.service';
import { IndustriaService } from '../../../services/industria.service';
import { ActivatedRoute } from '@angular/router';

type CatalogType = 'categorias' | 'marcas' | 'medidas' | 'industrias';

interface CatalogItem {
  id: number;
  nombre: string;
  descripcion?: string;
  nombre_medida?: string; // Para medidas
}

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, CatalogTableComponent, CatalogFormComponent],
  templateUrl: './catalogos.component.html',

})
export class CatalogosComponent implements OnInit {
  activeTab: CatalogType = 'categorias';

  // Data for each catalog
  categorias: CatalogItem[] = [];
  marcas: CatalogItem[] = [];
  medidas: CatalogItem[] = [];
  industrias: CatalogItem[] = [];

  // UI State
  isLoading = false;
  isFormModalOpen = false;
  selectedItem: CatalogItem | null = null;

  // Pagination
  currentPage = 1;
  lastPage = 1;
  totalItems = 0;
  perPage = 10;

  constructor(
    private categoriaService: CategoriaService,
    private marcaService: MarcaService,
    private medidaService: MedidaService,
    private industriaService: IndustriaService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Check for tab parameter in URL
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'] as CatalogType;
      }
    });

    this.loadData();
  }

  changeTab(tab: CatalogType): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    const service = this.getService();
    service.getAll(this.currentPage, this.perPage).subscribe({
      next: (response: any) => {
        const items = response.data || response;

        // Store in appropriate array based on active tab
        switch (this.activeTab) {
          case 'categorias':
            this.categorias = items;
            break;
          case 'marcas':
            this.marcas = items;
            break;
          case 'medidas':
            this.medidas = items;
            break;
          case 'industrias':
            this.industrias = items;
            break;
        }

        // Update pagination
        this.currentPage = response.current_page || 1;
        this.lastPage = response.last_page || 1;
        this.totalItems = response.total || items.length;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error(`Error loading ${this.activeTab}:`, error);
        this.isLoading = false;
      }
    });
  }

  getService(): any {
    switch (this.activeTab) {
      case 'categorias': return this.categoriaService;
      case 'marcas': return this.marcaService;
      case 'medidas': return this.medidaService;
      case 'industrias': return this.industriaService;
    }
  }

  getCurrentItems(): CatalogItem[] {
    switch (this.activeTab) {
      case 'categorias': return this.categorias;
      case 'marcas': return this.marcas;
      case 'medidas': return this.medidas;
      case 'industrias': return this.industrias;
    }
  }

  getTitleSingular(): string {
    const titles: Record<CatalogType, string> = {
      'categorias': 'Categoría',
      'marcas': 'Marca',
      'medidas': 'Medida',
      'industrias': 'Industria'
    };
    return titles[this.activeTab];
  }

  getTitlePlural(): string {
    const titles: Record<CatalogType, string> = {
      'categorias': 'Categorías',
      'marcas': 'Marcas',
      'medidas': 'Medidas',
      'industrias': 'Industrias'
    };
    return titles[this.activeTab];
  }

  // CRUD Operations
  openCreateModal(): void {
    this.selectedItem = null;
    this.isFormModalOpen = true;
  }

  openEditModal(item: CatalogItem): void {
    this.selectedItem = item;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedItem = null;
  }

  onSave(data: { nombre: string; descripcion: string }): void {
    const service = this.getService();

    // Para medidas, transformar 'nombre' a 'nombre_medida'
    let requestData: any = { ...data };
    if (this.activeTab === 'medidas') {
      requestData = {
        nombre_medida: data.nombre,
        descripcion: data.descripcion
      };
    }

    if (this.selectedItem) {
      // Update
      service.update(this.selectedItem.id, requestData).subscribe({
        next: () => {
          this.loadData();
          this.closeFormModal();
        },
        error: (error: any) => {
          console.error('Error updating:', error);
          const errorMessage = error?.error?.message || error?.error?.errors || 'Error al actualizar el registro';
          alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        }
      });
    } else {
      // Create
      service.create(requestData).subscribe({
        next: () => {
          this.loadData();
          this.closeFormModal();
        },
        error: (error: any) => {
          console.error('Error creating:', error);
          const errorMessage = error?.error?.message || error?.error?.errors || 'Error al crear el registro';
          alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        }
      });
    }
  }

  onDelete(id: number): void {
    if (!confirm(`¿Está seguro de eliminar este registro?`)) {
      return;
    }

    const service = this.getService();
    service.delete(id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (error: any) => {
        console.error('Error deleting:', error);
        alert('Error al eliminar el registro');
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }
}
