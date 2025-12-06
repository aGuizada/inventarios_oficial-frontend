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
  ) { }

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
    this.articuloService.getAll(page, this.perPage)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.articulos = response.data;
          this.currentPage = response.current_page;
          this.lastPage = response.last_page;
          this.totalItems = response.total;
        },
        error: (error) => console.error('Error loading articulos', error)
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
}
