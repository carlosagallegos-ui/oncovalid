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
          width: 10cm; height: 5cm;
          border: 1.5px solid #333; border-radius: 6px;
          padding: 8px 10px;
          page-break-inside: avoid;
          display: flex; flex-direction: row; gap: 0;
          overflow: hidden;
        }
        .folio { font-size: 9px; color: #555; font-family: monospace; }
        .drug { font-size: 13px; font-weight: bold; color: #000; margin: 2px 0 1px; }
        .dose { font-size: 12px; font-weight: bold; color: #0369a1; }
        .row { font-size: 10px; color: #333; margin-top: 1px; }
        .row b { font-weight: bold; }
        .vdivider { border: none; border-left: 1px solid #ddd; margin: 0 8px; }
        .patient { font-size: 11px; font-weight: bold; }
        .sub { font-size: 9px; color: #555; margin-top: 1px; }
        .col-left { flex: 1.1; display: flex; flex-direction: column; justify-content: space-between; }
        .col-right { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .stability-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 3px; padding: 3px 5px; margin-top: 3px; }
        .stability-box .s-title { font-size: 8px; font-weight: bold; color: #166534; text-transform: uppercase; }
        .stability-box .s-val { font-size: 9px; color: #15803d; }
        .storage-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 3px; padding: 3px 5px; margin-top: 3px; }
        .storage-box .s-title { font-size: 8px; font-weight: bold; color: #1e40af; text-transform: uppercase; }
        .storage-box .s-val { font-size: 9px; color: #1d4ed8; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <div class="page">
        ${labels.map(({ rx, drug, folio, stability, medInfo }) => `
          <div class="label">
            <div class="col-left">
              <div>
                <div class="folio">Folio: ${folio}</div>
                <div class="drug">${drug.drug_name}</div>
                <div class="dose">${drug.prescribed_dose ?? drug.calculated_dose ?? "—"} ${drug.dose_unit || "mg"}</div>
                <div class="row">Vía: <b>${drug.route || "—"}</b></div>
                <div class="row">Inf: <b>${drug.infusion_time || "—"}</b></div>
                <div class="row">Solución: <b>${drug.solution_type || drug.diluent || "—"}</b>${(drug.prescribed_volume || drug.volume_ml) ? ` <b>${drug.prescribed_volume || drug.volume_ml} mL</b>` : ""}</div>
                <div class="row">Recipiente: <b>${drug.container_material || "—"}</b></div>
              </div>
              <div>
                ${stability ? `
                  <div class="stability-box">
                    <div class="s-title">⏱ Vida útil</div>
                    <div class="s-val">${stability.stability}</div>
                  </div>
                  <div class="storage-box">
                    <div class="s-title">🌡 Almacenamiento</div>
                    <div class="s-val">${medInfo?.storage_conditions ? medInfo.storage_conditions + " / " : ""}${stability.storage}</div>
                  </div>
                ` : (medInfo?.storage_conditions ? `
                  <div class="storage-box">
                    <div class="s-title">🌡 Almacenamiento</div>
                    <div class="s-val">${medInfo.storage_conditions}</div>
                  </div>
                ` : "")}
              </div>
            </div>
            <div class="vdivider"></div>
            <div class="col-right">
              <div>
                <div class="patient">${rx.patient_name}</div>
                <div class="sub">NSS: ${rx.patient_nss || "—"}</div>
                <div class="sub">SCT: ${rx.patient_bsa?.toFixed(2) || "—"} m² &nbsp;·&nbsp; Peso: ${rx.patient_weight || "—"} kg</div>
              </div>
              <div>
                <div class="sub">${rx.protocol_name}</div>
                <div class="sub">C${rx.cycle_number} D${rx.day_of_cycle}</div>
                <div class="sub">Médico: ${rx.prescribing_doctor}</div>
                <div class="sub">Fecha: ${formatDate(rx.prescription_date || rx.created_date)}</div>
              </div>
            </div>
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
        <div className="flex flex-wrap gap-4">
          {filtered.map(({ rx, drug, folio, stability, medInfo }, i) => (
            <div key={i} className="bg-white border-2 border-border rounded-xl hover:border-primary/40 transition-colors flex flex-col" style={{width:'10cm', minHeight:'5cm'}}>
              {/* Label body: horizontal layout */}
              <div className="flex flex-1 gap-0 p-3">
                {/* Left col: drug info + stability */}
                <div className="flex flex-col justify-between" style={{flex:'1.1'}}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-primary shrink-0" />
                      <span className="font-bold text-xs">{drug.drug_name}</span>
                    </div>
                    <p className="font-bold text-primary">{drug.prescribed_dose ?? drug.calculated_dose ?? "—"} {drug.dose_unit || "mg"}</p>
                    <p className="text-[10px] text-muted-foreground">{drug.route} · {drug.infusion_time}</p>
                    <p className="text-[10px] text-muted-foreground">{drug.solution_type || drug.diluent || "—"}{(drug.prescribed_volume || drug.volume_ml) ? ` · ${drug.prescribed_volume || drug.volume_ml} mL` : ""}</p>
                    <p className="text-[10px] text-muted-foreground">{drug.container_material || "—"}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Folio: {folio}</p>
                  </div>
                  <div className="space-y-1 mt-1">
                    {stability && (
                      <>
                        <div className="flex items-start gap-1 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-1">
                          <Clock className="h-2.5 w-2.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[8px] font-bold text-emerald-700 uppercase">Vida útil</p>
                            <p className="text-[9px] text-emerald-800">{stability.stability}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-1 bg-blue-50 border border-blue-200 rounded px-1.5 py-1">
                          <Thermometer className="h-2.5 w-2.5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[8px] font-bold text-blue-700 uppercase">Almacenamiento</p>
                            <p className="text-[9px] text-blue-800">{medInfo?.storage_conditions ? `${medInfo.storage_conditions} · ` : ""}{stability.storage}</p>
                          </div>
                        </div>
                      </>
                    )}
                    {!stability && medInfo?.storage_conditions && (
                      <div className="flex items-start gap-1 bg-blue-50 border border-blue-200 rounded px-1.5 py-1">
                        <Thermometer className="h-2.5 w-2.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[8px] font-bold text-blue-700 uppercase">Almacenamiento</p>
                          <p className="text-[9px] text-blue-800">{medInfo.storage_conditions}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Divider */}
                <div className="border-l border-border mx-2" />
                {/* Right col: patient info */}
                <div className="flex flex-col justify-between" style={{flex:'1'}}>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-xs">{rx.patient_name}</p>
                    <p className="text-[9px] text-muted-foreground">NSS: {rx.patient_nss || "—"}</p>
                    <p className="text-[9px] text-muted-foreground">SCT: {rx.patient_bsa?.toFixed(2) || "—"} m² · Peso: {rx.patient_weight || "—"} kg</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-muted-foreground">{rx.protocol_name}</p>
                    <p className="text-[9px] text-muted-foreground">C{rx.cycle_number} D{rx.day_of_cycle}</p>
                    <p className="text-[9px] text-muted-foreground">Dr. {rx.prescribing_doctor}</p>
                    <p className="text-[9px] text-muted-foreground">{formatDate(rx.prescription_date || rx.created_date)}</p>
                  </div>
                </div>
              </div>
              {/* Print button */}
              <div className="border-t border-border px-3 py-1.5">
                <Button variant="outline" size="sm" className="w-full gap-1.5 h-7 text-xs" onClick={() => printLabels([{ rx, drug, folio, stability, medInfo }])}>
                  <Printer className="h-3 w-3" /> Imprimir esta etiqueta
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}