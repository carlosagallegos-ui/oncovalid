import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle, Printer, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import DoseValidationRow from "@/components/DoseValidationRow";
import moment from "moment";

export default function PrescriptionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [rx, setRx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    base44.entities.Prescription.list("-created_date", 200).then(all => {
      const found = all.find(p => p.id === id);
      if (found) { setRx(found); setNotes(found.validation_notes || ""); }
      setLoading(false);
    });
  }, [id]);

  const handleValidate = async (status) => {
    setUpdating(true);
    const user = await base44.auth.me();
    const updated = {
      validation_status: status,
      validated_by: user.full_name || user.email,
      validation_date: new Date().toISOString(),
      validation_notes: notes
    };
    await base44.entities.Prescription.update(id, updated);
    setRx(prev => ({ ...prev, ...updated }));
    setUpdating(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!rx) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Prescripción no encontrada</p><Button variant="outline" onClick={() => navigate("/prescripciones")} className="mt-4">Volver</Button></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Prescripción</h1>
            <p className="text-sm text-muted-foreground">{rx.protocol_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={rx.validation_status || "Pendiente"} />
          <Button variant="outline" size="sm" className="gap-1" onClick={() => window.print()}>
            <Printer className="h-3 w-3" /> Imprimir
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paciente</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Nombre:</span><span className="font-medium">{rx.patient_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SCT:</span><span className="font-mono">{rx.patient_bsa?.toFixed(2)} m²</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Peso:</span><span className="font-mono">{rx.patient_weight} kg</span></div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prescripción</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Médico:</span><span className="font-medium">{rx.prescribing_doctor}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cédula:</span><span className="font-mono">{rx.doctor_license}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ciclo:</span><span className="font-mono">C{rx.cycle_number} D{rx.day_of_cycle}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fecha:</span><span>{rx.prescription_date ? moment(rx.prescription_date).format("DD/MM/YYYY") : "—"}</span></div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {rx.alerts?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" /> Alertas Clínicas
          </div>
          {rx.alerts.map((a, i) => <p key={i} className="text-sm text-amber-700">{a}</p>)}
        </div>
      )}

      {/* Dose table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Detalle de Medicamentos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Medicamento", "Dosis Prescrita", "Dosis Calculada", "Referencia", "Vía", "Infusión", "Varianza", "Notas"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rx.drugs?.map((drug, i) => <DoseValidationRow key={i} drug={drug} />)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation actions */}
      {rx.validation_status === "Pendiente" && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold">Validación Farmacéutica</h2>
          <div>
            <label className="text-sm font-medium block mb-2">Observaciones del farmacéutico</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Escriba sus observaciones..." rows={3} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => handleValidate("Validada")} disabled={updating} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="h-4 w-4" /> Validar Prescripción
            </Button>
            <Button onClick={() => handleValidate("Ajustada")} disabled={updating} variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50">
              <AlertTriangle className="h-4 w-4" /> Validar con Ajuste
            </Button>
            <Button onClick={() => handleValidate("Rechazada")} disabled={updating} variant="outline" className="gap-2 border-red-300 text-red-700 hover:bg-red-50">
              <XCircle className="h-4 w-4" /> Rechazar
            </Button>
          </div>
        </div>
      )}

      {/* Validated info */}
      {rx.validation_status !== "Pendiente" && rx.validated_by && (
        <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
          <p><span className="text-muted-foreground">Validado por: </span><span className="font-medium">{rx.validated_by}</span></p>
          <p><span className="text-muted-foreground">Fecha: </span>{rx.validation_date ? moment(rx.validation_date).format("DD/MM/YYYY HH:mm") : "—"}</p>
          {rx.validation_notes && <p><span className="text-muted-foreground">Notas: </span>{rx.validation_notes}</p>}
        </div>
      )}
    </div>
  );
}