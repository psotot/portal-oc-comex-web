import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, RotateCcw, History, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { settingsApi, type ConfigurationParameter, type ChangeRecord } from '@/api/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const editSchema = z.object({
  value: z.string(),
})

type EditForm = z.infer<typeof editSchema>

function ValueInput({ dataType, field }: {
  dataType: ConfigurationParameter['dataType']
  field: React.InputHTMLAttributes<HTMLInputElement> & { onChange: (v: string) => void; value: string }
}) {
  if (dataType === 'Boolean') {
    return (
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="true">true</SelectItem>
          <SelectItem value="false">false</SelectItem>
        </SelectContent>
      </Select>
    )
  }
  return (
    <Input
      {...field}
      type={dataType === 'Integer' || dataType === 'Decimal' ? 'number' : 'text'}
      placeholder={dataType === 'StringList' ? 'value1,value2,...' : undefined}
    />
  )
}

function HistoryDialog({ setting, open, onClose }: {
  setting: ConfigurationParameter | null
  open: boolean
  onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['settings-history', setting?.key],
    queryFn: () => settingsApi.history(setting!.key, { pageSize: 50 }),
    enabled: open && !!setting,
  })

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Historial — <span className="font-mono text-sm">{setting?.key}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : !data?.items.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin cambios registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Anterior</TableHead>
                  <TableHead>Nuevo</TableHead>
                  <TableHead>Por</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((h: ChangeRecord) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <Badge variant={h.changeType === 'Reset' ? 'secondary' : 'default'}>
                        {h.changeType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{h.oldValue || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{h.newValue || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{h.changedBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmt(h.changedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SettingsPage() {
  const qc = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<ConfigurationParameter | null>(null)
  const [historyTarget, setHistoryTarget] = useState<ConfigurationParameter | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.list({ pageSize: 200 }),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['settings'] })

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => settingsApi.update(key, value),
    onSuccess: () => { invalidate(); setEditTarget(null); toast.success('Configuración actualizada') },
    onError: () => toast.error('Error al actualizar configuración'),
  })

  const resetMutation = useMutation({
    mutationFn: (key: string) => settingsApi.reset(key),
    onSuccess: () => { invalidate(); setEditTarget(null); toast.success('Valor restaurado al default') },
    onError: () => toast.error('Error al restaurar valor'),
  })

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  })

  const openEdit = (s: ConfigurationParameter) => {
    setEditTarget(s)
    form.reset({ value: s.value })
  }

  const onSubmit = (values: EditForm) => {
    if (!editTarget) return
    updateMutation.mutate({ key: editTarget.key, value: values.value })
  }

  const allItems = data?.items ?? []
  const categories = useMemo(
    () => [...new Set(allItems.map(s => s.category))].sort(),
    [allItems],
  )
  const activeCategory = selectedCategory ?? categories[0] ?? null
  const filtered = useMemo(
    () => activeCategory ? allItems.filter(s => s.category === activeCategory) : allItems,
    [allItems, activeCategory],
  )

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">{data ? `${data.total} parámetros` : ' '}</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-20" />)
          : categories.map(cat => (
              <Button
                key={cat}
                variant={cat === activeCategory ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
                <span className="ml-1.5 text-xs opacity-70">
                  {allItems.filter(s => s.category === cat).length}
                </span>
              </Button>
            ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Rango</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map(s => (
                  <TableRow key={s.key}>
                    <TableCell className="font-mono text-xs">{s.key.split('.').pop()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate" title={s.description}>
                      {s.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{s.dataType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {s.value === '' ? <span className="text-muted-foreground italic">vacío</span> : s.value}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.defaultValue === '' ? '—' : s.defaultValue}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.allowedMin != null || s.allowedMax != null
                        ? `${s.allowedMin ?? '∞'} – ${s.allowedMax ?? '∞'}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {s.isOverridden
                        ? <Badge variant="default">Modificado</Badge>
                        : <Badge variant="secondary">Default</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {s.updatedBy ? `${s.updatedBy.split('@')[0]}\n${fmt(s.updatedAt)}` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" title="Historial" onClick={() => setHistoryTarget(s)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No hay parámetros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar parámetro</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Clave</p>
                <p className="font-mono text-sm">{editTarget.key}</p>
              </div>
              {editTarget.description && (
                <div>
                  <p className="text-xs text-muted-foreground">Descripción</p>
                  <p className="text-sm">{editTarget.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p>{editTarget.dataType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Default</p>
                  <p className="font-mono">{editTarget.defaultValue || '—'}</p>
                </div>
                {(editTarget.allowedMin != null || editTarget.allowedMax != null) && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Rango permitido</p>
                    <p className="font-mono">{editTarget.allowedMin ?? '∞'} – {editTarget.allowedMax ?? '∞'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <ValueInput
                      dataType={editTarget?.dataType ?? 'String'}
                      field={{ ...field, onChange: field.onChange }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="gap-2">
                {editTarget?.isOverridden && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={resetMutation.isPending}
                    onClick={() => editTarget && resetMutation.mutate(editTarget.key)}
                    className="mr-auto"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restaurar default
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <HistoryDialog
        setting={historyTarget}
        open={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
      />
    </div>
  )
}
