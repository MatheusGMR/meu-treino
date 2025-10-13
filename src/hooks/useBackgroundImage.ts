import { useState, useEffect } from 'react';
import heroFitness1 from '@/assets/hero-fitness-1.jpg';
import heroFitness2 from '@/assets/hero-fitness-2.jpg';
import heroFitness3 from '@/assets/hero-fitness-3.jpg';
import heroFitness4 from '@/assets/hero-fitness-4.jpg';
import heroFitness5 from '@/assets/hero-fitness-5.jpg';
import heroFitness6 from '@/assets/hero-fitness-6.jpg';

const images = [
  heroFitness1,
  heroFitness2,
  heroFitness3,
  heroFitness4,
  heroFitness5,
  heroFitness6,
];

const getImageByTime = () => {
  const hour = new Date().getHours();
  
  if (hour >= 0 && hour < 4) return images[0];   // 00:00-03:59
  if (hour >= 4 && hour < 8) return images[1];   // 04:00-07:59
  if (hour >= 8 && hour < 12) return images[2];  // 08:00-11:59
  if (hour >= 12 && hour < 16) return images[3]; // 12:00-15:59
  if (hour >= 16 && hour < 20) return images[4]; // 16:00-19:59
  return images[5]; // 20:00-23:59
};

export const useBackgroundImage = () => {
  const [currentImage, setCurrentImage] = useState(getImageByTime);

  useEffect(() => {
    // Pre-load all images
    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    // Update image every hour
    const interval = setInterval(() => {
      setCurrentImage(getImageByTime());
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  return currentImage;
};
