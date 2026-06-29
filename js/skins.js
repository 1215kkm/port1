/* skins.js — central registry of alternate full-page portfolio "skins".
 *
 * To add a NEW skin (this is the only place + one new HTML file needed):
 *   1) create  skins/<id>.html   (the skin page — see skins/scroll1.html as a model)
 *   2) add one entry to the array below
 *
 * Everything else is automatic:
 *   - intro.html shows a selectable card when the skin is enabled in admin
 *   - admin.html "표시" tab renders an on/off toggle for each skin
 *   - the toggle persists to data.pageSettings[<id>] (default off)
 *
 * Fields:
 *   id    unique key (also the pageSettings key)        e.g. 'scroll1'
 *   name  card title / toggle label                     e.g. '스크롤형'
 *   icon  emoji shown on the intro card                 e.g. '🖥️'
 *   desc  intro card description (HTML allowed)
 *   file  path to the skin page, relative to site root  e.g. 'skins/scroll1.html'
 */
window.PORTFOLIO_SKINS = [
  {
    id: 'scroll1',
    name: '스크롤형',
    icon: '🖥️',
    desc: '스크롤로 펼쳐지는<br>풀스크린 다크 포트폴리오',
    file: 'skins/scroll1.html'
  }
  // 예시) 다음 스킨을 추가할 때:
  // ,{ id: 'grid1', name: '그리드형', icon: '🔲', desc: '카드 그리드 레이아웃', file: 'skins/grid1.html' }
];
