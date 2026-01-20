// Owner Menu - 본인 포트폴리오일 때만 좌측에 표시되는 플로팅 메뉴
// 대시보드, 편집, 미리보기, PDF 등 링크 제공

(async function() {
    // 스타일 삽입
    const style = document.createElement('style');
    style.textContent = `
        .owner-menu {
            position: fixed;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.85);
            border-radius: 0 12px 12px 0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        }

        .owner-menu.collapsed {
            transform: translateY(-50%) translateX(-100%);
        }

        .owner-menu.collapsed .owner-menu-toggle {
            transform: translateX(100%);
            border-radius: 0 8px 8px 0;
        }

        .owner-menu-toggle {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 24px;
            height: 48px;
            background: rgba(0, 0, 0, 0.85);
            border: none;
            border-radius: 0 8px 8px 0;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.3s ease;
        }

        .owner-menu-toggle:hover {
            background: rgba(52, 152, 219, 0.9);
        }

        .owner-menu-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 12px 16px;
            background: transparent;
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s ease;
            min-width: 70px;
        }

        .owner-menu-item:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .owner-menu-item.active {
            background: rgba(52, 152, 219, 0.6);
        }

        .owner-menu-icon {
            font-size: 20px;
            line-height: 1;
        }

        .owner-menu-label {
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
        }

        .owner-menu-divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.2);
            margin: 4px 0;
        }

        /* 페이지 정보 영역 */
        .owner-menu-info {
            padding: 12px 14px;
            text-align: center;
        }

        .owner-menu-info-title {
            font-size: 13px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 6px;
        }

        .owner-menu-info-desc {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.5;
            margin-bottom: 10px;
        }

        .owner-menu-info-btn {
            display: inline-block;
            padding: 6px 12px;
            background: rgba(52, 152, 219, 0.8);
            color: white;
            font-size: 11px;
            font-weight: 500;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.2s ease;
        }

        .owner-menu-info-btn:hover {
            background: rgba(52, 152, 219, 1);
            transform: scale(1.05);
        }

        /* 모바일 대응 */
        @media (max-width: 768px) {
            .owner-menu {
                top: auto;
                bottom: 0;
                left: 0;
                right: 0;
                transform: none;
                flex-direction: row;
                justify-content: center;
                border-radius: 12px 12px 0 0;
                padding: 8px 16px;
            }

            .owner-menu.collapsed {
                transform: translateY(100%);
            }

            .owner-menu-toggle {
                top: 0;
                right: 50%;
                transform: translateX(50%) translateY(-100%);
                width: 48px;
                height: 24px;
                border-radius: 8px 8px 0 0;
            }

            .owner-menu.collapsed .owner-menu-toggle {
                transform: translateX(50%) translateY(-100%);
            }

            .owner-menu-item {
                padding: 8px 12px;
                min-width: auto;
            }

            .owner-menu-icon {
                font-size: 18px;
            }

            .owner-menu-label {
                font-size: 10px;
            }

            .owner-menu-divider {
                width: 1px;
                height: 40px;
                margin: 0 4px;
            }

            .owner-menu-info {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);

    // Firebase 인증 확인
    let currentUser = null;
    let userId = null;

    try {
        const module = await import('./firebase-config.js');
        const AuthManager = module.AuthManager;
        await AuthManager.init();

        if (AuthManager.isLoggedIn()) {
            currentUser = AuthManager.getUser();
            userId = currentUser.uid;
        }
    } catch (e) {
        console.log('Owner menu: Firebase not available');
        return; // Firebase 없으면 메뉴 표시 안함
    }

    // 로그인 안되어 있으면 메뉴 표시 안함
    if (!currentUser) {
        return;
    }

    // URL에서 사용자 ID 확인 (다른 사람 포트폴리오 보는 중인지)
    const urlParams = new URLSearchParams(window.location.search);
    const viewUserId = urlParams.get('u') || urlParams.get('user') || urlParams.get('id');

    // 다른 사람 포트폴리오 보는 중이면 메뉴 표시 안함
    if (viewUserId && viewUserId !== userId) {
        return;
    }

    // 현재 페이지 확인
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // 페이지별 설명 정보
    const pageInfo = {
        'intro.html': {
            title: '인트로 페이지',
            desc: '포트폴리오 진입점이 되는 페이지입니다.<br>아이콘, 문구, 사용여부를 설정할 수 있습니다.',
            settingsUrl: 'admin.html#panel-skin',
            settingsLabel: '아이콘/스킨 설정하기'
        },
        'portfolio.html': {
            title: '혼자제작 포트폴리오',
            desc: '프로필, 경력, 스킬, 작품을 보여주는<br>메인 포트폴리오 페이지입니다.',
            settingsUrl: 'admin.html',
            settingsLabel: '프로필/작품 설정하기'
        },
        'ai.html': {
            title: 'AI 활용 작품',
            desc: 'AI를 활용해 제작한 프로젝트를<br>추가하고 관리할 수 있습니다.',
            settingsUrl: 'admin.html#panel-ai',
            settingsLabel: 'AI 프로젝트 설정하기'
        },
        'team.html': {
            title: '팀플 제작 작품',
            desc: '팀 프로젝트로 제작한 작품을<br>추가하고 관리할 수 있습니다.',
            settingsUrl: 'admin.html#panel-team',
            settingsLabel: '팀플 프로젝트 설정하기'
        },
        'admin.html': {
            title: '관리자 설정',
            desc: '포트폴리오의 모든 내용을<br>이곳에서 편집할 수 있습니다.',
            settingsUrl: null,
            settingsLabel: null
        },
        'dashboard.html': {
            title: '대시보드',
            desc: '포트폴리오 관리 홈입니다.<br>미리보기, 공유 URL 등을 확인하세요.',
            settingsUrl: null,
            settingsLabel: null
        }
    };

    const currentInfo = pageInfo[currentPage] || null;

    // 메뉴 생성
    const menu = document.createElement('div');
    menu.className = 'owner-menu';
    menu.innerHTML = `
        <button class="owner-menu-toggle" title="메뉴 접기/펼치기">
            <span>◀</span>
        </button>

        ${currentInfo ? `
            <div class="owner-menu-info">
                <div class="owner-menu-info-title">${currentInfo.title}</div>
                <div class="owner-menu-info-desc">${currentInfo.desc}</div>
                ${currentInfo.settingsUrl ? `
                    <a href="${currentInfo.settingsUrl}" class="owner-menu-info-btn">${currentInfo.settingsLabel} →</a>
                ` : ''}
            </div>
            <div class="owner-menu-divider"></div>
        ` : ''}

        <a href="dashboard.html" class="owner-menu-item ${currentPage === 'dashboard.html' ? 'active' : ''}" title="대시보드">
            <span class="owner-menu-icon">🏠</span>
            <span class="owner-menu-label">대시보드</span>
        </a>

        <a href="admin.html" class="owner-menu-item ${currentPage === 'admin.html' ? 'active' : ''}" title="편집">
            <span class="owner-menu-icon">✏️</span>
            <span class="owner-menu-label">편집</span>
        </a>

        <div class="owner-menu-divider"></div>

        <a href="portfolio.html" class="owner-menu-item ${currentPage === 'portfolio.html' ? 'active' : ''}" title="포트폴리오">
            <span class="owner-menu-icon">📄</span>
            <span class="owner-menu-label">포트폴리오</span>
        </a>

        <a href="intro.html" class="owner-menu-item ${currentPage === 'intro.html' ? 'active' : ''}" title="인트로">
            <span class="owner-menu-icon">🚀</span>
            <span class="owner-menu-label">인트로</span>
        </a>

        <div class="owner-menu-divider"></div>

        <a href="ai.html" class="owner-menu-item ${currentPage === 'ai.html' ? 'active' : ''}" title="AI 작품">
            <span class="owner-menu-icon">🤖</span>
            <span class="owner-menu-label">AI작품</span>
        </a>

        <a href="team.html" class="owner-menu-item ${currentPage === 'team.html' ? 'active' : ''}" title="팀 프로젝트">
            <span class="owner-menu-icon">👥</span>
            <span class="owner-menu-label">팀플</span>
        </a>

        <div class="owner-menu-divider"></div>

        <button class="owner-menu-item" id="owner-pdf-btn" title="PDF 미리보기">
            <span class="owner-menu-icon">📑</span>
            <span class="owner-menu-label">PDF</span>
        </button>
    `;

    document.body.appendChild(menu);

    // 토글 버튼 기능
    const toggleBtn = menu.querySelector('.owner-menu-toggle');
    const toggleIcon = toggleBtn.querySelector('span');

    // 저장된 상태 복원
    const isCollapsed = localStorage.getItem('ownerMenuCollapsed') === 'true';
    if (isCollapsed) {
        menu.classList.add('collapsed');
        toggleIcon.textContent = '▶';
    }

    toggleBtn.addEventListener('click', () => {
        menu.classList.toggle('collapsed');
        const collapsed = menu.classList.contains('collapsed');
        toggleIcon.textContent = collapsed ? '▶' : '◀';
        localStorage.setItem('ownerMenuCollapsed', collapsed);
    });

    // PDF 버튼 기능
    const pdfBtn = document.getElementById('owner-pdf-btn');
    pdfBtn.addEventListener('click', () => {
        // PDF 다운로드 트리거 (app.js의 기능 사용)
        const downloadBtn = document.querySelector('[data-action="download-pdf"]');
        if (downloadBtn) {
            downloadBtn.click();
        } else {
            // portfolio.html이 아닌 경우 해당 페이지로 이동
            if (currentPage !== 'portfolio.html') {
                window.location.href = 'portfolio.html#pdf';
            }
        }
    });

    // URL에 #pdf가 있으면 PDF 다운로드 자동 실행
    if (window.location.hash === '#pdf') {
        setTimeout(() => {
            const downloadBtn = document.querySelector('[data-action="download-pdf"]');
            if (downloadBtn) {
                downloadBtn.click();
                // 해시 제거
                history.replaceState(null, null, window.location.pathname + window.location.search);
            }
        }, 1000);
    }
})();
