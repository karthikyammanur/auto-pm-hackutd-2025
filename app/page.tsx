import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardStats } from "@/components/dashboard-stats"
import { RevenueChart } from "@/components/revenue-chart"
import { ProductsTable } from "@/components/products-table"
import { InventoryStatus } from "@/components/inventory-status"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your inventory and track product performance</p>
          </div>
        </div>

        <DashboardStats />

        <div className="grid gap-6 md:grid-cols-2">
          <RevenueChart />
          <InventoryStatus />
        </div>

        <ProductsTable />
      </main>
    </div>
  )
}
