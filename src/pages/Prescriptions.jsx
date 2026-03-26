import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import DoseValidationRow from "@/components/DoseValidationRow";
import { formatDate, formatDateTime } from "@/lib/dateUtils";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pendiente");
  const [selectedRx, setSelectedRx] = useState(null);
  const [drugNotes, setDrugNotes] = useState({});
  const [drugStatus, setDrugStatus] = useState({});
  const [updating, setUpdating] = useState(false);
  const [drugContainers, setDrugContainers] = useState({});

  useEffect(() => {
    base44.entities.Prescription.list("-created_date", 200).then(data => {
      setPrescriptions(data);
      setLoading(false);
    });
  }, []);

  const filtered = prescriptions.filter(p => {
    const matchSearch = !search ||
      p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.protocol_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.prescribing_doctor?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.validation_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSelectRx = (rx) => {
    setSelectedRx(rx);
    const containers = {};
    const notes = {};
    const status = {};
    (rx.drugs || []).forEach((d, i) => {
      containers[i] = d.container_material || "Bolsa PVC";
      notes[i] = d.drug_validation_notes || d.validation_notes || "";
      status[i] = d.drug_validation_status || "Pendiente";
    });
    setDrugContainers(containers);
    setDrugNotes(notes);
    setDrugStatus(status);
  };

  const handleValidateDrug = async (drugIndex, newDrugStatus) => {
    setUpdating(true);
    const user = await base44.auth.me();
    
    const updatedDrugs = (selectedRx.drugs || []).map((d, i) => {
      if (i === drugIndex) {
        return {
          ...d,
          container_material: drugContainers[i] || d.container_material || "Bolsa PVC",
          drug_validation_status: newDrugStatus,
          drug_validated_by: user.full_name || user.email,
          drug_validation_date: new Date().toISOString(),
          drug_validation_notes: drugNotes[i] || ""
        };
      }
      return {
        ...d,
        container_material: drugContainers[i] || d.container_material || "Bolsa PVC"
      };
    });

    const updatedRx = { ...selectedRx, drugs: updatedDrugs };
    
    await base44.entities.Prescription.update(selectedRx.id, { drugs: updatedDrugs });
    
    setSelectedRx(updatedRx);
    setPrescriptions(prev => prev.map(p => p.id === selectedRx.id ? updatedRx : p));
    setDrugStatus(prev => ({ ...prev, [drugIndex]: newDrugStatus }));
    setUpdating(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Validación de Prescripciones</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lista */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Validada">Validada</SelectItem>
                <SelectItem value="Rechazada">Rechazada</SelectItem>
                <SelectItem value="Ajustada">Ajustada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-xl border border-border divide-y max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No se encontraron prescripciones</div>
            ) : (
              filtered.map(rx => (
                <button
                  key={rx.id}
                  onClick={() => handleSelectRx(rx)}
                  className={`w-full text-left px-4 py-3 border-b last:border-0 transition-colors ${
                    selectedRx?.id === rx.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rx.patient_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{rx.protocol_name}</p>
                      <p className="text-xs text-muted-foreground">C{rx.cycle_number} D{rx.day_of_cycle}</p>
                    </div>
                    <StatusBadge status={rx.validation_status || "Pendiente"} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Detalle + Validación */}
        <div className="lg:col-span-2">
          {selectedRx ? (
            <div className="space-y-6">
              {/* Info del paciente */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paciente</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Nombre: </span><span className="font-medium">{selectedRx.patient_name}</span></p>
                    <p><span className="text-muted-foreground">NSS: </span><span className="font-mono text-xs">{selectedRx.patient_nss || "—"}</span></p>
                    <p><span className="text-muted-foreground">SCT: </span><span className="font-mono text-xs">{selectedRx.patient_bsa?.toFixed(2)} m²</span></p>
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prescripción</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Médico: </span><span className="font-medium">{selectedRx.prescribing_doctor}</span></p>
                    <p><span className="text-muted-foreground">Protocolo: </span><span className="font-medium">{selectedRx.protocol_name}</span></p>
                    <p><span className="text-muted-foreground">Fecha: </span><span className="text-xs">{formatDate(selectedRx.prescription_date)}</span></p>
                  </div>
                </div>
              </div>

              {/* Alertas */}
              {selectedRx.alerts?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" /> Alertas Clínicas
                  </div>
                  {selectedRx.alerts.map((a, i) => (
                    <p key={i} className="text-sm text-amber-700">{a}</p>
                  ))}
                </div>
              )}

              {/* Detalles de cada mezcla */}
              <div className="space-y-4">
                <h2 className="font-semibold text-sm">Validación de Mezclas por Separado</h2>
                {selectedRx.drugs?.map((drug, i) => {
                  const concentrationFinal = drug.prescribed_dose && drug.prescribed_volume
                    ? (drug.prescribed_dose / drug.prescribed_volume).toFixed(2)
                    : null;
                  
                  return (
                    <div key={i} className={`rounded-xl border p-4 space-y-4 ${
                      drugStatus[i] === "Validada" ? "border-emerald-300 bg-emerald-50/30" :
                      drugStatus[i] === "Rechazada" ? "border-red-300 bg-red-50/30" :
                      drugStatus[i] === "Ajustada" ? "border-blue-300 bg-blue-50/30" :
                      "border-border bg-card"
                    }`}>
                      {/* Encabezado mezcla */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{drug.drug_name}</p>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{drug.route}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Mezcla {i + 1} de {selectedRx.drugs.length}</p>
                        </div>
                        <div className="text-right">
                          {drug.is_valid ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                      </div>

                      {/* Detalles técnicos */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/50 rounded text-xs">
                        <div>
                          <p className="text-muted-foreground mb-0.5">Dosis Prescrita</p>
                          <p className="font-mono font-medium">{drug.prescribed_dose} {drug.dose_unit}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-0.5">Volumen Total</p>
                          <p className="font-mono font-medium">{drug.prescribed_volume || drug.volume_ml || "—"} mL</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-0.5">Concentración Final</p>
                          <p className="font-mono font-medium">{concentrationFinal ? `${concentrationFinal} ${drug.dose_unit}/mL` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-0.5">Tipo de Solución</p>
                          <p className="font-medium">{drug.solution_type || drug.diluent || "SSN 0.9%"}</p>
                        </div>
                      </div>

                      {/* Material del recipiente */}
                      <div className="space-y-2">
                        <Label htmlFor={`container-${i}`} className="text-xs">Material del Recipiente *</Label>
                        <Select
                          value={drugContainers[i] || "Bolsa PVC"}
                          onValueChange={v => setDrugContainers(prev => ({ ...prev, [i]: v }))}
                        >
                          <SelectTrigger id={`container-${i}`} className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bolsa PVC">Bolsa PVC</SelectItem>
                            <SelectItem value="Bolsa no PVC (EVA)">Bolsa no PVC (EVA)</SelectItem>
                            <SelectItem value="Bolsa polipropileno">Bolsa polipropileno</SelectItem>
                            <SelectItem value="Jeringa">Jeringa</SelectItem>
                            <SelectItem value="Frasco vidrio">Frasco vidrio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Notas por mezcla */}
                      <div className="space-y-2">
                        <Label htmlFor={`notes-${i}`} className="text-xs">Observaciones (Opcional)</Label>
                        <Textarea
                          id={`notes-${i}`}
                          value={drugNotes[i] || ""}
                          onChange={e => setDrugNotes(prev => ({ ...prev, [i]: e.target.value }))}
                          placeholder="Notas sobre esta mezcla..."
                          rows={2}
                          className="text-xs"
                        />
                      </div>

                      {/* Botones de validación por mezcla */}
                      {drugStatus[i] === "Pendiente" ? (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => handleValidateDrug(i, "Validada")}
                            disabled={updating}
                            className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                          >
                            <CheckCircle className="h-3 w-3" /> Validar Mezcla
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleValidateDrug(i, "Ajustada")}
                            disabled={updating}
                            variant="outline"
                            className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-50 text-xs h-8"
                          >
                            <AlertTriangle className="h-3 w-3" /> Con Ajuste
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleValidateDrug(i, "Rechazada")}
                            disabled={updating}
                            variant="outline"
                            className="gap-1 border-red-300 text-red-700 hover:bg-red-50 text-xs h-8"
                          >
                            <XCircle className="h-3 w-3" /> Rechazar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                          <div>
                            <span className="text-muted-foreground">Estado: </span>
                            <span className="font-medium">{
                              drugStatus[i] === "Validada" ? "✅ Validada" :
                              drugStatus[i] === "Rechazada" ? "❌ Rechazada" :
                              drugStatus[i] === "Ajustada" ? "⚠️ Con Ajuste" : "⏳ Pendiente"
                            }</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDrugStatus(prev => ({ ...prev, [i]: "Pendiente" }))}
                            className="h-6 text-xs"
                          >
                            Cambiar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resumen de validación */}
              <div className="bg-muted/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2">Resumen de Validación</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Total de mezclas: </span><span className="font-medium">{selectedRx.drugs?.length || 0}</span></p>
                  <p><span className="text-muted-foreground">Validadas: </span>
                    <span className="font-medium text-emerald-600">
                      {Object.values(drugStatus).filter(s => s === "Validada").length}
                    </span>
                  </p>
                  <p><span className="text-muted-foreground">Pendientes: </span>
                    <span className="font-medium text-amber-600">
                      {Object.values(drugStatus).filter(s => s === "Pendiente").length}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
              Selecciona una prescripción para ver los detalles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}