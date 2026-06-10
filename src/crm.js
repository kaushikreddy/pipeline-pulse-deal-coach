const STAGE_ORDER = ["Qualified", "Discovery", "Proposal", "Negotiation", "Closed Won"];

const HEALTH_RISK = {
  Healthy: 0,
  Watch: 12,
  "At Risk": 24
};

export function enrichOpportunities(data) {
  return data.opportunities
    .map((opportunity) => {
      const account = findAccount(data, opportunity.accountId);
      const riskScore = scoreDealRisk(opportunity, account);
      const suggestions = suggestDealActions(data, opportunity, account);
      return {
        ...opportunity,
        account,
        weightedAmount: Math.round(opportunity.amount * (opportunity.probability / 100)),
        riskScore,
        riskLabel: riskLabel(riskScore),
        forecastCategory: forecastCategory(opportunity, riskScore),
        suggestions
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore || b.amount - a.amount);
}

export function scoreDealRisk(opportunity, account) {
  let score = 0;

  if (opportunity.lastActivityDays >= 21) score += 30;
  else if (opportunity.lastActivityDays >= 14) score += 18;
  else if (opportunity.lastActivityDays >= 7) score += 8;

  if (!opportunity.nextStep.trim()) score += 24;
  if (opportunity.contactCoverage < 2) score += 16;
  if (daysUntil(opportunity.closeDate) <= 21 && opportunity.stage !== "Negotiation") score += 12;
  if (opportunity.amount >= 100000) score += 10;

  score += HEALTH_RISK[account.health] ?? 0;

  return Math.min(score, 100);
}

export function riskLabel(score) {
  if (score >= 70) return "Critical";
  if (score >= 45) return "High";
  if (score >= 20) return "Medium";
  return "Low";
}

export function forecastCategory(opportunity, riskScore) {
  if (riskScore >= 70) return "At Risk";
  if (opportunity.stage === "Negotiation" && opportunity.probability >= 65) return "Commit";
  if (opportunity.probability >= 45) return "Best Case";
  return "Pipeline";
}

export function summarizePipeline(data, owner = "all") {
  const opportunities = filterByOwner(enrichOpportunities(data), owner);
  const openTasks = filterTasksByOwner(data, owner).filter((task) => task.status === "open");

  return {
    openPipeline: opportunities.reduce((sum, opportunity) => sum + opportunity.amount, 0),
    weightedPipeline: opportunities.reduce((sum, opportunity) => sum + opportunity.weightedAmount, 0),
    criticalDeals: opportunities.filter((opportunity) => opportunity.riskLabel === "Critical").length,
    overdueTasks: openTasks.filter((task) => isOverdue(task.dueDate)).length
  };
}

export function summarizeDealCoaching(data, owner = "all") {
  const queue = coachingQueue(data, owner);
  const topDeal = queue[0];

  return {
    coachedDeals: queue.length,
    urgentActions: queue.reduce((sum, deal) => sum + deal.urgentActionCount, 0),
    pipelineAtRisk: queue.reduce((sum, deal) => sum + deal.amount, 0),
    topSuggestion: topDeal?.managerPlay ?? "No risky deals need coaching right now",
    topDealName: topDeal?.name ?? "",
    topOwner: topDeal?.account.owner ?? "",
    queue
  };
}

export function summarizeOwners(data) {
  return [...new Set(data.accounts.map((account) => account.owner))].sort();
}

export function filterByOwner(opportunities, owner) {
  if (owner === "all") return opportunities;
  return opportunities.filter((opportunity) => opportunity.account.owner === owner);
}

export function accountSnapshot(data, accountId) {
  const account = findAccount(data, accountId);
  return {
    account,
    contacts: data.contacts.filter((contact) => contact.accountId === accountId),
    tasks: data.tasks.filter((task) => task.accountId === accountId),
    activities: data.activities.filter((activity) => activity.accountId === accountId)
  };
}

export function stageIndex(stage) {
  return STAGE_ORDER.indexOf(stage);
}

export function coachingQueue(data, owner = "all") {
  return filterByOwner(enrichOpportunities(data), owner)
    .filter((opportunity) => opportunity.suggestions.length > 0)
    .map((opportunity) => {
      const riskDrivers = dealRiskDrivers(opportunity);
      const urgentActionCount = opportunity.suggestions.filter((suggestion) => suggestion.priority === "urgent").length;

      return {
        ...opportunity,
        riskDrivers,
        urgentActionCount,
        managerPlay: managerPlay(opportunity, riskDrivers),
        repAsk: repAsk(opportunity, riskDrivers),
        coachingFocus: coachingFocus(opportunity, riskDrivers)
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore || b.amount - a.amount)
    .slice(0, 4);
}

export function suggestDealActions(data, opportunity, account = findAccount(data, opportunity.accountId)) {
  const contacts = data.contacts.filter((contact) => contact.accountId === opportunity.accountId);
  const tasks = data.tasks.filter((task) => task.accountId === opportunity.accountId);
  const activities = data.activities.filter((activity) => activity.accountId === opportunity.accountId);
  const suggestions = [];
  const overdueOpenTasks = tasks.filter((task) => task.status === "open" && isOverdue(task.dueDate));
  const economicBuyer = contacts.find((contact) => contact.influence === "Economic Buyer");
  const champion = contacts.find((contact) => contact.influence === "Champion");
  const recentActivity = activities[0]?.summary;
  const closeSoon = daysUntil(opportunity.closeDate) <= 21;

  if (opportunity.lastActivityDays >= 21) {
    suggestions.push({
      priority: "urgent",
      title: "Restart momentum",
      detail: `No logged activity in ${opportunity.lastActivityDays} days. Schedule a same-week follow-up and reference the last buyer signal${recentActivity ? `: ${recentActivity}` : "."}`
    });
  } else if (opportunity.lastActivityDays >= 14) {
    suggestions.push({
      priority: "high",
      title: "Refresh the buying thread",
      detail: `It has been ${opportunity.lastActivityDays} days since activity. Confirm the next meeting and send a concise recap of the open decision.`
    });
  }

  if (!opportunity.nextStep.trim()) {
    suggestions.push({
      priority: "urgent",
      title: "Capture a concrete next step",
      detail: "Add an owner, date, and buyer-facing action before the next forecast review."
    });
  }

  if (opportunity.contactCoverage < 2) {
    suggestions.push({
      priority: "high",
      title: "Expand stakeholder coverage",
      detail: economicBuyer
        ? `Only ${opportunity.contactCoverage} contact is active. Ask ${economicBuyer.name} to introduce the implementation or finance stakeholder.`
        : "Find the economic buyer and one operational stakeholder so the deal does not depend on a single thread."
    });
  }

  if (account.health === "At Risk") {
    suggestions.push({
      priority: "high",
      title: "Pair expansion with account recovery",
      detail: `Account health is At Risk. Align the expansion ask with a success plan owned by ${account.owner}.`
    });
  } else if (account.health === "Watch") {
    suggestions.push({
      priority: "medium",
      title: "Validate customer health",
      detail: "Confirm adoption, renewal confidence, and unresolved support concerns before pushing the deal forward."
    });
  }

  if (closeSoon && opportunity.stage !== "Negotiation") {
    suggestions.push({
      priority: "high",
      title: "Close-date reality check",
      detail: `Close date is ${opportunity.closeDate}, but the deal is still in ${opportunity.stage}. Move the date or secure a mutual action plan.`
    });
  }

  if (overdueOpenTasks.length > 0) {
    suggestions.push({
      priority: "urgent",
      title: "Clear overdue commitments",
      detail: `${overdueOpenTasks.length} open task${overdueOpenTasks.length === 1 ? "" : "s"} overdue. Finish the highest-priority item before asking the buyer for another step.`
    });
  }

  if (opportunity.stage === "Negotiation" && champion) {
    suggestions.push({
      priority: "medium",
      title: "Use the champion for final alignment",
      detail: `Ask ${champion.name} to validate decision criteria, procurement timing, and any late blockers.`
    });
  }

  return suggestions.slice(0, 3);
}

function dealRiskDrivers(opportunity) {
  const drivers = [];

  if (opportunity.lastActivityDays >= 21) drivers.push("stalled engagement");
  else if (opportunity.lastActivityDays >= 14) drivers.push("aging follow-up");

  if (!opportunity.nextStep.trim()) drivers.push("missing next step");
  if (opportunity.contactCoverage < 2) drivers.push("single-threaded");
  if (opportunity.account.health !== "Healthy") drivers.push(`${opportunity.account.health.toLowerCase()} account health`);
  if (daysUntil(opportunity.closeDate) <= 21 && opportunity.stage !== "Negotiation") drivers.push("close-date slip risk");
  if (opportunity.amount >= 100000) drivers.push("high-value deal");

  return drivers;
}

function managerPlay(opportunity, drivers) {
  if (drivers.includes("single-threaded")) {
    return `Coach ${opportunity.account.owner} on multi-threading before the next buyer meeting.`;
  }

  if (drivers.includes("stalled engagement")) {
    return `Review the re-engagement plan with ${opportunity.account.owner} and set a 48-hour buyer touch.`;
  }

  if (drivers.includes("close-date slip risk")) {
    return `Pressure-test the close date with ${opportunity.account.owner} and require a mutual action plan.`;
  }

  if (drivers.includes("at risk account health")) {
    return `Pair the expansion motion with a customer success recovery plan.`;
  }

  return `Use the next 1:1 to inspect exit criteria and unblock the next buyer step.`;
}

function repAsk(opportunity, drivers) {
  if (drivers.includes("single-threaded")) return "Name the economic buyer, champion, and missing stakeholder.";
  if (drivers.includes("missing next step")) return "Add a buyer-owned next step with a date.";
  if (drivers.includes("stalled engagement")) return "Send a recap and book the next meeting within 48 hours.";
  if (drivers.includes("close-date slip risk")) return "Confirm decision process, procurement path, and close-date realism.";
  return "Bring the next blocker and one specific manager assist.";
}

function coachingFocus(opportunity, drivers) {
  if (drivers.includes("single-threaded")) return "Stakeholder coverage";
  if (drivers.includes("stalled engagement")) return "Deal momentum";
  if (drivers.includes("close-date slip risk")) return "Forecast hygiene";
  if (opportunity.account.health !== "Healthy") return "Expansion readiness";
  return "Next-step quality";
}

function findAccount(data, accountId) {
  return data.accounts.find((account) => account.id === accountId);
}

function filterTasksByOwner(data, owner) {
  if (owner === "all") return data.tasks;
  const accountIds = new Set(data.accounts.filter((account) => account.owner === owner).map((account) => account.id));
  return data.tasks.filter((task) => accountIds.has(task.accountId));
}

function daysUntil(dateString) {
  const today = new Date("2026-05-28T00:00:00");
  const target = new Date(`${dateString}T00:00:00`);
  return Math.ceil((target - today) / 86_400_000);
}

function isOverdue(dateString) {
  return daysUntil(dateString) < 0;
}
