import { RecruiterSection, SectionPoints } from "@/features/landing/components/recruiter-section";
import { RecruiterVouchStill } from "@/features/landing/components/recruiter-stills";

const POINTS = [
  {
    title: "The candidate asks",
    body: "A private link goes to a manager, peer, founder or collaborator.",
  },
  {
    title: "The referee signs in",
    body: "With GitHub or Google, then shares one real story. No anonymous praise, no self-vouching.",
  },
  {
    title: "You decide if it counts",
    body: "Turn on Include references and they add up to 12 points, by relationship and whether the story matches your job.",
  },
] as const;

export function RecruiterReferences() {
  return (
    <RecruiterSection
      id="references"
      index="2.0"
      label="References"
      title={
        <>
          Hire people others
          <br />
          will vouch for.
        </>
      }
      body="Named references from people who actually worked with the candidate. You choose whether they count."
    >
      <figure className="mx-auto w-full max-w-[1040px]">
        <RecruiterVouchStill />
      </figure>
      <SectionPoints points={POINTS} />
    </RecruiterSection>
  );
}
