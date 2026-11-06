// Estado mutable compartido entre módulos (partida, mundo, audio, interfaz).
// Los módulos ES no pueden reasignar variables importadas, así que el estado que cambia
// (sector actual, enemigos, proyectiles, menú activo…) vive como propiedades de S.
export const S = {};
