import { useState } from 'react';
import { ChatBox } from './components/ChatBox';
import { VisualCanvas } from './components/VisualCanvas';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { MessageSquare, Zap } from 'lucide-react';
import { Button } from './components/ui/button';

export default function App() {
  const [currentVisualType, setCurrentVisualType] = useState<'PROJECTILE' | null>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const handleVisualizationRequest = (type: string) => {
    if (type === 'PROJECTILE') {
      setCurrentVisualType('PROJECTILE');
      setIsCanvasOpen(true); // 自动打开画布
    }
  };

  const handleToggleCanvas = () => {
    setIsCanvasOpen(!isCanvasOpen);
  };

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <PanelGroup direction="horizontal">
        {/* Left Panel - ChatBox */}
        {isChatOpen && (
          <>
            <Panel 
              defaultSize={isCanvasOpen ? 30 : 95} 
              minSize={20}
              maxSize={isCanvasOpen ? 50 : 95}
            >
              <ChatBox 
                onVisualizationRequest={handleVisualizationRequest}
                onToggleCanvas={handleToggleCanvas}
                isCanvasOpen={isCanvasOpen}
                onClose={() => setIsChatOpen(false)}
              />
            </Panel>

            {/* Resize Handle */}
            {isCanvasOpen && (
              <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-blue-400 transition-colors relative group">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors" />
              </PanelResizeHandle>
            )}
          </>
        )}

        {/* Right Panel - VisualCanvas */}
        {isCanvasOpen && (
          <Panel defaultSize={isChatOpen ? 70 : 95} minSize={30}>
            <VisualCanvas 
              visualType={currentVisualType} 
              onClose={() => setIsCanvasOpen(false)}
              onToggleChat={handleToggleChat}
              isChatOpen={isChatOpen}
            />
          </Panel>
        )}
      </PanelGroup>

      {/* Floating Button - Open Chat */}
      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed top-6 left-6 z-50 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          打开对话框
        </Button>
      )}

      {/* Floating Button - Open Canvas */}
      {!isCanvasOpen && (
        <Button
          onClick={() => setIsCanvasOpen(true)}
          className="fixed top-6 right-6 z-50 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg"
        >
          <Zap className="w-5 h-5 mr-2" />
          打开画布
        </Button>
      )}
    </div>
  );
}