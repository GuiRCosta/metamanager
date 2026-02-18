# Melhorias da Implementacao FBL

Roadmap de melhorias identificadas apos a implementacao completa do Facebook Login for Business.

---

## Prioridade Alta (Impacto direto no uso)

### 1. Corrigir Inconsistencia de Versao da API
- **Status**: Implementado
- **Problema**: Frontend usa `v22.0` no OAuth URL, mas callback e backend defaultam para `v24.0`
- **Solucao**: Padronizar para `v22.0` em todos os pontos (callback, models, config)
- **Arquivos**: `callback/route.ts`, `models/settings.py`, `config.py`, `settings/page.tsx`

### 2. Selecao de Ad Account no Fluxo OAuth
- **Status**: Implementado
- **Problema**: Callback salva apenas a primeira ad account, sem opcao de escolha
- **Solucao**: Salvar todas as contas encontradas e redirecionar para tela de selecao no Settings
- **Arquivos**: `callback/route.ts`, `settings/page.tsx`, `api.ts`

### 3. Tracking de Expiracao do Token
- **Status**: Implementado
- **Problema**: Sem monitoramento de validade do token SUAT
- **Solucao**: Salvar `token_expires_at` no settings e exibir aviso visual quando proximo de expirar
- **Arquivos**: `callback/route.ts`, `models/settings.py`, `settings/page.tsx`, `api.ts`

### 4. Buscar Page ID no Fluxo OAuth
- **Status**: Implementado
- **Problema**: UI mostra `page_id` mas o fluxo OAuth nunca busca as Pages
- **Solucao**: Buscar pages disponiveis apos obter token e salvar automaticamente
- **Arquivos**: `callback/route.ts`

### 5. Funcionalidade de Desconectar
- **Status**: Implementado
- **Problema**: Nao existe botao para revogar acesso / desconectar a conta Meta
- **Solucao**: Endpoint `POST /api/meta/disconnect` que limpa credenciais e revoga permissoes na Meta
- **Arquivos**: `frontend/src/app/api/meta/disconnect/route.ts`, `settings/page.tsx`

---

## Prioridade Media

### 6. Validacao de Scopes do Token
- **Status**: Pendente
- **Problema**: Nao verifica se o token tem as permissoes necessarias (`ads_management`, `ads_read`)
- **Solucao**: Chamar `GET /me/permissions` apos obter token e validar scopes obrigatorios

### 7. Suporte a Multiplos Business Managers
- **Status**: Pendente
- **Problema**: Se usuario tem acesso a mais de um BM, so o primeiro e salvo
- **Solucao**: Listar BMs disponiveis e permitir selecao

### 8. Error Handling Aprimorado
- **Status**: Pendente
- **Problema**: Erros de "permission denied" ou token invalido no backend nao sao logados
- **Solucao**: Adicionar logging estruturado com Sentry para erros de API Meta

---

## Prioridade Baixa

### 9. Metricas de Conexao
- **Status**: Pendente
- **Problema**: Sem tracking de sucesso/falha do fluxo OAuth
- **Solucao**: Logging de eventos de conexao/desconexao com timestamp

### 10. Webhook de Expiracao
- **Status**: Pendente
- **Problema**: Sem notificacao proativa quando o token esta para expirar
- **Solucao**: Job agendado que verifica `token_expires_at` e envia alerta via WhatsApp
