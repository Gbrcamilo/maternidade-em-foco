# Revisão de segurança do painel público (16/10/2026)

Escopo: link público `/painel-pacientes` e `/painel-pacientes/tv`, funções do servidor, rota de voz, banco de dados (metadados) e cabeçalhos HTTP. Testes feitos contra o site publicado, sem login.

## Resultado dos testes como atacante (sem login)
| Tentativa | Resultado |
|---|---|
| Ler dados individuais pela função do gestor | Negado ("Unauthorized") |
| Chamar `/api/pa-voz` (IA/voz) | 403 |
| Chamar a função pública de outro site (CSRF) | 403 |
| CORS de origem externa | 403, sem cabeçalhos de CORS |
| Métodos POST/PUT/DELETE na função pública | 405 |
| Identificador de função inválido ou com `../` | 400 |
| Source maps do JavaScript | 404 |
| `.env`, `.git`, código-fonte, `bun.lock`, `AGENTS.md` | 403 ou 404 |
| HTTP simples | 301 para HTTPS (HSTS ativo) |
| Dados individuais na resposta pública | Nenhum campo de paciente (só números e rótulos validados) |
| Leitura da tabela `painel_snapshot` com a chave pública | Sem permissão (RLS ativo, sem política) |

## Corrigido no código
- **CSP reforçada:** `frame-src 'none'`, `script-src-attr 'none'` (sem handlers inline), `upgrade-insecure-requests`, e `frame-ancestors` limitado ao próprio site e ao editor do Lovable (antes aceitava qualquer subdomínio `*.lovable.app`, permitindo que outro site embutisse a página).
- **Permissions-Policy** ampliada (pagamento, USB, Bluetooth, sensores) e `X-Permitted-Cross-Domain-Policies: none`.
- **Página de erro** sem `onclick` inline (compatível com a nova CSP).
- Já em vigor: cache curto no servidor, limite por IP (em memória), rótulos de especialidade validados por expressão regular, projeção de dados por lista permitida.

## Riscos restantes (exigem ação fora do código)
1. **Função `ingest_painel` (banco):** é `SECURITY DEFINER` e executável pela chave pública, protegida por uma chave de ingestão de pelo menos 32 caracteres (hash SHA-256 em `private.ingest_chaves`). É o desenho correto, mas não há limite de tentativas. Recomendações:
   - gerar a chave com 32 bytes aleatórios ou mais e guardá-la só no agente de envio;
   - girar a chave se ela já foi compartilhada por chat, e-mail ou repositório;
   - opcional: registrar tentativas falhas e bloquear após N erros (migração no banco).
   - Se a chave vazar, um invasor pode enviar dados falsos ao painel. Monitorar o horário de última atualização ajuda a perceber.
2. **Limite de requisições no edge:** o limite em memória não é compartilhado entre instâncias. Configurar rate limiting no Cloudflare ou no provedor para `/_serverFn/*`.
3. **Cadastro de contas (Supabase Auth):** hoje não há usuários. Quando o gestor existir, desativar novos cadastros ou exigir confirmação de e-mail, e ativar verificação em duas etapas nas contas de Lovable, GitHub e Supabase.
4. **Repositório do GitHub público:** não há segredos (só a chave publicável), mas mostra a estrutura do banco e das funções. Tornar privado se não houver necessidade de ser público.
5. **Dependências:** não foi possível rodar auditoria (`bun audit`) por bloqueio de rede. Rodar `bun audit` e atualizar pacotes vulneráveis.
6. **CSP completa (`script-src`):** exige testar em produção por causa dos scripts inline da hidratação. Fica como melhoria futura.
7. **Acesso dos gestores:** o administrador é a conta mais antiga com e-mail confirmado (ou os códigos de `PA_ADMIN_USER_IDS`). Ele aprova ou bloqueia as demais contas na própria página `/pa`; a aprovação fica em `app_metadata.gestor` (o usuário não consegue alterar). Por isso a primeira conta precisa ser criada pelo responsável logo após a publicação e o e-mail confirmado. Depois, desative novos cadastros no Supabase se quiser impedir pedidos de acesso. `PA_MANAGER_USER_IDS` continua funcionando como lista fixa opcional.
