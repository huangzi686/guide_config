
import React, { useRef, useState, useEffect } from 'react';
import { NodeData, Connection, BranchType, TargetType, AIQuestionType, NodeType } from '../types';
import { GripHorizontal, PlayCircle, StopCircle, Split, MessageSquare } from 'lucide-react';

interface CanvasProps {
  nodes: NodeData[];
  connections: Connection[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onMoveNode: (id: string, position: { x: number; y: number }) => void;
  onConnect: (sourceNodeId: string, sourceBranchId: string, targetNodeId: string) => void;
  onDeleteConnection: (connectionId: string) => void;
}

const TargetTypeLabel = {
  [TargetType.SCRM]: 'SCRM活动',
  [TargetType.PMS]: 'PMS标签',
  [TargetType.CHAT]: '聊天信息',
};

// Helper to calculate handle positions
const NODE_WIDTH = 280;
const NODE_WIDTH_SMALL = 140;

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onConnect,
  onDeleteConnection,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Canvas Transform State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Connection creation state
  const [connectingSource, setConnectingSource] = useState<{ nodeId: string; branchId: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // --- Keyboard Listeners for Spacebar ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Coordinate Transformation Helper ---
  // Converts screen (mouse) coordinates to canvas (node) coordinates
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / scale,
      y: (clientY - rect.top - pan.y) / scale
    };
  };

  // --- Event Handlers ---

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey || true) { // Always zoom on wheel for this requirement
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 5);
      
      // Zoom towards mouse pointer logic could be added here, 
      // but for simplicity we'll just zoom based on center or current view.
      // A simple implementation of centering zoom on mouse is complex without careful math.
      // We will stick to simple scaling for now or a centered approach.
      // To improve, we can adjust pan to keep mouse pos stable.
      
      // Simple zoom:
      setScale(newScale);
    }
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else {
      onSelectNode('');
    }
  };

  const handleMouseDownNode = (e: React.MouseEvent, node: NodeData) => {
    if (isSpacePressed) return; // Allow panning even if clicking on a node if space is held
    e.stopPropagation();
    onSelectNode(node.id);
    setDraggingNodeId(node.id);
    
    // Calculate offset based on canvas coordinates
    const canvasCoords = getCanvasCoordinates(e.clientX, e.clientY);
    setDragOffset({
      x: canvasCoords.x - node.position.x,
      y: canvasCoords.y - node.position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && isSpacePressed) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    const canvasCoords = getCanvasCoordinates(e.clientX, e.clientY);

    if (draggingNodeId) {
      onMoveNode(draggingNodeId, {
        x: canvasCoords.x - dragOffset.x,
        y: canvasCoords.y - dragOffset.y,
      });
    }

    if (connectingSource) {
      setMousePos({
        x: canvasCoords.x,
        y: canvasCoords.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setConnectingSource(null);
    setIsPanning(false);
  };

  const startConnection = (e: React.MouseEvent, nodeId: string, branchId: string) => {
    if (isSpacePressed) return;
    e.stopPropagation();
    const canvasCoords = getCanvasCoordinates(e.clientX, e.clientY);
    setConnectingSource({ nodeId, branchId, x: canvasCoords.x, y: canvasCoords.y });
    setMousePos({ x: canvasCoords.x, y: canvasCoords.y });
  };

  const completeConnection = (e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (connectingSource && connectingSource.nodeId !== targetNodeId) {
      onConnect(connectingSource.nodeId, connectingSource.branchId, targetNodeId);
    }
    setConnectingSource(null);
  };

  const getPath = (x1: number, y1: number, x2: number, y2: number) => {
    const controlPointX1 = x1 + Math.abs(x2 - x1) * 0.5;
    const controlPointX2 = x2 - Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${controlPointX1} ${y1} ${controlPointX2} ${y2} ${x2} ${y2}`;
  };

  // Helper: Get Port Positions
  const getNodeInputPos = (node: NodeData) => {
    const width = (node.type === NodeType.START || node.type === NodeType.END) ? NODE_WIDTH_SMALL : NODE_WIDTH;
    return {
      x: node.position.x,
      y: node.position.y + 40 // Generalized input y
    };
  };

  const getNodeOutputPos = (node: NodeData, branchId: string) => {
    const branchIndex = node.branches.findIndex(b => b.id === branchId);
    let yOffset = 0;
    let xOffset = 0;

    if (node.type === NodeType.START) {
      xOffset = NODE_WIDTH_SMALL;
      yOffset = 25; // Center
    } else if (node.type === NodeType.GUIDE) {
      xOffset = NODE_WIDTH;
      yOffset = 130 + (branchIndex * 32);
    } else if (node.type === NodeType.CONDITION) {
      xOffset = NODE_WIDTH;
      yOffset = 60 + (branchIndex * 36);
    }

    return {
      x: node.position.x + xOffset,
      y: node.position.y + yOffset
    };
  };

  return (
    <div 
      className={`flex-1 bg-canvas bg-dot-pattern relative overflow-hidden select-none ${isSpacePressed ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="absolute origin-top-left transition-transform duration-75 ease-out"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
      >
        <svg className="overflow-visible pointer-events-none z-0 absolute top-0 left-0" style={{ width: 1, height: 1 }}>
          {connections.map(conn => {
            const sourceNode = nodes.find(n => n.id === conn.sourceNodeId);
            const targetNode = nodes.find(n => n.id === conn.targetNodeId);
            if (!sourceNode || !targetNode) return null;

            const start = getNodeOutputPos(sourceNode, conn.sourceBranchId);
            const end = getNodeInputPos(targetNode);

            return (
              <g key={conn.id} className="pointer-events-auto cursor-pointer group" onClick={() => onDeleteConnection(conn.id)}>
                <path
                  d={getPath(start.x, start.y, end.x, end.y)}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  fill="none"
                  className="group-hover:stroke-red-400 transition-colors"
                />
                <circle cx={(start.x + end.x)/2} cy={(start.y + end.y)/2} r="4" fill="#94a3b8" className="group-hover:fill-red-400"/>
              </g>
            );
          })}
          {connectingSource && (
            <path
              d={getPath(connectingSource.x, connectingSource.y, mousePos.x, mousePos.y)}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
            />
          )}
        </svg>

        {nodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          
          // --- Render Start / End Nodes ---
          if (node.type === NodeType.START || node.type === NodeType.END) {
            const isStart = node.type === NodeType.START;
            return (
              <div
                key={node.id}
                style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)`, width: NODE_WIDTH_SMALL }}
                className={`absolute z-10 flex items-center justify-between p-3 rounded-full shadow-md border-2 transition-shadow bg-white
                  ${isSelected 
                    ? (isStart ? 'border-green-500 shadow-xl' : 'border-red-500 shadow-xl') 
                    : 'border-gray-200'}
                `}
                onMouseDown={(e) => handleMouseDownNode(e, node)}
              >
                {!isStart && (
                  <div 
                    className="w-4 h-4 bg-white border-2 border-red-500 rounded-full flex items-center justify-center cursor-crosshair -ml-5"
                    onMouseUp={(e) => completeConnection(e, node.id)}
                  >
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 w-full justify-center">
                   {isStart ? <PlayCircle size={18} className="text-green-600"/> : <StopCircle size={18} className="text-red-600"/>}
                   {node.title}
                </div>

                {isStart && node.branches.map(b => (
                   <div
                     key={b.id}
                     className="w-4 h-4 bg-white border-2 border-green-500 rounded-full flex items-center justify-center cursor-crosshair -mr-5"
                     onMouseDown={(e) => startConnection(e, node.id, b.id)}
                   >
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                   </div>
                ))}
              </div>
            );
          }

          // --- Render Condition Node ---
          if (node.type === NodeType.CONDITION) {
            return (
              <div
                key={node.id}
                style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)`, width: NODE_WIDTH }}
                className={`absolute z-10 flex flex-col bg-white rounded-lg shadow-md border-2 transition-shadow 
                  ${isSelected ? 'border-purple-500 shadow-xl' : 'border-gray-200 hover:border-purple-300'}
                `}
                onMouseDown={(e) => handleMouseDownNode(e, node)}
              >
                <div className="h-9 bg-purple-50 border-b border-purple-100 rounded-t-lg px-3 flex items-center justify-between cursor-move">
                  <div className="flex items-center gap-2">
                    <Split size={14} className="text-purple-600"/>
                    <span className="font-semibold text-gray-700 text-sm truncate">{node.title}</span>
                  </div>
                  <GripHorizontal size={16} className="text-purple-300" />
                </div>

                <div className="absolute -left-3 top-10 w-6 h-6 bg-white border-2 border-purple-500 rounded-full flex items-center justify-center cursor-crosshair"
                   onMouseUp={(e) => completeConnection(e, node.id)}
                >
                   <div className="w-2 h-2 bg-purple-500 rounded-full" />
                </div>

                <div className="p-2 space-y-2">
                   {node.branches.map((branch) => (
                     <div key={branch.id} className="flex items-center justify-end h-7 relative group">
                       <span className="text-xs mr-3 px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-100 truncate max-w-[200px]">
                         {branch.name}
                       </span>
                       <div
                         className="absolute -right-4 w-4 h-4 rounded-full border-2 border-purple-500 bg-white cursor-crosshair hover:scale-125 transition-transform"
                         onMouseDown={(e) => startConnection(e, node.id, branch.id)}
                       />
                     </div>
                   ))}
                </div>
              </div>
            );
          }

          // --- Render Guide Node ---
          return (
            <div
              key={node.id}
              style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)`, width: NODE_WIDTH }}
              className={`absolute z-10 flex flex-col bg-white rounded-lg shadow-md border-2 transition-shadow 
                ${isSelected ? 'border-blue-500 shadow-xl' : 'border-gray-200 hover:border-blue-300'}
              `}
              onMouseDown={(e) => handleMouseDownNode(e, node)}
            >
              <div className="h-10 bg-gray-50 border-b border-gray-100 rounded-t-lg px-3 flex items-center justify-between cursor-move">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-blue-600"/>
                  <span className="font-semibold text-gray-700 text-sm truncate">{node.title}</span>
                </div>
                <GripHorizontal size={16} className="text-gray-400" />
              </div>

              <div className="p-3 space-y-3">
                <div 
                  className="absolute -left-3 top-24 w-6 h-6 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center cursor-crosshair hover:scale-110 transition-transform"
                  onMouseUp={(e) => completeConnection(e, node.id)}
                >
                   <div className="w-2 h-2 bg-blue-500 rounded-full" />
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">目标类型:</span>
                    <span className="font-medium text-blue-600 bg-blue-50 px-1.5 rounded">{TargetTypeLabel[node.targetType || TargetType.SCRM]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">AI提问:</span>
                    <span className="text-gray-700 max-w-[150px] truncate" title={node.aiQuestionContent}>
                       {node.aiQuestionType === AIQuestionType.MATERIAL ? '[素材]' : node.aiQuestionContent}
                    </span>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-2 relative">
                  {node.branches.map((branch, idx) => {
                    const isDynamicTarget = node.targetType === TargetType.PMS || node.targetType === TargetType.CHAT;
                    // If PMS/Chat and Success Branch, show Intent if available, else Name
                    const showIntent = isDynamicTarget && branch.type === BranchType.SUCCESS;
                    const displayText = showIntent ? (branch.intent || branch.name) : branch.name;

                    return (
                      <div key={branch.id} className="flex items-center justify-end h-6 relative group">
                        <span 
                          className={`text-xs mr-3 px-1.5 py-0.5 rounded max-w-[180px] truncate ${
                            branch.type === BranchType.SUCCESS 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                          title={displayText}
                        >
                          {displayText}
                        </span>
                        <div
                          className={`absolute -right-4 w-4 h-4 rounded-full border-2 cursor-crosshair hover:scale-125 transition-transform bg-white ${
                             branch.type === BranchType.SUCCESS ? 'border-green-500' : 'border-yellow-500'
                          }`}
                          onMouseDown={(e) => startConnection(e, node.id, branch.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Zoom Controls Indicator (Optional visual aid) */}
      <div className="absolute bottom-4 left-4 bg-white/80 p-2 rounded shadow text-xs text-gray-500 pointer-events-none">
         按住空格键 + 拖动以平移 • 滚轮缩放
      </div>
    </div>
  );
};
