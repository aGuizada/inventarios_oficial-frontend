import { Component, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
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
export class VentaFormComponent implements OnInit {
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

    // Caché de productos por almacén para evitar recargas innecesarias
    productosCache: Map<number, ProductoInventario[]> = new Map();

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

    // Propiedades para alertas
    showAlert: boolean = false;
    alertType: 'error' | 'success' | 'warning' | 'info' = 'error';
    alertMessage: string = '';

    // Propiedades para administrador y sucursal
    isAdmin: boolean = false;
    selectedSucursalId: number | null = null;

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
        private cdr: ChangeDetectorRef // Added
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
        }

        // Cargar sucursales solo si es admin (no bloquea la carga principal)
        if (this.isAdmin) {
            this.loadSucursales();
        }

        // Cargar dependencias y cajas en paralelo
        this.loadDependencies();
        this.loadCajas();
        this.actualizarFechaHora();
    }

    loadSucursales(): void {
        this.sucursalService.getAll().subscribe({
            next: (response: any) => {
                this.sucursales = Array.isArray(response) ? response : (response.data || []);
            },
            error: (error: any) => console.error('Error al cargar sucursales:', error)
        });
    }

    filtrarAlmacenes(): void {
        if (this.selectedSucursalId) {
            this.almacenesFiltrados = this.almacenes.filter(a => a.sucursal_id == this.selectedSucursalId);
        } else {
            this.almacenesFiltrados = [...this.almacenes];
        }

        // Si el almacén seleccionado no está en la lista filtrada, deseleccionarlo
        const currentAlmacenId = this.form.get('almacen_id')?.value;
        if (currentAlmacenId && !this.almacenesFiltrados.find(a => a.id == currentAlmacenId)) {
            this.form.patchValue({ almacen_id: '' });
            this.productosInventario = [];
        }
    }

    onSucursalChange(): void {
        this.filtrarAlmacenes();
        // Opcional: Seleccionar el primer almacén de la sucursal automáticamente
        if (this.almacenesFiltrados.length > 0) {
            this.cambiarAlmacen(this.almacenesFiltrados[0].id!);
        }
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

    loadDependencies(): void {
        this.clienteService.getAll().subscribe({
            next: (response: any) => {
                this.clientes = Array.isArray(response) ? response : (response.data || []);
                this.buscarClientePorDefecto();
            },
            error: (error: any) => console.error('Error al cargar clientes:', error)
        });

        this.almacenService.getAll().subscribe({
            next: (response: any) => {
                // Request a large number to ensure we get all warehouses for admin
                // Ideally we should use pagination or a specific endpoint
                this.almacenes = Array.isArray(response) ? response : (response.data || []);
                this.filtrarAlmacenes();
                this.seleccionarAlmacenPorDefecto();
            },
            error: (error: any) => console.error('Error al cargar almacenes:', error)
        });

        // Force load all warehouses if admin by requesting a large page
        if (this.isAdmin) {
            this.almacenService.getPaginated({ per_page: 100 }).subscribe({
                next: (response: any) => {
                    this.almacenes = response.data.data || [];
                    this.filtrarAlmacenes();
                    this.seleccionarAlmacenPorDefecto();
                }
            });
        }

        this.categoriaService.getAll().subscribe({
            next: (response: any) => this.categorias = Array.isArray(response) ? response : (response.data || []),
            error: (error: any) => console.error('Error al cargar categorías:', error)
        });

        const tipoVentaRequest = this.tipoVentaService.getAll().pipe(
            map((response: any) => {
                const datos = Array.isArray(response) ? response : (response.data || response || []);
                return datos.map((item: any) => ({
                    ...item,
                    nombre: item.nombre_tipo_ventas || item.nombre
                }));
            },
                error: (error: any) => console.error('Error al cargar tipos de venta:', error)
        });

    const tipoPagoRequest = this.tipoPagoService.getAll().pipe(
        map((response: any) => {
            const datos = Array.isArray(response) ? response : (response.data || response || []);
            return datos.map((item: any) => ({
                ...item,
                nombre: item.nombre_tipo_pago || item.nombre
            }));
        },
            error: (error: any) => console.error('Error al cargar tipos de pago:', error)
        });
    }

buscarClientePorDefecto(): void {
    const terminos = ['sin nombre', 's/n', 'cliente casual', 'sn'];

    const clienteEncontrado = this.clientes.find(c => {
        const nombre = (c.nombre || '').toLowerCase();
        return terminos.some(t => nombre.includes(t));
    });

    if(clienteEncontrado) {
        this.defaultCliente = clienteEncontrado;
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
                }
            },
            error: (error: any) => {
                console.error('Error al crear cliente por defecto:', error);
                // No bloqueamos, simplemente no habrá default
            }
        });
    }
}

loadCajas(): void {
    this.cajaService.getAll().subscribe({
        next: (response: any) => {
            this.cajas = Array.isArray(response) ? response : (response.data || []);
            this.seleccionarCajaAbierta();
        },
        error: (error: any) => {
            console.error('Error al cargar cajas:', error);
            this.cajas = [];
        }
    });
}

seleccionarCajaAbierta(): void {
    // Si es vendedor, solo buscar cajas de su sucursal
    if(this.authService.isVendedor() && this.currentUserSucursalId) {
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

seleccionarAlmacenPorDefecto(): number | null {
    // Si ya hay un almacén seleccionado, retornar su ID
    const almacenIdActual = this.form.get('almacen_id')?.value;
    if (almacenIdActual) return almacenIdActual;

    // Si no hay almacenes cargados aún, retornar null
    if (!this.almacenes || this.almacenes.length === 0) return null;

    let almacenPorDefecto: Almacen | undefined;

    // Prioridad 1: Almacén de la sucursal del usuario actual
    if (this.currentUserSucursalId) {
        almacenPorDefecto = this.almacenes.find(almacen =>
            almacen.sucursal_id === this.currentUserSucursalId && almacen.estado !== false
        );
    }

    // Prioridad 2: Primer almacén activo disponible
    if (!almacenPorDefecto) {
        almacenPorDefecto = this.almacenes.find(almacen => almacen.estado !== false);
    }

    // Si encontramos un almacén, seleccionarlo y retornar su ID
    if (almacenPorDefecto && almacenPorDefecto.id) {
        this.form.patchValue({ almacen_id: almacenPorDefecto.id }, { emitEvent: false });
        return almacenPorDefecto.id;
    }

    return null;
}

onAlmacenChange(): void {
    const almacenId = this.form.get('almacen_id')?.value;
    if(almacenId) {
        this.loadProductosInventario(almacenId);
    } else {
        this.productosInventario = [];
    }
}

loadProductosInventario(almacenId: number): void {
    this.ventaService.getProductosInventario(almacenId).subscribe({
        next: (productos) => {
            this.productosInventario = productos;
        },
        error: (error: any) => {
            console.error('Error al cargar productos del inventario:', error);
            this.productosInventario = [];
        }
    });
}

toggleMenuAlmacenes(): void {
    this.mostrarMenuAlmacenes = !this.mostrarMenuAlmacenes;
}

@HostListener('document:click', ['$event'])
cerrarMenus(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if(this.mostrarMenuAlmacenes && !target.closest('.menu-almacenes')) {
    this.mostrarMenuAlmacenes = false;
}
    }

cambiarAlmacen(almacenId: number): void {
    // Validar que el almacén pertenezca a la sucursal del usuario (si es vendedor)
    if(this.authService.isVendedor() && this.currentUserSucursalId) {
    const almacen = this.almacenes.find(a => a.id === almacenId);
    if (!almacen) {
        this.showAlertMessage('Almacén no encontrado', 'error');
        return;
    }

    if (almacen.sucursal_id !== this.currentUserSucursalId) {
        this.showAlertMessage('No puede seleccionar un almacén de otra sucursal', 'error');
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
    const stockDisponible = producto.stock_disponible;
    if(stockDisponible <= 0) {
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
            return;
        } else {
            this.showAlertMessage(`No hay suficiente stock. Disponible: ${stockDisponible}`, 'warning');
            return;
        }
    }
}

const precioVenta = producto.articulo?.precio_venta ||
    producto.articulo?.precio_uno || 0;

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

const detalle = this.fb.group({
    articulo_id: [producto.articulo_id, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1), Validators.max(stockDisponible)]],
    precio: [precioVenta, [Validators.required, Validators.min(0)]],
    descuento: [0, [Validators.min(0)]],
    unidad_medida: [unidadDefecto],
    subtotal: [precioVenta]
});

detalle.get('cantidad')?.valueChanges.subscribe(() => this.calcularSubtotal(detalle));
detalle.get('precio')?.valueChanges.subscribe(() => this.calcularSubtotal(detalle));
detalle.get('descuento')?.valueChanges.subscribe(() => this.calcularSubtotal(detalle));

this.detalles.push(detalle);
this.calcularTotal();
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

puedeRegistrarVenta(): boolean {
    return this.form.valid && this.detalles.length > 0;
}

generarNumeroComprobante(): string {
    return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

save(): void {
    if(this.detalles.length === 0) {
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
    } else {
        // Si no hay cliente seleccionado ni por defecto, mostrar error
        this.showAlertMessage('Por favor seleccione un cliente para la venta', 'warning');
        return;
    }
}

const camposRequeridos = ['cliente_id', 'tipo_venta_id', 'tipo_pago_id', 'almacen_id', 'caja_id'];
const camposFaltantes = camposRequeridos.filter(campo => !this.form.get(campo)?.value);

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
    const producto = this.productosInventario.find(p => p.articulo_id === articuloId);
    const stockDisponible = producto?.stock_disponible || 0;

    if (cantidad > stockDisponible) {
        this.showAlertMessage(`La cantidad solicitada (${cantidad}) excede el stock disponible (${stockDisponible})`, 'warning');
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
            }).then((result: any) => {
                if (result.isConfirmed) {
                    this.ventaService.imprimirComprobante(ventaId, 'carta');
                } else if (result.isDenied) {
                    this.ventaService.imprimirComprobante(ventaId, 'rollo');
                }
            });
        },
        error: (error: any) => {
            console.error('Error al registrar venta:', error);
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
}
