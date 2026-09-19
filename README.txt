DIALOG STUDIO
=============
Ferramenta visual para criar caixas de diálogo (Dialogs) profissionais em
HTML + CSS + JavaScript puro, reutilizáveis em qualquer app HTML/WebView.
Funciona 100% no navegador — sem servidor, sem Node.js, sem PHP, sem
frameworks. Compatível com o SPCK Editor.


ARQUIVOS DO PROJETO
--------------------
dialog-studio/
├── index.html   → estrutura do estúdio (abra este arquivo)
├── style.css    → visual do estúdio e do diálogo padrão
├── script.js    → toda a lógica: edição, pré-visualização e gerador de código
└── README.txt   → este arquivo


COMO USAR O ESTÚDIO
--------------------
1. Abra "index.html" no navegador (ou no SPCK Editor, botão de pré-visualizar).
2. No painel direito, use as abas para editar:
   - Conteúdo: ícone, título, subtítulo e texto principal.
   - Itens: lista de recursos com ícone (adicionar/remover).
   - Botões: quantos botões quiser, cada um com cor, tipo e ação.
   - Estilo: cores, borda, arredondamento, largura, espaçamento e fonte.
   - Animação: entrada/saída, opacidade e desfoque do fundo.
3. A pré-visualização à esquerda é atualizada em tempo real.
4. Use os botões do topo:
   - Importar   → carrega uma configuração JSON salva anteriormente.
   - Salvar     → guarda o projeto atual neste navegador.
   - JSON       → baixa a configuração atual em um arquivo .json
                  (pode ser reimportada depois para continuar editando).
   - Gerar código → mostra o HTML, CSS, JS e a versão em arquivo único.
   - Copiar código → copia a aba de código aberta para a área de transferência.
   - Exportar   → baixa os arquivos prontos do componente (você escolhe entre
                  um arquivo único "dialog.html" ou a versão dividida
                  "dialog.html + dialog.css + dialog.js").


COMO USAR O DIÁLOGO GERADO EM OUTRO PROJETO
--------------------------------------------
Versão dividida (recomendada para projetos maiores):

  1. Copie dialog.html, dialog.css e dialog.js para o seu projeto.
  2. No <head> do seu app, adicione:

       <link rel="stylesheet" href="dialog.css">

  3. Cole o conteúdo de dialog.html (a partir de <div class="ds-overlay">...)
     em algum lugar do <body> do seu app.
  4. Antes de </body>, adicione:

       <script src="dialog.js"></script>

  5. Para abrir o diálogo em qualquer botão ou evento do seu app:

       <button onclick="openDialog()">Mostrar aviso</button>

  6. Para fechar por código, se precisar:

       closeDialog();

Versão em arquivo único (dialog.html):
  Contém HTML + CSS + JS no mesmo arquivo. Útil para testes rápidos ou para
  copiar e colar trechos manualmente dentro de um HTML já existente.


ISOLAMENTO E SEGURANÇA DO SEU APP
-----------------------------------
Todo o componente gerado usa exclusivamente classes com o prefixo "ds-"
(ds-overlay, ds-dialog, ds-title, ds-button, etc.) e as funções globais
openDialog() / closeDialog(). Nada do seu CSS, JavaScript, menus, botões ou
navegação existentes é alterado ou sobrescrito — o componente funciona de
forma isolada, mesmo em apps com muito código já existente.


BOTÕES: AÇÕES DISPONÍVEIS
---------------------------
- Fechar diálogo  → fecha o componente com animação de saída.
- Abrir URL       → abre o link informado em uma nova aba e fecha o diálogo.
- Executar função JS → chama, no seu projeto, uma função global com o nome
  informado (ex.: "minhaFuncao") e depois fecha o diálogo. Basta definir
  essa função em qualquer lugar do seu script antes de o botão ser clicado.


RESPONSIVIDADE
---------------
O diálogo se adapta a celular, tablet, computador e WebView. Em telas
pequenas ele nunca ultrapassa a largura da tela, e caso o conteúdo seja
maior que a altura disponível, uma rolagem interna é ativada automaticamente.


DÚVIDAS FREQUENTES
--------------------
- "Preciso de internet para usar o estúdio ou o diálogo gerado?"
  Não. Tudo roda localmente no navegador.

- "Posso ter vários diálogos diferentes no mesmo app?"
  Sim. Gere e exporte cada diálogo com um nome de arquivo diferente
  (ex.: dialog-boasvindas.css/.js) e ajuste os ids/nome das funções
  openDialog/closeDialog no arquivo .js exportado, se for usar mais de um
  diálogo na mesma página.

- "Como continuo editando um diálogo depois de fechar o estúdio?"
  Exporte o JSON (botão "JSON") e, quando quiser voltar a editar, abra o
  estúdio novamente e use "Importar" para carregar esse arquivo.
