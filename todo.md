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
