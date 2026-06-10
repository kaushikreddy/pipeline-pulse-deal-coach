export const sampleCrmData = {
  accounts: [
    {
      id: "acct-101",
      name: "Northstar Bank",
      industry: "Financial Services",
      segment: "Enterprise",
      owner: "Maya Chen",
      health: "At Risk",
      arr: 420000,
      renewalDate: "2026-08-15"
    },
    {
      id: "acct-102",
      name: "BrightCart",
      industry: "Retail",
      segment: "Mid-Market",
      owner: "Jordan Lee",
      health: "Healthy",
      arr: 96000,
      renewalDate: "2026-11-01"
    },
    {
      id: "acct-103",
      name: "Atlas Health",
      industry: "Healthcare",
      segment: "Enterprise",
      owner: "Maya Chen",
      health: "Watch",
      arr: 310000,
      renewalDate: "2026-07-20"
    },
    {
      id: "acct-104",
      name: "Helio Robotics",
      industry: "Manufacturing",
      segment: "Enterprise",
      owner: "Sam Rivera",
      health: "Healthy",
      arr: 180000,
      renewalDate: "2026-12-12"
    },
    {
      id: "acct-105",
      name: "Studio Finch",
      industry: "Professional Services",
      segment: "SMB",
      owner: "Jordan Lee",
      health: "Watch",
      arr: 24000,
      renewalDate: "2026-09-05"
    }
  ],
  opportunities: [
    {
      id: "opp-201",
      accountId: "acct-101",
      name: "Northstar enterprise expansion",
      stage: "Proposal",
      amount: 185000,
      probability: 55,
      closeDate: "2026-06-28",
      nextStep: "Confirm procurement timeline with VP Finance",
      lastActivityDays: 18,
      contactCoverage: 2
    },
    {
      id: "opp-202",
      accountId: "acct-102",
      name: "BrightCart workflow automation",
      stage: "Negotiation",
      amount: 68000,
      probability: 70,
      closeDate: "2026-06-14",
      nextStep: "Send final security answers",
      lastActivityDays: 4,
      contactCoverage: 3
    },
    {
      id: "opp-203",
      accountId: "acct-103",
      name: "Atlas compliance rollout",
      stage: "Discovery",
      amount: 140000,
      probability: 35,
      closeDate: "2026-07-09",
      nextStep: "Confirm executive sponsor before compliance workshop",
      lastActivityDays: 24,
      contactCoverage: 1
    },
    {
      id: "opp-204",
      accountId: "acct-104",
      name: "Helio analytics add-on",
      stage: "Qualified",
      amount: 52000,
      probability: 25,
      closeDate: "2026-08-30",
      nextStep: "Book technical validation call",
      lastActivityDays: 9,
      contactCoverage: 2
    },
    {
      id: "opp-205",
      accountId: "acct-105",
      name: "Studio Finch team upgrade",
      stage: "Proposal",
      amount: 18000,
      probability: 45,
      closeDate: "2026-06-20",
      nextStep: "Review annual plan pricing",
      lastActivityDays: 31,
      contactCoverage: 1
    }
  ],
  contacts: [
    {
      id: "con-301",
      accountId: "acct-101",
      name: "Elena Price",
      role: "VP Finance",
      influence: "Economic Buyer",
      lastContactedDays: 18
    },
    {
      id: "con-302",
      accountId: "acct-101",
      name: "Marcus Hill",
      role: "RevOps Director",
      influence: "Champion",
      lastContactedDays: 7
    },
    {
      id: "con-303",
      accountId: "acct-103",
      name: "Priya Shah",
      role: "Compliance Lead",
      influence: "Evaluator",
      lastContactedDays: 24
    },
    {
      id: "con-304",
      accountId: "acct-102",
      name: "Owen Brooks",
      role: "COO",
      influence: "Economic Buyer",
      lastContactedDays: 4
    }
  ],
  tasks: [
    {
      id: "task-401",
      accountId: "acct-101",
      title: "Send procurement timeline recap",
      dueDate: "2026-05-30",
      status: "open",
      priority: "High"
    },
    {
      id: "task-402",
      accountId: "acct-103",
      title: "Identify executive sponsor",
      dueDate: "2026-05-24",
      status: "open",
      priority: "High"
    },
    {
      id: "task-403",
      accountId: "acct-102",
      title: "Share completed security response",
      dueDate: "2026-05-29",
      status: "open",
      priority: "Medium"
    },
    {
      id: "task-404",
      accountId: "acct-104",
      title: "Schedule technical validation",
      dueDate: "2026-06-03",
      status: "open",
      priority: "Medium"
    }
  ],
  activities: [
    {
      id: "act-501",
      accountId: "acct-101",
      type: "call",
      date: "2026-05-10",
      summary: "Buyer asked for procurement timeline and discount structure."
    },
    {
      id: "act-502",
      accountId: "acct-103",
      type: "note",
      date: "2026-05-04",
      summary: "Compliance team likes product fit but no executive sponsor has been confirmed."
    },
    {
      id: "act-503",
      accountId: "acct-102",
      type: "email",
      date: "2026-05-24",
      summary: "Security questionnaire returned with two remaining items."
    }
  ]
};
