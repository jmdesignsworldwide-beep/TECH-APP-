"use client";

import { useState } from "react";
import { Check, Printer, Share2 } from "lucide-react";
import { PremiumButton } from "@/components/ui/premium-button";
import {
  printReceipt,
  shareReceipt,
  type ReceiptData,
} from "@/lib/pos/receipt-format";

/**
 * Acciones del recibo: Imprimir (diálogo del navegador con formato térmico) y
 * Compartir (Web Share API → WhatsApp/etc.; si no, copia al portapapeles).
 * Reutilizable tras una venta y desde el detalle del historial.
 */
export function ReceiptActions({ data }: { data: ReceiptData }) {
  const [toast, setToast] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  async function onShare() {
    setSharing(true);
    const res = await shareReceipt(data);
    setSharing(false);
    if (res === "copied") flash("Recibo copiado al portapapeles");
    else if (res === "failed") flash("No se pudo compartir");
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="flex items-center gap-2">
      <PremiumButton variant="subtle" size="sm" onClick={() => printReceipt(data)}>
        <Printer className="h-4 w-4" />
        Imprimir
      </PremiumButton>
      <PremiumButton variant="subtle" size="sm" onClick={onShare} loading={sharing}>
        <Share2 className="h-4 w-4" />
        Compartir
      </PremiumButton>
      {toast && (
        <span className="inline-flex items-center gap-1 text-xs text-success">
          <Check className="h-3.5 w-3.5" />
          {toast}
        </span>
      )}
    </div>
  );
}
