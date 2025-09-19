import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Upload, X, Save, Database, Plus, UserPlus, CheckSquare, Square } from 'lucide-react';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSave?: () => void;
  onExtract?: () => void;
  onConsume?: () => void;
  onRegister?: (selectedRows: any[]) => void;
  fileName: string;
  headers: string[];
  data: any[][];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors?: string[];
  isExtracting?: boolean;
  isConsuming?: boolean;
  isRegistering?: boolean;
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  onSave,
  onExtract,
  onConsume,
  onRegister,
  fileName,
  headers,
  data,
  totalRows,
  validRows,
  invalidRows,
  errors = [],
  isExtracting = false,
  isConsuming = false,
  isRegistering = false
}: ImportPreviewModalProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  const maxPreviewRows = 50;
  const handleSave = onSave || onConfirm;

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Modal aberto - resetando seleção');
      console.log('📊 Dados disponíveis:', data.length);
      setSelectedRows(new Set());
      setSelectAll(false);
    }
  }, [isOpen, data.length]);

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    console.log('🔘 Selecionar todos:', checked);
    if (checked) {
      const allIndices = data.map((_, index) => index);
      setSelectedRows(new Set(allIndices));
      setSelectAll(true);
      console.log('📊 Todas as linhas selecionadas:', allIndices.length);
    } else {
      setSelectedRows(new Set());
      setSelectAll(false);
      console.log('📊 Nenhuma linha selecionada');
    }
  };

  // Handle individual row selection
  const handleRowSelect = (index: number, checked: boolean) => {
    console.log('🔘 Selecionando linha:', index, 'checked:', checked);
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === data.length);
    console.log('📊 Linhas selecionadas:', newSelected.size, 'de', data.length);
  };

  // Handle register selected rows
  const handleRegister = () => {
    console.log('👤 handleRegister chamado');
    console.log('📊 selectedRows.size:', selectedRows.size);
    console.log('📊 onRegister existe:', !!onRegister);
    console.log('📊 data.length:', data.length);
    
    if (onRegister) {
      if (selectedRows.size > 0) {
        const selectedData = Array.from(selectedRows).map(index => data[index]);
        console.log('📊 Dados selecionados para cadastro:', selectedData.length);
        onRegister(selectedData);
      } else {
        // Se nenhuma linha está selecionada, cadastra todos os dados
        console.log('📊 Nenhuma linha selecionada, cadastrando todos os dados:', data.length);
        onRegister(data);
      }
    } else {
      console.log('❌ Não é possível cadastrar - onRegister não existe');
    }
  };

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
          <div className="grid grid-cols-4 gap-0.5 flex-shrink-0 px-1 h-6">
            <div className="bg-blue-50 p-0.5 rounded text-center flex flex-col justify-center">
              <div className="text-xs text-blue-600 leading-none">Total</div>
              <div className="text-xs font-bold text-blue-900 leading-none">{totalRows}</div>
            </div>
            <div className="bg-green-50 p-0.5 rounded text-center flex flex-col justify-center">
              <div className="text-xs text-green-600 leading-none">Válidas</div>
              <div className="text-xs font-bold text-green-900 leading-none">{validRows}</div>
            </div>
            <div className="bg-red-50 p-0.5 rounded text-center flex flex-col justify-center">
              <div className="text-xs text-red-600 leading-none">Inválidas</div>
              <div className="text-xs font-bold text-red-900 leading-none">{invalidRows}</div>
            </div>
            <div className="bg-gray-50 p-0.5 rounded text-center flex flex-col justify-center">
              <div className="text-xs text-gray-600 leading-none">Dados</div>
              <div className="text-xs font-bold text-gray-900 leading-none">{data.length}</div>
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
            <div className="bg-gray-50 px-1 py-0.5 border-b flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-800 text-xs">
                  Dados Completos ({data.length} linhas)
                </h4>
                <div className="flex items-center gap-1">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    className="h-3 w-3"
                  />
                  <label htmlFor="select-all" className="text-xs text-gray-600 cursor-pointer">
                    Selecionar Todos
                  </label>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                ↕️ Scroll vertical | ↔️ Scroll horizontal
              </div>
            </div>
            <div className="overflow-auto flex-1 max-h-[75vh]">
              <div className="min-w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-6 text-xs py-0.5 sticky left-0 bg-white border-r z-20">#</TableHead>
                      <TableHead className="w-8 text-xs py-0.5 sticky left-6 bg-white border-r z-20">✓</TableHead>
                      {headers.map((header, index) => (
                        <TableHead key={index} className="min-w-[60px] text-xs py-0.5 whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row: any, rowIndex) => {
                      const isArrayRow = Array.isArray(row);
                      return (
                        <TableRow key={rowIndex} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-500 text-xs py-0.5 sticky left-0 bg-white border-r z-10">
                            {rowIndex + 1}
                          </TableCell>
                          <TableCell className="w-8 text-xs py-0.5 sticky left-6 bg-white border-r z-10">
                            <Checkbox
                              checked={selectedRows.has(rowIndex)}
                              onCheckedChange={(checked) => handleRowSelect(rowIndex, checked as boolean)}
                              className="h-3 w-3"
                            />
                          </TableCell>
                          {headers.map((header, cellIndex) => (
                            <TableCell key={cellIndex} className="min-w-[60px] max-w-[100px] text-xs py-0.5">
                              <div className="truncate" title={isArrayRow ? (row[cellIndex] ?? '-') : (row[header] ?? '-')}>
                                {isArrayRow ? (row[cellIndex] ?? '-') : (row[header] ?? '-')}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-0.5 pt-0.5 border-t flex-shrink-0 px-1">
            <div className="text-xs text-gray-600 text-center">
              {validRows > 0 ? (
                <span className="text-green-600">
                  ✓ {validRows} válidos | {selectedRows.size} selecionados | onRegister: {onRegister ? '✅' : '❌'}
                </span>
              ) : (
                <span className="text-red-600">
                  ⚠ Nenhum válido
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-0.5">
              <Button variant="outline" onClick={onClose} className="w-full text-xs h-4 px-0.5">
                <X className="h-2 w-2" />
                <span className="hidden sm:inline ml-0.5 text-xs">Cancelar</span>
              </Button>
              
              {onRegister && (
                <Button 
                  variant="default"
                  onClick={() => {
                    console.log('👤 Botão Cadastrar clicado');
                    console.log('📊 Estado do botão - isRegistering:', isRegistering, 'selectedRows.size:', selectedRows.size);
                    handleRegister();
                  }}
                  disabled={isRegistering}
                  className="w-full text-xs h-4 px-0.5 bg-green-600 hover:bg-green-700"
                >
                  <UserPlus className="h-2 w-2" />
                  <span className="hidden sm:inline ml-0.5 text-xs">
                    {isRegistering ? 'Cadastrando...' : selectedRows.size > 0 ? `Cadastrar (${selectedRows.size})` : `Cadastrar Todos (${data.length})`}
                  </span>
                </Button>
              )}
              
              <Button 
                variant="secondary"
                onClick={() => {
                  console.log('💾 Botão Salvar clicado');
                  handleSave();
                }}
                className="w-full text-xs h-4 px-0.5"
              >
                <Save className="h-2 w-2" />
                <span className="hidden sm:inline ml-0.5 text-xs">Salvar</span>
              </Button>
              
              <Button 
                variant="default"
                onClick={() => {
                  console.log('📥 Botão Importar clicado');
                  onConfirm();
                }}
                disabled={validRows === 0}
                className="w-full text-xs h-4 px-0.5 bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-2 w-2" />
                <span className="hidden sm:inline ml-0.5 text-xs">Importar</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
