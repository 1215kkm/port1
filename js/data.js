// Portfolio Data Management with LocalStorage

// Default Data Structure
const defaultData = {
    // Personal Info
    profile: {
        name: "강경모",
        kakaoId: "kkm1215",
        jobRoles: ["쇼핑몰 디자이너", "마케터", "퍼블리셔", "프론트엔드"],
        skills: ["포토샵", "일러스트", "인디자인", "html", "javascript", "포토샵", "일러스트", "인디자인", "html", "javascript", "포토샵", "일러스트", "인디자인", "html", "javascript"],
        education: "성남그린컴퓨터 강경모쌤",
        residence: "경기 용인시 기흥구 청덕동",
        employmentStatus: "재직중",
        desiredSalary: "연봉3,800",
        profileImage: "",
        motto: "부지런히 하면 세상에 어려울 것 하나 없다"
    },

    // AI Tools Used
    aiTools: [
        { id: 1, name: "미드저니", description: "비쥬얼 이미지를 제작하여 포토샵으로 보정후 활용가능" },
        { id: 2, name: "gpt", description: "레이아웃 구성과 각 섹션 문구를 추천받음" },
        { id: 3, name: "클로드", description: "막히는 스크립트 도움을 받음" },
        { id: 4, name: "이디오그램", description: "시안 뽑을때 레퍼런스로 사용해봄" }
    ],

    // Related Experience
    relatedExperience: {
        totalPeriod: "총 2년 3개월",
        items: [
            { id: 1, company: "[웹에이전시] 주노소프트", period: "2024.03 ~ 2025.02", duration: "1년" },
            { id: 2, company: "[게임개발업체] 아이즈앤터테인먼트", period: "2024.03 ~ 2025.02", duration: "1년" },
            { id: 3, company: "[쇼핑몰] 주노소프트", period: "2024.03 ~ 2025.02", duration: "1년" },
            { id: 4, company: "[SI 업체] 주노소프트", period: "2024.03 ~ 2025.02", duration: "1년" },
            { id: 5, company: "[웹에이전시] 주노소프트", period: "2024.03 ~ 2025.02", duration: "1년" }
        ]
    },

    // Other Experience
    otherExperience: {
        totalPeriod: "총 8년 3개월",
        items: [
            { id: 1, company: "[CU] 점장", period: "2024.03 ~ 2025.02", duration: "1년" },
            { id: 2, company: "[GS25] 파트타임 알바", period: "2024.03 ~ 2025.02", duration: "1년" },
            { id: 3, company: "[웹에이전시] 주노소프트", period: "2024.03 ~ 2025.02", duration: "1년" },
            { id: 4, company: "[웹에이전시] 주노소프트", period: "2024.03 ~ 2025.02", duration: "1년" },
            { id: 5, company: "[웹에이전시] 주노소프트", period: "2024.03 ~ 2025.02", duration: "1년" }
        ]
    },

    // Self Evaluation
    evaluation: {
        text: `사용자의 흐름을 이해하고, 그에 맞는 정보 구조를 설계하는 데 강점을 가지고 있습니다.
기획 단계에서부터 사용자의 목적과 경험 동선을 고려해 UX를 구상하고, 이를 바탕으로 명확한 인터페이스로 연결하는 데 집중합니다.
디폴리오에서 받은 실무형 테스트와 멘토 피드백을 통해 부족했던 시각적 완성도와 레이아웃 균형 감각을 개선할 수 있었고,
특히 협업 프로젝트에서 팀원들과의 커뮤니케이션 속도와 정리력을 높이는 데 많은 성장을 경험했습니다.
저는 디자인을 '예쁘게'보다는 '왜 이렇게 만들었는가'를 설명할 수 있어야 한다고 생각하며,
항상 문제를 정의하고 해결하는 과정을 중요하게 여깁니다.
이러한 기준 아래에서 포트폴리오를 구성했고, 실제 업무 환경에서도 빠르게 적응하며 기여할 수 있을 것이라 생각합니다.`,
        radarChart: [
            { label: "리딩", value: 80 },
            { label: "문제해결력", value: 75 },
            { label: "눈치", value: 70 },
            { label: "피드백 수용력", value: 85 },
            { label: "커뮤니케이션", value: 90 },
            { label: "상대케어력", value: 65 }
        ]
    },

    // Video
    video: {
        type: "youtube", // youtube or video
        url: ""
    },

    // Menu Items
    menuItems: [
        { id: "about", label: "자기소개", visible: true },
        { id: "web-mobile", label: "web&mobile", visible: true },
        { id: "popup-banner", label: "팝업&배너", visible: true },
        { id: "detail-page", label: "상세페이지", visible: true },
        { id: "contact", label: "contact", visible: true }
    ],

    // Section Order
    sectionOrder: ["about", "web-mobile", "popup-banner", "detail-page", "contact"],

    // Portfolio Items (Solo)
    portfolioSolo: {
        displayMode: "single", // single, grid, masonry, slider
        items: [
            {
                id: 1,
                section: "web-mobile",
                title: "웹사이트 리뉴얼 프로젝트",
                subject: "기업 홈페이지 리뉴얼",
                target: "일반 사용자",
                contribution: 80,
                review: "UX/UI 전반을 담당하며 사용성을 크게 개선했습니다.",
                thumbnails: [],
                links: [
                    { label: "상세보기", url: "#" }
                ]
            }
        ]
    },

    // Portfolio Items (AI)
    portfolioAI: {
        displayMode: "single",
        projects: [
            {
                id: 1,
                title: "숲나들이 APP 제작",
                links: [
                    { label: "제목제목제목", url: "http://merong.co.kr" },
                    { label: "제목제목제목", url: "http://merong.co.kr" }
                ],
                team: "6명 (기획1, 디자이너2, 퍼블리셔1, 프론트엔드1, 백엔드1)",
                myRole: "기획, 디자이너, 퍼블리셔",
                duration: {
                    total: "4개월",
                    planning: "기획~1개월",
                    design: "디자인~1개월",
                    publishing: "퍼블~1개월"
                },
                images: [],
                myRoleDetail: [
                    "전체 디자인 가이드 제작",
                    "화면 흐름 총괄 / 와이어프레임 작성",
                    "회의록 정리 및 피드백 취합"
                ],
                contributionBars: [
                    { label: "기획", value: 70 },
                    { label: "디자인", value: 90 },
                    { label: "퍼블", value: 60 }
                ],
                descriptions: {
                    aiUsage: `사용자의 흐름을 이해하고, 그에 맞는 정보 구조를 설계하는 데 강점을 가지고 있습니다.
기획 단계에서부터 사용자의 목적과 경험 동선을 고려해 UX를 구상하고, 이를 바탕으로 명확한 인터페이스로 연결하는 데 집중합니다.
디폴리오에서 받은 실무형 테스트와 멘토 피드백을 통해 부족했던 시각적 완성도와 레이아웃 균형 감각을 개선할 수 있었고,`,
                    explanation: `사용자의 흐름을 이해하고, 그에 맞는 정보 구조를 설계하는 데 강점을 가지고 있습니다.
기획 단계에서부터 사용자의 목적과 경험 동선을 고려해 UX를 구상하고, 이를 바탕으로 명확한 인터페이스로 연결하는 데 집중합니다.
디폴리오에서 받은 실무형 테스트와 멘토 피드백을 통해 부족했던 시각적 완성도와 레이아웃 균형 감각을 개선할 수 있었고,`,
                    challenges: `사용자의 흐름을 이해하고, 그에 맞는 정보 구조를 설계하는 데 강점을 가지고 있습니다.
기획 단계에서부터 사용자의 목적과 경험 동선을 고려해 UX를 구상하고, 이를 바탕으로 명확한 인터페이스로 연결하는 데 집중합니다.
디폴리오에서 받은 실무형 테스트와 멘토 피드백을 통해 부족했던 시각적 완성도와 레이아웃 균형 감각을 개선할 수 있었고,`,
                    conclusion: `사용자의 흐름을 이해하고, 그에 맞는 정보 구조를 설계하는 데 강점을 가지고 있습니다.
기획 단계에서부터 사용자의 목적과 경험 동선을 고려해 UX를 구상하고, 이를 바탕으로 명확한 인터페이스로 연결하는 데 집중합니다.
디폴리오에서 받은 실무형 테스트와 멘토 피드백을 통해 부족했던 시각적 완성도와 레이아웃 균형 감각을 개선할 수 있었고,`
                },
                clientFeedback: [
                    { stage: "초기 요청", request: "깔끔하고 브랜드 컬러를 잘 살려주세요.", response: "브랜드 가이드 분석 후 3가지 시안 제안" },
                    { stage: "중간 요청", request: "폰트 크기와 간격이 좀 더 여유 있었으면 좋겠어요.", response: "전체 타이포 계층 재조정 및 간격 수정" },
                    { stage: "최종 요청", request: "전체 톤과 구조가 만족스럽습니다. 메인 배너가 특히 좋아요.", response: "최종 디자인 확정 후 전달 완료" }
                ],
                videoUrl: ""
            }
        ]
    },

    // Portfolio Items (Team)
    portfolioTeam: {
        displayMode: "single",
        projects: []
    },

    // Contact Info
    contact: {
        name: "강경모",
        phone: "010-1234-5678",
        email: "kkm1215@email.com",
        message: "감사합니다"
    },

    // Interview Schedule
    interviews: [
        { id: 1, date: "2025-02-10", company: "주노소프트", time: "14:00" },
        { id: 2, date: "2025-02-15", company: "웹네스트", time: "10:30" }
    ],

    // Theme Settings
    theme: {
        current: "light",
        modes: [
            { id: "light", name: "라이트 모드", colors: {} },
            { id: "dark", name: "다크 모드", colors: {} }
        ],
        customColors: {
            primary: "#3498db",
            secondary: "#2ecc71",
            accent: "#e74c3c"
        }
    },

    // CSS Variable Overrides
    cssVariables: {
        colorPrimary: "#3498db",
        colorSecondary: "#2ecc71",
        colorAccent: "#e74c3c",
        radiusSm: "4px",
        radiusMd: "8px",
        radiusLg: "12px",
        fontBase: "1rem"
    }
};

// Data Manager Class
class DataManager {
    constructor() {
        this.storageKey = 'portfolio_data';
        this.data = this.loadData();
    }

    // Load data from localStorage or use defaults
    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure all keys exist
                return this.deepMerge(defaultData, parsed);
            }
        } catch (e) {
            console.error('Error loading data:', e);
        }
        return JSON.parse(JSON.stringify(defaultData));
    }

    // Save data to localStorage
    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            // Dispatch custom event for other pages to update
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: this.data }));
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            return false;
        }
    }

    // Deep merge objects
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
                if (Array.isArray(source[key])) {
                    result[key] = source[key];
                } else {
                    result[key] = this.deepMerge(target[key], source[key]);
                }
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    // Get all data
    getData() {
        return this.data;
    }

    // Get specific section data
    get(key) {
        return key.split('.').reduce((obj, k) => obj?.[k], this.data);
    }

    // Set specific section data
    set(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, k) => {
            if (!obj[k]) obj[k] = {};
            return obj[k];
        }, this.data);
        target[lastKey] = value;
        this.saveData();
    }

    // Update profile
    updateProfile(updates) {
        this.data.profile = { ...this.data.profile, ...updates };
        this.saveData();
    }

    // Add AI Tool
    addAITool(tool) {
        const newId = Math.max(0, ...this.data.aiTools.map(t => t.id)) + 1;
        this.data.aiTools.push({ id: newId, ...tool });
        this.saveData();
    }

    // Update AI Tool
    updateAITool(id, updates) {
        const index = this.data.aiTools.findIndex(t => t.id === id);
        if (index !== -1) {
            this.data.aiTools[index] = { ...this.data.aiTools[index], ...updates };
            this.saveData();
        }
    }

    // Delete AI Tool
    deleteAITool(id) {
        this.data.aiTools = this.data.aiTools.filter(t => t.id !== id);
        this.saveData();
    }

    // Add Experience
    addExperience(type, item) {
        const list = type === 'related' ? this.data.relatedExperience : this.data.otherExperience;
        const newId = Math.max(0, ...list.items.map(i => i.id)) + 1;
        list.items.push({ id: newId, ...item });
        this.saveData();
    }

    // Update Experience
    updateExperience(type, id, updates) {
        const list = type === 'related' ? this.data.relatedExperience : this.data.otherExperience;
        const index = list.items.findIndex(i => i.id === id);
        if (index !== -1) {
            list.items[index] = { ...list.items[index], ...updates };
            this.saveData();
        }
    }

    // Delete Experience
    deleteExperience(type, id) {
        const list = type === 'related' ? this.data.relatedExperience : this.data.otherExperience;
        list.items = list.items.filter(i => i.id !== id);
        this.saveData();
    }

    // Update Evaluation
    updateEvaluation(updates) {
        this.data.evaluation = { ...this.data.evaluation, ...updates };
        this.saveData();
    }

    // Update Radar Chart
    updateRadarChart(chartData) {
        this.data.evaluation.radarChart = chartData;
        this.saveData();
    }

    // Add Menu Item
    addMenuItem(item) {
        const newId = `menu-${Date.now()}`;
        this.data.menuItems.push({ id: newId, ...item, visible: true });
        this.data.sectionOrder.push(newId);
        this.saveData();
    }

    // Update Menu Item
    updateMenuItem(id, updates) {
        const index = this.data.menuItems.findIndex(m => m.id === id);
        if (index !== -1) {
            this.data.menuItems[index] = { ...this.data.menuItems[index], ...updates };
            this.saveData();
        }
    }

    // Delete Menu Item
    deleteMenuItem(id) {
        this.data.menuItems = this.data.menuItems.filter(m => m.id !== id);
        this.data.sectionOrder = this.data.sectionOrder.filter(s => s !== id);
        this.saveData();
    }

    // Reorder Sections
    reorderSections(newOrder) {
        this.data.sectionOrder = newOrder;
        this.saveData();
    }

    // Add Portfolio Item (Solo)
    addPortfolioItem(section, item) {
        const newId = Math.max(0, ...this.data.portfolioSolo.items.map(i => i.id)) + 1;
        this.data.portfolioSolo.items.push({ id: newId, section, ...item });
        this.saveData();
    }

    // Update Portfolio Item (Solo)
    updatePortfolioItem(id, updates) {
        const index = this.data.portfolioSolo.items.findIndex(i => i.id === id);
        if (index !== -1) {
            this.data.portfolioSolo.items[index] = { ...this.data.portfolioSolo.items[index], ...updates };
            this.saveData();
        }
    }

    // Delete Portfolio Item (Solo)
    deletePortfolioItem(id) {
        this.data.portfolioSolo.items = this.data.portfolioSolo.items.filter(i => i.id !== id);
        this.saveData();
    }

    // Set Portfolio Display Mode
    setDisplayMode(portfolio, mode) {
        if (portfolio === 'solo') {
            this.data.portfolioSolo.displayMode = mode;
        } else if (portfolio === 'ai') {
            this.data.portfolioAI.displayMode = mode;
        } else if (portfolio === 'team') {
            this.data.portfolioTeam.displayMode = mode;
        }
        this.saveData();
    }

    // Add AI Project
    addAIProject(project) {
        const newId = Math.max(0, ...this.data.portfolioAI.projects.map(p => p.id)) + 1;
        this.data.portfolioAI.projects.push({ id: newId, ...project });
        this.saveData();
    }

    // Update AI Project
    updateAIProject(id, updates) {
        const index = this.data.portfolioAI.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this.data.portfolioAI.projects[index] = { ...this.data.portfolioAI.projects[index], ...updates };
            this.saveData();
        }
    }

    // Delete AI Project
    deleteAIProject(id) {
        this.data.portfolioAI.projects = this.data.portfolioAI.projects.filter(p => p.id !== id);
        this.saveData();
    }

    // Add Team Project
    addTeamProject(project) {
        const newId = Math.max(0, ...(this.data.portfolioTeam.projects || []).map(p => p.id), 0) + 1;
        if (!this.data.portfolioTeam.projects) this.data.portfolioTeam.projects = [];
        this.data.portfolioTeam.projects.push({ id: newId, ...project });
        this.saveData();
    }

    // Update Team Project
    updateTeamProject(id, updates) {
        const index = this.data.portfolioTeam.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this.data.portfolioTeam.projects[index] = { ...this.data.portfolioTeam.projects[index], ...updates };
            this.saveData();
        }
    }

    // Delete Team Project
    deleteTeamProject(id) {
        this.data.portfolioTeam.projects = this.data.portfolioTeam.projects.filter(p => p.id !== id);
        this.saveData();
    }

    // Update Contact
    updateContact(updates) {
        this.data.contact = { ...this.data.contact, ...updates };
        this.saveData();
    }

    // Add Interview
    addInterview(interview) {
        const newId = Math.max(0, ...this.data.interviews.map(i => i.id)) + 1;
        this.data.interviews.push({ id: newId, ...interview });
        this.saveData();
    }

    // Update Interview
    updateInterview(id, updates) {
        const index = this.data.interviews.findIndex(i => i.id === id);
        if (index !== -1) {
            this.data.interviews[index] = { ...this.data.interviews[index], ...updates };
            this.saveData();
        }
    }

    // Delete Interview
    deleteInterview(id) {
        this.data.interviews = this.data.interviews.filter(i => i.id !== id);
        this.saveData();
    }

    // Set Theme
    setTheme(themeId) {
        this.data.theme.current = themeId;
        this.saveData();
        this.applyTheme();
    }

    // Apply Theme
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.data.theme.current);
    }

    // Add Theme Mode
    addThemeMode(mode) {
        const newId = `theme-${Date.now()}`;
        this.data.theme.modes.push({ id: newId, ...mode });
        this.saveData();
    }

    // Update Theme Mode
    updateThemeMode(id, updates) {
        const index = this.data.theme.modes.findIndex(m => m.id === id);
        if (index !== -1) {
            this.data.theme.modes[index] = { ...this.data.theme.modes[index], ...updates };
            this.saveData();
        }
    }

    // Delete Theme Mode
    deleteThemeMode(id) {
        if (id === 'light' || id === 'dark') return; // Prevent deleting default themes
        this.data.theme.modes = this.data.theme.modes.filter(m => m.id !== id);
        if (this.data.theme.current === id) {
            this.setTheme('light');
        }
        this.saveData();
    }

    // Update CSS Variables
    updateCSSVariables(variables) {
        this.data.cssVariables = { ...this.data.cssVariables, ...variables };
        this.saveData();
        this.applyCSSVariables();
    }

    // Apply CSS Variables
    applyCSSVariables() {
        const root = document.documentElement;
        const vars = this.data.cssVariables;

        if (vars.colorPrimary) root.style.setProperty('--color-primary', vars.colorPrimary);
        if (vars.colorSecondary) root.style.setProperty('--color-secondary', vars.colorSecondary);
        if (vars.colorAccent) root.style.setProperty('--color-accent', vars.colorAccent);
        if (vars.radiusSm) root.style.setProperty('--radius-sm', vars.radiusSm);
        if (vars.radiusMd) root.style.setProperty('--radius-md', vars.radiusMd);
        if (vars.radiusLg) root.style.setProperty('--radius-lg', vars.radiusLg);
        if (vars.fontBase) root.style.setProperty('--font-base', vars.fontBase);
    }

    // Set Video
    setVideo(type, url) {
        this.data.video = { type, url };
        this.saveData();
    }

    // Reset to defaults
    reset() {
        this.data = JSON.parse(JSON.stringify(defaultData));
        this.saveData();
        this.applyTheme();
        this.applyCSSVariables();
    }

    // Export data as JSON
    exportData() {
        const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio-data.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Import data from JSON
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.data = this.deepMerge(defaultData, imported);
            this.saveData();
            this.applyTheme();
            this.applyCSSVariables();
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }
}

// Create global instance
const dataManager = new DataManager();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    dataManager.applyTheme();
    dataManager.applyCSSVariables();
});

// Export for use in other scripts
window.dataManager = dataManager;
window.DataManager = DataManager;
