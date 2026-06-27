/* ============================================================
   DEEPBEAT — 联盟运动平台  |  Main Script
   ============================================================ */

(function () {
  'use strict';

  /* ---------- DATA ---------- */
  const programs = [
    {
      id: 'city', code: '01', name: 'CITY MOVE', nameCn: '城市运动',
      badge: '每周 3-5 次 · 全级别',
      brief: '夜跑团 / 城市定向 / 街区快闪，沿城市天际线找到你的节拍。',
      meta: ['覆盖 12 城', '3km 起步', '89% 月留存'],
      tags: ['零基础', '社群', '夜跑'],
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
      id: 'wild', code: '02', name: 'WILD TRAIL', nameCn: '山野运动',
      badge: '周末 + 小长假 · 进阶',
      brief: '莫干山 / 武功山 / 四姑娘山，长距离越野与高海拔适应。',
      meta: ['7 条经典线路', '100% 安全完赛', '2000m+ 最高海拔'],
      tags: ['户外', '越野', '高海拔'],
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
      id: 'elite', code: '03', name: 'ELITE EVENT', nameCn: '专项运动赛事',
      badge: '全年 30+ 场 · 中高阶',
      brief: '城市马拉松 / 越野赛 / 攀岩赛，完赛奖牌与 PB 见证。',
      meta: ['30+ 年度场次', '6 ITRA 认证', '95% PB 达成'],
      tags: ['赛事', 'PB', 'ITRA'],
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
      id: 'cert', code: '04', name: 'CERTIFIED', nameCn: '单项运动认证',
      badge: '2-4 周集训 · 认证级',
      brief: '跑步姿势 / 越野技术 / 攀岩 / 自由潜，认证教练授课。',
      meta: ['12 类认证', '4 周最短周期', '认证结课颁发'],
      tags: ['认证', '技能', '教练'],
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
      id: 'tour', code: '05', name: 'INDUSTRY TOUR', nameCn: '文体旅商业考察团',
      badge: '5-7 天 · 限 20 人/团',
      brief: '探访 10+ 文体旅标杆项目，运营 + 内容 + 商业三视角拆解。',
      meta: ['10+ 标杆项目', '500+ 已服务', '20 每团上限'],
      tags: ['商业', '考察', '行业'],
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
      id: 'shape', code: '06', name: '21D SHAPE', nameCn: '分型减脂',
      badge: '干血片 · 3 月疗程',
      brief: '5 项激素检测 + 5 大肥胖分型，先找卡点，再谈减脂。',
      meta: ['5 项激素指标', '5 大肥胖分型', '3 月完整疗程'],
      tags: ['减脂', '分型', '科学'],
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
        review: { text: '减脂不是行为问题，而是生物学问题。', author: 'DEEPBEAT 核心理念' }
      }
    },
    {
      id: 'reboot', code: '07', name: 'REBOOT 30', nameCn: '亚健康单月方案',
      badge: '30 天 · 亚健康人群',
      brief: '颈肩腰肌筋膜 / 失眠 / 慢疲，30 天立体干预。',
      meta: ['92% 改善率', '30 天周期', '+1.5h 平均深睡'],
      tags: ['亚健康', '睡眠', '筋膜'],
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
      id: 'drop', code: '08', name: 'DROP RUN', nameCn: '城市落跑计划',
      badge: '48h · 100 人/期',
      brief: '48 小时极速落跑城市，报名 - 装备 - 完赛全包。',
      meta: ['7 已开赛期', '98% 完赛率', '21km 赛道距离'],
      tags: ['限时', '48h', '落跑'],
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

  /* ---------- DOM READY ---------- */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    renderPrograms();
    bindEvents();
    setupObservers();
    // hide cover
    setTimeout(function () {
      var cover = document.getElementById('pageCover');
      if (cover) cover.classList.add('hidden');
    }, 300);
  }

  /* ---------- RENDER PROGRAMS ---------- */
  function renderPrograms() {
    var grid = document.getElementById('programsGrid');
    if (!grid) return;
    var html = '';
    programs.forEach(function (p, i) {
      html += '<div class="program-card reveal ' + (i % 2 === 1 ? 'reveal-delay-1' : '') + '" data-program="' + p.id + '">'
        + '<div class="program-card-inner">'
        + '<div class="program-top"><span class="program-id">' + p.code + '</span><span class="program-badge">' + p.badge + '</span></div>'
        + '<div class="program-name">' + p.name + '</div>'
        + '<div class="program-name-cn">' + p.nameCn + '</div>'
        + '<div class="program-brief">' + p.brief + '</div>'
        + '<div class="program-meta">' + p.meta.map(function (m) { return '<span class="program-meta-item"><span class="dot"></span>' + m + '</span>'; }).join('') + '</div>'
        + '<div class="program-tags">' + p.tags.map(function (t) { return '<span class="program-tag">' + t + '</span>'; }).join('') + '</div>'
        + '</div></div>';
    });
    grid.innerHTML = html;
  }

  /* ---------- MODAL ---------- */
  function openModal(id) {
    var p = programs.find(function (x) { return x.id === id; });
    if (!p) return;
    var d = p.detail;
    document.getElementById('modalBody').innerHTML =
      '<div class="modal-label">' + p.code + ' · ' + p.badge + '</div>'
      + '<h2 class="modal-title">' + p.name + '</h2>'
      + '<h3 class="modal-subtitle">' + p.nameCn + '</h3>'
      + '<p class="modal-desc">' + d.desc + '</p>'
      + '<div class="modal-results">' + d.results.map(function (r) { return '<div class="modal-result"><div class="modal-result-num">' + r.num + '</div><div class="modal-result-label">' + r.label + '</div></div>'; }).join('') + '</div>'
      + '<div class="modal-section"><h3 style="color:var(--accent)">✓ 适合人群</h3><ul class="modal-for-list">' + d.for.map(function (f) { return '<li>' + f + '</li>'; }).join('') + '</ul></div>'
      + '<div class="modal-section"><h3>暂不适合</h3><ul class="modal-not-list">' + d.not.map(function (n) { return '<li>' + n + '</li>'; }).join('') + '</ul></div>'
      + '<div class="modal-section"><h3>具体安排</h3><div class="modal-timeline">' + d.timeline.map(function (t) { return '<div class="modal-tl-item"><div class="modal-tl-label">' + t.label + '</div><div class="modal-tl-desc">' + t.desc + '</div></div>'; }).join('') + '</div></div>'
      + '<div class="modal-section"><h3>包含内容</h3><div class="modal-includes">' + d.includes.map(function (inc) { return '<div class="modal-include-item">' + inc + '</div>'; }).join('') + '</div></div>'
      + '<div class="modal-section"><div class="modal-review"><p>' + d.review.text + '</p><cite>' + d.review.author + '</cite></div></div>';
    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modal').classList.remove('open');
    document.body.style.overflow = '';
  }
  window.openModal = openModal;
  window.closeModal = closeModal;

  /* ---------- EVENTS ---------- */
  function bindEvents() {
    // program card click
    document.addEventListener('click', function (e) {
      var card = e.target.closest('.program-card');
      if (card && card.dataset.program) openModal(card.dataset.program);
    });

    // modal overlay click
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.addEventListener('click', closeModal);

    // ESC key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // header scroll
    window.addEventListener('scroll', function () {
      document.getElementById('header').classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });

    // smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // mobile menu
    var menuBtn = document.querySelector('.menu-btn');
    var nav = document.querySelector('.header-nav');
    if (menuBtn && nav) {
      menuBtn.addEventListener('click', function () {
        menuBtn.classList.toggle('active');
        nav.classList.toggle('open');
      });
      nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          menuBtn.classList.remove('active');
          nav.classList.remove('open');
        });
      });
    }
  }

  /* ---------- OBSERVERS ---------- */
  function setupObservers() {
    // general reveal
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // counter animation
          entry.target.querySelectorAll('.counter:not(.counted)').forEach(function (c) {
            c.classList.add('counted');
            animateCounter(c);
          });
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal,.split-text').forEach(function (el) {
      revealObs.observe(el);
    });

    // hero
    var hero = document.getElementById('hero');
    if (hero) {
      var heroObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
        });
      }, { threshold: 0.3 });
      heroObs.observe(hero);
    }
  }

  /* ---------- COUNTER ---------- */
  function animateCounter(el) {
    var target = +el.dataset.target;
    var duration = 2000;
    var start = performance.now();
    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * ease);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

})();
