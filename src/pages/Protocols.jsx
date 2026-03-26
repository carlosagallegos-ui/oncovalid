import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getProtocolsByIndication } from "@/lib/chemoProtocols";
import { Search, ChevronDown, ChevronUp, Pill, Beaker, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const emptyDrug = () => ({ drug_name: "", dose_per_unit: "", dose_basis: "mg/m²", route: "IV", infusion_time: "", diluent: "", volume_ml: "", note: "" });

export default function Protocols() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [customProtocols, setCustomProtocols] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", indication: "", cycle_days: "", total_cycles: "", notes: "", drugs: [emptyDrug()]
  });

  const builtIn = getProtocolsByIndication();

  useEffect(() => {
    base44.entities.Protocol.list("-created_date", 200).then(setCustomProtocols);
  }, []);

  // Merge custom protocols into grouped structure
  const grouped = { ...builtIn };
  customProtocols.forEach(p => {
    const ind = p.indication || "Personalizados";
    if (!grouped[ind]) grouped[ind] = [];
    // avoid duplication
    if (!grouped[ind].find(x => x.id === p.id)) {
      grouped[ind] = [...grouped[ind], { ...p, key: p.id, isCustom: true }];
    }
  });

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const filteredGrouped = {};
  Object.entries(grouped).forEach(([indication, protocols]) => {
    const filtered = protocols.filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      indication.toLowerCase().includes(search.toLowerCase()) ||
      (p.drugs || []).some(d => d.drug_name?.toLowerCase().includes(search.toLowerCase()))
    );
    if (filtered.length > 0) filteredGrouped[indication] = filtered;
  });

  const setDrug = (i, field, value) => {
    const updated = [...form.drugs];
    updated[i] = { ...updated[i], [field]: value };
    setForm(f => ({ ...f, drugs: updated }));
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      cycle_days: parseFloat(form.cycle_days) || null,
      total_cycles: parseFloat(form.total_cycles) || null,
      drugs: form.drugs.map(d => ({
        ...d,
        dose_per_unit: parseFloat(d.dose_per_unit) || null,
        volume_ml: parseFloat(d.volume_ml) || null,
      }))
    };
    const created = await base44.entities.Protocol.create(data);
    setCustomProtocols(prev => [created, ...prev]);
    setShowForm(false);
    setForm({ name: "", indication: "", cycle_days: "", total_cycles: "", notes: "", drugs: [emptyDrug()] });
    setSaving(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await base44.entities.Protocol.delete(id);
    setCustomProtocols(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Protocolos de Quimioterapia</h1>
          <p className="text-sm text-muted-foreground mt-1">Referencia de esquemas y dosificación estándar</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Nuevo Protocolo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar protocolo, indicación o medicamento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-6">
        {Object.entries(filteredGrouped).map(([indication, protocols]) => (
          <div key={indication}>
            <div className="flex items-center gap-2 mb-3">
              <Beaker className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{indication}</h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {protocols.map(protocol => (
                <div key={protocol.key || protocol.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => toggle(protocol.key || protocol.id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{protocol.name}</p>
                        {protocol.isCustom && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Personalizado</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(protocol.drugs || []).length} medicamentos · Ciclo cada {protocol.cycle_days} días · {protocol.total_cycles} ciclos
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {protocol.isCustom && (
                        <span onClick={(e) => handleDelete(protocol.id, e)} className="p-1.5 rounded hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {expanded[protocol.key || protocol.id]
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {expanded[protocol.key || protocol.id] && (
                    <div className="px-5 pb-4 border-t border-border">
                      <table className="w-full mt-3">
                        <thead>
                          <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                            {["Medicamento", "Dosis", "Vía", "Infusión", "Diluyente", "Volumen"].map(h => (
                              <th key={h} className="text-left pb-2 pr-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(protocol.drugs || []).map((drug, i) => (
                            <tr key={i} className="border-t border-border/50 text-sm">
                              <td className="py-2.5 pr-4">
                                <div className="flex items-center gap-2">
                                  <Pill className="h-3 w-3 text-primary" />
                                  <span className="font-medium">{drug.drug_name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 font-mono text-xs pr-4">{drug.dose_per_unit} {drug.dose_basis}</td>
                              <td className="py-2.5 pr-4">{drug.route}</td>
                              <td className="py-2.5 text-muted-foreground pr-4">{drug.infusion_time}</td>
                              <td className="py-2.5 text-muted-foreground pr-4">{drug.diluent}</td>
                              <td className="py-2.5 font-mono text-xs">{drug.volume_ml > 0 ? `${drug.volume_ml} mL` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(protocol.drugs || []).some(d => d.note) && (
                        <div className="mt-3 space-y-1">
                          {(protocol.drugs || []).filter(d => d.note).map((drug, i) => (
                            <p key={i} className="text-xs text-muted-foreground">📌 {drug.drug_name}: {drug.note}</p>
                          ))}
                        </div>
                      )}
                      {protocol.notes && <p className="text-xs text-muted-foreground mt-3 italic">{protocol.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New Protocol Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Protocolo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nombre del protocolo *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. FOLFOX-6" />
              </div>
              <div className="col-span-2">
                <Label>Indicación *</Label>
                <Input value={form.indication} onChange={e => setForm(f => ({ ...f, indication: e.target.value }))} placeholder="Ej. Cáncer colorrectal" />
              </div>
              <div>
                <Label>Días entre ciclos</Label>
                <Input type="number" value={form.cycle_days} onChange={e => setForm(f => ({ ...f, cycle_days: e.target.value }))} placeholder="21" />
              </div>
              <div>
                <Label>Total de ciclos</Label>
                <Input type="number" value={form.total_cycles} onChange={e => setForm(f => ({ ...f, total_cycles: e.target.value }))} placeholder="6" />
              </div>
              <div className="col-span-2">
                <Label>Notas generales</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones opcionales..." />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Medicamentos</Label>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => setForm(f => ({ ...f, drugs: [...f.drugs, emptyDrug()] }))}>
                  <Plus className="h-3 w-3" /> Agregar
                </Button>
              </div>
              <div className="space-y-3">
                {form.drugs.map((drug, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Medicamento {i + 1}</span>
                      {form.drugs.length > 1 && (
                        <button onClick={() => setForm(f => ({ ...f, drugs: f.drugs.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <Input placeholder="Nombre del medicamento" value={drug.drug_name} onChange={e => setDrug(i, "drug_name", e.target.value)} />
                      </div>
                      <Input placeholder="Dosis (ej. 85)" type="number" value={drug.dose_per_unit} onChange={e => setDrug(i, "dose_per_unit", e.target.value)} />
                      <Input placeholder="Base (ej. mg/m²)" value={drug.dose_basis} onChange={e => setDrug(i, "dose_basis", e.target.value)} />
                      <Input placeholder="Vía (ej. IV)" value={drug.route} onChange={e => setDrug(i, "route", e.target.value)} />
                      <Input placeholder="Tiempo infusión" value={drug.infusion_time} onChange={e => setDrug(i, "infusion_time", e.target.value)} />
                      <Input placeholder="Diluyente" value={drug.diluent} onChange={e => setDrug(i, "diluent", e.target.value)} />
                      <Input placeholder="Volumen mL" type="number" value={drug.volume_ml} onChange={e => setDrug(i, "volume_ml", e.target.value)} />
                      <div className="col-span-2">
                        <Input placeholder="Nota (opcional)" value={drug.note} onChange={e => setDrug(i, "note", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.indication}>
                {saving ? "Guardando..." : "Guardar Protocolo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}