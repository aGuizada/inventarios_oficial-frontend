import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { VentaService, ProductoInventario } from '../../../services/venta.service';
import { ClienteService } from '../../../services/cliente.service';
import { AlmacenService } from '../../../services/almacen.service';
import { CajaService } from '../../../services/caja.service';
import { Venta, DetalleVenta, Cliente, Almacen } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.css'
})
export class VentasComponent implements OnInit {
  ventas: Venta[] = [];
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  almacenes: Almacen[] = [];
  productosInventario: ProductoInventario[] = [];
  productosFiltrados: ProductoInventario[] = [];
  
  form: FormGroup;
  detallesFormArray: FormArray;
  isModalOpen = true; // Mostrar formulario por defecto
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;
  currentUserId = 1; // TODO: Obtener del servicio de autenticación
  
  clienteBusqueda: string = '';
  mostrarSugerenciasCliente: boolean = false;
  clienteSeleccionado: Cliente | null = null;
  
  busquedaProducto: string = '';
  productoSeleccionado: ProductoInventario | null = null;
  mostrarSugerenciasProducto: boolean = false;

  constructor(
    private ventaService: VentaService,
    private clienteService: ClienteService,
    private almacenService: AlmacenService,
    private cajaService: CajaService,
    private fb: FormBuilder
  ) {
    this.detallesFormArray = this.fb.array([]);
    this.form = this.fb.group({
      cliente_id: ['', Validators.required],
      user_id: [this.currentUserId, Validators.required],
      tipo_venta_id: ['', Validators.required],
      tipo_pago_id: ['', Validators.required],
      almacen_id: ['', Validators.required],
      caja_id: ['', Validators.required],
      tipo_comprobante: [''],
      serie_comprobante: [''],
      num_comprobante: [''],
      fecha_hora: [new Date().toISOString().slice(0, 16), Validators.required],
      total: [0, [Validators.required, Validators.min(0)]],
      estado: ['Activo'],
      detalles: this.detallesFormArray
    });
  }

  ngOnInit(): void {
    this.loadDependencies();
    this.loadVentas();
  }

  get detalles() {
    return this.form.get('detalles') as FormArray;
  }

  loadDependencies(): void {
    // Cargar clientes
    this.clienteService.getAll().subscribe({
      next: (response: any) => {
        this.clientes = Array.isArray(response) ? response : (response.data || []);
      },
      error: (error) => console.error('Error al cargar clientes:', error)
    });

    // Cargar almacenes
    this.almacenService.getAll().subscribe({
      next: (response: any) => {
        this.almacenes = Array.isArray(response) ? response : (response.data || []);
      },
      error: (error) => console.error('Error al cargar almacenes:', error)
    });
  }

  loadVentas(): void {
    this.isLoading = true;
    this.ventaService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (ventas) => {
          this.ventas = ventas;
        },
        error: (error) => {
          console.error('Error al cargar ventas:', error);
        }
      });
  }

  onAlmacenChange(): void {
    const almacenId = this.form.get('almacen_id')?.value;
    if (almacenId) {
      this.loadProductosInventario(almacenId);
    } else {
      this.productosInventario = [];
      this.productosFiltrados = [];
    }
  }

  loadProductosInventario(almacenId: number): void {
    this.ventaService.getProductosInventario(almacenId).subscribe({
      next: (productos) => {
        this.productosInventario = productos;
        this.productosFiltrados = productos;
      },
      error: (error) => {
        console.error('Error al cargar productos del inventario:', error);
        this.productosInventario = [];
        this.productosFiltrados = [];
      }
    });
  }

  buscarCliente(event: any): void {
    const valor = event.target.value.toLowerCase().trim();
    this.clienteBusqueda = valor;
    
    if (valor.length > 0) {
      this.clientesFiltrados = this.clientes.filter(cliente =>
        cliente.nombre?.toLowerCase().includes(valor) ||
        cliente.num_documento?.toLowerCase().includes(valor)
      );
      this.mostrarSugerenciasCliente = this.clientesFiltrados.length > 0;
    } else {
      this.clientesFiltrados = [];
      this.mostrarSugerenciasCliente = false;
    }
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.clienteBusqueda = cliente.nombre || '';
    this.form.patchValue({ cliente_id: cliente.id });
    this.mostrarSugerenciasCliente = false;
  }

  limpiarCliente(): void {
    this.clienteSeleccionado = null;
    this.clienteBusqueda = '';
    this.form.patchValue({ cliente_id: '' });
  }

  onFocusCliente(): void {
    if (this.clienteBusqueda.length > 0) {
      this.buscarCliente({ target: { value: this.clienteBusqueda } });
    }
  }

  onBlurCliente(): void {
    setTimeout(() => {
      this.mostrarSugerenciasCliente = false;
    }, 200);
  }

  buscarProducto(event: any): void {
    const valor = event.target.value.toLowerCase().trim();
    this.busquedaProducto = valor;
    
    if (valor.length > 0) {
      this.productosFiltrados = this.productosInventario.filter(producto =>
        producto.articulo?.nombre?.toLowerCase().includes(valor) ||
        producto.articulo?.codigo?.toLowerCase().includes(valor)
      );
      this.mostrarSugerenciasProducto = this.productosFiltrados.length > 0;
    } else {
      this.productosFiltrados = this.productosInventario;
      this.mostrarSugerenciasProducto = false;
    }
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

  onFocusProducto(): void {
    if (this.busquedaProducto.length > 0) {
      this.buscarProducto({ target: { value: this.busquedaProducto } });
    }
  }

  onBlurProducto(): void {
    setTimeout(() => {
      this.mostrarSugerenciasProducto = false;
    }, 200);
  }

  agregarProductoAVenta(): void {
    if (!this.productoSeleccionado) {
      alert('Por favor seleccione un producto del catálogo');
      return;
    }

    const stockDisponible = this.productoSeleccionado.stock_disponible;
    if (stockDisponible <= 0) {
      alert('Este producto no tiene stock disponible');
      return;
    }

    // Verificar si el producto ya está en los detalles
    const existe = this.detalles.controls.some(control => 
      control.get('articulo_id')?.value === this.productoSeleccionado?.articulo_id
    );

    if (existe) {
      alert('Este producto ya está agregado a la venta');
      return;
    }

    const precioVenta = this.productoSeleccionado.articulo?.precio_venta || 
                       this.productoSeleccionado.articulo?.precio_uno || 0;

    const detalle = this.fb.group({
      articulo_id: [this.productoSeleccionado.articulo_id, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(stockDisponible)]],
      precio: [precioVenta, [Validators.required, Validators.min(0)]],
      descuento: [0, [Validators.min(0)]],
      subtotal: [precioVenta]
    });

    // Calcular subtotal cuando cambian cantidad, precio o descuento
    detalle.get('cantidad')?.valueChanges.subscribe(() => this.calcularSubtotal(detalle));
    detalle.get('precio')?.valueChanges.subscribe(() => this.calcularSubtotal(detalle));
    detalle.get('descuento')?.valueChanges.subscribe(() => this.calcularSubtotal(detalle));

    this.detalles.push(detalle);
    this.calcularTotal();
    this.limpiarBusquedaProducto();
  }

  calcularSubtotal(detalle: FormGroup): void {
    const cantidad = Number(detalle.get('cantidad')?.value || 0);
    const precio = Number(detalle.get('precio')?.value || 0);
    const descuento = Number(detalle.get('descuento')?.value || 0);
    const subtotal = (cantidad * precio) - descuento;
    detalle.patchValue({ subtotal: subtotal >= 0 ? subtotal : 0 }, { emitEvent: false });
    this.calcularTotal();
  }

  calcularTotal(): void {
    const total = this.detalles.controls.reduce((sum, control) => {
      return sum + Number(control.get('subtotal')?.value || 0);
    }, 0);
    this.form.patchValue({ total: total }, { emitEvent: false });
  }

  removeDetalle(index: number): void {
    this.detalles.removeAt(index);
    this.calcularTotal();
  }

  getArticuloNombre(articuloId: number): string {
    const producto = this.productosInventario.find(p => p.articulo_id === articuloId);
    return producto?.articulo?.nombre || 'N/A';
  }

  getStockDisponible(articuloId: number): number {
    const producto = this.productosInventario.find(p => p.articulo_id === articuloId);
    return producto?.stock_disponible || 0;
  }

  save(): void {
    if (this.form.invalid || this.detalles.length === 0) {
      if (this.detalles.length === 0) {
        alert('Debe agregar al menos un producto a la venta');
      } else {
        alert('Por favor complete todos los campos requeridos');
      }
      return;
    }

    // Validar stock antes de enviar
    const almacenId = this.form.get('almacen_id')?.value;
    for (let i = 0; i < this.detalles.length; i++) {
      const detalle = this.detalles.at(i);
      const articuloId = detalle.get('articulo_id')?.value;
      const cantidad = detalle.get('cantidad')?.value;
      const stockDisponible = this.getStockDisponible(articuloId);
      
      if (cantidad > stockDisponible) {
        alert(`La cantidad solicitada (${cantidad}) excede el stock disponible (${stockDisponible}) para el artículo "${this.getArticuloNombre(articuloId)}"`);
        return;
      }
    }

    const formValue = this.form.value;
    const fechaHora = new Date(formValue.fecha_hora).toISOString().slice(0, 19).replace('T', ' ');

    const ventaData: any = {
      cliente_id: Number(formValue.cliente_id),
      user_id: Number(formValue.user_id),
      tipo_venta_id: Number(formValue.tipo_venta_id),
      tipo_pago_id: Number(formValue.tipo_pago_id),
      almacen_id: Number(almacenId), // Necesario para validar stock
      caja_id: Number(formValue.caja_id),
      tipo_comprobante: formValue.tipo_comprobante || null,
      serie_comprobante: formValue.serie_comprobante || null,
      num_comprobante: formValue.num_comprobante || null,
      fecha_hora: fechaHora,
      total: Number(formValue.total),
      estado: formValue.estado || 'Activo',
      detalles: formValue.detalles.map((detalle: any) => ({
        articulo_id: Number(detalle.articulo_id),
        cantidad: Number(detalle.cantidad),
        precio: Number(detalle.precio),
        descuento: Number(detalle.descuento || 0)
      }))
    };

    this.isLoading = true;
    this.ventaService.create(ventaData)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          alert('Venta registrada exitosamente');
          this.loadVentas();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error al crear venta:', error);
          const errorMessage = error.error?.message || error.error?.error || 'Error al crear la venta';
          const errors = error.error?.errors;
          if (errors) {
            const errorText = Object.values(errors).flat().join('\n');
            alert(`Error: ${errorText}`);
          } else {
            alert(`Error: ${errorMessage}`);
          }
        }
      });
  }

  resetForm(): void {
    this.form.reset({
      cliente_id: '',
      user_id: this.currentUserId,
      tipo_venta_id: '',
      tipo_pago_id: '',
      almacen_id: '',
      caja_id: '',
      tipo_comprobante: '',
      serie_comprobante: '',
      num_comprobante: '',
      fecha_hora: new Date().toISOString().slice(0, 16),
      total: 0,
      estado: 'Activo'
    });
    this.detalles.clear();
    this.clienteSeleccionado = null;
    this.clienteBusqueda = '';
    this.productoSeleccionado = null;
    this.busquedaProducto = '';
    this.productosInventario = [];
    this.productosFiltrados = [];
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}
