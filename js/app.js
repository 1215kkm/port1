// Main Application JavaScript

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
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('PDF 생성 중 오류가 발생했습니다.');
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

            // Show "(회사명 면접)" on days with interview events
            const eventLabel = hasEvent ? `<span class="calendar-day-event">(${dayEvent.company} 면접)</span>` : '';
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
                html += `
                    <div class="calendar-event">
                        <span class="calendar-event-date">${eventDate.getDate()}일</span>
                        <span class="calendar-event-title">${event.company}</span>
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

        this.container.className = `portfolio-${this.displayMode}`;

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
        const thumbnails = item.thumbnails || [];
        const thumbnailHTML = thumbnails.length > 0
            ? thumbnails.map(t => `<img src="${t}" alt="${item.title}">`).join('')
            : '<div class="profile-image-placeholder">No Image</div>';

        const linksHTML = (item.links || []).map(link =>
            `<a href="${link.url}" target="_blank" class="btn btn-primary">${link.label}</a>`
        ).join('');

        return `
            <article class="portfolio-item">
                <div class="portfolio-thumbnail">
                    ${thumbnailHTML}
                </div>
                <div class="portfolio-content">
                    <h3 class="portfolio-title">${item.title}</h3>
                    <div class="portfolio-meta">
                        ${item.subject ? `<span class="portfolio-meta-item">주제: ${item.subject}</span>` : ''}
                        ${item.target ? `<span class="portfolio-meta-item">타겟: ${item.target}</span>` : ''}
                    </div>
                    ${item.review ? `<p class="portfolio-desc">${item.review}</p>` : ''}
                    <div class="portfolio-contribution">
                        <span class="contribution-label">기여도: ${item.contribution}%</span>
                        <div class="contribution-bar">
                            <div class="contribution-fill" style="width: ${item.contribution}%"></div>
                        </div>
                    </div>
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

        // Initialize portfolio renderers
        this.initPortfolios();

        // Render dynamic content
        this.renderLogo();
        this.renderProfile();
        this.renderAITools();
        this.renderExperience();
        this.renderEvaluation();
        this.renderVideo();
        this.renderContact();
        this.renderMenu();

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
        this.renderLogo();
        this.renderProfile();
        this.renderAITools();
        this.renderExperience();
        this.renderEvaluation();
        this.renderVideo();
        this.renderContact();
        this.renderMenu();
        this.initPortfolios();

        if (window.radarChart) {
            window.radarChart.update(this.data.evaluation.radarChart);
        }

        if (window.calendar) {
            window.calendar.setEvents(this.data.interviews);
        }
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
            logoEl.innerHTML = `<img src="${settings.logo.imageUrl}" alt="Logo" style="max-height: 50px; width: auto;">`;
        } else {
            logoEl.textContent = settings?.logo?.text || 'Portfolio';
        }
    }

    renderProfile() {
        const profile = this.data.profile;

        // Name
        const nameEl = document.querySelector('[data-content="name"]');
        if (nameEl) nameEl.textContent = profile.name;

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

        // Motto
        const mottoEl = document.querySelector('[data-content="motto"]');
        if (mottoEl) mottoEl.textContent = `"${profile.motto}"`;

        // Profile image
        const imgEl = document.querySelector('[data-content="profile-image"]');
        if (imgEl) {
            if (profile.profileImage) {
                imgEl.innerHTML = `<img src="${profile.profileImage}" alt="${profile.name}" class="profile-image">`;
            } else {
                imgEl.innerHTML = '<div class="profile-image-placeholder">사진</div>';
            }
        }
    }

    renderAITools() {
        const container = document.querySelector('[data-content="ai-tools"]');
        if (!container) return;

        container.innerHTML = this.data.aiTools.map((tool, i) => `
            <div class="ai-item">
                <span class="ai-item-number">${i + 1}</span>
                <div>
                    <div class="ai-item-name">${tool.name}</div>
                    <div class="ai-item-desc">${tool.description}</div>
                </div>
            </div>
        `).join('');
    }

    renderExperience() {
        // Related experience
        const relatedContainer = document.querySelector('[data-content="related-experience"]');
        if (relatedContainer) {
            const related = this.data.relatedExperience;
            relatedContainer.innerHTML = `
                <h3 class="experience-title">
                    관련경력
                    <span class="experience-badge">${related.totalPeriod}</span>
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
            otherContainer.innerHTML = `
                <h3 class="experience-title">
                    타업무경력
                    <span class="experience-badge">${other.totalPeriod}</span>
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
        const textContainer = document.querySelector('[data-content="evaluation-text"]');
        if (textContainer) {
            textContainer.innerHTML = `
                <h3 class="evaluation-text-title">내가 생각하는 내평가</h3>
                <p class="evaluation-text-content">${this.data.evaluation.text.replace(/\n/g, '<br>')}</p>
            `;
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

        // Render emoji icons
        const nameIcon = document.querySelector('[data-emoji="contact-name"]');
        if (nameIcon && emojiIcons.name) nameIcon.textContent = emojiIcons.name;

        const phoneIcon = document.querySelector('[data-emoji="contact-phone"]');
        if (phoneIcon && emojiIcons.phone) phoneIcon.textContent = emojiIcons.phone;

        const emailIcon = document.querySelector('[data-emoji="contact-email"]');
        if (emailIcon && emojiIcons.email) emailIcon.textContent = emojiIcons.email;
    }

    renderMenu() {
        const menuContainer = document.querySelector('[data-content="menu"]');
        if (!menuContainer) return;

        const visibleMenus = this.data.menuItems.filter(m => m.visible);
        menuContainer.innerHTML = visibleMenus.map(item =>
            `<a href="#${item.id}" class="nav-link">${item.label}</a>`
        ).join('');
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a user page (not admin)
    if (!document.querySelector('.admin-layout')) {
        new PageInitializer();
    }
});

// Export classes for use in admin page
window.RadarChart = RadarChart;
window.Calendar = Calendar;
window.PortfolioRenderer = PortfolioRenderer;
window.PageInitializer = PageInitializer;
