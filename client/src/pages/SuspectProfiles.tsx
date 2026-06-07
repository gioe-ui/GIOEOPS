import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Search, Users } from 'lucide-react';

export default function SuspectProfiles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Get all evaluations to extract suspect data
  const { data: evaluations = [] } = trpc.evaluations.list.useQuery({
    limit: 1000,
    offset: 0,
  });

  // Build unique suspects from evaluations
  const uniqueSuspects = useMemo(() => {
    const suspectMap = new Map<string, {
      nome: string | null;
      nif: string | null;
      cc: string | null;
      nacionalidade: string | null;
      totalOperations: number;
      neop4Count: number;
      lastOperation: string | null;
    }>();

    evaluations.forEach((evaluation) => {
      // For now, we'll show evaluation-level data
      // In a real app, you'd fetch suspects per evaluation
      const key = `${evaluation.nuipc}-${evaluation.cterRequerente}`;
      if (!suspectMap.has(key)) {
        suspectMap.set(key, {
          nome: evaluation.nuipc || 'N/A',
          nif: evaluation.cterRequerente || 'N/A',
          cc: null,
          nacionalidade: null,
          totalOperations: 1,
          neop4Count: evaluation.neop === '4º NEOP' ? 1 : 0,
          lastOperation: evaluation.dataAvaliacao,
        });
      } else {
        const existing = suspectMap.get(key)!;
        existing.totalOperations += 1;
        if (evaluation.neop === '4º NEOP') existing.neop4Count += 1;
        if (evaluation.dataAvaliacao && (!existing.lastOperation || evaluation.dataAvaliacao > existing.lastOperation)) {
          existing.lastOperation = evaluation.dataAvaliacao;
        }
      }
    });

    return Array.from(suspectMap.values());
  }, [evaluations]);

  // Filter suspects
  const filteredSuspects = useMemo(() => {
    return uniqueSuspects.filter(suspect =>
      suspect.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suspect.nif?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueSuspects, searchTerm]);

  // Paginate
  const paginatedSuspects = filteredSuspects.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  const totalPages = Math.ceil(filteredSuspects.length / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfis de Suspeitos</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e analise perfis de suspeitos com histórico de operações
          </p>
        </div>
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Procurar por nome ou NIF..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-4">
        {paginatedSuspects.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhum suspeito encontrado
            </CardContent>
          </Card>
        ) : (
          paginatedSuspects.map((suspect, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{suspect.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      NIF: {suspect.nif} | Nacionalidade: {suspect.nacionalidade || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {suspect.neop4Count > 0 && (
                      <Badge variant="destructive">
                        {suspect.neop4Count} 4º NEOP
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Operações</p>
                    <p className="text-2xl font-bold">{suspect.totalOperations}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa 4º NEOP</p>
                    <p className="text-2xl font-bold">
                      {suspect.totalOperations > 0
                        ? Math.round((suspect.neop4Count / suspect.totalOperations) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última Operação</p>
                    <p className="text-sm font-mono">{suspect.lastOperation || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

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
