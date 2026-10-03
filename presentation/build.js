'use strict';
// ============================================================
// WETCF Launch Presentation
// Launching: public website + members portal + library service
// Bilingual EN / Amharic, brand palette, logo, QR code
//
// Typography floor: nothing below 13pt. This is read from the back of a
// room on a projector, so copy is kept short enough to survive that size
// rather than shrinking type to fit more words in.
// ============================================================
const pptxgen = require('pptxgenjs');
const React   = require('react');
const { createElement: h } = React;
const RDS     = require('react-dom/server');
const sharp   = require('sharp');
const fa      = require('react-icons/fa');
const fs      = require('fs');
const path    = require('path');

const ASSETS = path.join(__dirname, 'assets');

// ── Brand palette ────────────────────────────────────────────
const C = {
  dark:   '1C0F07',
  dark2:  '2B1508',
  gold:   'C9A84C',
  goldLt: 'EDD090',
  cream:  'FAF7F0',
  white:  'FFFFFF',
  muted:  '7A5535',
  subtle: '3D2312',
  page:   'FAF7F0',
  // Secondary text on DARK backgrounds. C.muted only reaches ~3.6:1 there,
  // which washes out on a projector; this clears 6:1.
  onDark: 'C4A882',
};

// ── Type scale ───────────────────────────────────────────────
const T = {
  slideTitle: 34,
  slideSub:   19,
  cardTitle:  17,
  cardSubAm:  14,
  body:       13.5,
  bodySm:     13,
  footnote:   13,
};

// ── Helpers ──────────────────────────────────────────────────
const b64 = (file) =>
  'image/png;base64,' + fs.readFileSync(path.join(ASSETS, file)).toString('base64');

async function iconPNG(IconComp, hexColor, size = 320) {
  const svg = RDS.renderToStaticMarkup(h(IconComp, { color: '#' + hexColor, size }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');
}

/** Gold circle with a dark icon — the motif carried across every slide. */
function iconCircle(s, img, x, y, d = 0.86) {
  const pad = d * 0.19;
  s.addShape('ellipse', {
    x, y, w: d, h: d,
    fill: { color: C.gold }, line: { color: C.gold, width: 0 },
  });
  s.addImage({ data: img, x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
}

function rule(s, x, y, w, color = C.gold) {
  s.addShape('rect', { x, y, w, h: 0.04, fill: { color }, line: { color, width: 0 } });
}

function darkCard(s, x, y, w, hh) {
  s.addShape('roundRect', {
    x, y, w, h: hh,
    fill: { color: C.dark2 }, line: { color: C.gold, width: 1.25 }, rectRadius: 0.1,
  });
}

function lightCard(s, x, y, w, hh) {
  s.addShape('roundRect', {
    x, y, w, h: hh,
    fill: { color: C.white }, line: { color: C.gold, width: 1.5 }, rectRadius: 0.11,
    shadow: { type: 'outer', color: 'C0B4A4', blur: 8, offset: 3, angle: 45, opacity: 0.35 },
  });
}

/** Standard slide heading: English title + Amharic subtitle. */
function heading(s, en, am, opts = {}) {
  const onDark = opts.onDark ?? false;
  const align  = opts.align ?? 'left';
  const x = opts.x ?? 0.55;
  const w = opts.w ?? 8.9;
  const y = opts.y ?? 0.3;
  s.addText(en, {
    x, y, w, h: 0.66,
    fontSize: opts.size ?? T.slideTitle, bold: true,
    color: onDark ? C.gold : C.dark,
    fontFace: 'Cambria', align, isTextBox: true, margin: 0,
  });
  if (am) {
    s.addText(am, {
      x, y: y + 0.62, w, h: 0.4,
      fontSize: T.slideSub, color: onDark ? C.cream : C.muted,
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

  const LOGO_LIGHT = b64('logo-transparent.png');
  const QR_REG     = b64('qr-register.png');

  console.log('Rendering icons…');
  const ic = {};
  for (const [k, Comp] of Object.entries({
    globe: fa.FaGlobeAfrica, users: fa.FaUsers, book: fa.FaBookOpen,
    bell: fa.FaBell, chat: fa.FaComments, calendar: fa.FaCalendarAlt,
    bullhorn: fa.FaBullhorn, video: fa.FaVideo, tasks: fa.FaClipboardList,
    shield: fa.FaShieldAlt, lock: fa.FaLock, search: fa.FaSearch,
    check: fa.FaCheckCircle, arrow: fa.FaArrowRight, music: fa.FaMusic,
    praying: fa.FaPrayingHands, heart: fa.FaHeart, share: fa.FaShareAlt,
    home: fa.FaHome, handshake: fa.FaHandshake, youtube: fa.FaYoutube,
    instagram: fa.FaInstagram, mapPin: fa.FaMapMarkerAlt,
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

    s.addImage({ data: LOGO_LIGHT, x: 4.25, y: 0.38, w: 1.5, h: 1.5 });

    s.addText('Welcome to wetcf.com', {
      x: 0.5, y: 2.02, w: 9, h: 0.85,
      fontSize: 42, bold: true, color: C.gold, align: 'center',
      fontFace: 'Cambria', isTextBox: true, margin: 0,
    });

    s.addText('እንኳን ወደ wetcf.com በደህና መጡ', {
      x: 0.5, y: 2.86, w: 9, h: 0.5,
      fontSize: 22, color: C.cream, align: 'center',
      isTextBox: true, margin: 0,
    });

    rule(s, 3.1, 3.46, 3.8);

    s.addText('Our website, our member portal, and our library', {
      x: 0.5, y: 3.64, w: 9, h: 0.4,
      fontSize: 16, color: C.goldLt, italic: true, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });
    s.addText('ዛሬ ይጀምራሉ', {
      x: 0.5, y: 4.06, w: 9, h: 0.4,
      fontSize: 16, color: C.cream, italic: true, align: 'center',
      isTextBox: true, margin: 0,
    });

    s.addText('Warsaw Ethiopian Christian Fellowship', {
      x: 0, y: 4.9, w: 10, h: 0.32,
      fontSize: 13, color: C.onDark, align: 'center',
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
      { icon: ic.globe, en: 'Our Website',      am: 'ድረ-ገጻችን',    body: 'A public home at wetcf.com — who we are and when we meet.' },
      { icon: ic.users, en: 'Members Portal',   am: 'የአባላት ፖርታል', body: 'A private space for members — groups, teams and meetings.' },
      { icon: ic.book,  en: 'Fellowship Library', am: 'ቤተ-መጻሕፍት', body: 'Our books, open for borrowing. Reserve online, collect here.' },
    ];

    const cW = 2.85, cH = 3.2, cY = 1.62;
    items.forEach((it, i) => {
      const cx = 0.52 + i * (cW + 0.19);
      lightCard(s, cx, cY, cW, cH);
      iconCircle(s, it.icon, cx + cW / 2 - 0.47, cY + 0.26, 0.94);
      s.addText(it.en, {
        x: cx + 0.08, y: cY + 1.32, w: cW - 0.16, h: 0.4,
        fontSize: T.cardTitle, bold: true, color: C.dark, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(it.am, {
        x: cx + 0.08, y: cY + 1.72, w: cW - 0.16, h: 0.36,
        fontSize: T.cardSubAm, color: C.muted, align: 'center', isTextBox: true, margin: 0,
      });
      s.addText(it.body, {
        x: cx + 0.16, y: cY + 2.14, w: cW - 0.32, h: 0.95,
        fontSize: T.body, color: C.subtle, align: 'center',
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
      x: 0.55, y: 1.36, w: 8.9, h: 0.36,
      fontSize: 15, color: C.goldLt, italic: true,
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    const pages = [
      { icon: ic.home,     en: 'Home & About',     am: 'ስለ እኛ' },
      { icon: ic.calendar, en: 'Programs & Events', am: 'ዝግጅቶች' },
      { icon: ic.mapPin,   en: 'Visit Us',         am: 'ይጎብኙን' },
      { icon: ic.share,    en: 'Follow Us',        am: 'ይከታተሉን' },
    ];

    const w = 4.3, hh = 1.4;
    pages.forEach((p, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.55 + col * (w + 0.3);
      const y = 1.86 + row * (hh + 0.26);
      darkCard(s, x, y, w, hh);
      iconCircle(s, p.icon, x + 0.26, y + 0.3, 0.8);
      s.addText(p.en, {
        x: x + 1.2, y: y + 0.32, w: w - 1.35, h: 0.36,
        fontSize: 16, bold: true, color: C.gold,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(p.am, {
        x: x + 1.2, y: y + 0.7, w: w - 1.35, h: 0.34,
        fontSize: T.cardSubAm, color: C.cream, isTextBox: true, margin: 0,
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
      { icon: ic.bullhorn,  en: 'Announcements', am: 'ማስታወቂያዎች' },
      { icon: ic.calendar,  en: 'Events',        am: 'ዝግጅቶች' },
      { icon: ic.chat,      en: 'BUS Groups',    am: 'BUS ቡድኖች' },
      { icon: ic.handshake, en: 'Serving Teams', am: 'የአገልግሎት ቡድኖች' },
      { icon: ic.book,      en: 'Library',       am: 'ቤተ-መጻሕፍት' },
      { icon: ic.bell,      en: 'Notifications', am: 'ማሳወቂያዎች' },
    ];

    // fH gives the Amharic subtitle real clearance from the card border —
    // at 1.62 it sat ~0.1in off the edge, one font bump from colliding.
    const fW = 2.78, fH = 1.74, gx = 0.21, gy = 0.16;
    features.forEach((f, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 0.52 + col * (fW + gx);
      const y = 1.52 + row * (fH + gy);
      lightCard(s, x, y, fW, fH);
      iconCircle(s, f.icon, x + fW / 2 - 0.37, y + 0.17, 0.74);
      s.addText(f.en, {
        x: x + 0.08, y: y + 0.98, w: fW - 0.16, h: 0.34,
        fontSize: 15.5, bold: true, color: C.dark, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(f.am, {
        x: x + 0.08, y: y + 1.3, w: fW - 0.16, h: 0.3,
        fontSize: 12.5, color: C.muted, align: 'center', isTextBox: true, margin: 0,
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
        points: ['Posted by leaders', 'Prayer and praise', 'Reaches you at once'],
      },
      {
        icon: ic.calendar, en: 'Events', am: 'ዝግጅቶች',
        points: ['Each has its own page', 'Photos and video', 'Reminder the day before'],
      },
    ];

    cols.forEach((c, i) => {
      const x = 0.55 + i * 4.6;
      const w = 4.3, hh = 3.3, y = 1.56;
      s.addShape('roundRect', {
        x, y, w, h: hh,
        fill: { color: C.dark }, line: { color: C.gold, width: 1.25 }, rectRadius: 0.11,
      });
      iconCircle(s, c.icon, x + w / 2 - 0.44, y + 0.24, 0.88);
      s.addText(c.en, {
        x: x + 0.1, y: y + 1.22, w: w - 0.2, h: 0.4,
        fontSize: 18, bold: true, color: C.gold, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(c.am, {
        x: x + 0.1, y: y + 1.62, w: w - 0.2, h: 0.34,
        fontSize: T.cardSubAm, color: C.cream, align: 'center', isTextBox: true, margin: 0,
      });
      c.points.forEach((p, j) => {
        s.addText('·  ' + p, {
          x: x + 0.42, y: y + 2.08 + j * 0.4, w: w - 0.7, h: 0.36,
          fontSize: T.body, color: C.cream,
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
      { icon: ic.chat,  en: 'Group Chat',     am: 'የቡድን ውይይት', d: 'A private room for your group' },
      { icon: ic.video, en: 'Video Meetings', am: 'ቪዲዮ ስብሰባ',  d: 'One tap to meet from anywhere' },
      { icon: ic.tasks, en: 'Shared Tasks',   am: 'የጋራ ተግባሮች', d: 'Agree who does what, together' },
    ];

    const cW = 2.85, cH = 2.95, cY = 1.82;
    groups.forEach((g, i) => {
      const x = 0.52 + i * (cW + 0.19);
      darkCard(s, x, cY, cW, cH);
      iconCircle(s, g.icon, x + cW / 2 - 0.44, cY + 0.26, 0.88);
      s.addText(g.en, {
        x: x + 0.08, y: cY + 1.26, w: cW - 0.16, h: 0.38,
        fontSize: T.cardTitle, bold: true, color: C.gold, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(g.am, {
        x: x + 0.08, y: cY + 1.64, w: cW - 0.16, h: 0.34,
        fontSize: T.cardSubAm, color: C.cream, align: 'center', isTextBox: true, margin: 0,
      });
      s.addText(g.d, {
        x: x + 0.14, y: cY + 2.04, w: cW - 0.28, h: 0.75,
        fontSize: T.body, color: C.goldLt, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addNotes('Every member belongs to a BUS group. Each one now has its own chat, video room and task list.');
  }

  // ============================================================
  // 7 — SERVING TEAMS
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    heading(s, 'Serving Teams', 'የአገልግሎት ቡድኖች');

    const teams = [
      { icon: ic.music,    en: 'Worship',        am: 'አምልኮ' },
      { icon: ic.praying,  en: 'Prayer',         am: 'ጸሎት' },
      { icon: ic.bullhorn, en: 'Evangelism',     am: 'ወንጌል ስርጭት' },
      { icon: ic.heart,    en: 'Social Affairs', am: 'ማህበራዊ ጉዳይ' },
      { icon: ic.share,    en: 'Social Media',   am: 'ሶሻል ሚዲያ' },
      { icon: ic.book,     en: 'Library',        am: 'ቤተ-መጻሕፍት' },
    ];

    const tW = 1.47, tY = 1.52;
    teams.forEach((t, i) => {
      const x = 0.5 + i * (tW + 0.04);
      iconCircle(s, t.icon, x + tW / 2 - 0.4, tY, 0.8);
      s.addText(t.en, {
        x: x - 0.06, y: tY + 0.92, w: tW + 0.12, h: 0.32,
        fontSize: 13.5, bold: true, color: C.dark, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(t.am, {
        x: x - 0.06, y: tY + 1.24, w: tW + 0.12, h: 0.3,
        fontSize: 12, color: C.muted, align: 'center', isTextBox: true, margin: 0,
      });
    });

    // What each team gets
    const perks = [
      { icon: ic.chat,  en: 'Its own chat',   d: 'Talk without crowding the main group' },
      { icon: ic.video, en: 'Video meetings', d: 'Plan without everyone travelling' },
      { icon: ic.check, en: 'Shared files',   d: 'Song lists and rotas in one place' },
    ];
    const pY = 3.3;
    perks.forEach((p, i) => {
      const x = 0.52 + i * 3.02;
      lightCard(s, x, pY, 2.84, 1.72);
      iconCircle(s, p.icon, x + 0.2, pY + 0.22, 0.62);
      s.addText(p.en, {
        x: x + 1.0, y: pY + 0.3, w: 1.76, h: 0.34,
        fontSize: 14.5, bold: true, color: C.dark,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(p.d, {
        x: x + 0.18, y: pY + 0.95, w: 2.5, h: 0.68,
        fontSize: T.bodySm, color: C.subtle,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addNotes(
      'If you serve on any of these teams, the portal now gives your team its own space. '
      + 'Speak to a leader if you would like to join one.'
    );
  }

  // ============================================================
  // 8 — LIBRARY
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.dark };
    heading(s, 'Our Library Opens Today', 'ቤተ-መጻሕፍታችን ዛሬ ይከፈታል', { onDark: true });

    s.addText('Christian books to borrow — free for every member.', {
      x: 0.55, y: 1.36, w: 8.9, h: 0.36,
      fontSize: 15, color: C.goldLt, italic: true,
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    const steps = [
      { icon: ic.search, n: '1', en: 'Browse',  am: 'ያስሱ',  d: 'See what is on the shelf' },
      { icon: ic.book,   n: '2', en: 'Reserve', am: 'ያስይዙ', d: 'We hold it for you' },
      { icon: ic.check,  n: '3', en: 'Collect', am: 'ይውሰዱ', d: 'Pick it up at fellowship' },
      { icon: ic.arrow,  n: '4', en: 'Return',  am: 'ይመልሱ', d: 'We remind you in time' },
    ];

    // Row is centred on the slide: 4 × 2.14 + 3 × 0.17 = 9.07 wide.
    const sW = 2.14, sY = 1.9, gap = 0.17;
    steps.forEach((st, i) => {
      const x = 0.465 + i * (sW + gap);
      darkCard(s, x, sY, sW, 2.6);
      iconCircle(s, st.icon, x + sW / 2 - 0.39, sY + 0.24, 0.78);
      s.addText(`${st.n}. ${st.en}`, {
        x: x + 0.06, y: sY + 1.12, w: sW - 0.12, h: 0.36,
        fontSize: 15.5, bold: true, color: C.gold, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(st.am, {
        x: x + 0.06, y: sY + 1.48, w: sW - 0.12, h: 0.32,
        fontSize: 13, color: C.cream, align: 'center', isTextBox: true, margin: 0,
      });
      s.addText(st.d, {
        x: x + 0.1, y: sY + 1.84, w: sW - 0.2, h: 0.66,
        fontSize: T.bodySm, color: C.goldLt, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addText('Please return them on time so others can read them too.', {
      x: 0.55, y: 4.76, w: 8.9, h: 0.34,
      fontSize: T.footnote, color: C.cream, italic: true, align: 'center',
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

    iconCircle(s, ic.bell, 0.62, 1.72, 2.25);

    heading(s, 'Never Miss a Thing', 'ምንም ነገር አያመልጥዎ', { x: 3.4, w: 6.1 });

    const notifs = [
      'A new announcement is posted',
      'An event starts tomorrow',
      'Someone writes in your group',
      'Your book is due back soon',
      'New books reach the library',
    ];
    notifs.forEach((n, i) => {
      const y = 1.5 + i * 0.70;
      s.addShape('roundRect', {
        x: 3.4, y, w: 6.1, h: 0.56,
        fill: { color: C.page }, line: { color: C.gold, width: 1 }, rectRadius: 0.07,
      });
      s.addText(n, {
        x: 3.6, y: y + 0.13, w: 5.75, h: 0.32,
        fontSize: T.body, color: C.subtle,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addText('Turn these on in Profile → Notifications', {
      x: 3.4, y: 4.98, w: 6.1, h: 0.32,
      fontSize: T.footnote, color: C.muted, italic: true,
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

    s.addText('No app store. It installs from your browser in seconds.', {
      x: 0.55, y: 1.36, w: 8.9, h: 0.36,
      fontSize: 15, color: C.subtle, italic: true,
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    const platforms = [
      { title: 'iPhone  ·  Safari',  steps: ['Open wetcf.com', 'Tap Share', 'Add to Home Screen', 'Tap Add'] },
      { title: 'Android  ·  Chrome', steps: ['Open wetcf.com', 'Tap the ⋮ menu', 'Add to Home screen', 'Tap Add'] },
    ];

    platforms.forEach((p, i) => {
      const x = 0.55 + i * 4.6;
      const y = 1.84, w = 4.3, hh = 2.86;
      s.addShape('roundRect', {
        x, y, w, h: hh,
        fill: { color: C.dark }, line: { color: C.gold, width: 1.25 }, rectRadius: 0.11,
      });
      s.addText(p.title, {
        x: x + 0.15, y: y + 0.22, w: w - 0.3, h: 0.4,
        fontSize: T.cardTitle, bold: true, color: C.gold, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      rule(s, x + 1.3, y + 0.72, w - 2.6);
      p.steps.forEach((st, j) => {
        s.addText(`${j + 1}.  ${st}`, {
          x: x + 0.55, y: y + 0.94 + j * 0.46, w: w - 0.8, h: 0.4,
          fontSize: T.body, color: C.cream,
          fontFace: 'Calibri', isTextBox: true, margin: 0,
        });
      });
    });

    s.addText('It then behaves like a normal app — full screen, with notifications', {
      x: 0.55, y: 4.86, w: 8.9, h: 0.32,
      fontSize: T.footnote, color: C.muted, italic: true, align: 'center',
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
      { icon: ic.lock,   en: 'Members only',       d: 'Not open to the public. A leader approves every account.' },
      { icon: ic.shield, en: 'Properly protected', d: 'Encrypted, and passwords stored so even we cannot read them.' },
      { icon: ic.check,  en: 'Yours to remove',    d: 'Delete your account and details any time, from your profile.' },
      { icon: ic.heart,  en: 'Never sold',         d: 'We do not sell or share your information. Ever.' },
    ];

    pts.forEach((p, i) => {
      const y = 1.5 + i * 0.93;
      iconCircle(s, p.icon, 0.68, y + 0.02, 0.7);
      s.addText(p.en, {
        x: 1.6, y: y - 0.02, w: 7.8, h: 0.36,
        fontSize: 16, bold: true, color: C.gold,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(p.d, {
        x: 1.6, y: y + 0.34, w: 7.8, h: 0.4,
        fontSize: T.body, color: C.cream,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addNotes('People will ask about this. Be direct: members only, encrypted, deletable, never sold.');
  }

  // ============================================================
  // 12 — GET STARTED (QR code)
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText('Join Us — Right Now', {
      x: 0.55, y: 0.42, w: 5.4, h: 0.66,
      fontSize: T.slideTitle, bold: true, color: C.dark,
      fontFace: 'Cambria', isTextBox: true, margin: 0,
    });
    s.addText('አሁኑኑ ይቀላቀሉን', {
      x: 0.55, y: 1.04, w: 5.4, h: 0.4,
      fontSize: T.slideSub, color: C.muted, isTextBox: true, margin: 0,
    });

    const steps = [
      { n: '1', en: 'Scan the code',         d: 'Point your phone camera at it' },
      { n: '2', en: 'Create your account',   d: 'Under two minutes' },
      { n: '3', en: 'Add it to your phone',  d: 'One tap away next time' },
      { n: '4', en: 'Turn on notifications', d: 'Profile → Notifications' },
    ];

    steps.forEach((st, i) => {
      const y = 1.68 + i * 0.84;
      s.addShape('ellipse', {
        x: 0.58, y: y + 0.02, w: 0.58, h: 0.58,
        fill: { color: C.dark }, line: { color: C.dark, width: 0 },
      });
      s.addText(st.n, {
        x: 0.58, y: y + 0.06, w: 0.58, h: 0.5,
        fontSize: 19, bold: true, color: C.gold, align: 'center',
        isTextBox: true, margin: 0,
      });
      s.addText(st.en, {
        x: 1.32, y: y, w: 4.4, h: 0.34,
        fontSize: 16, bold: true, color: C.dark,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(st.d, {
        x: 1.32, y: y + 0.34, w: 4.4, h: 0.32,
        fontSize: T.bodySm, color: C.subtle,
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    // QR panel
    s.addShape('roundRect', {
      x: 6.15, y: 0.88, w: 3.32, h: 4.05,
      fill: { color: C.dark }, line: { color: C.gold, width: 1.5 }, rectRadius: 0.12,
    });
    s.addText('Scan to join', {
      x: 6.25, y: 1.06, w: 3.12, h: 0.36,
      fontSize: T.cardTitle, bold: true, color: C.gold, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    // White plate behind the QR so it scans reliably
    s.addShape('roundRect', {
      x: 6.84, y: 1.54, w: 1.94, h: 1.94,
      fill: { color: C.white }, line: { color: C.white, width: 0 }, rectRadius: 0.06,
    });
    s.addImage({ data: QR_REG, x: 6.93, y: 1.63, w: 1.76, h: 1.76 });

    s.addText('wetcf.com/register', {
      x: 6.25, y: 3.62, w: 3.12, h: 0.34,
      fontSize: 15, bold: true, color: C.goldLt, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });
    s.addText('No phone with you?\nSpeak to one of our leaders.', {
      x: 6.3, y: 4.04, w: 3.02, h: 0.72,
      fontSize: T.bodySm, color: C.cream, align: 'center', italic: true,
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
      { icon: ic.globe,     en: 'wetcf.com',          d: 'Our website — share it with anyone' },
      { icon: ic.youtube,   en: 'YouTube',            d: '@warsawethiopianfellowship' },
      { icon: ic.instagram, en: 'Instagram',          d: '@warsaw_fellowship' },
    ];

    const cW = 2.85, cY = 1.78, cH = 2.5;
    links.forEach((l, i) => {
      const x = 0.52 + i * (cW + 0.19);
      lightCard(s, x, cY, cW, cH);
      iconCircle(s, l.icon, x + cW / 2 - 0.44, cY + 0.28, 0.88);
      s.addText(l.en, {
        x: x + 0.08, y: cY + 1.3, w: cW - 0.16, h: 0.38,
        fontSize: T.cardTitle, bold: true, color: C.dark, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
      s.addText(l.d, {
        x: x + 0.12, y: cY + 1.72, w: cW - 0.24, h: 0.6,
        fontSize: T.bodySm, color: C.subtle, align: 'center',
        fontFace: 'Calibri', isTextBox: true, margin: 0,
      });
    });

    s.addText('Invite someone this week · በዚህ ሳምንት አንድ ሰው ይጋብዙ', {
      x: 0.5, y: 4.6, w: 9, h: 0.34,
      fontSize: 15, color: C.muted, italic: true, align: 'center',
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

    s.addImage({ data: LOGO_LIGHT, x: 4.5, y: 0.26, w: 1.0, h: 1.0 });

    rule(s, 1.5, 1.42, 7.0);

    s.addText(
      '"And let us consider how we may spur one another on\n'
      + 'toward love and good deeds, not giving up meeting together,\n'
      + 'but encouraging one another."',
      {
        x: 0.6, y: 1.6, w: 8.8, h: 1.1,
        fontSize: 16, color: C.cream, italic: true, align: 'center',
        fontFace: 'Cambria', isTextBox: true, margin: 0,
      }
    );
    s.addText('Hebrews 10:24–25', {
      x: 0.6, y: 2.7, w: 8.8, h: 0.32,
      fontSize: 13.5, bold: true, color: C.gold, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });

    s.addText(
      '"እርስ በርሳችን ፍቅርን እና መልካም ሥራን ለማነሳሳት እንተጋ፤\n'
      + 'መሰብሰብን ሳንተው እርስ በርሳችን እናበረታታ።"',
      {
        x: 0.6, y: 3.16, w: 8.8, h: 0.88,
        fontSize: 16, color: C.cream, italic: true, align: 'center',
        isTextBox: true, margin: 0,
      }
    );
    s.addText('ዕብራውያን 10:24–25', {
      x: 0.6, y: 4.0, w: 8.8, h: 0.32,
      fontSize: 13.5, bold: true, color: C.gold, align: 'center',
      isTextBox: true, margin: 0,
    });

    rule(s, 1.5, 4.46, 7.0);

    s.addText('wetcf.com', {
      x: 0, y: 4.62, w: 10, h: 0.34,
      fontSize: 15, bold: true, color: C.gold, align: 'center',
      fontFace: 'Calibri', isTextBox: true, margin: 0,
    });
    s.addText('Thank you · እናመሰግናለን', {
      x: 0, y: 4.98, w: 10, h: 0.32,
      fontSize: 13, color: C.onDark, align: 'center',
      isTextBox: true, margin: 0,
    });

    s.addNotes('Close on the verse the logo carries. Thank them, and invite anyone with questions to come and find you.');
  }

  const out = path.join(__dirname, 'WETCF_Launch_Presentation.pptx');
  await pres.writeFile({ fileName: out });
  console.log('Written:', out);
}

main().catch((e) => { console.error(e); process.exit(1); });
