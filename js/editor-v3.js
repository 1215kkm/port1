/* =========================================================
   Editor v3 — 사용자 화면(portfolio.html) 위에서 그대로 인라인 편집
   - 화면/렌더링은 app.js(PageInitializer) 재사용 → 사용자 페이지와 100% 동일
   - 이 파일은 "클릭 → 인라인 수정 / +- 추가삭제 / 이미지 업로드 / 설정 서랍"만 담당
   - 모든 저장은 window.dataManager 를 통해 → saveData() → Firestore/localStorage
     (portfolio.html 이 읽는 그 데이터에 그대로 반영됨)
   ========================================================= */
(function () {
    'use strict';

    const dm = window.dataManager;
    if (!dm) { console.error('[editor-v3] dataManager 없음'); return; }
    const data = () => dm.getData();

    // ---------- 작은 유틸 ----------
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const splitList = (s) => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
    const confirmDel = (msg, fn) => { if (window.confirm(msg)) fn(); };

    // ---------- 저장 상태 표시 ----------
    const statusEl = $('#ev3-save-status');
    function setStatus(state, msg) {
        if (!statusEl) return;
        statusEl.className = 'ev3-save-status' + (state === 'saving' ? ' saving' : state === 'error' ? ' error' : '');
        statusEl.textContent = '● ' + (msg || (state === 'saving' ? '저장 중…' : state === 'error' ? '저장 실패' : '저장됨 ✓'));
    }
    window.addEventListener('dataUpdated', () => setStatus('saved', '저장됨 ✓'));

    // ---------- 저장 실패 알림 (Firestore 1MB 문서 초과 등) ----------
    // alert()는 절대 쓰지 않는다: 서버 저장은 비동기라 실패 알림이 커밋 후 0.5~1초
    // 늦게 도착하는데, 그때 사용자가 이미 다음 칸을 편집 중이면 alert가 포커스를
    // 뺏어 열린 입력창이 즉시 닫혀버린다("보라색 박스가 잠깐만 활성화" 버그).
    let toastEl = null, toastTimer = 0;
    function showToast(msg, isError) {
        if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'ev3-toast'; document.body.appendChild(toastEl); }
        toastEl.textContent = msg;
        toastEl.classList.toggle('error', !!isError);
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 6000);
    }
    let lastSaveAlert = 0;
    window.addEventListener('dataSaveError', (e) => {
        setStatus('error', '저장 실패 — 서버에 반영되지 않음');
        const tooLarge = e && e.detail && e.detail.tooLarge;
        // 같은 알림을 반복하지 않도록 8초 쓰로틀
        const now = (window.performance && performance.now) ? performance.now() : (lastSaveAlert + 9000);
        if (now - lastSaveAlert < 8000) return;
        lastSaveAlert = now;
        if (tooLarge) {
            showToast('⚠ 저장 용량(1MB) 초과 — 서버에 반영되지 않습니다.\n' +
                '이미지 일부를 삭제하면 다시 저장됩니다.', true);
        } else {
            showToast('⚠ 서버 저장 실패 — 네트워크 확인 후 다시 시도해주세요.\n' +
                '(이 화면의 수정 내용은 이 브라우저에는 남아 있습니다)', true);
        }
    });

    // ---------- 이미지 업로드 ----------
    // 캔버스로 리사이즈/압축하여 base64 반환 (Storage 용량초과/미연결 폴백)
    function compressImage(file, maxWidth, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width, h = img.height;
                    if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    try { resolve(canvas.toDataURL('image/jpeg', quality)); }
                    catch (err) { reject(err); }
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    async function doUpload(file, path) {
        if (!file.type || !file.type.startsWith('image/')) { alert('이미지 파일만 업로드할 수 있습니다.'); return null; }
        if (file.size > 8 * 1024 * 1024) { alert('파일이 너무 큽니다. 8MB 이하 이미지를 사용해주세요.'); return null; }
        const SM = window.StorageManager || (window.getStorageManager && window.getStorageManager());
        const userId = dm.userId;
        setStatus('saving', '업로드 중…');
        // 1) Firebase Storage 우선 시도
        if (SM && userId) {
            try {
                const r = await SM.uploadImage(userId, file, path);
                if (r && r.success && r.url) { setStatus('saved', '업로드 완료 ✓'); return r.url; }
                console.warn('[editor-v3] Storage 실패 → 내장(base64) 대체:', r && r.error);
            } catch (e) { console.warn('[editor-v3] Storage 예외 → 내장(base64) 대체:', e); }
        }
        // 2) 폴백: 압축 base64 (Storage 용량초과/미연결 시에도 이미지가 동작)
        //    내장 이미지는 Firestore 문서(1MB) 용량을 공유하므로 강하게 압축한다.
        try {
            let b64 = await compressImage(file, 800, 0.6);
            // 그래도 크면 단계적으로 더 줄여서 누적 용량초과를 늦춘다.
            if (b64.length > 180 * 1024) b64 = await compressImage(file, 680, 0.5);
            if (b64.length > 180 * 1024) b64 = await compressImage(file, 560, 0.45);
            setStatus('saved', '업로드 완료(내장) ✓');
            return b64;
        } catch (e) {
            console.error('[editor-v3] 이미지 처리 오류:', e);
            alert('이미지 처리 실패: ' + e.message);
            setStatus('error');
            return null;
        }
    }
    function pickAndUpload(path) {
        return new Promise(resolve => {
            const input = $('#ev3-file-input');
            input.value = '';
            input.onchange = async () => {
                const file = input.files && input.files[0];
                if (!file) return resolve(null);
                resolve(await doUpload(file, path));
            };
            input.click();
        });
    }

    // ---------- 인라인 텍스트 편집 ----------
    function inlineEdit(el, rawValue, opts, onCommit) {
        if (el.dataset.ev3Editing) return;
        el.dataset.ev3Editing = '1';
        const original = el.innerHTML;
        const field = document.createElement(opts.multiline ? 'textarea' : 'input');
        field.className = opts.multiline ? 'ev3-textarea' : 'ev3-input';
        field.value = rawValue != null ? rawValue : '';
        if (opts.multiline) field.rows = opts.rows || 5;
        if (opts.wide) { field.style.minWidth = 'min(460px, 78vw)'; field.style.width = 'min(460px, 78vw)'; }
        el.innerHTML = '';
        el.appendChild(field);
        field.focus();
        if (!opts.multiline && field.select) field.select();

        let done = false;
        const commit = () => {
            if (done) return; done = true;
            delete el.dataset.ev3Editing;
            onCommit(field.value);   // → dataManager 저장 → dataUpdated → 재렌더+재데코
        };
        const cancel = () => {
            if (done) return; done = true;
            delete el.dataset.ev3Editing;
            el.innerHTML = original;
        };
        field.addEventListener('blur', commit);
        field.addEventListener('keydown', e => {
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            else if (e.key === 'Enter' && !opts.multiline) { e.preventDefault(); field.blur(); }
            else if (e.key === 'Enter' && opts.multiline && (e.ctrlKey || e.metaKey)) { e.preventDefault(); field.blur(); }
        });
    }
    // 지속되는(다시 그려도 같은) 엘리먼트에 클릭-편집 바인딩 (중복 방지 플래그)
    function bindInline(selector, getRaw, commit, opts) {
        const el = typeof selector === 'string' ? $(selector) : selector;
        if (!el) return;
        el.classList.add('ev3-editable');
        el.title = '클릭하여 수정';
        if (el.dataset.ev3Bound) return;
        el.dataset.ev3Bound = '1';
        el.addEventListener('click', e => {
            if (el.dataset.ev3Editing) return;
            e.stopPropagation();
            inlineEdit(el, getRaw(), opts || {}, commit);
        });
    }
    // 쉼표구분 리스트 필드 — 값이 비어 있으면 안내문구를 보여 클릭 가능하게
    function decorateListField(selector, getArr, commit, hint) {
        const el = $(selector);
        if (!el) return;
        el.classList.add('ev3-editable');
        el.title = '클릭하여 수정';
        const empty = !getArr().length;
        if (empty && !el.dataset.ev3Editing) { el.textContent = hint; el.classList.add('ev3-empty'); }
        else { el.classList.remove('ev3-empty'); }
        if (!el.dataset.ev3Bound) {
            el.dataset.ev3Bound = '1';
            el.addEventListener('click', e => {
                if (el.dataset.ev3Editing) return;
                e.stopPropagation();
                inlineEdit(el, getArr().join(', '), { multiline: true, rows: 2, wide: true }, commit);
            });
        }
    }

    // ---------- 중앙 모달 ----------
    function showModal(title, bodyNode, onSave, saveLabel) {
        const back = document.createElement('div');
        back.className = 'ev3-modal-backdrop open';
        back.innerHTML =
            '<div class="ev3-modal">' +
            '  <div class="ev3-modal-header"><h3></h3><button class="ev3-modal-close" type="button">&times;</button></div>' +
            '  <div class="ev3-modal-body"></div>' +
            '  <div class="ev3-modal-footer">' +
            '    <button class="ev3-fullbtn secondary" type="button" data-act="cancel" style="width:auto;padding:9px 16px;">취소</button>' +
            '    <button class="ev3-fullbtn" type="button" data-act="save" style="width:auto;padding:9px 16px;"></button>' +
            '  </div></div>';
        back.querySelector('h3').textContent = title;
        back.querySelector('[data-act="save"]').textContent = saveLabel || '저장';
        back.querySelector('.ev3-modal-body').appendChild(bodyNode);
        document.body.appendChild(back);
        const close = () => back.remove();
        back.querySelector('.ev3-modal-close').onclick = close;
        back.querySelector('[data-act="cancel"]').onclick = close;
        back.addEventListener('mousedown', e => { if (e.target === back) close(); });
        back.querySelector('[data-act="save"]').onclick = async () => {
            const ok = await onSave();
            if (ok !== false) close();
        };
        return { close, root: back };
    }
    // 단순 폼 모달
    function openFormModal(title, fields, onSave) {
        const body = document.createElement('div');
        const inputs = {};
        fields.forEach(f => {
            const wrap = document.createElement('div'); wrap.className = 'ev3-field';
            if (f.type === 'checkbox') {
                const lab = document.createElement('label'); lab.className = 'ev3-check';
                const inp = document.createElement('input'); inp.type = 'checkbox'; inp.checked = !!f.value;
                lab.appendChild(inp); lab.appendChild(document.createTextNode(' ' + f.label));
                wrap.appendChild(lab); inputs[f.key] = inp;
            } else {
                const lab = document.createElement('label'); lab.textContent = f.label; wrap.appendChild(lab);
                let inp;
                if (f.type === 'textarea') { inp = document.createElement('textarea'); inp.value = f.value || ''; if (f.mono === false) inp.style.cssText = 'font-family:inherit;font-size:14px'; }
                else if (f.type === 'select') {
                    inp = document.createElement('select');
                    (f.options || []).forEach(o => { const op = document.createElement('option'); op.value = o.value; op.textContent = o.label; if (o.value === f.value) op.selected = true; inp.appendChild(op); });
                } else { inp = document.createElement('input'); inp.type = f.type || 'text'; inp.value = f.value != null ? f.value : ''; }
                if (f.placeholder) inp.placeholder = f.placeholder;
                wrap.appendChild(inp); inputs[f.key] = inp;
                if (f.help) { const h = document.createElement('div'); h.className = 'ev3-help'; h.textContent = f.help; wrap.appendChild(h); }
            }
            body.appendChild(wrap);
        });
        showModal(title, body, async () => {
            const v = {};
            fields.forEach(f => {
                v[f.key] = f.type === 'checkbox' ? inputs[f.key].checked
                    : f.type === 'number' ? Number(inputs[f.key].value)
                        : inputs[f.key].value;
            });
            return await onSave(v);
        });
    }
    // 반복 리스트 편집기 (모달 내부에서 사용)
    function makeListEditor(items, columns, makeDefault) {
        const node = document.createElement('div');
        const list = (items || []).map(x => Object.assign({}, x));
        function draw() {
            node.innerHTML = '';
            list.forEach((row, idx) => {
                const r = document.createElement('div'); r.className = 'ev3-row'; r.style.marginBottom = '6px';
                columns.forEach(col => {
                    let inp;
                    if (col.type === 'select') {
                        inp = document.createElement('select');
                        (col.options || []).forEach(o => { const op = document.createElement('option'); op.value = o.value; op.textContent = o.label; if (o.value == row[col.key]) op.selected = true; inp.appendChild(op); });
                    } else {
                        inp = document.createElement('input'); inp.type = col.type || 'text';
                        inp.value = row[col.key] != null ? row[col.key] : '';
                        if (col.min != null) inp.min = col.min; if (col.max != null) inp.max = col.max;
                    }
                    inp.placeholder = col.label; inp.style.flex = col.flex || 1;
                    inp.oninput = () => { row[col.key] = col.type === 'number' ? Number(inp.value) : inp.value; };
                    r.appendChild(inp);
                });
                const del = document.createElement('button'); del.type = 'button'; del.className = 'ev3-mini ev3-mini-del'; del.textContent = '✕'; del.style.flex = 'none';
                del.onclick = () => { list.splice(idx, 1); draw(); };
                r.appendChild(del);
                node.appendChild(r);
            });
            const add = document.createElement('button'); add.type = 'button'; add.className = 'ev3-mini'; add.textContent = '+ 추가';
            add.onclick = () => { list.push(makeDefault ? makeDefault() : {}); draw(); };
            node.appendChild(add);
        }
        draw();
        return { node, get: () => list.map(x => Object.assign({}, x)) };
    }

    // ---------- 리스트 아이템 컨트롤(수정/삭제) ----------
    function addItemControls(itemEl, onEdit, onDelete) {
        if (itemEl.querySelector(':scope > .ev3-item-ctrls')) return;
        itemEl.classList.add('ev3-item-wrap');
        if (getComputedStyle(itemEl).position === 'static') itemEl.style.position = 'relative';
        const ctrls = document.createElement('div'); ctrls.className = 'ev3-item-ctrls';
        const eb = document.createElement('button'); eb.type = 'button'; eb.className = 'ev3-ctrl-btn ev3-ctrl-edit'; eb.textContent = '✏'; eb.title = '수정';
        eb.onclick = e => { e.stopPropagation(); onEdit(); };
        const db = document.createElement('button'); db.type = 'button'; db.className = 'ev3-ctrl-btn ev3-ctrl-del'; db.textContent = '🗑'; db.title = '삭제';
        db.onclick = e => { e.stopPropagation(); onDelete(); };
        ctrls.appendChild(eb); ctrls.appendChild(db);
        itemEl.appendChild(ctrls);
    }
    function addAddButton(refEl, label, onClick, mode) {
        const row = document.createElement('div'); row.className = 'ev3-add-row ev3-injected';
        const b = document.createElement('button'); b.type = 'button'; b.className = 'ev3-add-btn'; b.textContent = label;
        b.onclick = onClick; row.appendChild(b);
        if (mode === 'append') refEl.appendChild(row); else refEl.after(row);
    }

    // =====================================================
    //  데코레이션 (사용자 화면 위에 편집 도구 입히기)
    // =====================================================
    function safe(fn, name) { try { fn(); } catch (e) { console.error('[editor-v3] ' + name + ' 오류:', e); } }
    function decorate() {
        // 이전에 바깥에 주입했던 컨트롤 제거 (중복 방지)
        $$('.ev3-injected').forEach(n => n.remove());
        // 각 섹션을 독립적으로 처리 — 하나가 실패해도 나머지는 정상 동작
        safe(decorateProfile, 'profile');
        safe(decorateImages, 'images');
        safe(decorateAiTools, 'aiTools');
        safe(function () { decorateExperience('related'); }, 'exp-related');
        safe(function () { decorateExperience('other'); }, 'exp-other');
        safe(decorateEvaluation, 'evaluation');
        safe(decorateVideo, 'video');
        safe(decoratePortfolio, 'portfolio');
        safe(decorateContact, 'contact');
        safe(decorateInterviews, 'interviews');
        safe(buildDock, 'dock');
    }
    function decorateSoon() { setTimeout(decorate, 0); }

    function decorateProfile() {
        const p = () => data().profile;
        bindInline('[data-content="name"]', () => p().name, v => dm.updateProfile({ name: v.trim() }));
        bindInline('[data-content="profile-name-top"]', () => p().name, v => dm.updateProfile({ name: v.trim() }));
        bindInline('[data-content="kakao"]', () => p().kakaoId, v => dm.updateProfile({ kakaoId: v.trim() }));
        bindInline('[data-content="job-roles"]', () => p().jobRoles.join(', '), v => dm.updateProfile({ jobRoles: splitList(v) }), { multiline: true, rows: 2, wide: true });
        bindInline('[data-content="skills"]', () => p().skills.join(', '), v => dm.updateProfile({ skills: splitList(v) }), { multiline: true, rows: 3, wide: true });
        // 자격증 / 교육이수 — 샘플(기본값)이 없어도 빈 칸 클릭으로 입력 가능
        decorateListField('[data-content="certificates"]', () => p().certificates || [], v => dm.updateProfile({ certificates: splitList(v) }), '＋ 자격증 입력 (쉼표로 구분)');
        decorateListField('[data-content="educations"]', () => p().educations || [], v => dm.updateProfile({ educations: splitList(v) }), '＋ 교육이수 입력 (쉼표로 구분)');
        bindInline('[data-content="residence"]', () => p().residence, v => dm.updateProfile({ residence: v }));
        bindInline('[data-content="motto"]', () => p().motto, v => dm.updateProfile({ motto: v }), { multiline: true, rows: 3 });

        const emp = $('[data-content="employment"]');
        if (emp) {
            emp.classList.add('ev3-editable'); emp.title = '클릭하여 수정';
            if (!emp.dataset.ev3Bound) {
                emp.dataset.ev3Bound = '1';
                emp.addEventListener('click', e => {
                    e.stopPropagation();
                    openFormModal('재직 / 희망연봉', [
                        { key: 'employmentStatus', label: '재직 상태', value: p().employmentStatus, placeholder: '재직중 / 구직중' },
                        { key: 'desiredSalary', label: '희망 연봉', value: p().desiredSalary, placeholder: '연봉 3,800' },
                        { key: 'showEmployment', label: '이 정보 화면에 표시', type: 'checkbox', value: p().showEmployment !== false }
                    ], v => dm.updateProfile(v));
                });
            }
        }
    }

    function decorateImages() {
        const imgWrap = $('[data-content="profile-image"]');
        if (imgWrap) {
            imgWrap.classList.add('ev3-editable', 'ev3-img'); imgWrap.title = '클릭하여 프로필 사진 변경';
            if (!imgWrap.dataset.ev3Bound) {
                imgWrap.dataset.ev3Bound = '1';
                imgWrap.addEventListener('click', async e => {
                    e.stopPropagation();
                    const url = await pickAndUpload('profile');
                    if (url) dm.updateProfile({ profileImage: url });
                });
            }
        }
    }

    function sectionTitle(key) { return (data().sectionTitles || {})[key]; }

    function decorateAiTools() {
        bindInline('[data-content="ai-tools-title-text"]', () => sectionTitle('aiTools') || '사용해본 AI',
            v => dm.updateSectionTitle('aiTools', v.trim()));
        const cont = $('[data-content="ai-tools"]');
        if (!cont) return;
        const tools = data().aiTools || [];
        Array.from(cont.children).forEach((el, i) => {
            const tool = tools[i]; if (!tool) return;
            // 이름/설명 글자를 클릭하면 그 자리에서 바로 수정 (모달 없이)
            const nameEl = el.querySelector('.ai-item-name');
            const descEl = el.querySelector('.ai-item-desc');
            if (nameEl) bindInline(nameEl, () => tool.name, v => dm.updateAITool(tool.id, { name: v.trim() }));
            if (descEl) bindInline(descEl, () => tool.description, v => dm.updateAITool(tool.id, { description: v.trim() }), { multiline: true, rows: 2, wide: true });
            addItemControls(el,
                () => openFormModal('AI 도구 수정', [
                    { key: 'name', label: '이름', value: tool.name },
                    { key: 'description', label: '설명', value: tool.description, type: 'textarea', mono: false }
                ], v => dm.updateAITool(tool.id, v)),
                () => confirmDel('이 AI 도구를 삭제할까요?', () => dm.deleteAITool(tool.id)));
        });
        addAddButton(cont, '+ AI 도구 추가', () => dm.addAITool({ name: '새 AI 도구', description: '설명을 입력하세요' }));
    }

    function decorateExperience(type) {
        const sel = type === 'related' ? '[data-content="related-experience"]' : '[data-content="other-experience"]';
        const block = $(sel); if (!block) return;
        if (type === 'related') bindInline('[data-content="related-exp-title"]', () => sectionTitle('relatedExperience') || '관련경력', v => dm.updateSectionTitle('relatedExperience', v.trim()));
        else bindInline('[data-content="other-exp-title"]', () => sectionTitle('otherExperience') || '타업무경력', v => dm.updateSectionTitle('otherExperience', v.trim()));
        const list = ((type === 'related' ? data().relatedExperience : data().otherExperience).items) || [];
        $$('.experience-item', block).forEach((el, i) => {
            const it = list[i]; if (!it) return;
            // 회사/기간/근무기간 글자를 클릭하면 그 자리에서 바로 수정 (모달 없이)
            const cEl = el.querySelector('.experience-item-company');
            const pEl = el.querySelector('.experience-item-period');
            const dEl = el.querySelector('.experience-item-duration');
            if (cEl) bindInline(cEl, () => it.company, v => dm.updateExperience(type, it.id, { company: v.trim() }));
            if (pEl) bindInline(pEl, () => it.period, v => dm.updateExperience(type, it.id, { period: v.trim() }));
            if (dEl) bindInline(dEl, () => it.duration, v => dm.updateExperience(type, it.id, { duration: v.trim() }));
            addItemControls(el,
                () => openFormModal((type === 'related' ? '관련경력' : '타업무경력') + ' 수정', [
                    { key: 'company', label: '회사 / 내용', value: it.company },
                    { key: 'period', label: '기간', value: it.period, placeholder: '2024.03 ~ 2025.02' },
                    { key: 'duration', label: '근무 기간', value: it.duration, placeholder: '1년 6개월', help: '"1년 6개월" 형식 → 총 경력 자동 계산' }
                ], v => dm.updateExperience(type, it.id, v)),
                () => confirmDel('이 경력을 삭제할까요?', () => dm.deleteExperience(type, it.id)));
        });
        const listEl = $('.experience-list', block) || block;
        addAddButton(listEl, '+ 경력 추가', () => dm.addExperience(type, { company: '새 경력', period: '', duration: '' }), 'append');
    }

    function decorateEvaluation() {
        bindInline('[data-content="evaluation-title"]', () => sectionTitle('evaluation') || '내가 생각하는 내평가', v => dm.updateSectionTitle('evaluation', v.trim()));
        bindInline('[data-content="radar-title"]', () => sectionTitle('radarChart') || '자신 있는 부분과 없는 부분 그래프', v => dm.updateSectionTitle('radarChart', v.trim()));
        const txt = $('[data-content="evaluation-text"]');
        if (txt) {
            // 내부 p가 아직 없으면 컨테이너에 바인딩하지 않는다(제목까지 지워지는 사고 방지).
            const p = $('.evaluation-text-content', txt);
            if (p) bindInline(p, () => data().evaluation.text, v => dm.updateEvaluation({ text: v }), { multiline: true, rows: 10, wide: true });
        }
        const chart = $('.evaluation-chart');
        if (chart) {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'ev3-fullbtn ev3-injected'; b.style.marginTop = '12px';
            b.textContent = '📊 그래프 값 수정';
            b.onclick = editRadar;
            chart.appendChild(b);
        }
    }
    function editRadar() {
        const le = makeListEditor(data().evaluation.radarChart || [],
            [{ key: 'label', label: '항목', flex: 2 }, { key: 'value', label: '점수(0-100)', type: 'number', min: 0, max: 100, flex: 1 }],
            () => ({ label: '새 항목', value: 50 }));
        showModal('자기평가 그래프 수정', le.node, () => { dm.updateRadarChart(le.get()); });
    }

    function decorateVideo() {
        const vc = $('[data-content="video"]'); if (!vc) return;
        if (getComputedStyle(vc).position === 'static') vc.style.position = 'relative';
        if (vc.querySelector('.ev3-float-edit')) return;
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'ev3-float-edit'; b.textContent = '🎬 영상 수정';
        b.onclick = () => openFormModal('자기소개 영상', [
            { key: 'type', label: '유형', type: 'select', value: data().video.type, options: [{ value: 'youtube', label: 'YouTube' }, { value: 'video', label: '직접 영상(mp4 URL)' }] },
            { key: 'url', label: 'URL', value: data().video.url, type: 'url', placeholder: 'https://youtu.be/...' }
        ], v => dm.setVideo(v.type, v.url));
        vc.appendChild(b);
    }

    // app.js의 PortfolioRenderer가 render 후 컨테이너 className을 portfolio-{mode}로
    // 바꾸기 때문에(.portfolio-container 클래스가 사라짐) 모든 케이스를 함께 선택한다.
    function getPortfolioContainer(id) {
        return document.querySelector(
            '#' + id + ' .portfolio-container, #' + id + ' .portfolio-grid, #' + id +
            ' .portfolio-masonry, #' + id + ' .portfolio-single, #' + id + ' .portfolio-slider'
        );
    }
    function decoratePortfolio() {
        (data().menuItems || []).filter(m => m.isPortfolio).forEach(menu => {
            const cont = getPortfolioContainer(menu.id);
            if (!cont) return;
            const items = (data().portfolioSolo.items || []).filter(i => i.section === menu.id);
            $$('.portfolio-item', cont).forEach((el, i) => {
                const it = items[i]; if (!it) return;
                addItemControls(el,
                    () => editPortfolioItem(it),
                    () => confirmDel('이 작품을 삭제할까요?', () => dm.deletePortfolioItem(it.id)));
            });
            addAddButton(cont, '+ 작품 추가', () => dm.addPortfolioItem(menu.id, {
                title: '새 작품', subject: '', target: '', contributions: [], review: '',
                thumbnails: [], links: [{ label: '상세보기', url: '#' }]
            }));
        });
    }
    function editPortfolioItem(it) {
        const body = document.createElement('div');
        const simple = (label, val, multiline) => {
            const w = document.createElement('div'); w.className = 'ev3-field';
            const l = document.createElement('label'); l.textContent = label; w.appendChild(l);
            const i = document.createElement(multiline ? 'textarea' : 'input');
            if (multiline) i.style.cssText = 'font-family:inherit;font-size:14px;min-height:70px';
            i.value = val != null ? val : ''; w.appendChild(i); body.appendChild(w); return i;
        };
        const tIn = simple('제목', it.title);
        const sIn = simple('주제', it.subject);
        const gIn = simple('타겟', it.target);
        const rIn = simple('리뷰 / 설명', it.review, true);

        secTitle(body, '기여도 그래프');
        const contribLE = makeListEditor(it.contributions || [],
            [{ key: 'label', label: '항목', flex: 2 }, { key: 'value', label: '%', type: 'number', min: 0, max: 100, flex: 1 }],
            () => ({ label: '디자인', value: 80 }));
        body.appendChild(contribLE.node);

        secTitle(body, '링크 버튼');
        const linkLE = makeListEditor(it.links || [],
            [{ key: 'label', label: '버튼명', flex: 1 }, { key: 'url', label: 'URL', flex: 2 }],
            () => ({ label: '바로가기', url: '#' }));
        body.appendChild(linkLE.node);

        secTitle(body, '썸네일 이미지');
        let thumbs = (it.thumbnails || []).slice();
        const thumbWrap = document.createElement('div');
        function drawThumbs() {
            thumbWrap.innerHTML = '';
            thumbs.forEach((url, idx) => {
                const r = document.createElement('div'); r.className = 'ev3-row'; r.style.marginBottom = '6px';
                const img = document.createElement('img'); img.src = url; img.style.cssText = 'width:48px;height:48px;object-fit:cover;border-radius:6px;flex:none';
                const span = document.createElement('span'); span.style.cssText = 'flex:1;font-size:12px;word-break:break-all;color:var(--color-text-secondary,#888)'; span.textContent = String(url).slice(0, 46) + '…';
                const del = document.createElement('button'); del.type = 'button'; del.className = 'ev3-mini ev3-mini-del'; del.textContent = '✕'; del.style.flex = 'none';
                del.onclick = () => { thumbs.splice(idx, 1); drawThumbs(); };
                r.appendChild(img); r.appendChild(span); r.appendChild(del); thumbWrap.appendChild(r);
            });
            const add = document.createElement('button'); add.type = 'button'; add.className = 'ev3-mini'; add.textContent = '+ 이미지 업로드';
            add.onclick = async () => { const url = await pickAndUpload('portfolio'); if (url) { thumbs.push(url); drawThumbs(); } };
            thumbWrap.appendChild(add);
        }
        drawThumbs(); body.appendChild(thumbWrap);

        showModal('작품 편집', body, () => {
            dm.updatePortfolioItem(it.id, {
                title: tIn.value, subject: sIn.value, target: gIn.value, review: rIn.value,
                contributions: contribLE.get(), links: linkLE.get(), thumbnails: thumbs
            });
        });
    }

    function decorateContact() {
        bindInline('[data-content="contact-name"]', () => data().contact.name, v => dm.updateContact({ name: v }));
        bindInline('[data-content="contact-phone"]', () => data().contact.phone, v => dm.updateContact({ phone: v }));
        bindInline('[data-content="contact-email"]', () => data().contact.email, v => dm.updateContact({ email: v }));
        bindInline('[data-content="contact-message"]', () => data().contact.message, v => dm.updateContact({ message: v }), { multiline: true, rows: 3 });
        ['name', 'phone', 'email'].forEach(k => {
            const el = document.querySelector('[data-emoji="contact-' + k + '"]');
            if (!el) return;
            el.classList.add('ev3-editable'); el.title = '클릭하여 아이콘 변경';
            if (el.dataset.ev3Bound) return;
            el.dataset.ev3Bound = '1';
            el.addEventListener('click', e => { e.stopPropagation(); editContactIcon(k); });
        });
    }
    function editContactIcon(k) {
        const cur = (data().emojiIcons && data().emojiIcons.contact) ? data().emojiIcons.contact[k] : '';
        const curEmoji = typeof cur === 'string' ? cur : (cur && cur.emoji) || '';
        const body = document.createElement('div');
        const w = document.createElement('div'); w.className = 'ev3-field';
        w.innerHTML = '<label>이모지</label>';
        const inp = document.createElement('input'); inp.type = 'text'; inp.value = curEmoji; inp.placeholder = '👤';
        w.appendChild(inp); body.appendChild(w);
        const help = document.createElement('div'); help.className = 'ev3-help'; help.textContent = '또는 이미지를 업로드하면 이미지 아이콘으로 표시됩니다.'; body.appendChild(help);
        let uploadedUrl = null;
        const up = document.createElement('button'); up.type = 'button'; up.className = 'ev3-fullbtn secondary'; up.textContent = '🖼 이미지 업로드';
        up.onclick = async () => { const url = await pickAndUpload('icons'); if (url) { uploadedUrl = url; up.textContent = '✓ 이미지 선택됨 (저장 시 적용)'; } };
        body.appendChild(up);
        showModal('연락처 아이콘', body, () => {
            if (uploadedUrl) dm.set('emojiIcons.contact.' + k, { type: 'image', imageUrl: uploadedUrl, emoji: inp.value });
            else dm.set('emojiIcons.contact.' + k, inp.value);
        });
    }

    function decorateInterviews() {
        const cal = $('.calendar-container'); if (!cal) return;
        const row = document.createElement('div'); row.className = 'ev3-injected'; row.style.marginTop = '12px';
        const b = document.createElement('button'); b.type = 'button'; b.className = 'ev3-fullbtn'; b.textContent = '📅 면접 일정 관리';
        b.onclick = editInterviews; row.appendChild(b);
        cal.after(row);
    }
    function editInterviews() {
        const le = makeListEditor(data().interviews || [],
            [{ key: 'date', label: '날짜', flex: 1 }, { key: 'company', label: '회사', flex: 1 }, { key: 'time', label: '시간', flex: 1 }, { key: 'location', label: '장소', flex: 1 }],
            () => ({ date: '2026-01-01', company: '회사명', time: '14:00', location: '' }));
        const help = document.createElement('div'); help.className = 'ev3-help'; help.textContent = '날짜는 YYYY-MM-DD 형식 (예: 2026-01-15)';
        const wrap = document.createElement('div'); wrap.appendChild(help); wrap.appendChild(le.node);
        showModal('면접 일정 관리', wrap, () => {
            const arr = le.get().map((x, i) => Object.assign({ id: i + 1 }, x));
            dm.set('interviews', arr);
        });
    }

    // =====================================================
    //  좌측 섹션맵 — [전체 미리보기(iframe)] + [섹션 제목/추가/삭제/드래그]
    // =====================================================
    let __dockReloadTimer = null;
    function dockAvailHeight() { return Math.max(220, window.innerHeight - 150); }
    function getDockMode() { return localStorage.getItem('ev3DockMode') || 'full'; }   // full | titles | hidden
    function setDockMode(m) {
        localStorage.setItem('ev3DockMode', m);
        const d = $('#ev3-dock'); if (!d) return;
        d.dataset.mode = m;
        d.querySelectorAll('.ev3-dock-modes button').forEach(b => b.classList.toggle('active', b.dataset.m === m));
        if (m === 'full') { scaleDockFrame(d); reloadDockFrame(d); }
    }

    function buildDock() {
        let dock = $('#ev3-dock');
        let first = false;
        if (!dock) {
            first = true;
            dock = document.createElement('aside'); dock.id = 'ev3-dock'; dock.className = 'ev3-dock';
            dock.dataset.mode = getDockMode();
            dock.innerHTML =
                '<button class="ev3-dock-reopen" type="button" title="섹션맵 열기">🗺<span>섹션맵</span></button>' +
                '<div class="ev3-dock-main">' +
                '  <div class="ev3-dock-head">' +
                '    <span class="ttl">🗺 섹션맵</span>' +
                '    <div class="ev3-dock-modes">' +
                '      <button data-m="full" type="button" title="미리보기 + 제목">🖼</button>' +
                '      <button data-m="titles" type="button" title="제목만">≡</button>' +
                '      <button data-m="hidden" type="button" title="접기">✕</button>' +
                '    </div>' +
                '  </div>' +
                '  <div class="ev3-dock-body">' +
                '    <div class="ev3-dock-preview"><iframe class="ev3-dock-frame" title="전체 미리보기"></iframe></div>' +
                '    <div class="ev3-dock-cards"></div>' +
                '  </div>' +
                '  <button class="ev3-dock-add" type="button">＋ 섹션 추가</button>' +
                '</div>';
            document.body.appendChild(dock);
            const frame = dock.querySelector('.ev3-dock-frame');
            frame.addEventListener('load', () => {
                prepIframe(frame);
                scaleDockFrame(dock);
                // 포트폴리오 항목은 비동기로 렌더되므로, 내용이 커질 때마다 다시 맞춤
                try {
                    const doc = frame.contentDocument;
                    if (doc && doc.body && window.ResizeObserver) {
                        if (dock._ro) dock._ro.disconnect();
                        dock._ro = new ResizeObserver(() => { clearTimeout(dock._roT); dock._roT = setTimeout(() => scaleDockFrame(dock), 120); });
                        dock._ro.observe(doc.body);
                    }
                } catch (e) { }
                [500, 1200, 2500].forEach(t => setTimeout(() => scaleDockFrame(dock), t));
            });
            frame.src = 'portfolio.html';
            dock.querySelector('.ev3-dock-reopen').onclick = () => setDockMode('titles');
            dock.querySelectorAll('.ev3-dock-modes button').forEach(btn => btn.onclick = () => setDockMode(btn.dataset.m));
            dock.querySelector('.ev3-dock-add').onclick = addSectionModal;
            dock.querySelectorAll('.ev3-dock-modes button').forEach(b => b.classList.toggle('active', b.dataset.m === dock.dataset.mode));
        }
        if (dock.dataset.mode === 'full') {
            scaleDockFrame(dock);                // 내부에서 renderDockCards 호출
            if (!first) scheduleFrameReload();   // 내용이 바뀌면 미리보기도 갱신(디바운스)
        } else {
            renderDockCards(dock);
        }
    }

    // iframe(미리보기) 안에서 .section의 min-height:100vh 를 제거 — 높이 측정이 누적 폭증하는 문제 방지
    function prepIframe(frame) {
        try {
            const doc = frame.contentDocument; if (!doc || !doc.head) return;
            if (!doc.getElementById('ev3-mini-style')) {
                const st = doc.createElement('style'); st.id = 'ev3-mini-style';
                st.textContent = '.section{min-height:0 !important} .intro-page{height:auto !important} body.loading .main,body.loading .header,body.loading .section-nav{opacity:1 !important;visibility:visible !important}';
                doc.head.appendChild(st);
            }
        } catch (e) { }
    }

    function renderDockCards(dock) {
        const cards = dock.querySelector('.ev3-dock-cards');
        const main = $('.main');
        if (!cards || !main) return;
        const order = data().sectionOrder || [];
        const labelMap = {};
        (data().menuItems || []).forEach(m => { labelMap[m.id] = m; });
        const secs = Array.from(main.querySelectorAll(':scope > section[id]'));
        secs.sort((a, b) => { const ia = order.indexOf(a.id), ib = order.indexOf(b.id); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); });
        const total = secs.reduce((s, el) => s + (el.offsetHeight || 200), 0) || 1;
        const availH = dockAvailHeight();
        const secHeights = dock._secHeights;   // iframe 섹션 높이(스케일 적용) — 있으면 미리보기와 정렬

        cards.innerHTML = '';
        secs.forEach(sec => {
            const m = labelMap[sec.id] || { label: sec.id };
            const card = document.createElement('div');
            card.className = 'ev3-dock-card'; card.draggable = true; card.dataset.id = sec.id;
            const aligned = secHeights && secHeights[sec.id];
            card.style.height = Math.max(18, aligned || (sec.offsetHeight || 200) / total * availH) + 'px';
            const lab = document.createElement('span'); lab.className = 'ev3-dock-label'; lab.textContent = m.label || sec.id;
            card.appendChild(lab);
            if (sec.id !== 'about' && sec.id !== 'contact') {
                const x = document.createElement('button'); x.type = 'button'; x.className = 'ev3-dock-x'; x.textContent = '×'; x.title = '삭제';
                x.onclick = e => { e.stopPropagation(); confirmDel('"' + (m.label || sec.id) + '" 섹션을 삭제할까요? (작품도 함께 삭제됩니다)', () => dm.deleteMenuItem(sec.id)); };
                card.appendChild(x);
            }
            card.addEventListener('click', () => { const hh = (document.querySelector('.header') && document.querySelector('.header').offsetHeight) || 70; window.scrollTo({ top: sec.offsetTop - hh - 56, behavior: 'smooth' }); });
            card.addEventListener('dragstart', e => { card.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', sec.id); } catch (z) { } });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
            cards.appendChild(card);
        });
        // 리스너는 1회만 (on* 으로 덮어쓰기 → 중복 방지)
        cards.ondragover = e => { e.preventDefault(); const dragging = cards.querySelector('.dragging'); if (!dragging) return; const after = getDragAfter(cards, e.clientY); if (after == null) cards.appendChild(dragging); else cards.insertBefore(dragging, after); };
        cards.ondrop = e => { e.preventDefault(); const ids = Array.from(cards.querySelectorAll('.ev3-dock-card')).map(c => c.dataset.id); const rest = (data().sectionOrder || []).filter(x => ids.indexOf(x) < 0); dm.reorderSections(ids.concat(rest)); };
    }

    function scaleDockFrame(dock) {
        if (dock.dataset.mode !== 'full') return;
        const frame = dock.querySelector('.ev3-dock-frame');
        const prev = dock.querySelector('.ev3-dock-preview');
        if (!frame || !prev) return;
        const baseW = 1200;
        prepIframe(frame);                       // 측정 전에 min-height:100vh 제거
        // 고정 폭(1200)에서 자연 콘텐츠 높이 측정 — 폭을 기준으로 축소하므로 길이가 길어도 얇아지지 않음
        frame.style.width = baseW + 'px';
        frame.style.height = 'auto';
        let fullH = 1200;
        try {
            const doc = frame.contentDocument;
            if (doc && doc.body) fullH = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 600) || 1200;
        } catch (e) { }
        const targetW = 188;                     // 미리보기 폭 고정(얇아짐 방지) → 넘치면 세로 스크롤
        const scale = targetW / baseW;
        frame.style.height = fullH + 'px';
        frame.style.transform = 'scale(' + scale + ')';
        prev.style.width = targetW + 'px';
        prev.style.height = Math.round(fullH * scale) + 'px';

        // 우측 제목 카드 높이를 iframe 섹션과 정렬
        try {
            const doc = frame.contentDocument;
            const fmain = doc && doc.querySelector('.main');
            if (fmain) {
                const mapH = {};
                fmain.querySelectorAll(':scope > section[id]').forEach(s => { mapH[s.id] = s.offsetHeight * scale; });
                dock._secHeights = mapH;
            }
        } catch (e) { dock._secHeights = null; }
        renderDockCards(dock);
    }

    function reloadDockFrame(dock) {
        const f = dock.querySelector('.ev3-dock-frame');
        if (!f) return;
        try { f.contentWindow.location.reload(); } catch (e) { f.src = f.src; }
    }
    function scheduleFrameReload() {
        const d = $('#ev3-dock');
        if (!d || d.dataset.mode !== 'full') return;
        clearTimeout(__dockReloadTimer);
        __dockReloadTimer = setTimeout(() => { const dd = $('#ev3-dock'); if (dd && dd.dataset.mode === 'full') reloadDockFrame(dd); }, 1500);
    }

    function getDragAfter(container, y) {
        const els = Array.from(container.querySelectorAll('.ev3-dock-card:not(.dragging)'));
        let closest = { offset: -Infinity, element: null };
        els.forEach(child => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) closest = { offset, element: child };
        });
        return closest.element;
    }

    // =====================================================
    //  설정 서랍 (admin 전역 기능 전체)
    // =====================================================
    const drawer = $('#ev3-drawer');
    const drawerBody = $('#ev3-drawer-body');
    const drawerBackdrop = $('#ev3-drawer-backdrop');
    let activeTab = 'sections';

    function openDrawer(tab) { activeTab = tab || activeTab; setActiveTabBtn(); renderTab(); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); drawerBackdrop.classList.add('open'); }
    function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); drawerBackdrop.classList.remove('open'); }
    function setActiveTabBtn() { $$('.ev3-tab', drawer).forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab)); }
    function rerenderDrawer() { renderTab(); }

    // 서랍용 작은 빌더들
    function frag() { return document.createElement('div'); }
    function secTitle(parent, text) { const d = document.createElement('div'); d.className = 'ev3-sec-title'; d.textContent = text; parent.appendChild(d); return d; }
    function helpLine(parent, text) { const d = document.createElement('div'); d.className = 'ev3-help'; d.textContent = text; parent.appendChild(d); }
    function checkRow(parent, label, checked, onChange) {
        const l = document.createElement('label'); l.className = 'ev3-check';
        const i = document.createElement('input'); i.type = 'checkbox'; i.checked = !!checked;
        i.onchange = () => onChange(i.checked);
        l.appendChild(i); l.appendChild(document.createTextNode(' ' + label)); parent.appendChild(l);
    }
    function selectRow(parent, label, options, value, onChange) {
        const w = document.createElement('div'); w.className = 'ev3-field';
        const l = document.createElement('label'); l.textContent = label; w.appendChild(l);
        const s = document.createElement('select');
        options.forEach(o => { const op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; if (o[0] === value) op.selected = true; s.appendChild(op); });
        s.onchange = () => onChange(s.value);
        w.appendChild(s); parent.appendChild(w); return s;
    }
    function textRow(parent, label, value, onChange, opts) {
        opts = opts || {};
        const w = document.createElement('div'); w.className = 'ev3-field';
        const l = document.createElement('label'); l.textContent = label; w.appendChild(l);
        const i = document.createElement(opts.textarea ? 'textarea' : 'input');
        if (!opts.textarea) i.type = opts.type || 'text';
        i.value = value != null ? value : '';
        if (opts.placeholder) i.placeholder = opts.placeholder;
        i.onchange = () => onChange(i.value);
        w.appendChild(i); parent.appendChild(w); return i;
    }
    function colorRow(parent, label, value, onChange) {
        const r = document.createElement('div'); r.className = 'ev3-color-row';
        const l = document.createElement('label'); l.textContent = label;
        const c = document.createElement('input'); c.type = 'color'; c.value = toHex(value);
        const t = document.createElement('input'); t.type = 'text'; t.value = value || ''; t.style.flex = 'none'; t.style.width = '90px';
        c.oninput = () => { t.value = c.value; };
        c.onchange = () => onChange(c.value);
        t.onchange = () => { c.value = toHex(t.value); onChange(t.value); };
        r.appendChild(l); r.appendChild(c); r.appendChild(t); parent.appendChild(r);
    }
    function toHex(v) { v = String(v || '').trim(); return /^#([0-9a-f]{6})$/i.test(v) ? v : (/^#([0-9a-f]{3})$/i.test(v) ? v : '#000000'); }
    function fullBtn(parent, label, cls, onClick) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'ev3-fullbtn' + (cls ? ' ' + cls : '');
        b.style.marginTop = '8px'; b.textContent = label; b.onclick = onClick; parent.appendChild(b); return b;
    }

    function renderTab() {
        drawerBody.innerHTML = '';
        const b = ({
            sections: tabSections, menu: tabMenu, theme: tabTheme, font: tabFont,
            background: tabBackground, logo: tabLogo, icons: tabIcons, data: tabData
        }[activeTab] || tabSections)();
        drawerBody.appendChild(b);
    }

    function tabSections() {
        const b = frag();
        secTitle(b, '페이지 표시');
        // 인트로 페이지는 v3에서 사용하지 않음 → 항목 제거하고 데이터도 off로 정리
        if ((data().pageSettings || {}).intro !== false) dm.set('pageSettings.intro', false);
        [['ai', 'AI활용제작 페이지'], ['team', '팀플제작 페이지']].forEach(([k, label]) => {
            checkRow(b, label, (data().pageSettings || {})[k] !== false, v => dm.set('pageSettings.' + k, v));
        });
        secTitle(b, '섹션 표시');
        [['about', '자기소개 전체'], ['aboutPhoto', '프로필 사진'], ['aitools', '사용해본 AI'], ['related', '관련경력'],
        ['other', '타업무경력'], ['evaluation', '자기평가/그래프'], ['video', '자기소개 영상'], ['portfolio', '포트폴리오'], ['contact', '연락처']]
            .forEach(([k, label]) => checkRow(b, label, (data().sectionSettings || {})[k] !== false, v => dm.set('sectionSettings.' + k, v)));
        secTitle(b, '포트폴리오 섹션 표시 모드');
        (data().menuItems || []).filter(m => m.isPortfolio).forEach(m => {
            selectRow(b, m.label, [['grid', '그리드'], ['single', '한 줄(크게)'], ['masonry', '벽돌형'], ['slider', '슬라이더']],
                (data().sectionDisplayModes || {})[m.id] || 'grid', v => dm.setSectionDisplayMode(m.id, v));
        });
        return b;
    }

    function miniBtn(label, onClick, extraClass) {
        const x = document.createElement('button'); x.type = 'button';
        x.className = 'ev3-mini' + (extraClass ? ' ' + extraClass : '');
        x.textContent = label; x.style.flex = 'none'; x.onclick = onClick; return x;
    }
    const SECTION_STYLES = [['grid', '그리드 (격자)'], ['single', '한 줄 (크게)'], ['masonry', '벽돌형'], ['slider', '슬라이더']];

    function tabMenu() {
        const b = frag();
        secTitle(b, '섹션 관리');
        helpLine(b, '섹션 이름·표시 스타일·숨김·순서·삭제를 관리합니다.');
        const order = data().sectionOrder || [];
        const menus = [...(data().menuItems || [])].sort((a, c) => order.indexOf(a.id) - order.indexOf(c.id));
        menus.forEach(m => {
            const card = document.createElement('div'); card.className = 'ev3-list-card';

            // 1줄: 이름 + 순서이동
            const row1 = document.createElement('div'); row1.className = 'ev3-row';
            const nameI = document.createElement('input'); nameI.type = 'text'; nameI.value = m.label;
            nameI.onchange = () => dm.updateMenuItem(m.id, { label: nameI.value });
            row1.appendChild(nameI);
            row1.appendChild(miniBtn('↑', () => moveMenu(m.id, -1)));
            row1.appendChild(miniBtn('↓', () => moveMenu(m.id, 1)));
            card.appendChild(row1);

            // 2줄: 표시 스타일 (포트폴리오 섹션만)
            if (m.isPortfolio) {
                const styleSel = document.createElement('select');
                styleSel.style.marginTop = '6px';
                const cur = (data().sectionDisplayModes || {})[m.id] || 'grid';
                SECTION_STYLES.forEach(o => { const op = document.createElement('option'); op.value = o[0]; op.textContent = '스타일: ' + o[1]; if (o[0] === cur) op.selected = true; styleSel.appendChild(op); });
                styleSel.onchange = () => dm.setSectionDisplayMode(m.id, styleSel.value);
                card.appendChild(styleSel);
            }

            // 3줄: 표시 토글 + 삭제
            const row3 = document.createElement('div');
            row3.style.cssText = 'margin-top:8px;display:flex;justify-content:space-between;align-items:center;';
            const vis = document.createElement('label'); vis.className = 'ev3-check'; vis.style.padding = '0';
            const vi = document.createElement('input'); vi.type = 'checkbox'; vi.checked = m.visible !== false;
            vi.onchange = () => dm.updateMenuItem(m.id, { visible: vi.checked });
            vis.appendChild(vi); vis.appendChild(document.createTextNode(' 이 섹션 표시'));
            row3.appendChild(vis);
            if (m.id !== 'about' && m.id !== 'contact') {
                row3.appendChild(miniBtn('삭제', () => confirmDel('"' + m.label + '" 섹션을 삭제할까요? (해당 작품들도 함께 삭제됩니다)', () => { dm.deleteMenuItem(m.id); rerenderDrawer(); }), 'ev3-mini-del'));
            }
            card.appendChild(row3);
            b.appendChild(card);
        });
        fullBtn(b, '＋ 새 섹션 추가', '', addSectionModal);
        return b;
    }

    // 스타일별 간단 와이어프레임
    function styleWireframe(mode) {
        if (mode === 'grid') return '<i></i><i></i><i></i><i></i><i></i><i></i>';
        if (mode === 'single') return '<i></i><i></i><i></i>';
        if (mode === 'masonry') return '<i></i><i></i><i></i><i></i><i></i><i></i>';
        if (mode === 'slider') return '<b>‹</b><i></i><i></i><i></i><b>›</b>';
        return '';
    }
    function addSectionModal() {
        const STYLES = [
            { mode: 'grid', label: '그리드', desc: '격자로 여러 개' },
            { mode: 'single', label: '한 줄', desc: '크게 한 개씩' },
            { mode: 'masonry', label: '벽돌형', desc: '높이 자동' },
            { mode: 'slider', label: '슬라이더', desc: '좌우로 넘김' }
        ];
        const body = document.createElement('div');
        const nf = document.createElement('div'); nf.className = 'ev3-field';
        nf.innerHTML = '<label>섹션 이름</label>';
        const nameInput = document.createElement('input'); nameInput.type = 'text'; nameInput.placeholder = '예: 웹디자인';
        nf.appendChild(nameInput); body.appendChild(nf);

        const sl = document.createElement('label');
        sl.style.cssText = 'display:block;font-size:13px;font-weight:600;margin-bottom:8px;';
        sl.textContent = '표시 스타일';
        body.appendChild(sl);

        const grid = document.createElement('div'); grid.className = 'ev3-style-grid-wrap';
        let selected = 'grid';
        STYLES.forEach(s => {
            const opt = document.createElement('button');
            opt.type = 'button';
            opt.className = 'ev3-style-opt' + (s.mode === 'grid' ? ' active' : '');
            opt.dataset.mode = s.mode;
            opt.innerHTML = '<div class="ev3-wf ev3-wf-' + s.mode + '">' + styleWireframe(s.mode) + '</div>' +
                '<span class="ev3-style-name">' + s.label + '</span>' +
                '<span class="ev3-style-desc">' + s.desc + '</span>';
            opt.onclick = () => { selected = s.mode; grid.querySelectorAll('.ev3-style-opt').forEach(o => o.classList.toggle('active', o === opt)); };
            grid.appendChild(opt);
        });
        body.appendChild(grid);

        showModal('새 섹션 추가', body, () => {
            if (!nameInput.value.trim()) { alert('섹션 이름을 입력하세요'); return false; }
            const id = 'sec-' + Date.now();
            dm.addMenuItem({ id: id, label: nameInput.value.trim(), isPortfolio: true });
            dm.setSectionDisplayMode(id, selected);
            // 새 섹션을 연락처 바로 앞에 배치
            const ord = (data().sectionOrder || []).filter(x => x !== id);
            const ci = ord.indexOf('contact');
            if (ci >= 0) ord.splice(ci, 0, id); else ord.push(id);
            dm.reorderSections(ord);
            rerenderDrawer();
        });
    }
    function moveMenu(id, dir) {
        const order = [...(data().sectionOrder || data().menuItems.map(m => m.id))];
        const i = order.indexOf(id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= order.length) return;
        order.splice(j, 0, order.splice(i, 1)[0]);
        dm.reorderSections(order);
        rerenderDrawer();
    }

    function tabTheme() {
        const b = frag();
        const modes = data().theme.modes || [];
        secTitle(b, '테마 선택');
        selectRow(b, '현재 테마', modes.map(m => [m.id, m.name]), data().theme.current, v => { dm.setTheme(v); rerenderDrawer(); });
        const mode = modes.find(m => m.id === data().theme.current) || modes[0];
        if (mode) {
            secTitle(b, '"' + mode.name + '" 색상 편집');
            [['primary', '주색'], ['secondary', '보조색'], ['accent', '강조색'], ['background', '배경'],
            ['backgroundSecondary', '배경2'], ['backgroundTertiary', '배경3'], ['text', '글자'], ['textSecondary', '글자2'],
            ['textMuted', '흐린 글자'], ['border', '테두리'], ['buttonBg', '버튼 배경'], ['buttonText', '버튼 글자']]
                .forEach(([k, label]) => colorRow(b, label, (mode.colors || {})[k], val => {
                    const colors = Object.assign({}, mode.colors); colors[k] = val;
                    dm.updateThemeMode(mode.id, { colors });
                }));
            fullBtn(b, '+ 새 테마 추가', '', () => { const name = prompt('테마 이름', '새 테마'); if (name) { dm.addThemeMode({ name }); rerenderDrawer(); } });
            if (mode.id !== 'light' && mode.id !== 'dark') {
                fullBtn(b, '이 테마 삭제', 'danger', () => confirmDel('"' + mode.name + '" 테마를 삭제할까요?', () => { dm.deleteThemeMode(mode.id); rerenderDrawer(); }));
            }
        }
        return b;
    }

    function tabFont() {
        const b = frag();
        const font = (data().siteSettings && data().siteSettings.font) || {};
        const upd = (patch) => dm.updateSiteSettings({ font: patch });
        secTitle(b, '폰트 패밀리');
        textRow(b, '제목 폰트명', font.title, v => upd({ title: v }), { placeholder: 'Paperozi' });
        textRow(b, '본문 폰트명', font.content, v => upd({ content: v }), { placeholder: 'Paperozi' });
        secTitle(b, '@font-face 코드');
        const findRow = document.createElement('div');
        findRow.style.cssText = 'display:flex;justify-content:flex-end;margin:-4px 0 6px;';
        const findBtn = document.createElement('button');
        findBtn.type = 'button';
        findBtn.textContent = '🔎 폰트찾기';
        findBtn.title = '눈누(noonnu.cc)에서 무료 웹폰트 찾기';
        findBtn.style.cssText = 'background:var(--ev3-accent);color:#fff;border:none;border-radius:6px;padding:5px 11px;font-size:12px;font-weight:600;cursor:pointer;';
        findBtn.onclick = () => window.open('https://noonnu.cc/index', '_blank', 'noopener');
        findRow.appendChild(findBtn);
        b.appendChild(findRow);
        helpLine(b, '눈누에서 폰트의 "웹폰트로 사용" @font-face 코드를 복사해 붙여넣으면 적용됩니다.');
        textRow(b, '@font-face', font.fontFaceAll || font.fontFaceTitle || '', v => upd({ fontFaceAll: v }), { textarea: true });
        secTitle(b, '폰트 크기 (CSS 단위)');
        const sizes = font.fontSizes || {};
        [['5xl', '대제목'], ['4xl', '제목'], ['3xl', '중제목'], ['2xl', '소제목'], ['base', '본문'], ['sm', '작은글씨']].forEach(([k, label]) => {
            textRow(b, label + ' (' + k + ')', sizes[k] || '', v => { const fs = Object.assign({}, sizes); fs[k] = v; upd({ fontSizes: fs }); }, { placeholder: '예: 3rem' });
        });
        secTitle(b, '레벨별 글자 색상');
        const fc = font.fontColors || {};
        [['5xl', '대제목'], ['4xl', '제목'], ['3xl', '중제목'], ['2xl', '소제목'], ['base', '본문'], ['sm', '작은글씨']].forEach(([k, label]) => {
            colorRow(b, label + ' (' + k + ')', fc[k] || '', v => { const c = Object.assign({}, fc); c[k] = v; upd({ fontColors: c }); });
        });
        return b;
    }

    function tabBackground() {
        const b = frag();
        const bg = data().backgroundSettings || {};
        secTitle(b, '전체 배경 이미지');
        const body = bg.body || {};
        const bodyPreview = document.createElement('div'); bodyPreview.className = 'ev3-help'; bodyPreview.textContent = body.image ? ('현재: ' + String(body.image).slice(0, 40) + '…') : '없음'; b.appendChild(bodyPreview);
        fullBtn(b, '🖼 배경 이미지 업로드', 'secondary', async () => { const url = await pickAndUpload('backgrounds'); if (url) { dm.set('backgroundSettings.body.image', url); rerenderDrawer(); } });
        if (body.image) fullBtn(b, '배경 이미지 제거', 'danger', () => { dm.set('backgroundSettings.body.image', ''); rerenderDrawer(); });
        selectRow(b, '크기', [['cover', 'cover'], ['contain', 'contain'], ['auto', 'auto']], body.size || 'cover', v => dm.set('backgroundSettings.body.size', v));
        selectRow(b, '반복', [['no-repeat', '반복 없음'], ['repeat', '반복'], ['repeat-x', '가로반복'], ['repeat-y', '세로반복']], body.repeat || 'no-repeat', v => dm.set('backgroundSettings.body.repeat', v));
        selectRow(b, '고정', [['scroll', '스크롤'], ['fixed', '고정']], body.attachment || 'scroll', v => dm.set('backgroundSettings.body.attachment', v));
        textRow(b, '투명도(0~1)', body.opacity != null ? body.opacity : 1, v => dm.set('backgroundSettings.body.opacity', Number(v) || 0), { type: 'number' });

        [['about', '자기소개'], ['portfolio', '포트폴리오'], ['contact', '연락처']].forEach(([k, label]) => {
            secTitle(b, label + ' 섹션 배경');
            const sec = bg[k] || {};
            const prev = document.createElement('div'); prev.className = 'ev3-help'; prev.textContent = sec.image ? ('이미지: ' + String(sec.image).slice(0, 36) + '…') : (sec.color ? ('색상: ' + sec.color) : '없음'); b.appendChild(prev);
            fullBtn(b, '🖼 이미지 업로드', 'secondary', async () => { const url = await pickAndUpload('backgrounds'); if (url) { dm.set('backgroundSettings.' + k + '.image', url); dm.set('backgroundSettings.' + k + '.color', ''); rerenderDrawer(); } });
            colorRow(b, '배경색', sec.color || '', v => { dm.set('backgroundSettings.' + k + '.color', v); dm.set('backgroundSettings.' + k + '.image', ''); });
            if (sec.image || sec.color) fullBtn(b, '배경 제거', 'danger', () => { dm.set('backgroundSettings.' + k + '.image', ''); dm.set('backgroundSettings.' + k + '.color', ''); rerenderDrawer(); });
        });
        return b;
    }

    function tabLogo() {
        const b = frag();
        const logo = (data().siteSettings && data().siteSettings.logo) || {};
        secTitle(b, '로고');
        selectRow(b, '로고 유형', [['text', '텍스트'], ['image', '이미지']], logo.type || 'text', v => { dm.updateSiteSettings({ logo: { type: v } }); rerenderDrawer(); });
        if ((logo.type || 'text') === 'text') {
            textRow(b, '로고 텍스트', logo.text || '', v => dm.updateSiteSettings({ logo: { text: v } }), { placeholder: 'Portfolio' });
        } else {
            const prev = document.createElement('div'); prev.className = 'ev3-help'; prev.textContent = logo.imageUrl ? ('현재: ' + String(logo.imageUrl).slice(0, 40) + '…') : '이미지 없음'; b.appendChild(prev);
            fullBtn(b, '🖼 로고 이미지 업로드', 'secondary', async () => { const url = await pickAndUpload('logo'); if (url) { dm.updateSiteSettings({ logo: { imageUrl: url } }); rerenderDrawer(); } });
        }
        return b;
    }

    function tabIcons() {
        const b = frag();
        secTitle(b, '인트로 아이콘 (이모지)');
        const intro = (data().emojiIcons && data().emojiIcons.intro) || {};
        [['solo', '솔로'], ['ai', 'AI활용'], ['team', '팀플']].forEach(([k, label]) => {
            const cur = intro[k]; const v = typeof cur === 'string' ? cur : (cur && cur.emoji) || '';
            textRow(b, label, v, val => dm.set('emojiIcons.intro.' + k, val), { placeholder: '👤' });
        });
        secTitle(b, '연락처 아이콘 (이모지)');
        const contact = (data().emojiIcons && data().emojiIcons.contact) || {};
        [['name', '이름'], ['phone', '전화'], ['email', '이메일']].forEach(([k, label]) => {
            const cur = contact[k]; const v = typeof cur === 'string' ? cur : (cur && cur.emoji) || '';
            textRow(b, label, v, val => dm.set('emojiIcons.contact.' + k, val), { placeholder: '👤' });
        });
        helpLine(b, '연락처 아이콘은 화면에서 직접 클릭해 이미지로도 변경할 수 있습니다.');
        return b;
    }

    function tabData() {
        const b = frag();
        secTitle(b, '데이터 백업 / 복원');
        fullBtn(b, '⬇ JSON 내보내기', 'secondary', () => dm.exportData());
        helpLine(b, '아래에 JSON을 붙여넣고 가져오기를 누르면 전체 데이터가 교체됩니다.');
        const ta = document.createElement('textarea'); ta.className = ''; ta.style.cssText = 'width:100%;min-height:90px;font-family:monospace;font-size:12px;border:1px solid var(--color-border,#dee2e6);border-radius:6px;padding:8px'; b.appendChild(ta);
        fullBtn(b, '⬆ JSON 가져오기', '', () => { if (!ta.value.trim()) return; if (dm.importData(ta.value)) { alert('가져오기 완료'); rerenderDrawer(); } else alert('JSON 형식 오류'); });
        secTitle(b, '기타');
        const adminLink = document.createElement('a'); adminLink.href = 'admin.html'; adminLink.className = 'ev3-fullbtn secondary'; adminLink.style.cssText = 'display:block;text-align:center;text-decoration:none;margin-top:8px'; adminLink.textContent = '기존 관리자 페이지(admin) 열기'; b.appendChild(adminLink);
        fullBtn(b, '⚠ 전체 초기화 (기본값으로)', 'danger', () => confirmDel('정말 모든 데이터를 기본값으로 초기화할까요? 되돌릴 수 없습니다.', () => { dm.reset(); location.reload(); }));
        return b;
    }

    // =====================================================
    //  초기화 / 이벤트 와이어링
    // =====================================================
    function init() {
        // 툴바
        $('#ev3-settings-btn').onclick = () => openDrawer();
        $('#ev3-drawer-close').onclick = closeDrawer;
        drawerBackdrop.onclick = closeDrawer;
        $('#ev3-logout-btn').onclick = async () => {
            if (window.AuthManager) { try { await window.AuthManager.signOut(); } catch (e) { } }
            location.href = 'login.html';
        };
        // 미리보기: 로그인한 오너 컨텍스트(?u= 없이)로 연다. ?u=<uid>는 view-mode라
        // Firestore만 읽어서, 아직 서버 저장 전이면 기본(샘플) 데이터가 떠버린다.
        // ?u= 없이 열면 loadFromFirestore가 localStorage로 폴백해 실제 내 편집분을 보여준다.
        const previewBtn = $('#ev3-preview-btn');
        if (previewBtn) previewBtn.href = 'portfolio.html';

        // 스킨(템플릿) 선택 — 기본(V3) + 등록된 스킨들. 고르면 그 스킨 편집 화면으로 이동
        const skinSel = $('#ev3-skin-select');
        if (skinSel) {
            let opts = '<option value="" selected>기본 (V3 포트폴리오)</option>';
            (window.PORTFOLIO_SKINS || []).forEach(s => {
                opts += '<option value="' + s.file + '">' + (s.icon ? s.icon + ' ' : '') + s.name + ' 스킨</option>';
            });
            skinSel.innerHTML = opts;
            // 로그인 상태로 이동하면(쿼리 없음) 소유자 편집 모드로 열림
            skinSel.onchange = () => { if (skinSel.value) location.href = skinSel.value; };
        }
        $$('.ev3-tab', drawer).forEach(t => t.onclick = () => { activeTab = t.dataset.tab; setActiveTabBtn(); renderTab(); });

        // 로고 클릭 → 로고 설정 탭
        const logoEl = $('.header .logo');
        if (logoEl) { logoEl.style.cursor = 'pointer'; logoEl.title = '클릭: 로고 설정'; logoEl.addEventListener('click', e => { e.preventDefault(); openDrawer('logo'); }); }

        // 편집모드에서 해시 네비/PDF 버튼 등은 그대로 두되, 데코레이션 적용
        decorate();

        // 데이터가 바뀌면 app.js가 재렌더 → 그 뒤에 다시 데코레이션
        window.addEventListener('dataUpdated', decorateSoon);
        // 혹시 모를 외부 재렌더 대비: 주기적 재데코는 하지 않음(성능). 필요한 지점에서만.

        setStatus('saved', '준비됨');
        console.log('[editor-v3] 편집 모드 활성화');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
