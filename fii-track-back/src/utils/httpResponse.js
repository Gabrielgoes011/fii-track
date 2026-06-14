import zlib from 'zlib';

/**
 * Classe utilitária para padronizar todas as respostas HTTP da API.
 *
 * ─── COMO USAR ───────────────────────────────────────────────────────────────
 *
 * 1) Importe no controller:
 *      import apiResponse from '../../utils/httpResponse.js';
 *
 * 2) Substitua os res.status(...).json(...) pelos métodos abaixo:
 *
 *   // ✅ SUCESSO — lista retornada (200)
 *   return apiResponse.success(res, 'Seguimentos listados com sucesso!', resultado.rows);
 *
 *   // ✅ SUCESSO DADO CRIADO — cadastro realizado (201)
 *   return apiResponse.success(res, 'Seguimento cadastrado com sucesso!', novoRegistro, 201);
 *
 *   // ❌ VALIDAÇÃO — campo vazio, formato inválido, regra de negócio (400)
 *   return apiResponse.validationError(res, 'O campo nome não pode ser vazio');
 *
 *   // ❌ DUPLICATA — registro já existe no banco (409)
 *   return apiResponse.conflict(res, 'Seguimento já cadastrado!');
 *
 *   // ❌ NÃO ENCONTRADO — id não existe no banco (404)
 *   return apiResponse.notFound(res, 'Seguimento não encontrado!');
 *
 *   // ❌ NÃO AUTENTICADO — token ausente ou inválido (401)
 *   return apiResponse.unauthorized(res);
 *
 *   // ❌ SEM PERMISSÃO — autenticado mas sem acesso (403)
 *   return apiResponse.forbidden(res);
 *
 *   // ❌ ERRO INTERNO — falha inesperada no servidor (500)
 *   return apiResponse.error(res, 'Erro ao listar seguimentos');
 *
 *   // ✅ SUCESSO COM GZIP — use em endpoints que retornam muitos dados
 *   return apiResponse.success(res, 'Operações listadas!', operacoes.rows, 200, true);
 *
 * ─── FORMATO DO JSON RETORNADO ───────────────────────────────────────────────
 *
 *   Sucesso:  { "success": true,  "message": "...", "data": ... }
 *   Erro:     { "success": false, "message": "..." }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 
 * 
 * exemplo de uso wms
 *       
        const dados = await dbCliente.request()
            .query(`
               query
            `);

        return apiResponse.success(
            res,
            "UAs recuperadas com sucesso.",
            { listaUAs: [].concat(dados.recordset) },
            201,
            true
        );

    } catch (error) {
        console.error("Erro ao listar UAs de Rg Volume:", error);

        return apiResponse.error(
            res,
            "Erro interno do servidor."
        );
    }
}
 */

class apiResponse {

    // ── SUCESSO ──────────────────────────────────────────────────────────────
    // status padrão 200. Para retorno de criação, passar status = 201.
    // gzip = true comprime o payload — use em endpoints com grandes volumes de dados.
    static success(res, message = 'Requisição bem-sucedida', data = null, status = 200, gzip = false) {
        if (gzip) {
            const payload = JSON.stringify({ success: true, message, data });
            zlib.gzip(Buffer.from(payload, 'utf-8'), (err, buffer) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Erro ao comprimir resposta' });
                }
                res.status(status)
                    .set({ 'Content-Encoding': 'gzip', 'Content-Type': 'application/json' })
                    .end(buffer);
            });
            return;
        }
        return res.status(status).json({ success: true, message, data });
    }

    // ── ERROS DO CLIENTE (4xx) ────────────────────────────────────────────────

    // Erro de validação — parâmetros incorretos ou faltantes (400)
    static validationError(res, message = 'Requisição inválida: parâmetros incorretos ou faltantes', data = null) {
        return res.status(400).json({ success: false, message, data });
    }

    // Não autenticado ou token inválido (401)
    static unauthorized(res, message = 'Não autenticado ou token inválido') {
        return res.status(401).json({ success: false, message });
    }

    // Autenticado, mas sem permissão para o recurso (403)
    static forbidden(res, message = 'Autenticado, mas sem permissão para o recurso') {
        return res.status(403).json({ success: false, message });
    }

    // Recurso não encontrado (404)
    static notFound(res, message = 'Recurso não encontrado') {
        return res.status(404).json({ success: false, message });
    }

    // Formato não suportado pelo servidor (406)
    static unacceptable(res, message = 'O servidor não pode retornar a representação no formato aceito pelo cliente') {
        return res.status(406).json({ success: false, message });
    }

    // Conflito com o estado atual do recurso, ex: duplicata (409)
    static conflict(res, message = 'Conflito com o estado atual do recurso') {
        return res.status(409).json({ success: false, message });
    }

    // ── ERRO GENÉRICO ─────────────────────────────────────────────────────────
    // Cobre tanto erros de cliente quanto de servidor dependendo do status passado.
    // Padrão: 500.
    static error(res, message = 'Erro inesperado no servidor', status = 500, data = null) {
        return res.status(status).json({ success: false, message, data });
    }
}

export default apiResponse;
