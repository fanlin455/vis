/* ============================================================
   学习星图(首页 #starmap 区块)
   —— 这门课的最后一件展品是观看者自己:
     9 个星座 = 9 章,29 颗星 = 29 个知识点,
     亮度编码掌握度,光环 = 动手玩过,金十字 = 随堂答对。
   数据来自 lesson.js 的本地遥测(localStorage,键 vis.stars.v1),
   本页只读不写、零网络请求。
   ============================================================ */
(function () {
  "use strict";

  /* ================= 章节与知识点(与 chapters/ 一一对应) ================= */
  var STAGES = [
    { color: "#5b8cff", name: "基础篇" },
    { color: "#39c6c0", name: "实战篇" },
    { color: "#a78bfa", name: "进阶篇" }
  ];
  var CHS = [
    { id: "ch1-1", name: "渐进式加载", kps: ["渐进式渲染:先模糊,后清晰", "骨架屏:提前剧透布局", "懒加载:看不见的,先不加载", "LCP 与 CLS:给体验打分"] },
    { id: "ch1-2", name: "D3 与 SVG", kps: ["SVG:网页矢量图形的积木", "选择集与数据绑定:D3 的心脏", "比例尺:从数据世界到像素世界"] },
    { id: "ch1-3", name: "常用图表", kps: ["柱状图:比较大小", "折线图:看趋势", "散点图:找关系", "饼图:看占比"] },
    { id: "ch2-1", name: "Canvas 基础", kps: ["SVG 还是 Canvas?一张表 + 一场赛跑", "画笔上手:基本绘制指令", "动画循环:requestAnimationFrame"] },
    { id: "ch2-2", name: "交互与动画", kps: ["过渡动画:让数据变化可追溯", "事件与拖拽:把控制权交给用户", "刷选与联动:一图提问,众图回答"] },
    { id: "ch2-3", name: "D3 实践", kps: ["数据加载与清洗:垃圾进,垃圾出", "层级布局:同一棵树的两种长相", "组装仪表盘:让视图互相成全"] },
    { id: "ch3-1", name: "工具与库", kps: ["ECharts:写配置,不写指令", "选型决策树:三问定工具", "生态对比:一张表看全家福"] },
    { id: "ch3-2", name: "表格可视化", kps: ["坏表格 vs 好表格:六个反模式", "排序与筛选:表格的原生交互", "Sparkline:表格里的微图表"] },
    { id: "ch3-3", name: "从数据到发布", kps: ["六步工作流:每一步都有产出物", "GitHub Pages:五分钟上线作品", "作品自检:上线前的最后一道关"] }
  ];
  var TOTAL = CHS.reduce(function (s, c) { return s + c.kps.length; }, 0); /* 29 */

  /* ================= 读取本地遥测 ================= */
  var data = {};
  try { data = JSON.parse(localStorage.getItem("vis.stars.v1")) || {}; } catch (e) {}
  data.kp = data.kp || {}; data.time = data.time || {};
  data.stats = data.stats || { mousePx: 0, clicks: 0, scrollPx: 0 };

  function recOf(ci, ki) { return data.kp[CHS[ci].id + ":kp" + (ki + 1)] || {}; }
  function levelOf(rec) { return rec.q === 1 ? 3 : rec.d ? 2 : rec.v ? 1 : 0; }

  /* ================= 几何布局(种子随机:星空自然,每次一致) ================= */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  CHS.forEach(function (ch, i) {
    var cx = 92 + i * 92, cy = 310 + Math.sin(i * 0.9) * 155;
    var r = rng(i * 97 + 13);
    ch.cx = cx; ch.cy = cy; ch.stage = i < 3 ? 0 : i < 6 ? 1 : 2;
    ch.pts = [];
    ch.kps.forEach(function () {
      var p = null;
      for (var t = 0; t < 90 && !p; t++) {
        var a = r() * 6.2832, d = 16 + r() * 30;
        var x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        if (x < 26 || x > 894 || y < 42 || y > 584) continue;
        var ok = true;
        for (var j = 0; j < ch.pts.length; j++) {
          if (Math.hypot(ch.pts[j].x - x, ch.pts[j].y - y) < 16) { ok = false; break; }
        }
        if (ok) p = { x: x, y: y };
      }
      ch.pts.push(p || { x: cx + (r() - 0.5) * 28, y: cy + (r() - 0.5) * 28 });
    });
  });

  /* ================= 统计 ================= */
  var lit = 0, demoN = 0, qOk = 0, qAll = 0, predN = 0, timeS = 0;
  CHS.forEach(function (ch, ci) {
    ch.kps.forEach(function (_, ki) {
      var rec = recOf(ci, ki);
      if (rec.v) lit++;
      if (rec.d) demoN++;
      if (rec.q) qAll++;
      if (rec.q === 1) qOk++;
      if (rec.p) predN++;
    });
  });
  var wallN = 0;
  try {
    for (var wk = 0; wk < localStorage.length; wk++) {
      var wkey = localStorage.key(wk);
      if (wkey && wkey.indexOf("vis.wall.") === 0) {
        var warr = JSON.parse(localStorage.getItem(wkey));
        if (Array.isArray(warr)) wallN += warr.length;
      }
    }
  } catch (e) {}
  Object.keys(data.time).forEach(function (k) { timeS += data.time[k] || 0; });
  var PX2M = 0.0002646; /* 96dpi:1px ≈ 0.2646mm */
  var mouseM = (data.stats.mousePx || 0) * PX2M;
  var scrollM = (data.stats.scrollPx || 0) * PX2M;

  /* 首页首屏:给出明确的下一步,并在章节卡片上显示阅读进度 */
  (function renderCourseProgress() {
    var cards = document.querySelectorAll(".ch-card");
    var firstUnread = null;
    CHS.forEach(function (ch, ci) {
      var seen = 0;
      ch.kps.forEach(function (_, ki) {
        if (recOf(ci, ki).v) seen++;
        else if (!firstUnread) firstUnread = { ci: ci, ki: ki };
      });
      if (!cards[ci]) return;
      var box = document.createElement("div"); box.className = "card-progress";
      box.innerHTML = "<div class='cp-label'><span>学习进度</span><span>" + seen + "/" + ch.kps.length + "</span></div>" +
        "<div class='cp-track'><i style='width:" + (seen / ch.kps.length * 100).toFixed(0) + "%'></i></div>";
      cards[ci].appendChild(box);
    });
    var next = document.getElementById("continue-learning");
    if (!next) return;
    if (firstUnread) {
      var ch = CHS[firstUnread.ci];
      next.href = "chapters/" + ch.id + ".html#kp" + (firstUnread.ki + 1);
      next.querySelector("strong").textContent = lit ? "继续学习 →" : "开始学习 →";
      next.querySelector("small").textContent = "第 " + (firstUnread.ci + 1) + " 章 · " + ch.kps[firstUnread.ki];
    } else {
      next.href = "chapters/ch3-3.html#kp3";
      next.querySelector("strong").textContent = "课程完成 · 回看作品自检 →";
      next.querySelector("small").textContent = "29 个知识点已经全部点亮";
    }
  })();

  function fmtTime(s) {
    if (s < 60) return s + " 秒";
    if (s < 3600) return Math.floor(s / 60) + " 分 " + (s % 60) + " 秒";
    return (s / 3600).toFixed(1) + " 小时";
  }

  /* ================= SVG 渲染 ================= */
  var sky = document.getElementById("st-sky");
  if (!sky) return;
  var NS = "http://www.w3.org/2000/svg";
  function sv(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (parent || sky).appendChild(n);
    return n;
  }

  /* 背景星尘(不参与交互) */
  (function () {
    var r = rng(7), g = sv("g", {});
    for (var i = 0; i < 90; i++) {
      sv("circle", { cx: r() * 920, cy: r() * 620, r: (0.4 + r() * 1.1).toFixed(2),
        fill: "#cdd8f2", opacity: (0.12 + r() * 0.3).toFixed(2) }, g);
    }
  })();

  /* 星座间路径:走过(两端都已读)则点亮为实线 */
  CHS.forEach(function (ch, i) {
    if (i === 0) return;
    var prev = CHS[i - 1], a = prev.pts[prev.pts.length - 1], b = ch.pts[0];
    var walked = recOf(i - 1, prev.kps.length - 1).v && recOf(i, 0).v;
    sv("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      stroke: walked ? "#8fa3c8" : "#3a4670",
      "stroke-width": 1, opacity: walked ? 0.75 : 0.5,
      "stroke-dasharray": walked ? "none" : "3 7" });
  });

  /* 每个星座:连线 → 星 → 章节标签 */
  var CORE_FILL = ["#3c465c", "#c9d6f2", "#e9f0ff", "#ffd166"];
  CHS.forEach(function (ch, ci) {
    var col = STAGES[ch.stage].color;
    var gLine = sv("g", {});
    for (var i = 1; i < ch.pts.length; i++) {
      sv("line", { x1: ch.pts[i - 1].x, y1: ch.pts[i - 1].y, x2: ch.pts[i].x, y2: ch.pts[i].y,
        stroke: col, "stroke-width": 1.2, opacity: 0.4 }, gLine);
    }
    var chLit = ch.kps.filter(function (_, ki) { return recOf(ci, ki).v; }).length;
    var label = sv("text", { x: ch.cx, y: ch.cy - 48, "text-anchor": "middle",
      fill: "#8fa3c8", "font-size": 11.5 });
    label.textContent = (ci + 1) + " · " + ch.name + "  " + chLit + "/" + ch.kps.length;

    ch.kps.forEach(function (title, ki) {
      var rec = recOf(ci, ki), lv = levelOf(rec), p = ch.pts[ki];
      var g = sv("g", { "data-ci": ci, "data-ki": ki, style: "cursor:pointer" });
      if (lv >= 1) {
        sv("circle", { cx: p.x, cy: p.y, r: 8 + lv * 2.6, fill: col, opacity: 0.09 + lv * 0.045 }, g);
      }
      if (rec.q === 2) { /* 答错:红色虚线环,回去重做即可点亮 */
        sv("circle", { cx: p.x, cy: p.y, r: 7.5, fill: "none", stroke: "#f87171",
          "stroke-width": 1.1, "stroke-dasharray": "2 3" }, g);
      }
      if (rec.q === 1) { /* 答对:金色十字 */
        sv("path", { d: "M" + (p.x - 7) + " " + p.y + "H" + (p.x + 7) + "M" + p.x + " " + (p.y - 7) + "V" + (p.y + 7),
          stroke: "#ffd166", "stroke-width": 1.2, opacity: 0.85 }, g);
      }
      var core = sv("circle", { cx: p.x, cy: p.y, r: (2.1 + lv * 0.85).toFixed(2),
        fill: CORE_FILL[lv], opacity: lv ? 1 : 0.55, class: "st-core" }, g);
      core.style.animationDelay = (-(ki * 0.9 + ci * 0.5)) + "s";
      if (lv === 0) core.style.animationDuration = "6s"; /* 未点亮的不抢戏 */
      bindTip(g, ci, ki, title);
    });
  });

  /* ================= 悬停提示 + 点击直达 ================= */
  var tip = document.getElementById("st-tip");
  var wrap = document.getElementById("st-skywrap");
  function bindTip(g, ci, ki, title) {
    g.addEventListener("pointerenter", function () {
      var rec = recOf(ci, ki);
      tip.innerHTML = "<b>" + title + "</b>" +
        "<span class='tt-ch'>第 " + (ci + 1) + " 章 · " + CHS[ci].name + "</span>" +
        "<div class='tt-rows'>" +
        "👁 " + (rec.v ? "已读 ✓" : "尚未读") + "<br>" +
        "🖱 " + (rec.d ? "玩过演示 ✓" : "还没动手") + "<br>" +
        "🙋 " + (rec.q === 1 ? "随堂一问 答对 ✦" : rec.q === 2 ? "答错,可回去重做" : "未作答") +
        "</div><span class='tt-go'>点击 → 直达这一节</span>";
      var r = g.getBoundingClientRect(), w = wrap.getBoundingClientRect();
      tip.style.display = "block";
      var left = r.left + r.width / 2 - w.left;
      left = Math.max(120, Math.min(w.width - 120, left));
      tip.style.left = left + "px";
      tip.style.top = Math.max(70, r.top - w.top) + "px";
    });
    g.addEventListener("pointerleave", function () { tip.style.display = "none"; });
    g.addEventListener("click", function () {
      location.href = "chapters/" + CHS[ci].id + ".html#kp" + (ki + 1);
    });
  }

  /* ================= 观测报告 ================= */
  document.getElementById("st-greet").textContent = (function () {
    var h = new Date().getHours();
    if (h < 5) return "凌晨观测 · 夜越深,星越亮";
    if (h < 12) return "上午观测 · 白昼亦可仰望";
    if (h < 18) return "午后观测 · 保持航线";
    return "夜晚观测 · 正是点亮星辰的好时候";
  })();
  document.getElementById("st-lit").textContent = lit;
  setTimeout(function () {
    document.getElementById("st-bar").style.width = (lit / TOTAL * 100).toFixed(1) + "%";
  }, 80);

  var rows = [
    ["🎮 演示互动", demoN + " / 29 个"],
    ["🙋 随堂一问", qAll ? qOk + " 答对 / " + qAll + " 作答(" + Math.round(qOk / qAll * 100) + "%)" : "还没开始作答"],
    ["🔮 参与竞猜", predN + " 次"],
    ["💬 讨论墙留言", wallN + " 条"],
    ["⏱ 学习时长", fmtTime(timeS)],
    ["🖱 鼠标里程", mouseM.toFixed(1) + " 米"],
    ["📜 滚动距离", scrollM.toFixed(1) + " 米 ≈ " + (scrollM / 28).toFixed(2) + " 个篮球场"],
    ["👆 点击次数", (data.stats.clicks || 0) + " 次"]
  ];
  document.getElementById("st-rows").innerHTML = rows.map(function (r) {
    return "<div class='rp-row'><span>" + r[0] + "</span><b>" + r[1] + "</b></div>";
  }).join("");

  /* 空状态:一颗星都没亮时给个入口 */
  if (lit === 0) {
    var en = document.createElement("div");
    en.className = "empty-note";
    en.innerHTML = "你的夜空还是一片漆黑——去 <a href='chapters/ch1-1.html'>第 1 章</a> 点亮第一颗星吧";
    wrap.appendChild(en);
  }

  /* ================= 黎明模式:29/29 全点亮 ================= */
  if (lit >= TOTAL) {
    document.getElementById("starmap").classList.add("dawn");
    fireworks();
  }
  function fireworks() {
    var cv = document.createElement("canvas");
    cv.className = "fw-canvas";
    document.body.appendChild(cv);
    var c = cv.getContext("2d");
    cv.width = innerWidth; cv.height = innerHeight; cv.style.display = "block";
    var parts = [], t0 = Date.now(), next = 0;
    function burst(x, y) {
      var hue = 200 + Math.random() * 140;
      for (var i = 0; i < 64; i++) {
        var a = Math.random() * 6.2832, v = 1.6 + Math.random() * 3.6;
        parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, hue: hue + Math.random() * 40 - 20 });
      }
    }
    (function loop() {
      var t = Date.now() - t0;
      c.clearRect(0, 0, cv.width, cv.height);
      if (t > next && t < 4200) {
        burst(cv.width * (0.15 + Math.random() * 0.7), cv.height * (0.12 + Math.random() * 0.45));
        next = t + 380 + Math.random() * 360;
      }
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.vx *= 0.985; p.life -= 0.011;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        c.globalAlpha = Math.max(p.life, 0);
        c.fillStyle = "hsl(" + p.hue + " 90% 66%)";
        c.beginPath(); c.arc(p.x, p.y, 2, 0, 6.2832); c.fill();
      }
      c.globalAlpha = 1;
      if (t < 6500 || parts.length) requestAnimationFrame(loop);
      else cv.parentNode.removeChild(cv);
    })();
  }

  /* ================= 生成星图卡片(1200×630 PNG,本地绘制) ================= */
  document.getElementById("st-card").addEventListener("click", function () {
    var W = 1200, H = 630, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var c = cv.getContext("2d");
    var FONT = "'PingFang SC','Microsoft YaHei',sans-serif";

    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a0f22"); g.addColorStop(1, "#182148");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var r = rng(2024);
    for (var i = 0; i < 80; i++) {
      c.globalAlpha = 0.12 + r() * 0.28; c.fillStyle = "#fff";
      c.beginPath(); c.arc(r() * W, r() * H, 0.3 + r() * 1.3, 0, 6.2832); c.fill();
    }
    c.globalAlpha = 1;

    c.fillStyle = "#fff"; c.font = "700 42px " + FONT;
    c.fillText("✦ 我的学习星图", 56, 82);
    c.fillStyle = "#93a4c3"; c.font = "400 20px " + FONT;
    c.fillText("《可视化导论》· 生成于 " + new Date().toLocaleDateString("zh-CN"), 58, 116);

    function X(x) { return 56 + x / 920 * (W - 112); }
    function Y(y) { return 150 + y / 620 * (H - 238); }

    for (var e = 1; e < CHS.length; e++) {
      var pa = CHS[e - 1].pts[CHS[e - 1].pts.length - 1], pb = CHS[e].pts[0];
      var walked = recOf(e - 1, CHS[e - 1].kps.length - 1).v && recOf(e, 0).v;
      c.strokeStyle = walked ? "rgba(143,163,200,.7)" : "rgba(74,88,144,.5)";
      c.setLineDash(walked ? [] : [3, 6]); c.lineWidth = 1;
      c.beginPath(); c.moveTo(X(pa.x), Y(pa.y)); c.lineTo(X(pb.x), Y(pb.y)); c.stroke();
    }
    CHS.forEach(function (ch, ci) {
      var col = STAGES[ch.stage].color;
      c.strokeStyle = col; c.globalAlpha = 0.45; c.setLineDash([]); c.lineWidth = 1.2;
      c.beginPath();
      ch.pts.forEach(function (p, k) { k ? c.lineTo(X(p.x), Y(p.y)) : c.moveTo(X(p.x), Y(p.y)); });
      c.stroke(); c.globalAlpha = 1;

      c.fillStyle = "#8fa3c3"; c.font = "400 13px " + FONT; c.textAlign = "center";
      c.fillText((ci + 1) + " · " + ch.name, X(ch.cx), Y(ch.cy - 48));
      c.textAlign = "left";

      ch.kps.forEach(function (_, ki) {
        var rec = recOf(ci, ki), lv = levelOf(rec), p = ch.pts[ki];
        if (lv >= 1) {
          c.globalAlpha = 0.14 + lv * 0.05; c.fillStyle = col;
          c.beginPath(); c.arc(X(p.x), Y(p.y), 5 + lv * 1.6, 0, 6.2832); c.fill();
          c.globalAlpha = 1;
        }
        c.fillStyle = CORE_FILL[lv]; c.globalAlpha = lv ? 1 : 0.5;
        c.beginPath(); c.arc(X(p.x), Y(p.y), 1.6 + lv * 0.7, 0, 6.2832); c.fill();
        c.globalAlpha = 1;
        if (rec.q === 1) {
          c.strokeStyle = "#ffd166"; c.lineWidth = 1.1; c.beginPath();
          c.moveTo(X(p.x) - 6, Y(p.y)); c.lineTo(X(p.x) + 6, Y(p.y));
          c.moveTo(X(p.x), Y(p.y) - 6); c.lineTo(X(p.x), Y(p.y) + 6); c.stroke();
        }
      });
    });

    c.fillStyle = "#dbe4f5"; c.font = "600 21px " + FONT;
    c.fillText("点亮 " + lit + "/" + TOTAL + " · 演示互动 " + demoN +
      " · 随堂一问 " + (qAll ? Math.round(qOk / qAll * 100) + "%" : "—") +
      " · 学习 " + fmtTime(timeS), 56, H - 44);
    c.fillStyle = "#5c6a92"; c.font = "400 14px " + FONT; c.textAlign = "right";
    c.fillText("数据 100% 在浏览器本地生成 · 从未离开你的电脑", W - 56, H - 44);
    c.textAlign = "left";

    var a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = "我的学习星图.png";
    a.click();
  });

  /* ================= 重置 ================= */
  document.getElementById("st-reset").addEventListener("click", function () {
    if (confirm("确定清空学习星图的所有本地记录吗?此操作不可恢复。")) {
      try { localStorage.removeItem("vis.stars.v1"); } catch (e) {}
      location.reload();
    }
  });
})();
