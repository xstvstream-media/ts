# YoucineNativeNative

Projeto Android nativo baseado no `index.html` enviado pelo usuário.

## O que foi convertido
- Catálogo `DATA_STREAMS` extraído do HTML para `app/src/main/assets/catalog.json`.
- 13.453 itens do catálogo original.
- Busca local por nome.
- Filtros por Filmes/Canais e categorias.
- Minha lista (favoritos) salva localmente.
- Player nativo AndroidX Media3 ExoPlayer.
- MP4 e outros formatos progressivos; HLS `.m3u8` com módulo Media3 HLS.
- Tela do player em modo paisagem.
- Interface escura com destaque amarelo, seguindo a estrutura visual do HTML.
- `original-index.html` preservado em assets para referência.

## Importante sobre reprodução
O player nativo não usa `video`, HLS.js ou mpegts.js do navegador. Isso elimina a camada de CORS do navegador. Porém, o app não remove autenticação, DRM, bloqueio de IP, expiração de URL ou regras do servidor. A fonte precisa permitir a reprodução e o usuário deve ter autorização para acessá-la.

O projeto mantém `usesCleartextTraffic=true` porque o catálogo original contém URLs HTTP. Em produção, prefira fontes HTTPS autorizadas.

## Como gerar APK sem computador
1. Crie um repositório no GitHub pelo celular.
2. Envie todos os arquivos desta pasta para a branch `main`.
3. Abra a aba **Actions**.
4. Execute **Build Android APK**.
5. Baixe o artefato `YoucineNative-debug` quando o workflow terminar.

## Dependências principais
- AndroidX Media3 ExoPlayer 1.11.1
- Media3 HLS 1.11.1
- RecyclerView
- Material 3
- Glide
