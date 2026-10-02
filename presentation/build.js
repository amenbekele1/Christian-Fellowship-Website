'use strict';
// ============================================================
// WETCF Launch Presentation — v2
// Launching: public website + members portal + library service
// Bilingual EN / Amharic, brand palette, logo, QR code
// ============================================================
const pptxgen = require('pptxgenjs');
const React   = require('react');
const { createElement: h } = React;
const RDS     = require('react-dom/server');
const sharp   = require('sharp');
const fa      = require('react-icons/fa');
const fs      = require('fs');

const ASSETS = require('path').join(__dirname, 'assets');

// ── Brand palette ────────────────────────────────────────────
const C = {
  dark:   '1C0F07',
  dark2:  '2B1508',
  gold:   'C9A84C',
  goldLt: 'EDD090',
  cream:  'FAF7F0',
  white:  'FFFFFF',
  muted:  '7A5535',
  // Secondary text on DARK backgrounds. 7A5535 only reaches ~3.6:1 against
  // the dark brown, which washes out on a projector; this clears 6:1.
  onDark: 'C4A882',
  subtle: '3D2312',
  page:   'FAF7F0',
};

// ── Helpers ──────────────────────────────────────────────────
const b64 = (file) =>
  'image/png;base64,' + fs.readFileSync(`${ASSETS}/${file}`).toString('base64');

async function iconPNG(IconComp, hexColor, size = 300) {
  const svg = RDS.renderToStaticMarkup(h(IconComp, { color: '#' + hexColor, size }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

/** Gold circle with a dark icon — the motif carried across every slide. */
function iconCircle(s, img, x, y, d = 0.7) {
  const pad = d * 0.17;
  s.addShape('ellipse', {
    x, y, w: d, h: d,
    fill: { color: C.gold }, line: { color: C.gold, width: 0 },
  });
  s.addImage({ data: img, x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
}

function rule(s, x, y, w, color = C.gold) {
  s.addShape('rect', { x, y, w, h: 0.035, fill: { color }, line: { color, width: 0 } });
}

function darkCard(s, x, y, w, hh) {
  s.addShape('roundRect', {
    x, y, w, h: hh,
    fill: { color: C.dark2 }, line: { color: C.gold, width: 1 }, rectRadius: 0.08,
  });
}

function lightCard(s, x, y, w, hh) {
  s.addShape('roundRect', {
    x, y, w, h: hh,
    fill: { color: C.white }, line: { color: C.gold, width: 1.25 }, rectRadius: 0.1,
    shadow: { type: 'outer', color: 'C0B4A4', blur: 8, offset: 3, angle: 45, opacity: 0.35 },
  });
}

/** Standard slide heading: English title + Amharic subtitle. */
function heading(s, en, am, opts = {}) {
  const onDark = opts.onDark ?? false;
  const align  = opts.align ?? 'left';
  const x = opts.x ?? 0.55;
  const w = opts.w ?? 8.9;
  s.addText(en, {
    x, y: opts.y ?? 0.3, w, h: 0.62,
    fontSize: opts.size ?? 32, bold: true,
    color: onDark ? C.gold : C.dark,
    fontFace: 'Cambria', align, isTextBox: true, margin: 0,
  });
  if (am) {
    s.addText(am, {
      x, y: (opts.y ?? 0.3) + 0.58, w, h: 0.38,
      fontSize: 17, color: onDark ? C.cream : C.muted,
      align, isTextBox: true, margin: 0,
    });
  }
}

// ─────────────────────────────────────────────────────────────
async function main() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 10" × 5.625"
  pres.author = 'Warsaw Ethiopian Christian Fellowship';
  pres.title  = 'WETCF Launch';

  const LOGO_DARK  = b64('logo-dark.png');
  const LOGO_LIGHT = b64('logo-transparent.png');
  const LOGO_ONLT  = b64('logo-onlight.png');
  const QR_REG     = b64('qr-register.png');

  console.log('Rendering icons…');
  const ic = {};
  for (const [k, Comp] of Object.entries({
    globe: fa.FaGlobeAfrica, users: fa.FaUsers, book: fa.FaBookOpen,
    bell: fa.FaBell, chat: fa.FaComments, calendar: fa.FaCalendarAlt,
    bullhorn: fa.FaBullhorn, video: fa.FaVideo, tasks: fa.FaClipboardList,
    shield: fa.FaShieldAlt, mobile: fa.FaMobileAlt, lock: fa.FaLock,
    search: fa.FaSearch, check: fa.FaCheckCircle, arrow: fa.FaArrowRight,
    userPlus: fa.FaUserPlus, music: fa.FaMusic, praying: fa.FaPrayingHands,
    heart: fa.FaHeart, share: fa.FaShareAlt, home: fa.FaHome,
    handshake: fa.FaHandshake, qrcode: fa.FaQrcode, youtube: fa.FaYoutube,
    instagram: fa.FaInstagram, mapPin: fa.FaMapMarkerAlt, clock: fa.FaClock,
  })) {
    if (!Comp) { console.warn('missing icon', k); continue; }
    ic[k] = await iconPNG(Comp, C.dark);
  }
  console.log('Icons ready.');

  // ============================================================
  // 1 — TITLE
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };

    s.addImage({ data: LOGO_LIGHT, x: 4.35, y: 0.42, w: 1.3, h: 1.3 });

    s.addText('Welcome to wetcf.com', {
      x: 0.5, y: 1.85, w: 9, h: 0.8,
      fontSize: 40, bold: true, color: C.gold, align: 'center',
      fontFace: 'Cambria', isTextBox: true, margin: 0,
    });

    s.addText('እንኳን ወደ wetcf.com በደህና መጡ', {
      x: 0.5, y: 2.65, w: 9, h: 0.5,
      fontSize: 20, color: C.cream, align: 'center',
      isTextBox: true, margin: 0,
    });

    rule(s, 3.2, 3.25, 3.6);

    s.addText('Our website, our member portal, and our library — launching today', {
      x: 0.5, y: 3.42, w: 9, h: 0.38,
      fontSize: 14, color: C.cream, italic: true, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });
    s.addText('ድረ-ገጻችን፣ የአባላት ፖርታል እና ቤተ-መጻሕፍት — ዛሬ ይጀምራሉ', {
      x: 0.5, y: 3.82, w: 9, h: 0.38,
      fontSize: 13, color: C.cream, italic: true, align: 'center',
      isTextBox: true, margin: 0,
    });

    s.addText('Warsaw Ethiopian Christian Fellowship', {
      x: 0, y: 4.92, w: 10, h: 0.3,
      fontSize: 11, color: C.onDark, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0, charSpacing: 1,
    });

    s.addNotes(
      'Welcome everyone. Today is a big day for our fellowship — we are launching three things at once: '
      + 'our public website, the members portal, and our library service. Let me walk you through each one.'
    );
  }

  // ============================================================
  // 2 — THREE THINGS WE LAUNCH TODAY
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    heading(s, 'Three Things, Launching Today', 'ዛሬ የሚጀምሩ ሦስት ነገሮች');

    const items = [
      {
        icon: ic.globe, n: '1',
        en: 'Our Website', am: 'ድረ-ገጻችን',
        body: 'A public home at wetcf.com — who we are, what we believe, when and where we meet.',
      },
      {
        icon: ic.users, n: '2',
        en: 'Members Portal', am: 'የአባላት ፖርታል',
        body: 'A private space for members — announcements, groups, serving teams and meetings.',
      },
      {
        icon: ic.book, n: '3',
        en: 'Fellowship Library', am: 'ቤተ-መጻሕፍት',
        body: 'Our book collection, open for borrowing. Reserve online, collect at fellowship.',
      },
    ];

    const cW = 2.8, cH = 3.15, cY = 1.62;
    items.forEach((it, i) => {
      const cx = 0.55 + i * (cW + 0.225);
      lightCard(s, cx, cY, cW, cH);
      iconCircle(s, it.icon, cx + cW / 2 - 0.35, cY + 0.25, 0.7);
      s.addText(it.en, {
        x: cx + 0.1, y: cY + 1.08, w: cW - 0.2, h: 0.36,
        fontSize: 16, bold: true, color: C.dark, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(it.am, {
        x: cx + 0.1, y: cY + 1.43, w: cW - 0.2, h: 0.32,
        fontSize: 13, color: C.muted, align: 'center', isTextBox: true, margin: 0,
      });
      s.addText(it.body, {
        x: cx + 0.15, y: cY + 1.85, w: cW - 0.3, h: 1.3,
        fontSize: 11.5, color: C.subtle, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addNotes('Three launches in one. Say a sentence about each, then tell them we will look at each in turn.');
  }

  // ============================================================
  // 3 — THE PUBLIC WEBSITE
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };
    heading(s, 'Our Public Website', 'ይፋዊ ድረ-ገጻችን', { onDark: true });

    s.addText('wetcf.com  —  anyone can visit, no account needed', {
      x: 0.55, y: 1.32, w: 8.9, h: 0.32,
      fontSize: 13, color: C.goldLt, italic: true,
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    const pages = [
      { icon: ic.home,     en: 'Home & About',   am: 'ስለ እኛ',     d: 'Who we are and what we believe' },
      { icon: ic.calendar, en: 'Programs & Events', am: 'ዝግጅቶች', d: 'When we gather, and what is coming' },
      { icon: ic.mapPin,   en: 'Visit Us',       am: 'ይጎብኙን',     d: 'Address, bus routes, and a contact form' },
      { icon: ic.share,    en: 'Follow Us',      am: 'ይከታተሉን',   d: 'YouTube and Instagram, linked in the footer' },
    ];

    const w = 4.3, hh = 1.42;
    pages.forEach((p, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.55 + col * (w + 0.3);
      const y = 1.78 + row * (hh + 0.22);
      darkCard(s, x, y, w, hh);
      iconCircle(s, p.icon, x + 0.26, y + 0.3, 0.62);
      s.addText(p.en, {
        x: x + 1.02, y: y + 0.24, w: w - 1.2, h: 0.32,
        fontSize: 14, bold: true, color: C.gold,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(p.am, {
        x: x + 1.02, y: y + 0.55, w: w - 1.2, h: 0.28,
        fontSize: 11, color: C.cream, isTextBox: true, margin: 0,
      });
      s.addText(p.d, {
        x: x + 1.02, y: y + 0.84, w: w - 1.2, h: 0.4,
        fontSize: 10.5, color: C.goldLt,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addNotes(
      'This is the front door. Anyone can visit without an account — a friend, a family member, '
      + 'someone new to Warsaw looking for a church. Share wetcf.com freely.'
    );
  }

  // ============================================================
  // 4 — MEMBERS PORTAL: THE DASHBOARD
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    heading(s, 'Inside the Members Portal', 'በአባላት ፖርታል ውስጥ');

    const features = [
      { icon: ic.bullhorn, en: 'Announcements', am: 'ማስታወቂያዎች' },
      { icon: ic.calendar, en: 'Events',        am: 'ዝግጅቶች' },
      { icon: ic.chat,     en: 'BUS Groups',    am: 'BUS ቡድኖች' },
      { icon: ic.handshake,en: 'Serving Teams', am: 'የአገልግሎት ቡድኖች' },
      { icon: ic.book,     en: 'Library',       am: 'ቤተ-መጻሕፍት' },
      { icon: ic.bell,     en: 'Notifications', am: 'ማሳወቂያዎች' },
    ];

    const fW = 2.72, fH = 1.52, gx = 0.265, gy = 0.2;
    features.forEach((f, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 0.55 + col * (fW + gx);
      const y = 1.5 + row * (fH + gy);
      lightCard(s, x, y, fW, fH);
      iconCircle(s, f.icon, x + fW / 2 - 0.29, y + 0.17, 0.58);
      s.addText(f.en, {
        x: x + 0.1, y: y + 0.84, w: fW - 0.2, h: 0.32,
        fontSize: 13.5, bold: true, color: C.dark, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(f.am, {
        x: x + 0.1, y: y + 1.14, w: fW - 0.2, h: 0.28,
        fontSize: 10.5, color: C.muted, align: 'center', isTextBox: true, margin: 0,
      });
    });

    s.addNotes('Six things waiting for every member once they sign in. We will look at the most important ones now.');
  }

  // ============================================================
  // 5 — ANNOUNCEMENTS & EVENTS
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    heading(s, 'Stay in the Loop', 'ዜናዎችን ይከታተሉ');

    const cols = [
      {
        icon: ic.bullhorn, en: 'Announcements', am: 'ማስታወቂያዎች',
        points: [
          'Posted by leaders, seen by everyone',
          'Prayer requests and praise reports',
          'Arrives on your phone right away',
        ],
      },
      {
        icon: ic.calendar, en: 'Events', am: 'ዝግጅቶች',
        points: [
          'Every event has its own page',
          'Photos, video and the full details',
          'A reminder the day before',
        ],
      },
    ];

    cols.forEach((c, i) => {
      const x = 0.55 + i * 4.6;
      const w = 4.3, hh = 3.35, y = 1.5;
      s.addShape('roundRect', {
        x, y, w, h: hh,
        fill: { color: C.dark }, line: { color: C.gold, width: 1 }, rectRadius: 0.1,
      });
      iconCircle(s, c.icon, x + w / 2 - 0.33, y + 0.26, 0.66);
      s.addText(c.en, {
        x: x + 0.1, y: y + 1.02, w: w - 0.2, h: 0.36,
        fontSize: 16, bold: true, color: C.gold, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(c.am, {
        x: x + 0.1, y: y + 1.37, w: w - 0.2, h: 0.3,
        fontSize: 12, color: C.cream, align: 'center', isTextBox: true, margin: 0,
      });
      c.points.forEach((p, j) => {
        s.addText('·  ' + p, {
          x: x + 0.3, y: y + 1.82 + j * 0.42, w: w - 0.55, h: 0.36,
          fontSize: 11.5, color: C.cream,
          fontFace: 'Calibri', isTextBox: true, margin: 0,
        });
      });
    });

    s.addNotes('Leaders post once and it reaches everyone instantly. Events now have full pages with photos and video.');
  }

  // ============================================================
  // 6 — BUS GROUPS
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };
    heading(s, 'BUS Groups', 'BUS ቡድኖች', { onDark: true, align: 'center', x: 0.5, w: 9 });

    const groups = [
      { icon: ic.chat,  en: 'Group Chat',     am: 'የቡድን ውይይት', d: 'A private room for your group — share, ask, encourage' },
      { icon: ic.video, en: 'Video Meetings', am: 'ቪዲዮ ስብሰባ',  d: 'One tap to meet when you cannot be in the same room' },
      { icon: ic.tasks, en: 'Shared Tasks',   am: 'የጋራ ተግባሮች', d: 'Agree who does what, and see it through together' },
    ];

    const cW = 2.8, cH = 3.0, cY = 1.78;
    groups.forEach((g, i) => {
      const x = 0.55 + i * (cW + 0.225);
      darkCard(s, x, cY, cW, cH);
      iconCircle(s, g.icon, x + cW / 2 - 0.33, cY + 0.26, 0.66);
      s.addText(g.en, {
        x: x + 0.1, y: cY + 1.04, w: cW - 0.2, h: 0.34,
        fontSize: 15, bold: true, color: C.gold, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(g.am, {
        x: x + 0.1, y: cY + 1.38, w: cW - 0.2, h: 0.3,
        fontSize: 11.5, color: C.cream, align: 'center', isTextBox: true, margin: 0,
      });
      s.addText(g.d, {
        x: x + 0.15, y: cY + 1.8, w: cW - 0.3, h: 1.2,
        fontSize: 11, color: C.goldLt, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addNotes('Every member belongs to a BUS group. Each one now has its own chat, video room and task list.');
  }

  // ============================================================
  // 7 — SERVING TEAMS  (new)
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    heading(s, 'Serving Teams', 'የአገልግሎት ቡድኖች');

    s.addText('Serving together is easier when the whole team is in one place.', {
      x: 0.55, y: 1.3, w: 8.9, h: 0.32,
      fontSize: 13, color: C.subtle, italic: true,
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    const teams = [
      { icon: ic.music,     en: 'Worship',        am: 'አምልኮ' },
      { icon: ic.praying,   en: 'Prayer',         am: 'ጸሎት' },
      { icon: ic.bullhorn,  en: 'Evangelism',     am: 'ወንጌል ስርጭት' },
      { icon: ic.heart,     en: 'Social Affairs', am: 'ማህበራዊ ጉዳይ' },
      { icon: ic.share,     en: 'Social Media',   am: 'ሶሻል ሚዲያ' },
      { icon: ic.book,      en: 'Library',        am: 'ቤተ-መጻሕፍት' },
    ];

    const tW = 1.42, tY = 1.78;
    teams.forEach((t, i) => {
      const x = 0.55 + i * (tW + 0.08);
      iconCircle(s, t.icon, x + tW / 2 - 0.31, tY, 0.62);
      s.addText(t.en, {
        x: x - 0.05, y: tY + 0.72, w: tW + 0.1, h: 0.3,
        fontSize: 11, bold: true, color: C.dark, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(t.am, {
        x: x - 0.05, y: tY + 1.0, w: tW + 0.1, h: 0.28,
        fontSize: 9.5, color: C.muted, align: 'center', isTextBox: true, margin: 0,
      });
    });

    // What each team gets
    const perks = [
      { icon: ic.chat,  en: 'Its own chat',   d: 'Talk to your team without crowding the main group' },
      { icon: ic.video, en: 'Video meetings', d: 'Practise or plan without everyone travelling' },
      { icon: ic.check, en: 'Shared files',   d: 'Song lists, rotas and plans in one place' },
    ];
    const pY = 3.42;
    perks.forEach((p, i) => {
      const x = 0.55 + i * 3.0;
      lightCard(s, x, pY, 2.8, 1.5);
      iconCircle(s, p.icon, x + 0.22, pY + 0.24, 0.5);
      s.addText(p.en, {
        x: x + 0.82, y: pY + 0.26, w: 1.85, h: 0.3,
        fontSize: 12, bold: true, color: C.dark,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(p.d, {
        x: x + 0.18, y: pY + 0.72, w: 2.45, h: 0.68,
        fontSize: 10, color: C.subtle,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addNotes(
      'If you serve on any of these teams, the portal now gives your team its own space. '
      + 'Speak to a leader if you would like to join one.'
    );
  }

  // ============================================================
  // 8 — LIBRARY (the third launch — give it room)
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };

    s.addText('Our Library Opens Today', {
      x: 0.55, y: 0.42, w: 8.9, h: 0.6,
      fontSize: 32, bold: true, color: C.gold,
      fontFace: 'Cambria', isTextBox: true, margin: 0,
    });
    s.addText('ቤተ-መጻሕፍታችን ዛሬ ይከፈታል', {
      x: 0.55, y: 1.0, w: 8.9, h: 0.38,
      fontSize: 17, color: C.cream, isTextBox: true, margin: 0,
    });

    s.addText(
      'Christian books to read, borrow and return — free for every member of the fellowship.',
      {
        x: 0.55, y: 1.46, w: 8.9, h: 0.32,
        fontSize: 13, color: C.goldLt, italic: true,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      }
    );

    const steps = [
      { icon: ic.search,   n: '1', en: 'Browse',  am: 'ያስሱ',  d: 'See every title and what is on the shelf' },
      { icon: ic.book,     n: '2', en: 'Reserve', am: 'ያስይዙ', d: 'Tap to reserve — we hold it for you' },
      { icon: ic.check,    n: '3', en: 'Collect', am: 'ይውሰዱ', d: 'Pick it up at the next fellowship' },
      { icon: ic.arrow,    n: '4', en: 'Return',  am: 'ይመልሱ', d: 'We remind you before it is due' },
    ];

    const sW = 2.1, sY = 2.0, gap = 0.18;
    steps.forEach((st, i) => {
      const x = 0.55 + i * (sW + gap);
      darkCard(s, x, sY, sW, 2.5);
      iconCircle(s, st.icon, x + sW / 2 - 0.3, sY + 0.22, 0.6);
      s.addText(`${st.n}. ${st.en}`, {
        x: x + 0.08, y: sY + 0.92, w: sW - 0.16, h: 0.32,
        fontSize: 13.5, bold: true, color: C.gold, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(st.am, {
        x: x + 0.08, y: sY + 1.24, w: sW - 0.16, h: 0.28,
        fontSize: 11, color: C.cream, align: 'center', isTextBox: true, margin: 0,
      });
      s.addText(st.d, {
        x: x + 0.12, y: sY + 1.56, w: sW - 0.24, h: 0.8,
        fontSize: 10, color: C.goldLt, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addText('Books are free to borrow. Please return them on time so others can read them too.', {
      x: 0.55, y: 4.72, w: 8.9, h: 0.32,
      fontSize: 11, color: C.cream, italic: true, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    s.addNotes(
      'This is the part that is brand new. We have a shelf of Christian books and from today anyone can borrow them. '
      + 'Reserve on the portal, collect at fellowship, return by the due date. The portal reminds you.'
    );
  }

  // ============================================================
  // 9 — NOTIFICATIONS
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    iconCircle(s, ic.bell, 0.7, 1.7, 2.0);

    heading(s, 'Never Miss a Thing', 'ምንም ነገር አያመልጥዎ', { x: 3.3, w: 6.2 });

    const notifs = [
      'A new announcement is posted',
      'An event starts tomorrow',
      'Someone writes in your group',
      'Your borrowed book is due soon',
      'New books arrive in the library',
    ];
    notifs.forEach((n, i) => {
      const y = 1.42 + i * 0.68;
      s.addShape('roundRect', {
        x: 3.3, y, w: 6.2, h: 0.56,
        fill: { color: C.page }, line: { color: C.gold, width: 0.75 }, rectRadius: 0.07,
      });
      s.addText(n, {
        x: 3.48, y: y + 0.14, w: 5.9, h: 0.3,
        fontSize: 12, color: C.subtle,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addText('Turn these on in Profile → Notifications  ·  ፕሮፋይል → ማሳወቂያዎች', {
      x: 3.3, y: 4.92, w: 6.2, h: 0.3,
      fontSize: 10.5, color: C.muted, italic: true,
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    s.addNotes('These arrive on your phone even when the app is closed. Turn them on once and you will not miss anything.');
  }

  // ============================================================
  // 10 — INSTALL ON YOUR PHONE
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    heading(s, 'Put It On Your Phone', 'በስልክዎ ላይ ያስቀምጡት');

    s.addText('No app store. It installs straight from your browser in about ten seconds.', {
      x: 0.55, y: 1.3, w: 8.9, h: 0.32,
      fontSize: 13, color: C.subtle, italic: true,
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    const platforms = [
      { title: 'iPhone  ·  Safari', steps: ['Open wetcf.com in Safari', 'Tap the Share button', 'Tap "Add to Home Screen"', 'Tap "Add"'] },
      { title: 'Android  ·  Chrome', steps: ['Open wetcf.com in Chrome', 'Tap the three-dot menu', 'Tap "Add to Home screen"', 'Tap "Add"'] },
    ];

    platforms.forEach((p, i) => {
      const x = 0.55 + i * 4.6;
      const y = 1.78, w = 4.3, hh = 2.9;
      s.addShape('roundRect', {
        x, y, w, h: hh,
        fill: { color: C.dark }, line: { color: C.gold, width: 1 }, rectRadius: 0.1,
      });
      s.addText(p.title, {
        x: x + 0.15, y: y + 0.22, w: w - 0.3, h: 0.36,
        fontSize: 15, bold: true, color: C.gold, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      rule(s, x + 1.3, y + 0.66, w - 2.6);
      p.steps.forEach((st, j) => {
        s.addText(`${j + 1}.  ${st}`, {
          x: x + 0.35, y: y + 0.85 + j * 0.47, w: w - 0.6, h: 0.38,
          fontSize: 11.5, color: C.cream,
          fontFace: 'Calibri', isTextBox: true, margin: 0,
        });
      });
    });

    s.addText('It then behaves like a normal app — full screen, with notifications · ልክ እንደ መደበኛ አፕ ይሠራል', {
      x: 0.55, y: 4.85, w: 8.9, h: 0.3,
      fontSize: 10.5, color: C.muted, italic: true, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    s.addNotes('Worth doing this together in the room — it takes ten seconds and makes everything else easier.');
  }

  // ============================================================
  // 11 — PRIVACY
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };
    heading(s, 'Your Information Is Safe', 'መረጃዎ የተጠበቀ ነው', { onDark: true });

    const pts = [
      { icon: ic.lock,     en: 'Members only',      d: 'The portal is not open to the public. A leader approves every account.' },
      { icon: ic.shield,   en: 'Properly protected', d: 'Everything is encrypted, and passwords are stored so even we cannot read them.' },
      { icon: ic.check,    en: 'Yours to remove',    d: 'You can delete your account and your details at any time, from your profile.' },
      { icon: ic.heart,    en: 'Never sold',         d: 'We do not sell or share your information with anyone. Ever.' },
    ];

    pts.forEach((p, i) => {
      const y = 1.42 + i * 0.92;
      iconCircle(s, p.icon, 0.75, y + 0.06, 0.56);
      s.addText(p.en, {
        x: 1.52, y: y, w: 7.9, h: 0.32,
        fontSize: 14, bold: true, color: C.gold,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(p.d, {
        x: 1.52, y: y + 0.32, w: 7.9, h: 0.38,
        fontSize: 11.5, color: C.cream,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addNotes('People will ask about this. Be direct: members only, encrypted, deletable, never sold.');
  }

  // ============================================================
  // 12 — GET STARTED  (QR code)
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText('Join Us — Right Now', {
      x: 0.55, y: 0.45, w: 5.4, h: 0.62,
      fontSize: 32, bold: true, color: C.dark,
      fontFace: 'Cambria', isTextBox: true, margin: 0,
    });
    s.addText('አሁኑኑ ይቀላቀሉን', {
      x: 0.55, y: 1.05, w: 5.4, h: 0.38,
      fontSize: 17, color: C.muted, isTextBox: true, margin: 0,
    });

    const steps = [
      { n: '1', en: 'Scan the code',      d: 'Point your phone camera at it' },
      { n: '2', en: 'Create your account', d: 'Your name, email and phone — under two minutes' },
      { n: '3', en: 'Add it to your phone', d: 'So it is one tap away next time' },
      { n: '4', en: 'Turn on notifications', d: 'Profile → Notifications' },
    ];

    steps.forEach((st, i) => {
      const y = 1.62 + i * 0.82;
      s.addShape('ellipse', {
        x: 0.6, y: y + 0.02, w: 0.5, h: 0.5,
        fill: { color: C.dark }, line: { color: C.dark, width: 0 },
      });
      s.addText(st.n, {
        x: 0.6, y: y + 0.05, w: 0.5, h: 0.44,
        fontSize: 16, bold: true, color: C.gold, align: 'center',
        isTextBox: true, margin: 0,
      });
      s.addText(st.en, {
        x: 1.25, y: y, w: 4.5, h: 0.3,
        fontSize: 14, bold: true, color: C.dark,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(st.d, {
        x: 1.25, y: y + 0.3, w: 4.5, h: 0.3,
        fontSize: 11, color: C.subtle,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    // QR panel
    s.addShape('roundRect', {
      x: 6.25, y: 0.95, w: 3.2, h: 3.9,
      fill: { color: C.dark }, line: { color: C.gold, width: 1.25 }, rectRadius: 0.12,
    });
    s.addText('Scan to join', {
      x: 6.35, y: 1.12, w: 3.0, h: 0.32,
      fontSize: 14, bold: true, color: C.gold, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    // White plate behind the QR so it scans reliably
    s.addShape('roundRect', {
      x: 6.95, y: 1.55, w: 1.8, h: 1.8,
      fill: { color: C.white }, line: { color: C.white, width: 0 }, rectRadius: 0.06,
    });
    s.addImage({ data: QR_REG, x: 7.03, y: 1.63, w: 1.64, h: 1.64 });

    s.addText('wetcf.com/register', {
      x: 6.35, y: 3.5, w: 3.0, h: 0.3,
      fontSize: 12, bold: true, color: C.goldLt, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });
    s.addText('No phone with you?\nSpeak to any of our leaders.', {
      x: 6.4, y: 3.88, w: 2.9, h: 0.65,
      fontSize: 10.5, color: C.cream, align: 'center', italic: true,
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    s.addNotes(
      'Hold this slide up and give people a full minute to scan. Walk around and help anyone who is stuck. '
      + 'Anyone without a phone on them can speak to a leader afterwards.'
    );
  }

  // ============================================================
  // 13 — FOLLOW US
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    heading(s, 'Find Us Online', 'በኦንላይን ያግኙን', { align: 'center', x: 0.5, w: 9 });

    const links = [
      { icon: ic.globe,     en: 'wetcf.com',                  d: 'Our website — share it with anyone' },
      { icon: ic.youtube,   en: '@warsawethiopianfellowship', d: 'Teaching and worship on YouTube' },
      { icon: ic.instagram, en: '@warsaw_fellowship',         d: 'Life of the fellowship on Instagram' },
    ];

    const cW = 2.8, cY = 1.75, cH = 2.5;
    links.forEach((l, i) => {
      const x = 0.55 + i * (cW + 0.225);
      lightCard(s, x, cY, cW, cH);
      iconCircle(s, l.icon, x + cW / 2 - 0.33, cY + 0.28, 0.66);
      s.addText(l.en, {
        x: x + 0.1, y: cY + 1.1, w: cW - 0.2, h: 0.5,
        fontSize: 12, bold: true, color: C.dark, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(l.d, {
        x: x + 0.15, y: cY + 1.62, w: cW - 0.3, h: 0.7,
        fontSize: 10.5, color: C.subtle, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addText('Invite someone this week · በዚህ ሳምንት አንድ ሰው ይጋብዙ', {
      x: 0.5, y: 4.62, w: 9, h: 0.32,
      fontSize: 12, color: C.muted, italic: true, align: 'center',
      isTextBox: true, margin: 0,
    });

    s.addNotes('Ask them to follow both accounts today, and to send wetcf.com to one person this week.');
  }

  // ============================================================
  // 14 — CLOSING
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };

    s.addImage({ data: LOGO_LIGHT, x: 4.55, y: 0.3, w: 0.9, h: 0.9 });

    rule(s, 1.6, 1.38, 6.8);

    s.addText(
      '"And let us consider how we may spur one another on toward love and good deeds,\n'
      + 'not giving up meeting together, as some are in the habit of doing,\n'
      + 'but encouraging one another."',
      {
        x: 0.6, y: 1.55, w: 8.8, h: 1.15,
        fontSize: 14, color: C.cream, italic: true, align: 'center',
        fontFace: 'Cambria', isTextBox: true, margin: 0,
      }
    );
    s.addText('Hebrews 10:24–25', {
      x: 0.6, y: 2.68, w: 8.8, h: 0.3,
      fontSize: 11.5, bold: true, color: C.gold, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    s.addText(
      '"እርስ በርሳችን ፍቅርን እና መልካም ሥራን ለማነሳሳት እንተጋ፤\n'
      + 'እንደ አንዳንዶች ልማድ መሰብሰብን ሳንተው እርስ በርሳችን እናበረታታ።"',
      {
        x: 0.6, y: 3.12, w: 8.8, h: 0.92,
        fontSize: 14, color: C.cream, italic: true, align: 'center',
        isTextBox: true, margin: 0,
      }
    );
    s.addText('ዕብራውያን 10:24–25', {
      x: 0.6, y: 4.0, w: 8.8, h: 0.3,
      fontSize: 11.5, bold: true, color: C.gold, align: 'center',
      isTextBox: true, margin: 0,
    });

    rule(s, 1.6, 4.45, 6.8);

    s.addText('wetcf.com', {
      x: 0, y: 4.62, w: 10, h: 0.32,
      fontSize: 13, bold: true, color: C.gold, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });
    s.addText('Thank you · እናመሰግናለን', {
      x: 0, y: 4.96, w: 10, h: 0.3,
      fontSize: 11, color: C.onDark, align: 'center',
      isTextBox: true, margin: 0,
    });

    s.addNotes('Close on the verse the logo carries. Thank them, and invite anyone with questions to come and find you.');
  }

  const out = require('path').join(__dirname, 'WETCF_Launch_Presentation.pptx');
  await pres.writeFile({ fileName: out });
  console.log('Written:', out);
}

main().catch((e) => { console.error(e); process.exit(1); });
