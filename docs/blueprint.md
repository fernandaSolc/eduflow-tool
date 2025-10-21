# **App Name**: Eduflow Tool

## Core Features:

- Listagem de Cursos: Exibir uma lista paginada de cursos do backend com opções de filtragem e ordenação, com base nos dados obtidos através do endpoint `/courses` no backend.
- Geração de Capítulos: Permitir que os usuários gerem novos capítulos para um curso selecionado, usando o Serviço de IA para fornecer o conteúdo do capítulo; ele envia um payload para o endpoint `/incremental/create-chapter` do Serviço de IA com base no formulário e nas configurações preenchidas/escolhidas pelo usuário.
- Expansão de Capítulos: Permitir que os usuários expandam um capítulo existente para um curso selecionado, usando o Serviço de IA para gerar iterativamente conteúdo adicional com base em um "tipo de continuação" selecionado e quaisquer detalhes extras que eles forneçam. Usar o endpoint `/incremental/continue-chapter` do Serviço de IA.
- Visualização de Capítulos: Exibir um capítulo gerado com suas seções, sugestões e opções de continuação.
- Verificações de Saúde do Serviço: Monitorar rotineiramente a saúde do Serviço de IA e do Backend para confirmar se o sistema está operando sem problemas; usar os endpoints `/health` de cada serviço respectivo.
- Invocação de Ferramenta de IA: Uma ferramenta de IA que decide automaticamente quando ou se deve usar IA para enriquecer o conteúdo dos capítulos
- Persistência de Configurações: Persistir e recuperar o modelo mais recente e as preferências do sistema que o usuário escolheu durante a geração para melhorar o fluxo de trabalho durante a criação do conteúdo do capítulo.

## Style Guidelines:

- Cor primária: Azul profundo (#3B82F6), que lembra a ênfase da marca Eduflow na profissionalismo e confiabilidade em tecnologia educacional.
- Cor de fundo: Cinza claro (#F9FAFB), para garantir que a UI pareça moderna, mantendo alta legibilidade.
- Cor de destaque: análoga ao matiz primário, Ciano (#06B6D4), deve ser usada para elementos interativos e destaques.
- Fonte do título: 'Space Grotesk' sans-serif, para títulos, combinada com 'Inter' sans-serif para o corpo do texto. Nota: atualmente apenas as fontes do Google são suportadas.
- Fonte de código: 'Source Code Pro' monospace, para quaisquer trechos de código.
- Usar ícones simples e modernos de um conjunto consistente (por exemplo, ícones Feather) para ações e navegação.
- Usar um layout limpo, baseado em grade, com espaço em branco suficiente para legibilidade e uma aparência profissional.