import { CheckCircle, Clock, XCircle, Eye, ArrowDown } from "lucide-react";
import { formatDateTime } from "@/lib/dateUtils";

export default function StateTimeline({ rx }) {
  const timeline = rx.state_history || [];
  
  const getIcon = (status) => {
    switch(status) {
      case "Validada": return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "Rechazada": return <XCircle className="h-5 w-5 text-red-500" />;
      case "Inspeccionada": return <Eye className="h-5 w-5 text-blue-500" />;
      case "Entregada": return <ArrowDown className="h-5 w-5 text-purple-500" />;
      default: return <Clock className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <h3 className="font-semibold">Historial de Estados</h3>
      
      <div className="space-y-4">
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sin cambios de estado registrados</p>
        ) : (
          timeline.map((entry, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="p-1.5 rounded-full bg-muted">
                  {getIcon(entry.status)}
                </div>
                {i < timeline.length - 1 && <div className="w-0.5 h-12 bg-border my-2" />}
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-semibold">{entry.status}</p>
                <p className="text-xs text-muted-foreground">{entry.changed_by}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(entry.timestamp)}</p>
                {entry.reason && <p className="text-xs mt-2 italic">{entry.reason}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}