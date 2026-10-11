import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask Quick2Learn AI Tutor | Classes 9–12 CBSE & ICSE",
  description:
    "Chat with Quick2Learn's AI academic assistant for CBSE & ICSE Classes 9–12. Find video lectures by Dinesh Sir & Namita Ma'am, solve doubt queries, and explore Mathura classroom batches.",
};

export default function ChatPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center font-bold text-xl">
          Q
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          Quick2Learn AI Academic Assistant
        </h1>
        <p className="text-sm text-slate-600">
          Connecting to your 24/7 AI Tutor...
        </p>
      </div>
    </div>
  );
}
