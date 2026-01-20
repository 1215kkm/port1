// Admin Panel JavaScript

class AdminPanel {
    constructor() {
        this.data = dataManager.getData();
        this.currentPage = 'solo';
        this.modal = document.getElementById('modal');

        this.init();
    }

    init() {
        // Apply theme
        dataManager.applyTheme();
        dataManager.applyCSSVariables();

        // Initialize page tabs
        this.initPageTabs();

        // Initialize all renderers
        this.renderMenuList();
        this.renderSectionOrder();
        this.renderProfile();
        this.renderAITools();
        this.renderExperience('related');
        this.renderExperience('other');
        this.renderEvaluation();
        this.renderVideo();
        this.renderPortfolioSolo();
        this.renderPortfolioAI();
        this.renderPortfolioTeam();
        this.renderContact();
        this.renderInterviews();
        this.renderThemeModes();
        this.renderCSSVariables();
        this.renderDisplayModes();

        // Initialize event listeners
        this.initEventListeners();
        this.initDragAndDrop();
        this.initModal();

        // Listen for data updates
        window.addEventListener('dataUpdated', () => {
            this.data = dataManager.getData();
            this.refreshPreview();
        });
    }

    // =====================
    // Page Tabs
    // =====================
    initPageTabs() {
        document.querySelectorAll('.page-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const page = tab.dataset.page;
                this.currentPage = page;

                document.querySelectorAll('.admin-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                document.getElementById(`panel-${page}`)?.classList.add('active');
            });
        });
    }

    // =====================
    // Event Listeners
    // =====================
    initEventListeners() {
        // Header buttons
        document.getElementById('btn-preview')?.addEventListener('click', () => this.togglePreview());
        document.getElementById('btn-export')?.addEventListener('click', () => dataManager.exportData());
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            if (confirm('모든 데이터를 초기화하시겠습니까?')) {
                dataManager.reset();
                location.reload();
            }
        });

        // Profile save
        document.getElementById('btn-save-profile')?.addEventListener('click', () => this.saveProfile());

        // Add buttons
        document.getElementById('btn-add-menu')?.addEventListener('click', () => this.showMenuModal());
        document.getElementById('btn-add-ai-tool')?.addEventListener('click', () => this.showAIToolModal());
        document.getElementById('btn-add-related')?.addEventListener('click', () => this.showExperienceModal('related'));
        document.getElementById('btn-add-other')?.addEventListener('click', () => this.showExperienceModal('other'));
        document.getElementById('btn-save-evaluation')?.addEventListener('click', () => this.saveEvaluation());
        document.getElementById('btn-save-video')?.addEventListener('click', () => this.saveVideo());
        document.getElementById('btn-add-portfolio-solo')?.addEventListener('click', () => this.showPortfolioModal('solo'));
        document.getElementById('btn-add-portfolio-ai')?.addEventListener('click', () => this.showProjectModal('ai'));
        document.getElementById('btn-add-portfolio-team')?.addEventListener('click', () => this.showProjectModal('team'));
        document.getElementById('btn-save-contact')?.addEventListener('click', () => this.saveContact());
        document.getElementById('btn-add-interview')?.addEventListener('click', () => this.showInterviewModal());
        document.getElementById('btn-add-theme')?.addEventListener('click', () => this.showThemeModal());
        document.getElementById('btn-save-css')?.addEventListener('click', () => this.saveCSSVariables());

        // Theme toggle buttons
        document.querySelectorAll('.floating-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                dataManager.setTheme(theme);
                document.querySelectorAll('.floating-theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Display mode selection
        document.querySelectorAll('.display-mode-item').forEach(item => {
            item.addEventListener('click', () => {
                const grid = item.closest('.display-mode-grid');
                const portfolio = grid.dataset.portfolio;
                const mode = item.dataset.mode;

                grid.querySelectorAll('.display-mode-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                dataManager.setDisplayMode(portfolio, mode);
            });
        });

        // Color inputs sync
        this.initColorInputs('css-color-primary');
        this.initColorInputs('css-color-secondary');
        this.initColorInputs('css-color-accent');
    }

    initColorInputs(baseId) {
        const colorInput = document.getElementById(baseId);
        const textInput = document.getElementById(`${baseId}-text`);

        if (colorInput && textInput) {
            colorInput.addEventListener('input', () => {
                textInput.value = colorInput.value;
            });
            textInput.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                    colorInput.value = textInput.value;
                }
            });
        }
    }

    // =====================
    // Drag and Drop
    // =====================
    initDragAndDrop() {
        const container = document.getElementById('section-order');
        if (!container) return;

        let draggedItem = null;

        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('sort-item')) {
                draggedItem = e.target;
                e.target.classList.add('dragging');
            }
        });

        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('sort-item')) {
                e.target.classList.remove('dragging');
                this.saveSectionOrder();
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            if (draggedItem) {
                if (afterElement == null) {
                    container.appendChild(draggedItem);
                } else {
                    container.insertBefore(draggedItem, afterElement);
                }
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.sort-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    saveSectionOrder() {
        const container = document.getElementById('section-order');
        const items = container.querySelectorAll('.sort-item');
        const newOrder = Array.from(items).map(item => item.dataset.section);
        dataManager.reorderSections(newOrder);
    }

    // =====================
    // Modal
    // =====================
    initModal() {
        document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeModal());
    }

    openModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        this.modal.classList.add('open');
    }

    closeModal() {
        this.modal.classList.remove('open');
    }

    // =====================
    // Preview
    // =====================
    togglePreview() {
        const frame = document.getElementById('preview-frame');
        const main = document.querySelector('.admin-main');

        frame.classList.toggle('active');
        main.classList.toggle('with-preview');
    }

    refreshPreview() {
        const frame = document.getElementById('preview-frame');
        if (frame && frame.classList.contains('active')) {
            frame.contentWindow.location.reload();
        }
    }

    // =====================
    // Renderers
    // =====================
    renderMenuList() {
        const container = document.getElementById('menu-list');
        if (!container) return;

        container.innerHTML = this.data.menuItems.map(item => `
            <div class="item-card">
                <div class="item-card-content">
                    <div class="item-card-title">${item.label}</div>
                    <div class="item-card-desc">#${item.id}</div>
                </div>
                <div class="item-card-actions">
                    <button class="btn-icon btn-icon-edit" data-action="edit-menu" data-id="${item.id}">✏️</button>
                    <button class="btn-icon btn-icon-delete" data-action="delete-menu" data-id="${item.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-action="edit-menu"]').forEach(btn => {
            btn.addEventListener('click', () => this.showMenuModal(btn.dataset.id));
        });

        container.querySelectorAll('[data-action="delete-menu"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('이 메뉴를 삭제하시겠습니까?')) {
                    dataManager.deleteMenuItem(btn.dataset.id);
                    this.renderMenuList();
                    this.renderSectionOrder();
                }
            });
        });
    }

    renderSectionOrder() {
        const container = document.getElementById('section-order');
        if (!container) return;

        const menuMap = {};
        this.data.menuItems.forEach(m => menuMap[m.id] = m.label);

        container.innerHTML = this.data.sectionOrder.map(sectionId => `
            <div class="sort-item" draggable="true" data-section="${sectionId}">
                <span class="sort-handle">☰</span>
                <span>${menuMap[sectionId] || sectionId}</span>
            </div>
        `).join('');
    }

    renderProfile() {
        const profile = this.data.profile;
        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-kakao').value = profile.kakaoId || '';
        document.getElementById('profile-employment').value = profile.employmentStatus || '';
        document.getElementById('profile-salary').value = profile.desiredSalary || '';
        document.getElementById('profile-roles').value = (profile.jobRoles || []).join(', ');
        document.getElementById('profile-skills').value = (profile.skills || []).join(', ');
        document.getElementById('profile-education').value = profile.education || '';
        document.getElementById('profile-residence').value = profile.residence || '';
        document.getElementById('profile-motto').value = profile.motto || '';
        document.getElementById('profile-image').value = profile.profileImage || '';
    }

    saveProfile() {
        const updates = {
            name: document.getElementById('profile-name').value,
            kakaoId: document.getElementById('profile-kakao').value,
            employmentStatus: document.getElementById('profile-employment').value,
            desiredSalary: document.getElementById('profile-salary').value,
            jobRoles: document.getElementById('profile-roles').value.split(',').map(s => s.trim()).filter(s => s),
            skills: document.getElementById('profile-skills').value.split(',').map(s => s.trim()).filter(s => s),
            education: document.getElementById('profile-education').value,
            residence: document.getElementById('profile-residence').value,
            motto: document.getElementById('profile-motto').value,
            profileImage: document.getElementById('profile-image').value
        };
        dataManager.updateProfile(updates);
        alert('프로필이 저장되었습니다.');
    }

    renderAITools() {
        const container = document.getElementById('ai-tools-list');
        if (!container) return;

        container.innerHTML = this.data.aiTools.map(tool => `
            <div class="item-card">
                <div class="item-card-content">
                    <div class="item-card-title">${tool.name}</div>
                    <div class="item-card-desc">${tool.description}</div>
                </div>
                <div class="item-card-actions">
                    <button class="btn-icon btn-icon-edit" data-action="edit-ai-tool" data-id="${tool.id}">✏️</button>
                    <button class="btn-icon btn-icon-delete" data-action="delete-ai-tool" data-id="${tool.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-action="edit-ai-tool"]').forEach(btn => {
            btn.addEventListener('click', () => this.showAIToolModal(parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="delete-ai-tool"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('이 AI 도구를 삭제하시겠습니까?')) {
                    dataManager.deleteAITool(parseInt(btn.dataset.id));
                    this.renderAITools();
                }
            });
        });
    }

    renderExperience(type) {
        const container = document.getElementById(`${type}-experience-list`);
        const totalInput = document.getElementById(`${type}-total`);
        if (!container) return;

        const experience = type === 'related' ? this.data.relatedExperience : this.data.otherExperience;

        if (totalInput) totalInput.value = experience.totalPeriod || '';

        container.innerHTML = experience.items.map(item => `
            <div class="item-card">
                <div class="item-card-content">
                    <div class="item-card-title">${item.company}</div>
                    <div class="item-card-desc">${item.period} | ${item.duration}</div>
                </div>
                <div class="item-card-actions">
                    <button class="btn-icon btn-icon-edit" data-action="edit-${type}" data-id="${item.id}">✏️</button>
                    <button class="btn-icon btn-icon-delete" data-action="delete-${type}" data-id="${item.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll(`[data-action="edit-${type}"]`).forEach(btn => {
            btn.addEventListener('click', () => this.showExperienceModal(type, parseInt(btn.dataset.id)));
        });

        container.querySelectorAll(`[data-action="delete-${type}"]`).forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('이 경력을 삭제하시겠습니까?')) {
                    dataManager.deleteExperience(type, parseInt(btn.dataset.id));
                    this.renderExperience(type);
                }
            });
        });

        // Save total period on change
        totalInput?.addEventListener('change', () => {
            const expData = type === 'related' ? this.data.relatedExperience : this.data.otherExperience;
            expData.totalPeriod = totalInput.value;
            dataManager.saveData();
        });
    }

    renderEvaluation() {
        const evaluation = this.data.evaluation;
        document.getElementById('evaluation-text').value = evaluation.text || '';

        const container = document.getElementById('radar-inputs');
        if (!container) return;

        container.innerHTML = evaluation.radarChart.map((item, i) => `
            <div class="radar-input-item">
                <input type="text" class="form-input" value="${item.label}" data-index="${i}" data-field="label" placeholder="항목명">
                <input type="number" class="form-input" value="${item.value}" data-index="${i}" data-field="value" min="0" max="100" placeholder="값">
            </div>
        `).join('');
    }

    saveEvaluation() {
        const text = document.getElementById('evaluation-text').value;
        const radarInputs = document.querySelectorAll('#radar-inputs .radar-input-item');

        const radarChart = Array.from(radarInputs).map(item => ({
            label: item.querySelector('[data-field="label"]').value,
            value: parseInt(item.querySelector('[data-field="value"]').value) || 0
        }));

        dataManager.updateEvaluation({ text });
        dataManager.updateRadarChart(radarChart);
        alert('평가가 저장되었습니다.');
    }

    renderVideo() {
        const video = this.data.video;
        document.getElementById('video-type').value = video.type || 'youtube';
        document.getElementById('video-url').value = video.url || '';
    }

    saveVideo() {
        const type = document.getElementById('video-type').value;
        const url = document.getElementById('video-url').value;
        dataManager.setVideo(type, url);
        alert('영상이 저장되었습니다.');
    }

    renderPortfolioSolo() {
        const container = document.getElementById('portfolio-solo-list');
        if (!container) return;

        container.innerHTML = this.data.portfolioSolo.items.map(item => `
            <div class="item-card">
                <div class="item-card-content">
                    <div class="item-card-title">${item.title}</div>
                    <div class="item-card-desc">섹션: ${item.section} | 기여도: ${item.contribution}%</div>
                </div>
                <div class="item-card-actions">
                    <button class="btn-icon btn-icon-edit" data-action="edit-portfolio-solo" data-id="${item.id}">✏️</button>
                    <button class="btn-icon btn-icon-delete" data-action="delete-portfolio-solo" data-id="${item.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-action="edit-portfolio-solo"]').forEach(btn => {
            btn.addEventListener('click', () => this.showPortfolioModal('solo', parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="delete-portfolio-solo"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('이 작품을 삭제하시겠습니까?')) {
                    dataManager.deletePortfolioItem(parseInt(btn.dataset.id));
                    this.renderPortfolioSolo();
                }
            });
        });
    }

    renderPortfolioAI() {
        const container = document.getElementById('portfolio-ai-list');
        if (!container) return;

        const projects = this.data.portfolioAI.projects || [];

        container.innerHTML = projects.map(project => `
            <div class="item-card">
                <div class="item-card-content">
                    <div class="item-card-title">${project.title}</div>
                    <div class="item-card-desc">팀원: ${project.team || '-'}</div>
                </div>
                <div class="item-card-actions">
                    <button class="btn-icon btn-icon-edit" data-action="edit-portfolio-ai" data-id="${project.id}">✏️</button>
                    <button class="btn-icon btn-icon-delete" data-action="delete-portfolio-ai" data-id="${project.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-action="edit-portfolio-ai"]').forEach(btn => {
            btn.addEventListener('click', () => this.showProjectModal('ai', parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="delete-portfolio-ai"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
                    dataManager.deleteAIProject(parseInt(btn.dataset.id));
                    this.renderPortfolioAI();
                }
            });
        });
    }

    renderPortfolioTeam() {
        const container = document.getElementById('portfolio-team-list');
        if (!container) return;

        const projects = this.data.portfolioTeam.projects || [];

        container.innerHTML = projects.map(project => `
            <div class="item-card">
                <div class="item-card-content">
                    <div class="item-card-title">${project.title}</div>
                    <div class="item-card-desc">팀원: ${project.team || '-'}</div>
                </div>
                <div class="item-card-actions">
                    <button class="btn-icon btn-icon-edit" data-action="edit-portfolio-team" data-id="${project.id}">✏️</button>
                    <button class="btn-icon btn-icon-delete" data-action="delete-portfolio-team" data-id="${project.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-action="edit-portfolio-team"]').forEach(btn => {
            btn.addEventListener('click', () => this.showProjectModal('team', parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="delete-portfolio-team"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
                    dataManager.deleteTeamProject(parseInt(btn.dataset.id));
                    this.renderPortfolioTeam();
                }
            });
        });
    }

    renderContact() {
        const contact = this.data.contact;
        document.getElementById('contact-name').value = contact.name || '';
        document.getElementById('contact-phone').value = contact.phone || '';
        document.getElementById('contact-email').value = contact.email || '';
        document.getElementById('contact-message').value = contact.message || '';
    }

    saveContact() {
        const updates = {
            name: document.getElementById('contact-name').value,
            phone: document.getElementById('contact-phone').value,
            email: document.getElementById('contact-email').value,
            message: document.getElementById('contact-message').value
        };
        dataManager.updateContact(updates);
        alert('연락처가 저장되었습니다.');
    }

    renderInterviews() {
        const container = document.getElementById('interview-list');
        if (!container) return;

        container.innerHTML = this.data.interviews.map(item => `
            <div class="item-card">
                <div class="item-card-content">
                    <div class="item-card-title">${item.company}</div>
                    <div class="item-card-desc">${item.date} ${item.time}</div>
                </div>
                <div class="item-card-actions">
                    <button class="btn-icon btn-icon-edit" data-action="edit-interview" data-id="${item.id}">✏️</button>
                    <button class="btn-icon btn-icon-delete" data-action="delete-interview" data-id="${item.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-action="edit-interview"]').forEach(btn => {
            btn.addEventListener('click', () => this.showInterviewModal(parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="delete-interview"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('이 면접 일정을 삭제하시겠습니까?')) {
                    dataManager.deleteInterview(parseInt(btn.dataset.id));
                    this.renderInterviews();
                }
            });
        });
    }

    renderThemeModes() {
        const container = document.getElementById('theme-modes-list');
        if (!container) return;

        container.innerHTML = this.data.theme.modes.map(mode => `
            <div class="item-card">
                <div class="item-card-content">
                    <div class="item-card-title">${mode.name}</div>
                    <div class="item-card-desc">#${mode.id}</div>
                </div>
                <div class="item-card-actions">
                    ${mode.id !== 'light' && mode.id !== 'dark' ? `
                        <button class="btn-icon btn-icon-edit" data-action="edit-theme" data-id="${mode.id}">✏️</button>
                        <button class="btn-icon btn-icon-delete" data-action="delete-theme" data-id="${mode.id}">🗑️</button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        container.querySelectorAll('[data-action="edit-theme"]').forEach(btn => {
            btn.addEventListener('click', () => this.showThemeModal(btn.dataset.id));
        });

        container.querySelectorAll('[data-action="delete-theme"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('이 테마를 삭제하시겠습니까?')) {
                    dataManager.deleteThemeMode(btn.dataset.id);
                    this.renderThemeModes();
                }
            });
        });
    }

    renderCSSVariables() {
        const vars = this.data.cssVariables;

        const setPair = (id, value) => {
            const colorInput = document.getElementById(id);
            const textInput = document.getElementById(`${id}-text`);
            if (colorInput) colorInput.value = value || '#000000';
            if (textInput) textInput.value = value || '#000000';
        };

        setPair('css-color-primary', vars.colorPrimary);
        setPair('css-color-secondary', vars.colorSecondary);
        setPair('css-color-accent', vars.colorAccent);

        document.getElementById('css-radius-sm').value = vars.radiusSm || '4px';
        document.getElementById('css-radius-md').value = vars.radiusMd || '8px';
        document.getElementById('css-radius-lg').value = vars.radiusLg || '12px';
        document.getElementById('css-font-base').value = vars.fontBase || '1rem';
    }

    saveCSSVariables() {
        const vars = {
            colorPrimary: document.getElementById('css-color-primary').value,
            colorSecondary: document.getElementById('css-color-secondary').value,
            colorAccent: document.getElementById('css-color-accent').value,
            radiusSm: document.getElementById('css-radius-sm').value,
            radiusMd: document.getElementById('css-radius-md').value,
            radiusLg: document.getElementById('css-radius-lg').value,
            fontBase: document.getElementById('css-font-base').value
        };
        dataManager.updateCSSVariables(vars);
        alert('CSS 변수가 저장되었습니다.');
    }

    renderDisplayModes() {
        // Solo display mode
        const soloMode = this.data.portfolioSolo.displayMode;
        document.querySelectorAll('[data-portfolio="solo"] .display-mode-item').forEach(item => {
            item.classList.toggle('active', item.dataset.mode === soloMode);
        });

        // AI display mode
        const aiMode = this.data.portfolioAI.displayMode;
        document.querySelectorAll('[data-portfolio="ai"] .display-mode-item').forEach(item => {
            item.classList.toggle('active', item.dataset.mode === aiMode);
        });

        // Team display mode
        const teamMode = this.data.portfolioTeam.displayMode;
        document.querySelectorAll('[data-portfolio="team"] .display-mode-item').forEach(item => {
            item.classList.toggle('active', item.dataset.mode === teamMode);
        });
    }

    // =====================
    // Modal Forms
    // =====================
    showMenuModal(editId = null) {
        const existing = editId ? this.data.menuItems.find(m => m.id === editId) : null;

        const content = `
            <div class="form-group">
                <label class="form-label">메뉴 ID (영문)</label>
                <input type="text" class="form-input" id="modal-menu-id" value="${existing?.id || ''}" ${existing ? 'disabled' : ''}>
            </div>
            <div class="form-group">
                <label class="form-label">메뉴 이름</label>
                <input type="text" class="form-input" id="modal-menu-label" value="${existing?.label || ''}">
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" id="modal-save">${existing ? '수정' : '추가'}</button>
                <button class="btn btn-secondary" id="modal-cancel">취소</button>
            </div>
        `;

        this.openModal(existing ? '메뉴 수정' : '메뉴 추가', content);

        document.getElementById('modal-save').addEventListener('click', () => {
            const id = document.getElementById('modal-menu-id').value.trim();
            const label = document.getElementById('modal-menu-label').value.trim();

            if (!label) {
                alert('메뉴 이름을 입력해주세요.');
                return;
            }

            if (existing) {
                dataManager.updateMenuItem(editId, { label });
            } else {
                if (!id) {
                    alert('메뉴 ID를 입력해주세요.');
                    return;
                }
                dataManager.addMenuItem({ id, label });
            }

            this.renderMenuList();
            this.renderSectionOrder();
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    showAIToolModal(editId = null) {
        const existing = editId ? this.data.aiTools.find(t => t.id === editId) : null;

        const content = `
            <div class="form-group">
                <label class="form-label">AI 도구 이름</label>
                <input type="text" class="form-input" id="modal-ai-name" value="${existing?.name || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">설명</label>
                <textarea class="form-textarea" id="modal-ai-desc">${existing?.description || ''}</textarea>
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" id="modal-save">${existing ? '수정' : '추가'}</button>
                <button class="btn btn-secondary" id="modal-cancel">취소</button>
            </div>
        `;

        this.openModal(existing ? 'AI 도구 수정' : 'AI 도구 추가', content);

        document.getElementById('modal-save').addEventListener('click', () => {
            const name = document.getElementById('modal-ai-name').value.trim();
            const description = document.getElementById('modal-ai-desc').value.trim();

            if (!name) {
                alert('AI 도구 이름을 입력해주세요.');
                return;
            }

            if (existing) {
                dataManager.updateAITool(editId, { name, description });
            } else {
                dataManager.addAITool({ name, description });
            }

            this.renderAITools();
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    showExperienceModal(type, editId = null) {
        const list = type === 'related' ? this.data.relatedExperience : this.data.otherExperience;
        const existing = editId ? list.items.find(i => i.id === editId) : null;

        const content = `
            <div class="form-group">
                <label class="form-label">회사명</label>
                <input type="text" class="form-input" id="modal-exp-company" value="${existing?.company || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">기간 (예: 2024.03 ~ 2025.02)</label>
                <input type="text" class="form-input" id="modal-exp-period" value="${existing?.period || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">근무 기간 (예: 1년)</label>
                <input type="text" class="form-input" id="modal-exp-duration" value="${existing?.duration || ''}">
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" id="modal-save">${existing ? '수정' : '추가'}</button>
                <button class="btn btn-secondary" id="modal-cancel">취소</button>
            </div>
        `;

        this.openModal(existing ? '경력 수정' : '경력 추가', content);

        document.getElementById('modal-save').addEventListener('click', () => {
            const company = document.getElementById('modal-exp-company').value.trim();
            const period = document.getElementById('modal-exp-period').value.trim();
            const duration = document.getElementById('modal-exp-duration').value.trim();

            if (!company) {
                alert('회사명을 입력해주세요.');
                return;
            }

            if (existing) {
                dataManager.updateExperience(type, editId, { company, period, duration });
            } else {
                dataManager.addExperience(type, { company, period, duration });
            }

            this.renderExperience(type);
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    showPortfolioModal(portfolioType, editId = null) {
        const existing = editId ? this.data.portfolioSolo.items.find(i => i.id === editId) : null;

        const sectionOptions = this.data.menuItems
            .filter(m => m.id !== 'about' && m.id !== 'contact')
            .map(m => `<option value="${m.id}" ${existing?.section === m.id ? 'selected' : ''}>${m.label}</option>`)
            .join('');

        const content = `
            <div class="form-group">
                <label class="form-label">섹션</label>
                <select class="form-select" id="modal-portfolio-section">
                    ${sectionOptions}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">제목</label>
                <input type="text" class="form-input" id="modal-portfolio-title" value="${existing?.title || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">주제</label>
                <input type="text" class="form-input" id="modal-portfolio-subject" value="${existing?.subject || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">타겟</label>
                <input type="text" class="form-input" id="modal-portfolio-target" value="${existing?.target || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">기여도 (%)</label>
                <input type="number" class="form-input" id="modal-portfolio-contribution" value="${existing?.contribution || 50}" min="0" max="100">
            </div>
            <div class="form-group">
                <label class="form-label">제작후기</label>
                <textarea class="form-textarea" id="modal-portfolio-review">${existing?.review || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">썸네일 URL (쉼표로 구분)</label>
                <input type="text" class="form-input" id="modal-portfolio-thumbnails" value="${(existing?.thumbnails || []).join(', ')}">
            </div>
            <div class="form-group">
                <label class="form-label">링크 URL</label>
                <input type="text" class="form-input" id="modal-portfolio-link" value="${existing?.links?.[0]?.url || ''}">
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" id="modal-save">${existing ? '수정' : '추가'}</button>
                <button class="btn btn-secondary" id="modal-cancel">취소</button>
            </div>
        `;

        this.openModal(existing ? '작품 수정' : '작품 추가', content);

        document.getElementById('modal-save').addEventListener('click', () => {
            const section = document.getElementById('modal-portfolio-section').value;
            const title = document.getElementById('modal-portfolio-title').value.trim();
            const subject = document.getElementById('modal-portfolio-subject').value.trim();
            const target = document.getElementById('modal-portfolio-target').value.trim();
            const contribution = parseInt(document.getElementById('modal-portfolio-contribution').value) || 50;
            const review = document.getElementById('modal-portfolio-review').value.trim();
            const thumbnails = document.getElementById('modal-portfolio-thumbnails').value.split(',').map(s => s.trim()).filter(s => s);
            const linkUrl = document.getElementById('modal-portfolio-link').value.trim();
            const links = linkUrl ? [{ label: '상세보기', url: linkUrl }] : [];

            if (!title) {
                alert('제목을 입력해주세요.');
                return;
            }

            const item = { title, subject, target, contribution, review, thumbnails, links };

            if (existing) {
                dataManager.updatePortfolioItem(editId, { ...item, section });
            } else {
                dataManager.addPortfolioItem(section, item);
            }

            this.renderPortfolioSolo();
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    showProjectModal(projectType, editId = null) {
        const projects = projectType === 'ai' ? this.data.portfolioAI.projects : this.data.portfolioTeam.projects;
        const existing = editId ? projects.find(p => p.id === editId) : null;

        const content = `
            <div class="form-group">
                <label class="form-label">프로젝트 제목</label>
                <input type="text" class="form-input" id="modal-project-title" value="${existing?.title || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">팀원 구성</label>
                <input type="text" class="form-input" id="modal-project-team" value="${existing?.team || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">내 역할</label>
                <input type="text" class="form-input" id="modal-project-role" value="${existing?.myRole || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">총 기간</label>
                <input type="text" class="form-input" id="modal-project-duration" value="${existing?.duration?.total || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">역할 상세 (줄바꿈으로 구분)</label>
                <textarea class="form-textarea" id="modal-project-role-detail">${(existing?.myRoleDetail || []).join('\n')}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">AI 활용 / 팀협업 설명</label>
                <textarea class="form-textarea" id="modal-project-ai">${existing?.descriptions?.aiUsage || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">설명</label>
                <textarea class="form-textarea" id="modal-project-explanation">${existing?.descriptions?.explanation || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">고민한 부분</label>
                <textarea class="form-textarea" id="modal-project-challenges">${existing?.descriptions?.challenges || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">마무리</label>
                <textarea class="form-textarea" id="modal-project-conclusion">${existing?.descriptions?.conclusion || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">이미지 URL (쉼표로 구분)</label>
                <input type="text" class="form-input" id="modal-project-images" value="${(existing?.images || []).join(', ')}">
            </div>
            <div class="form-group">
                <label class="form-label">영상 URL</label>
                <input type="text" class="form-input" id="modal-project-video" value="${existing?.videoUrl || ''}">
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" id="modal-save">${existing ? '수정' : '추가'}</button>
                <button class="btn btn-secondary" id="modal-cancel">취소</button>
            </div>
        `;

        this.openModal(existing ? '프로젝트 수정' : '프로젝트 추가', content);

        document.getElementById('modal-save').addEventListener('click', () => {
            const title = document.getElementById('modal-project-title').value.trim();
            const team = document.getElementById('modal-project-team').value.trim();
            const myRole = document.getElementById('modal-project-role').value.trim();
            const total = document.getElementById('modal-project-duration').value.trim();
            const myRoleDetail = document.getElementById('modal-project-role-detail').value.split('\n').map(s => s.trim()).filter(s => s);
            const aiUsage = document.getElementById('modal-project-ai').value.trim();
            const explanation = document.getElementById('modal-project-explanation').value.trim();
            const challenges = document.getElementById('modal-project-challenges').value.trim();
            const conclusion = document.getElementById('modal-project-conclusion').value.trim();
            const images = document.getElementById('modal-project-images').value.split(',').map(s => s.trim()).filter(s => s);
            const videoUrl = document.getElementById('modal-project-video').value.trim();

            if (!title) {
                alert('제목을 입력해주세요.');
                return;
            }

            const project = {
                title,
                team,
                myRole,
                duration: { total },
                myRoleDetail,
                descriptions: { aiUsage, explanation, challenges, conclusion },
                images,
                videoUrl,
                links: [],
                contributionBars: [
                    { label: '기획', value: 50 },
                    { label: '디자인', value: 50 },
                    { label: '퍼블', value: 50 }
                ],
                clientFeedback: []
            };

            if (projectType === 'ai') {
                if (existing) {
                    dataManager.updateAIProject(editId, project);
                } else {
                    dataManager.addAIProject(project);
                }
                this.renderPortfolioAI();
            } else {
                if (existing) {
                    dataManager.updateTeamProject(editId, project);
                } else {
                    dataManager.addTeamProject(project);
                }
                this.renderPortfolioTeam();
            }

            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    showInterviewModal(editId = null) {
        const existing = editId ? this.data.interviews.find(i => i.id === editId) : null;

        const content = `
            <div class="form-group">
                <label class="form-label">회사명</label>
                <input type="text" class="form-input" id="modal-interview-company" value="${existing?.company || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">날짜 (YYYY-MM-DD)</label>
                <input type="date" class="form-input" id="modal-interview-date" value="${existing?.date || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">시간 (HH:MM)</label>
                <input type="time" class="form-input" id="modal-interview-time" value="${existing?.time || ''}">
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" id="modal-save">${existing ? '수정' : '추가'}</button>
                <button class="btn btn-secondary" id="modal-cancel">취소</button>
            </div>
        `;

        this.openModal(existing ? '면접 일정 수정' : '면접 일정 추가', content);

        document.getElementById('modal-save').addEventListener('click', () => {
            const company = document.getElementById('modal-interview-company').value.trim();
            const date = document.getElementById('modal-interview-date').value;
            const time = document.getElementById('modal-interview-time').value;

            if (!company || !date) {
                alert('회사명과 날짜를 입력해주세요.');
                return;
            }

            if (existing) {
                dataManager.updateInterview(editId, { company, date, time });
            } else {
                dataManager.addInterview({ company, date, time });
            }

            this.renderInterviews();
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    showThemeModal(editId = null) {
        const existing = editId ? this.data.theme.modes.find(m => m.id === editId) : null;

        const content = `
            <div class="form-group">
                <label class="form-label">테마 이름</label>
                <input type="text" class="form-input" id="modal-theme-name" value="${existing?.name || ''}">
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" id="modal-save">${existing ? '수정' : '추가'}</button>
                <button class="btn btn-secondary" id="modal-cancel">취소</button>
            </div>
        `;

        this.openModal(existing ? '테마 수정' : '테마 추가', content);

        document.getElementById('modal-save').addEventListener('click', () => {
            const name = document.getElementById('modal-theme-name').value.trim();

            if (!name) {
                alert('테마 이름을 입력해주세요.');
                return;
            }

            if (existing) {
                dataManager.updateThemeMode(editId, { name });
            } else {
                dataManager.addThemeMode({ name, colors: {} });
            }

            this.renderThemeModes();
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }
}

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});
