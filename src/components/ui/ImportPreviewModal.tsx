import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Upload, X, Save } from 'lucide-react';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSave?: () => void;
  fileName: string;
  headers: string[];
  data: any[][];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors?: string[];
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  onSave,
  fileName,
  headers,
  data,
  totalRows,
  validRows,
  invalidRows,
  errors = []
}: ImportPreviewModalProps) {
  const maxPreviewRows = 10;
  const handleSave = onSave || onConfirm;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-3xl lg:max-w-6xl max-h-[100dvh] sm:max-h-[90vh] overflow-hidden sm:rounded-lg rounded-none p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preview da Importação - {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600">Total de Linhas</div>
              <div className="text-2xl font-bold text-blue-900">{totalRows}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600">Válidas</div>
              <div className="text-2xl font-bold text-green-900">{validRows}</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-sm text-red-600">Inválidas</div>
              <div className="text-2xl font-bold text-red-900">{invalidRows}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Preview</div>
              <div className="text-2xl font-bold text-gray-900">
                {Math.min(maxPreviewRows, data.length)}/{data.length}
              </div>
            </div>
          </div>

          {/* Erros se houver */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Erros encontrados:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabela de Preview */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 sm:px-4 py-2 border-b">
              <h4 className="font-medium text-gray-800">
                Preview dos Dados ({Math.min(maxPreviewRows, data.length)} de {data.length} linhas)
              </h4>
            </div>
            <div className="overflow-auto max-h-[50vh] sm:max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {headers.map((header, index) => (
                      <TableHead key={index} className="min-w-[120px]">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, maxPreviewRows).map((row: any, rowIndex) => {
                    const isArrayRow = Array.isArray(row);
                    return (
                      <TableRow key={rowIndex}>
                        <TableCell className="font-medium text-gray-500">
                          {rowIndex + 1}
                        </TableCell>
                        {headers.map((header, cellIndex) => (
                          <TableCell key={cellIndex} className="max-w-[200px] truncate">
                            {isArrayRow ? (row[cellIndex] ?? '-') : (row[header] ?? '-')}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {data.length > maxPreviewRows && (
              <div className="bg-gray-50 px-3 sm:px-4 py-2 text-sm text-gray-600 text-center">
                ... e mais {data.length - maxPreviewRows} linhas
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t">
            <div className="text-sm text-gray-600">
              {validRows > 0 ? (
                <span className="text-green-600">
                  ✓ {validRows} registros serão importados
                </span>
              ) : (
                <span className="text-red-600">
                  ⚠ Nenhum registro válido para importar
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                variant="secondary"
                onClick={handleSave}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button 
                onClick={onConfirm} 
                disabled={validRows === 0}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar {validRows} Registros
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
