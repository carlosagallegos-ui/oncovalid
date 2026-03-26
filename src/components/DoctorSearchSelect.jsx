import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, UserPlus, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function DoctorSearchSelect({ onSelect, selectedDoctor }) {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ full_name: "", license: "", specialty: "", institution: "", matricula: "" });

  useEffect(() => {
    base44.entities.Doctor.list("-created_date", 200).then(setDoctors);
  }, []);

  const filtered = doctors.filter(d =>
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.license?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    const created = await base44.entities.Doctor.create(newDoctor);
    setDoctors(prev => [created, ...prev]);
    onSelect(created);
    setShowNew(false);
    setNewDoctor({ full_name: "", license: "", specialty: "", institution: "", matricula: "" });
  };

  return (
    <div className="space-y-3">
      {selectedDoctor ? (
        <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{selectedDoctor.full_name}</p>
              <p className="text-xs text-muted-foreground">
                Cédula: {selectedDoctor.license}{selectedDoctor.specialty ? ` · ${selectedDoctor.specialty}` : ""}{selectedDoctor.institution ? ` · ${selectedDoctor.institution}` : ""}
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
              placeholder="Buscar médico por nombre, cédula o especialidad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {search && (
            <div className="border rounded-lg max-h-48 overflow-auto">
              {filtered.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No se encontraron médicos</p>
              ) : (
                filtered.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { onSelect(d); setSearch(""); }}
                    className="w-full text-left px-4 py-3 hover:bg-muted border-b last:border-0 transition-colors"
                  >
                    <p className="text-sm font-medium">{d.full_name}</p>
                    <p className="text-xs text-muted-foreground">Cédula: {d.license}{d.specialty ? ` · ${d.specialty}` : ""}</p>
                  </button>
                ))
              )}
            </div>
          )}

          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                Registrar nuevo médico
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo Médico</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="col-span-2">
                    <Label>Nombre completo *</Label>
                    <Input value={newDoctor.full_name} onChange={e => setNewDoctor(p => ({ ...p, full_name: e.target.value.toUpperCase() }))} placeholder="DR. ..." />
                  </div>
                  <div>
                    <Label>Cédula profesional *</Label>
                    <Input value={newDoctor.license} onChange={e => setNewDoctor(p => ({ ...p, license: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <Label>Matrícula médica *</Label>
                    <Input value={newDoctor.matricula} onChange={e => setNewDoctor(p => ({ ...p, matricula: e.target.value.toUpperCase() }))} placeholder="Ej: MAT123456" />
                  </div>
                <div>
                  <Label>Especialidad</Label>
                  <Input value={newDoctor.specialty} onChange={e => setNewDoctor(p => ({ ...p, specialty: e.target.value.toUpperCase() }))} placeholder="Oncología..." />
                </div>
                <div className="col-span-2">
                  <Label>Institución / Hospital</Label>
                  <Input value={newDoctor.institution} onChange={e => setNewDoctor(p => ({ ...p, institution: e.target.value.toUpperCase() }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={!newDoctor.full_name || !newDoctor.license || !newDoctor.matricula}>
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