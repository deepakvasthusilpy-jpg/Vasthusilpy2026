import React from "react";
import { IndianCalendar } from "./IndianCalendar";
import { SpecialDayInfo } from "../../utils/keralaCalendarData";

interface KeralaCalendarProps {
  onSelectSpecialTheme?: (specialDay: SpecialDayInfo) => void;
  selectedThemeId?: string | null;
}

export const KeralaCalendar: React.FC<KeralaCalendarProps> = (props) => {
  return <IndianCalendar {...props} />;
};
