import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { VentaService, ProductoInventario } from '../../../services/venta.service';
import { ClienteService } from '../../../services/cliente.service';
import { AlmacenService } from '../../../services/almacen.service';
import { CajaService } from '../../../services/caja.service';
import { TipoVentaService } from '../../../services/tipo-venta.service';
import { TipoPagoService } from '../../../services/tipo-pago.service';
import { CreditoVentaService } from '../../../services/credito-venta.service';
import { Venta, DetalleVenta, Cliente, Almacen, Caja, TipoVenta, TipoPago } from '../../../interfaces';
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
  cajas: Caja[] = [];
  cajaSeleccionada: Caja | null = null;
  tiposVenta: TipoVenta[] = [];
  tiposPago: TipoPago[] = [];
  esVentaCredito = false; // Detectar si es venta a crédito
  isModalCreditoOpen = false; // Controlar modal de crédito
  
  form: FormGroup;
  detallesFormArray: FormArray;
  isModalOpen = true; // Mostrar formulario por defecto
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;
  currentUserId = 1; // TODO: Obtener del servicio de autenticación
  isHistorialView = false; // Determinar si estamos en la vista de historial
  
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
    private tipoVentaService: TipoVentaService,
    private tipoPagoService: TipoPagoService,
    private creditoVentaService: CreditoVentaService,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.detallesFormArray = this.fb.array([]);
    // Establecer fecha y hora actual automáticamente
    const fechaHoraActual = new Date();
    const fechaHoraFormato = fechaHoraActual.toISOString().slice(0, 16);
    
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
      fecha_hora: [{ value: fechaHoraFormato, disabled: false }, Validators.required],
      total: [0, [Validators.required, Validators.min(0)]],
      estado: ['Activo'],
      detalles: this.detallesFormArray,
      // Campos para venta a crédito
      numero_cuotas: [0, [Validators.min(1)]],
      tiempo_dias_cuota: [30, [Validators.min(1)]]
    });

    // Detectar cuando cambia el tipo de venta
    this.form.get('tipo_venta_id')?.valueChanges.subscribe(tipoVentaId => {
      console.log('=== CAMBIO DE TIPO DE VENTA ===');
      console.log('ID seleccionado:', tipoVentaId);
      console.log('Tipos de venta disponibles:', this.tiposVenta);
      
      if (tipoVentaId) {
        // Convertir a número si es string
        const idNumero = typeof tipoVentaId === 'string' ? parseInt(tipoVentaId, 10) : tipoVentaId;
        const tipoVenta = this.tiposVenta.find(tv => tv.id === idNumero || tv.id === tipoVentaId);
        
        console.log('Tipo de venta encontrado:', tipoVenta);
        
        if (tipoVenta) {
          const nombreTipoVenta = (tipoVenta.nombre_tipo_ventas || tipoVenta.nombre || '').toLowerCase().trim();
          console.log('Nombre del tipo de venta (lowercase):', nombreTipoVenta);
          
          // Detección más flexible de crédito
          const esCredito = nombreTipoVenta.includes('crédito') || 
                           nombreTipoVenta.includes('credito') ||
                           nombreTipoVenta.includes('cred') ||
                           nombreTipoVenta === 'a crédito' ||
                           nombreTipoVenta === 'a credito';
          
          console.log('¿Es crédito?', esCredito);
          console.log('Estado anterior esVentaCredito:', this.esVentaCredito);
          
          // Si cambia de crédito a no crédito, limpiar campos
          if (this.esVentaCredito && !esCredito) {
            console.log('Cambiando de crédito a no crédito, limpiando campos...');
            this.form.get('numero_cuotas')?.clearValidators();
            this.form.get('tiempo_dias_cuota')?.clearValidators();
            this.form.get('numero_cuotas')?.setValue(null);
            this.form.get('tiempo_dias_cuota')?.setValue(null);
            this.form.get('numero_cuotas')?.updateValueAndValidity();
            this.form.get('tiempo_dias_cuota')?.updateValueAndValidity();
            this.isModalCreditoOpen = false;
          }
          
          this.esVentaCredito = esCredito;
          console.log('Nuevo estado esVentaCredito:', this.esVentaCredito);
          
          // Si es crédito, abrir modal automáticamente
          if (esCredito) {
            console.log('✅ Es venta a crédito - Abriendo modal...');
            // Usar setTimeout para asegurar que el cambio se procese
            setTimeout(() => {
              console.log('Ejecutando abrirModalCredito()...');
              this.abrirModalCredito();
              console.log('Después de abrirModalCredito, isModalCreditoOpen:', this.isModalCreditoOpen);
            }, 200);
          } else {
            console.log('No es crédito, cerrando modal si está abierto');
            this.isModalCreditoOpen = false;
          }
        } else {
          console.log('❌ Tipo de venta no encontrado');
          this.esVentaCredito = false;
          this.isModalCreditoOpen = false;
        }
      } else {
        console.log('No hay tipo de venta seleccionado');
        this.esVentaCredito = false;
        this.isModalCreditoOpen = false;
      }
    });
  }

  ngOnInit(): void {
    // Detectar si estamos en la vista de historial o nueva venta
    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      this.isHistorialView = path === 'historial';
      
      if (this.isHistorialView) {
        // En historial, solo cargar las ventas
        this.isModalOpen = false;
        this.loadVentas();
      } else {
        // En nueva venta, cargar todo para el formulario
        this.isModalOpen = true;
        this.loadDependencies();
        this.loadCajas();
        this.actualizarFechaHora();
        this.loadVentas(); // También cargar ventas para referencia
      }
    });
  }

  actualizarFechaHora(): void {
    // Actualizar fecha y hora cada vez que se accede al formulario
    const fechaHoraActual = new Date().toISOString().slice(0, 16);
    this.form.patchValue({ fecha_hora: fechaHoraActual });
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

    // Cargar tipos de venta
    this.tipoVentaService.getAll().subscribe({
      next: (response: any) => {
        // La API devuelve un array directo, no envuelto en data
        const datos = Array.isArray(response) ? response : (response.data || response || []);
        this.tiposVenta = datos.map((item: any) => ({
          ...item,
          nombre: item.nombre_tipo_ventas || item.nombre // Mapear al campo correcto
        }));
        console.log('Tipos de venta cargados:', this.tiposVenta);
        if (this.tiposVenta.length === 0) {
          console.warn('No se encontraron tipos de venta. Verifique que existan datos en la base de datos.');
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de venta:', error);
        console.error('Detalles del error:', error.error);
        this.tiposVenta = [];
      }
    });

    // Cargar tipos de pago
    this.tipoPagoService.getAll().subscribe({
      next: (response: any) => {
        // La API devuelve un array directo, no envuelto en data
        const datos = Array.isArray(response) ? response : (response.data || response || []);
        this.tiposPago = datos.map((item: any) => ({
          ...item,
          nombre: item.nombre_tipo_pago || item.nombre // Mapear al campo correcto
        }));
        console.log('Tipos de pago cargados:', this.tiposPago);
        if (this.tiposPago.length === 0) {
          console.warn('No se encontraron tipos de pago. Verifique que existan datos en la base de datos.');
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de pago:', error);
        console.error('Detalles del error:', error.error);
        this.tiposPago = [];
      }
    });
  }

  loadCajas(): void {
    this.cajaService.getAll().subscribe({
      next: (response: any) => {
        this.cajas = Array.isArray(response) ? response : (response.data || []);
        this.seleccionarCajaAbierta();
      },
      error: (error) => {
        console.error('Error al cargar cajas:', error);
        this.cajas = [];
      }
    });
  }

  seleccionarCajaAbierta(): void {
    // Buscar caja abierta del usuario actual primero
    let cajaAbierta = this.cajas.find(caja => 
      this.isCajaOpen(caja) && caja.user_id === this.currentUserId
    );

    // Si no hay caja abierta del usuario, buscar cualquier caja abierta
    if (!cajaAbierta) {
      cajaAbierta = this.cajas.find(caja => this.isCajaOpen(caja));
    }

    if (cajaAbierta) {
      this.cajaSeleccionada = cajaAbierta;
      this.form.patchValue({ caja_id: cajaAbierta.id });
    } else {
      this.cajaSeleccionada = null;
      this.form.patchValue({ caja_id: '' });
    }
  }

  isCajaOpen(caja: Caja): boolean {
    return caja.estado === 'abierta' || caja.estado === '1' || caja.estado === 1 || caja.estado === true;
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
    if (this.detalles.length === 0) {
      alert('Debe agregar al menos un producto a la venta');
      return;
    }

    // Validar campos de crédito si es venta a crédito
    if (this.esVentaCredito) {
      const numeroCuotas = this.form.get('numero_cuotas')?.value;
      const tiempoDiasCuota = this.form.get('tiempo_dias_cuota')?.value;
      
      if (!numeroCuotas || numeroCuotas < 1) {
        alert('Por favor ingrese el número de cuotas para la venta a crédito');
        return;
      }
      
      if (!tiempoDiasCuota || tiempoDiasCuota < 1) {
        alert('Por favor ingrese los días entre cuotas para la venta a crédito');
        return;
      }
    }

    // Validar otros campos requeridos (sin incluir campos de crédito si no es crédito)
    const camposRequeridos = ['cliente_id', 'tipo_venta_id', 'tipo_pago_id', 'almacen_id', 'caja_id'];
    const camposFaltantes = camposRequeridos.filter(campo => !this.form.get(campo)?.value);
    
    if (camposFaltantes.length > 0) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    // Validar que haya una caja abierta
    const cajaId = this.form.get('caja_id')?.value;
    if (!cajaId) {
      alert('No hay una caja abierta disponible. Por favor abra una caja antes de realizar una venta.');
      return;
    }

    const caja = this.cajas.find(c => c.id === cajaId);
    if (!caja || !this.isCajaOpen(caja)) {
      alert('La caja seleccionada está cerrada. Por favor abra una caja antes de realizar una venta.');
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

    const formValue = this.form.getRawValue();
    // Obtener fecha y hora actual si está deshabilitado
    const fechaHoraValue = formValue.fecha_hora || new Date().toISOString().slice(0, 16);
    // Formatear fecha para Laravel: Y-m-d H:i:s
    const fechaHora = new Date(fechaHoraValue).toISOString().slice(0, 19).replace('T', ' ');

    // Asegurar que caja_id tenga un valor válido
    const cajaIdValue = formValue.caja_id ? Number(formValue.caja_id) : null;
    if (!cajaIdValue) {
      alert('Error: No se pudo obtener la caja. Por favor recargue la página.');
      return;
    }

    // Generar valores por defecto para campos requeridos
    const tipoComprobante = formValue.tipo_comprobante?.trim() || 'BOLETA';
    const numComprobante = formValue.num_comprobante?.trim() || this.generarNumeroComprobante();
    const serieComprobante = formValue.serie_comprobante?.trim() || null;

    const ventaData: any = {
      cliente_id: Number(formValue.cliente_id),
      user_id: Number(formValue.user_id),
      tipo_venta_id: Number(formValue.tipo_venta_id),
      tipo_pago_id: Number(formValue.tipo_pago_id),
      almacen_id: Number(almacenId), // Necesario para validar stock en el backend
      caja_id: cajaIdValue,
      tipo_comprobante: tipoComprobante, // Requerido, usar 'BOLETA' por defecto
      serie_comprobante: serieComprobante, // Opcional
      num_comprobante: numComprobante, // Requerido, generar automáticamente si no se proporciona
      fecha_hora: fechaHora,
      total: parseFloat(formValue.total.toFixed(2)),
      // No enviar estado, dejar que use el default de la BD ('Activo')
      detalles: formValue.detalles.map((detalle: any) => ({
        articulo_id: Number(detalle.articulo_id),
        cantidad: Number(detalle.cantidad),
        precio: parseFloat(parseFloat(detalle.precio).toFixed(2)),
        descuento: parseFloat(parseFloat(detalle.descuento || 0).toFixed(2))
      }))
    };

    console.log('Datos a enviar:', ventaData);

    this.isLoading = true;
    this.ventaService.create(ventaData)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          console.log('=== RESPUESTA DE CREAR VENTA ===');
          console.log('Respuesta completa:', JSON.stringify(response, null, 2));
          
          // El backend puede devolver {data: {...}} o directamente el objeto
          let ventaCreada = null;
          if (response && response.data) {
            ventaCreada = response.data;
          } else if (response && response.id) {
            ventaCreada = response;
          } else {
            ventaCreada = response;
          }
          
          console.log('Venta creada procesada:', ventaCreada);
          console.log('Tipo de ventaCreada:', typeof ventaCreada);
          console.log('Es venta a crédito?', this.esVentaCredito);
          console.log('Venta ID extraído:', ventaCreada?.id);
          console.log('Venta ID tipo:', typeof ventaCreada?.id);
          
          // Si es venta a crédito, crear el registro de crédito
          if (this.esVentaCredito) {
            const ventaId = ventaCreada?.id || ventaCreada?.venta_id;
            console.log('Venta ID final a usar:', ventaId);
            
            if (ventaId) {
              console.log('✅ Venta ID válido, llamando a crearCreditoVenta...');
              // Asegurar que ventaCreada tenga el ID correcto
              const ventaConId = { ...ventaCreada, id: ventaId };
              console.log('Venta con ID para crédito:', ventaConId);
              this.crearCreditoVenta(ventaConId, formValue);
            } else {
              console.error('❌ Error: No se pudo obtener el ID de la venta creada');
              console.error('Venta creada completa:', ventaCreada);
              alert('Venta registrada pero no se pudo crear el crédito. ID de venta no encontrado. Por favor verifique en el historial.');
              this.loadVentas();
              this.resetForm();
            }
          } else {
            alert('Venta registrada exitosamente');
            this.loadVentas();
            this.resetForm();
          }
        },
        error: (error) => {
          console.error('Error al crear venta:', error);
          console.error('Error completo:', JSON.stringify(error, null, 2));
          const errorMessage = error.error?.message || error.error?.error || 'Error al crear la venta';
          const errors = error.error?.errors;
          if (errors) {
            const errorText = Object.values(errors).flat().join('\n');
            console.error('Errores de validación:', errors);
            alert(`Error de validación:\n${errorText}`);
          } else {
            alert(`Error: ${errorMessage}`);
          }
        }
      });
  }

  resetForm(): void {
    // Actualizar fecha y hora actual
    const fechaHoraActual = new Date().toISOString().slice(0, 16);
    
    this.form.reset({
      cliente_id: '',
      user_id: this.currentUserId,
      tipo_venta_id: '',
      tipo_pago_id: '',
      almacen_id: '',
      caja_id: this.cajaSeleccionada?.id || '',
      tipo_comprobante: '',
      serie_comprobante: '',
      num_comprobante: '',
      fecha_hora: fechaHoraActual,
      total: 0,
      estado: 'Activo',
      numero_cuotas: 0,
      tiempo_dias_cuota: 30
    });
    this.detalles.clear();
    this.clienteSeleccionado = null;
    this.clienteBusqueda = '';
    this.productoSeleccionado = null;
    this.busquedaProducto = '';
    this.productosInventario = [];
    this.productosFiltrados = [];
    this.esVentaCredito = false;
    this.isModalCreditoOpen = false;
    
    // Re-seleccionar caja abierta
    this.seleccionarCajaAbierta();
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  generarNumeroComprobante(): string {
    // Generar un número de comprobante único basado en timestamp
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random}`.slice(-10); // Últimos 10 dígitos
  }

  navegarANuevaVenta(): void {
    this.router.navigate(['/ventas/nueva']);
  }

  puedeRegistrarVenta(): boolean {
    // Validar campos básicos requeridos
    const camposRequeridos = ['cliente_id', 'tipo_venta_id', 'tipo_pago_id', 'almacen_id', 'caja_id'];
    const camposFaltantes = camposRequeridos.filter(campo => !this.form.get(campo)?.value);
    
    if (camposFaltantes.length > 0) {
      return false;
    }

    // Si es venta a crédito, validar campos de crédito
    if (this.esVentaCredito) {
      const numeroCuotas = this.form.get('numero_cuotas')?.value;
      const tiempoDiasCuota = this.form.get('tiempo_dias_cuota')?.value;
      
      if (!numeroCuotas || numeroCuotas < 1) {
        return false;
      }
      
      if (!tiempoDiasCuota || tiempoDiasCuota < 1) {
        return false;
      }
    }

    return true;
  }

  crearCreditoVenta(venta: any, formValue: any): void {
    const numeroCuotas = Number(formValue.numero_cuotas) || 1;
    const tiempoDiasCuota = Number(formValue.tiempo_dias_cuota) || 30;
    const totalVenta = parseFloat(formValue.total.toFixed(2));
    
    // Calcular fecha del próximo pago
    const proximoPago = new Date();
    proximoPago.setDate(proximoPago.getDate() + tiempoDiasCuota);
    
    // Formatear fecha para Laravel: Y-m-d H:i:s
    const proximoPagoFormatted = proximoPago.toISOString().slice(0, 19).replace('T', ' ');
    
    // Preparar datos según el modelo (fillable)
    // El modelo acepta: venta_id, cliente_id, numero_cuotas, tiempo_dias_cuota, total, estado, proximo_pago
    const creditoData: any = {
      venta_id: Number(venta.id),
      cliente_id: Number(formValue.cliente_id),
      numero_cuotas: numeroCuotas,
      tiempo_dias_cuota: tiempoDiasCuota,
      total: totalVenta,
      estado: 'Pendiente',
      proximo_pago: proximoPagoFormatted
    };

    console.log('=== CREANDO CRÉDITO VENTA ===');
    console.log('Datos del crédito:', JSON.stringify(creditoData, null, 2));
    console.log('Venta objeto completo:', venta);
    console.log('Venta ID:', venta.id);
    console.log('Venta ID tipo:', typeof venta.id);
    console.log('Cliente ID:', formValue.cliente_id);
    console.log('URL del servicio:', `${this.creditoVentaService['apiUrl']}`);

    this.creditoVentaService.create(creditoData).subscribe({
      next: (response: any) => {
        console.log('=== RESPUESTA DEL BACKEND (CRÉDITO) ===');
        console.log('Respuesta completa:', JSON.stringify(response, null, 2));
        console.log('Response type:', typeof response);
        console.log('Response.data:', response?.data);
        console.log('Response.success:', response?.success);
        
        // El backend puede devolver {success: true, data: {...}} o directamente el objeto
        const creditoCreado = response?.data || response;
        console.log('Crédito creado procesado:', creditoCreado);
        console.log('ID del crédito creado:', creditoCreado?.id);
        console.log('Venta ID del crédito:', creditoCreado?.venta_id);
        
        if (creditoCreado && creditoCreado.id) {
          console.log('✅ Crédito creado exitosamente con ID:', creditoCreado.id);
          alert(`Venta a crédito registrada exitosamente.\nID Crédito: ${creditoCreado.id}\nID Venta: ${creditoCreado.venta_id}`);
        } else {
          console.warn('⚠️ Advertencia: El crédito se creó pero no se pudo obtener el ID');
          alert('Venta a crédito registrada. Por favor verifique en el historial de créditos.');
        }
        
        this.loadVentas();
        this.resetForm();
      },
      error: (error: any) => {
        console.error('Error completo al crear crédito:', error);
        console.error('Status:', error.status);
        console.error('Error body:', error.error);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Error desconocido al crear crédito';
        if (error.error) {
          if (error.error.errors) {
            const errorText = Object.values(error.error.errors).flat().join('\n');
            errorMessage = `Error de validación:\n${errorText}`;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          }
        }
        
        alert(`Error al crear crédito:\n${errorMessage}`);
        this.loadVentas();
        this.resetForm();
      }
    });
  }

  verDetalleVenta(venta: Venta): void {
    // TODO: Implementar modal o vista de detalle de venta
    alert(`Detalle de Venta #${venta.id}\nCliente: ${venta.cliente?.nombre}\nTotal: ${venta.total}\nFecha: ${venta.fecha_hora}`);
  }

  abrirModalCredito(): void {
    console.log('🔓 MÉTODO abrirModalCredito() LLAMADO');
    console.log('Estado ANTES de abrir:', this.isModalCreditoOpen);
    
    this.isModalCreditoOpen = true;
    
    console.log('Estado DESPUÉS de abrir:', this.isModalCreditoOpen);
    
    // Establecer valores por defecto si no existen
    if (!this.form.get('numero_cuotas')?.value || this.form.get('numero_cuotas')?.value === 0 || this.form.get('numero_cuotas')?.value === null) {
      this.form.get('numero_cuotas')?.setValue(1);
      console.log('Número de cuotas establecido a 1');
    }
    if (!this.form.get('tiempo_dias_cuota')?.value || this.form.get('tiempo_dias_cuota')?.value === 0 || this.form.get('tiempo_dias_cuota')?.value === null) {
      this.form.get('tiempo_dias_cuota')?.setValue(30);
      console.log('Tiempo días cuota establecido a 30');
    }
    
    // Agregar validadores
    this.form.get('numero_cuotas')?.setValidators([Validators.required, Validators.min(1)]);
    this.form.get('tiempo_dias_cuota')?.setValidators([Validators.required, Validators.min(1)]);
    this.form.get('numero_cuotas')?.updateValueAndValidity();
    this.form.get('tiempo_dias_cuota')?.updateValueAndValidity();
    
    console.log('✅ Modal configurado. isModalCreditoOpen =', this.isModalCreditoOpen);
    
    // Forzar detección de cambios
    setTimeout(() => {
      console.log('Verificación final - isModalCreditoOpen:', this.isModalCreditoOpen);
    }, 100);
  }

  cerrarModalCredito(): void {
    this.isModalCreditoOpen = false;
  }

  guardarDatosCredito(): void {
    const numeroCuotas = this.form.get('numero_cuotas')?.value;
    const tiempoDiasCuota = this.form.get('tiempo_dias_cuota')?.value;
    
    if (!numeroCuotas || numeroCuotas < 1) {
      alert('Por favor ingrese un número de cuotas válido (mínimo 1)');
      return;
    }
    
    if (!tiempoDiasCuota || tiempoDiasCuota < 1) {
      alert('Por favor ingrese los días entre cuotas válidos (mínimo 1)');
      return;
    }
    
    this.cerrarModalCredito();
  }
}
