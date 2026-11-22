import dayjs from "dayjs";
import "dayjs/locale/es";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import isBetween from "dayjs/plugin/isBetween";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

// Sin esto dayjs formatea fechas y tiempos relativos en inglés ("Sun, 22 Nov").
dayjs.locale("es");

export default dayjs;
