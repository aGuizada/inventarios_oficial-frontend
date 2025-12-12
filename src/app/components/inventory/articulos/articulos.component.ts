import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticuloService } from '../../../services/articulo.service';
import { CategoriaService } from '../../../services/categoria.service';
import { MarcaService } from '../../../services/marca.service';
import { MedidaService } from '../../../services/medida.service';
import { IndustriaService } from '../../../services/industria.service';
import { ProveedorService } from '../../../services/proveedor.service';
import { Articulo, Categoria, Marca, Medida, Industria, Proveedor } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

// Import child components
import { ArticulosListComponent } from './articulos-list/articulos-list.component';
import { ArticuloFormComponent } from './articulo-form/articulo-form.component';
import { ArticuloImportComponent } from './articulo-import/articulo-import.component';
import { ArticuloDetailComponent } from './articulo-detail/articulo-detail.component';

@Component({
  selector: 'app-articulos',
  standalone: true,
  imports: [
    CommonModule,
    ArticulosListComponent,
    ArticuloFormComponent,
    ArticuloImportComponent,
    ArticuloDetailComponent
  ],
  templateUrl: './articulos.component.html'
})
export class ArticulosComponent implements OnInit {
  articulos: Articulo[] = [];
  categorias: Categoria[] = [];
  marcas: Marca[] = [];
  medidas: Medida[] = [];
  industrias: Industria[] = [];
  proveedores: Proveedor[] = [];

  isLoading = false;
  isFormModalOpen = false;
  isDetailModalOpen = false;
  selectedArticulo: Articulo | null = null;

  // Pagination
  currentPage = 1;
  perPage = 10;
  totalItems = 0;
  lastPage = 1;

  constructor(
    private articuloService: ArticuloService,
    private categoriaService: CategoriaService,
    private marcaService: MarcaService,
    private medidaService: MedidaService,
    private industriaService: IndustriaService,
    private proveedorService: ProveedorService
  ) {
    // Asegurar que articulos siempre sea un array
    this.articulos = [];
  }


  ngOnInit(): void {
    this.loadArticulos();
    this.loadDependencies();
  }

  loadDependencies(): void {
    this.categoriaService.getAll().subscribe(res => this.categorias = res.data);
    this.marcaService.getAll().subscribe(res => this.marcas = res.data);
    this.medidaService.getAll().subscribe(res => this.medidas = res.data);
    this.industriaService.getAll().subscribe(res => this.industrias = res.data);
    this.proveedorService.getAll().subscribe(res => this.proveedores = res.data);
  }

  loadArticulos(page: number = 1): void {
    this.isLoading = true;
    // Asegurar que articulos siempre sea un array antes de la llamada
    this.articulos = [];

    this.articuloService.getAll(page, this.perPage)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          console.log('Response recibida:', response);

          // Intentar formato paginado
          const paginated = response?.data as any;
          if (paginated && typeof paginated === 'object' && Array.isArray(paginated.data)) {
            this.articulos = paginated.data;
            this.currentPage = paginated.current_page || 1;
            this.lastPage = paginated.last_page || 1;
            this.totalItems = paginated.total || 0;
            return;
          }

          // Formato antiguo (array directo)
          const asArray = response?.data as any;
          if (Array.isArray(asArray)) {
            this.articulos = asArray;
            this.currentPage = 1;
            this.lastPage = 1;
            this.totalItems = asArray.length || 0;
            return;
          }

          // Fallback
          console.warn('Response sin formato esperado:', response);
          this.articulos = [];
          this.currentPage = 1;
          this.lastPage = 1;
          this.totalItems = 0;
        },
        error: (error) => {
          console.error('Error loading articulos', error);
          this.articulos = [];
          this.currentPage = 1;
          this.lastPage = 1;
          this.totalItems = 0;
        }
      });
  }

  // Event handlers from child components
  onPageChange(page: number): void {
    this.loadArticulos(page);
  }

  onView(articulo: Articulo): void {
    this.selectedArticulo = articulo;
    this.isDetailModalOpen = true;
  }

  onEdit(articulo: Articulo): void {
    this.selectedArticulo = articulo;
    this.isFormModalOpen = true;
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de eliminar este artículo?')) {
      this.articuloService.delete(id).subscribe({
        next: () => this.loadArticulos(this.currentPage),
        error: (error) => console.error('Error deleting articulo', error)
      });
    }
  }

  openFormModal(): void {
    this.selectedArticulo = null;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedArticulo = null;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedArticulo = null;
  }

  onSave(eventData: { formData: FormData, isEditing: boolean, id: number | null }): void {
    if (eventData.isEditing && eventData.id) {
      this.articuloService.update(eventData.id, eventData.formData).subscribe({
        next: () => {
          this.loadArticulos(this.currentPage);
          this.closeFormModal();
          alert('Artículo actualizado exitosamente');
        },
        error: (error) => {
          console.error('Error updating articulo', error);
          alert('Error al actualizar el artículo');
        }
      });
    } else {
      this.articuloService.create(eventData.formData).subscribe({
        next: () => {
          this.loadArticulos(this.currentPage);
          this.closeFormModal();
          alert('Artículo creado exitosamente');
        },
        error: (error) => {
          console.error('Error creating articulo', error);
          alert('Error al crear el artículo');
        }
      });
    }
  }

  onImportSuccess(): void {
    this.loadArticulos(this.currentPage);
  }

  exportExcel(): void {
    this.articuloService.exportExcel();
  }

  exportPDF(): void {
    this.articuloService.exportPDF();
  }
}
