"use client";

import { EDIT_FORM_STACK_CLASS } from "@/features/dashboard/constants/form-layout";
import { EDIT_STEPS, type EditStepValue } from "@/features/portfolio/constants/edit-steps";
import { AchievementForm } from "@/features/portfolio/components/achievement-form";
import { CustomSectionEditor } from "@/features/portfolio/components/custom-section-editor";
import { EducationForm } from "@/features/portfolio/components/education-form";
import { ExperienceForm } from "@/features/portfolio/components/experience-form";
import { OpenToWorkToggle } from "@/features/portfolio/components/open-to-work-toggle";
import { PortfolioForm } from "@/features/portfolio/components/portfolio-form";
import { ProjectForm } from "@/features/portfolio/components/project-form";
import { PublishButton } from "@/features/portfolio/components/publish-button";
import { SkillsEditor } from "@/features/portfolio/components/skills-editor";
import { SocialLinksEditor } from "@/features/portfolio/components/social-links-editor";
import { EditReferencesSection } from "@/features/vouches/components/edit-references-section";

export function EditStepContent({ step }: { step: EditStepValue }) {
  switch (step) {
    case "basic":
      return <PortfolioForm />;
    case "experience":
      return <ExperienceForm />;
    case "education":
      return <EducationForm />;
    case "skills":
      return <SkillsEditor />;
    case "projects":
      return <ProjectForm />;
    case "achievements":
      return <AchievementForm />;
    case "custom":
      return <CustomSectionEditor />;
    case "social":
      return <SocialLinksEditor />;
    case "references":
      return <EditReferencesSection />;
    case "publish":
      return (
        <div className={EDIT_FORM_STACK_CLASS}>
          <OpenToWorkToggle />
          <PublishButton />
        </div>
      );
    default: {
      const _exhaustive: never = step;
      return _exhaustive;
    }
  }
}

export { EDIT_STEPS };
