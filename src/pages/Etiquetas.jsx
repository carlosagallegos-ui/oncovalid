import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Printer, Tag, Thermometer, Clock } from "lucide-react";
import { formatDate, folioPrefix } from "@/lib/dateUtils";
import { getDrugStability } from "@/lib/drugStability";

function buildFolios(prescriptions) {
  const byDay = {};
  prescriptions.forEach(rx => {
    const dateKey = (rx.prescription_date || rx.created_date || "").slice(0, 10);
    if (!byDay[dateKey]) byDay[dateKey] = [];
    (rx.drugs || []).forEach(drug => {
      byDay[dateKey].push({ rx, drug });
    });
  });
  const folioMap = {};
  Object.entries(byDay).forEach(([dateKey, entries]) => {
    const prefix = folioPrefix(dateKey);
    entries.forEach((entry, idx) => {
      const key = `${entry.rx.id}-${entry.drug.drug_name}`;
      folioMap[key] = `${prefix}${String(idx + 1).padStart(4, "0")}`;
    });
  });
  return folioMap;
}

export default function Etiquetas() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [folioMap, setFolioMap] = useState({});

  useEffect(() => {
    Promise.all([
      base44.entities.Prescription.list("-prescription_date", 200),
      base44.entities.Medication.list("-created_date", 200),
    ]).then(([rxs, meds]) => {
      setPrescriptions(rxs);
      setMedications(meds);
      setFolioMap(buildFolios(rxs));
      setLoading(false);
    });
  }, []);

  function getMedInfo(drugName) {
    if (!drugName) return null;
    return medications.find(m =>
      m.drug_name?.toLowerCase().includes(drugName.toLowerCase()) ||
      drugName.toLowerCase().includes(m.drug_name?.toLowerCase())
    );
  }

  const allLabels = [];
  prescriptions.forEach(rx => {
    (rx.drugs || []).forEach(drug => {
      const key = `${rx.id}-${drug.drug_name}`;
      const stability = getDrugStability(drug.drug_name);
      const medInfo = getMedInfo(drug.drug_name);
      allLabels.push({ rx, drug, folio: folioMap[key] || "—", stability, medInfo });
    });
  });

  const filtered = allLabels.filter(({ rx, drug }) =>
    !search ||
    rx.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    drug.drug_name?.toLowerCase().includes(search.toLowerCase()) ||
    rx.protocol_name?.toLowerCase().includes(search.toLowerCase())
  );

  const printLabels = (labels) => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Etiquetas de Mezclas</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; }
        .page { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; }
        .label {
          width: 9cm; min-height: 6cm;
          border: 1.5px solid #333; border-radius: 6px;
          padding: 10px 12px;
          page-break-inside: avoid;
          display: flex; flex-direction: column; gap: 3px;
        }
        .folio { font-size: 10px; color: #555; text-align: right; font-family: monospace; }
        .drug { font-size: 16px; font-weight: bold; color: #000; margin: 3px 0 1px; }
        .dose { font-size: 14px; font-weight: bold; color: #0369a1; }
        .row { font-size: 11px; color: #333; margin-top: 2px; }
        .row b { font-weight: bold; }
        .divider { border: none; border-top: 1px solid #ddd; margin: 5px 0; }
        .patient { font-size: 12px; font-weight: bold; }
        .sub { font-size: 10px; color: #555; }
        .stability-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 5px 7px; margin-top: 5px; }
        .stability-box .s-title { font-size: 9px; font-weight: bold; color: #166534; text-transform: uppercase; letter-spacing: .04em; }
        .stability-box .s-val { font-size: 11px; color: #15803d; margin-top: 1px; }
        .storage-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 5px 7px; margin-top: 4px; }
        .storage-box .s-title { font-size: 9px; font-weight: bold; color: #1e40af; text-transform: uppercase; letter-spacing: .04em; }
        .storage-box .s-val { font-size: 11px; color: #1d4ed8; margin-top: 1px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="page">
        ${labels.map(({ rx, drug, folio, stability, medInfo }) => `
          <div class="label">
            <div class="folio">Folio: ${folio}</div>
            <div class="drug">${drug.drug_name}</div>
            <div class="dose">${drug.prescribed_dose ?? drug.calculated_dose ?? "—"} ${drug.dose_unit || "mg"}</div>
            <div class="row">Vía: <b>${drug.route || "—"}</b> &nbsp;·&nbsp; Inf: <b>${drug.infusion_time || "—"}</b></div>
            <div class="row">Solución: <b>${drug.solution_type || drug.diluent || "—"}</b>${(drug.prescribed_volume || drug.volume_ml) ? ` <b>${drug.prescribed_volume || drug.volume_ml} mL</b>` : ""}</div>
            <div class="row">Recipiente: <b>${drug.container_material || "—"}</b></div>
            ${stability ? `
              <div class="stability-box">
                <div class="s-title">⏱ Vida útil de la mezcla</div>
                <div class="s-val">${stability.stability}</div>
              </div>
              <div class="storage-box">
                <div class="s-title">🌡 Condiciones de almacenamiento</div>
                <div class="s-val">${medInfo?.storage_conditions ? medInfo.storage_conditions + " / " : ""}${stability.storage}</div>
              </div>
            ` : (medInfo?.storage_conditions ? `
              <div class="storage-box">
                <div class="s-title">🌡 Condiciones de almacenamiento</div>
                <div class="s-val">${medInfo.storage_conditions}</div>
              </div>
            ` : "")}
            <hr class="divider"/>
            <div class="patient">${rx.patient_name}</div>
            <div class="sub">NSS: ${rx.patient_nss || "—"} &nbsp;·&nbsp; SCT: ${rx.patient_bsa?.toFixed(2) || "—"} m² &nbsp;·&nbsp; Peso: ${rx.patient_weight || "—"} kg</div>
            <div class="sub">${rx.protocol_name} &nbsp;·&nbsp; C${rx.cycle_number} D${rx.day_of_cycle}</div>
            <div class="sub">Médico: ${rx.prescribing_doctor} &nbsp;·&nbsp; Fecha: ${formatDate(rx.prescription_date || rx.created_date)}</div>
          </div>
        `).join("")}
      </div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Etiquetas de Mezclas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Una etiqueta por mezcla final · Incluye vida útil y condiciones de almacenamiento
          </p>
        </div>
        <Button className="gap-2" onClick={() => printLabels(filtered)}>
          <Printer className="h-4 w-4" /> Imprimir todas ({filtered.length})
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente, medicamento o protocolo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          No se encontraron mezclas
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ rx, drug, folio, stability, medInfo }, i) => (
            <div key={i} className="bg-white border-2 border-border rounded-xl p-4 space-y-2 hover:border-primary/40 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="font-bold text-sm">{drug.drug_name}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{folio}</span>
              </div>

              <p className="font-bold text-primary text-lg">
                {drug.prescribed_dose ?? drug.calculated_dose ?? "—"} {drug.dose_unit || "mg"}
              </p>

              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{drug.route} · {drug.infusion_time}</p>
                <p>{drug.solution_type || drug.diluent || "—"}{(drug.prescribed_volume || drug.volume_ml) ? ` · ${drug.prescribed_volume || drug.volume_ml} mL` : ""}</p>
                <p>{drug.container_material || "—"}</p>
              </div>

              {/* Stability & Storage */}
              {stability && (
                <div className="space-y-1.5">
                  <div className="flex items-start gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                    <Clock className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">Vida útil de la mezcla</p>
                      <p className="text-xs text-emerald-800">{stability.stability}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                    <Thermometer className="h-3 w-3 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wide">Almacenamiento</p>
                      <p className="text-xs text-blue-800">
                        {medInfo?.storage_conditions ? `${medInfo.storage_conditions} · ` : ""}{stability.storage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!stability && medInfo?.storage_conditions && (
                <div className="flex items-start gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                  <Thermometer className="h-3 w-3 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wide">Almacenamiento</p>
                    <p className="text-xs text-blue-800">{medInfo.storage_conditions}</p>
                  </div>
                </div>
              )}

              {/* Patient */}
              <div className="border-t border-border pt-2 space-y-0.5">
                <p className="font-semibold text-sm">{rx.patient_name}</p>
                <p className="text-xs text-muted-foreground">{rx.protocol_name} · C{rx.cycle_number}D{rx.day_of_cycle}</p>
                <p className="text-xs text-muted-foreground">{formatDate(rx.prescription_date || rx.created_date)}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 mt-1"
                onClick={() => printLabels([{ rx, drug, folio, stability, medInfo }])}
              >
                <Printer className="h-3 w-3" /> Imprimir esta etiqueta
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}