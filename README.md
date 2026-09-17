# XSTV — conversor MP3 → Opus

Esta pasta é uma estrutura para GitHub Pages.

## Como usar

1. Envie `index.html`, `.nojekyll` e a pasta `.github` para o repositório `xstvstream-media.github.io`.
2. O workflow `prepare-ffmpeg.yml` baixa as dependências oficiais do npm e coloca os arquivos do FFmpeg em `ffmpeg/`.
3. Depois do primeiro workflow concluído, abra o GitHub Pages.
4. Teste primeiro com um MP3 pequeno.

### Estrutura esperada depois do workflow

```text
/
├── index.html
├── .nojekyll
├── .github/
│   └── workflows/
│       └── prepare-ffmpeg.yml
└── ffmpeg/
    ├── lib/
    │   ├── index.js
    │   ├── classes.js
    │   ├── const.js
    │   ├── errors.js
    │   ├── types.js
    │   ├── utils.js
    │   └── worker.js
    ├── util/
    │   ├── index.js
    │   ├── browser.js
    │   ├── const.js
    │   ├── errors.js
    │   └── types.js
    └── core/
        ├── ffmpeg-core.js
        └── ffmpeg-core.wasm
```

Não abra o HTML com `content://downloads/`. O teste deve ser feito pela URL `https://xstvstream-media.github.io/`.
