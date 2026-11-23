import { useTranslation } from "react-i18next";

export const AuthHero = () => {
  const { t } = useTranslation();

  return (
    <section className="login-hero relative hidden flex-col justify-center p-8 md:order-first md:flex md:h-full md:w-[calc(50%+130px)] md:flex-none md:px-12 md:pr-[calc(4rem+130px)] lg:px-16">
      <div className="max-w-lg">
        <h1 className="text-3xl leading-[1.15] font-semibold tracking-tight text-white md:text-[2.6rem]">
          {t("sus_tachira")}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-sus-100 md:text-base">
          {t("sus_login_hero_subtitle")}
        </p>
      </div>
    </section>
  );
};
