import React from 'react';
import CollapsibleSection from '../ui/CollapsibleSection.jsx';
import InsightsPanel from './InsightsPanel.jsx';
import StreakGoal from './StreakGoal.jsx';
import AnalyticsCharts from './AnalyticsCharts.jsx';

export default function DashboardGroup({
  insights,
  streakData,
  allQuestions,
  onOpenQuestion,
}) {
  return (
    <CollapsibleSection
      className="dashboard-insights-group"
      id="dashboardGroupSection"
      sectionKey="dashboardGroupOpen"
      title="📊 Dashboard Analytics &amp; Insights"
      description="Performance insights, activity streak, daily goals, and progress analytics"
    >
      <div className="dashboard-group-inner">
        <InsightsPanel insights={insights} onOpenQuestion={onOpenQuestion} />
        <StreakGoal streakData={streakData} />
        <AnalyticsCharts allQuestions={allQuestions} />
      </div>
    </CollapsibleSection>
  );
}
