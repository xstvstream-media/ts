(function () {
  'use strict';

  /* ---------------- Elementos ---------------- */
  const $ = (id) => document.getElementById(id);

  const drop        = $('drop');
  const fileInput   = $('fileInput');
  const dropIcon    = $('dropIcon');
  const dropTitle   = $('dropTitle');
  const dropSub     = $('dropSub');
  const fileNameEl  = $('fileName');
  const fileSizeEl  = $('fileSize');

  const bitrateSel  = $('bitrate');
  const channelsSel = $('channels');

  const convertBtn  = $('convertBtn');
  const convertLbl  = $('convertLabel');
  const spin        = $('spin');

  const progressBox = $('progressBox');
  const statusText  = $('statusText');
  const pctText     = $('pctText');
  const bar         = $('bar');
  const barFill     = $('barFill');

  const result      = $('result');
  const player      = $('player');
  const chipSize    = $('chipSize');
  const chipSaved   = $('chipSaved');
  const downloadBtn = $('downloadBtn');
  const shareBtn    = $('shareBtn');
  const resetBtn    = $('resetBtn');

  const toastEl     = $('toast');

  /* ---------------- Estado ---------------- */
  let selectedFile = null;
  let outputBlob   = null;
  let outputName   = '';
  let outUrl       = null;
  let busy         = false;

  let ffmpeg = null;
  let ffmpegLoaded = false;

  /* ---------------- Helpers ---------------- */
  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  let toastTimer = null;
  function toast(msg, isError) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('err', !!isError);
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2800);
  }

  function setProgress(pct, label) {
    const p = Math.max(0, Math.min(100, pct));
    progressBox.classList.add('on');
    bar.classList.remove('indeterminate');
    barFill.style.width = p + '%';
    pctText.textContent = Math.round(p) + '%';
    if (label) statusText.textContent = label;
  }

  function setIndeterminate(label) {
    progressBox.classList.add('on');
    bar.classList.add('indeterminate');
    pctText.textContent = '…';
    statusText.textContent = label;
  }

  function hideProgress() {
    progressBox.classList.remove('on');
    bar.classList.remove('indeterminate');
    barFill.style.width = '0%';
  }

  function setBusy(state, label) {
    busy = state;
    convertBtn.disabled = state || !selectedFile;
    spin.classList.toggle('on', state);
    convertLbl.textContent = label || (state ? 'Convertendo…' : 'Converter para OPUS');
  }

  /* ---------------- Seleção de arquivo ---------------- */
  function isAudio(file) {
    if (!file) return false;
    if (file.type && file.type.startsWith('audio/')) return true;
    return /\.(mp3|m4a|wav|ogg|flac|aac|wma|opus|webm)$/i.test(file.name);
  }

  function handleFile(file) {
    if (!file) return;
    if (!isAudio(file)) {
      toast('Escolha um arquivo de áudio válido.', true);
      return;
    }

    selectedFile = file;

    drop.classList.add('has-file');
    dropIcon.textContent = '🎧';
    dropTitle.textContent = 'Arquivo selecionado';
    dropSub.textContent = 'Toque para trocar o arquivo';

    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatBytes(file.size);
    fileNameEl.classList.remove('hidden');
    fileSizeEl.classList.remove('hidden');

    clearResult();
    hideProgress();
    convertBtn.disabled = busy;
  }

  function clearResult() {
    if (outUrl) { URL.revokeObjectURL(outUrl); outUrl = null; }
    outputBlob = null;
    outputName = '';
    result.classList.remove('on');
    player.removeAttribute('src');
    player.load();
  }

  /* ---------------- Drag & Drop ---------------- */
  drop.addEventListener('click', () => fileInput.click());

  drop.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach(ev =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      drop.classList.add('drag');
    })
  );

  ['dragleave', 'drop'].forEach(ev =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault(); e.stopPropagation();
      if (ev === 'dragleave' && drop.contains(e.relatedTarget)) return;
      drop.classList.remove('drag');
    })
  );

  drop.addEventListener('drop', (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });

  ['dragover', 'drop'].forEach(ev =>
    window.addEventListener(ev, (e) => e.preventDefault())
  );

  /* ---------------- Carregar FFmpeg (API 0.12.x) ---------------- */
  async function loadFFmpeg() {
    if (ffmpegLoaded && ffmpeg) return ffmpeg;

    const { FFmpeg } = window.FFmpegWASM;
    const { toBlobURL, fetchFile } = window.FFmpegUtil;

    ffmpeg = new FFmpeg();

    // Logs (opcional)
    ffmpeg.on('log', ({ message }) => {
      console.log('[ffmpeg]', message);
    });

    ffmpeg.on('progress', ({ progress }) => {
      if (typeof progress === 'number' && isFinite(progress) && progress > 0) {
        setProgress(progress * 100, 'Convertendo áudio…');
      }
    });

    setIndeterminate('Baixando motor de conversão…');

    // ⚠️ ESSENCIAL: baixar o core como Blob URL para evitar erros de CORS/caminho
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

    setIndeterminate('Inicializando motor…');

    await ffmpeg.load({
      coreURL,
      wasmURL,
    });

    ffmpegLoaded = true;
    return ffmpeg;
  }

  /* ---------------- Conversão ---------------- */
  async function convert() {
    if (!selectedFile || busy) return;

    setBusy(true, 'Carregando motor…');
    clearResult();
    setIndeterminate('Carregando motor de conversão…');

    let ff;
    try {
      ff = await loadFFmpeg();
    } catch (err) {
      console.error(err);
      hideProgress();
      setBusy(false);
      toast('Falha ao carregar o motor: ' + (err.message || err), true);
      return;
    }

    const { fetchFile } = window.FFmpegUtil;
    const bitrate  = bitrateSel.value;
    const channels = channelsSel.value;

    try {
      setIndeterminate('Lendo arquivo…');
      convertLbl.textContent = 'Convertendo…';

      // ✅ API 0.12.x: writeFile / exec / readFile
      await ff.writeFile('input.mp3', await fetchFile(selectedFile));

      setProgress(1, 'Convertendo áudio…');

      const args = [
        '-i', 'input.mp3',
        '-vn',
        '-map', '0:a:0',
        '-c:a', 'libopus',
        '-b:a', bitrate + 'k',
        '-vbr', 'on',
        '-compression_level', '10',
        '-application', 'audio'
      ];

      if (channels !== 'orig') {
        args.push('-ac', channels);
      }

      args.push('output.opus');

      let ran = false;
      try {
        await ff.exec(args);
        ran = true;
      } catch (e) {
        console.warn('libopus indisponível, tentando encoder nativo…', e);
      }

      if (!ran) {
        const args2 = [
          '-i', 'input.mp3',
          '-vn', '-map', '0:a:0',
          '-c:a', 'opus',
          '-strict', '-2',
          '-b:a', bitrate + 'k'
        ];
        if (channels !== 'orig') args2.push('-ac', channels);
        args2.push('output.opus');
        await ff.exec(args2);
      }

      setProgress(96, 'Finalizando…');

      // ✅ API 0.12.x: readFile retorna Uint8Array
      const data = await ff.readFile('output.opus');

      try { await ff.deleteFile('input.mp3'); } catch (e) {}
      try { await ff.deleteFile('output.opus'); } catch (e) {}

      if (!data || !data.length) throw new Error('Saída vazia');

      outputBlob = new Blob([data.buffer], { type: 'audio/ogg' });

      const baseName = selectedFile.name.replace(/\.[^.]+$/, '') || 'audio';
      outputName = baseName + '.opus';

      if (outUrl) URL.revokeObjectURL(outUrl);
      outUrl = URL.createObjectURL(outputBlob);
      player.src = outUrl;

      const before = selectedFile.size;
      const after  = outputBlob.size;
      chipSize.innerHTML = 'Tamanho: <b>' + formatBytes(after) + '</b>';

      if (before > 0 && after < before) {
        const reducao = Math.round((1 - after / before) * 100);
        chipSaved.innerHTML = 'Redução: <b>-' + reducao + '%</b>';
      } else {
        chipSaved.innerHTML = 'Original: <b>' + formatBytes(before) + '</b>';
      }

      setProgress(100, 'Concluído!');
      result.classList.add('on');

      setTimeout(() => {
        result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);

      toast('Conversão concluída! 🎉');

    } catch (err) {
      console.error(err);
      hideProgress();
      toast('Erro na conversão: ' + (err.message || err), true);
    } finally {
      setBusy(false);
    }
  }

  convertBtn.addEventListener('click', convert);

  /* ---------------- Download ---------------- */
  downloadBtn.addEventListener('click', () => {
    if (!outputBlob) return;
    const a = document.createElement('a');
    a.href = outUrl || URL.createObjectURL(outputBlob);
    a.download = outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  /* ---------------- Compartilhar ---------------- */
  shareBtn.addEventListener('click', async () => {
    const shareText = 'Converti um áudio para OPUS com este conversor online 🎧';
    const shareUrl  = location.href;

    if (outputBlob && navigator.canShare) {
      try {
        const file = new File([outputBlob], outputName, { type: 'audio/ogg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Áudio em OPUS', text: shareText });
          return;
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.warn('Falha ao compartilhar arquivo:', err);
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Conversor MP3 → OPUS', text: shareText, url: shareUrl });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('Link copiado para a área de transferência!');
    } catch (e) {
      toast('Compartilhamento não suportado neste navegador.', true);
    }
  });

  /* ---------------- Reset ---------------- */
  resetBtn.addEventListener('click', () => {
    if (busy) return;
    clearResult();
    hideProgress();

    selectedFile = null;
    fileInput.value = '';

    drop.classList.remove('has-file');
    dropIcon.textContent = '🎵';
    dropTitle.textContent = 'Toque para escolher um MP3';
    dropSub.textContent = 'ou arraste e solte o arquivo aqui';
    fileNameEl.classList.add('hidden');
    fileSizeEl.classList.add('hidden');

    convertBtn.disabled = true;
    convertLbl.textContent = 'Converter para OPUS';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('load', () => {
    if (!window.FFmpegWASM || !window.FFmpegUtil) {
      toast('Não foi possível carregar as bibliotecas do FFmpeg.', true);
      convertBtn.disabled = true;
    }
  });

})();