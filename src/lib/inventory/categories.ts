import type { ProfileType } from "@/lib/types";

/** Categorías por perfil (las del brief). */
export const CATEGORIES: Record<ProfileType, string[]> = {
  celulares: [
    "Celulares/Smartphones",
    "Tablets/iPads",
    "Smartwatches",
    "Auriculares/AirPods",
    "Cargadores/Cables",
    "Cases/Fundas",
    "Protectores",
    "Power Banks",
    "Memorias",
    "Accesorios",
  ],
  electronicas: [
    "Laptops/Computadoras",
    "Monitores",
    "Impresoras",
    "Consolas",
    "Videojuegos",
    "TVs/Smart TV",
    "Sonido/Bocinas",
    "Auriculares/Headsets",
    "Cámaras",
    "Drones",
    "Proyectores",
    "Seguridad/Cámaras IP",
    "Routers",
    "Memorias/Discos",
    "Periféricos",
    "Cables",
    "Cargadores",
    "Componentes PC",
    "Smart Home",
    "Wearables",
  ],
};
