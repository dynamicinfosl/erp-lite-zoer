import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Upload, X, Save, Database, Plus } from 'lucide-react';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSave?: () => void;
  onExtract?: () => void;
  onConsume?: () => void;
  fileName: string;
  headers: string[];
  data: any[][];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors?: string[];
  isExtracting?: boolean;
  isConsuming?: boolean;
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  onSave,
  onExtract,
  onConsume,
  fileName,
  headers,
  data,
  totalRows,
  validRows,
  invalidRows,
  errors = [],
  isExtracting = false,
  isConsuming = false
}: ImportPreviewModalProps) {
  const maxPreviewRows = 10;
  const handleSave = onSave || onConfirm;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[100vw] h-[100vh] max-w-none max-h-none m-0 rounded-none p-2 sm:p-3 md:p-4 overflow-hidden">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <FileText className="h-4 w-4" />
            <span className="truncate">Preview - {fileName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full space-y-2 sm:space-y-3">
          {/* Estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-shrink-0">
            <div className="bg-blue-50 p-2 rounded text-center">
              <div className="text-xs sm:text-sm text-blue-600">Total</div>
              <div className="text-sm sm:text-base font-bold text-blue-900">{totalRows}</div>
            </div>
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="text-xs sm:text-sm text-green-600">Válidas</div>
              <div className="text-sm sm:text-base font-bold text-green-900">{validRows}</div>
            </div>
            <div className="bg-red-50 p-2 rounded text-center">
              <div className="text-xs sm:text-sm text-red-600">Inválidas</div>
              <div className="text-sm sm:text-base font-bold text-red-900">{invalidRows}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded text-center">
              <div className="text-xs sm:text-sm text-gray-600">Preview</div>
              <div className="text-sm sm:text-base font-bold text-gray-900">
                {Math.min(maxPreviewRows, data.length)}/{data.length}
              </div>
            </div>
          </div>

          {/* Erros se houver */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-2 flex-shrink-0">
              <h4 className="font-medium text-red-800 mb-1 text-sm">Erros encontrados:</h4>
              <ul className="text-xs sm:text-sm text-red-700 space-y-1 max-h-24 overflow-y-auto">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabela de Preview */}
          <div className="border rounded overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="bg-gray-50 px-2 py-1 border-b flex-shrink-0">
              <h4 className="font-medium text-gray-800 text-sm">
                Preview ({Math.min(maxPreviewRows, data.length)}/{data.length})
              </h4>
            </div>
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-12 text-xs sm:text-sm py-2 sticky left-0 bg-white border-r">#</TableHead>
                    {headers.map((header, index) => (
                      <TableHead key={index} className="min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm py-2 whitespace-nowrap">
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
                        <TableCell className="font-medium text-gray-500 text-xs sm:text-sm py-2 sticky left-0 bg-white border-r">
                          {rowIndex + 1}
                        </TableCell>
                        {headers.map((header, cellIndex) => (
                          <TableCell key={cellIndex} className="max-w-[120px] sm:max-w-[150px] truncate text-xs sm:text-sm py-2">
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
              <div className="bg-gray-50 px-2 py-1 text-xs sm:text-sm text-gray-600 text-center flex-shrink-0">
                ... e mais {data.length - maxPreviewRows} linhas
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 pt-2 border-t flex-shrink-0">
            <div className="text-xs sm:text-sm text-gray-600 text-center">
              {validRows > 0 ? (
                <span className="text-green-600">
                  ✓ {validRows} válidos
                </span>
              ) : (
                <span className="text-red-600">
                  ⚠ Nenhum válido
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <Button variant="outline" onClick={onClose} className="w-full text-xs sm:text-sm h-8 sm:h-9 px-2">
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden xs:inline">Cancelar</span>
              </Button>
              <Button 
                variant="secondary"
                onClick={() => {
                  console.log('💾 Botão Salvar clicado');
                  handleSave();
                }}
                className="w-full text-xs sm:text-sm h-8 sm:h-9 px-2"
              >
                <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden xs:inline">Salvar</span>
              </Button>
              {onExtract && (
                <Button 
                  variant="default"
                  onClick={() => {
                    console.log('🔵 Botão Extrair clicado');
                    onExtract();
                  }}
                  disabled={isExtracting || validRows === 0}
                  className="w-full text-xs sm:text-sm h-8 sm:h-9 px-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden xs:inline">{isExtracting ? 'Extraindo...' : 'Extrair'}</span>
                </Button>
              )}
              {onConsume && (
                <Button 
                  variant="default"
                  onClick={() => {
                    console.log('🟣 Botão Consumir clicado');
                    onConsume();
                  }}
                  disabled={isConsuming || validRows === 0}
                  className="w-full text-xs sm:text-sm h-8 sm:h-9 px-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden xs:inline">{isConsuming ? 'Consumindo...' : 'Consumir'}</span>
                </Button>
              )}
              <Button 
                onClick={() => {
                  console.log('🟢 Botão Importar clicado');
                  onConfirm();
                }}
                disabled={validRows === 0}
                className="w-full text-xs sm:text-sm h-8 sm:h-9 px-2 bg-green-600 hover:bg-green-700 col-span-2 sm:col-span-1"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden xs:inline">Importar</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
