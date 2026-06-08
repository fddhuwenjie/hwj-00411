import React, { useRef, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

export const MoveHistory: React.FC = () => {
  const { moves } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: i / 2 + 1,
      white: moves[i]?.notation || '',
      black: moves[i + 1]?.notation || '',
    });
  }

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-slate-700 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-amber-400 mb-3 flex items-center gap-2">
        <ScrollText className="w-5 h-5" />
        走法记录
      </h3>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
      >
        {moves.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">
            暂无走法记录
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-800">
              <tr className="text-slate-500 text-xs">
                <th className="text-left py-1 px-2 w-12">#</th>
                <th className="text-left py-1 px-2 text-amber-200">白方</th>
                <th className="text-left py-1 px-2 text-slate-300">黑方</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair, i) => (
                <tr 
                  key={i} 
                  className={`border-b border-slate-700/50 ${
                    i === pairs.length - 1 ? 'bg-slate-700/30' : ''
                  }`}
                >
                  <td className="py-1.5 px-2 text-slate-500 font-mono">
                    {pair.number}.
                  </td>
                  <td className="py-1.5 px-2 text-amber-100 font-mono">
                    {pair.white}
                  </td>
                  <td className="py-1.5 px-2 text-slate-300 font-mono">
                    {pair.black}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700 text-xs text-slate-500">
        共 {moves.length} 步
      </div>
    </div>
  );
};
