import careConfig from "@careConfig";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { keysOf } from "@/Utils/utils";
import { LANGUAGES } from "@/i18n";

const LanguageSelectorLogin = () => {
  const { i18n, t } = useTranslation();
  useEffect(() => {
    document.documentElement.setAttribute("lang", i18n.language);
  }, [i18n]);

  const handleLanguage = (value: string) => {
    i18n.changeLanguage(value);
    if (window && window.localStorage) {
      localStorage.setItem("i18nextLng", value);
      document.documentElement.setAttribute("lang", i18n.language);
    }
  };

  const availableLocales = keysOf(LANGUAGES).filter((l) =>
    careConfig.availableLocales?.includes(l),
  );

  return (
    <div className="mt-2 flex items-center justify-center">
      <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white/90 md:bg-transparent backdrop-blur-md px-3.5 py-1 text-xs text-slate-600 shadow-md md:shadow-none border border-white/50 md:border-transparent">
        <span className="font-medium text-slate-500">{t("available_in")}:</span>
        <div className="inline-flex items-center gap-2.5">
          {availableLocales.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => handleLanguage(e)}
              className={cn(
                "font-semibold transition-colors text-[#0076be] hover:text-[#00a3ff]",
                (i18n.language === e ||
                  (i18n.language === "en-US" && e === "en")) &&
                  "text-[#00a3ff] underline underline-offset-4",
              )}
            >
              {LANGUAGES[e]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectorLogin;
