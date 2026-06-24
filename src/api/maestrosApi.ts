import { apiClient } from './client'
import type { PagedResult } from './compras'

// ─── Shared base ──────────────────────────────────────────────────────────────

export type BaseMaestro = { id: string; version: number }

type ListParams = { page?: number; pageSize?: number }

// ─── Entity interfaces ────────────────────────────────────────────────────────

export interface Analyst extends BaseMaestro {
  code: string
  fullName: string
  createdAt: string
}

export interface Company extends BaseMaestro {
  code: string
  name: string
  active: boolean
}

export interface ContainerType extends BaseMaestro {
  code: string
  name: string
  capacityM3?: number | null
}

export interface Country extends BaseMaestro {
  code: string
  name: string
}

export interface Currency extends BaseMaestro {
  code: string
  name: string
  symbol: string
}

export interface CustomsBroker extends BaseMaestro {
  code: string
  name: string
  federalTaxID?: string | null
}

export interface DocumentType extends BaseMaestro {
  code: string
  name: string
}

export interface Forwarder extends BaseMaestro {
  code: string
  name: string
  federalTaxID?: string | null
}

export interface Incoterm extends BaseMaestro {
  code: string
  name: string
}

export interface InsuranceCompany extends BaseMaestro {
  code: string
  name: string
  federalTaxId?: string | null
}

export interface PackageType extends BaseMaestro {
  code: string
  name: string
}

export interface PaymentTerm extends BaseMaestro {
  code: string
  name: string
  days?: number | null
}

export interface Port extends BaseMaestro {
  code: string
  name: string
  country: string
  direction: 'Loading' | 'Discharging' | 'Both'
}

export interface ShippingLine extends BaseMaestro {
  code: string
  name: string
}

export interface TariffCode extends BaseMaestro {
  code: string
  description: string
}

export interface TransportMode extends BaseMaestro {
  code: string
  name: string
}

export interface UnitOfMeasure extends BaseMaestro {
  code: string
  name: string
}

export interface Warehouse extends BaseMaestro {
  whsCode: string
  whsName: string
}

// ─── Create / Update payload types ───────────────────────────────────────────

export type AnalystCreate = { code: string; fullName: string }
export type AnalystUpdate = { fullName: string; version: number }

export type CompanyCreate = { code: string; name: string; active?: boolean }
export type CompanyUpdate = { code: string; name: string; version: number }

export type ContainerTypeCreate = { code: string; name: string; capacityM3?: number | null }
export type ContainerTypeUpdate = { name: string; capacityM3?: number | null; version: number }

export type CountryCreate = { code: string; name: string }
export type CountryUpdate = { name: string; version: number }

export type CurrencyCreate = { code: string; name: string; symbol: string }
export type CurrencyUpdate = { name: string; symbol: string; version: number }

export type CustomsBrokerCreate = { code: string; name: string; federalTaxID?: string | null }
export type CustomsBrokerUpdate = { name: string; federalTaxID?: string | null; version: number }

export type DocumentTypeCreate = { code: string; name: string }
export type DocumentTypeUpdate = { name: string; version: number }

export type ForwarderCreate = { code: string; name: string; federalTaxID?: string | null }
export type ForwarderUpdate = { name: string; federalTaxID?: string | null; version: number }

export type IncotermCreate = { code: string; name: string }
export type IncotermUpdate = { name: string; version: number }

export type InsuranceCompanyCreate = { code: string; name: string; federalTaxId?: string | null }
export type InsuranceCompanyUpdate = { name: string; federalTaxId?: string | null; version: number }

export type PackageTypeCreate = { code: string; name: string }
export type PackageTypeUpdate = { name: string; version: number }

export type PaymentTermCreate = { code: string; name: string; days?: number | null }
export type PaymentTermUpdate = { name: string; days?: number | null; version: number }

export type PortCreate = { code: string; name: string; country: string; direction: Port['direction'] }
export type PortUpdate = { name: string; country: string; direction: Port['direction']; version: number }

export type ShippingLineCreate = { code: string; name: string }
export type ShippingLineUpdate = { name: string; version: number }

export type TariffCodeCreate = { code: string; description: string }
export type TariffCodeUpdate = { description: string; version: number }

export type TransportModeCreate = { code: string; name: string }
export type TransportModeUpdate = { name: string; version: number }

export type UnitOfMeasureCreate = { code: string; name: string }
export type UnitOfMeasureUpdate = { name: string; version: number }

export type WarehouseCreate = { whsCode: string; whsName: string }
export type WarehouseUpdate = { whsCode: string; whsName: string; version: number }

// ─── Factory ──────────────────────────────────────────────────────────────────

function makeMaestroApi<T extends BaseMaestro, TCreate, TUpdate>(path: string) {
  const base = `/maestros/${path}`
  return {
    list: (params?: ListParams) =>
      apiClient.get<PagedResult<T>>(base, { params }).then((r) => r.data),
    create: (data: TCreate) =>
      apiClient.post<T>(base, data).then((r) => r.data),
    update: (id: string, data: TUpdate) =>
      apiClient.put<T>(`${base}/${id}`, data).then((r) => r.data),
    delete: (id: string) =>
      apiClient.delete(`${base}/${id}`).then((r) => r.data),
    activate: (id: string) =>
      apiClient.patch(`${base}/${id}/activate`).then((r) => r.data),
  }
}

// ─── Named API objects ────────────────────────────────────────────────────────

export const analystsApi = makeMaestroApi<Analyst, AnalystCreate, AnalystUpdate>('analysts')
export const companiesApi = makeMaestroApi<Company, CompanyCreate, CompanyUpdate>('companies')
export const containerTypesApi = makeMaestroApi<ContainerType, ContainerTypeCreate, ContainerTypeUpdate>('container-types')
export const countriesApi = makeMaestroApi<Country, CountryCreate, CountryUpdate>('countries')
export const currenciesApi = makeMaestroApi<Currency, CurrencyCreate, CurrencyUpdate>('currencies')
export const customsBrokersApi = makeMaestroApi<CustomsBroker, CustomsBrokerCreate, CustomsBrokerUpdate>('customs-brokers')
export const documentTypesApi = makeMaestroApi<DocumentType, DocumentTypeCreate, DocumentTypeUpdate>('document-types')
export const forwardersApi = makeMaestroApi<Forwarder, ForwarderCreate, ForwarderUpdate>('forwarders')
export const incotermsApi = makeMaestroApi<Incoterm, IncotermCreate, IncotermUpdate>('incoterms')
export const insuranceCompaniesApi = makeMaestroApi<InsuranceCompany, InsuranceCompanyCreate, InsuranceCompanyUpdate>('insurance-companies')
export const packageTypesApi = makeMaestroApi<PackageType, PackageTypeCreate, PackageTypeUpdate>('package-types')
export const paymentTermsApi = makeMaestroApi<PaymentTerm, PaymentTermCreate, PaymentTermUpdate>('payment-terms')
export const portsApi = makeMaestroApi<Port, PortCreate, PortUpdate>('ports')
export const shippingLinesApi = makeMaestroApi<ShippingLine, ShippingLineCreate, ShippingLineUpdate>('shipping-lines')
export const tariffCodesApi = makeMaestroApi<TariffCode, TariffCodeCreate, TariffCodeUpdate>('tariff-codes')
export const transportModesApi = makeMaestroApi<TransportMode, TransportModeCreate, TransportModeUpdate>('transport-modes')
export const unitsOfMeasureApi = makeMaestroApi<UnitOfMeasure, UnitOfMeasureCreate, UnitOfMeasureUpdate>('units-of-measure')
export const warehousesApi = makeMaestroApi<Warehouse, WarehouseCreate, WarehouseUpdate>('warehouses')
