import { useEffect, useState } from "react";

export const AnimatedCheckmark = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <svg
      className="w-14 h-14"
      viewBox="0 0 52 52"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="stroke-success fill-none"
        cx="26"
        cy="26"
        r="25"
        strokeWidth="4"
        style={{
          strokeDasharray: 166,
          strokeDashoffset: isVisible ? 0 : 166,
          transition: "stroke-dashoffset 0.6s ease-in-out"
        }}
      />
      <path
        className="stroke-success fill-none"
        d="M14.1 27.2l7.1 7.2 16.7-16.8"
        strokeWidth="4"
        strokeLinecap="round"
        style={{
          strokeDasharray: 48,
          strokeDashoffset: isVisible ? 0 : 48,
          transition: "stroke-dashoffset 0.6s ease-in-out 0.3s"
        }}
      />
    </svg>
  );
};
