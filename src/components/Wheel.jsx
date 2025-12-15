import { useWheelSpin } from '../hooks/useWheelSpin';
import { useImperativeHandle, forwardRef } from 'react';

const Wheel = forwardRef(function Wheel({ items, title, onSpinComplete }, ref) {
  const { rotation, isSpinning, selectedItem, spin, reset } = useWheelSpin(items, onSpinComplete);

  useImperativeHandle(ref, () => ({
    spin,
    reset,
    isSpinning,
  }));

  const segmentAngle = 360 / items.length;

  const getSegmentColor = (index, item) => {
    if (item.color) return item.color;
    const hue = (index * 360) / items.length;
    return `hsl(${hue}, 60%, 40%)`;
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">{title}</h3>
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-diablo-orange" />

        <svg
          className="w-56 h-56"
          viewBox="-150 -150 300 300"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          <defs>
            <filter id={`shadow-${title}`}>
              <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>

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
                strokeWidth="1"
                opacity="0.9"
              />
            );
          })}

          {/* Center */}
          <circle r="18" fill="#0f0f17" stroke="#2a2a3a" strokeWidth="2" />
          <circle r="6" fill="#ff6b35" />

          {/* Labels */}
          {items.map((item, index) => {
            const angle = index * segmentAngle + segmentAngle / 2 - 90;
            const rad = (angle * Math.PI) / 180;
            const textRadius = 85;
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
                fontSize={items.length > 10 ? "7" : items.length > 6 ? "8" : "10"}
                fontWeight="500"
                filter={`url(#shadow-${title})`}
                transform={`rotate(${textRotation}, ${x}, ${y})`}
              >
                {item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name}
              </text>
            );
          })}
        </svg>
      </div>

      {selectedItem && !isSpinning && (
        <div className="mt-4 text-center">
          <span className="text-white font-medium text-sm">{selectedItem.name}</span>
        </div>
      )}
    </div>
  );
});

export default Wheel;
