// Vida útil de mezclas (post-preparación) y condiciones de almacenamiento estándar
// Fuente: referencias oncológicas ASHP, Trissel's, IMSS/SSA
export const DRUG_STABILITY = {
  "Paclitaxel":      { stability: "27 h a temperatura ambiente (15-25 °C)", storage: "Temperatura ambiente, proteger de luz" },
  "Docetaxel":       { stability: "4 h a temperatura ambiente", storage: "Temperatura ambiente (2-25 °C), proteger de luz" },
  "Doxorrubicina":   { stability: "24 h refrigerado (2-8 °C) o 8 h a temperatura ambiente", storage: "Refrigeración, proteger de luz" },
  "Ciclofosfamida":  { stability: "24 h a temperatura ambiente o 6 días refrigerado", storage: "Temperatura ambiente o refrigeración" },
  "Fluorouracilo":   { stability: "72 h a temperatura ambiente (15-30 °C)", storage: "Temperatura ambiente, proteger de luz" },
  "Oxaliplatino":    { stability: "6 h a temperatura ambiente (no refrigerar)", storage: "Temperatura ambiente (NO refrigerar, precipita)" },
  "Irinotecan":      { stability: "24 h a temperatura ambiente o 48 h refrigerado", storage: "Temperatura ambiente o refrigeración, proteger de luz" },
  "Carboplatino":    { stability: "8 h a temperatura ambiente (15-25 °C)", storage: "Temperatura ambiente" },
  "Cisplatino":      { stability: "8 h a temperatura ambiente (no refrigerar)", storage: "Temperatura ambiente (NO refrigerar)" },
  "Gemcitabina":     { stability: "24 h a temperatura ambiente (15-30 °C)", storage: "Temperatura ambiente" },
  "Vinorelbina":     { stability: "24 h a temperatura ambiente o 96 h refrigerado", storage: "Refrigeración o temperatura ambiente" },
  "Vincristina":     { stability: "24 h a temperatura ambiente o 96 h refrigerado", storage: "Refrigeración, proteger de luz" },
  "Rituximab":       { stability: "24 h refrigerado (2-8 °C) o 12 h a temperatura ambiente", storage: "Refrigeración (2-8 °C)" },
  "Trastuzumab":     { stability: "24 h refrigerado (2-8 °C)", storage: "Refrigeración (2-8 °C)" },
  "Bevacizumab":     { stability: "8 h refrigerado (2-8 °C)", storage: "Refrigeración (2-8 °C), proteger de luz" },
  "Cetuximab":       { stability: "12 h a temperatura ambiente (25 °C)", storage: "Temperatura ambiente, proteger de luz" },
  "Etoposido":       { stability: "24 h a temperatura ambiente a 0.4 mg/mL", storage: "Temperatura ambiente (15-30 °C)" },
  "Bleomicina":      { stability: "24 h a temperatura ambiente", storage: "Temperatura ambiente" },
  "Metotrexato":     { stability: "24 h a temperatura ambiente", storage: "Temperatura ambiente, proteger de luz" },
  "Citarabina":      { stability: "8 días a temperatura ambiente o 32 días refrigerado", storage: "Temperatura ambiente o refrigeración" },
  "Pemetrexed":      { stability: "24 h a temperatura ambiente (15-30 °C)", storage: "Temperatura ambiente" },
  "Ifosfamida":      { stability: "24 h a temperatura ambiente o 7 días refrigerado", storage: "Temperatura ambiente o refrigeración" },
};

export function getDrugStability(drugName) {
  if (!drugName) return null;
  const key = Object.keys(DRUG_STABILITY).find(k =>
    drugName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(drugName.toLowerCase())
  );
  return key ? DRUG_STABILITY[key] : null;
}