"use client";

import { useState } from "react";
import { History, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useProfile } from "@/lib/profile/profile-provider";
import { PROFILE_META } from "@/lib/types";
import type { InventoryBundle } from "@/lib/inventory/types";
import type { Customer } from "@/lib/customers/types";
import type { SalesBundle } from "@/lib/pos/types";
import { cn } from "@/lib/utils";
import { Register } from "./register";
import { SalesHistory } from "./sales-history";

type Tab = "vender" | "historial";

export function PosView({
  inventory,
  sales,
  customers,
  seller,
}: {
  inventory: InventoryBundle;
  sales: SalesBundle;
  customers: Customer[];
  seller: string;
}) {
  const { profile } = useProfile();
  const [tab, setTab] = useState<Tab>("vender");
  const meta = PROFILE_META[profile];

  const products = inventory[profile].products;
  const profileSales = sales[profile];
  const demo = inventory.source === "sample";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <PageHeader
        title="Punto de venta"
        subtitle={
          <>
            Vendiendo{" "}
            <span className="font-medium text-fg">{meta.label}</span> —{" "}
            {meta.tagline}.
            {demo && (
              <span className="ml-1 text-muted/70">
                Modo demo: conecta Supabase para cobrar real.
              </span>
            )}
          </>
        }
        actions={
          <div className="flex overflow-hidden rounded-xl border border-border/70">
            <TabBtn active={tab === "vender"} onClick={() => setTab("vender")}>
              <ShoppingCart className="h-4 w-4" />
              Vender
            </TabBtn>
            <TabBtn active={tab === "historial"} onClick={() => setTab("historial")}>
              <History className="h-4 w-4" />
              Historial
            </TabBtn>
          </div>
        }
      />

      {tab === "vender" ? (
        <Register
          key={profile}
          profile={profile}
          products={products}
          customers={customers}
          seller={seller}
        />
      ) : (
        <SalesHistory key={profile} sales={profileSales} />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-fg"
          : "bg-surface-2/50 text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
