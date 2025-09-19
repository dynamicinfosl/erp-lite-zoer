'use client';

import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OrdemServico {
  id: string;
  numero: string;
  cliente: {
    id: string;
    nome: string;
    telefone: string;
    endereco: string;
  };
  equipamento: {
    tipo: string;
    marca: string;
    modelo: string;
    numeroSerie: string;
  };
  problema: string;
  diagnostico?: string;
  solucao?: string;
  status: 'aberta' | 'em_andamento' | 'aguardando_pecas' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  dataAbertura: string;
  dataPrevisao?: string;
  dataConclusao?: string;
  tecnico?: string;
  valorServico?: number;
  valorPecas?: number;
  observacoes?: string;
}

interface OrdemServicoPDFProps {
  ordem: OrdemServico;
  onClose: () => void;
}

export function OrdemServicoPDF({ ordem, onClose }: OrdemServicoPDFProps) {
  const pdfRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!pdfRef.current) {
      console.error('Elemento PDF não encontrado');
      return;
    }

    try {
      console.log('Iniciando geração de PDF...');
      
      // Configurações do html2canvas
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: pdfRef.current.scrollWidth,
        height: pdfRef.current.scrollHeight,
      });

      console.log('Canvas criado:', canvas.width, 'x', canvas.height);

      const imgData = canvas.toDataURL('image/png', 1.0);
      console.log('Imagem convertida para base64');

      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensões da imagem
      const imgWidth = pdfWidth - 20; // Margem de 10mm de cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      console.log('Dimensões PDF:', pdfWidth, 'x', pdfHeight);
      console.log('Dimensões Imagem:', imgWidth, 'x', imgHeight);

      // Se a imagem for maior que uma página, dividir em múltiplas páginas
      if (imgHeight > pdfHeight - 20) {
        let heightLeft = imgHeight;
        let position = 10; // Margem superior

        // Primeira página
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);

        // Páginas adicionais se necessário
        while (heightLeft > 0) {
          pdf.addPage();
          position = 10 - (imgHeight - heightLeft);
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= (pdfHeight - 20);
        }
      } else {
        // Imagem cabe em uma página
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      }

      // Salvar o PDF
      const fileName = `ordem-servico-${ordem.numero}.pdf`;
      console.log('Salvando PDF:', fileName);
      pdf.save(fileName);
      
      console.log('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusLabel = (status: string) => {
    const statusMap = {
      aberta: 'Aberta',
      em_andamento: 'Em Andamento',
      aguardando_pecas: 'Aguardando Peças',
      concluida: 'Concluída',
      cancelada: 'Cancelada'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getPrioridadeLabel = (prioridade: string) => {
    const prioridadeMap = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      urgente: 'Urgente'
    };
    return prioridadeMap[prioridade as keyof typeof prioridadeMap] || prioridade;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Ordem de Serviço - {ordem.numero}</h2>
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Gerar PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Fechar
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div ref={pdfRef} className="bg-white p-8 text-black" style={{ width: '210mm', minHeight: '297mm' }}>
            {/* Cabeçalho com Logo e Dados da Empresa */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-800 text-white flex items-center justify-center text-xl font-bold">
                  CLS
                </div>
                <div>
                  <div className="text-sm text-gray-600">IMPORT</div>
                  <div className="text-lg font-bold">CLS Alves Import</div>
                </div>
              </div>
              <div className="text-right text-sm">
                <div>Tel: (21) 96412-5745</div>
                <div>Email: clsimportsite@gmail.com</div>
                <div>Vendedor: Cláudio Alves</div>
              </div>
            </div>

            {/* Título e Data */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">PEDIDO N° {ordem.numero}</h1>
              <div className="flex justify-between items-center">
                <div></div>
                <div className="text-sm">{formatDate(ordem.dataAbertura)}</div>
              </div>
              <div className="text-sm mt-2">PRAZO DE ENTREGA: {formatDate(ordem.dataPrevisao || ordem.dataAbertura)}</div>
            </div>

            {/* Dados do Cliente */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 border-b pb-1">DADOS DO CLIENTE</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-20 font-semibold">Cliente:</span>
                    <span>{ordem.cliente.nome}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 font-semibold">Endereço:</span>
                    <span>{ordem.cliente.endereco || '________________'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 font-semibold">Cidade:</span>
                    <span>________________</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 font-semibold">Telefone:</span>
                    <span>{ordem.cliente.telefone || '________________'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex">
                    <span className="w-20 font-semibold">CNPJ/CPF:</span>
                    <span>________________</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 font-semibold">CEP:</span>
                    <span>________________</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 font-semibold">Estado:</span>
                    <span>________________</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 font-semibold">E-mail:</span>
                    <span>________________</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos/Serviços */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 border-b pb-1">PRODUTOS</h2>
              <div className="border border-gray-300">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 text-left">ITEM</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">NOME</th>
                      <th className="border border-gray-300 px-2 py-1 text-center">UND.</th>
                      <th className="border border-gray-300 px-2 py-1 text-center">QTD.</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">VR. UNIT.</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">DESC.</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 text-center">1</td>
                      <td className="border border-gray-300 px-2 py-1">{ordem.equipamento.tipo} - {ordem.equipamento.marca} {ordem.equipamento.modelo}</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">UN</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">1,00</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">
                        {ordem.valorServico ? ordem.valorServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-right">0,00</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">
                        {ordem.valorServico ? ordem.valorServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1 font-semibold">TOTAL</td>
                      <td className="border border-gray-300 px-2 py-1"></td>
                      <td className="border border-gray-300 px-2 py-1 text-center">1,00</td>
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        {ordem.valorServico ? ordem.valorServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-right">0,00</td>
                      <td className="border border-gray-300 px-2 py-1 text-right font-semibold">
                        {ordem.valorServico ? ordem.valorServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-right pr-4 py-2 text-sm">
                  <div>PRODUTOS: {ordem.valorServico ? ordem.valorServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</div>
                  <div className="font-bold">TOTAL: R$ {ordem.valorServico ? ordem.valorServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</div>
                </div>
              </div>
            </div>

            {/* Dados do Pagamento */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 border-b pb-1">DADOS DO PAGAMENTO</h2>
              <div className="border border-gray-300">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 text-left">VENCIMENTO</th>
                      <th className="border border-gray-300 px-2 py-1 text-right">VALOR</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">FORMA DE PAGAMENTO</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">OBSERVAÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1">{formatDate(ordem.dataPrevisao || ordem.dataAbertura)}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">
                        {ordem.valorServico ? ordem.valorServico.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">PIX</td>
                      <td className="border border-gray-300 px-2 py-1">{ordem.observacoes || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Informações do Serviço */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 border-b pb-1">INFORMAÇÕES DO SERVIÇO</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p><strong>Status:</strong> {getStatusLabel(ordem.status)}</p>
                  <p><strong>Prioridade:</strong> {getPrioridadeLabel(ordem.prioridade)}</p>
                </div>
                <div>
                  <p><strong>Técnico:</strong> {ordem.tecnico || 'Não atribuído'}</p>
                  {ordem.dataPrevisao && (
                    <p><strong>Previsão:</strong> {formatDate(ordem.dataPrevisao)}</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <p><strong>Problema Relatado:</strong></p>
                <p className="border p-2 bg-gray-50 rounded">{ordem.problema}</p>
              </div>

              {ordem.diagnostico && (
                <div className="mb-4">
                  <p><strong>Diagnóstico:</strong></p>
                  <p className="border p-2 bg-gray-50 rounded">{ordem.diagnostico}</p>
                </div>
              )}

              {ordem.solucao && (
                <div className="mb-4">
                  <p><strong>Solução Aplicada:</strong></p>
                  <p className="border p-2 bg-gray-50 rounded">{ordem.solucao}</p>
                </div>
              )}

              {ordem.observacoes && (
                <div className="mb-4">
                  <p><strong>Observações:</strong></p>
                  <p className="border p-2 bg-gray-50 rounded">{ordem.observacoes}</p>
                </div>
              )}
            </div>

            {/* Informações Financeiras */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 border-b pb-1">INFORMAÇÕES FINANCEIRAS</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Valor do Serviço:</strong> {formatCurrency(ordem.valorServico || 0)}</p>
                  <p><strong>Valor das Peças:</strong> {formatCurrency(ordem.valorPecas || 0)}</p>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    <strong>Valor Total:</strong> {formatCurrency((ordem.valorServico || 0) + (ordem.valorPecas || 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Assinatura */}
            <div className="mt-8 pt-4 border-t">
              <div className="text-center">
                <div className="border-b border-gray-400 w-64 mx-auto mb-2"></div>
                <div className="text-sm font-semibold">Assinatura do cliente</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}[]