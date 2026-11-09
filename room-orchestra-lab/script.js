// Room Orchestra — Agency × Context. IMA lab.'ın 01 · Key Orchestra ve 06 · Letter Rain deneylerinin motoru ve kabuğu üzerine kuruldu;
// sahne, bando (nesneler), şef (eski radyo), solist, seyirci, bulutlar ve lamba bu proje için yeniden tasarlandı.
// Klavyenin her tuşu sahnede bir çalgı-nesne (AGENCY). Odanın sesi, bir tuşun kaç nesneye ulaşacağını belirler (CONTEXT).
// Letter Rain'deki harfler yerine burada bulutlardan NOTALAR yağar: kaç nota yağacağını da yine oda (agency modu) belirler.
// Girdi: mikrofon (oda sesi) + keydown / tıklama · Kural: roomStateFor(level) → agency → ruleFor(key) → rainFor(...)
// Durum: room.level, agency, çalanlar, yağan notalar, perde, lamba · Çıktı: zıplama + ses + nota yağmuru + seyirci + ışık
//
// CANLI DEĞİŞİKLİK İÇİN: bütün sayılar ve kurallar aşağıdaki 'design' nesnesinde (CODE sekmesinde de değişir).
// Context: readRoom() + roomStateFor() · Agency: ruleFor() · Buluştukları yer: updateAgency() · Nota yağmuru: rainForKey/Row, explode()
window.OYUNLAR = window.OYUNLAR || {};
window.OYUNLAR['01'] = {
  key: '01', title: 'Room Orchestra', premise: 'Agency × Context',
  premiseText: 'Your actions change the system (Agency), but the room beyond the screen decides how far they reach (Context).',
  promise: 'Participation can be designed, and so can the room it happens in.',
  source: 'engine and shell: IMA lab., Mert Seven (Key Orchestra, Letter Rain) · ideas after Patatap (Brandel & Lullatone 2014) and Text Rain (Utterback & Achituv 1999)',
  caption: 'The quieter the room, the more precisely you lead the band.',
  hint: 'press any key · click an object · scroll or − / + = zoom out / in · stay quiet or make noise · space = set the room by hand (quiet → busy → loud) · enter = microphone · click the curtain or ↑ = soloist · click the street lamp or ↓ = light · NIGHT button = night',
  anat: ['microphone · keydown', 'room → agency → who plays', 'room.level · notes[ ]', 'jump + note rain + crowd'], hot: 1,
  hud: [['ROOM · SPACE', 'room'], ['AGENCY', 'agency'], ['PLAYING', 'nPlay'], ['FALLING', 'nRain', 'ghosts']],

  // 1) DESIGN PARAMETERS · hepsi canlı değiştirilebilir
  design: {
    inQuiet: 'full', inBusy: 'group', inLoud: 'single',   // CONTEXT → AGENCY: hangi oda hangi kontrolü verir?
    quietBelow: 0.15, loudAbove: 0.45,                    // oda seviyesi (0–1) eşikleri
    modeHold: 0.8,                                        // s · yeni oda durumu bu kadar sürmeli
    micSensitivity: 6,                                    // × · mikrofon seviyesini çarpar
    ignoreOwnSound: true,                                 // bandonun kendi sesi oda gürültüsü sayılmasın
    keyRain: 5,                                           // bir çalgı: 5–6 nota (bazen 7–8)
    rowRain: 10,                                          // bütün satır: 10–15 nota
    idleRain: 0,                                          // kimse çalmazken saniyede kaç nota (0 = basmadıkça nota yağmaz)
    fallSpeed: 0.8,                                       // notaların düşme hızı
    burst: 3,                                             // bütün bando çalınca notaların savrulma gücü
    lampPower: 6,                                         // sokak lambasının gece gücü
    modern: true,                                         // çizim: true = düz renk, yumuşak ışık, gölge, dış hat yok · false = laboratuvarın taralı boya görünümü
    crowd: 12,                                            // çalınca en fazla kaç festival gezgini dinleyicilere katılır (kaçının katılacağını odanın sesi belirler)
    life: 1, stagger: 0.035, sound: true, shapes: true    // tepki ayarları
  },
  knobs: [
    { key: 'inQuiet', type: 'choice', options: ['single', 'group', 'full'], note: 'agency in a QUIET room' },
    { key: 'inBusy', type: 'choice', options: ['single', 'group', 'full'], note: 'agency in a BUSY room' },
    { key: 'inLoud', type: 'choice', options: ['single', 'group', 'full'], note: 'agency in a LOUD room' },
    { key: 'quietBelow', step: 0.05, min: 0, max: 1, note: '0–1 · below this the room is quiet' },
    { key: 'loudAbove', step: 0.05, min: 0, max: 1, note: '0–1 · above this the room is loud' },
    { key: 'modeHold', step: 0.1, min: 0, max: 5, note: 's · how long the room must stay before control changes' },
    { key: 'micSensitivity', step: 1, min: 1, max: 30, note: '× · how loud the mic counts' },
    { key: 'ignoreOwnSound', type: 'bool', note: 'the band does not hear itself' },
    { key: 'keyRain', step: 1, min: 0, max: 20, note: 'notes from one object (+0–1, sometimes +2–3)' },
    { key: 'rowRain', step: 1, min: 0, max: 40, note: 'notes from a whole row (+0–5)' },
    { key: 'idleRain', step: 0.5, min: 0, max: 10, note: 'notes / s while nobody plays' },
    { key: 'fallSpeed', step: 0.1, min: 0.1, max: 3, note: 'how fast notes fall' },
    { key: 'burst', step: 0.5, min: 0, max: 10, note: 'how hard notes fly when the whole band plays' },
    { key: 'lampPower', step: 1, min: 0, max: 20, note: 'street lamp at night' },
    { key: 'modern', type: 'bool', note: 'drawing style: modern (flat, soft light) or hand-printed' },
    { key: 'crowd', step: 1, min: 0, max: 22, note: 'how many festival-goers can join when the band plays' },
    { key: 'life', step: 0.25, min: 0.25, max: 4, note: 's · how long a note rings' },
    { key: 'stagger', step: 0.01, min: 0, max: 0.2, note: 's · neighbours join late' },
    { key: 'sound', type: 'bool', note: 'live' }, { key: 'shapes', type: 'bool', note: 'live' }],
  code: ['<span class="c">// 3) RULE: the room decides how far your key reaches (Context → Agency)</span>',
    '<span class="k">function</span> roomStateFor(level) {',
    '  <span class="k">if</span> (level &lt; DESIGN.quietBelow) <span class="k">return</span> \'quiet\';',
    '  <span class="k">if</span> (level &gt; DESIGN.loudAbove)  <span class="k">return</span> \'loud\';',
    '  <span class="k">return</span> \'busy\';',
    '}',
    '<span class="c">// 4) RULE: who plays, and how much rain? (Agency)</span>',
    '<span class="k">function</span> act(key) {',
    '  <span class="k">if</span> (agency === \'single\') explode(key);       <span class="c">// whole band: notes fly</span>',
    '  <span class="k">if</span> (agency === \'group\') rainForRow(key);    <span class="c">// 10–15 notes</span>',
    '  <span class="k">if</span> (agency === \'full\') rainForKey(key);    <span class="c">// 5–8 notes</span>',
    '}'],
  tasks: ['Swap <b>inQuiet</b> and <b>inLoud</b>. Now noise gives you control and silence takes it away. Which one feels fairer?',
    'Turn <b>ignoreOwnSound</b> off. The band can now hear itself: does playing a lot take your control away?',
    'Switch to NIGHT and turn the street lamp on and off. Does light change what you dare to play?'],
  question: 'Who else in this room is changing what your keys can do?',
  overlay: { title: 'This sketch can listen to the room.', text: '', choices: [] }, // asıl ekran start() içinde (izin seçimi)
  view: { at: [0, 0.75, -0.35], zoom: 2.35, pitch: 0.82 },
  ownsKeys: true,

  make(ctx) {
    const { THREE, D, C, group } = ctx;
    const ROWS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    const NOTE_NAMES = ['do', 're', 'mi', 'sol', 'la'], PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
    const ROOMS = ['quiet', 'busy', 'loud'];
    const PRESET = { quiet: 0.03, busy: 0.3, loud: 0.85 };   // SPACE ile seçilen "elle oda" seviyeleri
    const FOLLOW = 4;                                        // oda okuması saniyede ne hızla yaklaşır
    const TOP = 0.35, PED = 0.17, PITCH = 0.335, ROWZ = [-0.8, -0.27, 0.26, 0.79], STAGE_W = 4.5, STAGE_Z0 = -1.75, STAGE_Z1 = 1.95, BACK = -2.35, CLOUD_Y = 3.1;
    const rnd = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)];
    let seed = 11; const srnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, spick = (a) => a[Math.floor(srnd() * a.length)];
    const T = (k) => ctx.toon(k);
    const pat = (kind, cols, rep = [1, 1]) => new THREE.MeshToonMaterial({ map: ctx.parts.texFrom(ctx.parts.patternCanvas(kind, cols.map((k) => C[k])), rep), gradientMap: ctx.parts.LAMBERT });
    const M = (geo, mat, x = 0, y = 0, z = 0) => ctx.mesh(geo, mat, x, y, z);

    // ================= ÇALGI-NESNELER (bando) · her biri ~1 birim boyunda, sonra küçültülür =================
    function teacup() {        // 1. satır (rakamlar): fincanlar — yüksek, çınlayan sesler
      const g = new THREE.Group();
      g.add(M(new THREE.CylinderGeometry(0.46, 0.4, 0.05, 28), T('paper'), 0, 0.03, 0));
      g.add(M(new THREE.CylinderGeometry(0.38, 0.25, 0.55, 28), pat('dots', ['paper', 'cool'], [3, 1]), 0, 0.33, 0));
      g.add(M(new THREE.TorusGeometry(0.14, 0.05, 8, 18), T('cool'), 0.4, 0.36, 0));
      g.add(M(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 28), T('wood'), 0, 0.59, 0));
      const steam = new THREE.Group(); steam.name = 'fx'; g.add(steam);
      [0.78, 0.95, 1.1].forEach((y, i) => steam.add(M(new THREE.SphereGeometry(0.07 + i * 0.015, 10, 8), T('paper'), Math.sin(i * 2) * 0.06, y, 0)));
      return g;
    }
    function kettle() {        // 2. satır (Q–P): çaydanlıklar — bakır üflemeliler
      const g = new THREE.Group();
      const body = M(new THREE.SphereGeometry(0.4, 24, 16), pat('stripe', ['warm', 'hot']), 0, 0.38, 0); body.scale.y = 0.85; g.add(body);
      const spout = M(new THREE.ConeGeometry(0.08, 0.42, 12), T('warm'), 0.42, 0.5, 0); spout.rotation.z = -1.0; g.add(spout);
      const handle = M(new THREE.TorusGeometry(0.26, 0.035, 8, 20, Math.PI), T('ink'), 0, 0.68, 0); g.add(handle);
      g.add(M(new THREE.SphereGeometry(0.08, 12, 8), T('hot'), 0, 0.73, 0));
      const lid = new THREE.Group(); lid.name = 'fx'; lid.position.y = 0.7; lid.add(M(new THREE.CylinderGeometry(0.17, 0.2, 0.05, 20), T('ink'), 0, 0, 0)); g.add(lid);
      return g;
    }
    function metronome() {     // 3. satır (A–L): metronomlar — tıkırdayan teller
      const g = new THREE.Group();
      const body = M(new THREE.ConeGeometry(0.36, 1.0, 4), pat('chevron', ['green', 'paper', 'ink']), 0, 0.5, 0); body.rotation.y = Math.PI / 4; g.add(body);
      g.add(M(new THREE.BoxGeometry(0.56, 0.08, 0.56), T('ink'), 0, 0.04, 0));
      const pend = new THREE.Group(); pend.name = 'fx'; pend.position.set(0, 0.16, 0.24); g.add(pend);
      pend.add(M(new THREE.BoxGeometry(0.03, 0.72, 0.03), T('ink'), 0, 0.36, 0));
      pend.add(M(new THREE.BoxGeometry(0.12, 0.1, 0.05), T('hot'), 0, 0.5, 0));
      return g;
    }
    function tincan() {        // 4. satır (Z–M): teneke kutular — davullar
      const g = new THREE.Group();
      g.add(M(new THREE.CylinderGeometry(0.3, 0.3, 0.72, 24), pat('ribs', ['gray', 'paper']), 0, 0.36, 0));
      g.add(M(new THREE.CylinderGeometry(0.305, 0.305, 0.3, 24), pat('zig', ['pink', 'paper'], [3, 1]), 0, 0.36, 0));
      const rim = M(new THREE.TorusGeometry(0.3, 0.025, 8, 24), T('ink'), 0, 0.72, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
      const sticks = new THREE.Group(); sticks.name = 'fx'; sticks.position.y = 0.76; g.add(sticks);
      [-1, 1].forEach((s) => { const st = M(new THREE.CylinderGeometry(0.018, 0.018, 0.6, 6), T('wood'), s * 0.12, 0.18, 0); st.rotation.z = s * 0.5; sticks.add(st); sticks.add(M(new THREE.SphereGeometry(0.045, 8, 6), T('hot'), s * 0.26, 0.42, 0)); });
      return g;
    }
    const FAM = [{ col: 'cool', shape: 'ball', make: teacup }, { col: 'warm', shape: 'ring', make: kettle }, { col: 'green', shape: 'cone', make: metronome }, { col: 'hot', shape: 'cube', make: tincan }];
    const SHAPE_GEO = { ball: new THREE.SphereGeometry(0.09, 12, 8), ring: new THREE.TorusGeometry(0.08, 0.032, 8, 18), cone: new THREE.ConeGeometry(0.09, 0.17, 4), cube: new THREE.BoxGeometry(0.14, 0.14, 0.14) };

    // ================= SAHNE: kendi yuvarlak sahnemiz (laboratuvarın sekizgen bandosu gizlenir) =================
    const deco = new THREE.Group(); group.add(deco);
    const lawn = M(new THREE.CylinderGeometry(18, 18, 0.06, 64), T('green'), 0, -0.05, 0); lawn.castShadow = false; deco.add(lawn);
    // dikdörtgen sahne: yanlar bantlı, üstü çizgili tahta
    const STAGE_D = STAGE_Z1 - STAGE_Z0, stageSide = pat('band', ['wood', 'hot', 'paper', 'warm'], [5, 1]);
    deco.add(M(new THREE.BoxGeometry(STAGE_W, TOP, STAGE_D), [stageSide, stageSide, pat('stripe', ['wood', 'warm'], [4, 3]), T('wood'), stageSide, stageSide], 0, TOP / 2, (STAGE_Z0 + STAGE_Z1) / 2));
    deco.add(M(new THREE.BoxGeometry(1.3, 0.12, 0.35), T('paper'), 0, 0.06, STAGE_Z1 + 0.27));          // basamak
    deco.add(M(new THREE.BoxGeometry(1.3, 0.24, 0.25), T('paper'), 0, 0.12, STAGE_Z1 + 0.1));
    // sahne önü ışıkları (gece yanar)
    const footBulbs = [];
    for (let i = 0; i < 11; i++) { const b = ctx.mesh(new THREE.SphereGeometry(0.045, 8, 6), ctx.flat('gray'), -2.0 + i * 0.4, TOP + 0.03, STAGE_Z1 - 0.06, false); deco.add(b); footBulbs.push(b); }

    // bando
    // kürsü: her nesne küçük, kare bir kürsünün üstünde durur (taban + gövde + tabla)
    const pedBase = new THREE.BoxGeometry(0.32, 0.04, 0.32), pedBody = new THREE.BoxGeometry(0.17, PED - 0.06, 0.17), pedTop = new THREE.BoxGeometry(0.29, 0.03, 0.29);
    const proto = FAM.map((f) => f.make());
    const live = [];
    ROWS.forEach((row, r) => [...row].forEach((ch, c) => {
      const x = (c - (row.length - 1) / 2) * PITCH + r * 0.06, z = ROWZ[r];
      const cap = new THREE.Group(); cap.position.set(x, TOP, z - 0.06);
      cap.add(M(pedBase, T('ink'), 0, 0.02, 0)); cap.add(M(pedBody, T(FAM[r].col), 0, 0.03 + (PED - 0.06) / 2, 0)); cap.add(M(pedTop, T('paper'), 0, PED - 0.015, 0));
      group.add(cap);
      const m = proto[r].clone(); m.position.set(x, TOP + PED, z - 0.06); m.rotation.y = (Math.sin(c * 7 + r) * 0.35);
      const size = 0.3 + ((c * 7 + r * 3) % 4) * 0.012; m.scale.setScalar(size); group.add(m);
      const note = ctx.mesh(SHAPE_GEO[FAM[r].shape], ctx.flat(FAM[r].col), 0, 0, 0, false); note.visible = false; group.add(note);
      live.push({ ch, r, c, x, z: z - 0.06, cap, m, fx: m.getObjectByName('fx'), size, note, start: -9, phase: (c * 1.7 + r) % 6, ry: m.rotation.y });
    }));

    // şef: eski radyo — yüzü seyirciye, anteni baget gibi sallanır, ön paneldeki 4 ışık çalan sıranın renginde yanar
    function grilleTex() {                                   // kubbedeki hoparlör bezi + iki göz
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
      x.fillStyle = C.warm; x.fillRect(0, 0, 128, 128); x.strokeStyle = C.wood; x.lineWidth = 4;
      for (let k = 8; k < 128; k += 12) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, 128); x.stroke(); }
      [46, 82].forEach((ex) => { x.fillStyle = C.ink; x.beginPath(); x.arc(ex, 88, 9, 0, 7); x.fill(); x.fillStyle = C.paper; x.beginPath(); x.arc(ex + 3, 85, 3, 0, 7); x.fill(); });
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    }
    function dialTex() {                                     // frekans camı: çizgiler ve sayılar
      const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
      x.fillStyle = C.paper; x.fillRect(0, 0, 256, 64); x.strokeStyle = C.ink; x.fillStyle = C.ink; x.lineWidth = 2;
      for (let k = 0; k <= 30; k++) { const px = 14 + k * 7.6; x.beginPath(); x.moveTo(px, 6); x.lineTo(px, k % 5 ? 16 : 24); x.stroke(); }
      x.font = 'bold 15px sans-serif'; x.textAlign = 'center'; [88, 92, 96, 100, 104, 108].forEach((f, i) => x.fillText(f, 14 + i * 38, 50));
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    }
    const maestro = new THREE.Group(); maestro.position.set(0, TOP, 1.6); maestro.scale.setScalar(0.5); group.add(maestro);
    const radio = new THREE.Group(); maestro.add(radio);                                  // gövde (zıplar / esner)
    radio.add(M(new THREE.BoxGeometry(1.1, 0.66, 0.42), T('hot'), 0, 0.55, 0));
    const dome = M(new THREE.CylinderGeometry(0.55, 0.55, 0.42, 32, 1, false, -Math.PI / 2, Math.PI), T('hot'), 0, 0.88, 0); dome.rotation.x = -Math.PI / 2; radio.add(dome);
    const grille = M(new THREE.CircleGeometry(0.45, 32, 0, Math.PI), new THREE.MeshToonMaterial({ map: grilleTex(), gradientMap: ctx.parts.LAMBERT }), 0, 0.88, 0.215); radio.add(grille);
    radio.add(M(new THREE.BoxGeometry(0.98, 0.04, 0.03), T('ink'), 0, 0.86, 0.215));     // kubbe ile panel arası çıta
    radio.add(M(new THREE.BoxGeometry(0.66, 0.2, 0.02), T('ink'), 0, 0.68, 0.212));
    radio.add(M(new THREE.PlaneGeometry(0.62, 0.16), new THREE.MeshToonMaterial({ map: dialTex(), gradientMap: ctx.parts.LAMBERT }), 0, 0.68, 0.224));
    const needle = M(new THREE.BoxGeometry(0.015, 0.15, 0.01), T('ink'), 0, 0.68, 0.232); radio.add(needle);
    const knobs = [-1, 1].map((s) => { const k = new THREE.Group(); k.position.set(s * 0.43, 0.68, 0.22); radio.add(k);
      const b = M(new THREE.CylinderGeometry(0.075, 0.085, 0.06, 16), T(s < 0 ? 'ink' : 'paper'), 0, 0, 0); b.rotation.x = Math.PI / 2; k.add(b);
      k.add(M(new THREE.BoxGeometry(0.02, 0.07, 0.02), T('paper'), 0, 0.035, 0.035)); return k; });
    const radioLights = FAM.map((f, r) => {                                               // her sıra için bir ışık (fincan, çaydanlık, metronom, teneke)
      const base = new THREE.Color(C[f.col]), dim = base.clone().lerp(new THREE.Color(C.ink), 0.65);
      const mat = new THREE.MeshBasicMaterial({ color: dim.clone() }); mat.userData.noAtlas = true;
      const m = M(new THREE.SphereGeometry(0.045, 12, 8), mat, (r - 1.5) * 0.17, 0.42, 0.215); m.userData.noOutline = true; radio.add(m);
      return { mat, base, dim, k: 0 };
    });
    radio.add(M(new THREE.BoxGeometry(1.16, 0.06, 0.46), T('ink'), 0, 0.22, 0));         // alt kaide
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => radio.add(M(new THREE.CylinderGeometry(0.04, 0.05, 0.2, 8), T('ink'), sx * 0.45, 0.1, sz * 0.15)));
    const baton = new THREE.Group(); baton.position.set(0.3, 1.3, -0.05); radio.add(baton); // anten = baget
    baton.add(M(new THREE.SphereGeometry(0.05, 10, 8), T('ink'), 0, 0, 0));
    baton.add(M(new THREE.CylinderGeometry(0.022, 0.022, 0.45, 6), T('gray'), 0, 0.22, 0));
    baton.add(M(new THREE.CylinderGeometry(0.013, 0.013, 0.45, 6), T('paper'), 0, 0.64, 0));
    baton.add(M(new THREE.SphereGeometry(0.04, 10, 8), T('hot'), 0, 0.88, 0));

    // ================= PERDE + SOLİST (perdeye tıkla: açılır, platformdaki gramofon solist görünür) =================
    const curtainMat = pat('bars', ['hot', 'paper'], [3, 1]);   // perdenin iki yarısı ortada biraz üst üste biner
    const halves = [-1, 1].map((s) => { const h = M(new THREE.BoxGeometry(2.55, 2.2, 0.08), curtainMat, s * 1.225, 1.1, BACK + s * 0.01); deco.add(h); return { h, s }; });
    deco.add(M(new THREE.BoxGeometry(5.3, 0.3, 0.16), pat('zig', ['cool', 'paper'], [4, 1]), 0, 2.3, BACK + 0.05));       // saçak
    [-1, 1].forEach((s) => { deco.add(M(new THREE.CylinderGeometry(0.06, 0.07, 2.6, 10), T('ink'), s * 2.6, 1.3, BACK)); deco.add(M(new THREE.SphereGeometry(0.11, 12, 8), T('warm'), s * 2.6, 2.65, BACK)); });
    const FLAGS = ['hot', 'warm', 'cool', 'green', 'pink'];
    for (let i = 0; i < 15; i++) { const f = M(new THREE.ConeGeometry(0.1, 0.22, 3), T(FLAGS[i % 5]), -2.45 + i * 0.35, 2.03 - Math.sin(i / 14 * Math.PI) * 0.12, BACK + 0.14); f.rotation.x = Math.PI; deco.add(f); }
    deco.add(M(new THREE.BoxGeometry(5.2, 2.6, 0.06), T('ink'), 0, 1.3, BACK - 1.0));                                     // arka duvar (perde açılınca)
    const SOLO_Z = BACK - 0.5;
    const backstage = new THREE.Group(); backstage.visible = false; deco.add(backstage);                                   // perde kapalıyken gizli
    backstage.add(M(new THREE.CylinderGeometry(0.6, 0.66, 0.26, 28), pat('stars', ['cool', 'warm']), 0, 0.13, SOLO_Z));     // platform
    backstage.add(M(new THREE.BoxGeometry(0.5, 0.12, 0.25), T('paper'), 0, 0.06, SOLO_Z + 0.68));
    const solo = new THREE.Group(); solo.position.set(0, 0.26, SOLO_Z); solo.scale.setScalar(1.05); backstage.add(solo);        // gramofon
    solo.add(M(new THREE.BoxGeometry(0.7, 0.32, 0.7), pat('checker', ['wood', 'ink'], [2, 2]), 0, 0.16, 0));
    const disc = M(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 28), pat('waves', ['ink', 'gray']), 0, 0.34, 0); solo.add(disc);
    const hornG = new THREE.Group(); hornG.position.set(0, 0.36, -0.1); solo.add(hornG);
    hornG.add(M(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), T('warm'), 0, 0.15, 0));
    const hornMat = new THREE.MeshToonMaterial({ color: new THREE.Color(C.warm), side: THREE.DoubleSide, gradientMap: ctx.parts.LAMBERT });
    const horn = M(new THREE.ConeGeometry(0.48, 0.9, 24, 1, true), hornMat, 0.2, 0.62, 0.25); horn.rotation.set(Math.PI + 0.8, 0, 0.55); hornG.add(horn);
    let curtainOpen = false, curtainK = 0, soloPulse = 0;

    // ================= SOKAK LAMBASI (tıkla ya da ↓: aç / kapa) =================
    const LAMP = new THREE.Vector3(-3.05, 0, -1.65);
    const lamp = new THREE.Group(); lamp.position.copy(LAMP); deco.add(lamp);
    lamp.add(M(new THREE.CylinderGeometry(0.12, 0.16, 0.12, 12), T('ink'), 0, 0.06, 0));
    lamp.add(M(new THREE.CylinderGeometry(0.045, 0.055, 2.3, 10), T('ink'), 0, 1.15, 0));
    const arm = M(new THREE.TorusGeometry(0.3, 0.03, 6, 16, Math.PI / 2), T('ink'), 0.3, 2.3, 0); arm.rotation.z = Math.PI / 2; lamp.add(arm);
    lamp.add(M(new THREE.ConeGeometry(0.2, 0.2, 6, 1, true), T('ink'), 0.6, 2.45, 0));
    const bulbOn = ctx.flat('warm'), bulbOff = ctx.flat('gray');
    const bulb = ctx.mesh(new THREE.SphereGeometry(0.1, 12, 8), bulbOff, 0.6, 2.33, 0, false); lamp.add(bulb);
    const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.warm), transparent: true, opacity: 0, depthWrite: false }); beamMat.userData.noAtlas = true;
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.3, 24, 1, true), beamMat); beam.position.set(0.6, 1.17, 0); beam.userData.noOutline = true; lamp.add(beam);
    const lampLight = new THREE.PointLight(new THREE.Color(C.warm), 0, 7, 1); lampLight.position.set(0.6 + LAMP.x, 2.2, LAMP.z); group.add(lampLight);
    const spot = new THREE.PointLight(new THREE.Color(C.warm), 0, 5, 1); spot.position.set(0, 2.4, 0.2); group.add(spot);   // sahneye düşen ışık
    let lampOn = false;
    // sahnenin genel ışıkları (koşucunun ekledikleri): gece kısılır
    const scene = ctx.root.parent, sceneLights = scene ? scene.children.filter((o) => o.isLight).map((l) => ({ l, base: l.intensity })) : [];


    // ================= BULUTLAR (notalar buradan yağar) =================
    const clouds = [[-2.35, 3.0, 0.45], [-1.5, 3.25, -0.15], [1.5, 3.2, -0.15], [2.35, 2.95, 0.45]].map(([x, y, z], i) => {   // ortası boş: perdenin arkasındaki solist görünsün
      const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(0.85); deco.add(g);
      [[0, 0, 0, 0.42], [0.42, -0.06, 0.05, 0.32], [-0.42, -0.08, 0, 0.3], [0.15, 0.22, -0.05, 0.3], [-0.2, 0.18, 0.08, 0.26]].forEach(([a, b, c, r]) => {
        const p = M(new THREE.SphereGeometry(r, 14, 10), T('paper'), a, b, c); p.scale.y = 0.75; p.castShadow = false; g.add(p); });
      return { g, x, y, z, phase: i * 1.3, puff: 0 };
    });
    function nearestCloud(x) { let best = clouds[0]; clouds.forEach((c) => { if (Math.abs(c.g.position.x - x) < Math.abs(best.g.position.x - x)) best = c; }); return best; }

    // ================= İNSANLAR: bu proje için üretilmiş karakterler (tariflerden) =================
    const BODIES = ['bell', 'column', 'hourglass', 'bottle', 'cone', 'barrel', 'pear', 'ghost'], HEADS = ['ball', 'drop', 'cat', 'owl', 'acorn', 'box', 'flat'];
    const PATS = ['stripe', 'dots', 'checker', 'zig', 'waves', 'diag', 'bars', 'stars'], COLS = ['hot', 'warm', 'cool', 'pink', 'green', 'wood', 'ink', 'paper'];
    const HATS = ['cone', 'top', 'beret', 'cap', 'sun', 'crown', 'pompom', 'antenna', 'chef', 'sailor'], EYES = ['ring', 'dot', 'wide', 'sleepy', 'wink'];
    function person(i) {
      const a = spick(COLS); let b = spick(COLS); if (b === a) b = 'paper';
      return ctx.parts.build({ id: 'ro.fan.' + i, parts: { body: { shape: spick(BODIES), paint: { pattern: spick(PATS), colors: [a, b] } }, neck: { height: 0.05 },
        head: { shape: spick(HEADS), paint: { color: spick(['paper', 'pink', 'wood', 'warm']) } }, face: { eyes: spick(EYES), cheeks: srnd() < 0.5, mouth: spick(['smile', 'o', 'line']) },
        arms: { type: 'pegs', pose: srnd() < 0.3 ? 'up' : 'front' }, hat: { type: spick(HATS), paint: { color: spick(COLS) } }, extras: srnd() < 0.3 ? ['scarf'] : [] }, motion: { personality: spick(['calm', 'bouncy', 'jittery']) } }, C);
    }
    // oturma düzeni: sahnenin iki yanında, sahneye dönük üçer sıra bank · her bankta 5 yer (önce sahneye en yakın yerler dolar)
    const seats = [];
    [-1, 1].forEach((sd) => [0, 1, 2].forEach((col) => {
      const x = sd * (2.8 + col * 0.5);
      deco.add(M(new THREE.BoxGeometry(0.3, 0.16, 3.1), T('wood'), x, 0.08, 0.25));
      deco.add(M(new THREE.BoxGeometry(0.05, 0.22, 3.1), T('ink'), x + sd * 0.14, 0.2, 0.25));            // sırt dayanağı
      for (let j = 0; j < 5; j++) seats.push({ x, z: -0.95 + j * 0.6, rot: sd > 0 ? -Math.PI / 2 : Math.PI / 2, taken: null, pri: col * 10 + Math.abs(j - 2) * 2 + (sd > 0 ? 1 : 0) });
    }));
    seats.sort((a, b) => a.pri - b.pri);
    // festival gezginleri: dolaşır, tezgâhlara bakar · orkestra çalınca bazıları gelip oturur
    const people = Array.from({ length: 26 }, (_, i) => { const o = person(i); o.root.scale.setScalar(0.3); deco.add(o.root); return { o, state: 'wander', seat: null, joiner: false, tx: 0, tz: 0, wait: 0, phase: i * 0.9 }; });
    function wanderTarget(p) {
      for (let n = 0; n < 30; n++) {
        const a = Math.random() * Math.PI * 2, R = 4.7 + Math.random() * 2.8, x = R * Math.sin(a), z = R * Math.cos(a);
        if (z < -3.3 && Math.abs(x) < 3.2) continue;                                            // perdenin arkasına gitme
        p.tx = x; p.tz = z; return;
      }
    }
    const BASE_SEATED = 6;                                                                       // çalmazken yalnızca birkaç kişi oturur
    people.forEach((p, k) => {
      if (k < BASE_SEATED) { const st = seats[k]; st.taken = p; p.seat = st; p.state = 'seated'; p.o.root.position.set(st.x, 0.16, st.z); p.o.root.rotation.y = st.rot; return; }
      wanderTarget(p); p.o.root.position.set(p.tx, 0, p.tz); wanderTarget(p); p.wait = Math.random() * 2;
    });

    // ================= FESTİVAL ALANI · tezgâhlar, ışık zinciri, fenerler, balonlar, piknik masaları, dönme dolap, giriş kemeri =================
    const fest = new THREE.Group(); deco.add(fest);
    const ring = (R, a) => [R * Math.sin(a), R * Math.cos(a)];          // a = 0: kameraya bakan ön taraf
    const faceIn = (o, x, z) => { o.rotation.y = Math.atan2(-x, -z); };  // sahneye dönük
    const STALL_COLS = ['hot', 'cool', 'green', 'warm', 'pink', 'hot', 'cool', 'warm'];
    [0.95, 1.35, 1.75, 2.35, -0.95, -1.35, -1.75, -2.35].forEach((a, i) => {
      const [x, z] = ring(6.3 + (i % 2) * 0.5, a), st = new THREE.Group(); st.position.set(x, 0, z); faceIn(st, x, z); fest.add(st);
      st.add(M(new THREE.BoxGeometry(1.1, 0.5, 0.5), T('paper'), 0, 0.25, 0.15));
      st.add(M(new THREE.BoxGeometry(1.12, 0.06, 0.52), T(STALL_COLS[i]), 0, 0.52, 0.15));
      [[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.38], [0.5, 0.38]].forEach(([px, pz]) => st.add(M(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6), T('ink'), px, 0.55, pz)));
      const roof = M(new THREE.ConeGeometry(0.85, 0.42, 4, 1), pat('bars', [STALL_COLS[i], 'paper'], [4, 1]), 0, 1.3, 0.09); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.65); st.add(roof);
      st.add(M(new THREE.BoxGeometry(0.6, 0.18, 0.04), T(STALL_COLS[(i + 2) % 8]), 0, 0.95, 0.42));
    });
    // ışık zinciri: direkler arasında sarkan renkli ampuller
    const BULBS = ['warm', 'hot', 'cool', 'pink', 'green'].map((k) => ctx.flat(k)), bulbGeo = new THREE.SphereGeometry(0.045, 8, 6);
    const POLES = [0.55, 0.95, 1.35, 1.75, 2.15, 2.55, -2.55, -2.15, -1.75, -1.35, -0.95, -0.55].map((a) => ring(5.05, a));
    POLES.forEach(([x, z]) => { fest.add(M(new THREE.CylinderGeometry(0.035, 0.045, 1.8, 8), T('ink'), x, 0.9, z)); fest.add(M(new THREE.SphereGeometry(0.06, 8, 6), T('warm'), x, 1.83, z)); });
    for (let i = 0; i < POLES.length - 1; i++) {
      const [x0, z0] = POLES[i], [x1, z1] = POLES[i + 1];
      if (Math.hypot(x1 - x0, z1 - z0) > 2.6) continue;
      for (let k = 1; k < 8; k++) { const u = k / 8, sag = Math.sin(u * Math.PI) * 0.28;
        fest.add(ctx.mesh(bulbGeo, BULBS[(i + k) % 5], x0 + (x1 - x0) * u, 1.78 - sag, z0 + (z1 - z0) * u, false)); }
    }
    // fenerler: gece kendiliğinden yanar
    const postBulbs = [];
    [[-4.4, 1.6], [4.4, 1.6], [-4.3, -2.4], [4.3, -2.4], [-2.4, 4.9], [2.4, 4.9]].forEach(([x, z]) => {
      fest.add(M(new THREE.CylinderGeometry(0.035, 0.045, 1.5, 8), T('ink'), x, 0.75, z));
      const hb = ctx.mesh(new THREE.SphereGeometry(0.11, 12, 8), bulbOff, x, 1.58, z, false); fest.add(hb); postBulbs.push(hb);
    });
    // gece ışıkları: tezgâhların ve sahnenin önünü aydınlatır
    const festLights = [[-5.8, 3.6, 'warm'], [5.8, 3.4, 'pink'], [-6.4, -2.6, 'cool'], [6.4, -2.8, 'warm'], [0, 6.2, 'hot']].map(([x, z, k]) => {
      const L = new THREE.PointLight(new THREE.Color(C[k]), 0, 5.5, 1); L.position.set(x, 1.7, z); group.add(L); return L; });
    const footLight = new THREE.PointLight(new THREE.Color(C.warm), 0, 4.5, 1); footLight.position.set(0, 1.3, STAGE_Z1 + 0.7); group.add(footLight);
    // balon demetleri
    const balloons = [];
    [[-5.4, 2.7], [5.5, 2.5], [-6.9, -1.6], [6.8, -2.2], [-4.6, 5.6], [4.7, 5.4]].forEach(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); fest.add(g);
      g.add(M(new THREE.CylinderGeometry(0.008, 0.008, 1.5, 4), T('ink'), 0, 0.75, 0));
      [[0, 1.65, 0, 'hot'], [0.16, 1.55, 0.06, 'cool'], [-0.15, 1.58, -0.05, 'warm']].forEach(([bx, by, bz, k]) => { const b = M(new THREE.SphereGeometry(0.15, 14, 10), T(k), bx, by, bz); b.scale.y = 1.18; g.add(b); });
      balloons.push({ g, phase: i * 1.1 });
    });
    // piknik masaları
    [[-6.0, 4.3], [6.2, 4.1], [-7.8, 0.8], [7.8, 0.4]].forEach(([x, z]) => {
      const tb = new THREE.Group(); tb.position.set(x, 0, z); faceIn(tb, x, z); fest.add(tb);
      tb.add(M(new THREE.BoxGeometry(0.9, 0.05, 0.45), T('wood'), 0, 0.42, 0));
      [-1, 1].forEach((sd) => { tb.add(M(new THREE.BoxGeometry(0.9, 0.04, 0.16), T('wood'), 0, 0.24, sd * 0.38)); tb.add(M(new THREE.BoxGeometry(0.05, 0.42, 0.5), T('ink'), sd * 0.38, 0.21, 0)); });
    });
    // dönme dolap (arka solda, yavaşça döner)
    const wheel = new THREE.Group(); wheel.position.set(-6.6, 2.25, -6.9); wheel.rotation.y = 0.5; fest.add(wheel);
    [-1, 1].forEach((sd) => { [0.35, -0.35].forEach((lz) => { const leg = M(new THREE.BoxGeometry(0.08, 2.5, 0.08), T('ink'), sd * 0.7, -1.1, lz); leg.rotation.z = sd * 0.28; wheel.add(leg); }); });
    const rotor = new THREE.Group(); wheel.add(rotor);
    rotor.add(M(new THREE.TorusGeometry(1.7, 0.05, 8, 48), T('hot'), 0, 0, 0));
    rotor.add(M(new THREE.TorusGeometry(1.1, 0.03, 6, 40), T('warm'), 0, 0, 0));
    const hub = M(new THREE.CylinderGeometry(0.14, 0.14, 0.2, 16), T('ink'), 0, 0, 0); hub.rotation.x = Math.PI / 2; rotor.add(hub);
    const cabins = [];
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2;
      const sp = M(new THREE.BoxGeometry(0.035, 1.7, 0.035), T('ink'), Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0); sp.rotation.z = a - Math.PI / 2; rotor.add(sp);
      const cab = M(new THREE.BoxGeometry(0.3, 0.26, 0.26), T(['cool', 'pink', 'green', 'warm', 'hot'][k % 5]), Math.cos(a) * 1.7, Math.sin(a) * 1.7 - 0.18, 0); rotor.add(cab); cabins.push(cab); }
    // giriş kemeri: "ROOM FEST"
    function signTex(text) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 96; const x = c.getContext('2d');
      x.fillStyle = C.hot; x.fillRect(0, 0, 512, 96); x.fillStyle = C.paper; x.font = '600 58px "Space Grotesk", "DM Sans", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 52);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    }
    const arch = new THREE.Group(); arch.position.set(0, 0, 7.2); fest.add(arch);
    [-1, 1].forEach((sd) => { arch.add(M(new THREE.CylinderGeometry(0.09, 0.11, 2.4, 10), pat('stripe', ['hot', 'paper'], [1, 4]), sd * 1.5, 1.2, 0)); arch.add(M(new THREE.SphereGeometry(0.14, 12, 8), T('warm'), sd * 1.5, 2.45, 0)); });
    arch.add(M(new THREE.BoxGeometry(3.2, 0.5, 0.1), new THREE.MeshToonMaterial({ map: signTex('ROOM FEST'), gradientMap: ctx.parts.LAMBERT }), 0, 2.15, 0));

    // ================= DOĞA · dere (arkadan sağa kıvrılır), kıyı taşları, çiçek tarhları, çalılar, ağaçlar =================
    const streamPts = [[-15, -8.6], [-10, -10.2], [-5, -9.3], [0, -10.3], [5, -9.1], [9.2, -6.2], [10.6, -1.6], [11.3, 3.2], [13.2, 8.5]].map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(streamPts), streamSamples = curve.getSpacedPoints(90);
    const nearStream = (x, z, d = 1.2) => streamSamples.some((q) => Math.hypot(q.x - x, q.z - z) < d);
    { const N = 180, pos = [], idx = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, q = curve.getPointAt(u), tg = curve.getTangentAt(u), L = Math.hypot(tg.x, tg.z) || 1, w = 0.55 * (0.85 + 0.25 * Math.sin(u * 17));
        pos.push(q.x - tg.z / L * w, -0.004, q.z + tg.x / L * w, q.x + tg.z / L * w, -0.004, q.z - tg.x / L * w);
        if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx); sg.computeVertexNormals();
      const water = M(sg, new THREE.MeshToonMaterial({ color: new THREE.Color('#5d9bd6'), side: THREE.DoubleSide, gradientMap: ctx.parts.LAMBERT }), 0, 0, 0); water.castShadow = false; fest.add(water);
    }
    const tmp = new THREE.Object3D();
    const stones = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), T('gray'), 110);
    for (let i = 0; i < 110; i++) {
      const u = Math.min(1, (i + srnd() * 0.6) / 110), q = curve.getPointAt(u), tg = curve.getTangentAt(u), L = Math.hypot(tg.x, tg.z) || 1, sd = i % 2 ? 1 : -1, off = 0.66 + srnd() * 0.18;
      tmp.position.set(q.x - tg.z / L * off * sd, 0.02, q.z + tg.x / L * off * sd); tmp.rotation.set(0, srnd() * 3, 0); tmp.scale.set(1 + srnd(), 0.6, 1 + srnd() * 0.6); tmp.updateMatrix(); stones.setMatrixAt(i, tmp.matrix);
    }
    stones.castShadow = stones.receiveShadow = true; fest.add(stones);
    // küçük köprü (derenin arkadaki kıvrımında)
    { const bq = curve.getPointAt(0.42), bt = curve.getTangentAt(0.42), br = new THREE.Group(); br.position.set(bq.x, 0, bq.z); br.rotation.y = Math.atan2(bt.x, bt.z) + Math.PI / 2; fest.add(br);
      br.add(M(new THREE.BoxGeometry(0.6, 0.06, 1.7), T('wood'), 0, 0.14, 0)); [-1, 1].forEach((sd) => br.add(M(new THREE.BoxGeometry(0.04, 0.22, 1.7), T('hot'), sd * 0.3, 0.26, 0))); }
    // çiçek tarhları (tek seferde çizilen örnekli ağlar: hızlı)
    const FLOWER_COLS = ['hot', 'warm', 'pink', 'cool', 'paper'].map((k) => new THREE.Color(C[k]));
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), T('paper'), 320), stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), T('green'), 320);
    let nf = 0;
    for (let c = 0; c < 60 && nf < 320; c++) {
      let cx = 0, cz = 0;
      for (let n = 0; n < 40; n++) { const a = srnd() * Math.PI * 2, R = 4.4 + srnd() * 9; cx = R * Math.sin(a); cz = R * Math.cos(a);
        if (!nearStream(cx, cz, 1.0) && !(Math.abs(cx) < 4.3 && cz > -3.4 && cz < 3.2)) break; }
      const k = 4 + Math.floor(srnd() * 4), col = FLOWER_COLS[c % 5];
      for (let j = 0; j < k && nf < 320; j++, nf++) {
        const x = cx + (srnd() - 0.5) * 0.7, z = cz + (srnd() - 0.5) * 0.7;
        tmp.position.set(x, 0.08, z); tmp.rotation.set(0, 0, 0); tmp.scale.set(1, 1, 1); tmp.updateMatrix(); stems.setMatrixAt(nf, tmp.matrix);
        tmp.position.y = 0.17; tmp.updateMatrix(); heads.setMatrixAt(nf, tmp.matrix); heads.setColorAt(nf, col);
      }
    }
    heads.count = stems.count = nf; fest.add(stems, heads);
    // çalılar ve ağaçlar (dereye ve alana taşmadan)
    const leafA = T('#5e8f4e'), leafB = T('#7fb069'), trunkM = T('wood');
    for (let i = 0; i < 70; i++) {
      const a = srnd() * Math.PI * 2, R = (i < 30 ? 7.4 : 8.6) + srnd() * 5, x = R * Math.sin(a), z = R * Math.cos(a) - 0.5, sc = 0.7 + srnd() * 0.7;
      if (nearStream(x, z, 1.3)) continue;
      const tr = new THREE.Group(); tr.position.set(x, 0, z); tr.scale.setScalar(sc); fest.add(tr);
      const kind = srnd();
      if (i < 30 && kind < 0.6) { tr.add(M(new THREE.SphereGeometry(0.32, 12, 8), leafB, 0, 0.22, 0)); tr.add(M(new THREE.SphereGeometry(0.24, 10, 8), leafA, 0.3, 0.16, 0.05)); }   // çalı
      else if (kind < 0.65) { tr.add(M(new THREE.CylinderGeometry(0.07, 0.1, 0.7, 8), trunkM, 0, 0.35, 0)); tr.add(M(new THREE.SphereGeometry(0.42, 14, 10), srnd() < 0.5 ? leafA : leafB, 0, 0.95, 0)); tr.add(M(new THREE.SphereGeometry(0.3, 12, 8), leafB, 0.18, 1.25, 0.05)); }
      else { tr.add(M(new THREE.ConeGeometry(0.38, 1.2, 10), leafA, 0, 0.75, 0)); tr.add(M(new THREE.CylinderGeometry(0.06, 0.07, 0.2, 6), trunkM, 0, 0.1, 0)); }
    }

    // ================= NOTA YAĞMURU (Letter Rain'den: harfler yerine bulutlardan notalar) =================
    const texCache = {};
    function noteTex(r, n) {
      const k = r + '-' + n; if (texCache[k]) return texCache[k];
      const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d');
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.strokeStyle = C.paper;
      x.font = 'bold 64px "Segoe UI Symbol", "Noto Music", "DejaVu Sans", serif'; x.lineWidth = 10; x.strokeText('♪', 48, 38); x.fillStyle = C[FAM[r].col]; x.fillText('♪', 48, 38);
      x.font = 'bold 26px monospace'; x.lineWidth = 7; x.strokeText(NOTE_NAMES[n], 48, 82); x.fillStyle = C.ink; x.fillText(NOTE_NAMES[n], 48, 82);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (texCache[k] = t);
    }
    const RAIN_MAX = 180, rain = [];
    for (let i = 0; i < RAIN_MAX; i++) {
      const mat = new THREE.SpriteMaterial({ map: noteTex(i % 4, i % 5), transparent: true, depthWrite: false }); mat.userData.noAtlas = true;
      const s = new THREE.Sprite(mat); s.visible = false; s.userData.noOutline = true; s.scale.set(0.3, 0.3, 1); group.add(s);
      rain.push({ s, mode: 'off', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 0, wob: Math.random() * 6 });
    }
    let rainNext = 0, nRain = 0, lastAct = -9;
    const onStage = (x, z) => Math.abs(x) < STAGE_W / 2 - 0.05 && z > STAGE_Z0 + 0.05 && z < STAGE_Z1 - 0.05;
    // nota bulutun altından çıkar ve süzülerek hedefin (x, z) üstüne iner · delay: art arda akış için bekleme
    function drop(r, n, x, z, y, delay = 0) {
      const d = rain[rainNext]; rainNext = (rainNext + 1) % RAIN_MAX;
      d.s.material.map = noteTex(r, n);
      if (y != null) { Object.assign(d, { mode: 'fall', x, y, z, vx: 0, vy: -rnd(0.6, 1.1) * D.fallSpeed, vz: 0, age: 0, wait: 0, cloud: null }); return d; }
      const c = nearestCloud(x), cp = c.g.position, sx = cp.x + rnd(-0.35, 0.35), sz = cp.z + rnd(-0.12, 0.12), sy = cp.y - 0.22;
      const vy = -rnd(0.7, 1.1) * D.fallSpeed, floor = onStage(x, z) ? TOP + 0.08 : 0.08, T = Math.max(0.3, (sy - floor) / -vy);
      Object.assign(d, { mode: delay > 0 ? 'wait' : 'fall', wait: delay, x: sx, y: sy, z: sz, vx: (x - sx) / T, vz: (z - sz) / T, vy, age: 0, cloud: c });
      if (!delay) c.puff = 1;
      return d;
    }
    // KURAL: bir çalgı → 5–6 nota, bazen 7–8 (o çalgının notası)
    function rainForKey(l) {
      const n = Math.random() < 0.7 ? D.keyRain + Math.floor(Math.random() * 2) : D.keyRain + 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) drop(l.r, l.c % 5, l.x + rnd(-0.3, 0.3), l.z + rnd(-0.2, 0.2), null, i * 0.08);
    }
    // KURAL: bütün satır → 10–15 nota (satırın notalarından)
    function rainForRow(hit) {
      const row = live.filter((l) => l.r === hit.r), n = D.rowRain + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) { const l = pick(row); drop(l.r, l.c % 5, l.x + rnd(-0.2, 0.2), l.z + rnd(-0.3, 0.3), null, i * 0.05); }
    }
    // KURAL: bütün bando → yağan bütün notalar patlama gibi etrafa savrulur (+ ortadan yeni notalar fırlar)
    function fling(d, from, power) {
      let dx = d.x - from.x, dz = d.z - from.z, L = Math.hypot(dx, dz);
      if (L < 0.05) { const a = Math.random() * Math.PI * 2; dx = Math.cos(a); dz = Math.sin(a); L = 1; }
      const v = power * rnd(0.7, 1.3);
      Object.assign(d, { mode: 'fly', vx: dx / L * v, vz: dz / L * v, vy: rnd(1.5, 3.2), age: 0 });
    }
    function explode(hit) {
      rain.forEach((d) => { if (d.mode !== 'off') fling(d, hit, D.burst); });
      for (let i = 0; i < 14; i++) fling(drop(Math.floor(Math.random() * 4), Math.floor(Math.random() * 5), hit.x + rnd(-0.1, 0.1), hit.z + rnd(-0.1, 0.1), TOP + 0.4), hit, D.burst);
      cheerUntil = nowT + 1.6;
    }
    function rainFrame(t, dt) {
      if (t - lastAct > 1.5 && D.idleRain > 0 && Math.random() < D.idleRain * dt) { const l = pick(live); drop(l.r, l.c % 5, rnd(-1.7, 1.7), rnd(-1.3, 1.4)); } // kimse çalmazken
      nRain = 0;
      rain.forEach((d) => {
        if (d.mode === 'off') { d.s.visible = false; return; }
        if (d.mode === 'wait') { d.s.visible = false; d.wait -= dt; if (d.wait <= 0) { d.mode = 'fall'; if (d.cloud) d.cloud.puff = 1; } return; }   // sırasını bekliyor
        d.age += dt; let alpha = 1;
        if (d.mode === 'fall') {
          d.y += d.vy * dt; d.x += d.vx * dt + Math.sin(t * 2 + d.wob) * 0.12 * dt; d.z += d.vz * dt;   // buluttan hedefe doğru akar
          const floor = onStage(d.x, d.z) ? TOP + 0.08 : 0.08;
          if (d.y <= floor) { d.y = floor; d.mode = 'rest'; d.age = 0; }
          alpha = Math.min(1, d.age * 4); nRain++;                     // buluttan çıkarken belirir
        } else if (d.mode === 'rest') {
          alpha = Math.max(0, 1 - Math.max(0, d.age - 2) / 0.8); if (alpha <= 0) d.mode = 'off';
        } else if (d.mode === 'fly') {
          d.vy -= 5 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
          alpha = Math.max(0, 1 - d.age / 1.6); if (alpha <= 0 || d.y < -0.5) d.mode = 'off';
        }
        d.s.position.set(d.x, d.y + 0.15, d.z);
        d.s.material.opacity = alpha; d.s.visible = d.mode !== 'off';
        const sc = 0.3 * (d.mode === 'fly' ? 1 + Math.min(0.4, d.age) : 1); d.s.scale.set(sc, sc, 1);
      });
    }

    // ================= ODA (Context) =================
    const room = { source: null, manual: 'quiet', raw: 0, level: 0, state: 'quiet' };
    let stream = null, analyser = null, buf = null, soundingUntil = 0, cheerUntil = 0;
    let agency = D.inQuiet, pending = agency, pendingSince = 0;
    let audio = null, notes = 0, nowT = 0;

    async function startMic() {
      try {
        const a = ctx.audio();
        if (!stream) stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false } });
        if (!analyser) { analyser = a.createAnalyser(); analyser.fftSize = 1024; buf = new Float32Array(analyser.fftSize); a.createMediaStreamSource(stream).connect(analyser); } // hoparlöre bağlı değil: yankı yok
        room.source = 'mic'; ctx.playing(true); ctx.renderTexts();
      } catch (err) {
        ctx.overlay(Object.assign({}, choices(), { error: 'Microphone not available (' + err.name + '). Use SPACE to set the room by hand, or open the page over https.' }));
      }
    }
    function useKeys() { room.source = 'keys'; ctx.audio(); ctx.playing(true); ctx.renderTexts(); }
    function stopMic() { if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; analyser = null; if (room.source === 'mic') room.source = null; }
    const choices = () => ({ title: 'This sketch can listen to the room.', text: 'The loudness of the room decides how far your keys reach. The sound stays in this browser: nothing is recorded or sent.', choices: [['LISTEN TO THE ROOM', startMic], ['USE THE SPACE KEY INSTEAD', useKeys]] });

    function readRoom(dt) {
      if (room.source === 'mic' && analyser) {
        const hearingOurselves = D.ignoreOwnSound && nowT < soundingUntil;
        if (!hearingOurselves) {
          analyser.getFloatTimeDomainData(buf);
          let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          room.raw = Math.min(1, Math.sqrt(sum / buf.length) * D.micSensitivity);
        }
      } else if (room.source === 'keys') room.raw = PRESET[room.manual];
      room.level += (room.raw - room.level) * Math.min(1, dt * FOLLOW);
    }
    // 3) KURAL (Context): bu nasıl bir oda?
    function roomStateFor(level) {
      if (level < D.quietBelow) return 'quiet';
      if (level > D.loudAbove) return 'loud';
      return 'busy';
    }
    // Context ile Agency burada buluşur: oda, kontrolü belirler (ama ancak modeHold kadar sürerse)
    function updateAgency(t) {
      const was = room.state; room.state = roomStateFor(room.level);
      if (room.state !== was) ctx.renderTexts();
      const want = { quiet: D.inQuiet, busy: D.inBusy, loud: D.inLoud }[room.state];
      if (want !== pending) { pending = want; pendingSince = t; }
      if (want !== agency && t - pendingSince >= D.modeHold) { agency = want; ctx.renderTexts(); ctx.bump('agency'); ctx.flash(1); }
    }

    // ses: satır = aile (tını, oktav) · sütun = nota · soldaki tuş soldan duyulur
    const freqOf = (l) => [523, 262, 196, 110][l.r] * Math.pow(2, PENTA[l.c % PENTA.length] / 12);
    function sound(l) {
      if (!D.sound || !(audio = ctx.audio())) return;
      const t = audio.currentTime + 0.08, f = freqOf(l);
      const g = audio.createGain(); g.connect(audio.destination);
      const pan = audio.createStereoPanner(); pan.pan.value = Math.max(-1, Math.min(1, (l.c - 4.5) / 6)); pan.connect(g);
      const o = audio.createOscillator(); let tail = 0.6;
      if (l.r === 0) { o.type = 'sine'; o.frequency.value = f; o.connect(pan); tail = 1.2; const o2 = audio.createOscillator(); o2.frequency.value = f * 2.76; o2.connect(pan); o2.start(t); o2.stop(t + 0.4); }
      else if (l.r === 1) { o.type = 'sawtooth'; o.frequency.value = f; const lp = audio.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, t); lp.frequency.linearRampToValueAtTime(1400, t + 0.08); o.connect(lp); lp.connect(pan); tail = 0.5; }
      else if (l.r === 2) { o.type = 'triangle'; o.frequency.value = f; o.connect(pan); tail = 0.8; }
      else { o.type = 'sine'; o.frequency.setValueAtTime(f * 2, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.15); o.connect(pan); tail = 0.3; }
      const peak = agency === 'single' ? 0.04 : agency === 'group' ? 0.08 : 0.18; // çok kişi çalınca kısılsın
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + tail * D.life);
      o.start(t); o.stop(t + tail * D.life + 0.05);
    }
    // solist (gramofon): perde açıkken her eyleme bir beşli üstten, yumuşak bir kare dalgayla eşlik eder
    function soloSing(f, delay = 0.12) {
      soloPulse = 1;
      for (let i = 0; i < 3; i++) { const d = drop(Math.floor(Math.random() * 4), Math.floor(Math.random() * 5), rnd(-0.2, 0.2), SOLO_Z + 0.3, 1.5); fling(d, { x: 0, z: SOLO_Z - 1 }, 0.8); d.vy = rnd(1.2, 2); }
      if (!D.sound || !(audio = ctx.audio())) return;
      const t = audio.currentTime + delay, g = audio.createGain(), lp = audio.createBiquadFilter(), o = audio.createOscillator();
      o.type = 'square'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.01, t + 0.4);
      lp.type = 'lowpass'; lp.frequency.value = 1800; o.connect(lp); lp.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + 0.9 * D.life);
      o.start(t); o.stop(t + 0.9 * D.life + 0.05);
    }
    function toggleCurtain() {
      curtainOpen = !curtainOpen; ctx.flash(3);
      if (curtainOpen) [0, 2, 4].forEach((k, i) => setTimeout(() => soloSing(523 * Math.pow(2, PENTA[k] / 12), 0), i * 160)); // açılış fanfarı
    }
    function toggleLamp() { lampOn = !lampOn; bulb.material = lampOn ? bulbOn : bulbOff; if (bulb.userData.style) bulb.userData.style.mat = bulb.material; ctx.flash(3); }

    // 4) KURAL (Agency): kim çalacak?
    function ruleFor(hit) { return agency === 'full' ? [hit] : agency === 'group' ? live.filter((l) => l.r === hit.r) : live; }
    function act(hit) {
      let last = 0;
      ruleFor(hit).forEach((l) => { const d = (Math.abs(l.c - hit.c) + Math.abs(l.r - hit.r)) * D.stagger; last = Math.max(last, d); l.start = nowT + d; notes++; ctx.schedule(() => sound(l), d * 1000); });
      soundingUntil = Math.max(soundingUntil, nowT + last + 1.2 * D.life + 0.3); // bando bu ana kadar çalıyor
      if (agency === 'single') explode(hit); else if (agency === 'group') rainForRow(hit); else rainForKey(hit);
      if (curtainOpen) soloSing(freqOf(hit) * 1.5);
      lastAct = nowT;
      ctx.flash(2);
    }
    function setRoomByHand() {
      const from = room.source === 'keys' ? room.manual : room.state;   // şu anki odadan bir sonrakine
      room.manual = ROOMS[(ROOMS.indexOf(from) + 1) % 3];
      room.source = 'keys'; ctx.bump('room'); ctx.renderTexts();
    }

    // ekranda bir noktaya tıklandı mı? (lamba gibi nesneler için)
    // ================= YAKINLAŞTIRMA: tekerlek yukarı = uzaklaş (çevre görünür), aşağı = yakınlaş · klavye: − / + =================
    const ZOOM_MIN = 1.1, ZOOM_MAX = 3.4; let zoom = 2.35, zoomTarget = zoom;
    const setZoom = (z) => { zoomTarget = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)); };
    ctx.out.addEventListener('wheel', (e) => { if (document.body.dataset.tab !== 'play') return; e.preventDefault(); setZoom(zoomTarget * Math.exp(e.deltaY * 0.0015)); }, { passive: false });
    const v3 = new THREE.Vector3();
    function nearOnScreen(e, local, px) {
      const r = ctx.out.getBoundingClientRect(); v3.copy(ctx.world(local)).project(ctx.cam);
      return Math.hypot((v3.x * 0.5 + 0.5) * r.width + r.left - e.clientX, (-v3.y * 0.5 + 0.5) * r.height + r.top - e.clientY) < px;
    }

    // Lasseter: hazırlık (çömel) → eylem (fırla, uza) → yay + takip → oturma (sönümlü yay)
    const springy = (u, amp, k = 9, w = 18) => 1 - amp * Math.exp(-u * k) * Math.cos(u * w);
    function bodyAt(u) {
      if (u < 0) return { sy: 1, jump: 0, lean: 0 };
      if (u < 0.08) { const k = u / 0.08, e = 1 - (1 - k) ** 2; return { sy: 1 - 0.28 * e, jump: 0, lean: -0.22 * e }; }
      if (u < 0.2) { const k = (u - 0.08) / 0.12; return { sy: 0.72 + 0.58 * k, jump: 0.16 * Math.sin(k * Math.PI / 2), lean: -0.22 + 0.36 * k }; }
      if (u < 0.45) { const k = (u - 0.2) / 0.25; return { sy: 1.3 - 0.18 * k, jump: 0.16 * (1 - k * k), lean: 0.14 * (1 - k) }; }
      return { sy: springy(u - 0.45, 0.24), jump: 0, lean: 0 };
    }
    function pose(l, t) {
      let u = t - l.start; if (u < 0 || u > 1.6) u = -1;
      const b = bodyAt(u), breathe = u < 0 ? Math.sin(t * 2.2 + l.phase) * 0.025 : 0, sy = b.sy + breathe, sx = 1 / Math.sqrt(sy);
      l.m.scale.set(l.size * sx, l.size * sy, l.size * sx); l.m.position.y = TOP + PED + b.jump; l.m.rotation.x = b.lean;
      l.m.rotation.y = l.ry + (u >= 0 && u < 0.5 ? Math.sin(u * 30) * 0.08 : 0);
      if (l.fx) { const on = u >= 0 && u < 1.2, k = on ? Math.exp(-u * 2.5) : 0;      // nesnenin kendi hareketi
        if (l.r === 0) { l.fx.position.y = on ? u * 0.4 : 0; l.fx.visible = on; }                 // fincan: buhar yükselir
        else if (l.r === 1) l.fx.position.y = 0.7 + k * Math.abs(Math.sin(u * 40)) * 0.12;          // çaydanlık: kapak tıkırdar
        else if (l.r === 2) l.fx.rotation.z = Math.sin(t * (on ? 9 : 2) + l.phase) * (0.12 + k * 0.5); // metronom: sarkaç
        else l.fx.rotation.z = k * Math.sin(u * 30) * 0.6; }                                     // teneke: bagetler vurur
      l.cap.position.y = TOP - (u >= 0 && u < 0.6 ? 0.03 * Math.exp(-u * 6) * Math.cos(u * 22) : 0);
      const nu = u - 0.12; l.note.visible = D.shapes && u >= 0 && nu > 0 && nu < 0.9 * D.life + 0.1;
      if (l.note.visible) {
        const span = 0.9 * D.life + 0.1, e = 1 - (1 - Math.min(1, nu / span)) ** 3;
        l.note.position.set(l.x + Math.sin(nu * 5 + l.phase) * 0.08, TOP + PED + 0.55 + e * 0.7, l.z);
        l.note.scale.setScalar(springy(nu, 1, 7, 14) * Math.max(0, 1 - Math.max(0, nu - span * 0.66) / (span * 0.34)) * 1.2);
        l.note.rotation.set(nu * 4, nu * 6, 0);
      }
      return u >= 0 && u < 0.6;
    }
    // seyirci: birkaç kişi hep oturur. Orkestra çalınca festival gezginlerinden bazıları gelip boş banklara oturur
    // (oda ne kadar gürültülüyse o kadar çok kişi gelir: Context) ve diğer dinleyicilerle aynı tepkiyi verir.
    // Müzik durunca bir süre sonra teker teker kalkıp yeniden gezmeye döner.
    function crowdFrame(t, dt) {
      const active = t - lastAct < 1.5, engaged = t - lastAct < 8;
      const cheer = active && (room.state === 'loud' || t < cheerUntil);
      const want = engaged ? Math.min(D.crowd, Math.round(2 + room.level * 10)) : 0;
      const joined = people.filter((p) => p.joiner);
      if (joined.length < want) {                                                      // en yakın gezgin gelir
        const free = seats.find((st) => !st.taken), cand = people.filter((p) => p.state === 'wander');
        if (free && cand.length) {
          const d = (p) => Math.hypot(p.o.root.position.x - free.x, p.o.root.position.z - free.z);
          const p = cand.reduce((a, b) => (d(a) < d(b) ? a : b));
          free.taken = p; p.seat = free; p.joiner = true; p.state = 'toSeat'; p.tx = free.x; p.tz = free.z; p.wait = 0;
        }
      } else if (joined.length > want && Math.random() < dt * 1.5) {                   // müzik bitince teker teker kalkar
        const p = joined[joined.length - 1]; if (p.seat) p.seat.taken = null;
        p.seat = null; p.joiner = false; p.state = 'wander'; wanderTarget(p); p.wait = 0;
      }
      people.forEach((p) => {
        const r = p.o.root;
        if (p.state === 'seated') {                                                    // oturan: yalnızca biri çalınca kıpırdar
          r.position.y = 0.16 + (cheer ? Math.abs(Math.sin(t * 8 + p.phase)) * 0.09 : 0);
          if (active) ctx.animChar(p.o, t * (cheer ? 3 : room.state === 'busy' ? 1.5 : 0.8) + p.phase);
          return;
        }
        if (p.wait > 0) { p.wait -= dt; r.position.y = 0; return; }                     // bir tezgâhın önünde durup bakıyor
        const dx = p.tx - r.position.x, dz = p.tz - r.position.z, L = Math.hypot(dx, dz), sp = p.state === 'toSeat' ? 1.5 : 0.6;
        if (L < 0.06) {
          if (p.state === 'toSeat') { p.state = 'seated'; r.position.set(p.seat.x, 0.16, p.seat.z); r.rotation.y = p.seat.rot; return; }
          wanderTarget(p); p.wait = 0.8 + Math.random() * 2.5; return;
        }
        const step = Math.min(L, sp * dt); r.position.x += dx / L * step; r.position.z += dz / L * step;
        r.rotation.y = Math.atan2(dx, dz); r.position.y = Math.abs(Math.sin(t * 9 + p.phase)) * 0.035;   // yürürken hafif sekme
        ctx.animChar(p.o, t * 2 + p.phase);
      });
    }
    // sahne: perde, solist, bulutlar, şef, ışık (gece / gündüz)
    function stageFrame(t, dt, playing) {
      curtainK += ((curtainOpen ? 1 : 0) - curtainK) * Math.min(1, dt * 4);
      halves.forEach(({ h, s }) => { const w = 1 - curtainK * 0.82; h.scale.x = w; h.position.x = s * (2.5 - 1.275 * w); });
      backstage.visible = curtainOpen || curtainK > 0.02;                                     // kapalı perdenin üstünden sarı boru görünmesin
      soloPulse = Math.max(0, soloPulse - dt * 2.5);
      disc.rotation.y += dt * (curtainOpen ? 4 : 0.5);
      horn.scale.setScalar(1 + soloPulse * 0.25); hornG.rotation.y = Math.sin(t * 1.5) * 0.25 * curtainK;
      clouds.forEach((c) => { c.puff = Math.max(0, c.puff - dt * 3); c.g.position.x = c.x + Math.sin(t * 0.25 + c.phase) * 0.25; c.g.position.y = c.y + Math.sin(t * 0.8 + c.phase) * 0.04;
        c.g.scale.set(0.85 + c.puff * 0.08, 0.85 - c.puff * 0.06, 0.85); });
      const beat = playing ? 9 : 2;                                                          // şef: radyo — anten baget, ışıklar notalarla
      baton.rotation.z = -0.25 + Math.sin(t * beat) * (playing ? 0.75 : 0.2); baton.rotation.x = -0.3;
      radio.position.y = playing ? Math.abs(Math.sin(t * beat)) * 0.08 : 0;
      radio.scale.set(1, 1 - (playing ? Math.abs(Math.sin(t * beat)) * 0.04 : 0), 1);
      grille.scale.setScalar(1 + (playing ? Math.abs(Math.sin(t * beat * 2)) * 0.04 : 0));
      needle.position.x = Math.sin(t * (playing ? 1.6 : 0.3)) * 0.26;
      knobs[0].rotation.z = Math.sin(t * 0.5) * 1.2; knobs[1].rotation.z -= dt * (playing ? 5 : 0.4);
      radioLights.forEach((L, r) => {
        const on = live.some((l) => l.r === r && t - l.start >= 0 && t - l.start < 0.35);
        L.k = on ? 1 : Math.max(0, L.k - dt * 3); L.mat.color.copy(L.dim).lerp(L.base, L.k);
      });
    }
    // ışık: gece genel ışık kısılır, lamba sahneyi etrafından daha aydınlık yapar.
    // Oyun duraklasa bile (ör. NIGHT düğmesine basınca) çalışsın diye kendi döngüsünde döner.
    let lightsOn = false, lastLight = performance.now(), lastNight = null;
    function lights(now) {
      const dt = Math.min(0.1, (now - lastLight) / 1000), k = Math.min(1, dt * 3); lastLight = now;
      zoom += (zoomTarget - zoom) * Math.min(1, dt * 6);                                   // yakınlaştırma da duraklamadan bağımsız
      rotor.rotation.z += dt * 0.25; cabins.forEach((c) => { c.rotation.z = -rotor.rotation.z; });   // dönme dolap döner, kabinler dik kalır
      balloons.forEach((b) => { b.g.position.y = Math.sin(now / 1000 * 1.3 + b.phase) * 0.06; b.g.rotation.z = Math.sin(now / 1000 * 0.9 + b.phase) * 0.05; });
      if (lightsOn) {
        const night = ctx.night();
        sceneLights.forEach((s) => { const base = D.modern ? (s.l.isAmbientLight ? 0.9 : 2.4) : s.base;   // modern çizim: daha az düz ışık, daha çok yönlü ışık (gölge)
          const want = night ? base * (s.l.isAmbientLight ? 0.28 : 0.2) : base; s.l.intensity += (want - s.l.intensity) * k; });
        const lampWant = lampOn ? (night ? D.lampPower : D.lampPower * 0.25) : 0;
        lampLight.intensity += (lampWant - lampLight.intensity) * k; spot.intensity += (lampWant * 0.8 - spot.intensity) * k;
        beamMat.opacity += ((lampOn ? (night ? 0.2 : 0.07) : 0) - beamMat.opacity) * k;
        festLights.forEach((L) => { L.intensity += ((night ? 2.6 : 0) - L.intensity) * k; });          // gece festival canlanır
        footLight.intensity += ((night ? 3 : 0) - footLight.intensity) * k;
        if (night !== lastNight) { lastNight = night;                                                     // fenerler ve sahne önü ampulleri
          [...postBulbs, ...footBulbs].forEach((o) => { o.material = night ? bulbOn : bulbOff; if (o.userData.style) o.userData.style.mat = o.material; }); }
      }
      requestAnimationFrame(lights);
    }
    requestAnimationFrame(lights);

    // ================= ÇİZİM STİLİ: modern (düz renk + yumuşak ışık + gölge, dış hat yok) ↔ laboratuvarın taralı baskı görünümü =================
    // Karakterler ve nesneler aynı kalır; yalnızca malzemeler ve dış hat değişir.
    const modernCache = new Map();
    function modernOf(m) {
      if (modernCache.has(m)) return modernCache.get(m);
      let n = m;
      if (!m.isSpriteMaterial && !(m.userData.noAtlas && m.isMeshBasicMaterial)) {
        n = new THREE.MeshStandardMaterial({ color: m.color ? m.color.clone() : 0xffffff, map: m.map || null, side: m.side, transparent: m.transparent, opacity: m.opacity,
          roughness: m === hornMat ? 0.3 : 0.6, metalness: m === hornMat ? 0.6 : 0.02 });
        n.userData.noAtlas = true;                          // laboratuvarın tarama atlası bu malzemeye uygulanmaz
      }
      modernCache.set(m, n); return n;
    }
    function applyStyle() {
      group.traverse((o) => {
        if (!o.isMesh) return;
        if (!o.userData.style) o.userData.style = { mat: o.material, noOutline: !!o.userData.noOutline };
        const orig = o.userData.style.mat;
        o.material = D.modern ? (Array.isArray(orig) ? orig.map(modernOf) : modernOf(orig)) : orig;
        o.userData.noOutline = D.modern || o.userData.style.noOutline;   // modern: kalın siyah dış hat yok
      });
      const sun = sceneLights.find((s) => s.l.isDirectionalLight);
      if (sun) { const L = sun.l; L.castShadow = D.modern; L.shadow.mapSize.set(2048, 2048); L.shadow.bias = -0.0006;
        Object.assign(L.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 40 }); L.shadow.camera.updateProjectionMatrix(); }
    }

    let lastPlaying = 0, demoOn = false, nextDemo = 0, nextDemoRoom = 0;
    const RULE_TEXT = { single: 'any key → whole band → notes explode', group: 'key → its row → 10–15 notes', full: 'key → its object → 5–8 notes' };
    const AGENCY_LINE = { single: 'Any key plays the whole band.', group: 'Each key moves its whole row.', full: 'One key, one object.' };
    const ROOM_LINE = { quiet: 'The room is quiet.', busy: 'The room is busy.', loud: 'The room is loud.' };
    return {
      start() {
        ctx.root.children.forEach((o) => { if (o !== group) ctx.hideObj(o); });   // laboratuvarın bando sahnesi gizlenir: kendi sahnemiz var
        lightsOn = true; applyStyle();
        live.forEach((l) => { l.start = -9; });
        if (!room.source || room.source === 'mic' && !stream) ctx.overlay(choices()); else ctx.playing(true);
      },
      stop() {
        stopMic(); lightsOn = false;
        sceneLights.forEach((s) => { s.l.intensity = s.base; });
        live.forEach((l) => { l.note.visible = false; });
        rain.forEach((d) => { d.mode = 'off'; d.s.visible = false; });
      },
      begin() {},
      key(e, down) {
        if (!down || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return false;
        if (e.code === 'Space') { e.preventDefault(); setRoomByHand(); return true; }          // alternatif girdi: odayı elle seç
        if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); startMic(); return true; } // mikrofona dön
        if (e.code === 'ArrowUp') { e.preventDefault(); toggleCurtain(); return true; }        // perde (tıklamanın klavye karşılığı)
        if (e.code === 'ArrowDown') { e.preventDefault(); toggleLamp(); return true; }         // lamba (tıklamanın klavye karşılığı)
        if (e.code === 'Minus' || e.code === 'NumpadSubtract') { setZoom(zoomTarget / 1.2); return true; }   // uzaklaş (tekerleğin klavye karşılığı)
        if (e.code === 'Equal' || e.code === 'NumpadAdd') { setZoom(zoomTarget * 1.2); return true; }       // yakınlaş
        const ch = e.code.replace('Key', '').replace('Digit', ''); // e.code klavye düzeninden bağımsız: Türkçe Q'da da G = KeyG
        const hit = live.find((l) => l.ch === ch); if (!hit) return false;
        e.preventDefault(); act(hit); return true;
      },
      pointer(type, e) {
        if (type !== 'down') return;
        const p = ctx.toLocal(e, TOP);
        if (p) { let best = null, bd = 0.24; live.forEach((l) => { const d = Math.hypot(l.x - p.x, l.z - p.z); if (d < bd) { bd = d; best = l; } }); if (best) { act(best); return; } }
        if ([0.4, 1.2, 2.0, 2.4].some((y) => nearOnScreen(e, new THREE.Vector3(LAMP.x + (y > 2.2 ? 0.6 : 0), y, LAMP.z), 34))) { toggleLamp(); return; }
        const q = ctx.toLocal(e, 0, 'z', BACK);                                                  // perdenin düzlemi
        if (q && Math.abs(q.x) < 2.5 && q.y > 0 && q.y < 2.2) toggleCurtain();
      },
      frame(t, dt) {
        nowT = t; dt = dt || 0.016; let k = 0, playing = 0;
        if (demoOn && t > nextDemoRoom) { room.source = 'keys'; room.manual = ROOMS[(ROOMS.indexOf(room.manual) + 1) % 3]; nextDemoRoom = t + 4; }
        if (demoOn && t > nextDemo) { act(pick(live)); nextDemo = t + 0.6 + Math.random() * 0.6; } // tanıtım: kendi kendine çalar
        readRoom(dt); updateAgency(t); crowdFrame(t, dt); rainFrame(t, dt);
        live.forEach((l) => { if (pose(l, t)) { playing++; if (agency === 'full' && k < 12) ctx.tag(k++, NOTE_NAMES[l.c % 5], new THREE.Vector3(l.x, TOP + PED + 0.62, l.z), true, 0); } });
        ctx.tagsFrom(k); lastPlaying = playing;
        stageFrame(t, dt, playing > 0);
      },
      view: () => ({ zoom }),                    // koşucu kamerası her karede bunu okur
      hud: () => ({ room: room.state + ' · ' + Math.round(room.level * 100) + '%' + (room.source === 'keys' ? ' (space)' : room.source === 'mic' ? ' (mic)' : ''), agency, nPlay: lastPlaying, nRain }),
      rule: () => room.state + ' room → ' + RULE_TEXT[agency],
      caption: () => ROOM_LINE[room.state] + ' ' + AGENCY_LINE[agency] + (curtainOpen ? ' The soloist answers.' : ''),
      status: () => 'room: ' + room.state + ' (' + Math.round(room.level * 100) + '%) · agency: ' + agency + ' · playing: ' + lastPlaying + ' · falling: ' + nRain + ' · lamp: ' + (lampOn ? 'on' : 'off') + ' · curtain: ' + (curtainOpen ? 'open' : 'closed'),
      knob(k) { if (k === 'modern') applyStyle(); ctx.renderTexts(); },
      demo() { demoOn = true; ctx.playing(true); }
    };
  }
};
