// PDF Korean Font Loader for jsPDF
// This loads custom font or Noto Sans KR font and registers it with jsPDF

const PDFFontLoader = {
    fontLoaded: false,
    fontData: null,
    fontName: 'NotoSansKR',
    customFontName: null,

    // Extract font URL from @font-face code
    extractFontUrl(fontFaceCode, targetWeight = '400') {
        if (!fontFaceCode) return null;

        // Split by @font-face blocks
        const blocks = fontFaceCode.split('@font-face').filter(b => b.trim());

        for (const block of blocks) {
            // Check weight
            const weightMatch = block.match(/font-weight:\s*(\d+)/);
            const weight = weightMatch ? weightMatch[1] : '400';

            if (weight === targetWeight) {
                // Extract URL - prefer ttf/otf over woff2
                const urlMatch = block.match(/url\(['"]?([^'")\s]+\.(ttf|otf))['"]?\)/i);
                if (urlMatch) {
                    return urlMatch[1];
                }
                // Fall back to woff2 URL
                const woff2Match = block.match(/url\(['"]?([^'")\s]+\.woff2?)['"]?\)/i);
                if (woff2Match) {
                    return woff2Match[1];
                }
            }
        }

        // If no matching weight, try to find any ttf/otf
        const anyUrlMatch = fontFaceCode.match(/url\(['"]?([^'")\s]+\.(ttf|otf))['"]?\)/i);
        if (anyUrlMatch) {
            return anyUrlMatch[1];
        }

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

    // Load font from CDN (fallback)
    async loadDefaultFont() {
        // Font URLs in order of preference
        const fontUrls = [
            // Google Fonts direct link
            'https://fonts.gstatic.com/s/notosanskr/v27/Pby6FmXiEBPT4ITbgNA5CgmOelzI7g.otf',
            // jsDelivr hosted Noto Sans KR
            'https://cdn.jsdelivr.net/npm/@aspect-ratio/noto-sans-kr@0.0.7/fonts/NotoSansKR-Regular.otf',
            // GitHub hosted fallback
            'https://raw.githubusercontent.com/nickshanks/Allsorts/main/tests/fonts/noto/NotoSansKR-Regular.otf'
        ];

        for (const url of fontUrls) {
            try {
                console.log('Trying to load font from:', url);
                const response = await fetch(url);
                if (response.ok) {
                    const blob = await response.blob();
                    const base64 = await this.blobToBase64(blob);
                    console.log('Font loaded successfully from:', url);
                    return base64;
                }
            } catch (error) {
                console.warn('Failed to load font from:', url, error);
            }
        }

        console.error('All font sources failed');
        return null;
    },

    // Main load function - always use default Korean font for PDF (woff2 not supported by jsPDF)
    async loadFont(fontSettings) {
        if (this.fontLoaded) return this.fontData;

        // Always use default Noto Sans KR font for PDF
        // Custom woff2 fonts are not supported by jsPDF
        console.log('Loading default Noto Sans KR font for PDF');
        this.fontData = await this.loadDefaultFont();
        this.fontLoaded = !!this.fontData;
        this.fontName = 'NotoSansKR';
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
        try {
            const fontData = await this.loadFont(fontSettings);
            if (fontData) {
                const fileName = `${this.fontName}.otf`;
                doc.addFileToVFS(fileName, fontData);
                doc.addFont(fileName, this.fontName, 'normal');
                doc.setFont(this.fontName);
                console.log('Font registered successfully:', this.fontName);
                return true;
            }
        } catch (error) {
            console.error('Failed to register font:', error);
        }

        // Font registration failed, use default helvetica
        console.log('Using default helvetica font');
        return false;
    }
};

// Alternative: Use html2canvas approach for Korean text
const PDFGenerator = {
    async generateResume(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Get font settings from data
        const fontSettings = data?.siteSettings?.font;

        // Try to load custom font or fallback to Korean font
        const fontLoaded = await PDFFontLoader.registerFont(doc, fontSettings);

        if (!fontLoaded) {
            // Fallback: Use Unicode font or show warning
            console.warn('Font not loaded, text may not display correctly');
        } else {
            console.log('PDF using font:', PDFFontLoader.fontName);
        }

        const profile = data?.profile || {};
        const sectionTitles = data?.siteSettings?.sectionTitles || {};
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
        doc.text(profile.name || '이름 없음', margin, y);
        y += 10;

        doc.setFontSize(11);

        // Contact info
        if (profile.kakaoId) {
            doc.text(`카카오톡: ${profile.kakaoId}`, margin, y);
            y += 7;
        }

        // Job roles
        if (profile.jobRoles?.length > 0) {
            doc.text(`가능직무: ${profile.jobRoles.join(', ')}`, margin, y);
            y += 7;
        }

        // Skills
        if (profile.skills?.length > 0) {
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
        if (data?.aiTools?.length > 0) {
            y += 5;
            doc.setFontSize(14);
            const aiTitle = sectionTitles.aitools || '사용해본 AI';
            doc.text(`${aiTitle} (${data.aiTools.length}가지)`, margin, y);
            y += 8;

            doc.setFontSize(10);
            data.aiTools.forEach((tool, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`${index + 1}. ${tool.name || ''}: ${tool.description || ''}`, margin, y);
                y += 6;
            });
        }

        // Experience sections
        y += 5;
        if (data?.relatedExperience?.items?.length > 0) {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(14);
            const relatedTitle = sectionTitles.related || '관련경력';
            doc.text(`${relatedTitle} (${data.relatedExperience.totalPeriod || ''})`, margin, y);
            y += 8;

            doc.setFontSize(10);
            data.relatedExperience.items.forEach(item => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`• ${item.company || ''} (${item.period || ''}) - ${item.duration || ''}`, margin, y);
                y += 6;
            });
        }

        y += 5;
        if (data?.otherExperience?.items?.length > 0) {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(14);
            const otherTitle = sectionTitles.other || '기타경력';
            doc.text(`${otherTitle} (${data.otherExperience.totalPeriod || ''})`, margin, y);
            y += 8;

            doc.setFontSize(10);
            data.otherExperience.items.forEach(item => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`• ${item.company || ''} (${item.period || ''}) - ${item.duration || ''}`, margin, y);
                y += 6;
            });
        }

        // Self evaluation
        if (data?.evaluation?.text) {
            y += 5;
            if (y > 230) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(14);
            const evalTitle = sectionTitles.evaluation || '자기평가';
            doc.text(evalTitle, margin, y);
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
