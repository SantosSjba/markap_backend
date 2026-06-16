/**
 * Datos extraídos de MODELO PRESUPUESTO CAROLINA ZAVALA INTERIORISMO.xlsx
 * Hoja: PROYECTO HORTENSIAS
 */

export const HORTENSIAS_PROJECT_CODE = 'INT-HORTENSIAS-001';

export interface HortensiasLineItemSeed {
  sortOrder: number;
  description: string;
  budgetedCost: number;
  actualPurchaseCost?: number | null;
  hasIgv?: boolean;
  supplierName?: string | null;
}

export interface HortensiasSectionSeed {
  name: string;
  sortOrder: number;
  items: HortensiasLineItemSeed[];
}

export const HORTENSIAS_BUDGET_SECTIONS: HortensiasSectionSeed[] = [
  {
    name: 'PRIMER NIVEL',
    sortOrder: 0,
    items: [
      { sortOrder: 1, description: 'Jardin interior bajo escaleras', budgetedCost: 0 },
      { sortOrder: 2, description: '6 sacos de piedras blancas', budgetedCost: 240, actualPurchaseCost: 210 },
      { sortOrder: 3, description: 'Planta 1 - Elegantísima', budgetedCost: 180, actualPurchaseCost: 150 },
      { sortOrder: 4, description: 'Maceta para planta 1 / Línea bowl 40 sandstone', budgetedCost: 150, actualPurchaseCost: 135.92 },
      { sortOrder: 5, description: 'Planta 2 - Palo Brasil', budgetedCost: 168, actualPurchaseCost: 135 },
      { sortOrder: 6, description: 'Maceta para planta 2 / Línea bowl 40 sandstone', budgetedCost: 150, actualPurchaseCost: 135.92 },
      { sortOrder: 7, description: 'Planta 3 - Sedum (2), cintas de novia (2), peperonia (1)', budgetedCost: 180, actualPurchaseCost: 95 },
      { sortOrder: 8, description: 'Maceta para planta 3 / Lotus bowl 46 platón bajo irregular', budgetedCost: 140, actualPurchaseCost: 131.2 },
      { sortOrder: 9, description: 'Planta 4 - Helecho vela, peperonia (2)', budgetedCost: 140, actualPurchaseCost: 95 },
      { sortOrder: 10, description: 'Maceta para planta 4/ Lotus bowl 55 platón bajo irregular', budgetedCost: 160, actualPurchaseCost: 151.92 },
      { sortOrder: 11, description: 'Planta 5 - Filodendro, asientos de suegra (2)', budgetedCost: 350, actualPurchaseCost: 310 },
      { sortOrder: 12, description: 'Maceta para planta 5 /línea bowl 53 inclinada', budgetedCost: 240, actualPurchaseCost: 231.92 },
      { sortOrder: 13, description: 'Planta 6 - Ficus Lirata, Peperonia (2)', budgetedCost: 285, actualPurchaseCost: 240 },
      { sortOrder: 14, description: 'Maceta para planta 6/ fringe 44 larga', budgetedCost: 360, actualPurchaseCost: 343.92 },
      { sortOrder: 15, description: 'Planta 7 - Árbol de la abundancia blanco', budgetedCost: 60, actualPurchaseCost: 35 },
      { sortOrder: 16, description: 'Maceta para planta 7', budgetedCost: 275, actualPurchaseCost: 240 },
      { sortOrder: 17, description: 'Sacos de tierra preparada e instalación', budgetedCost: 150, actualPurchaseCost: 120 },
      { sortOrder: 18, description: 'Corteza (5 bolsas pequeñas)', budgetedCost: 65, actualPurchaseCost: 45 },
      { sortOrder: 19, description: 'Luminarias de piso para jardín interior bajo escaleras (3 unidades) instalados', budgetedCost: 480, actualPurchaseCost: 480 },
      { sortOrder: 20, description: 'Piedras de Simbal, ayudantes y transporte (250) y limpieza', budgetedCost: 390, actualPurchaseCost: 350 },
    ],
  },
  {
    name: 'Sala, comedor, baño',
    sortOrder: 1,
    items: [
      { sortOrder: 1, description: 'Luz led neutral en zona de tv', budgetedCost: 200, actualPurchaseCost: 200 },
      { sortOrder: 2, description: 'Esculturas para zona de tv', budgetedCost: 0 },
      { sortOrder: 3, description: 'Lámpara central del comedor', budgetedCost: 400, actualPurchaseCost: 350 },
      { sortOrder: 4, description: 'Luminaria central baño de visitas', budgetedCost: 150, actualPurchaseCost: 45 },
      { sortOrder: 5, description: 'Mantenimiento de ventilador de sala', budgetedCost: 20, actualPurchaseCost: 20 },
      { sortOrder: 6, description: 'Luminaria de ingreso principal puerta', budgetedCost: 190, actualPurchaseCost: 190 },
    ],
  },
  {
    name: 'SEGUNDO NIVEL',
    sortOrder: 2,
    items: [
      { sortOrder: 1, description: 'Lámpara central habitación secundaria 1', budgetedCost: 150, actualPurchaseCost: 95 },
      { sortOrder: 2, description: 'Lámpara central habitación secundaria 2', budgetedCost: 150, actualPurchaseCost: 95 },
      { sortOrder: 3, description: 'Luminaria central de baño de habitaciones secundarias', budgetedCost: 150, actualPurchaseCost: 45 },
      { sortOrder: 4, description: 'Luminaria central de baño de habitación principal', budgetedCost: 150, actualPurchaseCost: 45 },
      { sortOrder: 5, description: 'Luminaria central de sala común entre habitaciones', budgetedCost: 350, actualPurchaseCost: 350 },
    ],
  },
  {
    name: 'ESCALERAS',
    sortOrder: 3,
    items: [
      { sortOrder: 1, description: 'Luminaria dirigible', budgetedCost: 220, actualPurchaseCost: 220 },
      { sortOrder: 2, description: 'Cuadro central principal dorado a medida', budgetedCost: 1180, actualPurchaseCost: 1150 },
    ],
  },
  {
    name: 'COCINA Y LAVANDERÍA',
    sortOrder: 4,
    items: [
      { sortOrder: 1, description: 'Cambiar jaladores oxidados', budgetedCost: 200, actualPurchaseCost: 50 },
      { sortOrder: 2, description: 'Pintar puertas de muebles bajos de melamina', budgetedCost: 100, actualPurchaseCost: 80 },
      { sortOrder: 3, description: 'Luminaria central', budgetedCost: 120, actualPurchaseCost: 100 },
      { sortOrder: 4, description: 'Mueble de melamina para organización lavandería', budgetedCost: 400, actualPurchaseCost: 400 },
    ],
  },
];

/** Pago a cuenta del Excel (fila "A CUENTA" = 3000) */
export const HORTENSIAS_CLIENT_DEPOSIT = {
  amount: 3000,
  concept: 'A cuenta',
  paymentType: 'ABONO' as const,
};
