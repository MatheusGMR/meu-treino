import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarketingMetrics } from "@/hooks/useMarketingMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Eye, MousePointerClick, ClipboardCheck, CreditCard,
  FileText, ArrowDown, TrendingDown, Phone
} from "lucide-react";

const stepIcons: Record<string, React.ElementType> = {
  "page_view": Eye,
  "cta_click": MousePointerClick,
  "eligibility_start": ClipboardCheck,
  "eligibility_complete": ClipboardCheck,
  "checkout_start": CreditCard,
  "checkout_complete": CreditCard,
  "anamnesis_start": FileText,
  "anamnesis_complete": FileText,
};

const Marketing = () => {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  const { data: metrics, isLoading } = useMarketingMetrics({
    from: `${dateFrom}T00:00:00`,
    to: `${dateTo}T23:59:59`,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Marketing & Funil de Vendas</h1>

        {/* Date Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">De:</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Até:</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {/* Funnel Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {metrics?.funnel.map((step, i) => {
                  const Icon = stepIcons[step.eventType] || Eye;
                  const maxCount = metrics.funnel[0]?.count || 1;
                  const width = Math.max((step.count / maxCount) * 100, 5);
                  const prevCount = i > 0 ? metrics.funnel[i - 1].count : step.count;
                  const convRate = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : "—";

                  return (
                    <div key={step.eventType} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{step.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">{step.count}</span>
                          {i > 0 && (
                            <Badge variant={parseFloat(convRate) > 50 ? "default" : "secondary"} className="text-xs">
                              {convRate}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="h-8 bg-muted rounded-md overflow-hidden">
                        <div
                          className="h-full bg-primary/80 rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${width}%` }}
                        >
                          {step.count > 0 && (
                            <span className="text-xs text-primary-foreground font-medium">
                              {step.count}
                            </span>
                          )}
                        </div>
                      </div>
                      {i < metrics.funnel.length - 1 && (
                        <div className="flex justify-center">
                          <ArrowDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {metrics && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa LP → Elegibilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.funnel[0].count > 0
                    ? ((metrics.funnel[3].count / metrics.funnel[0].count) * 100).toFixed(1)
                    : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa Checkout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.funnel[4].count > 0
                    ? ((metrics.funnel[5].count / metrics.funnel[4].count) * 100).toFixed(1)
                    : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taxa Anamnese</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.funnel[6].count > 0
                    ? ((metrics.funnel[7].count / metrics.funnel[6].count) * 100).toFixed(1)
                    : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Conversões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.funnel[7].count}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Leads Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>VS Gold</TableHead>
                      <TableHead>Dores</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics?.recentLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          Nenhum lead registrado no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      metrics?.recentLeads.map((lead) => {
                        const pains = [
                          lead.pain_shoulder && "Ombro",
                          lead.pain_lower_back && "Lombar",
                          lead.pain_knee && "Joelho",
                        ].filter(Boolean);

                        return (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.full_name}</TableCell>
                            <TableCell>{lead.age}</TableCell>
                            <TableCell>{lead.phone}</TableCell>
                            <TableCell>{lead.gender}</TableCell>
                            <TableCell>
                              <Badge variant={lead.is_vs_gold ? "default" : "secondary"}>
                                {lead.is_vs_gold ? "Sim" : "Não"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {pains.length > 0 ? (
                                <div className="flex gap-1 flex-wrap">
                                  {pains.map((p) => (
                                    <Badge key={p} variant="outline" className="text-xs">
                                      {p}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">Nenhuma</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={lead.payment_status === "paid" ? "default" : "secondary"}
                              >
                                {lead.payment_status === "paid" ? "Pago" : "Pendente"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Marketing;
