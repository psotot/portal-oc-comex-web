import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ─── Public types ─────────────────────────────────────────────────────────────

export type FieldType = 'text' | 'number' | 'select'

export interface FieldDef {
  key: string
  label: string
  type?: FieldType
  required?: boolean      // default true
  nullable?: boolean      // for optional number fields (null allowed)
  mono?: boolean          // font-mono in table
  inTable?: boolean       // default true
  inCreate?: boolean      // default true
  inEdit?: boolean        // default true; set false for immutable code fields
  placeholder?: string
  options?: Array<{ value: string; label: string }>
}

export interface MaestroApi {
  list: (params?: { page?: number; pageSize?: number }) => Promise<{ items: any[]; total: number }>
  create: (data: any) => Promise<any>
  update: (id: string, data: any) => Promise<any>
  delete: (id: string) => Promise<any>
  activate: (id: string) => Promise<any>
}

export interface MaestroConfig {
  title: string       // "Países"
  singular: string    // "país"
  queryKey: string
  api: MaestroApi
  fields: FieldDef[]
  hasActive?: boolean // default true
  nameField?: string  // which field to show in delete confirm; default: second field
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSchema(fields: FieldDef[], forEdit: boolean) {
  const shape: Record<string, z.ZodTypeAny> = {}
  const activeFields = fields.filter((f) =>
    forEdit ? f.inEdit !== false : f.inCreate !== false,
  )
  for (const f of activeFields) {
    const required = f.required !== false
    if (f.type === 'number') {
      if (f.nullable) {
        shape[f.key] = z.coerce.number().nullable().optional()
      } else {
        shape[f.key] = z.coerce.number()
      }
    } else {
      // text or select
      if (required) {
        shape[f.key] = z.string().min(1, 'Requerido')
      } else {
        shape[f.key] = z.string().optional().default('')
      }
    }
  }
  return z.object(shape)
}

function buildDefaults(fields: FieldDef[], forEdit: boolean): Record<string, any> {
  const defaults: Record<string, any> = {}
  const activeFields = fields.filter((f) =>
    forEdit ? f.inEdit !== false : f.inCreate !== false,
  )
  for (const f of activeFields) {
    if (f.type === 'number') {
      defaults[f.key] = f.nullable ? null : 0
    } else {
      defaults[f.key] = ''
    }
  }
  return defaults
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MaestroPage({ config }: { config: MaestroConfig }) {
  const {
    title,
    singular,
    queryKey,
    api,
    fields,
    hasActive = true,
    nameField,
  } = config

  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)

  // Determine the "name" field for delete dialog — default to second field
  const resolvedNameField = nameField ?? fields[1]?.key ?? fields[0]?.key

  // Table-visible fields
  const tableFields = useMemo(() => fields.filter((f) => f.inTable !== false), [fields])

  // Schema memos for create and edit
  const createSchema = useMemo(() => buildSchema(fields, false), [fields])
  const editSchema = useMemo(() => buildSchema(fields, true), [fields])
  const createDefaults = useMemo(() => buildDefaults(fields, false), [fields])
  const editDefaults = useMemo(() => buildDefaults(fields, true), [fields])

  // Single form instance; schema switches based on editTarget
  const form = useForm({
    resolver: zodResolver(editTarget ? editSchema : createSchema),
    defaultValues: createDefaults,
  })

  // ─── Queries & mutations ───────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => api.list({ pageSize: 200 }),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey] })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.create(data),
    onSuccess: () => {
      invalidate()
      setDialogOpen(false)
      toast.success('Creado')
    },
    onError: () => toast.error(`Error al crear ${singular}`),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.update(id, data),
    onSuccess: () => {
      invalidate()
      setDialogOpen(false)
      toast.success('Actualizado')
    },
    onError: () => toast.error(`Error al actualizar ${singular}`),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(id),
    onSuccess: () => {
      invalidate()
      setDeleteTarget(null)
      toast.success('Eliminado')
    },
    onError: () => toast.error(`Error al eliminar ${singular}`),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.activate(id),
    onSuccess: () => {
      invalidate()
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al cambiar estado'),
  })

  // ─── Dialog handlers ───────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null)
    form.reset(createDefaults)
    setDialogOpen(true)
  }

  const openEdit = (item: any) => {
    setEditTarget(item)
    // Pre-populate with current item values for editable fields
    const values: Record<string, any> = {}
    for (const f of fields) {
      if (f.inEdit !== false) {
        values[f.key] = item[f.key] ?? (f.type === 'number' ? (f.nullable ? null : 0) : '')
      }
    }
    form.reset(values)
    setDialogOpen(true)
  }

  const onSubmit = (values: any) => {
    if (editTarget) {
      // Include version from the current item, not from form fields
      updateMutation.mutate({
        id: editTarget.id,
        data: { ...values, version: editTarget.version },
      })
    } else {
      createMutation.mutate(values)
    }
  }

  // ─── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const items: any[] = data?.items ?? []
    if (!search.trim()) return items
    const term = search.toLowerCase()
    return items.filter((item) =>
      tableFields.some((f) => {
        const val = item[f.key]
        return typeof val === 'string' && val.toLowerCase().includes(term)
      }),
    )
  }, [data?.items, search, tableFields])

  // ─── Form fields for create/edit ───────────────────────────────────────────

  const formFields = useMemo(
    () => fields.filter((f) => editTarget ? f.inEdit !== false : f.inCreate !== false),
    [fields, editTarget],
  )

  const isSaving = createMutation.isPending || updateMutation.isPending

  // Column count for skeleton rows: tableFields + active col + actions col
  const colCount = tableFields.length + (hasActive ? 1 : 0) + 1

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} registros` : ' '}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder={`Buscar en ${title.toLowerCase()}...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {tableFields.map((f) => (
                <TableHead key={f.key}>{f.label}</TableHead>
              ))}
              {hasActive && <TableHead>Estado</TableHead>}
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: colCount }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map((item) => (
                  <TableRow key={item.id}>
                    {tableFields.map((f) => (
                      <TableCell
                        key={f.key}
                        className={f.mono ? 'font-mono text-sm' : undefined}
                      >
                        {item[f.key] ?? '—'}
                      </TableCell>
                    ))}
                    {hasActive && (
                      <TableCell>
                        <Badge variant={item.active ? 'default' : 'secondary'}>
                          {item.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {hasActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => activateMutation.mutate(item.id)}
                            disabled={activateMutation.isPending}
                            title={item.active ? 'Desactivar' : 'Activar'}
                          >
                            {item.active ? (
                              <ToggleRight className="h-4 w-4 text-primary" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay {title.toLowerCase()}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? `Editar ${singular}`
                : `Nuevo ${singular}`}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {formFields.map((f) => (
                <FormField
                  key={f.key}
                  control={form.control}
                  name={f.key}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{f.label}</FormLabel>
                      <FormControl>
                        {f.type === 'select' && f.options ? (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? ''}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={f.placeholder ?? `Seleccionar ${f.label.toLowerCase()}`}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {f.options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            {...field}
                            type={f.type === 'number' ? 'number' : 'text'}
                            placeholder={f.placeholder}
                            value={field.value ?? ''}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar {singular}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Confirmas eliminar{' '}
            <strong>{deleteTarget?.[resolvedNameField]}</strong>? Esta acción no se
            puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
