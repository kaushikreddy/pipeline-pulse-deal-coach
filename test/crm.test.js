import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  accountSnapshot,
  coachingQueue,
  enrichOpportunities,
  filterByOwner,
  forecastCategory,
  riskLabel,
  scoreDealRisk,
  suggestDealActions,
  summarizeDealCoaching,
  summarizeOwners,
  summarizePipeline
} from "../src/crm.js";

const data = {
  accounts: [
    {
      id: "acct-a",
      name: "Enterprise Co",
      owner: "Maya Chen",
      health: "At Risk",
      arr: 400000
    },
    {
      id: "acct-b",
      name: "Healthy Co",
      owner: "Jordan Lee",
      health: "Healthy",
      arr: 90000
    }
  ],
  opportunities: [
    {
      id: "opp-a",
      accountId: "acct-a",
      name: "Expansion",
      stage: "Discovery",
      amount: 150000,
      probability: 40,
      closeDate: "2026-06-10",
      nextStep: "",
      lastActivityDays: 28,
      contactCoverage: 1
    },
    {
      id: "opp-b",
      accountId: "acct-b",
      name: "Automation",
      stage: "Negotiation",
      amount: 50000,
      probability: 70,
      closeDate: "2026-06-20",
      nextStep: "Send final pricing",
      lastActivityDays: 3,
      contactCoverage: 3
    }
  ],
  contacts: [
    {
      id: "contact-a",
      accountId: "acct-a",
      name: "Alex Buyer"
    }
  ],
  tasks: [
    {
      id: "task-a",
      accountId: "acct-a",
      dueDate: "2026-05-20",
      status: "open"
    },
    {
      id: "task-b",
      accountId: "acct-b",
      dueDate: "2026-06-01",
      status: "open"
    }
  ],
  activities: [
    {
      id: "activity-a",
      accountId: "acct-a",
      summary: "No sponsor confirmed."
    }
  ]
};

describe("scoreDealRisk", () => {
  it("scores stale, high-value deals with missing next steps as critical risk", () => {
    const score = scoreDealRisk(data.opportunities[0], data.accounts[0]);

    assert.equal(score, 100);
    assert.equal(riskLabel(score), "Critical");
  });

  it("keeps active negotiation deals low risk", () => {
    const score = scoreDealRisk(data.opportunities[1], data.accounts[1]);

    assert.equal(riskLabel(score), "Low");
  });
});

describe("enrichOpportunities", () => {
  it("adds account, weighted amount, risk, forecast, and coaching details", () => {
    const opportunities = enrichOpportunities(data);

    assert.equal(opportunities[0].id, "opp-a");
    assert.equal(opportunities[0].account.name, "Enterprise Co");
    assert.equal(opportunities[0].weightedAmount, 60000);
    assert.equal(opportunities[0].forecastCategory, "At Risk");
    assert.equal(opportunities[0].suggestions.length, 3);
  });
});

describe("forecastCategory", () => {
  it("classifies strong negotiation deals as commit", () => {
    assert.equal(forecastCategory(data.opportunities[1], 0), "Commit");
  });
});

describe("summarizePipeline", () => {
  it("summarizes pipeline and overdue tasks", () => {
    assert.deepEqual(summarizePipeline(data), {
      openPipeline: 200000,
      weightedPipeline: 95000,
      criticalDeals: 1,
      overdueTasks: 1
    });
  });

  it("can summarize one owner's book", () => {
    assert.deepEqual(summarizePipeline(data, "Jordan Lee"), {
      openPipeline: 50000,
      weightedPipeline: 35000,
      criticalDeals: 0,
      overdueTasks: 0
    });
  });
});

describe("deal coaching", () => {
  it("suggests prioritized recovery actions for risky deals", () => {
    const suggestions = suggestDealActions(data, data.opportunities[0], data.accounts[0]);

    assert.deepEqual(
      suggestions.map((suggestion) => suggestion.title),
      ["Restart momentum", "Capture a concrete next step", "Expand stakeholder coverage"]
    );
    assert.equal(suggestions[0].priority, "urgent");
  });

  it("summarizes owner-specific coaching work", () => {
    const summary = summarizeDealCoaching(data, "Maya Chen");

    assert.equal(summary.coachedDeals, 1);
    assert.equal(summary.urgentActions, 2);
    assert.equal(summary.pipelineAtRisk, 150000);
    assert.equal(summary.topDealName, "Expansion");
    assert.equal(summary.topOwner, "Maya Chen");
    assert.equal(summary.topSuggestion, "Coach Maya Chen on multi-threading before the next buyer meeting.");
  });

  it("builds a manager coaching queue with rep asks and risk drivers", () => {
    const queue = coachingQueue(data, "Maya Chen");

    assert.equal(queue.length, 1);
    assert.equal(queue[0].coachingFocus, "Stakeholder coverage");
    assert.equal(queue[0].repAsk, "Name the economic buyer, champion, and missing stakeholder.");
    assert.ok(queue[0].riskDrivers.includes("single-threaded"));
  });
});

describe("owner and account helpers", () => {
  it("lists owners alphabetically", () => {
    assert.deepEqual(summarizeOwners(data), ["Jordan Lee", "Maya Chen"]);
  });

  it("filters enriched opportunities by owner", () => {
    const opportunities = enrichOpportunities(data);

    assert.deepEqual(
      filterByOwner(opportunities, "Maya Chen").map((opportunity) => opportunity.id),
      ["opp-a"]
    );
  });

  it("returns account context for meeting prep style features", () => {
    const snapshot = accountSnapshot(data, "acct-a");

    assert.equal(snapshot.account.name, "Enterprise Co");
    assert.equal(snapshot.contacts.length, 1);
    assert.equal(snapshot.tasks.length, 1);
    assert.equal(snapshot.activities.length, 1);
  });
});
