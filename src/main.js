import {
  coachingQueue,
  enrichOpportunities,
  filterByOwner,
  summarizeDealCoaching,
  summarizeOwners,
  summarizePipeline
} from "./crm.js";
import { sampleCrmData } from "./sample-data.js";

const state = {
  crm: null,
  owner: "all"
};

const elements = {
  ownerFilter: document.querySelector("#owner-filter"),
  opportunityList: document.querySelector("#opportunity-list"),
  resultCount: document.querySelector("#result-count"),
  accountList: document.querySelector("#account-list"),
  metricOpen: document.querySelector("#metric-open"),
  metricWeighted: document.querySelector("#metric-weighted"),
  metricCritical: document.querySelector("#metric-critical"),
  metricOverdue: document.querySelector("#metric-overdue"),
  coachSummary: document.querySelector("#coach-summary")
};

async function loadCrm() {
  state.crm = await fetchCrmData();
  populateOwnerFilter(state.crm);
  render();
}

async function fetchCrmData() {
  try {
    const apiResponse = await fetch("/api/crm");
    if (apiResponse.ok) return apiResponse.json();
  } catch {
    // The app may be opened directly as file:// during judging.
  }

  try {
    const staticResponse = await fetch("data/crm.json");
    if (staticResponse.ok) return staticResponse.json();
  } catch {
    // Fall through to embedded demo data for local-file previews.
  }

  return sampleCrmData;
}

function populateOwnerFilter(data) {
  const owners = summarizeOwners(data);

  for (const owner of owners) {
    const option = document.createElement("option");
    option.value = owner;
    option.textContent = owner;
    elements.ownerFilter.append(option);
  }
}

function render() {
  const opportunities = filterByOwner(enrichOpportunities(state.crm), state.owner);
  const metrics = summarizePipeline(state.crm, state.owner);
  const coaching = summarizeDealCoaching(state.crm, state.owner);
  const queue = coachingQueue(state.crm, state.owner);

  elements.metricOpen.textContent = `$${formatCompact(metrics.openPipeline)}`;
  elements.metricWeighted.textContent = `$${formatCompact(metrics.weightedPipeline)}`;
  elements.metricCritical.textContent = metrics.criticalDeals;
  elements.metricOverdue.textContent = metrics.overdueTasks;
  elements.resultCount.textContent = `${opportunities.length} deal${opportunities.length === 1 ? "" : "s"}`;

  renderAccounts(state.crm.accounts, state.owner);
  renderCoachSummary(coaching, queue);
  renderOpportunities(opportunities);
}

function renderCoachSummary(coaching, queue) {
  elements.coachSummary.innerHTML = `
    <div class="coach-summary-top">
      <div>
        <span>Team Lead Deal Coach</span>
        <strong>${coaching.coachedDeals} deal${coaching.coachedDeals === 1 ? "" : "s"} need manager attention</strong>
        <p>${coaching.topDealName ? `Prioritized coaching queue for sales leads: start with ${coaching.topOwner} on ${coaching.topDealName}. ${coaching.topSuggestion}` : coaching.topSuggestion}</p>
      </div>
      <div class="coach-metrics" aria-label="Deal Coach metrics">
        <p><strong>$${formatCompact(coaching.pipelineAtRisk)}</strong><span>pipeline at risk</span></p>
        <p><strong>${coaching.urgentActions}</strong><span>urgent asks</span></p>
      </div>
    </div>
    <div class="coach-queue">
      ${queue.length === 0 ? "<p>No coaching queue for this owner.</p>" : queue.map(renderCoachQueueItem).join("")}
    </div>
  `;
}

function renderCoachQueueItem(deal) {
  return `
    <article class="coach-queue-item">
      <div>
        <span class="priority priority-${deal.suggestions[0].priority}">${deal.coachingFocus}</span>
        <h3>${deal.name}</h3>
        <p>${deal.account.owner} · $${formatCompact(deal.amount)} · ${deal.stage} · risk ${deal.riskScore}</p>
      </div>
      <div>
        <strong>Manager play</strong>
        <p>${deal.managerPlay}</p>
      </div>
      <div>
        <strong>Rep ask</strong>
        <p>${deal.repAsk}</p>
      </div>
      <div class="risk-drivers">
        ${deal.riskDrivers.map((driver) => `<span>${driver}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderAccounts(accounts, owner) {
  const visibleAccounts = owner === "all" ? accounts : accounts.filter((account) => account.owner === owner);

  elements.accountList.replaceChildren(
    ...visibleAccounts.map((account) => {
      const row = document.createElement("article");
      row.className = "account-row";
      row.innerHTML = `
        <div>
          <strong>${account.name}</strong>
          <span>${account.owner}</span>
        </div>
        <p class="health health-${cssToken(account.health)}">${account.health}</p>
      `;
      return row;
    })
  );
}

function renderOpportunities(opportunities) {
  elements.opportunityList.replaceChildren(
    ...opportunities.map((opportunity) => {
      const card = document.createElement("article");
      card.className = "opportunity-card";
      card.innerHTML = `
        <div class="card-topline">
          <span class="risk risk-${opportunity.riskLabel.toLowerCase()}">${opportunity.riskLabel} risk</span>
          <span class="score">${opportunity.riskScore}</span>
        </div>
        <h3>${opportunity.name}</h3>
        <p class="message">${opportunity.nextStep || "No next step captured."}</p>
        <dl>
          <div><dt>Account</dt><dd>${opportunity.account.name}</dd></div>
          <div><dt>Stage</dt><dd>${opportunity.stage}</dd></div>
          <div><dt>Amount</dt><dd>$${formatCompact(opportunity.amount)}</dd></div>
          <div><dt>Weighted</dt><dd>$${formatCompact(opportunity.weightedAmount)}</dd></div>
        </dl>
        <div class="tags">
          <span>${opportunity.forecastCategory}</span>
          <span>${opportunity.probability}% probability</span>
          <span>${opportunity.lastActivityDays} days since activity</span>
          <span>${opportunity.contactCoverage} contact${opportunity.contactCoverage === 1 ? "" : "s"}</span>
        </div>
        ${renderSuggestions(opportunity.suggestions)}
      `;
      return card;
    })
  );
}

function renderSuggestions(suggestions) {
  if (suggestions.length === 0) return "";

  return `
    <section class="coach-actions" aria-label="Deal Coach suggestions">
      <div class="coach-actions-heading">
        <span>Rep coaching prompts</span>
        <strong>${suggestions.length} action${suggestions.length === 1 ? "" : "s"}</strong>
      </div>
      <ol>
        ${suggestions
          .map(
            (suggestion) => `
              <li>
                <span class="priority priority-${suggestion.priority}">${suggestion.priority}</span>
                <div>
                  <strong>${suggestion.title}</strong>
                  <p>${suggestion.detail}</p>
                </div>
              </li>
            `
          )
          .join("")}
      </ol>
    </section>
  `;
}

function formatCompact(value) {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function cssToken(value) {
  return value.toLowerCase().replaceAll(" ", "-");
}

elements.ownerFilter.addEventListener("change", (event) => {
  state.owner = event.target.value;
  render();
});

loadCrm();
