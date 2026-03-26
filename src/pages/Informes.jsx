import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Package, Pill, BarChart3 } from "lucide-react";

export default function Informes() {
  const [activeTab, setActiveTab] = useState("existencias");
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [meds, rxs] = await Promise.all([
        base44.entities.Medication.list("-received_date", 300),
        base44.entities.Prescription.list("-created_date", 200)
      ]);
      setMedications(meds);
      setPrescriptions(rxs);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Informes</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("existencias")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "existencias"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
          Existencias
        </button>
        <button
          onClick={() => setActiveTab("mezclas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "mezclas"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pill className="h-4 w-4" />
          Mezclas Realizadas
        </button>
      </div>

      {/* Informe de Existencias */}
      {activeTab === "existencias" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Inventario de Medicamentos
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Medicamento", "Concentración", "Presentación", "Disponibles", "Estado", "Caducidad"].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medications.map(med => (
                  <tr key={med.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-6 py-4 text-sm font-medium">{med.drug_name}</td>
                    <td className="px-6 py-4 text-sm font-mono">{med.concentration} {med.concentration_unit}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{med.presentation}</td>
                    <td className="px-6 py-4 text-sm font-mono font-bold text-primary">{med.quantity_available ?? med.quantity_received}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                        med.status === "Disponible" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        med.status === "Agotado" ? "bg-red-50 text-red-700 border-red-200" :
                        med.status === "Cuarentena" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {med.status || "Disponible"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {med.expiration_date ? new Date(med.expiration_date).toLocaleDateString("es-MX") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Informe de Mezclas */}
      {activeTab === "mezclas" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold">Mezclas Realizadas y Prescripciones Atendidas</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Paciente", "Protocolo", "Medicamentos", "Estado", "Validado Por", "Fecha"].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prescriptions.map(rx => (
                  <tr key={rx.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{rx.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{rx.patient_nss || "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">{rx.protocol_name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {rx.drugs?.length || 0} medicamentos
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        rx.validation_status === "Validada" ? "bg-emerald-50 text-emerald-700" :
                        rx.validation_status === "Rechazada" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {rx.validation_status || "Pendiente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{rx.validated_by || "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {rx.validation_date ? new Date(rx.validation_date).toLocaleDateString("es-MX") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}