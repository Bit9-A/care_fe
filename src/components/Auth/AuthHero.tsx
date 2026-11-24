import { motion } from "framer-motion";
import { useRef } from "react";

const HERO_STATS = [
  { value: "25", label: "ASIC" },
  { value: "29", label: "Municipios" },
  { value: "14", label: "Hospitales" },
] as const;

export const AuthHero = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;

    el.style.setProperty("--hero-x", `${x}px`);
    el.style.setProperty("--hero-y", `${y}px`);
    el.style.setProperty("--wave-shift-x", `${(normX * -14).toFixed(1)}px`);
    el.style.setProperty("--wave-shift-y", `${(normY * -10).toFixed(1)}px`);
  };

  const handleMouseLeave = () => {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty("--wave-shift-x", "0px");
    el.style.setProperty("--wave-shift-y", "0px");
  };

  return (
    <div
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="login-hero group/hero hidden md:flex relative flex-auto flex-col justify-between md:order-first md:h-full md:w-[calc(50%+130px)] md:flex-none md:px-16 md:pr-[calc(4rem+130px)]"
    >
      {/* Foco luminoso interactivo que sigue el mouse por detrás de las olas */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(420px circle at var(--hero-x, 50%) var(--hero-y, 50%), rgba(56, 189, 248, 0.28), transparent 70%)",
        }}
      />

      {/* Trama de micropuntos médicos que se enciende al pasar el cursor */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover/hero:opacity-45 transition-opacity duration-300"
        style={{
          backgroundImage:
            "radial-gradient(rgba(186, 230, 253, 0.85) 1.1px, transparent 1.1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(280px circle at var(--hero-x, 50%) var(--hero-y, 50%), black 20%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(280px circle at var(--hero-x, 50%) var(--hero-y, 50%), black 20%, transparent 100%)",
        }}
      />

      <div />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-12 flex flex-col items-start rounded-lg py-4"
      >
        <div className="mb-5 flex items-center gap-3.5">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 4 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00a3ff]/25 text-white backdrop-blur-md border border-[#00a3ff]/50 shadow-lg shadow-[#00a3ff]/25 cursor-pointer"
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </motion.div>
          <div>
            <span className="font-display text-xs font-bold tracking-[0.18em] uppercase text-[#7dd3fc]">
              Sistema Público Nacional de Salud
            </span>
            <p className="font-display text-base font-semibold text-white">
              Estado Táchira
            </p>
          </div>
        </div>

        <div className="max-w-lg">
          <h1 className="font-display text-4xl font-extrabold leading-[1.12] tracking-tight text-white lg:text-[2.75rem]">
            Red Asistencial y Gestión de ASIC
          </h1>
          <p className="max-w-xl py-4 text-base font-normal leading-relaxed text-sky-100/90 lg:text-[17px]">
            Plataforma integral para la articulación demográfica, gerencial y
            hospitalaria en los 29 municipios, 66 parroquias y 25 Áreas de Salud
            Integral Comunitaria (ASIC).
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-white">
            {HERO_STATS.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.12 + idx * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/20 hover:bg-[#00a3ff]/25 hover:border-[#7dd3fc]/70 hover:shadow-[0_10px_28px_-6px_rgba(0,163,255,0.45)] transition-colors cursor-default select-none"
              >
                <span className="font-display block text-2xl font-extrabold text-white">
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-[#7dd3fc]">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 mb-8 flex items-center"
      >
        <div className="max-w-lg text-xs text-sky-100/80">
          <p className="font-display font-semibold tracking-wide text-white">
            MPPS · IVSS · Dirección de Salud Regional
          </p>
          <p className="mt-1">
            Atención integral médica especializada, comunitaria y hospitalaria.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
