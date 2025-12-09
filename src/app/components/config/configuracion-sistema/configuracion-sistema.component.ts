import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ConfiguracionTrabajoService } from '../../../services/configuracion-trabajo.service';
import { EmpresaService } from '../../../services/empresa.service';
import { MonedaService } from '../../../services/moneda.service';
import { Empresa, Moneda, ApiResponse } from '../../../interfaces';
import { EmpresaFormComponent } from '../empresas/empresa-form/empresa-form.component';
import { MonedasListComponent } from '../../operations/monedas/monedas-list/monedas-list.component';
import { MonedaFormComponent } from '../../operations/monedas/moneda-form/moneda-form.component';
import { TipoCambioFormComponent } from '../../operations/monedas/tipo-cambio-form/tipo-cambio-form.component';
import { finalize } from 'rxjs/operators';

type ConfigTab = 'general' | 'empresa' | 'moneda' | 'precios' | 'impuestos' | 'trabajo' | 'backup' | 'inventario';

interface ConfiguracionTrabajo {
  id?: number;
  // General
  moneda_id?: number;
  empresa_id?: number; // New field
  nombre_empresa?: string; // Legacy?
  logo?: string;
  email_empresa?: string;
  telefono_empresa?: string;
  direccion_empresa?: string;
  // Precios
  margen_default?: number;
  redondeo?: number;
  notificar_stock_bajo?: boolean;
  stock_minimo_default?: number;
  // Impuestos
  iva?: number;
  precio_incluye_iva?: boolean;
  // Trabajo
  dias_gracia_credito?: number;
  descuento_pronto_pago?: number;
  // Backup
  backup_automatico?: boolean;
  frecuencia_backup?: string;
  ruta_backup?: string;
  mantener_backups?: number;
  // Inventario
  mostrar_costo_unitario?: boolean;
  mostrar_costo_paquete?: boolean;
  mostrar_costo_compra?: boolean;
  mostrar_precios_adicionales?: boolean;
  mostrar_vencimiento?: boolean;
  mostrar_stock?: boolean;
}

@Component({
  selector: 'app-configuracion-sistema',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EmpresaFormComponent,
    MonedasListComponent,
    MonedaFormComponent,
    TipoCambioFormComponent
  ],
  templateUrl: './configuracion-sistema.component.html'
})
export class ConfiguracionSistemaComponent implements OnInit {
  activeTab: ConfigTab = 'general';

  // Forms
  generalForm!: FormGroup;
  preciosForm!: FormGroup;
  impuestosForm!: FormGroup;
  trabajoForm!: FormGroup;
  backupForm!: FormGroup;
  inventarioForm!: FormGroup;

  // State
  isLoading = false;
  isSaving = false;
  selectedLogo: File | null = null;
  logoPreview: string | null = null;

  // Empresas
  empresas: Empresa[] = [];
  selectedEmpresa: Empresa | null = null;
  showEmpresaForm = false;

  // Monedas
  monedas: Moneda[] = [];
  isMonedaFormModalOpen = false;
  isTipoCambioModalOpen = false;
  selectedMoneda: Moneda | null = null;
  monedaSeleccionada: Moneda | null = null; // For Tipo Cambio
  monedaErrorMessage: string = '';
  monedaSuccessMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private configService: ConfiguracionTrabajoService,
    private empresaService: EmpresaService,
    private monedaService: MonedaService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadEmpresas();
    this.loadMonedas();
    this.loadConfig();
  }

  initForms(): void {
    // General Form
    this.generalForm = this.fb.group({
      moneda_id: [1, [Validators.required]],
      empresa_id: [null], // New control
      // Legacy fields kept for compatibility or fallback
      nombre_empresa: ['Mi Empresa', [Validators.required, Validators.maxLength(100)]],
      email_empresa: ['', [Validators.email, Validators.maxLength(100)]],
      telefono_empresa: ['', [Validators.maxLength(20)]],
      direccion_empresa: ['', [Validators.maxLength(255)]],
      logo: ['']
    });

    // Precios Form
    this.preciosForm = this.fb.group({
      margen_default: [30, [Validators.required, Validators.min(0), Validators.max(100)]],
      redondeo: [0, [Validators.required]],
      notificar_stock_bajo: [true],
      stock_minimo_default: [10, [Validators.min(0)]]
    });

    // Impuestos Form
    this.impuestosForm = this.fb.group({
      iva: [16, [Validators.required, Validators.min(0), Validators.max(100)]],
      precio_incluye_iva: [false]
    });

    // Trabajo Form
    this.trabajoForm = this.fb.group({
      dias_gracia_credito: [30, [Validators.required, Validators.min(0)]],
      descuento_pronto_pago: [0, [Validators.min(0), Validators.max(100)]]
    });

    // Backup Form
    this.backupForm = this.fb.group({
      backup_automatico: [false],
      frecuencia_backup: ['diario', [Validators.required]],
      ruta_backup: ['./backups', [Validators.required]],
      mantener_backups: [7, [Validators.required, Validators.min(1)]]
    });

    // Inventario Form
    this.inventarioForm = this.fb.group({
      mostrar_costo_unitario: [true],
      mostrar_costo_paquete: [true],
      mostrar_costo_compra: [true],
      mostrar_precios_adicionales: [true],
      mostrar_vencimiento: [true],
      mostrar_stock: [true]
    });

    // Watch for empresa_id changes
    this.generalForm.get('empresa_id')?.valueChanges.subscribe(id => {
      if (id) {
        const empresa = this.empresas.find(e => e.id == id);
        if (empresa) {
          this.selectedEmpresa = empresa;
          // Optional: Auto-fill legacy fields if needed
          this.generalForm.patchValue({
            nombre_empresa: empresa.nombre,
            email_empresa: empresa.email,
            telefono_empresa: empresa.telefono,
            direccion_empresa: empresa.direccion
          }, { emitEvent: false });
        }
      } else {
        this.selectedEmpresa = null;
      }
    });
  }

  loadEmpresas(): void {
    this.empresaService.getAll().subscribe({
      next: (response: any) => {
        this.empresas = Array.isArray(response) ? response : (response.data || []);
      },
      error: (err) => console.error('Error loading empresas:', err)
    });
  }

  loadMonedas(): void {
    this.monedaService.getAll().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.monedas = response;
        } else if (response && response.data) {
          this.monedas = response.data;
        } else {
          this.monedas = [];
        }
      },
      error: (err) => console.error('Error loading monedas:', err)
    });
  }

  changeTab(tab: ConfigTab): void {
    this.activeTab = tab;
  }

  loadConfig(): void {
    this.isLoading = true;

    this.configService.getAll().subscribe({
      next: (response: any) => {
        const configs = Array.isArray(response) ? response : (response.data || []);
        if (configs.length > 0) {
          const config = configs[0];

          // Patch forms
          this.generalForm.patchValue(config);
          this.preciosForm.patchValue(config);
          this.impuestosForm.patchValue(config);
          this.trabajoForm.patchValue(config);
          this.backupForm.patchValue(config);
          this.inventarioForm.patchValue(config);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading config:', err);
        this.isLoading = false;
      }
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedLogo = input.files[0];

      // Preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoPreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedLogo);
    }
  }

  saveConfig(): void {
    // Validar todos los formularios
    if (this.generalForm.invalid || this.preciosForm.invalid ||
      this.impuestosForm.invalid || this.trabajoForm.invalid ||
      this.backupForm.invalid || this.inventarioForm.invalid) {
      alert('Por favor complete todos los campos requeridos correctamente');
      return;
    }

    this.isSaving = true;

    // Combinar todos los valores
    const config: ConfiguracionTrabajo = {
      ...this.generalForm.value,
      ...this.preciosForm.value,
      ...this.impuestosForm.value,
      ...this.trabajoForm.value,
      ...this.backupForm.value,
      ...this.inventarioForm.value
    };

    console.log('Guardando configuración:', config);

    // Llamar al servicio para guardar la configuración
    this.configService.getAll().subscribe({
      next: (response: any) => {
        const configs = Array.isArray(response) ? response : (response.data || []);
        if (configs.length > 0) {
          const id = configs[0].id;
          this.configService.update(id, config).subscribe({
            next: () => {
              this.isSaving = false;
              alert('Configuración guardada exitosamente');
            },
            error: (err: any) => {
              this.isSaving = false;
              console.error('Error al actualizar configuración:', err);
              alert('Error al guardar la configuración');
            }
          });
        } else {
          this.configService.create(config).subscribe({
            next: () => {
              this.isSaving = false;
              alert('Configuración creada exitosamente');
            },
            error: (err: any) => {
              this.isSaving = false;
              console.error('Error al crear configuración:', err);
              alert('Error al guardar la configuración');
            }
          });
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        console.error('Error al obtener configuraciones:', err);
        // Intentar crear si falla la obtención (por ejemplo, si está vacía)
        this.configService.create(config).subscribe({
          next: () => {
            alert('Configuración creada exitosamente');
          },
          error: (createErr: any) => {
            console.error('Error al crear configuración (fallback):', createErr);
            alert('Error al guardar la configuración');
          }
        });
      }
    });
  }

  resetToDefaults(): void {
    if (!confirm('¿Está seguro de restaurar la configuración a valores por defecto?')) {
      return;
    }

    this.initForms();
    this.selectedLogo = null;
    this.logoPreview = null;
  }

  // Empresa Form Handling
  openEmpresaForm(): void {
    this.showEmpresaForm = true;
  }

  closeEmpresaForm(): void {
    this.showEmpresaForm = false;
  }

  onEmpresaSaved(empresa: Empresa): void {
    if (this.selectedEmpresa && this.selectedEmpresa.id) {
      // Update existing
      this.empresaService.update(this.selectedEmpresa.id, empresa).subscribe({
        next: (response: any) => {
          this.loadEmpresas();
          this.closeEmpresaForm();
          alert('Empresa actualizada correctamente');
        },
        error: (err) => {
          console.error('Error updating empresa:', err);
          alert('Error al actualizar empresa');
        }
      });
    } else {
      // Create new (should not happen if we only edit selected, but for robustness)
      this.empresaService.create(empresa).subscribe({
        next: (response: any) => {
          this.loadEmpresas();
          this.closeEmpresaForm();
          alert('Empresa creada correctamente');
        },
        error: (err) => {
          console.error('Error creating empresa:', err);
          alert('Error al crear empresa');
        }
      });
    }
  }

  // Moneda Logic
  openMonedaFormModal(): void {
    this.selectedMoneda = null;
    this.isMonedaFormModalOpen = true;
    this.limpiarMonedaMensajes();
  }

  closeMonedaFormModal(): void {
    this.isMonedaFormModalOpen = false;
    this.selectedMoneda = null;
    this.limpiarMonedaMensajes();
  }

  onEditMoneda(moneda: Moneda): void {
    this.selectedMoneda = moneda;
    this.isMonedaFormModalOpen = true;
    this.limpiarMonedaMensajes();
  }

  onSaveMoneda(monedaData: Moneda): void {
    this.isLoading = true;
    const operacion = this.selectedMoneda && this.selectedMoneda.id
      ? this.monedaService.update(this.selectedMoneda.id, monedaData)
      : this.monedaService.create(monedaData);

    operacion
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          this.mostrarMonedaExito(
            this.selectedMoneda
              ? 'Moneda actualizada exitosamente'
              : 'Moneda creada exitosamente'
          );
          this.loadMonedas();
          this.closeMonedaFormModal();
        },
        error: (error) => {
          console.error('Error al guardar moneda:', error);
          this.mostrarMonedaError('Error al guardar la moneda');
        }
      });
  }

  onDeleteMoneda(moneda: Moneda): void {
    if (!confirm(`¿Está seguro de que desea eliminar la moneda "${moneda.nombre}"?`)) {
      return;
    }

    this.isLoading = true;
    this.monedaService.delete(moneda.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.mostrarMonedaExito('Moneda eliminada exitosamente');
          this.loadMonedas();
        },
        error: (error) => {
          console.error('Error al eliminar moneda:', error);
          this.mostrarMonedaError('Error al eliminar la moneda');
        }
      });
  }

  onUpdateTipoCambio(moneda: Moneda): void {
    this.monedaSeleccionada = moneda;
    this.isTipoCambioModalOpen = true;
    this.limpiarMonedaMensajes();
  }

  closeTipoCambioModal(): void {
    this.isTipoCambioModalOpen = false;
    this.monedaSeleccionada = null;
  }

  onSaveTipoCambio(nuevoTipoCambio: number): void {
    if (!this.monedaSeleccionada || !nuevoTipoCambio || nuevoTipoCambio <= 0) {
      this.mostrarMonedaError('El tipo de cambio debe ser mayor a 0');
      return;
    }

    this.actualizarTipoCambio(this.monedaSeleccionada, nuevoTipoCambio);
    this.closeTipoCambioModal();
  }

  actualizarTipoCambio(moneda: Moneda, nuevoTipoCambio: number): void {
    this.isLoading = true;
    this.monedaService.update(moneda.id, { tipo_cambio: nuevoTipoCambio })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.mostrarMonedaExito('Tipo de cambio actualizado exitosamente');
          this.loadMonedas();
        },
        error: (error) => {
          console.error('Error al actualizar tipo de cambio:', error);
          this.mostrarMonedaError('Error al actualizar el tipo de cambio');
        }
      });
  }

  mostrarMonedaError(mensaje: string): void {
    this.monedaErrorMessage = mensaje;
    setTimeout(() => this.monedaErrorMessage = '', 5000);
  }

  mostrarMonedaExito(mensaje: string): void {
    this.monedaSuccessMessage = mensaje;
    setTimeout(() => this.monedaSuccessMessage = '', 5000);
  }

  limpiarMonedaMensajes(): void {
    this.monedaErrorMessage = '';
    this.monedaSuccessMessage = '';
  }
}
