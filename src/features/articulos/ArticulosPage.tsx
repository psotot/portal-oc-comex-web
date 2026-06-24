import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { articulosApi, type Articulo } from '@/api/articulos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ITEM_TYPES = [
  { value: 'Inventariado', label: 'Inventariado' },
  { value: 'NoInventariado', label: 'No inventariado' },
  { value: 'Servicio', label: 'Servicio' },
]

const schema = z.object({
  itemCode: z.string().min(1, 'Requerido'),
  itemName: z.string().min(1, 'Requerido'),
  itemType: z.string().min(1, 'Requerido'),
  unitOfMeasure: z.string().default(''),
  active: z.boolean().default(true),
})

type ArticuloForm = z.infer<typeof schema>

const DEFAULTS: ArticuloForm = {
  itemCode: '', itemName: '', itemType: 'Inventariado', unitOfMeasure: '', active: true,
}

export function ArticulosPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Articulo | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Articulo | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['articulos'],
    queryFn: () => articulosApi.list({ pageSize: 200 }),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['articulos'] })

  const createMutation = useMutation({
    mutationFn: articulosApi.create,
    onSuccess: () => { invalidate(); setDialogOpen(false); toast.success('Artículo creado') },
    onError: () => toast.error('Error al crear artículo'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ArticuloForm }) =>
      articulosApi.update(id, data),
    onSuccess: () => { invalidate(); setDialogOpen(false); toast.success('Artículo actualizado') },
    onError: () => toast.error('Error al actualizar artículo'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => articulosApi.delete(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); toast.success('Artículo eliminado') },
    onError: () => toast.error('Error al eliminar artículo'),
  })

  const form = useForm<ArticuloForm>({ resolver: zodResolver(schema), defaultValues: DEFAULTS })

  const openCreate = () => {
    setEditTarget(null)
    form.reset(DEFAULTS)
    setDialogOpen(true)
  }

  const openEdit = (a: Articulo) => {
    setEditTarget(a)
    form.reset(a)
    setDialogOpen(true)
  }

  const onSubmit = (values: ArticuloForm) => {
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data: values })
    else createMutation.mutate(values)
  }

  const filtered = (data?.items ?? []).filter(a =>
    `${a.itemCode} ${a.itemName}`.toLowerCase().includes(search.toLowerCase())
  )

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Artículos</h1>
          <p className="text-sm text-muted-foreground">{data ? `${data.total} registros` : ' '}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Nuevo
        </Button>
      </div>

      <Input
        placeholder="Buscar por código o nombre..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Unidad de medida</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-sm">{a.itemCode}</TableCell>
                    <TableCell className="font-medium">{a.itemName}</TableCell>
                    <TableCell>
                      {ITEM_TYPES.find(t => t.value === a.itemType)?.label ?? a.itemType}
                    </TableCell>
                    <TableCell>{a.unitOfMeasure}</TableCell>
                    <TableCell>
                      <Badge variant={a.active ? 'default' : 'secondary'}>
                        {a.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(a)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hay artículos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Editar artículo' : 'Nuevo artículo'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="itemCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unitOfMeasure" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de medida</FormLabel>
                    <FormControl><Input placeholder="UND, KG, M2..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="itemName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="itemType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {ITEM_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="active" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={v => field.onChange(v === 'true')} value={String(field.value)}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="true">Activo</SelectItem>
                        <SelectItem value="false">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar artículo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Confirmas eliminar <strong>{deleteTarget?.itemName}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
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
