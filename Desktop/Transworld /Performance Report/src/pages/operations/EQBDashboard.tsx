import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EQB_ORDERS, BRANCHES, PROFILES } from '@/lib/mockData'
import { formatCurrency } from '@/lib/kpiEngine'
import { cn } from '@/lib/utils'
import { ShoppingCart, TrendingUp, DollarSign, MapPin, CheckCircle2, XCircle } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  confirmed:  'bg-emerald-100 text-emerald-700',
  generated:  'bg-blue-100 text-blue-700',
  cancelled:  'bg-red-100 text-red-700',
}

export function EQBDashboard() {
  const orders = EQB_ORDERS

  const confirmedOrders  = orders.filter((o) => o.status === 'confirmed')
  const generatedOrders  = orders.filter((o) => o.status === 'generated')
  const cancelledOrders  = orders.filter((o) => o.status === 'cancelled')
  const totalValue       = confirmedOrders.reduce((s, o) => s + o.order_value, 0)
  const pipelineValue    = generatedOrders.reduce((s, o) => s + o.order_value, 0)
  const avgOrderValue    = orders.length > 0 ? Math.round(totalValue / confirmedOrders.length) : 0

  // Branch contribution
  const branchStats = BRANCHES.map((branch) => {
    const branchOrders    = orders.filter((o) => o.branch_id === branch.id && o.status !== 'cancelled')
    const confirmedHere   = branchOrders.filter((o) => o.status === 'confirmed')
    const value           = confirmedHere.reduce((s, o) => s + o.order_value, 0)
    return {
      branch,
      orderCount:    branchOrders.length,
      confirmedCount:confirmedHere.length,
      value,
    }
  }).filter((b) => b.orderCount > 0).sort((a, b) => b.value - a.value)

  const maxValue = branchStats[0]?.value ?? 1

  // Recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold text-slate-900">EQB Dashboard</h1>
        <p className="mt-0.5 text-xs text-slate-500">Pan India order tracking — value and branch contribution</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Total Orders"        value={orders.length}                      icon={ShoppingCart} iconColor="text-blue-600" />
        <KPICard title="Confirmed Revenue"   value={formatCurrency(totalValue, 'INR')}  icon={DollarSign}   iconColor="text-emerald-600" />
        <KPICard title="Pipeline Value"      value={formatCurrency(pipelineValue, 'INR')} icon={TrendingUp}  iconColor="text-amber-600" />
        <KPICard title="Avg Order Value"     value={formatCurrency(avgOrderValue, 'INR')} icon={CheckCircle2} iconColor="text-brand-600" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Confirmed</p>
            <p className="text-xl font-bold text-emerald-700">{confirmedOrders.length}</p>
          </div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
          <ShoppingCart size={20} className="text-blue-600 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Generated (Pending)</p>
            <p className="text-xl font-bold text-blue-700">{generatedOrders.length}</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <XCircle size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Cancelled</p>
            <p className="text-xl font-bold text-red-600">{cancelledOrders.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Branch contribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-brand-600" />
              <CardTitle>Branch Contribution</CardTitle>
            </div>
            <span className="text-xs text-slate-400">{orders.filter((o) => o.status !== 'cancelled').length} active orders</span>
          </CardHeader>
          <div className="space-y-3">
            {branchStats.map(({ branch, orderCount, confirmedCount, value }, i) => {
              const pct = Math.round((value / maxValue) * 100)
              return (
                <div key={branch.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-slate-100 text-slate-600' :
                        'bg-white border border-slate-200 text-slate-400',
                      )}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{branch.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">{formatCurrency(value, 'INR')}</span>
                      <p className="text-[10px] text-slate-400">{confirmedCount}/{orderCount} confirmed</p>
                    </div>
                  </div>
                  <ProgressBar value={pct} size="sm" />
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent orders */}
        <Card padding={false}>
          <div className="border-b border-slate-100 p-4">
            <CardTitle>Recent Orders</CardTitle>
          </div>
          <div className="divide-y divide-slate-50">
            {recentOrders.map((order) => {
              const branch = BRANCHES.find((b) => b.id === order.branch_id)
              const emp    = PROFILES.find((p) => p.id === order.employee_id)
              return (
                <div key={order.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/60">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{order.customer_name}</p>
                    <p className="text-[10px] text-slate-400">{branch?.city} · {emp?.full_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(order.order_value, 'INR')}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', STATUS_STYLES[order.status])}>
                      {order.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
