export default function ScoreBadge({ score }) {
  let color = 'bg-clay/10 text-clay border border-clay/20';
  if (score >= 70) color = 'bg-moss-500/10 text-moss-400 border border-moss-500/25';
  else if (score >= 50) color = 'bg-gold/10 text-gold border border-gold/25';

  return <span className={`pill ${color} font-mono font-semibold transition-colors duration-200`}>{score}%</span>;
}
