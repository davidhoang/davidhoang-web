import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import TectonicDiagramSvg from './TectonicDiagramSvg';
import {
  FRICTION_POPOVERS,
  INTRO_MS,
  LEGEND_ITEMS,
  popoverSpring,
  type ActiveStage,
  type DiagramPhase,
} from './tectonic-motion';

const POPOVER_POSITION: Record<1 | 2 | 3, string> = {
  1: 'stage-popover--rust',
  2: 'stage-popover--teal',
  3: 'stage-popover--gold',
};

function useMobilePopoverCenter() {
  const [centerGold, setCenterGold] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const update = () => setCenterGold(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return centerGold;
}

export default function TectonicCrossSection() {
  const reducedMotion = useReducedMotion();
  const centerGoldPopover = useMobilePopoverCenter();
  const [activeStage, setActiveStage] = useState<ActiveStage>(0);
  const [phase, setPhase] = useState<DiagramPhase>(reducedMotion ? 'settled' : 'intro');

  useEffect(() => {
    if (reducedMotion) {
      setPhase('settled');
      return;
    }

    const timer = window.setTimeout(() => setPhase('settled'), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  const onStageEnter = useCallback((stage: 1 | 2 | 3) => {
    setActiveStage(stage);
  }, []);

  const onStageLeave = useCallback(() => {
    setActiveStage(0);
  }, []);

  const wrapClass = ['diagram-wrap', phase === 'intro' ? 'diagram-epoch' : 'diagram-settled'].join(' ');

  return (
    <div
      className={wrapClass}
      data-active-stage={activeStage === 0 ? undefined : String(activeStage)}
    >
      <div className="legend">
        {LEGEND_ITEMS.map((item) => (
          <div
            key={item.stage}
            className={`legend-item ${item.tone}`}
            data-stage={item.stage}
          >
            <div className="key">
              <span className="swatch" style={{ background: item.swatch }} />
              {item.key}
            </div>
            <div className="body">
              {item.body} <em>{item.em}</em>
            </div>
          </div>
        ))}
      </div>

      <div className="diagram-canvas">
        <div className="stage-popovers" aria-live="polite">
          <AnimatePresence mode="wait">
            {FRICTION_POPOVERS.filter((p) => p.stage === activeStage).map((popover) => {
              const centerX = popover.stage === 3 && centerGoldPopover ? '-50%' : 0;

              return (
              <motion.div
                key={popover.stage}
                className={`stage-popover ${POPOVER_POSITION[popover.stage]}`}
                data-stage={popover.stage}
                id={`friction-stage-${popover.stage}`}
                role="tooltip"
                initial={{ opacity: 0, y: 8, x: centerX }}
                animate={{ opacity: 1, y: 0, x: centerX }}
                exit={{ opacity: 0, y: 6, x: centerX }}
                transition={reducedMotion ? { duration: 0.15 } : popoverSpring}
              >
                <div className="stage-popover__tag">{popover.tag}</div>
                <div className="stage-popover__num">{popover.num}</div>
                <div className="stage-popover__title">{popover.title}</div>
                <div className="stage-popover__desc">{popover.desc}</div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <TectonicDiagramSvg
          activeStage={activeStage}
          phase={phase}
          reducedMotion={!!reducedMotion}
          onStageEnter={onStageEnter}
          onStageLeave={onStageLeave}
        />
      </div>
    </div>
  );
}
