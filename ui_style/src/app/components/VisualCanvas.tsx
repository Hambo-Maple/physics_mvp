import { useState } from 'react';
import { Play, RotateCcw, Zap, X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';

interface VisualCanvasProps {
  visualType?: 'PROJECTILE' | null;
  onClose?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export function VisualCanvas({ visualType, onClose, onToggleChat, isChatOpen = true }: VisualCanvasProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleReset = () => {
    setIsAnimating(false);
  };

  if (visualType === 'PROJECTILE') {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Status Bar */}
        <div className="p-5 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-10 h-10 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-gray-800">平抛运动演示</h3>
                <p className="text-xs text-gray-500">Projectile Motion Simulation</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="rounded-xl border-gray-200 hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-xl border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
              >
                <X className="w-4 h-4 mr-2" />
                关闭
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-4xl">
            {/* Physics Canvas Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-600 mb-2">物理演示画布</p>
                <p className="text-sm text-gray-400">点击开始按钮启动动画</p>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '初速度', value: '20 m/s', color: 'from-blue-100 to-cyan-100', textColor: 'text-blue-600' },
                { label: '重力加速度', value: '9.8 m/s²', color: 'from-purple-100 to-violet-100', textColor: 'text-purple-600' },
                { label: '初始高度', value: '10 m', color: 'from-pink-100 to-rose-100', textColor: 'text-pink-600' },
                { label: '抛射角度', value: '45°', color: 'from-amber-100 to-orange-100', textColor: 'text-amber-600' }
              ].map((param, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className={`bg-gradient-to-br ${param.color} w-8 h-8 rounded-lg flex items-center justify-center mb-3`}>
                    <span className={`text-xs ${param.textColor}`}>●</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{param.label}</p>
                  <p className="text-gray-800">{param.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setIsAnimating(!isAnimating)}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isAnimating ? '暂停动画' : '开始动画'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default View
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Status Bar */}
      <div className="p-5 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-gray-100 to-slate-100 w-10 h-10 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h3 className="text-gray-800">等待中</h3>
              <p className="text-xs text-gray-500">Waiting for visualization request</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          >
            <X className="w-4 h-4 mr-2" />
            关闭
          </Button>
        </div>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-gray-800 mb-2">可视化画布已准备就绪</h3>
            <p className="text-gray-500">在左侧聊天框中描述你想要的物理演示</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🎯', label: '平抛运动', color: 'from-blue-100 to-cyan-100' },
              { icon: '⬇️', label: '自由落体', color: 'from-purple-100 to-violet-100' },
              { icon: '🔄', label: '圆周运动', color: 'from-pink-100 to-rose-100' },
              { icon: '〰️', label: '简谐振动', color: 'from-amber-100 to-orange-100' }
            ].map((action, index) => (
              <button
                key={index}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-gray-200"
              >
                <div className={`bg-gradient-to-br ${action.color} w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <span className="text-xl">{action.icon}</span>
                </div>
                <p className="text-sm text-gray-600">{action.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="p-5 bg-white/80 backdrop-blur-sm border-t border-gray-100">
        <Button
          variant="outline"
          onClick={handleReset}
          className="rounded-xl border-gray-200 hover:bg-gray-50"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重置画布
        </Button>
      </div>
    </div>
  );
}