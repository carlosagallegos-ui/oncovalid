import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

// Diagnósticos CIE-10 relevantes en oncología
const CIE10_ONCOLOGIA = [
  { code: "C00", desc: "Tumor maligno del labio" },
  { code: "C01", desc: "Tumor maligno de la base de la lengua" },
  { code: "C02", desc: "Tumor maligno de otras partes y las no especificadas de la lengua" },
  { code: "C03", desc: "Tumor maligno de la encía" },
  { code: "C04", desc: "Tumor maligno del piso de la boca" },
  { code: "C05", desc: "Tumor maligno del paladar" },
  { code: "C06", desc: "Tumor maligno de otras partes de la boca" },
  { code: "C07", desc: "Tumor maligno de la glándula parótida" },
  { code: "C08", desc: "Tumor maligno de otras glándulas salivales mayores" },
  { code: "C09", desc: "Tumor maligno de la amígdala" },
  { code: "C10", desc: "Tumor maligno de la orofaringe" },
  { code: "C11", desc: "Tumor maligno de la nasofaringe" },
  { code: "C12", desc: "Tumor maligno del seno piriforme" },
  { code: "C13", desc: "Tumor maligno de la hipofaringe" },
  { code: "C14", desc: "Tumor maligno de otros sitios y los mal definidos del labio, cavidad bucal y faringe" },
  { code: "C15", desc: "Tumor maligno del esófago" },
  { code: "C16", desc: "Tumor maligno del estómago" },
  { code: "C17", desc: "Tumor maligno del intestino delgado" },
  { code: "C18", desc: "Tumor maligno del colon" },
  { code: "C18.0", desc: "Tumor maligno del ciego" },
  { code: "C18.2", desc: "Tumor maligno del colon ascendente" },
  { code: "C18.4", desc: "Tumor maligno del colon transverso" },
  { code: "C18.6", desc: "Tumor maligno del colon descendente" },
  { code: "C18.7", desc: "Tumor maligno del colon sigmoide" },
  { code: "C19", desc: "Tumor maligno de la unión rectosigmoidea" },
  { code: "C20", desc: "Tumor maligno del recto" },
  { code: "C21", desc: "Tumor maligno del ano y del conducto anal" },
  { code: "C22", desc: "Tumor maligno del hígado y de los conductos biliares intrahepáticos" },
  { code: "C22.0", desc: "Carcinoma hepatocelular" },
  { code: "C23", desc: "Tumor maligno de la vesícula biliar" },
  { code: "C24", desc: "Tumor maligno de otras partes de las vías biliares" },
  { code: "C25", desc: "Tumor maligno del páncreas" },
  { code: "C25.0", desc: "Tumor maligno de la cabeza del páncreas" },
  { code: "C30", desc: "Tumor maligno de las fosas nasales y del oído medio" },
  { code: "C31", desc: "Tumor maligno de los senos paranasales" },
  { code: "C32", desc: "Tumor maligno de la laringe" },
  { code: "C33", desc: "Tumor maligno de la tráquea" },
  { code: "C34", desc: "Tumor maligno de los bronquios y del pulmón" },
  { code: "C34.1", desc: "Tumor maligno del lóbulo superior, bronquio o pulmón" },
  { code: "C34.2", desc: "Tumor maligno del lóbulo medio, bronquio o pulmón" },
  { code: "C34.3", desc: "Tumor maligno del lóbulo inferior, bronquio o pulmón" },
  { code: "C37", desc: "Tumor maligno del timo" },
  { code: "C38", desc: "Tumor maligno del corazón, mediastino y pleura" },
  { code: "C40", desc: "Tumor maligno del hueso y del cartílago articular de los miembros" },
  { code: "C41", desc: "Tumor maligno del hueso y del cartílago articular de otros sitios" },
  { code: "C43", desc: "Melanoma maligno de la piel" },
  { code: "C44", desc: "Otros tumores malignos de la piel" },
  { code: "C45", desc: "Mesotelioma" },
  { code: "C46", desc: "Sarcoma de Kaposi" },
  { code: "C47", desc: "Tumor maligno de los nervios periféricos y del sistema nervioso autónomo" },
  { code: "C48", desc: "Tumor maligno del espacio retroperitoneal y del peritoneo" },
  { code: "C49", desc: "Tumor maligno del tejido conjuntivo y de otros tejidos blandos" },
  { code: "C50", desc: "Tumor maligno de la mama" },
  { code: "C50.1", desc: "Tumor maligno de la porción central de la mama" },
  { code: "C50.2", desc: "Tumor maligno del cuadrante superior interno de la mama" },
  { code: "C50.4", desc: "Tumor maligno del cuadrante superior externo de la mama" },
  { code: "C51", desc: "Tumor maligno de la vulva" },
  { code: "C52", desc: "Tumor maligno de la vagina" },
  { code: "C53", desc: "Tumor maligno del cuello del útero" },
  { code: "C53.0", desc: "Tumor maligno del endocérvix" },
  { code: "C53.1", desc: "Tumor maligno del exocérvix" },
  { code: "C54", desc: "Tumor maligno del cuerpo del útero" },
  { code: "C54.1", desc: "Tumor maligno del endometrio" },
  { code: "C55", desc: "Tumor maligno del útero, parte no especificada" },
  { code: "C56", desc: "Tumor maligno del ovario" },
  { code: "C57", desc: "Tumor maligno de otros órganos genitales femeninos" },
  { code: "C60", desc: "Tumor maligno del pene" },
  { code: "C61", desc: "Tumor maligno de la próstata" },
  { code: "C62", desc: "Tumor maligno del testículo" },
  { code: "C64", desc: "Tumor maligno del riñón, excepto la pelvis renal" },
  { code: "C65", desc: "Tumor maligno de la pelvis renal" },
  { code: "C66", desc: "Tumor maligno del uréter" },
  { code: "C67", desc: "Tumor maligno de la vejiga urinaria" },
  { code: "C69", desc: "Tumor maligno del ojo y sus anexos" },
  { code: "C70", desc: "Tumor maligno de las meninges" },
  { code: "C71", desc: "Tumor maligno del encéfalo" },
  { code: "C71.0", desc: "Tumor maligno del cerebro, excepto lóbulos y ventrículos" },
  { code: "C71.1", desc: "Tumor maligno del lóbulo frontal" },
  { code: "C71.2", desc: "Tumor maligno del lóbulo temporal" },
  { code: "C71.4", desc: "Tumor maligno del lóbulo occipital" },
  { code: "C72", desc: "Tumor maligno de la médula espinal, nervios craneales y otras partes del SNC" },
  { code: "C73", desc: "Tumor maligno de la glándula tiroides" },
  { code: "C74", desc: "Tumor maligno de la glándula suprarrenal" },
  { code: "C75", desc: "Tumor maligno de otras glándulas endocrinas" },
  { code: "C76", desc: "Tumor maligno de otros sitios y de los mal definidos" },
  { code: "C77", desc: "Tumor maligno secundario y no especificado de los ganglios linfáticos" },
  { code: "C78", desc: "Tumor maligno secundario de los órganos respiratorios y digestivos" },
  { code: "C79", desc: "Tumor maligno secundario de otros sitios" },
  { code: "C80", desc: "Tumor maligno sin especificación de sitio" },
  { code: "C81", desc: "Linfoma de Hodgkin" },
  { code: "C82", desc: "Linfoma folicular (nodular)" },
  { code: "C83", desc: "Linfoma no folicular" },
  { code: "C83.3", desc: "Linfoma difuso de células B grandes" },
  { code: "C84", desc: "Linfomas de células T/NK periféricas y cutáneas" },
  { code: "C85", desc: "Linfoma no Hodgkin de otro tipo y el no especificado" },
  { code: "C88", desc: "Enfermedades inmunoproliferativas malignas" },
  { code: "C90", desc: "Mieloma múltiple y tumores malignos de células plasmáticas" },
  { code: "C90.0", desc: "Mieloma múltiple" },
  { code: "C91", desc: "Leucemia linfoide" },
  { code: "C91.0", desc: "Leucemia linfoblástica aguda" },
  { code: "C91.1", desc: "Leucemia linfocítica crónica" },
  { code: "C92", desc: "Leucemia mieloide" },
  { code: "C92.0", desc: "Leucemia mieloide aguda" },
  { code: "C92.1", desc: "Leucemia mieloide crónica" },
  { code: "C93", desc: "Leucemia monocítica" },
  { code: "C94", desc: "Otras leucemias especificadas" },
  { code: "C95", desc: "Leucemia de tipo celular no especificado" },
  { code: "C96", desc: "Otros tumores malignos del tejido linfático, hematopoyético y relacionado" },
];

export default function Cie10Search({ value, onChange }) {
  const [query, setQuery] = useState(value ? `${value.code} - ${value.desc}` : "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (value) setQuery(`${value.code} - ${value.desc}`);
    else setQuery("");
  }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.length >= 1
    ? CIE10_ONCOLOGIA.filter(item =>
        item.code.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : [];

  const handleSelect = (item) => {
    onChange(item);
    setQuery(`${item.code} - ${item.desc}`);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(null); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar código o diagnóstico CIE-10..."
          className="flex-1"
        />
        {value && (
          <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground px-2">✕</button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.map(item => (
            <button
              key={item.code}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-baseline gap-2"
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelect(item)}
            >
              <span className="font-mono font-semibold text-primary shrink-0">{item.code}</span>
              <span className="text-muted-foreground">{item.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}