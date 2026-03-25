import { CHEMO_PROTOCOLS, getProtocolsByIndication } from "@/lib/chemoProtocols";
import { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ProtocolSelector({ onSelect, selected }) {
  const [search, setSearch] = useState("");
  const grouped = getProtocolsByIndication();

  const filteredGrouped = {};
  Object.entries(grouped).forEach(([indication, protocols]) => {
    const filtered = protocols.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      indication.toLowerCase().includes(search.toLowerCase())
    );
    if (filtered.length > 0) filteredGrouped[indication] = filtered;
  });

  if (selected) {
    const protocol = CHEMO_PROTOCOLS[selected];
    return (
      <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{protocol.name}</p>
            <p className="text-xs text-muted-foreground">
              {protocol.indication} · Ciclo cada {protocol.cycle_days} días · {protocol.total_cycles} ciclos
            </p>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-primary hover:underline font-medium"
          >
            Cambiar
          </button>
        </div>
        <div className="mt-3 space-y-1">
          {protocol.drugs.map((drug, i) => (
            <div key={i} className="text-xs text-muted-foreground">
              • {drug.drug_name}: {drug.dose_per_unit} {drug.dose_basis} — {drug.route} ({drug.infusion_time})
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar protocolo o indicación..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="border rounded-lg max-h-80 overflow-auto">
        {Object.entries(filteredGrouped).map(([indication, protocols]) => (
          <div key={indication}>
            <div className="px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0">
              {indication}
            </div>
            {protocols.map(protocol => (
              <button
                key={protocol.key}
                onClick={() => onSelect(protocol.key)}
                className="w-full text-left px-4 py-3 hover:bg-muted border-b last:border-0 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{protocol.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {protocol.drugs.length} medicamentos · Cada {protocol.cycle_days} días
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}