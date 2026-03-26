import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Check, AlertTriangle } from "lucide-react";
import PatientSearchSelect from "@/components/PatientSearchSelect";
import DrugSelector from "@/components/DrugSelector";
import { calculateDose, validateDose, generateAlerts } from "@/lib/chemoProtocols";

export default function NewPrescription() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [patient, setPatient] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [doctorLicense, setDoctorLicense] = useState("");
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

  // When drugs change, recalculate doses
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
          dose_unit: unit,
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

  const handleProtocolDetected = (detected) => {
    setDetectedProtocol(detected);
  };

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

  // When moving to step 3, make sure doses are calculated
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
        dose_unit: d.dose_unit,
        calculated_dose: d.calculated_dose,
        dose_per_unit: d.dose_per_unit,
        dose_basis: d.dose_basis,
        route: d.route,
        infusion_time: d.infusion_time,
        diluent: d.diluent,
        volume_ml: d.volume_ml,
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

      {/* ── STEP 1: Paciente + Médico ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Datos del Paciente</h2>
            <PatientSearchSelect onSelect={setPatient} selectedPatient={patient} />
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Médico Prescriptor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nombre del médico *</Label>
                <Input value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Dr. ..." />
              </div>
              <div>
                <Label>Cédula profesional *</Label>
                <Input value={doctorLicense} onChange={e => setDoctorLicense(e.target.value)} placeholder="Número de cédula" />
              </div>
            </div>
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

      {/* ── STEP 2: Medicamentos ── */}
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

          {/* Protocol detection banner */}
          {selectedDrugs.length > 0 && (
            <div className={`rounded-xl border p-4 ${
              detectedProtocol ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
            }`}>
              {detectedProtocol ? (
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    ✅ Protocolo detectado: {detectedProtocol.name}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {detectedProtocol.indication} · Ciclo cada {detectedProtocol.cycle_days} días · {detectedProtocol.total_cycles} ciclos · Coincidencia {Math.round(detectedProtocol.score * 100)}%
                  </p>
                </div>
              ) : (
                <p className="text-sm text-amber-700">
                  ⚠️ No se identificó un protocolo estándar. Se guardará como prescripción personalizada.
                </p>
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

      {/* ── STEP 3: Validación de dosis ── */}
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

          {/* Dose cards */}
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
                          <span className="text-muted-foreground block">Diluyente</span>
                          <span>{drug.diluent}{drug.volume_ml > 0 ? ` (${drug.volume_ml} mL)` : ""}</span>
                        </div>
                      </div>
                    </div>
                    <div className="sm:w-48 space-y-2">
                      <Label className="text-xs">Dosis prescrita ({drug.dose_unit})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={drug.prescribed_dose}
                        onChange={e => handleDoseChange(i, e.target.value)}
                        className={`font-mono ${!drug.is_valid ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
                      />
                      {drug.variance_percent !== 0 && (
                        <p className={`text-xs font-medium ${drug.is_valid ? "text-emerald-600" : "text-amber-600"}`}>
                          {drug.variance_percent > 0 ? "+" : ""}{drug.variance_percent}% del calculado
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hasOutOfRange && (
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