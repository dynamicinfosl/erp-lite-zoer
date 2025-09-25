
import CrudOperations from '@/lib/crud-operations';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { requestMiddleware, parseQueryParams, validateRequestBody } from "@/lib/api-utils";

// GET - buscar produtos
export const GET = requestMiddleware(async (request, context) => {
  try {
    const { limit, offset, search } = parseQueryParams(request);
    const productsCrud = new CrudOperations("products", context.token);
    
    const filters: Record<string, any> = {
      user_id: context.payload?.sub || '00000000-0000-0000-0000-000000000000',
      is_active: true,
    };

    let products = await productsCrud.findMany(filters, { 
      limit: limit || 100, 
      offset,
      orderBy: { column: 'name', direction: 'asc' }
    });

    // Filtro de busca no lado da aplicação
    if (search && products) {
      products = products.filter((product: any) =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku?.toLowerCase().includes(search.toLowerCase()) ||
        product.barcode?.includes(search)
      );
    }

    return createSuccessResponse(products || []);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return createErrorResponse({
      errorMessage: "Erro ao buscar produtos",
      status: 500,
    });
  }
}, true);

// POST - criar produto
export const POST = requestMiddleware(async (request, context) => {
  try {
    const body = await validateRequestBody(request);
    
    if (!body.name || !body.sale_price) {
      return createErrorResponse({
        errorMessage: "Nome e preço de venda são obrigatórios",
        status: 400,
      });
    }

    const productsCrud = new CrudOperations("products", context.token);
    // Somente colunas suportadas pelo schema
    const allowedKeys = [
      'user_id','name','sku','barcode','description','category_id','cost_price','sale_price','stock_quantity','min_stock','unit','is_active','ncm','imported_at'
    ];
    const normalized: any = {
      user_id: context.payload?.sub || '00000000-0000-0000-0000-000000000000',
      name: body.name,
      sku: body.sku ?? null,
      barcode: body.barcode ?? null,
      description: body.description ?? null,
      category_id: body.category_id ? Number(body.category_id) : null,
      cost_price: body.cost_price !== undefined ? Number(body.cost_price) || 0 : 0,
      sale_price: Number(body.sale_price),
      stock_quantity: body.stock_quantity !== undefined ? parseInt(body.stock_quantity) || 0 : 0,
      min_stock: body.min_stock !== undefined ? parseInt(body.min_stock) || 0 : 0,
      unit: body.unit || 'UN',
      is_active: body.is_active !== false,
      ncm: body.ncm ?? null,
      imported_at: body.imported_at ?? null,
    };
    const productData = Object.fromEntries(Object.entries(normalized).filter(([k]) => allowedKeys.includes(k)));

    // Duplicidade: tenta por SKU e depois por barcode; se existir, atualiza valores principais
    const tryFind = async (filters: Record<string, any>) => {
      const rows = await productsCrud.findMany(filters, { limit: 1, offset: 0 });
      return rows && rows.length > 0 ? rows[0] : null;
    };

    let duplicate = null;
    if (productData.sku) duplicate = await tryFind({ user_id: productData.user_id, sku: productData.sku });
    if (!duplicate && normalized.barcode) duplicate = await tryFind({ user_id: productData.user_id, barcode: normalized.barcode });

    let product;
    if (duplicate) {
      product = await productsCrud.update(duplicate.id, productData);
    } else {
      product = await productsCrud.create(productData);
    }

    // TODO: salvar extras (ncm, imported_at) quando a tabela auxiliar existir
    return createSuccessResponse(product, 201);
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    return createErrorResponse({
      errorMessage: error?.message || 'Erro ao criar produto',
      status: 500,
    });
  }
}, true);

// PUT - atualizar produto
export const PUT = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID do produto é obrigatório",
        status: 400,
      });
    }

    const body = await validateRequestBody(request);
    const productsCrud = new CrudOperations("products", context.token);
    
    // Verificar se o produto existe e pertence ao usuário
    const existing = await productsCrud.findById(id);
    if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Produto não encontrado",
        status: 404,
      });
    }

    const updateData = {
      name: body.name,
      sku: body.sku || null,
      barcode: body.barcode || null,
      description: body.description || null,
      internal_code: body.internal_code || null,
      product_group: body.product_group || null,
      has_variations: body.has_variations === true,
      fiscal_note: body.fiscal_note || null,
      unit_conversion: body.unit_conversion || null,
      moves_stock: body.moves_stock !== false,
      width_cm: body.width_cm ? parseFloat(body.width_cm) : null,
      height_cm: body.height_cm ? parseFloat(body.height_cm) : null,
      length_cm: body.length_cm ? parseFloat(body.length_cm) : null,
      weight_kg: body.weight_kg ? parseFloat(body.weight_kg) : null,
      category_id: body.category_id || null,
      cost_price: parseFloat(body.cost_price) || 0,
      sale_price: parseFloat(body.sale_price),
      stock_quantity: parseInt(body.stock_quantity) || 0,
      min_stock: parseInt(body.min_stock) || 0,
      unit: body.unit || 'UN',
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString(),
    };

    const product = await productsCrud.update(id, updateData);
    return createSuccessResponse(product);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return createErrorResponse({
      errorMessage: "Erro ao atualizar produto",
      status: 500,
    });
  }
}, false);

// DELETE - excluir produto
export const DELETE = requestMiddleware(async (request, context) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: "ID do produto é obrigatório",
        status: 400,
      });
    }

    const productsCrud = new CrudOperations("products", context.token);
    
    // Verificar se o produto existe e pertence ao usuário
    const existing = await productsCrud.findById(id);
    if (!existing || existing.user_id !== parseInt(context.payload?.sub || '0')) {
      return createErrorResponse({
        errorMessage: "Produto não encontrado",
        status: 404,
      });
    }

    // Soft delete - marcar como inativo
    await productsCrud.update(id, { 
      is_active: false,
      updated_at: new Date().toISOString(),
    });
    
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return createErrorResponse({
      errorMessage: "Erro ao excluir produto",
      status: 500,
    });
  }
}, false);
