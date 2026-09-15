import React from "react";
import { TabType } from "../../types";
import { QuotationModule } from "./QuotationModule";

interface QuotationDashboardProps {
  activeTab: TabType;
  setActiveTab?: (tab: TabType) => void;
}

export const QuotationDashboard: React.FC<QuotationDashboardProps> = ({
  activeTab,
  setActiveTab = () => {}
}) => {
  return <QuotationModule activeTab={activeTab} setActiveTab={setActiveTab} />;
};

export default QuotationDashboard;
