# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to JobPilot.

Read the relevant section before implementing any feature that touches these libraries.

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check AGENTS.md** at the project root — it lists every skill installed for this project and how to use them. Skills contain up-to-date API documentation, usage patterns, and best practices specific to this codebase.

2. **Check if an MCP server is configured** for that library. Some tools have MCP servers that give the AI agent direct access to documentation, logs, and debugging tools. If an MCP server is available — use it before falling back to general knowledge.

3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills via AGENTS.md → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated.

---

## InsForge

**Check first:** Check AGENTS.md for an installed InsForge skill. If an InsForge MCP server is configured — use it. The skill/MCP will have the latest API patterns.

### Client vs Server

Two separate instances — never mix them:

```typescript
// lib/insforge-client.ts — browser context only
import { createBrowserClient } from "@insforge/ssr";

export const insforge = createBrowserClient(
  process.env.NEXT_PUBLIC_INSFORGE_URL!,
  process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
);
```

```typescript
// lib/insforge-server.ts — server context only
import { createServerClient } from "@insforge/ssr";
import { cookies } from "next/headers";

export const createInsforgeServer = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_INSFORGE_URL!,
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
};
```

**Rules:**

- Browser client — Client Components, browser-side auth state, realtime subscriptions
- Server client — Server Components, API routes, Server Actions, agent functions
- Never use browser client in server context
- Never use server client in browser context

---

### Auth

```typescript
// Get current user in server context
const insforge = await createInsforgeServer();
const {
  data: { user },
  error,
} = await insforge.auth.getUser();
if (!user) redirect("/login");
```

---

### DB Queries

```typescript
// Read
const { data, error } = await insforge
  .from("jobs")
  .select("*")
  .eq("user_id", user.id)
  .order("found_at", { ascending: false });

// Insert
const { data, error } = await insforge
  .from("jobs")
  .insert({ user_id: user.id, title, company, match_score })
  .select()
  .single();

// Update
const { error } = await insforge
  .from("jobs")
  .update({ company_research: dossier })
  .eq("id", jobId)
  .eq("user_id", user.id); // always scope to user
```

**Rules:**

- Always scope queries to `user_id` — never query without user filter
- Always handle the `error` return — never assume success
- Use `.single()` when expecting exactly one row

---

### Storage

```typescript
// Upload file
const { data, error } = await insforge.storage
  .from("resumes")
  .upload(`${userId}/resume.pdf`, fileBuffer, {
    contentType: "application/pdf",
    upsert: true, // overwrites existing file
  });

// Get public URL
const { data } = insforge.storage
  .from("resumes")
  .getPublicUrl(`${userId}/resume.pdf`);

const url = data.publicUrl;
```

**Storage paths:**

- Base resume: `resumes/{user_id}/resume.pdf`

**Rules:**

- Always use `upsert: true` for base resume uploads — overwrites existing file
- Always save the public URL back to the DB after upload
- Never write files to disk — always upload buffer directly to storage

---

## JobsPipe API

**Check first:** Check AGENTS.md for an installed JobsPipe skill. If none exists — use this file and the official JobsPipe docs (docs.jobspipe.dev).

### Job Search

```typescript
// lib/jobspipe.ts
export async function searchJobs(
  jobTitle: string,
  location: string,
): Promise<JobsPipeJob[]> {
  const apiKey = process.env.JOBSPIPE_API_KEY;
  const useSandbox = !apiKey && process.env.NODE_ENV !== "production";
  const endpoint = useSandbox
    ? "https://api.jobspipe.dev/v1/sandbox/jobs/search"
    : "https://api.jobspipe.dev/v1/jobs/search";

  // Strict body schema — send only documented filters, unknown fields get HTTP 400 on live
  const body: Record<string, unknown> = {
    job_title_or: [jobTitle],
    limit: 10,
    include_total_results: true,
  };
  if (location) {
    body.job_location_or = [location];
    if (/remote/i.test(location)) body.remote = true;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(useSandbox ? {} : { Authorization: `Bearer ${apiKey}` }),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`JobsPipe API error: ${response.status}`);
  }

  const json = await response.json();
  return json.data ?? [];
}
```

### Response Shape

Response is a `{ metadata, data }` envelope — jobs live in `data[]`. Confirmed against the sandbox (2026-08-21); live postings may carry additional optional fields:

```typescript
type JobsPipeJob = {
  id: string;
  job_title: string;
  company?: string;
  company_domain?: string;
  location?: string;
  remote?: boolean;
  description?: string; // full description on live data (sandbox samples omit it)
  source?: string; // posting board slug, e.g. "greenhouse", "linkedin" — null on sandbox samples
  url?: string;
  source_url?: string;
  final_url?: string;
  salary_string?: string; // verbatim pay text when disclosed (~25% of postings)
  min_annual_salary_usd?: number;
  max_annual_salary_usd?: number;
  employment_statuses?: string[]; // e.g. ["full_time"]
  date_posted?: string; // source-format date — we keep using discovery time for found_at
};
```

### Saving Jobs to DB

```typescript
// Map JobsPipe result to jobs table
const jobRecord = {
  user_id: userId,
  run_id: runId,
  source: "search", // always 'search' for JobsPipe jobs — discovery channel
  posting_source: resolvePostingSource(job), // board slug / hostname, see lib/posting-source.ts
  source_url: job.final_url ?? job.url ?? job.source_url ?? null,
  external_apply_url: job.final_url ?? job.url ?? job.source_url ?? null,
  title: job.job_title,
  company: job.company ?? "Unknown Company",
  location: job.location ?? null,
  salary:
    job.salary_string ??
    (job.min_annual_salary_usd
      ? `$${Math.round(job.min_annual_salary_usd / 1000)}k - $${Math.round((job.max_annual_salary_usd ?? job.min_annual_salary_usd) / 1000)}k`
      : null),
  job_type: JOB_TYPE_MAP[job.employment_statuses?.[0] ?? ""] ?? "fulltime",
  about_role: job.description ?? "",
  match_score: scoredJob.matchScore,
  match_reason: scoredJob.matchReason,
  matched_skills: scoredJob.matchedSkills,
  missing_skills: scoredJob.missingSkills,
  found_at: new Date().toISOString(), // discovery time, not date_posted
};
```

**Rules:**

- Request body schema is strict on the live API — send only documented filter fields (`job_title_or`, `job_location_or`, `remote`, `limit`, `include_total_results`); unknown/misspelled fields are rejected with HTTP 400 naming the field
- Never pass `job_location_or` if location is empty — omit the key entirely; set `remote: true` only when the location input contains "remote"
- Error codes: 401 bad key, 402 monthly quota exceeded, 429 per-second rate limit (back off and retry), 504 upstream timeout
- Missing `JOBSPIPE_API_KEY` in non-production routes to `/v1/sandbox/jobs/search` (no key, no quota, identical filters, sample data in the live schema); production fails fast with a config error
- The sandbox ignores filters and returns fixed sample jobs — useful for shape/integration testing only
- Job IDs are per-source — never use them to dedupe across sources
- `company_domain` gives the company domain outright — supersedes feature 13's redirect-following step
- `source` (DB column) is always `'search'` for JobsPipe jobs — never any other value; the API's `source` field is the posting board and lands in `jobs.posting_source` via `resolvePostingSource()` (API slug first, hostname fallback, null when both missing)
- Sandbox samples return `source: null` for every posting — only live data populates board slugs

---

## Browserbase

**Check first:** Check AGENTS.md for an installed Browserbase skill. If a Browserbase MCP server is configured — use it. The skill/MCP will have the latest session management and API patterns.

### Session Creation — Company Research

```typescript
import Browserbase from "@browserbasehq/sdk";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

// Single session for company research — sequential page visits
// SDK 2.x: session timeout param is api_timeout (seconds) — was `timeout` in 1.x
const session = await bb.sessions.create({
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  api_timeout: 120, // 2 minute session — visits 3-4 pages max
});

// Release early instead of waiting out the timeout:
await bb.sessions.update(session.id, { status: "REQUEST_RELEASE" });
```

**Important — Browserbase runs independently from your Next.js server:**
Browserbase sessions run on Browserbase's cloud infrastructure, not inside your Next.js API route. The API route triggers the Browserbase session and returns a response while the session continues running independently on Browserbase's platform. Do not add `maxDuration` or any timeout configuration to Next.js API routes to accommodate Browserbase session length.

**Rules:**

- Always use single sessions — never parallel sessions (free plan limit)
- Session timeout is 120 seconds — sufficient for 3-4 page visits
- Always end sessions cleanly — call stagehand.close() when done
- Project ID always from `process.env.BROWSERBASE_PROJECT_ID` — never hardcode
- Browserbase client lives in `lib/browserbase.ts` — always import from there

---

## Stagehand

**Check first:** Check AGENTS.md for an installed Stagehand skill. If a Stagehand MCP server is configured — use it. The skill/MCP will have the latest act() and extract() patterns.

> **Version pin: 3.x (installed 3.7.2, 2026-08-22).** Two verified reasons not to change this setup casually:
> 1. Do NOT upgrade to @browserbasehq/stagehand@4 while Browserbase's preloaded extension still serves the v3 runtime — v4 waits for a `__stagehand_runtime` handshake marker the preloaded service worker never exposes, so every connect stalls into its hardcoded 60s init timeout.
> 2. Always pass `disableAPI: true`. Without it, page commands route through the hosted Stagehand API (`api.stagehand.browserbase.com`), which currently rejects this project with HTTP 400 / "Validation failed". `disableAPI: true` drives CDP directly and calls the LLM from the client.
>
> Revisit only after Browserbase ships the matching runtime AND a hosted-API init works for this project.

### Initialisation (v3 API — attach to an existing Browserbase session)

```typescript
import { Stagehand } from "@browserbasehq/stagehand";
import { ZEN_BASE_URL, APP_MODEL } from "@/lib/ai";

const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY!,
  projectId: process.env.BROWSERBASE_PROJECT_ID!,
  browserbaseSessionID: session.id,
  // Custom provider routing: the "openai/" prefix makes Stagehand build an
  // AI SDK OpenAI client; baseURL points it at Zen. openaiEndpointFormat
  // "chat" is REQUIRED — Zen serves only Chat Completions, and Stagehand
  // otherwise defaults to the Responses API. All options sit at the TOP
  // LEVEL of model config in v3 (no clientOptions nesting).
  model: {
    modelName: `openai/${APP_MODEL}`,
    apiKey: process.env.OPENCODE_API_KEY!,
    baseURL: ZEN_BASE_URL,
    openaiEndpointFormat: "chat",
  },
  disablePino: true,
  disableAPI: true,
});

await stagehand.init();
const page = stagehand.context.activePage()!;
```

`stagehand.close()` ends the Browserbase session via the API (`REQUEST_RELEASE`) when `keepAlive` is not enabled — call it in a `finally`.

### extract()

```typescript
import { z } from "zod";

const data = await stagehand.extract(
  "Extract the company overview, main product description, and any technology mentions from this page.",
  z.object({
    companyOverview: z.string().optional(),
    mainProduct: z.string().optional(),
    techMentions: z.array(z.string()).optional(),
  }),
);
```

Positional args `(instruction, schema)`; returns data typed as the schema output (still safeParse untrusted model output defensively).

### act()

```typescript
// Always wrap in try/catch
try {
  await stagehand.act({
    action: "Click the About link in the navigation",
  });
} catch (error) {
  await logAgentError(jobId, null, error);
}
```

## Company Research Section

Replace the existing Stagehand "Company Research Pattern" section in library-docs.md with this:

---

### Company Research Pattern

Three-step process: homepage extraction → sub-page extraction → AI synthesis.
Job description and user profile come from DB — never re-fetch what you already have.
Browser's only job is the company website.

```typescript
// Step 1 — Homepage extraction
const homepageData = await stagehand.extract(
  "This is a company's homepage. Capture what the company actually does, who it's for, and any concrete signals (funding, customers, scale, mission, recent launches). Then find the internal links most worth visiting to research them as an employer.",
  z.object({
    oneLiner: z.string().describe("What the company does in one sentence"),
    productSummary: z.string().describe("What they build/sell and who it's for"),
    signals: z.array(z.string()).describe("Funding, notable customers, scale, mission, recent news"),
    pageLinks: z
      .array(
        z.object({
          url: z.string(),
          kind: z.enum(["about", "careers", "blog", "engineering", "product", "team", "other"]),
        }),
      )
      .describe("Internal links worth visiting"),
  }),
);

// If oneLiner and productSummary are empty — wrong site or parked domain
// Skip to synthesis with job description and profile only
if (!homepageData.oneLiner && !homepageData.productSummary) {
  await stagehand.close();
  // proceed to synthesis with empty companyResearch
}

// Step 2 — Sub-page extraction (max 3, prefer about/blog/engineering/product over careers)
const subPageData = await stagehand.extract(
  "Extract substance that helps a candidate understand this company before applying: what they do, their values and how they work, the specific technologies and tools they use, notable projects or customers, and how the team operates. Ignore nav, footers, cookie banners, and generic marketing copy.",
  z.object({
    keyPoints: z.array(z.string()),
    technologies: z.array(z.string()).describe("Specific languages, frameworks, tools, platforms"),
    valuesOrCulture: z.array(z.string()).describe("Stated values, working style, team norms"),
    notable: z.array(z.string()).describe("Customers, funding, scale, projects, awards"),
  }),
);

// Step 3 — AI synthesis via Zen (after browser closes)
// Feed three data sources: company research + job from DB + profile from DB
const systemPrompt = `You are a sharp career strategist preparing a candidate to apply for a specific role. You are given (a) research collected from the company's own website, (b) the job posting, and (c) the candidate's profile. Produce a concise, concrete briefing that gives this specific candidate an edge for this specific role.

Rules:
- Ground every company claim in the provided research or job posting. Never invent funding, customers, headcount, or facts. If research was thin, infer carefully from the job posting and say what's inferred.
- Be specific to THIS candidate. Connect their actual skills and past work to this company's stack, product, and values. No generic advice that would apply to anyone.
- Turn the candidate's missing skills into a strategy: how to frame the gap honestly and what adjacent experience to lean on.
- Talking points and questions must reference real things from the research, the kind of detail that signals the candidate did their homework.
- Keep every item tight: one or two sentences. No fluff.

Return ONLY valid JSON matching this shape:
{
  "companyOverview": string,
  "techStack": string[],
  "culture": string[],
  "whyThisRole": string,
  "yourEdge": string[],
  "gapsToAddress": string[],
  "smartQuestions": string[],
  "interviewPrep": string[],
  "sources": string[]
}`;

const userPrompt = `COMPANY RESEARCH (from their website):
${JSON.stringify(companyResearch)}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Matched skills (already computed): ${job.matched_skills.join(", ")}
Missing skills (already computed): ${job.missing_skills.join(", ")}

CANDIDATE PROFILE:
Current title: ${profile.current_title}
Experience: ${profile.years_experience} years, level ${profile.experience_level}
Skills: ${profile.skills.join(", ")}
Work history: ${JSON.stringify(profile.work_experience)}`;

// Wire call — generateJson owns retries + truncation detection (see OpenCode Zen section).
// On result.truncated, retry once with maxTokens doubled before parsing.
const result = await generateJson(ai, {
  label: "agent/research",
  systemPrompt: systemPrompt,
  userPrompt: userPrompt,
  temperature: 0.4,
  maxTokens: 4096, // Gemini-era 800 truncated on nemotron (proven live); matches matcher/resume budget
});
```

**Dossier fields:**

| Field           | Type     | Purpose                                             |
| --------------- | -------- | --------------------------------------------------- |
| companyOverview | string   | What the company does                               |
| techStack       | string[] | Technologies they use                               |
| culture         | string[] | Values and working style                            |
| whyThisRole     | string   | Why this role exists                                |
| yourEdge        | string[] | Specific links between THIS candidate and this role |
| gapsToAddress   | string[] | Missing skills reframed as strategy                 |
| smartQuestions  | string[] | Questions that show real research                   |
| interviewPrep   | string[] | Topics to prepare for this role                     |
| sources         | string[] | Pages the company info came from                    |

**Rules:**

- Always use `extract()` with a Zod schema — never parse raw HTML or use regex
- Always wrap every `act()` and `extract()` in try/catch
- Always call `await stagehand.close()` when done — it releases the Browserbase session (REQUEST_RELEASE); belt-and-braces release via the SDK is fine
- Model is always `APP_MODEL` from `lib/ai.ts` (`nemotron-3-ultra-free` via Zen) — never use other models
- Temperature is `0.4` for synthesis — grounded but flexible enough to make real connections
- Max 3 sub-pages — never exceed this on free plan
- Always close session in finally block — never leave sessions open even if research fails
- Job description and profile always come from DB — never re-fetch via browser
- If browser research returns empty — still run synthesis with job + profile only
- yourEdge, gapsToAddress, and smartQuestions are the most valuable fields — never skip them

## OpenCode Zen

**Check first:** No installed skill or MCP server. This section is project law; general API reference lives at https://opencode.ai/docs/zen. The API is OpenAI-compatible — but verify live model behavior with a cheap probe before changing models or params (free-tier models vary wildly).

> **Migrated from Google Gemini (2026-08-23).** All app AI now runs through Zen with one model. `@google/genai` is uninstalled; `GEMINI_API_KEY` is retired.

### Setup

```typescript
// lib/ai.ts — single shared client + JSON completion helper. Always import from there.
import { getZenClient, generateJson, APP_MODEL } from "@/lib/ai";
import type { APIError } from "openai"; // transient-failure checks live inside generateJson

const ai = getZenClient(); // throws 'OPENCODE_API_KEY is not set.' when missing
```

- Base URL: `https://opencode.ai/zen/v1` — Chat Completions ONLY (no Responses API)
- Key env var: `OPENCODE_API_KEY` (from opencode.ai/auth)
- Model string: always `APP_MODEL` = `nemotron-3-ultra-free`

### Structured JSON Response

```typescript
// In agent files — never call ai.chat.completions.create directly
const result = await generateJson(ai, {
  label: "agent/matcher", // log prefix
  systemPrompt,           // includes "Return ONLY valid JSON" + exact keys contract
  userPrompt,
  temperature: 0.3,
  maxTokens: 4096,
});
// result.content → parseJsonContent() → zod safeParse
// result.truncated === true ⇔ finish_reason "length"
```

**Per-task parameters:**

| Task                  | Temperature | maxTokens                 |
| --------------------- | ----------- | ------------------------- |
| Job matching/scoring  | 0.3         | 4096                      |
| Profile extraction    | 0.3         | 4096                      |
| Research synthesis    | 0.4         | 4096 → 8192 on truncation |
| Resume generation     | 0.7         | 1000                      |

Research synthesis was bumped from the Gemini-era `800 → 1600` on 2026-08-23 after live proof that nemotron-3-ultra-free dossiers need ~1300 completion tokens — at 800 every attempt truncated, and the flat dossier schema (single closing brace) made truncation unsalvageable. The escalation retry also now checks `truncated` on the retried result and skips parsing straight to the repair call when still truncated.

**Free-tier realities (verified via live probe, 2026-08-23):**

- `generateJson` retries 503/429 three times with linear backoff — free-tier rate limits are expected, don't add more retries at call sites
- `nemotron-3-ultra-free` was the ONLY free Zen model honoring both `response_format: json_object` AND strict `json_schema`; laguna-s-2.1/x-preview-f ignore json_schema, hy3-free returns sloppy output, mimo-v2.5 hard-429s, nemotron-lightning leaks reasoning prose
- Models appear/disappear without notice (`deepseek-v4-flash-free` returned upstream-unavailable all day on 2026-08-23) — if APP_MODEL starts failing, re-probe `/v1/models` + the candidate matrix before swapping
- Stagehand has a built-in prompt-JSON fallback for model IDs containing `deepseek`/`kimi`/`glm` — APP_MODEL deliberately avoids those substrings so behavior stays predictable

**Rules:**

- Model is always `APP_MODEL` from `lib/ai.ts` — never hardcode a model string elsewhere
- All JSON completions go through `generateJson` — it owns retries, temperature/maxTokens wiring, and truncation detection
- On `truncated: true`: research synthesis retries with a larger cap; other tasks warn-and-proceed to parse/repair
- Always validate parsed JSON with zod — wrap parse in try/catch, use the repair-prompt retry pattern on failure
- Match threshold is always `MATCH_THRESHOLD` from `lib/utils.ts` — never hardcode 70
- Company research synthesis must always return a complete dossier — never return empty even if browser research failed

---

## PostHog

**Check first:** Check AGENTS.md for an installed PostHog skill. If a PostHog MCP server is configured — use it. The skill/MCP will have the latest client and server patterns.

### Client Setup (Browser)

```typescript
// lib/posthog-client.ts
import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
      capture_pageview: false, // manual pageview tracking
    });
  }
}

// Capture event client-side
posthog.capture("job_found", {
  userId,
  source: "search",
  matchScore: score,
});
```

### Server Setup

```typescript
// lib/posthog-server.ts
import { PostHog } from "posthog-node";

export const createPostHogServer = () =>
  new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
    flushAt: 1, // send immediately
    flushInterval: 0, // no batching — Next.js functions are short-lived
  });

// Always use and shutdown in the same function
const posthog = createPostHogServer();
posthog.capture({
  distinctId: userId,
  event: "company_researched",
  properties: { userId, jobId, company },
});
await posthog.shutdown(); // required — ensures event is sent
```

**Rules:**

- Always call `await posthog.shutdown()` in server-side functions — events are lost without it
- `flushAt: 1` and `flushInterval: 0` always set on server client
- Event names must match exactly the list in `code-standards.md`
- Always include `userId` as a property on every server-side event
- Call `posthog.identify(userId)` after login on client side
- Call `posthog.reset()` on logout on client side

---

## @react-pdf/renderer

**Check first:** Check AGENTS.md for an installed react-pdf skill. PDF generation APIs can differ from general training knowledge.

### Resume PDF Generation

```typescript
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  section: { marginBottom: 10 },
  heading: { fontSize: 14, fontWeight: 'bold' },
  text: { fontSize: 10 },
})

const ResumePDF = ({ profile }: { profile: Profile }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>{profile.fullName}</Text>
        <Text style={styles.text}>{profile.email}</Text>
      </View>
    </Page>
  </Document>
)

// Generate buffer
const buffer = await renderToBuffer(<ResumePDF profile={profile} />)

// Upload directly to InsForge Storage
await insforge.storage
  .from('resumes')
  .upload(`${userId}/resume.pdf`, buffer, {
    contentType: 'application/pdf',
    upsert: true
  })
```

**Supported CSS properties:**
Only use these — others are silently ignored:
`padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height, fontWeight, textAlign, lineHeight`

**Rules:**

- Server-side only — never import in client components
- Always use `renderToBuffer` — not `renderToStream` or `PDFDownloadLink`
- PDF generation only in `app/api/resume/` routes
- Generated buffer uploaded directly to InsForge Storage — never written to disk
- Always save public URL to DB after upload

---

## pdf-parse

**Check first:** Check AGENTS.md for an installed pdf-parse skill.

> **v2 API (installed 2.4.5, 2026-08-03):** pdf-parse v2 is **class-based** — the v1 `import pdf from "pdf-parse"; const { text } = await pdf(buffer)` pattern no longer exists. Use `PDFParse` + `getText()` + `destroy()` as below.

### Extract Text from Uploaded Resume

```typescript
import { PDFParse } from "pdf-parse";

// In API route handling resume upload
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const parser = new PDFParse({ data: buffer });
  const pdfData = await parser.getText();
  await parser.destroy();
  const extractedText = pdfData.text; // raw text content

  // Send to AI extraction (agent/extractor.ts) for structured fields
}
```

**Rules:**

- Server-side only — never import in client components
- `pdf-parse` ships its own TypeScript types — no `@types/pdf-parse` needed
- `getText()` returns `{ text: string; pages: PageTextResult[]; total: number }` — `.text` is raw unformatted text, the AI extractor handles structure extraction
- `PDFParse` accepts `{ data }` with a `Buffer`, `ArrayBuffer`, or file path string; always call `await parser.destroy()` after `getText()` to free pdf.js workers (it returns a Promise and never throws on repeat calls)
- Always handle parse errors — some PDFs are image-based and return empty text
- If `pdfData.text` is empty or very short (e.g. < 20 chars) — return error to user: "Could not extract text from this PDF. Please try a different file."
