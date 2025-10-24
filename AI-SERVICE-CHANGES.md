# Especificação Técnica: Integração Frontend, AI Service e Backend

Este documento descreve as regras de negócio, os fluxos de dados e as responsabilidades de cada parte do sistema (Frontend, AI Service, Backend Service) para as funcionalidades de edição de conteúdo do Eduflow Tool. O objetivo é servir como um guia definitivo para a implementação e manutenção da integração.

---

## 1. Conceito Central: Transformação de Conteúdo via `continue-chapter`

A maioria das interações de IA no editor (Simplificar, Expandir, Criar Exemplo, Gerar Questão) é tratada como uma **transformação de conteúdo**. Para centralizar e simplificar a lógica, todas essas ações utilizam um único e flexível endpoint no AI Service:

**Endpoint Principal:** `POST /incremental/continue-chapter`

Este endpoint é responsável por receber um trecho de texto, uma intenção de transformação e o contexto, e retornar o **conteúdo completo e atualizado do capítulo**, com a transformação já aplicada.

---

## 2. Especificação Detalhada do Endpoint

### `POST /incremental/continue-chapter`

#### Corpo da Requisição (Body)

```json
{
  "chapterId": "string",
  "continueType": "expand" | "simplify" | "exemplify" | "assess",
  "additionalContext": "string"
}
```

#### Detalhes dos Campos do Payload:

1.  **`chapterId` (string, obrigatório)**: O ID do capítulo que está sendo modificado. O AI Service usará isso para buscar o conteúdo atual do capítulo, se necessário.

2.  **`continueType` (string, obrigatório)**: Define a **intenção** da transformação. O AI Service deve ter lógicas e prompts de IA distintos para cada tipo:
    *   **`expand`**: Torna o conteúdo selecionado mais detalhado e aprofundado.
    *   **`simplify`**: Reduz a complexidade do texto, tornando-o mais acessível.
    *   **`exemplify`**: Cria um exemplo prático, uma analogia ou um estudo de caso baseado no conceito selecionado.
    *   **`assess`**: Gera uma questão de avaliação (dissertativa, múltipla escolha, etc.) com base no trecho.

3.  **`additionalContext` (string, obrigatório)**: Este campo é crucial e deve ser formatado pelo frontend. Ele contém:
    *   A **descrição da tarefa** para a IA.
    *   O **texto exato selecionado pelo usuário**.
    *   Quaisquer **instruções adicionais** fornecidas pelo autor no formulário.

    **Formato Padrão (Exemplo para "Simplificar"):**
    ```
    Simplifique o seguinte trecho de texto: "O processo de mitose é dividido em prófase, metáfase, anáfase e telófase, garantindo a duplicação celular.".

    Instruções adicionais: Explique para um aluno do ensino fundamental.
    ```

#### Responsabilidades do AI Service (O que ele deve fazer):

1.  Receber a requisição e identificar o `continueType`.
2.  Analisar a string `additionalContext` para extrair o texto a ser transformado e as instruções.
3.  Executar o prompt de IA apropriado para o `continueType` solicitado, usando as informações do `additionalContext`.
4.  **IMPORTANTE**: Após receber a resposta da IA (o texto transformado), o AI Service deve:
    a. Buscar o conteúdo completo e atual do capítulo correspondente ao `chapterId` no **Backend Service**.
    b. **Substituir** o trecho de texto original pelo novo conteúdo gerado pela IA dentro do conteúdo completo do capítulo.
    c. Retornar na sua resposta (`response`) o **objeto do capítulo inteiro e atualizado**.

#### Responsabilidades do Backend Service (O que ele deve fazer):

1.  **Fornecer dados**: Expor endpoints como `GET /chapters/{id}` para que o AI Service possa buscar o conteúdo atual dos capítulos.
2.  **Persistir dados**: Expor endpoints como `PUT /chapters/{id}` para que o AI Service (ou o frontend, dependendo do fluxo) possa salvar o conteúdo atualizado de um capítulo. O Backend Service **não** realiza lógica de IA. Sua única função é ser uma camada de persistência de dados.

---

## 3. Fluxo Detalhado por Ferramenta de Edição

### Ferramenta 1: Edição Manual (Salvar Alteração)

*   **Ação do Usuário**: Seleciona um trecho, clica em "Editar", modifica o texto no pop-up e clica em "Salvar Alterações".
*   **Fluxo Frontend**:
    1.  O componente `ChapterContent` chama a `Server Action` **`updateChapterContentAction`**.
    2.  O payload enviado para a action é: `courseId`, `chapterId`, `oldContent` (o texto original selecionado) e `newContent` (o texto modificado pelo usuário).
*   **Fluxo da `updateChapterContentAction`**:
    1.  A action chama o **Backend Service** para buscar o capítulo completo (`backendService.getChapterById(chapterId)`).
    2.  Ela realiza a substituição do `oldContent` pelo `newContent` no conteúdo do capítulo.
    3.  Em seguida, chama o **Backend Service** novamente para salvar o capítulo atualizado (`backendService.updateChapter(chapterId, { content: updatedContent })`).
    4.  Aciona `revalidatePath` para atualizar a UI.

### Ferramenta 2: Simplificar com IA

*   **Ação do Usuário**: Seleciona um texto, clica em "Simplificar com IA", opcionalmente adiciona instruções e clica em "Simplificar".
*   **Fluxo Frontend**:
    1.  O `ChapterContent` captura o texto selecionado (`selection`) e as instruções adicionais (`prompt`).
    2.  Chama a `Server Action` **`simplifyChapterAction`**.
    3.  A action formata o `additionalContext`:
        ```
        `Simplifique o seguinte trecho de texto: "${selection}".\nInstruções adicionais: ${prompt || 'Nenhuma.'}`
        ```
    4.  A action então chama o **AI Service**: `aiService.continueChapter(chapterId, 'simplify', context)`.
*   **Fluxo do `aiService.continueChapter`**:
    1.  Recebe a chamada com `continueType: 'simplify'`.
    2.  Usa seu prompt interno para simplificação, ex: "Você é um especialista em pedagogia. Simplifique o texto a seguir...".
    3.  Obtém o resultado da IA.
    4.  Busca o capítulo completo no Backend Service.
    5.  Substitui o trecho original pelo texto simplificado.
    6.  Retorna o **objeto do capítulo completo e atualizado** para a `simplifyChapterAction`.
*   **Finalização**: A action recebe o capítulo atualizado, aciona `revalidatePath` e retorna sucesso, fazendo a UI recarregar os dados.

### Ferramenta 3: Expandir com IA

*   **Ação do Usuário**: Seleciona um texto, clica em "Expandir", opcionalmente adiciona instruções e clica em "Expandir".
*   **Fluxo Frontend**:
    1.  Idêntico ao de "Simplificar", mas chama a `Server Action` **`expandChapterAction`**.
    2.  A action formata o `additionalContext`:
        ```
        `Expanda o seguinte trecho de texto: "${selection}".\nInstruções adicionais: ${prompt || 'Nenhuma.'}`
        ```
    3.  A action chama o **AI Service**: `aiService.continueChapter(chapterId, 'expand', context)`.
*   **Fluxo do `aiService.continueChapter`**:
    1.  Recebe a chamada com `continueType: 'expand'`.
    2.  Usa seu prompt interno para expansão de conteúdo.
    3.  Segue o mesmo processo: obtém resultado da IA, busca capítulo, substitui texto e retorna o **capítulo completo e atualizado**.

### Ferramenta 4: Criar Exemplo

*   **Ação do Usuário**: Seleciona um conceito, clica em "Criar Exemplo", opcionalmente adiciona instruções e clica em "Criar Exemplo".
*   **Fluxo Frontend**:
    1.  Chama a `Server Action` **`createExampleAction`**.
    2.  A action formata o `additionalContext`:
        ```
        `Crie um exemplo prático, uma analogia ou um estudo de caso sobre o seguinte conceito: "${selection}".\nInstruções adicionais: ${prompt || 'Nenhuma.'}`
        ```
    3.  A action chama o **AI Service**: `aiService.continueChapter(chapterId, 'exemplify', context)`.
*   **Fluxo do `aiService.continueChapter`**:
    1.  Recebe a chamada com `continueType: 'exemplify'`.
    2.  Usa seu prompt interno para criar exemplos.
    3.  A IA gera um exemplo. **Importante**: O AI Service deve **anexar** este exemplo após o parágrafo do texto selecionado, em vez de substituí-lo. Ele então retorna o **capítulo completo e atualizado**.

### Ferramenta 5: Gerar Questão

*   **Ação do Usuário**: Seleciona um texto, clica em "Gerar Questão", opcionalmente adiciona instruções e clica em "Gerar Questão".
*   **Fluxo Frontend**:
    1.  Chama a `Server Action` **`generateQuestionAction`**.
    2.  A action formata o `additionalContext`:
        ```
        `Gere uma questão de avaliação (múltipla escolha ou dissertativa) sobre o seguinte trecho: "${selection}".\nInstruções adicionais: ${prompt || 'Nenhuma.'}`
        ```
    3.  A action chama o **AI Service**: `aiService.continueChapter(chapterId, 'assess', context)`.
*   **Fluxo do `aiService.continueChapter`**:
    1.  Recebe a chamada com `continueType: 'assess'`.
    2.  Usa seu prompt interno para criar questões de avaliação.
    3.  Assim como em "Criar Exemplo", o AI Service deve **anexar** a questão gerada após o parágrafo do texto selecionado e retornar o **capítulo completo e atualizado**.

---

### Resumo das Responsabilidades

| Parte do Sistema     | Responsabilidade Principal                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**         | Capturar a intenção e o contexto do usuário. Chamar a `Server Action` apropriada. Renderizar o estado atual do capítulo.          |
| **Server Actions**   | Servir como uma camada de segurança. Formatar o `additionalContext` e chamar o serviço correto (`aiService` ou `backendService`). |
| **AI Service**       | Orquestrar a lógica de IA. Chamar o modelo de IA, processar a resposta e **retornar o objeto de capítulo completo e atualizado**.  |
| **Backend Service**  | Atuar como uma camada de persistência de dados (CRUD). Não contém nenhuma lógica de negócio ou de IA.                           |

Este modelo garante que a lógica de negócio complexa (manipulação do conteúdo do capítulo) resida em um único lugar (o AI Service), tornando o sistema mais fácil de manter e depurar, enquanto o frontend permanece focado na experiência do usuário.
