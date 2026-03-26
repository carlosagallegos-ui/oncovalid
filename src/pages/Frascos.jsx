import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FlaskConical, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

function calcVials(drugs) {
  const grouped = {};
  drugs.forEach(d => {
    const key = d.drug_name;
    if (!grouped[key]) grouped[key] = { ...d, total_prescribed: 0 };
    grouped[key].total_prescribed += d.prescribed_dose || 0;
  });
  return Object.values(grouped).map(drug => {
    const vialSize = drug.vial_size || null;
    const unit = drug.vial_unit || drug.dose_unit || "mg";
    const frascos = vialSize ? Math.ceil(drug.total_prescribed / vialSize) : null;
    return { ...drug, unit, frascos };
  });
}

export default function Frascos() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");


  useEffect(() => {
    base44.entities.Prescription.list("-created_date", 200).then(data => {
      setPrescriptions(data);
      setLoading(false);
    });
  }, []);

  const seen = new Set();
  const filtered = prescriptions.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    const matchSearch = !search ||
      p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.protocol_name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Frascos por Mezcla</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen de frascos necesarios por prescripción</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente o protocolo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          No se encontraron prescripciones
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(rx => {
            const vials = calcVials(rx.drugs || []);
            return (
              <div key={rx.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{rx.patient_name}</p>
                    {rx.patient_nss && <p className="text-xs text-muted-foreground">NSS: {rx.patient_nss}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rx.protocol_name} · C{rx.cycle_number} D{rx.day_of_cycle} · {formatDate(rx.prescription_date || rx.created_date)}
                    </p>
                  </div>
                  <Link to={`/prescripcion/${rx.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      Ver prescripción <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>

                {/* Vials table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        {["Medicamento", "Vía", "Dosis Prescrita", "Tipo Solución", "Recipiente", "Tamaño Frasco", "Frascos", "Total Disponible"].map(h => (
                          <th key={h} className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vials.map((drug, i) => {
                        const totalDisp = drug.frascos !== null ? drug.frascos * drug.vial_size : null;
                        const sobrante = totalDisp !== null ? (totalDisp - drug.total_prescribed).toFixed(2) : null;
                        return (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/10">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <FlaskConical className="h-3.5 w-3.5 text-primary/60" />
                                <span className="text-sm font-medium">{drug.drug_name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-muted-foreground">{drug.route}</td>
                            <td className="px-5 py-3 text-sm">{drug.solution_type || drug.diluent || "—"}</td>
                            <td className="px-5 py-3 text-sm">{drug.container_material || "—"}</td>
                            <td className="px-5 py-3 text-sm font-mono">
                              {drug.vial_size
                                ? `${drug.vial_size} ${drug.unit}`
                                : <span className="text-muted-foreground text-xs">No definido</span>}
                            </td>
                            <td className="px-5 py-3">
                              {drug.frascos !== null ? (
                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold">
                                  {drug.frascos}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-sm">
                              {totalDisp !== null ? (
                                <div>
                                  <span className="font-mono font-medium">{totalDisp} {drug.unit}</span>
                                  {parseFloat(sobrante) > 0 && (
                                    <p className="text-xs text-muted-foreground">Sobrante: {sobrante} {drug.unit}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}