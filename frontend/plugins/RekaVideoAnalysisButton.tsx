import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { RekaVideoAnalysis } from './RekaVideoAnalysis';

interface RekaVideoAnalysisButtonProps {
  /** Text to display on the button */
  label?: string;
  /** Additional className for styling */
  className?: string;
}

/**
 * Reusable Reka AI Video Analysis Button
 * 
 * This component provides a button that opens the Reka AI video analysis modal.
 * Can be placed anywhere in the UI where video analysis is needed.
 * 
 * @example
 * // Simple usage
 * <RekaVideoAnalysisButton />
 * 
 * @example
 * // With custom label
 * <RekaVideoAnalysisButton label="Analyze with AI" />
 * 
 * @example
 * // With custom styling
 * <RekaVideoAnalysisButton 
 *   label="Run Analysis" 
 *   className="custom-class" 
 * />
 */
export const RekaVideoAnalysisButton = ({ 
  label = "Try Reka AI",
  className = ""
}: RekaVideoAnalysisButtonProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`px-6 py-3 bg-white border-4 font-bold text-lg transition-all hover:scale-105 flex items-center gap-2 ${className}`}
        style={{ borderColor: theme.primary, color: theme.primary }}
      >
        <Zap className="w-5 h-5" />
        {label}
      </button>

      {isOpen && (
        <RekaVideoAnalysis onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};
