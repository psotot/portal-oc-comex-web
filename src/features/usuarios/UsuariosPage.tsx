import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, ShieldCheck, Trash2, UserCheck, UserX, X } from 'lucide-react'
import { toast } from 'sonner'
import { usuariosApi, type Usuario, type AccesoPerfil } from '@/api/usuarios'
import { rolesApi } from '@/api/roles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

const NIVELES = [
  { value: 'global', label: 'Global' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'regional', label: 'Regional' },
]

const createSchema = z.object({
  email: z.string().email('Email inválido'),
  nombreCompleto: z.string().min(1, 'Requerido').max(200),
})

const editSchema = z.object({
  nombreCompleto: z.string().min(1, 'Requerido').max(200),
})

const rolSchema = z.object({
  rolId: z.string().min(1, 'Selecciona un rol'),
  nivel: z.string().min(1, 'Selecciona un nivel'),
})

const empresaSchema = z.object({
  empresaId: z.string().uuid('Debe ser un UUID válido'),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>
type RolForm = z.infer<typeof rolSchema>
type EmpresaForm = z.infer<typeof empresaSchema>

export function UsuariosPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Usuario | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null)
  const [accesoTarget, setAccesoTarget] = useState<Usuario | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosApi.list({ pageSize: 200 }),
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list({ pageSize: 200 }),
  })

  const { data: acceso, isLoading: isLoadingAcceso } = useQuery({
    queryKey: ['usuarios', accesoTarget?.id, 'acceso'],
    queryFn: () => usuariosApi.getAcceso(accesoTarget!.id),
    enabled: !!accesoTarget,
  })

  const rolesMap = Object.fromEntries((roles?.items ?? []).map(r => [r.id, r.nombre]))

  const invalidateUsuarios = () => qc.invalidateQueries({ queryKey: ['usuarios'] })
  const invalidateAcceso = () =>
    qc.invalidateQueries({ queryKey: ['usuarios', accesoTarget?.id, 'acceso'] })

  const createMutation = useMutation({
    mutationFn: (v: CreateForm) => usuariosApi.create(v),
    onSuccess: () => { invalidateUsuarios(); setCreateOpen(false); toast.success('Usuario creado') },
    onError: () => toast.error('Error al crear usuario'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, v, version }: { id: string; v: EditForm; version: number }) =>
      usuariosApi.update(id, { nombreCompleto: v.nombreCompleto, version }),
    onSuccess: () => { invalidateUsuarios(); setEditTarget(null); toast.success('Usuario actualizado') },
    onError: () => toast.error('Error al actualizar usuario'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usuariosApi.delete(id),
    onSuccess: () => { invalidateUsuarios(); setDeleteTarget(null); toast.success('Usuario eliminado') },
    onError: () => toast.error('Error al eliminar usuario'),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => usuariosApi.activate(id),
    onSuccess: () => { invalidateUsuarios(); toast.success('Estado actualizado') },
    onError: () => toast.error('Error al actualizar estado'),
  })

  const assignRolMutation = useMutation({
    mutationFn: (v: RolForm) => usuariosApi.assignRol(accesoTarget!.id, v),
    onSuccess: () => { invalidateAcceso(); rolForm.reset(); toast.success('Rol asignado') },
    onError: () => toast.error('Error al asignar rol'),
  })

  const removeRolMutation = useMutation({
    mutationFn: (asignacionId: string) => usuariosApi.removeRol(accesoTarget!.id, asignacionId),
    onSuccess: () => { invalidateAcceso(); toast.success('Rol removido') },
    onError: () => toast.error('Error al remover rol'),
  })

  const assignEmpresaMutation = useMutation({
    mutationFn: (v: EmpresaForm) => usuariosApi.assignEmpresa(accesoTarget!.id, v.empresaId),
    onSuccess: () => { invalidateAcceso(); empresaForm.reset(); toast.success('Empresa asignada') },
    onError: () => toast.error('Error al asignar empresa'),
  })

  const removeEmpresaMutation = useMutation({
    mutationFn: (empresaId: string) => usuariosApi.removeEmpresa(accesoTarget!.id, empresaId),
    onSuccess: () => { invalidateAcceso(); toast.success('Empresa removida') },
    onError: () => toast.error('Error al remover empresa'),
  })

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema), defaultValues: { email: '', nombreCompleto: '' } })
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) })
  const rolForm = useForm<RolForm>({ resolver: zodResolver(rolSchema), defaultValues: { rolId: '', nivel: '' } })
  const empresaForm = useForm<EmpresaForm>({ resolver: zodResolver(empresaSchema), defaultValues: { empresaId: '' } })

  const openEdit = (u: Usuario) => {
    setEditTarget(u)
    editForm.reset({ nombreCompleto: u.nombreCompleto })
  }

  const filtered = (data?.items ?? []).filter(u =>
    `${u.email} ${u.nombreCompleto}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">{data ? `${data.total} registros` : ' '}</p>
        </div>
        <Button onClick={() => { createForm.reset(); setCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />Nuevo
        </Button>
      </div>

      <Input
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-40" />
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
              : filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nombreCompleto}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.active ? 'default' : 'secondary'}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" title="Acceso" onClick={() => setAccesoTarget(u)}>
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={u.active ? 'Desactivar' : 'Activar'}
                          onClick={() => activateMutation.mutate(u.id)}
                          disabled={activateMutation.isPending}
                        >
                          {u.active
                            ? <UserX className="h-4 w-4 text-destructive" />
                            : <UserCheck className="h-4 w-4 text-green-600" />
                          }
                        </Button>
                        <Button variant="ghost" size="icon" title="Eliminar" onClick={() => setDeleteTarget(u)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No hay usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nuevo usuario</DialogTitle></DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(v => createMutation.mutate(v))} className="space-y-4">
              <FormField control={createForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="usuario@empresa.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={createForm.control} name="nombreCompleto" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(v =>
                editTarget && updateMutation.mutate({ id: editTarget.id, v, version: editTarget.version })
              )}
              className="space-y-4"
            >
              <FormField control={editForm.control} name="nombreCompleto" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Eliminar usuario</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Confirmas eliminar a <strong>{deleteTarget?.nombreCompleto}</strong>? Esta acción no se puede deshacer.
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

      {/* Acceso */}
      <Dialog open={!!accesoTarget} onOpenChange={open => !open && setAccesoTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Acceso — {accesoTarget?.nombreCompleto}</DialogTitle>
          </DialogHeader>

          {isLoadingAcceso ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : (
            <AccesoPanel
              acceso={acceso}
              rolesMap={rolesMap}
              rolesDisponibles={roles?.items ?? []}
              rolForm={rolForm}
              empresaForm={empresaForm}
              onAssignRol={v => assignRolMutation.mutate(v)}
              onRemoveRol={id => removeRolMutation.mutate(id)}
              onAssignEmpresa={v => assignEmpresaMutation.mutate(v)}
              onRemoveEmpresa={id => removeEmpresaMutation.mutate(id)}
              isAssigningRol={assignRolMutation.isPending}
              isAssigningEmpresa={assignEmpresaMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AccesoPanel({
  acceso,
  rolesMap,
  rolesDisponibles,
  rolForm,
  empresaForm,
  onAssignRol,
  onRemoveRol,
  onAssignEmpresa,
  onRemoveEmpresa,
  isAssigningRol,
  isAssigningEmpresa,
}: {
  acceso: AccesoPerfil | undefined
  rolesMap: Record<string, string>
  rolesDisponibles: { id: string; nombre: string }[]
  rolForm: ReturnType<typeof useForm<RolForm>>
  empresaForm: ReturnType<typeof useForm<EmpresaForm>>
  onAssignRol: (v: RolForm) => void
  onRemoveRol: (id: string) => void
  onAssignEmpresa: (v: EmpresaForm) => void
  onRemoveEmpresa: (id: string) => void
  isAssigningRol: boolean
  isAssigningEmpresa: boolean
}) {
  return (
    <div className="space-y-5">
      {/* Roles */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Roles asignados</h3>
        {(acceso?.roles ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin roles asignados.</p>
        ) : (
          <div className="rounded-md border divide-y">
            {(acceso?.roles ?? []).map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <span className="text-sm font-medium">{rolesMap[r.rolId] ?? r.rolId}</span>
                  <Badge variant="outline" className="ml-2 text-xs">{r.nivel}</Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onRemoveRol(r.id)}>
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Form {...rolForm}>
          <form onSubmit={rolForm.handleSubmit(onAssignRol)} className="flex gap-2">
            <FormField control={rolForm.control} name="rolId" render={({ field }) => (
              <FormItem className="flex-1">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Seleccionar rol..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rolesDisponibles.filter(r => r.active ?? true).map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={rolForm.control} name="nivel" render={({ field }) => (
              <FormItem className="w-32">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Nivel..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NIVELES.map(n => (
                      <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" size="sm" className="h-8" disabled={isAssigningRol}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        </Form>
      </div>

      <Separator />

      {/* Empresas */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Empresas asignadas</h3>
        {(acceso?.empresaIds ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin empresas asignadas.</p>
        ) : (
          <div className="rounded-md border divide-y">
            {(acceso?.empresaIds ?? []).map(id => (
              <div key={id} className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-mono text-muted-foreground">{id}</span>
                <Button variant="ghost" size="icon" onClick={() => onRemoveEmpresa(id)}>
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Form {...empresaForm}>
          <form onSubmit={empresaForm.handleSubmit(onAssignEmpresa)} className="flex gap-2">
            <FormField control={empresaForm.control} name="empresaId" render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input className="h-8 text-sm font-mono" placeholder="UUID de empresa..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" size="sm" className="h-8" disabled={isAssigningEmpresa}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
