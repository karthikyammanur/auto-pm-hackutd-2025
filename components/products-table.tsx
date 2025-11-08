import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    category: "Electronics",
    price: "$99.99",
    stock: 156,
    status: "In Stock",
  },
  {
    id: 2,
    name: "Running Shoes",
    category: "Sports",
    price: "$79.99",
    stock: 23,
    status: "Low Stock",
  },
  {
    id: 3,
    name: "Coffee Maker",
    category: "Home & Garden",
    price: "$129.99",
    stock: 0,
    status: "Out of Stock",
  },
  {
    id: 4,
    name: "Yoga Mat",
    category: "Sports",
    price: "$29.99",
    stock: 89,
    status: "In Stock",
  },
  {
    id: 5,
    name: "Desk Lamp",
    category: "Home & Garden",
    price: "$39.99",
    stock: 45,
    status: "In Stock",
  },
]

export function ProductsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>Manage your product inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Stock</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b last:border-0">
                  <td className="py-4 px-4 font-medium">{product.name}</td>
                  <td className="py-4 px-4 text-muted-foreground">{product.category}</td>
                  <td className="py-4 px-4">{product.price}</td>
                  <td className="py-4 px-4">{product.stock}</td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        product.status === "In Stock"
                          ? "default"
                          : product.status === "Low Stock"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {product.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
