import { useWheelSpin } from '../hooks/useWheelSpin';
import { useImperativeHandle, forwardRef } from 'react';

const Wheel = forwardRef(function Wheel({ items, title, onSpinComplete, onTick, locked }, ref) {
  const { rotation, isSpinning, selectedItem, spin, reset } = useWheelSpin(items, onSpinComplete, onTick);

  useImperativeHandle(ref, () => ({
    spin,
    reset,
    isSpinning,
  }));

  // Handle empty items
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{title}</h3>
        <div className="w-80 h-80 lg:w-96 lg:h-96 flex items-center justify-center bg-[#1a1a24] rounded-full border-2 border-gray-700">
          <span className="text-gray-500 text-center px-8">No {title.toLowerCase()}s match current filters</span>
        </div>
        <div className="mt-4 h-12 flex items-center justify-center">
          <div className="text-gray-600 text-sm">Adjust filters to see options</div>
        </div>
      </div>
    );
  }

  const segmentAngle = 360 / items.length;

  const getSegmentColor = (index, item) => {
    if (item.color) return item.color;
    const hue = (index * 360) / items.length;
    return `hsl(${hue}, 60%, 40%)`;
  };

  // Calculate font size based on number of items
  const getFontSize = () => {
    if (items.length > 20) return "9";
    if (items.length > 15) return "10";
    if (items.length > 10) return "11";
    if (items.length > 6) return "12";
    return "14";
  };

  // Truncate name based on available space
  const truncateName = (name) => {
    const maxLen = items.length > 15 ? 10 : items.length > 10 ? 12 : 16;
    if (name.length > maxLen) {
      return name.substring(0, maxLen - 2) + '…';
    }
    return name;
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{title}</h3>
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-diablo-orange drop-shadow-lg" />

        <svg
          className="w-80 h-80 lg:w-96 lg:h-96"
          viewBox="-150 -150 300 300"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          <defs>
            <filter id={`shadow-${title}`}>
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#000" floodOpacity="0.8" />
            </filter>
            <filter id={`glow-${title}`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer ring */}
          <circle r="148" fill="none" stroke="#ff6b35" strokeWidth="3" opacity="0.3" />

          {/* Background */}
          <circle r="145" fill="#0f0f17" stroke="#2a2a3a" strokeWidth="2" />

          {/* Segments */}
          {items.map((item, index) => {
            const startAngle = index * segmentAngle - 90;
            const endAngle = startAngle + segmentAngle;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const radius = 140;

            const x1 = Math.cos(startRad) * radius;
            const y1 = Math.sin(startRad) * radius;
            const x2 = Math.cos(endRad) * radius;
            const y2 = Math.sin(endRad) * radius;

            const largeArc = segmentAngle > 180 ? 1 : 0;
            const pathD = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            return (
              <path
                key={item.id}
                d={pathD}
                fill={getSegmentColor(index, item)}
                stroke="#0f0f17"
                strokeWidth="1.5"
                opacity="0.95"
              />
            );
          })}

          {/* Center circle */}
          <circle r="22" fill="#0f0f17" stroke="#2a2a3a" strokeWidth="2" />
          <circle r="8" fill="#ff6b35" filter={`url(#glow-${title})`} />

          {/* Labels */}
          {items.map((item, index) => {
            const angle = index * segmentAngle + segmentAngle / 2 - 90;
            const rad = (angle * Math.PI) / 180;
            const textRadius = items.length > 15 ? 90 : 85;
            const x = Math.cos(rad) * textRadius;
            const y = Math.sin(rad) * textRadius;

            let textRotation = angle;
            if (angle > 0 && angle < 180) {
              textRotation += 180;
            }

            return (
              <text
                key={`text-${item.id}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={getFontSize()}
                fontWeight="600"
                filter={`url(#shadow-${title})`}
                transform={`rotate(${textRotation}, ${x}, ${y})`}
                style={{ textShadow: '0 0 4px rgba(0,0,0,0.9)' }}
              >
                {truncateName(item.name)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Selected item display */}
      <div className="mt-4 h-12 flex items-center justify-center">
        {selectedItem && !isSpinning ? (
          <div className="bg-gradient-to-r from-diablo-orange/20 to-diablo-gold/20 border border-diablo-orange/30 rounded-lg px-4 py-2">
            <span className="text-white font-semibold text-lg">{selectedItem.name}</span>
          </div>
        ) : (
          <div className="text-gray-600 text-sm">
            {isSpinning ? 'Spinning...' : 'Spin to select'}
          </div>
        )}
      </div>
    </div>
  );
});

export default Wheel;
