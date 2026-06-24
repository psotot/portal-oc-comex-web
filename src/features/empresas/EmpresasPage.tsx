import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { empresasApi, type Empresa } from '@/api/empresas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  companyCode: z.string().min(1, 'Requerido'),
  companyName: z.string().min(1, 'Requerido'),
  rut: z.string().default(''),
  active: z.boolean().default(true),
})

type EmpresaForm = z.infer<typeof schema>

const DEFAULTS: EmpresaForm = {
  companyCode: '', companyName: '', rut: '', active: true,
}

export function EmpresasPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Empresa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Empresa | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresasApi.list({ pageSize: 200 }),
    retry: false,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['empresas'] })

  const createMutation = useMutation({
    mutationFn: empresasApi.create,
    onSuccess: () => { invalidate(); setDialogOpen(false); toast.success('Empresa creada') },
    onError: () => toast.error('Error al crear empresa'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmpresaForm }) =>
      empresasApi.update(id, data),
    onSuccess: () => { invalidate(); setDialogOpen(false); toast.success('Empresa actualizada') },
    onError: () => toast.error('Error al actualizar empresa'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => empresasApi.delete(id),
    onSuccess: () => { invalidate(); setDeleteTarget(null); toast.success('Empresa eliminada') },
    onError: () => toast.error('Error al eliminar empresa'),
  })

  const form = useForm<EmpresaForm>({ resolver: zodResolver(schema), defaultValues: DEFAULTS })

  const openCreate = () => {
    setEditTarget(null)
    form.reset(DEFAULTS)
    setDialogOpen(true)
  }

  const openEdit = (e: Empresa) => {
    setEditTarget(e)
    form.reset(e)
    setDialogOpen(true)
  }

  const onSubmit = (values: EmpresaForm) => {
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data: values })
    else createMutation.mutate(values)
  }

  const filtered = (data?.items ?? []).filter(e =>
    `${e.companyCode} ${e.companyName} ${e.rut}`.toLowerCase().includes(search.toLowerCase())
  )

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Empresas</h1>
          <p className="text-sm text-muted-foreground">{data ? `${data.total} registros` : ' '}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Nueva
        </Button>
      </div>

      <Input
        placeholder="Buscar por código, nombre o RUT..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre / Razón social</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-sm">{e.companyCode}</TableCell>
                    <TableCell className="font-medium">{e.companyName}</TableCell>
                    <TableCell>{e.rut}</TableCell>
                    <TableCell>
                      <Badge variant={e.active ? 'default' : 'secondary'}>
                        {e.active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(e)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay empresas.
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
            <DialogTitle>{editTarget ? 'Editar empresa' : 'Nueva empresa'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="companyCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rut" render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUT</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="companyName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre / Razón social</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={v => field.onChange(v === 'true')} value={String(field.value)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="true">Activa</SelectItem>
                      <SelectItem value="false">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

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
            <DialogTitle>Eliminar empresa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Confirmas eliminar <strong>{deleteTarget?.companyName}</strong>? Esta acción no se puede deshacer.
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
