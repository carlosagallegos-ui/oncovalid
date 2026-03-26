import { useState, useMemo } from "react";
import { CHEMO_PROTOCOLS } from "@/lib/chemoProtocols";
import { Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Build unique drug catalog from all protocols
const ALL_DRUGS = (() => {
  const map = {};
  Object.values(CHEMO_PROTOCOLS).forEach(proto => {
    proto.drugs.forEach(drug => {
      if (!map[drug.drug_name]) map[drug.drug_name] = drug;
    });
  });
  return Object.values(map).sort((a, b) => a.drug_name.localeCompare(b.drug_name));
})();

// Detect best-matching protocol from selected drug names (Jaccard similarity)
function detectProtocol(selectedNames) {
  if (selectedNames.length === 0) return null;
  const selected = new Set(selectedNames.map(n => n.toLowerCase()));
  let bestMatch = null;
  let bestScore = 0;

  Object.entries(CHEMO_PROTOCOLS).forEach(([key, proto]) => {
    const protoDrugs = new Set(proto.drugs.map(d => d.drug_name.toLowerCase()));
    const matches = [...selected].filter(n => protoDrugs.has(n)).length;
    const score = matches / Math.max(selected.size, protoDrugs.size);
    if (score > bestScore && matches > 0) {
      bestScore = score;
      bestMatch = { key, ...proto, score };
    }
  });

  return bestScore >= 0.5 ? bestMatch : null;
}

export default function DrugSelector({ selectedDrugs, onDrugsChange, onProtocolDetected }) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = useMemo(() =>
    ALL_DRUGS.filter(d =>
      d.drug_name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedDrugs.find(s => s.drug_name === d.drug_name)
    ), [search, selectedDrugs]);

  const addDrug = (drug) => {
    const updated = [...selectedDrugs, { ...drug }];
    onDrugsChange(updated);
    onProtocolDetected(detectProtocol(updated.map(d => d.drug_name)));
    setSearch("");
    setShowSearch(false);
  };

  const removeDrug = (name) => {
    const updated = selectedDrugs.filter(d => d.drug_name !== name);
    onDrugsChange(updated);
    onProtocolDetected(detectProtocol(updated.map(d => d.drug_name)));
  };

  return (
    <div className="space-y-3">
      {/* Selected drugs list */}
      {selectedDrugs.length > 0 && (
        <div className="space-y-2">
          {selectedDrugs.map(drug => (
            <div key={drug.drug_name} className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-muted/30">
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <span className="font-medium">{drug.drug_name}</span>
                <span className="text-xs text-muted-foreground font-mono">{drug.dose_per_unit} {drug.dose_basis}</span>
                <span className="text-xs text-muted-foreground">{drug.route} · {drug.infusion_time}</span>
              </div>
              <button onClick={() => removeDrug(drug.drug_name)} className="ml-3 text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search / add */}
      {showSearch ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Buscar medicamento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="border rounded-lg max-h-56 overflow-auto bg-card shadow-sm">
            {filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No encontrado</p>
            ) : (
              filtered.map(drug => (
                <button
                  key={drug.drug_name}
                  onClick={() => addDrug(drug)}
                  className="w-full text-left px-4 py-3 hover:bg-muted border-b last:border-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{drug.drug_name}</span>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{drug.dose_per_unit} {drug.dose_basis}</span>
                      <span>{drug.route}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setShowSearch(false); setSearch(""); }}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="w-full gap-2" onClick={() => setShowSearch(true)}>
          <Plus className="h-4 w-4" />
          Agregar medicamento
        </Button>
      )}
    </div>
  );
}