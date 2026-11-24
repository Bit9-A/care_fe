export const AuthHero = () => {
  return (
    <div className="login-hero hidden md:flex relative flex-auto flex-col justify-between md:order-first md:h-full md:w-[calc(50%+130px)] md:flex-none md:px-16 md:pr-[calc(4rem+130px)]">
      <div />
      <div className="mt-12 flex flex-col items-start rounded-lg py-4">
        <div className="mb-5 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00a3ff]/25 text-white backdrop-blur-md border border-[#00a3ff]/50 shadow-lg shadow-[#00a3ff]/25">
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
          </div>
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
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/20 hover:border-[#00a3ff]/60 transition-colors">
              <span className="font-display block text-2xl font-extrabold text-white">
                25
              </span>
              <span className="text-xs font-medium text-[#7dd3fc]">ASIC</span>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/20 hover:border-[#00a3ff]/60 transition-colors">
              <span className="font-display block text-2xl font-extrabold text-white">
                29
              </span>
              <span className="text-xs font-medium text-[#7dd3fc]">
                Municipios
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/20 hover:border-[#00a3ff]/60 transition-colors">
              <span className="font-display block text-2xl font-extrabold text-white">
                14
              </span>
              <span className="text-xs font-medium text-[#7dd3fc]">
                Hospitales
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex items-center">
        <div className="max-w-lg text-xs text-sky-100/80">
          <p className="font-display font-semibold tracking-wide text-white">
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
