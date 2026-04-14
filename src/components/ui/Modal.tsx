import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  preventOutsideClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  preventOutsideClick = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Focus trap and restore
  useEffect(() => {
    if (!isOpen) return;
    
    const previouslyFocused = document.activeElement as HTMLElement;

    // Small delay to let Framer Motion mount the DOM
    const setupFocus = () => {
      if (!modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else { // Tab
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      window.addEventListener('keydown', handleTabKey);
      firstElement.focus();

      return () => {
        window.removeEventListener('keydown', handleTabKey);
      };
    };

    const timer = window.setTimeout(setupFocus, 100);

    return () => {
      window.clearTimeout(timer);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !preventOutsideClick && onClose()}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Panel */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            className={cn(
              "relative bg-background border border-border shadow-xl rounded-xl w-full max-w-md overflow-hidden flex flex-col",
              className
            )}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex flex-col space-y-1.5 p-6 pb-4">
                <div className="flex items-start justify-between">
                  {title && (
                    <h2 id="modal-title" className="text-xl font-semibold tracking-tight text-text-primary">
                      {title}
                    </h2>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full shrink-0 -mr-2 shadow-none" 
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </Button>
                </div>
                {description && (
                  <p className="text-sm text-text-secondary">{description}</p>
                )}
              </div>
            )}
            
            {/* Close button if no header */}
            {!title && !description && (
               <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-4 top-4 h-8 w-8 p-0 rounded-full z-10 shadow-none bg-background/50 backdrop-blur-md" 
                onClick={onClose}
                aria-label="Close modal"
               >
                 <X size={16} />
               </Button>
            )}

            {/* Content */}
            <div className="px-6 pb-6 pt-2">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Use document.body to render the modal at the top level to avoid z-index traps
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
