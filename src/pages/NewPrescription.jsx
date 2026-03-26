import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, FlaskConical, Syringe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PatientSearchSelect from "@/components/PatientSearchSelect";
import DoctorSearchSelect from "@/components/DoctorSearchSelect";
import DrugSelector from "@/components/DrugSelector";
import { calculateDose, validateDose, generateAlerts } from "@/lib/chemoProtocols";

export default function NewPrescription() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [patient, setPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [doctorLicense, setDoctorLicense] = useState("");

  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    if (doc) {
      setDoctorName(doc.full_name);
      setDoctorLicense(doc.license);
    } else {
      setDoctorName("");
      setDoctorLicense("");
    }
  };
  const [cycleNumber, setCycleNumber] = useState(1);
  const [dayOfCycle, setDayOfCycle] = useState(1);
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split("T")[0]);

  // Step 2
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [detectedProtocol, setDetectedProtocol] = useState(null);

  // Step 3
  const [drugDoses, setDrugDoses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dosis");

  const handleDrugsChange = (drugs) => {
    setSelectedDrugs(drugs);
    if (patient && drugs.length > 0) {
      const doses = drugs.map(drug => {
      const calc = calculateDose(drug, patient.bsa, patient.weight_kg, patient.creatinine_clearance);
      const unit = drug.dose_basis === "AUC" ? "mg" : drug.dose_basis.replace("/m²", "").replace("/kg", "");
      return {
        ...drug,
        calculated_dose: calc,
        prescribed_dose: calc,
        prescribed_volume: drug.volume_ml || 0,
        dose_unit: unit,
        solution_type: drug.diluent || "SSN 0.9%",
        container_material: "Bolsa PVC",
        is_valid: true,
        variance_percent: 0,
        validation_notes: "Dosis dentro del rango aceptable"
      };
      });
      setDrugDoses(doses);
      setAlerts(generateAlerts(drugs, patient));
    } else {
      setDrugDoses([]);
      setAlerts([]);
    }
  };

  const handleProtocolDetected = (detected) => setDetectedProtocol(detected);

  const handleDoseChange = (index, value) => {
    const updated = [...drugDoses];
    const prescribed = parseFloat(value) || 0;
    const validation = validateDose(prescribed, updated[index].calculated_dose);
    updated[index] = {
      ...updated[index],
      prescribed_dose: prescribed,
      is_valid: validation.isValid,
      variance_percent: validation.variance,
      validation_notes: validation.message
    };
    setDrugDoses(updated);
  };

  const handleVolumeChange = (index, value) => {
    const updated = [...drugDoses];
    updated[index] = { ...updated[index], prescribed_volume: parseFloat(value) || 0 };
    setDrugDoses(updated);
  };

  const handleSolutionChange = (index, value) => {
    const updated = [...drugDoses];
    updated[index] = { ...updated[index], solution_type: value };
    setDrugDoses(updated);
  };

  const handleContainerChange = (index, value) => {
    const updated = [...drugDoses];
    updated[index] = { ...updated[index], container_material: value };
    setDrugDoses(updated);
  };

  const goToStep3 = () => {
    if (drugDoses.length === 0 && selectedDrugs.length > 0 && patient) {
      handleDrugsChange(selectedDrugs);
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const protocolName = detectedProtocol ? detectedProtocol.name : "Protocolo personalizado";
    const data = {
      patient_id: patient.id,
      patient_name: patient.full_name,
      prescribing_doctor: doctorName,
      doctor_license: doctorLicense,
      protocol_name: protocolName,
      cycle_number: cycleNumber,
      day_of_cycle: dayOfCycle,
      prescription_date: prescriptionDate,
      drugs: drugDoses.map(d => ({
        drug_name: d.drug_name,
        prescribed_dose: d.prescribed_dose,
        prescribed_volume: d.prescribed_volume ?? d.volume_ml,
        dose_unit: d.dose_unit,
        calculated_dose: d.calculated_dose,
        dose_per_unit: d.dose_per_unit,
        dose_basis: d.dose_basis,
        route: d.route,
        infusion_time: d.infusion_time,
        diluent: d.diluent,
        volume_ml: d.volume_ml,
        vial_size: d.vial_size,
        vial_unit: d.vial_unit,
        solution_type: d.solution_type,
        container_material: d.container_material,
        is_valid: d.is_valid,
        variance_percent: d.variance_percent,
        validation_notes: d.validation_notes
      })),
      patient_nss: patient.nss || "",
      patient_bsa: patient.bsa,
      patient_weight: patient.weight_kg,
      validation_status: "Pendiente",
      alerts
    };
    const created = await base44.entities.Prescription.create(data);
    navigate(`/prescripcion/${created.id}`);
  };

  const hasOutOfRange = drugDoses.some(d => !d.is_valid);

  // Compute vial summary (group by drug_name, sum doses)
  const vialSummary = (() => {
    const grouped = {};
    drugDoses.forEach(d => {
      const key = d.drug_name;
      if (!grouped[key]) grouped[key] = { ...d, total_prescribed: 0 };
      grouped[key].total_prescribed += d.prescribed_dose || 0;
    });
    return Object.values(grouped).map(drug => {
      const vialSize = drug.vial_size || null;
      const unit = drug.vial_unit || drug.dose_unit || "mg";
      const frascos = vialSize ? Math.ceil(drug.total_prescribed / vialSize) : null;
      const totalDisp = frascos !== null ? frascos * vialSize : null;
      const sobrante = totalDisp !== null ? (totalDisp - drug.total_prescribed).toFixed(2) : null;
      return { ...drug, unit, frascos, totalDisp, sobrante };
    });
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Nueva Prescripción</h1>
          <p className="text-sm text-muted-foreground">Paso {step} de 3</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Datos del Paciente</h2>
            <PatientSearchSelect onSelect={setPatient} selectedPatient={patient} />
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Médico Prescriptor</h2>
            <DoctorSearchSelect onSelect={handleDoctorSelect} selectedDoctor={selectedDoctor} />
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Datos del Ciclo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Fecha de prescripción</Label>
                <Input type="date" value={prescriptionDate} onChange={e => setPrescriptionDate(e.target.value)} />
              </div>
              <div>
                <Label>Número de ciclo</Label>
                <Input type="number" min={1} value={cycleNumber} onChange={e => setCycleNumber(parseInt(e.target.value) || 1)} />
              </div>
              <div>
                <Label>Día del ciclo</Label>
                <Input type="number" min={1} value={dayOfCycle} onChange={e => setDayOfCycle(parseInt(e.target.value) || 1)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!patient || !doctorName || !doctorLicense} className="gap-2">
              Siguiente <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div>
              <h2 className="font-semibold">Medicamentos Prescritos</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Agregue los medicamentos y el sistema detectará el protocolo automáticamente
              </p>
            </div>
            <DrugSelector
              selectedDrugs={selectedDrugs}
              onDrugsChange={handleDrugsChange}
              onProtocolDetected={handleProtocolDetected}
            />
          </div>

          {selectedDrugs.length > 0 && (
            <div className={`rounded-xl border p-4 ${detectedProtocol ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              {detectedProtocol ? (
                <div>
                  <p className="text-sm font-semibold text-emerald-700">✅ Protocolo detectado: {detectedProtocol.name}</p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {detectedProtocol.indication} · Ciclo cada {detectedProtocol.cycle_days} días · {detectedProtocol.total_cycles} ciclos · Coincidencia {Math.round(detectedProtocol.score * 100)}%
                  </p>
                </div>
              ) : (
                <p className="text-sm text-amber-700">⚠️ No se identificó un protocolo estándar. Se guardará como prescripción personalizada.</p>
              )}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button onClick={goToStep3} disabled={selectedDrugs.length === 0} className="gap-2">
              Siguiente <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Clinical alerts */}
          {alerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                <AlertTriangle className="h-4 w-4" /> Alertas Clínicas
              </div>
              {alerts.map((a, i) => <p key={i} className="text-sm text-amber-700">{a}</p>)}
            </div>
          )}

          {/* Summary bar */}
          <div className="bg-muted/50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><span className="text-muted-foreground">Paciente: </span><span className="font-medium">{patient?.full_name}</span></div>
            <div><span className="text-muted-foreground">SCT: </span><span className="font-mono font-medium">{patient?.bsa?.toFixed(2)} m²</span></div>
            <div><span className="text-muted-foreground">Peso: </span><span className="font-mono font-medium">{patient?.weight_kg} kg</span></div>
            <div><span className="text-muted-foreground">Protocolo: </span><span className="font-medium">{detectedProtocol ? detectedProtocol.name : "Personalizado"}</span></div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("dosis")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "dosis" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Syringe className="h-4 w-4" /> Validación de Dosis
            </button>
            <button
              onClick={() => setActiveTab("frascos")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "frascos" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FlaskConical className="h-4 w-4" /> Frascos por Mezcla
            </button>
          </div>

          {/* Tab: Dosis */}
          {activeTab === "dosis" && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-semibold">Validación de Dosis</h2>
                <p className="text-xs text-muted-foreground mt-1">Modifique las dosis prescritas. Tolerancia aceptable: ±10%</p>
              </div>
              <div className="divide-y divide-border">
                {drugDoses.map((drug, i) => (
                  <div key={i} className={`p-4 sm:p-6 ${!drug.is_valid ? "bg-amber-50/30" : ""}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {drug.is_valid
                            ? <Check className="h-4 w-4 text-emerald-500" />
                            : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          <span className="font-semibold text-sm">{drug.drug_name}</span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{drug.route}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground block">Referencia</span>
                            <span className="font-mono font-medium">{drug.dose_per_unit} {drug.dose_basis}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Calculada</span>
                            <span className="font-mono font-medium text-primary">{drug.calculated_dose} {drug.dose_unit}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Infusión</span>
                            <span>{drug.infusion_time}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Vol. estándar</span>
                            <span className="font-mono">{drug.volume_ml > 0 ? `${drug.volume_ml} mL` : "—"}</span>
                          </div>
                        </div>
                        {/* Solution & Container selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Tipo de solución</Label>
                            <Select value={drug.solution_type} onValueChange={v => handleSolutionChange(i, v)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SSN 0.9%">SSN 0.9%</SelectItem>
                                <SelectItem value="SG 5%">SG 5%</SelectItem>
                                <SelectItem value="Hartmann">Hartmann</SelectItem>
                                <SelectItem value="Agua inyectable">Agua inyectable</SelectItem>
                                <SelectItem value="Directo">Directo (sin dilución)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Material del recipiente</Label>
                            <Select value={drug.container_material} onValueChange={v => handleContainerChange(i, v)}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Bolsa PVC">Bolsa PVC</SelectItem>
                                <SelectItem value="Bolsa no PVC (EVA)">Bolsa no PVC (EVA)</SelectItem>
                                <SelectItem value="Bolsa polipropileno">Bolsa polipropileno</SelectItem>
                                <SelectItem value="Jeringa">Jeringa</SelectItem>
                                <SelectItem value="Frasco vidrio">Frasco vidrio</SelectItem>
                                <SelectItem value="N/A">N/A (vía oral)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="sm:w-auto flex flex-col sm:flex-row gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Dosis prescrita ({drug.dose_unit})</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={drug.prescribed_dose}
                            onChange={e => handleDoseChange(i, e.target.value)}
                            className={`font-mono w-36 ${!drug.is_valid ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
                          />
                          <div className="text-xs space-y-0.5">
                            <span className="text-muted-foreground">Calculada: </span>
                            <span className="font-mono font-medium text-primary">{drug.calculated_dose} {drug.dose_unit}</span>
                            {drug.variance_percent !== 0 && (
                              <p className={`font-medium ${drug.is_valid ? "text-emerald-600" : "text-amber-600"}`}>
                                {drug.variance_percent > 0 ? "+" : ""}{drug.variance_percent}% vs calculado
                              </p>
                            )}
                          </div>
                        </div>
                        {drug.volume_ml > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs">Volumen prescrito (mL)</Label>
                            <Input
                              type="number"
                              step="1"
                              value={drug.prescribed_volume ?? drug.volume_ml}
                              onChange={e => handleVolumeChange(i, e.target.value)}
                              className={`font-mono w-36 ${
                                drug.prescribed_volume > 0 && drug.volume_ml > 0 &&
                                Math.abs((drug.prescribed_volume - drug.volume_ml) / drug.volume_ml) > 0.10
                                  ? "border-amber-400 focus-visible:ring-amber-400" : ""
                              }`}
                            />
                            <div className="text-xs space-y-0.5">
                              <span className="text-muted-foreground">Estándar: </span>
                              <span className="font-mono font-medium text-primary">{drug.volume_ml} mL</span>
                              {drug.prescribed_volume > 0 && drug.volume_ml > 0 && drug.prescribed_volume !== drug.volume_ml && (
                                <p className={`font-medium ${
                                  Math.abs((drug.prescribed_volume - drug.volume_ml) / drug.volume_ml) <= 0.10
                                    ? "text-emerald-600" : "text-amber-600"
                                }`}>
                                  {drug.prescribed_volume > drug.volume_ml ? "+" : ""}
                                  {(((drug.prescribed_volume - drug.volume_ml) / drug.volume_ml) * 100).toFixed(1)}% vs estándar
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Frascos */}
          {activeTab === "frascos" && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-semibold">Frascos Necesarios por Mezcla</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Cantidad de frascos requeridos según la dosis prescrita. Medicamentos repetidos se suman.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Medicamento", "Vía", "Dosis Total Prescrita", "Tamaño Frasco", "Frascos Necesarios", "Disponible / Sobrante"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vialSummary.map((drug, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold">{drug.drug_name}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{drug.route}</td>
                        <td className="px-5 py-4 text-sm font-mono font-medium">
                          {drug.total_prescribed.toFixed(2)} {drug.unit}
                        </td>
                        <td className="px-5 py-4 text-sm font-mono">
                          {drug.vial_size
                            ? `${drug.vial_size} ${drug.unit}/frasco`
                            : <span className="text-muted-foreground text-xs">No definido</span>}
                        </td>
                        <td className="px-5 py-4">
                          {drug.frascos !== null ? (
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg">
                              {drug.frascos}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {drug.totalDisp !== null ? (
                            <div>
                              <span className="font-mono font-medium">{drug.totalDisp} {drug.unit}</span>
                              {parseFloat(drug.sobrante) > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Sobrante: {drug.sobrante} {drug.unit}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {hasOutOfRange && activeTab === "dosis" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-700 font-medium">
                ⚠️ Algunas dosis están fuera del rango ±10%. Quedará como "Pendiente" para revisión del farmacéutico.
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
              ) : (
                <><Check className="h-4 w-4" /> Guardar Prescripción</>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}