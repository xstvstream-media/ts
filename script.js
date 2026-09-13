(function () {
  'use strict';

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

  let selectedFile = null;
  let outputBlob   = null;
  let outputName   = '';
  let outUrl       = null;
  let busy         = false;

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

  /* ---------------- Detectar suporte a Opus ---------------- */
  function getSupportedOpusMime() {
    if (typeof MediaRecorder === 'undefined') return null;
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/webm',
      'audio/ogg',
    ];
    for (const t of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(t)) return t;
      } catch (e) {}
    }
    return null;
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

  /* ---------------- CONVERSÃO (MediaRecorder + Opus nativo) ---------------- */
  async function convertToOpus(file, bitrateKbps) {
    const mimeType = getSupportedOpusMime();
    if (!mimeType) {
      throw new Error('Seu navegador não suporta codificação Opus.');
    }

    // 1) Decodifica o MP3 para PCM via Web Audio API
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx();

    // garante contexto ativo (mobile exige gesto — o clique no botão já é um)
    if (audioCtx.state === 'suspended') {
      try { await audioCtx.resume(); } catch (e) {}
    }

    let audioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } catch (err) {
      audioCtx.close();
      throw new Error('Não foi possível decodificar o áudio. O arquivo pode estar corrompido.');
    }

    const duration = audioBuffer.duration;

    // 2) Cria destino de stream para capturar o áudio tocado
    const dest = audioCtx.createMediaStreamDestination();
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(dest);

    // 3) Ajustar canais se necessário
    const wantChannels = channelsSel.value;
    // Aplicamos via CanalMerger se o usuário quiser forçar mono
    if (wantChannels === '1' && audioBuffer.numberOfChannels > 1) {
      // reconecta mixando para mono
      const merger = audioCtx.createChannelMerger(1);
      const gain = audioCtx.createGain();
      gain.gain.value = 1 / audioBuffer.numberOfChannels;
      source.disconnect();
      source.connect(gain);
      gain.connect(merger, 0, 0);
      merger.connect(dest);
    } else if (wantChannels === '2' && audioBuffer.numberOfChannels === 1) {
      // duplica mono para estéreo
      const splitter = audioCtx.createChannelSplitter(1);
      const merger = audioCtx.createChannelMerger(2);
      source.disconnect();
      source.connect(splitter);
      splitter.connect(merger, 0, 0);
      splitter.connect(merger, 0, 1);
      merger.connect(dest);
    }

    // 4) Configura o MediaRecorder
    const options = { mimeType };
    const bps = parseInt(bitrateKbps, 10) * 1000;
    if (bps) options.audioBitsPerSecond = bps;

    let recorder;
    try {
      recorder = new MediaRecorder(dest.stream, options);
    } catch (err) {
      // fallback sem bitrate explícito
      recorder = new MediaRecorder(dest.stream, { mimeType });
    }

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      let stopped = false;

      const cleanup = () => {
        try { audioCtx.close(); } catch (e) {}
      };

      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: mimeType });
        resolve(blob);
      };

      recorder.onerror = (e) => {
        cleanup();
        reject(e.error || new Error('Erro na gravação'));
      };

      // Progresso baseado no tempo real de reprodução
      const startedAt = audioCtx.currentTime;
      const progressTimer = setInterval(() => {
        const elapsed = audioCtx.currentTime - startedAt;
        const pct = Math.min(99, (elapsed / duration) * 100);
        setProgress(pct, 'Convertendo em Opus…');
      }, 150);

      // Encerramento natural
      source.onended = () => {
        if (stopped) return;
        stopped = true;
        clearInterval(progressTimer);
        // pequeno delay para o MediaRecorder drenar
        setTimeout(() => {
          try { recorder.stop(); } catch (e) { cleanup(); reject(e); }
        }, 200);
      };

      // Start
      try {
        recorder.start(100); // coleta chunks a cada 100ms
      } catch (err) {
        clearInterval(progressTimer);
        cleanup();
        return reject(err);
      }

      source.start(0);
    });
  }

  /* ---------------- Ação de converter ---------------- */
  async function convert() {
    if (!selectedFile || busy) return;

    if (!getSupportedOpusMime()) {
      toast('Este navegador não suporta Opus. Use Chrome, Edge ou Firefox.', true);
      return;
    }

    setBusy(true, 'Convertendo…');
    clearResult();
    setProgress(0, 'Preparando áudio…');

    try {
      const blob = await convertToOpus(selectedFile, bitrateSel.value);

      if (!blob || !blob.size) throw new Error('Saída vazia');

      outputBlob = blob;

      // Extensão coerente com o mime
      const baseName = selectedFile.name.replace(/\.[^.]+$/, '') || 'audio';
      const ext = blob.type.indexOf('ogg') !== -1 ? '.opus' : '.webm';
      outputName = baseName + ext;

      // Player
      if (outUrl) URL.revokeObjectURL(outUrl);
      outUrl = URL.createObjectURL(outputBlob);
      player.src = outUrl;

      // Estatísticas
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
      setTimeout(() => result.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
      toast('Conversão concluída! 🎉');

    } catch (err) {
      console.error(err);
      hideProgress();
      toast(err.message || 'Erro ao converter.', true);
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
    const shareText = 'Converti um áudio para Opus com este conversor 🎧';
    const shareUrl  = location.href;

    // 1) Compartilhar o ARQUIVO (Android Chrome / Edge / iOS Safari)
    if (outputBlob && navigator.canShare) {
      try {
        const file = new File([outputBlob], outputName, { type: outputBlob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Áudio Opus', text: shareText });
          return;
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.warn('Falha ao compartilhar arquivo:', err);
      }
    }

    // 2) Compartilhar o LINK
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Conversor MP3 → Opus', text: shareText, url: shareUrl });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    // 3) Fallback: copiar
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast('Link copiado!');
    } catch (e) {
      toast('Compartilhamento não suportado.', true);
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

})();