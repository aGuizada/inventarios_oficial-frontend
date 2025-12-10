import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProveedorService } from '../../../../services/proveedor.service';
import * as XLSX from 'xlsx';

interface PreviewData {
    nombre: string;
    telefono?: string;
    email?: string;
    nit?: string;
    direccion?: string;
    tipo_proveedor?: string;
    estado: number;
}

@Component({
    selector: 'app-proveedor-import',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './proveedor-import.component.html'
})
export class ProveedorImportComponent {
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

    constructor(private proveedorService: ProveedorService) { }

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
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                // Mapear a formato esperado - convertir todo a string para evitar problemas de tipo
                this.previewData = jsonData.map((row: any) => ({
                    nombre: String(row['nombre'] || ''),
                    telefono: row['telefono'] ? String(row['telefono']) : '',
                    email: row['email'] ? String(row['email']) : '',
                    nit: row['nit'] ? String(row['nit']) : '',
                    direccion: row['direccion'] ? String(row['direccion']) : '',
                    tipo_proveedor: row['tipo_proveedor'] ? String(row['tipo_proveedor']) : '',
                    estado: row['estado'] !== undefined ? Number(row['estado']) : 1
                }));

            } catch (error) {
                console.error('Error leyendo archivo Excel:', error);
                alert('Error al leer el archivo Excel. Verifica que el formato sea correcto.');
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
    downloadTemplate(): void {
        this.proveedorService.downloadTemplate().subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'plantilla_proveedores.xlsx';
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (error) => {
                console.error('Error descargando plantilla', error);
                alert('Error al descargar la plantilla');
            }
        });
    }

    // Import confirmation
    confirmImport(): void {
        if (!this.selectedFile) return;

        this.currentStep = 3;
        this.isImporting = true;
        this.importProgress = 0;

        this.proveedorService.importFromExcel(this.selectedFile).subscribe({
            next: (response: any) => {
                this.importProgress = 100;
                this.isImporting = false;
                this.importMessage = response.message || 'Importación exitosa';
                this.importErrors = response.data?.errores || [];

                if (this.importErrors.length === 0) {
                    setTimeout(() => {
                        this.importSuccess.emit();
                        this.closeImportModal();
                    }, 1500);
                }
            },
            error: (error: any) => {
                this.isImporting = false;
                this.importMessage = 'Error al importar el archivo';
                this.importErrors = error.error?.errors || [];
                console.error('Error en importación', error);
            }
        });
    }
}
