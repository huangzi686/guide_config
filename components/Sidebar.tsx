
import React from 'react';
import { Plus, GripVertical, Trash2, PlayCircle, StopCircle, Split, MessageSquare } from 'lucide-react';
import { NodeData, TargetType, NodeType } from '../types';

interface SidebarProps {
  nodes: NodeData[];
  selectedNodeId: string | null;
  onAddNode: (type: NodeType) => void;
  onSelectNode: (id: string) => void;
  onDeleteNode: (id: string) => void;
  onReorderNodes: (dragIndex: number, hoverIndex: number) => void;
}

const TargetTypeLabel = {
  [TargetType.SCRM]: 'SCRM活动',
  [TargetType.PMS]: 'PMS标签',
  [TargetType.CHAT]: '聊天信息',
};

const NodeIcon = {
  [NodeType.START]: PlayCircle,
  [NodeType.END]: StopCircle,
  [NodeType.CONDITION]: Split,
  [NodeType.GUIDE]: MessageSquare,
};

const NodeLabel = {
  [NodeType.START]: '开始',
  [NodeType.END]: '结束',
  [NodeType.CONDITION]: '判断',
  [NodeType.GUIDE]: '引导',
};

export const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  selectedNodeId,
  onAddNode,
  onSelectNode,
  onDeleteNode,
  onReorderNodes
}) => {
  const [draggedItemIndex, setDraggedItemIndex] = React.useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    onReorderNodes(draggedItemIndex, index);
    setDraggedItemIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-800 mb-1">流程编排</h1>
        <p className="text-xs text-gray-500">组件与阶段管理</p>
      </div>
      
      {/* Component Toolbox */}
      <div className="p-4 grid grid-cols-2 gap-3 border-b border-gray-100 bg-gray-50">
        <button
          onClick={() => onAddNode(NodeType.GUIDE)}
          className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 text-gray-600 py-3 rounded-lg transition-all shadow-sm"
        >
          <MessageSquare size={20} />
          <span className="text-xs font-medium">引导阶段</span>
        </button>
        <button
          onClick={() => onAddNode(NodeType.CONDITION)}
          className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 hover:border-purple-400 hover:text-purple-600 text-gray-600 py-3 rounded-lg transition-all shadow-sm"
        >
          <Split size={20} />
          <span className="text-xs font-medium">判断节点</span>
        </button>
        <button
          onClick={() => onAddNode(NodeType.START)}
          className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 hover:border-green-400 hover:text-green-600 text-gray-600 py-2 rounded-lg transition-all shadow-sm"
        >
          <PlayCircle size={18} />
          <span className="text-xs font-medium">开始</span>
        </button>
        <button
          onClick={() => onAddNode(NodeType.END)}
          className="flex flex-col items-center justify-center gap-1 bg-white border border-gray-200 hover:border-red-400 hover:text-red-600 text-gray-600 py-2 rounded-lg transition-all shadow-sm"
        >
          <StopCircle size={18} />
          <span className="text-xs font-medium">结束</span>
        </button>
      </div>

      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        流程节点列表
      </div>

      {/* Node List (Outline) */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {nodes.map((node, index) => {
          const Icon = NodeIcon[node.type];
          return (
            <div
              key={node.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectNode(node.id)}
              className={`
                group flex items-center gap-2 p-3 rounded-md cursor-pointer border transition-all
                ${selectedNodeId === node.id 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}
              `}
            >
              <div className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical size={14} />
              </div>
              <div className="text-gray-500">
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{node.title}</div>
                <div className="text-xs text-gray-500 truncate">
                  {node.type === NodeType.GUIDE 
                    ? (node.targetType ? `${TargetTypeLabel[node.targetType]} 目标` : '配置中') 
                    : NodeLabel[node.type]}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
