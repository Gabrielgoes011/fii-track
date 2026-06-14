/**
 * Interface para definição de colunas do GridDados
 */
export interface IColuna {
  titulo: string;
  acesso: string;
  width?: string; // Largura da coluna (ex: "100px", "20%", "auto")
  align?: 'left' | 'center' | 'right'; // Alinhamento do conteúdo
  truncate?: boolean; // Se deve truncar texto longo com ellipsis
  sticky?: 'left' | 'right'; // Fixa coluna na lateral (sticky column)
}
