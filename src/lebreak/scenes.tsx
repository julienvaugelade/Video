import React from 'react';
import {AbsoluteFill, interpolate, interpolateColors, Sequence, useCurrentFrame} from 'remotion';
import {evolvePath} from '@remotion/paths';
import afrique from './afrique.json';
import timing from './timing.json';
import {Globe, Horloge, Marmite, Metro, Pousse, Repere, Sac, Scooter, Tampon, Telephone} from './icones';
import {Logo} from './logo';
import {Kente, Wax} from './motifs';
import {DESSERTS, Plat, PLATS, PRIX_DESSERT} from './plats';
import {b, CLAMP, DISPLAY, easeInOut, easeOut, H, P, pop, ramp, TEXTE, W} from './theme';

const C = timing.cues;

// ---------------------------------------------------------------------------
// Briques
// ---------------------------------------------------------------------------

const Fond: React.FC<{id: string; couleur: string; motif: string; opacite?: number}> = ({
  id,
  couleur,
  motif,
  opacite = 0.1,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: couleur}}>
      <Wax id={id} color={motif} opacity={opacite} dx={f * 0.8} dy={f * 0.4} />
    </AbsoluteFill>
  );
};

/** Texte qui monte derrière un masque. `f` : images depuis le début de l'apparition. */
const Ligne: React.FC<{f: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  f,
  children,
  style,
}) => {
  const p = ramp(f, 0, 12, easeOut);
  return (
    <div style={{overflow: 'hidden', paddingBottom: 4, ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 110}%)`}}>{children}</div>
    </div>
  );
};

/** Pastille de prix festonnée, posée comme un autocollant. */
const Pastille: React.FC<{f: number; texte: string; fond: string; couleur: string; size?: number}> = ({
  f,
  texte,
  fond,
  couleur,
  size = 200,
}) => {
  const s = pop(f, 9);
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        transform: `scale(${s}) rotate(${interpolate(s, [0, 1], [-60, -10])}deg)`,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 120 120" style={{position: 'absolute'}}>
        {Array.from({length: 18}, (_, i) => (
          <circle key={i} cx={60} cy={8} r={8} fill={fond} transform={`rotate(${i * 20} 60 60)`} />
        ))}
        <circle cx={60} cy={60} r={52} fill={fond} />
        <circle cx={60} cy={60} r={44} fill="none" stroke={couleur} strokeWidth={2} strokeDasharray="4 5" />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: DISPLAY,
          fontSize: size * 0.27,
          color: couleur,
        }}
      >
        {texte}
      </div>
    </div>
  );
};

const Losange: React.FC<{couleur: string; size?: number}> = ({couleur, size = 18}) => (
  <div style={{width: size, height: size, background: couleur, transform: 'rotate(45deg)', flexShrink: 0}} />
);

const Surtitre: React.FC<{f: number; couleur: string; children: React.ReactNode}> = ({f, couleur, children}) => {
  const p = ramp(f, 0, 12);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        opacity: p,
        transform: `translateX(${(1 - p) * -30}px)`,
        fontFamily: TEXTE,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: 8,
        color: couleur,
      }}
    >
      <Losange couleur={couleur} size={14} />
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Intro : logo
// ---------------------------------------------------------------------------

export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const c = C.intro;
  const bande = ramp(f, 0, 14, easeInOut);
  const ville = pop(f - b(c.ville), 10);

  return (
    <AbsoluteFill>
      <Fond id="wax-intro" couleur={P.nuit} motif={P.brun} opacite={0.7} />
      {[470, 360, 260].map((r, i) => {
        const s = pop(f - i * 4, 14);
        return (
          <svg key={r} width={W} height={H} style={{position: 'absolute'}}>
            <circle
              cx={W / 2}
              cy={500}
              r={r * s}
              fill="none"
              stroke={[P.feuille, P.piment, P.safran][i]}
              strokeWidth={i === 2 ? 4 : 10}
              strokeDasharray={i === 1 ? '2 26' : i === 0 ? '60 20' : undefined}
              strokeLinecap="round"
              opacity={0.85}
              transform={`rotate(${f * (i % 2 ? -0.4 : 0.3)} ${W / 2} 500)`}
            />
          </svg>
        );
      })}
      <Kente id="kente-intro-haut" y={0} height={48} x={(bande - 1) * W} offset={f * 2} />
      <Kente id="kente-intro-bas" y={H - 48} height={48} x={(1 - bande) * W} offset={-f * 2} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 30}}>
        <Logo f={f - b(c.case)} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 1330,
          top: 300,
          transform: `scale(${ville}) rotate(${interpolate(ville, [0, 1], [-40, -8])}deg)`,
          background: P.piment,
          color: P.creme,
          fontFamily: DISPLAY,
          fontSize: 48,
          letterSpacing: 2,
          padding: '6px 22px',
          borderRadius: 10,
        }}
      >
        TOULOUSE
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Promesse (30 s) : « Spécialités africaines » + trois engagements
// ---------------------------------------------------------------------------

const PUCES = [
  {texte: '100 % HALAL', fond: P.feuille, couleur: P.creme, Icone: Tampon, c: P.or, c2: P.feuille},
  {texte: 'FAIT MAISON', fond: P.safran, couleur: P.nuit, Icone: Marmite, c: P.nuit, c2: P.piment},
  {texte: 'PRODUITS FRAIS', fond: P.nuit, couleur: P.or, Icone: Pousse, c: P.feuille, c2: P.or},
];

export const Promesse: React.FC = () => {
  const f = useCurrentFrame();
  const c = C.promesse;
  const trait = ramp(f, b(c.l2) + 8, b(c.l2) + 22, easeInOut);

  return (
    <AbsoluteFill>
      <Fond id="wax-promesse" couleur={P.creme} motif={P.terre} opacite={0.07} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 0}}>
        <Ligne f={f - b(c.l1)}>
          <div style={{fontFamily: DISPLAY, fontSize: 220, lineHeight: 1.05, color: P.nuit}}>SPÉCIALITÉS</div>
        </Ligne>
        <div style={{position: 'relative'}}>
          <Ligne f={f - b(c.l2)}>
            <div style={{fontFamily: DISPLAY, fontSize: 220, lineHeight: 1.05, color: P.piment}}>AFRICAINES</div>
          </Ligne>
          <svg width={1000} height={60} viewBox="0 0 1000 60" style={{position: 'absolute', left: -20, bottom: -36}}>
            <path
              d="M10 40 Q250 8 500 30 T990 18"
              fill="none"
              stroke={P.safran}
              strokeWidth={14}
              strokeLinecap="round"
              {...evolvePath(trait, 'M10 40 Q250 8 500 30 T990 18')}
            />
          </svg>
        </div>
        <div style={{display: 'flex', gap: 40, marginTop: 80}}>
          {PUCES.map((p, i) => {
            const s = pop(f - b(c.puces[i]), 10);
            return (
              <div
                key={p.texte}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  background: p.fond,
                  color: p.couleur,
                  padding: '16px 36px 16px 22px',
                  borderRadius: 100,
                  fontFamily: DISPLAY,
                  fontSize: 54,
                  opacity: interpolate(s, [0, 0.1], [0, 1], CLAMP),
                  transform: `scale(${s}) rotate(${(i - 1) * 2.5}deg)`,
                }}
              >
                <p.Icone size={72} c={p.c} c2={p.c2} f={f} />
                {p.texte}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Origines (45 s) : carte d'Afrique, pays d'origine des recettes → Toulouse
// ---------------------------------------------------------------------------

const ORIGINES = [
  {nom: 'Sénégal', couleur: P.piment},
  {nom: 'Guinée', couleur: P.safran},
  {nom: "Côte d'Ivoire", couleur: P.feuille},
  {nom: 'Congo', couleur: P.terre},
];
const CARTE = {x: 960, y: 90, echelle: 1.08, haut: 120};

export const Origines: React.FC = () => {
  const f = useCurrentFrame();
  const c = C.origines;
  const carte = ramp(f, b(c.carte), b(c.carte) + 16);
  const [tx, ty] = afrique.toulouse;
  const toulouse = pop(f - b(c.toulouse), 10);
  const reperes = afrique.reperes as Record<string, number[]>;

  return (
    <AbsoluteFill>
      <Fond id="wax-origines" couleur={P.creme} motif={P.terre} opacite={0.06} />

      <div style={{position: 'absolute', left: 150, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <Surtitre f={f - b(c.titre) + 6} couleur={P.terre}>
          NOS RECETTES
        </Surtitre>
        <Ligne f={f - b(c.titre)} style={{marginTop: 16}}>
          <div style={{fontFamily: DISPLAY, fontSize: 128, lineHeight: 1.02, color: P.nuit}}>LES SAVEURS</div>
        </Ligne>
        <Ligne f={f - b(c.titre) - 4}>
          <div style={{fontFamily: DISPLAY, fontSize: 128, lineHeight: 1.02, color: P.nuit}}>DE L'AFRIQUE</div>
        </Ligne>
        <div style={{marginTop: 40, display: 'flex', flexDirection: 'column', gap: 6}}>
          {ORIGINES.map((o, i) => {
            const p = ramp(f, b(c.pays[i]), b(c.pays[i]) + 10);
            return (
              <div
                key={o.nom}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  opacity: p,
                  transform: `translateX(${(1 - p) * -60}px)`,
                }}
              >
                <Losange couleur={o.couleur} size={30} />
                <span style={{fontFamily: DISPLAY, fontSize: 80, lineHeight: 1.1, color: o.couleur}}>
                  {o.nom.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: TEXTE,
            fontWeight: 600,
            fontSize: 48,
            color: P.nuit,
            opacity: toulouse,
            transform: `translateY(${(1 - toulouse) * 30}px)`,
          }}
        >
          … cuisinées à Toulouse.
        </div>
      </div>

      <svg
        width={760 * CARTE.echelle}
        height={(afrique.height + CARTE.haut) * CARTE.echelle}
        viewBox={`0 ${-CARTE.haut} 760 ${afrique.height + CARTE.haut}`}
        style={{position: 'absolute', left: CARTE.x, top: CARTE.y, overflow: 'visible'}}
      >
        <g
          opacity={carte}
          transform={`translate(380 410) scale(${interpolate(carte, [0, 1], [0.9, 1])}) translate(-380 -410)`}
        >
          {afrique.pays.map((pays, i) => {
            const k = ORIGINES.findIndex((o) => o.nom === pays.origine);
            const fill =
              k < 0
                ? P.sable
                : interpolateColors(ramp(f, b(c.pays[k]), b(c.pays[k]) + 8), [0, 1], [P.sable, ORIGINES[k].couleur]);
            return <path key={i} d={pays.d} fill={fill} stroke={P.creme} strokeWidth={1.4} />;
          })}
        </g>
        {ORIGINES.map((o, i) => {
          const [x, y] = reperes[o.nom];
          const debut = b(c.pays[i]);
          const s = pop(f - debut, 10);
          const onde = ((f - debut) % 30) / 30;
          const d = `M${x} ${y} Q${(x + tx) / 2 - 170 + i * 30} ${(y + ty) / 2} ${tx} ${ty}`;
          const arc = ramp(f, b(c.arc) + i * 3, b(c.arc) + i * 3 + 22, easeInOut);
          return (
            <g key={o.nom}>
              {arc > 0 && (
                <path d={d} fill="none" stroke={P.nuit} strokeWidth={4} strokeLinecap="round" opacity={0.55} {...evolvePath(arc, d)} />
              )}
              {f > debut && (
                <circle cx={x} cy={y} r={12 + onde * 34} fill="none" stroke={o.couleur} strokeWidth={4} opacity={(1 - onde) * 0.9} />
              )}
              <circle cx={x} cy={y} r={11 * s} fill={P.nuit} stroke={P.creme} strokeWidth={4} />
            </g>
          );
        })}
        <g transform={`translate(${tx} ${ty}) scale(${toulouse})`}>
          <g transform="translate(-36 -76) scale(0.6)">
            <Repere size={120} />
          </g>
          <text x={38} y={-22} fontFamily={DISPLAY} fontSize={54} fill={P.nuit}>
            TOULOUSE
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Engagements (45 s) : fait maison, produits frais, halal
// ---------------------------------------------------------------------------

const ENGAGEMENTS = [
  {titre: 'FAIT MAISON', texte: 'Des recettes cuisinées maison', fond: P.safran, couleur: P.nuit, Icone: Marmite, c: P.nuit, c2: P.piment},
  {titre: 'PRODUITS FRAIS', texte: 'Viandes, poissons et légumes frais', fond: P.feuille, couleur: P.creme, Icone: Pousse, c: P.or, c2: P.safran},
  {titre: '100 % HALAL', texte: 'Toutes nos viandes sont halal', fond: P.piment, couleur: P.creme, Icone: Tampon, c: P.or, c2: P.piment},
];

export const Engagements: React.FC = () => {
  const f = useCurrentFrame();
  const c = C.engagements;
  return (
    <AbsoluteFill>
      <Fond id="wax-engagements" couleur={P.nuit} motif={P.brun} opacite={0.7} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 70}}>
        <Ligne f={f - b(c.titre)}>
          <div style={{fontFamily: DISPLAY, fontSize: 96, color: P.creme}}>
            CHEZ <span style={{color: P.safran}}>LE BREAK</span>
          </div>
        </Ligne>
        <div style={{display: 'flex', gap: 56}}>
          {ENGAGEMENTS.map((e, i) => {
            const s = pop(f - b(c.cartes[i]), 11);
            return (
              <div
                key={e.titre}
                style={{
                  width: 500,
                  height: 500,
                  borderRadius: 36,
                  background: e.fond,
                  color: e.couleur,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 26,
                  opacity: interpolate(s, [0, 0.1], [0, 1], CLAMP),
                  transform: `translateY(${(1 - s) * 200}px) rotate(${interpolate(s, [0, 1], [i % 2 ? 14 : -14, (i - 1) * 2])}deg)`,
                }}
              >
                <e.Icone size={170} c={e.c} c2={e.c2} f={f} />
                <div style={{fontFamily: DISPLAY, fontSize: 76}}>{e.titre}</div>
                <div style={{fontFamily: TEXTE, fontWeight: 500, fontSize: 30, maxWidth: 400, textAlign: 'center', lineHeight: 1.3}}>
                  {e.texte}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Menu : un plat par diapositive, le fond s'ouvre en cercle depuis l'assiette
// ---------------------------------------------------------------------------

const ASSIETTE = {x: 560, y: 560};
const REVELE = 14;

const Diapo: React.FC<{plat: Plat; index: number; total: number; duree: number}> = ({plat, index, total, duree}) => {
  const f = useCurrentFrame();
  const c = C.plat;
  const premier = index === 0;
  const rayon = premier ? 2400 : interpolate(f, [0, REVELE], [0, 2400], {...CLAMP, easing: easeInOut});
  const arrivee = pop(f - (premier ? 4 : 6), 15);
  const sortie = ramp(f, duree - 8, duree + 6, easeInOut);
  const nom = f - b(c.nom);
  const texteSortie = ramp(f, duree - 8, duree, easeInOut);
  const surPastille = plat.accent === P.or ? P.nuit : P.creme;

  return (
    <AbsoluteFill style={{clipPath: `circle(${rayon}px at ${ASSIETTE.x}px ${ASSIETTE.y}px)`}}>
      <Fond id={`wax-plat-${index}`} couleur={plat.fond} motif={plat.texte} opacite={0.07} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <circle cx={ASSIETTE.x} cy={ASSIETTE.y} r={380 * arrivee} fill={plat.texte} opacity={0.08} />
        <circle
          cx={ASSIETTE.x}
          cy={ASSIETTE.y}
          r={420 * arrivee}
          fill="none"
          stroke={plat.accent}
          strokeWidth={8}
          strokeDasharray="2 24"
          strokeLinecap="round"
          transform={`rotate(${-f * 0.5} ${ASSIETTE.x} ${ASSIETTE.y})`}
        />
        <g
          transform={`translate(${ASSIETTE.x + interpolate(arrivee, [0, 1], [-900, 0]) + sortie * 120} ${
            ASSIETTE.y + sortie * 40
          }) scale(${1 - sortie * 0.15})`}
        >
          <circle cx={16} cy={26} r={300} fill={P.nuit} opacity={0.22} />
          <g transform={`rotate(${interpolate(arrivee, [0, 1], [-200, 0]) + f * 0.25})`}>
            <plat.Illustration f={f - 10} />
          </g>
        </g>
      </svg>
      <div style={{position: 'absolute', left: 860, top: 170}}>
        <Pastille f={f - b(c.prix)} texte={plat.prix} fond={plat.accent} couleur={surPastille} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1080,
          width: 760,
          top: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 22,
          color: plat.texte,
          opacity: 1 - texteSortie,
          transform: `translateY(${-texteSortie * 40}px)`,
        }}
      >
        <Surtitre f={nom - 4} couleur={plat.texte}>
          LE MENU · {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </Surtitre>
        <div style={{display: 'flex', flexWrap: 'wrap', columnGap: 34}}>
          {plat.nom.toUpperCase().split(' ').map((mot, i) => (
            <Ligne key={i} f={nom - i * 3}>
              <div style={{fontFamily: DISPLAY, fontSize: 150, lineHeight: 1.12}}>{mot}</div>
            </Ligne>
          ))}
        </div>
        <div
          style={{
            fontFamily: TEXTE,
            fontWeight: 500,
            fontSize: 38,
            lineHeight: 1.35,
            maxWidth: 720,
            opacity: ramp(nom, 8, 20),
            transform: `translateY(${(1 - ramp(nom, 8, 20)) * 20}px)`,
          }}
        >
          {plat.desc}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Menu: React.FC<{plats: string[]; beatsParPlat: number}> = ({plats, beatsParPlat}) => {
  const duree = b(beatsParPlat);
  return (
    <AbsoluteFill>
      {plats.map((id, i) => (
        <Sequence key={id} from={i * duree} durationInFrames={duree + (i < plats.length - 1 ? REVELE : 0)}>
          <Diapo plat={PLATS[id]} index={i} total={plats.length} duree={duree} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Desserts (45 s)
// ---------------------------------------------------------------------------

export const Desserts: React.FC = () => {
  const f = useCurrentFrame();
  const c = C.desserts;
  return (
    <AbsoluteFill>
      <Fond id="wax-desserts" couleur={P.brun} motif={P.terre} opacite={0.35} />
      <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
        <Surtitre f={f - 6} couleur={P.safran}>
          POUR FINIR EN DOUCEUR
        </Surtitre>
        <Ligne f={f - 4}>
          <div style={{fontFamily: DISPLAY, fontSize: 120, color: P.creme}}>DESSERTS EXOTIQUES</div>
        </Ligne>
      </div>
      {DESSERTS.map((d, i) => {
        const debut = b(c.bols[i]);
        const s = pop(f - debut, 14);
        const x = i === 0 ? 600 : 1320;
        return (
          <div key={d.nom}>
            <svg width={W} height={H} style={{position: 'absolute'}}>
              <g transform={`translate(${x} ${interpolate(s, [0, 1], [1200, 575])}) scale(0.78)`}>
                <circle cx={16} cy={26} r={300} fill={P.nuit} opacity={0.4} />
                <g transform={`rotate(${interpolate(s, [0, 1], [140, 0]) + f * 0.3})`}>
                  <d.Illustration f={f - debut - 6} />
                </g>
              </g>
            </svg>
            <div style={{position: 'absolute', left: x + 120, top: 300}}>
              <Pastille f={f - b(c.prix) - i * 3} texte={PRIX_DESSERT} fond={P.piment} couleur={P.creme} size={170} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: x - 400,
                width: 800,
                top: 840,
                textAlign: 'center',
                opacity: ramp(f, debut + 8, debut + 18),
              }}
            >
              <div style={{fontFamily: DISPLAY, fontSize: 72, color: P.creme, lineHeight: 1.15}}>{d.nom.toUpperCase()}</div>
              <div style={{fontFamily: TEXTE, fontWeight: 500, fontSize: 34, color: P.safran}}>{d.desc}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Commande : livraison, click & collect, ouvert 7 j/7
// ---------------------------------------------------------------------------

const MODES = [
  {titre: 'LIVRAISON', texte: 'Livrée chez vous', Icone: Scooter},
  {titre: 'CLICK & COLLECT', texte: 'Commandez, passez récupérer', Icone: Sac},
];

export const Commande: React.FC = () => {
  const f = useCurrentFrame();
  const c = C.commande;
  const horaires = pop(f - b(c.horaires), 12);
  return (
    <AbsoluteFill>
      <Fond id="wax-commande" couleur={P.safran} motif={P.terre} opacite={0.12} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 60}}>
        <Ligne f={f - b(c.titre)}>
          <div style={{fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, color: P.nuit}}>COMMANDEZ EN LIGNE</div>
        </Ligne>
        <div style={{display: 'flex', gap: 50}}>
          {MODES.map((m, i) => {
            const s = pop(f - b(c.cartes[i]), 11);
            return (
              <div
                key={m.titre}
                style={{
                  width: 780,
                  height: 250,
                  borderRadius: 32,
                  background: P.nuit,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 40,
                  padding: '0 50px',
                  boxSizing: 'border-box',
                  opacity: interpolate(s, [0, 0.1], [0, 1], CLAMP),
                  transform: `scale(${s}) rotate(${(i ? 1.5 : -1.5) * s}deg)`,
                }}
              >
                <div style={{transform: `translateY(${Math.sin(f * 0.6) * (i ? 0 : 3)}px)`}}>
                  <m.Icone size={150} c={P.creme} c2={P.piment} f={f} />
                </div>
                <div>
                  <div style={{fontFamily: DISPLAY, fontSize: 70, color: P.creme, lineHeight: 1.1, whiteSpace: 'nowrap'}}>{m.titre}</div>
                  <div style={{fontFamily: TEXTE, fontWeight: 500, fontSize: 30, color: P.safran, whiteSpace: 'nowrap'}}>{m.texte}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            background: P.creme,
            borderRadius: 100,
            padding: '12px 40px 12px 16px',
            opacity: interpolate(horaires, [0, 0.1], [0, 1], CLAMP),
            transform: `translateY(${(1 - horaires) * 120}px)`,
          }}
        >
          <Horloge size={80} c={P.nuit} c2={P.safran} f={f} />
          <span style={{fontFamily: DISPLAY, fontSize: 60, color: P.nuit}}>OUVERT 7 JOURS SUR 7</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Fin : logo + coordonnées
// ---------------------------------------------------------------------------

const INFOS = [
  {Icone: Repere, l1: '254 rue Henri Desbals', l2: '31100 Toulouse'},
  {Icone: Metro, l1: 'Métro Fontaine-Lestang', l2: 'Ligne A'},
  {Icone: Telephone, l1: '05 62 83 77 52', l2: 'Appelez-nous'},
  {Icone: Globe, l1: 'lebreaktoulouse.com', l2: 'Commande en ligne'},
];

export const Fin: React.FC = () => {
  const f = useCurrentFrame();
  const c = C.fin;
  const slogan = pop(f - b(c.slogan), 11);
  return (
    <AbsoluteFill>
      <Fond id="wax-fin" couleur={P.nuit} motif={P.brun} opacite={0.7} />
      <Kente id="kente-fin" y={H - 56} height={56} offset={-f * 2} />
      <div style={{position: 'absolute', left: 120, width: 820, top: 70, display: 'flex', justifyContent: 'center'}}>
        <Logo f={f - b(c.logo)} scale={0.92} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1060,
          top: 0,
          bottom: 120,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 34,
        }}
      >
        {INFOS.map((info, i) => {
          const p = ramp(f, b(c.infos[i]), b(c.infos[i]) + 12);
          return (
            <div
              key={info.l1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                opacity: p,
                transform: `translateX(${(1 - p) * 80}px)`,
              }}
            >
              <info.Icone size={84} c={i === 0 ? P.piment : P.safran} c2={i === 0 ? P.creme : P.nuit} />
              <div>
                <div style={{fontFamily: TEXTE, fontWeight: 700, fontSize: 46, color: P.creme, lineHeight: 1.15}}>{info.l1}</div>
                <div style={{fontFamily: TEXTE, fontWeight: 500, fontSize: 30, color: P.safran}}>{info.l2}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 100,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: P.piment,
            color: P.creme,
            fontFamily: DISPLAY,
            fontSize: 56,
            letterSpacing: 2,
            padding: '8px 40px',
            borderRadius: 12,
            opacity: interpolate(slogan, [0, 0.1], [0, 1], CLAMP),
            transform: `scale(${slogan}) rotate(${interpolate(slogan, [0, 1], [-8, -1.5])}deg)`,
          }}
        >
          SPÉCIALITÉS AFRICAINES HALAL
        </div>
      </div>
    </AbsoluteFill>
  );
};
