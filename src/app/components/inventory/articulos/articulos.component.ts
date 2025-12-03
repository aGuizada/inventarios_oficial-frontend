import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArticuloService } from '../../../services/articulo.service';
import { CategoriaService } from '../../../services/categoria.service';
import { MarcaService } from '../../../services/marca.service';
import { MedidaService } from '../../../services/medida.service';
import { IndustriaService } from '../../../services/industria.service';
import { ProveedorService } from '../../../services/proveedor.service';
import { Articulo, Categoria, Marca, Medida, Industria, Proveedor } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-articulos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './articulos.component.html',
  styleUrl: './articulos.component.css'
})
export class ArticulosComponent implements OnInit {
  articulos: Articulo[] = [];
  categorias: Categoria[] = [];
  marcas: Marca[] = [];
  medidas: Medida[] = [];
  industrias: Industria[] = [];
  proveedores: Proveedor[] = [];

  form: FormGroup;
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;

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
    private proveedorService: ProveedorService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      categoria_id: ['', Validators.required],
      marca_id: ['', Validators.required],
      medida_id: ['', Validators.required],
      industria_id: ['', Validators.required],
      proveedor_id: ['', Validators.required],
      unidad_envase: [1, [Validators.required, Validators.min(1)]],
      precio_costo_unid: [0, [Validators.required, Validators.min(0)]],
      precio_costo_paq: [0, [Validators.required, Validators.min(0)]],
      precio_venta: [0, [Validators.required, Validators.min(0)]],
      precio_uno: [0],
      precio_dos: [0],
      precio_tres: [0],
      precio_cuatro: [0],
      stock: [0, [Validators.required, Validators.min(0)]],
      costo_compra: [0, [Validators.required, Validators.min(0)]],
      vencimiento: [''],
      fotografia: [''],
      estado: [true]
    });
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

  changePage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.loadArticulos(page);
    }
  }

  openModal(): void {
    this.isModalOpen = true;
    this.isEditing = false;
    this.currentId = null;
    this.form.reset({
      estado: true,
      unidad_envase: 1,
      precio_costo_unid: 0,
      precio_costo_paq: 0,
      precio_venta: 0,
      stock: 0
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  edit(articulo: Articulo): void {
    this.isModalOpen = true;
    this.isEditing = true;
    this.currentId = articulo.id;
    this.form.patchValue({
      codigo: articulo.codigo,
      nombre: articulo.nombre,
      descripcion: articulo.descripcion,
      categoria_id: articulo.categoria_id,
      marca_id: articulo.marca_id,
      medida_id: articulo.medida_id,
      industria_id: articulo.industria_id,
      proveedor_id: articulo.proveedor_id,
      unidad_envase: articulo.unidad_envase,
      precio_costo_unid: articulo.precio_costo_unid,
      precio_costo_paq: articulo.precio_costo_paq,
      precio_venta: articulo.precio_venta,
      precio_uno: articulo.precio_uno,
      precio_dos: articulo.precio_dos,
      precio_tres: articulo.precio_tres,
      precio_cuatro: articulo.precio_cuatro,
      stock: articulo.stock,
      costo_compra: articulo.costo_compra,
      vencimiento: articulo.vencimiento,
      fotografia: articulo.fotografia,
      estado: articulo.estado
    });
  }

  save(): void {
    if (this.form.invalid) return;

    const articuloData = this.form.value;
    // Convert IDs to numbers
    articuloData.categoria_id = Number(articuloData.categoria_id);
    articuloData.marca_id = Number(articuloData.marca_id);
    articuloData.medida_id = Number(articuloData.medida_id);
    articuloData.industria_id = Number(articuloData.industria_id);
    articuloData.proveedor_id = Number(articuloData.proveedor_id);

    if (this.isEditing && this.currentId) {
      this.articuloService.update(this.currentId, articuloData).subscribe({
        next: () => {
          this.loadArticulos(this.currentPage);
          this.closeModal();
        },
        error: (error) => console.error('Error updating articulo', error)
      });
    } else {
      this.articuloService.create(articuloData).subscribe({
        next: () => {
          this.loadArticulos(this.currentPage);
          this.closeModal();
        },
        error: (error) => console.error('Error creating articulo', error)
      });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar este artículo?')) {
      this.articuloService.delete(id).subscribe({
        next: () => this.loadArticulos(this.currentPage),
        error: (error) => console.error('Error deleting articulo', error)
      });
    }
  }
}
