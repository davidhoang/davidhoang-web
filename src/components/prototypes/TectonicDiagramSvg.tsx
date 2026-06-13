import type { ActiveStage, DiagramPhase } from './tectonic-motion';
import {
  foothillsOrigin,
  peakOrigins,
  peakScale,
  plateHover,
  plateSettled,
  subductDeep,
  subductHover,
  subductSettled,
  PLATE_ORIGIN,
  SUBDUCT_ORIGIN,
  PEAK_REST,
  tectonicSpring,
  rangeSpring,
} from './tectonic-motion';
import { motion } from 'framer-motion';

interface Props {
  activeStage: ActiveStage;
  phase: DiagramPhase;
  reducedMotion: boolean;
  onStageEnter: (stage: 1 | 2 | 3) => void;
  onStageLeave: () => void;
}

export default function TectonicDiagramSvg({
  activeStage,
  phase,
  reducedMotion,
  onStageEnter,
  onStageLeave,
}: Props) {
  const isIntroAnimating = phase === 'intro' && !reducedMotion;
  const tectonicTransition = reducedMotion ? { duration: 0 } : tectonicSpring;
  const rangeTransition = reducedMotion ? { duration: 0 } : rangeSpring;

  const subductAmbient = {
    rotate: [subductSettled.rotate, subductDeep.rotate],
    x: [subductSettled.x, subductDeep.x],
    y: [subductSettled.y, subductDeep.y],
  };

  const subductAnimate = isIntroAnimating
    ? subductSettled
    : activeStage === 1
      ? subductHover
      : reducedMotion
        ? subductSettled
        : subductAmbient;

  const subductTransition = isIntroAnimating
    ? { duration: 4.2, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] }
    : activeStage === 1
      ? tectonicTransition
      : reducedMotion
        ? { duration: 0 }
        : { duration: 22, repeat: Infinity, ease: 'linear' as const, repeatType: 'loop' as const };

  return (
    <svg className="cross-section" viewBox="0 0 1200 660" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4dbc8" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#f1e9d8" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="subPlate" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c89456" stopOpacity="0.75" />
          <stop offset="60%" stopColor="#a8442a" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#5a2818" stopOpacity="0.85" />
        </linearGradient>

        <linearGradient id="overPlate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7aa5ab" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#2d5d63" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#1a3d42" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="overSurface" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a8c4c8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#5a8a90" stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id="mantleG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b5d4a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2a2218" stopOpacity="0.85" />
        </linearGradient>

        <linearGradient id="peakG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a857" stopOpacity="1" />
          <stop offset="100%" stopColor="#8a6628" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="peakG2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c49a4a" stopOpacity="1" />
          <stop offset="100%" stopColor="#7a5a22" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="peakG3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8893d" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#6e5420" stopOpacity="0.85" />
        </linearGradient>

        <linearGradient id="rangeShelfG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#7aa5ab" stopOpacity="0.95" />
          <stop offset="22%" stopColor="#8aacb0" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#9a7530" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#b8893d" stopOpacity="0.88" />
        </linearGradient>

        <radialGradient id="melt" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#d4632a" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#a8442a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#a8442a" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="meltPool" cx="0.45" cy="0.55" r="0.55">
          <stop offset="0%" stopColor="#e87a3a" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#c44e28" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#5a2818" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="lavaFluid" cx="0.38" cy="0.42" r="0.65">
          <stop offset="0%" stopColor="#ffe2a8" stopOpacity="1" />
          <stop offset="22%" stopColor="#ff9a45" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#ef5a28" stopOpacity="0.82" />
          <stop offset="78%" stopColor="#b83218" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#5a1810" stopOpacity="0" />
        </radialGradient>

        <filter id="lavaSoft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="lavaBloom" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="bloom" />
          <feMerge>
            <feMergeNode in="bloom" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="1200" height="140" fill="url(#skyG)" />

      <g className="stage-one-zone">
        <motion.g
          className="subducting-body"
          pointerEvents="none"
          initial={isIntroAnimating ? { rotate: 0, x: 0, y: 0 } : undefined}
          animate={subductAnimate}
          transition={subductTransition}
          style={{ transformOrigin: SUBDUCT_ORIGIN }}
        >
          <g className="subducting-plate">
            <path
              d="
              M 0 280
              L 0 420
              L 280 425
              L 440 440
              L 580 480
              L 680 540
              L 740 600
              L 770 640
              L 820 640
              L 800 580
              L 740 510
              L 660 450
              L 540 410
              L 380 385
              L 200 375
              L 0 372
              L 0 280 Z"
              fill="url(#subPlate)"
              stroke="#1a1410"
              strokeWidth="1.5"
            />

            <path
              d="
              M 0 280
              L 200 282
              L 380 290
              L 540 310
              L 660 350
              L 740 410
              L 800 480
              L 820 540
              L 800 580
              L 740 510
              L 660 450
              L 540 410
              L 380 385
              L 200 375
              L 0 372 Z"
              fill="#c89456"
              fillOpacity="0.2"
            />

            <path className="subducting-strata" d="M 0 320 L 200 322 L 380 332 L 540 360 L 660 405 L 740 470" fill="none" stroke="#5a2818" strokeWidth="0.8" opacity="0.5" strokeDasharray="4 6" />
            <path className="subducting-strata subducting-strata--delay" d="M 0 350 L 200 350 L 380 358 L 540 388 L 660 432 L 740 500" fill="none" stroke="#5a2818" strokeWidth="0.8" opacity="0.5" strokeDasharray="4 6" />
            <path className="subducting-strata subducting-strata--limb" d="M 560 455 L 640 515 L 720 575 L 780 620" fill="none" stroke="#5a2818" strokeWidth="0.8" opacity="0.45" strokeDasharray="4 6" />
            <path className="subducting-downdip" d="M 420 360 L 500 410 L 580 470 L 660 530 L 720 580" fill="none" stroke="#f1e9d8" strokeWidth="1" opacity="0.42" strokeDasharray="4 8" />
            <path className="subducting-downdip subducting-downdip--delay" d="M 460 395 L 540 445 L 620 505 L 690 555" fill="none" stroke="#f1e9d8" strokeWidth="0.85" opacity="0.3" strokeDasharray="4 8" />
            <path className="subducting-downdip subducting-downdip--deep" d="M 500 430 L 580 490 L 660 550 L 730 600" fill="none" stroke="#d4632a" strokeWidth="0.75" opacity="0.28" strokeDasharray="3 10" />
          </g>
        </motion.g>

        <g className="subducting-annotations" pointerEvents="none">
          <g className="subducting-label-row subducting-label-row--1">
            <text x="42" y="318" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="1.5" fill="#3a2a20" opacity="0.82">
              STAFFING RESOURCES
            </text>
            <line x1="46" y1="316" x2="168" y2="332" stroke="#5a2818" strokeWidth="0.7" opacity="0.45" strokeDasharray="2 3" />
            <circle cx="168" cy="332" r="2" fill="#5a2818" opacity="0.55" />
          </g>
          <g className="subducting-label-row subducting-label-row--2">
            <text x="42" y="354" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="1.5" fill="#3a2a20" opacity="0.68">
              LAGGING WAYS OF WORK
            </text>
            <line x1="46" y1="352" x2="328" y2="368" stroke="#5a2818" strokeWidth="0.7" opacity="0.4" strokeDasharray="2 3" />
            <circle cx="328" cy="368" r="2" fill="#5a2818" opacity="0.5" />
          </g>
          <g className="subducting-label-row subducting-label-row--3">
            <text x="42" y="392" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="1.5" fill="#3a2a20" opacity="0.55">
              PREVIOUS ERA PLAYBOOKS
            </text>
            <line x1="46" y1="390" x2="508" y2="422" stroke="#5a2818" strokeWidth="0.7" opacity="0.35" strokeDasharray="2 3" />
            <circle cx="508" cy="422" r="2" fill="#5a2818" opacity="0.45" />
          </g>
        </g>

        <g className="subducting-callout" pointerEvents="none">
          <line x1="120" y1="365" x2="120" y2="250" stroke="#1a1410" strokeWidth="0.8" strokeDasharray="2 3" />
          <circle cx="120" cy="365" r="3" fill="#1a1410" />
          <text x="120" y="240" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontWeight="500" fontSize="20" fill="#1a1410">
            Stage I · Initial Uplift
          </text>
          <text x="120" y="220" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2" fill="#a8442a">
            — HOVER TO COMPRESS —
          </text>
        </g>

        <rect
          className="stage-one-hit"
          x="0"
          y="190"
          width="580"
          height="380"
          fill="transparent"
          pointerEvents="all"
          tabIndex={0}
          role="button"
          aria-label="Stage I initial uplift"
          aria-describedby="friction-stage-1"
          onMouseEnter={() => onStageEnter(1)}
          onMouseLeave={onStageLeave}
          onFocus={() => onStageEnter(1)}
          onBlur={onStageLeave}
        />
      </g>

      <g className="subducting-sink" aria-hidden="true">
        <circle className="sink-particle" cx="500" cy="390" r="2.5" fill="#c89456" />
        <circle className="sink-particle sink-particle--2" cx="560" cy="420" r="2" fill="#a8442a" />
        <circle className="sink-particle sink-particle--3" cx="620" cy="455" r="2.5" fill="#c89456" />
        <circle className="sink-particle sink-particle--4" cx="680" cy="495" r="2" fill="#8a3d28" />
        <circle className="sink-particle sink-particle--5" cx="430" cy="365" r="2" fill="#a8442a" />
      </g>

      <g className="stage-two-zone">
        <motion.g
          className="stage-two-plate"
          pointerEvents="none"
          initial={isIntroAnimating ? { x: 0, y: 0, rotate: 0 } : undefined}
          animate={isIntroAnimating ? plateSettled : activeStage === 2 ? plateHover : plateSettled}
          transition={isIntroAnimating ? { delay: 3.8, duration: 5 } : tectonicTransition}
          style={{ transformOrigin: PLATE_ORIGIN }}
        >
          <path
            className="override-plate"
            d="
                M 1200 235
                L 1200 480
                L 700 480
                L 620 470
                L 560 450
                L 500 420
                L 470 380
                L 460 340
                L 470 290
                L 490 250
                L 530 220
                L 600 200
                L 700 195
                L 850 205
                L 1000 215
                L 1200 235 Z"
            fill="url(#overPlate)"
            stroke="#1a1410"
            strokeWidth="1.5"
          />

          <path
            className="override-surface"
            d="
                M 1200 235
                L 1000 215
                L 850 205
                L 700 195
                L 600 200
                L 530 220
                L 490 250
                L 530 235
                L 600 215
                L 700 210
                L 850 218
                L 1000 230
                L 1200 250 Z"
            fill="url(#overSurface)"
          />

          <g className="stage-three-anchor" pointerEvents="none">
            <path
              className="range-shadow"
              d="M 332 278 L 468 293 L 490 253 L 530 238 L 600 218 L 700 213 L 850 221"
              fill="none"
              stroke="#1a3d42"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.18"
            />
            <motion.path
              className="range-shelf"
              d="
                  M 332 278
                  L 398 268
                  L 470 290
                  L 490 250
                  L 530 235
                  L 600 215
                  L 700 210
                  L 850 218
                  L 842 218
                  L 842 200
                  L 850 200
                  L 700 192
                  L 600 197
                  L 530 217
                  L 490 232
                  L 470 268
                  L 398 250
                  L 332 260
                  Z"
              fill="url(#rangeShelfG)"
              stroke="#1a1410"
              strokeWidth="1.1"
              initial={isIntroAnimating ? { scaleY: 0, opacity: 0 } : undefined}
              animate={isIntroAnimating ? { scaleY: 1, opacity: 1 } : { scaleY: 1, opacity: 1 }}
              transition={isIntroAnimating ? { delay: 8.2, duration: 1.8 } : rangeTransition}
              style={{ transformOrigin: foothillsOrigin }}
            />
            <path className="range-contact" d="M 332 278 L 470 290 L 490 250 L 530 235 L 600 215 L 700 210 L 850 218" fill="none" stroke="#1a1410" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          <path className="override-strata override-strata--lip" d="M 458 318 L 488 292 L 520 268 L 558 248 L 600 228" fill="none" stroke="#a8c4c8" strokeWidth="0.9" opacity="0.55" strokeDasharray="4 6" />
          <path className="override-strata" d="M 458 318 L 490 250 L 530 235 L 600 215 L 700 210 L 850 218 L 1000 230 L 1200 250" fill="none" stroke="#1a3d42" strokeWidth="0.8" opacity="0.4" strokeDasharray="4 6" />
          <path className="override-strata override-strata--delay" d="M 470 290 L 530 285 L 600 275 L 700 270 L 850 280 L 1000 290 L 1200 305" fill="none" stroke="#1a3d42" strokeWidth="0.8" opacity="0.4" strokeDasharray="4 6" />
          <path className="override-strata" d="M 460 340 L 600 335 L 850 340 L 1000 348 L 1200 360" fill="none" stroke="#1a3d42" strokeWidth="0.8" opacity="0.4" strokeDasharray="4 6" />
          <path className="override-strata override-strata--delay" d="M 470 400 L 600 400 L 850 405 L 1000 410 L 1200 420" fill="none" stroke="#1a3d42" strokeWidth="0.8" opacity="0.4" strokeDasharray="4 6" />

          <motion.path
            className="thrust-front"
            d="
                M 460 340
                L 470 380
                L 500 420
                L 560 450
                L 620 470
                L 700 480"
            fill="none"
            stroke="#1a1410"
            strokeWidth="2.5"
            animate={{ strokeWidth: activeStage === 2 ? 3 : 2.5 }}
            transition={tectonicTransition}
          />

          <text className="override-label" x="900" y="280" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="1.5" fill="#f1e9d8" opacity="0.95">
            HUMAN TEAMS + AI ORCHESTRATION
          </text>
          <text className="override-label" x="900" y="335" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="1.5" fill="#f1e9d8" opacity="0.8">
            PORTFOLIO OF INITIATIVES
          </text>
          <text className="override-label" x="900" y="390" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="1.5" fill="#f1e9d8" opacity="0.65">
            PRACTICE · PLATFORM · PRODUCT
          </text>
          <text className="override-label" x="900" y="445" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="1.5" fill="#f1e9d8" opacity="0.5">
            PUBLIC PRACTICE
          </text>
        </motion.g>

        <motion.g
          className="stage-two-arrow"
          pointerEvents="none"
          initial={isIntroAnimating ? { x: 0, y: 0, rotate: 0 } : undefined}
          animate={isIntroAnimating ? plateSettled : activeStage === 2 ? plateHover : plateSettled}
          transition={isIntroAnimating ? { delay: 3.8, duration: 5 } : tectonicTransition}
          style={{ transformOrigin: PLATE_ORIGIN }}
        >
          <g transform="translate(880, 380)">
            <line className="overriding-arrow__shaft" x1="80" y1="0" x2="0" y2="0" stroke="#f1e9d8" strokeWidth="2" />
            <polygon points="0,0 12,-6 12,6" fill="#f1e9d8" />
            <text x="40" y="-12" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#f1e9d8" letterSpacing="1.5" fontWeight="600">
              OVERRIDING
            </text>
          </g>
        </motion.g>

        <g className="stage-two-callout" pointerEvents="none">
          <line x1="930" y1="225" x2="930" y2="160" stroke="#f1e9d8" strokeWidth="0.8" strokeDasharray="2 3" />
          <circle cx="930" cy="225" r="3" fill="#f1e9d8" />
          <text x="930" y="148" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontWeight="500" fontSize="20" fill="#1a1410">
            Stage II · Sustained Thrust
          </text>
          <text x="930" y="128" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2" fill="#2d5d63">
            — HOVER TO THRUST —
          </text>
        </g>

        <rect
          className="stage-two-hit"
          x="620"
          y="120"
          width="580"
          height="360"
          fill="transparent"
          pointerEvents="all"
          tabIndex={0}
          role="button"
          aria-label="Stage II sustained thrust"
          aria-describedby="friction-stage-2"
          onMouseEnter={() => onStageEnter(2)}
          onMouseLeave={onStageLeave}
          onFocus={() => onStageEnter(2)}
          onBlur={onStageLeave}
        />
      </g>

      <g className="stage-three-zone">
        <g className="stage-three-range" pointerEvents="none">
          <motion.path
            className="range-foothills"
            d="
                M 352 254
                L 400 244
                L 500 230
                L 620 220
                L 740 210
                L 828 204
                L 836 218
                L 740 224
                L 620 234
                L 500 242
                L 400 252
                L 352 262
                Z"
            fill="#b8893d"
            fillOpacity="0.35"
            stroke="#1a1410"
            strokeWidth="0.8"
            initial={isIntroAnimating ? { scaleY: 0, opacity: 0 } : undefined}
            animate={isIntroAnimating ? { scaleY: 1, opacity: 1 } : { scaleY: activeStage === 3 ? 1.03 : 1, opacity: 1 }}
            transition={isIntroAnimating ? { delay: 8.2, duration: 1.8 } : rangeTransition}
            style={{ transformOrigin: foothillsOrigin }}
          />

          <motion.path
            className="range-surface-rim"
            d="M 332 278 L 470 290 L 490 250 L 530 235 L 600 215 L 700 210 L 850 218"
            fill="none"
            stroke="#c8dce0"
            strokeWidth="2.2"
            strokeLinecap="round"
            animate={{ opacity: activeStage === 3 ? 0.35 : 0.55 }}
            transition={rangeTransition}
          />

          <motion.g
            className="range-peak range-peak--1"
            initial={isIntroAnimating ? { scaleY: 0, opacity: 0 } : undefined}
            animate={isIntroAnimating ? { scaleY: PEAK_REST, opacity: 1 } : { scaleY: peakScale(activeStage, '1'), opacity: 1 }}
            transition={isIntroAnimating ? { delay: 8.2, duration: 1.8 } : rangeTransition}
            style={{ transformOrigin: peakOrigins['1'] }}
          >
            <path d="M 352 262 L 348 236 L 354 206 L 368 178 L 382 206 L 388 236 L 384 262 Z" fill="url(#peakG3)" stroke="#1a1410" strokeWidth="1.2" />
            <path d="M 368 178 L 378 202 L 374 224 L 364 242 Z" fill="#d4b06a" fillOpacity="0.55" />
          </motion.g>

          <motion.g
            className="range-peak range-peak--2"
            initial={isIntroAnimating ? { scaleY: 0, opacity: 0 } : undefined}
            animate={isIntroAnimating ? { scaleY: PEAK_REST, opacity: 1 } : { scaleY: peakScale(activeStage, '2'), opacity: 1 }}
            transition={isIntroAnimating ? { delay: 8.2, duration: 1.8 } : rangeTransition}
            style={{ transformOrigin: peakOrigins['2'] }}
          >
            <path
              d="M 428 252 L 442 218 L 458 168 L 478 118 L 498 84 L 520 70 L 542 84 L 562 118 L 582 168 L 598 218 L 612 252 L 582 252 L 542 248 L 502 250 L 462 252 L 428 252 Z"
              fill="url(#peakG)"
              stroke="#1a1410"
              strokeWidth="1.5"
            />
            <path d="M 478 118 L 498 84 L 520 70 L 542 84 L 528 112 L 512 148 L 496 178 L 476 168 Z" fill="#e8c47a" fillOpacity="0.7" />
            <path d="M 442 218 L 458 168 L 478 118 L 498 84 L 520 70 L 542 84 L 562 118 L 582 168" fill="none" stroke="#1a1410" strokeWidth="1.2" />
            <path d="M 498 84 L 520 70 L 542 84 L 528 98 L 514 94 L 504 98 Z" fill="#f1e9d8" fillOpacity="0.85" />
          </motion.g>

          <motion.g
            className="range-peak range-peak--3"
            initial={isIntroAnimating ? { scaleY: 0, opacity: 0 } : undefined}
            animate={isIntroAnimating ? { scaleY: PEAK_REST, opacity: 1 } : { scaleY: peakScale(activeStage, '3'), opacity: 1 }}
            transition={isIntroAnimating ? { delay: 8.2, duration: 1.8 } : rangeTransition}
            style={{ transformOrigin: peakOrigins['3'] }}
          >
            <path d="M 588 238 L 582 206 L 596 172 L 620 146 L 644 172 L 658 206 L 652 238 Z" fill="url(#peakG2)" stroke="#1a1410" strokeWidth="1.2" />
            <path d="M 620 146 L 630 172 L 626 202 L 612 226 Z" fill="#d4b06a" fillOpacity="0.6" />
            <path d="M 610 162 L 620 146 L 630 162 L 622 174 Z" fill="#f1e9d8" fillOpacity="0.7" />
          </motion.g>

          <motion.g
            className="range-peak range-peak--4"
            initial={isIntroAnimating ? { scaleY: 0, opacity: 0 } : undefined}
            animate={isIntroAnimating ? { scaleY: PEAK_REST, opacity: 1 } : { scaleY: peakScale(activeStage, '4'), opacity: 1 }}
            transition={isIntroAnimating ? { delay: 8.2, duration: 1.8 } : rangeTransition}
            style={{ transformOrigin: peakOrigins['4'] }}
          >
            <path d="M 742 228 L 736 210 L 748 194 L 772 182 L 796 194 L 804 210 L 798 228 Z" fill="url(#peakG3)" stroke="#1a1410" strokeWidth="1.1" />
            <path d="M 772 182 L 780 198 L 776 214 L 764 224 Z" fill="#c9a050" fillOpacity="0.5" />
          </motion.g>

          <g className="range-sparkles" aria-hidden="true">
            <circle className="range-sparkle range-sparkle--1" cx="372" cy="186" r="1.1" fill="#f1e9d8" />
            <circle className="range-sparkle range-sparkle--2" cx="385" cy="208" r="0.8" fill="#e8c47a" />
            <circle className="range-sparkle range-sparkle--3" cx="498" cy="78" r="1.2" fill="#f1e9d8" />
            <circle className="range-sparkle range-sparkle--4" cx="538" cy="92" r="0.9" fill="#e8c47a" />
            <circle className="range-sparkle range-sparkle--5" cx="518" cy="118" r="0.7" fill="#f1e9d8" />
            <circle className="range-sparkle range-sparkle--6" cx="622" cy="152" r="1" fill="#f1e9d8" />
            <circle className="range-sparkle range-sparkle--7" cx="776" cy="192" r="0.8" fill="#e8c47a" />
            <path className="range-fragment range-fragment--1" d="M 404 256 L 412 250 L 408 259 Z" fill="#d4a857" />
            <path className="range-fragment range-fragment--2" d="M 448 252 L 456 246 L 452 255 Z" fill="#c9a050" />
            <path className="range-fragment range-fragment--3" d="M 556 244 L 564 238 L 560 247 Z" fill="#d4a857" />
            <path className="range-fragment range-fragment--4" d="M 612 232 L 620 226 L 616 235 Z" fill="#b8893d" />
            <path className="range-fragment range-fragment--5" d="M 728 218 L 736 212 L 732 221 Z" fill="#c9a050" />
          </g>
        </g>

        <g className="stage-three-callout" pointerEvents="none">
          <line x1="580" y1="58" x2="580" y2="22" stroke="#1a1410" strokeWidth="0.8" strokeDasharray="2 3" />
          <text x="580" y="16" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontWeight="600" fontSize="22" fill="#1a1410">
            Stage III · New Mountain Range
          </text>
        </g>

        <rect
          className="stage-three-hit"
          x="300"
          y="0"
          width="580"
          height="340"
          fill="transparent"
          pointerEvents="all"
          tabIndex={0}
          role="button"
          aria-label="Reveal Stage III mountain range"
          aria-describedby="friction-stage-3"
          onMouseEnter={() => onStageEnter(3)}
          onMouseLeave={onStageLeave}
          onFocus={() => onStageEnter(3)}
          onBlur={onStageLeave}
        />
      </g>

      <path
        d="
          M 0 420
          L 0 660
          L 1200 660
          L 1200 480
          L 700 480
          L 740 600
          L 820 640
          L 820 640
          L 1200 640
          L 1200 660
          L 0 660 Z"
        fill="url(#mantleG)"
        stroke="#1a1410"
        strokeWidth="1.5"
      />

      <path
        d="
          M 0 420
          L 280 425
          L 440 440
          L 580 480
          L 680 540
          L 740 600
          L 820 640
          L 1200 640
          L 1200 480
          L 700 480
          L 620 470
          L 560 450
          L 500 420
          L 470 380
          L 460 340
          L 460 340
          L 0 340 Z"
        fill="url(#mantleG)"
        opacity="0.3"
      />

      <g opacity="0.4">
        <path d="M 150 580 Q 250 540 350 580" fill="none" stroke="#2a2218" strokeWidth="0.8" />
        <path d="M 900 580 Q 1000 540 1100 580" fill="none" stroke="#2a2218" strokeWidth="0.8" />
        <path d="M 300 620 Q 400 600 500 620" fill="none" stroke="#2a2218" strokeWidth="0.8" />
      </g>

      <g className="subducting-melt" transform="rotate(36 702 568)">
        <g className="melt-fluid" filter="url(#lavaSoft)">
          <path
            className="melt-pool"
            d="
                M 586 552
                C 618 564, 662 584, 708 606
                C 742 622, 766 636, 754 642
                C 728 628, 684 602, 642 580
                C 612 564, 592 554, 586 552
                Z"
            fill="url(#lavaFluid)"
            opacity="0.78"
          />
          <ellipse className="melt-blob melt-blob--base" cx="698" cy="584" rx="88" ry="32" fill="#ef5a28" opacity="0.55" />
          <ellipse className="melt-blob melt-blob--core" cx="712" cy="576" rx="52" ry="20" fill="#ff9a45" opacity="0.82" />
          <ellipse className="melt-blob melt-blob--hot" cx="724" cy="568" rx="28" ry="12" fill="#ffe2a8" opacity="0.9" />
          <ellipse className="melt-blob melt-blob--wing" cx="662" cy="560" rx="46" ry="20" fill="#d94a22" opacity="0.5" />
        </g>

        <g className="melt-ripples" filter="url(#lavaBloom)" opacity="0.65">
          <path className="melt-ripple" d="M 608 558 Q 655 578 702 598 Q 738 612 762 624" fill="none" stroke="#ffd080" strokeWidth="2" opacity="0.5" />
          <path className="melt-ripple melt-ripple--delay" d="M 622 568 Q 668 586 712 604 Q 742 616 752 622" fill="none" stroke="#ffae66" strokeWidth="1.4" opacity="0.35" />
        </g>

        <ellipse className="melt-glow melt-glow--primary" cx="702" cy="574" rx="98" ry="34" fill="url(#melt)" opacity="0.55" filter="url(#lavaBloom)" />
        <ellipse className="melt-glow melt-glow--secondary" cx="668" cy="548" rx="62" ry="24" fill="url(#melt)" opacity="0.35" filter="url(#lavaBloom)" />

        <circle className="melt-bubble" cx="694" cy="578" r="4" fill="#ffc04d" opacity="0.75" />
        <circle className="melt-bubble melt-bubble--2" cx="718" cy="562" r="3" fill="#ff8c42" opacity="0.65" />
        <circle className="melt-bubble melt-bubble--3" cx="672" cy="568" r="2.5" fill="#ffe2a8" opacity="0.7" />
        <circle className="melt-bubble melt-bubble--4" cx="706" cy="548" r="2" fill="#ffc04d" opacity="0.55" />
        <circle className="magma-rise" cx="688" cy="552" r="3" fill="#ffb347" opacity="0.85" />
        <circle className="magma-rise magma-rise--delay-1" cx="662" cy="532" r="2.5" fill="#ff8c42" opacity="0.75" />
        <circle className="magma-rise magma-rise--delay-2" cx="714" cy="524" r="2" fill="#ffc04d" opacity="0.65" />
      </g>

      <g className="subducting-arrow">
        <g transform="translate(640, 480)">
          <line className="subducting-arrow__shaft" x1="0" y1="0" x2="35" y2="60" stroke="#1a1410" strokeWidth="1.5" />
          <polygon className="subducting-arrow__head" points="35,60 22,55 30,42" fill="#1a1410" />
          <text x="-20" y="40" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#1a1410" letterSpacing="1.5" fontWeight="600">
            SUBDUCTING
          </text>
        </g>
      </g>

      <g className="melt-zone-label" pointerEvents="none">
        <line x1="752" y1="602" x2="958" y2="638" stroke="#1a1410" strokeWidth="0.8" strokeDasharray="2 3" />
        <circle cx="752" cy="602" r="2.5" fill="#d4632a" />
        <rect x="963" y="626" width="180" height="24" fill="#f1e9d8" stroke="#1a1410" strokeWidth="1" />
        <text x="1053" y="641" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2" fill="#1a1410">
          MELT ZONE · RESIST · IRRELEVANCE
        </text>
      </g>

      <g fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#3a4654" letterSpacing="1">
        <line x1="20" y1="195" x2="14" y2="195" stroke="#3a4654" strokeWidth="0.8" />
        <text x="10" y="198" textAnchor="end">
          0
        </text>
        <line x1="20" y1="340" x2="14" y2="340" stroke="#3a4654" strokeWidth="0.8" />
        <text x="10" y="343" textAnchor="end">
          5y
        </text>
        <line x1="20" y1="480" x2="14" y2="480" stroke="#3a4654" strokeWidth="0.8" />
        <text x="10" y="483" textAnchor="end">
          10y
        </text>
        <line x1="20" y1="600" x2="14" y2="600" stroke="#3a4654" strokeWidth="0.8" />
        <text x="10" y="603" textAnchor="end">
          20y
        </text>
        <line x1="20" y1="195" x2="20" y2="630" stroke="#3a4654" strokeWidth="0.6" />
      </g>
      <text x="14" y="640" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#3a4654" letterSpacing="2" transform="rotate(-90, 14, 640)" textAnchor="end">
        DEPTH · CAREER STRATA
      </text>
    </svg>
  );
}
