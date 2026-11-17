"use client";

import { Briefcase, ChevronDown, Inbox, Search, Settings } from "lucide-react";
import {
  DEMO_APPLICANTS,
  DEMO_TERMS,
} from "@/features/landing/components/recruiter-demo-data";
import { useRecruiterStageLook } from "@/features/landing/components/recruiter-stage-look";
import {
  REFERENCE_SCORE_POINTS,
  referenceScore,
} from "@/features/search/lib/references";
import type { Act } from "@/features/landing/stageshow/kit/act";
import { Badge } from "@/features/landing/stageshow/kit/controls/Badge";
import { Toggle } from "@/features/landing/stageshow/kit/controls/Toggle";
import type { Layout } from "@/features/landing/stageshow/kit/looks";
import { Count } from "@/features/landing/stageshow/kit/motion/Count";
import { States } from "@/features/landing/stageshow/kit/motion/States";
import { Avatar } from "@/features/landing/stageshow/kit/parts/Avatar";
import { Card } from "@/features/landing/stageshow/kit/parts/Card";
import { Row } from "@/features/landing/stageshow/kit/parts/Row";
import { Stage } from "@/features/landing/stageshow/kit/stage";
import { Bar, Text, Window } from "@/features/landing/stageshow/kit/window";
import "./recruiter-shortlist-demo.css";

// A recruiter's ranked shortlist for one job. Turning on "Include references"
// buds a points chip onto each applicant with references, their scores roll
// up, and the list glides into its new order: Meera, whose peer vouched for
// her Node work, rises from third to first. The reference card beside the
// window is hers, and its status changes with the same switch. Turning it
// off again is the reset, so the loop never rewinds without a cause.

const APPLICANTS = DEMO_APPLICANTS.map((applicant) => {
  const { score } = referenceScore(applicant.references, DEMO_TERMS);
  const bonus = Math.round(score * REFERENCE_SCORE_POINTS);
  return { ...applicant, bonus, withRefs: Math.min(100, applicant.livefolio + bonus) };
});

const BY_BASE = APPLICANTS.map((a) => a.id);
const BY_REFS = [...APPLICANTS].sort((a, b) => b.withRefs - a.withRefs).map((a) => a.id);
const MEERA = APPLICANTS.find((a) => a.id === "meera")!;
const QUOTE = MEERA.references[0];

const ROW_H = { wide: 76, compact: 62 } as const;
const FILLER = [
  { name: 118, line: 210, score: 22 },
  { name: 96, line: 176, score: 22 },
];

type S = { on: boolean; chips: boolean; scored: boolean; order: string[]; moving: boolean };

const initial: S = { on: false, chips: false, scored: false, order: BY_BASE, moving: false };
const poster: S = { on: true, chips: true, scored: true, order: BY_REFS, moving: false };

async function script(a: Act<S>) {
  await a.wait(1100);

  a.mark("toggle");
  await a.move({ at: "toggle", x: 0.7, y: 0.55 });
  await a.wait(250);
  await a.click();
  await a.set({ on: true });
  await a.wait(220);
  await a.set({ chips: true });
  await a.wait(420);
  await a.set({ scored: true });
  await a.wait(950);

  a.mark("reorder");
  await a.set({ order: BY_REFS, moving: true });
  await a.wait(1050);
  await a.set({ moving: false });
  await a.move("rest");
  await a.wait(2400);

  a.mark("off");
  await a.move({ at: "toggle", x: 0.7, y: 0.55 });
  await a.wait(250);
  await a.click();
  await a.set({ on: false, scored: false });
  await a.wait(320);
  await a.set({ chips: false });
  await a.wait(500);
  await a.set({ order: BY_BASE, moving: true });
  await a.wait(1050);
  await a.set({ moving: false });
  await a.move("rest");
  await a.wait(600);
}

function Sidebar() {
  const nav = [
    { icon: Briefcase, label: "Jobs", active: true },
    { icon: Inbox, label: "Applicants" },
    { icon: Search, label: "Talent search" },
  ];
  return (
    <div className="rsd-side">
      <div className="rsd-workspace">
        <Text className="rsd-workspace__name">Northwind</Text>
        <ChevronDown size={13} strokeWidth={1.8} className="rsd-icon" />
      </div>
      <div className="rsd-nav-group">
        {nav.map(({ icon: Icon, label, active }) => (
          <div key={label} className="rsd-nav" data-active={active || undefined}>
            <Icon size={15} strokeWidth={1.7} className="rsd-icon" />
            <Text className="rsd-nav__label">{label}</Text>
          </div>
        ))}
      </div>
      <div className="rsd-nav-group">
        <div className="rsd-section">
          <Bar w={52} h={5} tone={2} />
        </div>
        {[64, 52, 72].map((w, i) => (
          <div key={i} className="rsd-nav">
            <Bar w={14} h={14} r={4} tone={2} />
            <Bar w={w} h={5} tone={3} />
          </div>
        ))}
      </div>
      <div className="rsd-nav rsd-nav--foot">
        <Settings size={15} strokeWidth={1.7} className="rsd-icon" />
        <Bar w={48} h={5} tone={3} />
      </div>
    </div>
  );
}

function ApplicantRow({ applicant, s, layout }: { applicant: (typeof APPLICANTS)[number]; s: S; layout: Layout }) {
  const slot = s.order.indexOf(applicant.id);
  const score = s.scored ? applicant.withRefs : applicant.livefolio;
  const hasRefs = applicant.bonus > 0;
  const compact = layout === "compact";
  const rising = slot < (s.order === BY_REFS ? BY_BASE : BY_REFS).indexOf(applicant.id);
  return (
    <div
      className="rsd-slot"
      data-rising={rising || undefined}
      data-lifted={(rising && s.moving) || undefined}
      style={{ transform: `translateY(${slot * ROW_H[layout]}px)` }}
    >
      <span className="rsd-rank">
        <Count value={slot + 1} duration={500} />
      </span>
      <Row
        className="rsd-row"
        pad={12}
        lead={<Avatar name={applicant.name} size={compact ? 30 : 34} />}
        title={
          <span className="rsd-name">
            <Text className="rsd-name__text">{applicant.name}</Text>
            {!compact && <Text className="rsd-name__role">{applicant.headline}</Text>}
          </span>
        }
        subtitle={<Text className="rsd-reasons">{compact ? applicant.headline : applicant.reasons}</Text>}
      >
        <span className="rsd-trail">
          <span className="rsd-chip" data-show={(hasRefs && s.chips) || undefined}>
            {hasRefs ? (
              <Badge tone="accent" className="rsd-chip__badge">
                {compact ? `+${applicant.bonus}` : `References +${applicant.bonus}`}
              </Badge>
            ) : null}
          </span>
          <span className="rsd-score">
            <Count value={score} className="rsd-score__value" />
            <span className="rsd-score__of">/100</span>
          </span>
        </span>
      </Row>
    </div>
  );
}

function FillerRow({ index, compact }: { index: number; compact: boolean }) {
  const f = FILLER[index];
  return (
    <div className="rsd-slot" style={{ transform: `translateY(${(APPLICANTS.length + index) * ROW_H[compact ? "compact" : "wide"]}px)` }}>
      <span className="rsd-rank">
        <Bar w={7} h={7} r={2} tone={2} />
      </span>
      <Row
        className="rsd-row"
        pad={12}
        lead={<Avatar plain size={compact ? 30 : 34} />}
        title={<Bar w={f.name} h={6} tone={3} />}
        subtitle={<Bar w={compact ? Math.min(f.line, 150) : f.line} h={6} tone={2} />}
      >
        <span className="rsd-trail">
          <Bar w={f.score} h={8} tone={3} />
        </span>
      </Row>
    </div>
  );
}

function ReferenceCard({ s }: { s: S }) {
  return (
    <Card lift flush className="rsd-ref" pad="medium">
      <div className="rsd-ref__head">
        <Text className="rsd-ref__label">Reference for Meera P.</Text>
        <States
          align="end"
          value={s.chips ? "on" : "off"}
          states={{
            off: <Badge>Not counted</Badge>,
            on: <Badge tone="accent">{`+${MEERA.bonus} to score`}</Badge>,
          }}
        />
      </div>
      <div className="rsd-ref__main">
        <p className="rsd-ref__quote">
          “Meera owned our <mark className="rsd-ref__term">Node</mark> API migration end to end.”
        </p>
        <Row
          pad={0}
          className="rsd-ref__who"
          lead={<Avatar name={QUOTE.referee} size={28} />}
          title={<Text>{QUOTE.referee}</Text>}
          subtitle={<Text>Peer · signed in with GitHub</Text>}
        />
      </div>
    </Card>
  );
}

function Scene({ s, layout }: { s: S; layout: Layout }) {
  const compact = layout === "compact";
  const toolbar = (
    <span className="rsd-switch">
      {!compact && <Text className="rsd-switch__label">Include references</Text>}
      {compact && <Text className="rsd-switch__label">References</Text>}
      <Toggle on={s.on} data-target="toggle" data-cursor="pointer" />
    </span>
  );
  const list = (
    <div className="rsd-body">
      {!compact && (
        <div className="rsd-filters">
          <Text className="rsd-filters__terms">React · Node · 2+ years</Text>
          <span className="rsd-filters__spacer" />
          <Text className="rsd-filters__count">38 applicants · Best match</Text>
        </div>
      )}
      <div className="rsd-list" style={{ height: (APPLICANTS.length + FILLER.length) * ROW_H[layout] }}>
        {APPLICANTS.map((applicant) => (
          <ApplicantRow key={applicant.id} applicant={applicant} s={s} layout={layout} />
        ))}
        {FILLER.map((_, i) => (
          <FillerRow key={i} index={i} compact={compact} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {compact ? (
        <Window title="React + Node engineer" toolbar={toolbar} className="rsd-window">
          {list}
        </Window>
      ) : (
        <Window title="React + Node engineer" toolbar={toolbar} sidebar={<Sidebar />} sidebarWidth={200} className="rsd-window">
          {list}
        </Window>
      )}
      {!compact && <ReferenceCard s={s} />}
      <span data-target="rest" className="rsd-rest" />
    </>
  );
}

/** The recruiters hero: a ranked shortlist re-ranking when references count. Sample data. */
export function RecruiterShortlistDemo() {
  const look = useRecruiterStageLook();

  return (
    <Stage
      width={1040}
      height={540}
      compact={{ below: 640, width: 358, height: 342 }}
      {...look}
      initial={initial}
      poster={poster}
      script={script}
      cursor={{ at: "rest" }}
      className="rsd"
    >
      {(s, _rect, layout) => <Scene s={s} layout={layout} />}
    </Stage>
  );
}
