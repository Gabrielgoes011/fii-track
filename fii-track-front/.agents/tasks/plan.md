# Implementation Plan

- [x] 1. Ajustar o cabeçalho mobile e o bloco de indicadores de `PaginaControleAtivos` sem alterar a composição desktop.
      Adicionar o estado local `kpisAbertos` iniciado como `true` e o controle com `FiChevronUp`/`FiChevronDown` para recolher ou expandir os cinco `KpiCard` de uma vez apenas no mobile; no mobile, usar `repeat(2, minmax(0, 1fr))`, `minWidth: 0` e valores/fontes compactos, mantendo os cinco indicadores e a privacidade `.vp`. Tornar o header de `controleAtivos.jsx` uma linha compacta no mobile, encurtando somente o rótulo visual do botão para “Novo ativo” e mantendo `handleAbrirFormulario`; preservar o layout/espacamentos atuais no desktop.
      Arquivos: `src/pages/controleAtivos/controleAtivos.jsx`
      Verify: `npm run build` — o build Vite de produção conclui sem erros.

- [x] 2. Corrigir a navegação de abas e condensar o aviso de cotações no mobile, preservando toda a informação e o comportamento atual.
      Estender `ABAS` com rótulos curtos para mobile (`Carteira`, `Histórico`, `Movimento`) e passar `isMobile` a `TabsNav`; manter `role="tablist"`, navegação por teclado, aba ativa e overflow horizontal, usando os rótulos longos no desktop. Extrair o bloco atual de cotações para um componente local `StatusCotacoes({ resumo, isMobile, onAtualizar, loadingCotacoes, loading })`: no mobile exibir uma linha curta com data/hora e quantidade de ativos sem preço novo, mais uma divulgação simples para listar os tickers; no desktop manter a apresentação equivalente e o botão que chama `handleAtualizarCotacoes`. Não mudar `resumo`, o hook, a API ou as regras de atualização.
      Arquivos: `src/pages/controleAtivos/controleAtivos.jsx`
      Verify: `npm run build` — o build de produção passa e mantém os três painéis/ações de abas compilados.

- [x] 3. Refinar `LinhaAtivo`, `PrecoTetoEditor` e `FormularioInline` para leitura e toque no mobile, mantendo os dados e ações existentes.
      Preservar no resumo do card mobile ticker, segmento/objetivo, saldo, quantidade, rentabilidade, barra atual/ideal, badge de equilíbrio e expansão; aplicar `minWidth: 0`/truncamento seguro aos textos longos e aumentar os alvos dos botões de editar/expandir/preço teto para uma área confortável sem alterar os tamanhos desktop. Manter o painel expansível com preço médio, cotação, preço teto editável, proventos, rentabilidade total e valor para equilíbrio; no formulário inline, condicionar ao `isMobile` um empilhamento legível dos campos e ações, sem remover adicionar, editar, excluir, salvar, cancelar ou atualizar `% ideal`/preço teto. Continuar respeitando a área inferior já reservada pelo `Layout`/`BottomNav`.
      Arquivos: `src/pages/controleAtivos/controleAtivos.jsx`
      Verify: `npm run build` — o build Vite conclui sem erros; validar manualmente em viewport abaixo de 768px que expandir/editar/salvar/excluir continuam acessíveis e em viewport desktop que a listagem permanece equivalente.

- [x] 4. Executar a verificação final da página após integrar os três ajustes mobile.
      Confirmar que nenhuma alteração foi feita em `src/hooks/controleAtivos/useControleAtivos.js`, `src/services/controleAtivos/controleAtivosService.js`, `src/components/DataCard/DataCard.jsx` ou contratos de API, e que o único arquivo de implementação necessário é a página alvo.
      Arquivos: `src/pages/controleAtivos/controleAtivos.jsx`
      Verify: `npm run build` — build de produção verde; não há script de testes automatizados no `package.json`, portanto registrar a inspeção manual mobile/desktop descrita no item 3.
