# Requirements Document

## Introduction

O recurso **Histórico da Carteira** adiciona rastreabilidade temporal ao acompanhamento de Fundos Imobiliários (FIIs) da aplicação FII-Track. Hoje a tabela `cotacoes` guarda apenas a última cotação de cada ticker (sobrescrita a cada atualização via UPSERT), o que impede reconstruir a evolução dos preços e do patrimônio do usuário ao longo do tempo.

Este recurso passa a **gravar registros históricos a cada clique** no botão "Atualizar Cotações", capturando duas dimensões complementares:

1. **Histórico de preço de mercado por ticker** — a evolução do preço da cota ao longo do tempo (dado de mercado, compartilhado entre usuários, sem RLS, no mesmo modelo da tabela `cotacoes`).
2. **Snapshot do patrimônio da carteira do usuário** — por ativo e no total (valor de mercado, custo, rentabilidade em R$ e %, proventos), na data da captura, permitindo responder "quanto minha carteira valia em cada data e se subiu ou desceu" (dado privado, por `idUser`, com RLS).

A visualização é apresentada em uma tela de Controle de Ativos reorganizada em duas abas — "Carteira de FIIs" (tela atual) e "Histórico da Carteira" (nova) — respeitando o modo de privacidade existente (classe `.vp` / olhinho que borra valores). Como os registros são gravados a cada clique (mesmo usando cache), a visualização oferece agrupamento por dia para manter as curvas/gráficos legíveis, sem descartar os registros brutos.

## Glossary

- **Sistema**: A aplicação FII-Track como um todo (backend Node/Express + frontend React).
- **Backend**: O serviço Node/Express que expõe as rotas HTTP e acessa o PostgreSQL.
- **Frontend**: A aplicação React (Vite) que renderiza as telas para o usuário.
- **Serviço_de_Historico**: O componente do backend responsável por gravar e consultar o histórico de preços e de patrimônio.
- **Historico_Cotacoes**: Tabela de dados de mercado que armazena um registro por ticker a cada captura de cotação (compartilhada entre usuários, sem RLS).
- **Historico_Carteira**: Tabela de dados privados que armazena, por usuário e por captura, o snapshot da carteira por ativo e o snapshot geral (com `idUser` e RLS).
- **Captura**: Evento de gravação de histórico disparado por um clique em "Atualizar Cotações", identificado por um instante de captura (`dtCaptura`).
- **Snapshot_por_Ativo**: Registro do estado de um ativo da carteira no instante da captura (quantidade, preço médio, custo, valor de mercado, rentabilidade em R$ e %, proventos acumulados).
- **Snapshot_Geral**: Agregação, no instante da captura, dos valores da carteira inteira do usuário (custo total, valor de mercado total, rentabilidade total em R$ e %, proventos totais).
- **Variacao**: Diferença entre o valor de uma captura e o valor da captura anterior comparável, expressa em R$ e em %, com indicação de direção (subiu, desceu ou estável).
- **Ticker**: Código de negociação de um FII na B3 (ex.: `MXRF11`).
- **Modo_Privacidade**: Estado da aplicação, controlado pelo `PrivacyContext` (olhinho), que aplica a classe CSS `.vp` para borrar valores financeiros.
- **Agrupamento_por_Dia**: Modo de visualização que consolida todas as capturas de um mesmo dia em um único ponto (a mais recente do dia) para exibição em gráficos e listas.
- **RLS**: Row Level Security do PostgreSQL, aplicado por `idUser` via `current_setting('app.current_user_id')`.
- **brapi**: Serviço externo brapi.dev usado para buscar cotações; plano gratuito limitado a 1 ticker por requisição.
- **TTL_Cache**: Janela de 15 minutos durante a qual uma cotação salva é considerada fresca e reutilizada sem consultar a brapi.
- **app_fiitrack**: Usuário de conexão da aplicação no PostgreSQL, que precisa de GRANT explícito nas tabelas.
- **neondb_owner**: Usuário dono (OWNER) das tabelas no banco Neon.

## Requirements

### Requirement 1: Gravação de histórico ao atualizar cotações

**User Story:** Como investidor, quero que cada clique em "Atualizar Cotações" grave um registro histórico, para que eu tenha um rastro temporal da minha carteira mesmo quando o sistema usar o cache.

#### Acceptance Criteria

1. WHEN o usuário aciona a atualização de cotações, THE Serviço_de_Historico SHALL registrar exatamente uma Captura por acionamento, com o instante de captura (`dtCaptura`) igual ao horário do servidor no momento do acionamento, com precisão de segundos.
2. WHEN uma Captura é registrada, THE Serviço_de_Historico SHALL gravar, para cada Ticker da carteira do usuário, um registro em Historico_Cotacoes contendo o preço de mercado, o fechamento anterior, a variação do dia em R$, a variação do dia em %, o instante do pregão e o instante da captura, com os valores monetários e percentuais preservando a mesma precisão numérica recebida da fonte de cotação, sem arredondamento adicional.
3. WHEN uma Captura é registrada, THE Serviço_de_Historico SHALL gravar, para cada ativo da carteira do usuário, um Snapshot_por_Ativo em Historico_Carteira e um Snapshot_Geral consolidado da carteira, ambos associados ao mesmo `dtCaptura` da Captura.
4. WHILE a última cotação de um Ticker tiver sido obtida há 15 minutos ou menos (TTL_Cache = 15 minutos), THE Serviço_de_Historico SHALL gravar o registro histórico usando o valor em cache sem consultar a brapi para esse Ticker.
5. IF a carteira do usuário não possui ativos, THEN THE Serviço_de_Historico SHALL concluir a Captura sem gravar registros de Historico_Cotacoes e Historico_Carteira e retornar um resultado vazio.
6. IF a consulta à brapi falhar para um ou mais tickers durante a Captura E existir valor em cache para esses tickers, THEN THE Serviço_de_Historico SHALL gravar os registros históricos com os valores disponíveis em cache e registrar no log do servidor uma entrada de erro indicando os tickers afetados e a falha na consulta.
7. IF a consulta à brapi falhar para um Ticker durante a Captura E não existir valor em cache para esse Ticker, THEN THE Serviço_de_Historico SHALL omitir o registro histórico desse Ticker na Captura, concluir a Captura para os demais tickers e registrar no log do servidor uma entrada de erro indicando o Ticker sem cotação disponível.

### Requirement 2: Histórico de preço de mercado por ticker

**User Story:** Como investidor, quero visualizar a evolução do preço de cada FII ao longo do tempo, para que eu entenda o comportamento de mercado dos meus ativos.

#### Acceptance Criteria

1. WHEN o Frontend solicita o histórico de preço de um Ticker existente, THE Backend SHALL retornar a lista de registros de Historico_Cotacoes desse Ticker ordenada de forma crescente pelo campo `dtCaptura` e, em caso de valores de `dtCaptura` iguais, desempatada de forma crescente por `dtPregao`.
2. THE Historico_Cotacoes SHALL armazenar cada registro de preço com os campos obrigatórios `ticker` (texto de até 10 caracteres) e `dtCaptura` (instante com fuso horário), e com os campos opcionais `preco` (numérico com 2 casas decimais, de 0,00 a 9.999.999.999,99), `fechamentoAnterior` (numérico com 2 casas decimais, de 0,00 a 9.999.999.999,99), `variacao` (numérico com 4 casas decimais, de -9.999.999,9999 a 9.999.999,9999), `variacaoPerc` (numérico com 4 casas decimais, de -9.999,9999 a 9.999,9999) e `dtPregao` (instante com fuso horário).
3. WHERE os parâmetros de período (data inicial e data final) são informados na consulta, THE Backend SHALL retornar apenas os registros de Historico_Cotacoes cujo `dtCaptura` seja maior ou igual à data inicial e menor ou igual à data final informadas.
4. THE Historico_Cotacoes SHALL ser uma tabela de dados de mercado compartilhada entre todos os usuários, sem RLS, seguindo o modelo da tabela `cotacoes`.
5. WHEN o Frontend solicita o histórico de preço de um Ticker existente sem registros no período aplicável, THE Backend SHALL retornar uma lista vazia.
6. IF a solicitação de histórico não informa o Ticker ou informa um Ticker com formato inválido (vazio ou com mais de 10 caracteres), THEN THE Backend SHALL rejeitar a solicitação sem retornar registros e SHALL indicar ao solicitante um erro de parâmetro inválido.
7. IF os parâmetros de período são informados de forma inválida (data não interpretável como instante ou data inicial posterior à data final), THEN THE Backend SHALL rejeitar a solicitação sem retornar registros e SHALL indicar ao solicitante um erro de período inválido.

### Requirement 3: Snapshot do patrimônio da carteira por ativo e geral

**User Story:** Como investidor, quero um snapshot do meu patrimônio por ativo e no total em cada data, para que eu saiba quanto minha carteira valia ao longo do tempo.

#### Acceptance Criteria

1. WHEN um Snapshot_por_Ativo é gravado, THE Serviço_de_Historico SHALL registrar, para o ativo, os valores: quantidade com até 8 casas decimais, preço médio com 2 casas decimais, custo com 2 casas decimais, valor de mercado com 2 casas decimais, rentabilidade em R$ com 2 casas decimais, rentabilidade em % com 2 casas decimais, proventos acumulados com 2 casas decimais e instante de captura.
2. WHEN um Snapshot_Geral é gravado, THE Serviço_de_Historico SHALL registrar, para a carteira do usuário, os valores agregados com 2 casas decimais: custo total, valor de mercado total, rentabilidade total em R$, rentabilidade total em % e proventos totais, associados ao instante de captura.
3. THE Serviço_de_Historico SHALL calcular o valor de mercado de cada ativo como o produto da quantidade pelo preço de mercado do Ticker na Captura, arredondado para 2 casas decimais.
4. IF o preço de mercado do Ticker está indisponível na Captura, THEN THE Serviço_de_Historico SHALL registrar o valor de mercado do ativo como igual ao custo do ativo e gravar uma indicação de indisponibilidade do preço de mercado para aquele ativo na Captura.
5. THE Serviço_de_Historico SHALL calcular a rentabilidade em R$ de cada ativo como a diferença entre o valor de mercado e o custo do ativo, arredondada para 2 casas decimais.
6. WHEN o custo de um ativo é maior que zero, THE Serviço_de_Historico SHALL calcular a rentabilidade em % do ativo como ((valor de mercado - custo) / custo) * 100, arredondada para 2 casas decimais.
7. IF o custo de um ativo é igual a zero, THEN THE Serviço_de_Historico SHALL registrar a rentabilidade em % do ativo como zero.
8. THE Serviço_de_Historico SHALL calcular o Snapshot_Geral de forma que o custo total, o valor de mercado total e os proventos totais sejam iguais à soma dos respectivos valores dos Snapshots_por_Ativo da mesma Captura, arredondados para 2 casas decimais.
9. IF a carteira do usuário não possui nenhum ativo na Captura, THEN THE Serviço_de_Historico SHALL registrar o Snapshot_Geral com custo total, valor de mercado total, rentabilidade total em R$, rentabilidade total em % e proventos totais iguais a zero.
10. WHEN o Frontend solicita o histórico de patrimônio do usuário, THE Backend SHALL retornar os Snapshots_Geral ordenados de forma crescente pelo instante de captura.
11. IF não existem Snapshots_Geral registrados para o usuário quando o Frontend solicita o histórico de patrimônio, THEN THE Backend SHALL retornar uma lista vazia.

### Requirement 4: Cálculo de variação (subiu, desceu ou estável)

**User Story:** Como investidor, quero ver se cada ativo e a carteira geral subiram ou desceram, para que eu perceba rapidamente ganhos, rendimentos e perdas.

#### Acceptance Criteria

1. WHEN o Backend retorna uma série histórica de valores, THE Backend SHALL incluir, para cada ponto, a Variacao em R$ arredondada para 2 casas decimais e a Variacao em % arredondada para 2 casas decimais, ambas calculadas em relação ao ponto comparável imediatamente anterior da mesma série.
2. WHEN o Backend calcula a Variacao em % de um ponto cujo valor anterior é diferente de zero, THE Backend SHALL calcular a Variacao em % como ((valor atual menos valor anterior) dividido pelo valor anterior) multiplicado por 100, arredondada para 2 casas decimais.
3. IF o valor de um ponto é maior que o valor do ponto anterior em mais de 0,01 unidade monetária, THEN THE Backend SHALL indicar a direção da Variacao como "subiu".
4. IF o valor de um ponto é menor que o valor do ponto anterior em mais de 0,01 unidade monetária, THEN THE Backend SHALL indicar a direção da Variacao como "desceu".
5. IF a diferença absoluta entre o valor de um ponto e o valor do ponto anterior é menor ou igual a 0,01 unidade monetária, THEN THE Backend SHALL indicar a direção da Variacao como "estável".
6. IF o valor do ponto anterior é igual a zero, THEN THE Backend SHALL indicar a Variacao em % desse ponto como indefinida, sem executar a divisão, e SHALL manter a Variacao em R$ calculada como valor atual menos valor anterior arredondada para 2 casas decimais.
7. WHERE um ponto não possui ponto anterior comparável, THE Backend SHALL indicar a Variacao em R$, a Variacao em % e a direção desse ponto como indefinidas.

### Requirement 5: Visualização em abas com agrupamento por dia

**User Story:** Como investidor, quero acessar o histórico em uma aba separada com os pontos agrupados por dia, para que a tela de Controle de Ativos fique organizada e as curvas fiquem legíveis.

#### Acceptance Criteria

1. THE Frontend SHALL apresentar a tela de Controle de Ativos organizada em duas abas nomeadas "Carteira de FIIs" e "Histórico da Carteira".
2. WHEN a tela de Controle de Ativos é aberta, THE Frontend SHALL exibir a aba "Carteira de FIIs" como aba ativa inicial e exibir o mesmo conteúdo da carteira de FIIs previamente apresentado nessa tela antes da reorganização em abas.
3. WHEN o usuário seleciona a aba "Histórico da Carteira", THE Frontend SHALL exibir uma série de evolução do patrimônio total da carteira e uma série de evolução de preço por ativo, ambas ordenadas cronologicamente do registro mais antigo ao mais recente.
4. WHILE a aba "Histórico da Carteira" utiliza o Agrupamento_por_Dia, THE Frontend SHALL exibir, para cada dia de calendário (delimitado pelo fuso horário America/Sao_Paulo) que possua ao menos um registro, exatamente um ponto correspondente à Captura de maior timestamp naquele dia.
5. THE Serviço_de_Historico SHALL preservar todos os registros brutos de cada Captura, sem exclusão ou sobrescrita, independentemente do Agrupamento_por_Dia aplicado na visualização.
6. WHEN o usuário visualiza uma série histórica na aba "Histórico da Carteira", THE Frontend SHALL indicar visualmente para cada ponto uma dentre três direções da Variacao em relação ao ponto imediatamente anterior da mesma série: alta (valor maior), baixa (valor menor) ou neutra (valor igual).
7. WHEN o usuário seleciona a aba "Histórico da Carteira" e não existe nenhum registro histórico, THE Frontend SHALL exibir uma mensagem indicando ausência de dados históricos, sem exibir gráficos vazios nem erro.
8. IF o carregamento dos dados históricos falha, THEN THE Frontend SHALL exibir uma indicação de erro informando que o histórico não pôde ser carregado e SHALL preservar a possibilidade de o usuário tentar novamente.

### Requirement 6: Respeito ao modo de privacidade

**User Story:** Como investidor, quero que o histórico respeite o modo de privacidade, para que meus valores financeiros permaneçam ocultos quando o olhinho estiver ativado.

#### Acceptance Criteria

1. WHILE o Modo_Privacidade estiver ativado, THE Frontend SHALL aplicar a classe CSS `.vp` a todos os valores financeiros exibidos na aba "Histórico da Carteira".
2. WHEN o usuário alterna o Modo_Privacidade, THE Frontend SHALL atualizar a exibição dos valores financeiros da aba "Histórico da Carteira" de acordo com o novo estado do Modo_Privacidade.
3. WHERE um elemento da aba "Histórico da Carteira" exibe um valor monetário, percentual de rentabilidade ou patrimônio, THE Frontend SHALL marcar esse elemento com a classe CSS `.vp`.

### Requirement 7: Isolamento por usuário do histórico de patrimônio (RLS)

**User Story:** Como investidor, quero que meu histórico de patrimônio seja acessível apenas por mim, para que meus dados financeiros permaneçam privados.

#### Acceptance Criteria

1. THE Historico_Carteira SHALL armazenar o `idUser` do proprietário em cada registro de Snapshot_por_Ativo e Snapshot_Geral.
2. THE Historico_Carteira SHALL ter RLS habilitado com política que restringe as operações aos registros cujo `idUser` é igual ao valor de `current_setting('app.current_user_id')`.
3. WHEN o Backend consulta o histórico de patrimônio, THE Backend SHALL retornar apenas os registros de Historico_Carteira pertencentes ao usuário autenticado.
4. WHEN uma requisição ao histórico de patrimônio chega sem token de autenticação válido, THE Backend SHALL rejeitar a requisição sem retornar dados de Historico_Carteira.

### Requirement 8: Migrations e permissões das novas tabelas

**User Story:** Como desenvolvedor, quero que as novas tabelas sigam o padrão de migrations do projeto, para que o banco possa ser provisionado de forma idempotente e com as permissões corretas.

#### Acceptance Criteria

1. THE Backend SHALL fornecer as novas tabelas por meio de arquivos de migration no diretório `db/migrations` seguindo o padrão de nomenclatura `00X_*.sql`.
2. THE migrations SHALL ser idempotentes, criando as tabelas apenas quando ainda não existirem.
3. WHEN uma migration cria uma nova tabela, THE migration SHALL definir `neondb_owner` como OWNER da tabela.
4. WHEN uma migration cria uma nova tabela, THE migration SHALL conceder ao usuário `app_fiitrack` as permissões SELECT, INSERT, UPDATE e DELETE sobre a tabela.
5. WHERE a tabela criada é Historico_Carteira, THE migration SHALL habilitar RLS e criar a política de acesso por `idUser` de forma idempotente, seguindo o padrão do arquivo `db/RLS.sql`.
