// Admin Panel JavaScript

// Helper function to upload image to Firebase Storage
async function uploadImageToStorage(file, path = 'images') {
    try {
        const StorageManager = window.getStorageManager ? window.getStorageManager() : null;
        const userId = window.dataManager?.userId;

        console.log(`[Upload] Starting upload for ${file.name} (${(file.size/1024).toFixed(1)}KB) to ${path}`);
        console.log(`[Upload] StorageManager: ${!!StorageManager}, userId: ${userId ? 'yes' : 'no'}`);

        if (StorageManager && userId) {
            // Upload to Firebase Storage
            console.log('[Upload] Attempting Firebase Storage upload...');
            const result = await StorageManager.uploadImage(userId, file, path);
            if (result.success && result.url) {
                console.log('[Upload] Firebase Storage success:', result.url.substring(0, 50) + '...');
                return result.url;
            } else {
                console.warn('[Upload] Firebase Storage failed:', result.error);
                console.log('[Upload] Falling back to compressed base64...');
                return await fileToBase64(file);
            }
        } else {
            // Fallback to base64 for local storage
            console.log('[Upload] No Firebase available, using compressed base64...');
            return await fileToBase64(file);
        }
    } catch (error) {
        console.error('[Upload] Error:', error);
        console.log('[Upload] Falling back to compressed base64...');
        return await fileToBase64(file);
    }
}

// Convert file to base64 with compression (fallback)
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        // For images, compress them first
        if (file.type.startsWith('image/')) {
            compressImage(file, 800, 0.7).then(resolve).catch(() => {
                // Fallback to regular base64 if compression fails
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        } else {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        }
    });
}

// Compress image to reduce size for base64 storage
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if larger than maxWidth
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to compressed JPEG
                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedBase64.length * 0.75 / 1024).toFixed(1)}KB`);
                resolve(compressedBase64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
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

// Cache busting helper for images (especially Firebase Storage URLs)
function addImageCacheBuster(url) {
    if (!url) return url;
    // Skip data URLs (base64)
    if (url.startsWith('data:')) return url;

    // Add cache buster for Firebase Storage URLs or any http URLs
    if (url.includes('firebasestorage.googleapis.com') || url.includes('firebasestorage.app') || url.startsWith('http')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${Date.now()}`;
    }
    return url;
}

// Create image element with error handling
function createImageElement(url, alt = '', styles = '') {
    const cachedUrl = addImageCacheBuster(url);
    return `<img src="${cachedUrl}" alt="${alt}" style="${styles}" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<span style=\\'color:#999;font-size:12px;\\'>이미지 로드 실패</span>';">`;
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

        // Initialize section checkboxes
        this.initSectionCheckboxes();

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
        this.renderBackgroundSettings();

        // Initialize event listeners
        this.initEventListeners();
        this.initDragAndDrop();
        this.initModal();
        this.initImageUpload();
        this.initBackgroundUpload();

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

        // Click overlay to refresh minimap or navigate to section
        if (minimapOverlay) {
            minimapOverlay.addEventListener('click', (e) => {
                // Get click position relative to overlay
                const rect = minimapOverlay.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const totalHeight = rect.height;
                const ratio = clickY / totalHeight;

                // Map ratio to sections (approximate section positions)
                // These are rough estimates based on typical portfolio layout
                let targetSection = null;
                if (ratio < 0.15) {
                    targetSection = 'about'; // 자기소개 (hero + profile area)
                } else if (ratio < 0.25) {
                    targetSection = 'aitools'; // AI 도구
                } else if (ratio < 0.35) {
                    targetSection = 'related'; // 관련경력
                } else if (ratio < 0.45) {
                    targetSection = 'evaluation'; // 내평가
                } else if (ratio < 0.55) {
                    targetSection = 'video'; // 영상
                } else if (ratio < 0.85) {
                    targetSection = 'web-mobile'; // 작품 섹션들
                } else {
                    targetSection = 'contact'; // 연락처
                }

                // Try to scroll to the section in admin
                this.scrollToAdminSection(targetSection);

                // Also refresh minimap
                this.refreshMinimap();
            });
        }

        // Add click handlers to section labels for navigation
        this.initSectionLabelClicks();

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

        // Auto-refresh minimap every 3 seconds when editing
        this.startMinimapAutoRefresh();
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

    // Scroll to section settings in admin panel
    scrollToAdminSection(sectionKey) {
        // Map section keys to admin section IDs
        const sectionMap = {
            'about': 'section-about',
            'aitools': 'section-about', // AI tools are in about section
            'related': 'section-about', // Related experience in about section
            'other': 'section-about',
            'evaluation': 'section-about',
            'video': 'section-about',
            'web-mobile': 'section-web-mobile',
            'popup-banner': 'section-popup-banner',
            'detail-page': 'section-detail-page',
            'portfolio': 'section-web-mobile', // Default portfolio section
            'contact': 'section-contact'
        };

        const targetId = sectionMap[sectionKey];
        if (!targetId) return;

        // Try to find the section
        let targetEl = document.getElementById(targetId);

        // If not found, try with # prefix
        if (!targetEl) {
            targetEl = document.querySelector(`.section-anchor#${targetId}`);
        }

        // Fallback: try to find by section title text
        if (!targetEl) {
            const allSections = document.querySelectorAll('.settings-section');
            const sectionTitles = {
                'about': '자기소개',
                'aitools': 'AI',
                'contact': 'Contact',
                'web-mobile': '웹',
                'popup-banner': '팝업',
                'detail-page': '상세'
            };
            const searchText = sectionTitles[sectionKey] || sectionKey;
            allSections.forEach(section => {
                const title = section.querySelector('.settings-section-title');
                if (title && title.textContent.includes(searchText)) {
                    targetEl = section;
                }
            });
        }

        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Highlight briefly
            targetEl.style.outline = '2px solid var(--color-primary)';
            setTimeout(() => {
                targetEl.style.outline = '';
            }, 1500);
        }
    }

    // Add click handlers to section labels for quick navigation
    initSectionLabelClicks() {
        const sectionLabels = document.querySelectorAll('.section-setting-item label');

        sectionLabels.forEach(label => {
            label.style.cursor = 'pointer';
            label.addEventListener('click', (e) => {
                // Don't trigger if clicking on checkbox
                if (e.target.tagName === 'INPUT') return;

                const item = label.closest('.section-setting-item');
                const sectionKey = item?.dataset.section;

                if (sectionKey) {
                    this.scrollToAdminSection(sectionKey);
                }
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
            // Add cache-busting parameter to force reload
            const currentSrc = minimapFrame.src.split('?')[0].split('#')[0];
            const userId = this.minimapUserId;
            const userParam = userId ? `u=${userId}&` : '';
            minimapFrame.src = `${currentSrc}?${userParam}t=${Date.now()}`;
        }
    }

    // =====================
    // Page Tabs
    // =====================
    initPageTabs() {
        const self = this;
        const menuSection = document.getElementById('menu-management-section');

        const updateMenuVisibility = (page) => {
            console.log('updateMenuVisibility called with page:', page);
            if (menuSection) {
                const shouldShow = (page === 'solo' || page === 'skin');
                menuSection.style.display = shouldShow ? 'block' : 'none';
                console.log('Menu section display:', menuSection.style.display);
            } else {
                console.log('Menu section not found!');
            }
        };

        const switchToPage = (page) => {
            console.log('switchToPage called with:', page);
            self.currentPage = page;

            document.querySelectorAll('.admin-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            document.getElementById(`panel-${page}`)?.classList.add('active');

            // Sync minimap with page tab
            if (page === 'solo') {
                self.switchMinimapPage('portfolio');
            } else if (page === 'ai') {
                self.switchMinimapPage('ai');
            } else if (page === 'team') {
                self.switchMinimapPage('team');
            }

            // Show/hide menu management section (only for solo/skin pages)
            updateMenuVisibility(page);
        };

        const tabs = document.querySelectorAll('.page-tab');
        console.log('Found page-tabs:', tabs.length);

        tabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Tab clicked:', this.dataset.page);

                document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                const page = this.dataset.page;
                switchToPage(page);
            });
        });

        // Initialize menu visibility based on current active tab
        const activeTab = document.querySelector('.page-tab.active');
        if (activeTab) {
            console.log('Initial active tab:', activeTab.dataset.page);
            updateMenuVisibility(activeTab.dataset.page);
        }
    }

    updateMinimapNavActive(page) {
        document.querySelectorAll('.minimap-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
    }

    // =====================
    // Section Checkboxes
    // =====================
    initSectionCheckboxes() {
        const sectionIds = ['about', 'aitools', 'related', 'other', 'evaluation', 'video', 'portfolio', 'contact'];

        // Load saved settings
        const sectionSettings = this.data.sectionSettings || {};
        const sectionOrder = this.data.sectionOrder || sectionIds;

        // Reorder the list items based on sectionOrder
        this.renderSectionOrder(sectionOrder);

        sectionIds.forEach(id => {
            const checkbox = document.getElementById(`section-${id}`);
            if (checkbox) {
                // Set initial value
                checkbox.checked = sectionSettings[id] !== false;

                // Add change listener
                checkbox.addEventListener('change', () => {
                    this.saveSectionSettings();
                });
            }
        });

        // Photo checkbox for about section
        const photoCheckbox = document.getElementById('section-about-photo');
        if (photoCheckbox) {
            photoCheckbox.checked = sectionSettings.aboutPhoto !== false;
            photoCheckbox.addEventListener('change', () => {
                this.saveSectionSettings();
            });
        }

        // Initialize drag-to-reorder
        this.initSectionDragReorder();
    }

    renderSectionOrder(sectionOrder) {
        const listContainer = document.getElementById('section-settings-list');
        if (!listContainer) return;

        const items = Array.from(listContainer.querySelectorAll('.section-setting-item[data-section]'));
        const photoSub = listContainer.querySelector('.section-setting-sub');

        // Sort items based on sectionOrder
        items.sort((a, b) => {
            const aSection = a.dataset.section;
            const bSection = b.dataset.section;
            const aIndex = sectionOrder.indexOf(aSection);
            const bIndex = sectionOrder.indexOf(bSection);
            return aIndex - bIndex;
        });

        // Clear and re-append in order
        items.forEach(item => {
            listContainer.appendChild(item);
            // Keep photo sub-item after about
            if (item.dataset.section === 'about' && photoSub) {
                listContainer.appendChild(photoSub);
            }
        });
    }

    initSectionDragReorder() {
        const listContainer = document.getElementById('section-settings-list');
        if (!listContainer) return;

        let draggedItem = null;

        const items = listContainer.querySelectorAll('.section-setting-item[data-section]');

        items.forEach(item => {
            item.draggable = true;

            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedItem = null;
                this.saveSectionOrder();
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            item.addEventListener('dragenter', (e) => {
                e.preventDefault();
                if (draggedItem && draggedItem !== item) {
                    const rect = item.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;

                    if (e.clientY < midY) {
                        listContainer.insertBefore(draggedItem, item);
                    } else {
                        const nextItem = item.nextElementSibling;
                        // Skip the photo sub-item
                        if (nextItem && nextItem.classList.contains('section-setting-sub')) {
                            listContainer.insertBefore(draggedItem, nextItem.nextElementSibling);
                        } else {
                            listContainer.insertBefore(draggedItem, nextItem);
                        }
                    }

                    // Keep photo sub-item after about
                    const aboutItem = listContainer.querySelector('[data-section="about"]');
                    const photoSub = listContainer.querySelector('.section-setting-sub');
                    if (aboutItem && photoSub) {
                        aboutItem.after(photoSub);
                    }
                }
            });
        });
    }

    saveSectionOrder() {
        const listContainer = document.getElementById('section-settings-list');
        if (!listContainer) return;

        const items = listContainer.querySelectorAll('.section-setting-item[data-section]');
        const sectionOrder = Array.from(items).map(item => item.dataset.section);

        dataManager.set('sectionOrder', sectionOrder);
        dataManager.saveData();

        // Refresh minimap to show changes
        this.refreshMinimap();
    }

    saveSectionSettings() {
        const sectionIds = ['about', 'aitools', 'related', 'other', 'evaluation', 'video', 'portfolio', 'contact'];
        const sectionSettings = {};

        sectionIds.forEach(id => {
            const checkbox = document.getElementById(`section-${id}`);
            if (checkbox) {
                sectionSettings[id] = checkbox.checked;
                console.log(`Section ${id}: ${checkbox.checked}`);
            } else {
                console.warn(`Checkbox not found: section-${id}`);
            }
        });

        // Photo setting for about section
        const photoCheckbox = document.getElementById('section-about-photo');
        if (photoCheckbox) {
            sectionSettings.aboutPhoto = photoCheckbox.checked;
            console.log(`Section aboutPhoto: ${photoCheckbox.checked}`);
        }

        console.log('Saving sectionSettings:', JSON.stringify(sectionSettings));
        dataManager.set('sectionSettings', sectionSettings);
        dataManager.saveData().then(() => {
            // Verify the save
            const savedData = dataManager.getData();
            console.log('After save, sectionSettings in dataManager:', JSON.stringify(savedData.sectionSettings));
        });

        // Refresh minimap to show changes (with slight delay to ensure save completes)
        setTimeout(() => {
            this.refreshMinimap();
        }, 100);
    }

    // =====================
    // Resize Handle
    // =====================
    initResizeHandle() {
        const handle = document.getElementById('resize-handle');
        const rightPanel = document.getElementById('right-panel');
        const adminMain = document.querySelector('.admin-main');
        const minimap = document.getElementById('site-minimap');

        if (!handle || !rightPanel) {
            console.log('Resize handle or right panel not found');
            return;
        }

        console.log('Resize handle initialized');

        let isResizing = false;
        let startX = 0;
        let startWidth = 400;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = rightPanel.offsetWidth;
            handle.classList.add('active');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
            console.log('Resize started, initial width:', startWidth);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const diff = startX - e.clientX;
            const newWidth = Math.min(Math.max(startWidth + diff, 300), 700);

            // Update right panel width
            rightPanel.style.width = newWidth + 'px';
            // Handle position = panel width + panel right margin (20px) + gap (10px)
            handle.style.right = (newWidth + 30) + 'px';

            if (adminMain) {
                // Admin main margin = panel width + panel right margin + handle width + gap
                adminMain.style.marginRight = (newWidth + 50) + 'px';
            }

            // Adjust minimap iframe scale based on panel width
            this.updateMinimapScale(newWidth);
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                handle.classList.remove('active');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                // Save width preference
                localStorage.setItem('rightPanelWidth', rightPanel.offsetWidth);
            }
        });

        // Restore saved width or use default
        const savedWidth = localStorage.getItem('rightPanelWidth');
        const initialWidth = savedWidth ? parseInt(savedWidth) : 440;

        if (savedWidth) {
            rightPanel.style.width = initialWidth + 'px';
            handle.style.right = (initialWidth + 30) + 'px';
            if (adminMain) {
                adminMain.style.marginRight = (initialWidth + 50) + 'px';
            }
        }

        // Always set initial minimap scale
        this.updateMinimapScale(initialWidth);
    }

    updateMinimapScale(panelWidth) {
        const minimapFrame = document.getElementById('minimap-frame');
        if (!minimapFrame) return;

        // Base: 400px panel uses 0.25 scale (shows full width site scaled down)
        // Larger panel: proportionally larger scale to show more detail
        // Scale range: 0.25 (at 300px) to 0.45 (at 700px)
        const minWidth = 300;
        const maxWidth = 700;
        const minScale = 0.25;
        const maxScale = 0.45;

        const ratio = (panelWidth - minWidth) / (maxWidth - minWidth);
        const scale = minScale + ratio * (maxScale - minScale);

        // Calculate iframe size based on scale (inverse relationship)
        const iframeWidth = 100 / scale;
        const iframeHeight = 100 / scale;

        minimapFrame.style.width = iframeWidth + '%';
        minimapFrame.style.height = iframeHeight + '%';
        minimapFrame.style.transform = `scale(${scale})`;
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
                    preview.innerHTML = createImageElement(imageUrl, '프로필', 'max-width: 100%; max-height: 100%; object-fit: contain;');
                    urlInput.value = imageUrl;
                    hideUploadLoading(preview);

                    // Save immediately after upload
                    dataManager.set('profile.profileImage', imageUrl);
                    await dataManager.saveData();
                    this.refreshMinimap();
                }
            });
        }

        // URL input change for profile
        urlInput?.addEventListener('change', () => {
            if (urlInput.value) {
                const preview = document.getElementById('profile-image-preview');
                preview.innerHTML = createImageElement(urlInput.value, '프로필', 'max-width: 100%; max-height: 100%; object-fit: contain;');
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
                    this.updateLogoPreview(imageUrl + '?t=' + Date.now());
                    hideUploadLoading(logoPreview);

                    // Save immediately after upload
                    dataManager.set('siteSettings.logo.imageUrl', imageUrl);
                    await dataManager.saveData();
                    this.refreshMinimap();
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
            logoPreview.innerHTML = createImageElement(src, '로고', 'max-width: 100%; max-height: 100%; object-fit: contain;');
        } else if (logoPreview) {
            logoPreview.innerHTML = `<span style="color: var(--color-text-muted); font-size: var(--font-xs);">미리보기</span>`;
        }
    }

    // =====================
    // Save All
    // =====================
    async saveAll() {
        // Show saving indicator
        this.showToast('저장 중...', 'info');

        try {
            // Collect all form data and save
            this.saveSiteSettings();
            this.saveProfile();
            this.saveEvaluation();
            this.saveVideo();
            this.saveContact();
            this.saveEmojiIcons();
            this.saveCSSVariables();
            this.saveAllThemes();

            // Save to Firebase/localStorage
            await dataManager.saveData();

            // Update header with new name if changed
            this.setUserNameInHeader();

            // Refresh minimap
            this.refreshMinimap();

            // Show success message
            this.showToast('✓ 저장 완료!', 'success');
            console.log('All settings saved successfully');
        } catch (error) {
            console.error('Save error:', error);
            this.showToast('저장 실패: ' + error.message, 'error');
        }
    }

    // Toast notification
    showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.admin-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `admin-toast admin-toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: toastSlideIn 0.3s ease;
            ${type === 'success' ? 'background: #27ae60; color: white;' : ''}
            ${type === 'error' ? 'background: #e74c3c; color: white;' : ''}
            ${type === 'info' ? 'background: #3498db; color: white;' : ''}
        `;

        document.body.appendChild(toast);

        // Auto remove after 2 seconds (except for info which stays until replaced)
        if (type !== 'info') {
            setTimeout(() => toast.remove(), 2000);
        }
    }

    saveSiteSettings() {
        const logoType = document.getElementById('logo-type').value;
        const logoText = document.getElementById('logo-text').value;
        const logoImageUrl = document.getElementById('logo-image-url').value;
        const fontTitle = document.getElementById('font-title').value;
        const fontContent = document.getElementById('font-content').value;
        const fontFaceAll = document.getElementById('font-face-all')?.value || '';
        const fontColorTitle1 = document.getElementById('font-color-title1-text').value || '#212529';
        const fontColorTitle2 = document.getElementById('font-color-title2-text').value || '#212529';
        const fontColorContent = document.getElementById('font-color-content-text').value || '#212529';

        // Font sizes
        const fontSizes = {
            '5xl': document.getElementById('font-size-5xl')?.value || '3rem',
            '4xl': document.getElementById('font-size-4xl')?.value || '2.25rem',
            '3xl': document.getElementById('font-size-3xl')?.value || '1.875rem',
            '2xl': document.getElementById('font-size-2xl')?.value || '1.5rem',
            'base': document.getElementById('font-size-base')?.value || '1rem',
            'sm': document.getElementById('font-size-sm')?.value || '0.875rem'
        };

        // Font colors per level
        const fontColors = {
            '5xl': document.getElementById('font-color-5xl')?.value || '#212529',
            '4xl': document.getElementById('font-color-4xl')?.value || '#212529',
            '3xl': document.getElementById('font-color-3xl')?.value || '#212529',
            '2xl': document.getElementById('font-color-2xl')?.value || '#495057',
            'base': document.getElementById('font-color-base')?.value || '#495057',
            'sm': document.getElementById('font-color-sm')?.value || '#6c757d'
        };

        dataManager.updateSiteSettings({
            logo: { type: logoType, text: logoText, imageUrl: logoImageUrl },
            font: {
                title: fontTitle,
                content: fontContent,
                fontFaceAll: fontFaceAll,
                fontSizes: fontSizes,
                fontColors: fontColors,
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
        const settings = this.data.siteSettings || {};

        // Logo - with null checks
        const logoTypeEl = document.getElementById('logo-type');
        const logoTextEl = document.getElementById('logo-text');
        const logoImageUrlEl = document.getElementById('logo-image-url');

        if (logoTypeEl) logoTypeEl.value = settings.logo?.type || 'text';
        if (logoTextEl) logoTextEl.value = settings.logo?.text || '';
        if (logoImageUrlEl) logoImageUrlEl.value = settings.logo?.imageUrl || '';

        // Show/hide based on type
        const textGroup = document.getElementById('logo-text-group');
        const imageGroup = document.getElementById('logo-image-group');
        if (textGroup && imageGroup && settings.logo?.type === 'image') {
            textGroup.style.display = 'none';
            imageGroup.style.display = 'block';
            this.updateLogoPreview(settings.logo?.imageUrl);
        }

        // Font - with null checks
        const fontTitleEl = document.getElementById('font-title');
        const fontContentEl = document.getElementById('font-content');
        if (fontTitleEl) fontTitleEl.value = settings.font?.title || 'Paperozi';
        if (fontContentEl) fontContentEl.value = settings.font?.content || 'Paperozi';

        // Font-face all (combined)
        const fontFaceAllEl = document.getElementById('font-face-all');
        if (fontFaceAllEl) {
            let fontFaceAll = settings.font?.fontFaceAll || '';
            if (!fontFaceAll && (settings.font?.fontFaceTitle || settings.font?.fontFaceContent)) {
                fontFaceAll = [settings.font?.fontFaceTitle, settings.font?.fontFaceContent].filter(Boolean).join('\n\n');
            }
            fontFaceAllEl.value = fontFaceAll;
        }

        // Font sizes - with null checks
        const fontSizes = settings.font?.fontSizes || {};
        const fontSizeEl5xl = document.getElementById('font-size-5xl');
        const fontSizeEl4xl = document.getElementById('font-size-4xl');
        const fontSizeEl3xl = document.getElementById('font-size-3xl');
        const fontSizeEl2xl = document.getElementById('font-size-2xl');
        const fontSizeElBase = document.getElementById('font-size-base');
        const fontSizeElSm = document.getElementById('font-size-sm');

        if (fontSizeEl5xl) fontSizeEl5xl.value = fontSizes['5xl'] || '3rem';
        if (fontSizeEl4xl) fontSizeEl4xl.value = fontSizes['4xl'] || '2.25rem';
        if (fontSizeEl3xl) fontSizeEl3xl.value = fontSizes['3xl'] || '1.875rem';
        if (fontSizeEl2xl) fontSizeEl2xl.value = fontSizes['2xl'] || '1.5rem';
        if (fontSizeElBase) fontSizeElBase.value = fontSizes['base'] || '1rem';
        if (fontSizeElSm) fontSizeElSm.value = fontSizes['sm'] || '0.875rem';

        // Font Colors - with null checks
        const fontColors = settings.font?.colors || {};
        const colorTitle1 = fontColors.title1 || '#212529';
        const colorTitle2 = fontColors.title2 || '#212529';
        const colorContent = fontColors.content || '#212529';

        const fontColorTitle1El = document.getElementById('font-color-title1');
        const fontColorTitle1TextEl = document.getElementById('font-color-title1-text');
        const fontColorTitle2El = document.getElementById('font-color-title2');
        const fontColorTitle2TextEl = document.getElementById('font-color-title2-text');
        const fontColorContentEl = document.getElementById('font-color-content');
        const fontColorContentTextEl = document.getElementById('font-color-content-text');

        if (fontColorTitle1El) fontColorTitle1El.value = colorTitle1;
        if (fontColorTitle1TextEl) fontColorTitle1TextEl.value = colorTitle1;
        if (fontColorTitle2El) fontColorTitle2El.value = colorTitle2;
        if (fontColorTitle2TextEl) fontColorTitle2TextEl.value = colorTitle2;
        if (fontColorContentEl) fontColorContentEl.value = colorContent;
        if (fontColorContentTextEl) fontColorContentTextEl.value = colorContent;

        // Sync color picker with text input
        this.setupColorSync('font-color-title1');
        this.setupColorSync('font-color-title2');
        this.setupColorSync('font-color-content');

        // Per-level font colors
        const fontColorsPerLevel = settings.font?.fontColors || {};
        const colorLevels = ['5xl', '4xl', '3xl', '2xl', 'base', 'sm'];
        const defaultColors = {
            '5xl': '#212529',
            '4xl': '#212529',
            '3xl': '#212529',
            '2xl': '#495057',
            'base': '#495057',
            'sm': '#6c757d'
        };

        colorLevels.forEach(level => {
            const colorEl = document.getElementById('font-color-' + level);
            const previewEl = document.getElementById('preview-' + level);
            const colorValue = fontColorsPerLevel[level] || defaultColors[level];

            if (colorEl) {
                colorEl.value = colorValue;
                // Add event listener for real-time preview update
                colorEl.addEventListener('input', (e) => {
                    if (previewEl) {
                        previewEl.style.color = e.target.value;
                    }
                });
            }
            if (previewEl) {
                previewEl.style.color = colorValue;
            }
        });

        // Also add event listeners for font size inputs to update preview
        colorLevels.forEach(level => {
            const sizeEl = document.getElementById('font-size-' + level);
            const previewEl = document.getElementById('preview-' + level);
            if (sizeEl && previewEl) {
                sizeEl.addEventListener('input', (e) => {
                    previewEl.style.fontSize = e.target.value;
                });
            }
        });
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
            preview.innerHTML = createImageElement(profile.profileImage, '프로필', 'max-width: 100%; max-height: 100%; object-fit: contain;');
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

                            // Save immediately after upload
                            this.saveEmojiIcons();
                            await dataManager.saveData();
                            this.refreshMinimap();
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
            // Add cache-busting parameter
            const url = data.imageUrl + (data.imageUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
            previewEl.innerHTML = `<img src="${url}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
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
        const vars = this.data.cssVariables || {};

        // Border radius settings
        const radiusSm = document.getElementById('css-radius-sm');
        const radiusMd = document.getElementById('css-radius-md');
        const radiusLg = document.getElementById('css-radius-lg');

        if (radiusSm) radiusSm.value = vars.radiusSm || '4px';
        if (radiusMd) radiusMd.value = vars.radiusMd || '8px';
        if (radiusLg) radiusLg.value = vars.radiusLg || '12px';

        // Space settings
        const spaceSection = document.getElementById('css-space-section');
        const spaceContent = document.getElementById('css-space-content');

        if (spaceSection) spaceSection.value = vars.spaceSection || '6rem';
        if (spaceContent) spaceContent.value = vars.spaceContent || '1.5rem';

        // Font size settings (new IDs)
        const fontSizes = this.data.fontSettings?.sizes || {};
        const fontSizeInputs = {
            'font-size-5xl': fontSizes['5xl'] || '3rem',
            'font-size-4xl': fontSizes['4xl'] || '2.25rem',
            'font-size-3xl': fontSizes['3xl'] || '1.875rem',
            'font-size-2xl': fontSizes['2xl'] || '1.5rem',
            'font-size-base': fontSizes['base'] || '1rem',
            'font-size-sm': fontSizes['sm'] || '0.875rem'
        };

        Object.entries(fontSizeInputs).forEach(([id, defaultValue]) => {
            const el = document.getElementById(id);
            if (el) el.value = defaultValue;
        });

        // Font color settings per level
        const fontColors = this.data.fontSettings?.fontColors || {};
        const fontColorInputs = {
            'font-color-5xl': fontColors['5xl'] || '#212529',
            'font-color-4xl': fontColors['4xl'] || '#212529',
            'font-color-3xl': fontColors['3xl'] || '#212529',
            'font-color-2xl': fontColors['2xl'] || '#495057',
            'font-color-base': fontColors['base'] || '#495057',
            'font-color-sm': fontColors['sm'] || '#6c757d'
        };

        Object.entries(fontColorInputs).forEach(([id, defaultValue]) => {
            const el = document.getElementById(id);
            if (el) {
                el.value = defaultValue;
                // Also update the preview color
                const level = id.replace('font-color-', '');
                const previewEl = document.getElementById('preview-' + level);
                if (previewEl) {
                    previewEl.style.color = defaultValue;
                }
            }
        });
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
        const introToggle = document.getElementById('page-enable-intro');
        const aiToggle = document.getElementById('page-enable-ai');
        const teamToggle = document.getElementById('page-enable-team');

        const pageSettings = {
            intro: introToggle ? introToggle.checked : true,
            ai: aiToggle ? aiToggle.checked : true,
            team: teamToggle ? teamToggle.checked : true
        };

        console.log('Saving pageSettings:', JSON.stringify(pageSettings));
        dataManager.set('pageSettings', pageSettings);
        dataManager.saveData();

        // Refresh minimap to show changes
        this.refreshMinimap();

        // Refresh minimap to show changes
        this.refreshMinimap();
    }

    // =====================
    // Background Settings
    // =====================
    renderBackgroundSettings() {
        const bgSettings = this.data.backgroundSettings || {};

        // Body background
        const bodyBg = bgSettings.body || {};
        const bgBodyImageEl = document.getElementById('bg-body-image');
        const bgBodySizeEl = document.getElementById('bg-body-size');
        const bgBodyPositionEl = document.getElementById('bg-body-position');
        const bgBodyRepeatEl = document.getElementById('bg-body-repeat');
        const bgBodyAttachmentEl = document.getElementById('bg-body-attachment');
        const bgBodyOpacityEl = document.getElementById('bg-body-opacity');

        if (bgBodyImageEl) bgBodyImageEl.value = bodyBg.image || '';
        if (bgBodySizeEl) bgBodySizeEl.value = bodyBg.size || 'cover';
        if (bgBodyPositionEl) bgBodyPositionEl.value = bodyBg.position || 'center center';
        if (bgBodyRepeatEl) bgBodyRepeatEl.value = bodyBg.repeat || 'no-repeat';
        if (bgBodyAttachmentEl) bgBodyAttachmentEl.value = bodyBg.attachment || 'scroll';
        if (bgBodyOpacityEl) bgBodyOpacityEl.value = bodyBg.opacity ?? 1;

        // Update body preview
        this.updateBackgroundPreview('body', bodyBg.image);

        // Section backgrounds
        ['about', 'portfolio', 'contact'].forEach(section => {
            const sectionBg = bgSettings[section] || {};
            const imageEl = document.getElementById(`bg-${section}-image`);
            const colorEl = document.getElementById(`bg-${section}-color`);
            const colorTextEl = document.getElementById(`bg-${section}-color-text`);

            if (imageEl) imageEl.value = sectionBg.image || '';
            if (colorEl) colorEl.value = sectionBg.color || '#ffffff';
            if (colorTextEl) colorTextEl.value = sectionBg.color || '#ffffff';

            this.updateBackgroundPreview(section, sectionBg.image);

            // Sync color inputs
            if (colorEl && colorTextEl) {
                colorEl.addEventListener('input', () => {
                    colorTextEl.value = colorEl.value;
                });
                colorTextEl.addEventListener('input', () => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(colorTextEl.value)) {
                        colorEl.value = colorTextEl.value;
                    }
                });
            }
        });

        // Save button
        document.getElementById('btn-save-backgrounds')?.addEventListener('click', () => {
            this.saveBackgroundSettings();
        });
    }

    updateBackgroundPreview(section, imageUrl) {
        const previewEl = document.getElementById(`bg-${section}-preview`);
        if (!previewEl) return;

        if (imageUrl) {
            previewEl.innerHTML = createImageElement(imageUrl, '', 'width: 100%; height: 100%; object-fit: cover;');
        } else {
            previewEl.innerHTML = '<span style="color: var(--color-text-muted); font-size: 10px;">미리보기</span>';
        }
    }

    initBackgroundUpload() {
        // Body background upload
        const bodyFileInput = document.getElementById('bg-body-file');
        const bodyUploadBtn = document.getElementById('btn-bg-body-upload');
        const bodyUrlInput = document.getElementById('bg-body-image');

        console.log('initBackgroundUpload - bodyFileInput:', !!bodyFileInput, ', bodyUploadBtn:', !!bodyUploadBtn);

        if (bodyUploadBtn && bodyFileInput) {
            bodyUploadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Background upload button clicked');
                bodyFileInput.click();
            });

            bodyFileInput.addEventListener('change', async (e) => {
                console.log('Body file input changed');
                const file = e.target.files[0];
                if (file) {
                    console.log('File selected:', file.name, file.type);
                    const previewEl = document.getElementById('bg-body-preview');
                    showUploadLoading(previewEl);

                    try {
                        const imageUrl = await uploadImageToStorage(file, 'backgrounds');
                        console.log('Upload result:', imageUrl);
                        bodyUrlInput.value = imageUrl;
                        this.updateBackgroundPreview('body', imageUrl);
                    } catch (error) {
                        console.error('Upload error:', error);
                        alert('이미지 업로드 중 오류가 발생했습니다.');
                    }

                    hideUploadLoading(previewEl);
                    bodyFileInput.value = '';
                }
            });
        } else {
            console.warn('Background upload elements not found - bodyFileInput:', !!bodyFileInput, ', bodyUploadBtn:', !!bodyUploadBtn);
        }

        // URL input change
        bodyUrlInput?.addEventListener('change', () => {
            this.updateBackgroundPreview('body', bodyUrlInput.value);
        });

        // Section background uploads
        const sectionBtns = document.querySelectorAll('.section-bg-upload');
        console.log('Section bg upload buttons found:', sectionBtns.length);

        sectionBtns.forEach(btn => {
            const section = btn.dataset.section;
            const fileInput = document.getElementById(`bg-${section}-file`);
            const urlInput = document.getElementById(`bg-${section}-image`);

            console.log(`Section ${section} - fileInput:`, !!fileInput, ', urlInput:', !!urlInput);

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Section ${section} upload button clicked`);
                if (fileInput) {
                    fileInput.click();
                } else {
                    console.error(`File input not found for section: ${section}`);
                }
            });

            fileInput?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const previewEl = document.getElementById(`bg-${section}-preview`);
                    showUploadLoading(previewEl);

                    const imageUrl = await uploadImageToStorage(file, 'backgrounds');
                    urlInput.value = imageUrl;
                    this.updateBackgroundPreview(section, imageUrl);

                    hideUploadLoading(previewEl);
                    fileInput.value = '';
                }
            });

            urlInput?.addEventListener('change', () => {
                this.updateBackgroundPreview(section, urlInput.value);
            });
        });
    }

    saveBackgroundSettings() {
        const bgSettings = {
            body: {
                image: document.getElementById('bg-body-image')?.value || '',
                size: document.getElementById('bg-body-size')?.value || 'cover',
                position: document.getElementById('bg-body-position')?.value || 'center center',
                repeat: document.getElementById('bg-body-repeat')?.value || 'no-repeat',
                attachment: document.getElementById('bg-body-attachment')?.value || 'scroll',
                opacity: parseFloat(document.getElementById('bg-body-opacity')?.value || 1)
            }
        };

        // Section backgrounds
        ['about', 'portfolio', 'contact'].forEach(section => {
            bgSettings[section] = {
                image: document.getElementById(`bg-${section}-image`)?.value || '',
                color: document.getElementById(`bg-${section}-color`)?.value || ''
            };
        });

        dataManager.set('backgroundSettings', bgSettings);
        dataManager.saveData();

        // Refresh minimap to show changes
        this.refreshMinimap();

        alert('배경 설정이 저장되었습니다.');
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
                            ${createImageElement(url, '', 'width: 100%; height: 100%; object-fit: cover;')}
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
            this.refreshMinimap();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    updateThumbnailPreview(container, thumbnails) {
        container.innerHTML = thumbnails.map((url, i) => `
            <div class="thumbnail-preview-item" data-index="${i}" style="position: relative; width: 80px; height: 80px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden;">
                ${createImageElement(url, '', 'width: 100%; height: 100%; object-fit: cover;')}
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
                ${createImageElement(url, '', 'width: 100%; height: 100%; object-fit: cover;')}
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
                <label class="form-label">기여도 (역할별 %)</label>
                <div id="modal-contribution-bars">
                    ${(existing?.contributionBars || [
                        { label: '기획', value: 50 },
                        { label: '디자인', value: 50 },
                        { label: '퍼블', value: 50 }
                    ]).map((bar, i) => `
                        <div class="contribution-bar-item" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                            <input type="text" class="form-input contribution-label" value="${bar.label}" placeholder="역할명" style="width: 100px;">
                            <input type="range" class="contribution-range" value="${bar.value}" min="0" max="100" style="flex: 1;">
                            <span class="contribution-value" style="width: 40px; text-align: right;">${bar.value}%</span>
                            <button type="button" class="btn-remove-contribution" style="width: 24px; height: 24px; border-radius: 50%; background: #e74c3c; color: white; border: none; cursor: pointer; font-size: 12px;">✕</button>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-add-project-contribution" style="margin-top: 8px;">+ 기여도 추가</button>
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
                            ${createImageElement(url, '', 'width: 100%; height: 100%; object-fit: cover;')}
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

        // Contribution bars event listeners
        this.bindContributionBars();

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

            // Get contribution bars from modal
            const contributionBars = [];
            const contributionItems = document.querySelectorAll('#modal-contribution-bars .contribution-bar-item');
            contributionItems.forEach(item => {
                const label = item.querySelector('.contribution-label')?.value.trim();
                const value = parseInt(item.querySelector('.contribution-range')?.value) || 0;
                if (label) {
                    contributionBars.push({ label, value });
                }
            });

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
                contributionBars: contributionBars.length > 0 ? contributionBars : [
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
            this.refreshMinimap();
        });

        document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    }

    bindContributionBars() {
        const container = document.getElementById('modal-contribution-bars');
        if (!container) return;

        // Range slider value display update
        const updateRangeDisplays = () => {
            container.querySelectorAll('.contribution-bar-item').forEach(item => {
                const range = item.querySelector('.contribution-range');
                const display = item.querySelector('.contribution-value');
                if (range && display) {
                    range.addEventListener('input', () => {
                        display.textContent = range.value + '%';
                    });
                }
            });
        };
        updateRangeDisplays();

        // Remove button
        container.querySelectorAll('.btn-remove-contribution').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const items = container.querySelectorAll('.contribution-bar-item');
                if (items.length > 1) {
                    e.target.closest('.contribution-bar-item').remove();
                } else {
                    alert('최소 1개의 기여도가 필요합니다.');
                }
            });
        });

        // Add button
        const addBtn = document.getElementById('btn-add-project-contribution');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const newItem = document.createElement('div');
                newItem.className = 'contribution-bar-item';
                newItem.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center;';
                newItem.innerHTML = `
                    <input type="text" class="form-input contribution-label" value="" placeholder="역할명" style="width: 100px;">
                    <input type="range" class="contribution-range" value="50" min="0" max="100" style="flex: 1;">
                    <span class="contribution-value" style="width: 40px; text-align: right;">50%</span>
                    <button type="button" class="btn-remove-contribution" style="width: 24px; height: 24px; border-radius: 50%; background: #e74c3c; color: white; border: none; cursor: pointer; font-size: 12px;">✕</button>
                `;
                container.appendChild(newItem);

                // Bind events for new item
                const range = newItem.querySelector('.contribution-range');
                const display = newItem.querySelector('.contribution-value');
                range.addEventListener('input', () => {
                    display.textContent = range.value + '%';
                });

                newItem.querySelector('.btn-remove-contribution').addEventListener('click', (e) => {
                    const items = container.querySelectorAll('.contribution-bar-item');
                    if (items.length > 1) {
                        newItem.remove();
                    } else {
                        alert('최소 1개의 기여도가 필요합니다.');
                    }
                });
            });
        }
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
