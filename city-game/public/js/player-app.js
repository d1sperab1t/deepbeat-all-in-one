/**
 * 用户端应用 - player-app.js
 * 
 * 所有页面的渲染函数和交互逻辑
 * 使用 hash-based 路由，每个函数对应一个页面
 * 
 * 页面清单：
 *   renderNavbar()         - 导航栏（全局复用）
 *   renderHomePage()       - 品牌官网首页
 *   renderActivitiesPage() - 活动宣传/报名页
 *   renderActivityDetail() - 活动详情页
 *   renderLoginPage()      - 登录页
 *   renderRegisterPage()   - 注册页
 *   renderProfilePage()    - 个人中心首页
 *   renderProfileEdit()    - 个人信息编辑页
 *   renderInvitationPage() - 邀请函页面
 *   renderTasksPage()      - 活动信息/任务页
 *   renderTaskPlayPage()   - 线上任务卡页面
 *   renderCompletePage()   - 通关成功页
 *   renderStampsPage()     - 电子印章墙
 */

// ============================================================
// 工具函数（escapeHtml, showToast, requireLogin 来自 utils.js）
// ============================================================

// ============================================================
// 导航栏
// ============================================================

function renderNavbar() {
  const user = API.getUser('user');
  const isLoggedIn = !!API.getToken('user');

  // 非首页时恢复默认背景（首页会单独设为 #000）
  if (!location.hash || location.hash === '#/' || location.hash === '#') {
    // 首页，不做操作
  } else {
    document.body.style.background = '';
  }

  return `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="#/" class="navbar-brand">DEEPBEAT</a>
        <div class="navbar-links">
          <a href="#/">首页</a>
          <a href="#/roadkeeper">记路家</a>
          <a href="#/shanye">走进山野</a>
          ${isLoggedIn ? `
            <a href="#/stamps">印章墙</a>
            <div class="navbar-user">
              <a href="#/profile" class="navbar-avatar">${escapeHtml((user?.nickname || '用')[0])}</a>
              <a href="#/profile">${escapeHtml(user?.nickname || '个人中心')}</a>
            </div>
          ` : `
            <a href="#/login" class="nav-login-link">登录</a>
          `}
        </div>
      </div>
    </nav>
  `;
}

// ============================================================
// 页面渲染函数
// ============================================================

/**
 * 【首页】品牌官网
 */
function renderHomePage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <!-- HERO VIDEO -->
    <section class="home-hero" id="homeHero">
      <video class="home-hero-bg" poster="/video/poster.jpg" muted loop playsinline preload="metadata" id="heroVideo">
        <source src="/video/hero1.mp4" type="video/mp4">
      </video>
      <div class="home-hero-overlay"></div>
    </section>
    <!-- 标题独立于视频区域，可自由移动 -->
    <div class="home-hero-title-wrap" id="heroTitleWrap">
      <h1 class="home-hero-title">DEEPBEAT</h1>
      <p class="home-hero-sub">REWIRE YOUR <span style="color:var(--primary)">BODY</span> &amp; MIND</p>
    </div>

    <!-- STATS -->
    <div class="stats-bar" id="stats">
      <div class="stat-item reveal"></div>
      <div class="stat-item reveal reveal-delay-1"></div>
      <div class="stat-item reveal reveal-delay-2"></div>
      <div class="stat-item reveal reveal-delay-3"></div>
    </div>

    <!-- 品牌介绍 + 合作品牌 -->
    <section class="section" id="brands">
      <div class="container">
        <div class="brand-intro reveal">
          从城市运动到山野越野，从生活方式到商业考察，DEEPBEAT致力于构建完整的联盟运动生态。
        </div>
        <div class="brand-grid reveal">
          <div class="brand-category">
            <div class="brand-category-label"><span class="brand-category-num">01</span> 子品牌</div>
            <div class="brand-items">
              <div class="brand-item"><span class="brand-item-name">DEEPBEAT 记路家</span></div>
              <div class="brand-item"><span class="brand-item-name">DEEPBEAT 精营家 <em class="elite-script">Elite</em></span></div>
              <div class="brand-item"><span class="brand-item-name">DEEPBEAT 深型力</span></div>
            </div>
          </div>
          <div class="brand-category">
            <div class="brand-category-label"><span class="brand-category-num">02</span> 战略合作品牌</div>
            <div class="brand-items">
              <div class="brand-item"><span class="brand-item-name">山野梦想家</span></div>
              <div class="brand-item"><span class="brand-item-name">莫沃斯</span></div>
              <div class="brand-item"><span class="brand-item-name">城市红气馆</span></div>
            </div>
          </div>
          <div class="brand-category">
            <div class="brand-category-label"><span class="brand-category-num">03</span> 联名品牌</div>
            <div class="brand-items">
              <div class="brand-item"><span class="brand-item-name">人生首野</span></div>
              <div class="brand-item"><span class="brand-item-name">无界视觉</span></div>
            </div>
          </div>
        </div>
        <!-- 长期合作品牌 -->
        <div class="longterm-section reveal">
          <div class="longterm-label">冠名合作品牌</div>
          <div class="longterm-brands">
            <span class="longterm-brand">INDIBA</span>
            <span class="longterm-brand">氐瑞运动护肤</span>
            <span class="longterm-brand">WINBACK</span>
          </div>
        </div>
        <!-- 战略合作机构 - 独立突出展示 -->
        <div class="institution-section reveal">
          <div class="institution-label">战略合作机构</div>
          <div class="institution-items">
            <div class="institution-item">
              <span class="institution-name">莫干山户外运动协会</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MARQUEE -->
    <div class="marquee">
      <div class="marquee-inner">
        <span class="marquee-item"><em>CITY</em> MOVE</span>
        <span class="marquee-item">WILD <em>TRAIL</em></span>
        <span class="marquee-item"><em>ELITE</em> EVENT</span>
        <span class="marquee-item">CER<em>TIFIED</em></span>
        <span class="marquee-item"><em>INDUSTRY</em> TOUR</span>
        <span class="marquee-item">21D <em>SHAPE</em></span>
        <span class="marquee-item"><em>REBOOT</em> 30</span>
        <span class="marquee-item">DROP <em>RUN</em></span>
        <span class="marquee-item"><em>CITY</em> MOVE</span>
        <span class="marquee-item">WILD <em>TRAIL</em></span>
        <span class="marquee-item"><em>ELITE</em> EVENT</span>
        <span class="marquee-item">CER<em>TIFIED</em></span>
        <span class="marquee-item"><em>INDUSTRY</em> TOUR</span>
        <span class="marquee-item">21D <em>SHAPE</em></span>
        <span class="marquee-item"><em>REBOOT</em> 30</span>
        <span class="marquee-item">DROP <em>RUN</em></span>
      </div>
    </div>

        <!-- PROGRAMS — 8 SOLUTIONS -->
    <section class="section section-alt" id="programs">
      <div class="section-header">
        <div class="section-label reveal">DEEPBEAT ACTIVITIES</div>
        <h2 class="section-title split-text">
          <span class="word"><span class="word-inner">八大</span></span>
          <span class="word"><span class="word-inner">方案</span></span>
          <span class="word"><span class="word-inner">·</span></span>
          <span class="word"><span class="word-inner">从</span></span>
          <span class="word"><span class="word-inner">城市</span></span>
          <span class="word"><span class="word-inner">到</span></span>
          <span class="word"><span class="word-inner">山野</span></span>
        </h2>
        <p class="section-desc reveal">无论你是零基础新手还是资深跑者，总有一条DEEPBEAT ACTIVITIES适合你。</p>
      </div>
      <div class="programs-grid" id="programsGrid"></div>
    </section>

    <!-- 形体健康规划师 1V1 -->
    <section class="section section-alt" id="about">
      <div class="consult-section reveal">
        <div class="consult-header">
          <span class="consult-num">DEEPBEAT CONSULTANTS</span>
          <h2 class="consult-title">形体健康规划师 <strong>1V1</strong></h2>
          <p class="consult-desc">持证规划师团队（运动医学 + 营养 + 心理咨询三栖背景），根据档案匹配专攻方向，给出能落地的方案 —— 不是销售话术，是给你的 4 周行动路径。</p>
          <div class="consult-tags">
            <span class="consult-tag">国家运动营养师认证</span>
            <span class="consult-tag">NSCA / NASM 国际</span>
            <span class="consult-tag highlight">8h 内必响应</span>
          </div>
        </div>
        <div class="consult-grid">
          <div class="consult-card reveal"><div class="consult-card-num">01</div><div class="consult-card-title">深度解读 90 秒检测</div><div class="consult-card-desc">规划师逐条阅读你的 BMI / 亚健康项 / 减重史</div></div>
          <div class="consult-card reveal reveal-delay-1"><div class="consult-card-num">02</div><div class="consult-card-title">1v1 视频 30 分钟</div><div class="consult-card-desc">明确分型（代谢型 / 压力型 / 平台期）+ 核心目标</div></div>
          <div class="consult-card reveal reveal-delay-2"><div class="consult-card-num">03</div><div class="consult-card-title">定制可执行方案</div><div class="consult-card-desc">21/30/60 天训练 + 饮食 + 睡眠 + 监测 全栈路径</div></div>
          <div class="consult-card reveal reveal-delay-3"><div class="consult-card-num">04</div><div class="consult-card-title">全程陪跑与复盘</div><div class="consult-card-desc">规划师群内答疑 + 每周 1 次数据复盘</div></div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section" id="intake">
      <div class="section-label reveal">准备好了吗</div>
      <h2 class="cta-title split-text">
        <span class="word"><span class="word-inner">找到</span></span>
        <span class="word"><span class="word-inner">属于</span></span>
        <span class="word"><span class="word-inner">你的</span></span>
        <span class="word"><span class="word-inner">运动</span></span>
      </h2>
      <p class="cta-sub reveal">填写免费评估问卷，让联盟为你匹配最适合的DEEPBEAT ACTIVITIES与方案。</p>
      <div class="reveal"><a href="#" class="btn btn-primary" style="font-size:17px;padding:20px 48px">开始免费评估 →</a></div>
    </section>

    <!-- FOOTER -->
    <footer class="footer" id="contact">
      <div class="footer-top">
        <div class="footer-brand">
          <div class="footer-logo">DEEPBEAT</div>
          <p class="footer-tagline">七大机构联合发起的联盟运动平台。从城市到山野，从入门到进阶，让每一天都更好一点。</p>
        </div>
        <div class="footer-col">
          <h4>关于</h4>
          <a href="#">联盟介绍</a><a href="#">合作机构</a><a href="#">加入我们</a><a href="#">联系方式</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="footer-copy">&copy; 2026 DEEPBEAT. All rights reserved.</span>
        <div class="footer-social">
          <a href="#" title="微信">微</a><a href="#" title="微博">博</a><a href="#" title="小红书">书</a><a href="#" title="抖音">抖</a>
        </div>
      </div>
    </footer>

    <!-- MODAL -->
    <div class="modal-overlay" id="modalOverlay" onclick="closeModal()"></div>
    <div class="modal" id="modal">
      <div class="modal-close"><button onclick="closeModal()">✕</button></div>
      <div class="modal-body" id="modalBody"></div>
    </div>
  `;

  // 首页背景设为纯黑，与视频背景一致（防止缩放时露出底色）
  document.body.style.background = '#0D0C0B';

  // 滚动动效：导航栏药丸化 + 视频缩小
  const hero = document.getElementById('homeHero');
  const navEl = document.querySelector('.navbar');
  let ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY || 0;
        const threshold = 80;
        const maxScroll = 400;
        const progress = Math.min(scrollY / maxScroll, 1);

        // 视频缩放：从 1 到 0.88 + 圆角
        const scale = 1 - progress * 0.12;
        const borderRadius = progress * 24;
        hero.style.transform = 'scale(' + scale + ')';
        hero.style.borderRadius = borderRadius + 'px';
        hero.style.margin = (progress * 12) + 'px ' + (progress * 12) + 'px 0';

        // 标题下滑 + 颜色过渡（白→黑）
        const titleWrap = document.getElementById('heroTitleWrap');
        const title = document.querySelector('.home-hero-title');
        const sub = document.querySelector('.home-hero-sub');
        if (titleWrap) {
          titleWrap.style.transform = 'translateY(calc(-50% + ' + (progress * 500) + 'px))';
        }
        if (title) {
          const r = 255;
          const g = Math.round(255 - (255 - 61) * progress);
          const b = Math.round(255 - (255 - 20) * progress);
          title.style.color = 'rgb(' + r + ',' + g + ',' + b + ')';
        }
        if (sub) {
          sub.style.opacity = 1 - progress * 2;
          sub.style.transform = 'translateY(' + (progress * 80) + 'px)';
        }

        // 导航栏药丸化
        if (navEl) {
          if (scrollY > threshold) {
            navEl.classList.add('pill-mode');
          } else {
            navEl.classList.remove('pill-mode');
          }
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // 初始化 hero 动画
  setTimeout(() => { hero.classList.add('in-view'); }, 100);

  // 视频自动播放（兼容微信等限制自动播放的浏览器）
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    const playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 自动播放被阻止（如微信），添加点击播放
        heroVideo.addEventListener('click', () => {
          heroVideo.play();
        }, { once: true });
        // 也允许点击整个 hero 区域
        hero.addEventListener('click', () => {
          heroVideo.play();
        }, { once: true });
      });
    }
  }

  // 初始化 main.js 功能（programs rendering, observers, counters）
  initHomePageScripts();
}

// Modal 系统（Program 详情弹窗）
const homePrograms = [
    {
      id: 'city', code: '01', name: 'CITY MOVE', nameCn: '城市运动', badge: '每周 3-5 次 · 全级别',
      detail: {
        desc: '城市运动是 DEEPBEAT 的入门主线——没有装备门槛，跟着配速员从 3 公里夜跑起步，逐步进阶到城市定向与街区打卡。重点是建立「能长期坚持」的运动节奏，而不是一次性挑战。',
        for: ['几乎零运动基础、想先动起来的人', '久坐上班族，想用运动减压', '喜欢社群氛围、不爱独自健身'],
        not: ['只想短期突击减重（建议看 21 天减脂）', '需要专业赛事备战（建议看赛事 / 落跑）'],
        timeline: [
          { label: 'WK1-2 · 建立节奏', desc: '每周 3 次、每次 3-5km 轻松跑 + 动态拉伸，配速员全程带队' },
          { label: 'WK3-4 · 加量进阶', desc: '引入城市定向与间歇跑，距离提升到 5-8km，开始记录配速曲线' },
          { label: '持续 · 社群打卡', desc: '每月主题快闪 + 线上排行榜，用数据维持习惯' }
        ],
        includes: ['配速员带队', '城市路线图与打卡点', '运动数据记录与周报', '线上跑团社群', '月度主题活动'],
        results: [{ num: '12', label: '覆盖城市' }, { num: '3km', label: '起步距离' }, { num: '89%', label: '月留存' }],
        review: { text: '以前办了健身卡从没去过，跟夜跑团两个月，现在每周不跑反而难受。', author: '@周凯 · 苏州' }
      }
    },
    {
      id: 'wild', code: '02', name: 'WILD TRAIL', nameCn: '山野运动', badge: '周末 + 小长假 · 进阶',
      detail: {
        desc: '山野运动带你走出城市，进行长距离徒步与越野跑。由莫干山户外协会与山野梦想家联合带队，覆盖从入门郊野到高海拔进阶的 7 条线路，配专业领队与安全保障。',
        for: ['有一定有氧基础、想挑战自然环境', '热爱户外、想系统学越野技术', '为越野赛备战的跑者'],
        not: ['零基础且有膝踝旧伤者（先做城市运动）', '无法接受早起与长时间户外'],
        timeline: [
          { label: '行前 · 体能与装备评估', desc: '领队评估你的有氧水平，给出装备与训练清单' },
          { label: '入门线 · 郊野适应', desc: '10-15km 郊野徒步 / 越野，学习上下坡技术与补给节奏' },
          { label: '进阶线 · 高海拔挑战', desc: '武功山 / 四姑娘山多日线路，高海拔适应 + 露营' }
        ],
        includes: ['专业领队与安全保障', '7 条分级线路', '装备清单与租赁', '越野技术教学', '应急预案与保险'],
        results: [{ num: '7', label: '经典线路' }, { num: '100%', label: '安全完赛' }, { num: '2000m+', label: '最高海拔' }],
        review: { text: '第一次站上武功山金顶，那种成就感是城市里给不了的。', author: '@大山 · 莫干山' }
      }
    },
    {
      id: 'elite', code: '03', name: 'ELITE EVENT', nameCn: '专项运动赛事', badge: '全年 30+ 场 · 中高阶',
      detail: {
        desc: '联盟整合全年 30+ 场专项赛事，从城市马拉松到 ITRA 认证越野赛，提供报名代办、赛前训练营、赛道补给与完赛保障，帮你安全地刷新个人最好成绩。',
        for: ['有规律训练、想检验成果', '追求 PB 与完赛奖牌', '想体系化备战目标赛事'],
        not: ['零基础新手（先建立训练习惯）', '近期有伤病未恢复'],
        timeline: [
          { label: '赛前 8 周 · 报名与计划', desc: '代办报名，制定个性化训练周期' },
          { label: '赛前 2 周 · 减量与策略', desc: '减量训练 + 配速 / 补给策略演练' },
          { label: '赛日 · 完赛保障', desc: '集结、补给、医疗与完赛接驳全程支持' }
        ],
        includes: ['赛事报名代办', '赛前训练营', '配速与补给方案', '赛道保障', '完赛复盘报告'],
        results: [{ num: '30+', label: '年度场次' }, { num: '6', label: 'ITRA 认证' }, { num: '95%', label: 'PB 达成' }],
        review: { text: '跟着训练营备战，全马一次破 4，比自己瞎练快了 22 分钟。', author: '@Tom He · 上海' }
      }
    },
    {
      id: 'cert', code: '04', name: 'CERTIFIED', nameCn: '单项运动认证', badge: '2-4 周集训 · 认证级',
      detail: {
        desc: '针对想把某项运动「练对、练专业」的人，提供 12 类单项技能认证集训。由持证教练系统教学，结课获得能力认证，是进阶赛事与带队的基础。',
        for: ['想系统纠正动作、打基础', '计划成为领队 / 教练', '追求专业度的爱好者'],
        not: ['只想随便玩玩、不在意规范', '时间无法保证连续集训'],
        timeline: [
          { label: 'WK1 · 基础与评估', desc: '动作筛查、理论与基本功' },
          { label: 'WK2-3 · 专项强化', desc: '分项技术训练与纠错' },
          { label: 'WK4 · 考核认证', desc: '实操考核，颁发能力认证' }
        ],
        includes: ['持证教练授课', '动作筛查与纠错', '专项训练计划', '结课能力认证', '教学视频资料'],
        results: [{ num: '12', label: '认证类别' }, { num: '4 周', label: '最短周期' }, { num: '✓', label: '认证结课' }],
        review: { text: '跑姿认证后，膝盖再没疼过，配速还提升了。', author: '@Roger · 深圳' }
      }
    },
    {
      id: 'tour', code: '05', name: 'INDUSTRY TOUR', nameCn: '文体旅商业考察团', badge: '5-7 天 · 限 20 人/团',
      detail: {
        desc: '面向文体旅行业从业者的深度考察团，由莫沃斯主理。实地探访标杆运动 / 文旅项目，与操盘手对谈，从运营、内容、商业模型三个视角拆解可复制的打法。',
        for: ['文体旅创业者 / 主理人', '投资与品牌操盘手', '想做运动 IP 的内容团队'],
        not: ['纯个人健身需求的用户', '非行业、仅观光目的'],
        timeline: [
          { label: 'D1-2 · 标杆探访', desc: '实地走访 3-4 个标杆项目，现场拆解' },
          { label: 'D3-5 · 操盘手对谈', desc: '闭门分享 + 商业模型复盘' },
          { label: 'D6-7 · 共创落地', desc: '结合自身项目做落地方案工作坊' }
        ],
        includes: ['标杆项目实地探访', '操盘手闭门对谈', '商业模型拆解手册', '行业人脉对接', '落地方案工作坊'],
        results: [{ num: '10+', label: '标杆项目' }, { num: '500+', label: '已服务' }, { num: '20', label: '每团上限' }],
        review: { text: '一趟考察对接到两个合作方，回来直接调整了我们的会员模型。', author: '某连锁运营负责人' }
      }
    },
    {
      id: 'shape', code: '06', name: '21D SHAPE', nameCn: '分型减脂', badge: '干血片 · 3 月疗程',
      detail: {
        desc: '大多数减脂失败不是因为「不自律」，而是长期忽略了个体的代谢与神经内分泌差异。分型减脂先通过干血片检测 5 项核心激素指标，把你归入 5 大肥胖分型，再匹配对应的「上午 / 下午配方」与饮食结构。',
        for: ['反复节食、反复反弹的人', '吃得不多体重却往上走', '压力大、睡不好、情绪性进食', '久坐、代谢变慢、易疲劳人群'],
        not: ['严重心血管疾病患者', '内分泌严重失调且未稳定者', '活动期精神心理疾病人群', '儿童及高龄人群'],
        timeline: [
          { label: 'STEP 1 · 检测评估', desc: '进入精准分型评估——先判断身体是否处在「可减脂状态」' },
          { label: 'STEP 2 · 干血片采检', desc: '居家完成干血片采样 + 健康生活问卷，自然风干后寄往指定实验室' },
          { label: 'STEP 3 · 实验室分析', desc: '实验室 3-5 个工作日完成检测，每周二、周五统一出具分型报告' },
          { label: 'STEP 4 · 分型干预', desc: '专业人员判读分型、定位核心卡点，匹配对应上午 / 下午配方与个性化方案' },
          { label: 'STEP 5 · 代谢启动期', desc: '前 7 天建立饮食顺序与进食节律，观察身体反应，为正式减脂做生理铺垫' },
          { label: 'STEP 6 · 疗程与管理', desc: '建议 3 个月为一个完整疗程，7 天一评估动态调整；达标后进入减后管理，防反弹、稳代谢' }
        ],
        includes: ['干血片 5 项激素检测', '一对一分型判读报告', '上午 / 下午分型配方', '7 天代谢启动期指导', '健康管理师饮食结构指导', '7 天一次动态复诊调整'],
        results: [{ num: '5', label: '激素代谢指标' }, { num: '5', label: '肥胖分型' }, { num: '3 月', label: '完整疗程' }],
        review: { text: '减脂不是行为问题，而是生物学问题。', author: 'DEEPBEAT 核心理念' },
        knowledge: [
          { cat: '核心理念', read: '4 min', title: '为什么传统减脂，总是反复失败？', body: '在临床与健康管理实践中，减脂失败往往并非源于「不自律」，而是长期忽略了个体的代谢与神经内分泌差异。传统减脂的三大问题：以热量为中心，忽略激素与神经调控；用统一方案应对高度异质的人群；只看结果，缺乏过程监测与调整机制。分型减脂的三个原则：先识别身体卡点，再谈减脂路径；用指标解释行为，而不是指责行为；减脂是一个动态管理过程，而非一次性方案。' },
          { cat: '检测科普', read: '5 min', title: '5 项激素指标，读懂你的「减脂卡点」', body: '分型减脂通过干血片检测 5 项核心指标，把抽象的「易胖体质」变成可解释的生物信号。五大核心指标：皮质醇（Cortisol）反映慢性压力轴状态；胰岛素（Insulin）决定脂肪「存还是用」；瘦素（Leptin）中枢饱腹信号；胃饥饿素（Ghrelin）外周进食驱动；内毒素（LPS）连接肠道、炎症与胰岛素抵抗。' },
          { cat: '分型详解', read: '6 min', title: '五大肥胖分型，你是哪一种？', body: '同样是胖，机制可能完全不同。分型减脂将肥胖归纳为五种类型：情绪压力型（皮质醇异常）、代谢缓慢型（胰岛素抵抗）、大脑饥饿型（瘦素抵抗）、胃肠饥饿型（Ghrelin 异常）、炎症阻滞型（LPS 升高）。找准分型，才能把有限的努力花在最有效的地方。' },
          { cat: '配方逻辑', read: '5 min', title: '为什么要先「调节」，再「减脂」？', body: '分型配方不追求抑制食欲或强行燃脂，而是先让身体退出「防御状态」。以情绪压力型为例：长期压力下 HPA 轴持续兴奋，皮质醇偏高，身体进入「防御性囤脂模式」。三层协同调节：压力降噪、情绪稳定、脂肪解锁。核心一句：先稳人，再瘦身。' },
          { cat: '饮食指导', read: '4 min', title: '减脂饮食的总原则：先让身体「愿意瘦」', body: '分型减脂的饮食，不是先问「吃什么」，而是先确保身体不在「硬扛」。一句话总原则：先让身体愿意瘦，再谈瘦多少。前 7 天先建立进食顺序与节律，而非急着制造大热量缺口。不同分型对应不同的碳水、蛋白与进食时间结构。' },
          { cat: '调理答疑', read: '5 min', title: '调理期身体反应，是阶段性的，不是副作用', body: '进入代谢调整后，部分人会出现一些身体反应。统一原则：不是副作用，而是阶段性反应，可监测、可调整。常见反应包括失眠/心慌、便秘、胃胀/恶心、腹泻、月经波动等，多为短期适应反应。' },
          { cat: '进阶工具', read: '3 min', title: '14 天精准饮食反馈，到底是什么？', body: '这是一个「可选」的进阶管理工具。帮你更清楚地看到哪些食物在你身上更容易让身体进入「储脂状态」。配合穿戴设备做 14 天饮食反馈管理，帮助建立更个性化的饮食结构。' }
        ]
      }
    },
    {
      id: 'reboot', code: '07', name: 'REBOOT 30', nameCn: '亚健康单月方案', badge: '30 天 · 亚健康人群',
      detail: {
        desc: '长期久坐、熬夜、压力大，带来的不是胖，而是颈肩僵硬、睡不好、总是累。REBOOT 30 不以减重为目标，而是用筋膜放松、呼吸训练、睡眠干预与轻运动，系统改善亚健康状态。',
        for: ['颈肩腰背长期酸痛僵硬', '入睡难、睡眠浅、易醒', '长期疲劳、提不起劲', '久坐熬夜的脑力工作者'],
        not: ['有明确器质性疾病需就医者', '单纯想快速减重（看 21 天减脂）'],
        timeline: [
          { label: 'WK1 · 评估与放松', desc: '亚健康自测 + 筋膜放松，缓解最痛的部位' },
          { label: 'WK2 · 睡眠干预', desc: '呼吸训练 + 作息调整，改善入睡与睡眠深度' },
          { label: 'WK3 · 体态重建', desc: '针对颈肩腰的矫正性训练，重建正确姿态' },
          { label: 'WK4 · 习惯固化', desc: '把放松 / 呼吸 / 微运动嵌入日常，形成长期防护' }
        ],
        includes: ['亚健康多维自测', '筋膜放松课程', '睡眠与呼吸干预', '矫正性训练计划', '教练答疑', '30 天改善复盘'],
        results: [{ num: '92%', label: '改善率' }, { num: '30 天', label: '周期' }, { num: '+1.5h', label: '平均深睡' }],
        review: { text: '做完一个月，落枕般的肩颈终于松了，半夜不再醒。', author: '@Vivian · 北京' }
      }
    },
    {
      id: 'drop', code: '08', name: 'DROP RUN', nameCn: '城市落跑计划', badge: '48h · 100 人/期',
      detail: {
        desc: '城市落跑是 DEEPBEAT 的招牌挑战：从接到通知到开跑只有 48 小时，全程沿城市地标完成 21km。报名、装备、补给、完赛保障全包，你只负责跑起来。已开赛 7 期，完赛率 98%。',
        for: ['有基础、想要一次热血挑战', '喜欢说走就走的紧张感', '想要完赛奖牌与社群认同'],
        not: ['零基础或近期无训练者', '无法接受 48 小时内集结的人'],
        timeline: [
          { label: '0h · 接到落跑令', desc: '公布城市与集结点，开放 48h 报名' },
          { label: '24h · 装备到位', desc: '装备包寄达 / 自取，赛前说明与配速分组' },
          { label: '48h · 集结开跑', desc: '地标集结，21km 沿江 / 沿城开跑，全程补给保障' }
        ],
        includes: ['落跑装备包', '21km 城市赛道', '沿途补给站', '医疗与收容保障', '完赛奖牌', '赛后社群庆功'],
        results: [{ num: '7', label: '已开赛期' }, { num: '98%', label: '完赛率' }, { num: '21km', label: '赛道距离' }],
        review: { text: '接到落跑令那刻心跳加速，48 小时后冲过终点线，太上头了。', author: '落跑 06 期完赛者' }
      }
    }
  ];

function openModal(id) {
  const p = homePrograms.find(x => x.id === id);
  if (!p) return;
  const d = p.detail;
  const hasKnowledge = d.knowledge && d.knowledge.length > 0;

  // Build overview content
  var overview = ''
    + "<div class=\"modal-for-not\"><div class=\"modal-for-card\"><div class=\"modal-for-title\">✓ 适合</div>" + d.for.map(f => "<div class=\"modal-for-item\">" + f + "</div>").join("") + "</div><div class=\"modal-not-card\"><div class=\"modal-not-title\">× 暂不适合</div>" + d.not.map(n => "<div class=\"modal-not-item\">" + n + "</div>").join("") + "</div></div>"
    + "<div class=\"modal-section\"><h3>具体安排</h3><div class=\"modal-timeline\">" + d.timeline.map(t => "<div class=\"modal-tl-item\"><div class=\"modal-tl-label\">" + t.label + "</div><div class=\"modal-tl-desc\">" + t.desc + "</div></div>").join("") + "</div></div>"
    + "<div class=\"modal-section\"><h3>包含内容</h3><div class=\"modal-includes\">" + d.includes.map(inc => "<div class=\"modal-include-item\">" + inc + "</div>").join("") + "</div></div>";

  // Build knowledge content
  var knowledge = '';
  if (hasKnowledge) {
    knowledge = "<div class=\"modal-knowledge-intro\">深度学习内容·共 " + d.knowledge.length + " 篇 —— 点击展开阅读</div>"
      + d.knowledge.map((a, i) =>
        "<div class=\"modal-knowledge-item\" onclick=\"toggleKnowledge(" + i + ")\">"
        + "<div class=\"modal-knowledge-head\"><div><span class=\"modal-knowledge-cat\">" + a.cat + "</span><span class=\"modal-knowledge-dot\"> · </span><span class=\"modal-knowledge-read\">" + a.read + "</span></div><span class=\"modal-knowledge-icon\" id=\"ki" + i + "\">+</span></div>"
        + "<div class=\"modal-knowledge-title\">" + a.title + "</div>"
        + "<div class=\"modal-knowledge-body\" id=\"kb" + i + "\">" + a.body + "</div>"
        + "</div>"
      ).join("");
  }

  // Tabs HTML
  var tabs = '';
  if (hasKnowledge) {
    tabs = "<div class=\"modal-tabs\">"
      + "<button class=\"modal-tab active\" onclick=\"switchModalTab('overview',this)\">方案概览</button>"
      + "<button class=\"modal-tab\" onclick=\"switchModalTab('knowledge',this)\">知识库 · " + d.knowledge.length + "</button>"
      + "</div>";
  }

  document.getElementById("modalBody").innerHTML =
    "<div class=\"modal-label\">" + p.code + " · " + p.badge + "</div>"
    + "<h2 class=\"modal-title\">" + p.name + "</h2>"
    + "<h3 class=\"modal-subtitle\">" + p.nameCn + "</h3>"
    + "<p class=\"modal-desc\">" + d.desc + "</p>"
    + "<div class=\"modal-results\">" + d.results.map(r => "<div class=\"modal-result\"><div class=\"modal-result-num\">" + r.num + "</div><div class=\"modal-result-label\">" + r.label + "</div></div>").join("") + "</div>"
    + tabs
    + "<div class=\"modal-tab-content\" id=\"modalTabOverview\">" + overview + "</div>"
    + (hasKnowledge ? "<div class=\"modal-tab-content\" id=\"modalTabKnowledge\" style=\"display:none\">" + knowledge + "</div>" : "");

  document.getElementById("modalOverlay").classList.add("open");
  document.getElementById("modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function switchModalTab(tab, btn) {
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('modalTabOverview').style.display = tab === 'overview' ? '' : 'none';
  var kb = document.getElementById('modalTabKnowledge');
  if (kb) kb.style.display = tab === 'knowledge' ? '' : 'none';
}

function toggleKnowledge(i) {
  var body = document.getElementById('kb' + i);
  var icon = document.getElementById('ki' + i);
  if (!body) return;
  var isOpen = body.style.display === 'block';
  body.style.display = isOpen ? 'none' : 'block';
  if (icon) icon.textContent = isOpen ? '+' : '−';
}

function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  const modal = document.getElementById("modal");
  if (overlay) overlay.classList.remove("open");
  if (modal) modal.classList.remove("open");
  document.body.style.overflow = "";
}
window.openModal = openModal;
window.closeModal = closeModal;

function initHomePageScripts() {
  // Programs data (abbreviated — only for grid display)
  const programs = [
    { id: 'city', code: '01', name: 'CITY MOVE', nameCn: '城市运动', badge: '每周 3-5 次 · 全级别', brief: '夜跑团 / 城市定向 / 街区快闪，沿城市天际线找到你的节拍。', meta: ['覆盖 12 城', '3km 起步', '89% 月留存'], tags: ['零基础', '社群', '夜跑'] },
    { id: 'wild', code: '02', name: 'WILD TRAIL', nameCn: '山野运动', badge: '周末 + 小长假 · 进阶', brief: '莫干山 / 武功山 / 四姑娘山，长距离越野与高海拔适应。', meta: ['7 条经典线路', '100% 安全完赛', '2000m+ 最高海拔'], tags: ['户外', '越野', '高海拔'] },
    { id: 'elite', code: '03', name: 'ELITE EVENT', nameCn: '专项运动赛事', badge: '全年 30+ 场 · 中高阶', brief: '城市马拉松 / 越野赛 / 攀岩赛，完赛奖牌与 PB 见证。', meta: ['30+ 年度场次', '6 ITRA 认证', '95% PB 达成'], tags: ['赛事', 'PB', 'ITRA'] },
    { id: 'cert', code: '04', name: 'CERTIFIED', nameCn: '单项运动认证', badge: '2-4 周集训 · 认证级', brief: '跑步姿势 / 越野技术 / 攀岩 / 自由潜，认证教练授课。', meta: ['12 类认证', '4 周最短周期', '认证结课颁发'], tags: ['认证', '技能', '教练'] },
    { id: 'tour', code: '05', name: 'INDUSTRY TOUR', nameCn: '文体旅商业考察团', badge: '5-7 天 · 限 20 人/团', brief: '探访 10+ 文体旅标杆项目，运营 + 内容 + 商业三视角拆解。', meta: ['10+ 标杆项目', '500+ 已服务', '20 每团上限'], tags: ['商业', '考察', '行业'] },
    { id: 'shape', code: '06', name: '21D SHAPE', nameCn: '分型减脂', badge: '干血片 · 3 月疗程', brief: '5 项激素检测 + 5 大肥胖分型，先找卡点，再谈减脂。', meta: ['5 项激素指标', '5 大肥胖分型', '3 月完整疗程'], tags: ['减脂', '分型', '科学'] },
    { id: 'reboot', code: '07', name: 'REBOOT 30', nameCn: '亚健康单月方案', badge: '30 天 · 亚健康人群', brief: '颈肩腰肌筋膜 / 失眠 / 慢疲，30 天立体干预。', meta: ['92% 改善率', '30 天周期', '+1.5h 平均深睡'], tags: ['亚健康', '睡眠', '筋膜'] },
    { id: 'drop', code: '08', name: 'DROP RUN', nameCn: '城市落跑计划', badge: '48h · 100 人/期', brief: '48 小时极速落跑城市，报名 - 装备 - 完赛全包。', meta: ['7 已开赛期', '98% 完赛率', '21km 赛道距离'], tags: ['限时', '48h', '落跑'] }
  ];

  // Featured section modal data (21D SHAPE detail)
  const shapeDetail = {
    desc: '大多数减脂失败不是因为「不自律」，而是长期忽略了个体的代谢与神经内分泌差异。分型减脂先通过干血片检测 5 项核心激素指标，把你归入 5 大肥胖分型，再匹配对应的「上午 / 下午配方」与饮食结构。',
    for: ['反复节食、反复反弹的人', '吃得不多体重却往上走', '压力大、睡不好、情绪性进食', '久坐、代谢变慢、易疲劳人群'],
    not: ['严重心血管疾病患者', '内分泌严重失调且未稳定者', '活动期精神心理疾病人群', '儿童及高龄人群'],
    timeline: [
      { label: 'STEP 1 · 检测评估', desc: '进入精准分型评估——先判断身体是否处在「可减脂状态」' },
      { label: 'STEP 2 · 干血片采检', desc: '居家完成干血片采样 + 健康生活问卷，自然风干后寄往指定实验室' },
      { label: 'STEP 3 · 实验室分析', desc: '实验室 3-5 个工作日完成检测，每周二、周五统一出具分型报告' },
      { label: 'STEP 4 · 分型干预', desc: '专业人员判读分型、定位核心卡点，匹配对应上午 / 下午配方与个性化方案' }
    ],
    includes: ['干血片 5 项激素检测', '一对一分型判读报告', '上午 / 下午分型配方', '7 天代谢启动期指导', '健康管理师饮食结构指导', '7 天一次动态复诊调整'],
    results: [{ num: '5', label: '激素代谢指标' }, { num: '5', label: '肥胖分型' }, { num: '3 月', label: '完整疗程' }],
    review: { text: '减脂不是行为问题，而是生物学问题。', author: 'DEEPBEAT 核心理念' }
  };

  // Render programs
  const grid = document.getElementById('programsGrid');
  if (grid) {
    grid.innerHTML = programs.map((p, i) =>
      '<div class="program-card reveal ' + (i % 2 === 1 ? 'reveal-delay-1' : '') + '" data-program="' + p.id + '">'
      + '<div class="program-card-inner">'
      + '<div class="program-card-head"><span class="program-id">// ' + p.code + '</span><span class="program-name-en">' + p.name + '</span></div>'
      + '<h3 class="program-name-cn">' + p.nameCn + '</h3>'
      + '<p class="program-brief">' + p.brief + '</p>'
      + '<div class="program-card-divider"></div>'
      + '<div class="program-card-foot"><span class="program-badge">' + p.badge + '</span><span class="program-stat">' + p.meta[0] + '</span></div>'
      + '<a class="program-link" data-program="' + p.id + '">查看详情 →</a>'
      + '</div></div>'
    ).join('');
  }

  // Program card/link click → open modal
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.program-link');
    if (link && link.dataset.program) {
      e.preventDefault();
      openModal(link.dataset.program);
      return;
    }
    const card = e.target.closest('.program-card');
    if (card && card.dataset.program) openModal(card.dataset.program);
  });

  // Modal overlay click → close
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.addEventListener('click', closeModal);

  // ESC → close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#/') ) return; // SPA routes, skip
      if (href && href.length > 1 && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Reveal observers
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        entry.target.querySelectorAll('.counter:not(.counted)').forEach(c => {
          c.classList.add('counted');
          const target = +c.dataset.target;
          const duration = 2000;
          const start = performance.now();
          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            c.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal,.split-text').forEach(el => revealObs.observe(el));
}

/**
 * 【活动列表页】
 */
async function renderActivitiesPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="container">
      <div class="loading"><div class="spinner"></div>加载中...</div>
    </div>
  `;

  try {
    const activities = await API.get('/player/activities');
    const list = Array.isArray(activities) ? activities : (activities.activities || []);

    app.innerHTML = `
      ${renderNavbar()}
      <div class="container">
        <h2 class="page-title">近期活动</h2>
        ${list.length === 0 ? `
          <div class="empty-state">
            <div class="icon">📋</div>
            <p>暂无活动</p>
            <p class="text-muted">敬请期待精彩活动</p>
          </div>
        ` : `
          <div class="activity-list">
            ${list.map(a => `
              <div class="activity-card" onclick="location.hash='#/activities/${a.id}'">
                ${a.poster_url ? `<img src="${escapeHtml(a.poster_url)}" class="activity-poster" alt="">` : ''}
                <div class="activity-info">
                  <h3>${escapeHtml(a.title)}</h3>
                  <p class="text-muted">${escapeHtml(a.date)} · ${escapeHtml(a.location)}</p>
                  <p>${escapeHtml(a.description || '').substring(0, 60)}...</p>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `
      ${renderNavbar()}
      <div class="container">
        <div class="empty-state">
          <div class="icon">❌</div>
          <p>${err.message}</p>
        </div>
      </div>
    `;
  }
}

/**
 * 【活动详情页】
 */
async function renderActivityDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="container">
      <div class="loading"><div class="spinner"></div>加载中...</div>
    </div>
  `;

  try {
    const activity = await API.get(`/player/activities/${id}`);
    app.innerHTML = `
      ${renderNavbar()}
      <div class="container">
        <a href="#/activities" class="back-link">← 返回活动列表</a>
        <div class="activity-detail">
          ${activity.poster_url ? `<img src="${escapeHtml(activity.poster_url)}" class="activity-poster-full" alt="">` : ''}
          <h1>${escapeHtml(activity.title)}</h1>
          <div class="activity-meta">
            <span>📅 ${escapeHtml(activity.date)}</span>
            <span>📍 ${escapeHtml(activity.location)}</span>
            <span>💰 ¥${activity.fee}</span>
          </div>
          <div class="activity-desc">${escapeHtml(activity.description || '')}</div>
          ${activity.status === 'published' ? `
            <button class="btn btn-primary btn-lg" onclick="handleRegisterActivity(${activity.id})">立即报名</button>
          ` : `
            <button class="btn btn-secondary btn-lg" disabled>活动未开始</button>
          `}
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `
      ${renderNavbar()}
      <div class="container">
        <div class="empty-state">
          <div class="icon">❌</div>
          <p>${err.message}</p>
        </div>
      </div>
    `;
  }
}

/**
 * 报名活动
 */
async function handleRegisterActivity(activityId) {
  if (!requireLogin()) return;
  try {
    await API.post(`/player/activities/${activityId}/register`);
    showToast('报名成功', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ============================================================
// 登录 / 注册
// ============================================================

/**
 * 【登录页】
 */
function renderLoginPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="auth-page">
      <div class="auth-card">
        <h2>登录</h2>
        <form id="loginForm">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input type="text" class="form-input" name="username" placeholder="请输入用户名" required>
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input type="password" class="form-input" name="password" placeholder="请输入密码" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg">登录</button>
        </form>
        <div class="auth-footer">
          还没有账号？<a href="#/register">立即注册</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      const data = await API.post('/auth/login', {
        username: form.get('username'),
        password: form.get('password')
      });
      API.setToken(data.token, 'user');
      API.setUser(data.user, 'user');
      showToast('登录成功', 'success');
      setTimeout(() => location.hash = '#/profile', 500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

/**
 * 【注册页】
 */
function renderRegisterPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="auth-page">
      <div class="auth-card">
        <h2>注册</h2>
        <form id="registerForm">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input type="text" class="form-input" name="username" placeholder="请输入用户名（至少2位）" required minlength="2">
          </div>
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input type="text" class="form-input" name="nickname" placeholder="给自己取个名字">
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input type="password" class="form-input" name="password" placeholder="至少6位" required minlength="6">
          </div>
          <div class="form-group">
            <label class="form-label">邀请码 <span class="text-muted">（选填，付费用户必填）</span></label>
            <input type="text" class="form-input" name="invitationCode" placeholder="请输入邀请码">
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg">注册</button>
        </form>
        <div class="auth-footer">
          已有账号？<a href="#/login">去登录</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      const data = await API.post('/auth/register', {
        username: form.get('username'),
        password: form.get('password'),
        nickname: form.get('nickname'),
        invitationCode: form.get('invitationCode')
      });
      API.setToken(data.token, 'user');
      API.setUser(data.user, 'user');
      showToast('注册成功', 'success');
      setTimeout(() => location.hash = '#/profile', 500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ============================================================
// 个人中心
// ============================================================

/**
 * 【个人中心首页】
 */
async function renderProfilePage() {
  if (!requireLogin()) return;

  const app = document.getElementById('app');
  const user = API.getUser('user');

  app.innerHTML = `
    ${renderNavbar()}
    <div class="container">
      <div class="profile-header">
        <div class="avatar-large">${escapeHtml((user?.nickname || '用')[0])}</div>
        <h2>${escapeHtml(user?.nickname || '未设置昵称')}</h2>
        <p class="text-muted">@${escapeHtml(user?.username || '')}</p>
      </div>
      <div class="profile-menu">
        <a href="#/profile/edit" class="menu-item">
          <span>✏️ 编辑资料</span><span>→</span>
        </a>
        <a href="#/stamps" class="menu-item">
          <span>🏆 印章墙</span><span>→</span>
        </a>
        <a href="/game" class="menu-item">
          <span>🎭 落跑计划</span><span>→</span>
        </a>
        <div class="menu-item" onclick="handleLogout()">
          <span>🚪 退出登录</span><span></span>
        </div>
      </div>
    </div>
  `;
}

/**
 * 退出登录
 */
function handleLogout() {
  API.clearToken('user');
  API.setUser(null, 'user');
  showToast('已退出登录', 'info');
  location.hash = '#/';
}

/**
 * 【个人资料编辑页】
 */
async function renderProfileEdit() {
  if (!requireLogin()) return;

  const app = document.getElementById('app');
  const user = API.getUser('user');

  app.innerHTML = `
    ${renderNavbar()}
    <div class="container">
      <a href="#/profile" class="back-link">← 返回个人中心</a>
      <h2 class="page-title">编辑资料</h2>
      <form id="profileForm">
        <div class="form-group">
          <label class="form-label">昵称</label>
          <input type="text" class="form-input" name="nickname" value="${escapeHtml(user?.nickname || '')}" placeholder="请输入昵称">
        </div>
        <button type="submit" class="btn btn-primary btn-block">保存</button>
      </form>

      <h3 class="section-title" style="margin-top:32px">修改密码</h3>
      <form id="passwordForm">
        <div class="form-group">
          <label class="form-label">新密码</label>
          <input type="password" class="form-input" name="newPassword" placeholder="至少6位" required minlength="6">
        </div>
        <button type="submit" class="btn btn-secondary btn-block">修改密码</button>
      </form>
    </div>
  `;

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      const data = await API.put('/user/profile', {
        nickname: form.get('nickname')
      });
      API.setUser(data.user || { ...user, nickname: form.get('nickname') }, 'user');
      showToast('保存成功', 'success');
      setTimeout(() => location.hash = '#/profile', 500);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      await API.put('/user/password', {
        newPassword: form.get('newPassword')
      });
      showToast('密码修改成功', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ============================================================
// 印章墙
// ============================================================

async function renderStampsPage() {
  if (!requireLogin()) return;

  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div class="container">
      <div class="loading"><div class="spinner"></div>加载中...</div>
    </div>
  `;

  try {
    const data = await API.get('/user/stamps');
    const stamps = Array.isArray(data) ? data : (data.stamps || []);

    app.innerHTML = `
      ${renderNavbar()}
      <div class="container">
        <h2 class="page-title">🏆 印章墙</h2>
        ${stamps.length === 0 ? `
          <div class="empty-state">
            <div class="icon">🏅</div>
            <p>还没有获得印章</p>
            <p class="text-muted">完成活动任务即可获得电子印章</p>
          </div>
        ` : `
          <div class="stamps-grid">
            ${stamps.map(s => `
              <div class="stamp-card">
                <div class="stamp-icon">🏅</div>
                <div class="stamp-info">
                  <h4>${escapeHtml(s.activity_title || '活动')}</h4>
                  <p class="text-muted">${escapeHtml(s.earned_at || '')}</p>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `
      ${renderNavbar()}
      <div class="container">
        <div class="empty-state">
          <div class="icon">❌</div>
          <p>${err.message}</p>
        </div>
      </div>
    `;
  }
}

// ============================================================
// 路由注册
// ============================================================
const router = new Router();

router.add('#/', renderHomePage);
router.add('#/activities', renderActivitiesPage);
router.add('#/activities/:id', (params) => renderActivityDetail(params.id));
router.add('#/login', renderLoginPage);
router.add('#/register', renderRegisterPage);
router.add('#/profile', renderProfilePage);
router.add('#/profile/edit', renderProfileEdit);
router.add('#/stamps', renderStampsPage);

// 记路家计划 — iframe 嵌入
router.add('#/roadkeeper', () => {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div style="width:100%;height:calc(100vh - 60px);overflow:hidden;">
      <iframe src="/roadkeeper/" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>
    </div>
  `;
  setupIframeScroll();
});

// 落跑计划 — iframe 嵌入（A网页）
router.add('#/shanye', () => {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderNavbar()}
    <div style="width:100%;height:calc(100vh - 60px);overflow:hidden;">
      <iframe src="/shanye/" style="width:100%;height:100%;border:none;" allowfullscreen></iframe>
    </div>
  `;
  setupIframeScroll();
});


// iframe 滚动监听 → 导航栏药丸化
function setupIframeScroll() {
  const navEl = document.querySelector('.navbar');
  const iframe = document.querySelector('iframe');
  if (!iframe) return;
  
  let lastScrollY = 0;
  
  function checkScroll() {
    try {
      const iframeScrollY = iframe.contentWindow.scrollY || iframe.contentWindow.pageYOffset || 0;
      if (iframeScrollY !== lastScrollY) {
        lastScrollY = iframeScrollY;
        if (navEl) {
          if (iframeScrollY > 80) {
            navEl.classList.add('pill-mode');
          } else {
            navEl.classList.remove('pill-mode');
          }
        }
      }
    } catch(e) {}
    requestAnimationFrame(checkScroll);
  }
  
  iframe.addEventListener('load', () => {
    requestAnimationFrame(checkScroll);
  });
  
  requestAnimationFrame(checkScroll);
}

router.start();
