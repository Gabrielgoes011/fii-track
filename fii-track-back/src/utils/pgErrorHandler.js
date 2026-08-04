// src/utils/pgErrorHandler.js

const pgErrorMessages = {
    // ==========================================
    // CLASSE 23: VIOLAÇÕES DE INTEGRIDADE (Os mais comuns no dia a dia)
    // ==========================================
    '23505': 'Já existe um registro com estes dados informados.', // unique_violation (Ex: email repetido)
    '23503': 'Esta ação não é permitida porque o registro está vinculado a outra informação no sistema.', // foreign_key_violation (Ex: apagar fatura que tem movimentações)
    '23502': 'Um ou mais campos obrigatórios não foram preenchidos.', // not_null_violation (Ex: mandou nulo onde não podia)
    '23514': 'Os dados informados não cumprem as regras de validação do sistema.', // check_violation (Ex: valor negativo onde o banco só aceita positivo)
    
    // ==========================================
    // CLASSE 22: EXCEÇÕES DE DADOS (Erros de formatação e tamanho)
    // ==========================================
    '22001': 'O texto enviado excede o tamanho máximo permitido para o campo.', // string_data_right_truncation (Ex: mandou 300 caracteres num VARCHAR(255))
    '22003': 'O valor numérico informado é muito alto ou muito baixo para este campo.', // numeric_value_out_of_range (Ex: número gigantesco num campo INT normal)
    '22007': 'O formato de data ou hora informado é inválido.', // invalid_datetime_format
    '22008': 'O valor de data ou hora informado está fora dos limites aceitos.', // datetime_field_overflow
    '22P02': 'O formato de algum dado enviado é inválido.', // invalid_text_representation (Muito comum no Neon: mandar string 'abc' para um campo UUID)
    
    // ==========================================
    // CLASSE 08: ERROS DE CONEXÃO (Problemas de rede com o Neon)
    // ==========================================
    '08000': 'Não foi possível estabelecer conexão com o banco de dados no momento.', // connection_exception
    '08003': 'A conexão com o banco de dados foi perdida.', // connection_does_not_exist
    '08006': 'Falha na comunicação com o servidor de dados. Tente novamente.', // connection_failure
    
    // ==========================================
    // CLASSE 40: ERROS DE TRANSAÇÃO (Concorrência)
    // ==========================================
    '40P01': 'O sistema encontrou um conflito de processamento. Por favor, tente novamente.', // deadlock_detected (Dois processos tentaram atualizar a mesma coisa juntos)
    
    // ==========================================
    // CLASSE 42: ERROS DE SINTAXE E ACESSO (Erros de DEV)
    // ATENÇÃO: Aqui as mensagens devem ser BEM genéricas para não expor a arquitetura
    // ==========================================
    '42601': 'Erro interno no processamento da requisição.', // syntax_error (Você escreveu o SQL errado no backend)
    '42P01': 'Erro interno. Um recurso necessário não foi encontrado.', // undefined_table (Escreveu o nome da tabela errado)
    '42703': 'Erro interno de estruturação de dados.', // undefined_column (Escreveu o nome da coluna errado)
    
    // ==========================================
    // CLASSE 53: RECURSOS INSUFICIENTES (Gargalos no Servidor)
    // ==========================================
    '53300': 'O sistema está recebendo muitos acessos simultâneos no momento. Tente em instantes.', // too_many_connections (Excedeu o limite do plano do Neon)
    '53200': 'O servidor ficou sem memória para processar a requisição.', // out_of_memory
};
/**
 * Retorna uma mensagem de erro tratada para o usuário final.
 * 
 * @param {Object} error O objeto de erro capturado no catch.
 * @param {String} defaultMessage Mensagem genérica caso o erro não seja de banco.
 * @returns {String} A mensagem tratada e segura.
 */
function handleDbError(error, defaultMessage = 'Ocorreu um erro inesperado. Tente novamente mais tarde.') {

    // Se não for um erro de banco, retorna a mensagem padrão
    if (!error || !error.code) return defaultMessage;

    // 1. Procura se tem a mensagem exata mapeada no dicionário acima
    if (pgErrorMessages[error.code]) {

        //retorna a mensagem amigável para o usuário final
        return pgErrorMessages[error.code];
    }

    // 2. Se for qualquer outro erro genérico de conexão (começa com 08)
    if (error.code.startsWith('08')) {
        return 'O sistema está com instabilidade na conexão com o banco de dados. Tente novamente em alguns minutos.';
    }

    // 3. Se for erro interno de dev do SQL (começa com 42)
    if (error.code.startsWith('42')) {
        return 'Erro interno de processamento do sistema.';
    }

    // 4. Fallback: Retorna a sua mensagem padrão que você passou no Controller
    return defaultMessage;
}

export default handleDbError;
export { handleDbError };
