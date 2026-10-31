# -*- coding: utf-8 -*-
"""Fiche Senza : les trois outils son (Openverse, Real SFX, Earshot) pour l'équipe communication.

Génère, dans le dossier kit-outils-son-senza/ à transmettre à l'équipe :
  - Fiche_outils_son_Senza.pdf (design system Senza, skill senza-guides-pdf) ;
  - Prompts_Claude_outils_son.md (les mêmes prompts, à copier-coller).
Usage : python3 docs/fiche-outils-son/generer_fiche.py
"""
import glob
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = sorted(glob.glob(os.path.expanduser("~/.claude/skills/**/senza-guides-pdf"), recursive=True))[0]
sys.path.insert(0, os.path.join(SKILL_DIR, "scripts"))

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFont, registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont as RLTTFont
from reportlab.platypus import (Flowable, KeepTogether, NextPageTemplate, PageBreak, Paragraph, Spacer,
                                Table, TableStyle)
from reportlab.platypus.doctemplate import ActionFlowable

from senza_theme import (GREY, HAIRLINE, INDIGO, INK, LAVENDER, WHITE, BadgeRow, Callout, ChecklistItem,
                         OffsetTitle, SectionHeading, SenzaGuide, StatRow, hl, track)

KIT = os.path.normpath(os.path.join(HERE, "..", "..", "kit-outils-son-senza"))
OUT = os.path.join(KIT, "Fiche_outils_son_Senza.pdf")
OUT_PROMPTS = os.path.join(KIT, "Prompts_Claude_outils_son.md")


# ------------------------------------------------------------------ typographie française
def fr(text):
    """Espaces insécables avant : ; ! ? et à l'intérieur des guillemets."""
    text = re.sub(r" ([:;!?»])", " \\1", text)
    return text.replace("« ", "« ")


# ------------------------------------------------------------------ polices Mulish statiques
FONTS = os.path.join(SKILL_DIR, "assets", "fonts")
STATIC = os.path.join(HERE, ".mulish_static")


def make_mulish_static():
    os.makedirs(STATIC, exist_ok=True)
    jobs = [("Mulish-Regular.ttf", 400, "Mulish-Regular"), ("Mulish-Regular.ttf", 600, "Mulish-SemiBold"),
            ("Mulish-Regular.ttf", 700, "Mulish-Bold"), ("Mulish-Italic.ttf", 400, "Mulish-Italic")]
    for src, wght, ps in jobs:
        dest = os.path.join(STATIC, ps + ".ttf")
        if not os.path.exists(dest):
            f = instancer.instantiateVariableFont(TTFont(os.path.join(FONTS, src)), {"wght": wght})
            for rec in f["name"].names:
                if rec.nameID in (4, 6):
                    rec.string = ps
                if rec.nameID == 2:
                    rec.string = ps.split("-")[1]
            f.save(dest)
    for rl, ps in [("MulishS", "Mulish-Regular"), ("MulishS-SemiBold", "Mulish-SemiBold"),
                   ("MulishS-Bold", "Mulish-Bold"), ("MulishS-Italic", "Mulish-Italic")]:
        registerFont(RLTTFont(rl, os.path.join(STATIC, ps + ".ttf")))
    registerFontFamily("MulishS", normal="MulishS", bold="MulishS-Bold",
                       italic="MulishS-Italic", boldItalic="MulishS-Bold")


def use_mulish_static(g):
    make_mulish_static()
    for st in g.styles.values():
        if getattr(st, "fontName", "").startswith("Mulish"):
            st.fontName = st.fontName.replace("Mulish", "MulishS", 1)


# ------------------------------------------------------------------ couverture interne (pas de chiffres commerciaux)
class FicheInterne(SenzaGuide):
    cover_badges = []
    cover_stats = []

    def _build_cover(self):
        self.story.append(Spacer(1, 62 * mm))
        if self.kicker:
            # tracking mot par mot, joint par des insécables (sinon « SON ET... » se colle)
            k = "   ".join(track(w, " ") for w in self.kicker.split())
            self.story.append(Paragraph(k, ParagraphStyle(
                "k", fontName="Poppins-SemiBold", fontSize=10, leading=14, textColor=LAVENDER, spaceAfter=10)))
        self.story.append(OffsetTitle(self.title, highlight=self.highlight, size=34, color=WHITE, shadow=INK,
                                      hl_bg=LAVENDER, hl_fg=INK))
        if self.subtitle:
            self.story.append(Spacer(1, 8))
            self.story.append(Paragraph(fr(self.subtitle), ParagraphStyle(
                "sub", fontName="Poppins-Medium", fontSize=13, leading=19, textColor=WHITE)))
        self.story.append(Spacer(1, 16))
        self.story.append(BadgeRow(self.cover_badges))
        self.story.append(Spacer(1, 24 * mm))
        self.story.append(StatRow(self.cover_stats, on_ink=True))
        self.story.append(NextPageTemplate("page"))
        self.story.append(PageBreak())
        self._cover_built = True


# ------------------------------------------------------------------ correctifs de mise en page (skill senza-guides-pdf)
class _SafePageBreak(ActionFlowable):
    _BLANK_THRESHOLD = 24

    def __init__(self):
        ActionFlowable.__init__(self, ("_safe_page_break",))

    def apply(self, doc):
        frame = getattr(doc, "frame", None)
        if frame is not None and (frame._y2 - frame._y) < self._BLANK_THRESHOLD:
            return
        doc.handle_pageBreak()


def safe_section(g, title, eyebrow=None, new_page=False):
    if new_page:
        g.story.append(_SafePageBreak())
    else:
        g.story.append(Spacer(1, 8))
    heading = SectionHeading(title, eyebrow)
    heading.keepWithNext = True
    g.story.append(heading)
    sp = Spacer(1, 6)
    sp.keepWithNext = True
    g.story.append(sp)
    g._pending_kwn = True


def safe_h2(g, text):
    g.story.append(Paragraph(fr(text), g.styles["h2"]))
    g.story[-1].keepWithNext = True
    g._pending_kwn = True


def safe_h3(g, text):
    g.story.append(Paragraph(fr(text), g.styles["h3"]))
    g.story[-1].keepWithNext = True
    g._pending_kwn = True


def _pull_pending_kwn_chain(g):
    pulled = []
    while g.story and getattr(g.story[-1], "keepWithNext", False):
        pulled.insert(0, g.story.pop())
    g._pending_kwn = False
    return pulled


_SHORT_LIST_MAX = 4


def _place_list(g, flows):
    if len(flows) <= _SHORT_LIST_MAX:
        group = _pull_pending_kwn_chain(g)
        group += flows
        g.story.append(KeepTogether(group))
    else:
        g._pending_kwn = False
        if len(flows) >= 2:
            flows[-2].keepWithNext = True
        g.story.extend(flows)
    g.story.append(Spacer(1, 4))


def safe_bullets(g, items):
    _place_list(g, [Paragraph(fr(it), g.styles["bullet"], bulletText="•") for it in items])


def safe_steps(g, items):
    _place_list(g, [Paragraph(f'<font name="Poppins-Bold" color="#4E4EEA">{i}.</font>  {fr(it)}',
                              g.styles["bullet"]) for i, it in enumerate(items, 1)])


def safe_checklist(g, items, title=None):
    if title:
        safe_h3(g, title)
    _place_list(g, [ChecklistItem(fr(it), styles=g.styles) for it in items])


def safe_group(g, *fns):
    start = len(g.story)
    for fn in fns:
        fn()
    group = g.story[start:]
    del g.story[start:]
    g.story.append(KeepTogether(group))


def callout(g, text, variant="soft", title=None, lines=False):
    """Encadré ; lines=True pour une liste ligne à ligne (alignée à gauche, pas justifiée)."""
    g.callout(fr(text), variant=variant, title=title)
    if lines:
        co = next(f for f in reversed(g.story) if isinstance(f, Callout))
        co.p = Paragraph(fr(text), ParagraphStyle("co_left", parent=co.p.style, alignment=TA_LEFT))


_TERM = re.compile(r"(^|(?<=\. ))([^:.]{2,60}?) : ")


def bold_terms(text):
    return _TERM.sub(lambda m: m.group(1) + '<font name="Poppins-SemiBold">' + m.group(2) + '</font> : ', text)


def table(g, rows, widths):
    th = ParagraphStyle("th", fontName="Poppins-SemiBold", fontSize=9, leading=12, textColor=WHITE)
    td = ParagraphStyle("td", parent=g.styles["body"], fontSize=9.5, leading=13.5, alignment=TA_LEFT, spaceAfter=0)
    tdb = ParagraphStyle("tdb", parent=td, fontName="Poppins-SemiBold", textColor=INDIGO)
    data = [[Paragraph(fr(c), th) for c in rows[0]]]
    for r in rows[1:]:
        data.append([Paragraph(fr(r[0]), tdb)] + [Paragraph(fr(c), td) for c in r[1:]])
    g.table(data, col_widths=widths)
    t = next(f for f in reversed(g.story) if isinstance(f, Table))
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))


# ------------------------------------------------------------------ schéma « trouver, placer, créer »
class FlowDiagram(Flowable):
    """Trois cartes blanches numérotées reliées par des flèches indigo (dessin vectoriel)."""

    def __init__(self, cards, height=92):
        super().__init__()
        self.cards, self.h = cards, height

    def wrap(self, availWidth, availHeight):
        self.w = availWidth
        self.height = self.h
        return self.w, self.height

    def draw(self):
        c = self.canv
        gap = 22
        cw = (self.w - 2 * gap) / 3
        desc = ParagraphStyle("fd", fontName="MulishS", fontSize=9, leading=12.6, textColor=INK)
        for i, (verb, tool, text) in enumerate(self.cards):
            x = i * (cw + gap)
            c.setFillColor(WHITE)
            c.setStrokeColor(HAIRLINE)
            c.setLineWidth(0.8)
            c.roundRect(x, 0, cw, self.h, 12, stroke=1, fill=1)
            # pastille numérotée
            c.setFillColor(INDIGO)
            c.circle(x + 20, self.h - 21, 10, stroke=0, fill=1)
            c.setFillColor(WHITE)
            c.setFont("Poppins-Bold", 11)
            c.drawCentredString(x + 20, self.h - 25, str(i + 1))
            # verbe + outil
            c.setFillColor(INK)
            c.setFont("Poppins-XBold", 13)
            c.drawString(x + 37, self.h - 20, verb.upper())
            c.setFillColor(INDIGO)
            c.setFont("Poppins-SemiBold", 8.5)
            c.drawString(x + 37, self.h - 32, track(tool, " "))
            p = Paragraph(fr(text), desc)
            _, ph = p.wrap(cw - 24, self.h)
            p.drawOn(c, x + 12, self.h - 46 - ph)
            # flèche vers la carte suivante
            if i < 2:
                ax = x + cw + 4
                ay = self.h / 2
                c.setStrokeColor(INDIGO)
                c.setLineWidth(1.8)
                c.setLineCap(1)
                c.line(ax, ay, ax + gap - 11, ay)
                path = c.beginPath()
                path.moveTo(ax + gap - 4, ay)
                path.lineTo(ax + gap - 12, ay + 5)
                path.lineTo(ax + gap - 12, ay - 5)
                path.close()
                c.setFillColor(INDIGO)
                c.drawPath(path, stroke=0, fill=1)


def figure(g, flowable, caption=None):
    items = [Spacer(1, 4), flowable]
    if caption:
        items += [Spacer(1, 5), Paragraph(fr(caption), g.styles["caption"])]
    items.append(Spacer(1, 8))
    pulled = _pull_pending_kwn_chain(g)
    g.story.append(KeepTogether(pulled + items))


# ------------------------------------------------------------------ cartes de prompts
class PromptCard(Flowable):
    """Prompt à copier : carte blanche, liseré lavande, étiquette indigo, texte du prompt."""

    def __init__(self, label, text, styles):
        super().__init__()
        self.label = label
        self.p = Paragraph(fr(text), ParagraphStyle(
            "pc", parent=styles["body"], fontSize=10, leading=15, spaceAfter=0, textColor=INK))

    def wrap(self, availWidth, availHeight):
        self.w = availWidth
        self.pad, self.lpad, self.lab_h = 11, 18, 17
        _, self.ph = self.p.wrap(self.w - self.lpad - self.pad, availHeight)
        self.height = self.pad + self.lab_h + self.ph + self.pad
        return self.w, self.height

    def draw(self):
        c = self.canv
        c.setFillColor(WHITE)
        c.setStrokeColor(HAIRLINE)
        c.setLineWidth(0.8)
        c.roundRect(0, 0, self.w, self.height, 10, stroke=1, fill=1)
        c.setFillColor(LAVENDER)
        c.roundRect(0, 0, 4, self.height, 2, stroke=0, fill=1)
        c.setFillColor(INDIGO)
        c.setFont("Poppins-SemiBold", 8.5)
        c.drawString(self.lpad, self.height - self.pad - 8, track(self.label, " "))
        self.p.drawOn(c, self.lpad, self.pad)


def prompt_cards(g, title, cards):
    """Un sous-titre et ses cartes : le titre reste attaché à la première carte."""
    safe_h3(g, title)
    first = True
    for label, text in cards:
        card = PromptCard(label, text, g.styles)
        if first:
            group = _pull_pending_kwn_chain(g) + [card]
            g.story.append(KeepTogether(group))
            first = False
        else:
            g.story.append(card)
        g.story.append(Spacer(1, 7))


# ------------------------------------------------------------------ les prompts (fiche PDF et fichier .md)
PROMPTS_INSTALL = [
    ("Installer", [
        ("Installation complète (Mac)",
         "J'ai téléchargé le kit outils son Senza dans le dossier [chemin du dossier du kit]. Lance le script "
         "installer-outils-son.sh de ce dossier pour installer Openverse, Real SFX et Earshot. Si Python 3.10 ou "
         "plus, FFmpeg ou Git manquent, installe-les d'abord ou explique-moi comment faire. À la fin, vérifie que "
         "les skills openverse-sfx, real-sfx, earshot et real-sound sont installés et que le serveur MCP earshot "
         "répond, puis résume en français ce qui a été fait."),
        ("Installation pas à pas (Windows ou sans le script)",
         "Installe pour Claude Code les trois outils son de la fiche Senza, en m'expliquant chaque étape en "
         "français. Vérifie d'abord que Python 3.10 ou plus, FFmpeg et Git sont installés.<br/>"
         "1. Copie le dossier openverse-sfx du kit [chemin du dossier du kit] dans mon dossier de skills Claude "
         "Code.<br/>"
         "2. Clone https://github.com/Clipwing/skills et copie le dossier skills/real-sfx dans mon dossier de "
         "skills.<br/>"
         "3. Clone https://github.com/Leonxlnx/earshot, crée son environnement Python, installe-le avec l'option "
         "mcp, copie ses skills earshot et real-sound dans mon dossier de skills, puis déclare Earshot comme "
         "serveur MCP de Claude Code."),
    ]),
    ("Vérifier et brancher nos sons", [
        ("Vérifier l'installation",
         "Vérifie que mes outils son fonctionnent : fais une recherche test de sons de clic sur Openverse, lance "
         "le contrôle de Real SFX et génère un son test avec Earshot. Dis-moi ce qui fonctionne et ce qui manque."),
        ("Brancher notre bibliothèque de sons",
         "Ajoute le dossier [chemin de notre bibliothèque de sons] comme bibliothèque Real SFX et construis son "
         "index. Dis-moi ensuite combien de sons ont été trouvés et de quels types."),
    ]),
]

PROMPTS_USAGE = [
    ("Trouver", [
        ("Chercher des sons",
         "Cherche sur Openverse des sons de [souffle court et aérien] de moins de 2 secondes, en licence CC0 ou "
         "CC BY. Télécharge les 5 meilleurs dans notre bibliothèque de sons et montre-moi leurs crédits."),
        ("Choisir le meilleur",
         "Classe avec Earshot les sons que tu viens de télécharger selon la description « [un souffle court et "
         "aérien] » et dis-moi lequel garder, en citant ses mesures."),
    ]),
    ("Placer", [
        ("Sonoriser une vidéo",
         "Fais le sound design de la vidéo [chemin de la vidéo] avec Real SFX. Garde la voix off et la musique, "
         "pose chaque son à l'image près, puis donne-moi la nouvelle vidéo, la piste d'effets séparée et le "
         "rapport."),
        ("Corriger un son",
         "Le son à [0:12] est trop fort et celui à [0:27] ne colle pas à l'image. Corrige-les, relance la critique "
         "et montre-moi les nouvelles notes."),
        ("Valider à l'oreille",
         "Prépare la page d'écoute comparative pour que je valide les sons depuis mon téléphone, puis tiens "
         "compte de mes réponses pour la version suivante."),
    ]),
    ("Créer", [
        ("Combler un manque",
         "Real SFX n'a rien trouvé pour [la validation finale à 0:38]. Crée avec Earshot [une note claire et "
         "courte], accordée sur la musique, et pose-la à cet instant."),
        ("Créer notre kit sonore",
         "Crée avec Earshot un kit de sons au style calme pour nos vidéos de formation (clic, transition, "
         "notification, validation) et range-le dans le dossier [Kit sonore Senza]."),
    ]),
    ("Vérifier et publier", [
        ("Contrôler un mixage",
         "Analyse le son de la vidéo [chemin de la vidéo] avec Earshot : volume général, voix couverte ou non, "
         "sons décalés par rapport aux coupes. Liste les corrections par ordre de priorité."),
        ("Préparer les crédits",
         "Rassemble les crédits de tous les sons CC BY utilisés dans cette vidéo, au format prêt à coller dans "
         "la description YouTube."),
    ]),
]


def write_prompts_md(path):
    def plain(t):
        t = re.sub(r"<br/>", "\n", t)
        return re.sub(r"<[^>]+>", "", t).replace(" ", " ")

    out = ["# Prompts Claude : outils son Senza", "",
           "À coller dans Claude Code. Remplacez les passages entre crochets [ ] par vos propres éléments "
           "(chemin d'un dossier, d'une vidéo, minutage, description du son).", ""]
    n = 0
    for part, groups in (("Installer les outils (une seule fois par ordinateur)", PROMPTS_INSTALL),
                         ("Utiliser les outils au quotidien", PROMPTS_USAGE)):
        out += [f"## {part}", ""]
        for gtitle, cards in groups:
            out += [f"### {gtitle}", ""]
            for label, text in cards:
                n += 1
                body_txt = plain(text)
                out += [f"**{n}. {label}**", "", "```text", body_txt, "```", ""]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    return n


# ================================================================== contenu
g = FicheInterne(
    OUT,
    title="LE BON SON, À LA BONNE IMAGE",
    highlight="SON",
    subtitle="Fiche outils pour l'équipe communication : trouver, placer et créer les effets sonores de nos vidéos",
    kicker="SON ET MOTION DESIGN",
    footer_left="SENZA Formations : fiche outils son",
)
g.cover_badges = [("Openverse", "lavender"), ("Real SFX", "lavender"), ("Earshot", "lavender"),
                  ("Pilotés par Claude", "lavender")]
g.cover_stats = [("3", "Outils gratuits"), ("13", "Prompts à copier"), ("252", "Sons créés en code"),
                 ("0 €", "De licence")]
use_mulish_static(g)
for k in ("body", "lead", "bullet"):
    g.styles[k].alignment = TA_JUSTIFY


def body(t):
    g.body(fr(t))


def lead(t):
    g.lead(fr(t))


# ---------------------------------------------------------------- 1. L'essentiel
safe_section(g, "Trois outils, un seul réflexe", eyebrow="L'essentiel")
lead("Claude réalise désormais des animations graphiques de grande qualité. Ses effets sonores, eux, "
     "restaient le point faible : sons génériques, mal calés, trop forts ou trop discrets.")
body(f"Trois outils gratuits comblent ce manque. Ensemble, ils permettent à Claude de poser le bon {hl('son')} "
     "à la bonne image, au bon niveau. Chacun a un rôle précis, et ils s'utilisent toujours dans le même ordre. "
     "Une règle ne change pas : Claude n'entend rien, c'est votre écoute qui valide le résultat.")
callout(g, "1. Comprendre le rôle de chacun des trois outils.<br/>"
           "2. Savoir dans quel ordre les utiliser.<br/>"
           "3. Les installer et s'en servir grâce à des prompts prêts à copier.<br/>"
           "4. Publier sans risque du côté des licences.",
        variant="green", title="Objectifs de cette fiche", lines=True)
figure(g, FlowDiagram([
    ("Trouver", "Openverse", "Cherche de vrais sons sous licence libre et les range dans notre bibliothèque."),
    ("Placer", "Real SFX", "Repère chaque moment de la vidéo et y pose un son, à l'image près."),
    ("Créer", "Earshot", "Fabrique dans le code le son introuvable, puis contrôle le mixage."),
]), caption="L'ordre rapide : chercher d'abord sur Openverse, laisser Real SFX placer les effets, "
            "utiliser Earshot pour ce qui manque.")
safe_h2(g, "Qui fait quoi")
table(g, [
    ["Outil", "Son rôle", "Ce que vous obtenez", "Coût"],
    ["Openverse", "Moteur de recherche de sons libres (Freesound, Wikimedia Commons, Jamendo, ccMixter)",
     "Des fichiers audio prêts à l'emploi, avec le crédit de chaque auteur", "Service public gratuit, sans clé"],
    ["Real SFX", "Monteur son : repère les moments et pose les sons",
     "Une vidéo sonorisée, une piste d'effets séparée et un rapport", "Gratuit, open source"],
    ["Earshot", "Bruiteur et contrôleur : crée les sons manquants et « écoute » le résultat",
     "Des sons sur mesure, un kit sonore complet, un diagnostic du mixage", "Gratuit, open source"],
], widths=[76, 146, 156, 104])

# ---------------------------------------------------------------- 2. Openverse
safe_section(g, "Openverse : trouver le son", eyebrow="Outil 1 · Trouver", new_page=True)
lead("Openverse est un moteur de recherche ouvert, développé par la communauté WordPress, qui rassemble "
     "des contenus publiés sous licence libre.")
body("Son catalogue audio regroupe notamment Freesound, Wikimedia Commons, Jamendo et ccMixter. "
     f"Son {hl('API')}, c'est-à-dire la porte d'entrée que les programmes interrogent directement, permet à "
     "Claude de chercher et de télécharger des sons tout seul. Aucune installation n'est nécessaire et les "
     "recherches de base ne demandent aucune clé.")
safe_h3(g, "Comment ça se passe")
safe_steps(g, [
    "Vous décrivez le son en français : « un souffle court et aérien pour l'apparition du titre ».",
    "Claude traduit votre demande en mots-clés anglais (whoosh, swoosh, air) et lance la recherche.",
    "Il ne garde que les sons sous licence CC0, domaine public ou CC BY : c'est le réglage par défaut.",
    "Il télécharge les meilleurs candidats dans la bibliothèque de sons, avec une fiche de crédits "
    "(CREDITS.md) qui note le titre, l'auteur, la licence et le lien de chaque fichier.",
])
callout(g, bold_terms(
    "CC0 : domaine public, aucune obligation, le meilleur choix. "
    "CC BY : usage libre, à condition de créditer l'auteur. "
    "CC BY-SA : un son posé sur une image fait de toute la vidéo une œuvre dérivée, qui devrait alors être "
    "partagée sous la même licence, donc à éviter. "
    "NC : usage commercial interdit, donc exclu pour nos vidéos. "
    "ND : modification interdite, donc ni coupe ni retouche possible."),
    variant="outline", title="Cinq mots à connaître")
callout(g, "Oublier les crédits. Un son CC BY utilisé sans nommer son auteur n'est pas conforme à sa licence. "
           "Copiez le contenu de CREDITS.md dans la description de la vidéo ou dans son générique de fin.",
        variant="coral", title="Piège fréquent")
body("Openverse cherche par mots-clés et par tags : le titre d'un fichier ne garantit pas ce que l'on entend. "
     "C'est pourquoi Claude fait ensuite vérifier les candidats par Earshot, et pourquoi votre écoute garde "
     "le dernier mot.")

# ---------------------------------------------------------------- 3. Real SFX
safe_section(g, "Real SFX : placer le son", eyebrow="Outil 2 · Placer", new_page=True)
lead("Real SFX est un skill pour Claude Code, c'est-à-dire un savoir-faire que Claude charge à la demande. "
     "Il le transforme en monteur son.")
body(f"Il regarde la vidéo, repère chaque moment qui appelle un son, choisit de {hl('vrais')} enregistrements "
     "dans nos bibliothèques et les pose à l'image près, au bon niveau, sans écraser la musique ni la voix off.")
safe_h3(g, "Les cinq étapes de son travail")
safe_steps(g, [
    "<b>Regarder.</b> Claude extrait des images horodatées de la vidéo, avec le son d'origine en dessous.",
    "<b>Repérer.</b> Il liste les moments (apparition d'un titre, clic, transition, texte tapé) d'après "
    "la chronologie du projet ou l'analyse de l'image.",
    "<b>Choisir.</b> Pour chaque moment, il prend un vrai son dans nos bibliothèques, complétées par 78 sons "
    "d'interface libres de droits. Il ne fabrique jamais de son : faute de candidat, le moment reste "
    "silencieux et figure dans le rapport.",
    "<b>Poser et mixer.</b> Chaque son est calé sur son attaque audible et réglé à son juste niveau, en "
    "préservant la voix et la musique.",
    "<b>Se critiquer.</b> Une grille notée de 1 à 10 (accroche, synchronisation, couverture, rythme, variété) "
    "guide les corrections, jusqu'à obtenir au moins 8 sur chaque axe.",
])
safe_h3(g, "Ce que vous recevez")
safe_bullets(g, [
    "Une nouvelle vidéo MP4 sonorisée.",
    "Une piste d'effets séparée (fichier WAV), à reprendre dans votre logiciel de montage.",
    "Un rapport qui indique quel son est posé, à quel instant et pourquoi.",
    "Une page d'écoute comparative, sur téléphone, pour trancher d'un geste ; vos refus sont mémorisés.",
    "Les cinq moments à écouter en priorité.",
])
callout(g, "Sur une capsule de formation en motion design, Claude repérerait par exemple un souffle à "
           "l'apparition du titre, un léger pop à chaque étape d'un schéma qui se construit, un son d'erreur "
           "discret quand une flèche revient en arrière, puis une note claire à la validation. Le tout sous la "
           "voix off, qui reste prioritaire.",
        variant="yellow", title="Exemple concret")

# ---------------------------------------------------------------- 4. Earshot
safe_section(g, "Earshot : créer le son", eyebrow="Outil 3 · Créer", new_page=True)
lead("Quand aucun vrai son ne convient, Earshot prend le relais : il fabrique dans le code les sons "
     "introuvables. Il donne aussi des oreilles à Claude, en décrivant un son avec des mots et en mesurant "
     "un mixage.")
safe_h3(g, "Fabriquer un son dans le code")
body(f"Earshot embarque une banque de {hl('252')} sons décrits sous forme de recettes de code : souffles, pops, "
     "clics, impacts, notes de carillon, déclencheurs d'appareil photo... Claude les génère en quelques "
     "secondes, sans connexion internet, et les ajuste à l'image : durée exacte, instant du pic, hauteur de note.")
body("Chaque son généré passe un contrôle automatique (clics parasites, saturation, fin coupée). Pour un projet "
     "entier, Earshot compose un kit cohérent, avec un son par rôle : clic, tic, transition, touche de clavier, "
     "notification. Quatre styles sont proposés : calme, net, minimal et lancement, ce dernier étant pensé pour "
     "un film porté par la musique.")
safe_h3(g, "Écouter et vérifier")
table(g, [
    ["Votre question", "Ce qu'Earshot répond"],
    ["À quoi ressemble ce son ?", "Une description en mots et des mesures (durée, attaque, brillance)."],
    ["Lequel de ces vingt fichiers colle le mieux ?", "Un classement des fichiers selon votre description."],
    ["Le son tombe-t-il sur la coupe ?", "Le décalage entre le son et l'image, en millisecondes."],
    ["Le mixage tient-il la route ?", "Une évaluation comparée à sept films de lancement professionnels, "
                                     "avec les corrections à faire."],
    ["Ce son est-il réel ou synthétique ?", "Un verdict accompagné de son degré de confiance."],
], widths=[180, 302])
callout(g, "Un son créé dans le code ne provient d'aucun enregistrement : pas d'auteur à créditer, pas de "
           "licence à vérifier. Et comme Earshot fonctionne sur l'ordinateur lui-même, l'audio ne quitte "
           "jamais la machine.",
        variant="green", title="Pourquoi ça compte")

# ---------------------------------------------------------------- 5. Installer (prompts)
safe_section(g, "Installer les trois outils", eyebrow="Prompts · Mise en route", new_page=True)
lead("L'installation se fait une seule fois par ordinateur, dans Claude Code (dans le terminal ou "
     "l'application de bureau). Pas besoin de taper de commande : un prompt suffit.")
body("Le kit transmis avec cette fiche contient tout le nécessaire : la fiche, le fichier "
     "Prompts_Claude_outils_son.md (tous les prompts, à copier-coller), le skill openverse-sfx, le script "
     "installer-outils-son.sh pour Mac et un fichier LISEZMOI. Dans chaque prompt, remplacez les passages "
     "entre crochets par vos propres éléments.")
table(g, [
    ["Outil", "Ce qui s'installe", "Prérequis"],
    ["Openverse", "Le skill openverse-sfx du kit : recherche, téléchargement et crédits",
     "Accès internet à api.openverse.org"],
    ["Real SFX", "Le skill real-sfx, depuis github.com/Clipwing/skills", "Python 3.9 ou plus, FFmpeg, Git"],
    ["Earshot", "Le paquet Python, son serveur MCP et deux skills, depuis github.com/Leonxlnx/earshot",
     "Python 3.10 ou plus, FFmpeg, Git, environ 1,1 Go de modèles d'écoute"],
], widths=[76, 246, 160])
_n = 0
for gtitle, cards in PROMPTS_INSTALL:
    numbered = []
    for label, text in cards:
        _n += 1
        numbered.append((f"Prompt {_n} · {label}", text))
    prompt_cards(g, gtitle, numbered)
callout(g, "Redémarrez Claude Code après l'installation : c'est ce qui charge les nouveaux skills et le "
           "serveur Earshot. Sans redémarrage, Claude ne les voit pas encore.",
        variant="coral", title="Piège fréquent")

# ---------------------------------------------------------------- 6. Utiliser (prompts)
g.story.append(Spacer(1, 14))
safe_section(g, "Les prompts du quotidien", eyebrow="Prompts · Mode d'emploi")
lead("Vous parlez à Claude en français, il choisit lui-même l'outil. Ces prompts suivent l'ordre rapide : "
     "trouver, placer, créer, puis vérifier avant de publier.")
for gtitle, cards in PROMPTS_USAGE:
    numbered = []
    for label, text in cards:
        _n += 1
        numbered.append((f"Prompt {_n} · {label}", text))
    prompt_cards(g, gtitle, numbered)

# ---------------------------------------------------------------- 7. Avant de publier
g.story.append(Spacer(1, 14))
safe_section(g, "Avant de publier", eyebrow="Contrôle final")
lead("Les outils mesurent, vous décidez. Ce dernier contrôle prend quelques minutes et évite les mauvaises "
     "surprises après la mise en ligne.")
safe_checklist(g, [
    "Aucun son sous licence NC, ND ou BY-SA dans la vidéo.",
    "Les crédits des sons CC BY sont recopiés dans la description ou le générique.",
    "La voix off reste parfaitement compréhensible du début à la fin.",
    "Vous avez écouté au casque, puis sur le haut-parleur d'un téléphone.",
    "Les cinq moments à écouter signalés dans le rapport ont été vérifiés.",
    "Le volume général est homogène avec celui de nos autres vidéos.",
], title="La liste à cocher")
safe_h3(g, "Ce que ces outils ne font pas")
safe_bullets(g, [
    "Ils ne remplacent pas l'oreille : Claude lit des chiffres, des images et des mots, il n'entend rien.",
    "Openverse ne garantit ni la qualité ni le contenu d'un fichier, seulement sa licence déclarée.",
    "Real SFX ne crée aucun son : sans bibliothèque bien fournie, certains moments restent muets.",
    "Earshot ne juge ni le goût, ni l'émotion, ni la provenance d'un fichier.",
])
callout(g, "Prenez la prochaine vidéo de la chaîne et demandez à Claude d'en faire le sound design avec ces trois "
           "outils, en partant du prompt 7. Comparez l'avant et l'après : la différence s'entend dès la première "
           "écoute.",
        variant="ink", title="À vous")

os.makedirs(KIT, exist_ok=True)
g.build()
n_md = write_prompts_md(OUT_PROMPTS)
assert n_md == _n, (n_md, _n)
print(OUT)
print(OUT_PROMPTS, f"({n_md} prompts)")
