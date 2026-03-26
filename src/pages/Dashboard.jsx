import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ClipboardList, CheckCircle, Clock, XCircle, FilePlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { formatDate } from "@/lib/dateUtils";

export default function Dashboard() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Prescription.list("-created_date", 50).then(data => {
      setPrescriptions(data);
      setLoading(false);
    });
  }, []);

  const stats = {
    total: prescriptions.length,
    pending: prescriptions.filter(p => p.validation_status === "Pendiente").length,
    validated: prescriptions.filter(p => p.validation_status === "Validada").length,
    rejected: prescriptions.filter(p => p.validation_status === "Rechazada").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de Estados</h1>
        <p className="text-muted-foreground text-sm mt-1">Centro de Mezclas Oncológicas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: ClipboardList, color: "text-foreground", bg: "bg-muted" },
          { label: "Pendientes", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Validadas", value: stats.validated, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Rechazadas", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="mt-4 text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>


    </div>
  );
}