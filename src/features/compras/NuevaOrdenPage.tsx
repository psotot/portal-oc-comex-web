import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { comprasApi, type CreateOrderPayload } from '@/api/compras'
import { proveedoresApi } from '@/api/proveedores'
import { articulosApi } from '@/api/articulos'
import {
  analystsApi,
  companiesApi,
  containerTypesApi,
  countriesApi,
  currenciesApi,
  forwardersApi,
  incotermsApi,
  portsApi,
  unitsOfMeasureApi,
  warehousesApi,
} from '@/api/maestrosApi'

// ─── Combobox ────────────────────────────────────────────────────────────────

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  emptyText = 'No se encontraron resultados.',
  disabled = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  )

  const selectedLabel = useMemo(
    () => options.find((opt) => opt.value === value)?.label,
    [options, value],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {filtered.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.value}
                onSelect={() => {
                  onChange(opt.value)
                  setOpen(false)
                  setSearch('')
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === opt.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {opt.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── Zod schema ──────────────────────────────────────────────────────────────

const lineSchema = z.object({
  itemCode: z.string().min(1, 'Artículo requerido'),
  itemDescription: z.string().min(1, 'Descripción requerida'),
  quantity: z.coerce.number().positive('Debe ser mayor a 0'),
  price: z.coerce.number().min(0, 'No puede ser negativo'),
  currency: z.string().min(1, 'Moneda requerida'),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  warehouseCode: z.string().min(1, 'Bodega requerida'),
  uomCode: z.string().optional().nullable(),
  containerCode: z.string().optional().nullable(),
})

const formSchema = z.object({
  cardCode: z.string().min(1, 'Proveedor requerido'),
  cardName: z.string().min(1),
  companyCode: z.string().optional(),
  docDate: z.string().min(1, 'Fecha OC requerida'),
  docDueDate: z.string().min(1, 'Fecha vencimiento requerida'),
  docCurrency: z.string().min(1, 'Moneda requerida'),
  docRate: z.coerce.number().min(0).default(1),
  series: z.coerce.number().int().positive().default(1),
  partialSupply: z.boolean().default(false),
  confirmed: z.boolean().default(false),
  // COMEX
  comexAnalyst: z.string().optional().nullable(),
  incoterm: z.string().optional().nullable(),
  forwarderName: z.string().optional().nullable(),
  recipientCountryCode: z.string().optional().nullable(),
  departurePortCode: z.string().optional().nullable(),
  arrivalPortCode: z.string().optional().nullable(),
  cargoReadyDate: z.string().optional().nullable(),
  originDepartureDate: z.string().optional().nullable(),
  estimatedArrivalDate: z.string().optional().nullable(),
  warehouseArrivalDate: z.string().optional().nullable(),
  bookingNumber: z.string().optional().nullable(),
  vesselName: z.string().optional().nullable(),
  billOfLadingNumber: z.string().optional().nullable(),
  // Observaciones
  comments: z.string().optional().nullable(),
  reference1: z.string().optional().nullable(),
  numAtCard: z.string().optional().nullable(),
  // Lines
  lines: z.array(lineSchema).min(1, 'Se requiere al menos una línea'),
})

type FormValues = z.infer<typeof formSchema>

// ─── Page ─────────────────────────────────────────────────────────────────────

export function NuevaOrdenPage() {
  const navigate = useNavigate()
  const [comexOpen, setComexOpen] = useState(true)

  // ── Maestros queries ──────────────────────────────────────────────────────

  const { data: proveedoresData, isLoading: loadingProveedores } = useQuery({
    queryKey: ['proveedores-all'],
    queryFn: () => proveedoresApi.list({ pageSize: 500 }),
  })

  const { data: articulosData, isLoading: loadingArticulos } = useQuery({
    queryKey: ['articulos-all'],
    queryFn: () => articulosApi.list({ pageSize: 1000 }),
  })

  const { data: companiesData, isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companiesApi.list({ pageSize: 200 }),
  })

  const { data: currenciesData, isLoading: loadingCurrencies } = useQuery({
    queryKey: ['currencies-all'],
    queryFn: () => currenciesApi.list({ pageSize: 200 }),
  })

  const { data: incotermsData, isLoading: loadingIncoterms } = useQuery({
    queryKey: ['incoterms-all'],
    queryFn: () => incotermsApi.list({ pageSize: 200 }),
  })

  const { data: portsData, isLoading: loadingPorts } = useQuery({
    queryKey: ['ports-all'],
    queryFn: () => portsApi.list({ pageSize: 500 }),
  })

  const { data: countriesData, isLoading: loadingCountries } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => countriesApi.list({ pageSize: 300 }),
  })

  const { data: warehousesData, isLoading: loadingWarehouses } = useQuery({
    queryKey: ['warehouses-all'],
    queryFn: () => warehousesApi.list({ pageSize: 200 }),
  })

  const { data: containerTypesData } = useQuery({
    queryKey: ['container-types-all'],
    queryFn: () => containerTypesApi.list({ pageSize: 200 }),
  })

  const { data: uomData, isLoading: loadingUom } = useQuery({
    queryKey: ['uom-all'],
    queryFn: () => unitsOfMeasureApi.list({ pageSize: 200 }),
  })

  const { data: analystsData, isLoading: loadingAnalysts } = useQuery({
    queryKey: ['analysts-all'],
    queryFn: () => analystsApi.list({ pageSize: 200 }),
  })

  const { data: forwardersData, isLoading: loadingForwarders } = useQuery({
    queryKey: ['forwarders-all'],
    queryFn: () => forwardersApi.list({ pageSize: 200 }),
  })

  // ── Options ───────────────────────────────────────────────────────────────

  const proveedorOptions = useMemo<ComboboxOption[]>(
    () => proveedoresData?.items.map((p) => ({ value: p.cardCode, label: `${p.cardCode} - ${p.cardName}` })) ?? [],
    [proveedoresData],
  )

  const articuloOptions = useMemo<ComboboxOption[]>(
    () => articulosData?.items.map((a) => ({ value: a.itemCode, label: `${a.itemCode} - ${a.itemName}` })) ?? [],
    [articulosData],
  )

  const departurePortOptions = useMemo<ComboboxOption[]>(
    () => portsData?.items
      .filter((p) => p.direction === 'Loading' || p.direction === 'Both')
      .map((p) => ({ value: p.code, label: `${p.code} - ${p.name}` })) ?? [],
    [portsData],
  )

  const arrivalPortOptions = useMemo<ComboboxOption[]>(
    () => portsData?.items
      .filter((p) => p.direction === 'Discharging' || p.direction === 'Both')
      .map((p) => ({ value: p.code, label: `${p.code} - ${p.name}` })) ?? [],
    [portsData],
  )

  // ── Form ──────────────────────────────────────────────────────────────────

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardCode: '',
      cardName: '',
      companyCode: '',
      docDate: '',
      docDueDate: '',
      docCurrency: '',
      docRate: 1,
      series: 1,
      partialSupply: false,
      confirmed: false,
      comexAnalyst: null,
      incoterm: null,
      forwarderName: null,
      recipientCountryCode: null,
      departurePortCode: null,
      arrivalPortCode: null,
      cargoReadyDate: null,
      originDepartureDate: null,
      estimatedArrivalDate: null,
      warehouseArrivalDate: null,
      bookingNumber: null,
      vesselName: null,
      billOfLadingNumber: null,
      comments: null,
      reference1: null,
      numAtCard: null,
      lines: [
        {
          itemCode: '',
          itemDescription: '',
          quantity: 1,
          price: 0,
          currency: '',
          discountPercent: 0,
          warehouseCode: '',
          uomCode: null,
          containerCode: null,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  })

  const docCurrency = useWatch({ control: form.control, name: 'docCurrency' })

  // ── Mutation ──────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => comprasApi.createOrder(payload),
    onSuccess: () => {
      toast.success('Orden creada')
      navigate('/ordenes-compra')
    },
    onError: () => {
      toast.error('Error al crear orden')
    },
  })

  function onSubmit(values: FormValues) {
    const payload: CreateOrderPayload = {
      cardCode: values.cardCode,
      cardName: values.cardName,
      docDate: values.docDate,
      docDueDate: values.docDueDate,
      docCurrency: values.docCurrency,
      docRate: values.docRate,
      series: values.series,
      documentStatus: 'bost_Open',
      partialSupply: values.partialSupply,
      confirmed: values.confirmed,
      comments: values.comments,
      reference1: values.reference1,
      numAtCard: values.numAtCard,
      incoterm: values.incoterm,
      comexAnalyst: values.comexAnalyst,
      forwarderName: values.forwarderName,
      departurePortCode: values.departurePortCode,
      arrivalPortCode: values.arrivalPortCode,
      recipientCountryCode: values.recipientCountryCode,
      cargoReadyDate: values.cargoReadyDate,
      originDepartureDate: values.originDepartureDate,
      estimatedArrivalDate: values.estimatedArrivalDate,
      warehouseArrivalDate: values.warehouseArrivalDate,
      bookingNumber: values.bookingNumber,
      vesselName: values.vesselName,
      billOfLadingNumber: values.billOfLadingNumber,
      lines: values.lines.map((line, idx) => ({
        lineNum: idx + 1,
        itemCode: line.itemCode,
        itemDescription: line.itemDescription,
        quantity: line.quantity,
        price: line.price,
        currency: line.currency || values.docCurrency,
        discountPercent: line.discountPercent,
        warehouseCode: line.warehouseCode,
        lineStatus: 'bost_Open' as const,
        uomCode: line.uomCode,
        containerCode: line.containerCode,
      })),
    }
    mutation.mutate(payload)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="pb-24">
        <div className="space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold">Nueva Orden de Compra</h1>
            <p className="text-sm text-muted-foreground">Complete los campos requeridos (*)</p>
          </div>

          {/* ── Section 1: Datos Generales ── */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Row 1: Proveedor + Empresa */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cardCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={proveedorOptions}
                          value={field.value}
                          onChange={(val) => {
                            field.onChange(val)
                            const prov = proveedoresData?.items.find(
                              (p) => p.cardCode === val
                            )
                            if (prov) {
                              form.setValue('cardName', prov.cardName)
                            }
                          }}
                          placeholder={loadingProveedores ? 'Cargando...' : 'Seleccionar proveedor...'}
                          disabled={loadingProveedores}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select
                        disabled={loadingCompanies}
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={loadingCompanies ? 'Cargando...' : 'Seleccionar empresa...'}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companiesData?.items.map((c) => (
                            <SelectItem key={c.id} value={c.code}>
                              {c.code} - {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Fecha OC + Fecha Vencimiento */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="docDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha OC *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="docDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Vencimiento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Moneda + Tipo de Cambio + Series */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="docCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda *</FormLabel>
                      <Select
                        disabled={loadingCurrencies}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={loadingCurrencies ? 'Cargando...' : 'Seleccionar moneda...'}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currenciesData?.items.map((c) => (
                            <SelectItem key={c.id} value={c.code}>
                              {c.code} - {c.name} ({c.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="docRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cambio *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="series"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Series *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 4: Switches */}
              <div className="flex flex-wrap gap-6">
                <FormField
                  control={form.control}
                  name="partialSupply"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          id="partialSupply"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-input"
                        />
                      </FormControl>
                      <FormLabel htmlFor="partialSupply" className="!mt-0 cursor-pointer">
                        Suministro parcial
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmed"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          id="confirmed"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-input"
                        />
                      </FormControl>
                      <FormLabel htmlFor="confirmed" className="!mt-0 cursor-pointer">
                        Confirmado
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Section 2: Logística COMEX ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Logística COMEX</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setComexOpen((v) => !v)}
                >
                  {comexOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="ml-1 text-xs">{comexOpen ? 'Colapsar' : 'Expandir'}</span>
                </Button>
              </div>
            </CardHeader>

            {comexOpen && (
              <CardContent className="space-y-4">

                {/* Row 1: Analista + Incoterm */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="comexAnalyst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Analista COMEX</FormLabel>
                        <Select
                          disabled={loadingAnalysts}
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v || null)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={loadingAnalysts ? 'Cargando...' : 'Seleccionar analista...'}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {analystsData?.items.map((a) => (
                              <SelectItem key={a.id} value={a.code}>
                                {a.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incoterm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterm</FormLabel>
                        <Select
                          disabled={loadingIncoterms}
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v || null)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={loadingIncoterms ? 'Cargando...' : 'Seleccionar incoterm...'}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {incotermsData?.items.map((i) => (
                              <SelectItem key={i.id} value={i.code}>
                                {i.code} - {i.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Forwarder + País Destino */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="forwarderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forwarder</FormLabel>
                        <Select
                          disabled={loadingForwarders}
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v || null)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={loadingForwarders ? 'Cargando...' : 'Seleccionar forwarder...'}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {forwardersData?.items.map((f) => (
                              <SelectItem key={f.id} value={f.code}>
                                {f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recipientCountryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País Destino</FormLabel>
                        <Select
                          disabled={loadingCountries}
                          value={field.value ?? ''}
                          onValueChange={(v) => field.onChange(v || null)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={loadingCountries ? 'Cargando...' : 'Seleccionar país...'}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countriesData?.items.map((c) => (
                              <SelectItem key={c.id} value={c.code}>
                                {c.code} - {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 3: Puerto Origen + Puerto Destino */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="departurePortCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Puerto Origen</FormLabel>
                        <FormControl>
                          <Combobox
                            options={departurePortOptions}
                            value={field.value ?? ''}
                            onChange={(v) => field.onChange(v || null)}
                            placeholder={loadingPorts ? 'Cargando...' : 'Seleccionar puerto...'}
                            disabled={loadingPorts}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="arrivalPortCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Puerto Destino</FormLabel>
                        <FormControl>
                          <Combobox
                            options={arrivalPortOptions}
                            value={field.value ?? ''}
                            onChange={(v) => field.onChange(v || null)}
                            placeholder={loadingPorts ? 'Cargando...' : 'Seleccionar puerto...'}
                            disabled={loadingPorts}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 4: Fechas */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="cargoReadyDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Cargo Listo</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="originDepartureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Embarque Estimado</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedArrivalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Arribo Estimado</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warehouseArrivalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Arribo Bodega</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 5: Booking + Nave + BL */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="bookingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número Booking</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vesselName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Nave</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billOfLadingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número BL</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* ── Section 3: Líneas ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Líneas</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      itemCode: '',
                      itemDescription: '',
                      quantity: 1,
                      price: 0,
                      currency: docCurrency,
                      discountPercent: 0,
                      warehouseCode: '',
                      uomCode: null,
                      containerCode: null,
                    })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Agregar Línea
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.formState.errors.lines?.root && (
                <p className="mb-2 text-sm text-destructive">
                  {form.formState.errors.lines.root.message}
                </p>
              )}
              {form.formState.errors.lines?.message && (
                <p className="mb-2 text-sm text-destructive">
                  {form.formState.errors.lines.message}
                </p>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead className="min-w-[200px]">Artículo *</TableHead>
                      <TableHead className="min-w-[160px]">Descripción *</TableHead>
                      <TableHead className="w-20">Cant *</TableHead>
                      <TableHead className="w-24">Precio *</TableHead>
                      <TableHead className="w-24">Moneda *</TableHead>
                      <TableHead className="w-16">Desc%</TableHead>
                      <TableHead className="min-w-[140px]">Bodega *</TableHead>
                      <TableHead className="w-24">UOM</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, idx) => (
                      <TableRow key={field.id}>
                        {/* # */}
                        <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>

                        {/* Artículo */}
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${idx}.itemCode`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormControl>
                                  <Combobox
                                    options={articuloOptions}
                                    value={f.value}
                                    onChange={(val) => {
                                      f.onChange(val)
                                      const art = articulosData?.items.find(
                                        (a) => a.itemCode === val
                                      )
                                      if (art) {
                                        form.setValue(
                                          `lines.${idx}.itemDescription`,
                                          art.itemName
                                        )
                                        form.setValue(
                                          `lines.${idx}.uomCode`,
                                          art.unitOfMeasure ?? null
                                        )
                                      }
                                    }}
                                    placeholder={loadingArticulos ? 'Cargando...' : 'Artículo...'}
                                    disabled={loadingArticulos}
                                    className="h-8 text-xs"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        {/* Descripción */}
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${idx}.itemDescription`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    className="h-8 text-xs"
                                    {...f}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        {/* Cantidad */}
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${idx}.quantity`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    className="h-8 text-xs"
                                    {...f}
                                    onChange={(e) => f.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        {/* Precio */}
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${idx}.price`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="h-8 text-xs"
                                    {...f}
                                    onChange={(e) => f.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        {/* Moneda */}
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${idx}.currency`}
                            render={({ field: f }) => (
                              <FormItem>
                                <Select
                                  disabled={loadingCurrencies}
                                  value={f.value || docCurrency}
                                  onValueChange={f.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Moneda..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {currenciesData?.items.map((c) => (
                                      <SelectItem key={c.id} value={c.code}>
                                        {c.code}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        {/* Descuento % */}
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${idx}.discountPercent`}
                            render={({ field: f }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className="h-8 text-xs"
                                    {...f}
                                    onChange={(e) => f.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        {/* Bodega */}
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${idx}.warehouseCode`}
                            render={({ field: f }) => (
                              <FormItem>
                                <Select
                                  disabled={loadingWarehouses}
                                  value={f.value}
                                  onValueChange={f.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue
                                        placeholder={
                                          loadingWarehouses ? 'Cargando...' : 'Bodega...'
                                        }
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {warehousesData?.items.map((w) => (
                                      <SelectItem key={w.id} value={w.whsCode}>
                                        {w.whsCode} - {w.whsName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        {/* UOM */}
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`lines.${idx}.uomCode`}
                            render={({ field: f }) => (
                              <FormItem>
                                <Select
                                  disabled={loadingUom}
                                  value={f.value ?? ''}
                                  onValueChange={(v) => f.onChange(v || null)}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue
                                        placeholder={loadingUom ? 'Cargando...' : 'UOM...'}
                                      />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {uomData?.items.map((u) => (
                                      <SelectItem key={u.id} value={u.code}>
                                        {u.code}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>

                        {/* Remove */}
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={fields.length === 1}
                            onClick={() => remove(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Hidden field to suppress unused warning */}
              <input type="hidden" value={containerTypesData?.items.length ?? 0} />
            </CardContent>
          </Card>

          {/* ── Section 4: Observaciones ── */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentarios</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Comentarios adicionales..."
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="reference1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Referencia..."
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numAtCard"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Num Doc Proveedor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Número de documento del proveedor..."
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Sticky bottom bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background px-6 py-3 shadow-md">
          <div className="mx-auto flex max-w-screen-xl items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/ordenes-compra')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar Borrador'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
