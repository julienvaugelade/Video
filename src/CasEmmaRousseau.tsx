import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FONT} from './theme';

// ---------------------------------------------------------------------------
// Palette (flat, fond clair)
// ---------------------------------------------------------------------------

const P = {
  bg: '#F7F7F4',
  ink: '#2B3346',
  blue: '#4E4EEA',
  yellow: '#F9C623',
  card: '#FFFFFF',
  line: '#DCDEE6',
  soft: '#EEF0F5',
  muted: '#7B8194',
  blueTint: '#E6E6FC',
  yellowTint: '#FEF3C7',
};

// ---------------------------------------------------------------------------
// Helpers (temps en secondes)
// ---------------------------------------------------------------------------

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);

const ramp = (t: number, a: number, b: number, easing = easeOut) =>
  interpolate(t, [a, b], [0, 1], {...CLAMP, easing});

const windowed = (t: number, a: number, b: number, fade = 0.35) =>
  Math.min(ramp(t, a, a + fade), 1 - ramp(t, b - fade, b));

/** Interpolation par images clés, adoucie sur chaque segment. */
const kf = (t: number, ts: number[], vs: number[]) =>
  interpolate(t, ts, vs, {...CLAMP, easing: easeInOut});

/** Texte qui se tape entre a et b. */
const typed = (s: string, t: number, a: number, b: number) =>
  s.slice(0, Math.round(interpolate(t, [a, b], [0, s.length], CLAMP)));

const bezier = (
  p0: {x: number; y: number},
  c: {x: number; y: number},
  p1: {x: number; y: number},
  u: number,
) => ({
  x: (1 - u) ** 2 * p0.x + 2 * (1 - u) * u * c.x + u ** 2 * p1.x,
  y: (1 - u) ** 2 * p0.y + 2 * (1 - u) * u * c.y + u ** 2 * p1.y,
});

// ---------------------------------------------------------------------------
// Données du cas
// ---------------------------------------------------------------------------

type Rec = {client: string; prestation: string; date: string; statut: 'Confirmé' | 'En attente'};

const RECORDS: Rec[] = [
  {client: 'Hugo Petit', prestation: 'Séance de suivi', date: 'mar. 20/10 · 14 h', statut: 'Confirmé'},
  {client: 'Léa Bernard', prestation: 'Bilan initial', date: 'mer. 21/10 · 9 h', statut: 'En attente'},
  {client: 'Claire Martin', prestation: 'Bilan initial', date: 'jeu. 22/10 · 10 h', statut: 'Confirmé'},
  {client: 'Karim Diallo', prestation: 'Atelier collectif', date: 'ven. 23/10 · 18 h', statut: 'Confirmé'},
];
const MATCH = 2; // Claire Martin

// Saisies successives dans le formulaire Softr (début, durée)
const SUBMITS = [
  {s: 21.6, d: 4.4},
  {s: 26.2, d: 3.2},
  {s: 29.5, d: 2.6},
  {s: 32.2, d: 2.6},
];
const subTimes = (i: number) => {
  const {s, d} = SUBMITS[i];
  return {
    nameA: s,
    nameB: s + 0.3 * d,
    prestA: s + 0.32 * d,
    dateA: s + 0.42 * d,
    dateB: s + 0.55 * d,
    press: s + 0.6 * d,
    clear: s + 0.72 * d,
    flyA: s + 0.62 * d,
    flyB: s + 0.88 * d,
    land: s + 0.88 * d,
  };
};
const landedCount = (t: number) => SUBMITS.filter((_, i) => t >= subTimes(i).land).length;

// ---------------------------------------------------------------------------
// Mise en page : 3 panneaux dont la position évolue d'une étape à l'autre
// ---------------------------------------------------------------------------

const SOFTR = {w: 760, h: 680};
const TABLE = {w: 860, h: 336};
const AGENT = {w: 640, h: 600};

type Box = {x: number; y: number; s: number; w: number; h: number};

const K = [18.5, 20.5, 35.5, 37.5, 52.5, 54.5];
const KS = [17.8, 19.6, 35.5, 37.5, 52.5, 54.5]; // Softr libère la place un peu avant

const softrBox = (t: number): Box => ({
  x: kf(t, KS, [960, 500, 500, 215, 215, 340]),
  y: kf(t, KS, [590, 590, 590, 600, 600, 490]),
  s: kf(t, KS, [1, 0.88, 0.88, 0.42, 0.42, 0.5]),
  ...SOFTR,
});
const tableBox = (t: number): Box => ({
  x: kf(t, K, [1520, 1390, 1390, 760, 760, 960]),
  y: kf(t, K, [590, 590, 590, 590, 590, 490]),
  s: kf(t, K, [0.95, 1, 1, 0.82, 0.82, 0.48]),
  ...TABLE,
});
const agentBox = (t: number): Box => ({
  x: kf(t, [35.5, 37.5, 52.5, 54.5], [1640, 1530, 1530, 1580]),
  y: kf(t, [35.5, 37.5, 52.5, 54.5], [600, 600, 600, 490]),
  s: kf(t, [35.5, 37.5, 52.5, 54.5], [0.94, 1, 1, 0.5]),
  ...AGENT,
});

/** Point local d'un panneau → coordonnées écran. */
const toScreen = (b: Box, lx: number, ly: number) => ({
  x: b.x + (lx - b.w / 2) * b.s,
  y: b.y + (ly - b.h / 2) * b.s,
});

const Panel: React.FC<{box: Box; opacity: number; children: React.ReactNode}> = ({
  box,
  opacity,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: box.x - box.w / 2,
      top: box.y - box.h / 2,
      width: box.w,
      height: box.h,
      transform: `scale(${box.s})`,
      transformOrigin: 'center center',
      opacity,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Petits éléments
// ---------------------------------------------------------------------------

const Avatar: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: P.yellow,
      color: P.ink,
      fontWeight: 700,
      fontSize: size * 0.4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...style,
    }}
  >
    ER
  </div>
);

const BotIcon: React.FC<{size: number}> = ({size}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: P.blue,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="13" rx="4" fill="#fff" />
      <rect x="11" y="2.5" width="2" height="4.5" fill="#fff" />
      <circle cx="12" cy="2.5" r="1.8" fill={P.yellow} />
      <circle cx="8.6" cy="13.2" r="1.9" fill={P.blue} />
      <circle cx="15.4" cy="13.2" r="1.9" fill={P.blue} />
    </svg>
  </div>
);

const Check: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StatusPill: React.FC<{statut: Rec['statut']; size?: number}> = ({statut, size = 17}) => (
  <span
    style={{
      padding: '4px 12px',
      borderRadius: 999,
      fontSize: size,
      fontWeight: 600,
      background: statut === 'Confirmé' ? P.blueTint : P.yellowTint,
      color: statut === 'Confirmé' ? P.blue : '#9A7300',
      whiteSpace: 'nowrap',
    }}
  >
    {statut}
  </span>
);

// ---------------------------------------------------------------------------
// Étape 1 : l'interface Softr
// ---------------------------------------------------------------------------

const BLOCKS = [
  {key: 'header', label: 'Bloc En-tête', y: 58, h: 64, start: 8.0},
  {key: 'hero', label: 'Bloc Texte', y: 136, h: 104, start: 9.6},
  {key: 'form', label: 'Bloc Formulaire', y: 254, h: 236, start: 11.2},
  {key: 'list', label: 'Bloc Liste', y: 504, h: 156, start: 12.8},
] as const;
const PUBLISH_AT = 14.8;

const Field: React.FC<{x: number; y: number; w: number; label: string; value: string; caret: boolean}> = ({
  x,
  y,
  w,
  label,
  value,
  caret,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: 44,
      borderRadius: 10,
      border: `2px solid ${caret ? P.blue : P.line}`,
      background: P.card,
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      gap: 12,
      fontSize: 18,
      boxSizing: 'border-box',
    }}
  >
    <span style={{color: P.muted, fontWeight: 500, fontSize: 15, minWidth: 82}}>{label}</span>
    <span style={{color: P.ink, fontWeight: 600}}>
      {value}
      {caret ? <span style={{color: P.blue, fontWeight: 400}}>|</span> : null}
    </span>
  </div>
);

const SoftrApp: React.FC<{t: number; pop: (s: number) => number}> = ({t, pop}) => {
  // Saisie courante dans le formulaire
  let name = '';
  let prest = '';
  let date = '';
  let focus = -1;
  let pressed = 0;
  SUBMITS.forEach((_, i) => {
    const st = subTimes(i);
    if (t >= st.nameA && t < st.clear) {
      const r = RECORDS[i];
      name = typed(r.client, t, st.nameA, st.nameB);
      prest = t >= st.prestA ? r.prestation : '';
      date = typed(r.date, t, st.dateA, st.dateB);
      focus = t < st.nameB + 0.05 ? 0 : t < st.dateA ? 1 : t < st.press ? 2 : -1;
      pressed = windowed(t, st.press - 0.05, st.press + 0.3, 0.12);
    }
  });

  const count = landedCount(t);
  const listShift = interpolate(
    t,
    SUBMITS.map((_, i) => subTimes(i).land),
    SUBMITS.map((_, i) => Math.max(0, i + 1 - 3) * 32),
    {...CLAMP, easing: easeInOut},
  );
  const published = ramp(t, PUBLISH_AT, PUBLISH_AT + 0.4);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: P.card,
        border: `2.5px solid ${P.ink}`,
        borderRadius: 22,
        overflow: 'hidden',
      }}
    >
      {/* Barre du navigateur */}
      <div
        style={{
          height: 44,
          background: P.soft,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 8,
          borderBottom: `2px solid ${P.line}`,
        }}
      >
        {[P.ink, P.line, P.line].map((c, i) => (
          <div key={i} style={{width: 12, height: 12, borderRadius: 6, background: c, opacity: i ? 1 : 0.35}} />
        ))}
        <div
          style={{
            marginLeft: 14,
            flex: 1,
            height: 26,
            borderRadius: 13,
            background: P.card,
            fontSize: 14,
            color: P.muted,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 14,
          }}
        >
          emma-rousseau.softr.app
        </div>
        <div
          style={{
            height: 28,
            padding: '0 14px',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: interpolateColors(published, [0, 1], [P.blue, P.yellow]),
            color: interpolateColors(published, [0, 1], ['#FFFFFF', P.ink]),
            transform: `scale(${1 + 0.12 * windowed(t, PUBLISH_AT - 0.1, PUBLISH_AT + 0.5, 0.2)})`,
          }}
        >
          {published > 0.5 ? (
            <>
              <Check size={14} color={P.ink} /> En ligne
            </>
          ) : (
            'Publier'
          )}
        </div>
      </div>

      {BLOCKS.map((b) => {
        const p = pop(b.start);
        const ghost = windowed(t, b.start - 0.9, b.start + 0.25, 0.25);
        const chip = windowed(t, b.start + 0.05, b.start + 1.5, 0.25);
        return (
          <React.Fragment key={b.key}>
            {/* Emplacement en pointillés avant l'arrivée du bloc */}
            <div
              style={{
                position: 'absolute',
                left: 20,
                top: b.y,
                width: 720,
                height: b.h,
                borderRadius: 14,
                border: `2.5px dashed ${P.blue}`,
                opacity: ghost * 0.55,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: P.blue,
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              + Ajouter un bloc
            </div>
            <div
              style={{
                position: 'absolute',
                left: 20,
                top: b.y,
                width: 720,
                height: b.h,
                opacity: Math.min(1, p * 1.5),
                transform: `translateY(${(1 - p) * 30}px) scale(${0.94 + 0.06 * p})`,
              }}
            >
              <BlockContent
                k={b.key}
                t={t}
                name={name}
                prest={prest}
                date={date}
                focus={focus}
                pressed={pressed}
                count={count}
                listShift={listShift}
              />
            </div>
            {/* Étiquette du bloc */}
            <div
              style={{
                position: 'absolute',
                left: 32,
                top: b.y - 14,
                padding: '3px 12px',
                borderRadius: 8,
                background: P.yellow,
                color: P.ink,
                fontSize: 15,
                fontWeight: 700,
                opacity: chip,
                transform: `scale(${0.7 + 0.3 * chip})`,
                transformOrigin: 'left center',
              }}
            >
              + {b.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const BlockContent: React.FC<{
  k: (typeof BLOCKS)[number]['key'];
  t: number;
  name: string;
  prest: string;
  date: string;
  focus: number;
  pressed: number;
  count: number;
  listShift: number;
}> = ({k, t, name, prest, date, focus, pressed, count, listShift}) => {
  const base: React.CSSProperties = {position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden'};
  if (k === 'header') {
    return (
      <div style={{...base, background: P.ink, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14}}>
        <Avatar size={38} />
        <span style={{color: '#fff', fontSize: 22, fontWeight: 600}}>Emma Rousseau</span>
        <div style={{flex: 1}} />
        {['Accueil', 'Rendez-vous', 'Mon compte'].map((n, i) => (
          <span key={n} style={{color: i === 1 ? P.yellow : '#C9CCD8', fontSize: 16, fontWeight: 500, marginLeft: 14}}>
            {n}
          </span>
        ))}
      </div>
    );
  }
  if (k === 'hero') {
    return (
      <div style={{...base, background: P.blueTint, padding: '20px 26px', boxSizing: 'border-box'}}>
        <div style={{fontSize: 28, fontWeight: 700, color: P.ink}}>Bienvenue dans votre espace client</div>
        <div style={{fontSize: 18, color: P.muted, marginTop: 6}}>Réservez et suivez vos rendez-vous avec Emma.</div>
      </div>
    );
  }
  if (k === 'form') {
    return (
      <div style={{...base, border: `2px solid ${P.line}`, background: P.card}}>
        <div style={{position: 'absolute', left: 16, top: 12, fontSize: 21, fontWeight: 700, color: P.ink}}>
          Prendre rendez-vous
        </div>
        <Field x={16} y={52} w={684} label="Nom" value={name} caret={focus === 0} />
        <Field x={16} y={110} w={338} label="Prestation" value={prest} caret={focus === 1} />
        <Field x={362} y={110} w={338} label="Date" value={date} caret={focus === 2} />
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: 170,
            width: 200,
            height: 46,
            borderRadius: 12,
            background: interpolateColors(pressed, [0, 1], [P.blue, P.ink]),
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${1 - 0.06 * pressed})`,
          }}
        >
          Réserver
        </div>
      </div>
    );
  }
  // list
  return (
    <div style={{...base, border: `2px solid ${P.line}`, background: P.card}}>
      <div style={{position: 'absolute', left: 16, top: 12, fontSize: 21, fontWeight: 700, color: P.ink}}>
        Prochains rendez-vous
      </div>
      <div style={{position: 'absolute', left: 16, right: 16, top: 50, height: 96, overflow: 'hidden'}}>
        {count === 0 ? (
          <div style={{fontSize: 17, color: P.muted, paddingTop: 8}}>Aucun rendez-vous pour l'instant</div>
        ) : null}
        {RECORDS.slice(0, count).map((r, i) => {
          const land = subTimes(i).land;
          const a = ramp(t, land, land + 0.4);
          const flash = 1 - ramp(t, land + 0.3, land + 1.4);
          return (
            <div
              key={r.client}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: i * 32 - listShift,
                height: 28,
                borderRadius: 8,
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 16,
                opacity: a,
                transform: `translateX(${(1 - a) * -20}px)`,
                background: interpolateColors(flash, [0, 1], [P.card, P.yellowTint]),
              }}
            >
              <div style={{width: 8, height: 8, borderRadius: 4, background: P.blue}} />
              <span style={{fontWeight: 600, color: P.ink, width: 170}}>{r.client}</span>
              <span style={{color: P.muted}}>{r.date}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Étape 2 : la table Airtable
// ---------------------------------------------------------------------------

const COLS = [
  {label: '', w: 44},
  {label: 'Client', w: 226},
  {label: 'Prestation', w: 210},
  {label: 'Date', w: 210},
  {label: 'Statut', w: 170},
];
const T_TOP = 52;
const T_HEAD = 42;
const ROW_H = 50;
const rowCenterY = (i: number) => T_TOP + T_HEAD + i * ROW_H + ROW_H / 2;

// Lecture de la table par l'agent
const SCAN_A = 40.4;
const SCAN_B = 42.6;
const MATCH_AT = 42.8;

const AirtableTable: React.FC<{t: number}> = ({t}) => {
  const heads = ramp(t, 20.4, 21.0);
  const scanOn = windowed(t, SCAN_A - 0.3, 52.6, 0.3);
  const scanRow = interpolate(t, [SCAN_A, SCAN_B], [0, MATCH], {...CLAMP, easing: easeInOut});
  const matched = ramp(t, MATCH_AT, MATCH_AT + 0.4);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: P.card,
        border: `2.5px solid ${P.ink}`,
        borderRadius: 22,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: T_TOP,
          background: P.ink,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          gap: 12,
          color: '#fff',
        }}
      >
        <svg width={26} height={26} viewBox="0 0 26 26">
          <rect x="1" y="1" width="11" height="11" rx="2.5" fill={P.yellow} />
          <rect x="14" y="1" width="11" height="11" rx="2.5" fill={P.blue} />
          <rect x="1" y="14" width="11" height="11" rx="2.5" fill={P.blue} />
          <rect x="14" y="14" width="11" height="11" rx="2.5" fill="#fff" />
        </svg>
        <span style={{fontSize: 19, fontWeight: 600}}>Airtable · Base « Emma Rousseau »</span>
        <div style={{flex: 1}} />
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            background: P.yellow,
            color: P.ink,
            padding: '4px 12px',
            borderRadius: 8,
          }}
        >
          Table Rendez-vous
        </span>
      </div>

      {/* En-têtes de colonnes */}
      <div
        style={{
          height: T_HEAD,
          display: 'flex',
          background: P.soft,
          borderBottom: `2px solid ${P.line}`,
          opacity: heads,
        }}
      >
        {COLS.map((c) => (
          <div
            key={c.label}
            style={{
              width: c.w,
              fontSize: 16,
              fontWeight: 600,
              color: P.muted,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 14,
              boxSizing: 'border-box',
              borderRight: `1.5px solid ${P.line}`,
            }}
          >
            {c.label}
          </div>
        ))}
      </div>

      {/* Lignes */}
      {RECORDS.map((r, i) => {
        const land = subTimes(i).land;
        const a = ramp(t, land, land + 0.35);
        const flash = 1 - ramp(t, land + 0.3, land + 1.6);
        const isMatch = i === MATCH ? matched : 0;
        const cells = [String(i + 1), r.client, r.prestation, r.date];
        return (
          <div
            key={r.client}
            style={{
              position: 'absolute',
              left: 0,
              top: T_TOP + T_HEAD + i * ROW_H,
              width: TABLE.w,
              height: ROW_H,
              display: 'flex',
              borderBottom: `1.5px solid ${P.line}`,
              background: interpolateColors(Math.max(flash * a, isMatch), [0, 1], [P.card, P.yellowTint]),
              opacity: heads,
            }}
          >
            {cells.map((v, ci) => (
              <div
                key={ci}
                style={{
                  width: COLS[ci].w,
                  fontSize: ci === 0 ? 15 : 18,
                  fontWeight: ci === 1 ? 600 : 500,
                  color: ci === 0 ? P.muted : P.ink,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 14,
                  boxSizing: 'border-box',
                  borderRight: `1.5px solid ${P.line}`,
                  opacity: ci === 0 ? 1 : a,
                  transform: `translateY(${(1 - a) * 10}px)`,
                }}
              >
                {v}
              </div>
            ))}
            <div style={{display: 'flex', alignItems: 'center', paddingLeft: 14, opacity: a}}>
              <StatusPill statut={r.statut} />
            </div>
          </div>
        );
      })}

      {/* Cadre de lecture de l'agent */}
      <div
        style={{
          position: 'absolute',
          left: 4,
          width: TABLE.w - 12,
          top: rowCenterY(scanRow) - ROW_H / 2 + 2,
          height: ROW_H - 4,
          borderRadius: 10,
          border: `3px solid ${interpolateColors(matched, [0, 1], [P.blue, '#E0A800'])}`,
          opacity: scanOn,
          boxSizing: 'border-box',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 18,
          top: T_TOP + T_HEAD + 4 * ROW_H + 10,
          fontSize: 16,
          color: P.muted,
          fontWeight: 500,
          opacity: heads,
        }}
      >
        + Nouvel enregistrement
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Étape 3 : l'agent
// ---------------------------------------------------------------------------

const ASK_AT = 38.0;
const THINK_AT = 39.4;
const REPLY_A = 45.0;
const REPLY_B = 49.4;
const SOURCE_AT = 49.9;
const REPLY =
  'Bonjour Claire ! Votre bilan initial est prévu jeudi 22/10 à 10 h. Je peux le décaler à vendredi 23/10 à 11 h. Cela vous convient ?';

const AgentChat: React.FC<{t: number; pop: (s: number) => number}> = ({t, pop}) => {
  const ask = pop(ASK_AT);
  const think = windowed(t, THINK_AT, REPLY_A + 0.1, 0.3);
  const found = ramp(t, MATCH_AT, MATCH_AT + 0.4);
  const reply = pop(REPLY_A - 0.3);
  const src = ramp(t, SOURCE_AT, SOURCE_AT + 0.5);
  const dots = [0, 1, 2].map((i) => 0.35 + 0.65 * Math.max(0, Math.sin((t * 6 - i * 0.9) % (Math.PI * 2))));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: P.card,
        border: `2.5px solid ${P.ink}`,
        borderRadius: 22,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '0 20px',
          borderBottom: `2px solid ${P.line}`,
        }}
      >
        <BotIcon size={46} />
        <div>
          <div style={{fontSize: 21, fontWeight: 700, color: P.ink}}>Agent IA · Assistant d'Emma</div>
          <div style={{fontSize: 15, color: P.muted, display: 'flex', alignItems: 'center', gap: 6}}>
            <span style={{width: 8, height: 8, borderRadius: 4, background: '#3BB273', display: 'inline-block'}} />
            Répond aux demandes des clients
          </div>
        </div>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, top: 72, bottom: 70, background: P.bg}}>
        {/* Demande client */}
        <div
          style={{
            position: 'absolute',
            left: 22,
            top: 22,
            width: 430,
            opacity: Math.min(1, ask * 1.5),
            transform: `translateY(${(1 - ask) * 24}px)`,
          }}
        >
          <div style={{fontSize: 14, color: P.muted, fontWeight: 600, marginBottom: 6}}>
            Demande client · Claire Martin
          </div>
          <div
            style={{
              background: P.card,
              border: `2px solid ${P.line}`,
              borderRadius: '6px 18px 18px 18px',
              padding: '14px 18px',
              fontSize: 19,
              lineHeight: 1.45,
              color: P.ink,
            }}
          >
            Bonjour, je dois décaler mon rendez-vous de jeudi. C'est possible ?
          </div>
        </div>

        {/* L'agent consulte la table */}
        <div
          style={{
            position: 'absolute',
            left: 22,
            top: 160,
            height: 40,
            padding: '0 16px',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 16,
            fontWeight: 600,
            opacity: think,
            background: interpolateColors(found, [0, 1], [P.blueTint, P.yellowTint]),
            color: interpolateColors(found, [0, 1], [P.blue, '#8A6600']),
          }}
        >
          {found < 0.5 ? (
            <>
              Lit la table Rendez-vous
              {dots.map((o, i) => (
                <span key={i} style={{width: 6, height: 6, borderRadius: 3, background: P.blue, opacity: o}} />
              ))}
            </>
          ) : (
            <>
              <Check size={18} color="#8A6600" /> Trouvé : Claire Martin · jeu. 22/10 · 10 h
            </>
          )}
        </div>

        {/* Réponse de l'agent */}
        <div
          style={{
            position: 'absolute',
            right: 22,
            top: 222,
            width: 460,
            opacity: Math.min(1, reply * 1.5),
            transform: `translateY(${(1 - reply) * 24}px)`,
          }}
        >
          <div style={{fontSize: 14, color: P.muted, fontWeight: 600, marginBottom: 6, textAlign: 'right'}}>
            Agent IA
          </div>
          <div
            style={{
              background: P.blue,
              borderRadius: '18px 6px 18px 18px',
              padding: '14px 18px',
              fontSize: 19,
              lineHeight: 1.45,
              color: '#fff',
              minHeight: 3 * 19 * 1.45,
            }}
          >
            {/* Texte complet invisible pour figer la hauteur de la bulle */}
            <span style={{position: 'relative', display: 'block'}}>
              <span style={{visibility: 'hidden'}}>{REPLY}</span>
              <span style={{position: 'absolute', inset: 0}}>{typed(REPLY, t, REPLY_A, REPLY_B)}</span>
            </span>
          </div>
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 600,
              color: P.ink,
              opacity: src,
              transform: `translateY(${(1 - src) * 8}px)`,
            }}
          >
            <span style={{width: 10, height: 10, borderRadius: 3, background: P.yellow}} />
            Source : table Airtable « Rendez-vous »
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 14,
          height: 44,
          borderRadius: 22,
          border: `2px solid ${P.line}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          fontSize: 16,
          color: P.muted,
        }}
      >
        Écrire un message…
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Bandeau supérieur : titre et suivi des 3 étapes
// ---------------------------------------------------------------------------

const STEPS = [
  {label: 'Interface Softr', at: 6.5},
  {label: 'Base Airtable', at: 19.5},
  {label: 'Agent IA', at: 36.5},
];
const ALL_DONE = 53.5;

const StepTracker: React.FC<{t: number}> = ({t}) => {
  const show = ramp(t, 5.6, 6.4);
  const x0 = 1150;
  const gap = 300;
  const progress = kf(t, [18.8, 20.2, 35.8, 37.2], [0, 1, 1, 2]);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 150, opacity: show}}>
      <div style={{position: 'absolute', left: x0, top: 68, width: 2 * gap, height: 4, background: P.line}} />
      <div style={{position: 'absolute', left: x0, top: 68, width: progress * gap, height: 4, background: P.yellow}} />
      {STEPS.map((s, i) => {
        const active = ramp(t, s.at - 0.6, s.at);
        const done = i < 2 ? ramp(t, STEPS[i + 1].at - 0.6, STEPS[i + 1].at) : ramp(t, ALL_DONE, ALL_DONE + 0.5);
        const bg = interpolateColors(done, [0, 1], [interpolateColors(active, [0, 1], [P.card, P.blue]), P.yellow]);
        return (
          <div key={s.label} style={{position: 'absolute', left: x0 + i * gap, top: 70}}>
            <div
              style={{
                position: 'absolute',
                left: -24,
                top: -24,
                width: 48,
                height: 48,
                borderRadius: 24,
                background: bg,
                border: `3px solid ${active > 0.5 ? (done > 0.5 ? P.yellow : P.blue) : P.line}`,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                color: active > 0.5 && done < 0.5 ? '#fff' : P.ink,
                transform: `scale(${1 + 0.15 * windowed(t, s.at - 0.6, s.at + 0.4, 0.3)})`,
              }}
            >
              {done > 0.5 ? <Check size={24} color={P.ink} /> : i + 1}
            </div>
            <div
              style={{
                position: 'absolute',
                left: -120,
                width: 240,
                top: 32,
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 600,
                color: active > 0.5 ? P.ink : P.muted,
              }}
            >
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CAPTIONS: {a: number; b: number; num: string; text: React.ReactNode}[] = [
  {
    a: 6.6,
    b: 19.2,
    num: '1',
    text: (
      <>
        Emma construit son espace client dans <b>Softr</b> (outil no-code pour créer une interface web), bloc par
        bloc.
      </>
    ),
  },
  {
    a: 19.6,
    b: 36.2,
    num: '2',
    text: (
      <>
        Chaque réservation saisie dans Softr remplit en parallèle la table <b>Airtable</b> (base de données en
        ligne).
      </>
    ),
  },
  {
    a: 36.6,
    b: 52.8,
    num: '3',
    text: (
      <>
        Un <b>agent IA</b> lit cette même table pour répondre à une demande client, sans rien inventer.
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const CasEmmaRousseau: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const pop = (startS: number) =>
    spring({frame: frame - startS * fps, fps, config: {damping: 15, stiffness: 160, mass: 0.7}});

  // Titre : centré, puis rangé en haut à gauche
  const toHeader = ramp(t, 4.8, 6.2, easeInOut);
  const titleIn = pop(0.5);
  const avatarIn = pop(0.2);
  const subIn = ramp(t, 1.3, 2.0) * (1 - ramp(t, 4.4, 4.9));

  const sB = softrBox(t);
  const tB = tableBox(t);
  const aB = agentBox(t);
  const softrOp = ramp(t, 6.4, 7.2);
  const tableOp = ramp(t, 19.2, 20.2);
  const agentOp = ramp(t, 35.8, 37.0);

  // Liaison Softr → Airtable (étape 2)
  const linkOn = windowed(t, 20.6, 36.4, 0.4);
  const formBtn = toScreen(sB, 20 + 16 + 200, 254 + 170 + 23);
  const tableIn = toScreen(tB, 0, rowCenterY(1.5));
  const linkCtrl = {x: (formBtn.x + tableIn.x) / 2, y: Math.min(formBtn.y, tableIn.y) - 40};

  // Liaison Agent → Airtable (étape 3)
  const beamOn = windowed(t, THINK_AT + 0.4, 52.4, 0.4);
  const scanRow = interpolate(t, [SCAN_A, SCAN_B], [0, MATCH], {...CLAMP, easing: easeInOut});
  const beamTo = toScreen(tB, TABLE.w, rowCenterY(scanRow));
  const beamFrom = toScreen(aB, 0, 72 + 180);
  const beamCtrl = {x: (beamTo.x + beamFrom.x) / 2, y: (beamTo.y + beamFrom.y) / 2 - 30};
  const chipU = ramp(t, MATCH_AT + 0.3, MATCH_AT + 1.4, easeInOut);
  const chipOn = windowed(t, MATCH_AT + 0.2, MATCH_AT + 1.6, 0.2);

  // Final : le fil rouge relie les trois étapes
  const finalOn = ramp(t, 54.2, 54.9);
  const THREAD_Y = 770;
  const nodesX = [340, 960, 1580];
  const threadDraw = ramp(t, 54.6, 55.6, easeInOut);
  const travel = kf(t, [55.4, 57.4], [nodesX[0], nodesX[2]]);
  const tagIn = ramp(t, 56.4, 57.2);

  return (
    <AbsoluteFill style={{background: P.bg, fontFamily: FONT, color: P.ink}}>
      {/* Titre */}
      <div
        style={{
          position: 'absolute',
          left: interpolate(toHeader, [0, 1], [960, 64]),
          top: interpolate(toHeader, [0, 1], [500, 72]),
          transform: `translate(${-50 * (1 - toHeader)}%, -50%) scale(${interpolate(toHeader, [0, 1], [1, 0.42])})`,
          transformOrigin: 'left center',
          display: 'flex',
          alignItems: 'center',
          gap: 36,
          whiteSpace: 'nowrap',
        }}
      >
        <Avatar size={140} style={{transform: `scale(${avatarIn})`}} />
        <div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              color: P.blue,
              letterSpacing: 2,
              textTransform: 'uppercase',
              opacity: titleIn,
            }}
          >
            Cas fil rouge
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1,
              opacity: titleIn,
              transform: `translateY(${(1 - titleIn) * 20}px)`,
            }}
          >
            Le cas Emma Rousseau
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 640,
          textAlign: 'center',
          fontSize: 36,
          color: P.muted,
          fontWeight: 500,
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 14}px)`,
        }}
      >
        Le même cas, de la première interface jusqu'à l'agent IA.
      </div>

      <StepTracker t={t} />

      {/* Liaisons (sous les panneaux) */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <path
          d={`M ${formBtn.x} ${formBtn.y} Q ${linkCtrl.x} ${linkCtrl.y} ${tableIn.x} ${tableIn.y}`}
          fill="none"
          stroke={P.ink}
          strokeOpacity={0.35}
          strokeWidth={3}
          strokeDasharray="4 10"
          strokeLinecap="round"
          opacity={linkOn}
        />
        <path
          d={`M ${beamFrom.x} ${beamFrom.y} Q ${beamCtrl.x} ${beamCtrl.y} ${beamTo.x} ${beamTo.y}`}
          fill="none"
          stroke={P.blue}
          strokeWidth={4}
          strokeDasharray="2 12"
          strokeDashoffset={t * 60}
          strokeLinecap="round"
          opacity={beamOn}
        />
      </svg>

      <Panel box={sB} opacity={softrOp}>
        <SoftrApp t={t} pop={pop} />
      </Panel>
      <Panel box={tB} opacity={tableOp}>
        <AirtableTable t={t} />
      </Panel>
      <Panel box={aB} opacity={agentOp}>
        <AgentChat t={t} pop={pop} />
      </Panel>

      {/* Jetons de données : Softr → Airtable */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {SUBMITS.map((_, i) => {
          const st = subTimes(i);
          const on = windowed(t, st.flyA, st.flyB + 0.05, 0.08);
          if (on <= 0) return null;
          const u = interpolate(t, [st.flyA, st.flyB], [0, 1], {...CLAMP, easing: easeInOut});
          const dest = toScreen(tB, 44 + 110, rowCenterY(i));
          const ctrl = {x: (formBtn.x + dest.x) / 2, y: Math.min(formBtn.y, dest.y) - 140};
          const p = bezier(formBtn, ctrl, dest, u);
          return (
            <g key={i} opacity={on} transform={`translate(${p.x} ${p.y})`}>
              <rect x={-26} y={-18} width={52} height={36} rx={9} fill={P.yellow} stroke={P.ink} strokeWidth={2.5} />
              <rect x={-15} y={-7} width={30} height={4} rx={2} fill={P.ink} />
              <rect x={-15} y={3} width={20} height={4} rx={2} fill={P.ink} />
            </g>
          );
        })}
        {/* Information trouvée : Airtable → Agent */}
        {chipOn > 0 ? (
          (() => {
            const from = toScreen(tB, TABLE.w, rowCenterY(MATCH));
            const p = bezier(from, beamCtrl, beamFrom, chipU);
            return (
              <g opacity={chipOn} transform={`translate(${p.x} ${p.y})`}>
                <rect x={-26} y={-18} width={52} height={36} rx={9} fill={P.yellow} stroke={P.ink} strokeWidth={2.5} />
                <rect x={-15} y={-7} width={30} height={4} rx={2} fill={P.ink} />
                <rect x={-15} y={3} width={20} height={4} rx={2} fill={P.ink} />
              </g>
            );
          })()
        ) : null}
      </svg>

      {/* Légende de l'étape en cours */}
      {CAPTIONS.map((c) => {
        const o = windowed(t, c.a, c.b, 0.4);
        return (
          <div
            key={c.num}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 968,
              display: 'flex',
              justifyContent: 'center',
              opacity: o,
              transform: `translateY(${(1 - ramp(t, c.a, c.a + 0.5)) * 16}px)`,
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 16, fontSize: 28, color: P.ink}}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: P.blue,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {c.num}
              </span>
              <span>{c.text}</span>
            </div>
          </div>
        );
      })}

      {/* Final : un seul cas traverse les trois étapes */}
      <div style={{position: 'absolute', inset: 0, opacity: finalOn}}>
        {['Interface · Softr', 'Données · Airtable', 'Agent IA'].map((l, i) => (
          <div
            key={l}
            style={{
              position: 'absolute',
              left: nodesX[i] - 200,
              width: 400,
              top: 680,
              textAlign: 'center',
              fontSize: 26,
              fontWeight: 700,
              color: P.ink,
            }}
          >
            {l}
          </div>
        ))}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <line
            x1={nodesX[0]}
            y1={THREAD_Y}
            x2={nodesX[0] + (nodesX[2] - nodesX[0]) * threadDraw}
            y2={THREAD_Y}
            stroke={P.yellow}
            strokeWidth={8}
            strokeLinecap="round"
          />
          {nodesX.map((x) => {
            const reached = interpolate(travel, [x - 30, x], [0, 1], CLAMP) * ramp(t, 55.3, 55.5);
            return (
              <circle
                key={x}
                cx={x}
                cy={THREAD_Y}
                r={14}
                fill={interpolateColors(reached, [0, 1], [P.card, P.blue])}
                stroke={P.blue}
                strokeWidth={4}
              />
            );
          })}
        </svg>
        <Avatar
          size={64}
          style={{
            position: 'absolute',
            left: travel - 32,
            top: THREAD_Y - 32,
            border: `4px solid ${P.ink}`,
            boxSizing: 'border-box',
            opacity: ramp(t, 55.0, 55.4),
            transform: `scale(${0.6 + 0.4 * ramp(t, 55.0, 55.5)})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 860,
            textAlign: 'center',
            opacity: tagIn,
            transform: `translateY(${(1 - tagIn) * 18}px)`,
          }}
        >
          <div style={{fontSize: 46, fontWeight: 700, letterSpacing: -0.5}}>
            Un seul cas traverse toute la formation : <span style={{color: P.blue}}>Emma Rousseau</span>.
          </div>
          <div style={{fontSize: 26, color: P.muted, marginTop: 10, fontWeight: 500}}>
            L'interface, les données, puis l'agent : chaque étape s'appuie sur la précédente.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
