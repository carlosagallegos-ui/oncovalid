import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

const statusConfig = {
  Pendiente: { icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200" },
  Validada: { icon: CheckCircle, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Rechazada: { icon: XCircle, className: "bg-red-50 text-red-700 border-red-200" },
  Ajustada: { icon: AlertTriangle, className: "bg-blue-50 text-blue-700 border-blue-200" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.Pendiente;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}