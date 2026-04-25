/**
 * Utility functions for exporting data to CSV and handling print functionality.
 */

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let val = row[header] === null || row[header] === undefined ? '' : row[header];
        if (typeof val === 'string') {
          // Escape quotes and wrap in quotes if it contains comma or newline
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toLocaleDateString()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printReport = (title: string, contentId: string) => {
  const content = document.getElementById(contentId);
  if (!content) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html dir="rtl">
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
          th { background-color: #f2f2f2; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .footer { margin-top: 30px; font-size: 10px; text-align: center; color: #777; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>مجمع الطبي - نظام MedCenter</h1>
          <h2>${title}</h2>
          <p>تاريخ التقرير: ${new Date().toLocaleString('ar-YE')}</p>
        </div>
        ${content.innerHTML}
        <div class="footer">
          تم إنتاج هذا التقرير بواسطة نظام MedCenter-HIS
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};
