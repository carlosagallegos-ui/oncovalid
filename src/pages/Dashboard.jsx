import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ClipboardList, CheckCircle, Clock, XCircle, AlertTriangle, FilePlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import moment from "moment";

export default function Dashboard() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Prescription.list("-created_date", 50).then(data => {
      setPrescriptions(data);
      setLoading(false);
    });
  }, []);

  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter(p => p.validation_status === "Pendiente").length,
    validated: prescriptions.filter(p => p.validation_status === "Validada").length,
    rejected: prescriptions.filter(p => p.validation_status === "Rechazada").length,
  };

  const recent = prescriptions.slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de Validación</h1>
          <p className="text-muted-foreground text-sm mt-1">Centro de Mezclas Oncológicas</p>
        </div>
        <Link to="/nueva-prescripcion">
          <Button className="gap-2 shadow-sm">
            <FilePlus className="h-4 w-4" />
            Nueva Prescripción
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: ClipboardList, color: "text-foreground", bg: "bg-muted" },
          { label: "Pendientes", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Validadas", value: stats.validated, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Rechazadas", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Prescriptions */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Prescripciones Recientes</h2>
          <Link to="/prescripciones" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay prescripciones aún</p>
            <Link to="/nueva-prescripcion">
              <Button variant="outline" className="mt-4 gap-2">
                <FilePlus className="h-4 w-4" />
                Crear primera prescripción
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Paciente</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Protocolo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ciclo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map(rx => (
                  <tr key={rx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{rx.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{rx.prescribing_doctor}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">{rx.protocol_name}</td>
                    <td className="px-6 py-4 text-sm font-mono">C{rx.cycle_number} D{rx.day_of_cycle}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {rx.prescription_date ? moment(rx.prescription_date).format("DD/MM/YYYY") : moment(rx.created_date).format("DD/MM/YYYY")}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rx.validation_status || "Pendiente"} />
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/prescripcion/${rx.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          Ver <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}