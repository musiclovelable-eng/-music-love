"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Light {
  id: number;
  x: number;
  color: string;
  delay: number;
  swingOffset: number;
}

export function ChristmasGarland() {
  const [lights, setLights] = useState<Light[]>([]);

  useEffect(() => {
    // Монохромные лампочки с разной яркостью
    const colors = ["#FFFFFF", "#D4D4D4", "#A3A3A3", "#737373"];

    const generatedLights: Light[] = [];
    const lightCount = 25; // количество лампочек

    for (let i = 0; i < lightCount; i++) {
      generatedLights.push({
        id: i,
        x: (i / (lightCount - 1)) * 100, // равномерное распределение
        color: colors[i % colors.length],
        delay: Math.random() * 2,
        swingOffset: Math.random() * 10 - 5, // случайное смещение для покачивания
      });
    }

    setLights(generatedLights);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-32 pointer-events-none z-50 overflow-hidden">
      {/* Провод гирлянды */}
      <svg
        className="absolute top-0 w-full h-24"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M 0,8 Q 12.5,12 25,8 T 50,8 T 75,8 T 100,8"
          stroke="rgba(100, 100, 100, 0.3)"
          strokeWidth="0.3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </svg>

      {/* Лампочки */}
      {lights.map((light) => (
        <motion.div
          key={light.id}
          className="absolute"
          style={{
            left: `${light.x}%`,
            top: "2rem",
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
            delay: light.delay,
            ease: "easeOut",
          }}
        >
          {/* Провод от лампочки */}
          <motion.div
            className="w-0.5 bg-gray-600/30 mx-auto"
            style={{ height: "12px" }}
            animate={{
              rotate: [0, light.swingOffset, 0, -light.swingOffset, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Лампочка */}
          <motion.div
            className="relative"
            animate={{
              x: [0, light.swingOffset * 0.5, 0, -light.swingOffset * 0.5, 0],
              rotate: [0, light.swingOffset * 0.3, 0, -light.swingOffset * 0.3, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Свечение */}
            <motion.div
              className="absolute -inset-2 rounded-full blur-md"
              style={{
                backgroundColor: light.color,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                delay: light.delay,
                ease: "easeInOut",
              }}
            />

            {/* Основная лампочка */}
            <motion.div
              className="relative w-3 h-4 rounded-full"
              style={{
                backgroundColor: light.color,
                boxShadow: `0 0 10px ${light.color}, 0 0 20px ${light.color}40`,
              }}
              animate={{
                opacity: [0.7, 1, 0.7],
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{
                duration: 1 + Math.random() * 0.5,
                repeat: Infinity,
                delay: light.delay,
                ease: "easeInOut",
              }}
            >
              {/* Блик на лампочке */}
              <div
                className="absolute top-0.5 left-0.5 w-1 h-1 bg-white/60 rounded-full"
                style={{
                  boxShadow: "0 0 2px rgba(255, 255, 255, 0.8)",
                }}
              />
            </motion.div>

            {/* Цоколь */}
            <div className="w-2 h-1 bg-gradient-to-b from-gray-400 to-gray-600 mx-auto rounded-sm" />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
