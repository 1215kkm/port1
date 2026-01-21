// Admin Panel JavaScript

// Helper function to upload image to Firebase Storage
async function uploadImageToStorage(file, path = 'images') {
    try {
        const StorageManager = window.getStorageManager ? window.getStorageManager() : null;
        const userId = window.dataManager?.userId;

        if (StorageManager && userId) {
            // Upload to Firebase Storage
            const result = await StorageManager.uploadImage(userId, file, path);
            if (result.success && result.url) {
                console.log('Firebase upload success:', result.url);
                return result.url;
            } else {
                console.warn('Firebase upload failed, falling back to base64:', result.error);
                return await fileToBase64(file);
            }
        } else {
            // Fallback to base64 for local storage
            console.log('Using base64 fallback (StorageManager:', !!StorageManager, ', userId:', !!userId, ')');
            return await fileToBase64(file);
        }
    } catch (error) {
        console.error('Upload error, falling back to base64:', error);
        return await fileToBase64(file);
    }
}

// Convert file to base64 (fallback)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Show loading indicator
function showUploadLoading(element) {
    if (element) {
        element.style.opacity = '0.5';
        element.style.pointerEvents = 'none';
    }
}

// Hide loading indicator
function hideUploadLoading(element) {
    if (element) {
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
    }
}

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
        dataManager.applyFont();

        // Set user name in header
        this.setUserNameInHeader();

        // Initialize theme selector
        this.initThemeSelector();

        // Initialize minimap
        this.initMinimap();

        // Initialize resize handle
        this.initResizeHandle();

        // Initialize page tabs
        this.initPageTabs();

        // Initialize all renderers
        this.renderMenuList();
        this.renderSiteSettings();
        this.renderProfile();
        this.renderAITools();
        this.renderExperience('related');
        this.renderExperience('other');
        this.renderEvaluation();
        this.renderVideo();
        this.renderPortfolioSections();
        this.renderPortfolioAI();
        this.renderPortfolioTeam();
        this.renderContact();
        this.renderEmojiIcons();
        this.renderInterviews();
        this.renderThemeModes();
        this.renderCSSVariables();
        this.renderFloatingThemePanel();
        this.renderPageSettings();

        // Initialize event listeners
        this.initEventListeners();
        this.initDragAndDrop();
        this.initModal();
        this.initImageUpload();

        // Listen for data updates
        window.addEventListener('dataUpdated', () => {
            this.data = dataManager.getData();
            this.refreshPreview();
        });
    }

    // =====================
    // User Name in Header
    // =====================
    setUserNameInHeader() {
        const titleEl = document.getElementById('admin-title');
        if (titleEl) {
            const userName = this.data.profile?.name || '사용자';
            titleEl.textContent = `${userName}님의 포트폴리오 설정`;
        }
    }

    // =====================
    // Theme Selector (테마1, 테마2, 테마3)
    // =====================
    initThemeSelector() {
        document.querySelectorAll('.theme-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeNum = parseInt(btn.dataset.themeNum);

                if (themeNum === 1) {
                    // 현재 테마1 사용 중
                    document.querySelectorAll('.theme-select-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                } else {
                    // 테마2, 테마3은 준비 중
                    alert('준비중입니다.');
                }
            });
        });
    }

    // =====================
    // Site Minimap
    // =====================
    initMinimap() {
        const minimapFrame = document.getElementById('minimap-frame');
        const minimapOverlay = document.getElementById('minimap-overlay');
        const currentSectionEl = document.getElementById('minimap-current-section');

        if (!minimapFrame) return;

        // Set the portfolio URL with user ID
        const userId = dataManager.userId;
        this.minimapUserId = userId;
        this.currentMinimapPage = 'portfolio';

        if (userId) {
            minimapFrame.src = `portfolio.html?u=${userId}`;
        }

        // Track current section being edited
        this.currentEditSection = '자기소개';

        // Update section indicator when scrolling in admin
        const adminMain = document.querySelector('.admin-main');
        if (adminMain) {
            adminMain.addEventListener('scroll', () => {
                this.updateMinimapSection();
            });

            // Also track on window scroll
            window.addEventListener('scroll', () => {
                this.updateMinimapSection();
            });
        }

        // Click overlay to refresh minimap
        if (minimapOverlay) {
            minimapOverlay.addEventListener('click', () => {
                this.refreshMinimap();
            });
        }

        // Minimap page navigation buttons
        document.querySelectorAll('.minimap-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.switchMinimapPage(page);

                // Update active state
                document.querySelectorAll('.minimap-nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Minimap page settings checkboxes
        this.initMinimapPageSettings();

        // Auto-refresh minimap every 3 seconds when editing
        this.startMinimapAutoRefresh();
    }

    initMinimapPageSettings() {
        const pageSettings = this.data.pageSettings || { intro: true, ai: true, team: true };

        // Set initial checkbox states
        const introCheck = document.getElementById('minimap-page-intro');
        const aiCheck = document.getElementById('minimap-page-ai');
        const teamCheck = document.getElementById('minimap-page-team');

        if (introCheck) introCheck.checked = pageSettings.intro !== false;
        if (aiCheck) aiCheck.checked = pageSettings.ai !== false;
        if (teamCheck) teamCheck.checked = pageSettings.team !== false;

        // Add change listeners
        [introCheck, aiCheck, teamCheck].forEach(check => {
            if (check) {
                check.addEventListener('change', () => {
                    this.saveMinimapPageSettings();
                });
            }
        });
    }

    saveMinimapPageSettings() {
        const pageSettings = {
            intro: document.getElementById('minimap-page-intro')?.checked !== false,
            ai: document.getElementById('minimap-page-ai')?.checked !== false,
            team: document.getElementById('minimap-page-team')?.checked !== false
        };

        // Update both minimap and main page settings
        dataManager.set('pageSettings', pageSettings);
        dataManager.saveData();

        // Sync with main page settings panel
        const mainIntro = document.getElementById('page-enable-intro');
        const mainAi = document.getElementById('page-enable-ai');
        const mainTeam = document.getElementById('page-enable-team');

        if (mainIntro) mainIntro.checked = pageSettings.intro;
        if (mainAi) mainAi.checked = pageSettings.ai;
        if (mainTeam) mainTeam.checked = pageSettings.team;
    }

    switchMinimapPage(page) {
        const minimapFrame = document.getElementById('minimap-frame');
        if (!minimapFrame) return;

        this.currentMinimapPage = page;
        const userId = this.minimapUserId;
        const userParam = userId ? `?u=${userId}` : '';

        minimapFrame.src = `${page}.html${userParam}`;

        // Update header text
        const headerText = {
            'portfolio': '혼자제작',
            'ai': 'AI활용',
            'team': '팀플'
        };
        const currentSectionEl = document.getElementById('minimap-current-section');
        if (currentSectionEl) {
            currentSectionEl.textContent = headerText[page] || page;
        }
    }

    startMinimapAutoRefresh() {
        // Debounced refresh on input changes
        let refreshTimeout = null;

        document.querySelectorAll('.admin-main input, .admin-main textarea, .admin-main select').forEach(input => {
            input.addEventListener('input', () => {
                if (refreshTimeout) clearTimeout(refreshTimeout);
                refreshTimeout = setTimeout(() => {
                    this.refreshMinimap();
                }, 1500); // Refresh 1.5 seconds after typing stops
            });
        });
    }

    updateMinimapSection() {
        const currentSectionEl = document.getElementById('minimap-current-section');
        if (!currentSectionEl) return;

        // Find visible section
        const sections = document.querySelectorAll('.settings-section');
        let currentSection = '자기소개';

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top < 200 && rect.bottom > 100) {
                const title = section.querySelector('.settings-section-title');
                if (title) {
                    currentSection = title.textContent;
                }
            }
        });

        currentSectionEl.textContent = currentSection;
    }

    refreshMinimap() {
        const minimapFrame = document.getElementById('minimap-frame');
        if (minimapFrame) {
            minimapFrame.contentWindow.location.reload();
        }
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

                // Sync minimap with page tab
                if (page === 'solo') {
                    this.switchMinimapPage('portfolio');
                    this.updateMinimapNavActive('portfolio');
                } else if (page === 'ai') {
                    this.switchMinimapPage('ai');
                    this.updateMinimapNavActive('ai');
                } else if (page === 'team') {
                    this.switchMinimapPage('team');
                    this.updateMinimapNavActive('team');
                }

                // Show/hide menu management section (only for solo/skin pages)
                const menuSection = document.getElementById('menu-management-section');
                if (menuSection) {
                    menuSection.style.display = (page === 'solo' || page === 'skin') ? 'block' : 'none';
                }
            });
        });
    }

    updateMinimapNavActive(page) {
        document.querySelectorAll('.minimap-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
    }

    // =====================
    // Resize Handle
    // =====================
    initResizeHandle() {
        const handle = document.getElementById('resize-handle');
        const minimap = document.getElementById('site-minimap');
        const adminMain = document.querySelector('.admin-main');

        if (!handle || !minimap) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 280;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = minimap.offsetWidth;
            handle.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const diff = startX - e.clientX;
            const newWidth = Math.min(Math.max(startWidth + diff, 200), 600);

            minimap.style.width = newWidth + 'px';
            handle.style.right = (newWidth + 40) + 'px';

            if (adminMain) {
                adminMain.style.marginRight = (newWidth + 60) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                handle.classList.remove('active');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                // Save width preference
                localStorage.setItem('minimapWidth', minimap.offsetWidth);
            }
        });

        // Restore saved width
        const savedWidth = localStorage.getItem('minimapWidth');
        if (savedWidth) {
            const width = parseInt(savedWidth);
            minimap.style.width = width + 'px';
            handle.style.right = (width + 40) + 'px';
            if (adminMain) {
                adminMain.style.marginRight = (width + 60) + 'px';
            }
        }
    }

    // =====================
    // Event Listeners
    // =====================
    initEventListeners() {
        // Header buttons
        document.getElementById('btn-save-all')?.addEventListener('click', () => this.saveAll());
        document.getElementById('btn-preview')?.addEventListener('click', () => this.togglePreview());
        document.getElementById('btn-export')?.addEventListener('click', () => dataManager.exportData());
        document.getElementById('btn-import')?.addEventListener('click', () => {
            document.getElementById('import-file')?.click();
        });
        document.getElementById('import-file')?.addEventListener('change', (e) => this.importData(e));
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            if (confirm('모든 데이터를 초기화하시겠습니까?')) {
                dataManager.reset();
                location.reload();
            }
        });

        // Add buttons
        document.getElementById('btn-add-menu')?.addEventListener('click', () => this.showMenuModal());
        document.getElementById('btn-add-ai-tool')?.addEventListener('click', () => this.showAIToolModal());
        document.getElementById('btn-add-related')?.addEventListener('click', () => this.showExperienceModal('related'));
        document.getElementById('btn-add-other')?.addEventListener('click', () => this.showExperienceModal('other'));
        document.getElementById('btn-add-portfolio-ai')?.addEventListener('click', () => this.showProjectModal('ai'));
        document.getElementById('btn-add-portfolio-team')?.addEventListener('click', () => this.showProjectModal('team'));
        document.getElementById('btn-add-interview')?.addEventListener('click', () => this.showInterviewModal());
        document.getElementById('btn-add-theme')?.addEventListener('click', () => this.showThemeModal());

        // Save emoji icons button
        document.getElementById('btn-save-emoji')?.addEventListener('click', () => {
            this.saveEmojiIcons();
            dataManager.saveAll();
            alert('이모지 아이콘이 저장되었습니다.');
        });

        // Logo type change
        document.getElementById('logo-type')?.addEventListener('change', (e) => {
            const textGroup = document.getElementById('logo-text-group');
            const imageGroup = document.getElementById('logo-image-group');
            if (e.target.value === 'text') {
                textGroup.style.display = 'block';
                imageGroup.style.display = 'none';
            } else {
                textGroup.style.display = 'none';
                imageGroup.style.display = 'block';
            }
        });
    }

    initImageUpload() {
        // Profile image upload
        const uploadArea = document.getElementById('profile-image-upload');
        const fileInput = document.getElementById('profile-image-file');
        const urlInput = document.getElementById('profile-image');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const preview = document.getElementById('profile-image-preview');
                    showUploadLoading(preview);
                    preview.innerHTML = `<div style="padding: 20px; text-align: center;">업로드 중...</div>`;

                    const imageUrl = await uploadImageToStorage(file, 'profile');
                    preview.innerHTML = `<img src="${imageUrl}" alt="프로필">`;
                    urlInput.value = imageUrl;
                    hideUploadLoading(preview);
                }
            });
        }

        // URL input change for profile
        urlInput?.addEventListener('change', () => {
            if (urlInput.value) {
                const preview = document.getElementById('profile-image-preview');
                preview.innerHTML = `<img src="${urlInput.value}" alt="프로필">`;
            }
        });

        // Logo image upload
        const logoFileInput = document.getElementById('logo-image-file');
        const logoUrlInput = document.getElementById('logo-image-url');
        const logoUploadBtn = document.getElementById('btn-logo-upload');
        const logoPreview = document.getElementById('logo-preview');

        if (logoUploadBtn && logoFileInput) {
            logoUploadBtn.addEventListener('click', () => logoFileInput.click());

            logoFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const logoPreview = document.getElementById('logo-preview');
                    showUploadLoading(logoPreview);

                    const imageUrl = await uploadImageToStorage(file, 'logo');
                    logoUrlInput.value = imageUrl;
                    this.updateLogoPreview(imageUrl);
                    hideUploadLoading(logoPreview);
                }
            });
        }

        // URL input change for logo
        logoUrlInput?.addEventListener('change', () => {
            this.updateLogoPreview(logoUrlInput.value);
        });
    }

    updateLogoPreview(src) {
        const logoPreview = document.getElementById('logo-preview');
        if (logoPreview && src) {
            logoPreview.innerHTML = `<img src="${src}" alt="로고" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        } else if (logoPreview) {
            logoPreview.innerHTML = `<span style="color: var(--color-text-muted); font-size: var(--font-xs);">미리보기</span>`;
        }
    }

    // =====================
    // Save All
    // =====================
    saveAll() {
        // Collect all form data and save
        this.saveSiteSettings();
        this.saveProfile();
        this.saveEvaluation();
        this.saveVideo();
        this.saveContact();
        this.saveEmojiIcons();
        this.saveCSSVariables();
        this.saveAllThemes();

        dataManager.saveAll();

        // Update header with new name if changed
        this.setUserNameInHeader();

        // Refresh minimap
        this.refreshMinimap();

        alert('모든 설정이 저장되었습니다.');
    }

    saveSiteSettings() {
        const logoType = document.getElementById('logo-type').value;
        const logoText = document.getElementById('logo-text').value;
        const logoImageUrl = document.getElementById('logo-image-url').value;
        const fontTitle = document.getElementById('font-title').value;
        const fontContent = document.getElementById('font-content').value;
        const fontWeightTitle = document.getElementById('font-weight-title').value || '600';
        const fontWeightContent = document.getElementById('font-weight-content').value || '400';
        const fontFaceTitle = document.getElementById('font-face-title').value;
        const fontFaceContent = document.getElementById('font-face-content').value;
        const fontColorTitle1 = document.getElementById('font-color-title1-text').value || '#212529';
        const fontColorTitle2 = document.getElementById('font-color-title2-text').value || '#212529';
        const fontColorContent = document.getElementById('font-color-content-text').value || '#212529';

        dataManager.updateSiteSettings({
            logo: { type: logoType, text: logoText, imageUrl: logoImageUrl },
            font: {
                title: fontTitle,
                content: fontContent,
                weightTitle: fontWeightTitle,
                weightContent: fontWeightContent,
                fontFaceTitle: fontFaceTitle,
                fontFaceContent: fontFaceContent,
                colors: {
                    title1: fontColorTitle1,
                    title2: fontColorTitle2,
                    content: fontColorContent
                }
            }
        });
    }

    saveProfile() {
        const updates = {
            name: document.getElementById('profile-name').value,
            kakaoId: document.getElementById('profile-kakao').value,
            employmentStatus: document.getElementById('profile-employment').value,
            desiredSalary: document.getElementById('profile-salary').value,
            showEmployment: document.getElementById('profile-show-employment').checked,
            jobRoles: document.getElementById('profile-roles').value.split(',').map(s => s.trim()).filter(s => s),
            skills: document.getElementById('profile-skills').value.split(',').map(s => s.trim()).filter(s => s),
            education: document.getElementById('profile-education').value,
            residence: document.getElementById('profile-residence').value,
            motto: document.getElementById('profile-motto').value,
            profileImage: document.getElementById('profile-image').value
        };
        dataManager.updateProfile(updates);
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
    }

    saveVideo() {
        const type = document.getElementById('video-type').value;
        const url = document.getElementById('video-url').value;
        dataManager.setVideo(type, url);
    }

    saveContact() {
        const updates = {
            name: document.getElementById('contact-name').value,
            phone: document.getElementById('contact-phone').value,
            email: document.getElementById('contact-email').value,
            message: document.getElementById('contact-message').value
        };
        dataManager.updateContact(updates);
    }

    saveEmojiIcons() {
        const getIconData = (prefix) => {
            return this.iconData?.[prefix] || { type: 'emoji', emoji: '', imageUrl: '' };
        };

        const emojiIcons = {
            intro: {
                solo: getIconData('intro-solo'),
                ai: getIconData('intro-ai'),
                team: getIconData('intro-team')
            },
            contact: {
                name: getIconData('contact-name'),
                phone: getIconData('contact-phone'),
                email: getIconData('contact-email')
            }
        };
        dataManager.set('emojiIcons', emojiIcons);
    }

    saveCSSVariables() {
        const vars = {
            radiusSm: document.getElementById('css-radius-sm')?.value || '4px',
            radiusMd: document.getElementById('css-radius-md')?.value || '8px',
            radiusLg: document.getElementById('css-radius-lg')?.value || '12px',
            fontBase: document.getElementById('css-font-base')?.value || '1rem',
            fontTitle1: document.getElementById('css-font-title1')?.value || '2.25rem',
            fontTitle2: document.getElementById('css-font-title2')?.value || '1.5rem',
            spaceSection: document.getElementById('css-space-section')?.value || '6rem',
            spaceContent: document.getElementById('css-space-content')?.value || '1.5rem'
        };
        dataManager.updateCSSVariables(vars);
    }

    saveAllThemes() {
        // Save all theme color inputs
        this.data.theme.modes.forEach(mode => {
            const container = document.getElementById(`theme-colors-${mode.id}`);
            if (container) {
                const colors = {};
                container.querySelectorAll('[data-color-key]').forEach(input => {
                    colors[input.dataset.colorKey] = input.value;
                });
                dataManager.updateThemeMode(mode.id, { colors });
            }
        });
    }

    // =====================
    // Drag and Drop
    // =====================
    initDragAndDrop() {
        const container = document.getElementById('menu-list');
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
                this.saveMenuOrder();
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

    saveMenuOrder() {
        const container = document.getElementById('menu-list');
        const items = container.querySelectorAll('.sort-item');
        const newOrder = Array.from(items).map(item => item.dataset.section);
        dataManager.reorderSections(newOrder);
        // Also reorder menuItems
        const orderedMenuItems = newOrder.map(id => this.data.menuItems.find(m => m.id === id)).filter(Boolean);
        dataManager.set('menuItems', orderedMenuItems);
        this.data = dataManager.getData();
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
        // Also refresh minimap
        this.refreshMinimap();
    }

    // =====================
    // Import Data
    // =====================
    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const success = dataManager.importData(event.target.result);
                if (success) {
                    alert('데이터를 성공적으로 불러왔습니다. 페이지를 새로고침합니다.');
                    location.reload();
                } else {
                    alert('데이터 불러오기에 실패했습니다. 파일 형식을 확인해주세요.');
                }
            } catch (err) {
                alert('데이터 불러오기에 실패했습니다: ' + err.message);
            }
        };
        reader.readAsText(file);

        // Reset file input
        e.target.value = '';
    }

    // =====================
    // Renderers
    // =====================
    renderMenuList() {
        const container = document.getElementById('menu-list');
        if (!container) return;

        // Sort menu items by sectionOrder
        const orderedItems = [...this.data.menuItems].sort((a, b) => {
            const indexA = this.data.sectionOrder.indexOf(a.id);
            const indexB = this.data.sectionOrder.indexOf(b.id);
            return indexA - indexB;
        });

        container.innerHTML = orderedItems.map(item => `
            <div class="sort-item" draggable="true" data-section="${item.id}">
                <span class="sort-handle">☰</span>
                <span class="section-link" data-target="${item.id}">${item.label}</span>
                <div class="item-card-actions" style="margin-left: auto;">
                    <button class="btn-icon btn-icon-edit" data-action="edit-menu" data-id="${item.id}" style="background: #444; border-color: #555;">✏️</button>
                    ${item.id !== 'about' && item.id !== 'contact' ? `
                        <button class="btn-icon btn-icon-delete" data-action="delete-menu" data-id="${item.id}" style="background: #444; border-color: #555;">🗑️</button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Click to scroll to section
        container.querySelectorAll('.section-link').forEach(link => {
            link.addEventListener('click', () => {
                const target = link.dataset.target;
                const section = document.getElementById(`section-${target}`);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        container.querySelectorAll('[data-action="edit-menu"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showMenuModal(btn.dataset.id);
            });
        });

        container.querySelectorAll('[data-action="delete-menu"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('이 메뉴를 삭제하시겠습니까?')) {
                    dataManager.deleteMenuItem(btn.dataset.id);
                    this.data = dataManager.getData();
                    this.renderMenuList();
                    this.renderPortfolioSections();
                }
            });
        });
    }

    renderSiteSettings() {
        const settings = this.data.siteSettings;

        // Logo
        document.getElementById('logo-type').value = settings.logo?.type || 'text';
        document.getElementById('logo-text').value = settings.logo?.text || '';
        document.getElementById('logo-image-url').value = settings.logo?.imageUrl || '';

        // Show/hide based on type
        const textGroup = document.getElementById('logo-text-group');
        const imageGroup = document.getElementById('logo-image-group');
        if (settings.logo?.type === 'image') {
            textGroup.style.display = 'none';
            imageGroup.style.display = 'block';
            // Show logo preview
            this.updateLogoPreview(settings.logo?.imageUrl);
        }

        // Font
        document.getElementById('font-title').value = settings.font?.title || 'Paperozi';
        document.getElementById('font-content').value = settings.font?.content || 'Paperozi';
        document.getElementById('font-weight-title').value = settings.font?.weightTitle || '600';
        document.getElementById('font-weight-content').value = settings.font?.weightContent || '400';
        document.getElementById('font-face-title').value = settings.font?.fontFaceTitle || '';
        document.getElementById('font-face-content').value = settings.font?.fontFaceContent || '';

        // Font Colors
        const fontColors = settings.font?.colors || {};
        const colorTitle1 = fontColors.title1 || '#212529';
        const colorTitle2 = fontColors.title2 || '#212529';
        const colorContent = fontColors.content || '#212529';

        document.getElementById('font-color-title1').value = colorTitle1;
        document.getElementById('font-color-title1-text').value = colorTitle1;
        document.getElementById('font-color-title2').value = colorTitle2;
        document.getElementById('font-color-title2-text').value = colorTitle2;
        document.getElementById('font-color-content').value = colorContent;
        document.getElementById('font-color-content-text').value = colorContent;

        // Sync color picker with text input
        this.setupColorSync('font-color-title1');
        this.setupColorSync('font-color-title2');
        this.setupColorSync('font-color-content');
    }

    setupColorSync(baseId) {
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

    renderProfile() {
        const profile = this.data.profile;
        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-kakao').value = profile.kakaoId || '';
        document.getElementById('profile-employment').value = profile.employmentStatus || '';
        document.getElementById('profile-salary').value = profile.desiredSalary || '';
        document.getElementById('profile-show-employment').checked = profile.showEmployment !== false;
        document.getElementById('profile-roles').value = (profile.jobRoles || []).join(', ');
        document.getElementById('profile-skills').value = (profile.skills || []).join(', ');
        document.getElementById('profile-education').value = profile.education || '';
        document.getElementById('profile-residence').value = profile.residence || '';
        document.getElementById('profile-motto').value = profile.motto || '';
        document.getElementById('profile-image').value = profile.profileImage || '';

        // Profile image preview
        if (profile.profileImage) {
            const preview = document.getElementById('profile-image-preview');
            preview.innerHTML = `<img src="${profile.profileImage}" alt="프로필">`;
        }
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
                    this.data = dataManager.getData();
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
                    this.data = dataManager.getData();
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

    renderVideo() {
        const video = this.data.video;
        document.getElementById('video-type').value = video.type || 'youtube';
        document.getElementById('video-url').value = video.url || '';
    }

    renderPortfolioSections() {
        const container = document.getElementById('portfolio-sections-container');
        if (!container) return;

        // Get portfolio sections (isPortfolio: true)
        const portfolioMenus = this.data.menuItems.filter(m => m.isPortfolio);

        container.innerHTML = portfolioMenus.map(menu => {
            const items = dataManager.getPortfolioItemsBySection(menu.id);
            const displayMode = dataManager.getSectionDisplayMode(menu.id);

            return `
                <div class="settings-section section-anchor" id="section-${menu.id}">
                    <h2 class="settings-section-title">${menu.label}</h2>
                    <div class="settings-section-content">
                        <div class="portfolio-section-header">
                            <h3>작품 표시 방식</h3>
                        </div>
                        <div class="display-mode-grid" data-section="${menu.id}" style="margin-bottom: var(--space-xl);">
                            <div class="display-mode-item ${displayMode === 'single' ? 'active' : ''}" data-mode="single">
                                <div class="display-mode-icon">📄</div>
                                <div class="display-mode-label">한줄 한작품</div>
                            </div>
                            <div class="display-mode-item ${displayMode === 'grid' ? 'active' : ''}" data-mode="grid">
                                <div class="display-mode-icon">🔲</div>
                                <div class="display-mode-label">3칸 그리드</div>
                            </div>
                            <div class="display-mode-item ${displayMode === 'masonry' ? 'active' : ''}" data-mode="masonry">
                                <div class="display-mode-icon">🧱</div>
                                <div class="display-mode-label">지그재그 벽돌</div>
                            </div>
                            <div class="display-mode-item ${displayMode === 'slider' ? 'active' : ''}" data-mode="slider">
                                <div class="display-mode-icon">↔️</div>
                                <div class="display-mode-label">가로 슬라이드</div>
                            </div>
                        </div>

                        <h3 style="margin-bottom: var(--space-md);">작품 목록</h3>
                        <div class="portfolio-items-list" data-section="${menu.id}">
                            ${items.map(item => {
                                const contributions = item.contributions || (item.contribution ? [{ label: '기여도', value: item.contribution }] : []);
                                const contributionText = contributions.map(c => `${c.label}: ${c.value}%`).join(', ') || '-';
                                return `
                                <div class="item-card">
                                    <div class="item-card-content">
                                        <div class="item-card-title">${item.title}</div>
                                        <div class="item-card-desc">${contributionText}</div>
                                    </div>
                                    <div class="item-card-actions">
                                        <button class="btn-icon btn-icon-edit" data-action="edit-portfolio" data-id="${item.id}">✏️</button>
                                        <button class="btn-icon btn-icon-delete" data-action="delete-portfolio" data-id="${item.id}">🗑️</button>
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                        <button class="add-btn" data-action="add-portfolio" data-section="${menu.id}">+ 작품 추가</button>
                    </div>
                </div>
            `;
        }).join('');

        // Bind display mode clicks
        container.querySelectorAll('.display-mode-item').forEach(item => {
            item.addEventListener('click', () => {
                const grid = item.closest('.display-mode-grid');
                const sectionId = grid.dataset.section;
                const mode = item.dataset.mode;

                grid.querySelectorAll('.display-mode-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                dataManager.setSectionDisplayMode(sectionId, mode);
            });
        });

        // Bind portfolio actions
        container.querySelectorAll('[data-action="edit-portfolio"]').forEach(btn => {
            btn.addEventListener('click', () => this.showPortfolioModal(null, parseInt(btn.dataset.id)));
        });

        container.querySelectorAll('[data-action="delete-portfolio"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('이 작품을 삭제하시겠습니까?')) {
                    dataManager.deletePortfolioItem(parseInt(btn.dataset.id));
                    this.data = dataManager.getData();
                    this.renderPortfolioSections();
                }
            });
        });

        container.querySelectorAll('[data-action="add-portfolio"]').forEach(btn => {
            btn.addEventListener('click', () => this.showPortfolioModal(btn.dataset.section));
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
                    this.data = dataManager.getData();
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
                    this.data = dataManager.getData();
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

    renderEmojiIcons() {
        const emojiIcons = this.data.emojiIcons || {};
        const intro = emojiIcons.intro || {};
        const contact = emojiIcons.contact || {};

        // Helper to get icon data (supports both old string format and new object format)
        const getIconValue = (data, defaultEmoji) => {
            if (typeof data === 'string') {
                return { type: 'emoji', emoji: data, imageUrl: '' };
            }
            return {
                type: data?.type || 'emoji',
                emoji: data?.emoji || defaultEmoji,
                imageUrl: data?.imageUrl || ''
            };
        };

        const icons = {
            'intro-solo': getIconValue(intro.solo, '👤'),
            'intro-ai': getIconValue(intro.ai, '🤖'),
            'intro-team': getIconValue(intro.team, '👥'),
            'contact-name': getIconValue(contact.name, '👤'),
            'contact-phone': getIconValue(contact.phone, '📞'),
            'contact-email': getIconValue(contact.email, '✉️')
        };

        // Store current icon data
        this.iconData = this.iconData || {};

        // Set values and setup event listeners for each icon
        Object.entries(icons).forEach(([prefix, data]) => {
            const emojiEl = document.getElementById(`emoji-${prefix}`);
            const fileEl = document.getElementById(`icon-${prefix}-file`);
            const previewEl = document.getElementById(`icon-${prefix}-preview`);

            // Store icon data
            this.iconData[prefix] = { ...data };

            // Set emoji input value
            if (emojiEl) emojiEl.value = data.emoji;

            // Update preview
            this.updateIconPreview(prefix);

            // Add emoji input change listener
            if (emojiEl) {
                emojiEl.addEventListener('input', () => {
                    this.iconData[prefix].type = 'emoji';
                    this.iconData[prefix].emoji = emojiEl.value;
                    this.iconData[prefix].imageUrl = '';
                    this.updateIconPreview(prefix);
                });
            }

            // Add file input change listener
            if (fileEl) {
                fileEl.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const previewEl = document.getElementById(`icon-${prefix}-preview`);
                        showUploadLoading(previewEl);
                        if (previewEl) previewEl.innerHTML = '<span style="font-size: 12px;">업로드중...</span>';

                        try {
                            const imageUrl = await uploadImageToStorage(file, 'icons');
                            console.log('Icon upload result:', prefix, imageUrl ? 'success' : 'failed');

                            if (imageUrl) {
                                this.iconData[prefix].type = 'image';
                                this.iconData[prefix].imageUrl = imageUrl;
                            }
                            this.updateIconPreview(prefix);
                        } catch (error) {
                            console.error('Icon upload error:', error);
                            if (previewEl) previewEl.textContent = '❌';
                        }
                        hideUploadLoading(previewEl);
                    }
                });
            }
        });

        // Setup file button click handlers
        document.querySelectorAll('.icon-file-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const fileInput = document.getElementById(targetId);
                if (fileInput) fileInput.click();
            });
        });
    }

    updateIconPreview(prefix) {
        const previewEl = document.getElementById(`icon-${prefix}-preview`);
        if (!previewEl) return;

        const data = this.iconData[prefix];
        if (data.type === 'image' && data.imageUrl) {
            previewEl.innerHTML = `<img src="${data.imageUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        } else {
            previewEl.textContent = data.emoji || '';
        }
    }

    renderInterviews() {
        const container = document.getElementById('interview-list');
        if (!container) return;

        container.innerHTML = this.data.interviews.map(item => `
            <div class="item-card">
                <div class="item-card-content">
                    <div class="item-card-title">${item.company} 면접</div>
                    <div class="item-card-desc">${item.date} ${item.time}${item.location ? ` - ${item.location}` : ''}</div>
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
                    this.data = dataManager.getData();
                    this.renderInterviews();
                }
            });
        });
    }

    renderThemeModes() {
        const container = document.getElementById('theme-modes-container');
        if (!container) return;

        container.innerHTML = this.data.theme.modes.map(mode => `
            <div class="settings-section" style="margin-bottom: var(--space-lg);">
                <h3 class="settings-section-title" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${mode.name}</span>
                    ${mode.id !== 'light' && mode.id !== 'dark' ? `
                        <button class="btn btn-accent btn-sm" data-action="delete-theme" data-id="${mode.id}" style="padding: 4px 12px; font-size: 12px;">삭제</button>
                    ` : ''}
                </h3>
                <div class="settings-section-content" id="theme-colors-${mode.id}">
                    <div class="form-group" style="margin-bottom: var(--space-lg);">
                        <label class="form-label">테마 이름</label>
                        <input type="text" class="form-input" value="${mode.name}" data-theme-id="${mode.id}" data-field="name">
                    </div>
                    <div class="theme-color-grid">
                        <div class="theme-color-item">
                            <label>메인 컬러</label>
                            <div class="color-input-group">
                                <input type="color" class="color-preview" value="${mode.colors?.primary || '#3498db'}" data-color-key="primary">
                                <input type="text" class="form-input" value="${mode.colors?.primary || '#3498db'}" data-color-key="primary">
                            </div>
                        </div>
                        <div class="theme-color-item">
                            <label>서브 컬러</label>
                            <div class="color-input-group">
                                <input type="color" class="color-preview" value="${mode.colors?.secondary || '#2ecc71'}" data-color-key="secondary">
                                <input type="text" class="form-input" value="${mode.colors?.secondary || '#2ecc71'}" data-color-key="secondary">
                            </div>
                        </div>
                        <div class="theme-color-item">
                            <label>강조 컬러</label>
                            <div class="color-input-group">
                                <input type="color" class="color-preview" value="${mode.colors?.accent || '#e74c3c'}" data-color-key="accent">
                                <input type="text" class="form-input" value="${mode.colors?.accent || '#e74c3c'}" data-color-key="accent">
                            </div>
                        </div>
                        <div class="theme-color-item">
                            <label>배경색</label>
                            <div class="color-input-group">
                                <input type="color" class="color-preview" value="${mode.colors?.background || '#ffffff'}" data-color-key="background">
                                <input type="text" class="form-input" value="${mode.colors?.background || '#ffffff'}" data-color-key="background">
                            </div>
                        </div>
                        <div class="theme-color-item">
                            <label>배경색 (보조)</label>
                            <div class="color-input-group">
                                <input type="color" class="color-preview" value="${mode.colors?.backgroundSecondary || '#f8f9fa'}" data-color-key="backgroundSecondary">
                                <input type="text" class="form-input" value="${mode.colors?.backgroundSecondary || '#f8f9fa'}" data-color-key="backgroundSecondary">
                            </div>
                        </div>
                        <div class="theme-color-item">
                            <label>글자색</label>
                            <div class="color-input-group">
                                <input type="color" class="color-preview" value="${mode.colors?.text || '#212529'}" data-color-key="text">
                                <input type="text" class="form-input" value="${mode.colors?.text || '#212529'}" data-color-key="text">
                            </div>
                        </div>
                        <div class="theme-color-item">
                            <label>글자색 (보조)</label>
                            <div class="color-input-group">
                                <input type="color" class="color-preview" value="${mode.colors?.textSecondary || '#6c757d'}" data-color-key="textSecondary">
                                <input type="text" class="form-input" value="${mode.colors?.textSecondary || '#6c757d'}" data-color-key="textSecondary">
                            </div>
                        </div>
                        <div class="theme-color-item">
                            <label>테두리색</label>
                            <div class="color-input-group">
                                <input type="color" class="color-preview" value="${mode.colors?.border || '#dee2e6'}" data-color-key="border">
                                <input type="text" class="form-input" value="${mode.colors?.border || '#dee2e6'}" data-color-key="border">
                            </div>
                        </div>
                        <div class="theme-color-item">
                            <label>버튼 배경</label>
                            <div class="color-input-group">
                                <input type="color" class="color-preview" value="${mode.colors?.buttonBg || '#3498db'}" data-color-key="buttonBg">
                                <input type="text" class="form-input" value="${mode.colors?.buttonBg || '#3498db'}" data-color-key="buttonBg">
                            </div>
                        </div>
                        <div class="theme-color-item">
                            <label>버튼 글자색</label>
                            <div class="color-input-group">
                                <input type="color" class="color-preview" value="${mode.colors?.buttonText || '#ffffff'}" data-color-key="buttonText">
                                <input type="text" class="form-input" value="${mode.colors?.buttonText || '#ffffff'}" data-color-key="buttonText">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Sync color inputs
        container.querySelectorAll('.color-input-group').forEach(group => {
            const colorInput = group.querySelector('input[type="color"]');
            const textInput = group.querySelector('input[type="text"]');

            colorInput?.addEventListener('input', () => {
                textInput.value = colorInput.value;
            });

            textInput?.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                    colorInput.value = textInput.value;
                }
            });
        });

        // Delete theme
        container.querySelectorAll('[data-action="delete-theme"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('이 테마를 삭제하시겠습니까?')) {
                    dataManager.deleteThemeMode(btn.dataset.id);
                    this.data = dataManager.getData();
                    this.renderThemeModes();
                    this.renderFloatingThemePanel();
                }
            });
        });
    }

    renderCSSVariables() {
        const vars = this.data.cssVariables;

        document.getElementById('css-radius-sm').value = vars.radiusSm || '4px';
        document.getElementById('css-radius-md').value = vars.radiusMd || '8px';
        document.getElementById('css-radius-lg').value = vars.radiusLg || '12px';
        document.getElementById('css-font-base').value = vars.fontBase || '1rem';
        document.getElementById('css-font-title1').value = vars.fontTitle1 || '2.25rem';
        document.getElementById('css-font-title2').value = vars.fontTitle2 || '1.5rem';
        document.getElementById('css-space-section').value = vars.spaceSection || '6rem';
        document.getElementById('css-space-content').value = vars.spaceContent || '1.5rem';
    }

    renderPageSettings() {
        const pageSettings = this.data.pageSettings || {
            intro: true,
            ai: true,
            team: true
        };

        const introToggle = document.getElementById('page-enable-intro');
        const aiToggle = document.getElementById('page-enable-ai');
        const teamToggle = document.getElementById('page-enable-team');

        if (introToggle) introToggle.checked = pageSettings.intro !== false;
        if (aiToggle) aiToggle.checked = pageSettings.ai !== false;
        if (teamToggle) teamToggle.checked = pageSettings.team !== false;

        // Add change listeners
        [introToggle, aiToggle, teamToggle].forEach(toggle => {
            if (toggle) {
                toggle.addEventListener('change', () => {
                    this.savePageSettings();
                });
            }
        });
    }

    savePageSettings() {
        const pageSettings = {
            intro: document.getElementById('page-enable-intro')?.checked !== false,
            ai: document.getElementById('page-enable-ai')?.checked !== false,
            team: document.getElementById('page-enable-team')?.checked !== false
        };

        dataManager.set('pageSettings', pageSettings);
        dataManager.saveData();

        // Sync with minimap checkboxes
        const miniIntro = document.getElementById('minimap-page-intro');
        const miniAi = document.getElementById('minimap-page-ai');
        const miniTeam = document.getElementById('minimap-page-team');

        if (miniIntro) miniIntro.checked = pageSettings.intro;
        if (miniAi) miniAi.checked = pageSettings.ai;
        if (miniTeam) miniTeam.checked = pageSettings.team;
    }

    renderFloatingThemePanel() {
        const container = document.getElementById('floating-theme-panel');
        if (!container) return;

        const currentTheme = this.data.theme.current;

        container.innerHTML = this.data.theme.modes.map(mode => `
            <button class="floating-theme-btn ${mode.id === currentTheme ? 'active' : ''}"
                    data-theme="${mode.id}"
                    style="background: ${mode.colors?.background || '#ffffff'}; border: 1px solid ${mode.colors?.border || '#dee2e6'};"
                    title="${mode.name}">
            </button>
        `).join('');

        // Theme toggle clicks
        container.querySelectorAll('.floating-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeId = btn.dataset.theme;
                dataManager.setTheme(themeId);
                container.querySelectorAll('.floating-theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
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
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="modal-menu-portfolio" ${existing?.isPortfolio !== false ? 'checked' : ''}>
                    작품 섹션으로 사용 (체크하면 작품 표시 섹션이 생성됩니다)
                </label>
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
            const isPortfolio = document.getElementById('modal-menu-portfolio').checked;

            if (!label) {
                alert('메뉴 이름을 입력해주세요.');
                return;
            }

            if (existing) {
                dataManager.updateMenuItem(editId, { label, isPortfolio });
            } else {
                if (!id) {
                    alert('메뉴 ID를 입력해주세요.');
                    return;
                }
                dataManager.addMenuItem({ id, label, isPortfolio });
            }

            this.data = dataManager.getData();
            this.renderMenuList();
            this.renderPortfolioSections();
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

            this.data = dataManager.getData();
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

            this.data = dataManager.getData();
            this.renderExperience(type);
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    showPortfolioModal(section, editId = null) {
        const existing = editId ? this.data.portfolioSolo.items.find(i => i.id === editId) : null;

        const sectionOptions = this.data.menuItems
            .filter(m => m.isPortfolio)
            .map(m => `<option value="${m.id}" ${(existing?.section || section) === m.id ? 'selected' : ''}>${m.label}</option>`)
            .join('');

        // Get existing contributions or create default
        const existingContributions = existing?.contributions || (existing?.contribution ? [{ label: '기여도', value: existing.contribution }] : [{ label: '디자인', value: 50 }]);

        const contributionsHTML = existingContributions.map((c, i) => `
            <div class="contribution-input-item" data-index="${i}">
                <input type="text" class="form-input" value="${c.label}" data-field="label" placeholder="역할명 (예: 기획)">
                <input type="number" class="form-input" value="${c.value}" data-field="value" min="0" max="100" placeholder="%">
                <button type="button" class="btn btn-accent btn-sm" data-action="remove-contribution">✕</button>
            </div>
        `).join('');

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
                <label class="form-label">기여도 (역할별)</label>
                <div id="contributions-container" style="display: flex; flex-direction: column; gap: var(--space-sm);">
                    ${contributionsHTML}
                </div>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-add-contribution" style="margin-top: var(--space-sm);">+ 기여도 추가</button>
            </div>
            <div class="form-group">
                <label class="form-label">제작후기</label>
                <textarea class="form-textarea" id="modal-portfolio-review">${existing?.review || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">썸네일 이미지</label>
                <div id="modal-portfolio-thumbnails-preview" style="display: flex; flex-wrap: wrap; gap: var(--space-sm); margin-bottom: var(--space-sm);">
                    ${(existing?.thumbnails || []).map((url, i) => `
                        <div class="thumbnail-preview-item" data-index="${i}" style="position: relative; width: 80px; height: 80px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden;">
                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
                            <button type="button" class="btn-remove-thumbnail" data-index="${i}" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,0.6); color: white; border: none; cursor: pointer; font-size: 12px;">✕</button>
                        </div>
                    `).join('')}
                </div>
                <div style="display: flex; gap: var(--space-sm);">
                    <input type="file" id="modal-portfolio-file" accept="image/*" multiple style="display: none;">
                    <button type="button" class="btn btn-secondary btn-sm" id="btn-portfolio-add-image">📁 이미지 추가</button>
                </div>
                <input type="hidden" id="modal-portfolio-thumbnails" value="${(existing?.thumbnails || []).join('|||')}">
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

        // Add contribution button
        document.getElementById('btn-add-contribution')?.addEventListener('click', () => {
            const container = document.getElementById('contributions-container');
            const index = container.children.length;
            const newItem = document.createElement('div');
            newItem.className = 'contribution-input-item';
            newItem.dataset.index = index;
            newItem.innerHTML = `
                <input type="text" class="form-input" value="" data-field="label" placeholder="역할명 (예: 기획)">
                <input type="number" class="form-input" value="50" data-field="value" min="0" max="100" placeholder="%">
                <button type="button" class="btn btn-accent btn-sm" data-action="remove-contribution">✕</button>
            `;
            container.appendChild(newItem);
            this.bindContributionRemove();
        });

        this.bindContributionRemove();

        // Image file upload for portfolio
        const fileInput = document.getElementById('modal-portfolio-file');
        const addImageBtn = document.getElementById('btn-portfolio-add-image');
        const thumbnailsInput = document.getElementById('modal-portfolio-thumbnails');
        const previewContainer = document.getElementById('modal-portfolio-thumbnails-preview');

        addImageBtn?.addEventListener('click', () => fileInput?.click());

        fileInput?.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                showUploadLoading(previewContainer);
                for (const file of Array.from(files)) {
                    const imageUrl = await uploadImageToStorage(file, 'portfolio');
                    // Add to thumbnails
                    const currentThumbnails = thumbnailsInput.value ? thumbnailsInput.value.split('|||').filter(s => s) : [];
                    currentThumbnails.push(imageUrl);
                    thumbnailsInput.value = currentThumbnails.join('|||');
                    // Update preview
                    this.updateThumbnailPreview(previewContainer, currentThumbnails);
                }
                hideUploadLoading(previewContainer);
            }
            fileInput.value = '';
        });

        // Bind remove buttons
        this.bindThumbnailRemove(previewContainer, thumbnailsInput);

        document.getElementById('modal-save').addEventListener('click', () => {
            const selectedSection = document.getElementById('modal-portfolio-section').value;
            const title = document.getElementById('modal-portfolio-title').value.trim();
            const subject = document.getElementById('modal-portfolio-subject').value.trim();
            const target = document.getElementById('modal-portfolio-target').value.trim();
            const review = document.getElementById('modal-portfolio-review').value.trim();
            const thumbnails = document.getElementById('modal-portfolio-thumbnails').value.split('|||').map(s => s.trim()).filter(s => s);
            const linkUrl = document.getElementById('modal-portfolio-link').value.trim();
            const links = linkUrl ? [{ label: '상세보기', url: linkUrl }] : [];

            // Collect contributions
            const contributionsContainer = document.getElementById('contributions-container');
            const contributions = [];
            contributionsContainer.querySelectorAll('.contribution-input-item').forEach(item => {
                const label = item.querySelector('[data-field="label"]').value.trim();
                const value = parseInt(item.querySelector('[data-field="value"]').value) || 0;
                if (label) {
                    contributions.push({ label, value });
                }
            });

            if (!title) {
                alert('제목을 입력해주세요.');
                return;
            }

            const item = { title, subject, target, contributions, review, thumbnails, links };

            if (existing) {
                dataManager.updatePortfolioItem(editId, { ...item, section: selectedSection });
            } else {
                dataManager.addPortfolioItem(selectedSection, item);
            }

            this.data = dataManager.getData();
            this.renderPortfolioSections();
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    updateThumbnailPreview(container, thumbnails) {
        container.innerHTML = thumbnails.map((url, i) => `
            <div class="thumbnail-preview-item" data-index="${i}" style="position: relative; width: 80px; height: 80px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden;">
                <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" class="btn-remove-thumbnail" data-index="${i}" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,0.6); color: white; border: none; cursor: pointer; font-size: 12px;">✕</button>
            </div>
        `).join('');

        const thumbnailsInput = document.getElementById('modal-portfolio-thumbnails');
        this.bindThumbnailRemove(container, thumbnailsInput);
    }

    bindThumbnailRemove(container, thumbnailsInput) {
        container.querySelectorAll('.btn-remove-thumbnail').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                const currentThumbnails = thumbnailsInput.value ? thumbnailsInput.value.split('|||').filter(s => s) : [];
                currentThumbnails.splice(index, 1);
                thumbnailsInput.value = currentThumbnails.join('|||');
                this.updateThumbnailPreview(container, currentThumbnails);
            };
        });
    }

    updateProjectImagePreview(container, images) {
        container.innerHTML = images.map((url, i) => `
            <div class="thumbnail-preview-item" data-index="${i}" style="position: relative; width: 80px; height: 80px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden;">
                <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
                <button type="button" class="btn-remove-project-image" data-index="${i}" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,0.6); color: white; border: none; cursor: pointer; font-size: 12px;">✕</button>
            </div>
        `).join('');

        const imagesInput = document.getElementById('modal-project-images');
        this.bindProjectImageRemove(container, imagesInput);
    }

    bindProjectImageRemove(container, imagesInput) {
        container.querySelectorAll('.btn-remove-project-image').forEach(btn => {
            btn.onclick = () => {
                const index = parseInt(btn.dataset.index);
                const currentImages = imagesInput.value ? imagesInput.value.split('|||').filter(s => s) : [];
                currentImages.splice(index, 1);
                imagesInput.value = currentImages.join('|||');
                this.updateProjectImagePreview(container, currentImages);
            };
        });
    }

    bindContributionRemove() {
        document.querySelectorAll('[data-action="remove-contribution"]').forEach(btn => {
            btn.onclick = () => {
                const container = document.getElementById('contributions-container');
                if (container.children.length > 1) {
                    btn.closest('.contribution-input-item').remove();
                } else {
                    alert('최소 1개의 기여도가 필요합니다.');
                }
            };
        });
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
                <label class="form-label">${projectType === 'ai' ? 'AI 활용' : '팀 협업'} 설명</label>
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
                <label class="form-label">이미지</label>
                <div id="modal-project-images-preview" style="display: flex; flex-wrap: wrap; gap: var(--space-sm); margin-bottom: var(--space-sm);">
                    ${(existing?.images || []).map((url, i) => `
                        <div class="thumbnail-preview-item" data-index="${i}" style="position: relative; width: 80px; height: 80px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden;">
                            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;">
                            <button type="button" class="btn-remove-project-image" data-index="${i}" style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,0.6); color: white; border: none; cursor: pointer; font-size: 12px;">✕</button>
                        </div>
                    `).join('')}
                </div>
                <div style="display: flex; gap: var(--space-sm);">
                    <input type="file" id="modal-project-file" accept="image/*" multiple style="display: none;">
                    <button type="button" class="btn btn-secondary btn-sm" id="btn-project-add-image">📁 이미지 추가</button>
                </div>
                <input type="hidden" id="modal-project-images" value="${(existing?.images || []).join('|||')}">
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

        // Image file upload for project
        const projectFileInput = document.getElementById('modal-project-file');
        const projectAddImageBtn = document.getElementById('btn-project-add-image');
        const projectImagesInput = document.getElementById('modal-project-images');
        const projectPreviewContainer = document.getElementById('modal-project-images-preview');

        projectAddImageBtn?.addEventListener('click', () => projectFileInput?.click());

        projectFileInput?.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                showUploadLoading(projectPreviewContainer);
                for (const file of Array.from(files)) {
                    const imageUrl = await uploadImageToStorage(file, 'projects');
                    const currentImages = projectImagesInput.value ? projectImagesInput.value.split('|||').filter(s => s) : [];
                    currentImages.push(imageUrl);
                    projectImagesInput.value = currentImages.join('|||');
                    this.updateProjectImagePreview(projectPreviewContainer, currentImages);
                }
                hideUploadLoading(projectPreviewContainer);
            }
            projectFileInput.value = '';
        });

        this.bindProjectImageRemove(projectPreviewContainer, projectImagesInput);

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
            const images = document.getElementById('modal-project-images').value.split('|||').map(s => s.trim()).filter(s => s);
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
                contributionBars: existing?.contributionBars || [
                    { label: '기획', value: 50 },
                    { label: '디자인', value: 50 },
                    { label: '퍼블', value: 50 }
                ],
                clientFeedback: existing?.clientFeedback || []
            };

            if (projectType === 'ai') {
                if (existing) {
                    dataManager.updateAIProject(editId, project);
                } else {
                    dataManager.addAIProject(project);
                }
                this.data = dataManager.getData();
                this.renderPortfolioAI();
            } else {
                if (existing) {
                    dataManager.updateTeamProject(editId, project);
                } else {
                    dataManager.addTeamProject(project);
                }
                this.data = dataManager.getData();
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
            <div class="form-group">
                <label class="form-label">위치</label>
                <input type="text" class="form-input" id="modal-interview-location" value="${existing?.location || ''}" placeholder="예: 강남역 2번출구">
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
            const location = document.getElementById('modal-interview-location').value.trim();

            if (!company || !date) {
                alert('회사명과 날짜를 입력해주세요.');
                return;
            }

            if (existing) {
                dataManager.updateInterview(editId, { company, date, time, location });
            } else {
                dataManager.addInterview({ company, date, time, location });
            }

            this.data = dataManager.getData();
            this.renderInterviews();
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    showThemeModal() {
        const content = `
            <div class="form-group">
                <label class="form-label">테마 이름</label>
                <input type="text" class="form-input" id="modal-theme-name" placeholder="예: 블루 테마">
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" id="modal-save">추가</button>
                <button class="btn btn-secondary" id="modal-cancel">취소</button>
            </div>
        `;

        this.openModal('새 테마 추가', content);

        document.getElementById('modal-save').addEventListener('click', () => {
            const name = document.getElementById('modal-theme-name').value.trim();

            if (!name) {
                alert('테마 이름을 입력해주세요.');
                return;
            }

            dataManager.addThemeMode({ name });
            this.data = dataManager.getData();
            this.renderThemeModes();
            this.renderFloatingThemePanel();
            this.closeModal();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }
}

// Initialize Admin Panel
// 동적 로드 시 DOMContentLoaded가 이미 발생했을 수 있으므로 즉시 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AdminPanel();
    });
} else {
    // DOM이 이미 로드됨
    new AdminPanel();
}
