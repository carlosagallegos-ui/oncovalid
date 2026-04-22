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
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

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
      drug: {
        ...drug,
        // Si el drug no tiene validation_status propio, heredar el de la prescripción
        validation_status: drug.validation_status || (rx.drugs.length === 1 ? rx.validation_status : undefined),
      },
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

  const filtered = allMixes.filter(mix => {
    const matchSearch = !search ||
      mix.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      mix.drug.drug_name?.toLowerCase().includes(search.toLowerCase()) ||
      mix.prescribing_doctor?.toLowerCase().includes(search.toLowerCase());
    const drugStatus = mix.drug.validation_status || "Pendiente";
    const matchStatus = filterStatus === "todos" || drugStatus === filterStatus;
    const rxDate = mix.prescription_date || "";
    const matchDate = (!filterDateFrom || rxDate >= filterDateFrom) && (!filterDateTo || rxDate <= filterDateTo);
    return matchSearch && matchStatus && matchDate;
  });

  const handleSelectMix = (mix) => {
    setSelectedMix(mix);
    setMixIndex(mix.mixIndex);
    const ds = mix.drug.validation_status;
    // Si no tiene estado o es "Pendiente", inicializar el selector en "En revisión"
    setStatus(ds && ds !== "Pendiente" ? ds : "En revisión");
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
            validation_notes: recommendation,
            validation_status: status,
            validated_by: user.full_name || user.email,
            validation_date: new Date().toISOString(),
          };
        }
        return d;
      });

      // Calcular estado global de la prescripción
      const allStatuses = updatedDrugs.map(d => d.validation_status || "Pendiente");
      let globalStatus;
      if (allStatuses.every(s => s === "Validada")) globalStatus = "Validada";
      else if (allStatuses.some(s => s === "Rechazada")) globalStatus = "Rechazada";
      else globalStatus = "Pendiente";

      // Agregar al historial de estados
      const stateHistory = [...(rx.state_history || []), {
        status: `Mezcla ${mixIndex + 1} (${selectedMix.drug.drug_name}): ${status}`,
        changed_by: user.full_name || user.email,
        timestamp: new Date().toISOString(),
        reason: recommendation || undefined
      }];

      const updatedRx = {
        ...rx,
        drugs: updatedDrugs,
        validation_status: globalStatus,
        validated_by: user.full_name || user.email,
        validation_date: new Date().toISOString(),
        state_history: stateHistory
      };

      // Actualizar estado local inmediatamente para reactividad instantánea
      setPrescriptions(prev => prev.map(p => p.id === selectedMix.rxId ? updatedRx : p));

      // Actualizar la mezcla seleccionada con el nuevo estado para que el badge se refleje
      setSelectedMix(prev => ({
        ...prev,
        drug: {
          ...prev.drug,
          validation_status: status,
          is_valid: status === "Validada",
          validation_notes: recommendation,
        }
      }));
      setCurrentRx(updatedRx);

      await base44.entities.Prescription.update(selectedMix.rxId, {
        drugs: updatedDrugs,
        validation_status: globalStatus,
        validated_by: user.full_name || user.email,
        validation_date: new Date().toISOString(),
        state_history: stateHistory
      });

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
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="text-xs h-8 flex-1" />
              <span className="text-xs text-muted-foreground">–</span>
              <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="text-xs h-8 flex-1" />
              {(filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }} className="text-xs text-muted-foreground hover:text-foreground shrink-0">✕</button>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {["todos", "Pendiente", "En revisión", "Validada", "Rechazada"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filterStatus === s
                    ? s === "Validada" ? "bg-emerald-600 text-white border-emerald-600"
                      : s === "Rechazada" ? "bg-red-600 text-white border-red-600"
                      : s === "Pendiente" ? "bg-amber-500 text-white border-amber-500"
                      : "bg-primary text-white border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {s === "todos" ? "Todos" : s}
              </button>
            ))}
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
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{mix.patient_name}</p>
                    {(() => {
                      const ds = mix.drug.validation_status || "Pendiente";
                      return (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          ds === "Validada" ? "bg-emerald-100 text-emerald-700" :
                          ds === "Rechazada" ? "bg-red-100 text-red-700" :
                          ds === "En revisión" ? "bg-blue-100 text-blue-700" :
                          ds === "Ajustada" ? "bg-purple-100 text-purple-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {ds === "Validada" ? "✓ Validada" :
                           ds === "Rechazada" ? "✗ Rechazada" :
                           ds === "En revisión" ? "🔍 En revisión" :
                           ds === "Ajustada" ? "~ Ajustada" :
                           "⏳ Pendiente"}
                        </span>
                      );
                    })()}
                  </div>
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
                        <SelectItem value="En revisión">🔍 En revisión</SelectItem>
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