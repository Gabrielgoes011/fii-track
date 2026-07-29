import React from 'react';
import { FiLayers } from 'react-icons/fi';
import PaginaEmDesenvolvimento from '../../components/PaginaEmDesenvolvimento/PaginaEmDesenvolvimento';

function PaginaControleAtivos() {
  return (
    <PaginaEmDesenvolvimento
      titulo="Controle de Ativos"
      descricao="Gerencie e acompanhe seus ativos"
      icon={FiLayers}
      cor="#8b5cf6"
    />
  );
}

export default PaginaControleAtivos;
