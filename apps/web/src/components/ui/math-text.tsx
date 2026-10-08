import * as React from "react";
import katex from "katex";
import { cn } from "@/lib/utils";

export interface MathTextProps {
  content?: string;
  children?: string;
  className?: string;
  as?: React.ElementType;
}

interface Segment {
  type: "text" | "inline-math" | "display-math";
  value: string;
}

function parseMathSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Matches $$...$$ (display) or $...$ (inline, without newlines)
  const mathRegex = /\$\$([\s\S]+?)\$\$|\$([^\$\n]+?)\$/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore) {
      segments.push({ type: "text", value: textBefore });
    }

    if (match[1] !== undefined) {
      // Display math ($$...$$)
      segments.push({ type: "display-math", value: match[1].trim() });
    } else if (match[2] !== undefined) {
      // Inline math ($...$)
      segments.push({ type: "inline-math", value: match[2].trim() });
    }

    lastIndex = match.index + match[0].length;
  }

  const textAfter = text.slice(lastIndex);
  if (textAfter) {
    segments.push({ type: "text", value: textAfter });
  }

  return segments;
}

/**
 * MathText renders ordinary strings containing inline $...$ or display $$...$$
 * equations using KaTeX server-side.
 */
export function MathText({
  content,
  children,
  className,
  as: Component = "span",
}: MathTextProps) {
  const rawText = content ?? (typeof children === "string" ? children : "");
  if (!rawText) return null;

  const segments = parseMathSegments(rawText);

  return (
    <Component className={cn("inline-block", className)}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <React.Fragment key={index}>{segment.value}</React.Fragment>;
        }

        const isDisplay = segment.type === "display-math";
        try {
          const renderedHtml = katex.renderToString(segment.value, {
            displayMode: isDisplay,
            throwOnError: false,
          });

          return (
            <span
              key={index}
              className={isDisplay ? "block my-2 text-center overflow-x-auto" : "inline-block px-0.5"}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          );
        } catch {
          // Fallback if KaTeX fails
          return (
            <span key={index} className="text-danger font-mono text-small">
              {segment.value}
            </span>
          );
        }
      })}
    </Component>
  );
}
