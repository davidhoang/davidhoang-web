/**
 * Thesis hub — living convictions with curated further reading.
 * Keep reading lists short (2–3 per section). Prefer on-site writing/notes
 * so conviction → evidence is one click; external links are secondary.
 */

export type ThesisReadingKind = 'writing' | 'notes' | 'external';

export interface ThesisReadingLink {
  kind: ThesisReadingKind;
  /** Content collection id for writing/notes; full URL for external */
  id: string;
  /** Fallback title if the collection entry is missing at build time */
  title: string;
  /** One-line why this supports the conviction */
  note: string;
}

export interface ThesisSection {
  id: string;
  title: string;
  lede: string;
  points: Array<{ label: string; body: string }>;
  reading: ThesisReadingLink[];
}

export const thesisSections: ThesisSection[] = [
  {
    id: 'future-of-software-design',
    title: 'The future of software design',
    lede:
      'Design is shifting from artifacts to outcomes. The work moves upstream: defining systems, interfaces, and constraints that enable software to be assembled, not just designed. AI accelerates this shift by compressing the distance between intent and implementation.',
    points: [
      {
        label: 'Systems over screens',
        body: 'Designers specify behaviors, contracts, and data models that span products and platforms.',
      },
      {
        label: 'Proof over prototype',
        body: 'Real, runnable proofs replace static mockups; fidelity is functionality.',
      },
      {
        label: 'Human-in-the-loop',
        body: 'Designers become editors and directors of AI-generated variants, curating toward taste and performance.',
      },
    ],
    reading: [
      {
        kind: 'writing',
        id: 'a-new-mvc-is-emerging',
        title: 'A new MVC is emerging',
        note: 'How models, views, and agents recompose the design surface',
      },
      {
        kind: 'writing',
        id: 'building-your-designs',
        title: 'Building your designs',
        note: 'Proof over prototype — shipping as the design medium',
      },
      {
        kind: 'notes',
        id: 'dynamic-interfaces',
        title: 'Dynamic Interfaces',
        note: 'Garden notes on interfaces that adapt in real time',
      },
    ],
  },
  {
    id: 'ai-native-management',
    title: 'AI-native management',
    lede:
      'Teams are evolving from maker-only to maker–model ensembles. Management shifts from headcount planning to capability planning—what combination of people, data, and models delivers outcomes reliably and safely.',
    points: [
      {
        label: 'Orchestration',
        body: 'Managers design workflows where agents handle repetitive work and people handle ambiguity.',
      },
      {
        label: 'Quality as a product',
        body: 'Evaluation data, benchmarks, and red-teaming become first-class assets.',
      },
      {
        label: 'Ethics and controls',
        body: 'Guardrails, consent, and attribution are operating requirements, not post-facto checks.',
      },
    ],
    reading: [
      {
        kind: 'writing',
        id: 'operator-mode',
        title: 'Operator Mode',
        note: 'Doing the work between founder and professional management',
      },
      {
        kind: 'writing',
        id: 'career-reboot',
        title: 'Career reboot',
        note: 'Reorienting leadership craft for the AI incursion',
      },
      {
        kind: 'writing',
        id: 'designs-seat-at-the-cap-table-part-i',
        title: "Design's Seat at the (Cap) Table: Part I",
        note: 'Why design judgment belongs in strategy and ownership',
      },
    ],
  },
  {
    id: 'post-ide-world',
    title: 'Post-IDE world',
    lede:
      'As coding shifts from manual keystrokes to conversational and agentic workflows, the IDE becomes a collaboration surface rather than the primary tool. The primitives are problems, tests, and contracts; the output is orchestrated by agents and reviewed by humans.',
    points: [
      {
        label: 'Intent-first',
        body: 'Problem decomposition, specs, and evaluation drive generation.',
      },
      {
        label: 'Continuous verification',
        body: 'Tests, types, and instrumentation are the new UI.',
      },
      {
        label: 'Composable agents',
        body: 'Tool-using agents coordinate across repos, clouds, and runtimes.',
      },
    ],
    reading: [
      {
        kind: 'writing',
        id: 'idde',
        title: 'IDDE: The infusion of design and dev tools',
        note: 'Killing handoff in favor of shared creation surfaces',
      },
      {
        kind: 'writing',
        id: 'the-formlessness-of-ai-agents',
        title: 'The formlessness of AI agents',
        note: 'Finding vessels for capabilities that outgrow the IDE',
      },
      {
        kind: 'notes',
        id: 'mvc-is-decoupling',
        title: 'A New MVC is Emerging',
        note: 'Early notes on LLMs, apps, and agents as the new stack',
      },
    ],
  },
  {
    id: 'human-x-ai-collaboration',
    title: 'Human × AI collaboration',
    lede:
      'Great outcomes emerge when people and models play to their strengths. Humans set direction, define taste, and handle ambiguity; AI accelerates exploration, handles repetition, and scales evaluation.',
    points: [
      {
        label: 'Taste as direction',
        body: 'Humans define the bar; models explore the possibility space toward it.',
      },
      {
        label: 'Interfaces as partnership',
        body: 'The UI is no longer a fixed shell — it mediates intent between people and agents.',
      },
      {
        label: 'Creative leverage',
        body: 'AI expands range without replacing judgment, craft, or accountability.',
      },
    ],
    reading: [
      {
        kind: 'writing',
        id: 'waiting-for-ais-pull-to-refresh-moment',
        title: "Waiting for AI's pull-to-refresh moment",
        note: 'The race to invent the interaction grammar of AI interfaces',
      },
      {
        kind: 'notes',
        id: 'ai-creativity-tools',
        title: 'AI as Creative Partner',
        note: 'Early thoughts on collaborating with generative tools',
      },
      {
        kind: 'external',
        id: 'https://davidhoang.substack.com/p/real-time-strategy-games-and-ai-interfaces',
        title: 'Real-time strategy and AI interfaces',
        note: 'RTS mental models for directing agents in the field',
      },
    ],
  },
];

export function thesisReadingHref(link: ThesisReadingLink): string {
  if (link.kind === 'writing') return `/writing/${link.id}`;
  if (link.kind === 'notes') return `/notes/${link.id}`;
  return link.id;
}
