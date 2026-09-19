(function () {
  "use strict";

  /* ============================================================
     ESTADO
     ============================================================ */
  const STORAGE_KEY = "dialogStudio.project.v1";

  function defaultState() {
    return {
      icon: "🚀",
      title: "Novo recurso disponível",
      subtitle: "Atualize agora e aproveite",
      text: "Descubra as novidades desta versão e aproveite ao máximo o aplicativo.",
      items: [
        { icon: "✔", text: "Interface totalmente renovada" },
        { icon: "✔", text: "Desempenho mais rápido e estável" },
        { icon: "✔", text: "Novas opções de personalização" }
      ],
      buttons: [
        { id: "btn-continuar", label: "Continuar", type: "primary", color: "#7C5CFC", textColor: "#FFFFFF", border: "transparent", action: "close", link: "" },
        { id: "btn-agora-nao", label: "Agora não", type: "secondary", color: "transparent", textColor: "#8B92A3", border: "#2A2D37", action: "close", link: "" }
      ],
      style: {
        bg: "#15161B",
        border: "#7C5CFC",
        titleColor: "#F5F6FA",
        textColor: "#B7BCC7",
        borderWidth: 2,
        radius: 24,
        width: 340,
        padding: 28,
        spacing: 10,
        fontSize: 15,
        font: "'Inter', system-ui, sans-serif"
      },
      anim: {
        enabled: true,
        in: "scale-up",
        out: "fade-out",
        overlayOpacity: 0.6,
        overlayBlur: 4
      }
    };
  }

  let state = defaultState();
  let uidCounter = 1;
  function uid(prefix) { return prefix + (uidCounter++); }

  /* ============================================================
     UTIL
     ============================================================ */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-shown");
    clearTimeout(toast._h);
    toast._h = setTimeout(() => t.classList.remove("is-shown"), 2200);
  }
  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* ============================================================
     RENDER — PRÉ-VISUALIZAÇÃO
     ============================================================ */
  function renderPreview() {
    const s = state;

    $("#pvIcon").textContent = s.icon || "";
    $("#pvIcon").style.display = s.icon ? "" : "none";
    $("#pvTitle").textContent = s.title;
    $("#pvSubtitle").textContent = s.subtitle;
    $("#pvSubtitle").style.display = s.subtitle ? "" : "none";
    $("#pvText").textContent = s.text;
    $("#pvText").style.display = s.text ? "" : "none";

    const itemsEl = $("#pvItems");
    itemsEl.innerHTML = "";
    itemsEl.style.display = s.items.length ? "" : "none";
    s.items.forEach(it => {
      const li = document.createElement("li");
      li.className = "ds-item";
      li.innerHTML = `<span class="ds-item-icon">${escapeHtml(it.icon || "•")}</span><span>${escapeHtml(it.text)}</span>`;
      itemsEl.appendChild(li);
    });

    const btnsEl = $("#pvButtons");
    btnsEl.innerHTML = "";
    s.buttons.forEach(b => {
      const btn = document.createElement("button");
      btn.className = "ds-button";
      btn.textContent = (b.icon ? b.icon + "  " : "") + b.label;
      btn.style.background = b.color || "transparent";
      btn.style.color = b.textColor || "#fff";
      btn.style.borderColor = b.border || "transparent";
      btn.addEventListener("click", () => toast("Ação: " + describeAction(b)));
      btnsEl.appendChild(btn);
    });

    const dialog = $("#previewDialog");
    dialog.style.background = s.style.bg;
    dialog.style.borderColor = s.style.border;
    dialog.style.borderWidth = s.style.borderWidth + "px";
    dialog.style.borderRadius = s.style.radius + "px";
    dialog.style.maxWidth = s.style.width + "px";
    dialog.style.padding = s.style.padding + "px";
    dialog.style.fontFamily = s.style.font;
    dialog.style.fontSize = s.style.fontSize + "px";
    dialog.style.animation = s.anim.enabled ? animCss(s.anim.in, true) : "none";

    $("#pvTitle").style.color = s.style.titleColor;
    $("#pvText").style.color = s.style.textColor;
    $("#pvSubtitle").style.color = s.style.border;
    $all(".ds-item", itemsEl).forEach(li => { li.style.color = s.style.textColor; });
    itemsEl.style.gap = s.style.spacing + "px";
    itemsEl.style.marginBottom = s.style.spacing + 4 + "px";

    const overlay = $("#previewOverlay");
    overlay.style.background = `rgba(0,0,0,${s.anim.overlayOpacity})`;
    overlay.style.backdropFilter = s.anim.overlayBlur ? `blur(${s.anim.overlayBlur}px)` : "none";
  }

  function animCss(name, isIn) {
    const dur = isIn ? ".28s" : ".22s";
    const map = {
      "scale-up": `ds-scale-up ${dur} cubic-bezier(.2,.9,.3,1.2) both`,
      "slide-up": `ds-slide-up ${dur} ease both`,
      "fade-in": `ds-fade-in ${dur} ease both`,
      "fade-out": `ds-fade-in ${dur} ease reverse both`,
      "scale-down": `ds-scale-up ${dur} ease reverse both`,
      "slide-down": `ds-slide-up ${dur} ease reverse both`
    };
    return map[name] || map["scale-up"];
  }

  function describeAction(b) {
    if (b.action === "url") return "abrir " + (b.link || "link");
    if (b.action === "function") return "chamar " + (b.link || "função");
    return "fechar diálogo";
  }

  /* ============================================================
     PAINEL — CAMPOS DE CONTEÚDO E ESTILO
     ============================================================ */
  function fillFormFromState() {
    $("#fIcon").value = state.icon;
    $("#fTitle").value = state.title;
    $("#fSubtitle").value = state.subtitle;
    $("#fText").value = state.text;

    $("#sBg").value = state.style.bg;
    $("#sBorder").value = state.style.border;
    $("#sTitleColor").value = state.style.titleColor;
    $("#sTextColor").value = state.style.textColor;
    $("#sBorderWidth").value = state.style.borderWidth;
    $("#sRadius").value = state.style.radius;
    $("#sWidth").value = state.style.width;
    $("#sPadding").value = state.style.padding;
    $("#sSpacing").value = state.style.spacing;
    $("#sFontSize").value = state.style.fontSize;
    $("#sFont").value = state.style.font;
    updateRangeLabels();

    $("#aEnabled").checked = state.anim.enabled;
    $("#aIn").value = state.anim.in;
    $("#aOut").value = state.anim.out;
    $("#aOverlayOpacity").value = state.anim.overlayOpacity;
    $("#aOverlayBlur").value = state.anim.overlayBlur;
    updateAnimLabels();

    renderItemsEditor();
    renderButtonsEditor();
  }

  function updateRangeLabels() {
    $("#vBorderWidth").textContent = state.style.borderWidth + "px";
    $("#vRadius").textContent = state.style.radius + "px";
    $("#vWidth").textContent = state.style.width + "px";
    $("#vPadding").textContent = state.style.padding + "px";
    $("#vSpacing").textContent = state.style.spacing + "px";
    $("#vFontSize").textContent = state.style.fontSize + "px";
  }
  function updateAnimLabels() {
    $("#vOverlayOpacity").textContent = Math.round(state.anim.overlayOpacity * 100) + "%";
    $("#vOverlayBlur").textContent = state.anim.overlayBlur + "px";
  }

  function bindContentFields() {
    $("#fIcon").addEventListener("input", e => { state.icon = e.target.value; renderPreview(); });
    $("#fTitle").addEventListener("input", e => { state.title = e.target.value; renderPreview(); });
    $("#fSubtitle").addEventListener("input", e => { state.subtitle = e.target.value; renderPreview(); });
    $("#fText").addEventListener("input", e => { state.text = e.target.value; renderPreview(); });

    const styleMap = {
      sBg: "bg", sBorder: "border", sTitleColor: "titleColor", sTextColor: "textColor",
      sBorderWidth: "borderWidth", sRadius: "radius", sWidth: "width",
      sPadding: "padding", sSpacing: "spacing", sFontSize: "fontSize"
    };
    Object.keys(styleMap).forEach(id => {
      $("#" + id).addEventListener("input", e => {
        const key = styleMap[id];
        const numeric = ["borderWidth", "radius", "width", "padding", "spacing", "fontSize"].includes(key);
        state.style[key] = numeric ? Number(e.target.value) : e.target.value;
        updateRangeLabels();
        renderPreview();
      });
    });
    $("#sFont").addEventListener("change", e => { state.style.font = e.target.value; renderPreview(); });

    $("#aEnabled").addEventListener("change", e => { state.anim.enabled = e.target.checked; renderPreview(); });
    $("#aIn").addEventListener("change", e => { state.anim.in = e.target.value; renderPreview(); });
    $("#aOut").addEventListener("change", e => { state.anim.out = e.target.value; });
    $("#aOverlayOpacity").addEventListener("input", e => { state.anim.overlayOpacity = Number(e.target.value); updateAnimLabels(); renderPreview(); });
    $("#aOverlayBlur").addEventListener("input", e => { state.anim.overlayBlur = Number(e.target.value); updateAnimLabels(); renderPreview(); });
  }

  /* ---------- Itens ---------- */
  function renderItemsEditor() {
    const wrap = $("#itemsList");
    wrap.innerHTML = "";
    state.items.forEach((it, idx) => {
      const row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML = `
        <div class="list-item-head">
          <input type="text" class="it-icon" style="max-width:56px" maxlength="3" value="${escapeHtml(it.icon)}" placeholder="✔">
          <input type="text" class="it-text" value="${escapeHtml(it.text)}" placeholder="Texto do item">
          <button class="list-item-remove" title="Remover">✕</button>
        </div>`;
      row.querySelector(".it-icon").addEventListener("input", e => { it.icon = e.target.value; renderPreview(); });
      row.querySelector(".it-text").addEventListener("input", e => { it.text = e.target.value; renderPreview(); });
      row.querySelector(".list-item-remove").addEventListener("click", () => {
        state.items.splice(idx, 1); renderItemsEditor(); renderPreview();
      });
      wrap.appendChild(row);
    });
  }

  /* ---------- Botões ---------- */
  function renderButtonsEditor() {
    const wrap = $("#buttonsList");
    wrap.innerHTML = "";
    state.buttons.forEach((b, idx) => {
      const row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML = `
        <div class="list-item-head">
          <input type="text" class="bt-label" value="${escapeHtml(b.label)}" placeholder="Texto do botão">
          <button class="list-item-remove" title="Remover">✕</button>
        </div>
        <div class="list-item-row">
          <label><span class="mini-label">Tipo</span>
            <select class="bt-type">
              <option value="primary">Principal</option>
              <option value="secondary">Secundário</option>
              <option value="close">Fechar</option>
              <option value="link">Abrir link</option>
            </select>
          </label>
          <label><span class="mini-label">Ação</span>
            <select class="bt-action">
              <option value="close">Fechar diálogo</option>
              <option value="url">Abrir URL</option>
              <option value="function">Executar função JS</option>
            </select>
          </label>
        </div>
        <div class="list-item-row">
          <label><span class="mini-label">Cor de fundo</span><input type="color" class="bt-color"></label>
          <label><span class="mini-label">Cor do texto</span><input type="color" class="bt-textcolor"></label>
        </div>
        <div class="list-item-row full">
          <label><span class="mini-label">Link (URL) ou nome da função</span>
            <input type="text" class="bt-link" value="${escapeHtml(b.link)}" placeholder="https://... ou minhaFuncao">
          </label>
        </div>`;
      row.querySelector(".bt-label").addEventListener("input", e => { b.label = e.target.value; renderPreview(); });
      const typeSel = row.querySelector(".bt-type"); typeSel.value = b.type;
      typeSel.addEventListener("change", e => { b.type = e.target.value; renderPreview(); });
      const actionSel = row.querySelector(".bt-action"); actionSel.value = b.action;
      actionSel.addEventListener("change", e => { b.action = e.target.value; renderPreview(); });
      const colorInp = row.querySelector(".bt-color");
      colorInp.value = /^#/.test(b.color) ? b.color : "#7c5cfc";
      colorInp.addEventListener("input", e => { b.color = e.target.value; renderPreview(); });
      const textColorInp = row.querySelector(".bt-textcolor");
      textColorInp.value = /^#/.test(b.textColor) ? b.textColor : "#ffffff";
      textColorInp.addEventListener("input", e => { b.textColor = e.target.value; renderPreview(); });
      row.querySelector(".bt-link").addEventListener("input", e => { b.link = e.target.value; });
      row.querySelector(".list-item-remove").addEventListener("click", () => {
        state.buttons.splice(idx, 1); renderButtonsEditor(); renderPreview();
      });
      wrap.appendChild(row);
    });
  }

  /* ============================================================
     ABAS
     ============================================================ */
  function bindTabs() {
    $all(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        $all(".tab").forEach(t => t.classList.remove("is-active"));
        $all(".tab-panel").forEach(p => p.classList.remove("is-active"));
        tab.classList.add("is-active");
        $(`.tab-panel[data-panel="${tab.dataset.tab}"]`).classList.add("is-active");
      });
    });
  }

  function bindDevices() {
    $all(".device-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        $all(".device-btn").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        $("#stageFrame").classList.toggle("is-desktop", btn.dataset.device === "desktop");
      });
    });
  }

  function bindMenuToggle() {
    $("#menuToggle").addEventListener("click", () => $("#sidePanel").classList.toggle("is-open"));
  }

  /* ============================================================
     GERADOR DE CÓDIGO
     ============================================================ */
  function buildHtml() {
    const s = state;
    const items = s.items.map(it =>
      `      <li class="ds-item"><span class="ds-item-icon">${escapeHtml(it.icon || "•")}</span><span>${escapeHtml(it.text)}</span></li>`
    ).join("\n");

    const buttons = s.buttons.map(b => {
      const attrs = [`class="ds-button ds-button--${b.type}"`, `data-ds-action="${b.action}"`];
      if (b.action === "url") attrs.push(`data-ds-url="${escapeHtml(b.link)}"`);
      if (b.action === "function") attrs.push(`data-ds-fn="${escapeHtml(b.link)}"`);
      attrs.push(`style="background:${b.color || "transparent"};color:${b.textColor || "#fff"};border-color:${b.border || "transparent"}"`);
      return `      <button ${attrs.join(" ")}>${escapeHtml(b.label)}</button>`;
    }).join("\n");

    return `<!-- Dialog Studio · componente reutilizável (classes prefixadas com "ds-" para não conflitar com o app) -->
<div class="ds-overlay" id="dsOverlay">
  <div class="ds-dialog" id="dsDialog" role="dialog" aria-modal="true">
    ${s.icon ? `<div class="ds-icon">${escapeHtml(s.icon)}</div>\n    ` : ""}<h2 class="ds-title">${escapeHtml(s.title)}</h2>
    ${s.subtitle ? `<p class="ds-subtitle">${escapeHtml(s.subtitle)}</p>\n    ` : ""}${s.text ? `<p class="ds-text">${escapeHtml(s.text)}</p>\n    ` : ""}${s.items.length ? `<ul class="ds-items">\n${items}\n    </ul>\n    ` : ""}<div class="ds-buttons">
${buttons}
    </div>
  </div>
</div>`;
  }

  function buildCss() {
    const s = state.style, a = state.anim;
    return `/* Dialog Studio · componente reutilizável — classes exclusivas "ds-" */
.ds-overlay{
  position:fixed; inset:0; z-index:9999;
  display:none; align-items:center; justify-content:center;
  padding:20px;
  background:rgba(0,0,0,${a.overlayOpacity});
  ${a.overlayBlur ? `backdrop-filter:blur(${a.overlayBlur}px);` : ""}
}
.ds-overlay.ds-open{ display:flex; }
.ds-dialog{
  width:100%; max-width:${s.width}px; max-height:90vh; overflow-y:auto;
  background:${s.bg};
  border:${s.borderWidth}px solid ${s.border};
  border-radius:${s.radius}px;
  padding:${s.padding}px;
  text-align:center;
  font-family:${s.font};
  font-size:${s.fontSize}px;
  box-shadow:0 20px 50px -15px rgba(0,0,0,.65);
  ${a.enabled ? `animation:dsIn .28s cubic-bezier(.2,.9,.3,1.2) both;` : ""}
}
.ds-overlay.ds-closing .ds-dialog{ ${a.enabled ? `animation:dsOut .22s ease both;` : ""} }
.ds-icon{ font-size:38px; line-height:1; margin-bottom:10px; }
.ds-title{ margin:0 0 4px; font-size:1.3em; font-weight:700; color:${s.titleColor}; }
.ds-subtitle{ margin:0 0 10px; font-size:.95em; font-weight:600; color:${s.border}; }
.ds-text{ margin:0 0 16px; line-height:1.5; color:${s.textColor}; }
.ds-items{ list-style:none; margin:0 0 ${s.spacing + 4}px; padding:0; text-align:left; display:flex; flex-direction:column; gap:${s.spacing}px; }
.ds-item{ display:flex; align-items:flex-start; gap:10px; color:${s.textColor}; }
.ds-item-icon{ flex-shrink:0; color:${s.border}; }
.ds-buttons{ display:flex; flex-direction:column; gap:10px; }
.ds-button{
  width:100%; border-radius:${Math.max(8, s.radius - 8)}px; padding:13px 16px;
  font-size:1em; font-weight:600; cursor:pointer; border:1px solid transparent;
  transition:filter .15s ease, transform .08s ease;
}
.ds-button:active{ transform:scale(.97); }
${a.enabled ? animKeyframes(a) : ""}`;
  }

  function animKeyframes(a) {
    const kf = {
      "scale-up": ["opacity:0;transform:scale(.9)", "opacity:1;transform:scale(1)"],
      "slide-up": ["opacity:0;transform:translateY(40px)", "opacity:1;transform:translateY(0)"],
      "fade-in": ["opacity:0", "opacity:1"]
    };
    const inFrames = kf[a.in] || kf["scale-up"];
    const outMap = { "fade-out": "fade-in", "scale-down": "scale-up", "slide-down": "slide-up" };
    const outFrames = kf[outMap[a.out]] || kf["fade-in"];
    return `@keyframes dsIn{ from{ ${inFrames[0]}; } to{ ${inFrames[1]}; } }
@keyframes dsOut{ from{ ${outFrames[1]}; } to{ ${outFrames[0]}; } }`;
  }

  function buildJs() {
    return `// Dialog Studio · componente reutilizável
// Não modifica nada fora dos elementos com prefixo "ds-".
(function(){
  var overlay = document.getElementById('dsOverlay');
  var closeDelay = ${state.anim.enabled ? 220 : 0};

  function openDialog(){
    if(!overlay) return;
    overlay.classList.remove('ds-closing');
    overlay.classList.add('ds-open');
  }

  function closeDialog(){
    if(!overlay) return;
    overlay.classList.add('ds-closing');
    setTimeout(function(){
      overlay.classList.remove('ds-open');
      overlay.classList.remove('ds-closing');
    }, closeDelay);
  }

  if(overlay){
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) closeDialog();
    });
    var buttons = overlay.querySelectorAll('[data-ds-action]');
    buttons.forEach(function(btn){
      btn.addEventListener('click', function(){
        var action = btn.getAttribute('data-ds-action');
        if(action === 'url'){
          var url = btn.getAttribute('data-ds-url');
          if(url) window.open(url, '_blank');
          closeDialog();
        } else if(action === 'function'){
          var fnName = btn.getAttribute('data-ds-fn');
          if(fnName && typeof window[fnName] === 'function') window[fnName]();
          closeDialog();
        } else {
          closeDialog();
        }
      });
    });
  }

  // Expostas globalmente para uso no restante do app
  window.openDialog = openDialog;
  window.closeDialog = closeDialog;
})();`;
  }

  function buildSingleFile() {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dialog</title>
<style>
${buildCss()}
</style>
</head>
<body>
${buildHtml()}
<script>
${buildJs()}
<\/script>
</body>
</html>`;
  }

  let currentCodeTab = "html";
  function refreshCodeModal() {
    const map = { html: buildHtml, css: buildCss, js: buildJs, single: buildSingleFile };
    $("#codeOutput").textContent = map[currentCodeTab]();
  }

  function bindCodeModal() {
    $("#btnCode").addEventListener("click", () => {
      refreshCodeModal();
      $("#codeModal").classList.add("is-open");
    });
    $("#closeCodeModal").addEventListener("click", () => $("#codeModal").classList.remove("is-open"));
    $all(".modal-tab").forEach(t => {
      t.addEventListener("click", () => {
        $all(".modal-tab").forEach(x => x.classList.remove("is-active"));
        t.classList.add("is-active");
        currentCodeTab = t.dataset.code;
        refreshCodeModal();
      });
    });
    $("#btnCopyCode").addEventListener("click", async () => {
      const text = $("#codeOutput").textContent;
      try {
        await navigator.clipboard.writeText(text);
        toast("Código copiado!");
      } catch (err) {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
        toast("Código copiado!");
      }
    });
  }

  /* ============================================================
     EXPORTAR / SALVAR / JSON
     ============================================================ */
  function bindExport() {
    $("#btnExport").addEventListener("click", () => {
      const single = window.confirm(
        'Exportar como um único arquivo (dialog.html)?\n\nOK = arquivo único\nCancelar = versão dividida (dialog.html + dialog.css + dialog.js), recomendada para projetos maiores.'
      );
      if (single) {
        download("dialog.html", buildSingleFile(), "text/html");
        toast("dialog.html exportado");
      } else {
        download("dialog.html", `<!-- Inclua no seu projeto: -->\n<!-- <link rel="stylesheet" href="dialog.css"> -->\n<!-- <script src="dialog.js"></script> (antes de </body>) -->\n\n${buildHtml()}`, "text/html");
        setTimeout(() => download("dialog.css", buildCss(), "text/css"), 250);
        setTimeout(() => download("dialog.js", buildJs(), "text/javascript"), 500);
        toast("dialog.html, dialog.css e dialog.js exportados");
      }
    });

    $("#btnJson").addEventListener("click", () => {
      download("dialog-studio-config.json", JSON.stringify(state, null, 2), "application/json");
      toast("Configuração JSON exportada");
    });

    $("#btnSave").addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      toast("Projeto salvo neste navegador");
    });
  }

  function bindImport() {
    $("#btnImport").addEventListener("click", () => {
      $("#importInput").value = "";
      $("#importHint").textContent = "";
      $("#importModal").classList.add("is-open");
    });
    $("#closeImportModal").addEventListener("click", () => $("#importModal").classList.remove("is-open"));
    $("#btnConfirmImport").addEventListener("click", () => {
      try {
        const parsed = JSON.parse($("#importInput").value);
        if (!parsed || typeof parsed !== "object" || !parsed.style || !parsed.anim) {
          throw new Error("Formato inválido");
        }
        state = Object.assign(defaultState(), parsed);
        state.style = Object.assign(defaultState().style, parsed.style);
        state.anim = Object.assign(defaultState().anim, parsed.anim);
        state.items = Array.isArray(parsed.items) ? parsed.items : [];
        state.buttons = Array.isArray(parsed.buttons) ? parsed.buttons : [];
        fillFormFromState();
        renderPreview();
        $("#importModal").classList.remove("is-open");
        toast("Configuração importada");
      } catch (e) {
        $("#importHint").textContent = "JSON inválido. Verifique o conteúdo colado.";
      }
    });
  }

  function tryLoadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(defaultState(), parsed);
        state.style = Object.assign(defaultState().style, parsed.style);
        state.anim = Object.assign(defaultState().anim, parsed.anim);
      }
    } catch (e) { /* ignora e usa padrão */ }
  }

  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */
  function bindGlobalItemsButtons() {
    $("#btnAddItem").addEventListener("click", () => {
      state.items.push({ icon: "✔", text: "Novo item" });
      renderItemsEditor(); renderPreview();
    });
    $("#btnAddButton").addEventListener("click", () => {
      state.buttons.push({
        id: uid("btn-"), label: "Novo botão", type: "secondary",
        color: "transparent", textColor: "#B7BCC7", border: "#2A2D37",
        action: "close", link: ""
      });
      renderButtonsEditor(); renderPreview();
    });
  }

  function init() {
    tryLoadSaved();
    bindTabs();
    bindDevices();
    bindMenuToggle();
    bindContentFields();
    bindGlobalItemsButtons();
    bindCodeModal();
    bindExport();
    bindImport();
    fillFormFromState();
    renderPreview();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
