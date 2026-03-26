import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle, XCircle } from "lucide-react";
import ClinicalFeedback from "@/components/ClinicalFeedback";
import StateTimeline from "@/components/StateTimeline";

export default function ValidacionMezclas() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMix, setSelectedMix] = useState(null);
  const [mixIndex, setMixIndex] = useState(null);
  const [status, setStatus] = useState("Pendiente");
  const [recommendation, setRecommendation] = useState("");
  const [updating, setUpdating] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentRx, setCurrentRx] = useState(null);

  useEffect(() => {
    loadPrescriptions();
    base44.auth.me().then(u => setUserRole(u.role || "admin"));
  }, []);

  const loadPrescriptions = async () => {
    const data = await base44.entities.Prescription.list("-created_date", 200);
    setPrescriptions(data);
    setLoading(false);
  };

  // Crear lista de mezclas a partir de todas las prescripciones
  const allMixes = prescriptions.flatMap(rx =>
    (rx.drugs || []).map((drug, idx) => ({
      id: `${rx.id}-${idx}`,
      rxId: rx.id,
      mixIndex: idx,
      drug,
      patient_name: rx.patient_name,
      patient_nss: rx.patient_nss,
      prescribing_doctor: rx.prescribing_doctor,
      protocol_name: rx.protocol_name,
      prescription_date: rx.prescription_date,
      validation_status: rx.validation_status,
      cycle_number: rx.cycle_number,
      day_of_cycle: rx.day_of_cycle,
      patient_bsa: rx.patient_bsa,
      patient_weight: rx.patient_weight
    }))
  );

  const filtered = allMixes.filter(mix =>
    !search ||
    mix.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    mix.drug.drug_name?.toLowerCase().includes(search.toLowerCase()) ||
    mix.prescribing_doctor?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectMix = (mix) => {
    setSelectedMix(mix);
    setMixIndex(mix.mixIndex);
    setStatus(mix.drug.is_valid ? "Validada" : "Pendiente");
    setRecommendation(mix.drug.validation_notes || "");
    const rx = prescriptions.find(p => p.id === mix.rxId);
    setCurrentRx(rx);
  };

  const handleValidate = async () => {
    if (!selectedMix) return;
    setUpdating(true);

    const user = await base44.auth.me();
    const rx = prescriptions.find(p => p.id === selectedMix.rxId);
    
    if (rx) {
      const updatedDrugs = rx.drugs.map((d, i) => {
        if (i === mixIndex) {
          return {
            ...d,
            is_valid: status === "Validada",
            validation_notes: recommendation
          };
        }
        return d;
      });

      // Agregar al historial de estados
      const stateHistory = rx.state_history || [];
      stateHistory.push({
        status: status,
        changed_by: user.full_name || user.email,
        timestamp: new Date().toISOString(),
        reason: recommendation || undefined
      });

      await base44.entities.Prescription.update(selectedMix.rxId, {
        drugs: updatedDrugs,
        validation_status: status,
        validated_by: user.full_name || user.email,
        validation_date: new Date().toISOString(),
        state_history: stateHistory
      });

      await loadPrescriptions();
      setSelectedMix(null);
      setRecommendation("");
    }

    setUpdating(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Validación de Mezclas</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de mezclas */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente o medicamento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 text-xs"
            />
          </div>

          <div className="bg-card rounded-xl border border-border divide-y max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No hay mezclas</div>
            ) : (
              filtered.map(mix => (
                <button
                  key={mix.id}
                  onClick={() => handleSelectMix(mix)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    selectedMix?.id === mix.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-medium">{mix.patient_name}</p>
                  <p className="text-xs text-muted-foreground">{mix.drug.drug_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {mix.cycle_number ? `C${mix.cycle_number} D${mix.day_of_cycle}` : "—"}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detalles de mezcla */}
        <div className="lg:col-span-2">
          {selectedMix ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paciente</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Nombre: </span><span className="font-medium">{selectedMix.patient_name}</span></p>
                    <p><span className="text-muted-foreground">NSS: </span><span className="font-mono text-xs">{selectedMix.patient_nss || "—"}</span></p>
                    <p><span className="text-muted-foreground">SCT: </span><span className="font-mono text-xs">{selectedMix.patient_bsa?.toFixed(2) || "—"} m²</span></p>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prescripción</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Médico: </span><span className="font-medium">{selectedMix.prescribing_doctor}</span></p>
                    <p><span className="text-muted-foreground">Protocolo: </span><span className="font-medium">{selectedMix.protocol_name}</span></p>
                    <p><span className="text-muted-foreground">Ciclo: </span><span>C{selectedMix.cycle_number} D{selectedMix.day_of_cycle}</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                <h3 className="text-sm font-semibold">Detalles de Mezcla</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/30 rounded text-xs">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Medicamento</p>
                    <p className="font-medium">{selectedMix.drug.drug_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Dosis</p>
                    <p className="font-mono">{selectedMix.drug.prescribed_dose} {selectedMix.drug.dose_unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Volumen</p>
                    <p className="font-mono">{selectedMix.drug.volume_ml || selectedMix.drug.prescribed_volume || "—"} mL</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Vía</p>
                    <p className="font-medium">{selectedMix.drug.route}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Concentración</p>
                    <p className="font-mono">{selectedMix.drug.dose_per_unit} {selectedMix.drug.dose_basis}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Tipo Solución</p>
                    <p className="font-medium">{selectedMix.drug.solution_type || selectedMix.drug.diluent || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Infusión</p>
                    <p className="font-medium">{selectedMix.drug.infusion_time}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">Varianza</p>
                    <p className="font-mono">{selectedMix.drug.variance_percent ? `${selectedMix.drug.variance_percent}%` : "—"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="status" className="text-xs">Estado de Validación</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status" className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Validada">✅ Validada</SelectItem>
                        <SelectItem value="Rechazada">❌ Rechazada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="recommendation" className="text-xs">Recomendación</Label>
                    <Textarea
                      id="recommendation"
                      value={recommendation}
                      onChange={e => setRecommendation(e.target.value)}
                      placeholder="Escribe tu recomendación o motivo de rechazo..."
                      rows={3}
                      className="text-xs mt-1"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleValidate}
                      disabled={updating}
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {updating ? "Guardando..." : "Guardar Validación"}
                    </Button>
                    <Button
                      onClick={() => setSelectedMix(null)}
                      variant="outline"
                      disabled={updating}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>

              {currentRx && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ClinicalFeedback rx={currentRx} onUpdate={loadPrescriptions} userRole={userRole} />
                  <StateTimeline rx={currentRx} />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
              Selecciona una mezcla para validar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}