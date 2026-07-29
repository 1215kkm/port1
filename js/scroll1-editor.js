/* scroll1-editor.js
 * Lightweight in-place editor for the scroll1 skin.
 *  - hydrates #s1-root from Firebase (data.skins.scroll1.html) on load
 *  - owner (logged-in, not view mode) gets an Edit toggle
 *  - edit mode: click-to-edit text, duplicate/delete repeatable blocks,
 *    swap image/video media, attach a "go to link" button per element
 *  - Save serialises the authored HTML back to Firebase via dataManager
 *
 * Persistence key: data.skins.scroll1.html  (string of #s1-root innerHTML)
 * Media is uploaded to Firebase Storage (URL stored in the HTML), so the
 * Firestore document stays well under its 1MB limit.
 */
(function () {
  'use strict';

  var DM = function () { return window.dataManager; };
  function root() { return document.getElementById('s1-root'); }
  function qa(sel, ctx) { return Array.prototype.slice.call((ctx || root()).querySelectorAll(sel)); }

  // selectors whose every match is one repeatable unit (＋추가 duplicates it)
  // Stable data-attribute anchors only — style-substring selectors break once the
  // animation engine touches an element (the browser re-serialises inline style:
  // "90px 1fr" → "90px 1fr", "#d2d2d2" → "rgb(...)"), so repeatable/media units
  // are marked with data-s1-* in the HTML instead.
  var REP_SELECTORS = [
    'section[data-screen-label="Responsive"]',  // 반응형 웹사이트 섹션
    '[data-project]',                           // POSTER 프로젝트
    '[data-htrack] > div',                      // POPUP 가로 타일
    '[data-team]',                              // TEAM WORK 카드
    '[data-typo]',                              // 타이포그래피 행
    '[data-s1-row]',                            // 프로필 정보 행 (런타임 생성)
    '[data-s1-rep]',                            // 경력·AI·통계·연락처·디렉션 등 (HTML 마커)
    '[data-banner]'                             // POPUP 아래 가로형 배너
  ];
  var TEXT_TAGS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'DIV'];
  // structural/marker attributes: a DIV carrying one of these is a layout
  // wrapper (repeatable unit, media box, row, section shell, ...), never a
  // plain text leaf, even when its only children happen to be inline tags.
  var DIV_STRUCTURAL_ATTRS = [
    'data-s1-media', 'data-s1-rep', 'data-project', 'data-team', 'data-htrack',
    'data-s1-row', 'data-vlog', 'data-teamwrap', 'data-worksec', 'data-hsec',
    'data-hpin', 'data-panel', 'data-about', 'data-projects', 'data-banner'
  ];
  function isStructuralDiv(el) {
    for (var i = 0; i < DIV_STRUCTURAL_ATTRS.length; i++) { if (el.hasAttribute(DIV_STRUCTURAL_ATTRS[i])) return true; }
    return false;
  }
  // a DIV counts as an editable text leaf only if every direct child is an
  // inline formatting tag (or there are no element children at all) — a DIV
  // that wraps other DIVs/sections is a layout container, not text.
  function isTextLeaf(el) {
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) { if (kids[i].tagName !== 'BR') return false; }
    return !!(el.textContent && el.textContent.trim());
  }

  var snapshot = null;   // clean HTML captured at edit-start (for cancel)
  var editing = false;

  /* ---------------- ownership / startup ---------------- */
  function isOwner() {
    var dm = DM();
    return !!(dm && !dm.isViewMode && dm.userId);
  }

  function hydrate() {
    var dm = DM();
    var saved = dm && dm.get && dm.get('skins.scroll1.html');
    if (saved && typeof saved === 'string' && saved.length > 30 && root()) {
      root().innerHTML = saved;
    }
  }

  function boot() {
    hydrate();
    // hand the (possibly replaced) DOM to the animation engine
    if (window.Scroll1Anim) window.Scroll1Anim.start();
    if (isOwner()) buildFab();
  }

  // wait for the shared data layer, with a fallback so the page still animates offline
  var booted = false;
  function bootOnce() { if (booted) return; booted = true; boot(); }
  if (window.dataManager && window.dataManager.data) {
    document.addEventListener('DOMContentLoaded', bootOnce);
    if (document.readyState !== 'loading') bootOnce();
  } else {
    window.addEventListener('dataManagerReady', bootOnce);
    setTimeout(bootOnce, 2500); // offline / no firebase
  }

  /* ---------------- floating control ---------------- */
  var fab, statusEl;
  function buildFab() {
    if (fab) return;
    fab = document.createElement('div');
    fab.className = 's1-fab';
    document.body.appendChild(fab);
    document.body.classList.add('s1-has-toolbar');   // reserve top space (matches the V3 editor's top toolbar)
    renderFab();
    // hidden file input for uploads
    var fi = document.createElement('input');
    fi.type = 'file'; fi.accept = 'image/*'; fi.id = 's1-file-input'; fi.style.display = 'none';
    document.body.appendChild(fi);
  }
  // top bar, split into a left info zone + right button zone — same shape as the
  // V3 editor's toolbar (css/editor-v3.css .ev3-toolbar) so switching between
  // skins mid-edit doesn't feel like a different app.
  function renderFab() {
    if (!fab) return;
    if (editing) {
      fab.innerHTML =
        '<div class="s1-fab-left">' +
          '<span class="s1-fab-logo">✏️ 편집모드 <small>스크롤</small></span>' +
          '<span class="s1-fab-hint">글자 클릭, 블록에 마우스 올려 ＋/🗑/🔗</span>' +
        '</div>' +
        '<div class="s1-fab-right">' +
          '<span class="s1-status">편집 중…</span>' +
          '<button class="s1-save-btn">💾 저장</button>' +
          '<button class="s1-exit-btn">✖ 취소</button>' +
        '</div>';
      fab.querySelector('.s1-save-btn').onclick = function () { exitEdit(true); };
      fab.querySelector('.s1-exit-btn').onclick = function () { exitEdit(false); };
      statusEl = fab.querySelector('.s1-status');
    } else {
      // skin switcher — paths in the registry are root-relative; this page lives
      // in skins/ so prefix '../'. Navigating without ?u keeps owner-edit mode.
      var skinOpts = '<option value="../portfolio-edit.html">기본 (V3 포트폴리오)</option>';
      (window.PORTFOLIO_SKINS || []).forEach(function (s) {
        skinOpts += '<option value="../' + s.file + '"' + (s.id === 'scroll1' ? ' selected' : '') + '>'
          + (s.icon ? s.icon + ' ' : '') + s.name + ' 스킨</option>';
      });
      fab.innerHTML =
        '<div class="s1-fab-left">' +
          '<span class="s1-fab-logo">🖥️ 스크롤 스킨</span>' +
          '<span class="s1-fab-hint">편집하기를 눌러 화면에서 바로 수정하세요</span>' +
        '</div>' +
        '<div class="s1-fab-right">' +
          '<select class="s1-skin-select" title="스킨 선택">' + skinOpts + '</select>' +
          '<button class="s1-share-btn" title="보기 전용 공유 링크 복사">🔗 공유</button>' +
          '<button class="s1-edit-btn">✏️ 편집하기</button>' +
        '</div>';
      fab.querySelector('.s1-edit-btn').onclick = enterEdit;
      fab.querySelector('.s1-share-btn').onclick = copyShareLink;
      var sel = fab.querySelector('.s1-skin-select');
      sel.onchange = function () { if (sel.value) location.href = sel.value; };
      statusEl = null;
    }
  }
  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:#222;color:#fff;padding:12px 20px;border-radius:10px;z-index:100001;font-size:14px;line-height:1.4;box-shadow:0 6px 22px rgba(0,0,0,.45);max-width:82vw;white-space:pre-wrap;text-align:center;font-family:Pretendard,sans-serif;';
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2800);
  }

  // copy a view-only share link (?u=<uid>) so anyone can see the finished skin
  function copyShareLink() {
    var dm = DM();
    var uid = dm && dm.userId;
    if (!uid) { toast('로그인 후 공유 링크를 만들 수 있어요.'); return; }
    var url = location.origin + location.pathname + '?u=' + encodeURIComponent(uid);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { toast('공유 링크가 복사되었습니다 ✓\n받는 사람은 편집 없이 보기만 됩니다.'); },
        function () { window.prompt('아래 링크를 복사해서 보내세요:', url); }
      );
    } else {
      window.prompt('아래 링크를 복사해서 보내세요:', url);
    }
  }

  /* ---------------- enter / exit ---------------- */
  function enterEdit() {
    editing = true;
    snapshot = serialize();                 // clean copy for cancel
    document.body.classList.add('s1-editing');
    if (window.Scroll1Anim) { window.Scroll1Anim.pause(); window.Scroll1Anim.reveal(); window.Scroll1Anim.layoutTeam(); }
    decorate(root());
    renderFab();
    window.scrollTo({ top: 0 });
  }

  async function exitEdit(save) {
    var html;
    if (save) {
      setStatus('저장 중…');
      var res = await saveNow();
      if (!res.ok) {
        setStatus('저장 실패 ✗');
        alert('저장에 실패했습니다.\n\n' + res.msg + '\n\n편집한 내용은 그대로 유지됩니다.');
        return;                              // stay in edit mode so nothing is lost
      }
      if (res.warn) alert(res.warn);
      html = res.html;
      setStatus('저장됨 ✓');
    } else {
      html = snapshot != null ? snapshot : serialize();
    }
    editing = false;
    document.body.classList.remove('s1-editing');
    root().innerHTML = html;                // drop toolbars / contenteditable
    renderViewLinks(root());
    if (window.Scroll1Anim) { window.Scroll1Anim.reprime(); window.Scroll1Anim.start(); }
    renderFab();
  }

  // Persist to Firebase, awaiting the write and surfacing the real failure
  // reason (Firestore is fire-and-forget elsewhere, so failures were silent —
  // and on reload the unsaved skin gets overwritten by the stored doc).
  async function saveNow() {
    var dm = DM();
    if (!dm) return { ok: false, msg: '데이터 시스템을 찾을 수 없습니다.' };
    if (dm.isViewMode) return { ok: false, msg: '지금은 “보기 모드”입니다. 주소에서 ?u=... 부분을 빼고, 로그인한 상태로 열어야 저장됩니다.' };
    var html = serialize();
    var failedMsg = null, tooLarge = false;
    var onErr = function (e) { failedMsg = (e.detail && e.detail.error) || '알 수 없는 오류'; tooLarge = !!(e.detail && e.detail.tooLarge); };
    window.addEventListener('dataSaveError', onErr);
    try {
      dm.data = dm.data || {};
      dm.data.skins = dm.data.skins || {};
      dm.data.skins.scroll1 = dm.data.skins.scroll1 || {};
      dm.data.skins.scroll1.html = html;
      await dm.saveData();                    // awaits the Firestore write
    } catch (e) { failedMsg = (e && e.message) || String(e); }
    window.removeEventListener('dataSaveError', onErr);
    if (failedMsg) {
      if (tooLarge) failedMsg = '저장 용량(문서 1MB)을 초과했습니다. 큰 이미지를 줄이거나 일부 이미지를 빼고 다시 저장해주세요.\n(' + failedMsg + ')';
      return { ok: false, msg: failedMsg };
    }
    // online but not authenticated → only localStorage was written
    if (dm.isFirebaseReady && !dm.userId) {
      return { ok: true, html: html, warn: '로그인이 안 되어 이 브라우저에만 임시 저장되었습니다. 로그인 후 다시 저장하면 서버에 반영됩니다.' };
    }
    return { ok: true, html: html };
  }

  /* ---------------- decoration (edit mode) ---------------- */
  function decorate(scope) {
    restructureProfile(scope);
    autoTagMedia(scope);
    // text
    TEXT_TAGS.forEach(function (tag) {
      qa(tag, scope).forEach(function (el) {
        if (el.closest('.s1-tool')) return;
        if (el.closest('[data-s1-media]')) return;          // media placeholder text — skip
        if (el.classList.contains('s1-linkbtn')) return;
        // only leaf-ish: a SPAN with child elements that aren't inline-formatting -> skip
        if (el.querySelector('section, [data-s1-media], .s1-tool')) return;
        if (el.closest('[contenteditable="true"]')) return; // ancestor already editable
        if (tag === 'DIV' && (isStructuralDiv(el) || !isTextLeaf(el))) return; // skip layout wrappers
        el.setAttribute('contenteditable', 'true');
        el.spellcheck = false;
      });
    });
    // repeatable units
    REP_SELECTORS.forEach(function (sel) {
      qa(sel, scope).forEach(function (el) { makeRep(el); });
    });
    // media boxes
    qa('[data-s1-media]', scope).forEach(function (el) { makeMedia(el); });
    // section backgrounds
    qa('section[data-screen-label]', scope).forEach(function (el) { makeSection(el); });
    // link buttons (existing) get edit behaviour
    qa('.s1-linkbtn', scope).forEach(bindLinkBtnEdit);
  }

  function autoTagMedia(scope) {
    // every placeholder/image region becomes uploadable: gray mockups, black
    // video boxes (V-LOG 등), and any element already styled as a flat image area
    qa('[style*="background:#d2d2d2"],[style*="background:#c4c4c4"],[style*="background:#000;"],[style*="background:#000 "]', scope).forEach(function (el) {
      if (!el.hasAttribute('data-s1-media')) el.setAttribute('data-s1-media', '');
    });
  }

  // Wrap the flat "label / value" profile grid into per-row units so each row
  // can be duplicated / deleted. Runs at runtime so it works on both the shipped
  // markup and any previously-saved (flat) HTML. Idempotent.
  function restructureProfile(scope) {
    qa('[data-s1-profile]', scope).forEach(function (grid) {
      if (grid.querySelector(':scope > [data-s1-row]')) return;     // already rows
      var kids = Array.prototype.slice.call(grid.children).filter(function (n) { return n.nodeType === 1; });
      if (kids.length < 2) return;
      grid.style.display = 'flex';
      grid.style.flexDirection = 'column';
      grid.style.gap = '22px';
      for (var i = 0; i < kids.length; i += 2) {
        var row = document.createElement('div');
        row.setAttribute('data-s1-row', '');
        row.style.cssText = 'display:grid;grid-template-columns:90px 1fr;column-gap:18px;align-items:start;';
        grid.insertBefore(row, kids[i]);
        row.appendChild(kids[i]);
        if (kids[i + 1]) row.appendChild(kids[i + 1]);
      }
    });
  }

  function tool(buttons) {
    var t = document.createElement('div');
    t.className = 's1-tool';
    buttons.forEach(function (b) {
      var btn = document.createElement('button');
      btn.innerHTML = b.icon; btn.title = b.title || '';
      if (b.cls) btn.className = b.cls;
      btn.onclick = function (e) { e.preventDefault(); e.stopPropagation(); b.fn(); };
      t.appendChild(btn);
    });
    return t;
  }

  function makeRep(el) {
    if (el.classList.contains('s1-rep')) return;
    el.classList.add('s1-rep');
    el.appendChild(tool([
      { icon: '＋', title: '이 블록 복제(추가)', fn: function () { duplicate(el); } },
      { icon: '🔗', title: '링크 버튼 추가/수정', fn: function () { editLink(el); } },
      { icon: '🗑', title: '이 블록 삭제', cls: 's1-del', fn: function () { removeUnit(el); } }
    ]));
  }

  function duplicate(el) {
    var clone = el.cloneNode(true);
    // strip edit artefacts from the clone, then re-decorate it
    clone.classList.remove('s1-rep');
    qa('.s1-tool', clone).forEach(function (n) { n.remove(); });
    clone.querySelectorAll('[contenteditable]').forEach(function (n) { n.removeAttribute('contenteditable'); });
    qa('.s1-mediabox', clone).forEach(function (n) { n.classList.remove('s1-mediabox'); });
    el.parentNode.insertBefore(clone, el.nextSibling);
    decorate(clone.parentNode);   // decorate siblings (idempotent guards prevent dupes)
    if (window.Scroll1Anim) window.Scroll1Anim.layoutTeam();   // restagger if a team card was added
    clone.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function removeUnit(el) {
    if (!confirm('이 블록을 삭제할까요?')) return;
    el.remove();
  }

  /* ---------------- media ---------------- */
  function makeMedia(el) {
    if (el.classList.contains('s1-mediabox')) return;
    el.classList.add('s1-mediabox');
    el.appendChild(tool([
      { icon: '🖼', title: '이미지 넣기', fn: function () { pickImage(el); } },
      { icon: '🎬', title: '영상 넣기(URL)', fn: function () { setVideo(el); } },
      { icon: '✖', title: '비우기', cls: 's1-del', fn: function () { clearMedia(el); } }
    ]));
  }

  function fillMedia(el, innerHTML) {
    // keep the box + its toolbar; replace only the content
    var t = el.querySelector(':scope > .s1-tool');
    el.innerHTML = innerHTML;
    el.style.color = 'transparent';
    if (t) el.appendChild(t);
  }

  function pickImage(el) {
    var fi = document.getElementById('s1-file-input');
    fi.value = '';
    fi.onchange = function () {
      var file = fi.files && fi.files[0];
      if (!file) return;
      setStatus('이미지 업로드 중…');
      uploadImage(file).then(function (url) {
        if (!url) { setStatus('업로드 실패'); return; }
        fillMedia(el, '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;display:block;">');
        setStatus('이미지 적용됨 ✓');
      });
    };
    fi.click();
  }

  function setVideo(el) {
    var url = prompt('영상 URL을 입력하세요 (YouTube 링크 또는 .mp4 주소):', '');
    if (!url) return;
    url = url.trim();
    var embed;
    var yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    if (yt) {
      embed = '<iframe src="https://www.youtube.com/embed/' + yt[1] + '" style="width:100%;height:100%;border:0;display:block;" allowfullscreen></iframe>';
    } else {
      embed = '<video src="' + url + '" style="width:100%;height:100%;object-fit:cover;display:block;" controls playsinline></video>';
    }
    fillMedia(el, embed);
    setStatus('영상 적용됨 ✓');
  }

  function clearMedia(el) {
    fillMedia(el, '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#888;font-size:15px;">미디어를 추가하세요</div>');
  }

  /* ---------------- section backgrounds ---------------- */
  function rgbToHex(rgb) {
    var m = (rgb || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return '#' + [m[1], m[2], m[3]].map(function (n) { return ('0' + parseInt(n, 10).toString(16)).slice(-2); }).join('');
  }
  function makeSection(section) {
    if (section.classList.contains('s1-sec')) return;
    section.classList.add('s1-sec');
    if (section.getAttribute('data-s1-bg0') === null) {
      section.setAttribute('data-s1-bg0', section.style.background || section.style.backgroundColor || '');
    }
    var t = document.createElement('div');
    t.className = 's1-tool s1-sectool';
    var ci = document.createElement('input');
    ci.type = 'color'; ci.title = '배경 색상';
    try { ci.value = rgbToHex(getComputedStyle(section).backgroundColor) || '#0a0a0a'; } catch (e) { ci.value = '#0a0a0a'; }
    ci.oninput = function (e) { e.stopPropagation(); section.style.backgroundImage = ''; section.style.background = ci.value; };
    ci.onclick = function (e) { e.stopPropagation(); };
    var ib = document.createElement('button');
    ib.innerHTML = '🖼'; ib.title = '배경 이미지';
    ib.onclick = function (e) { e.preventDefault(); e.stopPropagation(); pickSectionImage(section); };
    var rb = document.createElement('button');
    rb.innerHTML = '↺'; rb.title = '배경 원래대로';
    rb.onclick = function (e) {
      e.preventDefault(); e.stopPropagation();
      section.style.backgroundImage = '';
      section.style.background = section.getAttribute('data-s1-bg0') || '';
    };
    t.appendChild(ci); t.appendChild(ib); t.appendChild(rb);
    section.appendChild(t);
  }
  function pickSectionImage(section) {
    var fi = document.getElementById('s1-file-input');
    fi.value = '';
    fi.onchange = function () {
      var file = fi.files && fi.files[0];
      if (!file) return;
      setStatus('배경 이미지 업로드 중…');
      uploadImage(file).then(function (url) {
        if (!url) { setStatus('업로드 실패'); return; }
        section.style.backgroundImage = 'url(' + url + ')';
        section.style.backgroundSize = 'cover';
        section.style.backgroundPosition = 'center';
        setStatus('배경 이미지 적용됨 ✓');
      });
    };
    fi.click();
  }

  /* ---------------- links ---------------- */
  function editLink(unit) {
    var cur = unit.getAttribute('data-s1-link') || '';
    var url = prompt('이 블록에 표시할 "바로가기" 버튼 링크 (새 창). 비우면 버튼 제거:', cur);
    if (url === null) return;
    url = url.trim();
    if (url) { unit.setAttribute('data-s1-link', url); ensureLinkBtn(unit, url); }
    else { unit.removeAttribute('data-s1-link'); var b = unit.querySelector(':scope > .s1-linkbtn'); if (b) b.remove(); }
  }

  function ensureLinkBtn(unit, url) {
    var btn = unit.querySelector(':scope > .s1-linkbtn');
    if (!btn) {
      btn = document.createElement('a');
      btn.className = 's1-linkbtn';
      btn.textContent = '바로가기 ↗';
      btn.target = '_blank'; btn.rel = 'noopener';
      var t = unit.querySelector(':scope > .s1-tool');
      if (t) unit.insertBefore(btn, t); else unit.appendChild(btn);
      if (editing) bindLinkBtnEdit(btn);
    }
    btn.href = url;
  }

  function bindLinkBtnEdit(btn) {
    btn.onclick = function (e) { e.preventDefault(); e.stopPropagation(); var u = btn.closest('[data-s1-link]'); if (u) editLink(u); };
  }
  function renderViewLinks(scope) {
    // make sure saved buttons navigate normally in view mode (no handler needed)
    qa('.s1-linkbtn', scope).forEach(function (b) { b.onclick = null; });
  }

  /* ---------------- image upload (Storage, base64 fallback) ---------------- */
  function uploadImage(file) {
    if (!file.type || file.type.indexOf('image/') !== 0) { alert('이미지 파일만 가능합니다.'); return Promise.resolve(null); }
    if (file.size > 8 * 1024 * 1024) { alert('8MB 이하 이미지를 사용해주세요.'); return Promise.resolve(null); }
    var SM = window.StorageManager || (window.getStorageManager && window.getStorageManager());
    var uid = DM() && DM().userId;
    if (SM && uid) {
      // use 'portfolio' (a folder the existing Storage rules already permit) so
      // uploads succeed and stay OUT of the Firestore doc — base64 fallback would
      // bloat the doc toward the 1MB limit and make saves fail.
      return SM.uploadImage(uid, file, 'portfolio').then(function (r) {
        if (r && r.success && r.url) return r.url;
        return compress(file, 1000, 0.7);
      }).catch(function () { return compress(file, 1000, 0.7); });
    }
    return compress(file, 1000, 0.7);
  }
  function compress(file, maxW, q) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          var c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          try { resolve(c.toDataURL('image/jpeg', q)); } catch (err) { reject(err); }
        };
        img.onerror = reject; img.src = e.target.result;
      };
      reader.onerror = reject; reader.readAsDataURL(file);
    });
  }

  /* ---------------- serialize (clean authored HTML) ---------------- */
  var STRIP_PROPS = ['opacity', 'transform', 'transition', 'will-change', 'transform-box', 'transform-origin', 'z-index'];
  function serialize() {
    var clone = root().cloneNode(true);
    qa('.s1-tool', clone).forEach(function (n) { n.remove(); });
    clone.querySelectorAll('[contenteditable]').forEach(function (n) { n.removeAttribute('contenteditable'); n.removeAttribute('spellcheck'); });
    clone.querySelectorAll('.s1-rep, .s1-mediabox, .s1-sec').forEach(function (n) {
      n.classList.remove('s1-rep'); n.classList.remove('s1-mediabox'); n.classList.remove('s1-sec');
      if (n.getAttribute('class') === '') n.removeAttribute('class');
    });
    clone.querySelectorAll('[data-s1-bg0]').forEach(function (n) { n.removeAttribute('data-s1-bg0'); });
    // strip animation-injected inline styles so reload re-primes cleanly
    clone.querySelectorAll('*').forEach(function (n) {
      if (!n.style || !n.getAttribute('style')) return;
      STRIP_PROPS.forEach(function (p) { n.style.removeProperty(p); });
      if (n.getAttribute('style') === '') n.removeAttribute('style');
    });
    // layout values that the animation engine recomputes on load (don't persist)
    clone.querySelectorAll('[data-team]').forEach(function (n) {
      n.style.removeProperty('margin-top');
      var r = parseFloat(n.getAttribute('data-rot')) || 0; n.style.transform = 'rotate(' + r + 'deg)';  // re-apply authored rotation
    });
    clone.querySelectorAll('[data-hsec]').forEach(function (n) { n.style.removeProperty('height'); });
    return clone.innerHTML;
  }

  // public hooks (owner-menu / external triggers / tests)
  window.Scroll1Editor = {
    enter: enterEdit,
    exit: exitEdit,
    isOwner: isOwner,
    showControls: buildFab,
    serialize: serialize
  };
})();
