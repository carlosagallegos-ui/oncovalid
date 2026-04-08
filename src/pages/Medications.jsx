import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CHEMO_PROTOCOLS } from "@/lib/chemoProtocols";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, FlaskConical, AlertTriangle, Package, CheckCircle, XCircle, Clock } from "lucide-react";
import moment from "moment";

// Extraer lista única de medicamentos de los protocolos
const PROTOCOL_DRUGS = [...new Set(
  Object.values(CHEMO_PROTOCOLS).flatMap(p => p.drugs.map(d => d.drug_name))
)].sort();

function DrugNameInput({ value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = PROTOCOL_DRUGS.filter(d =>
    d.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <Input
        value={query}
        onChange={e => { setQuery(e.target.value.toUpperCase()); onChange(e.target.value.toUpperCase()); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar o escribir medicamento..."
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(drug => (
            <button
              key={drug}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(drug); setQuery(drug); setOpen(false); }}
            >
              {drug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  Disponible: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Agotado: "bg-red-50 text-red-700 border-red-200",
  Cuarentena: "bg-amber-50 text-amber-700 border-amber-200",
  Caducado: "bg-gray-100 text-gray-500 border-gray-200",
};

const EMPTY = {
  drug_name: "", concentration: "", concentration_unit: "mg",
  vial_volume_ml: "", presentation: "Frasco ampolleta",
  lot_number: "", expiration_date: "", quantity_received: "",
  quantity_available: "", supplier: "",
  received_date: new Date().toISOString().split("T")[0],
  storage_conditions: "", notes: "", status: "Disponible"
};

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Medication.list("-received_date", 300).then(data => {
      setMedications(data);
      setLoading(false);
    });
  }, []);

  const filtered = medications.filter(m =>
    !search ||
    m.drug_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.lot_number?.toLowerCase().includes(search.toLowerCase()) ||
    m.supplier?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (med) => { setForm({ ...med }); setEditing(med.id); setShowForm(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      concentration: parseFloat(form.concentration) || 0,
      vial_volume_ml: form.vial_volume_ml ? parseFloat(form.vial_volume_ml) : undefined,
      quantity_received: parseInt(form.quantity_received) || 0,
      quantity_available: form.quantity_available !== "" ? parseInt(form.quantity_available) : parseInt(form.quantity_received) || 0,
    };
    if (editing) {
      const updated = await base44.entities.Medication.update(editing, data);
      setMedications(prev => prev.map(m => m.id === editing ? updated : m));
    } else {
      const created = await base44.entities.Medication.create(data);
      setMedications(prev => [created, ...prev]);
    }
    setSaving(false);
    setShowForm(false);
  };

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const stats = {
    total: medications.length,
    disponible: medications.filter(m => m.status === "Disponible").length,
    agotado: medications.filter(m => m.status === "Agotado").length,
    porCaducar: medications.filter(m => m.expiration_date && moment(m.expiration_date).diff(moment(), "days") <= 30 && moment(m.expiration_date).diff(moment(), "days") >= 0).length,
    caducado: medications.filter(m => m.status === "Caducado" || (m.expiration_date && moment(m.expiration_date).isBefore(moment()))).length,
    totalFrascos: medications.reduce((sum, m) => sum + (m.quantity_available ?? m.quantity_received ?? 0), 0),
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario de Medicamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Alta y control de medicamentos entrantes</p>
        </div>
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Dar de alta
        </Button>
      </div>

      {/* Inventory Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total registros", value: stats.total, icon: Package, color: "text-foreground", bg: "bg-muted" },
          { label: "Disponibles", value: stats.disponible, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Agotados", value: stats.agotado, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Por caducar", value: stats.porCaducar, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Caducados", value: stats.caducado, icon: Clock, color: "text-gray-500", bg: "bg-gray-100" },
          { label: "Frascos disp.", value: stats.totalFrascos, icon: FlaskConical, color: "text-primary", bg: "bg-primary/10" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por medicamento, lote o proveedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No hay medicamentos registrados</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Medicamento", "Concentración", "Presentación", "Lote", "Caducidad", "Recibidos", "Disponibles", "Proveedor", "Estado", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(med => {
                  const isExpiringSoon = med.expiration_date && moment(med.expiration_date).diff(moment(), "days") <= 30;
                  return (
                    <tr key={med.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                          <span className="text-sm font-medium">{med.drug_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{med.concentration} {med.concentration_unit}{med.vial_volume_ml ? ` / ${med.vial_volume_ml} mL` : ""}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{med.presentation}</td>
                      <td className="px-4 py-3 text-sm font-mono">{med.lot_number || "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {med.expiration_date ? (
                          <span className={isExpiringSoon ? "text-amber-600 font-medium flex items-center gap-1" : ""}>
                            {isExpiringSoon && <AlertTriangle className="h-3 w-3" />}
                            {moment(med.expiration_date).format("DD/MM/YYYY")}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-center">{med.quantity_received}</td>
                      <td className="px-4 py-3 text-sm font-mono text-center font-semibold">{med.quantity_available ?? med.quantity_received}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{med.supplier || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[med.status] || STATUS_COLORS.Disponible}`}>
                          {med.status || "Disponible"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(med)}>Editar</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar medicamento" : "Alta de medicamento"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="col-span-2">
              <Label>Nombre del medicamento *</Label>
              <DrugNameInput value={form.drug_name} onChange={v => set("drug_name", v)} />
            </div>
            <div>
              <Label>Concentración *</Label>
              <Input type="number" step="0.01" value={form.concentration} onChange={e => set("concentration", e.target.value)} placeholder="Ej. 100" />
            </div>
            <div>
              <Label>Unidad *</Label>
              <Select value={form.concentration_unit} onValueChange={v => set("concentration_unit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mg">mg</SelectItem>
                  <SelectItem value="mg/mL">mg/mL</SelectItem>
                  <SelectItem value="UI">UI (Unidades Internacionales)</SelectItem>
                  <SelectItem value="mcg">mcg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="mEq">mEq</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Volumen del frasco (mL)</Label>
              <Input type="number" step="0.1" value={form.vial_volume_ml} onChange={e => set("vial_volume_ml", e.target.value)} placeholder="Ej. 20" />
            </div>
            <div>
              <Label>Presentación</Label>
              <Select value={form.presentation} onValueChange={v => set("presentation", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frasco ampolleta">Frasco ampolleta</SelectItem>
                  <SelectItem value="Ampolleta">Ampolleta</SelectItem>
                  <SelectItem value="Vial">Vial</SelectItem>
                  <SelectItem value="Bolsa">Bolsa</SelectItem>
                  <SelectItem value="Tableta">Tableta</SelectItem>
                  <SelectItem value="Cápsula">Cápsula</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número de lote</Label>
              <Input value={form.lot_number} onChange={e => set("lot_number", e.target.value.toUpperCase())} />
            </div>
            <div>
              <Label>Fecha de caducidad</Label>
              <Input type="date" value={form.expiration_date} onChange={e => set("expiration_date", e.target.value)} />
            </div>
            <div>
              <Label>Cantidad recibida (frascos) *</Label>
              <Input type="number" min={0} value={form.quantity_received} onChange={e => set("quantity_received", e.target.value)} />
            </div>
            <div>
              <Label>Cantidad disponible</Label>
              <Input type="number" min={0} value={form.quantity_available} onChange={e => set("quantity_available", e.target.value)} placeholder="Igual a recibidos si está vacío" />
            </div>
            <div>
              <Label>Fecha de recepción</Label>
              <Input type="date" value={form.received_date} onChange={e => set("received_date", e.target.value)} />
            </div>
            <div>
              <Label>Proveedor</Label>
              <Input value={form.supplier} onChange={e => set("supplier", e.target.value.toUpperCase())} />
            </div>
            <div className="col-span-2">
              <Label>Condiciones de almacenamiento</Label>
              <Input value={form.storage_conditions} onChange={e => set("storage_conditions", e.target.value.toUpperCase())} placeholder="Ej. REFRIGERACIÓN 2-8°C" />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disponible">Disponible</SelectItem>
                  <SelectItem value="Agotado">Agotado</SelectItem>
                  <SelectItem value="Cuarentena">Cuarentena</SelectItem>
                  <SelectItem value="Caducado">Caducado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Observaciones</Label>
              <Input value={form.notes} onChange={e => set("notes", e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.drug_name || !form.concentration || !form.quantity_received}>
              {saving ? "Guardando..." : editing ? "Actualizar" : "Dar de alta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}