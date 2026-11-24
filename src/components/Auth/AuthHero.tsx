export const AuthHero = () => {
  return (
    <div className="login-hero hidden md:flex relative flex-auto flex-col items-center justify-center text-center md:order-first md:h-full md:w-[calc(50%+130px)] md:flex-none md:pl-16 md:pr-[calc(4rem+130px)]">
      <div className="flex flex-col items-center justify-center max-w-md">
        <div className="rounded-3xl bg-white/95 p-5 shadow-[0_20px_50px_rgba(3,37,76,0.35)] ring-4 ring-white/20 backdrop-blur-md transition-transform duration-300 hover:scale-[1.02]">
          <img
            src="/images/LogoRAG.png"
            alt="Logo Sistema Público Nacional de Salud"
            className="h-32 w-32 lg:h-40 lg:w-40 object-contain select-none"
          />
        </div>

        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-white lg:text-3xl">
          Sistema Público Nacional de Salud
        </h1>
        <p className="mt-1.5 font-display text-sm font-medium text-[#bae6fd] lg:text-base">
          Estado Táchira · Red ASIC
        </p>
      </div>

      <p className="absolute bottom-6 font-display text-[11px] font-semibold tracking-[0.2em] uppercase text-sky-100/75">
        MPPS · IVSS
      </p>
    </div>
  );
};
