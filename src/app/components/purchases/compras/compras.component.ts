import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompraService } from '../../../services/compra.service';
import { ProveedorService } from '../../../services/proveedor.service';
import { AlmacenService } from '../../../services/almacen.service';
import { ArticuloService } from '../../../services/articulo.service';
import { Compra, DetalleCompra, Proveedor, Almacen, Articulo } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgClass],
  templateUrl: './compras.component.html',
})
export class ComprasComponent implements OnInit {
  compras: Compra[] = [];
  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  almacenes: Almacen[] = [];
  articulos: Articulo[] = [];
  
  form: FormGroup;
  detallesFormArray: FormArray;
  isModalOpen = false;
  isHistorialView = false; // Determinar si estamos en la vista de historial
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;
  currentUserId = 1; // TODO: Obtener del servicio de autenticación
  proveedorBusqueda: string = '';
  mostrarSugerenciasProveedor: boolean = false;
  proveedorSeleccionado: Proveedor | null = null;
  
  // Para manejar búsqueda de artículos en el catálogo
  busquedaArticulo: string = '';
  articulosFiltrados: Articulo[] = [];
  articuloSeleccionado: Articulo | null = null;
  mostrarSugerenciasArticulo: boolean = false;

  constructor(
    private compraService: CompraService,
    private proveedorService: ProveedorService,
    private almacenService: AlmacenService,
    private articuloService: ArticuloService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.detallesFormArray = this.fb.array([]);
    this.form = this.fb.group({
      proveedor_id: ['', Validators.required],
      proveedor_nombre: ['', Validators.required],
      user_id: [this.currentUserId, Validators.required],
      almacen_id: ['', Validators.required],
      fecha_hora: [new Date().toISOString().slice(0, 16), Validators.required],
      total: [0, [Validators.required, Validators.min(0)]],
      tipo_comprobante: [''],
      serie_comprobante: [''],
      num_comprobante: [''],
      descuento_global: [0, [Validators.min(0)]],
      tipo_compra: ['contado', Validators.required],
      estado: [''],
      detalles: this.detallesFormArray
    });
  }

  ngOnInit(): void {
    // Detectar si estamos en la vista de historial o nueva compra
    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      this.isHistorialView = path === 'historial';
      
      if (this.isHistorialView) {
        // En historial, solo cargar las compras
        this.isModalOpen = false;
        this.loadCompras();
      } else {
        // En nueva compra, cargar todo para el formulario
        this.isModalOpen = true;
        this.loadDependencies();
        this.loadCompras(); // También cargar compras para referencia
      }
    });
  }

  navegarANuevaCompra(): void {
    this.router.navigate(['/compras/nueva']);
  }

  loadDependencies(): void {
    this.proveedorService.getAll().subscribe({
      next: (res) => {
        this.proveedores = Array.isArray(res.data) ? res.data : [];
        this.proveedoresFiltrados = this.proveedores;
      },
      error: (error) => {
        console.error('Error loading proveedores', error);
        this.proveedores = [];
        this.proveedoresFiltrados = [];
      }
    });
    this.almacenService.getAll().subscribe({
      next: (res) => {
        this.almacenes = Array.isArray(res.data) ? res.data : [];
      },
      error: (error) => {
        console.error('Error loading almacenes', error);
        this.almacenes = [];
      }
    });
    this.articuloService.getAll(1, 1000).subscribe({
      next: (res) => {
        this.articulos = res.data || [];
        this.articulosFiltrados = this.articulos;
      },
      error: (error) => {
        console.error('Error loading articulos', error);
        this.articulos = [];
        this.articulosFiltrados = [];
      }
    });
  }

  loadCompras(): void {
    this.isLoading = true;
    this.compraService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (compras) => {
          this.compras = Array.isArray(compras) ? compras : [];
        },
        error: (error) => {
          console.error('Error loading compras', error);
          this.compras = [];
        }
      });
  }

  openModal(): void {
    try {
      console.log('Abriendo modal...');
      this.isModalOpen = true;
      this.isEditing = false;
      this.currentId = null;
      this.detallesFormArray.clear();
      this.proveedorBusqueda = '';
      this.proveedorSeleccionado = null;
      this.mostrarSugerenciasProveedor = false;
      this.proveedoresFiltrados = this.proveedores || [];
      // Limpiar búsqueda de artículos
      this.busquedaArticulo = '';
      this.articulosFiltrados = this.articulos || [];
      this.mostrarSugerenciasArticulo = false;
      this.articuloSeleccionado = null;
      this.form.reset({
        proveedor_id: '',
        proveedor_nombre: '',
        user_id: this.currentUserId,
        almacen_id: '',
        fecha_hora: new Date().toISOString().slice(0, 16),
        total: 0,
        tipo_compra: 'contado',
        descuento_global: 0
      });
      this.form.patchValue({ proveedor_nombre: '' });
      console.log('Modal abierto, isModalOpen:', this.isModalOpen);
    } catch (error) {
      console.error('Error al abrir modal:', error);
      alert('Error al abrir el modal. Por favor revise la consola para más detalles.');
    }
  }

  closeModal(): void {
    // En lugar de cerrar, solo limpiar el formulario para una nueva compra
    this.isEditing = false;
    this.currentId = null;
    this.form.reset();
    this.detallesFormArray.clear();
    this.proveedorBusqueda = '';
    this.proveedorSeleccionado = null;
    this.mostrarSugerenciasProveedor = false;
    // Limpiar búsqueda de artículos
    this.busquedaArticulo = '';
    this.articulosFiltrados = this.articulos || [];
    this.mostrarSugerenciasArticulo = false;
    this.articuloSeleccionado = null;
    // Resetear valores del formulario
    this.form.patchValue({
      proveedor_id: '',
      proveedor_nombre: '',
      user_id: this.currentUserId,
      almacen_id: '',
      fecha_hora: new Date().toISOString().slice(0, 16),
      total: 0,
      tipo_compra: 'contado',
      descuento_global: 0
    });
  }

  edit(compra: Compra): void {
    // Navegar a nueva compra para editar
    this.router.navigate(['/compras/nueva']).then(() => {
      this.isModalOpen = true;
      this.isEditing = true;
      this.currentId = compra.id;
      this.detallesFormArray.clear();
      
      // Limpiar búsqueda de artículos
      this.busquedaArticulo = '';
      this.articulosFiltrados = this.articulos || [];
      this.mostrarSugerenciasArticulo = false;
      this.articuloSeleccionado = null;
      
      const proveedor = compra.proveedor || this.proveedores.find(p => p.id === compra.proveedor_id);
      this.proveedorSeleccionado = proveedor || null;
      this.proveedorBusqueda = proveedor ? proveedor.nombre : '';
      this.mostrarSugerenciasProveedor = false;
      
      this.form.patchValue({
        proveedor_id: compra.proveedor_id || '',
        proveedor_nombre: proveedor ? proveedor.nombre : '',
        user_id: compra.user_id,
        almacen_id: compra.almacen_id,
        fecha_hora: compra.fecha_hora ? new Date(compra.fecha_hora).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        total: compra.total,
        tipo_comprobante: compra.tipo_comprobante || '',
        serie_comprobante: compra.serie_comprobante || '',
        num_comprobante: compra.num_comprobante || '',
        descuento_global: compra.descuento_global || 0,
        tipo_compra: compra.tipo_compra || 'contado',
        estado: compra.estado || ''
      });

      if (compra.detalles && compra.detalles.length > 0) {
        compra.detalles.forEach(detalle => {
          if (detalle.articulo_id) {
            this.addDetalle(detalle);
          }
        });
      }
    });
  }

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  addDetalle(detalle?: DetalleCompra | any): void {
    const precioInicial = detalle?.precio_unitario || 0;
    const detalleGroup = this.fb.group({
      articulo_id: [detalle?.articulo_id || '', Validators.required],
      cantidad: [detalle?.cantidad || 1, [Validators.required, Validators.min(1)]],
      precio_unitario: [precioInicial, [Validators.required, Validators.min(0)]],
      descuento: [detalle?.descuento || 0, [Validators.min(0)]],
      subtotal: [detalle?.subtotal || 0, Validators.required]
    });

    detalleGroup.get('cantidad')?.valueChanges.subscribe(() => this.calculateSubtotal(detalleGroup));
    detalleGroup.get('precio_unitario')?.valueChanges.subscribe(() => this.calculateSubtotal(detalleGroup));
    detalleGroup.get('descuento')?.valueChanges.subscribe(() => this.calculateSubtotal(detalleGroup));

    this.detallesFormArray.push(detalleGroup);
    this.calculateTotal();
  }

  removeDetalle(index: number): void {
    this.detallesFormArray.removeAt(index);
    this.calculateTotal();
  }

  calculateSubtotal(detalleGroup: FormGroup): void {
    const cantidad = detalleGroup.get('cantidad')?.value || 0;
    const precioUnitario = detalleGroup.get('precio_unitario')?.value || 0;
    const descuento = detalleGroup.get('descuento')?.value || 0;
    const subtotal = (cantidad * precioUnitario) - descuento;
    detalleGroup.patchValue({ subtotal: Math.max(0, subtotal) }, { emitEvent: false });
    this.calculateTotal();
  }

  calculateTotal(): void {
    const subtotal = this.detallesFormArray.controls.reduce((sum, control) => {
      return sum + (control.get('subtotal')?.value || 0);
    }, 0);
    const descuentoGlobal = this.form.get('descuento_global')?.value || 0;
    const total = subtotal - descuentoGlobal;
    this.form.patchValue({ total: Math.max(0, total) }, { emitEvent: false });
  }

  save(): void {
    console.log('Guardando compra...');
    console.log('Form valid:', this.form.valid);
    console.log('Form errors:', this.form.errors);
    console.log('Form value:', this.form.value);
    console.log('Detalles length:', this.detallesFormArray.length);
    console.log('Proveedor búsqueda:', this.proveedorBusqueda);
    
    // Validar que el nombre del proveedor esté ingresado
    if (!this.form.get('proveedor_nombre')?.value || this.proveedorBusqueda.trim().length === 0) {
      alert('Por favor ingrese el nombre del proveedor');
      return;
    }

    if (this.form.invalid || this.detallesFormArray.length === 0) {
      if (this.detallesFormArray.length === 0) {
        alert('Debe agregar al menos un artículo a la compra');
      } else {
        // Mostrar qué campos están inválidos
        const invalidFields: string[] = [];
        Object.keys(this.form.controls).forEach(key => {
          const control = this.form.get(key);
          if (control && control.invalid) {
            invalidFields.push(key);
          }
        });
        console.log('Campos inválidos:', invalidFields);
        alert(`Por favor complete los campos requeridos: ${invalidFields.join(', ')}`);
      }
      return;
    }

    const formValue = this.form.value;
    
    // VALIDAR DETALLES ANTES DE PROCESAR NADA MÁS
    const detallesInvalidos: any[] = [];
    formValue.detalles.forEach((detalle: any) => {
      const articuloId = Number(detalle.articulo_id);
      if (!articuloId || articuloId <= 0 || isNaN(articuloId)) {
        detallesInvalidos.push({ detalle, motivo: 'ID inválido' });
        return;
      }
      const articuloExists = this.articulos.some(a => a.id === articuloId);
      if (!articuloExists) {
        detallesInvalidos.push({ detalle, motivo: 'No existe en catálogo', articulo_id: articuloId });
      }
    });
    
    if (detallesInvalidos.length > 0) {
      const articulosInvalidos = detallesInvalidos
        .map(d => d.articulo_id || d.detalle?.articulo_id)
        .filter(id => id)
        .join(', ');
      console.error('Detalles inválidos detectados:', detallesInvalidos);
      console.log('Artículos disponibles:', this.articulos.map(a => ({ id: a.id, nombre: a.nombre })));
      alert(`ERROR: Los siguientes artículos no están disponibles (IDs: ${articulosInvalidos}).\n\nPor favor, ELIMINE estos detalles de la tabla y seleccione artículos válidos del catálogo de productos (columna derecha).`);
      return;
    }
    
    if (formValue.detalles.length === 0) {
      alert('Debe agregar al menos un artículo a la compra');
      return;
    }
    
    // Formatear fecha_hora correctamente para Laravel (formato Y-m-d H:i:s)
    let fechaHora = formValue.fecha_hora;
    if (fechaHora) {
      if (fechaHora.includes('T')) {
        fechaHora = fechaHora.replace('T', ' ');
      }
      if (fechaHora.split(':').length === 2) {
        fechaHora = fechaHora + ':00';
      }
    }
    
    const compraData: any = {
      proveedor_nombre: this.proveedorBusqueda.trim(),
      user_id: Number(formValue.user_id),
      almacen_id: Number(formValue.almacen_id),
      fecha_hora: fechaHora,
      total: Number(formValue.total),
      tipo_compra: formValue.tipo_compra || 'contado', // Enviar en minúsculas, el backend lo convertirá a mayúsculas
      // Siempre enviar campos de comprobante (el backend asignará valores por defecto si están vacíos)
      tipo_comprobante: formValue.tipo_comprobante?.trim() || '',
      serie_comprobante: formValue.serie_comprobante?.trim() || null,
      num_comprobante: formValue.num_comprobante?.trim() || '',
      detalles: formValue.detalles.map((detalle: any) => {
        const articuloId = Number(detalle.articulo_id);
        const cantidad = Number(detalle.cantidad) || 1;
        const precioUnitario = Number(detalle.precio_unitario) || 0;
        
        return {
          articulo_id: articuloId,
          cantidad: cantidad,
          precio_unitario: precioUnitario,
          descuento: Number(detalle.descuento || 0),
          subtotal: Number(detalle.subtotal || 0)
        };
      })
    };

    // Si hay un proveedor seleccionado, enviar también el ID
    if (this.proveedorSeleccionado && this.form.get('proveedor_id')?.value) {
      compraData.proveedor_id = Number(this.form.get('proveedor_id')?.value);
    }

    // Agregar campos opcionales
    if (formValue.descuento_global && formValue.descuento_global > 0) {
      compraData.descuento_global = Number(formValue.descuento_global);
    }
    if (formValue.estado && formValue.estado.trim() !== '') {
      compraData.estado = formValue.estado.trim();
    }

    console.log('Datos a enviar:', compraData);
    console.log('Detalles a enviar:', JSON.stringify(compraData.detalles, null, 2));
    compraData.detalles.forEach((detalle: any, index: number) => {
      console.log(`Detalle ${index}:`, {
        articulo_id: detalle.articulo_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: detalle.descuento
      });
    });
    
    this.isLoading = true;
    if (this.isEditing && this.currentId) {
      this.compraService.update(this.currentId, compraData)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.loadCompras();
            if (!this.isHistorialView) {
              // Si estamos en nueva compra, navegar al historial después de guardar
              this.router.navigate(['/compras/historial']);
            } else {
              // Si estamos en historial, solo cerrar el modal
              this.closeModal();
            }
          },
          error: (error) => {
            console.error('Error updating compra', error);
            console.log('Error response:', error?.error);
            
            let errorMessage = 'Error al actualizar la compra';
            
            if (error?.error) {
              if (error.error.errors) {
                const validationErrors = Object.values(error.error.errors).flat().join('\n');
                errorMessage = `Errores de validación:\n${validationErrors}`;
              } else if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.error) {
                errorMessage = error.error.error;
              }
            }
            
            alert(errorMessage);
          }
        });
    } else {
      this.compraService.create(compraData)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.loadCompras();
            if (!this.isHistorialView) {
              // Si estamos en nueva compra, navegar al historial después de guardar
              this.router.navigate(['/compras/historial']);
            } else {
              // Si estamos en historial, solo cerrar el modal
              this.closeModal();
            }
          },
          error: (error) => {
            console.error('Error creating compra', error);
            const errorResponse = error?.error || {};
            const errorMessage = errorResponse.message || errorResponse.error || 'Error al crear la compra';
            const errorDetails = errorResponse.file ? `Archivo: ${errorResponse.file}\nLínea: ${errorResponse.line}` : '';
            const fullError = errorResponse.message || error?.message || 'Error desconocido';
            
            console.log('Datos enviados:', compraData);
            console.log('Error completo:', error);
            console.log('Error response:', errorResponse);
            
            alert(`Error: ${errorMessage}\n\n${errorDetails}\n\nDetalles: ${fullError}`);
          }
        });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar esta compra?')) {
      this.isLoading = true;
      this.compraService.delete(id)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.loadCompras();
          },
          error: (error) => {
            console.error('Error deleting compra', error);
            alert('Error al eliminar la compra');
          }
        });
    }
  }

  getArticuloNombre(articuloId: number): string {
    const articulo = this.articulos.find(a => a.id === articuloId);
    return articulo ? articulo.nombre : 'N/A';
  }

  buscarProveedor(event: any): void {
    const valor = event.target.value.toLowerCase();
    this.proveedorBusqueda = event.target.value;
    
    this.form.patchValue({ proveedor_nombre: event.target.value });
    
    if (valor.length === 0) {
      this.proveedoresFiltrados = this.proveedores;
      this.mostrarSugerenciasProveedor = false;
      this.proveedorSeleccionado = null;
      this.form.patchValue({ proveedor_id: '' });
    } else {
      this.proveedoresFiltrados = this.proveedores.filter(proveedor =>
        proveedor.nombre.toLowerCase().includes(valor) ||
        (proveedor.num_documento && proveedor.num_documento.toLowerCase().includes(valor))
      );
      this.mostrarSugerenciasProveedor = this.proveedoresFiltrados.length > 0;
      
      const proveedorExacto = this.proveedores.find(p => 
        p.nombre.toLowerCase() === valor || 
        p.nombre.toLowerCase() === event.target.value.toLowerCase()
      );
      if (proveedorExacto) {
        this.seleccionarProveedor(proveedorExacto);
      } else {
        this.proveedorSeleccionado = null;
        this.form.patchValue({ proveedor_id: '' });
      }
    }
  }

  seleccionarProveedor(proveedor: Proveedor): void {
    this.proveedorSeleccionado = proveedor;
    this.proveedorBusqueda = proveedor.nombre;
    this.form.patchValue({
      proveedor_id: proveedor.id,
      proveedor_nombre: proveedor.nombre
    });
    this.mostrarSugerenciasProveedor = false;
  }

  limpiarProveedor(): void {
    this.proveedorBusqueda = '';
    this.proveedorSeleccionado = null;
    this.mostrarSugerenciasProveedor = false;
    this.proveedoresFiltrados = this.proveedores;
    this.form.patchValue({
      proveedor_id: '',
      proveedor_nombre: ''
    });
  }

  onFocusProveedor(): void {
    if (this.proveedorBusqueda.length > 0 && this.proveedoresFiltrados.length > 0) {
      this.mostrarSugerenciasProveedor = true;
    }
  }

  onBlurProveedor(): void {
    setTimeout(() => {
      this.mostrarSugerenciasProveedor = false;
      this.form.patchValue({ proveedor_nombre: this.proveedorBusqueda });
    }, 200);
  }

  buscarArticulo(event: any): void {
    const valor = event.target.value.toLowerCase();
    this.busquedaArticulo = event.target.value;
    
    if (valor.length === 0) {
      this.articulosFiltrados = this.articulos || [];
      this.mostrarSugerenciasArticulo = false;
      this.articuloSeleccionado = null;
    } else {
      this.articulosFiltrados = (this.articulos || []).filter(articulo =>
        articulo.nombre?.toLowerCase().includes(valor) ||
        articulo.codigo?.toLowerCase().includes(valor) ||
        (articulo.descripcion && articulo.descripcion.toLowerCase().includes(valor))
      );
      this.mostrarSugerenciasArticulo = this.articulosFiltrados.length > 0;
    }
  }

  seleccionarArticuloCatalogo(articulo: Articulo): void {
    this.articuloSeleccionado = articulo;
    this.busquedaArticulo = `${articulo.nombre} - ${articulo.codigo}`;
    this.mostrarSugerenciasArticulo = false;
  }

  agregarArticuloACompra(): void {
    if (!this.articuloSeleccionado) {
      alert('Por favor seleccione un producto del catálogo');
      return;
    }

    // Verificar si el artículo ya está agregado
    const articuloYaAgregado = this.detallesFormArray.controls.some(control => 
      control.get('articulo_id')?.value === this.articuloSeleccionado?.id
    );

    if (articuloYaAgregado) {
      if (confirm('Este producto ya está en la compra. ¿Desea agregarlo de nuevo?')) {
        // Si confirma, agregar de todas formas
      } else {
        return;
      }
    }

    const precioInicial = this.articuloSeleccionado.precio_costo_unid || this.articuloSeleccionado.precio_costo_paq || 0;
    const detalleGroup = this.fb.group({
      articulo_id: [this.articuloSeleccionado.id, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio_unitario: [precioInicial, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0)]],
      subtotal: [precioInicial, Validators.required]
    });

    detalleGroup.get('cantidad')?.valueChanges.subscribe(() => this.calculateSubtotal(detalleGroup));
    detalleGroup.get('precio_unitario')?.valueChanges.subscribe(() => this.calculateSubtotal(detalleGroup));
    detalleGroup.get('descuento')?.valueChanges.subscribe(() => this.calculateSubtotal(detalleGroup));

    this.detallesFormArray.push(detalleGroup);
    this.calculateTotal();
    
    // Limpiar selección
    this.articuloSeleccionado = null;
    this.busquedaArticulo = '';
    this.articulosFiltrados = this.articulos || [];
  }

  limpiarBusquedaArticulo(): void {
    this.busquedaArticulo = '';
    this.articuloSeleccionado = null;
    this.mostrarSugerenciasArticulo = false;
    this.articulosFiltrados = this.articulos || [];
  }

  onFocusArticulo(): void {
    if (this.busquedaArticulo.length > 0 && this.articulosFiltrados.length > 0) {
      this.mostrarSugerenciasArticulo = true;
    }
  }

  onBlurArticulo(): void {
    setTimeout(() => {
      this.mostrarSugerenciasArticulo = false;
    }, 200);
  }
}
