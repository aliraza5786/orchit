import { type DirectiveBinding, type ObjectDirective } from 'vue';
import { computePosition, offset, shift, arrow, flip, autoUpdate } from '@floating-ui/dom';

// Create a single tooltip element to be reused
let tooltipEl: HTMLElement | null = null;
let arrowEl: HTMLElement | null = null;
let cleanupLoop: (() => void) | null = null;
let timeoutId: any = null;

const createTooltip = () => {
  if (tooltipEl) return;
  
  tooltipEl = document.createElement('div');
  tooltipEl.id = 'global-tooltip';
  
  // Apply critical styles inline to ensure visibility regardless of Tailwind
  Object.assign(tooltipEl.style, {
    position: 'fixed',
    zIndex: '9999',
    opacity: '0',
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none',
    backgroundColor: '#7D68C8', // Dark gray
    color: '#ffffff',
    fontSize: '12px',
    lineHeight: '1.4',
    fontWeight: '500',
    padding: '6px 12px',
    borderRadius: '6px',
    maxWidth: '300px',
    wordWrap: 'break-word',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  });

  arrowEl = document.createElement('div');
  Object.assign(arrowEl.style, {
    position: 'absolute',
    width: '8px',
    height: '8px',
    transform: 'rotate(45deg)',
    backgroundColor: '#7D68C8'
  });
  
  tooltipEl.appendChild(arrowEl);
  document.body.appendChild(tooltipEl);
};

const updateTooltipContent = (content: string) => {
  if (!tooltipEl || !arrowEl) return;
  // Clear only text nodes but keep arrow
  const arrow = tooltipEl.firstElementChild;
  tooltipEl.textContent = content;
  if (arrow) tooltipEl.appendChild(arrow);
};

const showTooltip = (el: HTMLElement, content: string) => {
  if (!tooltipEl || !arrowEl) createTooltip(); // Double check logic
  if (!tooltipEl || !arrowEl) return; 
  
  // Clear any pending hide
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  
  updateTooltipContent(content);
  tooltipEl.style.opacity = '1';
  
  cleanupLoop = autoUpdate(el, tooltipEl, () => {
    if (!tooltipEl || !arrowEl) return;
    
    computePosition(el, tooltipEl, {
      placement: 'top',
      middleware: [
        offset(8),
        flip(),
        shift({ padding: 5 }),
        arrow({ element: arrowEl }),
      ],
    }).then(({ x, y, placement, middlewareData }) => {
      Object.assign(tooltipEl!.style, {
        left: `${x}px`,
        top: `${y}px`,
      });

      const { x: arrowX, y: arrowY } = middlewareData.arrow!;
      
      const staticSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[placement.split('-')[0]]!;
      
      Object.assign(arrowEl!.style, {
        left: arrowX != null ? `${arrowX}px` : '',
        top: arrowY != null ? `${arrowY}px` : '',
        right: '',
        bottom: '',
        [staticSide]: '-4px', 
      });
    });
  });
};

const hideTooltip = () => {
  if (cleanupLoop) {
    cleanupLoop();
    cleanupLoop = null;
  }
  
  timeoutId = setTimeout(() => {
    if (tooltipEl) {
      tooltipEl.style.opacity = '0';
    }
  }, 100);
};

export const vTooltip: ObjectDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    createTooltip();
    
    el.addEventListener('mouseenter', () => {
      if (binding.value) showTooltip(el, binding.value);
    });
    
    el.addEventListener('mouseleave', () => {
      hideTooltip();
    });
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    if (binding.value !== binding.oldValue) {
      updateTooltipContent(binding.value);
    }
  },
  unmounted(el: HTMLElement) {
    hideTooltip();
  }
};

export default vTooltip;



