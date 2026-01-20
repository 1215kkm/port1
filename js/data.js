// Portfolio Data Management with LocalStorage

// Default Data Structure
const defaultData = {
    // Site Settings
    siteSettings: {
        logo: {
            type: 'text', // 'text' or 'image'
            text: 'Portfolio',
            imageUrl: ''
        },
        font: {
            title: 'Paperlogse',
            content: 'Pretendard',
            fontFaceCode: ''
        }
    },

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
        showEmployment: true,
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        motto: "부지런히 하면 세상에 어려울 것 하나 없다"
    },

    // AI Tools Used
    aiTools: [
        { id: 1, name: "미드저니", description: "비쥬얼 이미지를 제작하여 포토샵으로 보정후 활용가능" },
        { id: 2, name: "gpt", description: "레이아웃 구성과 각 섹션 문구를 추천받음" },
        { id: 3, name: "클로드", description: "막히는 스크립트 도움을 받음" }
    ],

    // Related Experience
    relatedExperience: {
        totalPeriod: "총 2년 3개월",
        items: [
            { id: 1, company: "[웹에이전시] 주노소프트", period: "2024.03 ~ 2025.02", duration: "1년" },
            { id: 2, company: "[게임개발업체] 아이즈앤터테인먼트", period: "2024.03 ~ 2025.02", duration: "1년" }
        ]
    },

    // Other Experience
    otherExperience: {
        totalPeriod: "총 8년 3개월",
        items: [
            { id: 1, company: "[CU] 점장", period: "2024.03 ~ 2025.02", duration: "1년" },
            { id: 2, company: "[GS25] 파트타임 알바", period: "2024.03 ~ 2025.02", duration: "1년" }
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

    // Video (자기소개 영상)
    video: {
        type: "youtube",
        url: "https://youtu.be/n_1iSCbjvXs?si=4jBzfzBmeroO1WwS"
    },

    // Emoji Icons
    emojiIcons: {
        intro: {
            solo: "👤",
            ai: "🤖",
            team: "👥"
        },
        contact: {
            name: "👤",
            phone: "📞",
            email: "✉️"
        }
    },

    // Menu Items
    menuItems: [
        { id: "about", label: "자기소개", visible: true, isPortfolio: false },
        { id: "web-mobile", label: "웹&모바일", visible: true, isPortfolio: true },
        { id: "popup-banner", label: "팝업&배너", visible: true, isPortfolio: true },
        { id: "detail-page", label: "상세페이지", visible: true, isPortfolio: true },
        { id: "contact", label: "contact", visible: true, isPortfolio: false }
    ],

    // Section Order
    sectionOrder: ["about", "web-mobile", "popup-banner", "detail-page", "contact"],

    // Section Display Modes (per section)
    sectionDisplayModes: {
        "web-mobile": "grid",
        "popup-banner": "masonry",
        "detail-page": "single"
    },

    // Portfolio Items (Solo) - organized by section (각 섹션 1개씩 샘플)
    portfolioSolo: {
        items: [
            // 웹&모바일 섹션 샘플 (1개)
            {
                id: 1,
                section: "web-mobile",
                title: "기업 홈페이지 리뉴얼",
                subject: "B2B 기업 웹사이트",
                target: "기업 담당자",
                contributions: [
                    { label: "기획", value: 70 },
                    { label: "디자인", value: 90 },
                    { label: "퍼블", value: 85 }
                ],
                review: "UX/UI 전반을 담당하며 사용성을 크게 개선했습니다.",
                thumbnails: ["images/web-mobile-01.svg"],
                links: [{ label: "상세보기", url: "#" }]
            },

            // 팝업&배너 섹션 샘플 (1개)
            {
                id: 2,
                section: "popup-banner",
                title: "시즌 세일 팝업 디자인",
                subject: "프로모션 팝업",
                target: "쇼핑몰 방문자",
                contributions: [
                    { label: "디자인", value: 100 }
                ],
                review: "시선을 사로잡는 비주얼과 명확한 CTA로 전환율 15% 향상을 달성했습니다.",
                thumbnails: ["images/popup-banner-01.svg"],
                links: [{ label: "상세보기", url: "#" }]
            },

            // 상세페이지 섹션 샘플 (1개)
            {
                id: 3,
                section: "detail-page",
                title: "화장품 상세페이지",
                subject: "스킨케어 제품",
                target: "20-40대 여성",
                contributions: [
                    { label: "디자인", value: 100 }
                ],
                review: "제품의 특장점을 시각적으로 효과적으로 전달하여 구매 전환율을 높였습니다.",
                thumbnails: ["images/detail-page-01.svg"],
                links: [{ label: "상세보기", url: "#" }]
            }
        ]
    },

    // Portfolio Items (AI)
    portfolioAI: {
        projects: [
            {
                id: 1,
                title: "숲나들이 APP 제작",
                links: [
                    { label: "프로토타입", url: "https://figma.com/prototype" },
                    { label: "GitHub", url: "https://github.com/example" }
                ],
                team: "6명 (기획1, 디자이너2, 퍼블리셔1, 프론트엔드1, 백엔드1)",
                myRole: "기획, 디자이너, 퍼블리셔",
                duration: {
                    total: "4개월",
                    planning: "기획~1개월",
                    design: "디자인~1개월",
                    publishing: "퍼블~1개월"
                },
                images: [
                    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=400&h=300&fit=crop"
                ],
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
                    aiUsage: `미드저니를 활용하여 숲 관련 비주얼 이미지를 생성하고 포토샵으로 보정했습니다.
GPT를 통해 UX 라이팅과 메뉴 구조를 최적화했고, 클로드로 복잡한 인터랙션 로직을 구현했습니다.`,
                    explanation: `사용자의 흐름을 이해하고, 그에 맞는 정보 구조를 설계하는 데 강점을 가지고 있습니다.
기획 단계에서부터 사용자의 목적과 경험 동선을 고려해 UX를 구상하고, 이를 바탕으로 명확한 인터페이스로 연결하는 데 집중합니다.`,
                    challenges: `디자인 시스템 구축 과정에서 컴포넌트 재사용성과 일관성 유지가 가장 어려웠습니다.
특히 다크모드 지원을 위한 컬러 시스템 설계에 많은 시간을 투자했습니다.`,
                    conclusion: `AI 도구를 적극 활용하여 작업 효율을 크게 높일 수 있었고,
결과물의 품질도 향상시킬 수 있었습니다. 앞으로도 AI를 효과적으로 활용한 작업을 계속할 예정입니다.`
                },
                clientFeedback: [
                    { stage: "초기 요청", request: "깔끔하고 브랜드 컬러를 잘 살려주세요.", response: "브랜드 가이드 분석 후 3가지 시안 제안" },
                    { stage: "중간 요청", request: "폰트 크기와 간격이 좀 더 여유 있었으면 좋겠어요.", response: "전체 타이포 계층 재조정 및 간격 수정" },
                    { stage: "최종 요청", request: "전체 톤과 구조가 만족스럽습니다. 메인 배너가 특히 좋아요.", response: "최종 디자인 확정 후 전달 완료" }
                ],
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            {
                id: 2,
                title: "여행플래너 APP 제작",
                links: [
                    { label: "프로토타입", url: "https://figma.com/prototype2" }
                ],
                team: "4명 (기획1, 디자이너1, 프론트엔드1, 백엔드1)",
                myRole: "디자이너, 퍼블리셔",
                duration: {
                    total: "3개월",
                    planning: "기획~2주",
                    design: "디자인~1개월",
                    publishing: "퍼블~1개월"
                },
                images: [
                    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop"
                ],
                myRoleDetail: [
                    "UI 디자인 전담",
                    "반응형 퍼블리싱"
                ],
                contributionBars: [
                    { label: "기획", value: 30 },
                    { label: "디자인", value: 80 },
                    { label: "퍼블", value: 70 }
                ],
                descriptions: {
                    aiUsage: `ChatGPT로 여행 추천 알고리즘을 기획하고, 미드저니로 배경 이미지를 생성했습니다.`,
                    explanation: `여행지 추천 및 일정 관리 앱의 전체 UI를 설계했습니다.`,
                    challenges: `다양한 여행 스타일에 맞는 유연한 UI 구조 설계가 어려웠습니다.`,
                    conclusion: `AI를 활용해 다양한 시안을 빠르게 테스트할 수 있었습니다.`
                },
                clientFeedback: [],
                videoUrl: ""
            }
        ]
    },

    // Portfolio Items (Team)
    portfolioTeam: {
        projects: [
            {
                id: 1,
                title: "커머스 플랫폼 구축",
                links: [
                    { label: "라이브 사이트", url: "https://example.com" },
                    { label: "발표자료", url: "https://slides.com/example" }
                ],
                team: "8명 (PM1, 디자이너2, 프론트엔드3, 백엔드2)",
                myRole: "리드 디자이너",
                duration: {
                    total: "6개월",
                    planning: "기획~2개월",
                    design: "디자인~2개월",
                    publishing: "개발~2개월"
                },
                images: [
                    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
                ],
                myRoleDetail: [
                    "디자인 시스템 구축 및 관리",
                    "주요 페이지 UI/UX 설계",
                    "디자인 QA 및 개발팀 협업",
                    "사용자 테스트 진행 및 분석"
                ],
                contributionBars: [
                    { label: "기획", value: 50 },
                    { label: "디자인", value: 95 },
                    { label: "퍼블", value: 30 }
                ],
                descriptions: {
                    aiUsage: `팀 협업에서 Figma의 실시간 협업 기능을 적극 활용했고,
Slack과 Notion을 통해 디자인 피드백을 체계적으로 관리했습니다.`,
                    explanation: `대규모 이커머스 플랫폼의 전체 디자인을 담당했습니다.
사용자 리서치부터 최종 디자인 QA까지 전 과정에 참여했습니다.`,
                    challenges: `다양한 이해관계자들의 요구사항을 조율하는 것이 가장 어려웠습니다.
정기적인 디자인 리뷰 미팅을 통해 의견을 수렴하고 합의점을 찾았습니다.`,
                    conclusion: `팀 프로젝트를 통해 협업 능력과 커뮤니케이션 스킬이 크게 향상되었습니다.
특히 개발팀과의 협업 경험이 큰 자산이 되었습니다.`
                },
                clientFeedback: [
                    { stage: "킥오프", request: "기존 레거시 시스템과의 연계가 중요합니다.", response: "기존 시스템 분석 후 점진적 마이그레이션 계획 수립" },
                    { stage: "중간 검토", request: "모바일 사용자 비중이 높으니 모바일 UX에 신경써주세요.", response: "모바일 퍼스트 접근으로 전체 설계 재검토" },
                    { stage: "최종 검수", request: "예상보다 훨씬 좋은 결과물입니다.", response: "런칭 후 모니터링 및 개선 계획 공유" }
                ],
                videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            {
                id: 2,
                title: "사내 업무 관리 시스템",
                links: [
                    { label: "라이브 데모", url: "https://demo.example.com" }
                ],
                team: "5명 (PM1, 디자이너1, 프론트엔드2, 백엔드1)",
                myRole: "UI/UX 디자이너",
                duration: {
                    total: "4개월",
                    planning: "기획~1개월",
                    design: "디자인~1.5개월",
                    publishing: "개발~1.5개월"
                },
                images: [
                    "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop",
                    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop"
                ],
                myRoleDetail: [
                    "대시보드 UI 설계",
                    "사용자 플로우 최적화"
                ],
                contributionBars: [
                    { label: "기획", value: 40 },
                    { label: "디자인", value: 85 },
                    { label: "퍼블", value: 20 }
                ],
                descriptions: {
                    aiUsage: `Figma 플러그인을 활용하여 디자인 협업을 진행했습니다.`,
                    explanation: `기업 내부에서 사용할 업무 관리 시스템의 UI를 설계했습니다.`,
                    challenges: `복잡한 데이터 구조를 직관적으로 시각화하는 것이 과제였습니다.`,
                    conclusion: `팀원들과의 긴밀한 협업으로 프로젝트를 성공적으로 완료했습니다.`
                },
                clientFeedback: [],
                videoUrl: ""
            }
        ]
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
        { id: 1, date: "2026-01-15", company: "주노소프트", time: "14:00", location: "강남역 2번출구" },
        { id: 2, date: "2026-01-22", company: "웹네스트", time: "10:30", location: "판교 테크노밸리" },
        { id: 3, date: "2026-02-05", company: "디자인허브", time: "15:00", location: "홍대입구역" },
        { id: 4, date: "2026-02-18", company: "크리에이티브랩", time: "11:00", location: "삼성역 코엑스" }
    ],

    // Theme Settings
    theme: {
        current: "light",
        modes: [
            {
                id: "light",
                name: "라이트 모드",
                colors: {
                    primary: "#3498db",
                    secondary: "#2ecc71",
                    accent: "#e74c3c",
                    background: "#ffffff",
                    backgroundSecondary: "#f8f9fa",
                    backgroundTertiary: "#e9ecef",
                    text: "#212529",
                    textSecondary: "#6c757d",
                    textMuted: "#adb5bd",
                    border: "#dee2e6",
                    buttonBg: "#3498db",
                    buttonText: "#ffffff"
                }
            },
            {
                id: "dark",
                name: "다크 모드",
                colors: {
                    primary: "#5dade2",
                    secondary: "#58d68d",
                    accent: "#ec7063",
                    background: "#1a1a2e",
                    backgroundSecondary: "#16213e",
                    backgroundTertiary: "#0f3460",
                    text: "#eaeaea",
                    textSecondary: "#b8b8b8",
                    textMuted: "#6c6c6c",
                    border: "#3a3a5c",
                    buttonBg: "#5dade2",
                    buttonText: "#ffffff"
                }
            }
        ]
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

    // Update site settings
    updateSiteSettings(updates) {
        this.data.siteSettings = this.deepMerge(this.data.siteSettings, updates);
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
        const newId = item.id || `menu-${Date.now()}`;
        this.data.menuItems.push({ id: newId, ...item, visible: true, isPortfolio: item.isPortfolio !== false });
        this.data.sectionOrder.push(newId);
        // Initialize display mode for new portfolio section
        if (item.isPortfolio !== false) {
            this.data.sectionDisplayModes[newId] = 'grid';
        }
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
        // Remove display mode
        delete this.data.sectionDisplayModes[id];
        // Remove portfolio items for this section
        this.data.portfolioSolo.items = this.data.portfolioSolo.items.filter(i => i.section !== id);
        this.saveData();
    }

    // Reorder Sections
    reorderSections(newOrder) {
        this.data.sectionOrder = newOrder;
        this.saveData();
    }

    // Set Section Display Mode
    setSectionDisplayMode(sectionId, mode) {
        this.data.sectionDisplayModes[sectionId] = mode;
        this.saveData();
    }

    // Get Section Display Mode
    getSectionDisplayMode(sectionId) {
        return this.data.sectionDisplayModes[sectionId] || 'grid';
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

    // Get Portfolio Items by Section
    getPortfolioItemsBySection(sectionId) {
        return this.data.portfolioSolo.items.filter(i => i.section === sectionId);
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
        const currentTheme = this.data.theme.modes.find(m => m.id === this.data.theme.current);
        if (currentTheme && currentTheme.colors) {
            const root = document.documentElement;
            root.setAttribute('data-theme', this.data.theme.current);

            // Apply theme colors
            if (currentTheme.colors.primary) root.style.setProperty('--color-primary', currentTheme.colors.primary);
            if (currentTheme.colors.secondary) root.style.setProperty('--color-secondary', currentTheme.colors.secondary);
            if (currentTheme.colors.accent) root.style.setProperty('--color-accent', currentTheme.colors.accent);
            if (currentTheme.colors.background) root.style.setProperty('--color-bg', currentTheme.colors.background);
            if (currentTheme.colors.backgroundSecondary) root.style.setProperty('--color-bg-secondary', currentTheme.colors.backgroundSecondary);
            if (currentTheme.colors.backgroundTertiary) root.style.setProperty('--color-bg-tertiary', currentTheme.colors.backgroundTertiary);
            if (currentTheme.colors.text) root.style.setProperty('--color-text', currentTheme.colors.text);
            if (currentTheme.colors.textSecondary) root.style.setProperty('--color-text-secondary', currentTheme.colors.textSecondary);
            if (currentTheme.colors.textMuted) root.style.setProperty('--color-text-muted', currentTheme.colors.textMuted);
            if (currentTheme.colors.border) root.style.setProperty('--color-border', currentTheme.colors.border);
        } else {
            document.documentElement.setAttribute('data-theme', this.data.theme.current);
        }
    }

    // Add Theme Mode
    addThemeMode(mode) {
        const newId = mode.id || `theme-${Date.now()}`;
        this.data.theme.modes.push({
            id: newId,
            name: mode.name,
            colors: mode.colors || {
                primary: "#3498db",
                secondary: "#2ecc71",
                accent: "#e74c3c",
                background: "#ffffff",
                backgroundSecondary: "#f8f9fa",
                backgroundTertiary: "#e9ecef",
                text: "#212529",
                textSecondary: "#6c757d",
                textMuted: "#adb5bd",
                border: "#dee2e6",
                buttonBg: "#3498db",
                buttonText: "#ffffff"
            }
        });
        this.saveData();
    }

    // Update Theme Mode
    updateThemeMode(id, updates) {
        const index = this.data.theme.modes.findIndex(m => m.id === id);
        if (index !== -1) {
            this.data.theme.modes[index] = { ...this.data.theme.modes[index], ...updates };
            this.saveData();
            // Re-apply if current theme
            if (this.data.theme.current === id) {
                this.applyTheme();
            }
        }
    }

    // Delete Theme Mode
    deleteThemeMode(id) {
        if (id === 'light' || id === 'dark') return false; // Prevent deleting default themes
        this.data.theme.modes = this.data.theme.modes.filter(m => m.id !== id);
        if (this.data.theme.current === id) {
            this.setTheme('light');
        }
        this.saveData();
        return true;
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

        if (vars.radiusSm) root.style.setProperty('--radius-sm', vars.radiusSm);
        if (vars.radiusMd) root.style.setProperty('--radius-md', vars.radiusMd);
        if (vars.radiusLg) root.style.setProperty('--radius-lg', vars.radiusLg);
        if (vars.fontBase) root.style.setProperty('--font-base', vars.fontBase);
    }

    // Apply Font
    applyFont() {
        const font = this.data.siteSettings.font;

        // Add @font-face code if exists
        if (font.fontFaceCode) {
            let styleEl = document.getElementById('custom-font-face');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'custom-font-face';
                document.head.appendChild(styleEl);
            }
            styleEl.textContent = font.fontFaceCode;
        }

        // Apply title font
        if (font.title) {
            document.documentElement.style.setProperty('--font-title', `'${font.title}', sans-serif`);
        }

        // Apply content font
        if (font.content) {
            document.documentElement.style.setProperty('--font-content', `'${font.content}', sans-serif`);
            document.body.style.fontFamily = `'${font.content}', sans-serif`;
        }
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
        this.applyFont();
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
            this.applyFont();
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }

    // Save all data at once
    saveAll() {
        this.saveData();
        this.applyTheme();
        this.applyCSSVariables();
        this.applyFont();
    }
}

// Create global instance
const dataManager = new DataManager();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    dataManager.applyTheme();
    dataManager.applyCSSVariables();
    dataManager.applyFont();
});

// Export for use in other scripts
window.dataManager = dataManager;
window.DataManager = DataManager;
