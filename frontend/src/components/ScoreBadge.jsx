export default function ScoreBadge({ score }) {
  let color = 'bg-clay/10 text-clay';
  if (score >= 70) color = 'bg-moss-100 text-moss-700';
  else if (score >= 50) color = 'bg-gold/15 text-gold';

  return <span className={`pill ${color} font-mono font-semibold`}>{score}%</span>;
}
