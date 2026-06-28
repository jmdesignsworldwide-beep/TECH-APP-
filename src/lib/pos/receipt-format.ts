import { PAYMENT_LABELS } from "./payment-methods";
import type { CartLine, CheckoutResult, PaymentEntry, SaleRecord } from "./types";

/** Estructura normalizada del recibo, común a venta nueva e historial. */
export interface ReceiptData {
  ncf: string;
  ncfType: string;
  dateISO: string;
  items: { name: string; qty: number; lineTotal: number }[];
  subtotal: number;
  itbis: number;
  discount: number;
  total: number;
  payments: { label: string; amount: number }[];
  change: number;
  customer: string | null;
  customerPhone: string | null;
  seller: string;
  voided?: boolean;
}

const DISCLAIMER =
  "Documento de ejemplo generado para demostración. NCF simulado, no certificado ante la DGII.";

function rd(n: number) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Fecha dominicana DD/MM/AAAA HH:MM. */
export function formatDateDO(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

export function receiptFromCheckout(
  result: CheckoutResult,
  lines: CartLine[],
  payments: PaymentEntry[],
  seller: string,
  customer: string | null,
  dateISO: string,
  customerPhone: string | null = null,
): ReceiptData {
  return {
    ncf: result.ncf,
    ncfType: result.ncfType,
    dateISO,
    items: lines.map((l) => ({
      name: l.name,
      qty: l.qty,
      lineTotal: l.price * l.qty,
    })),
    subtotal: result.subtotal,
    itbis: result.itbis,
    discount: result.discount,
    total: result.total,
    payments: payments.map((p) => ({
      label: PAYMENT_LABELS[p.method] ?? p.method,
      amount: p.amount,
    })),
    change: result.change,
    customer,
    customerPhone,
    seller,
  };
}

export function receiptFromSale(sale: SaleRecord): ReceiptData {
  return {
    ncf: sale.folio,
    ncfType: sale.ncfType ?? "B02",
    dateISO: sale.soldAt,
    items: sale.items.map((it) => ({
      name: it.name,
      qty: it.qty,
      lineTotal: it.lineTotal,
    })),
    subtotal: sale.subtotal,
    itbis: sale.itbis,
    discount: sale.discount,
    total: sale.total,
    payments: sale.payments.map((p) => ({
      label: PAYMENT_LABELS[p.method] ?? p.method,
      amount: p.amount,
    })),
    change: 0,
    customer: sale.customer,
    customerPhone: sale.customerPhone ?? null,
    seller: sale.seller,
    voided: sale.status === "anulada",
  };
}

/**
 * Normaliza un teléfono dominicano a formato wa.me (código país 1 + 10 dígitos).
 * Devuelve null si no parece válido.
 */
export function normalizeDoPhone(input: string): string | null {
  const digits = (input || "").replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`; // 809/829/849 XXXXXXX
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  if (digits.length >= 11 && digits.length <= 15) return digits; // otro país
  return null;
}

/** Enlace wa.me con el resumen del recibo como mensaje (wa.me no adjunta archivos). */
export function whatsappUrl(d: ReceiptData, phone: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(receiptText(d))}`;
}

/** Recibo en texto plano (para compartir por WhatsApp, etc.). */
export function receiptText(d: ReceiptData): string {
  const lines: string[] = [];
  lines.push("JM Tech — Recibo de ejemplo");
  lines.push(`${d.ncfType} · NCF ${d.ncf}`);
  lines.push(formatDateDO(d.dateISO));
  if (d.voided) lines.push("** ANULADA **");
  lines.push("--------------------------------");
  for (const it of d.items) {
    lines.push(`${it.qty}x ${it.name}  ${rd(it.lineTotal)}`);
  }
  lines.push("--------------------------------");
  lines.push(`Subtotal: ${rd(d.subtotal)}`);
  if (d.discount > 0) lines.push(`Descuento: -${rd(d.discount)}`);
  lines.push(`ITBIS (18%, incl.): ${rd(d.itbis)}`);
  lines.push(`TOTAL: ${rd(d.total)}`);
  if (d.payments.length) {
    lines.push("--------------------------------");
    for (const p of d.payments) lines.push(`${p.label}: ${rd(p.amount)}`);
    if (d.change > 0) lines.push(`Cambio: ${rd(d.change)}`);
  }
  lines.push("--------------------------------");
  lines.push(`Cliente: ${d.customer ?? "Consumidor Final"}`);
  lines.push(`Atendido por: ${d.seller}`);
  lines.push("");
  lines.push(DISCLAIMER);
  return lines.join("\n");
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML de recibo angosto (estilo térmico) para imprimir. */
export function receiptHtml(d: ReceiptData): string {
  const row = (l: string, v: string, strong = false) =>
    `<div class="row${strong ? " strong" : ""}"><span>${esc(l)}</span><span>${esc(v)}</span></div>`;
  const items = d.items
    .map(
      (it) =>
        `<div class="item"><span>${it.qty}× ${esc(it.name)}</span><span>${esc(rd(it.lineTotal))}</span></div>`,
    )
    .join("");
  const pays = d.payments
    .map((p) => row(p.label, rd(p.amount)))
    .join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Recibo ${esc(d.ncf)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { width: 72mm; margin: 0 auto; font-family: "Courier New", ui-monospace, monospace; color: #111; font-size: 12px; line-height: 1.45; }
  .center { text-align: center; }
  .brand { font-size: 16px; font-weight: 700; letter-spacing: .5px; }
  .muted { color: #555; font-size: 11px; }
  .sep { border-top: 1px dashed #999; margin: 8px 0; }
  .row, .item { display: flex; justify-content: space-between; gap: 8px; }
  .item span:first-child { max-width: 46mm; }
  .strong { font-weight: 700; font-size: 14px; }
  .disclaimer { margin-top: 10px; font-size: 10px; color: #555; text-align: center; }
  .voided { color: #b00; font-weight: 700; text-align:center; }
</style></head><body>
  <div class="center"><div class="brand">JM Tech</div><div class="muted">Recibo de ejemplo</div>
  <div class="muted">${esc(d.ncfType)} · NCF ${esc(d.ncf)}</div>
  <div class="muted">${esc(formatDateDO(d.dateISO))}</div></div>
  ${d.voided ? '<div class="voided">** ANULADA **</div>' : ""}
  <div class="sep"></div>
  ${items}
  <div class="sep"></div>
  ${row("Subtotal", rd(d.subtotal))}
  ${d.discount > 0 ? row("Descuento", "- " + rd(d.discount)) : ""}
  ${row("ITBIS (18%, incl.)", rd(d.itbis))}
  ${row("TOTAL", rd(d.total), true)}
  <div class="sep"></div>
  ${pays}
  ${d.change > 0 ? row("Cambio", rd(d.change)) : ""}
  <div class="sep"></div>
  <div class="center muted">Cliente: ${esc(d.customer ?? "Consumidor Final")}<br>Atendido por ${esc(d.seller)}</div>
  <div class="disclaimer">${esc(DISCLAIMER)}</div>
  <script>window.onload=function(){setTimeout(function(){window.print();},150);};window.onafterprint=function(){window.close();};</script>
</body></html>`;
}

/** Abre una ventana con el recibo formateado y lanza el diálogo de impresión. */
export function printReceipt(d: ReceiptData) {
  const w = window.open("", "_blank", "width=380,height=640");
  if (!w) return false;
  w.document.open();
  w.document.write(receiptHtml(d));
  w.document.close();
  return true;
}

/**
 * Comparte el recibo. Usa la Web Share API (sheet del sistema → WhatsApp, etc.);
 * si no está disponible, copia el texto al portapapeles. Devuelve cómo terminó.
 */
export async function shareReceipt(
  d: ReceiptData,
): Promise<"shared" | "copied" | "failed"> {
  const text = receiptText(d);
  const nav = navigator as Navigator & {
    share?: (data: { title?: string; text?: string }) => Promise<void>;
  };
  try {
    if (nav.share) {
      await nav.share({ title: `Recibo JM Tech ${d.ncf}`, text });
      return "shared";
    }
  } catch {
    return "failed";
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
