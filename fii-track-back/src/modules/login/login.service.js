import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { encryptText, decryptText } from '../../utils/crypto.js';
import {
    findUserByEmail,
    findUserById,
    findUserCredentials,
    findCredentialsByUserId,
    updateCredentials2fa
} from './login.repositories.js';

const APP_NAME = process.env.APP_NAME || 'FII-TRACK';

// Durações dos tokens.
// - Access token: vida curta, autoriza as requisições (estilo bancário).
// - Refresh token: vida mais longa, só serve para emitir um novo access token
//   sem pedir senha. Define a duração máxima da sessão.
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '8h';

// Gera o access token (JWT) com os dados do usuário usados pela aplicação.
function gerarAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

// Gera o refresh token. É um JWT separado, marcado com type: 'refresh', carregando
// apenas o id do usuário — o mínimo necessário para reidentificá-lo na renovação.
function gerarRefreshToken(usuarioId) {
    return jwt.sign(
        { id: usuarioId, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES }
    );
}

// mensagem única para e-mail inexistente e senha errada: não revela quais e-mails têm conta
const MENSAGEM_CREDENCIAIS_INVALIDAS = 'E-mail ou senha incorretos. Confira e tente de novo.';

//#region => erro previsto do login
// monta um erro com o status http e o motivo técnico (só vai para o log, nunca para a tela)
function _erroLogin(mensagem, status, motivo) {
    const erro = new Error(mensagem);
    erro.status = status;
    erro.motivo = motivo || mensagem;
    return erro;
}
//#endregion

//#region => Logica  para login
async function autenticarUsuario(emailRecebido, password) {
    //tira espaços que vêm de copiar e colar
    const email = typeof emailRecebido === 'string' ? emailRecebido.trim() : emailRecebido;

    //valida campos obrigatórios
    if (!email || !password) {
        throw _erroLogin('Informe o e-mail e a senha.', 400);
    }

    // 1. Buscar user no BD (chama repository)
    const usuario = await findUserByEmail(email);
    if (!usuario) {
        throw _erroLogin(MENSAGEM_CREDENCIAIS_INVALIDAS, 401, `e-mail não cadastrado: ${email}`);
    }

    // 2. Validar se usuário está ativo
    if (usuario.ativo === false) {
        throw _erroLogin('Seu usuário está inativo. Fale com o administrador.', 403, `usuário inativo: ${email}`);
    }

    // 3. Buscar credenciais (sem elas não há senha para comparar)
    const credenciais = await findUserCredentials(usuario.id);
    if (!credenciais || !credenciais.password) {
        throw _erroLogin(MENSAGEM_CREDENCIAIS_INVALIDAS, 401, `usuário sem senha cadastrada: ${email}`);
    }

    // 4. Validar senha com bcrypt
    const senhaValida = await bcrypt.compare(password, credenciais.password);
    if (!senhaValida) {
        throw _erroLogin(MENSAGEM_CREDENCIAIS_INVALIDAS, 401, `senha incorreta: ${email}`);
    }

    let defaultPassword = false;
    if (password === 'Track@123') {
        defaultPassword = true;
    }

    const usuarioRetorno = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        adm: credenciais.adm || false,
        defaultPassword: defaultPassword || false,
        auth2faTotp: !!credenciais.auth2faTotp,
    };

    if (credenciais.auth2faTotp) {
        return {
            requires2fa: true,
            usuario: usuarioRetorno,
        };
    }

    const token = gerarAccessToken({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        adm: credenciais.adm || false,
        defaultPassword: defaultPassword || false
    });

    const refreshToken = gerarRefreshToken(usuario.id);

    return {
        token,
        refreshToken,
        usuario: usuarioRetorno
    };
}

async function autenticarUsuarioCom2fa(emailRecebido, password, codigoRecebido) {
    //tira espaços do e-mail e qualquer coisa que não seja número do código ("123 456" vira "123456")
    const email = typeof emailRecebido === 'string' ? emailRecebido.trim() : emailRecebido;
    const codigo = String(codigoRecebido ?? '').replace(/\D/g, '');

    //valida campos obrigatórios
    if (!email || !password) {
        throw _erroLogin('Informe o e-mail e a senha.', 400);
    }
    if (!codigo) {
        throw _erroLogin('Informe o código de 6 dígitos do app autenticador.', 400);
    }

    //o código do app autenticador tem sempre 6 números
    if (codigo.length !== 6) {
        throw _erroLogin('O código 2FA tem 6 números. Confira e tente de novo.', 400);
    }

    // 1. Buscar user no BD (chama repository)
    const usuario = await findUserByEmail(email);
    if (!usuario) {
        throw _erroLogin(MENSAGEM_CREDENCIAIS_INVALIDAS, 401, `e-mail não cadastrado: ${email}`);
    }

    // 2. Validar se usuário está ativo
    if (usuario.ativo === false) {
        throw _erroLogin('Seu usuário está inativo. Fale com o administrador.', 403, `usuário inativo: ${email}`);
    }

    // 3. Buscar credenciais (sem elas não há senha para comparar)
    const credenciais = await findUserCredentials(usuario.id);
    if (!credenciais || !credenciais.password) {
        throw _erroLogin(MENSAGEM_CREDENCIAIS_INVALIDAS, 401, `usuário sem senha cadastrada: ${email}`);
    }

    // 4. Validar senha com bcrypt
    const senhaValida = await bcrypt.compare(password, credenciais.password);
    if (!senhaValida) {
        throw _erroLogin(MENSAGEM_CREDENCIAIS_INVALIDAS, 401, `senha incorreta: ${email}`);
    }

    // 5. Validar se o 2FA está mesmo ativado para este usuário
    if (!credenciais.auth2faTotp || !credenciais.secretAuth2fa) {
        throw _erroLogin('Seu usuário não usa verificação em duas etapas. Entre só com e-mail e senha.', 400, `2FA desativado: ${email}`);
    }

    // 6. Descriptografar o segredo (falha aqui = chave TOTP_ENCRYPTION_KEY/JWT_SECRET do servidor mudou)
    let secret;
    try {
        secret = decryptText(credenciais.secretAuth2fa);
    } catch {
        secret = null;
    }
    if (!secret) {
        throw _erroLogin(
            'Não foi possível validar o código 2FA no servidor. Fale com o administrador.',
            500,
            `segredo 2FA não descriptografa (TOTP_ENCRYPTION_KEY ou JWT_SECRET mudou?): ${email}`
        );
    }

    // 7. Validar o código TOTP (aceita o código anterior e o próximo, 30s para cada lado)
    const valid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: codigo,
        window: 1,
    });

    if (!valid) {
        // Diagnóstico SÓ para o log (nunca vai para a tela, não grava segredo nem o código digitado):
        // procura o código em até 10 períodos de 30s para cada lado.
        //  - achou com diferença: o segredo está certo, o problema é horário (celular ou servidor) ou o código foi digitado tarde
        //  - não achou: o segredo do app é OUTRO (entrada antiga no autenticador, 2FA refeito, ou banco diferente)
        const achado = speakeasy.totp.verifyDelta({ secret, encoding: 'base32', token: codigo, window: 10 });
        const diagnostico = achado
            ? `o código vale para outro período (${achado.delta * 30}s de diferença): horário do celular/servidor ou código digitado tarde`
            : 'o código não bate em nenhum período próximo: o segredo do app é diferente do salvo no banco';
        throw _erroLogin(
            'Código 2FA incorreto ou expirado. Digite o código que aparece agora no app autenticador.',
            401,
            `código 2FA recusado (${diagnostico}; hora do servidor ${new Date().toISOString()}): ${email}`
        );
    }

    let defaultPassword = false;
    if (password === 'Track@123') {
        defaultPassword = true;
    }

    // 8. Gera o access token JWT já com o 2FA validado + o refresh token
    const token = gerarAccessToken({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        adm: credenciais.adm || false,
        defaultPassword: defaultPassword || false
    });

    const refreshToken = gerarRefreshToken(usuario.id);

    return {
        token,
        refreshToken,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            adm: credenciais.adm || false,
            defaultPassword: defaultPassword || false,
            auth2faTotp: !!credenciais.auth2faTotp,
        }
    };
}

// Retorna os dados do usuário logado a partir do id contido no token.
// Reconsulta o banco para que o campo "adm" reflita o estado atual (ex.: se o
// usuário foi rebaixado, o front deixa de exibir o painel sem esperar o token expirar).
async function obterUsuarioLogado(usuarioId) {
    // 1. Buscar dados básicos do usuário
    const usuario = await findUserById(usuarioId);
    if (!usuario) {
        throw new Error('Usuário não encontrado.');
    }

    // 2. Usuário desativado após o login não deve continuar operando
    if (usuario.ativo === false) {
        throw new Error('Usuário inativo. Entre em contato com o administrador.');
    }

    // 3. Buscar credenciais para saber o papel (adm) e o estado do 2FA atuais
    const credenciais = await findUserCredentials(usuarioId);

    return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        adm: credenciais?.adm || false,
        auth2faTotp: !!credenciais?.auth2faTotp,
    };
}

// Valida um refresh token e emite um novo access token.
// Reconsulta o usuário no banco para que o novo access token reflita o estado
// atual (ex.: usuário rebaixado de admin ou desativado deixa de ter acesso).
async function renovarAccessToken(refreshToken) {
    // todos os erros abaixo são previstos (sessão vencida, cookie ausente...): status 401 e motivo só para o log
    if (!refreshToken) {
        throw _erroLogin('Sessão expirada. Faça login novamente.', 401, 'refresh token ausente (sem cookie)');
    }

    // 1. Verifica assinatura e expiração; jwt.verify lança se for inválido/expirado
    let payload;
    try {
        payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
        throw _erroLogin('Sessão expirada. Faça login novamente.', 401, 'refresh token expirado ou com assinatura inválida');
    }

    // 2. Garante que é mesmo um refresh token (e não um access token reaproveitado)
    if (payload.type !== 'refresh' || !payload.id) {
        throw _erroLogin('Sessão inválida. Faça login novamente.', 401, 'token apresentado não é um refresh token');
    }

    // 3. Reconsulta o usuário para refletir o estado atual
    const usuario = await findUserById(payload.id);
    if (!usuario) {
        throw _erroLogin('Sessão inválida. Faça login novamente.', 401, `usuário do refresh token não existe mais: ${payload.id}`);
    }
    if (usuario.ativo === false) {
        throw _erroLogin('Seu usuário está inativo. Fale com o administrador.', 401, `usuário inativo tentou renovar sessão: ${payload.id}`);
    }

    const credenciais = await findUserCredentials(payload.id);

    // 4. Emite um novo access token com os dados atualizados
    const token = gerarAccessToken({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        adm: credenciais?.adm || false,
        defaultPassword: false
    });

    return {
        token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            adm: credenciais?.adm || false,
            auth2faTotp: !!credenciais?.auth2faTotp,
        }
    };
}

//#endregion

//#region => Logica para 2FA
async function iniciar2faService(usuarioId) {
    // 1. Buscar credenciais + email do usuário (chama repository)
    const credenciais = await findCredentialsByUserId(usuarioId);
    if (!credenciais) {
        throw new Error('Credenciais do usuário não encontradas.');
    }

    // 2. Não deixa gerar um novo segredo se o 2FA já estiver ativo
    if (credenciais.auth2faTotp) {
        throw new Error('2FA já está ativado para este usuário.');
    }

    // 3. Gera o segredo TOTP identificado pelo app + email do usuário
    const secret = speakeasy.generateSecret({
        name: `${APP_NAME}:${credenciais.email}`,
        issuer: APP_NAME,
        length: 20,
    });

    // 4. Criptografa o segredo antes de persistir e monta o QR code
    const encryptedSecret = encryptText(secret.base32);
    const otpAuthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // 5. Salva o segredo, mas mantém o 2FA desativado até a confirmação
    await updateCredentials2fa(usuarioId, {
        secretAuth2fa: encryptedSecret,
        auth2faTotp: false,
        auth2faHabilitado: false,
    });

    // 6. Retorna o QR code para o front exibir e o segredo em texto (fallback manual)
    return {
        qrCodeDataUrl,
        secretBase32: secret.base32,
    };
}

async function confirmar2faService(usuarioId, codigo) {
    // 1. Buscar credenciais + segredo salvo na etapa de iniciar2fa
    const credenciais = await findCredentialsByUserId(usuarioId);
    if (!credenciais) {
        throw new Error('Credenciais do usuário não encontradas.');
    }

    // 2. Descriptografar o segredo
    const secret = decryptText(credenciais.secretAuth2fa);
    if (!secret) {
        throw new Error('Segredo de 2FA não encontrado. Ative antes de confirmar.');
    }

    // 3. Validar o código TOTP informado pelo usuário
    const valid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: codigo,
        window: 1,
    });

    if (!valid) {
        throw new Error('Código inválido. Verifique o app do autenticador.');
    }

    // 4. Código correto: ativa o 2FA de fato
    await updateCredentials2fa(usuarioId, {
        auth2faTotp: true,
        auth2faHabilitado: true,
    });

    return { auth2faTotp: true };
}

async function desativar2faService(usuarioId) {
    // 1. Buscar credenciais do usuário
    const credenciais = await findCredentialsByUserId(usuarioId);
    if (!credenciais) {
        throw new Error('Credenciais do usuário não encontradas.');
    }

    // 2. Desativa o 2FA e apaga o segredo salvo
    await updateCredentials2fa(usuarioId, {
        secretAuth2fa: null,
        auth2faTotp: false,
        auth2faHabilitado: false,
    });

    return { auth2faTotp: false };
}

async function validarCodigo2faService(usuarioId, codigo) {
    // 1. Buscar credenciais e garantir que o 2FA está ativo
    const credenciais = await findCredentialsByUserId(usuarioId);
    if (!credenciais || !credenciais.auth2faTotp) {
        throw new Error('2FA não está ativado para este usuário.');
    }

    // 2. Descriptografar o segredo
    const secret = decryptText(credenciais.secretAuth2fa);
    if (!secret) {
        throw new Error('Segredo de 2FA inválido.');
    }

    // 3. Validar o código TOTP informado
    const valid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: codigo,
        window: 1,
    });

    if (!valid) {
        throw new Error('Código inválido. Verifique o app do autenticador.');
    }

    return { valid: true };
}
//#endregion

export {
    autenticarUsuario,
    autenticarUsuarioCom2fa,
    obterUsuarioLogado,
    renovarAccessToken,
    iniciar2faService,
    confirmar2faService,
    desativar2faService,
    validarCodigo2faService
};