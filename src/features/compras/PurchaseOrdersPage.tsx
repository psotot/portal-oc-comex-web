import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { comprasApi } from '@/api/compras'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  Draft: { label: 'Borrador', variant: 'secondary' },
  bost_Open: { label: 'Abierta', variant: 'default' },
  PendingApproval: { label: 'Pendiente', variant: 'outline' },
  Approved: { label: 'Aprobado', variant: 'default' },
  Rejected: { label: 'Rechazado', variant: 'destructive' },
}

export function PurchaseOrdersPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => comprasApi.listOrders({ page: 1, pageSize: 50 }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Órdenes de Compra</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} órdenes en total` : ' '}
          </p>
        </div>
        <Button onClick={() => navigate('/ordenes-compra/nueva')}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Orden
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.items.map((order) => {
                  const status = statusLabels[order.documentStatus] ?? {
                    label: order.documentStatus,
                    variant: 'secondary' as const,
                  }
                  return (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/ordenes-compra/${order.id}`)}
                    >
                      <TableCell className="font-mono text-sm text-muted-foreground">{order.cardCode}</TableCell>
                      <TableCell className="font-medium">{order.cardName}</TableCell>
                      <TableCell>{new Date(order.docDate).toLocaleDateString('es-CL')}</TableCell>
                      <TableCell>{order.docCurrency}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No hay órdenes de compra aún.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
