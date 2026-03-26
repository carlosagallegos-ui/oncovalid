import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle2, Truck, Clock, FlaskConical } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const STEP_CONFIG = {
  pending:    { label: "Pendiente",    bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200" },
  inspected:  { label: "Inspeccionada", bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  delivered:  { label: "Entregada",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

function getStep(rx) {
  if (rx.delivered) return "delivered";
  if (rx.inspected) return "inspected";
  return "pending";
}

export default function Salidas() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStep, setFilterStep] = useState("all");
  const [dialog, setDialog] = useState(null); // { rx, action: "inspect" | "deliver" }
  const [form, setForm] = useState({ delivered_to: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Prescription.filter({ validation_status: "Validada" }, "-prescription_date", 200)
      .then(data => { setPrescriptions(data); setLoading(false); });
  }, []);

  const filtered = prescriptions.filter(rx => {
    const matchSearch = !search ||
      rx.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      rx.protocol_name?.toLowerCase().includes(search.toLowerCase());
    const step = getStep(rx);
    const matchStep = filterStep === "all" || step === filterStep;
    return matchSearch && matchStep;
  });

  const openAction = (rx, action) => {
    setForm({ delivered_to: "" });
    setDialog({ rx, action });
  };

  const handleConfirm = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    const now = new Date().toISOString();
    let data = {};
    if (dialog.action === "inspect") {
      data = { inspected: true, inspected_by: user.full_name || user.email, inspected_date: now };
    } else {
      data = { delivered: true, delivered_by: user.full_name || user.email, delivered_date: now, delivered_to: form.delivered_to };
    }
    const updated = await base44.entities.Prescription.update(dialog.rx.id, data);
    setPrescriptions(prev => prev.map(p => p.id === dialog.rx.id ? { ...p, ...updated } : p));
    setSaving(false);
    setDialog(null);
  };

  const stats = {
    pending: prescriptions.filter(rx => getStep(rx) === "pending").length,
    inspected: prescriptions.filter(rx => getStep(rx) === "inspected").length,
    delivered: prescriptions.filter(rx => getStep(rx) === "delivered").length,
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Salidas de Medicamentos</h1>
        <p className="text-sm text-muted-foreground mt-1">Control de inspección y entrega de mezclas validadas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: "pending",   label: "Por inspeccionar", icon: Clock,          color: "text-amber-600",   bg: "bg-amber-50" },
          { key: "inspected", label: "Por entregar",     icon: CheckCircle2,   color: "text-blue-600",    bg: "bg-blue-50" },
          { key: "delivered", label: "Entregadas",        icon: Truck,          color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setFilterStep(prev => prev === s.key ? "all" : s.key)}
              className={`bg-card rounded-xl border p-4 text-left transition-all ${filterStep === s.key ? "border-primary ring-1 ring-primary" : "border-border hover:shadow-sm"}`}
            >
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{stats[s.key]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar paciente o protocolo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          No se encontraron mezclas
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rx => {
            const step = getStep(rx);
            const cfg = STEP_CONFIG[step];
            return (
              <div key={rx.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FlaskConical className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{rx.patient_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rx.protocol_name} · C{rx.cycle_number} D{rx.day_of_cycle} · {formatDate(rx.prescription_date || rx.created_date)}
                      </p>
                      <p className="text-xs text-muted-foreground">{rx.drugs?.length} mezcla(s) · Dr. {rx.prescribing_doctor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {step === "pending" && <Clock className="h-3 w-3" />}
                      {step === "inspected" && <CheckCircle2 className="h-3 w-3" />}
                      {step === "delivered" && <Truck className="h-3 w-3" />}
                      {cfg.label}
                    </span>
                    {step === "pending" && (
                      <Button size="sm" variant="outline" className="gap-1 text-blue-700 border-blue-300 hover:bg-blue-50" onClick={() => openAction(rx, "inspect")}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Marcar inspeccionada
                      </Button>
                    )}
                    {step === "inspected" && (
                      <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => openAction(rx, "deliver")}>
                        <Truck className="h-3.5 w-3.5" /> Registrar entrega
                      </Button>
                    )}
                    {step === "delivered" && (
                      <div className="text-xs text-muted-foreground text-right">
                        <p>Entregada a: <span className="font-medium">{rx.delivered_to || "—"}</span></p>
                        <p>{formatDateTime(rx.delivered_date)}</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Timeline */}
                <div className="px-5 pb-3 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-2.5">
                  <div className={`flex items-center gap-1 ${rx.inspected ? "text-blue-600" : ""}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    {rx.inspected ? <span>Inspeccionada por <b>{rx.inspected_by}</b> · {formatDateTime(rx.inspected_date)}</span> : <span>Sin inspección</span>}
                  </div>
                  {rx.delivered && (
                    <>
                      <span>·</span>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Truck className="h-3 w-3" />
                        <span>Entregada por <b>{rx.delivered_by}</b> · {formatDateTime(rx.delivered_date)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={!!dialog} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialog?.action === "inspect" ? "Confirmar inspección" : "Registrar entrega"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{dialog?.rx?.patient_name} · {dialog?.rx?.protocol_name}</p>
          </DialogHeader>
          {dialog?.action === "deliver" && (
            <div className="mt-2">
              <Label>Entregado a (servicio / enfermera)</Label>
              <Input
                value={form.delivered_to}
                onChange={e => setForm(f => ({ ...f, delivered_to: e.target.value.toUpperCase() }))}
                placeholder="Ej. ONCOLOGÍA PISO 3 / ENF. LÓPEZ"
              />
            </div>
          )}
          {dialog?.action === "inspect" && (
            <p className="text-sm text-muted-foreground mt-2">Se registrará la inspección física de la mezcla con su nombre de usuario y la fecha/hora actual.</p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialog(null)}>Cancelar</Button>
            <Button onClick={handleConfirm} disabled={saving}>
              {saving ? "Guardando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}