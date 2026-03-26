import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, User, Pencil, LogOut } from "lucide-react";
import { calculateBSA } from "@/lib/chemoProtocols";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [discharging, setDischarging] = useState(null); // patient being discharged
  const [dischargeForm, setDischargeForm] = useState({ status: "Fallecido", discharge_date: new Date().toISOString().split("T")[0], discharge_notes: "" });
  const [dischargeSaving, setDischargeSaving] = useState(false);

  useEffect(() => {
    base44.entities.Patient.list("-created_date", 300).then(data => {
      setPatients(data);
      setLoading(false);
    });
  }, []);

  const filtered = patients.filter(p =>
    !search ||
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.nss?.toLowerCase().includes(search.toLowerCase()) ||
    p.medical_record_number?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (patient) => {
    setForm({
      weight_kg: patient.weight_kg || "",
      height_cm: patient.height_cm || "",
      diagnosis: patient.diagnosis || "",
      cie10_code: patient.cie10_code || "",
      allergies: patient.allergies || "",
      creatinine_clearance: patient.creatinine_clearance || "",
      hepatic_function: patient.hepatic_function || "Normal",
      status: patient.status || "Activo",
    });
    setEditing(patient);
  };

  const handleSave = async () => {
    setSaving(true);
    const weight = parseFloat(form.weight_kg);
    const height = parseFloat(form.height_cm);
    const bsa = calculateBSA(weight, height);
    const data = {
      weight_kg: weight,
      height_cm: height,
      bsa: Math.round(bsa * 100) / 100,
      diagnosis: form.diagnosis,
      cie10_code: form.cie10_code,
      allergies: form.allergies,
      creatinine_clearance: form.creatinine_clearance ? parseFloat(form.creatinine_clearance) : undefined,
      hepatic_function: form.hepatic_function,
      status: form.status,
    };
    const updated = await base44.entities.Patient.update(editing.id, data);
    setPatients(prev => prev.map(p => p.id === editing.id ? { ...p, ...updated } : p));
    setSaving(false);
    setEditing(null);
  };

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const openDischarge = (patient) => {
    setDischargeForm({ status: "Fallecido", discharge_date: new Date().toISOString().split("T")[0], discharge_notes: "" });
    setDischarging(patient);
  };

  const handleDischarge = async () => {
    setDischargeSaving(true);
    const updated = await base44.entities.Patient.update(discharging.id, {
      status: dischargeForm.status,
      discharge_date: dischargeForm.discharge_date,
      discharge_notes: dischargeForm.discharge_notes,
    });
    setPatients(prev => prev.map(p => p.id === discharging.id ? { ...p, ...updated } : p));
    setDischargeSaving(false);
    setDischarging(null);
  };

  const bsaPreview = form.weight_kg && form.height_cm
    ? calculateBSA(parseFloat(form.weight_kg), parseFloat(form.height_cm)).toFixed(4)
    : null;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
        <p className="text-sm text-muted-foreground mt-1">Consulta y actualización de datos clínicos</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, NSS o expediente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No se encontraron pacientes</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Paciente", "NSS", "Expediente", "Peso", "Talla", "SCT", "Diagnóstico", "Estado", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{p.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{p.nss || "—"}</td>
                    <td className="px-4 py-3 text-sm font-mono">{p.medical_record_number}</td>
                    <td className="px-4 py-3 text-sm font-mono">{p.weight_kg} kg</td>
                    <td className="px-4 py-3 text-sm font-mono">{p.height_cm} cm</td>
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-primary">{p.bsa?.toFixed(2)} m²</td>
                    <td className="px-4 py-3 text-sm max-w-48 truncate">{p.diagnosis}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                         p.status === "Activo" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : p.status === "Fallecido" ? "bg-red-50 text-red-700 border-red-200"
                        : p.status === "Tratamiento completado" ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {p.status || "Activo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Button>
                        {p.status === "Activo" && (
                          <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openDischarge(p)}>
                            <LogOut className="h-3.5 w-3.5" /> Alta
                          </Button>
                        )}
                      </div>
                    </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar datos clínicos</DialogTitle>
            <p className="text-sm text-muted-foreground">{editing?.full_name}</p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label>Peso (kg) *</Label>
              <Input type="number" step="0.1" value={form.weight_kg} onChange={e => set("weight_kg", e.target.value)} />
            </div>
            <div>
              <Label>Talla (cm) *</Label>
              <Input type="number" step="0.1" value={form.height_cm} onChange={e => set("height_cm", e.target.value)} />
            </div>
            {bsaPreview && (
              <div className="col-span-2 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  SCT calculada: <span className="text-primary font-mono">{bsaPreview} m²</span>
                </p>
              </div>
            )}
            <div className="col-span-2">
              <Label>Diagnóstico *</Label>
              <Input value={form.diagnosis} onChange={e => set("diagnosis", e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label>Código CIE-10</Label>
              <Input value={form.cie10_code} onChange={e => set("cie10_code", e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label>Alergias</Label>
              <Input value={form.allergies} onChange={e => set("allergies", e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label>Depuración creatinina (mL/min)</Label>
              <Input type="number" value={form.creatinine_clearance} onChange={e => set("creatinine_clearance", e.target.value)} />
            </div>
            <div>
              <Label>Función hepática</Label>
              <Select value={form.hepatic_function} onValueChange={v => set("hepatic_function", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Leve">Deterioro leve</SelectItem>
                  <SelectItem value="Moderada">Deterioro moderado</SelectItem>
                  <SelectItem value="Severa">Deterioro severo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                  <SelectItem value="Fallecido">Fallecido</SelectItem>
                  <SelectItem value="Tratamiento completado">Tratamiento completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.weight_kg || !form.height_cm || !form.diagnosis}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

       {/* Discharge Dialog */}
       <Dialog open={!!discharging} onOpenChange={open => !open && setDischarging(null)}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Dar de alta al paciente</DialogTitle>
             <p className="text-sm text-muted-foreground">{discharging?.full_name}</p>
           </DialogHeader>
           <div className="space-y-4 mt-2">
             <div>
               <Label>Motivo del alta *</Label>
               <Select value={dischargeForm.status} onValueChange={v => setDischargeForm(f => ({ ...f, status: v }))}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Fallecido">Fallecimiento</SelectItem>
                   <SelectItem value="Tratamiento completado">Término de tratamiento</SelectItem>
                   <SelectItem value="Inactivo">Otro motivo</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div>
               <Label>Fecha del alta</Label>
               <Input type="date" value={dischargeForm.discharge_date} onChange={e => setDischargeForm(f => ({ ...f, discharge_date: e.target.value }))} />
             </div>
             <div>
               <Label>Notas adicionales</Label>
               <Input value={dischargeForm.discharge_notes} onChange={e => setDischargeForm(f => ({ ...f, discharge_notes: e.target.value.toUpperCase() }))} placeholder="Observaciones opcionales..." />
             </div>
           </div>
           <div className="flex justify-end gap-2 mt-4">
             <Button variant="outline" onClick={() => setDischarging(null)}>Cancelar</Button>
             <Button
               onClick={handleDischarge}
               disabled={dischargeSaving}
               className={dischargeForm.status === "Fallecido" ? "bg-red-600 hover:bg-red-700" : ""}
             >
               {dischargeSaving ? "Guardando..." : "Confirmar alta"}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
      </div>
      );
}