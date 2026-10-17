import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask Quick2Learn AI Tutor | Classes 9–12 CBSE & ICSE",
  description:
    "Chat with Quick2Learn's AI academic assistant for CBSE & ICSE Classes 9–12. Find video lectures by Dinesh Sir & Namita Ma'am, solve doubt queries, and explore Mathura classroom batches.",
};

export default function ChatPage() {
  return (
    <div className="sr-only">
      <h1>Quick2Learn AI Academic Assistant</h1>
      <p>
        Connecting to your 24/7 AI Academic Tutor for CBSE &amp; ICSE Classes 9–12.
        Explore free video lectures, doubt solving, and classroom batches in Mathura.
      </p>
    </div>
  );
}

