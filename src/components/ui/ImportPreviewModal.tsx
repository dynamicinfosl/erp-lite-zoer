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
  const maxPreviewRows = 50;
  const handleSave = onSave || onConfirm;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[100vw] h-[100vh] max-w-none max-h-none m-0 rounded-none p-0.5 overflow-hidden">
        <DialogHeader className="pb-0.5 flex-shrink-0 px-1">
          <DialogTitle className="flex items-center gap-1 text-xs">
            <FileText className="h-3 w-3" />
            <span className="truncate">Preview - {fileName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full space-y-0.5">
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-0.5 flex-shrink-0 px-1">
            <div className="bg-blue-50 p-0.5 rounded text-center">
              <div className="text-xs text-blue-600">Total</div>
              <div className="text-xs font-bold text-blue-900">{totalRows}</div>
            </div>
            <div className="bg-green-50 p-0.5 rounded text-center">
              <div className="text-xs text-green-600">Válidas</div>
              <div className="text-xs font-bold text-green-900">{validRows}</div>
            </div>
            <div className="bg-red-50 p-0.5 rounded text-center">
              <div className="text-xs text-red-600">Inválidas</div>
              <div className="text-xs font-bold text-red-900">{invalidRows}</div>
            </div>
            <div className="bg-gray-50 p-0.5 rounded text-center">
              <div className="text-xs text-gray-600">Preview</div>
              <div className="text-xs font-bold text-gray-900">
                {Math.min(maxPreviewRows, data.length)}/{data.length}
              </div>
            </div>
          </div>

          {/* Erros se houver */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-0.5 flex-shrink-0 mx-1">
              <h4 className="font-medium text-red-800 mb-0.5 text-xs">Erros encontrados:</h4>
              <ul className="text-xs text-red-700 space-y-0.5 max-h-12 overflow-y-auto">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabela de Preview */}
          <div className="border rounded overflow-hidden flex-1 flex flex-col min-h-0 mx-1">
            <div className="bg-gray-50 px-1 py-0.5 border-b flex-shrink-0">
              <h4 className="font-medium text-gray-800 text-xs">
                Dados Completos ({data.length} linhas)
              </h4>
            </div>
            <div className="overflow-auto flex-1 max-h-[70vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-6 text-xs py-0.5 sticky left-0 bg-white border-r">#</TableHead>
                    {headers.map((header, index) => (
                      <TableHead key={index} className="min-w-[50px] text-xs py-0.5 whitespace-nowrap">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row: any, rowIndex) => {
                    const isArrayRow = Array.isArray(row);
                    return (
                      <TableRow key={rowIndex}>
                        <TableCell className="font-medium text-gray-500 text-xs py-0.5 sticky left-0 bg-white border-r">
                          {rowIndex + 1}
                        </TableCell>
                        {headers.map((header, cellIndex) => (
                          <TableCell key={cellIndex} className="max-w-[70px] truncate text-xs py-0.5">
                            {isArrayRow ? (row[cellIndex] ?? '-') : (row[header] ?? '-')}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-0.5 pt-0.5 border-t flex-shrink-0 px-1">
            <div className="text-xs text-gray-600 text-center">
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
            <div className="grid grid-cols-5 gap-0.5">
              <Button variant="outline" onClick={onClose} className="w-full text-xs h-5 px-0.5">
                <X className="h-2.5 w-2.5" />
                <span className="hidden sm:inline ml-0.5 text-xs">Cancelar</span>
              </Button>
              <Button 
                variant="secondary"
                onClick={() => {
                  console.log('💾 Botão Salvar clicado');
                  handleSave();
                }}
                className="w-full text-xs h-5 px-0.5"
              >
                <Save className="h-2.5 w-2.5" />
                <span className="hidden sm:inline ml-0.5 text-xs">Salvar</span>
              </Button>
              {onExtract && (
                <Button 
                  variant="default"
                  onClick={() => {
                    console.log('🔵 Botão Extrair clicado');
                    onExtract();
                  }}
                  disabled={isExtracting || validRows === 0}
                  className="w-full text-xs h-5 px-0.5 bg-blue-600 hover:bg-blue-700"
                >
                  <Database className="h-2.5 w-2.5" />
                  <span className="hidden sm:inline ml-0.5 text-xs">{isExtracting ? 'Extraindo...' : 'Extrair'}</span>
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
                  className="w-full text-xs h-5 px-0.5 bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span className="hidden sm:inline ml-0.5 text-xs">{isConsuming ? 'Consumindo...' : 'Consumir'}</span>
                </Button>
              )}
              <Button 
                onClick={() => {
                  console.log('🟢 Botão Importar clicado');
                  onConfirm();
                }}
                disabled={validRows === 0}
                className="w-full text-xs h-5 px-0.5 bg-green-600 hover:bg-green-700"
              >
                <Upload className="h-2.5 w-2.5" />
                <span className="hidden sm:inline ml-0.5 text-xs">Importar</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
