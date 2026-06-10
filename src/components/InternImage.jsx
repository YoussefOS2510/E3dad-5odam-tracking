import React, { useState, useEffect } from "react";

export default function InternImage({ internName, drivePhotoId, className = "", initialsClassName = "" }) {
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [imgSrc, setImgSrc] = useState("");

  const getInitials = (name) => {
    if (!name) return "ط";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name[0];
  };

  const nameClean = internName ? internName.trim() : "";

  // Sources hierarchy:
  // 1. Local /interns/Name/1.jpg
  // 2. Local /interns/Name/1.png
  // 3. Local /interns/Name/1.jpeg
  // 4. Local /interns/Name/1 (no extension check)
  // 5. Google Drive ID
  const sources = [
    `/interns/${encodeURIComponent(nameClean)}/1.jpg`,
    `/interns/${encodeURIComponent(nameClean)}/1.png`,
    `/interns/${encodeURIComponent(nameClean)}/1.jpeg`,
    `/interns/${encodeURIComponent(nameClean)}/1`,
    drivePhotoId ? `https://lh3.googleusercontent.com/d/${drivePhotoId}` : null
  ].filter(Boolean);

  useEffect(() => {
    setFallbackIndex(0);
    if (sources.length > 0) {
      setImgSrc(sources[0]);
    } else {
      setImgSrc("");
    }
  }, [internName, drivePhotoId]);

  const handleError = () => {
    const nextIndex = fallbackIndex + 1;
    if (nextIndex < sources.length) {
      setFallbackIndex(nextIndex);
      setImgSrc(sources[nextIndex]);
    } else {
      setImgSrc("fallback_avatar");
    }
  };

  if (imgSrc === "fallback_avatar" || sources.length === 0) {
    return (
      <div className={`w-full h-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-arabic font-bold uppercase tracking-wider ${initialsClassName}`}>
        {getInitials(internName)}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={internName}
      onError={handleError}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}
