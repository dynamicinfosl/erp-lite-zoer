import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, UserPlus, CheckSquare, AlertTriangle, CheckCircle, Users, FileSpreadsheet, FileText } from 'lucide-react';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister?: (selectedRows: any[]) => void;
  fileName: string;
  headers: string[];
  data: any[][];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors?: string[];
  isRegistering?: boolean;
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  onRegister,
  fileName,
  headers,
  data,
  totalRows,
  validRows,
  invalidRows,
  errors = [],
  isRegistering = false
}: ImportPreviewModalProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

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
        console.log('📊 Primeiro item selecionado:', JSON.stringify(selectedData[0], null, 2));
        onRegister(selectedData);
      } else {
        // Se nenhuma linha está selecionada, cadastra todos os dados
        console.log('📊 Nenhuma linha selecionada, cadastrando todos os dados:', data.length);
        console.log('📊 Primeiro item de todos os dados:', JSON.stringify(data[0], null, 2));
        onRegister(data);
      }
    } else {
      console.log('❌ Não é possível cadastrar - onRegister não existe');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] h-[95vh] max-w-none max-h-[95vh] p-0 overflow-hidden flex flex-col">
        {/* Header - Fixo */}
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-gray-800">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <FileSpreadsheet className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-xl">Preview de Importação</span>
              <span className="text-xs sm:text-sm font-normal text-gray-600 truncate">
                {fileName}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Conteúdo Scrollável */}
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col min-h-full">
            {/* Estatísticas Cards */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50/50 flex-shrink-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                        <p className="text-lg sm:text-2xl font-bold text-blue-600">{totalRows}</p>
                      </div>
                      <div className="p-1 sm:p-2 bg-blue-100 rounded-full">
                        <FileText className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-sm">
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Válidos</p>
                        <p className="text-lg sm:text-2xl font-bold text-green-600">{validRows}</p>
                      </div>
                      <div className="p-1 sm:p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-sm">
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Inválidos</p>
                        <p className="text-lg sm:text-2xl font-bold text-red-600">{invalidRows}</p>
                      </div>
                      <div className="p-1 sm:p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="h-3 w-3 sm:h-5 sm:w-5 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-sm">
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-600">Selecionados</p>
                        <p className="text-lg sm:text-2xl font-bold text-purple-600">{selectedRows.size}</p>
                      </div>
                      <div className="p-1 sm:p-2 bg-purple-100 rounded-full">
                        <Users className="h-3 w-3 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Erros se houver */}
            {errors.length > 0 && (
              <div className="px-3 sm:px-6 pb-3 sm:pb-4 flex-shrink-0">
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2 text-sm">Erros encontrados:</div>
                    <ScrollArea className="h-16 sm:h-20">
                      <ul className="text-xs sm:text-sm space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Controles da Tabela */}
            <div className="px-3 sm:px-6 py-2 sm:py-3 bg-white border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                  Dados ({data.length} registros)
                </h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    className="h-4 w-4"
                  />
                  <label htmlFor="select-all" className="text-xs sm:text-sm text-gray-600 cursor-pointer font-medium">
                    Selecionar Todos
                  </label>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                {selectedRows.size} de {data.length} selecionados
              </Badge>
            </div>

            {/* Tabela de Preview */}
            <div className="flex-1 min-h-[300px]">
              <div className="h-full overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                    <TableRow className="border-b-2">
                      <TableHead className="w-12 sm:w-16 text-center font-semibold text-gray-700 sticky left-0 bg-white border-r z-20 text-xs sm:text-sm">
                        #
                      </TableHead>
                      <TableHead className="w-10 sm:w-12 text-center font-semibold text-gray-700 sticky left-12 sm:left-16 bg-white border-r z-20">
                        <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mx-auto" />
                      </TableHead>
                      {headers.map((header, index) => (
                        <TableHead key={index} className="min-w-[100px] sm:min-w-[120px] font-semibold text-gray-700 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row: any, rowIndex) => {
                      const isArrayRow = Array.isArray(row);
                      const isSelected = selectedRows.has(rowIndex);
                      return (
                        <TableRow 
                          key={rowIndex} 
                          className={`hover:bg-blue-50/50 transition-colors ${
                            isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                          }`}
                        >
                          <TableCell className="font-medium text-gray-600 text-center sticky left-0 bg-white border-r py-2 sm:py-3">
                            <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
                              {rowIndex + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center sticky left-12 sm:left-16 bg-white border-r py-2 sm:py-3">
                            <Checkbox
                              checked={selectedRows.has(rowIndex)}
                              onCheckedChange={(checked) => handleRowSelect(rowIndex, checked as boolean)}
                              className="h-3 w-3 sm:h-4 sm:w-4"
                            />
                          </TableCell>
                          {headers.map((header, cellIndex) => {
                            const cellValue = isArrayRow ? (row[cellIndex] ?? '') : (row[header] ?? '');
                            return (
                              <TableCell key={cellIndex} className="min-w-[100px] sm:min-w-[120px] max-w-[150px] sm:max-w-[200px] py-2 sm:py-3 px-2 sm:px-4">
                                <div className="truncate font-medium text-gray-800 text-xs sm:text-sm" title={cellValue}>
                                  {cellValue || <span className="text-gray-400 italic">—</span>}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Ações - Fixo */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t flex-shrink-0">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Status */}
            <div className="flex items-center justify-center">
              {validRows > 0 ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 sm:px-4 py-2 rounded-lg">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium text-xs sm:text-sm">
                    {validRows} registros válidos prontos
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 sm:px-4 py-2 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium text-xs sm:text-sm">Nenhum registro válido</span>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 text-xs sm:text-sm h-8 sm:h-10"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                Cancelar
              </Button>
              
              {onRegister && (
                <Button 
                  onClick={() => {
                    console.log('👤 Botão Cadastrar clicado');
                    console.log('📊 Estado do botão - isRegistering:', isRegistering, 'selectedRows.size:', selectedRows.size);
                    handleRegister();
                  }}
                  disabled={isRegistering || validRows === 0}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-8 sm:h-10"
                >
                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    {isRegistering ? 'Cadastrando...' : 
                     selectedRows.size > 0 ? `Cadastrar ${selectedRows.size} selecionados` : 
                     `Cadastrar ${data.length} clientes`}
                  </span>
                  <span className="sm:hidden">
                    {isRegistering ? 'Cadastrando...' : 'Cadastrar'}
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
