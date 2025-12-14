/**
 * Interfaces para filtros de fecha en el Dashboard
 */

/**
 * Filtro de fecha configurable
 * Soporta tres modos: rango de fechas, mes/año, o fecha específica
 */
export interface DateFilter {
    // Modo 1: Rango de fechas
    fecha_inicio?: string; // Formato: YYYY-MM-DD
    fecha_fin?: string;    // Formato: YYYY-MM-DD

    // Modo 2: Filtro por año, mes, día
    year?: number;         // Ej: 2025
    month?: number;        // 1-12
    day?: number;          // 1-31
    sucursal_id?: number;
}

/**
 * Datos de utilidad/ganancia por artículo
 */
export interface ArticuloUtilidad {
    articulo_id: number;
    codigo: string;
    nombre: string;

    // Métricas de ventas
    cantidad_vendida: number;
    total_ventas: number;

    // Métricas de costos
    costo_total: number;

    // Métricas de utilidad
    utilidad_bruta: number;
    margen_porcentaje: number;

    // Clasificación de rentabilidad
    rentabilidad: 'alta' | 'media' | 'baja' | 'muy_baja';

    // Datos opcionales del artículo
    categoria?: string;
    marca?: string;
}

/**
 * Respuesta del endpoint de utilidad de artículos
 */
export interface ArticuloUtilidadResponse {
    data: ArticuloUtilidad[];
    metadata?: {
        generated_at: string;
    };
}

/**
 * Modo de filtro de fecha
 */
export enum FilterMode {
    RANGE = 'range',           // Rango de fechas
    MONTH_YEAR = 'month_year', // Mes y año
    SPECIFIC_DATE = 'date',    // Fecha específica
}

/**
 * Estado del filtro de fecha
 */
export interface DateFilterState {
    mode: FilterMode;
    filters: DateFilter;
    isActive: boolean;
}
