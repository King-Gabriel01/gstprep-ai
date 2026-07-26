import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { Card, Badge, Button } from "../components/ui.jsx";

export default function ResultsReview() {
  const { id } = useParams();
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-sm text-slatex">No result to show.</p>
        <Link to={`/student/courses/${id}`} className="mt-4 inline-block">
          <Button>Back to course</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Card className="p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slatex">Your score</p>
        <p className="mt-2 font-display text-5xl font-bold text-moss">{result.percentage}%</p>
        <p className="mt-1 text-sm text-slatex">
          {result.score} of {result.totalQuestions} correct
        </p>
      </Card>

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Review</h2>
      <div className="mt-4 space-y-4">
        {result.review.map((item, idx) => (
          <Card key={item.questionId} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-ink">
                {idx + 1}. {item.questionText}
              </p>
              <Badge tone={item.isCorrect ? "approved" : "rejected"}>
                {item.isCorrect ? "Correct" : "Incorrect"}
              </Badge>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {item.options.map((opt, i) => {
                const isCorrectOpt = i === item.correctIndex;
                const isSelected = i === item.selectedIndex;
                let style = "border-ink/10 text-slatex";
                if (isCorrectOpt) style = "border-moss bg-moss/10 text-moss font-semibold";
                else if (isSelected && !isCorrectOpt)
                  style = "border-errorred bg-errorred/10 text-errorred";
                return (
                  <li key={i} className={`rounded-sm border px-3 py-1.5 ${style}`}>
                    {String.fromCharCode(65 + i)}. {opt}
                    {isSelected && <span className="ml-2 text-xs">(your answer)</span>}
                  </li>
                );
              })}
            </ul>
            {item.explanation && (
              <p className="mt-3 text-xs italic text-slatex">{item.explanation}</p>
            )}
          </Card>
        ))}
      </div>

      <Link to={`/student/courses/${id}`} className="mt-8 block">
        <Button className="w-full">Back to course</Button>
      </Link>
    </div>
  );
}
