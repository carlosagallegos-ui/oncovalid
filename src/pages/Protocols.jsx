import { useState } from "react";
import { getProtocolsByIndication, CHEMO_PROTOCOLS } from "@/lib/chemoProtocols";
import { Search, ChevronDown, ChevronUp, Pill, Beaker } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Protocols() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const grouped = getProtocolsByIndication();

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const filteredGrouped = {};
  Object.entries(grouped).forEach(([indication, protocols]) => {
    const filtered = protocols.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      indication.toLowerCase().includes(search.toLowerCase()) ||
      p.drugs.some(d => d.drug_name.toLowerCase().includes(search.toLowerCase()))
    );
    if (filtered.length > 0) filteredGrouped[indication] = filtered;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Protocolos de Quimioterapia</h1>
        <p className="text-sm text-muted-foreground mt-1">Referencia de esquemas y dosificación estándar</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar protocolo, indicación o medicamento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      <div className="space-y-6">
        {Object.entries(filteredGrouped).map(([indication, protocols]) => (
          <div key={indication}>
            <div className="flex items-center gap-2 mb-3">
              <Beaker className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{indication}</h2>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            <div className="space-y-3">
              {protocols.map(protocol => (
                <div key={protocol.key} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => toggle(protocol.key)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-sm">{protocol.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {protocol.drugs.length} medicamentos · Ciclo cada {protocol.cycle_days} días · {protocol.total_cycles} ciclos
                      </p>
                    </div>
                    {expanded[protocol.key] ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expanded[protocol.key] && (
                    <div className="px-5 pb-4 border-t border-border">
                      <table className="w-full mt-3">
                        <thead>
                          <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                            <th className="text-left pb-2">Medicamento</th>
                            <th className="text-left pb-2">Dosis</th>
                            <th className="text-left pb-2">Vía</th>
                            <th className="text-left pb-2">Infusión</th>
                            <th className="text-left pb-2">Diluyente</th>
                            <th className="text-left pb-2">Volumen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {protocol.drugs.map((drug, i) => (
                            <tr key={i} className="border-t border-border/50 text-sm">
                              <td className="py-2.5 pr-4">
                                <div className="flex items-center gap-2">
                                  <Pill className="h-3 w-3 text-primary" />
                                  <span className="font-medium">{drug.drug_name}</span>
                                </div>
                              </td>
                              <td className="py-2.5 font-mono text-xs">{drug.dose_per_unit} {drug.dose_basis}</td>
                              <td className="py-2.5">{drug.route}</td>
                              <td className="py-2.5 text-muted-foreground">{drug.infusion_time}</td>
                              <td className="py-2.5 text-muted-foreground">{drug.diluent}</td>
                              <td className="py-2.5 font-mono text-xs">{drug.volume_ml > 0 ? `${drug.volume_ml} mL` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {protocol.drugs.some(d => d.note) && (
                        <div className="mt-3 space-y-1">
                          {protocol.drugs.filter(d => d.note).map((drug, i) => (
                            <p key={i} className="text-xs text-muted-foreground">
                              📌 {drug.drug_name}: {drug.note}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}