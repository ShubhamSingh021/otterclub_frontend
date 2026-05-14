import { useEffect, useState } from "react";

const CMSImage = ({
  src,
  fallbackSrc = "",
  alt,
  className = "",
  wrapperClassName = "",
  fallbackClassName = "",
}) => {
  const [activeSrc, setActiveSrc] = useState(src || fallbackSrc || "");
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    setActiveSrc(src || fallbackSrc || "");
    setUsedFallback(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!usedFallback && fallbackSrc && activeSrc !== fallbackSrc) {
      setActiveSrc(fallbackSrc);
      setUsedFallback(true);
      return;
    }
    setActiveSrc("");
  };

  if (!activeSrc) {
    return (
      <div
        className={`bg-gradient-to-br from-[#142947] to-[#0c1d35] ${wrapperClassName} ${fallbackClassName}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={wrapperClassName}>
      <img alt={alt} className={className} src={activeSrc} onError={handleError} />
    </div>
  );
};

export default CMSImage;
