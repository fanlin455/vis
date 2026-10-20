/* ============================================================
   课堂增强模块(lesson.js)
   —— 把课件从"自学文档"升级为"授课工具"

   功能:课堂模式(投屏大字) / 键盘逐知识点翻页(兼容翻页笔)
        聚光灯 / 黑屏幕布 / 大字倒计时 / 演示全屏放大
        屏幕画笔标注 / 板书白板 / 激光笔 / 随机点名
        章节速览跳转 / 秒表正计时 / 投屏字号三档
        随堂一问(先猜后验证) / 演示竞猜 / 举手统计 / 讨论墙
        教学提示(仅课堂模式可见) / 本章回顾自动注入

   快捷键(进入课堂模式后生效):
     ← → 或 PgUp PgDn   上一个 / 下一个知识点(翻页笔可直接用)
     T    退出/进入课堂模式        L    聚光灯开/关
     B    黑屏幕布(请看向讲台)     D    放大当前演示
     P    屏幕画笔标注            W    板书白板(白纸+画笔)
     G    激光笔(红点指引)        R    随机点名
     N    教学提示显隐            O    章节速览跳转
     S    秒表正计时              Z    投屏字号放大(三档)
     1-9  启动 n 分钟倒计时       0    停止全部计时
     [ ]  画笔开启时调笔迹粗细,否则调聚光灯半径
     Esc  逐层关闭(点名→速览→幕布→板书→画笔→放大→激光→聚光→速查)
     ?    快捷键速查
   ============================================================ */
(function () {
  "use strict";

  /* ================= 随堂一问题库(每章 2 题,注入到对应知识点末尾) =================
     kp: 挂载到第几个知识点;q: 题干;opts: 选项;ans: 正确下标;why: 揭示原因 */
  const QUIZ = {
    "ch1-1": [
      { kp: 2, q: "骨架屏能让页面更快加载完成吗?", opts: ["能,少下载了内容", "不能,字节一个不少,它优化的是感知与布局", "能,浏览器会缓存骨架"], ans: 1,
        why: "骨架屏只是一块灰色占位,总下载量完全不变。它做的是两件事:预留与真实内容一致的布局(消除跳动),并给用户「正在加载」的确定感(降低焦虑)——优化的是感觉速度。" },
      { kp: 4, q: "同一张图加上 width=800 height=600 后 CLS 归零,原因是浏览器……", opts: ["把图片压缩得更小了", "禁止了图片动画", "提前预留了宽高比正确的空盒子"], ans: 2,
        why: "有了宽高,布局在图片到达之前就算好了盒子尺寸;图片下载完成只是把内容填进空盒,页面其余内容不会被推挤——CLS 保持在 0。" }
    ],
    "ch1-2": [
      { kp: 2, q: "页面上已有 2 个 rect,绑定数据 [10, 20, 30] 后,enter 集合里有几个元素?", opts: ["0 个", "1 个", "3 个"], ans: 1,
        why: "join 按顺序配对:前 2 个数据配到已有 rect 进入 update;多出来的第 3 个数据(30)进入 enter 等待创建。反过来数据比元素少才会进 exit。" },
      { kp: 3, q: "柱状图 y 比例尺的 range 常写成 [高度, 0] 而不是 [0, 高度],原因是……", opts: ["纯属团队代码习惯", "SVG 的 y 轴向下,大数值必须映射到小 y,柱子才能向上长", "为了让坐标轴更美观"], ans: 1,
        why: "SVG 坐标系原点在左上角、y 向下增大。忘记翻转比例尺,是新手画出「向下生长的柱状图」的头号原因。" }
    ],
    "ch1-3": [
      { kp: 1, q: "比较 8 个城市的销售额大小,首选什么图?", opts: ["饼图", "折线图", "柱状图"], ans: 2,
        why: "比较类目大小 → 用长度编码,柱状图感知精度最高。饼图靠角度分辨,8 个类目基本读不出来;折线图用于时间趋势。另外记得 y 轴从 0 开始。" },
      { kp: 4, q: "以下哪种情况仍然适合使用饼图?", opts: ["12 个类目的份额构成", "3 个类目、占比差异明显", "对比两年的构成变化"], ans: 1,
        why: "饼图只在 ≤5 个类目、差异明显时读得清。跨图比较角度几乎不可能,对比两年构成应该用堆叠柱状图。" }
    ],
    "ch2-1": [
      { kp: 1, q: "要做 5000 个粒子的动画,选哪种渲染方案?", opts: ["SVG,每个粒子一个 circle", "Canvas,逐帧重绘", "两者性能完全一样"], ans: 1,
        why: "5000 个 DOM 元素每帧改属性,DOM 更新开销会让帧率跳水;Canvas 是立即模式,一帧一笔带过,还能整屏脏区重绘。" },
      { kp: 3, q: "requestAnimationFrame 相比 setInterval(fn, 16) 的优势,不包括哪一项?", opts: ["与屏幕刷新自动同步", "后台标签页自动暂停省电", "回调间隔永远精确等于 16ms"], ans: 2,
        why: "恰恰相反:rAF 的回调时机由浏览器调度,帧间隔会波动。所以正确的动画代码用 dt(时间增量)计算位移,而不是假设每帧固定 16ms。" }
    ],
    "ch2-2": [
      { kp: 1, q: "数据过渡动画的舒适时长大约是?", opts: ["50ms", "250–750ms", "2 秒以上"], ans: 1,
        why: "太短(几十毫秒)看不出变化过程,等于跳变;太长(数秒)拖慢节奏、让人干等。250–750ms 是既看得清又不拖沓的区间。" },
      { kp: 3, q: "刷选之后把未选中的点变淡,主要目的是?", opts: ["节省渲染开销", "用前景/背景对比聚焦,让答案自己浮出来", "让页面配色更丰富"], ans: 1,
        why: "亮度对比是最强的视觉引导之一:被选中的亮、未选中的暗,学生的视线会自动落在亮的那部分——这正是联动可视化的核心手法。" }
    ],
    "ch2-3": [
      { kp: 1, q: "销量列有缺失值,直接当 0 参与求平均,后果是?", opts: ["没有影响", "均值被系统性拉低,得出错误结论", "图表会报错画不出来"], ans: 1,
        why: "缺失 ≠ 0。缺失可能意味着「没记录」而不是「没卖出去」。正确做法:剔除、合理填充或明确标记,并且把处理方式写进日志。" },
      { kp: 2, q: "treemap(矩形树图)里每个矩形的面积编码的是?", opts: ["节点的数值大小", "节点在树中的深度", "节点名称的长度"], ans: 0,
        why: "面积与 value 严格成比例,才能一眼看出「钱/量花在哪里」;深度用颜色或边框表达即可。" }
    ],
    "ch3-1": [
      { kp: 1, q: "ECharts 与 D3 最核心的范式差异是?", opts: ["ECharts 只能画饼图", "ECharts 声明式填配置,D3 命令式写指令", "ECharts 不支持交互"], ans: 1,
        why: "ECharts 填 option 描述「要什么」,D3 写代码指挥「怎么画」。换来的是上手速度与控制粒度的取舍:快出标准图选前者,深度定制选后者。" },
      { kp: 2, q: "十万级数据点 + 地图叠加的场景,决策树会指向哪个工具?", opts: ["Chart.js", "deck.gl", "手写 SVG"], ans: 1,
        why: "规模上十万、或涉及地理大场景,就该进 WebGL 阵营(deck.gl 等),用 GPU 换吞吐;Chart.js 面向中小规模标准图表。" }
    ],
    "ch3-2": [
      { kp: 1, q: "表格里的数字列应该怎么对齐?", opts: ["左对齐", "居中对齐", "右对齐"], ans: 2,
        why: "右对齐让个、十、百、千位纵向对齐,大小一眼可判;居中会让数位错开,纵向比较变困难。文字列才左对齐。" },
      { kp: 3, q: "同一列里的 sparkline 必须共享同一个 y 域,因为?", opts: ["代码更短", "曲线形状才能跨行比较", "颜色更统一"], ans: 1,
        why: "各自缩放到各自最大值的曲线没有可比性——某行的「深 V」可能只是局部放大。共享 y 域,斜率与波幅才可比。" }
    ],
    "ch3-3": [
      { kp: 1, q: "一个可视化项目工作流的第一步是?", opts: ["打开编辑器写代码", "明确问题与读者", "挑一个好看的配色"], ans: 1,
        why: "问题决定数据、图表与交互的一切。先画后想的返工成本最高——「给谁看、看完做什么」是比「用什么图」更优先的问题。" },
      { kp: 2, q: "GitHub Pages 适合部署哪种内容?", opts: ["需要用户登录的社交网站", "纯静态的作品页(HTML/CSS/JS)", "带数据库的电商系统"], ans: 1,
        why: "Pages 只托管静态文件:没有后端执行环境、没有数据库。对课程作品、个人主页、项目文档恰好够用。" }
    ]
  };

  /* ================= 本章回顾(注入到翻页器之前) ================= */
  const SUMMARY = {
    "ch1-1": { points: [
        "渐进式渲染:同样的字节,先模糊后清晰,优化的是感知速度",
        "骨架屏预留布局:消除跳动、降低焦虑,形状必须与真实内容一致",
        "loading=\"lazy\" + IntersectionObserver:视口外的一张图也不下载",
        "img 写 width/height(或 aspect-ratio),CLS 稳在 0"
      ], next: "下一章预告:进入 D3 的世界,从 SVG 积木与数据绑定三步曲开始。" },
    "ch1-2": { points: [
        "SVG 五块积木:rect / circle / line / path / text,注意 y 轴向下",
        "join 三步曲:enter 补新元素、update 改旧元素、exit 删多余元素",
        "比例尺 = 数据域 → 像素域的换算函数,y 方向要记得翻转"
      ], next: "下一章预告:用这三件套画出柱状图、折线图、散点图、饼图四大金刚。" },
    "ch1-3": { points: [
        "比较大小用柱(y 从 0 起)、看趋势用线、看关系用散点、看占比用饼(≤5 类)",
        "悬停 tooltip 与平滑重排(transition)是最基础的两组交互",
        "同一份数据换一种图型,结论可能完全不同——先问对问题再选图"
      ], next: "下一章预告:图元素上千怎么办?Canvas 接管性能。" },
    "ch2-1": { points: [
        "SVG 保留模式 vs Canvas 立即模式:元素不多要交互选 SVG,量大选 Canvas",
        "Canvas 画笔流程:beginPath → 指令路径 → fill/stroke,一步都不能少",
        "rAF 与屏幕刷新同步、后台自动暂停;动画位移用 dt 计算,不假设帧长"
      ], next: "下一章预告:画得动了,还要「活」起来——过渡、拖拽、刷选联动。" },
    "ch2-2": { points: [
        "过渡取 250–750ms + 缓动函数,动画要能回答「谁、从哪、到哪」",
        "拖拽三件套:pointerdown/move/up + 坐标换算 + 边界约束",
        "刷选是一次提问,联动让所有视图同时回答;变暗未选中即是聚焦"
      ], next: "下一章预告:三件套集齐,下一章串成一条完整的数据项目流水线。" },
    "ch2-3": { points: [
        "GIGO:缺失、类型、异常三步清洗,每一步都留下日志",
        "hierarchy 统一层级数据;缩进树重文本细读,treemap 重占比一眼见",
        "仪表盘分层:结论(KPI)→ 比较(柱)→ 趋势(线),自上而下"
      ], next: "下一章预告:只会 D3 还不够——横向对比 ECharts 等生态,学会选型。" },
    "ch3-1": { points: [
        "命令式(D3)灵活费工,声明式(ECharts)快省受限,没有银弹",
        "选型三问:数据规模多大?要多定制?是否领域特化(地图/关系/时间)?",
        "十万级点或地理大场景 → WebGL 阵营(deck.gl 等),用 GPU 换吞吐"
      ], next: "下一章预告:换个视角——表格也是可视化,而且很能打。" },
    "ch3-2": { points: [
        "表格排版三原则:数字右对齐、千分位、细横线——服务纵横扫读",
        "表头三态排序 + 即时筛选 + 计数反馈,让表格可以被追问",
        "sparkline 共享 y 域,形状跨行可比;同列同域是纪律"
      ], next: "下一章预告:最后一章,把所有技能变成一个能上线的作品。" },
    "ch3-3": { points: [
        "六步流程:问题 → 数据 → 清洗 → 探索 → 实现 → 发布,允许随时回炉",
        "Pages 五步上线:git init → push → Settings → Pages → 访问",
        "自检四维:设计 / 交互 / 性能 / 可访问性,逐条打勾再发布"
      ], next: "课程完结:带上这九件武器,开始你的期末作品吧!" }
  };

  /* ================= 演示竞猜题库(每章 1-2 题,注入到对应演示的正前方) =================
     kp: 挂载到第几个知识点;q: 题干;opts: 选项;ans: 正确下标;why: 揭示原因。
     与随堂一问不同:竞猜先押注 → 玩演示验证 → 再看答案。 */
  const PRED = {
    "ch1-1": [
      { kp: 1, q: "点击「重新加载」后,哪边会先让你看清图片内容?", opts: ["基线式(从上到下一条条刷)", "渐进式(先模糊后清晰)", "两边同时"], ans: 1,
        why: "两种方式字节总数完全一样,但渐进式优先传输轮廓信息——感知上「先看到」就是更快。这正是本页演示要验证的事。" },
      { kp: 3, q: "列表共 12 张图,视口只装得下 4 张,首屏会下载几张?", opts: ["全部 12 张", "约 4-6 张(视口内 + 预载边距)", "一张都不下"], ans: 1,
        why: "IntersectionObserver 只在图片进入视口(或接近视口)时才把 src 换上去——滚到哪、加载哪,这正是懒加载省流量的原理。" }
    ],
    "ch1-2": [
      { kp: 1, q: "把 SVG 的 width/height 同时缩小一半,里面的图形和文字会?", opts: ["像位图一样变糊", "保持矢量锐利,只是整体变小", "直接消失"], ans: 1,
        why: "SVG 存的是几何描述而非像素,缩放只是换算坐标系——去演示里拖一拖尺寸试试。" },
      { kp: 3, q: "画布高 300、上下留白各 30,数据域 [0, 75]。数值 75 会被映射到 y ≈ ?", opts: ["30(顶部)", "270(底部)", "300(画布外)"], ans: 0,
        why: "range 写成 [H-30, 30] 的翻转:数据最大值映射到最小的 y,柱子才向上长。这是新手第一坑,也是演示里滑块在做的事。" }
    ],
    "ch1-3": [
      { kp: 1, q: "把 y 轴上限从 1000 调到 5000,柱子之间的差异会?", opts: ["不变", "被压扁,差异几乎看不出来", "更明显"], ans: 1,
        why: "值域变大,同样的数据差被编码成更短的像素差——坐标轴范围是「叙事工具」,演示里点一下排序再改改上限感受一下。" }
    ],
    "ch2-1": [
      { kp: 1, q: "点击开赛后,上方 SVG 引擎的 FPS 大概率会?", opts: ["一直稳在 60", "粒子越多越低,逐渐掉下去", "直接归零"], ans: 1,
        why: "粒子数量上来之后,每帧改数千个 DOM 属性的开销线性放大,帧率被一点点压垮——跑完这场赛跑,曲线会替你作证。" },
      { kp: 3, q: "切到别的标签页 10 秒再回来,弹跳的小球会?", opts: ["原地暂停,回来继续", "一瞬间飞出画面", "时间倒流"], ans: 0,
        why: "rAF 在后台标签页自动暂停;这一页的物理用 dt 计算(且钳制了上限),所以恢复后从离开的位置继续——不会瞬移。" }
    ],
    "ch2-2": [
      { kp: 1, q: "把过渡时长拉到 0ms(直接跳变)再切换排序,会发生什么?", opts: ["更清爽,什么也不损失", "看不出哪根柱跑到了哪,只能重新逐个认", "图表会画错"], ans: 1,
        why: "动画的价值是保住「同一根柱」的对应关系——没有过程,跳变之后你得重新逐个匹配。去演示里把滑块拖到 0ms 试一次。" },
      { kp: 3, q: "框选散点图左上角一小块,下方的直方图会?", opts: ["全部变灰", "只有选中的部分保持高亮,其余变暗", "完全不变"], ans: 1,
        why: "联动 = 所有视图对同一次选择给出一致回答:亮的是答案,暗的是背景。演示里框一下就知道。" }
    ],
    "ch2-3": [
      { kp: 1, q: "销量列混进了字符串「1,203」,直接对整列求和会?", opts: ["正常算出结果", "得到 NaN 或错误总和", "浏览器崩溃"], ans: 1,
        why: "带千分位的字符串无法直接参与运算——先清洗(去逗号、转数值)再计算。演示里的「开始清洗」会一步步演给你看。" }
    ],
    "ch3-1": [
      { kp: 1, q: "在 ECharts 里把柱状图改成折线图,大约要改几行配置?", opts: ["一行:把 type: 'bar' 改成 'line'", "重写整个 option", "做不到,要换库"], ans: 0,
        why: "声明式的好处:你只描述「要什么」。演示里切几下图表类型,感受一下配置驱动的开发方式。" }
    ],
    "ch3-2": [
      { kp: 1, q: "把数字列从右对齐改成居中,最先受影响的是?", opts: ["页面美观度", "纵向比较数位大小的速度", "文件大小"], ans: 1,
        why: "右对齐让个、十、百、千位纵向对齐,眼睛才能沿列扫读。演示里切换坏/好表格,感受两种排版读数的差别。" }
    ],
    "ch3-3": [
      { kp: 2, q: "git push 之后,同学立刻打开你的 Pages 链接,最可能遇到?", opts: ["立即可见", "有 1-2 分钟构建部署延迟", "永远看不到"], ans: 1,
        why: "Pages 需要重新构建部署,通常几十秒到两分钟。稍等或强刷即可——不是你 push 错了。" }
    ]
  };

  /* ================= 讨论墙议题(每章一面墙 + 首页留言板) ================= */
  const WALL = {
    "ch1-1": "你在哪些 App 里见过骨架屏或加载动画?哪一次等待「感觉」最短?为什么?",
    "ch1-2": "enter / update / exit 三兄弟,哪个最难记?说说你自己的记法。",
    "ch1-3": "举一个你最近见过的「用错图」的例子,它应该换成什么图?",
    "ch2-1": "SVG 与 Canvas,你的期末作品打算用哪个?为什么?",
    "ch2-2": "除了刷选联动,你还想要哪种「一图提问、众图回答」的交互?",
    "ch2-3": "你见过最「脏」的真实数据长什么样?当时怎么处理的?",
    "ch3-1": "只能二选一:ECharts 的「快」vs D3 的「自由」,你选哪个?什么场景?",
    "ch3-2": "数字右对齐、千分位、斑马纹——哪条表格规则最容易被忽视?",
    "ch3-3": "立个 flag:你的期末作品打算做什么?写下来,期末回来看看。",
    "home": "上完这节课,你想说什么?给老师提建议、给同学留句话、或给自己立个 flag,都行。"
  };

  /* ================= 教学提示(N 开关;仅课堂模式投屏可见,学生端永不出现)
     intro: 章级开场建议;tips: 逐知识点授课要点(问法 / 强调 / 演示时机 / 易错点) */
  const NOTES = {
    "ch1-1": {
      intro: "开场问:「早上刷淘宝/微博,图片是啪一下蹦出来,还是先糊后清?」从生活经验切入。本章演示密集、节奏可以快,但 1.3 的懒加载一定留 1–2 分钟让学生自己滚一遍。",
      tips: {
        1: "先用上方的「先猜后看」让全班举手押注,再点播放。收尾强调一句:两种方式字节一样,省的是「等待的感觉」。",
        2: "强调骨架屏形状必须与真实内容一致——否则只是把「图片跳动」换成「骨架跳动」。可随机点名让学生说自己见过骨架屏的 App。",
        3: "让学生亲自滚动列表,然后问:视口只装得下 4 张,首屏下载了几张?答案就在演示的加载计数器上。",
        4: "压轴演示:先切「无宽高」让全班看到标题被图片推下去,再切「有宽高」。留一句口诀:img 必写 width/height。"
      }
    },
    "ch1-2": {
      intro: "从这章开始写代码。别急着报 API,先让学生找 SVG 标签和 HTML 标签的相同点——「都是标签,这章就好讲了」。",
      tips: {
        1: "全场跟着比划一遍:SVG 的 y 轴向下、原点在左上角。这是后续所有图表的地基,宁可多花两分钟。",
        2: "用「观众与座位」比喻 join:数据是观众、元素是座位;观众多 → enter 站着,座位多 → exit 空着。配本节的随堂一问当场验证。",
        3: "讲完 range 翻转立刻做竞猜题(数值 75 映射到哪),先给 30 秒全班笔算,再揭示答案。"
      }
    },
    "ch1-3": {
      intro: "本章主轴是「问对问题再选图」。每个图型先问「它回答什么问题」,再看代码怎么写,顺序别反。",
      tips: {
        1: "现场把 y 轴上限从 1000 拉到 5000,问:差异去哪了?——坐标轴范围是叙事工具,不是中性刻度。",
        2: "强调折线的自变量必须是时间/顺序。反问:身高体重的散点能连成折线吗?为什么不能?",
        3: "散点看关系,顺带一句「相关不等于因果」,点到为止,期末还会回来。",
        4: "饼图 ≤5 类是经验值,根因是「人眼对角度不敏感」。此处随堂一问正确率通常偏高,可以加快节奏。"
      }
    },
    "ch2-1": {
      intro: "本章有全课最兴奋的「双引擎粒子赛跑」——开赛前一定先做 FPS 竞猜,全班押注再点开赛,气氛就起来了。",
      tips: {
        1: "赛跑时把粒子数逐渐拉满,让 SVG 的 FPS 曲线当着全班「跳水」。一句话总结:DOM 数量是 SVG 的天花板。",
        2: "现场故意漏写 beginPath 或 fill,让屏幕「什么都没有」——先看见错,再补对,印象翻倍。",
        3: "切到别的标签页 10 秒再回来,球没有瞬移——问为什么。答案:rAF 后台暂停 + 位移用 dt 计算。"
      }
    },
    "ch2-2": {
      intro: "主线一句话:交互是「图回答用户的提问」。所有演示都围绕「提问—回答」展开,讲每个演示前先抛一个问题。",
      tips: {
        1: "把过渡时长拖到 0ms 再点排序,让学生数有几根柱认不出来——动画保住的是「对象恒常性」。",
        2: "现场写拖拽三件套,先不加边界约束把球拖飞一次,再补 clamp。「先痛后甜」,记得用激光笔指出那行代码。",
        3: "本章高潮:框选散点左上角,直方图其余部分变暗。总结口诀:亮的是答案,暗的是背景。"
      }
    },
    "ch2-3": {
      intro: "建议先展示章末的成品仪表盘,再倒着拆步骤讲——「先见森林,再见树木」,学生才知道每一步为什么存在。",
      tips: {
        1: "先点「直接求和」看到 NaN——先看见疼,再点「开始清洗」给药。GIGO(垃圾进垃圾出)一词点题。",
        2: "缩进树 ↔ 树图同屏切换,问:看结构用哪个?看占比用哪个?让学生自己说出来。",
        3: "仪表盘分层类比报纸排版:标题(KPI)→ 图片(图表)→ 细节(表格),自上而下信息递减。"
      }
    },
    "ch3-1": {
      intro: "工具章容易讲成念参数。以 7.2 的决策树互动为主线,请学生上台点「三问」,全班跟着走,你就退居主持。",
      tips: {
        1: "现场把 type:'bar' 改成 'line',一行配置换一种图——声明式的爽点要当场演出来,别只嘴说。",
        2: "让学生出题:「我要画十万个点的地图!」全班一起走树。多走两遍,决策树就成了肌肉记忆。",
        3: "生态对比表快速过即可,重点留在「选型三问」:规模多大?要多定制?是否领域特化?"
      }
    },
    "ch3-2": {
      intro: "开场先做反转:「表格不是备胎,是最被低估的可视化」。用 8.1 的坏/好表格一键切换对比开场,效果立竿见影。",
      tips: {
        1: "切到坏表格让全班「找茬」30 秒,再切好表格。六个反模式点两个最痛的即可,其余留给自学。",
        2: "演示三态排序与即时筛选时,强调「计数反馈」——每次筛选都要告诉用户还剩多少条。",
        3: "sparkline 必须共享 y 域——切「各自缩放」让某行的「深 V」现出原形,这是本节最强一击。"
      }
    },
    "ch3-3": {
      intro: "最后一章,把前面的武器串成流水线。带着一个问题讲:「如果重做一遍你的课程作品,你会先做什么?」",
      tips: {
        1: "六步流程强调「允许回炉」:探索阶段发现数据问题就退回清洗,不是走单行道。",
        2: "有条件就现场 git push 一次,打开 Pages 链接看部署延迟——竞猜题的答案让学生自己验证。",
        3: "用自检清单逐条过一件学生作品(或本站自己):设计/交互/性能/可访问性。收尾话术:「这门课的最后一幅图,是你们自己。」"
      }
    }
  };

  /* ================= 章节速览数据(O) ================= */
  const DECK = [
    { id: "ch1-1", n: 1, title: "渐进式加载网页图片", stage: "基础篇", color: "#2f6fed", kps: 4 },
    { id: "ch1-2", n: 2, title: "D3 与 SVG 入门", stage: "基础篇", color: "#2f6fed", kps: 3 },
    { id: "ch1-3", n: 3, title: "D3 常用图表", stage: "图表篇", color: "#0ea5a5", kps: 4 },
    { id: "ch2-1", n: 4, title: "Canvas 绘图基础", stage: "图表篇", color: "#0ea5a5", kps: 3 },
    { id: "ch2-2", n: 5, title: "交互进阶与动画", stage: "交互篇", color: "#f59e0b", kps: 3 },
    { id: "ch2-3", n: 6, title: "D3 可视化实践", stage: "交互篇", color: "#f59e0b", kps: 3 },
    { id: "ch3-1", n: 7, title: "其他工具与库", stage: "拓展篇", color: "#8b5cf6", kps: 3 },
    { id: "ch3-2", n: 8, title: "专题:表格可视化", stage: "拓展篇", color: "#8b5cf6", kps: 3 },
    { id: "ch3-3", n: 9, title: "期末:从数据到发布", stage: "拓展篇", color: "#8b5cf6", kps: 3 }
  ];

  /* ================= 工具 ================= */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function store(key, val) {
    try {
      if (arguments.length === 1) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  function sessionStore(key, val) {
    try {
      if (arguments.length === 1) return sessionStorage.getItem(key);
      sessionStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* 当前章节标识,如 "ch1-1";主页返回 null */
  const chMatch = location.pathname.match(/ch\d-\d/);
  const CH = chMatch ? chMatch[0] : null;

  /* ================= 学习星图遥测 =================
     只写入本地 localStorage(键 vis.stars.v1),不产生任何网络请求。
     记录:读过哪些知识点(v)、玩过哪些演示(d)、随堂一问对错(q)、
          每章停留秒数(time)、鼠标里程 / 滚动距离 / 点击数(stats)。 */
  const TKEY = "vis.stars.v1";
  let starData = null;
  try { starData = JSON.parse(localStorage.getItem(TKEY)); } catch (e) { starData = null; }
  if (!starData || typeof starData !== "object") starData = {};
  if (!starData.kp || typeof starData.kp !== "object") starData.kp = {};
  if (!starData.time || typeof starData.time !== "object") starData.time = {};
  if (!starData.stats || typeof starData.stats !== "object") starData.stats = { mousePx: 0, clicks: 0, scrollPx: 0 };

  const mem = { mousePx: 0, clicks: 0, scrollPx: 0, x: null, y: null, sy: null, dirty: false };
  function starsSave(force) {
    if (!mem.dirty && !force) return;
    starData.stats.mousePx += mem.mousePx;
    starData.stats.clicks += mem.clicks;
    starData.stats.scrollPx += mem.scrollPx;
    mem.mousePx = 0; mem.clicks = 0; mem.scrollPx = 0;
    mem.dirty = false;
    try { localStorage.setItem(TKEY, JSON.stringify(starData)); } catch (e) { /* 隐私模式等场景静默放弃 */ }
  }
  function kpRec(ch, num) {
    const k = ch + ":kp" + num;
    return starData.kp[k] || (starData.kp[k] = {});
  }
  function starQuiz(ch, num, val) {
    if (!ch) return;
    kpRec(ch, num).q = val; /* 1=答对 2=答错 0=未作答/重置 */
    starsSave(true);
  }
  function starPred(ch, num) {
    if (!ch) return;
    kpRec(ch, num).p = 1; /* 演示竞猜:已押注 */
    starsSave(true);
  }

  /* 点击计数 + 演示互动标记(事件委托,一处监听全站) */
  document.addEventListener("pointerdown", e => {
    mem.clicks++; mem.dirty = true;
    const t = e.target;
    if (!t || !t.closest || !CH) return;
    const dm = t.closest(".demo");
    if (dm) {
      const sec = dm.closest(".kp");
      if (sec && sec.id) {
        const rec = kpRec(CH, sec.id.replace(/^kp/, ""));
        if (!rec.d) { rec.d = 1; starsSave(true); }
      }
    }
  }, true);

  /* 鼠标里程(米)与滚动距离(米):单次跳变过大视为切窗口,丢弃 */
  document.addEventListener("pointermove", e => {
    if (mem.x != null) {
      const dx = e.clientX - mem.x, dy = e.clientY - mem.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 220) { mem.mousePx += d; mem.dirty = true; }
    }
    mem.x = e.clientX; mem.y = e.clientY;
  }, { passive: true });
  window.addEventListener("scroll", () => {
    const sy = window.scrollY || 0;
    if (mem.sy != null) {
      const d = Math.abs(sy - mem.sy);
      if (d < 3200) { mem.scrollPx += d; mem.dirty = true; }
    }
    mem.sy = sy;
  }, { passive: true });

  /* 每章停留秒数(仅前台标签页计时),定期落盘 */
  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    if (CH) { starData.time[CH] = (starData.time[CH] || 0) + 5; mem.dirty = true; }
    starsSave();
  }, 5000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") starsSave(true); });
  window.addEventListener("pagehide", () => starsSave(true));

  /* ================= 组件:全班举手统计(挂在竞猜/随堂一问卡下方) =================
     纯本机计数:老师念完题让大家举手,按选项点 +1,分布柱状图当场长出来。 */
  function addTally(card, n) {
    const letters = ["A", "B", "C", "D"];
    const counts = [];
    for (let i = 0; i < n; i++) counts.push(0);

    const wrap = el("div", "q-tally");
    const head = el("div", "t-head", "✋ 全班举手统计");
    head.appendChild(el("small", null, "念完题让大家举手,按人数点 +1 —— 分布图当场长出来"));
    wrap.appendChild(head);

    const bars = el("div", "t-bars");
    const btnRow = el("div", "t-btns");
    const totalEl = el("span", "t-total", "");
    const subs = [];
    counts.forEach((_, i) => {
      const grp = el("span", "t-grp");
      const add = el("button", null, letters[i] + " ✋+1");
      add.type = "button";
      const sub = el("button", "t-sub", "−1");
      sub.type = "button";
      sub.style.display = "none";
      subs.push(sub);
      add.addEventListener("click", () => { counts[i]++; render(); });
      sub.addEventListener("click", () => { counts[i] = Math.max(0, counts[i] - 1); render(); });
      grp.appendChild(add); grp.appendChild(sub);
      btnRow.appendChild(grp);
    });
    const clear = el("button", "t-clear", "清零");
    clear.type = "button";
    clear.addEventListener("click", () => { for (let i = 0; i < counts.length; i++) counts[i] = 0; render(); });
    btnRow.appendChild(clear);
    btnRow.appendChild(totalEl);

    function render() {
      const total = counts.reduce((a, b) => a + b, 0);
      bars.innerHTML = "";
      if (!total) {
        bars.appendChild(el("span", "t-empty", "还没人举手 —— 点上方按钮记录"));
      } else {
        counts.forEach((c, i) => {
          if (!c) return;
          const seg = el("i", "tb" + (i % 4), letters[i] + " · " + c);
          seg.style.flex = String(c);
          bars.appendChild(seg);
        });
      }
      subs.forEach((s, i) => { s.style.display = counts[i] > 0 ? "" : "none"; });
      totalEl.textContent = total ? "共 " + total + " 人" : "";
    }
    render();
    wrap.appendChild(bars);
    wrap.appendChild(btnRow);
    card.appendChild(wrap);
  }

  /* ================= 组件:先猜后看(演示竞猜卡) ================= */
  function buildPred(q) {
    const card = el("div", "quiz-card pred-card");
    const head = el("div", "q-head", "🔮 先猜后看");
    head.appendChild(el("small", null, "先押一个答案 → 玩下面的演示验证 → 再看答案"));
    card.appendChild(head);
    card.appendChild(el("div", "q-text", q.q));

    const opts = el("div", "q-opts");
    const letters = ["A", "B", "C", "D"];
    const revealRow = el("div", "q-reveal");
    revealRow.style.display = "none";

    const btns = q.opts.map((o, i) => {
      const b = el("button", null, letters[i] + ". " + o);
      b.type = "button";
      b.addEventListener("click", () => {
        if (card.classList.contains("guessed")) return;
        card.classList.add("guessed");
        btns.forEach(bb => { bb.disabled = true; });
        b.classList.add("pick");
        starPred(CH, q.kp);
        revealRow.style.display = "block";
      });
      opts.appendChild(b);
      return b;
    });
    card.appendChild(opts);

    const rb = el("button", null, "👁 看答案 & 原因");
    rb.type = "button";
    rb.addEventListener("click", () => {
      card.classList.add("answered");
      btns.forEach((bb, bi) => { if (bi === q.ans) bb.classList.add("right"); });
      revealRow.style.display = "none";
    });
    revealRow.appendChild(rb);
    card.appendChild(revealRow);

    card.appendChild(el("div", "q-why", "💡 " + q.why));
    const reset = el("button", "q-reset", "换个猜测再来");
    reset.type = "button";
    reset.addEventListener("click", () => {
      card.classList.remove("answered", "guessed");
      btns.forEach(bb => { bb.disabled = false; bb.classList.remove("right", "wrong", "pick"); });
      revealRow.style.display = "none";
    });
    card.appendChild(reset);
    addTally(card, q.opts.length);
    return card;
  }

  /* ================= 组件:讨论墙(本机留言 + 点赞 + 一键复制全墙) ================= */
  const WALL_TYPES = [
    { k: "💡 想法", c: "#2f6fed" },
    { k: "❓ 提问", c: "#0ea5a5" },
    { k: "🌟 打气", c: "#f59e0b" },
    { k: "🔥 吐槽", c: "#ef4444" }
  ];
  function buildWall(mount, key, prompt, title) {
    const WKEY = "vis.wall." + key;
    let list;
    try { list = JSON.parse(localStorage.getItem(WKEY)); } catch (e) { list = null; }
    if (!Array.isArray(list)) list = [];

    const box = el("div", "wall");
    const head = el("div", "wall-head");
    head.appendChild(el("h3", null, "💬 讨论墙"));
    const countEl = el("span", "wall-count", "");
    const copyBtn = el("button", "wall-tool", "📋 复制全墙");
    const clearBtn = el("button", "wall-tool ghost", "清空");
    head.appendChild(countEl); head.appendChild(copyBtn); head.appendChild(clearBtn);
    box.appendChild(head);
    box.appendChild(el("p", "wall-prompt", "📌 本墙议题:" + prompt));

    const form = el("div", "wall-form");
    const meta = el("div", "wall-meta");
    const name = document.createElement("input");
    name.className = "w-name"; name.maxLength = 10; name.placeholder = "昵称(可留空)";
    name.setAttribute("aria-label", "昵称（可留空）");
    const typeRow = el("div", "w-types");
    typeRow.setAttribute("role", "group");
    typeRow.setAttribute("aria-label", "留言类型");
    let curType = 0;
    const typeBtns = WALL_TYPES.map((t, i) => {
      const b = el("button", i === 0 ? "on" : "", t.k);
      b.type = "button";
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.style.setProperty("--wt", t.c);
      b.addEventListener("click", () => {
        curType = i;
        typeBtns.forEach((bb, bi) => {
          bb.classList.toggle("on", bi === i);
          bb.setAttribute("aria-pressed", bi === i ? "true" : "false");
        });
      });
      typeRow.appendChild(b);
      return b;
    });
    meta.appendChild(name); meta.appendChild(typeRow);
    const ta = document.createElement("textarea");
    ta.className = "w-text"; ta.rows = 3;
    ta.placeholder = "写下你的看法…(只保存在本机;点「复制全墙」即可发给老师 / 群里)";
    ta.setAttribute("aria-label", "留言内容");
    const act = el("div", "w-actions");
    const send = el("button", "w-send", "🚀 发布");
    send.type = "button";
    act.appendChild(send);
    form.appendChild(meta); form.appendChild(ta); form.appendChild(act);
    box.appendChild(form);

    const listEl = el("div", "wall-list");
    box.appendChild(listEl);
    mount.appendChild(box);

    function fmt(ts) {
      const d = new Date(ts);
      const p = x => (x < 10 ? "0" : "") + x;
      return (d.getMonth() + 1) + "/" + d.getDate() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
    }
    function save() {
      try { localStorage.setItem(WKEY, JSON.stringify(list)); } catch (e) {}
      render();
    }
    function render() {
      listEl.innerHTML = "";
      countEl.textContent = list.length + " 条";
      if (!list.length) {
        listEl.appendChild(el("div", "wall-empty", "静悄悄的 —— 做第一个留下想法的人?"));
        return;
      }
      list.forEach((note, i) => {
        const t = WALL_TYPES[note.t] || WALL_TYPES[0];
        const card = el("div", "wnote");
        card.style.setProperty("--wt", t.c);
        card.style.setProperty("--rot", ((i % 2 ? 1 : -1) * (0.3 + (i % 3) * 0.35)).toFixed(2) + "deg");
        const h = el("div", "wn-head");
        h.appendChild(el("b", null, note.n || "匿名同学"));
        h.appendChild(el("span", "wn-type", t.k));
        h.appendChild(el("time", null, fmt(note.ts)));
        const p = el("p", null, note.c);
        const f = el("div", "wn-foot");
        const z = el("button", null, "👍 " + (note.z || 0));
        z.type = "button";
        z.addEventListener("click", () => { note.z = (note.z || 0) + 1; save(); });
        const del = el("button", "wn-del", "删除");
        del.type = "button";
        del.addEventListener("click", () => {
          if (!confirm("删除这条留言?")) return;
          list.splice(i, 1); save();
        });
        f.appendChild(z); f.appendChild(del);
        card.appendChild(h); card.appendChild(p); card.appendChild(f);
        listEl.appendChild(card);
      });
    }

    send.addEventListener("click", () => {
      const text = ta.value.trim();
      if (!text) { toast("先写点东西再发布吧~"); return; }
      list.unshift({ n: name.value.trim(), t: curType, c: text, ts: Date.now(), z: 0 });
      ta.value = "";
      save();
      toast("已发布到讨论墙 ✅");
    });
    copyBtn.addEventListener("click", () => {
      if (!list.length) { toast("墙上还没有留言"); return; }
      const lines = ["《可视化导论》讨论墙 · " + title, "议题:" + prompt, "────────────"];
      list.slice().reverse().forEach(nt => {
        lines.push("[" + (WALL_TYPES[nt.t] || WALL_TYPES[0]).k + "] " + (nt.n || "匿名同学") + "(" + fmt(nt.ts) + ")");
        lines.push(nt.c);
        if (nt.z) lines.push("👍 " + nt.z);
        lines.push("");
      });
      lines.push("────────────", "共 " + list.length + " 条 · 由课程网站本地导出");
      copyText(lines.join("\n"));
    });
    clearBtn.addEventListener("click", () => {
      if (!list.length) return;
      if (!confirm("清空这面讨论墙?(只影响本机记录)")) return;
      list = []; save();
    });
    render();
  }
  function copyText(text) {
    const done = () => toast("已复制,去粘贴分享吧 📋");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }
  let toastTimer = null;
  function toast(msg) {
    let t = document.getElementById("vis-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "vis-toast"; t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ================= 注入:随堂一问 ================= */
  function buildQuiz(q) {
    const card = el("div", "quiz-card");
    const head = el("div", "q-head", "🙋 随堂一问");
    head.appendChild(el("small", null, "全班先猜,点选项验证;✋ 可现场统计举手"));
    card.appendChild(head);
    card.appendChild(el("div", "q-text", q.q));

    const opts = el("div", "q-opts");
    const letters = ["A", "B", "C", "D"];
    const btns = q.opts.map((o, i) => {
      const b = el("button", null, letters[i] + ". " + o);
      b.type = "button";
      b.addEventListener("click", () => {
        if (card.classList.contains("answered")) return;
        card.classList.add("answered");
        btns.forEach((bb, bi) => {
          bb.disabled = true;
          if (bi === q.ans) bb.classList.add("right");
        });
        if (i !== q.ans) b.classList.add("wrong");
        starQuiz(CH, q.kp, i === q.ans ? 1 : 2);
      });
      opts.appendChild(b);
      return b;
    });
    card.appendChild(opts);
    card.appendChild(el("div", "q-why", "💡 " + q.why));
    const reset = el("button", "q-reset", "再试一次");
    reset.type = "button";
    reset.addEventListener("click", () => {
      card.classList.remove("answered");
      btns.forEach(bb => { bb.disabled = false; bb.classList.remove("right", "wrong"); });
      starQuiz(CH, q.kp, 0);
    });
    card.appendChild(reset);
    addTally(card, q.opts.length);
    return card;
  }

  if (CH && QUIZ[CH]) {
    QUIZ[CH].forEach(q => {
      const sec = document.getElementById("kp" + q.kp);
      if (sec) sec.appendChild(buildQuiz(q));
    });
  }

  /* ================= 注入:本章回顾 ================= */
  if (CH && SUMMARY[CH]) {
    const pager = $(".ch-pager");
    if (pager && pager.parentNode) {
      const box = el("div", "chapter-summary");
      box.appendChild(el("h2", null, "📦 本章回顾"));
      const ul = el("ul");
      SUMMARY[CH].points.forEach(p => ul.appendChild(el("li", null, p)));
      box.appendChild(ul);
      box.appendChild(el("div", "next-hint", SUMMARY[CH].next));
      pager.parentNode.insertBefore(box, pager);
    }
  }

  /* ================= 注入:先猜后看(放在对应演示的正前方) ================= */
  if (CH && PRED[CH]) {
    PRED[CH].forEach(q => {
      const sec = document.getElementById("kp" + q.kp);
      if (!sec) return;
      const demo = $(".demo", sec);
      const card = buildPred(q);
      if (demo) demo.parentNode.insertBefore(card, demo);
      else sec.appendChild(card);
    });
  }

  /* ================= 注入:讨论墙(章末)与首页留言板 ================= */
  if (CH && WALL[CH]) {
    const pagerEl = $(".ch-pager");
    if (pagerEl && pagerEl.parentNode) {
      const wallMount = el("div", "wall-mount");
      const major = +CH.charAt(2), minor = +CH.charAt(4);
      pagerEl.parentNode.insertBefore(wallMount, pagerEl);
      buildWall(wallMount, CH, WALL[CH], "第 " + ((major - 1) * 3 + minor) + " 章");
    }
  }
  const homeWall = document.getElementById("home-wall");
  if (homeWall) buildWall(homeWall, "home", WALL.home, "课程留言板");

  /* ================= 课堂模式状态 ================= */
  const html = document.documentElement;
  const sections = $$(".kp");
  let currentIdx = -1;
  let barBuilt = false;
  let toolbox = null, notesPanel = null, overview = null, rosterModal = null;
  let inkLayer = null, inkCanvas = null, inkOn = false;
  let board = null, boardCanvas = null, boardOn = false;
  let laser = null, laserOn = false;

  /* ---------- 授课控制条 ---------- */
  let bar, posEl;
  function buildBar() {
    if (barBuilt || !sections.length) return;
    barBuilt = true;
    bar = el("div", "lesson-bar");

    const mkBtn = (label, title, fn, cls) => {
      const b = el("button", cls || null, label);
      b.type = "button"; b.title = title;
      b.addEventListener("click", fn);
      return b;
    };

    bar.appendChild(mkBtn("⏮ 上一个", "上一个知识点(← / PgUp)", () => step(-1)));
    posEl = el("span", "lb-pos", "");
    bar.appendChild(posEl);
    bar.appendChild(mkBtn("下一个 ⏭", "下一个知识点(→ / PgDn)", () => step(1)));
    bar.appendChild(el("span", "lb-sep"));
    bar.appendChild(mkBtn("⏱ 2:00", "课堂计时:点击启动 2 分钟;数字键 1-9 可设任意分钟", () => {
      if (timerEnd) stopTimer(); else startTimer(2);
    }, "lb-desktop"));
    bar.appendChild(mkBtn("🔦 聚光灯", "聚光灯:突出鼠标区域(L),[ ] 调整半径", toggleSpot, "lb-desktop"));
    bar.appendChild(mkBtn("⬛ 幕布", "黑屏幕布:请看向讲台(B)", toggleBlack, "lb-desktop"));
    bar.appendChild(mkBtn("⛶ 放大演示", "全屏放大当前演示(D)", zoomCurrentDemo, "lb-desktop"));
    bar.appendChild(mkBtn("🧰 工具", "课堂工具箱:画笔、白板、激光笔、点名与提词", toggleToolbox));
    bar.appendChild(mkBtn("? 快捷键", "快捷键速查", toggleHelp));
    bar.appendChild(mkBtn("✕ 退出课堂模式", "退出课堂模式(T)", () => setTeach(false)));
    document.body.appendChild(bar);

    /* 快捷键速查浮层 */
    helpBox = el("div", "lb-help");
    helpBox.innerHTML =
      "<b>← →</b> 或 <b>PgUp PgDn</b> 上一个/下一个知识点(兼容翻页笔)<br>" +
      "<b>T</b> 课堂模式 &nbsp;<b>L</b> 聚光灯 &nbsp;<b>B</b> 幕布 &nbsp;<b>D</b> 放大演示<br>" +
      "<b>P</b> 屏幕画笔 &nbsp;<b>W</b> 板书 &nbsp;<b>G</b> 激光笔 &nbsp;<b>[ ]</b> 粗细/光圈<br>" +
      "<b>N</b> 教学提示 &nbsp;<b>O</b> 章节速览 &nbsp;<b>R</b> 随机点名<br>" +
      "<b>S</b> 秒表 &nbsp;<b>Z</b> 字号 &nbsp;<b>1-9</b> 倒计时 &nbsp;<b>0</b> 停止计时<br>" +
      "<b>Esc</b> 关闭当前浮层或工具";
    document.body.appendChild(helpBox);
  }
  let helpBox = null;

  function updatePos() {
    if (!posEl || !sections.length) return;
    const idx = Math.max(0, currentIdx);
    const sec = sections[idx];
    const h = sec && sec.querySelector(".kp-head h2");
    const title = h ? h.textContent.trim() : "";
    posEl.textContent = "知识点 " + (idx + 1) + "/" + sections.length + (title ? " · " + title : "");
    updateNotes();
  }

  /* 当前知识点追踪(独立于目录高亮,给呼吸徽章用) */
  if (sections.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          currentIdx = sections.indexOf(en.target);
          sections.forEach(s => s.classList.toggle("kp-current", s === en.target));
          updatePos();
          /* 学习星图:滚动到过即点亮该知识点 */
          if (CH && en.target.id) {
            const rec = kpRec(CH, en.target.id.replace(/^kp/, ""));
            if (!rec.v) { rec.v = 1; starsSave(true); }
          }
        }
      });
    }, { rootMargin: "-80px 0px -55% 0px" });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- 知识点跳转 ---------- */
  function step(dir) {
    if (!sections.length) return;
    const from = Math.max(0, currentIdx);
    const to = Math.min(sections.length - 1, Math.max(0, from + dir));
    const target = sections[to];
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.remove("flash");
    void target.offsetWidth; /* 重启动画 */
    target.classList.add("flash");
    setTimeout(() => target.classList.remove("flash"), 1500);
  }

  /* ---------- 课堂模式开关 ---------- */
  function setTeach(on) {
    html.classList.toggle("teach", on);
    sessionStore("vis.lesson.teach", on ? "1" : "0");
    if (on) buildBar();
    if (!on) {
      const url = new URL(location.href);
      if (url.searchParams.has("teach")) {
        url.searchParams.delete("teach");
        history.replaceState(history.state, "", url.pathname + url.search + url.hash);
      }
      spotOff(); blackOff(); closeStage(); inkOff(); boardOff(); laserOff(); stopTimer();
      helpBox && helpBox.classList.remove("open");
      toolbox && toolbox.classList.remove("open");
      notesPanel && notesPanel.classList.remove("open");
      overview && hideModal(overview, false);
      rosterModal && hideModal(rosterModal, false);
    }
    updatePos();
  }

  if (sections.length) {
    const fab = el("button", "teach-fab", "📽 进入课堂模式");
    fab.type = "button";
    fab.title = "授课投屏模式:放大字号、键盘翻页、课堂工具箱(T)";
    fab.addEventListener("click", () => setTeach(true));
    document.body.appendChild(fab);
  }

  /* URL 带 ?teach=1 或本标签页刚开启过 → 直接进入;关闭标签页后恢复学生视图 */
  const wantTeach = new URLSearchParams(location.search).get("teach") === "1" || sessionStore("vis.lesson.teach") === "1";
  if (wantTeach && sections.length) setTeach(true);

  /* ================= 聚光灯 ================= */
  let spot = null, spotOn = false, spotR = 230;
  function ensureSpot() {
    if (spot) return;
    spot = el("div", "spotlight");
    spot.style.setProperty("--r", spotR + "px");
    document.body.appendChild(spot);
    document.addEventListener("pointermove", e => {
      if (!spotOn) return;
      spot.style.setProperty("--sx", e.clientX + "px");
      spot.style.setProperty("--sy", e.clientY + "px");
    });
  }
  function toggleSpot() {
    ensureSpot();
    spotOn = !spotOn;
    spot.style.display = spotOn ? "block" : "none";
    if (spotOn) {
      spot.style.setProperty("--sx", innerWidth / 2 + "px");
      spot.style.setProperty("--sy", innerHeight / 2 + "px");
    }
  }
  function spotOff() { if (spotOn) toggleSpot(); }
  function spotScale(d) {
    spotR = Math.min(480, Math.max(110, spotR + d));
    if (spot) spot.style.setProperty("--r", spotR + "px");
  }

  /* ================= 黑屏幕布 ================= */
  let black = null, blackOn = false;
  function ensureBlack() {
    if (black) return;
    black = el("div", "blackout");
    black.appendChild(el("span", null, "⏸ 请看向讲台 · 按 Esc 或点击返回课件"));
    black.addEventListener("click", blackOff);
    document.body.appendChild(black);
  }
  function toggleBlack() {
    ensureBlack();
    blackOn = !blackOn;
    black.style.display = blackOn ? "grid" : "none";
  }
  function blackOff() { if (blackOn) toggleBlack(); }

  /* ================= 课堂工具箱 ================= */
  function ensureToolbox() {
    if (toolbox) return;
    toolbox = el("div", "lesson-tools");
    toolbox.innerHTML = "<h3>🧰 课堂工具箱</h3><p>按钮与键盘快捷键等效,所有内容仅在本机运行。</p>";
    const grid = el("div", "lesson-tools-grid");
    [
      ["⏱ 两分钟倒计时", () => timerEnd ? stopTimer() : startTimer(2)],
      ["🔦 聚光灯 · L", toggleSpot], ["⬛ 黑屏幕布 · B", toggleBlack],
      ["⛶ 放大演示 · D", zoomCurrentDemo],
      ["✍ 屏幕画笔 · P", toggleInk], ["▧ 板书白板 · W", toggleBoard],
      ["🔴 激光笔 · G", toggleLaser], ["🎲 随机点名 · R", openRoster],
      ["🗒 教学提示 · N", toggleNotes], ["▦ 章节速览 · O", toggleOverview],
      ["⏱ 秒表 · S", startStopwatch], ["Aa 投屏字号 · Z", cycleFontSize]
    ].forEach(item => {
      const b = el("button", null, item[0]);
      b.type = "button"; b.addEventListener("click", () => { item[1](); toolbox.classList.remove("open"); }); grid.appendChild(b);
    });
    toolbox.appendChild(grid);
    document.body.appendChild(toolbox);
  }
  function toggleToolbox() {
    ensureToolbox();
    toolbox.classList.toggle("open");
  }

  /* ================= 屏幕画笔 / 白板共用画线逻辑 ================= */
  function fitCanvas(cv) {
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.lineCap = "round"; c.lineJoin = "round";
  }
  function wirePen(cv, color, width) {
    let down = false, last = null;
    const point = e => ({ x: e.clientX, y: e.clientY });
    cv.addEventListener("pointerdown", e => {
      down = true; last = point(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); e.preventDefault();
    });
    cv.addEventListener("pointermove", e => {
      if (!down) return;
      const now = point(e), c = cv.getContext("2d");
      c.strokeStyle = typeof color === "function" ? color() : color;
      c.lineWidth = typeof width === "function" ? width() : width;
      c.beginPath(); c.moveTo(last.x, last.y); c.lineTo(now.x, now.y); c.stroke(); last = now;
    });
    const up = () => { down = false; last = null; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  }

  let inkWidth = 5;
  function ensureInk() {
    if (inkLayer) return;
    inkLayer = el("div", "ink-layer");
    inkCanvas = document.createElement("canvas");
    inkLayer.appendChild(inkCanvas);
    inkLayer.appendChild(el("div", "ink-chip", "✍ 画笔已开启 · P 退出 · [ ] 调粗细 · 双击清空"));
    inkLayer.addEventListener("dblclick", () => inkCanvas.getContext("2d").clearRect(0, 0, innerWidth, innerHeight));
    wirePen(inkCanvas, "#ff3157", () => inkWidth);
    document.body.appendChild(inkLayer); fitCanvas(inkCanvas);
  }
  function toggleInk() {
    ensureInk(); inkOn = !inkOn; inkLayer.classList.toggle("on", inkOn);
    if (inkOn) { laserOff(); toolbox && toolbox.classList.remove("open"); toast("屏幕画笔已开启 · 双击空白处可清空"); }
  }
  function inkOff() { if (inkOn) toggleInk(); }
  function inkScale(d) {
    inkWidth = Math.min(18, Math.max(2, inkWidth + d));
    toast("画笔粗细 " + inkWidth + " px");
  }

  let boardWidth = 5, boardColor = "#243047";
  function ensureBoard() {
    if (board) return;
    board = el("div", "whiteboard");
    boardCanvas = document.createElement("canvas"); board.appendChild(boardCanvas);
    const tools = el("div", "board-tools"); tools.appendChild(el("strong", null, "▧ 板书白板"));
    [["黑", "#243047"], ["红", "#e43f5a"], ["蓝", "#2f6fed"]].forEach(item => {
      const b = el("button", null, item[0]); b.type = "button";
      b.addEventListener("click", () => { boardColor = item[1]; }); tools.appendChild(b);
    });
    const clear = el("button", null, "清空"); clear.type = "button";
    clear.addEventListener("click", () => boardCanvas.getContext("2d").clearRect(0, 0, innerWidth, innerHeight));
    const close = el("button", null, "完成 · W"); close.type = "button"; close.addEventListener("click", boardOff);
    tools.appendChild(clear); tools.appendChild(close); board.appendChild(tools);
    wirePen(boardCanvas, () => boardColor, () => boardWidth);
    document.body.appendChild(board); fitCanvas(boardCanvas);
  }
  function toggleBoard() {
    ensureBoard(); boardOn = !boardOn; board.classList.toggle("open", boardOn);
    if (boardOn) { inkOff(); laserOff(); toolbox && toolbox.classList.remove("open"); }
  }
  function boardOff() { if (boardOn) toggleBoard(); }

  /* ================= 激光笔 ================= */
  function ensureLaser() {
    if (laser) return;
    laser = el("div", "laser-dot"); document.body.appendChild(laser);
    document.addEventListener("pointermove", e => {
      if (!laserOn) return; laser.style.left = e.clientX + "px"; laser.style.top = e.clientY + "px";
    });
  }
  function toggleLaser() {
    ensureLaser(); laserOn = !laserOn; laser.classList.toggle("on", laserOn); html.classList.toggle("laser-on", laserOn);
    if (laserOn) { inkOff(); laser.style.left = innerWidth / 2 + "px"; laser.style.top = innerHeight / 2 + "px"; }
  }
  function laserOff() { if (laserOn) toggleLaser(); }

  /* ================= 教学提示(N):按当前知识点更新 ================= */
  function ensureNotes() {
    if (notesPanel || !CH || !NOTES[CH]) return;
    notesPanel = el("aside", "teach-notes");
    notesPanel.setAttribute("aria-label", "教师提词"); document.body.appendChild(notesPanel); updateNotes();
  }
  function updateNotes() {
    if (!notesPanel || !CH || !NOTES[CH]) return;
    const n = NOTES[CH], idx = Math.max(0, currentIdx), tip = n.tips[idx + 1] || "按左右键切换知识点。";
    const title = sections[idx] && $(".kp-head h2", sections[idx]);
    notesPanel.innerHTML = "<div class='tn-kicker'>教师提词 · 投屏可见 · N 隐藏</div>" +
      "<h3>" + (title ? title.textContent : "本章教学提示") + "</h3><p>" + tip + "</p>" +
      "<p class='tn-intro'><b>本章开场:</b> " + n.intro + "</p>";
  }
  function toggleNotes() {
    ensureNotes();
    if (!notesPanel) return;
    notesPanel.classList.toggle("open"); toolbox && toolbox.classList.remove("open");
  }

  /* ================= 通用弹窗:语义、焦点进入/返回、Tab 约束 ================= */
  function modalFocusables(modal) {
    return $$("a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex='-1'])", modal)
      .filter(n => n.offsetParent !== null);
  }
  function prepareModal(modal, panel, titleEl, closeBtn) {
    const titleId = "modal-title-" + Math.random().toString(36).slice(2, 9);
    titleEl.id = titleId;
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", titleId); modal.setAttribute("aria-hidden", "true");
    panel.setAttribute("tabindex", "-1");
    modal.__firstFocus = closeBtn;
    modal.addEventListener("keydown", e => {
      if (e.key !== "Tab") return;
      const focusable = modalFocusables(modal);
      if (!focusable.length) { e.preventDefault(); panel.focus(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  function showModal(modal, preferred) {
    modal.__returnFocus = document.activeElement;
    modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => (preferred || modal.__firstFocus || modal).focus());
  }
  function hideModal(modal, restore) {
    if (!modal) return;
    const wasOpen = modal.classList.contains("open");
    modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true");
    if (wasOpen && restore !== false && modal.__returnFocus && modal.__returnFocus.focus) modal.__returnFocus.focus();
  }

  /* ================= 章节速览(O) ================= */
  function ensureOverview() {
    if (overview) return;
    overview = el("div", "class-modal");
    const panel = el("div", "class-panel");
    const head = el("div", "class-panel-head"), title = el("h2", null, "▦ 九章课程速览"); head.appendChild(title);
    const close = el("button", null, "关闭 · O"); close.type = "button"; close.addEventListener("click", () => hideModal(overview));
    head.appendChild(close); panel.appendChild(head);
    const grid = el("div", "deck-grid"), prefix = CH ? "" : "chapters/";
    DECK.forEach(d => {
      const a = el("a", "deck-card" + (d.id === CH ? " current" : ""));
      a.href = prefix + d.id + ".html?teach=1"; a.style.setProperty("--dc", d.color);
      a.innerHTML = "<small>第 " + d.n + " 章 · " + d.stage + " · " + d.kps + " 个知识点</small><b>" + d.title + "</b><small>点击切换并保持课堂模式 →</small>";
      grid.appendChild(a);
    });
    panel.appendChild(grid); overview.appendChild(panel); prepareModal(overview, panel, title, close);
    overview.addEventListener("click", e => { if (e.target === overview) hideModal(overview); });
    document.body.appendChild(overview);
  }
  function toggleOverview() {
    ensureOverview();
    if (overview.classList.contains("open")) hideModal(overview); else showModal(overview);
    toolbox && toolbox.classList.remove("open");
  }

  /* ================= 随机点名(R) ================= */
  let rosterArea = null, rosterResult = null, rosterSpin = null;
  function ensureRoster() {
    if (rosterModal) return;
    rosterModal = el("div", "class-modal"); const panel = el("div", "class-panel roster-panel");
    const head = el("div", "class-panel-head"), title = el("h2", null, "🎲 随机点名"); head.appendChild(title);
    const close = el("button", null, "关闭 · Esc"); close.type = "button"; close.addEventListener("click", () => hideModal(rosterModal));
    head.appendChild(close); panel.appendChild(head);
    panel.appendChild(el("p", null, "每行一个名字;名单只保存在当前浏览器。按 R 可随时打开。"));
    rosterArea = document.createElement("textarea"); rosterArea.placeholder = "张三\n李四\n王五";
    rosterArea.value = store("vis.lesson.roster") || ""; panel.appendChild(rosterArea);
    const acts = el("div", "roster-actions"); const draw = el("button", "draw-name", "开始点名"); draw.type = "button";
    const clear = el("button", null, "清空名单"); clear.type = "button";
    draw.addEventListener("click", drawName); clear.addEventListener("click", () => { rosterArea.value = ""; store("vis.lesson.roster", ""); rosterResult.textContent = "等待名单"; });
    acts.appendChild(draw); acts.appendChild(clear); panel.appendChild(acts);
    rosterResult = el("div", "roster-result", "等待名单"); rosterResult.setAttribute("aria-live", "polite"); panel.appendChild(rosterResult);
    rosterModal.appendChild(panel); prepareModal(rosterModal, panel, title, close);
    rosterModal.addEventListener("click", e => { if (e.target === rosterModal) hideModal(rosterModal); });
    document.body.appendChild(rosterModal);
  }
  function openRoster() { ensureRoster(); showModal(rosterModal, rosterArea); toolbox && toolbox.classList.remove("open"); }
  function drawName() {
    const names = rosterArea.value.split(/[\n,，、]+/).map(s => s.trim()).filter(Boolean);
    store("vis.lesson.roster", rosterArea.value); clearInterval(rosterSpin);
    if (!names.length) { rosterResult.textContent = "请先输入名单"; return; }
    let n = 0; rosterSpin = setInterval(() => {
      rosterResult.textContent = names[Math.floor(Math.random() * names.length)];
      if (++n >= 14) { clearInterval(rosterSpin); rosterSpin = null; rosterResult.textContent = "🎉 " + names[Math.floor(Math.random() * names.length)]; }
    }, 70);
  }

  /* ================= 投屏字号(Z) ================= */
  let fontLevel = +(store("vis.lesson.font") || 0);
  function applyFontSize() {
    html.classList.toggle("teach-size-1", fontLevel === 1); html.classList.toggle("teach-size-2", fontLevel === 2);
  }
  function cycleFontSize() {
    fontLevel = (fontLevel + 1) % 3; store("vis.lesson.font", String(fontLevel)); applyFontSize();
    toast("投屏字号:" + ["默认", "大", "特大"][fontLevel]);
  }
  applyFontSize();
  window.addEventListener("resize", () => {
    if (inkCanvas) fitCanvas(inkCanvas); if (boardCanvas) fitCanvas(boardCanvas);
  });

  /* ================= 计时器 ================= */
  let timerEnd = 0, stopwatchStart = 0, timerIv = null, hud = null, audioCtx = null;
  function ensureHud() {
    if (hud) return;
    hud = el("div", "timer-hud");
    document.body.appendChild(hud);
  }
  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35].forEach(delay => {
        const t = audioCtx.currentTime + delay;
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.start(t); o.stop(t + 0.3);
      });
    } catch (e) { /* 无音频权限时静默 */ }
  }
  function fmt(s) {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }
  function startTimer(min) {
    stopTimer();
    ensureHud();
    timerEnd = Date.now() + min * 60000;
    hud.style.display = "block";
    hud.classList.remove("urgent");
    clearInterval(timerIv);
    timerIv = setInterval(tick, 250);
    tick();
  }
  function startStopwatch() {
    if (stopwatchStart) { stopTimer(); toast("秒表已停止"); return; }
    stopTimer(); ensureHud(); stopwatchStart = Date.now();
    hud.style.display = "block"; hud.classList.remove("urgent");
    const tickUp = () => {
      const sec = Math.floor((Date.now() - stopwatchStart) / 1000);
      hud.textContent = "⏱ 正计时 " + Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2);
    };
    tickUp(); timerIv = setInterval(tickUp, 250); toolbox && toolbox.classList.remove("open");
  }
  function tick() {
    const left = (timerEnd - Date.now()) / 1000;
    if (left <= 0) {
      stopTimer();
      ensureHud();
      hud.style.display = "block";
      hud.textContent = "⏰ 时间到!";
      hud.classList.add("urgent");
      beep();
      setTimeout(() => { if (!timerEnd && !stopwatchStart && hud) hud.style.display = "none"; }, 4000);
      return;
    }
    hud.textContent = "⏱ " + fmt(left);
    hud.classList.toggle("urgent", left <= 30);
  }
  function stopTimer() {
    clearInterval(timerIv); timerIv = null; timerEnd = 0; stopwatchStart = 0;
    if (hud) { hud.style.display = "none"; hud.classList.remove("urgent"); }
  }

  /* ================= 演示放大舞台 ================= */
  let stage = null, staged = null, stagePh = null;
  function ensureStage() {
    if (stage) return;
    stage = el("div", "demo-stage");
    const card = el("div", "stage-card");
    const close = el("button", "stage-close", "✕");
    close.type = "button";
    close.title = "关闭放大(Esc)";
    close.addEventListener("click", closeStage);
    stage.appendChild(card);
    stage.appendChild(close);
    stage.addEventListener("click", e => { if (e.target === stage) closeStage(); });
    document.body.appendChild(stage);
  }
  function openStage(demo) {
    ensureStage();
    if (staged === demo) return;
    if (staged) closeStage();
    stagePh = document.createComment("demo-origin");
    demo.parentNode.insertBefore(stagePh, demo);
    stage.firstChild.appendChild(demo);
    staged = demo;
    stage.classList.add("open");
  }
  function closeStage() {
    if (!staged) return;
    stage.classList.remove("open");
    stagePh.parentNode.insertBefore(staged, stagePh);
    stagePh.parentNode.removeChild(stagePh);
    stagePh = null; staged = null;
  }
  /* 每个演示头部自动加"放大"按钮 */
  $$(".demo").forEach(demo => {
    const head = $(".demo-head", demo);
    if (!head || $(".zoom-btn", head)) return;
    const btn = el("button", "zoom-btn", "⛶ 放大");
    btn.type = "button";
    btn.title = "全屏放大演示,适合投屏讲解";
    btn.addEventListener("click", () => openStage(demo));
    head.appendChild(btn);
  });
  function zoomCurrentDemo() {
    let demo = null;
    if (sections.length && currentIdx >= 0) {
      for (let i = currentIdx; i >= 0 && !demo; i--) demo = $(".demo", sections[i]);
    }
    if (!demo) demo = $(".demo");
    if (demo) openStage(demo);
  }

  /* ================= 速查开关 ================= */
  function toggleHelp() {
    if (!helpBox) return;
    helpBox.classList.toggle("open");
  }

  /* ================= 图形文字替代 ================= */
  function enhanceVisualSemantics() {
    $$(".demo svg, .demo canvas").forEach((node, i) => {
      const demo = node.closest(".demo");
      const heading = demo && demo.querySelector(".demo-head h3, .demo-head h4");
      if (!heading) return;
      const title = heading.textContent.trim().replace(/^演示\s*·\s*/, "");
      if (!node.hasAttribute("role")) node.setAttribute("role", "img");
      if (!node.hasAttribute("aria-label") && !node.hasAttribute("aria-labelledby")) {
        node.setAttribute("aria-label", `${node.tagName === "CANVAS" ? "Canvas" : "SVG"} 可视化：${title}`);
      }
      const tip = demo.querySelector(".demo-tip");
      if (tip) {
        if (!tip.id) tip.id = `visual-tip-${CH || "page"}-${i + 1}`;
        if (!node.hasAttribute("aria-describedby")) node.setAttribute("aria-describedby", tip.id);
      }
    });
  }
  enhanceVisualSemantics();
  window.addEventListener("load", enhanceVisualSemantics, { once: true });

  /* ================= 键盘总控 ================= */
  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    const tag = (t && t.tagName || "").toLowerCase();

    if (e.key === "Escape") {
      if (blackOn) blackOff();
      else if (rosterModal && rosterModal.classList.contains("open")) hideModal(rosterModal);
      else if (overview && overview.classList.contains("open")) hideModal(overview);
      else if (boardOn) boardOff();
      else if (inkOn) inkOff();
      else if (staged) closeStage();
      else if (laserOn) laserOff();
      else if (spotOn) spotOff();
      else if (notesPanel && notesPanel.classList.contains("open")) notesPanel.classList.remove("open");
      else if (toolbox && toolbox.classList.contains("open")) toolbox.classList.remove("open");
      else if (helpBox && helpBox.classList.contains("open")) helpBox.classList.remove("open");
      return;
    }
    if (tag === "input" || tag === "select" || tag === "textarea" || (t && t.isContentEditable)) return;
    const k = e.key.toLowerCase();
    if (k === "t") { setTeach(!html.classList.contains("teach")); return; }
    if (!html.classList.contains("teach")) return;

    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); step(1); return; }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); step(-1); return; }
    if (k === "l") { toggleSpot(); return; }
    if (k === "b") { toggleBlack(); return; }
    if (k === "d") { if (staged) closeStage(); else zoomCurrentDemo(); return; }
    if (k === "p") { toggleInk(); return; }
    if (k === "w") { toggleBoard(); return; }
    if (k === "g") { toggleLaser(); return; }
    if (k === "r") { openRoster(); return; }
    if (k === "n") { toggleNotes(); return; }
    if (k === "o") { toggleOverview(); return; }
    if (k === "s") { startStopwatch(); return; }
    if (k === "z") { cycleFontSize(); return; }
    if (k === "?") { toggleHelp(); return; }
    if (k === "[") { if (inkOn) inkScale(-1); else if (boardOn) boardWidth = Math.max(2, boardWidth - 1); else spotScale(-40); return; }
    if (k === "]") { if (inkOn) inkScale(1); else if (boardOn) boardWidth = Math.min(18, boardWidth + 1); else spotScale(40); return; }
    if (k === "0") { stopTimer(); toast("计时已停止"); return; }
    if (/^[1-9]$/.test(e.key)) { startTimer(+e.key); return; }
  });
})();
