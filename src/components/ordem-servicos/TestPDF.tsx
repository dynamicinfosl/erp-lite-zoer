'use client';

import React from 'react';
import jsPDF from 'jspdf';

export function TestPDF() {
  const generateTestPDF = () => {
    try {
      console.log('Testando geração de PDF...');
      
      const pdf = new jsPDF();
      
      // Adicionar texto de teste
      pdf.text('Teste de Geração de PDF', 20, 20);
      pdf.text('Se você conseguir ver este PDF, a biblioteca está funcionando!', 20, 40);
      pdf.text('Data: ' + new Date().toLocaleString('pt-BR'), 20, 60);
      
      // Salvar o PDF
      pdf.save('teste-pdf.pdf');
      
      console.log('PDF de teste gerado com sucesso!');
      alert('PDF de teste gerado com sucesso! Verifique o console e a pasta de downloads.');
    } catch (error) {
      console.error('Erro ao gerar PDF de teste:', error);
      alert('Erro ao gerar PDF de teste: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <button
      onClick={generateTestPDF}
      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
      title="Testar geração de PDF"
    >
      Teste PDF
    </button>
  );
}
