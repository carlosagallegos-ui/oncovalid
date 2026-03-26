import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrescriptionRecipe({ rx, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Print button */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-semibold">Receta Médica</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2 text-sm" size="sm">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              Cerrar
            </Button>
          </div>
        </div>

        {/* Recipe content */}
        <div className="p-8 space-y-6 print:p-4" id="recipe-content">
          {/* Header */}
          <div className="border-b pb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold">RECETA MÉDICA</h1>
                <p className="text-sm text-muted-foreground">Prescripción Oncológica</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-mono font-semibold">ID: {rx.id.substring(0, 8).toUpperCase()}</p>
                <p className="text-muted-foreground">
                  {rx.prescription_date ? new Date(rx.prescription_date).toLocaleDateString("es-MX") : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Datos del paciente */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Paciente</h3>
              <p className="text-sm font-semibold">{rx.patient_name}</p>
              {rx.patient_nss && <p className="text-xs text-muted-foreground">NSS: {rx.patient_nss}</p>}
              <p className="text-xs text-muted-foreground">Peso: {rx.patient_weight} kg</p>
              <p className="text-xs text-muted-foreground">SCT: {rx.patient_bsa?.toFixed(2)} m²</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Médico Prescriptor</h3>
              <p className="text-sm font-semibold">{rx.prescribing_doctor}</p>
              <p className="text-xs text-muted-foreground">Cédula: {rx.doctor_license}</p>
              <p className="text-xs text-muted-foreground">Protocolo: {rx.protocol_name}</p>
              <p className="text-xs text-muted-foreground">Ciclo {rx.cycle_number}, Día {rx.day_of_cycle}</p>
            </div>
          </div>

          {/* Medicamentos */}
          <div>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Medicamentos Prescritos</h3>
            <table className="w-full text-sm border border-border">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-3 py-2 font-semibold text-xs">Medicamento</th>
                  <th className="text-left px-3 py-2 font-semibold text-xs">Dosis</th>
                  <th className="text-left px-3 py-2 font-semibold text-xs">Vía</th>
                  <th className="text-left px-3 py-2 font-semibold text-xs">Infusión</th>
                  <th className="text-left px-3 py-2 font-semibold text-xs">Diluente</th>
                </tr>
              </thead>
              <tbody>
                {rx.drugs?.map((drug, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5">{drug.drug_name}</td>
                    <td className="px-3 py-2.5 font-mono">{drug.prescribed_dose} {drug.dose_unit}</td>
                    <td className="px-3 py-2.5">{drug.route}</td>
                    <td className="px-3 py-2.5">{drug.infusion_time}</td>
                    <td className="px-3 py-2.5">{drug.diluent || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Observaciones */}
          {rx.alerts?.length > 0 && (
            <div className="border-l-4 border-amber-500 bg-amber-50 p-3 rounded">
              <h3 className="text-xs font-semibold uppercase text-amber-900 mb-2">Observaciones Clínicas</h3>
              <ul className="text-xs text-amber-900 space-y-1">
                {rx.alerts.map((alert, i) => (
                  <li key={i}>• {alert}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 text-xs text-muted-foreground space-y-1">
            <p>___________________________</p>
            <p className="font-semibold">{rx.prescribing_doctor}</p>
            <p>Firma del Médico Prescriptor</p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; }
          .fixed { position: static; }
          #recipe-content { max-width: 100%; }
          .no-print { display: none; }
        }
      `}</style>
    </div>
  );
}