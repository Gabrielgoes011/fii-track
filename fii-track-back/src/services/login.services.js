import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { decryptText } from '../utils/crypto.js';
import {
    findUserByEmail,
    findUserCredentials
} from '../repositories/login.repositories.js';

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

    const senhaValida = await bcrypt.compare(password, credenciais.password);
    if (!senhaValida) {
        throw new Error('E-mail ou senha inválidos.');
    }

    let defaultPassword = [];
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

    const token = jwt.sign(
        {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            adm: credenciais.adm || false,
            defaultPassword: defaultPassword || false
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return {
        token,
        usuario: usuarioRetorno
    };
}

async function autenticarUsuarioCom2fa(email, password, codigo) {
    if (!email || !password || !codigo) {
        throw new Error('E-mail, senha e código 2FA são obrigatórios.');
    }

    const usuario = await findUserByEmail(email);
    if (!usuario) throw new Error('Email Não Cadastrado ou Incorreto.');

    if (usuario.ativo === false) {
        throw new Error('Usuário inativo. Entre em contato com o administrador.');
    }

    const credenciais = await findUserCredentials(usuario.id);
    if (!credenciais) {
        throw new Error('Senha não encontrada.');
    }

    const senhaValida = await bcrypt.compare(password, credenciais.password);
    if (!senhaValida) {
        throw new Error('E-mail ou senha inválidos.');
    }

    if (!credenciais.auth2faTotp || !credenciais.secretAuth2fa) {
        throw new Error('2FA não está ativado para este usuário.');
    }

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

    let defaultPassword = [];
    if (password === 'Track@123') {
        defaultPassword = true;
    }

    const token = jwt.sign(
        {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            adm: credenciais.adm || false,
            defaultPassword: defaultPassword || false
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return {
        token,
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

//#endregion

export {
    autenticarUsuario,
    autenticarUsuarioCom2fa
};