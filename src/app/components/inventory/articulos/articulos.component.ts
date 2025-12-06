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
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-articulos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './articulos.component.html',
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
  selectedFile: File | null = null;
  imagePreview: string | null = null;

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
      precio_uno: [0, [Validators.min(0)]],
      precio_dos: [0, [Validators.min(0)]],
      precio_tres: [0, [Validators.min(0)]],
      precio_cuatro: [0, [Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      costo_compra: [0, [Validators.required, Validators.min(0)]],
      vencimiento: [null],
      fotografia: [null],
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
    this.selectedFile = null;
    this.imagePreview = null;
    this.form.reset({
      estado: true,
      unidad_envase: 1,
      precio_costo_unid: 0,
      precio_costo_paq: 0,
      precio_venta: 0,
      precio_uno: 0,
      precio_dos: 0,
      precio_tres: 0,
      precio_cuatro: 0,
      stock: 0,
      costo_compra: 0,
      vencimiento: null,
      descripcion: '',
      fotografia: null
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
    this.selectedFile = null;
    this.imagePreview = null;
  }

  edit(articulo: Articulo): void {
    this.isModalOpen = true;
    this.isEditing = true;
    this.currentId = articulo.id;
    this.selectedFile = null;
    this.imagePreview = articulo.fotografia ? `${environment.apiUrl.replace('/api', '')}/storage/${articulo.fotografia}` : null;
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
      precio_uno: articulo.precio_uno || 0,
      precio_dos: articulo.precio_dos || 0,
      precio_tres: articulo.precio_tres || 0,
      precio_cuatro: articulo.precio_cuatro || 0,
      stock: articulo.stock,
      costo_compra: articulo.costo_compra,
      vencimiento: articulo.vencimiento,
      estado: articulo.estado
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  save(): void {
    if (this.form.invalid) return;

    const formData = new FormData();
    const formValue = this.form.value;

    // Convert IDs to numbers and add to FormData
    formData.append('categoria_id', Number(formValue.categoria_id).toString());
    formData.append('proveedor_id', Number(formValue.proveedor_id).toString());
    formData.append('medida_id', Number(formValue.medida_id).toString());
    formData.append('marca_id', Number(formValue.marca_id).toString());
    formData.append('industria_id', Number(formValue.industria_id).toString());
    formData.append('codigo', formValue.codigo);
    formData.append('nombre', formValue.nombre);
    formData.append('unidad_envase', formValue.unidad_envase.toString());
    formData.append('precio_costo_unid', formValue.precio_costo_unid.toString());
    formData.append('precio_costo_paq', formValue.precio_costo_paq.toString());
    formData.append('precio_venta', formValue.precio_venta.toString());
    formData.append('precio_uno', (formValue.precio_uno || 0).toString());
    formData.append('precio_dos', (formValue.precio_dos || 0).toString());
    formData.append('precio_tres', (formValue.precio_tres || 0).toString());
    formData.append('precio_cuatro', (formValue.precio_cuatro || 0).toString());
    formData.append('stock', formValue.stock.toString());
    formData.append('costo_compra', formValue.costo_compra.toString());
    formData.append('estado', formValue.estado ? '1' : '0');

    if (formValue.descripcion) {
      formData.append('descripcion', formValue.descripcion);
    }
    if (formValue.vencimiento) {
      formData.append('vencimiento', Number(formValue.vencimiento).toString());
    }
    if (this.selectedFile) {
      formData.append('fotografia', this.selectedFile);
    }

    if (this.isEditing && this.currentId) {
      this.articuloService.update(this.currentId, formData).subscribe({
        next: () => {
          this.loadArticulos(this.currentPage);
          this.closeModal();
        },
        error: (error) => console.error('Error updating articulo', error)
      });
    } else {
      this.articuloService.create(formData).subscribe({
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
