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
    // Capture the WHOLE on-screen portfolio (자기소개 → 영상 → 웹/모바일/팝업/배너 →
    // Contact) exactly as designed and place it into a single native-size PDF page,
    // so the output matches what the user sees and stays at original scale. Before
    // capturing we massage a few things that don't translate to a static image:
    //  · YouTube iframe → thumbnail + clickable URL
    //  · carousels → arrows removed, slides stacked vertically
    //  · Contact centered, calendar (bottom dates) removed
    //  · external images inlined so the profile photo isn't dropped by CORS
    //  · project buttons kept and made clickable in the PDF
    async generateResume(data) {
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;
        // Scope the capture to the 자기소개(#about) section. It renders reliably;
        // capturing the whole page stalls html2canvas on the portfolio-carousel
        // sections. #about already contains the intro video (turned into a
        // thumbnail below).
        let target = document.querySelector('#about') ||
                       document.querySelector('.about-section') ||
                       document.querySelector('.main') ||
                       document.querySelector('main');

        if (!html2canvas || !target) {
            return this.generateResumeText(data);
        }

        const prep = await this._prepExport(target, data);

        // Time-box the capture so a stall can't freeze the download button.
        const canvas = await this._capture(html2canvas, target, 25000);
        if (!canvas) {
            prep.restore();
            console.warn('html2canvas capture failed/timed out, using text fallback');
            return this.generateResumeText(data);
        }

        // Read link positions while the export DOM is still in place, then restore.
        const targetRect = target.getBoundingClientRect();
        const fullWpx = targetRect.width;
        const fullHpx = targetRect.height;
        const links = [];
        prep.linkEls.forEach(a => {
            const r = a.getBoundingClientRect();
            const y = r.top - targetRect.top;
            // keep only links that fall inside the captured area
            if (r.width && r.height && a.href && y >= 0 && y <= fullHpx) {
                links.push({ url: a.href, x: r.left - targetRect.left, y: y, w: r.width, h: r.height });
            }
        });
        const contentWpx = prep.contentW || fullWpx;
        prep.restore();

        let img;
        try {
            img = canvas.toDataURL('image/jpeg', 0.92);
        } catch (err) {
            console.warn('Canvas tainted, using text fallback:', err);
            return this.generateResumeText(data);
        }

        // Native-size single page (unit:'px') → 100% zoom shows original scale.
        // Trim HALF of the empty left/right margin around the centered content.
        const sideGap = Math.max(0, (fullWpx - contentWpx) / 2);
        const trimPerSide = sideGap / 2;
        const scaleUsed = canvas.width / fullWpx;
        const imgWpx = fullWpx;
        const imgHpx = canvas.height / scaleUsed;
        const pageWpx = Math.max(1, Math.round(fullWpx - trimPerSide * 2));
        const pageHpx = Math.max(1, Math.round(imgHpx));

        const doc = new jsPDF({
            orientation: pageHpx >= pageWpx ? 'portrait' : 'landscape',
            unit: 'px',
            format: [pageWpx, pageHpx],
            hotfixes: ['px_scaling']
        });
        doc.addImage(img, 'JPEG', -trimPerSide, 0, imgWpx, imgHpx);
        // Make each project button / video URL clickable (shifted by the trim).
        links.forEach(l => {
            try { doc.link(l.x - trimPerSide, l.y, l.w, l.h, { url: l.url }); } catch (e) { }
        });

        const profile = data.profile || {};
        doc.save(`${profile.name || 'resume'}_포트폴리오.pdf`);
    },

    // Temporarily transform the page into a print-friendly view for capture, and
    // return { restore, linkEls, contentW }. All changes are reverted by restore().
    async _prepExport(target, data) {
        const undo = [];

        // Hide chrome + carousel arrows + calendar; center contact; stack slides.
        const style = document.createElement('style');
        style.id = 'pdf-export-style';
        style.textContent =
            '.header,.section-nav,.theme-toggle,.owner-menu,.s1-fab,.menu-toggle,[data-action="download-pdf"],.footer{display:none!important;}' +
            '.calendar-container{display:none!important;}' +
            '#contact .contact-grid{display:block!important;text-align:center!important;}' +
            '#contact .contact-info{max-width:560px;margin:0 auto!important;}' +
            '#contact .contact-list{align-items:center!important;}' +
            '#contact .contact-item{justify-content:center!important;}' +
            '.swiper-wrapper{display:block!important;transform:none!important;height:auto!important;}' +
            '.swiper-slide{width:100%!important;margin:0 0 16px 0!important;flex-shrink:0!important;}' +
            '.swiper-button-next,.swiper-button-prev,.swiper-pagination,.swiper-scrollbar{display:none!important;}';
        document.head.appendChild(style);
        undo.push(() => style.remove());

        // YouTube iframe → thumbnail image + clickable URL underneath. Fetch the
        // thumbnail to a data URL FIRST so html2canvas never has to load an
        // external image mid-capture (which can stall it).
        const vc = target.querySelector('[data-content="video"]');
        if (vc) {
            const iframe = vc.querySelector('iframe');
            const url = data.video && data.video.url;
            const id = url ? this._youTubeId(url) : null;
            if (iframe && id) {
                let thumbTag = '';
                try {
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 5000);
                    let resp;
                    try { resp = await fetch('https://i.ytimg.com/vi/' + id + '/hqdefault.jpg', { mode: 'cors', signal: ctrl.signal }); }
                    finally { clearTimeout(timer); }
                    if (resp && resp.ok) {
                        const blob = await resp.blob();
                        const dataUrl = await new Promise((res, rej) => { const fr = new FileReader(); fr.onloadend = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });
                        thumbTag = '<img src="' + dataUrl + '" style="max-width:100%;border-radius:12px;display:block;margin:0 auto">';
                    }
                } catch (e) { /* no thumbnail — fall back to a labelled box */ }
                if (!thumbTag) {
                    thumbTag = '<div style="width:100%;max-width:640px;aspect-ratio:16/9;margin:0 auto;background:#111;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:18px">▶ 영상 보기</div>';
                }
                const orig = vc.innerHTML;
                vc.innerHTML =
                    '<div style="text-align:center">' + thumbTag +
                    '<a class="pdf-yt-link" href="' + url + '" ' +
                    'style="display:inline-block;margin-top:10px;color:#2563eb;text-decoration:underline;font-size:15px;word-break:break-all">' +
                    url + '</a></div>';
                undo.push(() => { vc.innerHTML = orig; });
            }
        }

        // Inline external images (profile photo, project images) so CORS doesn't
        // drop them from the capture.
        const imgs = Array.from(target.querySelectorAll('img')).filter(im => /^https?:/i.test(im.src));
        await Promise.all(imgs.map(async im => {
            try {
                // Time-box each fetch so a slow/blocked image can't stall the export.
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), 5000);
                let resp;
                try { resp = await fetch(im.src, { mode: 'cors', signal: ctrl.signal }); }
                finally { clearTimeout(timer); }
                if (!resp.ok) return;
                const blob = await resp.blob();
                const dataUrl = await new Promise((res, rej) => {
                    const fr = new FileReader();
                    fr.onloadend = () => res(fr.result);
                    fr.onerror = rej;
                    fr.readAsDataURL(blob);
                });
                const oldSrc = im.getAttribute('src');
                im.setAttribute('src', dataUrl);
                undo.push(() => im.setAttribute('src', oldSrc));
            } catch (e) { /* leave as-is; may render blank if CORS unset */ }
        }));

        // Collect clickable links (project buttons + the video URL).
        const linkEls = Array.from(target.querySelectorAll('.portfolio-item a[href], a.pdf-yt-link'));

        const inner = target.querySelector('.container');
        const contentW = inner ? inner.getBoundingClientRect().width : target.getBoundingClientRect().width;

        return { restore: () => undo.forEach(f => { try { f(); } catch (e) { } }), linkEls, contentW };
    },

    _youTubeId(url) {
        const m = String(url).match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
        return m ? m[1] : null;
    },

    // Run html2canvas but resolve to null if it takes longer than `ms` (a stalled
    // capture shouldn't hang the whole export — the caller falls back).
    async _capture(html2canvas, el, ms) {
        const opts = {
            scale: 2, useCORS: true, backgroundColor: '#ffffff',
            scrollX: 0, scrollY: -window.scrollY,
            windowWidth: document.documentElement.scrollWidth,
            imageTimeout: 8000
        };
        try {
            return await Promise.race([
                html2canvas(el, opts),
                new Promise(resolve => setTimeout(() => resolve(null), ms))
            ]);
        } catch (err) {
            console.warn('html2canvas error:', err);
            return null;
        }
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
