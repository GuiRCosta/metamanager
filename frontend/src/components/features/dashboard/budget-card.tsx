import { Wallet, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface BudgetCardProps {
  spent: number
  limit: number
  projected: number
}

export function BudgetCard({ spent, limit, projected }: BudgetCardProps) {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0
  const projectedPercentage = limit > 0 ? (projected / limit) * 100 : 0

  const getStatusColor = () => {
    if (percentage >= 100) return "destructive"
    if (percentage >= 80) return "warning"
    return "default"
  }

  const status = getStatusColor()
  const isOverBudget = projected > limit

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Orçamento Mensal</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                R$ {spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-muted-foreground">
                de R$ {limit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Progress
              value={Math.min(percentage, 100)}
              className={cn(
                "mt-2 h-2",
                status === "destructive" && "[&>div]:bg-destructive",
                status === "warning" && "[&>div]:bg-yellow-500"
              )}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {percentage.toFixed(1)}% utilizado
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Projeção Mensal</span>
              {isOverBudget && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span
                className={cn(
                  "text-lg font-semibold",
                  isOverBudget && "text-yellow-500"
                )}
              >
                R$ {projected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={cn(
                  "text-xs",
                  isOverBudget ? "text-yellow-500" : "text-muted-foreground"
                )}
              >
                {projectedPercentage.toFixed(0)}% do limite
              </span>
            </div>
            {isOverBudget && (
              <p className="mt-2 text-xs text-yellow-500">
                Atenção: Projeção acima do limite mensal
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
