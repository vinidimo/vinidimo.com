"""Rebuild the article's original geometric illustrations (Pillow for PNG cover)."""
from pathlib import Path
from math import sin, cos, radians
from html import escape
import colorsys
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
ART = ROOT / 'images'
ART.mkdir(exist_ok=True)
SCHEMES = [
    ('complementares', 'Complementares', [30, 210]),
    ('analogas', 'Análogas', [180, 210, 240]),
    ('triadica', 'Tríade / triangulação', [30, 150, 270]),
    ('meio-complementares', 'Meio-complementares', [30, 180, 240]),
    ('retangulo', 'Retângulo', [30, 90, 210, 270]),
    ('quadrado', 'Quadrado', [30, 120, 210, 300]),
    ('monocromatica', 'Monocromática', [210]),
]

def color(h, s=.65, l=.48):
    return '#'+''.join(f'{round(v*255):02X}' for v in colorsys.hls_to_rgb(h/360, l, s))

def point(h, radius=136, cx=220, cy=222):
    a = radians(h-90)
    return cx+radius*cos(a), cy+radius*sin(a)

def text(x, y, value, size=18, fill='#18202a', extra=''):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" {extra}>{escape(value)}</text>'

for slug, name, hues in SCHEMES:
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="650" viewBox="0 0 800 650" role="img" aria-labelledby="title desc"><title id="title">{escape(name)}</title><desc id="desc">Círculo HSL com seleção em {", ".join(str(h)+" graus" for h in hues)}. Amostras e composição com as cores selecionadas.</desc><rect width="800" height="650" rx="18" fill="#faf8f3"/><g font-family="Arial, sans-serif">', text(32, 40, name, 25, extra='font-weight="700"')]
    for h in range(360):
        x1,y1 = point(h-.6, 161)
        x2,y2 = point(h+1.6, 161)
        x3,y3 = point(h+1.6, 112)
        x4,y4 = point(h-.6, 112)
        parts.append(f'<path d="M{x1},{y1} L{x2},{y2} L{x3},{y3} L{x4},{y4} Z" fill="{color(h)}"/>')
    coords = [point(h) for h in hues]
    points = ' '.join(f'{x},{y}' for x,y in coords)
    tag = 'polyline' if slug == 'analogas' else 'polygon'
    if len(hues) > 1:
        parts.append(f'<{tag} points="{points}" fill="none" stroke="#18202a" stroke-width="3" stroke-linejoin="round"/>')
    else:
        x, y = coords[0]
        parts.append(f'<line x1="220" y1="222" x2="{x}" y2="{y}" stroke="#18202a" stroke-width="3"/>')
        parts.append(text(220, 200, 'UM MATIZ', 18, extra='text-anchor="middle"'))
    for h, (x,y) in zip(hues,coords):
        parts.append(f'<circle cx="{x}" cy="{y}" r="10" fill="{color(h)}" stroke="white" stroke-width="4"/>')
        tx,ty = point(h, 185)
        parts.append(text(tx,ty+6,f'{h}°',16,extra='text-anchor="middle"'))
    parts.append(text(447,96,'MATRIZES DA PALETA',16,extra='letter-spacing="2"'))
    swatches = [(210, .30, .93), (210, .45, .72), (210, .65, .48), (210, .45, .20)] if slug == 'monocromatica' else [(h, .65, .48) for h in hues]
    for i,(h,s,l) in enumerate(swatches):
        y = 118+i*62
        parts.append(f'<rect x="447" y="{y}" width="58" height="44" rx="8" fill="{color(h,s,l)}"/>')
        parts.append(text(520,y+18,color(h,s,l),19,extra='font-weight="700"'))
        parts.append(text(520,y+39,f'H {h}° · S {round(s*100)}% · L {round(l*100)}%',14,fill='#52606d'))
    parts.append(text(32,441,'DA HARMONIA À COMPOSIÇÃO',16,extra='letter-spacing="2"'))
    base = color(hues[0], .30, .93)
    dark = color(hues[0], .45, .20)
    parts.append(f'<rect x="32" y="462" width="736" height="156" rx="14" fill="{base}"/><rect x="56" y="490" width="12" height="98" rx="6" fill="{color(hues[0])}"/>')
    parts.append(text(88,523,'Cor com intenção.',28,dark,extra='font-weight="700"'))
    parts.append(text(88,554,'Uma base, diferentes papéis.',18,dark))
    for i,(h,s,l) in enumerate(swatches[1:]):
        parts.append(f'<rect x="{480+i*82}" y="493" width="68" height="94" rx="34" fill="{color(h,s,l)}"/>')
    parts.append('</g></svg>')
    (ART/f'{slug}.svg').write_text(''.join(parts),encoding='utf-8')

# Geometric cover: same six relationships, without text competing with the hero.
im = Image.new('RGB',(1536,1024),'#12202C')
draw = ImageDraw.Draw(im)
for i, (_,_,hues) in enumerate(SCHEMES[:6]):
    cx,cy = 280+(i%3)*490, 260+(i//3)*490
    for h in range(360):
        draw.arc((cx-173,cy-173,cx+173,cy+173),h-90,h-88,fill=color(h),width=51)
    pts=[point(h,148,cx,cy) for h in hues]
    draw.line(pts + ([pts[0]] if len(hues)>2 and i!=1 else []),fill='#F8F1E5',width=5)
    for h,(x,y) in zip(hues,pts):
        draw.ellipse((x-13,y-13,x+13,y+13),fill=color(h),outline='white',width=4)
im.save(ROOT/'cover.png',optimize=True)
