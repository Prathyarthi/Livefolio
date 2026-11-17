import { RecruiterSection, SectionPoints } from "@/features/landing/components/recruiter-section";
import { RecruiterScoreStill } from "@/features/landing/components/recruiter-stills";

const POINTS = [
  {
    title: "Skill match",
    body: "A skill in the skills list counts more than one mentioned in passing.",
  },
  {
    title: "Proof of work",
    body: "Shipped links and source count most. Years of experience are a filter, not a bonus.",
  },
  {
    title: "Coding activity, when it matters",
    body: "GitHub and LeetCode count for engineering roles only. Sales or design roles aren't penalised.",
  },
] as const;

export function RecruiterHowWeRank() {
  return (
    <RecruiterSection
      id="how-we-rank"
      index="1.0"
      label="Ranking"
      title={
        <>
          A score you can read.
          <br />
          Not a black box.
        </>
      }
      body="Every applicant gets a score from 0 to 100 against your job, with up to four plain reasons."
    >
      <figure className="mx-auto w-full max-w-[1040px]">
        <RecruiterScoreStill />
      </figure>
      <SectionPoints points={POINTS} />
    </RecruiterSection>
  );
}
