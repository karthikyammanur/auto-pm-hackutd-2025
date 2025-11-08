"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const inventory = [
  { category: "Electronics", stock: 245, total: 300, percentage: 82 },
  { category: "Clothing", stock: 180, total: 250, percentage: 72 },
  { category: "Home & Garden", stock: 150, total: 200, percentage: 75 },
  { category: "Sports", stock: 90, total: 150, percentage: 60 },
  { category: "Books", stock: 120, total: 150, percentage: 80 },
]

export function InventoryStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Status</CardTitle>
        <CardDescription>Current stock levels by category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {inventory.map((item) => (
          <div key={item.category} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.category}</span>
              <span className="text-muted-foreground">
                {item.stock}/{item.total}
              </span>
            </div>
            <Progress value={item.percentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
