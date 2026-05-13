import { NextResponse } from 'next/server';
import { createInvoice } from '@/lib/cora/api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, services, dueDate, code } = body;

    // Validação básica do corpo da requisição
    if (!customer || !services || !services.length || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Faltam parâmetros obrigatórios (customer, services, dueDate).' },
        { status: 400 }
      );
    }

    // Validações adicionais para a Cora
    if (!customer.name || !customer.email || !customer.document || !customer.document.identity) {
      return NextResponse.json(
        { success: false, error: 'Dados do cliente incompletos para emissão da cobrança na Cora.' },
        { status: 400 }
      );
    }

    // Garante que o valor dos serviços esteja formatado em inteiros (centavos)
    const formattedServices = services.map((s: any) => ({
      ...s,
      amount: typeof s.amount === 'number' ? Math.round(s.amount) : parseInt(s.amount, 10),
    }));

    const response = await createInvoice({
      code,
      customer,
      services: formattedServices,
      dueDate,
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error('Erro na rota /next_api/payments/cora:', error);
    
    // Extrai a mensagem de erro da Cora, se disponível
    const errorMessage = error?.data?.error || error?.message || 'Erro interno ao processar pagamento.';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage, 
        details: error?.data 
      }, 
      { status: error?.status || 500 }
    );
  }
}
