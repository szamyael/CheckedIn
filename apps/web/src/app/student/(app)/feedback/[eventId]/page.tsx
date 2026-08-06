"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLoader } from "@/components/LoaderProvider";
import { createClient } from "@/lib/supabase/client";

export default function EventFeedbackPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    showLoader("Sending feedback…");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const { error: insErr } = await supabase.from("event_feedback").insert({
        event_id: params.eventId,
        student_id: user.id,
        rating,
        comment: comment.trim() || null,
      });
      if (insErr) throw insErr;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback");
    } finally {
      hideLoader();
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-bold">Thanks for your feedback</h1>
        <button
          type="button"
          onClick={() => router.push("/student")}
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-bold">Event feedback</h1>
      <div>
        <label className="mb-2 block text-sm font-medium">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`h-10 w-10 rounded-full text-sm font-bold ${
                rating >= n
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Comment (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
      >
        Submit
      </button>
    </form>
  );
}
