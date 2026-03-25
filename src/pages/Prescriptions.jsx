import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowRight, Filter } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import moment from "moment";

export default function Prescriptions() {
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
    const matchesSearch = !search ||
      p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.protocol_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.prescribing_doctor?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.validation_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Prescripciones</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente, protocolo o médico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pendiente">Pendiente</SelectItem>
            <SelectItem value="Validada">Validada</SelectItem>
            <SelectItem value="Rechazada">Rechazada</SelectItem>
            <SelectItem value="Ajustada">Ajustada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No se encontraron prescripciones
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Paciente</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Protocolo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Médico</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ciclo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rx => (
                  <tr key={rx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{rx.patient_name}</td>
                    <td className="px-6 py-4 text-sm">{rx.protocol_name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{rx.prescribing_doctor}</td>
                    <td className="px-6 py-4 text-sm font-mono">C{rx.cycle_number} D{rx.day_of_cycle}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {rx.prescription_date ? moment(rx.prescription_date).format("DD/MM/YYYY") : moment(rx.created_date).format("DD/MM/YYYY")}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={rx.validation_status || "Pendiente"} /></td>
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