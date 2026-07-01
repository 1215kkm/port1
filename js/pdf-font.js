// PDF Korean Font Loader for jsPDF
// This loads custom font or Noto Sans KR font and registers it with jsPDF

const PDFFontLoader = {
    fontLoaded: false,
    fontData: null,
    fontName: 'NanumGothic',
    fontExt: 'ttf',
    customFontName: null,

    // Extract font URL from @font-face code.
    // IMPORTANT: jsPDF can only embed TTF/OTF fonts — it cannot parse woff/woff2
    // (compressed), which throws "No unicode cmap for font". So we ONLY accept
    // ttf/otf here; a woff2-only custom font is ignored and we fall back to the
    // bundled Korean TTF instead.
    extractFontUrl(fontFaceCode, targetWeight = '400') {
        if (!fontFaceCode) return null;

        // Split by @font-face blocks
        const blocks = fontFaceCode.split('@font-face').filter(b => b.trim());

        for (const block of blocks) {
            // Check weight
            const weightMatch = block.match(/font-weight:\s*(\d+)/);
            const weight = weightMatch ? weightMatch[1] : '400';

            if (weight === targetWeight) {
                // Only ttf/otf — jsPDF cannot use woff/woff2
                const urlMatch = block.match(/url\(['"]?([^'")\s]+\.(ttf|otf))['"]?\)/i);
                if (urlMatch) {
                    return urlMatch[1];
                }
            }
        }

        // If no matching weight, try to find any ttf/otf anywhere
        const anyUrlMatch = fontFaceCode.match(/url\(['"]?([^'")\s]+\.(ttf|otf))['"]?\)/i);
        if (anyUrlMatch) {
            return anyUrlMatch[1];
        }

        // No jsPDF-compatible font in the settings → use bundled default
        return null;
    },

    // Load font from URL and convert to base64
    async loadFontFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Font load failed');

            const blob = await response.blob();
            return await this.blobToBase64(blob);
        } catch (error) {
            console.error('Failed to load font from URL:', url, error);
            return null;
        }
    },

    // Load bundled Korean font (fallback). NanumGothic is a real TTF with a
    // full Hangul cmap that jsPDF can embed. Both sources are CORS-enabled.
    async loadDefaultFont() {
        const sources = [
            'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanumgothic/NanumGothic-Regular.ttf',
            'https://raw.githubusercontent.com/google/fonts/main/ofl/nanumgothic/NanumGothic-Regular.ttf'
        ];
        for (const url of sources) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                const blob = await response.blob();
                this.fontName = 'NanumGothic';
                this.fontExt = 'ttf';
                return await this.blobToBase64(blob);
            } catch (error) {
                console.warn('Default Korean font source failed:', url, error);
            }
        }
        console.error('Failed to load any default Korean font');
        return null;
    },

    // Main load function - tries custom font first, then fallback
    async loadFont(fontSettings) {
        if (this.fontLoaded) return this.fontData;

        // Try to load custom font from settings
        if (fontSettings?.fontFaceTitle) {
            const customUrl = this.extractFontUrl(fontSettings.fontFaceTitle, fontSettings.weightTitle || '400');
            if (customUrl) {
                console.log('Trying to load custom font:', customUrl);
                const customFontData = await this.loadFontFromUrl(customUrl);
                if (customFontData) {
                    this.fontData = customFontData;
                    this.fontLoaded = true;
                    this.customFontName = (fontSettings.title || 'CustomFont').replace(/[^\w-]/g, '');
                    this.fontName = this.customFontName || 'CustomFont';
                    this.fontExt = /\.otf(\?|$)/i.test(customUrl) ? 'otf' : 'ttf';
                    console.log('Custom font loaded:', this.fontName);
                    return this.fontData;
                }
            }
        }

        // Fallback to bundled default font (loadDefaultFont sets fontName/fontExt)
        console.log('Loading default Korean font (NanumGothic)');
        this.fontData = await this.loadDefaultFont();
        this.fontLoaded = !!this.fontData;
        return this.fontData;
    },

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    // Register font with jsPDF
    async registerFont(doc, fontSettings) {
        const fontData = await this.loadFont(fontSettings);
        if (fontData) {
            try {
                const fileName = `${this.fontName}.${this.fontExt}`;
                doc.addFileToVFS(fileName, fontData);
                doc.addFont(fileName, this.fontName, 'normal');
                doc.setFont(this.fontName);
                return true;
            } catch (error) {
                console.error('Failed to register custom font, retrying with default:', error);
                // A bad custom font shouldn't kill the export — fall back to the
                // bundled Korean TTF and try once more.
                try {
                    this.fontLoaded = false;
                    this.fontData = null;
                    this.customFontName = null;
                    const fallback = await this.loadDefaultFont();
                    if (!fallback) return false;
                    this.fontData = fallback;
                    this.fontLoaded = true;
                    const fbName = `${this.fontName}.${this.fontExt}`;
                    doc.addFileToVFS(fbName, fallback);
                    doc.addFont(fbName, this.fontName, 'normal');
                    doc.setFont(this.fontName);
                    return true;
                } catch (e2) {
                    console.error('Default font registration also failed:', e2);
                    return false;
                }
            }
        }
        return false;
    }
};

// Alternative: Use html2canvas approach for Korean text
const PDFGenerator = {
    // Capture the on-screen resume (자기소개 섹션) exactly as designed and place
    // it into the PDF, so the output matches what the user sees — layout, colors,
    // photo and all. The old text-only re-layout is kept as a fallback.
    async generateResume(data) {
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        const target = document.querySelector('#about') ||
                       document.querySelector('.about-section') ||
                       document.querySelector('main');

        if (!html2canvas || !target) {
            return this.generateResumeText(data);
        }

        // Hide interactive chrome so it isn't baked into the image.
        const hidden = [];
        document.querySelectorAll('[data-action="download-pdf"], .owner-menu, .s1-fab, .section-nav, .header, .menu-toggle')
            .forEach(el => { hidden.push([el, el.style.visibility]); el.style.visibility = 'hidden'; });

        let canvas;
        try {
            canvas = await html2canvas(target, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: -window.scrollY,
                windowWidth: document.documentElement.scrollWidth
            });
        } catch (err) {
            hidden.forEach(([el, v]) => { el.style.visibility = v; });
            console.warn('html2canvas capture failed, using text fallback:', err);
            return this.generateResumeText(data);
        }
        hidden.forEach(([el, v]) => { el.style.visibility = v; });

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const imgW = pageW;
        const imgH = canvas.height * imgW / canvas.width;
        let img;
        try {
            img = canvas.toDataURL('image/jpeg', 0.92);
        } catch (err) {
            // A cross-origin image (e.g. profile photo) tainted the canvas.
            console.warn('Canvas tainted, using text fallback:', err);
            return this.generateResumeText(data);
        }

        // Slice the tall capture across as many A4 pages as needed.
        let heightLeft = imgH;
        let position = 0;
        doc.addImage(img, 'JPEG', 0, position, imgW, imgH);
        heightLeft -= pageH;
        while (heightLeft > 0) {
            position -= pageH;
            doc.addPage();
            doc.addImage(img, 'JPEG', 0, position, imgW, imgH);
            heightLeft -= pageH;
        }

        const profile = data.profile || {};
        doc.save(`${profile.name || 'resume'}_이력서.pdf`);
    },

    // Text-only fallback (used only when html2canvas is unavailable).
    async generateResumeText(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Get font settings from data
        const fontSettings = data.siteSettings?.font;

        // Try to load custom font or fallback to Korean font
        const fontLoaded = await PDFFontLoader.registerFont(doc, fontSettings);

        if (!fontLoaded) {
            // Fallback: Use Unicode font or show warning
            console.warn('Font not loaded, text may not display correctly');
        } else {
            console.log('PDF using font:', PDFFontLoader.fontName);
        }

        const profile = data.profile;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = 20;

        // Title
        doc.setFontSize(24);
        doc.text('이력서', pageWidth / 2, y, { align: 'center' });
        y += 15;

        // Profile section
        doc.setFontSize(12);

        // Name
        doc.setFontSize(18);
        doc.text(profile.name || '', margin, y);
        y += 10;

        doc.setFontSize(11);

        // Contact info
        if (profile.kakaoId) {
            doc.text(`카카오톡: ${profile.kakaoId}`, margin, y);
            y += 7;
        }

        // Job roles
        if (profile.jobRoles && profile.jobRoles.length > 0) {
            doc.text(`가능직무: ${profile.jobRoles.join(', ')}`, margin, y);
            y += 7;
        }

        // Skills
        if (profile.skills && profile.skills.length > 0) {
            const skillsText = `가능스킬: ${profile.skills.slice(0, 10).join(', ')}`;
            const splitSkills = doc.splitTextToSize(skillsText, pageWidth - margin * 2);
            doc.text(splitSkills, margin, y);
            y += splitSkills.length * 6;
        }

        // Education
        if (profile.education) {
            doc.text(`교육이수: ${profile.education}`, margin, y);
            y += 7;
        }

        // Residence
        if (profile.residence) {
            doc.text(`거주: ${profile.residence}`, margin, y);
            y += 7;
        }

        // Employment status (if visible)
        if (profile.showEmployment !== false && profile.employmentStatus) {
            doc.text(`${profile.employmentStatus} : ${profile.desiredSalary || ''}`, margin, y);
            y += 7;
        }

        y += 5;

        // Motto
        if (profile.motto) {
            doc.setFontSize(10);
            doc.setTextColor(100);
            const mottoText = `"${profile.motto}"`;
            const splitMotto = doc.splitTextToSize(mottoText, pageWidth - margin * 2);
            doc.text(splitMotto, margin, y);
            y += splitMotto.length * 5 + 5;
            doc.setTextColor(0);
        }

        // AI Tools section
        if (data.aiTools && data.aiTools.length > 0) {
            y += 5;
            doc.setFontSize(14);
            doc.text(`사용해본 AI (${data.aiTools.length}가지)`, margin, y);
            y += 8;

            doc.setFontSize(10);
            data.aiTools.forEach((tool, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`${index + 1}. ${tool.name}: ${tool.description}`, margin, y);
                y += 6;
            });
        }

        // Experience sections
        y += 5;
        if (data.relatedExperience && data.relatedExperience.items.length > 0) {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(14);
            doc.text(`관련경력 (${data.relatedExperience.totalPeriod})`, margin, y);
            y += 8;

            doc.setFontSize(10);
            data.relatedExperience.items.forEach(item => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`• ${item.company} (${item.period}) - ${item.duration}`, margin, y);
                y += 6;
            });
        }

        y += 5;
        if (data.otherExperience && data.otherExperience.items.length > 0) {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(14);
            doc.text(`기타경력 (${data.otherExperience.totalPeriod})`, margin, y);
            y += 8;

            doc.setFontSize(10);
            data.otherExperience.items.forEach(item => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`• ${item.company} (${item.period}) - ${item.duration}`, margin, y);
                y += 6;
            });
        }

        // Self evaluation
        if (data.evaluation && data.evaluation.text) {
            y += 5;
            if (y > 230) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(14);
            doc.text('자기평가', margin, y);
            y += 8;

            doc.setFontSize(10);
            const evalText = doc.splitTextToSize(data.evaluation.text, pageWidth - margin * 2);
            doc.text(evalText, margin, y);
        }

        // Save
        doc.save(`${profile.name || 'resume'}_이력서.pdf`);
    }
};

// Export
window.PDFFontLoader = PDFFontLoader;
window.PDFGenerator = PDFGenerator;
