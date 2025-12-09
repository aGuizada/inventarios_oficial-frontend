import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'perfil',
                loadComponent: () => import('./components/user/perfil/perfil.component').then(m => m.PerfilComponent)
            },
            // Inventory
            {
                path: 'inventario',
                children: [
                    { path: 'articulos', loadComponent: () => import('./components/inventory/articulos/articulos.component').then(m => m.ArticulosComponent) },
                    { path: 'catalogos', loadComponent: () => import('./components/inventory/catalogos/catalogos.component').then(m => m.CatalogosComponent) },
                    { path: 'categorias', loadComponent: () => import('./components/inventory/categorias/categorias.component').then(m => m.CategoriasComponent) },
                    { path: 'marcas', loadComponent: () => import('./components/inventory/marcas/marcas.component').then(m => m.MarcasComponent) },
                    { path: 'medidas', loadComponent: () => import('./components/inventory/medidas/medidas.component').then(m => m.MedidasComponent) },
                    { path: 'industrias', loadComponent: () => import('./components/inventory/industrias/industrias.component').then(m => m.IndustriasComponent) },
                    { path: 'stock', loadComponent: () => import('./components/inventory/inventario/inventario.component').then(m => m.InventarioComponent) }
                ]
            },
            // Sales
            {
                path: 'ventas',
                children: [
                    { path: 'nueva', loadComponent: () => import('./components/sales/ventas/ventas.component').then(m => m.VentasComponent) },
                    { path: 'historial', loadComponent: () => import('./components/sales/ventas/ventas.component').then(m => m.VentasComponent) }, // Reuse for now or create list component
                    { path: 'cotizaciones', loadComponent: () => import('./components/sales/cotizaciones/cotizaciones.component').then(m => m.CotizacionesComponent) },
                    { path: 'creditos', loadComponent: () => import('./components/sales/creditos/creditos.component').then(m => m.CreditosComponent) }
                ]
            },
            // Purchases
            {
                path: 'compras',
                children: [
                    { path: 'nueva', loadComponent: () => import('./components/purchases/compras/compras.component').then(m => m.ComprasComponent) },
                    { path: 'historial', loadComponent: () => import('./components/purchases/compras/compras.component').then(m => m.ComprasComponent) }, // Reuse
                    { path: 'proveedores', loadComponent: () => import('./components/purchases/proveedores/proveedores.component').then(m => m.ProveedoresComponent) }
                ]
            },
            // Financial
            {
                path: 'finanzas',
                children: [
                    { path: 'cajas', loadComponent: () => import('./components/financial/cajas/cajas.component').then(m => m.CajasComponent) }
                ]
            },
            // Operations
            {
                path: 'operaciones',
                children: [
                    { path: 'traspasos', loadComponent: () => import('./components/operations/traspasos/traspasos.component').then(m => m.TraspasosComponent) },
                    { path: 'precios', loadComponent: () => import('./components/operations/precios/precios.component').then(m => m.PreciosComponent) },
                    { path: 'monedas', loadComponent: () => import('./components/operations/monedas/monedas.component').then(m => m.MonedasComponent) }
                ]
            },
            // Config
            {
                path: 'config',
                children: [
                    { path: 'sistema', loadComponent: () => import('./components/config/configuracion-sistema/configuracion-sistema.component').then(m => m.ConfiguracionSistemaComponent) },
                    { path: 'usuarios', loadComponent: () => import('./components/config/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
                    { path: 'roles', loadComponent: () => import('./components/config/roles/roles.component').then(m => m.RolesComponent) },
                    { path: 'sucursales', loadComponent: () => import('./components/config/sucursales/sucursales.component').then(m => m.SucursalesComponent) },
                    { path: 'almacenes', loadComponent: () => import('./components/config/almacenes/almacenes.component').then(m => m.AlmacenesComponent) },
                    { path: 'empresa', loadComponent: () => import('./components/config/empresas/empresas.component').then(m => m.EmpresasComponent) },
                    { path: 'clientes', loadComponent: () => import('./components/config/clientes/clientes.component').then(m => m.ClientesComponent) }
                ]
            }
        ]
    },
    { path: '**', redirectTo: 'login' }
];
