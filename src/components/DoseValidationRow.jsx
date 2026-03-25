import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function DoseValidationRow({ drug, index }) {
  const getStatusIcon = () => {
    if (drug.is_valid === undefined || drug.is_valid === null) return null;
    if (drug.is_valid) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (Math.abs(drug.variance_percent) > 20) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };

  const getRowBg = () => {
    if (drug.is_valid === undefined || drug.is_valid === null) return "";
    if (drug.is_valid) return "bg-emerald-50/50";
    if (Math.abs(drug.variance_percent) > 20) return "bg-red-50/50";
    return "bg-amber-50/50";
  };

  return (
    <tr className={`border-b border-border last:border-0 ${getRowBg()}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">{drug.drug_name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-mono">
        {drug.prescribed_dose} {drug.dose_unit || "mg"}
      </td>
      <td className="px-4 py-3 text-sm font-mono">
        {drug.calculated_dose ? `${drug.calculated_dose} mg` : "—"}
      </td>
      <td className="px-4 py-3 text-sm">
        {drug.dose_per_unit} {drug.dose_basis}
      </td>
      <td className="px-4 py-3 text-sm">{drug.route}</td>
      <td className="px-4 py-3 text-sm">{drug.infusion_time}</td>
      <td className="px-4 py-3 text-sm">
        {drug.variance_percent !== undefined && drug.variance_percent !== null ? (
          <span className={`font-mono font-medium ${
            Math.abs(drug.variance_percent) <= 10 ? "text-emerald-600" :
            Math.abs(drug.variance_percent) <= 20 ? "text-amber-600" : "text-red-600"
          }`}>
            {drug.variance_percent > 0 ? "+" : ""}{drug.variance_percent}%
          </span>
        ) : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground max-w-48 truncate">
        {drug.validation_notes || "—"}
      </td>
    </tr>
  );
}