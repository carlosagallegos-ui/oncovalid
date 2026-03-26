import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/dateUtils";

export default function EstadoPrescripciones() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    base44.entities.Prescription.list("-created_date", 200).then(data => {
      setPrescriptions(data);
      setLoading(false);
    });
  }, []);

  const filtered = prescriptions.filter(p => {
    const matchSearch = !search ||
      p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.protocol_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.prescribing_doctor?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.validation_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter(p => p.validation_status === "Pendiente").length,
    validated: prescriptions.filter(p => p.validation_status === "Validada").length,
    rejected: prescriptions.filter(p => p.validation_status === "Rechazada").length,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estado de Prescripciones</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen y seguimiento de todas las prescripciones</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: AlertTriangle, color: "text-foreground", bg: "bg-muted" },
          { label: "Pendientes", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Validadas", value: stats.validated, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Rechazadas", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente, médico o protocolo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "Pendiente", "Validada", "Rechazada"].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs"
            >
              {status === "all" ? "Todos" : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No hay prescripciones que coincidan con los filtros
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Paciente", "Médico", "Protocolo", "Ciclo", "Medicamentos", "Fecha", "Estado", "Validado Por"].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(rx => (
                  <tr key={rx.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{rx.patient_name}</p>
                      {rx.patient_nss && <p className="text-xs text-muted-foreground">{rx.patient_nss}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{rx.prescribing_doctor}</td>
                    <td className="px-6 py-4 text-sm font-medium">{rx.protocol_name}</td>
                    <td className="px-6 py-4 text-sm font-mono">C{rx.cycle_number} D{rx.day_of_cycle}</td>
                    <td className="px-6 py-4 text-sm">{rx.drugs?.length || 0} medicamentos</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(rx.prescription_date || rx.created_date)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rx.validation_status || "Pendiente"} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{rx.validated_by || "—"}</td>
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