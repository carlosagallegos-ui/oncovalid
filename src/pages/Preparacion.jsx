import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Printer } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import PreparationSheet from "@/components/PreparationSheet";

export default function Preparacion() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.Prescription.list("-created_date", 200).then(data => {
      setPrescriptions(data);
      setLoading(false);
    });
  }, []);

  const filtered = prescriptions.filter(p =>
    !search ||
    p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.protocol_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.prescribing_doctor?.toLowerCase().includes(search.toLowerCase())
  );

  const printPrep = (rx) => {
    const el = document.getElementById(`prep-${rx.id}`);
    if (!el) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Preparación - ${rx.patient_name}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 24px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { color: #555; font-size: 12px; margin-bottom: 20px; }
        .drug-block { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .drug-header { background: #f4f4f4; padding: 10px 14px; font-weight: bold; font-size: 13px; border-bottom: 1px solid #ddd; }
        .drug-body { padding: 14px; }
        .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 14px; }
        .box { background: #f8f8f8; border-radius: 6px; padding: 8px; text-align: center; }
        .box .label { font-size: 10px; color: #777; margin-bottom: 3px; }
        .box .val { font-weight: bold; font-size: 14px; }
        ol { margin: 0 0 14px 18px; padding: 0; }
        ol li { margin-bottom: 8px; }
        .legend { border: 2px solid #0ea5e9; border-radius: 8px; padding: 12px; background: #f0faff; }
        .legend-title { font-size: 11px; font-weight: bold; color: #0369a1; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; }
        .grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; text-align: center; }
        .grid3 .label { font-size: 10px; color: #777; }
        .grid3 .val { font-weight: bold; color: #0369a1; font-size: 16px; }
        .grid3 .sub { font-size: 10px; color: #888; }
        @media print { body { margin: 10px; } }
      </style></head><body>
      <h1>Hoja de Preparación</h1>
      <div class="meta">
        Paciente: <strong>${rx.patient_name}</strong> &nbsp;|&nbsp;
        SCT: ${rx.patient_bsa?.toFixed(2)} m² &nbsp;|&nbsp; Peso: ${rx.patient_weight} kg<br/>
        Médico: ${rx.prescribing_doctor} &nbsp;|&nbsp; Cédula: ${rx.doctor_license}<br/>
        Protocolo: ${rx.protocol_name} &nbsp;|&nbsp; Ciclo C${rx.cycle_number} D${rx.day_of_cycle} &nbsp;|&nbsp; Fecha: ${formatDate(rx.prescription_date)}
      </div>
      ${el.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hojas de Preparación</h1>
        <p className="text-sm text-muted-foreground mt-1">Instrucciones de preparación por prescripción</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar paciente, protocolo o médico..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
          No se encontraron prescripciones
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(rx => (
            <div key={rx.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{rx.patient_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rx.protocol_name} · C{rx.cycle_number} D{rx.day_of_cycle} · {formatDate(rx.prescription_date || rx.created_date)} · Dr. {rx.prescribing_doctor}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setSelected(selected === rx.id ? null : rx.id)}>
                    {selected === rx.id ? "Ocultar" : "Ver preparación"}
                  </Button>
                  {selected === rx.id && (
                    <Button size="sm" className="gap-1 text-xs" onClick={() => printPrep(rx)}>
                      <Printer className="h-3 w-3" /> Imprimir
                    </Button>
                  )}
                </div>
              </div>
              {selected === rx.id && (
                <div className="p-4" id={`prep-${rx.id}`}>
                  <PreparationSheet drugs={rx.drugs} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}