import React from 'react';
import { FiSettings } from 'react-icons/fi';
import PaginaEmDesenvolvimento from '../../components/PaginaEmDesenvolvimento/PaginaEmDesenvolvimento';

function PaginaConfiguracoes() {
  return (
    <PaginaEmDesenvolvimento
      titulo="Configurações"
      descricao="Personalize as preferências do sistema"
      icon={FiSettings}
      cor="#64748b"
    />
  );
}

export default PaginaConfiguracoes;
