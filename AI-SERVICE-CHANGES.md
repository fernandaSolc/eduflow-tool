# Requisições de Mudança para Backend e AI Service

Este documento descreve as alterações necessárias nos serviços de backend e IA para suportar as novas funcionalidades do Editor Inteligente do Eduflow.

## 1. Alteração no Endpoint `continue-chapter` do AI Service

### Justificativa

Para suportar ações contextuais como "Simplificar", "Expandir", "Exemplificar", etc., o endpoint `/incremental/continue-chapter` precisa ser mais flexível. Atualmente, ele parece estar focado apenas em "continuar" o conteúdo. A proposta é torná-lo um endpoint genérico para **transformação de conteúdo**.

### Mudança Proposta

**Endpoint**: `POST /incremental/continue-chapter`

O corpo da requisição (`body`) será mantido, mas com uma interpretação mais ampla do campo `continueType`.

#### Corpo da Requisição Atualizado

```json
{
  "chapterId": "string",
  "continueType": "expand" | "simplify" | "exemplify" | "connect" | "assess",
  "additionalContext": "string"
}
```

#### Detalhes da Implementação no AI Service

1.  **`chapterId` (string, obrigatório)**: O ID do capítulo a ser modificado.
2.  **`continueType` (string, obrigatório)**: Define a **intenção** da transformação. O serviço de IA deve ter lógicas diferentes para cada tipo:
    *   **`expand`**: Torna o conteúdo mais detalhado.
    *   **`simplify`**: Reduz a complexidade do texto, adequando-o a um público menos experiente.
    *   `exemplify`: Adiciona exemplos práticos.
    *   `connect`: Relaciona o conceito com outros tópicos ou com o mundo real.
    *   `assess`: Cria uma questão ou avaliação baseada no conteúdo.
3.  **`additionalContext` (string, obrigatório)**: Este campo agora terá um papel crucial. Ele conterá o **texto selecionado pelo usuário** e quaisquer instruções adicionais. O frontend enviará uma string formatada, como por exemplo:
    ```
    Simplifique o seguinte trecho de texto: "O processo de mitose é dividido em prófase, metáfase, anáfase e telófase, garantindo a duplicação celular.".

    Instruções adicionais: Explique para um aluno do ensino fundamental.
    ```

#### Lógica do AI Service

O serviço de IA deve:

1.  Receber a requisição e identificar o `continueType`.
2.  Analisar o `additionalContext` para extrair o texto a ser transformado e as instruções.
3.  Executar o prompt de IA apropriado para a `continueType` solicitada.
4.  **Importante**: A resposta da IA não deve ser o texto transformado isoladamente. Ela deve retornar o **conteúdo completo e atualizado do capítulo**, com o trecho original substituído pelo trecho transformado. Isso garante a consistência dos dados e simplifica a lógica do frontend.
5.  O `backendService` receberá este conteúdo completo e o salvará, atualizando o registro do capítulo no banco de dados.

### Exemplo de Fluxo para "Simplificar"

1.  **Frontend**: O usuário seleciona um texto e clica em "Simplificar".
2.  **Frontend**: Chama a `simplifyChapterAction`.
3.  **Action (`simplifyChapterAction`)**: Monta o corpo da requisição e chama o `aiService.continueChapter` com `continueType: 'simplify'`.
4.  **AI Service**:
    *   Recebe a chamada.
    *   Usa um prompt como: "Você é um especialista em pedagogia. Simplifique o seguinte texto, mantendo a precisão: [texto extraído do `additionalContext`]".
    *   Obtém o resultado da IA.
    *   Busca o conteúdo atual do capítulo (`chapterId`).
    *   Substitui o texto original pelo texto simplificado dentro do conteúdo completo do capítulo.
    *   Retorna o conteúdo completo do capítulo atualizado.
5.  **Action (`simplifyChapterAction`)**: Recebe o capítulo atualizado e o retorna.
6.  **Frontend**: Recebe a confirmação, aciona `onUpdateChapter` para buscar os dados mais recentes e exibe um toast de sucesso.
