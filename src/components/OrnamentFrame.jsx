export default function OrnamentFrame({ children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <div className="gold-corner gold-corner-tl" />
      <div className="gold-corner gold-corner-tr" />
      <div className="gold-corner gold-corner-bl" />
      <div className="gold-corner gold-corner-br" />
      {children}
    </div>
  );
}
