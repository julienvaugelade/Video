// Génère les tracés SVG de la carte d'Afrique utilisée par les vidéos Le Break.
// Sortie : src/lebreak/afrique.json (pays + pays mis en avant + positions des repères).
import {readFileSync, writeFileSync} from 'node:fs';
import {feature} from 'topojson-client';
import {geoMercator, geoPath} from 'd3-geo';

const W = 760;
const H = 820;

// Codes ISO 3166-1 numériques des pays d'Afrique continentale et insulaire.
const AFRIQUE = new Set([
  '012', '024', '204', '072', '854', '108', '120', '132', '140', '148', '174',
  '178', '180', '384', '262', '818', '226', '232', '748', '231', '266', '270',
  '288', '324', '624', '404', '426', '430', '434', '450', '454', '466', '478',
  '480', '504', '508', '516', '562', '566', '646', '678', '686', '690', '694',
  '706', '710', '728', '729', '834', '768', '788', '800', '732', '894', '716',
]);

// Pays d'origine des recettes (site lebreaktoulouse.fr) : Sénégal, Guinée,
// Côte d'Ivoire, Congo (les deux Congo sont mis en avant sous un même repère).
const ORIGINES = {
  '686': 'Sénégal',
  '324': 'Guinée',
  '384': "Côte d'Ivoire",
  '178': 'Congo',
  '180': 'Congo',
};

const topo = JSON.parse(
  readFileSync(new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url)),
);
const pays = feature(topo, topo.objects.countries).features.filter(
  (f) => AFRIQUE.has(f.id) || f.properties.name === 'Somaliland',
);

const projection = geoMercator().fitSize([W, H], {type: 'FeatureCollection', features: pays});
const path = geoPath(projection).digits(1);

const out = {
  width: W,
  height: H,
  pays: pays.map((f) => ({id: f.id ?? f.properties.name, d: path(f), origine: ORIGINES[f.id] ?? null})),
  reperes: {},
};

for (const f of pays) {
  const nom = ORIGINES[f.id];
  if (!nom || out.reperes[nom]) continue;
  const [x, y] = path.centroid(f);
  out.reperes[nom] = [Math.round(x), Math.round(y)];
}
// Un seul repère « Congo » entre Brazzaville et Kinshasa.
out.reperes.Congo = (() => {
  const [x, y] = projection([15.3, -4.3]);
  return [Math.round(x), Math.round(y)];
})();

// Toulouse, hors de la carte (au-dessus) : point d'arrivée de l'arc « recettes → Toulouse ».
out.toulouse = projection([1.444, 43.605]).map(Math.round);

writeFileSync(new URL('../src/lebreak/afrique.json', import.meta.url), JSON.stringify(out));
console.log(`OK → src/lebreak/afrique.json (${out.pays.length} pays)`, out.reperes, out.toulouse);
