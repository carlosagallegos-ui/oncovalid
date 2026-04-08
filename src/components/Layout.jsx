import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FilePlus, ClipboardList, BookOpen, FlaskConical, LogOut, TestTube, Package, Users, Tag, Beaker, ArrowUpFromLine, BarChart3, Eye, User, Syringe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";

const ALL_NAV_ITEMS = [
  // Panel general
  { path: "/", label: "Panel", icon: LayoutDashboard, roles: ["admin", "jefe_centro", "validador", "coordinador", "encargado_preparacion", "preparador", "mesa_atencion", "encargado_calidad"] },

  // Médico
  { path: "/nueva-prescripcion", label: "Nueva Prescripción", icon: FilePlus, roles: ["admin", "jefe_centro", "medico"] },
  { path: "/mis-prescripciones", label: "Mis Prescripciones", icon: ClipboardList, roles: ["medico"] },

  // Validación
  { path: "/validacion-mezclas", label: "Validación de Mezclas", icon: TestTube, roles: ["admin", "jefe_centro", "validador", "encargado_calidad"] },
  { path: "/estado-prescripciones", label: "Estado de Prescripciones", icon: Eye, roles: ["admin", "jefe_centro", "validador", "coordinador", "encargado_calidad"] },

  // Coordinador / Encargado de Preparación
  { path: "/frascos", label: "Frascos por Mezcla", icon: TestTube, roles: ["admin", "jefe_centro", "coordinador", "encargado_preparacion"] },
  { path: "/preparacion", label: "Hojas de Preparación", icon: Beaker, roles: ["admin", "jefe_centro", "coordinador", "encargado_preparacion", "preparador"] },
  { path: "/medicamentos", label: "Medicamentos", icon: Package, roles: ["admin", "jefe_centro", "coordinador", "encargado_preparacion"] },

  // Mesa de atención / Encargado de calidad
  { path: "/salidas", label: "Salidas de Mezclas", icon: ArrowUpFromLine, roles: ["admin", "jefe_centro", "mesa_atencion", "encargado_calidad"] },
  { path: "/etiquetas", label: "Etiquetas de Mezclas", icon: Tag, roles: ["admin", "jefe_centro", "mesa_atencion", "encargado_calidad"] },

  // Enfermero - Aplicación de mezclas
  { path: "/aplicacion-mezclas", label: "Aplicación de Mezclas", icon: Syringe, roles: ["admin", "jefe_centro", "enfermero", "encargado_calidad"] },

  // Informes
  { path: "/informes", label: "Informes", icon: BarChart3, roles: ["admin", "jefe_centro", "validador", "coordinador", "encargado_preparacion", "encargado_calidad"] },

  // Compartidos
  { path: "/pacientes", label: "Pacientes", icon: Users, roles: ["admin", "jefe_centro", "validador", "medico", "coordinador", "encargado_preparacion", "encargado_calidad"] },
  { path: "/protocolos", label: "Protocolos", icon: BookOpen, roles: ["admin", "jefe_centro", "validador", "medico", "coordinador", "encargado_preparacion", "encargado_calidad"] },
  { path: "/usuarios", label: "Usuarios", icon: User, roles: ["admin", "jefe_centro"] },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserRole(u.role || "admin"));
  }, []);

  const navItems = ALL_NAV_ITEMS.filter(item => !userRole || item.roles.includes(userRole));

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight">Centro de Mezclas</h1>
              <p className="text-xs text-muted-foreground">Validación QT</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FlaskConical className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Centro de Mezclas</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          <div className="space-y-1.5">
            <div className="w-5 h-0.5 bg-foreground rounded"></div>
            <div className="w-5 h-0.5 bg-foreground rounded"></div>
            <div className="w-5 h-0.5 bg-foreground rounded"></div>
          </div>
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-card border-b border-border p-4 space-y-1" onClick={e => e.stopPropagation()}>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="lg:p-8 p-4 pt-20 lg:pt-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}