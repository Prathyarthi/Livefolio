import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DocCallout } from "@/features/docs/components/doc-callout";
import { DocInlineText } from "@/features/docs/components/doc-inline-text";
import { DocScreenshot } from "@/features/docs/components/doc-screenshot";
import { DocSteps } from "@/features/docs/components/doc-steps";
import type { DocBlock } from "@/features/docs/types";

export function DocBlocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <div className="text-body text-text-secondary">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={index} className="my-4">
                <DocInlineText text={block.text} />
              </p>
            );
          case "heading":
            return (
              <h2
                key={index}
                className="mt-10 mb-3 text-h4 text-text-primary"
              >
                {block.text}
              </h2>
            );
          case "list":
            return (
              <ul key={index} className="my-4 list-disc space-y-2 pl-5">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <DocInlineText text={item} />
                  </li>
                ))}
              </ul>
            );
          case "steps":
            return <DocSteps key={index} steps={block.steps} />;
          case "callout":
            return (
              <DocCallout
                key={index}
                variant={block.variant}
                title={block.title}
                text={block.text}
              />
            );
          case "screenshot":
            return <DocScreenshot key={index} screenshot={block.screenshot} />;
          case "faq":
            return (
              <Accordion key={index} type="single" collapsible className="my-6">
                {block.items.map((item, itemIndex) => (
                  <AccordionItem key={itemIndex} value={`faq-${itemIndex}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent className="text-text-secondary">
                      <DocInlineText text={item.answer} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
