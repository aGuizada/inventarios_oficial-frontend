import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

type ConfigTab = 'general' | 'precios' | 'impuestos' | 'trabajo' | 'backup' | 'inventario';

interface ConfiguracionTrabajo {
  id?: number;
  // General
  moneda_id?: number;
  nombre_empresa?: string;
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
  imports: [CommonModule, ReactiveFormsModule],
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

  // Monedas disponibles
  monedas = [
    { id: 1, codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: '$' },
    { id: 2, codigo: 'MXN', nombre: 'Peso Mexicano', simbolo: '$' },
    { id: 3, codigo: 'EUR', nombre: 'Euro', simbolo: '€' },
    { id: 4, codigo: 'COP', nombre: 'Peso Colombiano', simbolo: '$' }
  ];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initForms();
    this.loadConfig();
  }

  initForms(): void {
    // General Form
    this.generalForm = this.fb.group({
      moneda_id: [1, [Validators.required]],
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
  }

  changeTab(tab: ConfigTab): void {
    this.activeTab = tab;
  }

  loadConfig(): void {
    this.isLoading = true;

    // TODO: Llamar al servicio para cargar configuración
    // Por ahora usamos valores por defecto
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
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

    // TODO: Implementar llamada al servicio
    setTimeout(() => {
      this.isSaving = false;
      alert('Configuración guardada exitosamente');
    }, 1000);
  }

  resetToDefaults(): void {
    if (!confirm('¿Está seguro de restaurar la configuración a valores por defecto?')) {
      return;
    }

    this.initForms();
    this.selectedLogo = null;
    this.logoPreview = null;
  }
}
