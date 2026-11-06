# BYTE: Brecha en la Nube

Shooter en primera persona de estilo retro que se ejecuta en el navegador. No usa dependencias, imágenes ni audios externos: gráficos, sonido y música se generan por código en tiempo real. El código está organizado en módulos ES dentro de `js/`.

Un virus ha tomado el data center más grande de la Nube. Tú eres **Byte**, un pequeño robot de mantenimiento, y debes purgar sector tras sector hasta llegar a cada jefe.

## Cómo jugar

- **En línea:** si GitHub Pages está activado, abre `https://<tu-usuario>.github.io/byte-brecha-en-la-nube/`.
- **En tu equipo:** los módulos ES no se cargan abriendo el archivo con doble clic (`file://`), así que hace falta un servidor local:
  ```bash
  npm start            # o: python3 -m http.server 8080
  ```
  y luego abre `http://localhost:8080`.

Se recomienda jugar en PC con teclado y ratón.

## Controles

| Tecla | Acción |
|---|---|
| `W A S D` | Moverse |
| Ratón | Apuntar |
| Clic izquierdo / `F` | Disparar |
| `Shift` | Correr |
| `R` | Recargar |
| `E` / `Espacio` | Abrir puertas, usar la salida, cambiar de arma al recogerla |
| `1`–`4` / rueda | Cambiar de arma (4 ranuras) |
| `V` | Llave inglesa (cuerpo a cuerpo) |
| `I` | Inspeccionar el arma |
| `Tab` | Mapa |
| `M` | Silenciar / activar la música |
| `Esc` | Pausa |

## Características

- **Motor 3D por raycasting** hecho a mano sobre `<canvas>`.
- **Sectores generados proceduralmente**: cada partida tiene una semilla distinta; las puertas con tarjeta roja y azul siempre son resolubles.
- **Capítulos de 10 sectores**, cada uno con sus propios escenarios, música y jefe: KERNEL, Araña de Red, Fantasma Root, Cortafuegos y, a partir del capítulo 5, anomalías generadas al azar.
- **IA con personalidad procedural**: los enemigos patrullan, avisan a sus aliados, flanquean, esquivan, se retiran heridos y anticipan tu movimiento.
- **9 armas** (3 exclusivas del mercado), con animaciones de recarga y un límite de 4 ranuras.
- **Botín y Mercado Negro**: mejoras, skins para Byte, skins para cada arma y suministros.
- **Banda sonora sintetizada** que cambia según el escenario y la intensidad del combate.
- **Progreso guardado** en el navegador (`localStorage`).

## Estructura del código

```
index.html            Página: lienzo del juego y capa de menús
css/style.css         Estilos de la página, menús y tienda
js/
  main.js             Punto de entrada y bucle principal
  core/               Configuración, utilidades, estado compartido (store.js) y perfil guardado
  data/               Definiciones de enemigos, jefes y armas
  world/              Capítulos/escenarios y generador procedural de sectores
  gfx/                Texturas y sprites generados por código
  engine/             Raycasting, línea de visión y campo de flujo
  game/               Lógica: jugador, IA, combate, objetos, partidas y actualización
  render/             Render 3D, arma en primera persona y HUD
  audio/              Efectos de sonido y banda sonora sintetizada
  ui/                 Pantallas, Mercado Negro y controles
tests/                Pruebas automáticas (Node, sin navegador)
```

El estado que cambia durante la partida (sector actual, enemigos, proyectiles, pantalla activa…) vive en el objeto `S` de `js/core/store.js`, porque un módulo ES no puede reasignar una variable importada de otro.

### Dónde tocar para…

| Quiero… | Archivo |
|---|---|
| Añadir o ajustar un arma | `js/data/weapons.js` (datos y modelo) y `js/render/weapon-view.js` (vista en primera persona) |
| Añadir un enemigo | `js/data/enemies.js` (datos), `js/gfx/sprites.js` (dibujo) y `js/game/ai.js` (comportamiento especial) |
| Añadir un jefe o un ataque de jefe | `BOSSES` en `js/data/enemies.js` y `bossAttack` en `js/game/ai.js` |
| Añadir un capítulo o escenario | `CHAPTERS` en `js/world/chapters.js` |
| Cambiar cómo se generan los mapas | `js/world/generator.js` |
| Añadir un tema musical | `TRACKS` en `js/audio/music.js` |
| Añadir mejoras o skins | `js/core/profile.js`, `js/data/weapons.js` y `js/ui/shop.js` |

## Pruebas

```bash
npm test             # o: node --test tests/
```

Comprueban, entre otras cosas, que todos los sectores generados se pueden completar, la recarga, el límite de 4 armas, las compras de la tienda, que cada jefe recorre sus 3 fases y que la música cambia por capítulo. Requieren Node 22 o superior.

## Publicar en GitHub Pages

1. En el repositorio, ve a **Settings → Pages**.
2. En **Source**, elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. Guarda. En uno o dos minutos el juego estará disponible en la dirección indicada.
