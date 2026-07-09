// Main Application JavaScript

// Escape user-entered section titles before injecting into innerHTML.
function escapeTitle(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// =====================
// Cache Busting Helper
// =====================
function addCacheBuster(url) {
    if (!url) return url;
    // Add cache buster for Firebase Storage URLs or any http URLs
    if (url.includes('firebasestorage.googleapis.com') || url.includes('firebasestorage.app')) {
        const separator = url.includes('?') ? '&' : '?';
        // Use a version based on the current hour to limit re-fetches
        const version = Math.floor(Date.now() / 3600000); // Changes every hour
        return `${url}${separator}v=${version}`;
    }
    return url;
}

// =====================
// Smooth Scroll Navigation
// =====================
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Handle nav link clicks
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                this.scrollToSection(targetId);
            });
        });

        // Handle section nav dots
        document.querySelectorAll('.section-nav-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const targetId = dot.dataset.section;
                this.scrollToSection(targetId);
            });
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.querySelector('.header')?.offsetHeight || 70;
            const targetPosition = section.offsetTop - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }
}

// =====================
// Section Observer
// =====================
class SectionObserver {
    constructor() {
        this.sections = [];
        this.currentSection = null;
        this.init();
    }

    init() {
        this.sections = Array.from(document.querySelectorAll('section[id]'));

        if (this.sections.length === 0) return;

        const options = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.setCurrentSection(entry.target.id);
                }
            });
        }, options);

        this.sections.forEach(section => observer.observe(section));

        // Update on scroll for header shadow
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 10);
            }
        });
    }

    setCurrentSection(sectionId) {
        this.currentSection = sectionId;

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === `#${sectionId}`);
        });

        // Update section nav dots
        document.querySelectorAll('.section-nav-dot').forEach(dot => {
            dot.classList.toggle('active', dot.dataset.section === sectionId);
        });
    }
}

// =====================
// Radar Chart
// =====================
class RadarChart {
    constructor(canvas, data) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.data = data;
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 50;

        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawData();
        this.drawLabels();
    }

    drawGrid() {
        const levels = 5;
        const sides = this.data.length;
        const angleStep = (Math.PI * 2) / sides;

        this.ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-border').trim() || '#dee2e6';
        this.ctx.lineWidth = 1;

        // Draw concentric polygons
        for (let level = 1; level <= levels; level++) {
            const levelRadius = (this.radius / levels) * level;
            this.ctx.beginPath();

            for (let i = 0; i <= sides; i++) {
                const angle = (angleStep * i) - (Math.PI / 2);
                const x = this.centerX + Math.cos(angle) * levelRadius;
                const y = this.centerY + Math.sin(angle) * levelRadius;

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }

            this.ctx.closePath();
            this.ctx.stroke();
        }

        // Draw axis lines
        for (let i = 0; i < sides; i++) {
            const angle = (angleStep * i) - (Math.PI / 2);
            const x = this.centerX + Math.cos(angle) * this.radius;
            const y = this.centerY + Math.sin(angle) * this.radius;

            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
    }

    drawData() {
        const sides = this.data.length;
        const angleStep = (Math.PI * 2) / sides;

        const primaryColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-primary').trim() || '#3498db';

        this.ctx.fillStyle = this.hexToRgba(primaryColor, 0.3);
        this.ctx.strokeStyle = primaryColor;
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();

        for (let i = 0; i <= sides; i++) {
            const index = i % sides;
            const angle = (angleStep * index) - (Math.PI / 2);
            const value = this.data[index].value / 100;
            const pointRadius = this.radius * value;
            const x = this.centerX + Math.cos(angle) * pointRadius;
            const y = this.centerY + Math.sin(angle) * pointRadius;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw data points
        for (let i = 0; i < sides; i++) {
            const angle = (angleStep * i) - (Math.PI / 2);
            const value = this.data[i].value / 100;
            const pointRadius = this.radius * value;
            const x = this.centerX + Math.cos(angle) * pointRadius;
            const y = this.centerY + Math.sin(angle) * pointRadius;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = primaryColor;
            this.ctx.fill();
        }
    }

    drawLabels() {
        const sides = this.data.length;
        const angleStep = (Math.PI * 2) / sides;
        const labelRadius = this.radius + 30;

        const textColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-text').trim() || '#212529';

        this.ctx.fillStyle = textColor;
        this.ctx.font = '14px Paperlogse, Pretendard, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let i = 0; i < sides; i++) {
            const angle = (angleStep * i) - (Math.PI / 2);
            const x = this.centerX + Math.cos(angle) * labelRadius;
            const y = this.centerY + Math.sin(angle) * labelRadius;

            this.ctx.fillText(this.data[i].label, x, y);
        }
    }

    hexToRgba(hex, alpha) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgba(52, 152, 219, ${alpha})`;
    }

    update(newData) {
        this.data = newData;
        this.draw();
    }
}

// =====================
// Theme Toggle
// =====================
class ThemeToggle {
    constructor() {
        this.themeToggle = document.querySelector('.theme-toggle');
        this.init();
    }

    init() {
        if (!this.themeToggle) return;

        const btn = this.themeToggle.querySelector('.theme-toggle-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                this.themeToggle.classList.toggle('open');
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.themeToggle.contains(e.target)) {
                this.themeToggle.classList.remove('open');
            }
        });

        // Theme option clicks
        this.themeToggle.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.dataset.theme;
                this.setTheme(themeId);
            });
        });
    }

    setTheme(themeId) {
        dataManager.setTheme(themeId);
        this.updateActiveOption(themeId);

        // Update radar chart if exists
        if (window.radarChart) {
            setTimeout(() => window.radarChart.draw(), 100);
        }
    }

    updateActiveOption(themeId) {
        this.themeToggle?.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === themeId);
        });
    }
}

// =====================
// PDF Export
// =====================
class PDFExport {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('[data-action="download-pdf"]').forEach(btn => {
            btn.addEventListener('click', () => this.exportPDF());
        });
    }

    async exportPDF() {
        // Show loading
        const btn = document.querySelector('[data-action="download-pdf"]');
        const originalText = btn?.textContent;
        if (btn) btn.textContent = 'PDF 생성 중...';

        try {
            // Use the PDFGenerator with Korean font support
            if (window.PDFGenerator) {
                await window.PDFGenerator.generateResume(dataManager.getData());
            } else {
                // Fallback to basic PDF generation
                await this.exportPDFBasic();
            }

            // Track PDF download
            if (window.AnalyticsManager) {
                const userId = window.getUrlUserId ? window.getUrlUserId() : null;
                window.AnalyticsManager.trackPdfDownload(userId);
            }
        } catch (error) {
            console.error('PDF generation error:', error);
            // Korean-font export failed — try the basic (Latin) exporter so the
            // user still gets a file instead of just an error.
            try {
                await this.exportPDFBasic();
            } catch (e2) {
                console.error('Basic PDF export also failed:', e2);
                alert('PDF 생성 중 오류가 발생했습니다.\n' + (error?.message || error));
            }
        } finally {
            if (btn) btn.textContent = originalText;
        }
    }

    async exportPDFBasic() {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert('PDF 라이브러리를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        const data = dataManager.getData();
        const name = data.profile.name || '포트폴리오';

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        let yPos = margin;

        const addText = (text, size = 12) => {
            pdf.setFontSize(size);
            if (yPos > pageHeight - margin) {
                pdf.addPage();
                yPos = margin;
            }
            const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
            pdf.text(lines, margin, yPos);
            yPos += (lines.length * size * 0.4) + 5;
        };

        const addSection = (title) => {
            if (yPos > pageHeight - 40) {
                pdf.addPage();
                yPos = margin;
            }
            yPos += 10;
            pdf.setFontSize(16);
            pdf.setTextColor(52, 152, 219);
            pdf.text(title, margin, yPos);
            yPos += 10;
            pdf.setTextColor(0, 0, 0);
        };

        pdf.setFontSize(24);
        pdf.text(`${name} Portfolio`, margin, yPos);
        yPos += 15;

        addSection('Profile');
        addText(`Name: ${data.profile.name} (Kakao: ${data.profile.kakaoId})`);
        addText(`Skills: ${data.profile.skills.join(', ')}`);
        addText(`Education: ${data.profile.education}`);
        addText(`Location: ${data.profile.residence}`);

        pdf.save(`${name}-portfolio.pdf`);
    }
}

// =====================
// Calendar
// =====================
class Calendar {
    constructor(container, events = []) {
        this.container = container;
        this.events = events;
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();

        this.render();
    }

    render() {
        if (!this.container) return;

        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // Previous month's last days
        const prevMonthLast = new Date(this.currentYear, this.currentMonth, 0).getDate();

        let html = `
            <div class="calendar-header">
                <h3 class="calendar-title">${this.currentYear}년 ${this.currentMonth + 1}월</h3>
                <div class="calendar-nav">
                    <button class="calendar-nav-btn" data-action="prev">&lt;</button>
                    <button class="calendar-nav-btn" data-action="next">&gt;</button>
                </div>
            </div>
            <div class="calendar-grid">
        `;

        // Day headers
        days.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        // Previous month days
        for (let i = startingDay - 1; i >= 0; i--) {
            html += `<div class="calendar-day other-month">${prevMonthLast - i}</div>`;
        }

        // Current month days
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvent = this.events.find(e => e.date === dateStr);
            const hasEvent = !!dayEvent;
            const isToday = day === today.getDate() &&
                           this.currentMonth === today.getMonth() &&
                           this.currentYear === today.getFullYear();

            const classes = ['calendar-day'];
            if (isToday) classes.push('today');
            if (hasEvent) classes.push('has-event');

            // Show "(회사명 면접) (위치)" on days with interview events
            const locationText = dayEvent?.location ? ` (${dayEvent.location})` : '';
            const eventLabel = hasEvent ? `<span class="calendar-day-event">${dayEvent.company} 면접${locationText}</span>` : '';
            html += `<div class="${classes.join(' ')}" data-date="${dateStr}"><span class="calendar-day-num">${day}</span>${eventLabel}</div>`;
        }

        // Next month days
        const remainingDays = (7 - ((startingDay + totalDays) % 7)) % 7;
        for (let i = 1; i <= remainingDays; i++) {
            html += `<div class="calendar-day other-month">${i}</div>`;
        }

        html += '</div>';

        // Events list
        const monthEvents = this.events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.getMonth() === this.currentMonth &&
                   eventDate.getFullYear() === this.currentYear;
        });

        if (monthEvents.length > 0) {
            html += '<div class="calendar-events">';
            monthEvents.forEach(event => {
                const eventDate = new Date(event.date);
                const locationText = event.location ? ` (${event.location})` : '';
                html += `
                    <div class="calendar-event">
                        <span class="calendar-event-date">${eventDate.getDate()}일</span>
                        <span class="calendar-event-title">${event.company} 면접${locationText}</span>
                        <span class="calendar-event-time">${event.time}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        this.container.innerHTML = html;
        this.bindEvents();
    }

    bindEvents() {
        this.container.querySelector('[data-action="prev"]')?.addEventListener('click', () => {
            this.prevMonth();
        });

        this.container.querySelector('[data-action="next"]')?.addEventListener('click', () => {
            this.nextMonth();
        });
    }

    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.render();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.render();
    }

    setEvents(events) {
        this.events = events;
        this.render();
    }

    goToDate(date) {
        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();
        this.render();
    }
}

// =====================
// Mobile Menu
// =====================
class MobileMenu {
    constructor() {
        this.toggle = document.querySelector('.menu-toggle');
        this.nav = document.querySelector('.nav');
        this.init();
    }

    init() {
        if (!this.toggle || !this.nav) return;

        this.toggle.addEventListener('click', () => {
            this.nav.classList.toggle('open');
            this.toggle.classList.toggle('active');
        });

        // Close menu on link click
        this.nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                this.nav.classList.remove('open');
                this.toggle.classList.remove('active');
            });
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (!this.toggle.contains(e.target) && !this.nav.contains(e.target)) {
                this.nav.classList.remove('open');
                this.toggle.classList.remove('active');
            }
        });
    }
}

// =====================
// Portfolio Renderer
// =====================
class PortfolioRenderer {
    constructor(container, items, displayMode = 'grid') {
        this.container = container;
        this.items = items;
        this.displayMode = displayMode;
    }

    render() {
        if (!this.container) return;

        // IMPORTANT: keep the `portfolio-container` class. Previously this
        // overwrote className entirely, dropping `portfolio-container`, so the
        // next re-render couldn't find the container (querySelector) and the
        // section only updated after a full page reload. That's why changing the
        // 보기형태(display mode) or editing items needed a refresh to show up.
        this.container.className = `portfolio-container portfolio-${this.displayMode}`;

        switch (this.displayMode) {
            case 'single':
                this.renderSingle();
                break;
            case 'grid':
                this.renderGrid();
                break;
            case 'masonry':
                this.renderMasonry();
                break;
            case 'slider':
                this.renderSlider();
                break;
            default:
                this.renderGrid();
        }
    }

    createItemHTML(item) {
        // 썸네일과 실제(원본) 이미지를 따로 등록할 수 있고, 하나만 있으면 그것을 둘 다에 사용.
        const thumbs = (item.thumbnails && item.thumbnails.length) ? item.thumbnails : (item.images || []);
        const fulls = (item.images && item.images.length) ? item.images : (item.thumbnails || []);
        const thumbnailHTML = thumbs.length > 0
            ? thumbs.map((t, i) => {
                const full = fulls[i] || fulls[0] || t;
                return `<img src="${addCacheBuster(t)}" alt="${item.title}" class="portfolio-zoomable" data-full="${encodeURI(full)}" title="클릭하면 크게 보기">`;
              }).join('')
            : '<div class="profile-image-placeholder">No Image</div>';

        const linksHTML = (item.links || []).map(link =>
            `<a href="${link.url}" target="_blank" class="btn btn-primary">${link.label}</a>`
        ).join('');

        // Support both old (contribution) and new (contributions) format
        const contributions = item.contributions || (item.contribution ? [{ label: '기여도', value: item.contribution }] : []);
        const contributionsHTML = contributions.map(c => `
            <div class="contribution-item">
                <span class="contribution-label">${c.label}: ${c.value}%</span>
                <div class="contribution-bar">
                    <div class="contribution-fill" style="width: ${c.value}%"></div>
                </div>
            </div>
        `).join('');

        // 기여도 그래프를 모두 지운 경우엔 영역 자체를 그리지 않는다 (빈 공간 방지).
        const contributionsBlock = contributions.length > 0
            ? `<div class="portfolio-contributions">${contributionsHTML}</div>`
            : '';

        const metaHTML = [
            item.subject ? `<span class="portfolio-meta-item"><strong>주제:</strong> ${item.subject}</span>` : '',
            item.target ? `<span class="portfolio-meta-item"><strong>타겟:</strong> ${item.target}</span>` : ''
        ].join('');
        const metaBlock = metaHTML ? `<div class="portfolio-meta">${metaHTML}</div>` : '';

        return `
            <article class="portfolio-item">
                <div class="portfolio-thumbnail">
                    ${thumbnailHTML}
                </div>
                <div class="portfolio-content">
                    <h3 class="portfolio-title">${item.title}</h3>
                    ${metaBlock}
                    ${item.review ? `<p class="portfolio-desc">${item.review}</p>` : ''}
                    ${contributionsBlock}
                    <div class="portfolio-links">
                        ${linksHTML}
                    </div>
                </div>
            </article>
        `;
    }

    renderSingle() {
        this.container.innerHTML = this.items.map(item => this.createItemHTML(item)).join('');
    }

    renderGrid() {
        this.container.innerHTML = this.items.map(item => this.createItemHTML(item)).join('');
    }

    renderMasonry() {
        this.container.innerHTML = this.items.map(item => this.createItemHTML(item)).join('');
    }

    renderSlider() {
        // Requires Swiper.js
        this.container.innerHTML = `
            <div class="swiper">
                <div class="swiper-wrapper">
                    ${this.items.map(item => `
                        <div class="swiper-slide">${this.createItemHTML(item)}</div>
                    `).join('')}
                </div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
        `;

        // Initialize Swiper if available
        if (window.Swiper) {
            new Swiper(this.container.querySelector('.swiper'), {
                slidesPerView: 'auto',
                spaceBetween: 24,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
            });
        }
    }

    setDisplayMode(mode) {
        this.displayMode = mode;
        this.render();
    }

    setItems(items) {
        this.items = items;
        this.render();
    }
}

// =====================
// Page Initializer
// =====================
class PageInitializer {
    constructor() {
        this.data = dataManager.getData();
        console.log('PageInitializer data loaded, sectionSettings:', JSON.stringify(this.data.sectionSettings));
        this.init();
    }

    init() {
        // Initialize common components
        new SmoothScroll();
        new SectionObserver();
        new ThemeToggle();
        new PDFExport();
        new MobileMenu();

        // Initialize calendar if exists
        const calendarContainer = document.querySelector('.calendar-container');
        if (calendarContainer) {
            window.calendar = new Calendar(calendarContainer, this.data.interviews);
        }

        // Initialize radar chart if exists
        const radarCanvas = document.getElementById('radar-chart');
        if (radarCanvas) {
            radarCanvas.width = 350;
            radarCanvas.height = 350;
            window.radarChart = new RadarChart(radarCanvas, this.data.evaluation.radarChart);
        }

        // Create/remove dynamic portfolio sections to match menu items
        this.syncSections();

        // Initialize portfolio renderers
        this.initPortfolios();

        // 작품 이미지 클릭 시 원본 크게 보기(라이트박스) — 한 번만 설치
        this.setupImageLightbox();

        // Apply font settings
        this.applyFontSettings();

        // Apply background settings
        this.applyBackgroundSettings();

        // Render dynamic content
        this.renderLogo();
        this.renderProfile();
        this.renderAITools();
        this.renderExperience();
        this.renderEvaluation();
        this.renderVideo();
        this.renderContact();
        this.renderMenu();

        // Apply section and page visibility settings
        this.applySectionVisibility();

        // Per-menu section show/hide (메뉴에서 섹션 숨김)
        this.applyMenuVisibility();

        // 편집기(editor-v3)는 이 이벤트를 받아 새로 그려진 DOM에 편집 바인딩을 다시 건다.
        // dataUpdated만으로는 부족: 첫 렌더는 Firestore 로드 후 dataUpdated 없이 일어나서
        // 그 사이에 걸린 바인딩이 전부 교체된 DOM과 함께 사라진다.
        window.dispatchEvent(new CustomEvent('pageRendered'));

        // Listen for data updates
        window.addEventListener('dataUpdated', () => {
            this.data = dataManager.getData();
            this.renderAll();
        });

        // Listen for storage events (cross-tab updates)
        window.addEventListener('storage', (e) => {
            if (e.key === 'portfolio_data') {
                this.data = dataManager.loadData();
                this.renderAll();
            }
        });
    }

    renderAll() {
        // 편집 중 항목을 추가/수정하면 dataUpdated → renderAll로 섹션이 다시 그려지는데,
        // 그 과정에서 스크롤이 맨 위로 튀는 문제가 있었다. 현재 위치를 기억해 뒀다가
        // 재렌더 직후 복원한다. (재렌더로 편집 도구가 붙은 뒤에도 유지되도록 rAF에서도 한 번 더.)
        const savedScrollY = window.scrollY || window.pageYOffset || 0;
        const restoreScroll = () => {
            if (savedScrollY > 0 && Math.abs((window.scrollY || 0) - savedScrollY) > 2) {
                window.scrollTo(0, savedScrollY);
            }
        };

        this.applyFontSettings();
        this.applyBackgroundSettings();
        this.renderLogo();
        this.renderProfile();
        this.renderAITools();
        this.renderExperience();
        this.renderEvaluation();
        this.renderVideo();
        this.renderContact();
        this.syncSections();
        this.renderMenu();
        this.initPortfolios();
        this.applySectionVisibility();
        this.applyMenuVisibility();

        if (window.radarChart) {
            window.radarChart.update(this.data.evaluation.radarChart);
        }

        if (window.calendar) {
            window.calendar.setEvents(this.data.interviews);
        }

        window.dispatchEvent(new CustomEvent('pageRendered'));

        // 재렌더 직후 + 편집도구가 붙는 다음 프레임에서 스크롤 위치 복원
        restoreScroll();
        if (window.requestAnimationFrame) requestAnimationFrame(restoreScroll);
    }

    applySectionVisibility() {
        const sectionSettings = this.data.sectionSettings || {};
        const pageSettings = this.data.pageSettings || {};

        console.log('applySectionVisibility called with settings:', JSON.stringify(sectionSettings));

        // Apply visibility to sections with specific selectors
        // Note: 'about' controls the entire #about section
        // Other keys control sub-sections within about
        const sectionMap = {
            'about': '#about',
            'aitools': '[data-section="aitools"]',
            'related': '[data-section="related"]',
            'other': '[data-section="other"]',
            'evaluation': '[data-section="evaluation"]',
            'video': '[data-section="video"]',
            'portfolio': '.portfolio-section',
            'contact': '#contact'
        };

        // 편집모드(portfolio-edit.html)에서는 꺼진 섹션도 흐리게 보여줘서 계속
        // 편집할 수 있게 한다 (숨겨버리면 내용을 채운 뒤 켤 방법이 없음).
        const isEditMode = !!document.querySelector('.ev3-toolbar');

        Object.entries(sectionMap).forEach(([key, selector]) => {
            const elements = document.querySelectorAll(selector);
            const isHidden = sectionSettings[key] === false;

            console.log(`Section ${key}: found ${elements.length} elements, isHidden=${isHidden}`);

            elements.forEach(el => {
                if (isHidden) {
                    if (isEditMode) {
                        el.style.display = '';
                        el.classList.add('ev3-hidden-section');
                    } else {
                        el.style.display = 'none';
                    }
                    el.setAttribute('data-hidden', 'true');
                } else {
                    el.style.display = '';
                    el.classList.remove('ev3-hidden-section');
                    el.removeAttribute('data-hidden');
                }
            });
        });

        // Apply photo visibility for about section (profile image and download button area)
        const profileImageEl = document.querySelector('[data-content="profile-image"]');
        if (profileImageEl) {
            if (sectionSettings.aboutPhoto === false) {
                profileImageEl.style.display = 'none';
            } else {
                profileImageEl.style.display = '';
            }
        }

        // Also hide the about-profile container if photo is hidden
        const aboutProfileEl = document.querySelector('.about-profile');
        const aboutGridEl = document.querySelector('.about-grid-top');

        if (aboutProfileEl) {
            if (sectionSettings.aboutPhoto === false) {
                aboutProfileEl.style.display = 'none';
                // Make the info section take full width
                if (aboutGridEl) {
                    aboutGridEl.classList.add('photo-hidden');
                }
            } else {
                aboutProfileEl.style.display = '';
                if (aboutGridEl) {
                    aboutGridEl.classList.remove('photo-hidden');
                }
            }
        }

        // Apply page settings to header nav buttons
        const aiLink = document.querySelector('[data-page-link="ai"]');
        const teamLink = document.querySelector('[data-page-link="team"]');

        console.log('Page settings:', JSON.stringify(pageSettings));
        console.log('AI link found:', !!aiLink, ', Team link found:', !!teamLink);

        if (aiLink) {
            const aiDisplay = pageSettings.ai === false ? 'none' : '';
            aiLink.style.display = aiDisplay;
            console.log('AI link display set to:', aiDisplay || 'default');
        }
        if (teamLink) {
            const teamDisplay = pageSettings.team === false ? 'none' : '';
            teamLink.style.display = teamDisplay;
            console.log('Team link display set to:', teamDisplay || 'default');
        }
    }

    // 작품 이미지 라이트박스: 썸네일 클릭 → 원본을 모달로. 최대폭 94vw,
    // 세로가 길면 스크롤로 볼 수 있게 한다. 문서 전역에 위임 리스너 1개만 건다.
    setupImageLightbox() {
        if (window.__imgLightboxReady) return;
        window.__imgLightboxReady = true;

        const overlay = document.createElement('div');
        overlay.className = 'img-lightbox';
        overlay.innerHTML = `
            <button class="img-lightbox-close" aria-label="닫기">&times;</button>
            <div class="img-lightbox-scroll"><img class="img-lightbox-img" src="" alt=""></div>
        `;
        document.body.appendChild(overlay);
        const imgEl = overlay.querySelector('.img-lightbox-img');
        const close = () => { overlay.classList.remove('active'); imgEl.src = ''; };

        overlay.addEventListener('click', (e) => {
            // 이미지 자체가 아니라 배경/닫기버튼을 누르면 닫는다
            if (e.target === imgEl) return;
            close();
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

        // 썸네일(.portfolio-zoomable) 클릭을 문서 레벨에서 위임 처리
        document.addEventListener('click', (e) => {
            const t = e.target.closest && e.target.closest('.portfolio-zoomable');
            if (!t) return;
            const full = t.getAttribute('data-full') || t.getAttribute('src');
            if (!full) return;
            imgEl.src = decodeURI(full);
            overlay.classList.add('active');
        });
    }

    initPortfolios() {
        // Initialize section portfolios based on menu items with isPortfolio flag
        const portfolioMenus = this.data.menuItems.filter(m => m.isPortfolio);
        portfolioMenus.forEach(menu => {
            const container = document.querySelector(`#${menu.id} .portfolio-container`);
            if (container) {
                const items = this.data.portfolioSolo.items.filter(i => i.section === menu.id);
                const displayMode = this.data.sectionDisplayModes?.[menu.id] || 'grid';
                new PortfolioRenderer(container, items, displayMode).render();
            }
        });
    }

    renderLogo() {
        const logoEl = document.querySelector('.logo');
        if (!logoEl) return;

        const settings = this.data.siteSettings;
        if (settings?.logo?.type === 'image' && settings.logo.imageUrl) {
            const logoUrl = addCacheBuster(settings.logo.imageUrl);
            logoEl.innerHTML = `<img src="${logoUrl}" alt="Logo" style="max-height: 50px; width: auto;">`;
        } else {
            logoEl.textContent = settings?.logo?.text || 'Portfolio';
        }
    }

    applyFontSettings() {
        const settings = this.data.siteSettings;
        const font = settings?.font || {};
        const colors = font.colors || {};

        // Apply @font-face codes (prioritize fontFaceAll, fallback to separate codes)
        const fontFaceCodes = [];
        if (font.fontFaceAll) {
            fontFaceCodes.push(font.fontFaceAll);
        } else {
            if (font.fontFaceTitle) fontFaceCodes.push(font.fontFaceTitle);
            if (font.fontFaceContent) fontFaceCodes.push(font.fontFaceContent);
            if (font.fontFaceCode) fontFaceCodes.push(font.fontFaceCode);
        }

        if (fontFaceCodes.length > 0) {
            let styleEl = document.getElementById('custom-font-face');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'custom-font-face';
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = fontFaceCodes.join('\n');
        }

        // Apply font families
        if (font.title) {
            document.documentElement.style.setProperty('--font-title', `'${font.title}', 'Pretendard', sans-serif`);
        }
        if (font.content) {
            document.documentElement.style.setProperty('--font-content', `'${font.content}', sans-serif`);
        }

        // Apply font weights
        if (font.weightTitle) {
            document.documentElement.style.setProperty('--font-weight-title', font.weightTitle);
        }
        if (font.weightContent) {
            document.documentElement.style.setProperty('--font-weight-content', font.weightContent);
        }

        // Apply font sizes
        const fontSizes = font.fontSizes || {};
        if (fontSizes['5xl']) document.documentElement.style.setProperty('--font-5xl', fontSizes['5xl']);
        if (fontSizes['4xl']) document.documentElement.style.setProperty('--font-4xl', fontSizes['4xl']);
        if (fontSizes['3xl']) document.documentElement.style.setProperty('--font-3xl', fontSizes['3xl']);
        if (fontSizes['2xl']) document.documentElement.style.setProperty('--font-2xl', fontSizes['2xl']);
        if (fontSizes['base']) document.documentElement.style.setProperty('--font-base', fontSizes['base']);
        if (fontSizes['sm']) document.documentElement.style.setProperty('--font-sm', fontSizes['sm']);

        // Apply font colors
        if (colors.title1) {
            document.documentElement.style.setProperty('--color-title1', colors.title1);
        }
        if (colors.title2) {
            document.documentElement.style.setProperty('--color-title2', colors.title2);
        }
        if (colors.content) {
            document.documentElement.style.setProperty('--color-content', colors.content);
        }

        // Apply per-level font colors
        const fontColors = font.fontColors || {};
        if (fontColors['5xl']) document.documentElement.style.setProperty('--color-5xl', fontColors['5xl']);
        if (fontColors['4xl']) document.documentElement.style.setProperty('--color-4xl', fontColors['4xl']);
        if (fontColors['3xl']) document.documentElement.style.setProperty('--color-3xl', fontColors['3xl']);
        if (fontColors['2xl']) document.documentElement.style.setProperty('--color-2xl', fontColors['2xl']);
        if (fontColors['base']) document.documentElement.style.setProperty('--color-base', fontColors['base']);
        if (fontColors['sm']) document.documentElement.style.setProperty('--color-sm', fontColors['sm']);
    }

    applyBackgroundSettings() {
        const bgSettings = this.data.backgroundSettings || {};

        // Apply body background
        const bodyBg = bgSettings.body || {};
        if (bodyBg.image) {
            const imageUrl = addCacheBuster(bodyBg.image);

            // Create or update background style
            let bgStyleEl = document.getElementById('custom-background-style');
            if (!bgStyleEl) {
                bgStyleEl = document.createElement('style');
                bgStyleEl.id = 'custom-background-style';
                document.head.appendChild(bgStyleEl);
            }

            // Create pseudo element for background with opacity
            const opacity = bodyBg.opacity ?? 1;
            bgStyleEl.textContent = `
                body::before {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: url('${imageUrl}');
                    background-size: ${bodyBg.size || 'cover'};
                    background-position: ${bodyBg.position || 'center center'};
                    background-repeat: ${bodyBg.repeat || 'no-repeat'};
                    background-attachment: ${bodyBg.attachment || 'scroll'};
                    opacity: ${opacity};
                    z-index: -1;
                    pointer-events: none;
                }
            `;
        }

        // Apply section backgrounds
        const sectionMap = {
            'about': '#about',
            'portfolio': '.portfolio-section',
            'contact': '#contact'
        };

        Object.entries(sectionMap).forEach(([key, selector]) => {
            const sectionBg = bgSettings[key] || {};
            const elements = document.querySelectorAll(selector);

            elements.forEach(el => {
                if (sectionBg.image) {
                    const imageUrl = addCacheBuster(sectionBg.image);
                    el.style.backgroundImage = `url('${imageUrl}')`;
                    el.style.backgroundSize = 'cover';
                    el.style.backgroundPosition = 'center';
                    el.style.backgroundRepeat = 'no-repeat';
                } else if (sectionBg.color) {
                    el.style.backgroundColor = sectionBg.color;
                    el.style.backgroundImage = '';
                } else {
                    el.style.backgroundImage = '';
                    el.style.backgroundColor = '';
                }
            });
        });
    }

    renderProfile() {
        const profile = this.data.profile;

        // Name
        const nameEl = document.querySelector('[data-content="name"]');
        if (nameEl) nameEl.textContent = profile.name;

        // Name (큰 글씨, 프로필 이미지 맨 위)
        const nameTopEl = document.querySelector('[data-content="profile-name-top"]');
        if (nameTopEl) nameTopEl.textContent = profile.name;

        // Kakao ID
        const kakaoEl = document.querySelector('[data-content="kakao"]');
        if (kakaoEl) kakaoEl.textContent = `(카톡:${profile.kakaoId})`;

        // Job roles
        const rolesEl = document.querySelector('[data-content="job-roles"]');
        if (rolesEl) rolesEl.textContent = profile.jobRoles.join(', ');

        // Skills
        const skillsEl = document.querySelector('[data-content="skills"]');
        if (skillsEl) {
            skillsEl.innerHTML = profile.skills.map(s =>
                `<span class="skill-tag">${s}</span>`
            ).join('');
        }

        // Education
        const eduEl = document.querySelector('[data-content="education"]');
        if (eduEl) eduEl.textContent = profile.education;

        // Residence
        const resEl = document.querySelector('[data-content="residence"]');
        if (resEl) resEl.textContent = profile.residence;

        // Employment status
        const empEl = document.querySelector('[data-content="employment"]');
        if (empEl) {
            if (profile.showEmployment !== false) {
                empEl.textContent = `${profile.employmentStatus} : ${profile.desiredSalary}`;
                empEl.classList.remove('hidden');
            } else {
                empEl.classList.add('hidden');
            }
        }

        // 편집모드(portfolio-edit.html)에서는 빈 줄도 클릭 입력을 위해 항상 표시
        const isEditMode = !!document.querySelector('.ev3-toolbar');

        // Certificates (자격증) - comma-joined list
        const certEl = document.querySelector('[data-content="certificates"]');
        if (certEl) {
            const certs = profile.certificates || [];
            certEl.textContent = certs.join(', ');
            const certRow = certEl.closest('[data-section="certificates"]');
            if (certRow) certRow.style.display = (!isEditMode && certs.length === 0) ? 'none' : '';
        }

        // Educations (교육이수) - comma-joined list
        const eduListEl = document.querySelector('[data-content="educations"]');
        if (eduListEl) {
            const edus = profile.educations || [];
            eduListEl.textContent = edus.join(', ');
            const eduRow = eduListEl.closest('[data-section="educations"]');
            if (eduRow) eduRow.style.display = (!isEditMode && edus.length === 0) ? 'none' : '';
        }

        // Motto
        const mottoEl = document.querySelector('[data-content="motto"]');
        if (mottoEl) mottoEl.textContent = `"${profile.motto}"`;

        // Profile image
        const imgEl = document.querySelector('[data-content="profile-image"]');
        if (imgEl) {
            if (profile.profileImage) {
                const imgUrl = addCacheBuster(profile.profileImage);
                imgEl.innerHTML = `<img src="${imgUrl}" alt="${profile.name}" class="profile-image">`;
            } else {
                imgEl.innerHTML = '<div class="profile-image-placeholder">사진</div>';
            }
        }
    }

    renderAITools() {
        const container = document.querySelector('[data-content="ai-tools"]');
        const titleEl = document.querySelector('[data-content="ai-tools-title"]');

        if (!container) return;

        const aiTools = this.data.aiTools || [];

        // Update title with count. The base title is editable (wrapped in a
        // span the editor binds); the "(N가지)" count stays auto-generated.
        if (titleEl) {
            const t = (this.data.sectionTitles && this.data.sectionTitles.aiTools) || '사용해본 AI';
            titleEl.innerHTML = `<span data-content="ai-tools-title-text">${escapeTitle(t)}</span> (${aiTools.length}가지)`;
        }

        container.innerHTML = aiTools.map((tool, i) => `
            <div class="ai-item">
                <span class="ai-item-number">${i + 1}</span>
                <div>
                    <div class="ai-item-name">${tool.name}</div>
                    <div class="ai-item-desc">${tool.description}</div>
                </div>
            </div>
        `).join('');
    }

    // 경력 기간 계산 함수
    calculateTotalExperience(items) {
        let totalMonths = 0;

        items.forEach(item => {
            const duration = item.duration || '';
            // "1년", "6개월", "1년 6개월", "2년3개월" 등의 형식 파싱
            const yearMatch = duration.match(/(\d+)\s*년/);
            const monthMatch = duration.match(/(\d+)\s*개월/);

            if (yearMatch) {
                totalMonths += parseInt(yearMatch[1]) * 12;
            }
            if (monthMatch) {
                totalMonths += parseInt(monthMatch[1]);
            }
        });

        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;

        if (years > 0 && months > 0) {
            return `총 ${years}년 ${months}개월`;
        } else if (years > 0) {
            return `총 ${years}년`;
        } else if (months > 0) {
            return `총 ${months}개월`;
        } else {
            return '';
        }
    }

    renderExperience() {
        // Related experience
        const relatedContainer = document.querySelector('[data-content="related-experience"]');
        if (relatedContainer) {
            const related = this.data.relatedExperience;
            const calculatedTotal = this.calculateTotalExperience(related.items);
            const relTitle = (this.data.sectionTitles && this.data.sectionTitles.relatedExperience) || '관련경력';
            relatedContainer.innerHTML = `
                <h3 class="experience-title">
                    <span data-content="related-exp-title">${escapeTitle(relTitle)}</span>
                    <span class="experience-badge">${calculatedTotal}</span>
                </h3>
                <div class="experience-list">
                    ${related.items.map((item, i) => `
                        <div class="experience-item">
                            <div>
                                <span class="experience-item-title">${i + 1}.</span>
                                <span class="experience-item-company">${item.company}</span>
                            </div>
                            <span class="experience-item-period">${item.period}</span>
                            <span class="experience-item-duration">${item.duration}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Other experience
        const otherContainer = document.querySelector('[data-content="other-experience"]');
        if (otherContainer) {
            const other = this.data.otherExperience;
            const calculatedTotal = this.calculateTotalExperience(other.items);
            const otherTitle = (this.data.sectionTitles && this.data.sectionTitles.otherExperience) || '타업무경력';
            otherContainer.innerHTML = `
                <h3 class="experience-title">
                    <span data-content="other-exp-title">${escapeTitle(otherTitle)}</span>
                    <span class="experience-badge">${calculatedTotal}</span>
                </h3>
                <div class="experience-list">
                    ${other.items.map((item, i) => `
                        <div class="experience-item">
                            <div>
                                <span class="experience-item-title">${i + 1}.</span>
                                <span class="experience-item-company">${item.company}</span>
                            </div>
                            <span class="experience-item-period">${item.period}</span>
                            <span class="experience-item-duration">${item.duration}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    renderEvaluation() {
        const st = this.data.sectionTitles || {};
        const textContainer = document.querySelector('[data-content="evaluation-text"]');
        if (textContainer) {
            const evalTitle = st.evaluation || '내가 생각하는 내평가';
            textContainer.innerHTML = `
                <h3 class="evaluation-text-title"><span data-content="evaluation-title">${escapeTitle(evalTitle)}</span></h3>
                <p class="evaluation-text-content">${this.data.evaluation.text.replace(/\n/g, '<br>')}</p>
            `;
        }
        // Radar chart title (static in the HTML) — reflect the saved title.
        const radarTitleEl = document.querySelector('[data-content="radar-title"]');
        if (radarTitleEl) {
            radarTitleEl.textContent = st.radarChart || '자신 있는 부분과 없는 부분 그래프';
        }
    }

    renderVideo() {
        const container = document.querySelector('[data-content="video"]');
        if (!container) return;

        const video = this.data.video;
        if (video.url) {
            if (video.type === 'youtube') {
                // Extract YouTube video ID
                const videoId = this.extractYouTubeId(video.url);
                if (videoId) {
                    container.innerHTML = `
                        <iframe
                            src="https://www.youtube.com/embed/${videoId}"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                        </iframe>
                    `;
                }
            } else {
                container.innerHTML = `
                    <video controls>
                        <source src="${video.url}" type="video/mp4">
                    </video>
                `;
            }
        } else {
            container.innerHTML = `
                <div class="video-placeholder">
                    <div class="video-play-btn">▶</div>
                    <span>영상을 등록해주세요</span>
                </div>
            `;
        }
    }

    extractYouTubeId(url) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
        return match ? match[1] : null;
    }

    renderContact() {
        const contact = this.data.contact;
        const emojiIcons = this.data.emojiIcons?.contact || {};

        const nameEl = document.querySelector('[data-content="contact-name"]');
        if (nameEl) nameEl.textContent = contact.name;

        const phoneEl = document.querySelector('[data-content="contact-phone"]');
        if (phoneEl) phoneEl.textContent = contact.phone;

        const emailEl = document.querySelector('[data-content="contact-email"]');
        if (emailEl) emailEl.textContent = contact.email;

        const messageEl = document.querySelector('[data-content="contact-message"]');
        if (messageEl) messageEl.textContent = contact.message;

        // Render emoji/image icons
        this.renderIcon('[data-emoji="contact-name"]', emojiIcons.name, '👤');
        this.renderIcon('[data-emoji="contact-phone"]', emojiIcons.phone, '📞');
        this.renderIcon('[data-emoji="contact-email"]', emojiIcons.email, '✉️');
    }

    // Helper to render icon (emoji or image)
    renderIcon(selector, iconData, defaultEmoji) {
        const el = document.querySelector(selector);
        if (!el) return;

        // Handle both old string format and new object format
        if (typeof iconData === 'string') {
            el.textContent = iconData || defaultEmoji;
        } else if (iconData?.type === 'image' && iconData?.imageUrl) {
            el.innerHTML = `<img src="${iconData.imageUrl}" style="width: 1em; height: 1em; vertical-align: middle; object-fit: contain;">`;
        } else {
            el.textContent = iconData?.emoji || defaultEmoji;
        }
    }

    renderMenu() {
        const menuContainer = document.querySelector('[data-content="menu"]');
        if (!menuContainer) return;

        // Sort menu items by sectionOrder
        const sectionOrder = this.data.sectionOrder || [];
        const sortedMenus = [...this.data.menuItems].sort((a, b) => {
            const indexA = sectionOrder.indexOf(a.id);
            const indexB = sectionOrder.indexOf(b.id);
            return indexA - indexB;
        });

        const visibleMenus = sortedMenus.filter(m => m.visible);
        menuContainer.innerHTML = visibleMenus.map(item =>
            `<a href="#${item.id}" class="nav-link">${item.label}</a>`
        ).join('');

        // Apply section order to DOM
        this.applySectionOrder();
    }

    // 메뉴 항목(isPortfolio)에 맞춰 실제 <section>을 생성/삭제/제목동기화
    syncSections() {
        const main = document.querySelector('.main');
        if (!main) return;

        const menuById = {};
        (this.data.menuItems || []).forEach(m => { menuById[m.id] = m; });

        // 1) 포트폴리오 메뉴에 해당하는 섹션이 없으면 생성 (contact 앞에 삽입)
        const contactSection = document.getElementById('contact');
        (this.data.menuItems || []).filter(m => m.isPortfolio).forEach(menu => {
            let sec = document.getElementById(menu.id);
            if (!sec) {
                sec = document.createElement('section');
                sec.id = menu.id;
                sec.className = 'section portfolio-section';
                sec.innerHTML = '<div class="container"><h2 class="section-title"></h2><div class="portfolio-container"></div></div>';
                if (contactSection) main.insertBefore(sec, contactSection);
                else main.appendChild(sec);
            }
            const title = sec.querySelector('.section-title');
            if (title) title.textContent = menu.label;
        });

        // 2) 메뉴에서 삭제된 포트폴리오 섹션은 DOM에서도 제거 (about/contact 등 비포트폴리오는 유지)
        main.querySelectorAll(':scope > section.portfolio-section').forEach(sec => {
            const m = menuById[sec.id];
            if (!m || !m.isPortfolio) sec.remove();
        });
    }

    // 메뉴 항목의 visible=false 면 해당 섹션 전체를 숨김
    applyMenuVisibility() {
        (this.data.menuItems || []).forEach(m => {
            const sec = document.getElementById(m.id);
            if (sec && m.visible === false) sec.style.display = 'none';
        });
    }

    applySectionOrder() {
        // Reorder the top-level <section id="..."> elements inside .main
        // according to data.sectionOrder. Only moves sections that actually
        // exist in the DOM; unknown ids are ignored.
        const order = this.data.sectionOrder || [];
        if (!order.length) return;
        const main = document.querySelector('.main');
        if (!main) return;

        const sectionMap = {};
        main.querySelectorAll(':scope > section[id]').forEach(s => { sectionMap[s.id] = s; });

        order.forEach(id => {
            if (sectionMap[id]) main.appendChild(sectionMap[id]);
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // 관리자 페이지는 자체 처리
    if (document.querySelector('.admin-layout')) return;

    let done = false;
    const initApp = () => {
        if (done) return;
        // 데이터가 실제로 로드된 뒤에만 렌더 (뷰모드 첫 로드 빈화면 방지)
        if (!window.dataManager || !window.dataManager.data) return;
        done = true;
        window.__pageInitializer = new PageInitializer();
    };

    // 1) 준비 이벤트 수신  2) 이미 준비됐으면 즉시
    window.addEventListener('dataManagerReady', initApp);
    initApp();

    // 3) 안전장치: 이벤트를 놓쳤거나 데이터가 늦게 도착해도 렌더 보장
    let tries = 0;
    const timer = setInterval(() => {
        initApp();
        if (done || ++tries > 50) clearInterval(timer);   // 최대 ~7.5초
    }, 150);
});

// Export classes for use in admin page
window.RadarChart = RadarChart;
window.Calendar = Calendar;
window.PortfolioRenderer = PortfolioRenderer;
window.PageInitializer = PageInitializer;
