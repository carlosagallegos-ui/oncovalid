import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePlus, Search, ArrowRight, ClipboardList, Edit, Save, X } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/dateUtils";

export default function MisPrescripciones() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [activeTab, setActiveTab] = useState("estado");
  const [selectedRx, setSelectedRx] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      setUserEmail(user.email);
      base44.entities.Prescription.list("-created_date", 200).then(data => {
        // Filter prescriptions created by this user
        const mine = data.filter(p => p.created_by === user.email);
        setPrescriptions(mine);
        setLoading(false);
      });
    });
  }, []);

  const filtered = prescriptions.filter(p =>
    !search ||
    p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.protocol_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectForEdit = (rx) => {
    setSelectedRx(rx);
    setEditData({
      cycle_number: rx.cycle_number,
      day_of_cycle: rx.day_of_cycle,
      drugs: JSON.parse(JSON.stringify(rx.drugs || []))
    });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    await base44.entities.Prescription.update(selectedRx.id, {
      cycle_number: editData.cycle_number,
      day_of_cycle: editData.day_of_cycle,
      drugs: editData.drugs
    });
    const updated = prescriptions.map(p => p.id === selectedRx.id ? { ...p, ...editData } : p);
    setPrescriptions(updated);
    setSelectedRx(null);
    setSaving(false);
  };

  const handleDrugChange = (idx, field, value) => {
    const updated = [...editData.drugs];
    updated[idx] = { ...updated[idx], [field]: field === "prescribed_dose" ? parseFloat(value) || 0 : value };
    setEditData({ ...editData, drugs: updated });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (selectedRx && activeTab === "editar") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedRx(null)}>
            <X className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Prescripción</h1>
            <p className="text-sm text-muted-foreground mt-1">{selectedRx.patient_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <Label className="text-xs">Número de Ciclo</Label>
            <Input
              type="number"
              min="1"
              value={editData.cycle_number}
              onChange={e => setEditData({ ...editData, cycle_number: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Día del Ciclo</Label>
            <Input
              type="number"
              min="1"
              value={editData.day_of_cycle}
              onChange={e => setEditData({ ...editData, day_of_cycle: parseInt(e.target.value) || 1 })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-sm">Medicamentos</h2>
          {editData.drugs?.map((drug, idx) => (
            <div key={idx} className="bg-card rounded-xl border border-border p-4 space-y-3">
              <p className="font-medium text-sm">{drug.drug_name}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Dosis Prescrita</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={drug.prescribed_dose || ""}
                    onChange={e => handleDrugChange(idx, "prescribed_dose", e.target.value)}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Volumen (mL)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={drug.prescribed_volume ?? drug.volume_ml ?? ""}
                    onChange={e => handleDrugChange(idx, "prescribed_volume", e.target.value)}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Solución</Label>
                  <Select value={drug.solution_type || drug.diluent || ""} onValueChange={v => handleDrugChange(idx, "solution_type", v)}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SSN 0.9%">SSN 0.9%</SelectItem>
                      <SelectItem value="SG 5%">SG 5%</SelectItem>
                      <SelectItem value="Hartmann">Hartmann</SelectItem>
                      <SelectItem value="Agua inyectable">Agua inyectable</SelectItem>
                      <SelectItem value="Directo">Directo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSaveEdit} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          <Button variant="outline" onClick={() => setSelectedRx(null)}>Cancelar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Prescripciones</h1>
          <p className="text-sm text-muted-foreground mt-1">Prescripciones que has enviado a la central de mezclas</p>
        </div>
        <Link to="/nueva-prescripcion">
          <Button className="gap-2">
            <FilePlus className="h-4 w-4" /> Nueva Prescripción
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("estado")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "estado"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Ver Estado
        </button>
        <button
          onClick={() => setActiveTab("editar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "editar"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Edit className="h-4 w-4" />
          Editar Prescripción
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar paciente o protocolo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No tienes prescripciones registradas</p>
            <Link to="/nueva-prescripcion">
              <Button variant="outline" className="mt-4 gap-2">
                <FilePlus className="h-4 w-4" /> Crear primera prescripción
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Paciente", "Protocolo", "Ciclo", "Fecha", "Estado", ""].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(rx => (
                  <tr key={rx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{rx.patient_name}</p>
                      {rx.patient_nss && <p className="text-xs text-muted-foreground">NSS: {rx.patient_nss}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm">{rx.protocol_name}</td>
                    <td className="px-6 py-4 text-sm font-mono">C{rx.cycle_number} D{rx.day_of_cycle}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(rx.prescription_date || rx.created_date)}</td>
                    <td className="px-6 py-4"><StatusBadge status={rx.validation_status || "Pendiente"} /></td>
                    <td className="px-6 py-4">
                      {activeTab === "estado" ? (
                        <Link to={`/prescripcion/${rx.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">Ver <ArrowRight className="h-3 w-3" /></Button>
                        </Link>
                      ) : (
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleSelectForEdit(rx)}>
                          Editar <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}