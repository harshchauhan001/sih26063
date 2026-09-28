"use client";

import { useState } from "react";

type Question = { question: string; options: string[]; answerIndex: number };

export default function QuizPlayer({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.reduce<number>((acc, a, i) => (a === questions[i].answerIndex ? acc + 1 : acc), 0);

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-medium text-slate-900">
            {qi + 1}. {q.question}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              const showCorrect = submitted && oi === q.answerIndex;
              const showWrong = submitted && selected && oi !== q.answerIndex;
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={submitted}
                  onClick={() => {
                    const next = [...answers];
                    next[qi] = oi;
                    setAnswers(next);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    showCorrect
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                      : showWrong
                        ? "border-red-400 bg-red-50 text-red-800"
                        : selected
                          ? "border-cyan-500 bg-cyan-50 text-cyan-800"
                          : "border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={answers.some((a) => a === null)}
          className="rounded-full bg-cyan-700 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-cyan-800"
        >
          Submit Quiz
        </button>
      ) : (
        <div className="rounded-2xl bg-slate-900 p-5 text-white">
          <p className="text-lg font-semibold">
            You scored {score} / {questions.length}
          </p>
          <button
            onClick={() => {
              setAnswers(questions.map(() => null));
              setSubmitted(false);
            }}
            className="mt-2 text-sm font-medium text-cyan-300 hover:text-cyan-100"
          >
            Retake quiz
          </button>
        </div>
      )}
    </div>
  );
}
