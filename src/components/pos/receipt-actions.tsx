"use client";

import { useState } from "react";
import { Check, Printer, Send, Share2 } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import {
  normalizeDoPhone,
  printReceipt,
  shareReceipt,
  whatsappUrl,
  type ReceiptData,
} from "@/lib/pos/receipt-format";

/**
 * Acciones del recibo: Imprimir (formato térmico), Compartir (Web Share /
 * portapapeles) y Enviar por WhatsApp (wa.me con el resumen del recibo como
 * texto — wa.me no adjunta archivos). Reutilizable tras una venta y desde el
 * detalle del historial.
 */
export function ReceiptActions({ data }: { data: ReceiptData }) {
  const [toast, setToast] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const [phone, setPhone] = useState(data.customerPhone ?? "");
  const [waError, setWaError] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function onShare() {
    setSharing(true);
    const res = await shareReceipt(data);
    setSharing(false);
    if (res === "copied") flash("Recibo copiado al portapapeles");
    else if (res === "failed") flash("No se pudo compartir");
  }

  function sendWhatsApp() {
    const normalized = normalizeDoPhone(phone);
    if (!normalized) {
      setWaError("Número inválido. Ej: 809 123 4567");
      return;
    }
    window.open(whatsappUrl(data, normalized), "_blank", "noopener,noreferrer");
    setWaOpen(false);
    setWaError(null);
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <PremiumButton variant="subtle" size="sm" onClick={() => printReceipt(data)}>
          <Printer className="h-4 w-4" />
          Imprimir
        </PremiumButton>
        <PremiumButton variant="subtle" size="sm" onClick={onShare} loading={sharing}>
          <Share2 className="h-4 w-4" />
          Compartir
        </PremiumButton>
        <PremiumButton
          variant={waOpen ? "primary" : "subtle"}
          size="sm"
          onClick={() => {
            setWaOpen((v) => !v);
            setWaError(null);
          }}
        >
          <Send className="h-4 w-4" />
          WhatsApp
        </PremiumButton>
        {toast && (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <Check className="h-3.5 w-3.5" />
            {toast}
          </span>
        )}
      </div>

      {waOpen && (
        <div className="rounded-xl border border-border/60 bg-surface-2/40 p-2.5">
          <p className="mb-1.5 text-xs text-muted">
            Número del cliente (se abrirá WhatsApp con el recibo)
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">🇩🇴 +1</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendWhatsApp()}
              inputMode="tel"
              placeholder="809 123 4567"
              autoFocus
              className="flex-1 rounded-lg border border-border/70 bg-surface-2/60 px-3 py-2 text-sm text-fg outline-none tnum focus:border-accent/70"
            />
            <PremiumButton size="sm" onClick={sendWhatsApp}>
              Enviar
            </PremiumButton>
          </div>
          {waError && <p className="mt-1.5 text-xs text-danger">{waError}</p>}
        </div>
      )}
    </div>
  );
}
