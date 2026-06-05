# Documentação de Notificações Push - DoseCerta

Este documento explica detalhadamente como o sistema de notificações push está implementado no app DoseCerta. O sistema utiliza a **Web Push API** padrão, seguindo a arquitetura de **PWA (Progressive Web App)**.

---

## 1. Arquitetura Geral

O fluxo de notificações envolve três componentes principais:
1.  **Client (Navegador do Usuário):** Registra o Service Worker e solicita permissão para notificações.
2.  **Backend (Next.js API & Supabase):** Armazena as assinaturas (tokens) e processa a lógica de quando enviar cada alerta.
3.  **Serviço de Push do Navegador (FCM/Mozilla/Apple):** Intermediário que entrega a mensagem ao dispositivo, mesmo com o navegador fechado.

---

## 2. Fluxo de Inscrição (Client-side)

A lógica de inscrição reside principalmente em `src/lib/web-push.ts` e é disparada na página de configurações (`src/app/(dashboard)/settings/page.tsx`).

### Passo a passo:
1.  **Registro do Service Worker:** O arquivo `public/sw.js` é registrado no `layout.tsx` raiz do app.
2.  **Solicitação de Permissão:** Quando o usuário clica em "Ativar Notificações", o app chama `Notification.requestPermission()`.
3.  **Geração da Assinatura:**
    *   O app utiliza uma **Chave Pública VAPID** (configurada no `.env`) para identificar o servidor.
    *   O navegador gera um objeto de assinatura único contendo um `endpoint` e chaves de criptografia (`p256dh` e `auth`).
4.  **Armazenamento no Banco:** A assinatura é enviada para o Supabase e salva na tabela `push_subscriptions`, vinculada ao `user_id` do usuário.

---

## 3. Disparo das Notificações (Server-side)

As notificações não são disparadas em tempo real pelo frontend, mas sim por um processo agendado (Cron Job) no backend.

### O Endpoint de Envio: `src/app/api/push/send/route.ts`
Este endpoint é chamado periodicamente e executa a seguinte lógica:
1.  **Verificação de Horários:** Varre a tabela de medicamentos para encontrar doses que estão próximas do horário (5 min antes), no horário exato, ou atrasadas.
2.  **Lógica de Lembretes (Kinds):**
    *   `pre`: 5 minutos antes da dose.
    *   `due`: No momento exato da dose.
    *   `post`: 5 minutos após o horário.
    *   `nag-X`: Lembretes persistentes a cada 10 minutos para doses não tomadas.
3.  **Alerta de Estoque Baixo:** Além das doses, o sistema calcula se o estoque do remédio está acabando e envia um alerta de "Estoque Baixo" com link para recompra.
4.  **Envio via Web-Push:** Para cada usuário que precisa de alerta, o servidor recupera suas assinaturas do banco e usa a biblioteca `web-push` para enviar a carga (payload) criptografada.

---

## 4. O Service Worker (`public/sw.js`)

O Service Worker é o "cérebro" que roda em segundo plano no dispositivo do usuário.

### Evento `push`:
Quando o dispositivo recebe o sinal de push:
*   O SW descriptografa o JSON recebido.
*   **Se o app estiver aberto:** Ele envia uma mensagem interna (`postMessage`) para o React, que pode mostrar um alerta dentro da interface.
*   **Se o app estiver fechado:** Ele exibe a notificação nativa do sistema operacional usando `self.registration.showNotification`.

### Evento `notificationclick`:
Quando o usuário clica na notificação:
*   O SW fecha a notificação.
*   Registra um evento de telemetria (analíticos) para saber que a notificação foi aberta.
*   Identifica a URL de destino (ex: `/home?medication=ID`) e foca na aba do app ou abre uma nova janela navegando para a página correta.

---

## 5. Requisitos Técnicos e Segurança

*   **VAPID Keys:** O sistema utiliza chaves VAPID para garantir que apenas o nosso servidor possa enviar mensagens para os usuários inscritos.
*   **HTTPS:** Notificações push e Service Workers exigem obrigatoriamente uma conexão segura (HTTPS), exceto em `localhost`.
*   **Tratamento de Expirados:** Quando o servidor tenta enviar um push e recebe um erro `410 Gone` (assinatura expirada ou app desinstalado), ele remove automaticamente aquela assinatura do banco de dados para manter a eficiência.

---

## 6. Tabelas Envolvidas (Supabase)

*   `push_subscriptions`: Armazena os tokens de push dos dispositivos.
*   `reminder_logs`: Registra quais lembretes já foram enviados para evitar duplicidade.
*   `medication_logs`: Usado para verificar se o usuário já tomou o remédio (e parar de enviar lembretes "nag").
*   `notifications_sent` (Analytics): Rastreia a taxa de entrega e abertura para fins estatísticos.
