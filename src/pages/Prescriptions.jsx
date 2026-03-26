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
  const [notes, setNotes] = useState("");
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
    setNotes(rx.validation_notes || "");
    const containers = {};
    (rx.drugs || []).forEach((d, i) => {
      containers[i] = d.container_material || "Bolsa PVC";
    });
    setDrugContainers(containers);
  };

  const handleValidate = async (status) => {
    setUpdating(true);
    const user = await base44.auth.me();
    
    // Actualizar cada droga con el recipiente seleccionado
    const updatedDrugs = (selectedRx.drugs || []).map((d, i) => ({
      ...d,
      container_material: drugContainers[i] || d.container_material || "Bolsa PVC"
    }));

    const updated = {
      validation_status: status,
      validated_by: user.full_name || user.email,
      validation_date: new Date().toISOString(),
      validation_notes: notes,
      drugs: updatedDrugs
    };
    
    await base44.entities.Prescription.update(selectedRx.id, updated);
    
    setPrescriptions(prev => prev.map(p => p.id === selectedRx.id ? { ...p, ...updated } : p));
    setSelectedRx(prev => ({ ...prev, ...updated }));
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

              {/* Tabla de dosis con selector de recipiente */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-semibold text-sm">Medicamentos - Seleccionar Material del Recipiente</h2>
                </div>
                <div className="divide-y divide-border">
                  {selectedRx.drugs?.map((drug, i) => (
                    <div key={i} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{drug.drug_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Dosis: {drug.prescribed_dose} {drug.dose_unit} · Vía: {drug.route} · Infusión: {drug.infusion_time}
                          </p>
                        </div>
                        {drug.is_valid ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo de Solución</Label>
                          <p className="text-xs text-muted-foreground bg-muted rounded px-2 py-1">
                            {drug.solution_type || drug.diluent || "SSN 0.9%"}
                          </p>
                        </div>
                        <div className="space-y-1">
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validación */}
              {selectedRx.validation_status === "Pendiente" ? (
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                  <h2 className="font-semibold">Validación Farmacéutica</h2>
                  <div>
                    <label className="text-sm font-medium block mb-2">Observaciones</label>
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Escriba sus observaciones..."
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => handleValidate("Validada")}
                      disabled={updating}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4" /> Validar
                    </Button>
                    <Button
                      onClick={() => handleValidate("Ajustada")}
                      disabled={updating}
                      variant="outline"
                      className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <AlertTriangle className="h-4 w-4" /> Validar con Ajuste
                    </Button>
                    <Button
                      onClick={() => handleValidate("Rechazada")}
                      disabled={updating}
                      variant="outline"
                      className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" /> Rechazar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Validado por: </span><span className="font-medium">{selectedRx.validated_by}</span></p>
                  <p><span className="text-muted-foreground">Fecha: </span>{formatDateTime(selectedRx.validation_date)}</p>
                  {selectedRx.validation_notes && (
                    <p><span className="text-muted-foreground">Notas: </span>{selectedRx.validation_notes}</p>
                  )}
                </div>
              )}
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