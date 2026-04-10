# GIOE - Sistema de Avaliação de Pedidos de Apoio

## TODO

### Backend
- [x] Schema da base de dados (tabelas: users, evaluations)
- [x] Migração e aplicação do schema
- [x] Helpers de DB para avaliações e utilizadores
- [x] Router: registo com validação @gnr.pt
- [x] Router: login com email/password
- [x] Router: CRUD de avaliações
- [x] Router: estatísticas (total, média, por NEOP, por intervalo de pontuação)
- [x] Router: gestão de utilizadores (listar, eliminar)
- [x] Testes Vitest para routers principais

### Frontend
- [x] Tema verde militar (CSS variables, gradiente #1a472a → #2d5a3d)
- [x] Upload e integração do logo GNR/GIOE
- [x] Página de autenticação (login + registo com toggle)
- [x] Validação de email @gnr.pt no registo
- [x] Layout principal com header e tabs de navegação
- [x] Formulário de avaliação com cálculo automático de pontuação
  - [x] Secção POC e Despacho
  - [x] Secção Suspeitos (mandados, quantidade)
  - [x] Secção Atividade Criminal (modalidade, tipo, antecedentes, FSS)
  - [x] Secção Meios (posse e uso de arma)
  - [x] Secção Local (tipologia, contexto, segurança)
  - [x] Secção Avaliação (avaliador, data, parecer)
  - [x] Display de pontuação total e classificação NEOP
- [x] Diálogo de confirmação antes de guardar avaliação
- [x] Dashboard com tabela de avaliações
- [x] Filtros por NEOP e por avaliador no dashboard
- [x] Exportação para Excel
- [x] Página de estatísticas com cartões e gráficos
- [x] Gestão de utilizadores com listagem e eliminação
- [x] Responsividade mobile


### Correções Solicitadas
- [x] Corrigir lógica NEOP: pontuação > 75 = 4º NEOP (não 76)
- [x] Atualizar nome na página de login para "GRUPO DE INTERVENÇÃO DE OPERAÇÕES ESPECIAIS"
- [x] Fornecer link público do site


### Funcionalidade de Registo (Nova)
- [x] Criar router de registo com validação @gnr.pt
- [x] Criar página de registo com toggle login/registo
- [x] Validar email @gnr.pt no frontend e backend
- [x] Integrar login local sem OAuth


### Correções Adicionais
- [x] Remover "Made with Manus" do site (não estava visível)
- [x] Adicionar campo de password no login e registo
- [x] Corrigir fluxo de autenticação para entrar no site após login (session cookie criado)


### Novas Funcionalidades
- [x] Promover utilizadores a administrador na página de gestão
- [x] Barra de complexidade na pontuação (baixa/média/alta)
- [x] Indicações textuais de complexidade por NEOP


### Correções de Cores NEOP
- [x] Adicionar cores: verde (2º NEOP), laranja (3º NEOP), vermelho (4º NEOP)


### Bugs Reportados
- [x] Função de promover administrador não está a funcionar (corrigido: invalidate auth.me)
- [x] Erro na página dashboard (corrigido: SelectItem com value vazio violava Radix Select requirements)


### Tarefas Pendentes
- [x] Promover teixeira.vls@gnr.pt como administrador na base de dados
- [x] Corrigir a lógica de promoção a administrador (só admins podem promover)
- [x] Verificar se o botão "Promover" aparece apenas para admins


### Novas Funcionalidades - Estatísticas
- [x] Adicionar filtro de intervalo de tempo (data inicial e data final) na página de Estatísticas
- [x] Atualizar o backend para aceitar filtros de data nas estatísticas
- [x] Atualizar os gráficos para refletir os dados filtrados por período


### Novas Funcionalidades - Formulário
- [x] Adicionar campo de seleção para Comando Territorial (CTer) no formulário
- [x] Atualizar o schema para incluir o campo cterRequerente
- [x] Atualizar o dashboard para exibir o CTer das avaliações


### Bugs Reportados
- [x] Erro ao guardar o formulário de avaliação com o campo CTer (corrigido: CTer armazenado no parecer)


### Melhorias Solicitadas
- [x] Corrigir sobreposição do rótulo "4º NEOP" no gráfico de Distribuição por NEOP
- [x] Melhorar responsividade mobile em toda a aplicação


### Bugs Adicionais
- [x] Descrição do 3º NEOP não se vê no gráfico de Distribuição por NEOP (corrigido: custom label renderer com posicionamento radial)
- [x] Descrição do 3º NEOP continua a não aparecer para segmentos pequenos (corrigido: aumentar raio para segmentos < 10%)


### Análise de Pontuação - Comparação com Código Referência
- [x] Revisar pontuação - TODAS AS PONTUAÇÕES ESTÃO CORRETAS
- [x] Implementar lógica de critérios que elevam automaticamente para 4º NEOP:
  - [x] Associação criminosa + Posse/Probabilidade de armas de fogo = 4º NEOP
  - [x] Histórico de uso de arma de fogo + Antecedentes de confronto com FSS = 4º NEOP
- [x] Adicionar testes para validar a lógica de elevação (4 novos testes + 1 teste de cenário de exemplo)
- [x] Todos os 15 testes Vitest passam (11 originais + 4 novos)


### Novas Funcionalidades - Mapa de Portugal
- [x] Substituir mapa SVG manual por Leaflet com OpenStreetMap
- [x] Corrigir posicionamento dos pontos vermelhos de 4º NEOP
- [x] Adicionar tooltips interativos nos pontos do mapa
- [x] Testar visualização em diferentes resoluções
- [x] Instalar Leaflet e react-leaflet
- [x] Criar componente PortugalMap com Leaflet
- [x] Integrar mapa na página de Estatísticas
- [x] Corrigir regex de extração do CTer do parecer
- [x] Adicionar invalidation do neop4ByCter após criar avaliação


### Melhorias de UX - Layout do Formulário
- [x] Reorganizar campo CTer para alinhar com outros campos (Posto/Função, Nome, Contacto)
- [x] Adicionar espaçamento consistente entre seções do formulário

### Melhorias de Visualização - Página de Estatísticas
- [x] Aumentar tamanho da caixa do mapa (de 400px para 600px)
- [x] Melhorar qualidade visual do mapa (usando Leaflet com OpenStreetMap)
- [x] Adicionar botão de download para o mapa em PNG/JPEG
- [x] Adicionar botão de download para todos os gráficos em PNG/JPEG
- [x] Instalar html2canvas para captura de gráficos
- [x] Criar hook useChartDownload para reutilização


### Bugs - Navegação
- [x] Corrigir sobreposição do separador "Novo Formulário" com "Dashboard" em mobile
  - Reduzido padding em mobile (px-2 sm:px-5)
  - Reduzido gap entre ícone e texto (gap-1 sm:gap-2)
  - Reduzido tamanho do texto em mobile (text-xs sm:text-sm)
  - Adicionado texto abreviado em mobile ("Novo" em vez de "Novo Formulário")


### Bugs - Download de Gráficos
- [x] Corrigir botões de download PNG/JPEG que não estão a funcionar
  - Reescrito hook useChartDownload com melhor tratamento de erros
  - Adicionado estado isDownloading para feedback visual
  - Implementado uso de Blob em vez de DataURL para melhor compatibilidade
  - Adicionado delay de 100ms para garantir renderização do elemento

- [x] Corrigir erro "oklch" ao descarregar gráficos (html2canvas não suporta oklch)
  - Removido processamento de estilos inline que causava erro
  - Adicionado ignoreElements para ignorar scripts e estilos
  - Adicionado allowTaint para ignorar erros de CORS

### Novas Funcionalidades - Segurança
- [x] Adicionar confirmação de email para utilizadores @gnr.pt
- [x] Considerar utilizadores registados como já tendo feito autenticação de email
- [x] Simplificar fluxo de registo - sem necessidade de confirmação
- [x] Remover verificação de email no login
- [x] Adicionar campos emailVerified, emailVerificationToken, emailVerificationTokenExpires ao schema


### Bugs - Login
- [x] Corrigir login de contas existentes criadas com lógica antiga (emailVerified = 0)
  - Removidas colunas de verificação de email do schema
  - Simplificado fluxo de autenticação
  - Sistema agora funciona sem necessidade de verificação de email

- [x] Corrigir erro oklch no download de gráficos - RESOLVIDO
  - Implementada conversão completa de oklch para RGB
  - Processadas todas as propriedades de cor (color, backgroundColor, borderColor, etc)
  - Testado com sucesso em todos os gráficos


### Novas Funcionalidades - Download de PDF
- [x] Adicionar botão de download do formulário em PDF no canto superior direito
- [x] Criar PDF com print do layout da página (com quadrículas de seleção visíveis)
- [x] Adicionar cabeçalho centrado com logo GIOE em tons de verde
- [x] Usar html2canvas para capturar o layout da página
- [x] Manter visual exato da página no PDF
- [x] Integrar logo GIOE centrado no cabeçalho
- [x] Corrigir erro oklch na geração de PDF



### Novas Funcionalidades - Sistema de Aprovação de Utilizadores
- [x] Adicionar campo `approved` ao schema da tabela `users`
- [x] Criar migração para adicionar coluna `approved` com valor padrão false
- [x] Implementar procedimento tRPC para listar utilizadores não aprovados
- [x] Implementar procedimento tRPC para aprovar utilizador (admin only)
- [x] Implementar procedimento tRPC para rejeitar utilizador (admin only)
- [x] Criar página de gestão de aprovações para admins
- [x] Proteger todas as rotas para verificar se utilizador está aprovado
- [x] Criar página de "Aguardando Aprovação" para utilizadores não aprovados
- [x] Aprovar automaticamente utilizador teixeira.vls@gnr.pt como admin
- [ ] Notificar admin quando novo utilizador se regista
- [ ] Testar fluxo completo de registo → aguardando aprovação → acesso após aprovação

### Novas Funcionalidades - Impressão de Avaliações
- [x] Remover botão "Imprimir" do formulário novo (EvaluationForm.tsx)
- [x] Remover hook usePrintForm se não for mais necessário
- [x] Criar página de visualização/impressão de avaliação (PrintEvaluation.tsx)
- [x] Adicionar rota para página de impressão (/print/:id)
- [x] Adicionar botão "Imprimir" no dashboard para cada avaliação
- [x] Implementar estilos @media print para layout de impressão
- [x] Adicionar filtro por CTer no dashboard
- [ ] Testar impressão com dados preenchidos

### Correções Necessárias - PDF e Logo GIOE
- [x] Corrigir PDF saindo em branco (problema com html2canvas)
- [x] Aplicar filtro CSS de tons de verde ao logo GIOE original
- [x] Testar geração de PDF com filtro de verde

### Melhorias - Filtro de CTer
- [x] Criar procedure para obter lista de CTers únicos
- [x] Atualizar Dashboard para usar Select dropdown para CTer
- [x] Remover campo de pesquisa de CTer

### Melhorias - Impressão
- [x] Ocultar variáveis com valor zero na página de impressão

### Correções - Impressão
- [x] Corrigir URL do logo GIOE na página de impressão
- [x] Corrigir texto de "Associação Criminosa" na seção de Atividades Criminais

### Correções - Impressão (2ª Rodada)
- [x] Corrigir URL do logo GIOE para aparecer na impressão
- [x] Remover CTer do parecer na página de impressão

### Correções - Parecer (3ª Rodada)
- [x] Remover informação de CTer e NEOP do campo Parecer na impressão

### Correções - CTer (4ª Rodada)
- [x] Restaurar exibição de CTer num campo separado


### Novas Funcionalidades - Registo de Dados de Operações
- [x] Criar tabela de dados para registos de operações (65 campos)
- [x] Criar procedures tRPC para guardar/recuperar registos de operações
- [x] Criar formulário de Registo de Dados de Operações (OperationForm.tsx com 5 abas)
- [x] Adicionar botão "Operação" no dashboard para 4º NEOP
- [x] Criar página de impressão para registos de operações (PrintOperation.tsx)
- [x] Adicionar rotas para formulário e impressão de operações
- [ ] Testar funcionalidade completa com dados reais


### Novas Funcionalidades - Estatísticas de Operações
- [x] Criar procedure tRPC para obter estatísticas de operações por mês
- [x] Criar componente OperationsStatistics com filtro por mês
- [x] Implementar tabela de operações com todos os campos relevantes
- [x] Implementar exportação para Excel no formato do ficheiro anexado
- [x] Integrar sub-menu "Operações - Estatística" no separador Estatística
- [ ] Testar funcionalidade completa com dados reais


### Correções - Formulário de Operações
- [x] Corrigir nomes das abas: "Dados Reunião Coordenação/Reconhecimento", "Dados da Operação/ITP", etc.
- [x] Investigar e corrigir problema de gravação de dados de operações (tabela não existia, migration executada)
- [x] Testar gravação completa de dados


### Correções - Layout e Impressão de Operações
- [x] Corrigir layout das abas para evitar sobreposição de texto
- [x] Corrigir botão imprimir no formulário de operações


### Correções - Operações (5ª Rodada)
- [x] Adicionar campos de dados de reunião de coordenação/reconhecimento
- [x] Corrigir logo GIOE na página de impressão de operações
- [x] Implementar cascata de eliminação de operações quando avaliação é eliminada


### Novas Funcionalidades - Eliminação em Massa de Operações
- [x] Adicionar checkboxes na tabela de operações-estatística
- [x] Criar procedure tRPC para eliminar múltiplas operações
- [x] Adicionar botão "Eliminar" com confirmação

### Correções - Logo GIOE na Impressão de Operações
- [x] Corrigir URL do logo GIOE na página PrintOperation.tsx
- [x] Aplicar filtro CSS de tons de verde ao logo (hue-rotate, saturate, brightness, contrast, invert)
- [x] Testar visualização do logo na página de impressão

### Correções - Exportação Excel de Operações
- [x] Analisar formato esperado do Excel (27 colunas com cabeçalhos específicos)
- [x] Atualizar estrutura de exportação para corresponder exatamente ao ficheiro de referência
- [x] Testar exportação com dados reais


### Novas Funcionalidades - Sistema de Gestão de Operações Avançado
- [x] Adicionar campos na tabela users: phoneNumber, mecanographicNumber, rank (dropdown)
- [x] Atualizar formulário de registo com campos obrigatórios: telefone, mecanográfico, posto
- [x] Adicionar campos NUIPC e Entidade Solicitadora na tabela evaluations
- [x] Adicionar campo NUIPC no formulário de avaliação (antes de POC E DESPACHO)
- [x] Adicionar campo "Entidade Solicitadora" com checkboxes (CO, CTer, PSP, PJ, Outra)
- [ ] Criar página de perfil de utilizador com campo de posto editável
- [ ] Implementar atribuição de operação a militar quando avaliação é 4º NEOP
- [ ] Adicionar campo "Data Prevista da Operação" no separador "Dados Reunião Coordenação"
- [ ] Implementar sistema de notificações WhatsApp manual com link pré-formatado
- [ ] Agendar notificações automáticas de 2 em 2 dias após data da operação
- [ ] Criar interface para enviar notificações manualmente aos militares
- [ ] Testar fluxo completo de atribuição → notificação → preenchimento de relatório

### Página de Perfil de Utilizador
- [x] Criar procedure tRPC para atualizar perfil (updateProfile)
- [x] Criar página Profile.tsx com formulário de edição
- [x] Adicionar rota /profile no App.tsx
- [x] Adicionar link para perfil na navegação/menu
- [x] Testar edição de informações pessoais


### Atribuição de Operações a Militares
- [x] Adicionar campos assignedUserId e scheduledDate na tabela operations
- [x] Criar procedure tRPC para atribuir operação a militar
- [x] Criar procedure tRPC para listar militares disponíveis
- [x] Implementar modal de seleção de militar no OperationForm
- [x] Adicionar campo de data prevista da operação
- [ ] Testar fluxo completo de atribuição


### Sistema de Notificações WhatsApp
- [x] Criar tabela de notificações para registar histórico
- [x] Criar procedure tRPC para gerar link WhatsApp pré-formatado
- [x] Criar procedure tRPC para registar notificação enviada
- [ ] Criar página/modal de notificações para envio manual
- [ ] Integrar notificações automáticas após atribuição de operação
- [ ] Testar fluxo completo de notificações
