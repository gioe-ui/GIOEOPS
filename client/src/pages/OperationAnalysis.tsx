import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function OperationAnalysis() {
  const [selectedNeop, setSelectedNeop] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Get all evaluations
  const { data: evaluations = [] } = trpc.evaluations.list.useQuery({
    limit: 1000,
    offset: 0,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const byNeop: Record<string, number> = {};
    const byCter: Record<string, number> = {};
    let totalScore = 0;
    let neop4Count = 0;

    evaluations.forEach((evaluation) => {
      byNeop[evaluation.neop] = (byNeop[evaluation.neop] || 0) + 1;
      if (evaluation.cterRequerente) {
        byCter[evaluation.cterRequerente] = (byCter[evaluation.cterRequerente] || 0) + 1;
      }
      totalScore += evaluation.pontuacao;
      if (evaluation.neop === '4º NEOP') neop4Count++;
    });

    return {
      totalOperations: evaluations.length,
      averageScore: evaluations.length > 0 ? Math.round((totalScore / evaluations.length) * 100) / 100 : 0,
      byNeop,
      byCter,
      neop4Percentage: evaluations.length > 0 ? Math.round((neop4Count / evaluations.length) * 100) : 0,
    };
  }, [evaluations]);

  // Filter operations
  const filteredOperations = useMemo(() => {
    if (!selectedNeop) return evaluations;
    return evaluations.filter(evaluation => evaluation.neop === selectedNeop);
  }, [evaluations, selectedNeop]);

  // Paginate
  const paginatedOperations = filteredOperations.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  const totalPages = Math.ceil(filteredOperations.length / pageSize);

  const getNeopColor = (neop: string) => {
    switch (neop) {
      case '4º NEOP':
        return 'destructive';
      case '3º NEOP':
        return 'default';
      case '2º NEOP':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análise de Operações</h1>
          <p className="text-muted-foreground mt-2">
            Visualize estatísticas e tendências de operações
          </p>
        </div>
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Operações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalOperations}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pontuação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.averageScore}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">4º NEOP %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.neop4Percentage}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">CTERs Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Object.keys(stats.byCter).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* NEOP Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Distribuição por NEOP
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.byNeop).map(([neop, count]) => (
              <div key={neop} className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Badge variant={getNeopColor(neop)}>{neop}</Badge>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(count / stats.totalOperations) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">{count} ({Math.round((count / stats.totalOperations) * 100)}%)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter by NEOP */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por NEOP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedNeop === null ? 'default' : 'outline'}
              onClick={() => {
                setSelectedNeop(null);
                setPage(0);
              }}
            >
              Todas
            </Button>
            {Object.keys(stats.byNeop).map((neop) => (
              <Button
                key={neop}
                variant={selectedNeop === neop ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedNeop(neop);
                  setPage(0);
                }}
              >
                {neop}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Operações ({filteredOperations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedOperations.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhuma operação encontrada</p>
            ) : (
              paginatedOperations.map((evaluation) => (
                <div key={evaluation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{evaluation.nuipc}</p>
                    <p className="text-sm text-muted-foreground">
                      {evaluation.dataAvaliacao} • {evaluation.cterRequerente}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Pontuação</p>
                      <p className="text-lg font-bold">{evaluation.pontuacao}</p>
                    </div>
                    <Badge variant={getNeopColor(evaluation.neop)}>{evaluation.neop}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
