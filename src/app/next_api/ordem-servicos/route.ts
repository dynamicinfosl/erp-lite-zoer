import { NextRequest, NextResponse } from 'next/server';
import { createResponse } from '@/lib/create-response';

// Simulação de banco de dados em memória
let ordensServico = [
  {
    id: '1',
    numero: 'OS-2024-001',
    cliente: {
      id: '1',
      nome: 'João Silva',
      telefone: '(11) 99999-9999',
      endereco: 'Rua das Flores, 123 - São Paulo/SP'
    },
    equipamento: {
      tipo: 'Geladeira',
      marca: 'Brastemp',
      modelo: 'BRM44HK',
      numeroSerie: 'BR2024001'
    },
    problema: 'Não está gelando',
    status: 'em_andamento',
    prioridade: 'alta',
    dataAbertura: '2024-01-15',
    dataPrevisao: '2024-01-20',
    tecnico: 'Carlos Santos',
    valorServico: 150.00
  },
  {
    id: '2',
    numero: 'OS-2024-002',
    cliente: {
      id: '2',
      nome: 'Maria Oliveira',
      telefone: '(11) 88888-8888',
      endereco: 'Av. Paulista, 456 - São Paulo/SP'
    },
    equipamento: {
      tipo: 'Máquina de Lavar',
      marca: 'Consul',
      modelo: 'CWH12B',
      numeroSerie: 'CO2024002'
    },
    problema: 'Não centrifuga',
    diagnostico: 'Problema no motor de centrifugação',
    status: 'aguardando_pecas',
    prioridade: 'media',
    dataAbertura: '2024-01-16',
    dataPrevisao: '2024-01-25',
    tecnico: 'Ana Costa',
    valorServico: 200.00,
    valorPecas: 80.00
  }
];

// GET - Listar todas as ordens de serviço
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const prioridade = searchParams.get('prioridade');
    const search = searchParams.get('search');

    let ordensFiltradas = [...ordensServico];

    // Aplicar filtros
    if (status && status !== 'todos') {
      ordensFiltradas = ordensFiltradas.filter(ordem => ordem.status === status);
    }

    if (prioridade && prioridade !== 'todos') {
      ordensFiltradas = ordensFiltradas.filter(ordem => ordem.prioridade === prioridade);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      ordensFiltradas = ordensFiltradas.filter(ordem =>
        ordem.numero.toLowerCase().includes(searchLower) ||
        ordem.cliente.nome.toLowerCase().includes(searchLower) ||
        ordem.equipamento.tipo.toLowerCase().includes(searchLower) ||
        ordem.equipamento.marca.toLowerCase().includes(searchLower)
      );
    }

    return createResponse({
      success: true,
      data: ordensFiltradas,
      message: 'Ordens de serviço listadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao listar ordens de serviço:', error);
    return createResponse({
      success: false,
      message: 'Erro interno do servidor'
    }, 500);
  }
}

// POST - Criar nova ordem de serviço
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação básica
    if (!body.cliente?.nome || !body.equipamento?.tipo || !body.problema) {
      return createResponse({
        success: false,
        message: 'Dados obrigatórios não fornecidos'
      }, 400);
    }

    // Gerar número da ordem
    const proximoNumero = ordensServico.length + 1;
    const numero = `OS-2024-${String(proximoNumero).padStart(3, '0')}`;

    const novaOrdem = {
      id: Date.now().toString(),
      numero,
      cliente: {
        id: body.cliente.id || Date.now().toString(),
        nome: body.cliente.nome,
        telefone: body.cliente.telefone || '',
        endereco: body.cliente.endereco || ''
      },
      equipamento: {
        tipo: body.equipamento.tipo,
        marca: body.equipamento.marca || '',
        modelo: body.equipamento.modelo || '',
        numeroSerie: body.equipamento.numeroSerie || ''
      },
      problema: body.problema,
      diagnostico: body.diagnostico || '',
      solucao: body.solucao || '',
      status: body.status || 'aberta',
      prioridade: body.prioridade || 'media',
      dataAbertura: new Date().toISOString().split('T')[0],
      dataPrevisao: body.dataPrevisao || '',
      dataConclusao: body.dataConclusao || '',
      tecnico: body.tecnico || '',
      valorServico: body.valorServico || 0,
      valorPecas: body.valorPecas || 0,
      observacoes: body.observacoes || ''
    };

    ordensServico.push(novaOrdem);

    return createResponse({
      success: true,
      data: novaOrdem,
      message: 'Ordem de serviço criada com sucesso'
    }, 201);
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error);
    return createResponse({
      success: false,
      message: 'Erro interno do servidor'
    }, 500);
  }
}

// PUT - Atualizar ordem de serviço
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return createResponse({
        success: false,
        message: 'ID da ordem é obrigatório'
      }, 400);
    }

    const index = ordensServico.findIndex(ordem => ordem.id === id);
    
    if (index === -1) {
      return createResponse({
        success: false,
        message: 'Ordem de serviço não encontrada'
      }, 404);
    }

    // Atualizar ordem
    ordensServico[index] = {
      ...ordensServico[index],
      ...body,
      id: ordensServico[index].id, // Manter o ID original
      numero: ordensServico[index].numero // Manter o número original
    };

    return createResponse({
      success: true,
      data: ordensServico[index],
      message: 'Ordem de serviço atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar ordem de serviço:', error);
    return createResponse({
      success: false,
      message: 'Erro interno do servidor'
    }, 500);
  }
}

// DELETE - Excluir ordem de serviço
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return createResponse({
        success: false,
        message: 'ID da ordem é obrigatório'
      }, 400);
    }

    const index = ordensServico.findIndex(ordem => ordem.id === id);
    
    if (index === -1) {
      return createResponse({
        success: false,
        message: 'Ordem de serviço não encontrada'
      }, 404);
    }

    const ordemRemovida = ordensServico.splice(index, 1)[0];

    return createResponse({
      success: true,
      data: ordemRemovida,
      message: 'Ordem de serviço removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir ordem de serviço:', error);
    return createResponse({
      success: false,
      message: 'Erro interno do servidor'
    }, 500);
  }
}
