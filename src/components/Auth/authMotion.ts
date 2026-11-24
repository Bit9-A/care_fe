import type { Transition, Variants } from "framer-motion";

/**
 * Variantes horizontales direccionales para alternar entre formularios de Auth:
 * direction >= 0 avanza hacia la derecha (ej. Personal -> Paciente, Login -> Recuperar);
 * direction < 0 regresa hacia la izquierda.
 */
export const authSlideVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 34 : -34,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -34 : 34,
  }),
};

export const authSlideTransition: Transition = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
};
