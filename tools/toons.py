#!/usr/bin/env python3
"""Мультяшні суперники (SVG) в одному стилі з однаковими емоціями.
Запуск: python3 tools/toons.py → shared/opponents/toon-<ім'я>.svg

Кожен персонаж = спільні частини (очі, брови, роти, рум'янець, пара, іскорки, лапи)
+ свій малюнок (голова, вуха, морда, тулуб). Настрій вмикається класом на панелі суперника
(shared/opponent.js): .mood-happy, .mood-angry, .thinking, .talking, .poked."""
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'shared', 'opponents')


def css(p, eye_y, mouth_y):
    """Анімації й настрої; p — префікс класів (стилі вбудованого SVG діють на всю сторінку)."""
    return f"""
.{p}-body{{transform-origin:200px 400px;animation:{p}Sway 5s ease-in-out infinite}}
@keyframes {p}Sway{{0%,100%{{transform:rotate(-1.5deg)}}50%{{transform:rotate(1.5deg)}}}}
.{p}-eyes{{transform-origin:200px {eye_y}px;animation:{p}Blink 4.4s infinite}}
@keyframes {p}Blink{{0%,91%,100%{{transform:scaleY(1)}}94%{{transform:scaleY(.08)}}}}
.{p}-pup{{animation:{p}Look 7.5s ease-in-out infinite;transition:transform .3s}}
@keyframes {p}Look{{0%,40%,100%{{transform:translate(0,0)}}48%,62%{{transform:translate(6px,-1px)}}70%,80%{{transform:translate(-6px,0)}}}}
.{p}-earl{{transform-origin:140px 110px;animation:{p}Ear 3.6s ease-in-out infinite}}
.{p}-earr{{transform-origin:260px 110px;animation:{p}Ear 3.6s ease-in-out infinite reverse}}
@keyframes {p}Ear{{0%,80%,100%{{transform:rotate(0)}}88%{{transform:rotate(-8deg)}}}}
.{p}-armr{{transform-origin:292px 344px;animation:{p}RestR 3.6s ease-in-out infinite}}
@keyframes {p}RestR{{0%,100%{{transform:rotate(0)}}50%{{transform:rotate(4deg)}}}}
.{p}-arml{{transform-origin:108px 344px;animation:{p}Rest 3.6s ease-in-out infinite}}
@keyframes {p}Rest{{0%,100%{{transform:rotate(0)}}50%{{transform:rotate(-4deg)}}}}
.{p}-happy,.{p}-angry,.{p}-bhappy,.{p}-bangry,.{p}-eyeshappy,.{p}-steam,.{p}-red,.{p}-talk,.{p}-spark{{opacity:0}}
.{p}-happy,.{p}-angry,.{p}-norm,.{p}-talk{{transition:opacity .2s}}
.mood-happy .{p}-norm,.mood-happy .{p}-bnorm,.mood-happy .{p}-eyes{{opacity:0}}
.mood-happy .{p}-happy,.mood-happy .{p}-bhappy,.mood-happy .{p}-eyeshappy,.mood-happy .{p}-spark{{opacity:1}}
.mood-happy .{p}-body{{animation:{p}Jump .55s ease-in-out infinite}}
@keyframes {p}Jump{{0%,100%{{transform:translateY(0)}}50%{{transform:translateY(-14px)}}}}
.mood-happy .{p}-blush{{opacity:.8}}
.mood-happy .{p}-armr{{animation:{p}Cheer .55s ease-in-out infinite}}
@keyframes {p}Cheer{{0%,100%{{transform:rotate(-150deg)}}50%{{transform:rotate(-172deg)}}}}
.mood-happy .{p}-arml{{animation:{p}CheerL .55s ease-in-out infinite}}
@keyframes {p}CheerL{{0%,100%{{transform:rotate(150deg)}}50%{{transform:rotate(172deg)}}}}
.{p}-spark{{animation:{p}Spark 1.2s ease-in-out infinite}}
@keyframes {p}Spark{{0%,100%{{transform:scale(.6)}}50%{{transform:scale(1.15)}}}}
.mood-angry .{p}-norm,.mood-angry .{p}-bnorm{{opacity:0}}
.mood-angry .{p}-angry,.mood-angry .{p}-bangry,.mood-angry .{p}-steam{{opacity:1}}
.mood-angry .{p}-red{{opacity:.35}}
.mood-angry .{p}-body{{animation:{p}Shake .18s linear infinite}}
@keyframes {p}Shake{{0%,100%{{transform:translateX(0)}}25%{{transform:translateX(-3px)}}75%{{transform:translateX(3px)}}}}
.mood-angry .{p}-pup{{animation:none;transform:translate(0,3px)}}
.mood-angry .{p}-earl{{animation:none;transform:rotate(-18deg)}}.mood-angry .{p}-earr{{animation:none;transform:rotate(18deg)}}
.mood-angry .{p}-armr{{animation:{p}Fist .3s ease-in-out infinite}}
@keyframes {p}Fist{{0%,100%{{transform:rotate(4deg)}}50%{{transform:rotate(-8deg)}}}}
.{p}-steam{{animation:{p}Steam 1.4s ease-out infinite}}
@keyframes {p}Steam{{0%{{transform:translateY(8px) scale(.6)}}100%{{transform:translateY(-28px) scale(1.3)}}}}
.thinking .{p}-pup{{animation:none;transform:translate(7px,-7px)}}
.thinking .{p}-armr{{animation:none;transform:rotate(100deg)}}
.talking:not(.mood-happy):not(.mood-angry) .{p}-norm{{opacity:0}}
.talking:not(.mood-happy):not(.mood-angry) .{p}-talk{{opacity:1}}
.{p}-talkin{{transform-origin:200px {mouth_y}px;animation:{p}Talk .32s ease-in-out infinite alternate}}
@keyframes {p}Talk{{from{{transform:scaleY(.35)}}to{{transform:scaleY(1)}}}}
.poked .{p}-body{{animation:{p}Poke .7s cubic-bezier(.3,1.8,.5,1)}}
@keyframes {p}Poke{{0%{{transform:scale(1,1)}}20%{{transform:scale(1.08,.9) translateY(10px)}}50%{{transform:scale(.95,1.08) translateY(-18px)}}100%{{transform:none}}}}
.poked .{p}-pup{{animation:none;transform:scale(.7);transform-box:fill-box;transform-origin:center}}
.poked .{p}-bnorm{{opacity:0}}.poked .{p}-bhappy{{opacity:1;transform:translateY(-8px)}}
.poked .{p}-norm{{opacity:0}}.poked .{p}-talk{{opacity:1}}.poked .{p}-talkin{{animation:none}}
.poked .{p}-armr{{animation:none;transform:rotate(-60deg)}}.poked .{p}-arml{{animation:none;transform:rotate(60deg)}}
.poked .{p}-earl{{animation:none;transform:rotate(12deg)}}.poked .{p}-earr{{animation:none;transform:rotate(-12deg)}}
"""


def face(p, ex, ey, erx, ery, pr, iris, brow, my, mw, mouth_col='#6b2f1f', blush_y=None, blush_dx=76, sclera='#fff'):
    """Очі (ex — відстань від центру), брови, роти, рум'янець, пара, іскорки."""
    l, r = 200 - ex, 200 + ex
    by = ey - ery - 14  # брови
    bl = blush_y or ey + ery + 16
    return f"""
  <ellipse class="{p}-blush" cx="{200 - blush_dx}" cy="{bl}" rx="20" ry="11" fill="#f08a7e" opacity=".45"/><ellipse class="{p}-blush" cx="{200 + blush_dx}" cy="{bl}" rx="20" ry="11" fill="#f08a7e" opacity=".45"/>
  <g stroke="{brow}" stroke-width="8" stroke-linecap="round" fill="none">
    <path class="{p}-bnorm" d="M{l - 24} {by + 2} Q{l} {by - 10} {l + 24} {by}"/><path class="{p}-bnorm" d="M{r - 24} {by} Q{r} {by - 10} {r + 24} {by + 2}"/>
    <path class="{p}-bhappy" d="M{l - 24} {by - 4} Q{l} {by - 22} {l + 24} {by - 8}"/><path class="{p}-bhappy" d="M{r - 24} {by - 8} Q{r} {by - 22} {r + 24} {by - 4}"/>
    <path class="{p}-bangry" d="M{l - 24} {by - 8} L{l + 24} {by + 12}"/><path class="{p}-bangry" d="M{r + 24} {by - 8} L{r - 24} {by + 12}"/>
  </g>
  <g class="{p}-eyes">
    <ellipse cx="{l}" cy="{ey}" rx="{erx}" ry="{ery}" fill="{sclera}"/><ellipse cx="{r}" cy="{ey}" rx="{erx}" ry="{ery}" fill="{sclera}"/>
    <g class="{p}-pup"><circle cx="{l + 3}" cy="{ey + 5}" r="{pr}" fill="{iris}"/><circle cx="{r + 3}" cy="{ey + 5}" r="{pr}" fill="{iris}"/>
      <circle cx="{l + 3}" cy="{ey + 5}" r="{pr * .55:.1f}" fill="#1c1410"/><circle cx="{r + 3}" cy="{ey + 5}" r="{pr * .55:.1f}" fill="#1c1410"/>
      <circle cx="{l + 8}" cy="{ey - 1}" r="{max(4, pr * .35):.1f}" fill="#fff"/><circle cx="{r + 8}" cy="{ey - 1}" r="{max(4, pr * .35):.1f}" fill="#fff"/></g>
  </g>
  <g class="{p}-eyeshappy" stroke="#2b1a10" stroke-width="8" stroke-linecap="round" fill="none"><path d="M{l - 20} {ey + 6} Q{l} {ey - 16} {l + 20} {ey + 6}"/><path d="M{r - 20} {ey + 6} Q{r} {ey - 16} {r + 20} {ey + 6}"/></g>
  <path class="{p}-norm" d="M{200 - mw} {my - 6} Q200 {my + 12} {200 + mw} {my - 6}" fill="none" stroke="{mouth_col}" stroke-width="6" stroke-linecap="round"/>
  <g class="{p}-talk"><g class="{p}-talkin"><ellipse cx="200" cy="{my}" rx="18" ry="14" fill="{mouth_col}"/><ellipse cx="200" cy="{my + 7}" rx="10" ry="5" fill="#e5645a"/></g></g>
  <g class="{p}-happy"><path d="M{200 - mw - 8} {my - 12} Q200 {my + 34} {200 + mw + 8} {my - 12} Z" fill="{mouth_col}"/><path d="M{200 - mw} {my - 10} L{200 + mw} {my - 10} L{200 + mw - 4} {my - 3} L{200 - mw + 4} {my - 3} Z" fill="#fff"/><ellipse cx="200" cy="{my + 14}" rx="14" ry="6" fill="#e5645a"/></g>
  <g class="{p}-angry"><path d="M{200 - mw} {my + 10} Q200 {my - 14} {200 + mw} {my + 10} Q200 {my} {200 - mw} {my + 10} Z" fill="{mouth_col}"/><path d="M{200 - mw + 10} {my + 4} L{200 + mw - 10} {my + 4}" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>
  <g class="{p}-steam" fill="#fff" opacity=".85"><circle cx="96" cy="104" r="14"/><circle cx="82" cy="86" r="10"/><circle cx="304" cy="104" r="14"/><circle cx="318" cy="86" r="10"/></g>
  <g class="{p}-spark" fill="#ffd23f"><path d="M64 120 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6z"/><path d="M332 120 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5z"/></g>
"""


def arms(p, fur, paw, pad=None):
    """Дві лапки: ліва лежить на грудях, права махає (радіє — обидві, злиться — кулачок, думає — до підборіддя)."""
    pad = pad or paw
    return f"""
  <g class="{p}-arml">
    <path d="M108 344 C94 362 100 384 124 386" fill="none" stroke="{fur}" stroke-width="30" stroke-linecap="round"/>
    <ellipse cx="128" cy="384" rx="18" ry="15" fill="{paw}"/>
    <path d="M118 378 q5 -3 10 0 M121 386 q5 -3 10 0" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  <g class="{p}-armr">
    <path d="M292 344 C306 362 300 384 276 386" fill="none" stroke="{fur}" stroke-width="30" stroke-linecap="round"/>
    <ellipse cx="272" cy="384" rx="18" ry="15" fill="{paw}"/>
    <path d="M282 378 q-5 -3 -10 0 M279 386 q-5 -3 -10 0" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2.5" stroke-linecap="round"/>
  </g>
"""


def svg(p, title, art_back, art_head, fc, art_front='', extra_css=''):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="{p}">
<!-- «{title}» — мультяшний суперник (tools/toons.py). Настрій — класом на панелі суперника:
     .mood-happy, .mood-angry, .thinking, .talking, .poked. Без класів — спокійний: кліпає, озирається, махає лапкою. -->
<style>{fc['css']}{extra_css}</style>
<g class="{p}-body">{art_back}{art_head}{fc['face']}{art_front}{fc['arms']}</g>
</svg>
"""


def build(p, title, back, head, front='', extra_css='', eye=(40, 176, 24, 27, 13), iris='#3b2416', brow='#4a2c14',
          mouth=(262, 26), mouth_col='#6b2f1f', fur='#8f5226', paw='#e9b98f', pad=None, blush=None, blush_dx=76, sclera='#fff'):
    ex, ey, erx, ery, pr = eye
    fc = {'css': css(p, ey, mouth[0]),
          'face': face(p, ex, ey, erx, ery, pr, iris, brow, mouth[0], mouth[1], mouth_col, blush, blush_dx, sclera),
          'arms': arms(p, fur, paw, pad)}
    with open(os.path.join(OUT, f'toon-{title}.svg'), 'w', encoding='utf8') as f:
        f.write(svg(p, title, back, head, fc, front, extra_css))


# ---------- Капібара: велика спокійна голова-«цеглинка», маленькі вушка, широкий ніс ----------
build('cp', 'capybara',
      back="""
  <path d="M84 400 C88 344 132 312 200 310 C268 312 312 344 316 400 Z" fill="#9b6a42"/>
  <path d="M146 400 C150 360 172 338 200 336 C228 338 250 360 254 400 Z" fill="#c69a72"/>""",
      head="""
  <g class="cp-earl"><ellipse cx="116" cy="96" rx="22" ry="18" fill="#7d5233"/><ellipse cx="116" cy="98" rx="11" ry="9" fill="#5a3a22"/></g>
  <g class="cp-earr"><ellipse cx="284" cy="96" rx="22" ry="18" fill="#7d5233"/><ellipse cx="284" cy="98" rx="11" ry="9" fill="#5a3a22"/></g>
  <path d="M96 150 C96 96 140 76 200 76 C260 76 304 96 304 150 L306 236 C306 296 262 318 200 318 C138 318 94 296 94 236 Z" fill="#a8744a"/>
  <path d="M120 96 C150 84 250 84 280 96" fill="none" stroke="#c08a5c" stroke-width="10" stroke-linecap="round" opacity=".6"/>
  <ellipse class="cp-red" cx="200" cy="200" rx="104" ry="112" fill="#ff3b30"/>
  <path d="M122 214 C122 188 156 178 200 178 C244 178 278 188 278 214 L278 252 C278 292 244 310 200 310 C156 310 122 292 122 252 Z" fill="#b98a60"/>
  <ellipse cx="176" cy="216" rx="11" ry="8" fill="#3a2414"/><ellipse cx="224" cy="216" rx="11" ry="8" fill="#3a2414"/>""",
      eye=(56, 146, 20, 22, 11), iris='#3a2414', brow='#5a3a22', mouth=(268, 22), mouth_col='#4a2a14', fur='#9b6a42', paw='#7d5233', pad='#5a3a22', blush=176, blush_dx=86)

# ---------- Кіт Смадж: білий пухнастий, трохи бурмотливий ----------
build('ct', 'smudge',
      back="""
  <path d="M84 400 C88 344 132 312 200 310 C268 312 312 344 316 400 Z" fill="#f4f1ec"/>
  <path d="M84 400 C88 344 132 312 200 310" fill="none" stroke="#dcd6cf" stroke-width="4"/>""",
      head="""
  <g class="ct-earl"><path d="M104 132 L112 44 L176 96 Z" fill="#f4f1ec" stroke="#dcd6cf" stroke-width="3" stroke-linejoin="round"/><path d="M118 116 L122 66 L160 98 Z" fill="#f6b8c4"/></g>
  <g class="ct-earr"><path d="M296 132 L288 44 L224 96 Z" fill="#f4f1ec" stroke="#dcd6cf" stroke-width="3" stroke-linejoin="round"/><path d="M282 116 L278 66 L240 98 Z" fill="#f6b8c4"/></g>
  <path d="M92 190 C92 118 142 84 200 84 C258 84 308 118 308 190 C308 262 262 306 200 306 C138 306 92 262 92 190 Z" fill="#fbf9f6" stroke="#e2dcd4" stroke-width="3"/>
  <path d="M96 214 l-18 -4 M96 226 l-20 4 M304 214 l18 -4 M304 226 l20 4" stroke="#e2dcd4" stroke-width="6" stroke-linecap="round"/>
  <ellipse class="ct-red" cx="200" cy="196" rx="104" ry="108" fill="#ff3b30"/>
  <ellipse cx="200" cy="244" rx="46" ry="30" fill="#fff"/>
  <path d="M190 226 L210 226 L200 238 Z" fill="#f28ea3"/>
  <g stroke="#cfc6bc" stroke-width="3" stroke-linecap="round"><path d="M150 240 L96 232 M150 250 L98 256 M250 240 L304 232 M250 250 L302 256"/></g>""",
      eye=(46, 184, 23, 25, 14), iris='#8bbf3a', brow='#bdb3a8', mouth=(262, 22), mouth_col='#b35a6a',
      fur='#f4f1ec', paw='#fbf9f6', pad='#f6b8c4', blush=222, blush_dx=80)

# ---------- Собака: шиба-іну (як «доге»), окуляри піднято на лоб ----------
build('dg', 'doge',
      back="""
  <path d="M84 400 C88 344 132 312 200 310 C268 312 312 344 316 400 Z" fill="#e39a4c"/>
  <path d="M140 400 C144 356 170 334 200 332 C230 334 256 356 260 400 Z" fill="#fbecd6"/>""",
      head="""
  <g class="dg-earl"><path d="M100 140 L110 40 L178 92 Z" fill="#e39a4c"/><path d="M116 124 L122 66 L160 96 Z" fill="#fbecd6"/></g>
  <g class="dg-earr"><path d="M300 140 L290 40 L222 92 Z" fill="#e39a4c"/><path d="M284 124 L278 66 L240 96 Z" fill="#fbecd6"/></g>
  <path d="M92 188 C92 120 140 86 200 86 C260 86 308 120 308 188 C308 262 264 304 200 304 C136 304 92 262 92 188 Z" fill="#eaa458"/>
  <ellipse class="dg-red" cx="200" cy="196" rx="104" ry="106" fill="#ff3b30"/>
  <path d="M112 206 C120 168 160 160 200 176 C240 160 280 168 288 206 C292 268 252 304 200 304 C148 304 108 268 112 206 Z" fill="#fbecd6"/>
  <ellipse cx="148" cy="136" rx="10" ry="6" fill="#fbecd6"/><ellipse cx="252" cy="136" rx="10" ry="6" fill="#fbecd6"/>
  <ellipse cx="200" cy="232" rx="20" ry="14" fill="#2b1a10"/><ellipse cx="194" cy="228" rx="6" ry="3" fill="#fff" opacity=".6"/>
  <path d="M200 246 L200 256" stroke="#2b1a10" stroke-width="5" stroke-linecap="round"/>
  <!-- окуляри «deal with it» на лобі -->
  <g transform="translate(0 -2)"><rect x="126" y="98" width="62" height="22" rx="4" fill="#111"/><rect x="212" y="98" width="62" height="22" rx="4" fill="#111"/><rect x="186" y="102" width="28" height="7" fill="#111"/>
  <rect x="134" y="102" width="10" height="6" fill="#fff" opacity=".8"/><rect x="220" y="102" width="10" height="6" fill="#fff" opacity=".8"/></g>""",
      eye=(46, 174, 21, 23, 12), iris='#4a2a12', brow='#9c5a22', mouth=(270, 24), fur='#e39a4c', paw='#fbecd6', pad='#c98f55', blush=214, blush_dx=74)

# ---------- Тун-тун-тун-сахур: дерев'яний чоловічок-колода ----------
build('tt', 'tung',
      back="""
  <path d="M110 400 L116 320 C150 306 250 306 284 320 L290 400 Z" fill="#b07a45"/>
  <path d="M140 330 v70 M200 322 v78 M260 330 v70" stroke="#8a5a2e" stroke-width="4" opacity=".5"/>""",
      head="""
  <path d="M112 90 C112 70 150 60 200 60 C250 60 288 70 288 90 L292 300 C292 320 250 330 200 330 C150 330 108 320 108 300 Z" fill="#c68d52"/>
  <ellipse cx="200" cy="72" rx="88" ry="16" fill="#e0ad72"/><ellipse cx="200" cy="72" rx="60" ry="9" fill="none" stroke="#b07a45" stroke-width="3"/><ellipse cx="200" cy="72" rx="32" ry="5" fill="none" stroke="#b07a45" stroke-width="3"/>
  <path d="M126 110 C122 170 128 240 124 300 M276 110 C280 170 274 240 278 300" stroke="#a36f3c" stroke-width="4" fill="none" opacity=".6"/>
  <ellipse class="tt-red" cx="200" cy="200" rx="92" ry="126" fill="#ff3b30"/>
  <path d="M190 206 C186 222 190 232 200 234 C210 232 214 222 210 206 Z" fill="#a36f3c"/>""",
      eye=(44, 164, 24, 28, 13), iris='#2b1a10', brow='#3d2614', mouth=(272, 26), mouth_col='#4a2a14',
      fur='#c68d52', paw='#d8a765', pad='#b07a45', blush=212, blush_dx=70)

# ---------- Сова: велика кругла голова, пір'яні вушка, великі очі в «окулярах» з пір'я, дзьоб ----------
build('ow', 'owl',
      back="""
  <path d="M84 400 C88 344 132 312 200 310 C268 312 312 344 316 400 Z" fill="#8a6a4f"/>
  <path d="M136 400 C140 356 166 330 200 328 C234 330 260 356 264 400 Z" fill="#e9dcc6"/>
  <g fill="none" stroke="#c9b597" stroke-width="4" stroke-linecap="round"><path d="M166 356 q8 7 16 0 M190 356 q8 7 16 0 M214 356 q8 7 16 0 M178 378 q8 7 16 0 M202 378 q8 7 16 0"/></g>""",
      head="""
  <g class="ow-earl"><path d="M104 128 L96 58 L150 100 Z" fill="#6f533c"/></g>
  <g class="ow-earr"><path d="M296 128 L304 58 L250 100 Z" fill="#6f533c"/></g>
  <ellipse cx="200" cy="190" rx="112" ry="116" fill="#8a6a4f"/>
  <ellipse class="ow-red" cx="200" cy="196" rx="108" ry="110" fill="#ff3b30"/>
  <circle cx="152" cy="172" r="50" fill="#e9dcc6"/><circle cx="248" cy="172" r="50" fill="#e9dcc6"/>
  <path d="M200 92 L186 128 L214 128 Z" fill="#6f533c"/>
  <path d="M186 212 L214 212 L200 240 Z" fill="#f2a93b" stroke="#c9801c" stroke-width="3" stroke-linejoin="round"/>""",
      eye=(48, 172, 30, 32, 18), iris='#f2a93b', brow='#4a3524', mouth=(262, 18), mouth_col='#6b3a1a',
      fur='#8a6a4f', paw='#6f533c', pad='#e9dcc6', blush=214, blush_dx=92)

# ---------- Хом'ячок у ковбойському капелюсі: руда кругла мордочка, пухкі білі щічки ----------
build('hm', 'hamster',
      back="""
  <path d="M84 400 C88 344 132 312 200 310 C268 312 312 344 316 400 Z" fill="#e0a25e"/>
  <path d="M140 400 C144 356 170 332 200 330 C230 332 256 356 260 400 Z" fill="#fff4e4"/>""",
      head="""
  <g class="hm-earl"><circle cx="112" cy="116" r="30" fill="#d38c45"/><circle cx="112" cy="118" r="17" fill="#f4b3a8"/></g>
  <g class="hm-earr"><circle cx="288" cy="116" r="30" fill="#d38c45"/><circle cx="288" cy="118" r="17" fill="#f4b3a8"/></g>
  <ellipse cx="200" cy="200" rx="116" ry="106" fill="#e8a862"/>
  <ellipse class="hm-red" cx="200" cy="204" rx="112" ry="102" fill="#ff3b30"/>
  <ellipse cx="136" cy="238" rx="54" ry="44" fill="#fff4e4"/><ellipse cx="264" cy="238" rx="54" ry="44" fill="#fff4e4"/>
  <ellipse cx="200" cy="246" rx="44" ry="36" fill="#fff4e4"/>
  <ellipse cx="200" cy="228" rx="10" ry="7" fill="#e5737a"/>
  <path d="M200 236 v8" stroke="#8a4a3a" stroke-width="3" stroke-linecap="round"/>
  <!-- ковбойський капелюх -->
  <g>
    <ellipse cx="200" cy="112" rx="132" ry="24" fill="#6b3f1f"/>
    <path d="M136 112 C136 58 158 36 184 46 C192 50 208 50 216 46 C242 36 264 58 264 112 Z" fill="#7d4a24"/>
    <path d="M140 96 C170 104 230 104 260 96 L262 110 C230 118 170 118 138 110 Z" fill="#3d2412"/>
    <path d="M200 50 v44" stroke="#5e3619" stroke-width="4" stroke-linecap="round" opacity=".6"/>
    <path d="M78 108 C92 128 124 132 150 124 M322 108 C308 128 276 132 250 124" fill="none" stroke="#5e3619" stroke-width="5" stroke-linecap="round"/>
  </g>""",
      eye=(46, 178, 18, 20, 11), iris='#2b1a10', brow='#8a4a22', mouth=(266, 20), mouth_col='#8a3a3a',
      fur='#e0a25e', paw='#f4c7a8', pad='#e5979a', blush=222, blush_dx=94)

print('ok')
