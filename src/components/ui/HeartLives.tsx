/*
  This file is part of Wikingo
  <https://github.com/aresthebellator/HackathonMessina2026-WebApp>.
  Copyright (c) 2026 aresthebellator (exertia group).

  SPDX-License-Identifier: MIT
  Licensed under the MIT License. See the LICENSE file in the project root
  for the full license text.
*/

import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartLivesProps {
  lives: number;
}

export const HeartLives: React.FC<HeartLivesProps> = ({ lives }) => {
  return (
    <div className="flex items-center gap-1.5 font-extrabold text-[#FF4B4B] bg-[#FFF1F2] px-3 py-1.5 rounded-2xl border-2 border-[#FFDFE0]">
      <motion.div
        key={lives}
        animate={{ scale: [1, 1.35, 1] }}
        transition={{ duration: 0.3 }}
      >
        <Heart className="w-5 h-5 fill-[#FF4B4B] text-[#FF4B4B]" />
      </motion.div>
      <span className="text-sm tracking-wide">{lives}</span>
    </div>
  );
};
