import React from "react";
import { VasthusilpyCrmTab } from "./crm/VasthusilpyCrmTab";
import { OfficeDashboardTabType } from "../../types";
import { EstimateProject } from "../../data/estimateData";

interface OfficeDashboardProps {
  activeTab: OfficeDashboardTabType;
  setActiveTab: (tab: OfficeDashboardTabType) => void;
  estimateProjects?: EstimateProject[];
}

export const OfficeDashboard: React.FC<OfficeDashboardProps> = ({
  activeTab,
  setActiveTab,
  estimateProjects
}) => {
  return (
    <div className="space-y-6">
      <VasthusilpyCrmTab
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        estimateProjects={estimateProjects}
      />
    </div>
  );
};

