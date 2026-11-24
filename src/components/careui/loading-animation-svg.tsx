import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/**
 * LoadingAnimationSvg
 * Animación profesional de carga sanitaria (anillo orbital + cruz médica + pulso ECG en #00a3ff)
 */
export function LoadingAnimationSvg({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div
      data-slot="loading-animation-svg"
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-6",
        className,
      )}
    >
      <div className="relative flex items-center justify-center size-20">
        {/* Halo ambiental suave */}
        <div className="absolute inset-1 rounded-full bg-[#00a3ff]/12 animate-ping [animation-duration:2.2s]" />

        {/* Anillo orbital médico giratorio */}
        <svg
          className="size-20 animate-spin [animation-duration:1.3s]"
          viewBox="0 0 80 80"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="spns-spinner-grad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#00a3ff" stopOpacity="1" />
              <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00a3ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="34" stroke="#e0f2fe" strokeWidth="4" />
          <circle
            cx="40"
            cy="40"
            r="34"
            stroke="url(#spns-spinner-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="145 70"
          />
        </svg>

        {/* Centro: Cruz Médica Minimalista con Pulso ECG */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center size-11 rounded-2xl bg-gradient-to-br from-[#00a3ff] to-[#0076be] shadow-md shadow-[#00a3ff]/30">
            <svg
              className="size-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Cruz médica estructural */}
              <path
                d="M12 4v16M4 12h16"
                strokeOpacity="0.3"
                strokeWidth="3.5"
              />
              {/* Onda de pulso vital ECG */}
              <path d="M3 12h4l2.2-5 3.6 10 2.2-5H21" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0076be] font-display">
          SPNS Táchira
        </span>
        <p className="text-center text-xs font-medium tracking-wider text-slate-500">
          {t("loading_animation_text", "Cargando sistema")}
          <span className="animate-blink opacity-0">.</span>
          <span className="animate-[blink_1.5s_0.2s_infinite] opacity-0">
            .
          </span>
          <span className="animate-[blink_1.5s_0.4s_infinite] opacity-0">
            .
          </span>
        </p>
      </div>
    </div>
  );
}
