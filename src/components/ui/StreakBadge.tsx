/*
  This file is part of Wikingo
  <https://github.com/aresthebellator/HackathonMessina2026-WebApp>.
  Copyright (c) 2026 aresthebellator (exertia group).

  SPDX-License-Identifier: MIT
  Licensed under the MIT License. See the LICENSE file in the project root
  for the full license text.
*/

import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakBadgeProps {
  streak: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak }) => {
  return (
    <div className="flex items-center gap-1.5 font-extrabold text-[#FF9600] bg-[#FFF7ED] px-3 py-1.5 rounded-2xl border-2 border-[#FED7AA]">
      <motion.div
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Flame className="w-5 h-5 fill-[#FF9600] text-[#FF9600]" />
      </motion.div>
      <span className="text-sm tracking-wide">{streak}</span>
    </div>
  );
};
