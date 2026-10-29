export type InteriorReportsDateRange = { startDate: string; endDate: string };
export type ReportMoney = { currency: string; amount: number };
export type ReportProject = {
  id: string;
  code: string;
  name: string;
  status: string;
  createdDate: string;
  currency: string;
  budget: number;
  actualCost: number;
  paid: number;
  pending: number;
  utility: number;
  marginPct: number | null;
  unconverted: ReportMoney[];
};
export type ReportCollection = {
  id: string;
  projectId: string;
  projectCode: string;
  concept: string;
  date: string;
  currency: string;
  amount: number;
};
export type ReportSupplier = {
  key: string;
  supplierId: string | null;
  name: string;
  currency: string;
  actualCost: number;
  paid: number;
  balance: number;
  catalogPurchases: number;
};
export type InteriorReportsDashboardDto = {
  applicationSlug: string;
  range: InteriorReportsDateRange;
  projects: ReportProject[];
  profitability: ReportProject[];
  collections: ReportCollection[];
  suppliers: ReportSupplier[];
  monthly: { key: string; projects: number; collections: ReportMoney[] }[];
  totals: {
    budget: ReportMoney[];
    actualCost: ReportMoney[];
    collected: ReportMoney[];
    pending: ReportMoney[];
    supplierBalance: ReportMoney[];
    catalogPurchases: ReportMoney[];
  };
  stages: { status: string; count: number }[];
  kpis: {
    activeProjects: number;
    inExecution: number;
    clients: number;
    quotation: number;
    newProjects: number;
    tasks: number;
    completedTasks: number;
    openIncidents: number;
  };
  alerts: {
    overdueProjects: number;
    pendingProjects: number;
    unpaidSuppliers: number;
    unconvertedPayments: number;
  };
};
