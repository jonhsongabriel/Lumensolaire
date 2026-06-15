// Composant d'export de données en CSV et PDF
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import type { MonitoringData } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface DataExportProps {
  data: MonitoringData[];
  siteName: string;
  startDate: Date;
  endDate: Date;
}

export function DataExport({ data, siteName, startDate, endDate }: DataExportProps) {
  const exportToCSV = () => {
    if (data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    // Créer l'en-tête CSV
    const headers = [
      'Date/Heure',
      'Production (kW)',
      'Consommation (kW)',
      'Batterie (%)',
      'Tension (V)',
      'Température (°C)',
      'Statut réseau'
    ];

    // Créer les lignes de données
    const rows = data.map(item => [
      format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr }),
      item.production_kw?.toFixed(3) || '0.000',
      item.consumption_kw?.toFixed(3) || '0.000',
      item.battery_level_percent?.toFixed(2) || '0.00',
      item.battery_voltage?.toFixed(2) || '0.00',
      item.temperature_celsius?.toFixed(2) || '0.00',
      item.grid_status || 'N/A'
    ]);

    // Combiner en-têtes et données
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Créer le fichier et télécharger
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `${siteName.replace(/\s+/g, '_')}_${format(startDate, 'yyyyMMdd')}_${format(endDate, 'yyyyMMdd')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Export CSV réussi');
  };

  const exportToPDF = () => {
    if (data.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    // Créer un document HTML pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Rapport LUMEN - ${siteName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            h1 {
              color: #2563eb;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 10px;
            }
            .info {
              margin: 20px 0;
              padding: 10px;
              background-color: #f3f4f6;
              border-radius: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #2563eb;
              color: white;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>LUMEN - Rapport de supervision énergétique</h1>
          <div class="info">
            <p><strong>Site:</strong> ${siteName}</p>
            <p><strong>Période:</strong> ${format(startDate, 'dd/MM/yyyy', { locale: fr })} - ${format(endDate, 'dd/MM/yyyy', { locale: fr })}</p>
            <p><strong>Nombre de mesures:</strong> ${data.length}</p>
            <p><strong>Date de génération:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date/Heure</th>
                <th>Production (kW)</th>
                <th>Consommation (kW)</th>
                <th>Batterie (%)</th>
                <th>Tension (V)</th>
                <th>Température (°C)</th>
                <th>Statut réseau</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm', { locale: fr })}</td>
                  <td>${item.production_kw?.toFixed(2) || '0.00'}</td>
                  <td>${item.consumption_kw?.toFixed(2) || '0.00'}</td>
                  <td>${item.battery_level_percent?.toFixed(0) || '0'}</td>
                  <td>${item.battery_voltage?.toFixed(1) || '0.0'}</td>
                  <td>${item.temperature_celsius?.toFixed(1) || '0.0'}</td>
                  <td>${item.grid_status || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>© 2026 LUMEN - Plateforme de Supervision Énergétique Multisite</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = () => {
      printWindow.print();
    };

    toast.success('Génération du PDF en cours...');
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportToCSV} variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Exporter CSV
      </Button>
      <Button onClick={exportToPDF} variant="outline">
        <FileText className="mr-2 h-4 w-4" />
        Exporter PDF
      </Button>
    </div>
  );
}
