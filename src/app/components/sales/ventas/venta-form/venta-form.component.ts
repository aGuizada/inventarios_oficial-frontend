import { Component, OnInit, OnDestroy, HostListener, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { VentaService, ProductoInventario } from '../../../../services/venta.service';
import { ClienteService } from '../../../../services/cliente.service';
import { AlmacenService } from '../../../../services/almacen.service';
import { CajaService } from '../../../../services/caja.service';
import { TipoVentaService } from '../../../../services/tipo-venta.service';
import { TipoPagoService } from '../../../../services/tipo-pago.service';
import { CategoriaService } from '../../../../services/categoria.service';
import { AuthService } from '../../../../services/auth.service';
import { Cliente, Almacen, Caja, TipoVenta, TipoPago, Categoria, Sucursal, PaginationParams } from '../../../../interfaces';
import { SucursalService } from '../../../../services/sucursal.service';
import { ChangeDetectorRef } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import Swal from 'sweetalert2';

// Import child components
import { ProductListComponent } from './components/product-list/product-list.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { CreditoModalComponent } from './components/credito-modal/credito-modal.component';

import { SoundService } from '../../../../services/sound.service';

@Component({
    selector: 'app-venta-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgClass,
        ProductListComponent,
        ShoppingCartComponent,
        CreditoModalComponent
    ],
    templateUrl: './venta-form.component.html',
})
export class VentaFormComponent implements OnInit, OnDestroy {
    @Output() saleCompleted = new EventEmitter<void>();

    form: FormGroup;
    detallesFormArray: FormArray;

    clientes: Cliente[] = [];
    almacenes: Almacen[] = [];
    almacenesFiltrados: Almacen[] = [];
    sucursales: Sucursal[] = [];
    productosInventario: ProductoInventario[] = [];
    categorias: Categoria[] = [];
    cajas: Caja[] = [];
    tiposVenta: TipoVenta[] = [];
    tiposPago: TipoPago[] = [];

    cajaSeleccionada: Caja | null = null;
    esVentaCredito = false;
    isModalCreditoOpen = false;
    isLoading = false;
    isLoadingProductos = false; // Indicador de carga específico para productos
    mostrarMenuAlmacenes = false;
    cartDependenciesLoaded = false; // Flag para carga diferida de dependencias del carrito

    // Paginación de productos
    currentPage = 1;
    lastPage = 1;
    perPage = 24;
    totalProducts = 0;
    isLoadingMore = false;
    busquedaActual = '';
    categoriaActual: number | null = null;

    // Caché de productos por almacén para evitar recargas innecesarias
    productosCache: Map<number, ProductoInventario[]> = new Map();

    // Intervalo para actualizar stock en tiempo real
    // private stockUpdateInterval: any;

    currentUserId = 1;
    currentUserSucursalId: number | null = null;
    defaultCliente: Cliente | null = null;
    isAdmin: boolean = false;
    selectedSucursalId: number | null = null;

    // Para alertas visuales
    alertMessage: string = '';
    showAlert: boolean = false;
    alertType: 'error' | 'success' | 'warning' | 'info' = 'error';

    // Estado del carrito móvil
    isMobileCartOpen = false;

    checkScreenSize() {
        if (window.innerWidth >= 1024) {
            this.isMobileCartOpen = false;
        }
    }

    toggleMobileCart() {
        this.isMobileCartOpen = !this.isMobileCartOpen;
    }


    constructor(
        private fb: FormBuilder,
        private ventaService: VentaService,
        private clienteService: ClienteService,
        private almacenService: AlmacenService,
        private cajaService: CajaService,
        private tipoVentaService: TipoVentaService,
        private tipoPagoService: TipoPagoService,
        private categoriaService: CategoriaService,
        private authService: AuthService,
        private sucursalService: SucursalService,
        private cdr: ChangeDetectorRef,
        private soundService: SoundService,
        private router: Router
    ) {
        this.detallesFormArray = this.fb.array([]);
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
            pagos: this.fb.array([]),
            numero_cuotas: [0, [Validators.min(1)]],
            tiempo_dias_cuota: [30, [Validators.min(1)]]
        });

        this.setupTipoVentaListener();
    }

    ngOnInit(): void {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
            this.currentUserId = currentUser.id;
            this.currentUserSucursalId = currentUser.sucursal_id || null;
            this.isAdmin = currentUser.rol_id === 1;
            this.form.patchValue({ user_id: this.currentUserId });
            // Establecer la sucursal por defecto si el usuario tiene una asignada
            if (this.currentUserSucursalId) {
                this.selectedSucursalId = this.currentUserSucursalId;
            }
        }

        // Cargar datos iniciales necesarios para mostrar la pantalla
        this.loadInitialData();
        this.actualizarFechaHora();
    }

    ngOnDestroy(): void {
        // Limpiar el intervalo cuando se destruye el componente
        // if (this.stockUpdateInterval) {
        //     clearInterval(this.stockUpdateInterval);
        // }
    }

    /*
    startStockUpdateInterval(): void {
        // Actualizar el stock cada 10 segundos, forzando la recarga
        this.stockUpdateInterval = setInterval(() => {
            const almacenId = this.form.get('almacen_id')?.value;
            if (almacenId) {
                // Limpiar caché y forzar recarga para obtener datos actualizados
                this.ventaService.clearProductosCache(almacenId);
                this.loadProductosInventario(almacenId, true);
            }
        }, 10000); // 10 segundos
    }
    */



    filtrarAlmacenes(): void {
        // Si el usuario tiene una sucursal asignada, filtrar por esa primero
        if (this.currentUserSucursalId) {
            this.almacenesFiltrados = this.almacenes.filter(a => a.sucursal_id === this.currentUserSucursalId);
            // Asegurar que selectedSucursalId también esté establecido para que el HTML lo muestre
            this.selectedSucursalId = this.currentUserSucursalId;
        }
        // Si el admin seleccionó manualmente una sucursal diferente (y no tiene sucursal asignada)
        else if (this.selectedSucursalId) {
            this.almacenesFiltrados = this.almacenes.filter(a => a.sucursal_id == this.selectedSucursalId);
        }
        // Si es admin sin sucursal asignada ni seleccionada, mostrar todos
        else {
            this.almacenesFiltrados = [...this.almacenes];
        }
    }

    onSucursalChange(): void {
        // Filtrar almacenes según la sucursal seleccionada
        this.filtrarAlmacenes();

        // Seleccionar almacén por defecto de la sucursal seleccionada
        this.seleccionarAlmacenPorDefecto();
    }

    get detalles() {
        return this.form.get('detalles') as FormArray;
    }

    get pagos() {
        return this.form.get('pagos') as FormArray;
    }

    actualizarFechaHora(): void {
        const fechaHoraActual = new Date().toISOString().slice(0, 16);
        this.form.patchValue({ fecha_hora: fechaHoraActual });
    }

    setupTipoVentaListener(): void {
        this.form.get('tipo_venta_id')?.valueChanges.subscribe(tipoVentaId => {
            if (tipoVentaId) {
                const idNumero = typeof tipoVentaId === 'string' ? parseInt(tipoVentaId, 10) : tipoVentaId;
                const tipoVenta = this.tiposVenta.find(tv => tv.id === idNumero || tv.id === tipoVentaId);

                if (tipoVenta) {
                    const nombreTipoVenta = (tipoVenta.nombre_tipo_ventas || tipoVenta.nombre || '').toLowerCase().trim();

                    const esCredito = nombreTipoVenta.includes('crédito') ||
                        nombreTipoVenta.includes('credito') ||
                        nombreTipoVenta.includes('cred') ||
                        nombreTipoVenta === 'a crédito' ||
                        nombreTipoVenta === 'a credito';

                    if (this.esVentaCredito && !esCredito) {
                        this.form.get('numero_cuotas')?.clearValidators();
                        this.form.get('tiempo_dias_cuota')?.clearValidators();
                        this.form.get('numero_cuotas')?.setValue(null);
                        this.form.get('tiempo_dias_cuota')?.setValue(null);
                        this.form.get('numero_cuotas')?.updateValueAndValidity();
                        this.form.get('tiempo_dias_cuota')?.updateValueAndValidity();
                        this.isModalCreditoOpen = false;
                    }

                    this.esVentaCredito = esCredito;

                    if (esCredito) {
                        setTimeout(() => {
                            this.abrirModalCredito();
                        }, 200);
                    } else {
                        this.isModalCreditoOpen = false;
                    }
                } else {
                    this.esVentaCredito = false;
                    this.isModalCreditoOpen = false;
                }
            } else {
                this.esVentaCredito = false;
                this.isModalCreditoOpen = false;
            }
        });
    }

    loadInitialData(): void {
        this.isLoading = true;

        const requests: any = {
            categorias: this.categoriaService.getAll().pipe(
                map((response: any) => Array.isArray(response) ? response : (response.data || [])),
                catchError(() => of([]))
            ),
            cajas: this.cajaService.getAll().pipe(
                map((response: any) => Array.isArray(response) ? response : (response.data || [])),
                catchError(() => of([]))
            ),
            almacenes: (this.isAdmin
                ? this.almacenService.getPaginated({ per_page: 100 }).pipe(
                    map((response: any) => response.data?.data || response.data || []),
                    catchError(() => this.almacenService.getAll().pipe(
                        map((response: any) => Array.isArray(response) ? response : (response.data || []))
                    ))
                )
                : this.almacenService.getAll().pipe(
                    map((response: any) => Array.isArray(response) ? response : (response.data || []))
                )).pipe(catchError(() => of([])))
        };

        if (this.isAdmin) {
            requests.sucursales = this.sucursalService.getAll().pipe(
                map((response: any) => Array.isArray(response) ? response : (response.data || [])),
                catchError(() => of([]))
            );
        }

        forkJoin(requests).pipe(
            finalize(() => this.isLoading = false)
        ).subscribe({
            next: (results: any) => {
                this.categorias = results.categorias;
                this.cajas = results.cajas;
                this.almacenes = results.almacenes;
                if (results.sucursales) {
                    this.sucursales = results.sucursales;
                }

                // 1. Seleccionar caja abierta
                this.seleccionarCajaAbierta();

                // 2. Filtrar almacenes y seleccionar por defecto
                if (this.currentUserSucursalId) {
                    this.selectedSucursalId = this.currentUserSucursalId;
                }
                this.filtrarAlmacenes();
                this.seleccionarAlmacenPorDefecto();

                // 3. Asegurar que el selector de sucursal se actualice
                if (this.currentUserSucursalId && this.sucursales.length > 0) {
                    setTimeout(() => {
                        this.selectedSucursalId = this.currentUserSucursalId;
                        this.cdr.detectChanges();
                    }, 100);
                }
            },
            error: (error) => {
                console.error('Error loading initial data', error);
            }
        });
    }

    loadCartDependencies(): void {
        if (this.cartDependenciesLoaded) return;

        this.isLoading = true;
        forkJoin({
            tiposVenta: this.tipoVentaService.getAll().pipe(
                map((response: any) => {
                    const datos = Array.isArray(response) ? response : (response.data || response || []);
                    return datos.map((item: any) => ({
                        ...item,
                        nombre: item.nombre_tipo_ventas || item.nombre
                    }));
                }),
                catchError(() => of([]))
            ),
            tiposPago: this.tipoPagoService.getAll().pipe(
                map((response: any) => {
                    const datos = Array.isArray(response) ? response : (response.data || response || []);
                    return datos.map((item: any) => ({
                        ...item,
                        nombre: item.nombre_tipo_pago || item.nombre
                    }));
                }),
                catchError(() => of([]))
            ),
            clientes: this.clienteService.getAll().pipe(
                map((response: any) => Array.isArray(response) ? response : (response.data || [])),
                catchError(() => of([]))
            )
        }).pipe(
            finalize(() => {
                this.isLoading = false;
                this.cartDependenciesLoaded = true;
            })
        ).subscribe({
            next: (results) => {
                this.tiposVenta = results.tiposVenta;
                this.tiposPago = results.tiposPago;
                this.clientes = results.clientes;

                // 1. Configurar tipos de venta y pago por defecto
                if (this.tiposVenta.length > 0) {
                    const contado = this.tiposVenta.find(t => (t.nombre || '').toLowerCase().includes('contado'));
                    this.form.patchValue({ tipo_venta_id: contado ? contado.id : this.tiposVenta[0].id });
                }

                if (this.tiposPago.length > 0) {
                    const efectivo = this.tiposPago.find(t => (t.nombre || '').toLowerCase().includes('efectivo'));
                    this.form.patchValue({ tipo_pago_id: efectivo ? efectivo.id : this.tiposPago[0].id });
                }

                // 2. Buscar cliente por defecto
                this.buscarClientePorDefecto();
            }
        });
    }

    buscarClientePorDefecto(): void {
        const terminos = ['sin nombre', 's/n', 'cliente casual', 'sn'];

        const clienteEncontrado = this.clientes.find(c => {
            const nombre = (c.nombre || '').toLowerCase();
            return terminos.some(t => nombre.includes(t));
        });

        if (clienteEncontrado) {
            this.defaultCliente = clienteEncontrado;
            this.form.patchValue({ cliente_id: clienteEncontrado.id });
        } else {
            // Intentar crear cliente por defecto automáticamente solo una vez
            // Si falla, simplemente no establecer cliente por defecto (el usuario deberá seleccionar uno)
            const timestamp = Date.now();
            const randomSuffix = Math.floor(Math.random() * 10000);
            const nuevoCliente: any = {
                nombre: 'Sin Nombre',
                estado: true, // El backend requiere un booleano, no una cadena
                tipo_documento: 'CI',
                num_documento: `SN-${timestamp}-${randomSuffix}`, // Generar número único
                telefono: '',
                email: '',
                direccion: ''
            };

            this.clienteService.create(nuevoCliente).subscribe({
                next: (response: any) => {
                    const clienteCreado = response.data || response;
                    if (clienteCreado) {
                        this.clientes.push(clienteCreado);
                        this.defaultCliente = clienteCreado;
                        this.form.patchValue({ cliente_id: clienteCreado.id });
                    }
                },
                error: (error: any) => {
                    // No bloqueamos, simplemente no habrá default
                }
            });
        }
    }



    seleccionarCajaAbierta(): void {
        // Si es vendedor, solo buscar cajas de su sucursal
        if (this.authService.isVendedor() && this.currentUserSucursalId) {
            const cajaAbierta = this.cajas.find(caja =>
                this.isCajaOpen(caja) &&
                caja.user_id === this.currentUserId &&
                caja.sucursal_id === this.currentUserSucursalId
            );

            if (cajaAbierta) {
                this.cajaSeleccionada = cajaAbierta;
                this.form.patchValue({ caja_id: cajaAbierta.id });
            } else {
                this.cajaSeleccionada = null;
                this.form.patchValue({ caja_id: '' });
            }
        } else {
            // Si es admin, buscar cualquier caja abierta del usuario primero
            let cajaAbierta = this.cajas.find(caja =>
                this.isCajaOpen(caja) && caja.user_id === this.currentUserId
            );

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
    }

    isCajaOpen(caja: Caja): boolean {
        return caja.estado === 'abierta' || caja.estado === '1' || caja.estado === 1 || caja.estado === true;
    }

    seleccionarAlmacenPorDefecto(): void {
        // Si ya hay un almacén seleccionado, no hacer nada (igual que en compras)
        if (this.form.get('almacen_id')?.value) return;

        // Si el usuario tiene una sucursal asignada, buscar almacén de esa sucursal
        if (this.currentUserSucursalId) {
            const almacenPorDefecto = this.almacenes.find(almacen =>
                almacen.sucursal_id === this.currentUserSucursalId && almacen.estado !== false
            );

            if (almacenPorDefecto && almacenPorDefecto.id) {
                this.form.patchValue({ almacen_id: almacenPorDefecto.id });
                // Cargar productos del almacén seleccionado automáticamente
                this.loadProductosInventario(almacenPorDefecto.id);
                return;
            }
        }

        // Si es admin sin sucursal asignada, seleccionar el primer almacén activo disponible
        if (this.isAdmin) {
            const primerAlmacen = this.almacenes.find(almacen => almacen.estado !== false);
            if (primerAlmacen && primerAlmacen.id) {
                this.form.patchValue({ almacen_id: primerAlmacen.id });
                // Cargar productos del almacén seleccionado automáticamente
                this.loadProductosInventario(primerAlmacen.id);
            }
        }
    }

    onAlmacenChange(): void {
        const almacenId = this.form.get('almacen_id')?.value;
        if (almacenId) {
            this.currentPage = 1;
            this.productosInventario = [];
            this.loadProductosInventario(almacenId);
        } else {
            this.productosInventario = [];
        }
    }

    onProductSearch(term: string): void {
        this.busquedaActual = term;
        this.currentPage = 1;
        this.productosInventario = [];
        const almacenId = this.form.get('almacen_id')?.value;
        if (almacenId) {
            this.loadProductosInventario(almacenId);
        }
    }

    onCategoryChange(categoriaId: number | null): void {
        this.categoriaActual = categoriaId;
        this.currentPage = 1;
        this.productosInventario = [];
        const almacenId = this.form.get('almacen_id')?.value;
        if (almacenId) {
            this.loadProductosInventario(almacenId);
        }
    }

    onPageChange(page: number): void {
        if (page >= 1 && page <= this.lastPage && !this.isLoadingMore) {
            this.currentPage = page;
            const almacenId = this.form.get('almacen_id')?.value;
            if (almacenId) {
                this.loadProductosInventario(almacenId, false, true);
            }
        }
    }

    loadProductosInventario(almacenId: number, forceRefresh: boolean = false, isLoadMore: boolean = false): void {
        if (isLoadMore) {
            this.isLoadingMore = true;
        } else {
            this.isLoadingProductos = true;
        }

        const params: any = {
            page: this.currentPage,
            per_page: this.perPage,
            search: this.busquedaActual,
            categoria_id: this.categoriaActual
        };

        this.ventaService.getProductosInventario(almacenId, forceRefresh, params).subscribe({
            next: (response) => {
                let nuevosProductos: ProductoInventario[] = [];

                if (response.data && response.data.data) {
                    // Respuesta paginada
                    nuevosProductos = response.data.data;
                    this.currentPage = response.data.current_page;
                    this.lastPage = response.data.last_page;
                    this.totalProducts = response.data.total;
                } else {
                    // Respuesta no paginada (array simple)
                    nuevosProductos = Array.isArray(response) ? response : (response.data || []);
                    this.currentPage = 1;
                    this.lastPage = 1;
                }

                // Filtrar productos con stock > 0 (doble verificación)
                const productosConStock = nuevosProductos.filter(p => (p.stock_disponible ?? 0) > 0);

                const productosMapeados = productosConStock.map(p => ({
                    ...p,
                    stock_disponible_original: p.stock_disponible
                } as ProductoInventario));

                if (isLoadMore) {
                    // En paginación numerada, reemplazamos la lista en lugar de concatenar
                    this.productosInventario = productosMapeados;
                } else {
                    this.productosInventario = productosMapeados;
                }

                // Actualizar el stock local después de cargar
                this.actualizarStockLocal();

                this.isLoadingProductos = false;
                this.isLoadingMore = false;
            },
            error: (error: any) => {
                console.error('Error loading products', error);
                this.isLoadingProductos = false;
                this.isLoadingMore = false;
                if (!isLoadMore) {
                    this.productosInventario = [];
                }
            }
        });
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
        const almacen = this.almacenes.find(a => a.id === almacenId);
        if (!almacen) {
            this.showAlertMessage('Almacén no encontrado', 'error');
            return;
        }

        // CRÍTICO: Si el usuario tiene una sucursal asignada, el almacén DEBE ser de esa sucursal
        // Esto aplica tanto para admin como para vendedor
        if (this.currentUserSucursalId) {
            if (almacen.sucursal_id !== this.currentUserSucursalId) {
                this.showAlertMessage('No puede seleccionar un almacén de otra sucursal. Su sucursal asignada es diferente.', 'error');
                return;
            }
        }

        this.form.patchValue({ almacen_id: almacenId });
        this.onAlmacenChange();
        this.mostrarMenuAlmacenes = false;
    }

    getAlmacenSeleccionadoNombre(): string {
        const almacenId = this.form.get('almacen_id')?.value;
        if (!almacenId) return '';
        const almacen = this.almacenes.find(a => a.id === almacenId);
        return almacen?.nombre_almacen || '';
    }

    abrirModalCredito(): void {
        this.isModalCreditoOpen = true;
    }

    cerrarModalCredito(): void {
        this.isModalCreditoOpen = false;
    }

    agregarProductoAVenta(producto: ProductoInventario): void {
        // Cargar dependencias del carrito si es la primera vez
        if (!this.cartDependenciesLoaded) {
            this.loadCartDependencies();
        }

        const stockDisponible = producto.stock_disponible;
        if (stockDisponible <= 0) {
            this.showAlertMessage('Este producto no tiene stock disponible', 'warning');
            return;
        }

        const existe = this.detalles.controls.some(control =>
            control.get('articulo_id')?.value === producto.articulo_id
        );

        if (existe) {
            const detalleExistente = this.detalles.controls.find(control =>
                control.get('articulo_id')?.value === producto.articulo_id
            );
            if (detalleExistente) {
                const cantidadActual = Number(detalleExistente.get('cantidad')?.value || 0);
                const nuevaCantidad = cantidadActual + 1;
                if (nuevaCantidad <= stockDisponible) {
                    detalleExistente.patchValue({ cantidad: nuevaCantidad });
                    this.calcularSubtotal(detalleExistente as FormGroup);
                    this.soundService.playSuccessBeep();
                    return;
                } else {
                    this.showAlertMessage(`No hay suficiente stock. Disponible: ${stockDisponible}`, 'warning');
                    return;
                }
            }
        }

        // Mapear el nombre_medida del artículo a uno de los valores válidos del backend
        // El backend solo acepta: 'Unidad', 'Paquete', 'Centimetro'
        const nombreMedidaArticulo = producto.articulo?.medida?.nombre_medida || '';
        const unidadesValidas = ['Unidad', 'Paquete', 'Centimetro'];
        let unidadDefecto = 'Unidad'; // Valor por defecto

        // Si el nombre_medida del artículo coincide con uno de los valores válidos, usarlo
        if (unidadesValidas.includes(nombreMedidaArticulo)) {
            unidadDefecto = nombreMedidaArticulo;
        }
        // Si no coincide, usar 'Unidad' por defecto

        // Calcular precio según la unidad de medida
        // Asegurar que siempre sea un número
        let precioVenta = Number(producto.articulo?.precio_venta) || Number(producto.articulo?.precio_uno) || 0;

        if (unidadDefecto === 'Paquete') {
            // Calcular precio de venta del paquete: precio unitario * unidades por paquete
            const unidadEnvase = Number(producto.articulo?.unidad_envase) || 1;
            const precioCostoPaq = Number(producto.articulo?.precio_costo_paq) || 0;
            const precioCostoUnid = Number(producto.articulo?.precio_costo_unid) || 0;

            if (precioCostoPaq > 0 && precioCostoUnid > 0) {
                // Calcular margen de ganancia del precio unitario
                const margen = (precioVenta - precioCostoUnid) / precioCostoUnid;
                // Aplicar el mismo margen al precio del paquete
                precioVenta = precioCostoPaq * (1 + margen);
            } else {
                // Si no hay precio_costo_paq, usar precio_venta * unidad_envase
                precioVenta = precioVenta * unidadEnvase;
            }
        } else if (unidadDefecto === 'Centimetro') {
            precioVenta = precioVenta / 100;
        }

        // Asegurar que precioVenta sea un número válido
        precioVenta = Number(precioVenta) || 0;
        const precioFormateado = parseFloat(precioVenta.toFixed(2));

        const detalle = this.fb.group({
            articulo_id: [producto.articulo_id, Validators.required],
            cantidad: [1, [Validators.required, Validators.min(1), Validators.max(stockDisponible)]],
            precio: [precioFormateado, [Validators.required, Validators.min(0)]],
            descuento: [0, [Validators.min(0)]],
            unidad_medida: [unidadDefecto],
            subtotal: [precioFormateado]
        });

        detalle.get('cantidad')?.valueChanges.subscribe(() => {
            this.calcularSubtotal(detalle);
            this.actualizarStockLocal();
        });
        detalle.get('precio')?.valueChanges.subscribe(() => this.calcularSubtotal(detalle));
        detalle.get('descuento')?.valueChanges.subscribe(() => this.calcularSubtotal(detalle));

        this.detalles.push(detalle);
        this.calcularTotal();
        this.actualizarStockLocal();
        this.soundService.playSuccessBeep();
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
        this.actualizarStockLocal();
    }

    /**
     * Actualiza el stock localmente basándose en los productos en el carrito
     * Esto permite mostrar el stock disponible en tiempo real mientras se construye la venta
     */
    actualizarStockLocal(): void {
        // Crear un mapa de cantidades en el carrito por artículo
        const cantidadesEnCarrito = new Map<number, number>();

        this.detalles.controls.forEach(control => {
            const articuloId = control.get('articulo_id')?.value;
            const cantidad = Number(control.get('cantidad')?.value || 0);
            const unidadMedida = control.get('unidad_medida')?.value || 'Unidad';

            if (articuloId && cantidad > 0) {
                const producto = this.productosInventario.find(p => p.articulo_id === articuloId);
                if (producto) {
                    let cantidadDeducir = cantidad;

                    // Calcular cantidad a deducir según unidad de medida
                    if (unidadMedida === 'Paquete' && producto.articulo?.unidad_envase) {
                        cantidadDeducir = cantidad * (producto.articulo.unidad_envase > 0 ? producto.articulo.unidad_envase : 1);
                    } else if (unidadMedida === 'Centimetro') {
                        cantidadDeducir = cantidad / 100;
                    }

                    const cantidadActual = cantidadesEnCarrito.get(articuloId) || 0;
                    cantidadesEnCarrito.set(articuloId, cantidadActual + cantidadDeducir);
                }
            }
        });

        // Actualizar el stock disponible mostrado restando las cantidades en el carrito
        // Y filtrar productos que llegaron a stock 0 (solo si no están en el carrito)
        this.productosInventario = this.productosInventario
            .map(producto => {
                const cantidadEnCarrito = cantidadesEnCarrito.get(producto.articulo_id) || 0;
                // El stock disponible mostrado es el stock real menos lo que está en el carrito
                // Pero mantenemos el stock original para cuando se quite del carrito
                const stockOriginal = (producto as any).stock_disponible_original ?? producto.stock_disponible;
                return {
                    ...producto,
                    stock_disponible_original: stockOriginal,
                    stock_disponible: Math.max(0, stockOriginal - cantidadEnCarrito)
                } as ProductoInventario;
            })
            // Filtrar productos con stock 0 que NO están en el carrito
            .filter(producto => {
                const cantidadEnCarrito = cantidadesEnCarrito.get(producto.articulo_id) || 0;
                // Si está en el carrito, mantenerlo aunque el stock disponible sea 0
                // Si NO está en el carrito y el stock es 0, eliminarlo de la lista
                return cantidadEnCarrito > 0 || producto.stock_disponible > 0;
            });
    }

    puedeRegistrarVenta(): boolean {
        return this.form.valid && this.detalles.length > 0;
    }

    generarNumeroComprobante(): string {
        return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    }

    save(event?: Event): void {
        // Prevenir submit accidental - siempre prevenir el comportamiento por defecto
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (this.detalles.length === 0) {
            this.showAlertMessage('Debe agregar al menos un producto a la venta', 'warning');
            return;
        }

        if (this.esVentaCredito) {
            const numeroCuotas = this.form.get('numero_cuotas')?.value;
            const tiempoDiasCuota = this.form.get('tiempo_dias_cuota')?.value;

            if (!numeroCuotas || numeroCuotas < 1) {
                this.showAlertMessage('Por favor ingrese el número de cuotas para la venta a crédito', 'warning');
                return;
            }

            if (!tiempoDiasCuota || tiempoDiasCuota < 1) {
                this.showAlertMessage('Por favor ingrese los días entre cuotas para la venta a crédito', 'warning');
                return;
            }
        }



        // Asignar cliente por defecto si no se seleccionó uno
        const currentClienteId = this.form.get('cliente_id')?.value;

        if (!currentClienteId) {
            if (this.defaultCliente) {
                // Si hay un cliente por defecto, asignarlo
                this.form.patchValue({ cliente_id: this.defaultCliente.id });
                // Actualizar la validez del formulario después de asignar el cliente
                this.form.get('cliente_id')?.updateValueAndValidity();
            } else {
                // Si no hay cliente seleccionado ni por defecto, mostrar error
                this.showAlertMessage('Por favor seleccione un cliente para la venta', 'warning');
                return;
            }
        }

        // Verificar nuevamente después de asignar el cliente por defecto
        const clienteIdFinal = this.form.get('cliente_id')?.value;
        if (!clienteIdFinal) {
            this.showAlertMessage('Por favor seleccione un cliente para la venta', 'warning');
            return;
        }

        const camposRequeridos = ['cliente_id', 'tipo_venta_id', 'tipo_pago_id', 'almacen_id', 'caja_id'];
        const camposFaltantes = camposRequeridos.filter(campo => {
            const value = this.form.get(campo)?.value;
            return value === null || value === undefined || value === '';
        });

        if (camposFaltantes.length > 0) {
            this.showAlertMessage(`Por favor complete todos los campos requeridos. Faltan: ${camposFaltantes.join(', ')}`, 'warning');
            return;
        }

        const cajaId = this.form.get('caja_id')?.value;
        if (!cajaId) {
            this.showAlertMessage('No hay una caja abierta disponible en su sucursal. Por favor abra una caja antes de realizar una venta.', 'error');
            return;
        }

        const caja = this.cajas.find(c => c.id === cajaId);
        if (!caja || !this.isCajaOpen(caja)) {
            this.showAlertMessage('La caja seleccionada está cerrada. Por favor abra una caja antes de realizar una venta.', 'error');
            return;
        }

        // Validar que la caja pertenezca a la sucursal del usuario (si es vendedor)
        if (this.authService.isVendedor() && this.currentUserSucursalId) {
            if (caja.sucursal_id !== this.currentUserSucursalId) {
                this.showAlertMessage('La caja seleccionada no pertenece a su sucursal. Por favor seleccione una caja de su sucursal.', 'error');
                return;
            }

            if (caja.user_id !== this.currentUserId) {
                this.showAlertMessage('La caja seleccionada no le pertenece. Por favor abra su propia caja antes de realizar una venta.', 'error');
                return;
            }
        }

        const almacenId = this.form.get('almacen_id')?.value;

        // Validar que el almacén pertenezca a la sucursal del usuario (si es vendedor)
        if (this.authService.isVendedor() && this.currentUserSucursalId && almacenId) {
            const almacen = this.almacenes.find(a => a.id === almacenId);
            if (!almacen) {
                this.showAlertMessage('Almacén no encontrado', 'error');
                return;
            }

            if (almacen.sucursal_id !== this.currentUserSucursalId) {
                this.showAlertMessage('No puede realizar ventas con un almacén de otra sucursal', 'error');
                return;
            }
        }

        for (let i = 0; i < this.detalles.length; i++) {
            const detalle = this.detalles.at(i);
            const articuloId = detalle.get('articulo_id')?.value;
            const cantidad = detalle.get('cantidad')?.value;
            const unidadMedida = detalle.get('unidad_medida')?.value || 'Unidad';
            const producto = this.productosInventario.find(p => p.articulo_id === articuloId);

            // Usar stock_disponible_original (stock real) en lugar de stock_disponible (que ya fue descontado localmente)
            const stockOriginal = (producto as any)?.stock_disponible_original ?? producto?.stock_disponible ?? 0;

            // Calcular cantidad a deducir según unidad de medida
            let cantidadDeducir = cantidad;
            if (unidadMedida === 'Paquete' && producto?.articulo?.unidad_envase) {
                cantidadDeducir = cantidad * (producto.articulo.unidad_envase > 0 ? producto.articulo.unidad_envase : 1);
            } else if (unidadMedida === 'Centimetro') {
                cantidadDeducir = cantidad / 100;
            }

            if (cantidadDeducir > stockOriginal) {
                this.showAlertMessage(`La cantidad solicitada (${cantidad} ${unidadMedida}) excede el stock disponible (${stockOriginal} unidades)`, 'warning');
                return;
            }
        }

        const formValue = this.form.getRawValue();
        const fechaHoraValue = formValue.fecha_hora || new Date().toISOString().slice(0, 16);
        const fechaHora = new Date(fechaHoraValue).toISOString().slice(0, 19).replace('T', ' ');

        const cajaIdValue = formValue.caja_id ? Number(formValue.caja_id) : null;
        if (!cajaIdValue) {
            this.showAlertMessage('Error: No se pudo obtener la caja. Por favor recargue la página.', 'error');
            return;
        }

        const tipoComprobante = formValue.tipo_comprobante?.trim() || 'RECIBO';
        const numComprobante = formValue.num_comprobante?.trim() || this.generarNumeroComprobante();
        const serieComprobante = formValue.serie_comprobante?.trim() || null;

        const ventaData: any = {
            cliente_id: Number(formValue.cliente_id),
            user_id: Number(formValue.user_id),
            tipo_venta_id: Number(formValue.tipo_venta_id),
            tipo_pago_id: Number(formValue.tipo_pago_id),
            almacen_id: Number(almacenId),
            caja_id: cajaIdValue,
            tipo_comprobante: tipoComprobante,
            serie_comprobante: serieComprobante,
            num_comprobante: numComprobante,
            fecha_hora: fechaHora,
            // El backend calculará el total basándose en los detalles
            detalles: formValue.detalles.map((detalle: any) => {
                // Asegurar que unidad_medida sea uno de los valores válidos
                const unidadesValidas = ['Unidad', 'Paquete', 'Centimetro'];
                const unidadMedida = unidadesValidas.includes(detalle.unidad_medida)
                    ? detalle.unidad_medida
                    : 'Unidad'; // Valor por defecto si no es válido

                return {
                    articulo_id: Number(detalle.articulo_id),
                    cantidad: Number(detalle.cantidad),
                    precio: parseFloat(parseFloat(detalle.precio).toFixed(2)),
                    descuento: parseFloat(parseFloat(detalle.descuento || 0).toFixed(2)),
                    unidad_medida: unidadMedida
                    // No enviar subtotal, el backend lo calculará
                };
            }),
            pagos: formValue.pagos ? formValue.pagos.map((pago: any) => ({
                tipo_pago_id: Number(pago.tipo_pago_id),
                monto: parseFloat(parseFloat(pago.monto).toFixed(2)),
                referencia: pago.referencia
            })) : []
        };

        if (this.esVentaCredito) {
            ventaData.numero_cuotas = Number(formValue.numero_cuotas);
            ventaData.tiempo_dias_cuota = Number(formValue.tiempo_dias_cuota);
        }

        this.isLoading = true;
        this.ventaService.create(ventaData)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: (response: any) => {
                    this.showAlertMessage('Venta registrada con éxito', 'success');

                    // Feedback sonoro (opcional aquí, ya se toca al agregar, pero una venta exitosa merece uno)
                    this.soundService.playSuccessBeep();

                    // Limpiar el formulario y los detalles
                    this.detalles.clear();
                    this.pagos.clear();
                    this.calcularTotal();

                    // Limpiar el caché y recargar el inventario para reflejar el stock actualizado
                    const almacenId = this.form.get('almacen_id')?.value;
                    if (almacenId) {
                        // Limpiar el caché primero
                        this.ventaService.clearProductosCache(almacenId);
                        // Esperar un momento para asegurar que el backend haya terminado de actualizar
                        setTimeout(() => {
                            this.loadProductosInventario(almacenId, true);
                        }, 500); // 500ms de delay para asegurar que el backend haya terminado
                    }

                    this.saleCompleted.emit();

                    const ventaId = response.id;

                    Swal.fire({
                        title: 'Venta registrada con éxito',
                        text: '¿Desea imprimir el comprobante?',
                        icon: 'success',
                        showCancelButton: true,
                        showDenyButton: true,
                        confirmButtonText: 'Imprimir Carta',
                        denyButtonText: 'Imprimir Rollo',
                        cancelButtonText: 'Cerrar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            this.ventaService.imprimirComprobante(ventaId, 'carta');
                        } else if (result.isDenied) {
                            this.ventaService.imprimirComprobante(ventaId, 'rollo');
                        }
                    }).catch(() => {
                        // Manejar error silenciosamente si ocurre
                    });
                },
                error: (error: any) => {
                    this.showAlertMessage('Error al registrar la venta. Por favor intente nuevamente.', 'error');
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

    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
        return !!(field?.invalid && field.touched);
    }

    trackById(index: number, item: any): number {
        return item.id;
    }
}
