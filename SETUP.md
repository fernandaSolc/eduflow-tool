# 🤖 Eduflow Tool - Configuração e Instalação

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Git

## 🚀 Instalação Rápida

### 1. Clone o repositório
```bash
git clone <repository-url>
cd eduflow-tool
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
# Copie o arquivo de configuração
cp env-config.txt .env.local

# Ou crie manualmente o arquivo .env.local com o conteúdo do env-config.txt
```

### 4. Execute o projeto
```bash
npm run dev
```

O projeto estará disponível em: http://localhost:9002

## 🔧 Configuração Detalhada

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes configurações:

```env
# Configurações do AI Service
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:3000
AI_SERVICE_API_KEY=test-api-key-123

# Configurações do Backend Service
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api
BACKEND_API_KEY=dev-api-key-123

# Configurações do Next.js
NEXT_PUBLIC_APP_URL=http://localhost:9002

# Configurações de desenvolvimento
NODE_ENV=development

# Configurações de Mock (para desenvolvimento local)
USE_AI_MOCK=true
USE_BACKEND_MOCK=true
```

### Modos de Operação

#### 1. Modo Mock (Desenvolvimento Local)
- `USE_AI_MOCK=true` - Usa dados simulados para o AI Service
- `USE_BACKEND_MOCK=true` - Usa dados simulados para o Backend Service
- **Recomendado para**: Desenvolvimento e testes locais

#### 2. Modo Produção
- `USE_AI_MOCK=false` - Conecta com o AI Service real
- `USE_BACKEND_MOCK=false` - Conecta com o Backend Service real
- **Recomendado para**: Ambiente de produção

## 🏗️ Arquitetura

```
Frontend (Next.js) → AI Service → OpenAI GPT-4
     ↓                    ↓
Backend Service ← Mock Services (desenvolvimento)
```

### Serviços

1. **AI Service** (Porta 3000)
   - Transformação de conteúdo com IA
   - Geração de capítulos
   - Análise de qualidade

2. **Backend Service** (Porta 3001)
   - Gestão de cursos e capítulos
   - Persistência de dados
   - API REST

3. **Frontend** (Porta 9002)
   - Interface do usuário
   - Integração com serviços
   - Componentes React

## 📚 Funcionalidades Implementadas

### ✅ AI Service Mock
- Health check simulado
- Criação de capítulos
- Transformação de conteúdo (simplificar, expandir, exemplificar, avaliar)
- Geração de atividades e avaliações
- Obtenção de capítulos e cursos

### ✅ Backend Service Mock
- Health check simulado
- Gestão de cursos
- Gestão de capítulos
- Operações CRUD completas

### ✅ Endpoints Disponíveis

#### AI Service
- `GET /health` - Status do serviço
- `GET /incremental/backend-status` - Status da integração
- `POST /incremental/create-chapter` - Criar capítulo
- `POST /incremental/continue-chapter` - Transformar conteúdo
- `GET /incremental/chapter/{id}` - Obter capítulo
- `GET /incremental/course/{id}/chapters` - Listar capítulos

#### Backend Service
- `GET /health` - Status do serviço
- `GET /courses` - Listar cursos
- `POST /courses` - Criar curso
- `GET /courses/{id}` - Obter curso
- `PUT /courses/{id}` - Atualizar curso
- `GET /courses/{id}/chapters` - Listar capítulos do curso
- `GET /chapters/{id}` - Obter capítulo
- `PUT /chapters/{id}` - Atualizar capítulo

## 🧪 Testando a Aplicação

### 1. Health Checks
```bash
# Teste o health check do AI Service
curl http://localhost:9002/api/health/ai

# Teste o health check do Backend Service
curl http://localhost:9002/api/health/backend
```

### 2. Interface Web
Acesse http://localhost:9002 e navegue pelas funcionalidades:
- Lista de cursos
- Criação de novos cursos
- Edição de capítulos
- Transformação de conteúdo com IA

## 🔍 Solução de Problemas

### Erro 404 no Health Check
- Verifique se as variáveis de ambiente estão configuradas
- Certifique-se de que `USE_AI_MOCK=true` e `USE_BACKEND_MOCK=true`
- Reinicie o servidor de desenvolvimento

### Erro de Conexão
- Verifique se as URLs dos serviços estão corretas
- Confirme se as chaves de API estão configuradas
- Teste a conectividade com os serviços externos

### Problemas de Performance
- Use o modo mock para desenvolvimento local
- Configure timeouts adequados
- Monitore o uso de recursos

## 📖 Documentação Adicional

- [Manual do AI Service](./AI-SERVICE-CHANGES.md)
- [Blueprint do Projeto](./docs/blueprint.md)
- [Componentes UI](./src/components/)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
