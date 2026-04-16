import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Pill, BarChart3, FileJson, FileText, Printer, AlertTriangle, Activity, PieChart, LayoutDashboard } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const escapeXml = (str) => {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
};

export default function Informes() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.Medication.list("-received_date", 300),
      base44.entities.Prescription.list("-created_date", 500)
    ]).then(([meds, rxs]) => {
      setMedications(meds);
      setPrescriptions(rxs);
      setLoading(false);
    });
  }, []);

  const filteredPrescriptions = prescriptions.filter(rx => {
    if (!startDate && !endDate) return true;
    const rxDate = new Date(rx.validation_date || rx.created_date);
    const start = startDate ? new Date(startDate) : new Date("1900-01-01");
    const end = endDate ? new Date(endDate) : new Date("2099-12-31");
    return rxDate >= start && rxDate <= end;
  });

  // ── Stats for dashboard ──
  const totalRx = prescriptions.length;
  const validadas = prescriptions.filter(r => r.validation_status === "Validada").length;
  const pendientes = prescriptions.filter(r => !r.validation_status || r.validation_status === "Pendiente").length;
  const rechazadas = prescriptions.filter(r => r.validation_status === "Rechazada").length;
  const adversos = prescriptions.filter(r => r.application_result === "Reacción adversa").length;
  const disponibleMeds = medications.filter(m => m.status === "Disponible").length;
  const agotadoMeds = medications.filter(m => m.status === "Agotado").length;

  // Mezclas por protocolo (top 8)
  const protocolCount = {};
  prescriptions.forEach(rx => {
    const p = rx.protocol_name || "Desconocido";
    protocolCount[p] = (protocolCount[p] || 0) + 1;
  });
  const protocolData = Object.entries(protocolCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, value }));

  // Estado de prescripciones
  const statusData = [
    { name: "Validadas", value: validadas },
    { name: "Pendientes", value: pendientes },
    { name: "Rechazadas", value: rechazadas },
  ].filter(d => d.value > 0);

  // ── Eventos adversos ──
  const adverseRxs = prescriptions.filter(r =>
    r.application_result === "Reacción adversa" || r.application_result === "Problemas"
  );

  // ── Mezclas por patología (basado en protocol_name como proxy) ──
  // Agrupar por protocol_name
  const byProtocol = {};
  prescriptions.forEach(rx => {
    const key = rx.protocol_name || "Sin protocolo";
    if (!byProtocol[key]) byProtocol[key] = { protocol: key, total: 0, validadas: 0, pendientes: 0 };
    byProtocol[key].total++;
    if (rx.validation_status === "Validada") byProtocol[key].validadas++;
    else byProtocol[key].pendientes++;
  });
  const byProtocolList = Object.values(byProtocol).sort((a, b) => b.total - a.total);

  // ── Tipos de patología (distribución) ──
  const patologiaData = Object.entries(protocolCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // ── Downloads ──
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(filteredPrescriptions, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mezclas-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const downloadXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Mezclas>\n';
    filteredPrescriptions.forEach(rx => {
      xml += `  <Prescripcion id="${rx.id}">\n`;
      xml += `    <Paciente>${escapeXml(rx.patient_name)}</Paciente>\n`;
      xml += `    <Protocolo>${escapeXml(rx.protocol_name)}</Protocolo>\n`;
      xml += `    <Estado>${escapeXml(rx.validation_status || "Pendiente")}</Estado>\n`;
      xml += `    <Fecha>${rx.validation_date || rx.created_date}</Fecha>\n`;
      xml += `  </Prescripcion>\n`;
    });
    xml += "</Mezclas>";
    const blob = new Blob([xml], { type: "application/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mezclas-${new Date().toISOString().split("T")[0]}.xml`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "existencias", label: "Existencias", icon: Package },
    { id: "mezclas", label: "Mezclas Realizadas", icon: Pill },
    { id: "adversos", label: "Eventos Adversos", icon: AlertTriangle },
    { id: "porPatologia", label: "Mezclas por Patología", icon: Activity },
    { id: "tiposPatologia", label: "Tipos de Patología", icon: PieChart },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Informes</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Prescripciones", value: totalRx, color: "text-primary", bg: "bg-primary/10" },
              { label: "Validadas", value: validadas, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Pendientes", value: pendientes, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Rechazadas", value: rechazadas, color: "text-red-600", bg: "bg-red-50" },
              { label: "Eventos Adversos", value: adversos, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Medicamentos Disponibles", value: disponibleMeds, color: "text-teal-600", bg: "bg-teal-50" },
            ].map(stat => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estado de prescripciones */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-sm mb-4">Estado de Prescripciones</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RechartsPie>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Mezclas por protocolo */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-sm mb-4">Mezclas por Protocolo (Top 8)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={protocolData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Mezclas" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inventory summary */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-sm mb-3">Resumen de Inventario</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: "Total registros", value: medications.length },
                { label: "Disponibles", value: disponibleMeds },
                { label: "Agotados", value: agotadoMeds },
                { label: "Cuarentena / Caducado", value: medications.filter(m => m.status === "Cuarentena" || m.status === "Caducado").length },
              ].map(s => (
                <div key={s.label} className="bg-muted/30 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── EXISTENCIAS ── */}
      {activeTab === "existencias" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Inventario de Medicamentos</h2>
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
                      }`}>{med.status || "Disponible"}</span>
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

      {/* ── MEZCLAS REALIZADAS ── */}
      {activeTab === "mezclas" && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-semibold">Mezclas Realizadas y Prescripciones Atendidas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Fecha Inicio</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Fecha Fin</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1" />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => { setStartDate(""); setEndDate(""); }} variant="outline" className="text-xs">Limpiar</Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => window.print()} variant="outline" className="gap-2 text-xs"><Printer className="h-4 w-4" /> Imprimir</Button>
              <Button onClick={downloadJSON} variant="outline" className="gap-2 text-xs"><FileJson className="h-4 w-4" /> Descargar JSON</Button>
              <Button onClick={downloadXML} variant="outline" className="gap-2 text-xs"><FileText className="h-4 w-4" /> Descargar XML</Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">Total: <span className="font-semibold text-foreground">{filteredPrescriptions.length}</span> mezclas</p>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border"><h3 className="font-semibold text-sm">Detalle de Prescripciones</h3></div>
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
                      <td className="px-6 py-4"><p className="text-sm font-medium">{rx.patient_name}</p><p className="text-xs text-muted-foreground">{rx.patient_nss || "—"}</p></td>
                      <td className="px-6 py-4 text-sm">{rx.protocol_name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{rx.drugs?.length || 0} medicamentos</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          rx.validation_status === "Validada" ? "bg-emerald-50 text-emerald-700" :
                          rx.validation_status === "Rechazada" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                        }`}>{rx.validation_status || "Pendiente"}</span>
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

      {/* ── EVENTOS ADVERSOS ── */}
      {activeTab === "adversos" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total eventos adversos", value: prescriptions.filter(r => r.application_result === "Reacción adversa").length, color: "text-red-600" },
              { label: "Problemas de administración", value: prescriptions.filter(r => r.application_result === "Problemas").length, color: "text-amber-600" },
              { label: "Exitosas", value: prescriptions.filter(r => r.application_result === "Exitosa").length, color: "text-emerald-600" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl border border-border p-5">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Registro de Eventos Adversos y Problemas</h3>
            </div>
            {adverseRxs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">No hay eventos adversos registrados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["Paciente", "Protocolo", "Resultado", "Severidad", "Tipo de Reacción", "Notas", "Aplicado Por", "Fecha"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adverseRxs.map(rx => (
                      <tr key={rx.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-5 py-3 text-sm font-medium">{rx.patient_name}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{rx.protocol_name}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            rx.application_result === "Reacción adversa" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                          }`}>{rx.application_result}</span>
                        </td>
                        <td className="px-5 py-3 text-sm">{rx.adverse_reaction_severity || "—"}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{rx.adverse_reaction_type || "—"}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground max-w-xs truncate">{rx.application_notes || "—"}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{rx.applied_by || "—"}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {rx.applied_date ? new Date(rx.applied_date).toLocaleDateString("es-MX") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MEZCLAS POR PATOLOGÍA ── */}
      {activeTab === "porPatologia" && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-sm mb-4">Distribución de Mezclas por Protocolo/Patología</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byProtocolList.slice(0, 10)} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="protocol" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="validadas" name="Validadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendientes" name="Pendientes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border"><h3 className="font-semibold text-sm">Detalle por Protocolo</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Protocolo / Patología", "Total Mezclas", "Validadas", "Pendientes", "% Validadas"].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byProtocolList.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-6 py-4 text-sm font-medium">{row.protocol}</td>
                      <td className="px-6 py-4 text-sm font-mono font-bold text-primary">{row.total}</td>
                      <td className="px-6 py-4 text-sm font-mono text-emerald-600">{row.validadas}</td>
                      <td className="px-6 py-4 text-sm font-mono text-amber-600">{row.pendientes}</td>
                      <td className="px-6 py-4 text-sm font-mono">
                        {row.total > 0 ? `${((row.validadas / row.total) * 100).toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TIPOS DE PATOLOGÍA ── */}
      {activeTab === "tiposPatologia" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-sm mb-4">Distribución por Tipo de Patología (Protocolo)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={patologiaData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ name, percent }) => percent > 0.03 ? `${(percent * 100).toFixed(0)}%` : ""}
                  >
                    {patologiaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-sm mb-4">Tabla de Frecuencias</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {patologiaData.map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm flex-1 truncate">{row.name}</span>
                    <span className="text-sm font-mono font-bold text-primary shrink-0">{row.value}</span>
                    <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                      {totalRx > 0 ? `${((row.value / totalRx) * 100).toFixed(1)}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}