import React from 'react';
import { FiFileText } from 'react-icons/fi';
import PaginaEmDesenvolvimento from '../../components/PaginaEmDesenvolvimento/PaginaEmDesenvolvimento';

function PaginaRelatorios() {
  return (
    <PaginaEmDesenvolvimento
      titulo="Relatórios"
      descricao="Visualize relatórios e análises da sua carteira"
      icon={FiFileText}
      cor="#06b6d4"
    />
  );
}

export default PaginaRelatorios;
