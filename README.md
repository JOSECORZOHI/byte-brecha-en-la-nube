# BYTE: Brecha en la Nube

Shooter en primera persona de estilo retro que se ejecuta en el navegador. Todo está en un solo archivo (`index.html`), sin dependencias: gráficos, sonido y música se generan por código en tiempo real.

Un virus ha tomado el data center más grande de la Nube. Tú eres **Byte**, un pequeño robot de mantenimiento, y debes purgar sector tras sector hasta llegar a cada jefe.

## Cómo jugar

- **En línea:** si GitHub Pages está activado, abre `https://<tu-usuario>.github.io/byte-brecha-en-la-nube/`.
- **En tu equipo:** descarga `index.html` y ábrelo con cualquier navegador moderno.

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

## Publicar en GitHub Pages

1. En el repositorio, ve a **Settings → Pages**.
2. En **Source**, elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. Guarda. En uno o dos minutos el juego estará disponible en la dirección indicada.
