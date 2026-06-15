// Composant d'affichage du journal d'audit
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAuditLogs } from '@/db/api';
import type { AuditLogWithUser } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface AuditLogProps {
  siteId?: string;
  limit?: number;
}

export function AuditLog({ siteId, limit = 50 }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [siteId]);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getAuditLogs(siteId, undefined, limit);
    setLogs(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Journal d'audit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journal d'audit</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune entrée dans le journal d'audit
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.user?.username || 'Inconnu'}</span>
                        <Badge variant="outline" className="w-fit text-xs">
                          {log.user?.role || 'N/A'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge>{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell className="max-w-xs">
                      {log.site && (
                        <div className="text-sm text-muted-foreground">
                          Site: {log.site.name}
                        </div>
                      )}
                      {log.new_value && (
                        <div className="text-xs text-muted-foreground truncate">
                          {JSON.stringify(log.new_value)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
