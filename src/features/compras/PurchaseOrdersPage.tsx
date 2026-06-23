import { useQuery } from '@tanstack/react-query'
import { comprasApi } from '@/api/compras'
import { Badge } from '@/components/ui/badge'
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
  PendingApproval: { label: 'Pendiente', variant: 'outline' },
  Approved: { label: 'Aprobado', variant: 'default' },
  Rejected: { label: 'Rechazado', variant: 'destructive' },
}

export function PurchaseOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => comprasApi.listOrders({ page: 1, pageSize: 50 }),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Órdenes de Compra</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `${data.totalCount} órdenes en total` : ' '}
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
                    {Array.from({ length: 4 }).map((_, j) => (
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
                    <TableRow key={order.id}>
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
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
