"use client";

import { Check, FileText, Globe, Lock, Quote } from "lucide-react";
import { GitHubIcon } from "@/features/landing/components/integration-icons";
import { useRecruiterStageLook } from "@/features/landing/components/recruiter-stage-look";
import { Button } from "@/features/landing/stageshow/kit/controls/Button";
import { Segmented } from "@/features/landing/stageshow/kit/controls/Segmented";
import { Avatar } from "@/features/landing/stageshow/kit/parts/Avatar";
import { Card } from "@/features/landing/stageshow/kit/parts/Card";
import { Meter } from "@/features/landing/stageshow/kit/parts/Meter";
import { Row } from "@/features/landing/stageshow/kit/parts/Row";
import { Stage } from "@/features/landing/stageshow/kit/stage";
import { Bar, Text, Window } from "@/features/landing/stageshow/kit/window";
import "./recruiter-stills.css";

// Two stills for the recruiters page, in the hero's look.
//
// Score: Meera's application, the frozen snapshot of her work on the left and
// her match score on the right with the plain reasons behind it. The score
// panel is the subject; the snapshot is context, mostly quiet lines.
//
// Vouch: the page a referee lands on from the candidate's private link,
// signed in with GitHub, picking how they worked together and writing one
// story. The candidate's request straddles the browser's left margin.

const REASONS = [
  { icon: Check, text: "Must-have: Node", from: "Skills" },
  { icon: Globe, text: "Live project with source: Billing API", from: "Projects" },
  { icon: FileText, text: "Published writing on APIs", from: "Writing" },
  { icon: Quote, text: "2 references mention what you’re looking for", from: "References" },
];

export function RecruiterScoreStill() {
  const look = useRecruiterStageLook();
  return (
    <Stage width={1040} height={430} compact={{ below: 640, width: 358, height: 342 }} {...look} className="rss">
      {(_s, _rect, layout) => {
        const compact = layout === "compact";
        const panel = (
          <Card tone="sunken" pad="large" gap={16} className="rss-panel">
            <div className="rss-panel__head">
              <Text className="rss-label">Match score</Text>
              <span className="rss-score">
                <span className="rss-score__value">90</span>
                <span className="rss-score__of">/100</span>
              </span>
            </div>
            <Meter value={0.9} className="rss-meter" />
            <div className="rss-reasons">
              {(compact ? [REASONS[0], REASONS[1], REASONS[3]] : REASONS).map(({ icon: Icon, text, from }) => (
                <div key={text} className="rss-reason">
                  <span className="rss-reason__icon">
                    <Icon size={14} strokeWidth={2} />
                  </span>
                  <Text className="rss-reason__text" wrap>
                    {text}
                  </Text>
                  {!compact && <Text className="rss-reason__from">{from}</Text>}
                </div>
              ))}
            </div>
          </Card>
        );
        return (
          <Window
            title="Meera P. · Backend engineer"
            toolbar={
              compact ? undefined : (
                <Button variant="primary" size="medium">
                  Move to interview
                </Button>
              )
            }
            className="rss-window"
          >
            <div className="rss-body">
              {!compact && (
                <div className="rss-snapshot">
                  <div className="rss-snapshot__note">
                    <Lock size={13} strokeWidth={2} className="rss-icon" />
                    <Text className="rss-snapshot__label">Snapshot from the day she applied</Text>
                  </div>
                  <Row
                    pad={12}
                    className="rss-project"
                    lead={<span className="rss-thumb" data-tone="1" />}
                    title={<Text>Billing API</Text>}
                    subtitle={<Text>Live link · Source on GitHub</Text>}
                  />
                  <Row
                    pad={12}
                    className="rss-project"
                    lead={<span className="rss-thumb" data-tone="2" />}
                    title={<Text>Designing idempotent APIs</Text>}
                    subtitle={<Text>Article</Text>}
                  />
                  {[132, 108, 150].map((w, i) => (
                    <Row
                      key={i}
                      pad={12}
                      className="rss-project"
                      lead={<span className="rss-thumb" />}
                      title={<Bar w={w} h={6} tone={3} />}
                      subtitle={<Bar w={w - 40} h={6} tone={2} />}
                    />
                  ))}
                </div>
              )}
              {panel}
            </div>
          </Window>
        );
      }}
    </Stage>
  );
}

export function RecruiterVouchStill() {
  const look = useRecruiterStageLook();
  return (
    <Stage width={1040} height={450} compact={{ below: 640, width: 358, height: 342 }} {...look} className="rvs">
      {(_s, _rect, layout) => {
        const compact = layout === "compact";
        return (
          <>
            <Window url="livefolio.com/vouch/meera-p" urlShape="pill" className="rvs-window">
              <div className="rvs-page">
                <div className="rvs-form">
                  <div className="rvs-title">Vouch for Meera P.</div>
                  <div className="rvs-signed">
                    <GitHubIcon className="rvs-github" />
                    <Text className="rvs-signed__text">Signed in as Karan M.</Text>
                  </div>
                  {!compact && (
                    <div className="rvs-group">
                      <Text className="rvs-label">How did you work together?</Text>
                      <Segmented items={["Manager", "Peer", "Collaborator", "Other"]} value={1} className="rvs-seg" />
                    </div>
                  )}
                  <div className="rvs-group">
                    {!compact && <Text className="rvs-label">Your story</Text>}
                    <div className="rvs-story">
                      Meera owned our Node API migration end to end and moved every service over without
                      downtime.
                    </div>
                  </div>
                  <Button variant="primary" size="large" className="rvs-send">
                    Send reference
                  </Button>
                </div>
              </div>
            </Window>
            {!compact && (
              <Card lift pad="medium" gap={12} className="rvs-request">
                <Row
                  pad={0}
                  className="rvs-request__from"
                  lead={<Avatar name="Meera P." size={30} />}
                  title={<Text>Meera P.</Text>}
                  subtitle={<Text>to karan@northwind.dev</Text>}
                />
                <Text className="rvs-request__text" wrap>
                  Could you vouch for my work on the Node API migration? It takes two minutes.
                </Text>
              </Card>
            )}
          </>
        );
      }}
    </Stage>
  );
}
