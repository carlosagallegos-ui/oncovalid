import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, FlaskConical, ArrowRight, Minus, Plus, PackageMinus, PackagePlus } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { CHEMO_PROTOCOLS } from "@/lib/chemoProtocols";

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
  const nameLower = drugName.toLowerCase();
  const invMatch = medications.find(m =>
    m.drug_name?.toLowerCase() === nameLower ||
    nameLower.includes(m.drug_name?.toLowerCase()) ||
    m.drug_name?.toLowerCase().includes(nameLower)
  );
  if (invMatch && invMatch.concentration && invMatch.vial_volume_ml) {
    const vialSize = invMatch.concentration_unit === "mg/mL"
      ? invMatch.concentration * invMatch.vial_volume_ml
      : invMatch.concentration;
    return { vial_size: vialSize, vial_unit: invMatch.concentration_unit === "mg/mL" ? "mg" : invMatch.concentration_unit, source: "inventario" };
  }
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
  // { [rxId-drugName]: count }
  const [toDispense, setToDispense] = useState({});
  const [dispensed, setDispensed] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [rxData, medData] = await Promise.all([
      base44.entities.Prescription.list("-created_date", 200),
      base44.entities.Medication.list("-received_date", 300),
    ]);
    setPrescriptions(rxData);
    setMedications(medData);
    setLoading(false);
  };

  const getTotalAvailable = (drugName) => {
    const name = drugName.toLowerCase();
    return medications
      .filter(m => m.drug_name?.toLowerCase().includes(name) && m.status === "Disponible" && (m.quantity_available ?? 0) > 0)
      .reduce((s, m) => s + (m.quantity_available ?? 0), 0);
  };

  const handleDispense = async (rxId, drugName, count) => {
    if (count <= 0) return;
    setProcessing(true);
    const name = drugName.toLowerCase();
    const meds = medications
      .filter(m => m.drug_name?.toLowerCase().includes(name) && m.status === "Disponible" && (m.quantity_available ?? 0) > 0)
      .sort((a, b) => (a.expiration_date || "") > (b.expiration_date || "") ? 1 : -1);
    let remaining = count;
    for (const med of meds) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, med.quantity_available ?? 0);
      await base44.entities.Medication.update(med.id, { quantity_available: (med.quantity_available ?? 0) - take });
      remaining -= take;
    }
    await loadData();
    const key = `${rxId}-${drugName}`;
    setDispensed(prev => ({ ...prev, [key]: (prev[key] || 0) + count }));
    setProcessing(false);
  };

  const handleReturn = async (rxId, drugName, count) => {
    if (count <= 0) return;
    setProcessing(true);
    const name = drugName.toLowerCase();
    const allMeds = medications.filter(m => m.drug_name?.toLowerCase().includes(name));
    const target = allMeds[0];
    if (target) {
      await base44.entities.Medication.update(target.id, {
        quantity_available: (target.quantity_available ?? 0) + count,
        status: "Disponible"
      });
    }
    await loadData();
    const key = `${rxId}-${drugName}`;
    setDispensed(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - count) }));
    setProcessing(false);
  };

  const setCount = (rxId, drugName, val) => {
    const key = `${rxId}-${drugName}`;
    setToDispense(prev => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const getCount = (rxId, drugName, suggested) => {
    const key = `${rxId}-${drugName}`;
    return toDispense[key] ?? suggested ?? 0;
  };

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
        <p className="text-sm text-muted-foreground mt-1">Resumen de frascos necesarios y movimiento de inventario</p>
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

                {/* Drugs */}
                <div className="divide-y divide-border">
                  {vials.map((drug, i) => {
                    const totalDisp = drug.frascos !== null ? drug.frascos * drug.vial_size : null;
                    const sobrante = totalDisp !== null ? (totalDisp - drug.total_prescribed).toFixed(2) : null;
                    const available = getTotalAvailable(drug.drug_name);
                    const count = getCount(rx.id, drug.drug_name, drug.frascos);
                    const alreadyDispensed = dispensed[`${rx.id}-${drug.drug_name}`] || 0;
                    const hasStock = available >= count;

                    return (
                      <div key={i} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Drug info */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <FlaskConical className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                            <span className="text-sm font-semibold">{drug.drug_name}</span>
                            <span className="text-xs text-muted-foreground">· {drug.route}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            Dosis: {drug.total_prescribed?.toFixed(2)} {drug.unit}
                            {drug.vial_size ? ` · Frasco: ${drug.vial_size} ${drug.vial_unit}` : ""}
                            {drug.solution_type || drug.diluent ? ` · ${drug.solution_type || drug.diluent}` : ""}
                          </p>
                          {sobrante && parseFloat(sobrante) > 0 && (
                            <p className="text-xs text-muted-foreground">Sobrante: {sobrante} {drug.unit}</p>
                          )}
                        </div>

                        {/* Frascos counter + actions */}
                        <div className="flex flex-wrap items-end gap-3">
                          {/* Stock badge */}
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-muted-foreground">Inventario</span>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              available > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}>
                              {available} frascos
                            </span>
                          </div>

                          {/* Quantity editor */}
                          <div className="space-y-1">
                            <Label className="text-xs">A surtir</Label>
                            <div className="flex items-center gap-1">
                              <button
                                className="w-7 h-7 rounded border border-border bg-muted hover:bg-muted/80 flex items-center justify-center"
                                onClick={() => setCount(rx.id, drug.drug_name, count - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <Input
                                type="number"
                                min={0}
                                value={count}
                                onChange={e => setCount(rx.id, drug.drug_name, parseInt(e.target.value) || 0)}
                                className="w-14 text-center font-mono h-7 text-sm"
                              />
                              <button
                                className="w-7 h-7 rounded border border-border bg-muted hover:bg-muted/80 flex items-center justify-center"
                                onClick={() => setCount(rx.id, drug.drug_name, count + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            {!hasStock && count > 0 && (
                              <p className="text-xs text-red-600">Stock insuficiente</p>
                            )}
                          </div>

                          {/* Surtir */}
                          <Button
                            size="sm"
                            className="gap-1.5 h-7 text-xs"
                            disabled={processing || count <= 0 || !hasStock}
                            onClick={() => handleDispense(rx.id, drug.drug_name, count)}
                          >
                            <PackageMinus className="h-3.5 w-3.5" />
                            Surtir
                          </Button>

                          {/* Regresar */}
                          {alreadyDispensed > 0 && (
                            <div className="space-y-1">
                              <Label className="text-xs">Surtidos: {alreadyDispensed}</Label>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                disabled={processing}
                                onClick={() => handleReturn(rx.id, drug.drug_name, 1)}
                              >
                                <PackagePlus className="h-3.5 w-3.5" />
                                Regresar 1
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}