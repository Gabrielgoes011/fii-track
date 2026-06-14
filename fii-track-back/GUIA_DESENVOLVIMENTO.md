# 📚 Guia de Desenvolvimento - FIITrack Backend (Node.js)

Documentação completa sobre como implementar endpoints, usar utilitários, middlewares e a arquitetura da API.

---

## 📑 Sumário

1. [Arquitetura da API](#arquitetura-da-api)
2. [Utilitários](#utilitários)
3. [Middlewares](#middlewares)
4. [Padrão de Rotas](#padrão-de-rotas)
5. [Controllers](#controllers)
6. [Services](#services)
7. [Repositories](#repositories)
8. [Boas Práticas](#boas-práticas)
9. [Exemplos Práticos](#exemplos-práticos)

---

## 🏗️ Arquitetura da API

A API segue o padrão **MVC + Services + Repositories**:

```
Requisição HTTP
    ↓
  Router (routes/)
    ↓
  Middleware (auth, validação)
    ↓
  Controller (controllers/)
    ↓
  Service (services/)
    ↓
  Repository (repositories/)
    ↓
  Database
    ↓
Resposta JSON (apiResponse)
```

### Estrutura de Pastas

```
src/
├── app.js                    # Configuração main do Express
├── config/
│   ├── configDb.js          # Pool de conexão PostgreSQL
│   ├── env.js               # Variáveis de ambiente
│   └── s3.js                # Configuração AWS S3
├── controllers/
│   ├── home.controller.js
│   ├── login.controller.js
│   └── cadastros/
│       ├── usuario.controller.js
│       └── seguimentos.controller.js
├── middleware/
│   └── auth/
│       └── verificaJWT.js   # Middleware de autenticação
├── repositories/
│   ├── home.repositories.js
│   └── cadastros/
│       └── usuarios.repositories.js
├── routes/
│   ├── usuarios.routes.js
│   └── auth/
│       └── auth.routes.js
├── services/
│   ├── home.services.js
│   └── cadastros/
│       └── usuarios.services.js
└── utils/
    ├── dateUtils.js         # Formatação de datas
    ├── httpResponse.js      # Padronização de respostas
    └── validaUser.js        # Validação de usuários
```

---

## 🔧 Utilitários

### `httpResponse.js` - Padronização de Respostas HTTP

Classe centralizada para retornar respostas HTTP padronizadas em toda a API.

#### **Estrutura de Resposta**

```javascript
// ✅ Sucesso
{
  "success": true,
  "message": "Descrição da ação",
  "data": { /* dados retornados */ }
}

// ❌ Erro
{
  "success": false,
  "message": "Descrição do erro"
}
```

#### **Métodos Disponíveis**

##### **`success(res, message, data?, statusCode?, useGzip?)`**

Retorna resposta de sucesso (2xx).

```javascript
import apiResponse from '../../utils/httpResponse.js';

// Simples
apiResponse.success(res, 'Listagem realizada!', usuarios);

// Com status customizado (201 para created)
apiResponse.success(res, 'Usuário criado!', novoUsuario, 201);

// Com compressão GZIP (para grandes volumes)
apiResponse.success(res, 'Operações listadas!', operacoes.rows, 200, true);
```

**Parâmetros:**
- `res` - Express response object
- `message` (string) - Mensagem de sucesso
- `data` (any, opcional) - Dados a retornar
- `statusCode` (number, padrão: 200) - Status HTTP
- `useGzip` (boolean, padrão: false) - Comprimir resposta

**Status Sugeridos:**
- `200` - GET, PUT (sucesso geral)
- `201` - POST (recurso criado)
- `204` - DELETE, respostas sem conteúdo

---

##### **`validationError(res, message)`**

Erro de validação (400 Bad Request).

```javascript
if (!nome || nome.trim() === '') {
  return apiResponse.validationError(res, 'O campo nome é obrigatório');
}
```

**Uso Comum:**
- Campo vazio ou nulo
- Formato inválido (email, CPF, etc)
- Validação de regra de negócio

---

##### **`conflict(res, message)`**

Conflito/Duplicata (409 Conflict).

```javascript
const usuarioExistente = await usuariosRepository.buscarPorEmail(email);
if (usuarioExistente) {
  return apiResponse.conflict(res, 'Email já cadastrado!');
}
```

**Uso Comum:**
- Email/CPF já cadastrado
- Código duplicado

---

##### **`notFound(res, message)`**

Recurso não encontrado (404 Not Found).

```javascript
const usuario = await usuariosRepository.buscarPorId(id);
if (!usuario) {
  return apiResponse.notFound(res, 'Usuário não encontrado!');
}
```

---

##### **`unauthorized(res, message?)`**

Token ausente ou inválido (401 Unauthorized).

```javascript
if (!token) {
  return apiResponse.unauthorized(res, 'Token ausente');
}
```

---

##### **`forbidden(res, message?)`**

Acesso negado (403 Forbidden).

```javascript
if (usuarioId !== idLogado) {
  return apiResponse.forbidden(res, 'Você não pode acessar este recurso');
}
```

---

##### **`error(res, message, statusCode?)`**

Erro genérico do servidor (500).

```javascript
try {
  // ...
} catch (error) {
  return apiResponse.error(res, 'Erro ao processar requisição');
}
```

---

### `dateUtils.js` - Utilitários de Data

```javascript
import { formatarData, adicionarDias } from '../../utils/dateUtils.js';

// Formatar data
const dataFormatada = formatarData(new Date()); // DD/MM/YYYY

// Adicionar dias
const dataPlusUm = adicionarDias(new Date(), 1);
```

---

### `validaUser.js` - Validação de Usuários

```javascript
import validaUser from '../../utils/validaUser.js';

// Validar email
if (!validaUser.isValidEmail(email)) {
  return apiResponse.validationError(res, 'Email inválido');
}

// Validar CPF
if (!validaUser.isValidCPF(cpf)) {
  return apiResponse.validationError(res, 'CPF inválido');
}

// Validar senha
if (!validaUser.isValidPassword(password)) {
  return apiResponse.validationError(res, 'Senha fraca');
}
```

---

## 🔐 Middlewares

### `verificaJWT.js` - Autenticação

Middleware que valida o token JWT em requisições protegidas.

#### Uso

```javascript
import verificaJWT from '../middleware/auth/verificaJWT.js';

router.get('/dados-protegidos', verificaJWT, minhaFuncaoController);
```

#### Como Funciona

1. Verifica presença do header `Authorization: Bearer {token}`
2. Valida assinatura do token
3. Se válido: continua para o controller
4. Se inválido: retorna 401

#### No Controller

```javascript
async function meusController(req, res) {
  // req.user contém os dados do token
  const { id, email } = req.user;
  
  // ...
}
```

#### Implementação

```javascript
router.post('/usuarios', verificaJWT, cadastrarUser);
router.get('/usuarios', verificaJWT, listarUsuarios);
router.put('/usuarios/:id', verificaJWT, atualizarUser);
router.delete('/usuarios/:id', verificaJWT, deleteUser);
```

---

## 🛣️ Padrão de Rotas

### Estrutura de Arquivo de Rota

```javascript
import express from 'express';
import verificaJWT from '../middleware/auth/verificaJWT.js';
import {
  listarUsuarios,
  cadastrarUser,
  atualizarUser,
  deleteUser,
  contarUsuarios
} from '../controllers/cadastros/usuario.controller.js';

const router = express.Router();

// GET — Listar (protegido)
router.get('/usuarios', verificaJWT, listarUsuarios);
//   → Chamada: GET /usuarios
//   → Esperado: Array de usuários
//   → Status: 200

// GET — Contar (protegido)
router.get('/usuarios/dash/count', verificaJWT, contarUsuarios);
//   → Chamada: GET /usuarios/dash/count
//   → Esperado: { ativos: 5, inativos: 2, total: 7 }
//   → Status: 200

// POST — Criar (protegido)
router.post('/usuario/cadastrar', verificaJWT, cadastrarUser);
//   → Chamada: POST /usuario/cadastrar
//   → Body: { nome, email, password, cpf }
//   → Esperado: Novo usuário criado
//   → Status: 201

// PUT — Atualizar (protegido)
router.put('/usuarios/update/:id', verificaJWT, atualizarUser);
//   → Chamada: PUT /usuarios/update/123
//   → Body: { nome, email, ... campos a atualizar }
//   → Esperado: Usuário atualizado
//   → Status: 200

// DELETE — Deletar (protegido)
router.delete('/usuarios/delete/:id', verificaJWT, deleteUser);
//   → Chamada: DELETE /usuarios/delete/123
//   → Esperado: Confirmação de deleção
//   → Status: 204

export default router;
```

### Convenções de Nomes

| Método | Padrão | Exemplo | Status |
|--------|--------|---------|--------|
| GET (listar) | `/recurso` | `/usuarios` | 200 |
| GET (contar) | `/recurso/dash/count` | `/usuarios/dash/count` | 200 |
| POST (criar) | `/recurso/cadastrar` | `/usuario/cadastrar` | 201 |
| PUT (atualizar) | `/recurso/update/:id` | `/usuarios/update/123` | 200 |
| DELETE (deletar) | `/recurso/delete/:id` | `/usuarios/delete/123` | 204 |

---

## 🎮 Controllers

Controllers recebem as requisições e coordenam a lógica.

### Estrutura de um Controller

```javascript
import apiResponse from '../../utils/httpResponse.js';
import * as usuariosService from '../../services/cadastros/usuarios.services.js';

// GET — Listar
export async function listarUsuarios(req, res) {
  try {
    const { status = 'on' } = req.query; // Pega query params
    
    // Chama o service
    const resultado = await usuariosService.listarTodos(status);
    
    // Retorna resposta padronizada
    return apiResponse.success(
      res,
      'Usuários listados com sucesso!',
      resultado.rows,
      200,
      false
    );
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return apiResponse.error(res, 'Erro ao listar usuários');
  }
}

// POST — Criar
export async function cadastrarUser(req, res) {
  try {
    const { nome, email, password, cpf } = req.body;
    
    // Validação
    if (!nome || !email || !password || !cpf) {
      return apiResponse.validationError(
        res,
        'Nome, email, senha e CPF são obrigatórios'
      );
    }
    
    // Verifica duplicata
    const usuarioExistente = await usuariosService.buscarPorEmail(email);
    if (usuarioExistente) {
      return apiResponse.conflict(res, 'Email já cadastrado!');
    }
    
    // Cria usuário
    const novoUsuario = await usuariosService.criarUsuario({
      nome,
      email,
      password,
      cpf
    });
    
    // Retorna com status 201 (Created)
    return apiResponse.success(
      res,
      'Usuário cadastrado com sucesso!',
      novoUsuario,
      201
    );
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return apiResponse.error(res, 'Erro ao cadastrar usuário');
  }
}

// PUT — Atualizar
export async function atualizarUser(req, res) {
  try {
    const { id } = req.params;
    const { nome, email } = req.body;
    
    // Verifica existência
    const usuario = await usuariosService.buscarPorId(id);
    if (!usuario) {
      return apiResponse.notFound(res, 'Usuário não encontrado!');
    }
    
    // Atualiza
    const usuarioAtualizado = await usuariosService.atualizar(id, {
      nome,
      email
    });
    
    return apiResponse.success(
      res,
      'Usuário atualizado com sucesso!',
      usuarioAtualizado
    );
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return apiResponse.error(res, 'Erro ao atualizar usuário');
  }
}

// DELETE — Deletar
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    // Verifica existência
    const usuario = await usuariosService.buscarPorId(id);
    if (!usuario) {
      return apiResponse.notFound(res, 'Usuário não encontrado!');
    }
    
    // Deleta
    await usuariosService.deletar(id);
    
    // Status 204 No Content (sem corpo)
    return apiResponse.success(
      res,
      'Usuário deletado com sucesso!',
      null,
      204
    );
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return apiResponse.error(res, 'Erro ao deletar usuário');
  }
}
```

---

## ⚙️ Services

Services contêm a lógica de negócio.

### Estrutura de um Service

```javascript
import * as usuariosRepository from '../../repositories/cadastros/usuarios.repositories.js';
import bcrypt from 'bcrypt';

// Listar todos
export async function listarTodos(status = 'on') {
  try {
    const query = `
      SELECT id, nome, email, cpf, data_cadastro 
      FROM usuarios 
      WHERE ativo = $1
      ORDER BY nome ASC
    `;
    
    const valor = status === 'on' ? true : false;
    return await usuariosRepository.executar(query, [valor]);
  } catch (error) {
    throw new Error(`Erro ao listar usuários: ${error.message}`);
  }
}

// Buscar por ID
export async function buscarPorId(id) {
  try {
    const query = 'SELECT * FROM usuarios WHERE id = $1';
    const resultado = await usuariosRepository.executarUm(query, [id]);
    return resultado;
  } catch (error) {
    throw new Error(`Erro ao buscar usuário: ${error.message}`);
  }
}

// Buscar por Email
export async function buscarPorEmail(email) {
  try {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    return await usuariosRepository.executarUm(query, [email]);
  } catch (error) {
    throw new Error(`Erro ao buscar email: ${error.message}`);
  }
}

// Criar usuário
export async function criarUsuario({ nome, email, password, cpf }) {
  try {
    // Hash da senha
    const senhaHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO usuarios (nome, email, password, cpf, ativo, data_cadastro)
      VALUES ($1, $2, $3, $4, true, NOW())
      RETURNING id, nome, email, cpf, data_cadastro
    `;
    
    return await usuariosRepository.executarUm(query, [
      nome,
      email,
      senhaHash,
      cpf
    ]);
  } catch (error) {
    throw new Error(`Erro ao criar usuário: ${error.message}`);
  }
}

// Atualizar usuário
export async function atualizar(id, { nome, email }) {
  try {
    const query = `
      UPDATE usuarios 
      SET nome = COALESCE($1, nome),
          email = COALESCE($2, email),
          data_atualizacao = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    return await usuariosRepository.executarUm(query, [nome, email, id]);
  } catch (error) {
    throw new Error(`Erro ao atualizar usuário: ${error.message}`);
  }
}

// Deletar usuário
export async function deletar(id) {
  try {
    const query = 'DELETE FROM usuarios WHERE id = $1';
    return await usuariosRepository.executar(query, [id]);
  } catch (error) {
    throw new Error(`Erro ao deletar usuário: ${error.message}`);
  }
}

// Contar usuários
export async function contar() {
  try {
    const query = `
      SELECT 
        SUM(CASE WHEN ativo = true THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN ativo = false THEN 1 ELSE 0 END) as inativos,
        COUNT(*) as total
      FROM usuarios
    `;
    return await usuariosRepository.executarUm(query, []);
  } catch (error) {
    throw new Error(`Erro ao contar usuários: ${error.message}`);
  }
}
```

---

## 💾 Repositories

Repositories lidam com banco de dados diretamente.

### Estrutura de um Repository

```javascript
import db from '../../config/configDb.js';

// Executar query com múltiplos resultados
export async function executar(query, valores = []) {
  try {
    const resultado = await db.query(query, valores);
    return resultado;
  } catch (error) {
    console.error('Erro na query:', query);
    console.error('Valores:', valores);
    throw error;
  }
}

// Executar query com um único resultado
export async function executarUm(query, valores = []) {
  try {
    const resultado = await db.query(query, valores);
    return resultado.rows[0] || null;
  } catch (error) {
    console.error('Erro na query:', query);
    console.error('Valores:', valores);
    throw error;
  }
}
```

### Exemplo de Uso

```javascript
// Services chamam os repositories
import * as usuariosRepository from './usuarios.repositories.js';

export async function listarTodos(status) {
  const query = 'SELECT * FROM usuarios WHERE ativo = $1';
  return await usuariosRepository.executar(query, [status === 'on']);
}
```

---

## ✅ Boas Práticas

### 1. **Estrutura de Resposta Padronizada**

Sempre use `apiResponse`:

```javascript
// ✅ BOM
return apiResponse.success(res, 'Sucesso!', dados);

// ❌ RUIM
res.json({ sucesso: true, dados });
```

---

### 2. **Tratamento de Erros**

Use try/catch em todos os controllers:

```javascript
// ✅ BOM
try {
  const resultado = await service.fazer();
  return apiResponse.success(res, 'OK', resultado);
} catch (error) {
  console.error('Erro:', error);
  return apiResponse.error(res, 'Erro ao fazer operação');
}

// ❌ RUIM
const resultado = await service.fazer();
res.json(resultado);
```

---

### 3. **Validações no Controller**

Validações rápidas devem estar no controller:

```javascript
// ✅ BOM
if (!email || !email.includes('@')) {
  return apiResponse.validationError(res, 'Email inválido');
}

// ❌ RUIM (deixar passar sem validar)
```

---

### 4. **Lógica de Negócio no Service**

Service contém a lógica, controller apenas coordena:

```javascript
// ❌ RUIM (lógica no controller)
export async function cadastrar(req, res) {
  const senhaHash = bcrypt.hash(req.body.senha, 10);
  const email = req.body.email.toLowerCase();
  const usuario = new Usuario({ ...req.body, senhaHash, email });
  await usuario.save();
}

// ✅ BOM (lógica no service)
// Controller
export async function cadastrar(req, res) {
  try {
    const usuario = await usuarioService.criar(req.body);
    return apiResponse.success(res, 'Criado!', usuario, 201);
  } catch (error) {
    return apiResponse.error(res, error.message);
  }
}

// Service
export async function criar(dados) {
  const senhaHash = await bcrypt.hash(dados.senha, 10);
  const email = dados.email.toLowerCase();
  return await usuarioRepository.criar({ ...dados, senhaHash, email });
}
```

---

### 5. **Queries Parametrizadas**

Sempre use placeholders ($1, $2) para evitar SQL injection:

```javascript
// ✅ BOM
const query = 'SELECT * FROM usuarios WHERE email = $1';
db.query(query, [email]);

// ❌ RUIM (SQL Injection)
const query = `SELECT * FROM usuarios WHERE email = '${email}'`;
db.query(query);
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Endpoint GET Simples

Criar endpoint para listar seguimentos:

**routes/seguimentos.routes.js:**
```javascript
import express from 'express';
import verificaJWT from '../middleware/auth/verificaJWT.js';
import { listarSeguimentos } from '../controllers/cadastros/seguimentos.controller.js';

const router = express.Router();

router.get('/seguimentos', verificaJWT, listarSeguimentos);

export default router;
```

**controllers/cadastros/seguimentos.controller.js:**
```javascript
import apiResponse from '../../utils/httpResponse.js';
import * as seguimentosService from '../../services/cadastros/seguimentos.services.js';

export async function listarSeguimentos(req, res) {
  try {
    const resultado = await seguimentosService.listarTodos();
    return apiResponse.success(
      res,
      'Seguimentos listados com sucesso!',
      resultado.rows
    );
  } catch (error) {
    console.error('Erro ao listar:', error);
    return apiResponse.error(res, 'Erro ao listar seguimentos');
  }
}
```

**services/cadastros/seguimentos.services.js:**
```javascript
import * as seguimentosRepository from '../../repositories/cadastros/seguimentos.repositories.js';

export async function listarTodos() {
  const query = 'SELECT id, nome, descricao FROM seguimentos ORDER BY nome';
  return await seguimentosRepository.executar(query);
}
```

---

### Exemplo 2: Endpoint POST com Validações

**Rota:**
```javascript
router.post('/seguimento/cadastrar', verificaJWT, cadastrarSeguimento);
```

**Controller:**
```javascript
export async function cadastrarSeguimento(req, res) {
  try {
    const { nome, descricao } = req.body;
    
    // Validações
    if (!nome || nome.trim() === '') {
      return apiResponse.validationError(
        res,
        'O nome do seguimento é obrigatório'
      );
    }
    
    // Verifica duplicata
    const existe = await seguimentosService.buscarPorNome(nome);
    if (existe) {
      return apiResponse.conflict(res, 'Seguimento já cadastrado!');
    }
    
    // Cria
    const novo = await seguimentosService.criar({ nome, descricao });
    
    return apiResponse.success(
      res,
      'Seguimento cadastrado com sucesso!',
      novo,
      201
    );
  } catch (error) {
    console.error('Erro ao cadastrar:', error);
    return apiResponse.error(res, 'Erro ao cadastrar seguimento');
  }
}
```

**Service:**
```javascript
export async function criar({ nome, descricao }) {
  const query = `
    INSERT INTO seguimentos (nome, descricao, data_criacao)
    VALUES ($1, $2, NOW())
    RETURNING id, nome, descricao, data_criacao
  `;
  
  return await seguimentosRepository.executarUm(query, [
    nome.trim(),
    descricao
  ]);
}
```

---

### Exemplo 3: Endpoint DELETE com Verificação

**Rota:**
```javascript
router.delete('/seguimentos/delete/:id', verificaJWT, deletarSeguimento);
```

**Controller:**
```javascript
export async function deletarSeguimento(req, res) {
  try {
    const { id } = req.params;
    
    // Valida ID
    if (!id || isNaN(id)) {
      return apiResponse.validationError(res, 'ID inválido');
    }
    
    // Verifica existência
    const existe = await seguimentosService.buscarPorId(id);
    if (!existe) {
      return apiResponse.notFound(res, 'Seguimento não encontrado!');
    }
    
    // Deleta
    await seguimentosService.deletar(id);
    
    return apiResponse.success(
      res,
      'Seguimento deletado com sucesso!',
      null,
      204
    );
  } catch (error) {
    console.error('Erro ao deletar:', error);
    return apiResponse.error(res, 'Erro ao deletar seguimento');
  }
}
```

---

## 📞 Checklist para Novo Endpoint

- [ ] Criar rota em `routes/`
- [ ] Importar controller em rota
- [ ] Criar controller com try/catch
- [ ] Usar `apiResponse` para retornar
- [ ] Fazer validações no controller
- [ ] Chamar service apropriado
- [ ] Criar/completar service
- [ ] Criar/completar repository
- [ ] Testar com Postman/Insomnia
- [ ] Documentar status codes esperados

---

## 📊 Referência Rápida de Status HTTP

| Método | Status | Significado |
|--------|--------|-------------|
| GET (sucesso) | 200 | OK |
| POST (criado) | 201 | Created |
| PUT (atualizado) | 200 | OK |
| DELETE (removido) | 204 | No Content |
| Validação falhou | 400 | Bad Request |
| Sem autenticação | 401 | Unauthorized |
| Sem permissão | 403 | Forbidden |
| Não encontrado | 404 | Not Found |
| Duplicata | 409 | Conflict |
| Erro interno | 500 | Internal Server Error |

---

**Última atualização:** 09/06/2026  
**Versão:** 1.0
