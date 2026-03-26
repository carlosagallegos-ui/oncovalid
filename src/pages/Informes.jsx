import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Pill, BarChart3, FileJson, FileText, Printer } from "lucide-react";

export default function Informes() {
  const [activeTab, setActiveTab] = useState("existencias");
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

  const filteredPrescriptions = prescriptions.filter(rx => {
    if (!startDate && !endDate) return true;
    const rxDate = new Date(rx.validation_date || rx.created_date);
    const start = startDate ? new Date(startDate) : new Date("1900-01-01");
    const end = endDate ? new Date(endDate) : new Date("2099-12-31");
    return rxDate >= start && rxDate <= end;
  });

  const downloadJSON = () => {
    const data = JSON.stringify(filteredPrescriptions, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mezclas-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const downloadXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Mezclas>\n';
    filteredPrescriptions.forEach(rx => {
      xml += `  <Prescripcion id="${rx.id}">\n`;
      xml += `    <Paciente>${escapeXml(rx.patient_name)}</Paciente>\n`;
      xml += `    <NSS>${escapeXml(rx.patient_nss || "")}</NSS>\n`;
      xml += `    <Protocolo>${escapeXml(rx.protocol_name)}</Protocolo>\n`;
      xml += `    <Medico>${escapeXml(rx.prescribing_doctor)}</Medico>\n`;
      xml += `    <Estado>${escapeXml(rx.validation_status || "Pendiente")}</Estado>\n`;
      xml += `    <ValidadoPor>${escapeXml(rx.validated_by || "")}</ValidadoPor>\n`;
      xml += `    <Fecha>${rx.validation_date || rx.created_date}</Fecha>\n`;
      xml += `    <Medicamentos>\n`;
      (rx.drugs || []).forEach(drug => {
        xml += `      <Medicamento>\n`;
        xml += `        <Nombre>${escapeXml(drug.drug_name)}</Nombre>\n`;
        xml += `        <Dosis>${drug.prescribed_dose} ${drug.dose_unit}</Dosis>\n`;
        xml += `        <Via>${escapeXml(drug.route)}</Via>\n`;
        xml += `      </Medicamento>\n`;
      });
      xml += `    </Medicamentos>\n`;
      xml += `  </Prescripcion>\n`;
    });
    xml += "</Mezclas>";
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mezclas-${new Date().toISOString().split("T")[0]}.xml`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const escapeXml = (str) => {
    if (!str) return "";
    return str.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

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
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Mezclas Realizadas y Prescripciones Atendidas</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs">Fecha Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs">Fecha Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  variant="outline"
                  className="text-xs"
                >
                  Limpiar
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="gap-2 text-xs"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button
                onClick={downloadJSON}
                variant="outline"
                className="gap-2 text-xs"
              >
                <FileJson className="h-4 w-4" />
                Descargar JSON
              </Button>
              <Button
                onClick={downloadXML}
                variant="outline"
                className="gap-2 text-xs"
              >
                <FileText className="h-4 w-4" />
                Descargar XML
              </Button>
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              Total de mezclas: <span className="font-semibold text-foreground">{filteredPrescriptions.length}</span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Detalle de Prescripciones</h3>
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
                {filteredPrescriptions.map(rx => (
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
        </div>
      )}
    </div>
  );
}