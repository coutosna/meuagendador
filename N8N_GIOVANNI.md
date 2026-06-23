# Documentação n8n — MeuAgendador AI
## Para: Giovanni (Sócio 2)

---

## VISÃO GERAL DA INTEGRAÇÃO

O sistema envia webhooks para o n8n em tempo real sempre que eventos importantes acontecem.
O n8n pode também **chamar a API** para consultar dados, mover leads, criar agendamentos, etc.

```
WhatsApp → Evolution API → NestJS API → Bull Queue → Processadores
                                    ↓
                              n8n Webhooks (eventos)
                                    ↓
                         Suas automações no n8n
```

**URLs de produção:**
- API: `https://api-production-d8a6.up.railway.app/api/v1`
- Frontend: `https://meuagendador.vercel.app` (sua URL da Vercel)

---

## PARTE 1 — CONFIGURAÇÃO INICIAL DO N8N

### 1.1 — Criar a Credencial da API

Esta credencial será usada em todos os nodes HTTP Request para autenticar na API.

**Passo a passo:**

1. No n8n, clique em **Credentials** (menu lateral esquerdo)
2. Clique em **Add Credential**
3. Busque por **Header Auth** e selecione
4. Preencha:
   - **Name:** `MeuAgendador API`
   - **Name (header):** `Authorization`
   - **Value:** `Bearer SEU_TOKEN_AQUI`
5. Clique em **Save**

> ⚠️ Para obter o token, faça uma requisição de login (veja seção 1.2 abaixo) e cole o `accessToken` no campo Value, precedido de `Bearer `.

---

### 1.2 — Obter o Token JWT

Antes de qualquer coisa, você precisa de um token de acesso.

**No n8n, crie um workflow temporário:**

1. Adicione o nó **HTTP Request**
2. Configure:
   - **Method:** `POST`
   - **URL:** `https://api-production-d8a6.up.railway.app/api/v1/auth/login`
   - **Body Content Type:** `JSON`
   - **Body (JSON):**
     ```json
     {
       "email": "seu@email.com",
       "password": "suasenha"
     }
     ```
3. Execute o nó → copie o valor de `accessToken` da resposta
4. Cole esse valor na credencial criada no passo 1.1

> ⚠️ **O token expira.** Para automação contínua, crie um sub-workflow que renova o token a cada 23h usando um nó **Schedule Trigger** + **HTTP Request** de login + **Set** para atualizar a variável global.

---

### 1.3 — Configurar Variáveis Globais

1. No n8n, vá em **Settings → Variables**
2. Crie as seguintes variáveis:

| Nome | Valor |
|------|-------|
| `API_BASE_URL` | `https://api-production-d8a6.up.railway.app/api/v1` |
| `EVOLUTION_INSTANCE` | `nome-da-sua-instancia-whatsapp` |
| `WEBHOOK_SECRET` | `sua-chave-secreta-do-webhook` |

**Como usar nos nodes:** `{{ $vars.API_BASE_URL }}`

---

### 1.4 — Testar a Conexão

1. Crie um novo workflow
2. Adicione um nó **HTTP Request**
3. Configure:
   - **Method:** `GET`
   - **URL:** `https://api-production-d8a6.up.railway.app/api/v1/dashboard/overview`
   - **Authentication:** `Predefined Credential Type`
   - **Credential Type:** `Header Auth`
   - **Credential:** `MeuAgendador API`
4. Clique em **Execute Node**
5. Se retornar dados de contacts, leads, appointments → está funcionando ✅

---

## PARTE 2 — RECEBENDO EVENTOS (WEBHOOKS DE ENTRADA)

O MeuAgendador envia eventos para o n8n. Para cada fluxo, você precisa criar um **Webhook node** de entrada.

### Como criar um Webhook de entrada no n8n:

1. Crie um novo workflow
2. Adicione o nó **Webhook** como trigger (primeiro nó)
3. Configure:
   - **HTTP Method:** `POST`
   - **Path:** escolha um nome (ex: `meuagendador-eventos`)
   - **Authentication:** `Header Auth`
   - **Credential:** crie uma credencial Header Auth com:
     - Header Name: `x-webhook-secret`
     - Value: `sua-chave-secreta` (a mesma do `N8N_WEBHOOK_SECRET` no Railway)
   - **Response Mode:** `Respond Immediately`
   - **Response Code:** `200`
4. Clique em **Listen for Test Event** para pegar a URL
5. A URL gerada será algo como:
   ```
   https://seu-n8n.com/webhook/meuagendador-eventos
   ```
6. Passe essa URL para o Sócio 1 para configurar no Railway como `N8N_WEBHOOK_URL`

> 💡 **Dica:** Use um único Webhook para todos os eventos e use um nó **Switch** logo depois para separar por tipo de evento (`message.received`, `appointment.created`, etc.)

### Estrutura recomendada para receber todos os eventos:

```
[Webhook] → [Switch: campo "event"] → case "message.received"     → [seu fluxo A]
                                    → case "lead.qualified"        → [seu fluxo B]
                                    → case "appointment.created"   → [seu fluxo C]
                                    → case "appointment.reminder"  → [seu fluxo D]
                                    → case "conversation.handoff"  → [seu fluxo E]
                                    → case "appointment.cancelled" → [seu fluxo F]
```

**Configuração do nó Switch:**
- **Mode:** `Rules`
- **Field:** `{{ $json.event }}`
- Adicione uma regra por evento

---

## PARTE 3 — EVENTOS QUE O SISTEMA ENVIA

### Evento: `message.received`
Dispara quando chega nova mensagem pelo WhatsApp.

```json
{
  "event": "message.received",
  "tenantId": "uuid-do-tenant",
  "timestamp": "2026-06-18T14:30:00Z",
  "data": {
    "conversation": {
      "id": "uuid",
      "status": "open",
      "botEnabled": true
    },
    "contact": {
      "id": "uuid",
      "name": "Maria Santos",
      "phone": "5511999999999"
    },
    "message": {
      "id": "uuid",
      "content": "Olá, gostaria de agendar uma consulta",
      "type": "text",
      "senderType": "contact"
    }
  }
}
```

---

### Evento: `lead.qualified`
Dispara quando a IA qualifica um lead automaticamente.

```json
{
  "event": "lead.qualified",
  "tenantId": "uuid-do-tenant",
  "timestamp": "2026-06-18T14:31:00Z",
  "data": {
    "lead": {
      "id": "uuid",
      "title": "Lead - Maria Santos",
      "stageId": "uuid-estagio-qualificado"
    },
    "contact": {
      "id": "uuid",
      "name": "Maria Santos",
      "phone": "5511999999999"
    },
    "qualificationData": {
      "interest": "Consulta médica",
      "budget": "Até R$ 200",
      "urgency": "Esta semana"
    }
  }
}
```

---

### Evento: `appointment.created`
Dispara quando agendamento é criado (pela IA ou manualmente).

```json
{
  "event": "appointment.created",
  "tenantId": "uuid-do-tenant",
  "timestamp": "2026-06-18T14:35:00Z",
  "data": {
    "appointment": {
      "id": "uuid",
      "scheduledAt": "2026-06-20T10:00:00Z",
      "duration": 60,
      "status": "pending",
      "notes": ""
    },
    "contact": {
      "id": "uuid",
      "name": "Maria Santos",
      "phone": "5511999999999"
    },
    "service": {
      "id": "uuid",
      "name": "Consulta médica",
      "duration": 60,
      "price": 150.00
    }
  }
}
```

---

### Evento: `appointment.confirmed`
```json
{
  "event": "appointment.confirmed",
  "tenantId": "uuid-do-tenant",
  "data": {
    "appointment": { "id": "uuid", "scheduledAt": "2026-06-20T10:00:00Z" },
    "contact": { "name": "Maria Santos", "phone": "5511999999999" }
  }
}
```

---

### Evento: `appointment.reminder`
Dispara 24h e 1h antes do agendamento (cronjob interno).

```json
{
  "event": "appointment.reminder",
  "tenantId": "uuid-do-tenant",
  "data": {
    "appointment": { "id": "uuid", "scheduledAt": "2026-06-20T10:00:00Z" },
    "contact": { "name": "Maria Santos", "phone": "5511999999999" },
    "hoursUntil": 24
  }
}
```

---

### Evento: `appointment.cancelled`
```json
{
  "event": "appointment.cancelled",
  "tenantId": "uuid-do-tenant",
  "data": {
    "appointment": { "id": "uuid", "scheduledAt": "2026-06-20T10:00:00Z", "cancelReason": "Indisponível" },
    "contact": { "name": "Maria Santos", "phone": "5511999999999" }
  }
}
```

---

### Evento: `conversation.handoff`
Dispara quando a IA não consegue resolver e pede intervenção humana.

```json
{
  "event": "conversation.handoff",
  "tenantId": "uuid-do-tenant",
  "data": {
    "conversation": { "id": "uuid" },
    "contact": { "name": "Maria Santos", "phone": "5511999999999" },
    "lastMessage": "Quero falar com um atendente"
  }
}
```

---

## PARTE 4 — ENDPOINTS DA API PARA CHAMAR

### Base URL: `https://api-production-d8a6.up.railway.app/api/v1`

| O que fazer | Método | Endpoint |
|---|---|---|
| Login / obter token | POST | `/auth/login` |
| Ver conversas abertas | GET | `/conversations?status=open` |
| Enviar mensagem WhatsApp | POST | `/whatsapp/instances/{name}/send` |
| Ativar/pausar bot | POST | `/conversations/{id}/toggle-bot` |
| Criar contato | POST | `/contacts` |
| Buscar contato | GET | `/contacts?search=5511999999999` |
| Atualizar contato | PATCH | `/contacts/{id}` |
| Criar lead no CRM | POST | `/crm/leads` |
| Mover lead de estágio | PATCH | `/crm/leads/{id}/stage` |
| Ver slots disponíveis | GET | `/agenda/slots?date=YYYY-MM-DD` |
| Criar agendamento | POST | `/agenda/appointments` |
| Confirmar agendamento | POST | `/agenda/appointments/{id}/confirm` |
| Cancelar agendamento | POST | `/agenda/appointments/{id}/cancel` |
| Relatório geral | GET | `/dashboard/overview` |
| Relatório de leads | GET | `/reports/leads?from=&to=` |

---

## PARTE 5 — FLUXOS COMPLETOS PASSO A PASSO

---

### FLUXO A — Notificação de Handoff (IA pediu ajuda humana)

**Objetivo:** Quando a IA não resolve, notificar o atendente via WhatsApp pessoal imediatamente.

**Trigger:** Evento `conversation.handoff`

**Nodes necessários:**
1. `Webhook` → recebe o evento
2. `Switch` → filtra `event === "conversation.handoff"`
3. `Set` → formata a mensagem
4. `HTTP Request` → envia WhatsApp para o atendente

**Passo a passo:**

**Node 1 — Webhook (Trigger)**
- Type: `Webhook`
- HTTP Method: `POST`
- Path: `meuagendador-eventos`
- Authentication: Header Auth (`x-webhook-secret`)

**Node 2 — Switch**
- Mode: `Rules`
- Add Rule:
  - Field: `{{ $json.event }}`
  - Operation: `Equal`
  - Value: `conversation.handoff`

**Node 3 — Set (formatar mensagem)**
- Mode: `Define below`
- Add field:
  - Name: `mensagem`
  - Value:
    ```
    🔔 *Atenção! Cliente precisa de atendimento humano.*

    👤 *Cliente:* {{ $json.data.contact.name }}
    📱 *Telefone:* {{ $json.data.contact.phone }}
    💬 *Última mensagem:* "{{ $json.data.lastMessage }}"

    🔗 Acesse: https://meuagendador.vercel.app/conversations
    ```

**Node 4 — HTTP Request (enviar WhatsApp)**
- Method: `POST`
- URL: `https://api-production-d8a6.up.railway.app/api/v1/whatsapp/instances/{{ $vars.EVOLUTION_INSTANCE }}/send`
- Authentication: `Predefined Credential Type` → `MeuAgendador API`
- Body (JSON):
  ```json
  {
    "phone": "5511999990000",
    "content": "{{ $json.mensagem }}"
  }
  ```
  > Substitua `5511999990000` pelo WhatsApp do atendente

---

### FLUXO B — Lembrete de Agendamento 24h antes

**Objetivo:** Enviar mensagem personalizada para o cliente 24h antes do compromisso.

**Trigger:** Evento `appointment.reminder` com `hoursUntil === 24`

**Nodes necessários:**
1. `Webhook` → recebe o evento
2. `Switch` → filtra `event === "appointment.reminder"`
3. `IF` → verifica se `hoursUntil === 24`
4. `Code` → formata data/hora em português
5. `HTTP Request` → envia WhatsApp para o cliente

**Passo a passo:**

**Node 1 — Webhook (Trigger)**
- Mesmo webhook do Fluxo A (use o Switch central para rotear)

**Node 2 — Switch**
- Field: `{{ $json.event }}`
- Value: `appointment.reminder`

**Node 3 — IF (filtrar só 24h)**
- Condition:
  - Field: `{{ $json.data.hoursUntil }}`
  - Operation: `Equal`
  - Value: `24`

**Node 4 — Code (formatar data)**
- Language: `JavaScript`
- Code:
  ```javascript
  const scheduledAt = new Date($input.first().json.data.appointment.scheduledAt);
  const date = scheduledAt.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long'
  });
  const time = scheduledAt.toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit'
  });

  return [{
    json: {
      ...$input.first().json,
      formattedDate: date,
      formattedTime: time
    }
  }];
  ```

**Node 5 — HTTP Request (enviar WhatsApp)**
- Method: `POST`
- URL: `https://api-production-d8a6.up.railway.app/api/v1/whatsapp/instances/{{ $vars.EVOLUTION_INSTANCE }}/send`
- Authentication: `MeuAgendador API`
- Body (JSON):
  ```json
  {
    "conversationId": "{{ $json.data.conversation.id }}",
    "content": "Olá, {{ $json.data.contact.name }}! 👋\n\nLembrando que você tem um compromisso amanhã:\n\n📅 *{{ $json.formattedDate }}* às *{{ $json.formattedTime }}*\n✂️ *{{ $json.data.service.name }}*\n\nConfirme sua presença respondendo *SIM* ou cancele respondendo *NÃO*. 😊"
  }
  ```

---

### FLUXO C — Lead de Tráfego Pago → Sistema

**Objetivo:** Receber lead de formulário Facebook/Google Ads, cadastrar no sistema e enviar boas-vindas.

**Trigger:** Webhook do Facebook Lead Ads ou Google Ads

**Nodes necessários:**
1. `Webhook` (ou `Facebook Lead Ads Trigger`)
2. `HTTP Request` → cria contato
3. `HTTP Request` → cria lead no CRM
4. `HTTP Request` → envia mensagem de boas-vindas

**Passo a passo:**

**Node 1 — Webhook (Trigger)**
- Path: `lead-trafego-pago`
- Método: `POST`

**Node 2 — HTTP Request (criar contato)**
- Method: `POST`
- URL: `https://api-production-d8a6.up.railway.app/api/v1/contacts`
- Authentication: `MeuAgendador API`
- Body (JSON):
  ```json
  {
    "name": "{{ $json.name }}",
    "phone": "{{ $json.phone }}",
    "email": "{{ $json.email }}",
    "source": "trafego-pago",
    "tags": ["lead-ads"]
  }
  ```
- **Output:** salva `{{ $json.id }}` como `contactId`

**Node 3 — HTTP Request (criar lead no CRM)**
- Method: `POST`
- URL: `https://api-production-d8a6.up.railway.app/api/v1/crm/leads`
- Authentication: `MeuAgendador API`
- Body (JSON):
  ```json
  {
    "title": "Lead Ads - {{ $('Node 2').item.json.name }}",
    "contactId": "{{ $('Node 2').item.json.id }}",
    "value": 0,
    "notes": "Veio de campanha: {{ $json.campaign_name }}"
  }
  ```

**Node 4 — HTTP Request (enviar boas-vindas)**
- Method: `POST`
- URL: `https://api-production-d8a6.up.railway.app/api/v1/whatsapp/instances/{{ $vars.EVOLUTION_INSTANCE }}/send`
- Authentication: `MeuAgendador API`
- Body (JSON):
  ```json
  {
    "phone": "{{ $('Node 2').item.json.phone }}",
    "content": "Olá, {{ $('Node 2').item.json.name }}! 😊\n\nRecebemos seu contato e em breve um de nossos atendentes vai te chamar.\n\nEnquanto isso, pode nos contar mais sobre o que você precisa! 🚀"
  }
  ```

---

### FLUXO D — Relatório Diário Automático

**Objetivo:** Enviar resumo do dia para o gestor todo dia às 18h.

**Trigger:** Schedule (Cron)

**Nodes necessários:**
1. `Schedule Trigger` → 18h dias úteis
2. `HTTP Request` → busca overview do dashboard
3. `Code` → formata a mensagem
4. `HTTP Request` → envia WhatsApp para o gestor

**Passo a passo:**

**Node 1 — Schedule Trigger**
- Trigger Interval: `Cron`
- Cron Expression: `0 18 * * 1-5`
  _(segunda a sexta às 18h)_

**Node 2 — HTTP Request (dados do dashboard)**
- Method: `GET`
- URL: `https://api-production-d8a6.up.railway.app/api/v1/dashboard/overview`
- Authentication: `MeuAgendador API`

**Node 3 — Code (formatar mensagem)**
- Language: `JavaScript`
- Code:
  ```javascript
  const data = $input.first().json;
  const today = new Date().toLocaleDateString('pt-BR');

  const msg = `📊 *Resumo do dia — ${today}*

👥 Novos contatos hoje: ${data.contacts.today}
📅 Agendamentos hoje: ${data.appointments.today}
📆 Agendamentos no mês: ${data.appointments.month}
💬 Conversas abertas: ${data.conversations.open}
🎯 Leads qualificados: ${data.leads.qualified}
✅ Taxa de conversão: ${data.leads.conversionRate}%`;

  return [{ json: { mensagem: msg } }];
  ```

**Node 4 — HTTP Request (enviar WhatsApp)**
- Method: `POST`
- URL: `https://api-production-d8a6.up.railway.app/api/v1/whatsapp/instances/{{ $vars.EVOLUTION_INSTANCE }}/send`
- Authentication: `MeuAgendador API`
- Body (JSON):
  ```json
  {
    "phone": "5511999990000",
    "content": "{{ $json.mensagem }}"
  }
  ```
  > Substitua pelo WhatsApp do gestor

---

### FLUXO E — Reativação de Leads Inativos

**Objetivo:** Toda segunda-feira às 9h, reativar conversas sem resposta há mais de 72h.

**Trigger:** Schedule (Cron)

**Nodes necessários:**
1. `Schedule Trigger` → toda segunda 9h
2. `HTTP Request` → lista conversas abertas
3. `Code` → filtra as inativas há +72h
4. `Split In Batches` → itera por conversa
5. `HTTP Request` → envia mensagem de reativação

**Passo a passo:**

**Node 1 — Schedule Trigger**
- Cron Expression: `0 9 * * 1`
  _(toda segunda-feira às 9h)_

**Node 2 — HTTP Request (listar conversas)**
- Method: `GET`
- URL: `https://api-production-d8a6.up.railway.app/api/v1/conversations?status=open&limit=100`
- Authentication: `MeuAgendador API`

**Node 3 — Code (filtrar inativos)**
- Language: `JavaScript`
- Code:
  ```javascript
  const conversations = $input.first().json.data || [];
  const cutoff = Date.now() - (72 * 60 * 60 * 1000); // 72h atrás

  const inactive = conversations.filter(c => {
    const lastMsg = new Date(c.lastMessageAt).getTime();
    return lastMsg < cutoff;
  });

  return inactive.map(c => ({ json: c }));
  ```

**Node 4 — Split In Batches**
- Batch Size: `1`
- _(processa uma conversa por vez)_

**Node 5 — HTTP Request (enviar reativação)**
- Method: `POST`
- URL: `https://api-production-d8a6.up.railway.app/api/v1/whatsapp/instances/{{ $vars.EVOLUTION_INSTANCE }}/send`
- Authentication: `MeuAgendador API`
- Body (JSON):
  ```json
  {
    "conversationId": "{{ $json.id }}",
    "content": "Oii, {{ $json.contact.name }}! Tudo bem? 😊\n\nVi que você entrou em contato conosco há alguns dias e queria saber se ainda posso te ajudar!\n\nResponda qualquer coisa que continuamos por aqui. 🚀"
  }
  ```

---

## PARTE 6 — CONFIGURAÇÃO DO REDIS (UPSTASH)

O Redis usado é o **Upstash** com conexão TLS obrigatória. A URL deve usar `rediss://` (dois `s`):

```
REDIS_URL=rediss://default:SENHA@mint-boxer-152766.upstash.io:6379
```

> ⚠️ Se usar `redis://` (um `s`) a conexão vai falhar. Sempre use `rediss://` com Upstash.

---

## PARTE 7 — CHECKLIST DE VALIDAÇÃO

Antes de colocar em produção, valide cada item:

- [ ] Credencial `MeuAgendador API` criada e testada
- [ ] Variáveis globais configuradas (`API_BASE_URL`, `EVOLUTION_INSTANCE`)
- [ ] Webhook de entrada ativo e URL passada para o Sócio 1
- [ ] Fluxo A (Handoff) testado — enviou WhatsApp para o atendente
- [ ] Fluxo B (Lembrete) testado — mensagem chegou formatada corretamente
- [ ] Fluxo C (Lead Ads) testado — contato criado + lead no CRM + boas-vindas enviadas
- [ ] Fluxo D (Relatório) testado — resumo chegou no WhatsApp do gestor
- [ ] Fluxo E (Reativação) testado — mensagens enviadas para inativos

---

## PARTE 8 — TROUBLESHOOTING

| Erro | Causa | Solução |
|---|---|---|
| `401 Unauthorized` | Token JWT expirado | Refaça o login e atualize a credencial |
| `403 Forbidden` | Header `x-webhook-secret` errado | Verifique o valor do secret |
| `404 Not Found` | URL ou ID errado | Verifique a URL e os IDs usados |
| `500 Internal Server Error` | Erro na API | Verifique os logs no Railway |
| Webhook não dispara | URL não configurada no Railway | Peça ao Sócio 1 para configurar `N8N_WEBHOOK_URL` |
| WhatsApp não envia | Instância desconectada | Reconecte a instância na Evolution API |

---

**Dúvidas? Fale com o Sócio 1 (dev).**
