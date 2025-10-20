import { NextRequest } from 'next/server';

/**
 * Valida e extrai o corpo da requisição
 */
export async function validateRequestBody(request: NextRequest) {
  try {
    const body = await request.json();
    return body;
  } catch (error) {
    throw new Error('Corpo da requisição inválido ou ausente');
  }
}

/**
 * Extrai parâmetros de query da URL
 */
export function parseQueryParams(request: NextRequest) {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

/**
 * Valida se um campo obrigatório está presente
 */
export function validateRequiredField(value: any, fieldName: string) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${fieldName} é obrigatório`);
  }
  return value;
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Formato de email inválido');
  }
  return email;
}

/**
 * Valida formato de CPF
 */
export function validateCPF(cpf: string) {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) {
    throw new Error('CPF deve ter 11 dígitos');
  }
  
  // Validação básica de CPF
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    throw new Error('CPF inválido');
  }
  
  return cleanCPF;
}

/**
 * Valida formato de telefone
 */
export function validatePhone(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    throw new Error('Telefone deve ter 10 ou 11 dígitos');
  }
  
  return cleanPhone;
}

/**
 * Sanitiza string removendo caracteres especiais
 */
export function sanitizeString(str: string) {
  return str.trim().replace(/[<>]/g, '');
}

/**
 * Valida se um valor é um UUID válido
 */
export function validateUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error('UUID inválido');
  }
  return uuid;
}

/**
 * Extrai informações do usuário do token (simulado)
 */
export function extractUserFromToken(token: string) {
  // Em um sistema real, você decodificaria o JWT aqui
  // Por enquanto, vamos simular
  return {
    id: 'user_123',
    email: 'user@example.com',
    role: 'user'
  };
}

/**
 * Valida se o usuário tem permissão para acessar o recurso
 */
export function validateUserPermission(user: any, resource: string, action: string) {
  // Implementação básica de validação de permissão
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  
  // Aqui você implementaria a lógica de permissões real
  return true;
}

/**
 * Converte string para boolean
 */
export function parseBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
}

/**
 * Converte string para número
 */
export function parseNumber(value: string | number | undefined, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Valida se um valor está dentro de um range
 */
export function validateRange(value: number, min: number, max: number, fieldName: string) {
  if (value < min || value > max) {
    throw new Error(`${fieldName} deve estar entre ${min} e ${max}`);
  }
  return value;
}

/**
 * Valida se uma string tem o tamanho correto
 */
export function validateStringLength(str: string, min: number, max: number, fieldName: string) {
  if (str.length < min || str.length > max) {
    throw new Error(`${fieldName} deve ter entre ${min} e ${max} caracteres`);
  }
  return str;
}
