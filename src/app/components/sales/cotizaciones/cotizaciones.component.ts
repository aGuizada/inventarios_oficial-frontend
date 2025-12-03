import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CotizacionService } from '../../../services/cotizacion.service';
import { ClienteService } from '../../../services/cliente.service';
import { AlmacenService } from '../../../services/almacen.service';
import { ArticuloService } from '../../../services/articulo.service';
import { Cotizacion, DetalleCotizacion, Cliente, Almacen, Articulo } from '../../../interfaces';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './cotizaciones.component.html',
  styleUrl: './cotizaciones.component.css'
})
export class CotizacionesComponent implements OnInit {
  cotizaciones: Cotizacion[] = [];
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  almacenes: Almacen[] = [];
  articulos: Articulo[] = [];
  
  form: FormGroup;
  detallesFormArray: FormArray;
  isModalOpen = false;
  isEditing = false;
  isLoading = false;
  currentId: number | null = null;
  currentUserId = 1; // TODO: Obtener del servicio de autenticación
  clienteBusqueda: string = '';
  mostrarSugerenciasCliente: boolean = false;
  clienteSeleccionado: Cliente | null = null;
  
  // Para manejar búsqueda de artículos en el catálogo
  busquedaArticulo: string = '';
  articulosFiltrados: Articulo[] = [];
  articuloSeleccionado: Articulo | null = null;
  mostrarSugerenciasArticulo: boolean = false;

  constructor(
    private cotizacionService: CotizacionService,
    private clienteService: ClienteService,
    private almacenService: AlmacenService,
    private articuloService: ArticuloService,
    private fb: FormBuilder
  ) {
    this.detallesFormArray = this.fb.array([]);
    this.form = this.fb.group({
      cliente_id: [''],
      cliente_nombre: ['', Validators.required],
      user_id: [this.currentUserId, Validators.required],
      almacen_id: ['', Validators.required],
      fecha_hora: [new Date().toISOString().slice(0, 16), Validators.required],
      total: [0, [Validators.required, Validators.min(0)]],
      validez: [''],
      plazo_entrega: [''],
      tiempo_entrega: [''],
      lugar_entrega: [''],
      forma_pago: [''],
      nota: [''],
      estado: ['Pendiente'],
      detalles: this.detallesFormArray
    });
  }

  ngOnInit(): void {
    this.loadCotizaciones();
    this.loadDependencies();
  }

  loadDependencies(): void {
    this.clienteService.getAll().subscribe(res => {
      this.clientes = Array.isArray(res.data) ? res.data : [];
      this.clientesFiltrados = this.clientes;
    });
    this.almacenService.getAll().subscribe(res => {
      this.almacenes = Array.isArray(res.data) ? res.data : [];
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

  loadCotizaciones(): void {
    this.isLoading = true;
    this.cotizacionService.getAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (cotizaciones) => {
          this.cotizaciones = Array.isArray(cotizaciones) ? cotizaciones : [];
        },
        error: (error) => {
          console.error('Error loading cotizaciones', error);
          this.cotizaciones = [];
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
      this.clienteBusqueda = '';
      this.clienteSeleccionado = null;
      this.mostrarSugerenciasCliente = false;
      this.clientesFiltrados = this.clientes || [];
      // Limpiar búsqueda de artículos
      this.busquedaArticulo = '';
      this.articulosFiltrados = this.articulos || [];
      this.mostrarSugerenciasArticulo = false;
      this.articuloSeleccionado = null;
      this.form.reset({
        cliente_id: '',
        cliente_nombre: '',
        user_id: this.currentUserId,
        almacen_id: '',
        fecha_hora: new Date().toISOString().slice(0, 16),
        total: 0,
        estado: 'Pendiente'
      });
      this.form.patchValue({ cliente_nombre: '' });
      console.log('Modal abierto, isModalOpen:', this.isModalOpen);
    } catch (error) {
      console.error('Error al abrir modal:', error);
      alert('Error al abrir el modal. Por favor revise la consola para más detalles.');
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
    this.detallesFormArray.clear();
    this.clienteBusqueda = '';
    this.clienteSeleccionado = null;
    this.mostrarSugerenciasCliente = false;
    // Limpiar búsqueda de artículos
    this.busquedaArticulo = '';
    this.articulosFiltrados = this.articulos || [];
    this.mostrarSugerenciasArticulo = false;
    this.articuloSeleccionado = null;
  }

  edit(cotizacion: Cotizacion): void {
    this.isModalOpen = true;
    this.isEditing = true;
    this.currentId = cotizacion.id;
    this.detallesFormArray.clear();
    
    // Limpiar búsqueda de artículos
    this.busquedaArticulo = '';
    this.articulosFiltrados = this.articulos || [];
    this.mostrarSugerenciasArticulo = false;
    this.articuloSeleccionado = null;
    
    const cliente = cotizacion.cliente || this.clientes.find(c => c.id === cotizacion.cliente_id);
    this.clienteSeleccionado = cliente || null;
    this.clienteBusqueda = cliente ? cliente.nombre : '';
    this.mostrarSugerenciasCliente = false;
    
    // Convertir estado numérico a string si es necesario
    let estadoString = 'Pendiente';
    if (cotizacion.estado !== undefined && cotizacion.estado !== null) {
      if (typeof cotizacion.estado === 'number') {
        estadoString = cotizacion.estado === 1 ? 'Pendiente' : 
                      (cotizacion.estado === 2 ? 'Aprobada' : 'Rechazada');
      } else if (typeof cotizacion.estado === 'string') {
        estadoString = cotizacion.estado;
      }
    }
    
    this.form.patchValue({
      cliente_id: cotizacion.cliente_id || '',
      cliente_nombre: cliente ? cliente.nombre : '',
      user_id: cotizacion.user_id,
      almacen_id: cotizacion.almacen_id,
      fecha_hora: cotizacion.fecha_hora ? new Date(cotizacion.fecha_hora).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      total: cotizacion.total,
      validez: cotizacion.validez || '',
      plazo_entrega: cotizacion.plazo_entrega || '',
      tiempo_entrega: cotizacion.tiempo_entrega || '',
      lugar_entrega: cotizacion.lugar_entrega || '',
      forma_pago: cotizacion.forma_pago || '',
      nota: cotizacion.nota || '',
      estado: estadoString
    });

    if (cotizacion.detalles && cotizacion.detalles.length > 0) {
      cotizacion.detalles.forEach(detalle => {
        // Asegurar que el detalle tenga articulo_id válido
        if (detalle.articulo_id) {
          this.addDetalle(detalle);
        } else {
          console.warn('Detalle sin articulo_id:', detalle);
        }
      });
    }
  }

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  addDetalle(detalle?: DetalleCotizacion | any): void {
    const precioInicial = detalle?.precio_unitario || detalle?.precio || 0;
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
    const total = this.detallesFormArray.controls.reduce((sum, control) => {
      return sum + (control.get('subtotal')?.value || 0);
    }, 0);
    this.form.patchValue({ total: total }, { emitEvent: false });
  }

  save(): void {
    console.log('Guardando cotización...');
    console.log('Form valid:', this.form.valid);
    console.log('Form errors:', this.form.errors);
    console.log('Form value:', this.form.value);
    console.log('Detalles length:', this.detallesFormArray.length);
    console.log('Cliente búsqueda:', this.clienteBusqueda);
    
    // Validar que el nombre del cliente esté ingresado
    if (!this.form.get('cliente_nombre')?.value || this.clienteBusqueda.trim().length === 0) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }

    if (this.form.invalid || this.detallesFormArray.length === 0) {
      if (this.detallesFormArray.length === 0) {
        alert('Debe agregar al menos un artículo a la cotización');
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
      alert('Debe agregar al menos un artículo a la cotización');
      return;
    }
    
    // Formatear fecha_hora correctamente para Laravel (formato Y-m-d H:i:s)
    let fechaHora = formValue.fecha_hora;
    if (fechaHora) {
      // Convertir de formato datetime-local (2025-12-03T15:47) a formato Laravel (2025-12-03 15:47:00)
      if (fechaHora.includes('T')) {
        fechaHora = fechaHora.replace('T', ' ');
      }
      // Asegurar que tenga segundos
      if (fechaHora.split(':').length === 2) {
        fechaHora = fechaHora + ':00';
      }
    }
    
    // Asegurar que estado sea siempre un string
    let estadoValue = formValue.estado || 'Pendiente';
    if (typeof estadoValue === 'number') {
      estadoValue = estadoValue === 1 ? 'Pendiente' : 
                   (estadoValue === 2 ? 'Aprobada' : 'Rechazada');
    }
    estadoValue = String(estadoValue);
    
    const cotizacionData: any = {
      cliente_nombre: this.clienteBusqueda.trim(),
      user_id: Number(formValue.user_id),
      almacen_id: Number(formValue.almacen_id),
      fecha_hora: fechaHora,
      total: Number(formValue.total),
      estado: estadoValue,
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

    // Si hay un cliente seleccionado, enviar también el ID
    if (this.clienteSeleccionado && this.form.get('cliente_id')?.value) {
      cotizacionData.cliente_id = Number(this.form.get('cliente_id')?.value);
    }

    // Agregar campos opcionales solo si tienen valor (no vacíos)
    if (formValue.validez && formValue.validez.trim() !== '') {
      cotizacionData.validez = formValue.validez.trim();
    }
    if (formValue.plazo_entrega && formValue.plazo_entrega.trim() !== '') {
      cotizacionData.plazo_entrega = formValue.plazo_entrega.trim();
    }
    if (formValue.tiempo_entrega && formValue.tiempo_entrega.trim() !== '') {
      cotizacionData.tiempo_entrega = formValue.tiempo_entrega.trim();
    } else {
      // tiempo_entrega es requerido en BD, enviar string vacío si no tiene valor
      cotizacionData.tiempo_entrega = '';
    }
    if (formValue.lugar_entrega && formValue.lugar_entrega.trim() !== '') {
      cotizacionData.lugar_entrega = formValue.lugar_entrega.trim();
    }
    if (formValue.forma_pago && formValue.forma_pago.trim() !== '') {
      cotizacionData.forma_pago = formValue.forma_pago.trim();
    }
    if (formValue.nota && formValue.nota.trim() !== '') {
      cotizacionData.nota = formValue.nota.trim();
    }
    
    console.log('Datos a enviar:', cotizacionData);
    console.log('Detalles a enviar:', JSON.stringify(cotizacionData.detalles, null, 2));
    cotizacionData.detalles.forEach((detalle: any, index: number) => {
      console.log(`Detalle ${index}:`, {
        articulo_id: detalle.articulo_id,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: detalle.descuento
      });
    });
    
    this.isLoading = true;
    if (this.isEditing && this.currentId) {
      this.cotizacionService.update(this.currentId, cotizacionData)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.loadCotizaciones();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating cotizacion', error);
            console.log('Error response:', error?.error);
            
            let errorMessage = 'Error al actualizar la cotización';
            
            if (error?.error) {
              // Si hay errores de validación de Laravel
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
      this.cotizacionService.create(cotizacionData)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.loadCotizaciones();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error creating cotizacion', error);
            const errorResponse = error?.error || {};
            const errorMessage = errorResponse.message || errorResponse.error || 'Error al crear la cotización';
            const errorDetails = errorResponse.file ? `Archivo: ${errorResponse.file}\nLínea: ${errorResponse.line}` : '';
            const fullError = errorResponse.message || error?.message || 'Error desconocido';
            
            console.log('Datos enviados:', cotizacionData);
            console.log('Error completo:', error);
            console.log('Error response:', errorResponse);
            
            alert(`Error: ${errorMessage}\n\n${errorDetails}\n\nDetalles: ${fullError}`);
          }
        });
    }
  }

  delete(id: number): void {
    if (confirm('¿Está seguro de eliminar esta cotización?')) {
      this.isLoading = true;
      this.cotizacionService.delete(id)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.loadCotizaciones();
          },
          error: (error) => {
            console.error('Error deleting cotizacion', error);
            alert('Error al eliminar la cotización');
          }
        });
    }
  }

  getArticuloNombre(articuloId: number): string {
    const articulo = this.articulos.find(a => a.id === articuloId);
    return articulo ? articulo.nombre : 'N/A';
  }

  buscarCliente(event: any): void {
    const valor = event.target.value.toLowerCase();
    this.clienteBusqueda = event.target.value;
    
    // Actualizar el campo del formulario
    this.form.patchValue({ cliente_nombre: event.target.value });
    
    if (valor.length === 0) {
      this.clientesFiltrados = this.clientes;
      this.mostrarSugerenciasCliente = false;
      this.clienteSeleccionado = null;
      this.form.patchValue({ cliente_id: '' });
    } else {
      this.clientesFiltrados = this.clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(valor) ||
        (cliente.num_documento && cliente.num_documento.toLowerCase().includes(valor))
      );
      this.mostrarSugerenciasCliente = this.clientesFiltrados.length > 0;
      
      // Si el texto escrito coincide exactamente con un cliente, seleccionarlo automáticamente
      const clienteExacto = this.clientes.find(c => 
        c.nombre.toLowerCase() === valor || 
        c.nombre.toLowerCase() === event.target.value.toLowerCase()
      );
      if (clienteExacto) {
        this.seleccionarCliente(clienteExacto);
      } else {
        // Si no hay coincidencia exacta, limpiar la selección pero mantener el nombre
        this.clienteSeleccionado = null;
        this.form.patchValue({ cliente_id: '' });
      }
    }
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.clienteBusqueda = cliente.nombre;
    this.form.patchValue({
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre
    });
    this.mostrarSugerenciasCliente = false;
  }

  limpiarCliente(): void {
    this.clienteBusqueda = '';
    this.clienteSeleccionado = null;
    this.mostrarSugerenciasCliente = false;
    this.clientesFiltrados = this.clientes;
    this.form.patchValue({
      cliente_id: '',
      cliente_nombre: ''
    });
  }

  onFocusCliente(): void {
    if (this.clienteBusqueda.length > 0 && this.clientesFiltrados.length > 0) {
      this.mostrarSugerenciasCliente = true;
    }
  }

  onBlurCliente(): void {
    // Delay para permitir el click en las sugerencias
    setTimeout(() => {
      this.mostrarSugerenciasCliente = false;
      // Actualizar el campo del formulario con el texto escrito
      this.form.patchValue({ cliente_nombre: this.clienteBusqueda });
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

  agregarArticuloACotizacion(): void {
    if (!this.articuloSeleccionado) {
      alert('Por favor seleccione un producto del catálogo');
      return;
    }

    // Verificar si el artículo ya está agregado
    const articuloYaAgregado = this.detallesFormArray.controls.some(control => 
      control.get('articulo_id')?.value === this.articuloSeleccionado?.id
    );

    if (articuloYaAgregado) {
      if (confirm('Este producto ya está en la cotización. ¿Desea agregarlo de nuevo?')) {
        // Si confirma, agregar de todas formas
      } else {
        return;
      }
    }

    const precioInicial = this.articuloSeleccionado.precio_venta || 0;
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
