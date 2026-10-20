/* ============================================================
   《可视化导论》课程门户 · 重构版交互脚本
   功能:侧边目录滚动高亮 / 代码一键复制 / 演示通用工具
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 侧边目录:滚动高亮当前小节 ---------- */
  const tocLinks = Array.from(document.querySelectorAll(".toc a[href^='#']"));
  if (tocLinks.length) {
    const targets = tocLinks
      .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);

    const setActive = (id) => {
      tocLinks.forEach((a) =>
        a.classList.toggle("current", a.getAttribute("href") === "#" + id)
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // 取视口内最靠上的小节
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 }
    );
    targets.forEach((t) => observer.observe(t));
  }

  /* ---------- 代码块:一键复制 ---------- */
  document.querySelectorAll(".codeblock").forEach((block) => {
    const btn = block.querySelector(".copy");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const pre = block.querySelector("pre");
      const done = () => {
          btn.textContent = "✓ 已复制";
          setTimeout(() => (btn.textContent = "复制"), 1500);
      };
      const fallback = () => {
        const ta = document.createElement("textarea");
        ta.value = pre.innerText; ta.setAttribute("readonly", "");
        ta.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy") ? done() : (btn.textContent = "复制失败"); }
        catch (_) { btn.textContent = "复制失败"; }
        ta.remove();
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(pre.innerText).then(done, fallback);
      else fallback();
    });
  });

  /* ---------- 演示工具:挂在全局供各章节页使用 ---------- */
  const Vis = {
    /** 调色板:课程统一色 */
    palette: ["#2f6fed", "#0ea5a5", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#f43f5e", "#64748b"],

    /** 线性比例尺 */
    scaleLinear(d0, d1, r0, r1) {
      const k = (r1 - r0) / (d1 - d0 || 1);
      return (v) => r0 + (v - d0) * k;
    },

    /** 创建 SVG 元素(值以 var( 开头的属性转入 style —— 演示属性不支持 CSS 变量) */
    svgEl(tag, attrs = {}) {
      const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
      for (const k in attrs) {
        const v = attrs[k];
        if (typeof v === "string" && v.startsWith("var(")) el.style.setProperty(k, v);
        else el.setAttribute(k, v);
      }
      return el;
    },

    /** 简易 tooltip:跟随鼠标显示文本 */
    tooltip() {
      const tip = document.createElement("div");
      tip.style.cssText =
        "position:fixed;pointer-events:none;z-index:999;background:#1e2530;color:#fff;" +
        "font-size:12.5px;line-height:1.5;padding:6px 10px;border-radius:8px;" +
        "box-shadow:0 4px 16px rgba(0,0,0,.25);opacity:0;transition:opacity .12s;" +
        "transform:translate(-50%,calc(-100% - 10px));white-space:nowrap;";
      document.body.appendChild(tip);
      return {
        show(html, x, y) {
          tip.innerHTML = html;
          tip.style.left = x + "px";
          tip.style.top = y + "px";
          tip.style.opacity = 1;
        },
        hide() { tip.style.opacity = 0; },
        destroy() { tip.remove(); },
      };
    },

    /** 生成 n 个伪随机点(种子固定,保证每次刷新一致) */
    randomPoints(n, seed = 42) {
      let s = seed;
      const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      return Array.from({ length: n }, () => ({
        x: rnd(),
        y: rnd(),
        r: 3 + rnd() * 5,
        c: Math.floor(rnd() * 4),
      }));
    },
  };

  /* ---------- 代码块:轻量语法高亮(注释/字符串/标签/关键字/数字) ---------- */
  const escHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const TOKEN_RE =
    /(<!--[\s\S]*?-->|\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[a-zA-Z][\w-]*)|\b(const|let|var|function|return|if|else|for|while|new|class|import|export|async|await|of|in|true|false|null|this)\b|\b(\d+(?:\.\d+)?)\b/g;

  document.querySelectorAll(".codeblock pre code").forEach((code) => {
    const src = code.textContent;
    let out = "", last = 0, m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(src))) {
      out += escHtml(src.slice(last, m.index));
      const cls = m[1] ? "tk-com" : m[2] ? "tk-str" : m[3] ? "tk-tag" : m[4] ? "tk-key" : "tk-num";
      out += '<span class="' + cls + '">' + escHtml(m[0]) + "</span>";
      last = m.index + m[0].length;
    }
    out += escHtml(src.slice(last));
    code.innerHTML = out;
  });

  window.Vis = Vis;
})();
