/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 * @param value Valor a ser formatado
 * @returns String formatada como moeda
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param date Data a ser formatada
 * @returns String formatada como data
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

/**
 * Formata uma competência (YYYY-MM) para o formato brasileiro (MM/YYYY)
 * @param competencia Competência no formato YYYY-MM
 * @returns String formatada como competência
 */
export const formatCompetencia = (competencia: string): string => {
  const [ano, mes] = competencia.split('-');
  return `${mes}/${ano}`;
};

/**
 * Formata um CPF para o formato XXX.XXX.XXX-XX
 * @param cpf CPF sem formatação
 * @returns CPF formatado
 */
export const formatCPF = (cpf: string): string => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Aplica a máscara
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata um NIT/PIS para o formato XXX.XXXXX.XX-X
 * @param nit NIT/PIS sem formatação
 * @returns NIT/PIS formatado
 */
export const formatNIT = (nit: string): string => {
  // Remove caracteres não numéricos
  const cleanNIT = nit.replace(/\D/g, '');
  
  // Aplica a máscara
  return cleanNIT.replace(/(\d{3})(\d{5})(\d{2})(\d{1})/, '$1.$2.$3-$4');
};
