
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware } from "@/lib/api-utils";

// GET - dados do dashboard
export const GET = requestMiddleware(async (request, context) => {
  try {
    // Em dev, se não houver token/sessão, retornar dados mínimos para evitar 401 em loop
    if (!context?.token || !context?.payload?.sub) {
      return createSuccessResponse({
        todaySales: { totalAmount: 0, salesCount: 0, grossProfit: 0 },
        todayDeliveries: { totalOrders: 0, inRoute: 0, completed: 0 },
        monthlyData: [],
        lowStockProducts: 0,
        alerts: { lowStock: false, pendingDeliveries: false },
      });
    }
    const salesCrud = new CrudOperations("sales", context.token);
    const deliveriesCrud = new CrudOperations("deliveries", context.token);
    const financialCrud = new CrudOperations("financial_transactions", context.token);
    const productsCrud = new CrudOperations("products", context.token);

    const userId = context.payload?.sub;
    const today = new Date().toISOString().split('T')[0];

    // Vendas de hoje
    const todaySales = await salesCrud.findMany({
      user_id: userId,
    });

    const todaySalesFiltered = todaySales?.filter((sale: any) => 
      sale.sold_at.startsWith(today)
    ) || [];

    const todayStats = {
      totalAmount: todaySalesFiltered.reduce((sum: number, sale: any) => sum + parseFloat(sale.final_amount), 0),
      salesCount: todaySalesFiltered.length,
      grossProfit: 0, // Será calculado com base no custo dos produtos
    };

    // Entregas de hoje
    const todayDeliveries = await deliveriesCrud.findMany({
      user_id: userId,
    });

    const todayDeliveriesFiltered = todayDeliveries?.filter((delivery: any) => 
      delivery.created_at.startsWith(today)
    ) || [];

    const deliveryStats = {
      totalOrders: todayDeliveriesFiltered.length,
      inRoute: todayDeliveriesFiltered.filter((d: any) => d.status === 'em_rota').length,
      completed: todayDeliveriesFiltered.filter((d: any) => d.status === 'entregue').length,
    };

    // Dados mensais para gráficos
    const currentYear = new Date().getFullYear();
    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const monthPrefix = `${currentYear}-${monthStr}`;
      
      const monthSales = todaySales?.filter((sale: any) => 
        sale.sold_at.startsWith(monthPrefix)
      ) || [];
      
      const monthAmount = monthSales.reduce((sum: number, sale: any) => 
        sum + parseFloat(sale.final_amount), 0
      );

      monthlyData.push({
        month: new Date(currentYear, month - 1).toLocaleDateString('pt-BR', { month: 'short' }),
        amount: monthAmount,
        income: monthAmount,
        expense: monthAmount * 0.3, // Estimativa de 30% de custos
      });
    }

    // Produtos com estoque baixo
    const products = await productsCrud.findMany({
      user_id: userId,
      is_active: true,
    });

    const lowStockProducts = products?.filter((product: any) => 
      product.stock_quantity <= product.min_stock
    ) || [];

    const dashboardData = {
      todaySales: todayStats,
      todayDeliveries: deliveryStats,
      monthlyData,
      lowStockProducts: lowStockProducts.length,
      alerts: {
        lowStock: lowStockProducts.length > 0,
        pendingDeliveries: deliveryStats.inRoute > 0,
      }
    };

    return createSuccessResponse(dashboardData);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return createErrorResponse({
      errorMessage: "Erro ao buscar dados do dashboard",
      status: 500,
    });
  }
}, false);
