import { NextResponse } from 'next/server';
import { z } from 'zod';
import { emitInvoiceForSale, getQueuedInvoices } from '@/lib/nfe/service';

const saleInvoiceSchema = z.object({
  id: z.union([z.string(), z.number()]),
  tenantId: z.string(),
  customer: z.object({
    name: z.string(),
    document: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    stateRegistration: z.string().optional(),
    address: z.object({
      street: z.string(),
      number: z.string(),
      complement: z.string().optional(),
      district: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
    }),
  }),
  items: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        name: z.string(),
        quantity: z.number().positive(),
        unit: z.string(),
        price: z.number().nonnegative(),
        discount: z.number().optional(),
        ncm: z.string().optional(),
        cfop: z.string().optional(),
      }),
    )
    .min(1),
  totals: z.object({
    amount: z.number().positive(),
    discount: z.number().optional(),
    freight: z.number().optional(),
    insurance: z.number().optional(),
    other: z.number().optional(),
  }),
  payments: z
    .array(
      z.object({
        method: z.enum(['pix', 'credit_card', 'debit_card', 'cash', 'boleto', 'other']),
        amount: z.number().positive(),
        dueDate: z.string().optional(),
      }),
    )
    .min(1),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = saleInvoiceSchema.parse(body);

    const result = await emitInvoiceForSale(payload);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[NFE][POST] Erro ao preparar emissão:', error);
    const message = error instanceof z.ZodError ? 'Payload inválido para emissão de NFe' : (error as Error).message;
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function GET() {
  const queue = getQueuedInvoices();
  return NextResponse.json({
    success: true,
    queued: queue,
  });
}

