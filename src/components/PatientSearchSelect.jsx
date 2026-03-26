import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, UserPlus, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateBSA } from "@/lib/chemoProtocols";

export default function PatientSearchSelect({ onSelect, selectedPatient }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newPatient, setNewPatient] = useState({
    full_name: "", medical_record_number: "", nss: "", date_of_birth: "",
    gender: "Masculino", weight_kg: "", height_cm: "",
    diagnosis: "", cie10_code: "", allergies: "",
    creatinine_clearance: "", hepatic_function: "Normal", status: "Activo"
  });

  useEffect(() => {
    base44.entities.Patient.list("-created_date", 100).then(setPatients);
  }, []);

  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.medical_record_number?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    const weight = parseFloat(newPatient.weight_kg);
    const height = parseFloat(newPatient.height_cm);
    const bsa = calculateBSA(weight, height);
    const data = {
      ...newPatient,
      weight_kg: weight,
      height_cm: height,
      bsa: Math.round(bsa * 100) / 100,
      creatinine_clearance: newPatient.creatinine_clearance ? parseFloat(newPatient.creatinine_clearance) : undefined
    };
    const created = await base44.entities.Patient.create(data);
    setPatients(prev => [created, ...prev]);
    onSelect(created);
    setShowNew(false);
  };

  return (
    <div className="space-y-3">
      {selectedPatient ? (
        <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{selectedPatient.full_name}</p>
              <p className="text-xs text-muted-foreground">
                Exp: {selectedPatient.medical_record_number}{selectedPatient.nss ? ` · NSS: ${selectedPatient.nss}` : ""} · SCT: {selectedPatient.bsa?.toFixed(2)} m² · {selectedPatient.weight_kg} kg · SCT: {selectedPatient.bsa?.toFixed(2)} m² · {selectedPatient.weight_kg} kg
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>Cambiar</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o expediente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {search && (
            <div className="border rounded-lg max-h-48 overflow-auto">
              {filtered.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No se encontraron pacientes</p>
              ) : (
                filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onSelect(p); setSearch(""); }}
                    className="w-full text-left px-4 py-3 hover:bg-muted border-b last:border-0 transition-colors"
                  >
                    <p className="text-sm font-medium">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">Exp: {p.medical_record_number} · {p.diagnosis}</p>
                  </button>
                ))
              )}
            </div>
          )}

          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                Registrar nuevo paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Paciente</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="col-span-2">
                  <Label>Nombre completo *</Label>
                  <Input value={newPatient.full_name} onChange={e => setNewPatient(p => ({ ...p, full_name: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <Label>No. Expediente *</Label>
                  <Input value={newPatient.medical_record_number} onChange={e => setNewPatient(p => ({ ...p, medical_record_number: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <Label>NSS</Label>
                  <Input value={newPatient.nss} onChange={e => setNewPatient(p => ({ ...p, nss: e.target.value.toUpperCase() }))} placeholder="Núm. Seguridad Social" />
                </div>
                <div>
                  <Label>Fecha de nacimiento</Label>
                  <Input type="date" value={newPatient.date_of_birth} onChange={e => setNewPatient(p => ({ ...p, date_of_birth: e.target.value }))} />
                </div>
                <div>
                  <Label>Género</Label>
                  <Select value={newPatient.gender} onValueChange={v => setNewPatient(p => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Peso (kg) *</Label>
                  <Input type="number" value={newPatient.weight_kg} onChange={e => setNewPatient(p => ({ ...p, weight_kg: e.target.value }))} />
                </div>
                <div>
                  <Label>Talla (cm) *</Label>
                  <Input type="number" value={newPatient.height_cm} onChange={e => setNewPatient(p => ({ ...p, height_cm: e.target.value }))} />
                </div>
                {newPatient.weight_kg && newPatient.height_cm && (
                  <div className="col-span-2 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      SCT calculada: <span className="text-primary font-mono">{calculateBSA(parseFloat(newPatient.weight_kg), parseFloat(newPatient.height_cm)).toFixed(4)} m²</span>
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <Label>Diagnóstico *</Label>
                  <Input value={newPatient.diagnosis} onChange={e => setNewPatient(p => ({ ...p, diagnosis: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <Label>Código CIE-10</Label>
                  <Input value={newPatient.cie10_code} onChange={e => setNewPatient(p => ({ ...p, cie10_code: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <Label>Alergias</Label>
                  <Input value={newPatient.allergies} onChange={e => setNewPatient(p => ({ ...p, allergies: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <Label>Depuración Creatinina (mL/min)</Label>
                  <Input type="number" value={newPatient.creatinine_clearance} onChange={e => setNewPatient(p => ({ ...p, creatinine_clearance: e.target.value }))} />
                </div>
                <div>
                  <Label>Función hepática</Label>
                  <Select value={newPatient.hepatic_function} onValueChange={v => setNewPatient(p => ({ ...p, hepatic_function: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Leve">Deterioro leve</SelectItem>
                      <SelectItem value="Moderada">Deterioro moderado</SelectItem>
                      <SelectItem value="Severa">Deterioro severo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={!newPatient.full_name || !newPatient.weight_kg || !newPatient.height_cm || !newPatient.diagnosis}>
                  Registrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}