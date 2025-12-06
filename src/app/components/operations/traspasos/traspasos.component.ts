import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { TraspasoService } from '../../../services/traspaso.service';
import { VentaService, ProductoInventario } from '../../../services/venta.service';
import { SucursalService } from '../../../services/sucursal.service';
import { AlmacenService } from '../../../services/almacen.service';
import { Traspaso, DetalleTraspaso, Sucursal, Almacen, ApiResponse } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-traspasos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './traspasos.component.html',
  styleUrl: './traspasos.component.css'
})
export class TraspasosComponent implements OnInit {
  traspasos: Traspaso[] = [];
  sucursales: Sucursal[] = [];
  almacenes: Almacen[] = [];
  almacenesOrigen: Almacen[] = [];
  almacenesDestino: Almacen[] = [];
  productosInventario: ProductoInventario[] = [];
  productosFiltrados: ProductoInventario[] = [];
  
  form: FormGroup;
  detallesFormArray: FormArray;
  isModalOpen = false;
  isHistorialView = true;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;
  currentUserId = 1; // TODO: Obtener del servicio de autenticación
  
  busquedaProducto: string = '';
  productoSeleccionado: ProductoInventario | null = null;
  mostrarSugerenciasProducto: boolean = false;
  
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private traspasoService: TraspasoService,
    private ventaService: VentaService,
    private sucursalService: SucursalService,
    private almacenService: AlmacenService,
    private fb: FormBuilder
  ) {
    this.detallesFormArray = this.fb.array([]);
    const fechaActual = new Date().toISOString().slice(0, 16);
    
    this.form = this.fb.group({
      codigo_traspaso: ['', Validators.required],
      sucursal_origen_id: ['', Validators.required],
      sucursal_destino_id: ['', Validators.required],
      almacen_origen_id: ['', Validators.required],
      almacen_destino_id: ['', Validators.required],
      user_id: [this.currentUserId, Validators.required],
      tipo_traspaso: ['SUCURSAL'],
      estado: ['PENDIENTE'],
      motivo: [''],
      observaciones: [''],
      detalles: this.detallesFormArray
    });
  }

  ngOnInit(): void {
    this.cargarSucursales();
    this.cargarAlmacenes();
    this.cargarTraspasos();
  }

  cargarTraspasos(): void {
    this.isLoading = true;
    this.traspasoService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<Traspaso[]> | Traspaso[] | any) => {
          if (Array.isArray(response)) {
            this.traspasos = response;
          } else if (response && 'success' in response && response.success) {
            this.traspasos = response.data || [];
          } else if (response && response.data) {
            this.traspasos = response.data || [];
          } else {
            this.traspasos = [];
          }
        },
        error: (error) => {
          console.error('Error al cargar traspasos:', error);
          this.mostrarError('Error al cargar los traspasos');
        }
      });
  }


  navegarANuevoTraspaso(): void {
    this.resetForm();
    // Generar código automáticamente
    this.generarCodigoTraspaso();
    this.isModalOpen = true;
  }

  cerrarModal(): void {
    this.isModalOpen = false;
    this.resetForm();
  }

  aprobarTraspaso(traspaso: Traspaso): void {
    if (!confirm(`¿Está seguro de que desea aprobar el traspaso "${traspaso.codigo_traspaso}"? Esto descontará los productos del inventario origen.`)) {
      return;
    }

    this.isLoading = true;
    this.traspasoService.aprobar(traspaso.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<any> | any) => {
          if (response && 'success' in response) {
            if (response.success) {
              this.mostrarExito('Traspaso aprobado exitosamente. Los productos han sido descontados del inventario origen.');
              this.cargarTraspasos();
            } else {
              this.mostrarError(response.message || 'Error al aprobar el traspaso');
            }
          } else {
            this.mostrarExito('Traspaso aprobado exitosamente. Los productos han sido descontados del inventario origen.');
            this.cargarTraspasos();
          }
        },
        error: (error) => {
          console.error('Error al aprobar traspaso:', error);
          let mensaje = 'Error al aprobar el traspaso';
          if (error.error?.error) {
            mensaje = error.error.error;
          } else if (error.error?.message) {
            mensaje = error.error.message;
          }
          this.mostrarError(mensaje);
        }
      });
  }

  recibirTraspaso(traspaso: Traspaso): void {
    if (!confirm(`¿Está seguro de que desea recibir el traspaso "${traspaso.codigo_traspaso}"? Esto agregará los productos al inventario destino.`)) {
      return;
    }

    this.isLoading = true;
    this.traspasoService.recibir(traspaso.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<any> | any) => {
          if (response && 'success' in response) {
            if (response.success) {
              this.mostrarExito('Traspaso recibido exitosamente. Los productos han sido agregados al inventario destino.');
              this.cargarTraspasos();
            } else {
              this.mostrarError(response.message || 'Error al recibir el traspaso');
            }
          } else {
            this.mostrarExito('Traspaso recibido exitosamente. Los productos han sido agregados al inventario destino.');
            this.cargarTraspasos();
          }
        },
        error: (error) => {
          console.error('Error al recibir traspaso:', error);
          let mensaje = 'Error al recibir el traspaso';
          if (error.error?.error) {
            mensaje = error.error.error;
          } else if (error.error?.message) {
            mensaje = error.error.message;
          }
          this.mostrarError(mensaje);
        }
      });
  }

  rechazarTraspaso(traspaso: Traspaso): void {
    const motivo = prompt('Ingrese el motivo del rechazo:');
    if (!motivo || motivo.trim() === '') {
      return;
    }

    this.isLoading = true;
    this.traspasoService.rechazar(traspaso.id, motivo)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<any> | any) => {
          if (response && 'success' in response) {
            if (response.success) {
              this.mostrarExito('Traspaso rechazado exitosamente');
              this.cargarTraspasos();
            } else {
              this.mostrarError(response.message || 'Error al rechazar el traspaso');
            }
          } else {
            this.mostrarExito('Traspaso rechazado exitosamente');
            this.cargarTraspasos();
          }
        },
        error: (error) => {
          console.error('Error al rechazar traspaso:', error);
          this.mostrarError('Error al rechazar el traspaso');
        }
      });
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'APROBADO': 'bg-blue-100 text-blue-800',
      'EN_TRANSITO': 'bg-purple-100 text-purple-800',
      'RECIBIDO': 'bg-green-100 text-green-800',
      'RECHAZADO': 'bg-red-100 text-red-800'
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  }

  getSucursalNombre(traspaso: Traspaso, tipo: 'origen' | 'destino'): string {
    // Primero intentar obtener desde la relación cargada (si viene del backend)
    if (tipo === 'origen' && traspaso.sucursal_origen) {
      return traspaso.sucursal_origen.nombre;
    }
    if (tipo === 'destino' && traspaso.sucursal_destino) {
      return traspaso.sucursal_destino.nombre;
    }
    
    // Si no está cargada la relación, buscar en el array de sucursales usando el ID
    const sucursalId = tipo === 'origen' ? traspaso.sucursal_origen_id : traspaso.sucursal_destino_id;
    const sucursal = this.sucursales.find(s => s.id === sucursalId);
    return sucursal?.nombre || 'N/A';
  }

  cargarSucursales(): void {
    this.sucursalService.getAll().subscribe({
      next: (response: ApiResponse<Sucursal[]> | Sucursal[] | any) => {
        if (response && response.data && Array.isArray(response.data)) {
          this.sucursales = response.data;
        } else if (Array.isArray(response)) {
          this.sucursales = response;
        } else if (response && 'success' in response && response.success) {
          this.sucursales = response.data || [];
        }
      },
      error: (error) => {
        console.error('Error al cargar sucursales:', error);
        this.mostrarError('Error al cargar las sucursales');
      }
    });
  }

  cargarAlmacenes(): void {
    this.almacenService.getAll().subscribe({
      next: (response: ApiResponse<Almacen[]> | Almacen[] | any) => {
        let almacenesData: Almacen[] = [];
        
        if (response && response.data && Array.isArray(response.data)) {
          almacenesData = response.data;
        } else if (Array.isArray(response)) {
          almacenesData = response;
        } else if (response && 'success' in response && response.success) {
          almacenesData = response.data || [];
        }
        
        // Asegurar que todos los almacenes tengan sucursal_id válido
        this.almacenes = almacenesData
          .map(almacen => ({
            ...almacen,
            sucursal_id: almacen.sucursal_id || almacen.sucursal?.id || 0
          }))
          .filter(almacen => almacen.sucursal_id > 0) as Almacen[];
        
        console.log('Almacenes cargados:', this.almacenes);
        console.log('Primer almacén ejemplo:', this.almacenes[0]);
        console.log('Almacenes con sucursal_id:', this.almacenes.map(a => ({ id: a.id, nombre: a.nombre_almacen, sucursal_id: a.sucursal_id })));
      },
      error: (error) => {
        console.error('Error al cargar almacenes:', error);
        console.error('Respuesta completa:', error);
        this.mostrarError('Error al cargar los almacenes');
      }
    });
  }

  onSucursalOrigenChange(): void {
    const sucursalId = this.form.get('sucursal_origen_id')?.value;
    console.log('Sucursal origen seleccionada:', sucursalId);
    console.log('Tipo de sucursalId:', typeof sucursalId);
    console.log('Almacenes disponibles:', this.almacenes);
    
    if (sucursalId) {
      // Convertir a número para comparación
      const sucursalIdNum = typeof sucursalId === 'string' ? parseInt(sucursalId, 10) : Number(sucursalId);
      this.almacenesOrigen = this.almacenes.filter(a => {
        const almacenSucursalId = Number(a.sucursal_id);
        return almacenSucursalId === sucursalIdNum && !isNaN(almacenSucursalId);
      });
      console.log('Almacenes filtrados origen:', this.almacenesOrigen);
      this.form.patchValue({ almacen_origen_id: '' });
      this.productosInventario = [];
      this.productosFiltrados = [];
    } else {
      this.almacenesOrigen = [];
      this.productosInventario = [];
      this.productosFiltrados = [];
    }
  }

  onSucursalDestinoChange(): void {
    const sucursalId = this.form.get('sucursal_destino_id')?.value;
    console.log('Sucursal destino seleccionada:', sucursalId);
    console.log('Tipo de sucursalId:', typeof sucursalId);
    
    if (sucursalId) {
      // Convertir a número para comparación
      const sucursalIdNum = typeof sucursalId === 'string' ? parseInt(sucursalId, 10) : Number(sucursalId);
      this.almacenesDestino = this.almacenes.filter(a => {
        const almacenSucursalId = Number(a.sucursal_id);
        return almacenSucursalId === sucursalIdNum && !isNaN(almacenSucursalId);
      });
      console.log('Almacenes filtrados destino:', this.almacenesDestino);
      this.form.patchValue({ almacen_destino_id: '' });
    } else {
      this.almacenesDestino = [];
    }
  }

  onAlmacenOrigenChange(): void {
    this.cargarProductosInventario();
  }

  cargarProductosInventario(): void {
    const almacenId = this.form.get('almacen_origen_id')?.value;
    if (!almacenId) {
      this.productosInventario = [];
      this.productosFiltrados = [];
      return;
    }

    this.isLoading = true;
    this.ventaService.getProductosInventario(almacenId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (productos: ProductoInventario[]) => {
          this.productosInventario = productos;
          this.productosFiltrados = productos;
        },
        error: (error) => {
          console.error('Error al cargar productos:', error);
          this.mostrarError('Error al cargar los productos del inventario');
        }
      });
  }

  buscarProducto(event: any): void {
    const termino = event.target.value.toLowerCase();
    if (!termino) {
      this.productosFiltrados = this.productosInventario;
      return;
    }

    this.productosFiltrados = this.productosInventario.filter(p =>
      p.articulo?.nombre?.toLowerCase().includes(termino) ||
      p.articulo?.codigo?.toLowerCase().includes(termino)
    );
  }

  onFocusProducto(): void {
    this.mostrarSugerenciasProducto = true;
  }

  onBlurProducto(): void {
    setTimeout(() => {
      this.mostrarSugerenciasProducto = false;
    }, 200);
  }

  seleccionarProductoCatalogo(producto: ProductoInventario): void {
    this.productoSeleccionado = producto;
    this.busquedaProducto = producto.articulo?.nombre || '';
    this.mostrarSugerenciasProducto = false;
  }

  limpiarBusquedaProducto(): void {
    this.productoSeleccionado = null;
    this.busquedaProducto = '';
    this.productosFiltrados = this.productosInventario;
  }

  agregarProductoATraspaso(): void {
    if (!this.productoSeleccionado) {
      this.mostrarError('Por favor seleccione un producto');
      return;
    }

    const stockDisponible = this.productoSeleccionado.stock_disponible || 0;
    if (stockDisponible <= 0) {
      this.mostrarError('No hay stock disponible para este producto');
      return;
    }

    // Verificar si el producto ya está agregado
    const existe = this.detalles.controls.some(control =>
      control.get('articulo_id')?.value === this.productoSeleccionado?.articulo_id &&
      control.get('inventario_id')?.value === this.productoSeleccionado?.inventario_id
    );

    if (existe) {
      this.mostrarError('Este producto ya está agregado al traspaso');
      return;
    }

    const detalle = this.fb.group({
      articulo_id: [this.productoSeleccionado.articulo_id, Validators.required],
      inventario_id: [this.productoSeleccionado.inventario_id, Validators.required],
      cantidad_solicitada: [1, [Validators.required, Validators.min(1), Validators.max(stockDisponible)]],
      precio_costo: [this.productoSeleccionado.articulo?.precio_costo || 0],
      precio_venta: [this.productoSeleccionado.articulo?.precio_venta || 0]
    });

    this.detallesFormArray.push(detalle);
    this.limpiarBusquedaProducto();
  }

  removeDetalle(index: number): void {
    this.detallesFormArray.removeAt(index);
  }

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  getArticuloNombre(articuloId: number): string {
    const producto = this.productosInventario.find(p => p.articulo_id === articuloId);
    return producto?.articulo?.nombre || 'N/A';
  }

  getStockDisponible(articuloId: number, inventarioId: number): number {
    const producto = this.productosInventario.find(
      p => p.articulo_id === articuloId && p.inventario_id === inventarioId
    );
    return producto?.stock_disponible || 0;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mostrarError('Por favor, complete todos los campos requeridos');
      return;
    }

    if (this.detalles.length === 0) {
      this.mostrarError('Debe agregar al menos un producto al traspaso');
      return;
    }

    // Validar que las cantidades no excedan el stock
    let hayError = false;
    this.detalles.controls.forEach((control, index) => {
      const cantidad = control.get('cantidad_solicitada')?.value;
      const articuloId = control.get('articulo_id')?.value;
      const inventarioId = control.get('inventario_id')?.value;
      const stock = this.getStockDisponible(articuloId, inventarioId);
      
      if (cantidad > stock) {
        control.get('cantidad_solicitada')?.setErrors({ max: true });
        hayError = true;
      }
    });

    if (hayError) {
      this.mostrarError('Las cantidades no pueden exceder el stock disponible');
      return;
    }

    // Validar que origen y destino sean diferentes
    const origenId = this.form.get('sucursal_origen_id')?.value;
    const destinoId = this.form.get('sucursal_destino_id')?.value;
    if (origenId === destinoId) {
      this.mostrarError('La sucursal origen y destino deben ser diferentes');
      return;
    }

    const almacenOrigenId = this.form.get('almacen_origen_id')?.value;
    const almacenDestinoId = this.form.get('almacen_destino_id')?.value;
    if (almacenOrigenId === almacenDestinoId) {
      this.mostrarError('El almacén origen y destino deben ser diferentes');
      return;
    }

    this.isLoading = true;
    // Agregar fecha de solicitud automáticamente
    const fechaSolicitud = new Date().toISOString();
    const traspasoData = {
      ...this.form.value,
      fecha_solicitud: fechaSolicitud,
      detalles: this.detalles.value.map((detalle: any) => ({
        articulo_id: detalle.articulo_id,
        inventario_id: detalle.inventario_id,
        cantidad_solicitada: detalle.cantidad_solicitada,
        precio_costo: detalle.precio_costo,
        precio_venta: detalle.precio_venta
      }))
    };

    const operacion = this.isEditing && this.currentId
      ? this.traspasoService.update(this.currentId, traspasoData)
      : this.traspasoService.create(traspasoData);

    operacion
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: ApiResponse<Traspaso> | Traspaso | any) => {
          if (response && 'success' in response) {
            if (response.success) {
              this.mostrarExito('Traspaso creado exitosamente');
              this.cerrarModal();
              this.cargarTraspasos();
            } else {
              this.mostrarError(response.message || 'Error al crear el traspaso');
            }
          } else {
            this.mostrarExito('Traspaso creado exitosamente');
            this.cerrarModal();
            this.cargarTraspasos();
          }
        },
        error: (error) => {
          console.error('Error al guardar traspaso:', error);
          let mensaje = 'Error al crear el traspaso';
          if (error.error?.errors) {
            const errores = Object.values(error.error.errors).flat();
            mensaje = errores.join(', ');
          } else if (error.error?.message) {
            mensaje = error.error.message;
          }
          this.mostrarError(mensaje);
        }
      });
  }

  resetForm(): void {
    this.form.reset({
      codigo_traspaso: '',
      sucursal_origen_id: '',
      sucursal_destino_id: '',
      almacen_origen_id: '',
      almacen_destino_id: '',
      user_id: this.currentUserId,
      tipo_traspaso: 'SUCURSAL',
      estado: 'PENDIENTE',
      motivo: '',
      observaciones: ''
    });
    this.detallesFormArray.clear();
    this.productosInventario = [];
    this.productosFiltrados = [];
    this.productoSeleccionado = null;
    this.almacenesOrigen = [];
    this.almacenesDestino = [];
  }

  generarCodigoTraspaso(): void {
    const fecha = new Date();
    const codigo = `TR-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(fecha.getHours()).padStart(2, '0')}${String(fecha.getMinutes()).padStart(2, '0')}`;
    this.form.patchValue({ codigo_traspaso: codigo });
  }

  mostrarError(mensaje: string): void {
    this.errorMessage = mensaje;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  mostrarExito(mensaje: string): void {
    this.successMessage = mensaje;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field?.invalid && field.touched);
  }
}
