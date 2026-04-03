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
