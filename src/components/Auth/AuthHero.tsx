import careConfig from "@careConfig";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

export const AuthHero = () => {
  return (
    <div className="login-hero order-last relative flex flex-auto flex-col justify-between p-6 md:order-first md:h-full md:w-[calc(50%+130px)] md:flex-none md:p-0 md:px-16 md:pr-[calc(4rem+130px)]">
      <div />
      <div className="mt-4 flex flex-col items-start rounded-lg py-4 md:mt-12">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-white backdrop-blur-xs border border-blue-400/30">
            <svg
              className="h-7 w-7 text-blue-200"
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
          </div>
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-blue-300">
              Sistema Público Nacional de Salud
            </span>
            <p className="text-sm font-medium text-white/90">Estado Táchira</p>
          </div>
        </div>

        <div className="max-w-lg">
          <h1 className="text-3xl font-black leading-tight tracking-wide text-white lg:text-4xl">
            Red Asistencial y Gestión de ASIC
          </h1>
          <div className="max-w-xl py-4 text-base font-normal text-blue-100/90 md:text-lg">
            Plataforma integral para la articulación demográfica, gerencial y
            hospitalaria en los 29 municipios, 66 parroquias y 25 Áreas de Salud
            Integral Comunitaria (ASIC).
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-white/90">
            <div className="rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/10">
              <span className="block text-xl font-bold text-white">25</span>
              <span className="text-xs text-blue-200">ASIC</span>
            </div>
            <div className="rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/10">
              <span className="block text-xl font-bold text-white">29</span>
              <span className="text-xs text-blue-200">Municipios</span>
            </div>
            <div className="rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/10">
              <span className="block text-xl font-bold text-white">14</span>
              <span className="text-xs text-blue-200">Hospitales</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center">
        <div className="max-w-lg text-xs text-blue-200/80">
          <p className="font-semibold text-white/90">
            MPPS · IVSS · Dirección de Salud Regional
          </p>
          <p className="mt-1">
            Atención integral médica especializada, comunitaria y hospitalaria.
          </p>
        </div>
      </div>
    </div>
  );
};
