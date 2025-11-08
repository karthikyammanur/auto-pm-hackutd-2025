import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart, Users } from "lucide-react"

const stats = [
  {
    title: "Total Revenue",
    value: "$45,231",
    change: "+20.1%",
    trending: "up",
    icon: DollarSign,
  },
  {
    title: "Products",
    value: "1,243",
    change: "+12.5%",
    trending: "up",
    icon: Package,
  },
  {
    title: "Orders",
    value: "342",
    change: "-5.4%",
    trending: "down",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    value: "8,429",
    change: "+8.2%",
    trending: "up",
    icon: Users,
  },
]

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = stat.trending === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <TrendIcon className={`h-4 w-4 ${stat.trending === "up" ? "text-green-500" : "text-red-500"}`} />
                <span className={`text-sm font-medium ${stat.trending === "up" ? "text-green-500" : "text-red-500"}`}>
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
