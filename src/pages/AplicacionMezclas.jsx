import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

export default function AplicacionMezclas() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRx, setSelectedRx] = useState(null);
  const [result, setResult] = useState("Exitosa");
  const [notes, setNotes] = useState("");
  const [reactionType, setReactionType] = useState("");
  const [severity, setSeverity] = useState("Leve");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    const data = await base44.entities.Prescription.list("-created_date", 200);
    // Filtrar prescripciones entregadas y no aplicadas
    const pending = data.filter(p => p.delivered && p.application_status !== "Aplicada" && p.application_status !== "Rechazada");
    setPrescriptions(pending);
    setLoading(false);
  };

  const filtered = prescriptions.filter(p =>
    !search ||
    p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.protocol_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.prescribing_doctor?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectRx = (rx) => {
    setSelectedRx(rx);
    setResult("Exitosa");
    setNotes("");
    setReactionType("");
    setSeverity("Leve");
  };

  const handleSubmitResult = async () => {
    if (!selectedRx) return;
    setSaving(true);

    const user = await base44.auth.me();
    const stateHistory = selectedRx.state_history || [];
    stateHistory.push({
      status: "Aplicada",
      changed_by: user.full_name || user.email,
      timestamp: new Date().toISOString(),
      reason: `Aplicación: ${result}`
    });

    const updateData = {
      application_status: "Aplicada",
      applied_by: user.full_name || user.email,
      applied_date: new Date().toISOString(),
      application_result: result,
      application_notes: notes || undefined,
      state_history: stateHistory
    };

    if (result === "Reacción adversa") {
      updateData.adverse_reaction_type = reactionType;
      updateData.adverse_reaction_severity = severity;
    }

    await base44.entities.Prescription.update(selectedRx.id, updateData);
    await loadPrescriptions();
    setSelectedRx(null);
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aplicación de Mezclas</h1>
        <p className="text-sm text-muted-foreground mt-1">Registra los resultados de la aplicación de mezclas oncológicas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 text-xs"
            />
          </div>

          <div className="bg-card rounded-xl border border-border divide-y max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No hay mezclas pendientes de aplicación
              </div>
            ) : (
              filtered.map(rx => (
                <button
                  key={rx.id}
                  onClick={() => handleSelectRx(rx)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedRx?.id === rx.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-medium">{rx.patient_name}</p>
                  <p className="text-xs text-muted-foreground">{rx.protocol_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Entregada por: {rx.delivered_to}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detalle */}
        <div className="lg:col-span-2">
          {selectedRx ? (
            <div className="space-y-6">
              {/* Info paciente y prescripción */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">Paciente</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">{selectedRx.patient_name}</span></p>
                    <p className="text-xs text-muted-foreground">NSS: {selectedRx.patient_nss || "—"}</p>
                    <p className="text-xs text-muted-foreground">Peso: {selectedRx.patient_weight} kg</p>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground">Prescripción</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Médico: </span><span className="font-medium">{selectedRx.prescribing_doctor}</span></p>
                    <p><span className="text-muted-foreground">Fecha: </span><span className="text-xs">{formatDate(selectedRx.prescription_date)}</span></p>
                    <p><span className="text-muted-foreground">Medicamentos: </span><span className="font-medium">{selectedRx.drugs?.length || 0}</span></p>
                  </div>
                </div>
              </div>

              {/* Medicamentos */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <h3 className="text-sm font-semibold">Medicamentos Administrados</h3>
                <div className="space-y-2">
                  {selectedRx.drugs?.map((drug, i) => (
                    <div key={i} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{drug.drug_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {drug.prescribed_dose} {drug.dose_unit} • {drug.route} • {drug.infusion_time}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulario de resultado */}
              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-sm font-semibold">Resultado de Aplicación</h3>

                <div>
                  <Label htmlFor="result" className="text-xs">¿Cómo fue la aplicación?</Label>
                  <Select value={result} onValueChange={setResult}>
                    <SelectTrigger id="result" className="h-9 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Exitosa">✅ Exitosa - Sin problemas</SelectItem>
                      <SelectItem value="Problemas">⚠️ Problemas técnicos - Dificultad en administración</SelectItem>
                      <SelectItem value="Reacción adversa">🔴 Reacción adversa del paciente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {result === "Reacción adversa" && (
                  <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <Label htmlFor="reactionType" className="text-xs">Tipo de reacción</Label>
                      <Input
                        id="reactionType"
                        placeholder="Ej: Náuseas, erupciones, fiebre..."
                        value={reactionType}
                        onChange={e => setReactionType(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="severity" className="text-xs">Severidad</Label>
                      <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger id="severity" className="h-9 text-xs mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Leve">Leve</SelectItem>
                          <SelectItem value="Moderada">Moderada</SelectItem>
                          <SelectItem value="Severa">Severa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes" className="text-xs">Detalles adicionales (Opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Describe cualquier observación importante sobre la aplicación..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="text-xs mt-1"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSubmitResult}
                    disabled={saving || (result === "Reacción adversa" && !reactionType)}
                    className={`flex-1 gap-2 ${
                      result === "Exitosa" ? "bg-emerald-600 hover:bg-emerald-700" :
                      result === "Problemas" ? "bg-amber-600 hover:bg-amber-700" :
                      "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {result === "Exitosa" && <CheckCircle className="h-4 w-4" />}
                    {result === "Problemas" && <AlertTriangle className="h-4 w-4" />}
                    {result === "Reacción adversa" && <Zap className="h-4 w-4" />}
                    {saving ? "Guardando..." : "Registrar Resultado"}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedRx(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
              Selecciona una mezcla para registrar su aplicación
            </div>
          )}
        </div>
      </div>
    </div>
  );
}