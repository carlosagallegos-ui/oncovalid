import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, AlertTriangle, CheckCircle } from "lucide-react";

function calcPrep(drug, medications) {
  // Normalize: strip " bolo" / " infusión" suffixes for inventory lookup
  const normalize = name => (name || "").replace(/ bolo$/i, "").replace(/ infusi[oó]n$/i, "").trim().toLowerCase();
  const drugNorm = normalize(drug.drug_name);
  const inv = medications.find(m =>
    normalize(m.drug_name) === drugNorm && m.status !== "Caducado"
  );

  const prescribedDose = drug.prescribed_dose || drug.calculated_dose || 0;
  const volumeContainer = drug.prescribed_volume || drug.volume_ml || 0;

  let concMgPerMl = null;
  let vialVolumeMl = null;
  let invInfo = null;

  if (inv) {
    // If unit is mg/mL, concentration is already mg/mL
    if (inv.concentration_unit === "mg/mL") {
      concMgPerMl = inv.concentration;
      vialVolumeMl = inv.vial_volume_ml || null;
    } else if (inv.concentration_unit === "mg" && inv.vial_volume_ml) {
      // mg total per vial / mL per vial = mg/mL
      concMgPerMl = inv.concentration / inv.vial_volume_ml;
      vialVolumeMl = inv.vial_volume_ml;
    }
    invInfo = inv;
  }

  const isBolo = volumeContainer === 0 || (drug.diluent || "").toLowerCase().includes("directo") || (drug.infusion_time || "").toLowerCase().includes("bolo");
  const drugVolumeMl = concMgPerMl ? Math.round((prescribedDose / concMgPerMl) * 100) / 100 : null;
  const withdrawFromContainer = drugVolumeMl !== null && !isBolo ? drugVolumeMl : null;
  const solutionRemaining = withdrawFromContainer !== null ? Math.round((volumeContainer - withdrawFromContainer) * 100) / 100 : null;
  const finalVolume = isBolo ? drugVolumeMl : (volumeContainer || null);

  return { prescribedDose, volumeContainer, concMgPerMl, vialVolumeMl, drugVolumeMl, withdrawFromContainer, solutionRemaining, finalVolume, invInfo, isBolo };
}

export default function PreparationSheet({ drugs }) {
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    base44.entities.Medication.list("-received_date", 300).then(setMedications);
  }, []);

  return (
    <div className="space-y-4">
      {drugs?.map((drug, i) => {
        const p = calcPrep(drug, medications);
        const hasFullCalc = p.drugVolumeMl !== null && (p.volumeContainer > 0 || p.isBolo);

        return (
          <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Drug header */}
            <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
              <FlaskConical className="h-4 w-4 text-primary" />
              <div>
                <p className="font-semibold text-sm">{drug.drug_name}</p>
                <p className="text-xs text-muted-foreground">
                  {drug.route} · {drug.infusion_time} · {drug.solution_type || drug.diluent || "—"} · {drug.container_material || "—"}
                </p>
              </div>
              {p.invInfo ? (
                <span className="ml-auto text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Concentración del inventario
                </span>
              ) : (
                <span className="ml-auto text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Sin concentración en inventario
                </span>
              )}
            </div>

            <div className="p-5 space-y-5">
              {/* Dose info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Dosis prescrita</p>
                  <p className="font-mono font-bold text-base">{p.prescribedDose} {drug.dose_unit || "mg"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Volumen recipiente</p>
                  <p className="font-mono font-bold text-base">{p.volumeContainer > 0 ? `${p.volumeContainer} mL` : "—"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Concentración</p>
                  <p className="font-mono font-bold text-base">{p.concMgPerMl ? `${p.concMgPerMl} mg/mL` : "—"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Presentación</p>
                  <p className="font-mono font-bold text-base">{p.invInfo?.presentation || "—"}</p>
                </div>
              </div>

              {/* Preparation steps */}
              {hasFullCalc ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pasos de preparación</p>
                  <ol className="space-y-3">
                    {!p.isBolo && (
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p className="text-sm">
                        Retirar <span className="font-mono font-bold text-primary">{p.drugVolumeMl} mL</span> del recipiente de solución <span className="font-medium">({drug.solution_type || drug.diluent || "solución"})</span> para hacer espacio al medicamento.
                      </p>
                    </li>
                    )}
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{p.isBolo ? "1" : "2"}</span>
                      <p className="text-sm">
                        Agregar <span className="font-mono font-bold text-primary">{p.drugVolumeMl} mL</span> de <span className="font-medium">{drug.drug_name}</span> al recipiente ({p.prescribedDose} {drug.dose_unit || "mg"} a {p.concMgPerMl} mg/mL).
                      </p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{p.isBolo ? "2" : "3"}</span>
                      <p className="text-sm">
                        {p.isBolo
                          ? "Administrar directamente en bolo IV lento. Verificar permeabilidad de la vía antes de administrar."
                          : "Mezclar suavemente e inspeccionar visualmente. Etiquetar el recipiente con los datos del paciente y medicamento."}
                      </p>
                    </li>
                  </ol>

                  {/* Final content legend */}
                  <div className="mt-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Contenido final del recipiente</p>
                    {p.isBolo ? (
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Volumen a extraer</p>
                          <p className="font-mono font-bold text-primary">{p.drugVolumeMl} mL</p>
                          <p className="text-xs text-muted-foreground">({p.prescribedDose} {drug.dose_unit || "mg"})</p>
                        </div>
                        <div className="border-l border-primary/20 pl-3">
                          <p className="text-xs text-muted-foreground">Administración</p>
                          <p className="font-mono font-bold text-primary">Bolo IV</p>
                          <p className="text-xs text-muted-foreground">Directo</p>
                        </div>
                      </div>
                    ) : (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Medicamento</p>
                        <p className="font-mono font-bold text-primary">{p.drugVolumeMl} mL</p>
                        <p className="text-xs text-muted-foreground">({p.prescribedDose} {drug.dose_unit || "mg"})</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Solución</p>
                        <p className="font-mono font-bold text-primary">{p.solutionRemaining} mL</p>
                        <p className="text-xs text-muted-foreground">({drug.solution_type || drug.diluent || "diluyente"})</p>
                      </div>
                      <div className="border-l border-primary/20 pl-3">
                        <p className="text-xs text-muted-foreground">Volumen total</p>
                        <p className="font-mono font-bold text-lg text-primary">{p.finalVolume} mL</p>
                      </div>
                    </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                  <p className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    No se puede calcular el volumen de preparación.
                  </p>
                  <p className="mt-1 text-xs">
                    {!p.invInfo
                      ? `Registre "${drug.drug_name}" en el módulo de Medicamentos con su concentración (mg/mL) y volumen por frasco.`
                      : "Verifique que el medicamento tenga concentración (mg/mL) y el volumen del frasco registrados."}
                  </p>
                  {p.volumeContainer > 0 && (
                    <p className="mt-2 text-xs">Volumen del recipiente final: <span className="font-mono font-bold">{p.volumeContainer} mL</span></p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}