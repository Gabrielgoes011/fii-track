import React from 'react';
import { FiTag } from 'react-icons/fi';
import PaginaEmDesenvolvimento from '../../components/PaginaEmDesenvolvimento/PaginaEmDesenvolvimento';

function PaginaPrecificacao() {
  return (
    <PaginaEmDesenvolvimento
      titulo="Precificação"
      descricao="Análise de preços e valuation dos seus FIIs"
      icon={FiTag}
      cor="#f59e0b"
    />
  );
}

export default PaginaPrecificacao;
