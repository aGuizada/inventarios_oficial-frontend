import { Component, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { VentaService, ProductoInventario } from '../../../../services/venta.service';
import { ClienteService } from '../../../../services/cliente.service';
import { AlmacenService } from '../../../../services/almacen.service';
import { CajaService } from '../../../../services/caja.service';
import { TipoVentaService } from '../../../../services/tipo-venta.service';
import { TipoPagoService } from '../../../../services/tipo-pago.service';
import { CategoriaService } from '../../../../services/categoria.service';
import { AuthService } from '../../../../services/auth.service';
import { Cliente, Almacen, Caja, TipoVenta, TipoPago, Categoria } from '../../../../interfaces';
import { finalize } from 'rxjs/operators';

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
    productosInventario: ProductoInventario[] = [];
    categorias: Categoria[] = [];
    cajas: Caja[] = [];
    tiposVenta: TipoVenta[] = [];
    tiposPago: TipoPago[] = [];

    cajaSeleccionada: Caja | null = null;
    esVentaCredito = false;
    isModalCreditoOpen = false;
    isLoading = false;
    mostrarMenuAlmacenes = false;

    currentUserId = 1;
    currentUserSucursalId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private ventaService: VentaService,
        private clienteService: ClienteService,
        private almacenService: AlmacenService,
        private cajaService: CajaService,
        private tipoVentaService: TipoVentaService,
        private tipoPagoService: TipoPagoService,
        private categoriaService: CategoriaService,
        private authService: AuthService
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
            this.form.patchValue({ user_id: this.currentUserId });
        }

        this.loadDependencies();
        this.loadCajas();
        this.actualizarFechaHora();
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
            next: (response: any) => this.clientes = Array.isArray(response) ? response : (response.data || []),
            error: (error) => console.error('Error al cargar clientes:', error)
        });

        this.almacenService.getAll().subscribe({
            next: (response: any) => {
                this.almacenes = Array.isArray(response) ? response : (response.data || []);
                this.seleccionarAlmacenPorDefecto();
            },
            error: (error) => console.error('Error al cargar almacenes:', error)
        });

        this.categoriaService.getAll().subscribe({
            next: (response: any) => this.categorias = Array.isArray(response) ? response : (response.data || []),
            error: (error) => console.error('Error al cargar categorías:', error)
        });

        this.tipoVentaService.getAll().subscribe({
            next: (response: any) => {
                const datos = Array.isArray(response) ? response : (response.data || response || []);
                this.tiposVenta = datos.map((item: any) => ({
                    ...item,
                    nombre: item.nombre_tipo_ventas || item.nombre
                }));
            },
            error: (error) => console.error('Error al cargar tipos de venta:', error)
        });

        this.tipoPagoService.getAll().subscribe({
            next: (response: any) => {
                const datos = Array.isArray(response) ? response : (response.data || response || []);
                this.tiposPago = datos.map((item: any) => ({
                    ...item,
                    nombre: item.nombre_tipo_pago || item.nombre
                }));
            },
            error: (error) => console.error('Error al cargar tipos de pago:', error)
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

    isCajaOpen(caja: Caja): boolean {
        return caja.estado === 'abierta' || caja.estado === '1' || caja.estado === 1 || caja.estado === true;
    }

    seleccionarAlmacenPorDefecto(): void {
        if (this.form.get('almacen_id')?.value) return;

        if (this.currentUserSucursalId) {
            const almacenPorDefecto = this.almacenes.find(almacen =>
                almacen.sucursal_id === this.currentUserSucursalId && almacen.estado !== false
            );

            if (almacenPorDefecto) {
                this.form.patchValue({ almacen_id: almacenPorDefecto.id });
                this.onAlmacenChange();
                return;
            }
        }

        const primerAlmacen = this.almacenes.find(almacen => almacen.estado !== false);
        if (primerAlmacen) {
            this.form.patchValue({ almacen_id: primerAlmacen.id });
            this.onAlmacenChange();
        }
    }

    onAlmacenChange(): void {
        const almacenId = this.form.get('almacen_id')?.value;
        if (almacenId) {
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
            error: (error) => {
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
        if (this.mostrarMenuAlmacenes && !target.closest('.menu-almacenes')) {
            this.mostrarMenuAlmacenes = false;
        }
    }

    cambiarAlmacen(almacenId: number): void {
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
        if (stockDisponible <= 0) {
            alert('Este producto no tiene stock disponible');
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
                    alert(`No hay suficiente stock. Disponible: ${stockDisponible}`);
                    return;
                }
            }
        }

        const precioVenta = producto.articulo?.precio_venta ||
            producto.articulo?.precio_uno || 0;

        const unidadDefecto = producto.articulo?.medida?.nombre_medida || 'Unidad';

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
        if (this.detalles.length === 0) {
            alert('Debe agregar al menos un producto a la venta');
            return;
        }

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

        const camposRequeridos = ['cliente_id', 'tipo_venta_id', 'tipo_pago_id', 'almacen_id', 'caja_id'];
        const camposFaltantes = camposRequeridos.filter(campo => !this.form.get(campo)?.value);

        if (camposFaltantes.length > 0) {
            alert(`Por favor complete todos los campos requeridos. Faltan: ${camposFaltantes.join(', ')}`);
            return;
        }

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

        const almacenId = this.form.get('almacen_id')?.value;
        for (let i = 0; i < this.detalles.length; i++) {
            const detalle = this.detalles.at(i);
            const articuloId = detalle.get('articulo_id')?.value;
            const cantidad = detalle.get('cantidad')?.value;
            const producto = this.productosInventario.find(p => p.articulo_id === articuloId);
            const stockDisponible = producto?.stock_disponible || 0;

            if (cantidad > stockDisponible) {
                alert(`La cantidad solicitada (${cantidad}) excede el stock disponible (${stockDisponible})`);
                return;
            }
        }

        const formValue = this.form.getRawValue();
        const fechaHoraValue = formValue.fecha_hora || new Date().toISOString().slice(0, 16);
        const fechaHora = new Date(fechaHoraValue).toISOString().slice(0, 19).replace('T', ' ');

        const cajaIdValue = formValue.caja_id ? Number(formValue.caja_id) : null;
        if (!cajaIdValue) {
            alert('Error: No se pudo obtener la caja. Por favor recargue la página.');
            return;
        }

        const tipoComprobante = formValue.tipo_comprobante?.trim() || 'BOLETA';
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
            total: parseFloat(formValue.total.toFixed(2)),
            detalles: formValue.detalles.map((detalle: any) => ({
                articulo_id: Number(detalle.articulo_id),
                cantidad: Number(detalle.cantidad),
                precio: parseFloat(parseFloat(detalle.precio).toFixed(2)),
                descuento: parseFloat(parseFloat(detalle.descuento || 0).toFixed(2)),
                unidad_medida: detalle.unidad_medida
            })),
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
                    alert('Venta registrada con éxito');
                    this.saleCompleted.emit();
                },
                error: (error) => {
                    console.error('Error al registrar venta:', error);
                    alert('Error al registrar la venta. Por favor intente nuevamente.');
                }
            });
    }
}
