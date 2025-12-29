import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioService } from '../../../services/inventario.service';
import * as XLSX from 'xlsx';

interface PreviewData {
  codigo_articulo: string;
  nombre_articulo: string;
  sucursal?: string;
  almacen: string;
  saldo_stock: number;
  cantidad: number;
  fecha_vencimiento?: string;
}

@Component({
  selector: 'app-inventario-importar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventario-importar.component.html',
  styleUrls: ['./inventario-importar.component.scss']
})
export class InventarioImportarComponent {
  @Output() importSuccess = new EventEmitter<void>();

  // Modal & Wizard state
  isModalOpen = false;
  currentStep = 1;

  // File handling
  selectedFile: File | null = null;
  isDragging = false;

  // Preview data
  previewData: PreviewData[] = [];
  previewPage = 1;
  previewPerPage = 10;

  // Import process
  isImporting = false;
  importProgress = 0;
  importMessage = '';
  importErrors: any[] = [];

  constructor(private inventarioService: InventarioService) { }

  // Modal controls
  openImportModal(): void {
    this.isModalOpen = true;
    this.resetWizard();
  }

  closeImportModal(): void {
    this.isModalOpen = false;
    this.resetWizard();
  }

  resetWizard(): void {
    this.currentStep = 1;
    this.selectedFile = null;
    this.previewData = [];
    this.previewPage = 1;
    this.importProgress = 0;
    this.importMessage = '';
    this.importErrors = [];
  }

  // Wizard navigation
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  canProceedToStep2(): boolean {
    return this.selectedFile !== null && this.previewData.length > 0;
  }

  // Drag & Drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      alert('Por favor seleccione un archivo Excel (.xlsx o .xls)');
      return;
    }

    this.selectedFile = file;
    this.readExcelFile(file);
  }

  readExcelFile(file: File): void {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Leer la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

        console.log('Datos leídos del Excel:', jsonData);
        console.log('Número de filas:', jsonData.length);

        // Función auxiliar para buscar columna (case-insensitive, sin espacios)
        const getColumnValue = (row: any, possibleNames: string[]): string => {
          for (const name of possibleNames) {
            // Buscar exacto
            if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
              return String(row[name]);
            }
            // Buscar case-insensitive
            const foundKey = Object.keys(row).find(
              key => key.toLowerCase().trim() === name.toLowerCase().trim()
            );
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
              return String(row[foundKey]);
            }
          }
          return '';
        };

        // Mapear a formato esperado
        this.previewData = jsonData
          .map((row: any) => {
            const codigo = getColumnValue(row, ['codigo_articulo', 'codigo', 'código', 'codigo articulo']);
            const nombre = getColumnValue(row, ['nombre_articulo', 'nombre', 'articulo', 'nombre articulo']);
            const sucursal = getColumnValue(row, ['sucursal']);
            const almacen = getColumnValue(row, ['almacen', 'almacén']);
            const saldoStock = getColumnValue(row, ['saldo_stock', 'saldo stock', 'stock', 'saldo']);
            const cantidad = getColumnValue(row, ['cantidad']);
            const fechaVencimiento = getColumnValue(row, ['fecha_vencimiento', 'fecha vencimiento', 'vencimiento']);

            return {
              codigo_articulo: codigo,
              nombre_articulo: nombre,
              sucursal: sucursal,
              almacen: almacen,
              saldo_stock: saldoStock ? Number(saldoStock) : 0,
              cantidad: cantidad ? Number(cantidad) : 0,
              fecha_vencimiento: fechaVencimiento
            };
          })
          .filter((row: PreviewData) => {
            // Filtrar filas vacías (debe tener al menos nombre_articulo y almacen)
            return row.nombre_articulo.trim() !== '' && row.almacen.trim() !== '';
          });

        console.log('Datos procesados:', this.previewData);
        console.log('Registros válidos:', this.previewData.length);

        if (this.previewData.length === 0) {
          alert('No se encontraron datos válidos en el archivo. Verifica que el archivo tenga las columnas correctas: nombre_articulo, almacen, saldo_stock, cantidad.');
        }

      } catch (error) {
        console.error('Error leyendo archivo Excel:', error);
        alert('Error al leer el archivo Excel. Verifica que el formato sea correcto.');
        this.previewData = [];
      }
    };

    reader.readAsArrayBuffer(file);
  }

  // Preview pagination
  get totalPreviewPages(): number {
    return Math.ceil(this.previewData.length / this.previewPerPage);
  }

  get previewPageData(): PreviewData[] {
    const start = (this.previewPage - 1) * this.previewPerPage;
    const end = start + this.previewPerPage;
    return this.previewData.slice(start, end);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPreviewPages) {
      this.previewPage = page;
    }
  }

  // Template download
  descargarPlantilla(): void {
    this.inventarioService.downloadTemplate();
  }

  // Import confirmation
  importarInventario(): void {
    if (!this.selectedFile) return;

    this.currentStep = 3;
    this.isImporting = true;
    this.importProgress = 0;

    this.inventarioService.importInventario(this.selectedFile).subscribe({
      next: (response: any) => {
        this.importProgress = 100;
        this.isImporting = false;
        this.importMessage = response.message || 'Importación exitosa';
        this.importErrors = response.errores || [];

        if (this.importErrors.length === 0 && response.filas_con_errores === 0) {
          setTimeout(() => {
            this.importSuccess.emit();
            this.closeImportModal();
          }, 1500);
        }
      },
      error: (error: any) => {
        this.isImporting = false;
        this.importMessage = error.error?.message || 'Error al importar el archivo';
        this.importErrors = error.error?.errores || [];
        console.error('Error en importación', error);
      }
    });
  }
}
