import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";
import { formatDateTime } from "@/lib/dateUtils";

export default function ClinicalFeedback({ rx, onUpdate, userRole }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendFeedback = async () => {
    if (!message.trim()) return;
    setSending(true);

    const user = await base44.auth.me();
    const feedback = rx.clinical_feedback || [];
    feedback.push({
      from_role: userRole,
      from_name: user.full_name || user.email,
      message: message.trim(),
      timestamp: new Date().toISOString()
    });

    await base44.entities.Prescription.update(rx.id, { clinical_feedback: feedback });
    setMessage("");
    onUpdate();
    setSending(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Feedback Clínico</h3>
      </div>

      {/* Mensajes */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto min-h-24">
        {rx.clinical_feedback && rx.clinical_feedback.length > 0 ? (
          rx.clinical_feedback.map((fb, i) => (
            <div key={i} className={`p-3 rounded-lg ${fb.from_role === "farmaceutico" ? "bg-blue-50" : "bg-amber-50"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${fb.from_role === "farmaceutico" ? "text-blue-700" : "text-amber-700"}`}>
                  {fb.from_role === "farmaceutico" ? "🔬" : "👨‍⚕️"} {fb.from_name}
                </span>
                <span className="text-xs text-muted-foreground">{formatDateTime(fb.timestamp)}</span>
              </div>
              <p className="text-sm">{fb.message}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sin mensajes aún</p>
        )}
      </div>

      {/* Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Añade un comentario clínico..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          className="text-sm"
        />
        <Button
          onClick={handleSendFeedback}
          disabled={sending || !message.trim()}
          className="w-full gap-2"
          size="sm"
        >
          <Send className="h-3 w-3" />
          {sending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}