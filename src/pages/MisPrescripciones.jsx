import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilePlus, Search, ArrowRight, ClipboardList } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/dateUtils";

export default function MisPrescripciones() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    base44.auth.me().then(user => {
      setUserEmail(user.email);
      base44.entities.Prescription.list("-created_date", 200).then(data => {
        // Filter prescriptions created by this user
        const mine = data.filter(p => p.created_by === user.email);
        setPrescriptions(mine);
        setLoading(false);
      });
    });
  }, []);

  const filtered = prescriptions.filter(p =>
    !search ||
    p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.protocol_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Prescripciones</h1>
          <p className="text-sm text-muted-foreground mt-1">Prescripciones que has enviado a la central de mezclas</p>
        </div>
        <Link to="/nueva-prescripcion">
          <Button className="gap-2">
            <FilePlus className="h-4 w-4" /> Nueva Prescripción
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar paciente o protocolo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No tienes prescripciones registradas</p>
            <Link to="/nueva-prescripcion">
              <Button variant="outline" className="mt-4 gap-2">
                <FilePlus className="h-4 w-4" /> Crear primera prescripción
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Paciente", "Protocolo", "Ciclo", "Fecha", "Estado", ""].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(rx => (
                  <tr key={rx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{rx.patient_name}</p>
                      {rx.patient_nss && <p className="text-xs text-muted-foreground">NSS: {rx.patient_nss}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm">{rx.protocol_name}</td>
                    <td className="px-6 py-4 text-sm font-mono">C{rx.cycle_number} D{rx.day_of_cycle}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(rx.prescription_date || rx.created_date)}</td>
                    <td className="px-6 py-4"><StatusBadge status={rx.validation_status || "Pendiente"} /></td>
                    <td className="px-6 py-4">
                      <Link to={`/prescripcion/${rx.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">Ver <ArrowRight className="h-3 w-3" /></Button>
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