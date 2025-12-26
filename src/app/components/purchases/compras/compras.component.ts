import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, NgClass, DatePipe } from '@angular/common';
import { MonedaPipe } from '../../../pipes/moneda.pipe';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompraService } from '../../../services/compra.service';
import { ProveedorService } from '../../../services/proveedor.service';
import { AlmacenService } from '../../../services/almacen.service';
import { ArticuloService } from '../../../services/articulo.service';
import { CajaService } from '../../../services/caja.service';
import { CompraCuotaService } from '../../../services/compra-cuota.service';
import { AuthService } from '../../../services/auth.service';
import { MonedaActivaService } from '../../../services/moneda-activa.service';
import { Compra, DetalleCompra, Proveedor, Almacen, Articulo, Caja, PaginationParams, Sucursal } from '../../../interfaces';
import { SucursalService } from '../../../services/sucursal.service';
import { finalize } from 'rxjs/operators';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe, MonedaPipe, SearchBarComponent, PaginationComponent],
  templateUrl: './compras.component.html',
})
export class ComprasComponent implements OnInit {
  compras: Compra[] = [];
  proveedores: Proveedor[] = [];
  proveedoresFiltrados: Proveedor[] = [];
  almacenes: Almacen[] = [];
  articulos: Articulo[] = [];
  cajas: Caja[] = [];
  cajaAbierta: Caja | null = null;

  form: FormGroup;
  detallesFormArray: FormArray;
  isModalOpen = false;
  isHistorialView = false; // Determinar si estamos en la vista de historial
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;
  currentUserId = 1; // TODO: Obtener del servicio de autenticación
  isDetailModalOpen = false;
  compraSeleccionada: Compra | null = null;
  proveedorBusqueda: string = '';
  mostrarSugerenciasProveedor: boolean = false;
  proveedorSeleccionado: Proveedor | null = null;

  // Para manejar búsqueda de artículos en el catálogo
  busquedaArticulo: string = '';
  articulosFiltrados: Articulo[] = [];
  articuloSeleccionado: Articulo | null = null;
  mostrarSugerenciasArticulo: boolean = false;

  // Para selección múltiple con checkboxes
  articulosSeleccionados: Set<number> = new Set();
  seleccionarTodo: boolean = false;

  // Paginación
  currentPage: number = 1;
  lastPage: number = 1;
  total: number = 0;
  perPage: number = 15;
  searchTerm: string = '';

  // Modal de edición de precio/costo
  isEditPrecioModalOpen = false;
  articuloEditando: Articulo | null = null;
  precioEditForm: FormGroup;
  detalleIndexEditando: number | null = null;

  // Modal de información de crédito
  isCreditoModalOpen = false;

  // Para el dropdown de almacenes
  mostrarMenuAlmacenes = false;
  currentUserSucursalId: number | null = null;

  // Filtro de sucursal para admin
  sucursales: Sucursal[] = [];
  filterSucursalId: number | null = null;
  isAdmin: boolean = false;

  // Para alertas visuales
  alertMessage: string = '';
  showAlert: boolean = false;
  alertType: 'error' | 'success' | 'warning' | 'info' = 'error';

  // Símbolo de moneda dinámico
  simboloMoneda: string = 'Q';

  // Sistema de pasos progresivos
  currentStep: number = 1;
  totalSteps: number = 3;
  steps: string[] = ['Información Básica', 'Selección de Productos', 'Resumen y Confirmación'];

  constructor(
    private compraService: CompraService,
    private proveedorService: ProveedorService,
    private almacenService: AlmacenService,
    private articuloService: ArticuloService,
    private cajaService: CajaService,
    private compraCuotaService: CompraCuotaService,
    private authService: AuthService,
    private sucursalService: SucursalService,
    private monedaActivaService: MonedaActivaService,
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
      tipo_comprobante: ['RECIBO'],
      serie_comprobante: [''],
      num_comprobante: [''],
      descuento_global: [0, [Validators.min(0)]],
      tipo_compra: ['contado', Validators.required],
      numero_cuotas: [1, [Validators.min(1)]],
      monto_pagado: [0, [Validators.min(0)]],
      estado: [''],
      detalles: this.detallesFormArray
    });

    // Formulario para editar precio/costo
    this.precioEditForm = this.fb.group({
      precio_costo_unid: [0, [Validators.required, Validators.min(0)]],
      precio_costo_paq: [0, [Validators.min(0)]],
      porcentaje_ganancia: [30, [Validators.min(0), Validators.max(1000)]],
      precio_venta: [0, [Validators.min(0)]],
      precio_uno: [0, [Validators.min(0)]],
      precio_dos: [0, [Validators.min(0)]],
      precio_tres: [0, [Validators.min(0)]],
      precio_cuatro: [0, [Validators.min(0)]]
    });

    // Calcular precio de venta cuando cambie el precio costo o el porcentaje
    this.precioEditForm.get('precio_costo_unid')?.valueChanges.subscribe(() => {
      this.calculatePrecioVenta();
    });

    this.precioEditForm.get('porcentaje_ganancia')?.valueChanges.subscribe(() => {
      this.calculatePrecioVenta();
    });

    // Listener para recalcular total cuando cambie el descuento global
    this.form.get('descuento_global')?.valueChanges.subscribe(() => {
      this.calculateTotal();
    });

    // Listener para abrir modal de crédito cuando se seleccione crédito
    this.form.get('tipo_compra')?.valueChanges.subscribe((tipoCompra) => {
      if (tipoCompra === 'credito' && !this.isEditing) {
        // Abrir modal automáticamente solo si no hay número de cuotas configurado
        const numeroCuotas = this.form.get('numero_cuotas')?.value;
        if (!numeroCuotas || numeroCuotas < 1) {
          setTimeout(() => {
            this.openCreditoModal();
          }, 100);
        }
      } else if (tipoCompra === 'contado') {
        // Cerrar modal si se cambia a contado
        this.closeCreditoModal();
      }
    });
    
    // Listener para actualizar la caja cuando cambie el almacén
    this.form.get('almacen_id')?.valueChanges.subscribe((almacenId) => {
      if (almacenId) {
        this.actualizarCajaPorAlmacen(Number(almacenId));
      }
    });
  }

  seleccionarTipoCompra(tipo: 'contado' | 'credito'): void {
    this.form.patchValue({ tipo_compra: tipo });

    if (tipo === 'credito' && !this.isEditing) {
      // Abrir modal automáticamente solo si no hay número de cuotas configurado
      const numeroCuotas = this.form.get('numero_cuotas')?.value;
      if (!numeroCuotas || numeroCuotas < 1) {
        setTimeout(() => {
          this.openCreditoModal();
        }, 100);
      }
    } else if (tipo === 'contado') {
      // Cerrar modal si se cambia a contado
      this.closeCreditoModal();
    }
  }

  seleccionarTipoComprobante(tipo: 'RECIBO' | 'FACTURA'): void {
    this.form.patchValue({ tipo_comprobante: tipo });
  }

  openCreditoModal(): void {
    this.isCreditoModalOpen = true;
    // Asegurar que los valores iniciales estén configurados
    const currentNumCuotas = this.form.get('numero_cuotas')?.value;
    const currentMontoPagado = this.form.get('monto_pagado')?.value;

    // Solo establecer valores por defecto si no existen
    if (!currentNumCuotas || currentNumCuotas < 1) {
      this.form.patchValue({ numero_cuotas: 1 });
    }
    if (currentMontoPagado === null || currentMontoPagado === undefined) {
      this.form.patchValue({ monto_pagado: 0 });
    }
  }

  saveCreditoConfig(): void {
    // Validar y guardar la configuración de crédito
    const numeroCuotas = this.form.get('numero_cuotas')?.value;
    const montoPagado = this.form.get('monto_pagado')?.value || 0;

    // Validar que numero_cuotas sea válido
    if (!numeroCuotas || numeroCuotas < 1) {
      this.showAlertMessage('Error: El número de cuotas debe ser mayor a 0.', 'error');
      return;
    }

    // Los valores ya están en el formulario, solo cerrar el modal
    this.isCreditoModalOpen = false;
  }

  closeCreditoModal(): void {
    this.isCreditoModalOpen = false;
  }

  // Calcular vista previa de cuotas
  getCuotasPreview(): Array<{ numero: number, fecha: string, monto: number }> {
    const total = this.form.get('total')?.value || 0;
    const cuotaInicial = this.form.get('monto_pagado')?.value || 0;
    const numCuotas = this.form.get('numero_cuotas')?.value || 0;
    const fechaHora = this.form.get('fecha_hora')?.value;

    if (!numCuotas || numCuotas < 1 || !total || total <= 0) {
      return [];
    }

    const saldoPendiente = total - cuotaInicial;
    if (saldoPendiente <= 0) {
      return [];
    }

    const montoPorCuota = saldoPendiente / numCuotas;
    const frecuenciaDias = 30; // 30 días por defecto
    const cuotas: Array<{ numero: number, fecha: string, monto: number }> = [];

    // Calcular fecha base
    let fechaBase: Date;
    if (fechaHora) {
      fechaBase = new Date(fechaHora);
    } else {
      fechaBase = new Date();
    }

    for (let i = 1; i <= numCuotas; i++) {
      const fechaVencimiento = new Date(fechaBase);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + (i * frecuenciaDias));

      // Para la última cuota, ajustar el monto para evitar diferencias por redondeo
      let montoCuota: number;
      if (i === numCuotas) {
        montoCuota = Math.round((saldoPendiente - (montoPorCuota * (numCuotas - 1))) * 100) / 100;
      } else {
        montoCuota = Math.round(montoPorCuota * 100) / 100;
      }

      cuotas.push({
        numero: i,
        fecha: fechaVencimiento.toLocaleDateString('es-GT', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        monto: montoCuota
      });
    }

    return cuotas;
  }

  getTotalCuotas(): number {
    const cuotas = this.getCuotasPreview();
    return cuotas.reduce((sum, cuota) => sum + cuota.monto, 0);
  }

  getSaldoPendiente(): number {
    const total = this.form.get('total')?.value || 0;
    const cuotaInicial = this.form.get('monto_pagado')?.value || 0;
    return Math.max(0, total - cuotaInicial);
  }

  ngOnInit(): void {
    console.log('Iniciando componente de compras');
    
    // Obtener el símbolo de moneda activa inicial
    this.simboloMoneda = this.monedaActivaService.getSimbolo();
    
    // Suscribirse al símbolo de moneda activa para actualización dinámica
    this.monedaActivaService.getSimboloObservable().subscribe(simbolo => {
      this.simboloMoneda = simbolo;
    });

    // Obtener información del usuario actual
    const currentUser = this.authService.getCurrentUser();
    console.log('Usuario actual:', currentUser);
    
    if (currentUser) {
      this.currentUserId = currentUser.id;
      this.currentUserSucursalId = currentUser.sucursal_id || null;
      this.form.patchValue({ user_id: this.currentUserId });

      // Verificar si es admin
      this.isAdmin = currentUser.rol_id === 1;
      console.log('Usuario ID:', this.currentUserId);
      console.log('Sucursal ID del usuario:', this.currentUserSucursalId);
      console.log('Es admin:', this.isAdmin);

      if (this.isAdmin) {
        this.loadSucursales();
      }
    }

    // Establecer fecha y hora inicial automáticamente
    this.actualizarFechaHora();

    // Detectar si estamos en la vista de historial o nueva compra
    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      this.isHistorialView = path === 'historial';
      console.log('Path actual:', path);
      console.log('Es vista de historial:', this.isHistorialView);
      console.log('URL completa:', url);

      if (this.isHistorialView) {
        // En historial, solo cargar las compras
        this.isModalOpen = false;
        this.loadCompras();
      } else {
        // En nueva compra, cargar todo para el formulario
        this.isModalOpen = true;
        console.log('Cargando dependencias para nueva compra');
        this.loadDependencies();
        this.loadCompras(); // También cargar compras para referencia
        // Actualizar fecha y hora cuando se navega a nueva compra
        this.actualizarFechaHora();
      }
    });
  }

  navegarANuevaCompra(): void {
    this.router.navigate(['/compras/nueva']);
  }

  loadDependencies(): void {
    console.log('Cargando dependencias');
    
    this.proveedorService.getAll().subscribe({
      next: (res) => {
        this.proveedores = Array.isArray(res.data) ? res.data : [];
        this.proveedoresFiltrados = this.proveedores;
        console.log('Proveedores cargados:', this.proveedores.length);
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
        console.log('Almacenes cargados:', this.almacenes);
        this.seleccionarAlmacenPorDefecto();
        
        // Log para debug
        console.log('Almacenes cargados:', this.almacenes);
        console.log('Almacen seleccionado:', this.form.get('almacen_id')?.value);
        
        // Cargar cajas y encontrar la caja abierta
        // Ahora que ya tenemos un almacén seleccionado, podemos buscar la caja correcta
        this.cargarCajasYBuscarCajaAbierta();
      },
      error: (error) => {
        console.error('Error loading almacenes', error);
        this.almacenes = [];
      }
    });
    
    this.articuloService.getAll(1, 1000).subscribe({
      next: (res) => {
        const paginated = res?.data as any;
        if (paginated && Array.isArray(paginated.data)) {
          this.articulos = paginated.data;
        } else if (Array.isArray(res?.data)) {
          this.articulos = res.data;
        } else {
          this.articulos = [];
        }
        this.articulosFiltrados = this.articulos;
        console.log('Articulos cargados:', this.articulos.length);
      },
      error: (error) => {
        console.error('Error loading articulos', error);
        this.articulos = [];
        this.articulosFiltrados = [];
      }
    });
  }

  loadSucursales(): void {
    this.sucursalService.getAll().subscribe({
      next: (response) => {
        if (response.data) {
          this.sucursales = response.data;
        }
      },
      error: (error) => console.error('Error loading sucursales', error)
    });
  }

  loadCompras(): void {
    this.isLoading = true;

    const params: PaginationParams = {
      page: this.currentPage,
      per_page: this.perPage,
      sort_by: 'id',
      sort_order: 'desc'
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    if (this.filterSucursalId) {
      params.sucursal_id = this.filterSucursalId;
    }

    this.compraService.getPaginated(params)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          if (response.data) {
            this.compras = response.data.data || [];
            this.currentPage = response.data.current_page;
            this.lastPage = response.data.last_page;
            this.total = response.data.total;
            this.perPage = response.data.per_page;
          }
        },
        error: (error) => {
          console.error('Error loading compras', error);
          // Fallback a getAll si falla la paginación
          this.compraService.getAll()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (compras) => {
                this.compras = Array.isArray(compras) ? compras : [];
              }
            });
        }
      });
  }

  onSearch(search: string): void {
    this.searchTerm = search;
    this.currentPage = 1;
    this.loadCompras();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCompras();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCompras();
  }

  // Métodos para navegación entre pasos
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Validar el paso actual antes de avanzar
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      // Validar pasos anteriores antes de saltar
      if (step <= this.currentStep || this.validateStepsBefore(step)) {
        this.currentStep = step;
      }
    }
  }

  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        // Validar información básica
        if (!this.form.get('proveedor_id')?.value || !this.form.get('proveedor_nombre')?.value) {
          this.showAlertMessage('Por favor seleccione un proveedor', 'warning');
          return false;
        }
        if (!this.form.get('almacen_id')?.value) {
          this.showAlertMessage('Por favor seleccione un almacén', 'warning');
          return false;
        }
        if (!this.form.get('tipo_comprobante')?.value) {
          this.showAlertMessage('Por favor seleccione un tipo de comprobante', 'warning');
          return false;
        }
        return true;
      case 2:
        // Validar que haya productos seleccionados
        if (this.detallesFormArray.length === 0) {
          this.showAlertMessage('Por favor agregue al menos un producto', 'warning');
          return false;
        }
        return true;
      case 3:
        // Validar información de pago
        const tipoCompra = this.form.get('tipo_compra')?.value;
        if (tipoCompra === 'credito') {
          const numeroCuotas = this.form.get('numero_cuotas')?.value;
          if (!numeroCuotas || numeroCuotas < 1) {
            this.showAlertMessage('Por favor configure el crédito correctamente', 'warning');
            this.openCreditoModal();
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  }

  validateStepsBefore(targetStep: number): boolean {
    // Validar todos los pasos anteriores al paso objetivo
    for (let i = 1; i < targetStep; i++) {
      const tempStep = this.currentStep;
      this.currentStep = i;
      if (!this.validateCurrentStep()) {
        this.currentStep = tempStep;
        return false;
      }
      this.currentStep = tempStep;
    }
    return true;
  }

  isStepValid(step: number): boolean {
    const tempStep = this.currentStep;
    this.currentStep = step;
    const isValid = this.validateCurrentStep();
    this.currentStep = tempStep;
    return isValid;
  }

  openModal(): void {
    this.currentStep = 1; // Reiniciar al primer paso
    try {
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
      // Limpiar selección múltiple
      this.articulosSeleccionados.clear();
      this.seleccionarTodo = false;
      // Establecer fecha y hora actual automáticamente
      const fechaHoraActual = new Date().toISOString().slice(0, 16);
      this.form.reset({
        proveedor_id: '',
        proveedor_nombre: '',
        user_id: this.currentUserId,
        almacen_id: '',
        fecha_hora: fechaHoraActual,
        total: 0,
        tipo_compra: 'contado',
        tipo_comprobante: 'RECIBO',
        descuento_global: 0
      });
      this.form.patchValue({ proveedor_nombre: '' });
      // Asegurar que la fecha y hora se actualice cuando se abra el modal
      this.actualizarFechaHora();
    } catch (error) {
      console.error('Error al abrir modal:', error);
      this.showAlertMessage('Error al abrir el modal. Por favor revise la consola para más detalles.', 'error');
    }
  }

  actualizarFechaHora(): void {
    const fechaHoraActual = new Date().toISOString().slice(0, 16);
    this.form.patchValue({ fecha_hora: fechaHoraActual });
  }

  closeModal(): void {
    // En lugar de cerrar, solo limpiar el formulario para una nueva compra
    this.isEditing = false;
    this.currentId = null;
    this.currentStep = 1; // Reiniciar al primer paso
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
    // Limpiar selección múltiple
    this.articulosSeleccionados.clear();
    this.seleccionarTodo = false;
    // Resetear valores del formulario
    this.form.patchValue({
      proveedor_id: '',
      proveedor_nombre: '',
      user_id: this.currentUserId,
      almacen_id: '',
      fecha_hora: new Date().toISOString().slice(0, 16),
      total: 0,
      tipo_compra: 'contado',
      tipo_comprobante: 'RECIBO',
      descuento_global: 0
    });
  }

  viewDetail(compra: Compra): void {
    // Cargar la compra completa con todos sus detalles desde el backend
    this.compraService.getById(compra.id)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.compraSeleccionada = response.data;
          } else if (response.data) {
            // Si no tiene success pero tiene data (formato directo)
            this.compraSeleccionada = response.data as Compra;
          } else {
            // Fallback: usar la compra que ya tenemos
            this.compraSeleccionada = compra;
          }
          this.isDetailModalOpen = true;

          // Si es compra a crédito, cargar las cuotas
          if (this.compraSeleccionada.compra_credito?.id) {
            this.compraCuotaService.getByCompraCredito(this.compraSeleccionada.compra_credito.id)
              .subscribe({
                next: (cuotasResponse) => {
                  if (cuotasResponse.success && cuotasResponse.data && this.compraSeleccionada?.compra_credito) {
                    this.compraSeleccionada.compra_credito.cuotas = cuotasResponse.data;
                  }
                },
                error: (error) => {
                  console.error('Error al cargar cuotas:', error);
                }
              });
          }
        },
        error: (error) => {
          console.error('Error al cargar detalle de compra:', error);
          // Fallback: usar la compra que ya tenemos
          this.compraSeleccionada = compra;
          this.isDetailModalOpen = true;
        }
      });
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.compraSeleccionada = null;
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

      // Cargar datos de crédito si existe
      const numeroCuotas = compra.compra_credito?.num_cuotas || 1;
      const montoPagado = compra.compra_credito?.cuota_inicial || 0;

      this.form.patchValue({
        proveedor_id: compra.proveedor_id || '',
        proveedor_nombre: proveedor ? proveedor.nombre : '',
        user_id: compra.user_id,
        almacen_id: compra.almacen_id,
        fecha_hora: compra.fecha_hora ? new Date(compra.fecha_hora).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        total: compra.total,
        tipo_comprobante: compra.tipo_comprobante || 'RECIBO',
        serie_comprobante: compra.serie_comprobante || '',
        num_comprobante: compra.num_comprobante || '',
        descuento_global: compra.descuento_global || 0,
        tipo_compra: compra.tipo_compra ? compra.tipo_compra.toLowerCase() : 'contado',
        numero_cuotas: numeroCuotas,
        monto_pagado: montoPagado,
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
    const descuentoGlobal = parseFloat(this.form.get('descuento_global')?.value) || 0;
    const total = subtotal - descuentoGlobal;
    this.form.patchValue({ total: Math.max(0, total) }, { emitEvent: false });
  }

  get subtotal(): number {
    return this.detallesFormArray.controls.reduce((sum, control) => {
      return sum + (control.get('subtotal')?.value || 0);
    }, 0);
  }

  get descuentoGlobal(): number {
    return parseFloat(this.form.get('descuento_global')?.value) || 0;
  }

  get descuentoIndividual(): number {
    return this.detallesFormArray.controls.reduce((sum, control) => {
      return sum + (parseFloat(control.get('descuento')?.value) || 0);
    }, 0);
  }

  get totalDescuentos(): number {
    return this.descuentoIndividual + this.descuentoGlobal;
  }

  getDescuentoProporcionalPorProducto(index: number): number {
    if (this.descuentoGlobal <= 0 || this.subtotal <= 0) {
      return 0;
    }
    const detalle = this.detallesFormArray.at(index);
    if (!detalle) return 0;

    const subtotalProducto = detalle.get('subtotal')?.value || 0;
    if (subtotalProducto <= 0) return 0;

    // Calcular el porcentaje que representa este producto del subtotal
    const porcentaje = subtotalProducto / this.subtotal;

    // Aplicar ese porcentaje al descuento global
    return this.descuentoGlobal * porcentaje;
  }

  getSubtotalConDescuentoGlobal(index: number): number {
    const detalle = this.detallesFormArray.at(index);
    if (!detalle) return 0;

    const subtotal = detalle.get('subtotal')?.value || 0;
    const descuentoProporcional = this.getDescuentoProporcionalPorProducto(index);

    return Math.max(0, subtotal - descuentoProporcional);
  }

  isContado(tipoCompra: string | undefined | null): boolean {
    if (!tipoCompra) return false;
    return tipoCompra.toLowerCase() === 'contado';
  }

  // Función para calcular el saldo disponible de una caja
  calcularSaldoDisponible(caja: any): number {
    if (!caja) return 0;
    
    // Convertir todos los valores a números
    const saldoInicial = parseFloat(String(caja.saldo_inicial || 0));
    const depositos = parseFloat(String(caja.depositos || 0));
    const ventas = parseFloat(String(caja.ventas || 0));
    const pagosEfectivo = parseFloat(String(caja.pagos_efectivo || 0));
    const pagosQr = parseFloat(String(caja.pagos_qr || 0));
    const pagosTransferencia = parseFloat(String(caja.pagos_transferencia || 0));
    const cuotasVentasCredito = parseFloat(String(caja.cuotas_ventas_credito || 0));
    const salidas = parseFloat(String(caja.salidas || 0));
    const comprasContado = parseFloat(String(caja.compras_contado || 0));
    const comprasCredito = parseFloat(String(caja.compras_credito || 0));
    const saldoFaltante = parseFloat(String(caja.saldo_faltante || 0));
    
    // Calcular saldo disponible
    const saldoDisponible = saldoInicial + depositos + ventas + pagosEfectivo + pagosQr + 
                           pagosTransferencia + cuotasVentasCredito - salidas - 
                           comprasContado - comprasCredito - saldoFaltante;
    
    return saldoDisponible;
  }

  save(): void {

    // VALIDAR QUE HAYA UNA CAJA ABIERTA
    if (!this.cajaAbierta) {
      this.showAlertMessage('No hay una caja abierta para la sucursal seleccionada. Por favor, abra una caja antes de realizar compras.', 'error');
      return;
    }

    // Verificar que la caja sigue abierta (recargar si es necesario)
    const isCajaOpen = (this.cajaAbierta.estado === 1 ||
      this.cajaAbierta.estado === '1' ||
      this.cajaAbierta.estado === true ||
      this.cajaAbierta.estado === 'abierta');

    if (!isCajaOpen) {
      this.showAlertMessage('La caja seleccionada está cerrada. Por favor, abra una caja antes de realizar compras.', 'error');
      // Recargar cajas para encontrar la abierta de la sucursal correcta
      this.cargarCajasYBuscarCajaAbierta();
      return;
    }

    // VALIDAR SALDO DE CAJA ANTES DE PERMITIR LA COMPRA
    // Recargar la caja para obtener el saldo actualizado
    this.cajaService.getById(this.cajaAbierta.id).subscribe({
      next: (cajaResponse) => {
        const cajaActualizada = cajaResponse.data || cajaResponse;
        // Calcular saldo disponible en lugar de usar saldo_caja directamente
        const saldoDisponible = this.calcularSaldoDisponible(cajaActualizada);
        
        // Calcular el total de la compra actual
        const totalCompra = parseFloat(this.form.get('total')?.value) || 0;
        
        
        // Determinar el monto a descontar según el tipo de compra
        const tipoCompraValidacion = (this.form.get('tipo_compra')?.value || 'contado').toLowerCase().trim();
        let montoADescontar = 0;
        
        if (tipoCompraValidacion === 'contado') {
          // Para compras de contado, se descuenta el total completo
          montoADescontar = totalCompra;
        } else if (tipoCompraValidacion === 'credito') {
          // Para compras a crédito, solo se descuenta la cuota inicial
          const montoPagado = parseFloat(this.form.get('monto_pagado')?.value) || 0;
          montoADescontar = montoPagado;
        }
        
        // Validar que el saldo sea suficiente para la compra
        if (saldoDisponible < montoADescontar) {
          this.showAlertMessage('Saldo insuficiente de caja. Saldo disponible: Bs' + saldoDisponible.toFixed(2) + '. Monto requerido: Bs' + montoADescontar.toFixed(2), 'error');
          return;
        }
        
        // Si el saldo es suficiente, continuar con el proceso de guardado
        this.procesarGuardadoCompra();
      },
      error: (error) => {
        console.error('Error al obtener saldo de caja:', error);
        // Si no se puede obtener el saldo, calcular el saldo de la caja actual
        const cajaActual = this.cajaAbierta;
        if (!cajaActual) {
          this.showAlertMessage('No se pudo verificar el saldo de la caja. Por favor, verifique que haya una caja abierta.', 'error');
          return;
        }
        
        const saldoDisponible = this.calcularSaldoDisponible(cajaActual);
        const totalCompra = parseFloat(this.form.get('total')?.value) || 0;
        const tipoCompraValidacion = (this.form.get('tipo_compra')?.value || 'contado').toLowerCase().trim();
        let montoADescontar = tipoCompraValidacion === 'contado' ? totalCompra : (parseFloat(this.form.get('monto_pagado')?.value) || 0);
        
        if (saldoDisponible < montoADescontar) {
          this.showAlertMessage('Saldo insuficiente de caja. Saldo disponible: Q' + saldoDisponible.toFixed(2) + '. Monto requerido: Q' + montoADescontar.toFixed(2), 'error');
          return;
        }
        
        // Continuar con el proceso de guardado
        this.procesarGuardadoCompra();
      }
    });
  }

  procesarGuardadoCompra(): void {
    // Verificar que la caja esté disponible
    if (!this.cajaAbierta) {
      this.showAlertMessage('No hay una caja abierta para la sucursal seleccionada. Por favor, abra una caja antes de realizar compras.', 'error');
      return;
    }

    // Validar que el nombre del proveedor esté ingresado
    if (!this.form.get('proveedor_nombre')?.value || this.proveedorBusqueda.trim().length === 0) {
      this.showAlertMessage('Por favor ingrese el nombre del proveedor', 'warning');
      return;
    }

    // Validar tipo de compra y campos de crédito antes de validar el formulario
    const tipoCompraValidacion = (this.form.get('tipo_compra')?.value || 'contado').toLowerCase().trim();
    if (tipoCompraValidacion === 'credito') {
      const numeroCuotas = this.form.get('numero_cuotas')?.value;
      const montoPagado = this.form.get('monto_pagado')?.value;


      if (!numeroCuotas || numeroCuotas < 1) {
        this.showAlertMessage('Error: Debe configurar el número de cuotas para la compra a crédito. Por favor, haga clic en "Configurar Crédito" y establezca el número de cuotas.', 'warning');
        this.openCreditoModal();
        return;
      }
    }

    if (this.form.invalid || this.detallesFormArray.length === 0) {
      if (this.detallesFormArray.length === 0) {
        this.showAlertMessage('Debe agregar al menos un artículo a la compra', 'warning');
      } else {
        // Mostrar qué campos están inválidos
        const invalidFields: string[] = [];
        Object.keys(this.form.controls).forEach(key => {
          const control = this.form.get(key);
          if (control && control.invalid) {
            invalidFields.push(key);
          }
        });
        this.showAlertMessage(`Por favor complete los campos requeridos: ${invalidFields.join(', ')}`, 'warning');
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
      this.showAlertMessage(`ERROR: Los siguientes artículos no están disponibles (IDs: ${articulosInvalidos}).\n\nPor favor, ELIMINE estos detalles de la tabla y seleccione artículos válidos del catálogo de productos (columna derecha).`, 'error');
      return;
    }

    if (formValue.detalles.length === 0) {
      alert('Debe agregar al menos un artículo a la compra');
      return;
    }

    // Establecer fecha y hora actual automáticamente antes de guardar
    const fechaHoraActual = new Date();
    const fechaHoraFormateada = fechaHoraActual.toISOString().slice(0, 19).replace('T', ' ');
    this.form.patchValue({ fecha_hora: fechaHoraActual.toISOString().slice(0, 16) });

    // Formatear fecha_hora correctamente para Laravel (formato Y-m-d H:i:s)
    let fechaHora = fechaHoraFormateada;

    // Reutilizar la variable tipoCompraValidacion que ya se declaró arriba
    // const tipoCompra = (formValue.tipo_compra || 'contado').toLowerCase().trim();

    const compraData: any = {
      proveedor_nombre: this.proveedorBusqueda.trim(),
      user_id: Number(formValue.user_id),
      almacen_id: Number(formValue.almacen_id),
      caja_id: this.cajaAbierta.id, // Usar la caja abierta
      fecha_hora: fechaHora,
      // El backend calculará el total basándose en los detalles y descuento_global
      tipo_compra: tipoCompraValidacion, // Reutilizar la variable ya validada
      // Siempre enviar campos de comprobante (el backend asignará valores por defecto si están vacíos)
      tipo_comprobante: formValue.tipo_comprobante?.trim() || 'RECIBO',
      serie_comprobante: formValue.serie_comprobante?.trim() || null,
      num_comprobante: formValue.num_comprobante?.trim() || '',
      // Enviar solo los datos básicos, el backend calculará subtotales y totales
      detalles: formValue.detalles.map((detalle: any) => {
        const articuloId = Number(detalle.articulo_id);
        const cantidad = Number(detalle.cantidad) || 1;
        const precioUnitario = Number(detalle.precio_unitario) || 0;

        return {
          articulo_id: articuloId,
          cantidad: cantidad,
          precio_unitario: precioUnitario,
          descuento: Number(detalle.descuento || 0)
          // No enviar subtotal, el backend lo calculará
        };
      })
    };

    // Si hay un proveedor seleccionado, enviar también el ID
    if (this.proveedorSeleccionado && this.form.get('proveedor_id')?.value) {
      compraData.proveedor_id = Number(this.form.get('proveedor_id')?.value);
    }

    // Agregar descuento global (siempre enviar, incluso si es 0)
    compraData.descuento_global = Number(formValue.descuento_global || 0);

    // Agregar campos de crédito si es compra a crédito
    if (tipoCompraValidacion === 'credito') {
      const numeroCuotas = Number(formValue.numero_cuotas || 1);
      const montoPagado = Number(formValue.monto_pagado || 0);


      // Validar que numero_cuotas sea válido
      if (!numeroCuotas || numeroCuotas < 1) {
        this.showAlertMessage('Error: El número de cuotas debe ser mayor a 0. Por favor, configure el crédito correctamente.', 'error');
        return;
      }

      compraData.numero_cuotas = numeroCuotas;
      compraData.monto_pagado = montoPagado;
    }

    if (formValue.estado && formValue.estado.trim() !== '') {
      compraData.estado = formValue.estado.trim();
    }


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

            // Mostrar el mensaje de error específico del backend
            this.showAlertMessage(errorMessage, 'error');
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
            const errorResponse = error?.error || {};
            let errorMessage = errorResponse.message || errorResponse.error || 'Error al crear la compra';

            // Mostrar el mensaje de error específico del backend
            this.showAlertMessage(errorMessage, 'error');
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
            this.showAlertMessage('Error al eliminar la compra', 'error');
          }
        });
    }
  }

  // Métodos para calcular totales en el modal de detalle
  getTotalParcial(): number {
    if (!this.compraSeleccionada?.detalles) return 0;
    return this.compraSeleccionada.detalles.reduce((sum, d) => {
      const precioUnitario = parseFloat(String(d.precio_unitario || 0));
      const cantidad = parseFloat(String(d.cantidad || 0));
      const descuento = parseFloat(String(d.descuento || 0));
      return sum + ((precioUnitario * cantidad) - descuento);
    }, 0);
  }

  getTotalNetoSinDescuento(): number {
    if (!this.compraSeleccionada) return 0;
    const total = parseFloat(String(this.compraSeleccionada.total || 0));
    const descuentoGlobal = parseFloat(String(this.compraSeleccionada.descuento_global || 0));
    return total + descuentoGlobal;
  }

  getPorcentajeDescuento(): number {
    if (!this.compraSeleccionada?.descuento_global) return 0;
    const descuentoGlobal = parseFloat(String(this.compraSeleccionada.descuento_global || 0));
    const totalNeto = this.getTotalNetoSinDescuento();
    if (totalNeto === 0) return 0;
    return (descuentoGlobal / totalNeto) * 100;
  }

  getDescuentoGlobal(): number {
    if (!this.compraSeleccionada) return 0;
    return parseFloat(String(this.compraSeleccionada.descuento_global || 0));
  }

  getTotalCompra(): number {
    if (!this.compraSeleccionada) return 0;
    return parseFloat(String(this.compraSeleccionada.total || 0));
  }

  getDescuentoValue(compra: Compra): number {
    if (!compra) return 0;
    const descuento = compra.descuento_global;
    if (descuento === null || descuento === undefined) return 0;
    const descuentoNum = typeof descuento === 'string' ? parseFloat(descuento) : descuento;
    return isNaN(descuentoNum) ? 0 : descuentoNum;
  }

  downloadReportForCompra(compra: Compra): void {
    // Cargar la compra completa antes de generar el reporte
    this.compraService.getById(compra.id)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.compraSeleccionada = response.data;
            this.downloadReport();
          } else if (response.data) {
            this.compraSeleccionada = response.data as Compra;
            this.downloadReport();
          } else {
            // Fallback: usar la compra que ya tenemos
            this.compraSeleccionada = compra;
            this.downloadReport();
          }
        },
        error: (error) => {
          console.error('Error al cargar compra para reporte:', error);
          // Fallback: usar la compra que ya tenemos
          this.compraSeleccionada = compra;
          this.downloadReport();
        }
      });
  }

  downloadReport(): void {
    if (!this.compraSeleccionada) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    const margin = 15;
    const lineHeight = 7;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE COMPRA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Información del proveedor y tipo de comprobante
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Proveedor: ${this.compraSeleccionada.proveedor?.nombre || 'N/A'}`, margin, yPos);
    doc.text(`Tipo Comprobante: ${this.compraSeleccionada.tipo_comprobante || 'N/A'}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += lineHeight;

    // N° Factura y NIT
    doc.text(`N° Factura: ${this.compraSeleccionada.num_comprobante || this.compraSeleccionada.id || 'N/A'}`, margin, yPos);
    doc.text(`NIT/Comprobante: ${this.compraSeleccionada.proveedor?.num_documento || this.compraSeleccionada.serie_comprobante || 'N/A'}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += lineHeight;

    // Fecha
    const fecha = this.compraSeleccionada.fecha_hora ? new Date(this.compraSeleccionada.fecha_hora).toLocaleString('es-ES') : 'N/A';
    doc.text(`Fecha: ${fecha}`, margin, yPos);
    yPos += lineHeight * 2;

    // Resumen
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN', margin, yPos);
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');

    const descuentoGlobal = this.getDescuentoGlobal();
    const totalNeto = this.getTotalNetoSinDescuento();
    const porcentajeDescuento = this.getPorcentajeDescuento();

    doc.text(`Descuento Global: ${porcentajeDescuento.toFixed(2)}%`, margin, yPos);
    doc.text(`Total Original: Q${totalNeto.toFixed(2)}`, pageWidth / 2, yPos, { align: 'center' });
    doc.text(`Total Final: Q${this.getTotalCompra().toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += lineHeight * 2;

    // Tabla de artículos
    if (this.compraSeleccionada.detalles && this.compraSeleccionada.detalles.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE ARTÍCULOS', margin, yPos);
      yPos += lineHeight;

      // Encabezados de tabla
      const tableTop = yPos;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Artículo', margin, yPos);
      doc.text('Precio Unit.', margin + 60, yPos);
      doc.text('Cant.', margin + 85, yPos);
      doc.text('Descuento', margin + 100, yPos);
      doc.text('Subtotal', pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 2;

      // Detalles
      doc.setFont('helvetica', 'normal');
      this.compraSeleccionada.detalles.forEach((detalle) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 20;
        }

        const nombre = detalle.articulo?.nombre || 'N/A';
        const precioUnit = parseFloat(String(detalle.precio_unitario || 0)).toFixed(2);
        const cantidad = detalle.cantidad || 0;
        const descuento = parseFloat(String(detalle.descuento || 0)).toFixed(2);
        const subtotal = parseFloat(String(detalle.subtotal || 0)).toFixed(2);

        // Truncar nombre si es muy largo
        const nombreTruncado = doc.splitTextToSize(nombre, 50);
        doc.text(nombreTruncado, margin, yPos);
        doc.text(`Q${precioUnit}`, margin + 60, yPos);
        doc.text(String(cantidad), margin + 85, yPos);
        doc.text(`Q${descuento}`, margin + 100, yPos);
        doc.text(`Q${subtotal}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += lineHeight * nombreTruncado.length;
      });

      yPos += lineHeight;

      // Totales
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Total Parcial:', margin + 100, yPos);
      doc.text(`Q${this.getTotalParcial().toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight;

      doc.text('Total Neto (Sin Descuento):', margin + 100, yPos);
      doc.text(`Q${totalNeto.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight;

      doc.setFont('helvetica', 'normal');
      doc.text(`Descuento Global: ${porcentajeDescuento.toFixed(2)}% - Q${descuentoGlobal.toFixed(2)}`, margin + 100, yPos);
      yPos += lineHeight;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Total Final (Con Descuento):', margin + 100, yPos);
      doc.text(`Q${this.getTotalCompra().toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight * 2;
    }

    // Información de crédito si aplica
    if (!this.isContado(this.compraSeleccionada.tipo_compra) && this.compraSeleccionada.compra_credito) {
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('INFORMACIÓN DE CRÉDITO', margin, yPos);
      yPos += lineHeight;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Número de Cuotas: ${this.compraSeleccionada.compra_credito.num_cuotas}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Cuota Inicial: Q${parseFloat(String(this.compraSeleccionada.compra_credito.cuota_inicial || 0)).toFixed(2)}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Saldo Pendiente: Q${((this.getTotalCompra() - parseFloat(String(this.compraSeleccionada.compra_credito.cuota_inicial || 0)))).toFixed(2)}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`Estado: ${this.compraSeleccionada.compra_credito.estado_credito || 'Pendiente'}`, margin, yPos);
    }

    // Pie de página
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Descargar el PDF
    const fileName = `Compra_${this.compraSeleccionada.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  getArticuloNombre(articuloId: number): string {
    const articulo = this.articulos.find(a => a.id === articuloId);
    return articulo ? articulo.nombre : 'N/A';
  }

  getArticuloCompleto(articuloId: number): Articulo | null {
    return this.articulos.find(a => a.id === articuloId) || null;
  }

  getCategoriaArticulo(articuloId: number): string {
    const articulo = this.getArticuloCompleto(articuloId);
    return articulo?.categoria?.nombre || 'N/A';
  }

  getMarcaArticulo(articuloId: number): string {
    const articulo = this.getArticuloCompleto(articuloId);
    return articulo?.marca?.nombre || 'N/A';
  }

  getMedidaArticulo(articuloId: number): string {
    const articulo = this.getArticuloCompleto(articuloId);
    return articulo?.medida?.nombre_medida || 'N/A';
  }

  buscarProveedor(event: any): void {
    const valor = event.target.value.toLowerCase();
    this.proveedorBusqueda = event.target.value;

    this.form.patchValue({ proveedor_nombre: event.target.value });

    if (valor.length === 0) {
      // Si no hay texto, mostrar todos los proveedores
      this.proveedoresFiltrados = this.proveedores;
      this.mostrarSugerenciasProveedor = this.proveedores.length > 0;
      this.proveedorSeleccionado = null;
      this.form.patchValue({ proveedor_id: '' });
    } else {
      // Filtrar proveedores según el texto ingresado
      this.proveedoresFiltrados = this.proveedores.filter(proveedor =>
        proveedor.nombre.toLowerCase().includes(valor) ||
        (proveedor.num_documento && proveedor.num_documento.toLowerCase().includes(valor))
      );
      this.mostrarSugerenciasProveedor = this.proveedoresFiltrados.length > 0;

      // Buscar coincidencia exacta
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
    // Mostrar todos los proveedores cuando se hace focus
    if (this.proveedorBusqueda.length === 0) {
      this.proveedoresFiltrados = this.proveedores;
    }
    this.mostrarSugerenciasProveedor = this.proveedoresFiltrados.length > 0;
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
    // Agregar automáticamente a la compra
    this.agregarArticuloACompra();
  }

  agregarArticuloACompra(): void {
    if (!this.articuloSeleccionado) {
      this.showAlertMessage('Por favor seleccione un producto del catálogo', 'warning');
      return;
    }

    // Buscar si el artículo ya está agregado
    const detalleExistenteIndex = this.detallesFormArray.controls.findIndex(control =>
      control.get('articulo_id')?.value === this.articuloSeleccionado?.id
    );

    if (detalleExistenteIndex !== -1) {
      // Si el artículo ya existe, incrementar la cantidad en 1
      const detalleExistente = this.detallesFormArray.at(detalleExistenteIndex);
      const cantidadActual = detalleExistente.get('cantidad')?.value || 0;
      detalleExistente.patchValue({
        cantidad: cantidadActual + 1
      });
      // El calculateSubtotal se ejecutará automáticamente por el valueChanges
      this.calculateTotal();
    } else {
      // Si el artículo no existe, agregarlo como nuevo detalle
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
    }

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

  // Métodos para selección múltiple con checkboxes
  toggleSeleccionArticulo(articuloId: number): void {
    if (this.articulosSeleccionados.has(articuloId)) {
      this.articulosSeleccionados.delete(articuloId);
    } else {
      this.articulosSeleccionados.add(articuloId);
    }
    this.actualizarSeleccionarTodo();
  }

  estaSeleccionado(articuloId: number): boolean {
    return this.articulosSeleccionados.has(articuloId);
  }

  toggleSeleccionarTodo(): void {
    this.seleccionarTodo = !this.seleccionarTodo;
    const articulosVisibles = this.articulosFiltrados.length > 0 ? this.articulosFiltrados : this.articulos;
    const articulosLimitados = articulosVisibles.slice(0, 50);

    if (this.seleccionarTodo) {
      articulosLimitados.forEach(articulo => {
        if (articulo.id) {
          this.articulosSeleccionados.add(articulo.id);
        }
      });
    } else {
      articulosLimitados.forEach(articulo => {
        if (articulo.id) {
          this.articulosSeleccionados.delete(articulo.id);
        }
      });
    }
  }

  actualizarSeleccionarTodo(): void {
    const articulosVisibles = this.articulosFiltrados.length > 0 ? this.articulosFiltrados : this.articulos;
    const articulosLimitados = articulosVisibles.slice(0, 50);
    this.seleccionarTodo = articulosLimitados.length > 0 && 
      articulosLimitados.every(articulo => articulo.id && this.articulosSeleccionados.has(articulo.id));
  }

  agregarArticulosSeleccionados(): void {
    if (this.articulosSeleccionados.size === 0) {
      this.showAlertMessage('Por favor seleccione al menos un producto', 'warning');
      return;
    }

    let agregados = 0;
    let yaExistentes = 0;

    this.articulosSeleccionados.forEach(articuloId => {
      const articulo = this.articulos.find(a => a.id === articuloId);
      if (!articulo) return;

      // Buscar si el artículo ya está agregado
      const detalleExistenteIndex = this.detallesFormArray.controls.findIndex(control =>
        control.get('articulo_id')?.value === articuloId
      );

      if (detalleExistenteIndex !== -1) {
        // Si el artículo ya existe, incrementar la cantidad en 1
        const detalleExistente = this.detallesFormArray.at(detalleExistenteIndex);
        const cantidadActual = detalleExistente.get('cantidad')?.value || 0;
        detalleExistente.patchValue({
          cantidad: cantidadActual + 1
        });
        this.calculateTotal();
        yaExistentes++;
      } else {
        // Si el artículo no existe, agregarlo como nuevo detalle
        const precioInicial = articulo.precio_costo_unid || articulo.precio_costo_paq || 0;
        const detalleGroup = this.fb.group({
          articulo_id: [articulo.id, Validators.required],
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
        agregados++;
      }
    });

    // Limpiar selección
    this.articulosSeleccionados.clear();
    this.seleccionarTodo = false;

    // Mostrar mensaje de éxito
    let mensaje = '';
    if (agregados > 0 && yaExistentes > 0) {
      mensaje = `${agregados} producto(s) agregado(s) y ${yaExistentes} producto(s) actualizado(s)`;
    } else if (agregados > 0) {
      mensaje = `${agregados} producto(s) agregado(s) exitosamente`;
    } else if (yaExistentes > 0) {
      mensaje = `${yaExistentes} producto(s) actualizado(s) (cantidad incrementada)`;
    }
    
    if (mensaje) {
      this.showAlertMessage(mensaje, 'success');
    }
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

  // Métodos para manejar el dropdown de almacenes
  seleccionarAlmacenPorDefecto(): void {
    console.log('Seleccionando almacen por defecto');
    console.log('Form almacen_id:', this.form.get('almacen_id')?.value);
    console.log('isAdmin:', this.isAdmin);
    console.log('currentUserSucursalId:', this.currentUserSucursalId);
    console.log('Almacenes disponibles:', this.almacenes);
    
    if (this.form.get('almacen_id')?.value) {
      console.log('Ya hay un almacen seleccionado, no se selecciona por defecto');
      // Asegurarnos de que se carguen las cajas incluso si ya hay un almacén seleccionado
      this.cargarCajasYBuscarCajaAbierta();
      return;
    }

    // Si es admin, puede seleccionar cualquier almacén
    // Si no es admin, solo almacenes de su sucursal
    if (!this.isAdmin && this.currentUserSucursalId) {
      console.log('Usuario no admin, buscando almacen de sucursal:', this.currentUserSucursalId);
      const almacenPorDefecto = this.almacenes.find(almacen =>
        almacen.sucursal_id === this.currentUserSucursalId && almacen.estado !== false
      );
      
      console.log('Almacen por defecto encontrado:', almacenPorDefecto);

      if (almacenPorDefecto) {
        this.form.patchValue({ almacen_id: almacenPorDefecto.id });
        console.log('Almacen seleccionado:', almacenPorDefecto.id);
        // Cargar cajas después de seleccionar el almacén
        this.cargarCajasYBuscarCajaAbierta();
        return;
      } else {
        console.log('No se encontró almacen por defecto para la sucursal:', this.currentUserSucursalId);
        console.log('Todos los almacenes:', this.almacenes.map(a => ({id: a.id, nombre: a.nombre_almacen, sucursal_id: a.sucursal_id, estado: a.estado})));
      }
    } else {
      console.log('Usuario admin, buscando primer almacen activo');
      // Para admin, seleccionar el primer almacén activo disponible
      const primerAlmacen = this.almacenes.find(almacen => almacen.estado !== false);
      console.log('Primer almacen encontrado:', primerAlmacen);
      if (primerAlmacen) {
        this.form.patchValue({ almacen_id: primerAlmacen.id });
        console.log('Almacen seleccionado:', primerAlmacen.id);
        // Cargar cajas después de seleccionar el almacén
        this.cargarCajasYBuscarCajaAbierta();
        return;
      } else {
        console.log('No se encontró ningún almacen activo');
        console.log('Todos los almacenes:', this.almacenes.map(a => ({id: a.id, nombre: a.nombre_almacen, sucursal_id: a.sucursal_id, estado: a.estado})));
      }
    }
    
    // Si no se pudo seleccionar un almacén, cargar cajas de todos modos
    this.cargarCajasYBuscarCajaAbierta();
  }

  toggleMenuAlmacenes(): void {
    this.mostrarMenuAlmacenes = !this.mostrarMenuAlmacenes;
  }

  @HostListener('document:click', ['$event'])
  cerrarMenus(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.mostrarMenuAlmacenes && !target.closest('.menu-almacenes')) {
      this.mostrarMenuAlmacenes = false;
    }
  }

  cambiarAlmacen(almacenId: number): void {
    console.log('Cambiando almacén:', almacenId);
    console.log('isAdmin:', this.isAdmin);
    console.log('currentUserSucursalId:', this.currentUserSucursalId);
    
    // Si no es admin, validar que el almacén pertenezca a su sucursal
    if (!this.isAdmin && this.currentUserSucursalId) {
      const almacen = this.almacenes.find(a => a.id === almacenId);
      console.log('Almacen a cambiar:', almacen);
      if (!almacen || almacen.sucursal_id !== this.currentUserSucursalId) {
        this.showAlertMessage('No puede seleccionar un almacén de otra sucursal', 'error');
        return;
      }
    }
    
    this.form.patchValue({ almacen_id: almacenId });
    this.mostrarMenuAlmacenes = false;
    
    // Actualizar la caja abierta según la sucursal del almacén seleccionado
    this.actualizarCajaPorAlmacen(almacenId);
  }

  getAlmacenSeleccionadoNombre(): string {
    const almacenId = this.form.get('almacen_id')?.value;
    if (!almacenId) return '';
    const almacen = this.almacenes.find(a => a.id === almacenId);
    return almacen?.nombre_almacen || '';
  }

  cargarCajasYBuscarCajaAbierta(): void {
    console.log('Cargando cajas y buscando caja abierta');
    console.log('Almacenes disponibles:', this.almacenes);
    console.log('Form almacen_id:', this.form.get('almacen_id')?.value);
    
    this.cajaService.getAll().subscribe({
      next: (res) => {
        this.cajas = Array.isArray(res.data) ? res.data : [];
        
        // Log para debug
        console.log('Cajas cargadas:', this.cajas);
        
        // Buscar la caja abierta de la sucursal del almacén seleccionado
        const almacenId = this.form.get('almacen_id')?.value;
        let sucursalId = null;
        
        // Obtener la sucursal del almacén seleccionado
        if (almacenId) {
          const almacen = this.almacenes.find(a => a.id === almacenId);
          sucursalId = almacen?.sucursal_id || null;
          console.log('Almacen encontrado:', almacen);
          console.log('Sucursal ID:', sucursalId);
        } else {
          console.log('No hay almacen seleccionado');
        }
        
        // Buscar la caja abierta de la sucursal correcta
        this.cajaAbierta = this.cajas.find(caja =>
          (caja.estado === 1 ||
          caja.estado === '1' ||
          caja.estado === true ||
          caja.estado === 'abierta') &&
          (sucursalId ? caja.sucursal_id === sucursalId : true)
        ) || null;
        
        console.log('Caja abierta encontrada:', this.cajaAbierta);
        
        // Log detallado de todas las cajas
        if (this.cajas.length > 0) {
          console.log('Todas las cajas:', this.cajas.map(c => ({
            id: c.id,
            sucursal_id: c.sucursal_id,
            estado: c.estado,
            saldo_caja: c.saldo_caja,
            saldo_inicial: c.saldo_inicial
          })));
        }

        if (!this.cajaAbierta) {
          this.showAlertMessage('No hay una caja abierta para la sucursal seleccionada. Por favor, abra una caja antes de realizar compras.', 'error');
        }
      },
      error: (error) => {
        console.error('Error al cargar las cajas:', error);
        this.cajas = [];
        this.cajaAbierta = null;
        this.showAlertMessage('Error al cargar las cajas. No se puede realizar compras.', 'error');
      }
    });
  }

  actualizarCajaPorAlmacen(almacenId: number): void {
    console.log('Actualizando caja por almacén:', almacenId);
    console.log('Almacenes disponibles:', this.almacenes);
    console.log('Cajas disponibles:', this.cajas);
    
    // Obtener la sucursal del almacén seleccionado
    const almacen = this.almacenes.find(a => a.id === almacenId);
    const sucursalId = almacen?.sucursal_id || null;
    
    console.log('Almacen encontrado:', almacen);
    console.log('Sucursal ID:', sucursalId);
    
    // Si no hay cajas cargadas, cargarlas primero
    if (!this.cajas || this.cajas.length === 0) {
      console.log('No hay cajas cargadas, cargando cajas...');
      this.cargarCajasYBuscarCajaAbierta();
      return;
    }
    
    // Buscar la caja abierta de la sucursal correcta
    this.cajaAbierta = this.cajas.find(caja =>
      (caja.estado === 1 ||
      caja.estado === '1' ||
      caja.estado === true ||
      caja.estado === 'abierta') &&
      (sucursalId ? caja.sucursal_id === sucursalId : true)
    ) || null;
    
    console.log('Caja abierta encontrada:', this.cajaAbierta);
    
    // Log detallado de todas las cajas
    if (this.cajas.length > 0) {
      console.log('Todas las cajas:', this.cajas.map(c => ({
        id: c.id,
        sucursal_id: c.sucursal_id,
        estado: c.estado,
        saldo_caja: c.saldo_caja,
        saldo_inicial: c.saldo_inicial
      })));
    }
    
    if (!this.cajaAbierta) {
      this.showAlertMessage('No hay una caja abierta para la sucursal seleccionada. Por favor, abra una caja antes de realizar compras.', 'error');
    }
  }

  openEditPrecioModal(index: number): void {
    const detalle = this.detallesFormArray.at(index);
    if (!detalle) return;

    const articuloId = detalle.get('articulo_id')?.value;
    const articulo = this.articulos.find(a => a.id === articuloId);

    if (!articulo) {
      this.showAlertMessage('No se encontró el artículo', 'error');
      return;
    }

    this.articuloEditando = { ...articulo };
    this.detalleIndexEditando = index;

    const precioCosto = articulo.precio_costo_unid || 0;
    const precioVenta = articulo.precio_venta || 0;

    // Calcular porcentaje de ganancia actual si hay precio de venta
    let porcentajeGanancia = 30; // Por defecto 30%
    if (precioCosto > 0 && precioVenta > 0) {
      porcentajeGanancia = ((precioVenta - precioCosto) / precioCosto) * 100;
    }

    this.precioEditForm.patchValue({
      precio_costo_unid: precioCosto,
      precio_costo_paq: articulo.precio_costo_paq || 0,
      porcentaje_ganancia: Math.round(porcentajeGanancia * 100) / 100,
      precio_venta: precioVenta,
      precio_uno: articulo.precio_uno || 0,
      precio_dos: articulo.precio_dos || 0,
      precio_tres: articulo.precio_tres || 0,
      precio_cuatro: articulo.precio_cuatro || 0
    }, { emitEvent: false });

    // Calcular precio de venta inicial
    this.calculatePrecioVenta();

    this.isEditPrecioModalOpen = true;
  }

  calculatePrecioVenta(): void {
    const precioCosto = parseFloat(this.precioEditForm.get('precio_costo_unid')?.value) || 0;
    const porcentajeGanancia = parseFloat(this.precioEditForm.get('porcentaje_ganancia')?.value) || 0;

    if (precioCosto > 0 && porcentajeGanancia >= 0) {
      const precioVenta = precioCosto * (1 + (porcentajeGanancia / 100));
      this.precioEditForm.patchValue({
        precio_venta: Math.round(precioVenta * 100) / 100
      }, { emitEvent: false });
    } else {
      this.precioEditForm.patchValue({
        precio_venta: 0
      }, { emitEvent: false });
    }
  }

  closeEditPrecioModal(): void {
    this.isEditPrecioModalOpen = false;
    this.articuloEditando = null;
    this.detalleIndexEditando = null;
    this.precioEditForm.reset();
  }

  savePrecioEdit(): void {
    if (!this.articuloEditando || this.detalleIndexEditando === null) return;

    if (this.precioEditForm.invalid) {
      this.showAlertMessage('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    const formValue = this.precioEditForm.value;

    // Actualizar el artículo en el catálogo
    const articuloIndex = this.articulos.findIndex(a => a.id === this.articuloEditando!.id);
    if (articuloIndex !== -1) {
      this.articulos[articuloIndex] = {
        ...this.articulos[articuloIndex],
        precio_costo_unid: parseFloat(formValue.precio_costo_unid) || 0,
        precio_costo_paq: parseFloat(formValue.precio_costo_paq) || 0,
        precio_venta: parseFloat(formValue.precio_venta) || 0,
        precio_uno: parseFloat(formValue.precio_uno) || 0,
        precio_dos: parseFloat(formValue.precio_dos) || 0,
        precio_tres: parseFloat(formValue.precio_tres) || 0,
        precio_cuatro: parseFloat(formValue.precio_cuatro) || 0
      };
    }

    // Actualizar el precio en el detalle de la compra
    const detalle = this.detallesFormArray.at(this.detalleIndexEditando);
    if (detalle && detalle instanceof FormGroup) {
      const nuevoPrecio = parseFloat(formValue.precio_costo_unid) || 0;
      detalle.patchValue({
        precio_unitario: nuevoPrecio
      });
      this.calculateSubtotal(detalle);
    }

    // Guardar en el backend - Enviar todos los campos del artículo actualizados
    this.isLoading = true;

    // Preparar datos con todos los campos del artículo, actualizando solo los precios
    const articuloData: any = {
      categoria_id: this.articuloEditando.categoria_id,
      proveedor_id: this.articuloEditando.proveedor_id,
      medida_id: this.articuloEditando.medida_id,
      marca_id: this.articuloEditando.marca_id,
      industria_id: this.articuloEditando.industria_id,
      codigo: this.articuloEditando.codigo,
      nombre: this.articuloEditando.nombre,
      unidad_envase: this.articuloEditando.unidad_envase || 1,
      precio_costo_unid: parseFloat(formValue.precio_costo_unid) || 0,
      precio_costo_paq: parseFloat(formValue.precio_costo_paq) || 0,
      precio_venta: parseFloat(formValue.precio_venta) || 0,
      precio_uno: parseFloat(formValue.precio_uno) || 0,
      precio_dos: parseFloat(formValue.precio_dos) || 0,
      precio_tres: parseFloat(formValue.precio_tres) || 0,
      precio_cuatro: parseFloat(formValue.precio_cuatro) || 0,
      stock: this.articuloEditando.stock || 0,
      descripcion: this.articuloEditando.descripcion || null,
      costo_compra: this.articuloEditando.costo_compra || parseFloat(formValue.precio_costo_unid) || 0,
      vencimiento: this.articuloEditando.vencimiento || null,
      estado: this.articuloEditando.estado !== undefined ? this.articuloEditando.estado : true
    };

    this.articuloService.update(this.articuloEditando.id, articuloData)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.closeEditPrecioModal();
        },
        error: (error) => {
          console.error('Error al actualizar precio del artículo', error);
          console.error('Datos enviados:', articuloData);
          const errorMessage = error?.error?.message || error?.error?.error || 'Error al actualizar el precio del artículo';
          this.showAlertMessage(errorMessage, 'error');
        }
      });
  }

  showAlertMessage(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  closeAlert(): void {
    this.showAlert = false;
  }
}
