import type { MaestroConfig } from './MaestroPage'
import {
  analystsApi,
  companiesApi,
  containerTypesApi,
  countriesApi,
  currenciesApi,
  customsBrokersApi,
  documentTypesApi,
  forwardersApi,
  incotermsApi,
  insuranceCompaniesApi,
  packageTypesApi,
  paymentTermsApi,
  portsApi,
  shippingLinesApi,
  tariffCodesApi,
  transportModesApi,
  unitsOfMeasureApi,
  warehousesApi,
} from '@/api/maestrosApi'

export const analystsConfig: MaestroConfig = {
  title: 'Analistas',
  singular: 'analista',
  queryKey: 'analysts',
  api: analystsApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'fullName', label: 'Nombre completo' },
  ],
}

export const companiesConfig: MaestroConfig = {
  title: 'Empresas',
  singular: 'empresa',
  queryKey: 'companies',
  api: companiesApi,
  hasActive: true,
  fields: [
    { key: 'code', label: 'Código', mono: true },
    { key: 'name', label: 'Nombre' },
  ],
}

export const containerTypesConfig: MaestroConfig = {
  title: 'Tipos de Contenedor',
  singular: 'tipo de contenedor',
  queryKey: 'container-types',
  api: containerTypesApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
    { key: 'capacityM3', label: 'Capacidad (m³)', type: 'number', required: false, nullable: true },
  ],
}

export const countriesConfig: MaestroConfig = {
  title: 'Países',
  singular: 'país',
  queryKey: 'countries',
  api: countriesApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
  ],
}

export const currenciesConfig: MaestroConfig = {
  title: 'Monedas',
  singular: 'moneda',
  queryKey: 'currencies',
  api: currenciesApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
    { key: 'symbol', label: 'Símbolo', mono: true },
  ],
}

export const customsBrokersConfig: MaestroConfig = {
  title: 'Agencias de Aduana',
  singular: 'agencia de aduana',
  queryKey: 'customs-brokers',
  api: customsBrokersApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
    { key: 'federalTaxID', label: 'RUT / Tax ID', required: false },
  ],
}

export const documentTypesConfig: MaestroConfig = {
  title: 'Tipos de Documento',
  singular: 'tipo de documento',
  queryKey: 'document-types',
  api: documentTypesApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
  ],
}

export const forwardersConfig: MaestroConfig = {
  title: 'Agentes de Carga',
  singular: 'agente de carga',
  queryKey: 'forwarders',
  api: forwardersApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
    { key: 'federalTaxID', label: 'RUT / Tax ID', required: false },
  ],
}

export const incotermsConfig: MaestroConfig = {
  title: 'Incoterms',
  singular: 'incoterm',
  queryKey: 'incoterms',
  api: incotermsApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
  ],
}

export const insuranceCompaniesConfig: MaestroConfig = {
  title: 'Aseguradoras',
  singular: 'aseguradora',
  queryKey: 'insurance-companies',
  api: insuranceCompaniesApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
    { key: 'federalTaxId', label: 'RUT / Tax ID', required: false },
  ],
}

export const packageTypesConfig: MaestroConfig = {
  title: 'Tipos de Embalaje',
  singular: 'tipo de embalaje',
  queryKey: 'package-types',
  api: packageTypesApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
  ],
}

export const paymentTermsConfig: MaestroConfig = {
  title: 'Términos de Pago',
  singular: 'término de pago',
  queryKey: 'payment-terms',
  api: paymentTermsApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
    { key: 'days', label: 'Días', type: 'number', required: false, nullable: true },
  ],
}

export const portsConfig: MaestroConfig = {
  title: 'Puertos',
  singular: 'puerto',
  queryKey: 'ports',
  api: portsApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
    { key: 'country', label: 'País' },
    {
      key: 'direction',
      label: 'Dirección',
      type: 'select',
      options: [
        { value: 'Loading', label: 'Carga' },
        { value: 'Discharging', label: 'Descarga' },
        { value: 'Both', label: 'Ambos' },
      ],
    },
  ],
}

export const shippingLinesConfig: MaestroConfig = {
  title: 'Líneas Navieras',
  singular: 'línea naviera',
  queryKey: 'shipping-lines',
  api: shippingLinesApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
  ],
}

export const tariffCodesConfig: MaestroConfig = {
  title: 'Códigos Arancelarios',
  singular: 'código arancelario',
  queryKey: 'tariff-codes',
  api: tariffCodesApi,
  hasActive: false,
  nameField: 'description',
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'description', label: 'Descripción' },
  ],
}

export const transportModesConfig: MaestroConfig = {
  title: 'Modos de Transporte',
  singular: 'modo de transporte',
  queryKey: 'transport-modes',
  api: transportModesApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
  ],
}

export const unitsOfMeasureConfig: MaestroConfig = {
  title: 'Unidades de Medida',
  singular: 'unidad de medida',
  queryKey: 'units-of-measure',
  api: unitsOfMeasureApi,
  hasActive: false,
  fields: [
    { key: 'code', label: 'Código', mono: true, inEdit: false },
    { key: 'name', label: 'Nombre' },
  ],
}

export const warehousesConfig: MaestroConfig = {
  title: 'Bodegas',
  singular: 'bodega',
  queryKey: 'warehouses',
  api: warehousesApi,
  hasActive: false,
  nameField: 'whsName',
  fields: [
    { key: 'whsCode', label: 'Código', mono: true },
    { key: 'whsName', label: 'Nombre' },
  ],
}
