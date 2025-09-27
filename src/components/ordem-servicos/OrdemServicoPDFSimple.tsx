'use client';

import React from 'react';
import jsPDF from 'jspdf';

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

interface OrdemServicoPDFSimpleProps {
  ordem: OrdemServico;
  onClose: () => void;
}

export function OrdemServicoPDFSimple({ ordem, onClose }: OrdemServicoPDFSimpleProps) {
  const generatePDF = () => {
    try {
      console.log('Iniciando geração de PDF simples...');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Configurações
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const lineHeight = 7;
      let yPosition = margin;

      // Função para adicionar texto com quebra de linha
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }
        
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * lineHeight + 2;
      };

      // Função para adicionar linha em branco
      const addSpace = (lines: number = 1) => {
        yPosition += lines * lineHeight;
      };

      // Cabeçalho
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ORDEM DE SERVIÇO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Número: ${ordem.numero}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(`Data de Abertura: ${formatDate(ordem.dataAbertura)}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Linha separadora
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Dados do Cliente
      addText('DADOS DO CLIENTE', 14, true);
      addText(`Nome: ${ordem.cliente.nome}`, 12);
      addText(`Telefone: ${ordem.cliente.telefone}`, 12);
      addText(`Endereço: ${ordem.cliente.endereco}`, 12);
      addSpace(2);

      // Dados do Equipamento
      addText('DADOS DO EQUIPAMENTO', 14, true);
      addText(`Tipo: ${ordem.equipamento.tipo}`, 12);
      addText(`Marca: ${ordem.equipamento.marca}`, 12);
      addText(`Modelo: ${ordem.equipamento.modelo}`, 12);
      addText(`Número de Série: ${ordem.equipamento.numeroSerie}`, 12);
      addSpace(2);

      // Informações do Serviço
      addText('INFORMAÇÕES DO SERVIÇO', 14, true);
      addText(`Status: ${getStatusLabel(ordem.status)}`, 12);
      addText(`Prioridade: ${getPrioridadeLabel(ordem.prioridade)}`, 12);
      addText(`Técnico: ${ordem.tecnico || 'Não atribuído'}`, 12);
      
      if (ordem.dataPrevisao) {
        addText(`Data de Previsão: ${formatDate(ordem.dataPrevisao)}`, 12);
      }
      addSpace(1);

      addText('Problema Relatado:', 12, true);
      addText(ordem.problema, 11);
      addSpace(1);

      if (ordem.diagnostico) {
        addText('Diagnóstico:', 12, true);
        addText(ordem.diagnostico, 11);
        addSpace(1);
      }

      if (ordem.solucao) {
        addText('Solução Aplicada:', 12, true);
        addText(ordem.solucao, 11);
        addSpace(1);
      }

      if (ordem.observacoes) {
        addText('Observações:', 12, true);
        addText(ordem.observacoes, 11);
        addSpace(1);
      }

      // Informações Financeiras
      addText('INFORMAÇÕES FINANCEIRAS', 14, true);
      addText(`Valor do Serviço: ${formatCurrency(ordem.valorServico || 0)}`, 12);
      addText(`Valor das Peças: ${formatCurrency(ordem.valorPecas || 0)}`, 12);
      addText(`Valor Total: ${formatCurrency((ordem.valorServico || 0) + (ordem.valorPecas || 0))}`, 14, true);
      addSpace(3);

      // Assinaturas
      addText('ASSINATURAS', 14, true);
      addSpace(2);
      
      // Linha para assinatura do cliente
      pdf.line(margin, yPosition, pageWidth / 2 - 10, yPosition);
      addText('Assinatura do Cliente', 10);
      addText(`Data: ___/___/______`, 10);
      addSpace(2);

      // Linha para assinatura do técnico
      pdf.line(pageWidth / 2 + 10, yPosition, pageWidth - margin, yPosition);
      addText('Assinatura do Técnico', 10);
      addText(`Data: ___/___/______`, 10);

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
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Gerar PDF da Ordem de Serviço</h2>
          <p className="text-gray-600 mb-6">
            Clique no botão abaixo para gerar e baixar o PDF da ordem de serviço <strong>{ordem.numero}</strong>.
          </p>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={generatePDF}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Gerar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
