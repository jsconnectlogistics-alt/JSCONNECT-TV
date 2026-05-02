import zlib, struct

def make_png(pixels, w, h):
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    raw = b''.join(b'\x00' + bytes(pixels[y]) for y in range(h))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw,9)) + chunk(b'IEND', b'')

# Colores de tu marca
BG = [0, 8, 20]        # azul muy oscuro
NEON = [0, 180, 255]   # azul neon
DARK = [0, 30, 60]     # azul medio

w, h = 512, 512
pixels = []
for y in range(h):
    row = []
    for x in range(w):
        cx, cy = x - w//2, y - h//2
        r2 = cx*cx + cy*cy
        # Fondo con circuitos simulados
        bg = BG[:]
        # Líneas de circuito horizontal
        if y % 64 < 1 and abs(cx) < 200:
            bg = DARK
        # Líneas de circuito vertical  
        if x % 64 < 1 and abs(cy) < 200:
            bg = DARK
        # Círculo exterior neon
        R = 230
        if R*R - 800 < r2 < R*R + 800:
            bg = NEON
        # Relleno interior oscuro
        elif r2 < (R-4)*(R-4):
            bg = BG
        # Letra J
        jx1,jx2,jy1,jy2 = 130,190,130,350
        if jx1<x<jx2 and jy1<y<jy2:
            # Barra vertical derecha de J
            if jx2-25<x<jx2:
                bg = NEON
            # Curva base J
            elif jy2-60<y<jy2 and jx1<x<jx1+60:
                bg = NEON
            elif jy2-30<y<jy2 and jx1+20<x<jx2:
                bg = NEON
        # Letra S
        sx1,sx2,sy1,sy2 = 210,370,130,350
        if sx1<x<sx2 and sy1<y<sy2:
            mid = (sy1+sy2)//2
            # Barra superior
            if sy1<y<sy1+28:
                bg = NEON
            # Barra media
            elif mid-14<y<mid+14:
                bg = NEON
            # Barra inferior
            elif sy2-28<y<sy2:
                bg = NEON
            # Lado izquierdo arriba
            elif sy1<y<mid and sx1<x<sx1+28:
                bg = NEON
            # Lado derecho abajo
            elif mid<y<sy2 and sx2-28<x<sx2:
                bg = NEON
        row += bg
    pixels.append(row)

with open('icon.png','wb') as f:
    f.write(make_png(pixels, w, h))
print('icon.png creado OK')
