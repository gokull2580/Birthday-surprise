/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
}

export default function DynamicIcon({ name, className }: DynamicIconProps) {
  // Fetch components from lucide-react dynamically or fallback to Heart icon
  const IconComponent = (Icons as any)[name] || Icons.Heart;
  return <IconComponent className={className} />;
}
