import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FlaskConical, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { CHEMO_PROTOCOLS } from "@/lib/chemoProtocols";

// Build a lookup map: normalized drug name -> protocol drug info (vial_size, vial_unit)
const PROTOCOL_VIAL_MAP = (() => {
  const map = {};
  Object.values(CHEMO_PROTOCOLS).forEach(proto => {
    proto.drugs.forEach(d => {
      const key = d.drug_name.toLowerCase();
      if (!map[key]) map[key] = d;
    });
  });
  return map;
})();

function getVialInfo(drugName, medications) {
  // 1. Try inventory (medication entity) - match by name (case-insensitive, partial)
  const nameLower = drugName.toLowerCase();
  const invMatch = medications.find(m =>
    m.drug_name?.toLowerCase() === nameLower ||
    nameLower.includes(m.drug_name?.toLowerCase()) ||
    m.drug_name?.toLowerCase().includes(nameLower)
  );
  if (invMatch && invMatch.concentration && invMatch.vial_volume_ml) {
    // concentration is mg per vial (concentration * vial_volume_ml) or just concentration if unit is mg
    const vialSize = invMatch.concentration_unit === "mg/mL"
      ? invMatch.concentration * invMatch.vial_volume_ml
      : invMatch.concentration;
    return { vial_size: vialSize, vial_unit: invMatch.concentration_unit === "mg/mL" ? "mg" : invMatch.concentration_unit, source: "inventario" };
  }
  // 2. Fallback to protocol map
  const protoMatch = PROTOCOL_VIAL_MAP[nameLower];
  if (protoMatch?.vial_size) {
    return { vial_size: protoMatch.vial_size, vial_unit: protoMatch.vial_unit || "mg", source: "protocolo" };
  }
  return { vial_size: null, vial_unit: null, source: null };
}

function calcVials(drugs, medications) {
  const grouped = {};
  drugs.forEach(d => {
    const key = d.drug_name;
    if (!grouped[key]) grouped[key] = { ...d, total_prescribed: 0 };
    grouped[key].total_prescribed += d.prescribed_dose || 0;
  });
  return Object.values(grouped).map(drug => {
    const unit = drug.dose_unit || "mg";
    const vialInfo = getVialInfo(drug.drug_name, medications);
    const vialSize = vialInfo.vial_size;
    const vialUnit = vialInfo.vial_unit || unit;
    const frascos = vialSize ? Math.ceil(drug.total_prescribed / vialSize) : null;
    return { ...drug, unit, vial_size: vialSize, vial_unit: vialUnit, vial_source: vialInfo.source, frascos };
  });
}

export default function Frascos() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.Prescription.list("-created_date", 200),
      base44.entities.Medication.list("-received_date", 300),
    ]).then(([rxData, medData]) => {
      setPrescriptions(rxData);
      setMedications(medData);
      setLoading(false);
    });
  }, []);

  const uniqueMap = new Map();
  prescriptions.forEach(p => { if (!uniqueMap.has(p.id)) uniqueMap.set(p.id, p); });
  const filtered = Array.from(uniqueMap.values()).filter(p =>
    !search ||
    p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.protocol_name?.toLowerCase().includes(search.toLowerCase())
  );

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
            const vials = calcVials(rx.drugs || [], medications);
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
                            <td className="px-5 py-3 text-sm font-mono">{drug.total_prescribed?.toFixed(2)} {drug.unit}</td>
                            <td className="px-5 py-3 text-sm">{drug.solution_type || drug.diluent || "—"}</td>
                            <td className="px-5 py-3 text-sm">{drug.container_material || "—"}</td>
                            <td className="px-5 py-3 text-sm font-mono">
                              {drug.vial_size ? (
                                <span>
                                  {drug.vial_size} {drug.vial_unit}
                                  {drug.vial_source && <span className="ml-1 text-xs text-muted-foreground">({drug.vial_source})</span>}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">No definido</span>
                              )}
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