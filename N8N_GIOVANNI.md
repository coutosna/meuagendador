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

---

## 1. AUTENTICAÇÃO NA API

Todas as chamadas para a API precisam do token JWT no header.

**Como obter o token:**
```
POST http://localhost:3001/api/v1/auth/login
Body: { "email": "seu@email.com", "password": "suasenha" }
Resposta: { "accessToken": "eyJ..." }
```

**Usar em todas as requisições:**
```
Header: Authorization: Bearer eyJ...
```

**Dica:** No n8n, salve o accessToken em uma variável de credencial e reutilize em todos os nodes HTTP Request.

---

## 2. WEBHOOKS QUE O SISTEMA ENVIA PARA O N8N

Configure um **Webhook node** no n8n para receber cada evento.
Endpoint de entrada: `POST http://localhost:3001/api/v1/webhooks/n8n`

O sistema envia para a URL configurada em `N8N_WEBHOOK_URL` no `.env`.

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

**Uso típico:** Notificar equipe no Slack/WhatsApp quando chega mensagem nova fora do horário.

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

**Uso típico:** Adicionar lead no seu CRM externo, notificar vendedor via WhatsApp pessoal.

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

**Uso típico:** Adicionar no Google Calendar, enviar confirmação customizada, criar evento no Zoom.

---

### Evento: `appointment.confirmed`
Dispara quando agendamento é confirmado pelo cliente ou pelo atendente.

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

**Uso típico:** Enviar lembrete customizado pelo WhatsApp com link de cancelamento.

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

**Uso típico:** Alertar atendente via WhatsApp/Telegram que precisa assumir o chat.

---

## 3. ENDPOINTS DA API PARA O N8N CHAMAR

### Base URL: `http://localhost:3001/api/v1`

---

### 3.1 CONVERSAS

**Listar conversas abertas:**
```
GET /conversations?status=open&limit=20
```

**Enviar mensagem para uma conversa:**
```
POST /whatsapp/instances/{instanceName}/send
Body: {
  "conversationId": "uuid",
  "content": "Olá! Vi que você entrou em contato..."
}
```

**Ativar/desativar bot em uma conversa:**
```
POST /conversations/{conversationId}/toggle-bot
```

**Marcar conversa como lida:**
```
POST /conversations/{conversationId}/read
```

---

### 3.2 CONTATOS

**Criar/buscar contato:**
```
GET /contacts?search=5511999999999
POST /contacts
Body: { "name": "Maria Santos", "phone": "5511999999999", "source": "n8n" }
```

**Atualizar dados do contato:**
```
PATCH /contacts/{id}
Body: { "tags": ["vip", "cirurgia"], "customFields": { "cpf": "123.456.789-00" } }
```

---

### 3.3 CRM — LEADS

**Listar leads do pipeline:**
```
GET /crm/leads?pipelineId=uuid&stageId=uuid
```

**Criar lead manualmente (via tráfego pago, formulário, etc):**
```
POST /crm/leads
Body: {
  "title": "Lead - João da campanha Google",
  "contactId": "uuid",
  "value": 500.00,
  "notes": "Veio do anúncio de cirurgia"
}
```

**Mover lead de estágio:**
```
PATCH /crm/leads/{id}/stage
Body: { "stageId": "uuid-estagio-agendado", "reason": "Agendamento confirmado via n8n" }
```

---

### 3.4 AGENDA — AGENDAMENTOS

**Verificar horários disponíveis:**
```
GET /agenda/slots?date=2026-06-20&serviceId=uuid
Resposta: { "date": "2026-06-20", "slots": ["09:00", "09:30", "10:00", "14:00"] }
```

**Criar agendamento (após qualificação no funil):**
```
POST /agenda/appointments
Body: {
  "contactId": "uuid",
  "serviceId": "uuid",
  "scheduledAt": "2026-06-20T10:00:00.000Z",
  "notes": "Cliente veio via campanha Google"
}
```

**Confirmar agendamento:**
```
POST /agenda/appointments/{id}/confirm
```

**Cancelar agendamento:**
```
POST /agenda/appointments/{id}/cancel
```

---

### 3.5 DASHBOARD (para relatórios automáticos)

**Visão geral do dia:**
```
GET /dashboard/overview
Resposta: {
  "contacts": { "total": 142, "today": 5 },
  "leads": { "total": 89, "qualified": 34, "won": 12, "conversionRate": 13 },
  "appointments": { "today": 8, "month": 67 },
  "conversations": { "total": 156, "open": 23 }
}
```

---

## 4. FLUXOS PRONTOS PARA MONTAR NO N8N

---

### FLUXO A — Lead do Tráfego Pago → Sistema

**Trigger:** Webhook recebe lead de formulário Facebook/Google Ads

```
[Webhook] → [HTTP: POST /contacts] → [HTTP: POST /crm/leads] → [HTTP: POST /whatsapp/send]
```

**Passos:**
1. Receber lead do formulário (nome, telefone, interesse)
2. `POST /contacts` para criar contato
3. `POST /crm/leads` para criar no CRM
4. `POST /whatsapp/instances/{name}/send` para enviar mensagem de boas-vindas

---

### FLUXO B — Notificação de Handoff (IA pediu ajuda humana)

**Trigger:** Webhook `conversation.handoff`

```
[Webhook n8n] → [Switch: tenantId] → [WhatsApp pessoal do atendente] ou [Telegram]
```

**Mensagem para o atendente:**
```
🔔 *Atenção!* Um lead precisa de atendimento humano.

👤 *Cliente:* {{contact.name}}
📱 *Telefone:* {{contact.phone}}
💬 *Última mensagem:* "{{lastMessage}}"

Acesse: https://app.meuagendador.ai/conversations/{{conversation.id}}
```

---

### FLUXO C — Lembrete de Agendamento Personalizado

**Trigger:** Webhook `appointment.reminder` (24h antes)

```
[Webhook] → [Format message] → [WhatsApp API via Evolution] → [Mark reminder sent]
```

**Mensagem para o cliente:**
```
Olá, {{contact.name}}! 👋

Lembrando que você tem uma consulta amanhã:
📅 *{{appointment.date}}* às *{{appointment.time}}*
🏥 *{{service.name}}*

Confirme sua presença respondendo *SIM* ou cancele respondendo *NÃO*.
```

---

### FLUXO D — Relatório Diário Automático

**Trigger:** Cron `0 18 * * 1-5` (18h, dias úteis)

```
[Cron] → [HTTP: GET /dashboard/overview] → [HTTP: GET /reports/appointments] → [Format] → [WhatsApp/Email]
```

**Mensagem de resumo:**
```
📊 *Resumo do dia — {{date}}*

👥 Leads hoje: {{contacts.today}}
📅 Agendamentos: {{appointments.today}}
💬 Conversas abertas: {{conversations.open}}
✅ Taxa de conversão: {{leads.conversionRate}}%
```

---

### FLUXO E — Reativação de Leads Inativos

**Trigger:** Cron `0 9 * * 1` (toda segunda-feira, 9h)

```
[Cron] → [HTTP: GET /conversations?status=open] → [Filter: lastMessageAt > 72h] → [WhatsApp reativação]
```

**Mensagem de reativação:**
```
Oii, {{contact.name}}! Tudo bem? 😊

Vi que você entrou em contato conosco há alguns dias...
Ainda posso te ajudar a {{service.name}}?

Responda qualquer coisa que voltamos a conversar! 🚀
```

---

## 5. CONFIGURAÇÃO INICIAL NO N8N

### Passo 1 — Credenciais
No n8n, crie uma credencial "Header Auth":
- Name: `MeuAgendador API`
- Header Name: `Authorization`
- Header Value: `Bearer {ACCESS_TOKEN_AQUI}`

### Passo 2 — Variáveis de ambiente
```
API_BASE_URL = http://localhost:3001/api/v1
EVOLUTION_INSTANCE = nome-da-instancia-whatsapp
```

### Passo 3 — Webhook de entrada
No `.env` da API, configure:
```
N8N_WEBHOOK_URL=http://seu-n8n.com/webhook/meuagendador
N8N_WEBHOOK_SECRET=uma-senha-secreta-aqui
```

No n8n, valide o header `x-webhook-secret` para segurança.

### Passo 4 — Testar conexão
```
GET http://localhost:3001/api/v1/dashboard/overview
Authorization: Bearer {token}
```

---

## 6. TABELA DE REFERÊNCIA RÁPIDA

| O que fazer | Método | Endpoint |
|-------------|--------|----------|
| Login / obter token | POST | `/auth/login` |
| Ver conversas abertas | GET | `/conversations?status=open` |
| Enviar mensagem | POST | `/whatsapp/instances/{name}/send` |
| Criar contato | POST | `/contacts` |
| Criar lead no CRM | POST | `/crm/leads` |
| Mover lead de estágio | PATCH | `/crm/leads/{id}/stage` |
| Ver slots disponíveis | GET | `/agenda/slots?date=YYYY-MM-DD` |
| Criar agendamento | POST | `/agenda/appointments` |
| Confirmar agendamento | POST | `/agenda/appointments/{id}/confirm` |
| Cancelar agendamento | POST | `/agenda/appointments/{id}/cancel` |
| Relatório geral | GET | `/dashboard/overview` |
| Relatório de leads | GET | `/reports/leads?from=&to=` |
| Config da IA | GET/PUT | `/ai/config` |

---

## 7. EXEMPLO COMPLETO — NODE HTTP REQUEST NO N8N

**Criar agendamento após lead qualificado:**
```json
{
  "method": "POST",
  "url": "={{ $env.API_BASE_URL }}/agenda/appointments",
  "authentication": "predefinedCredentialType",
  "nodeCredentialType": "httpHeaderAuth",
  "body": {
    "contactId": "={{ $json.data.contact.id }}",
    "serviceId": "={{ $json.data.serviceId }}",
    "scheduledAt": "={{ $json.data.scheduledAt }}",
    "notes": "Criado automaticamente via n8n"
  }
}
```

---

**Dúvidas? Fale com o Sócio 1 (dev).**
