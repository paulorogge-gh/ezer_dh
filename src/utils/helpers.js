const { CPF_VALIDATION, CNPJ_VALIDATION, EMAIL_VALIDATION, PHONE_VALIDATION } = require('./constants');

// ==================================================
// Funções auxiliares gerais
// ==================================================

/**
 * Valida CPF
 * @param {string} cpf - CPF para validar
 * @returns {boolean} - True se válido
 */
function validarCPF(cpf) {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    const cleanCpf = cpf.replace(CPF_VALIDATION.CLEAN_REGEX, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
    
    // Validação do algoritmo do CPF
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cleanCpf.charAt(10))) return false;
    
    return true;
}

/**
 * Formata CPF
 * @param {string} cpf - CPF para formatar
 * @returns {string} - CPF formatado
 */
function formatarCPF(cpf) {
    if (!cpf) return '';
    const cleanCpf = cpf.replace(CPF_VALIDATION.CLEAN_REGEX, '');
    return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida CNPJ
 * @param {string} cnpj - CNPJ para validar
 * @returns {boolean} - True se válido
 */
function validarCNPJ(cnpj) {
    if (!cnpj) return false;
    
    // Remove caracteres não numéricos
    const cleanCnpj = cnpj.replace(CNPJ_VALIDATION.CLEAN_REGEX, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCnpj.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;
    
    // Validação do algoritmo do CNPJ
    let tamanho = cleanCnpj.length - 2;
    let numeros = cleanCnpj.substring(0, tamanho);
    let digitos = cleanCnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    tamanho = tamanho + 1;
    numeros = cleanCnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(1))) return false;
    
    return true;
}

/**
 * Formata CNPJ
 * @param {string} cnpj - CNPJ para formatar
 * @returns {string} - CNPJ formatado
 */
function formatarCNPJ(cnpj) {
    if (!cnpj) return '';
    const cleanCnpj = cnpj.replace(CNPJ_VALIDATION.CLEAN_REGEX, '');
    return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Valida email
 * @param {string} email - Email para validar
 * @returns {boolean} - True se válido
 */
function validarEmail(email) {
    if (!email) return false;
    return EMAIL_VALIDATION.REGEX.test(email);
}

/**
 * Valida telefone
 * @param {string} telefone - Telefone para validar
 * @returns {boolean} - True se válido
 */
function validarTelefone(telefone) {
    if (!telefone) return false;
    const cleanPhone = telefone.replace(PHONE_VALIDATION.CLEAN_REGEX, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

/**
 * Formata telefone
 * @param {string} telefone - Telefone para formatar
 * @returns {string} - Telefone formatado
 */
function formatarTelefone(telefone) {
    if (!telefone) return '';
    const cleanPhone = telefone.replace(PHONE_VALIDATION.CLEAN_REGEX, '');
    
    if (cleanPhone.length === 10) {
        return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 11) {
        return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
}

/**
 * Formata data para o formato brasileiro
 * @param {Date|string} data - Data para formatar
 * @returns {string} - Data formatada (DD/MM/YYYY)
 */
function formatarDataBR(data) {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
}

/**
 * Formata data para o formato ISO
 * @param {Date|string} data - Data para formatar
 * @returns {string} - Data formatada (YYYY-MM-DD)
 */
function formatarDataISO(data) {
    if (!data) return '';
    const date = new Date(data);
    return date.toISOString().split('T')[0];
}

/**
 * Calcula idade baseada na data de nascimento
 * @param {Date|string} dataNascimento - Data de nascimento
 * @returns {number} - Idade em anos
 */
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return 0;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    
    return idade;
}

/**
 * Gera string aleatória
 * @param {number} length - Tamanho da string
 * @returns {string} - String aleatória
 */
function gerarStringAleatoria(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Sanitiza string removendo caracteres especiais
 * @param {string} str - String para sanitizar
 * @returns {string} - String sanitizada
 */
function sanitizarString(str) {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '');
}

/**
 * Converte string para slug
 * @param {string} str - String para converter
 * @returns {string} - Slug
 */
function criarSlug(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

/**
 * Valida se uma data está no formato correto
 * @param {string} data - Data para validar
 * @returns {boolean} - True se válida
 */
function validarData(data) {
    if (!data) return false;
    const date = new Date(data);
    return date instanceof Date && !isNaN(date);
}

/**
 * Calcula diferença em dias entre duas datas
 * @param {Date|string} dataInicio - Data de início
 * @param {Date|string} dataFim - Data de fim
 * @returns {number} - Diferença em dias
 */
function calcularDiferencaDias(dataInicio, dataFim) {
    if (!dataInicio || !dataFim) return 0;
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = Math.abs(fim - inicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se uma data está vencida
 * @param {Date|string} data - Data para verificar
 * @returns {boolean} - True se vencida
 */
function isVencida(data) {
    if (!data) return false;
    const dataVencimento = new Date(data);
    const hoje = new Date();
    return dataVencimento < hoje;
}

/**
 * Verifica se uma data está próxima do vencimento (30 dias)
 * @param {Date|string} data - Data para verificar
 * @returns {boolean} - True se próxima do vencimento
 */
function isProximaVencimento(data) {
    if (!data) return false;
    const dataVencimento = new Date(data);
    const hoje = new Date();
    const trintaDias = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000));
    return dataVencimento >= hoje && dataVencimento <= trintaDias;
}

module.exports = {
    validarCPF,
    formatarCPF,
    validarCNPJ,
    formatarCNPJ,
    validarEmail,
    validarTelefone,
    formatarTelefone,
    formatarDataBR,
    formatarDataISO,
    calcularIdade,
    gerarStringAleatoria,
    sanitizarString,
    criarSlug,
    validarData,
    calcularDiferencaDias,
    isVencida,
    isProximaVencimento
};
