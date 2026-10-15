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

//#region => Logica  para login
async function autenticarUsuario(email, password) {

    //valida campos obrigatórios
    if (!email || !password) {
        throw new Error('E-mail e senha são obrigatórios.');
    }

    // 1. Buscar user no BD (chama repository)
    const usuario = await findUserByEmail(email);
    if (!usuario) throw new Error('Email Não Cadastrado ou Incorreto.');

    // 2. Buscar credenciais
    const credenciais = await findUserCredentials(usuario.id);

    // 2.5 Validar se usuário está ativo
    if (usuario.ativo === false) {
        throw new Error('Usuário inativo. Entre em contato com o administrador.');
    }

    // 3. Validar senha com bcrypt
    if (!credenciais) {
        throw new Error('Senha não encontrada.');
    }

    // [DIAGNÓSTICO TEMPORÁRIO] Remover depois de identificar a causa.
    // Não imprime a senha em claro — só o formato do hash e tamanhos.
    const hashArmazenado = credenciais.password;
    console.log('[LOGIN DEBUG]', {
        emailRecebido: email,
        tamanhoSenhaRecebida: typeof password === 'string' ? password.length : null,
        hashPrefixo: typeof hashArmazenado === 'string' ? hashArmazenado.slice(0, 7) : null,
        tamanhoHash: typeof hashArmazenado === 'string' ? hashArmazenado.length : null,
        pareceBcrypt: typeof hashArmazenado === 'string' && /^\$2[aby]\$\d{2}\$/.test(hashArmazenado),
    });

    const senhaValida = await bcrypt.compare(password, credenciais.password);
    if (!senhaValida) {
        throw new Error('E-mail ou senha inválidos.');
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

async function autenticarUsuarioCom2fa(email, password, codigo) {
    //valida campos obrigatórios
    if (!email || !password || !codigo) {
        throw new Error('E-mail, senha e código 2FA são obrigatórios.');
    }

    // 1. Buscar user no BD (chama repository)
    const usuario = await findUserByEmail(email);
    if (!usuario) throw new Error('Email Não Cadastrado ou Incorreto.');

    // 1.5 Validar se usuário está ativo
    if (usuario.ativo === false) {
        throw new Error('Usuário inativo. Entre em contato com o administrador.');
    }

    // 2. Buscar credenciais
    const credenciais = await findUserCredentials(usuario.id);
    if (!credenciais) {
        throw new Error('Senha não encontrada.');
    }

    // 3. Validar senha com bcrypt
    const senhaValida = await bcrypt.compare(password, credenciais.password);
    if (!senhaValida) {
        throw new Error('E-mail ou senha inválidos.');
    }

    // 4. Validar se o 2FA está mesmo ativado para este usuário
    if (!credenciais.auth2faTotp || !credenciais.secretAuth2fa) {
        throw new Error('2FA não está ativado para este usuário.');
    }

    // 5. Descriptografar o segredo e validar o código TOTP informado
    const secret = decryptText(credenciais.secretAuth2fa);
    const valid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: codigo,
        window: 1,
    });

    if (!valid) {
        throw new Error('Código 2FA inválido.');
    }

    let defaultPassword = false;
    if (password === 'Track@123') {
        defaultPassword = true;
    }

    // 6. Gera o access token JWT já com o 2FA validado + o refresh token
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
    if (!refreshToken) {
        throw new Error('Refresh token ausente.');
    }

    // 1. Verifica assinatura e expiração; jwt.verify lança se for inválido/expirado
    let payload;
    try {
        payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    // 2. Garante que é mesmo um refresh token (e não um access token reaproveitado)
    if (payload.type !== 'refresh' || !payload.id) {
        throw new Error('Refresh token inválido.');
    }

    // 3. Reconsulta o usuário para refletir o estado atual
    const usuario = await findUserById(payload.id);
    if (!usuario) {
        throw new Error('Usuário não encontrado.');
    }
    if (usuario.ativo === false) {
        throw new Error('Usuário inativo. Entre em contato com o administrador.');
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