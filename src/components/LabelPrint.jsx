import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { folioPrefix, formatDate } from "@/lib/dateUtils";

// Generate folios for all mezclas of the day
// prescriptions sorted by date, each drug in each rx gets a consecutive folio
export function buildFolios(prescriptions) {
  // Group by day (prescription_date or created_date)
  const byDay = {};
  prescriptions.forEach(rx => {
    const dateKey = (rx.prescription_date || rx.created_date || "").slice(0, 10);
    if (!byDay[dateKey]) byDay[dateKey] = [];
    (rx.drugs || []).forEach(drug => {
      byDay[dateKey].push({ rx, drug });
    });
  });

  // Assign consecutive per day
  const folioMap = {}; // key: `${rx.id}-${drug.drug_name}`
  Object.entries(byDay).forEach(([dateKey, entries]) => {
    const prefix = folioPrefix(dateKey);
    entries.forEach((entry, idx) => {
      const key = `${entry.rx.id}-${entry.drug.drug_name}`;
      folioMap[key] = `${prefix}${String(idx + 1).padStart(4, "0")}`;
    });
  });
  return folioMap;
}

export default function LabelPrint({ prescriptions, folioMap }) {
  const labels = [];
  prescriptions.forEach(rx => {
    (rx.drugs || []).forEach(drug => {
      const key = `${rx.id}-${drug.drug_name}`;
      labels.push({ rx, drug, folio: folioMap[key] || "—" });
    });
  });

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Etiquetas de Mezclas</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; }
        .page { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; }
        .label {
          width: 9cm; min-height: 5cm;
          border: 1.5px solid #333; border-radius: 6px;
          padding: 10px 12px;
          page-break-inside: avoid;
          display: flex; flex-direction: column; gap: 4px;
        }
        .folio { font-size: 10px; color: #555; text-align: right; letter-spacing: .04em; }
        .drug { font-size: 16px; font-weight: bold; color: #000; margin: 4px 0 2px; }
        .dose { font-size: 13px; font-weight: bold; color: #0369a1; }
        .row { font-size: 11px; color: #333; margin-top: 2px; }
        .row span { font-weight: bold; }
        .divider { border: none; border-top: 1px solid #ddd; margin: 6px 0; }
        .patient { font-size: 12px; font-weight: bold; }
        .sub { font-size: 10px; color: #555; }
        @media print {
          body { margin: 0; }
          .page { gap: 6px; padding: 8px; }
        }
      </style></head><body>
      <div class="page">
        ${labels.map(({ rx, drug, folio }) => `
          <div class="label">
            <div class="folio">Folio: ${folio}</div>
            <div class="drug">${drug.drug_name}</div>
            <div class="dose">${drug.prescribed_dose ?? drug.calculated_dose ?? "—"} ${drug.dose_unit || "mg"}</div>
            <div class="row">Vía: <span>${drug.route || "—"}</span> &nbsp;|&nbsp; Infusión: <span>${drug.infusion_time || "—"}</span></div>
            <div class="row">Solución: <span>${drug.solution_type || drug.diluent || "—"}</span> &nbsp;${drug.prescribed_volume || drug.volume_ml ? `<span>${drug.prescribed_volume || drug.volume_ml} mL</span>` : ""}</div>
            <div class="row">Recipiente: <span>${drug.container_material || "—"}</span></div>
            <hr class="divider"/>
            <div class="patient">${rx.patient_name}</div>
            <div class="sub">NSS: ${rx.patient_nss || "—"} &nbsp;|&nbsp; SCT: ${rx.patient_bsa?.toFixed(2) || "—"} m²</div>
            <div class="sub">${rx.protocol_name} &nbsp;·&nbsp; C${rx.cycle_number} D${rx.day_of_cycle}</div>
            <div class="sub">Médico: ${rx.prescribing_doctor} &nbsp;|&nbsp; Fecha: ${formatDate(rx.prescription_date || rx.created_date)}</div>
          </div>
        `).join("")}
      </div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Etiquetas de Mezclas</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Folio: DDMMMAA + consecutivo del día</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
          <Printer className="h-3.5 w-3.5" /> Imprimir etiquetas
        </Button>
      </div>

      {/* Preview grid */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {labels.map(({ rx, drug, folio }, i) => (
          <div key={i} className="border-2 border-border rounded-lg p-3 text-xs space-y-1 bg-white">
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm">{drug.drug_name}</span>
              <span className="text-muted-foreground text-[10px] font-mono">{folio}</span>
            </div>
            <p className="font-bold text-primary text-sm">
              {drug.prescribed_dose ?? drug.calculated_dose ?? "—"} {drug.dose_unit || "mg"}
            </p>
            <p className="text-muted-foreground">
              {drug.route} · {drug.infusion_time} · {drug.solution_type || drug.diluent || "—"} {(drug.prescribed_volume || drug.volume_ml) ? `${drug.prescribed_volume || drug.volume_ml} mL` : ""}
            </p>
            <div className="border-t border-border pt-1 mt-1">
              <p className="font-semibold">{rx.patient_name}</p>
              <p className="text-muted-foreground">{rx.protocol_name} · C{rx.cycle_number}D{rx.day_of_cycle} · {formatDate(rx.prescription_date || rx.created_date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}