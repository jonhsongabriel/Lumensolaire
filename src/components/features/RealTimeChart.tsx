// Composant de graphique en temps réel pour les données de monitoring
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonitoringData } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RealTimeChartProps {
  data: MonitoringData[];
  title: string;
  dataKeys: {
    key: keyof MonitoringData;
    label: string;
    color: string;
  }[];
}

export function RealTimeChart({ data, title, dataKeys }: RealTimeChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    // Transformer les données pour le graphique
    const transformed = data.map(item => {
      const result: Record<string, string | number> = {
        time: format(new Date(item.timestamp), 'HH:mm', { locale: fr })
      };
      
      dataKeys.forEach(({ key }) => {
        result[key as string] = (item[key] as number) || 0;
      });
      
      return result;
    });

    setChartData(transformed);
  }, [data, dataKeys]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="time"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            {dataKeys.map(({ key, label, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
