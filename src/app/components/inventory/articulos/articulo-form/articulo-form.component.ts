import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Articulo, Categoria, Marca, Medida, Industria, Proveedor } from '../../../../interfaces';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-articulo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './articulo-form.component.html',
})
export class ArticuloFormComponent implements OnInit, OnChanges {
  @Input() articulo: Articulo | null = null;
  @Input() categorias: Categoria[] = [];
  @Input() marcas: Marca[] = [];
  @Input() medidas: Medida[] = [];
  @Input() industrias: Industria[] = [];
  @Input() proveedores: Proveedor[] = [];

  @Output() save = new EventEmitter<{ formData: FormData, isEditing: boolean, id: number | null }>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isEditing: boolean = false;

  constructor(private fb: FormBuilder) {
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
    this.loadArticuloData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['articulo'] && !changes['articulo'].firstChange) {
      this.loadArticuloData();
    }
  }

  loadArticuloData(): void {
    if (this.articulo) {
      this.isEditing = true;
      this.imagePreview = this.articulo.fotografia
        ? `${environment.apiUrl.replace('/api', '')}/storage/${this.articulo.fotografia}`
        : null;

      this.form.patchValue({
        codigo: this.articulo.codigo,
        nombre: this.articulo.nombre,
        descripcion: this.articulo.descripcion,
        categoria_id: this.articulo.categoria_id,
        marca_id: this.articulo.marca_id,
        medida_id: this.articulo.medida_id,
        industria_id: this.articulo.industria_id,
        proveedor_id: this.articulo.proveedor_id,
        unidad_envase: this.articulo.unidad_envase,
        precio_costo_unid: this.articulo.precio_costo_unid,
        precio_costo_paq: this.articulo.precio_costo_paq,
        precio_venta: this.articulo.precio_venta,
        precio_uno: this.articulo.precio_uno || 0,
        precio_dos: this.articulo.precio_dos || 0,
        precio_tres: this.articulo.precio_tres || 0,
        precio_cuatro: this.articulo.precio_cuatro || 0,
        stock: this.articulo.stock,
        costo_compra: this.articulo.costo_compra,
        vencimiento: this.articulo.vencimiento,
        estado: this.articulo.estado
      });
    } else {
      this.isEditing = false;
      this.resetForm();
    }
  }

  resetForm(): void {
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

  onSubmit(): void {
    if (this.form.invalid) return;

    const formData = new FormData();
    const formValue = this.form.value;

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

    this.save.emit({
      formData,
      isEditing: this.isEditing,
      id: this.articulo?.id || null
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
