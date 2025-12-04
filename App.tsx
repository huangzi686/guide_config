
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { ConfigDrawer } from './components/ConfigDrawer';
import { NodeData, Connection, NodeType, TargetType, AIQuestionType, BranchType, Branch } from './types';
import { INITIAL_NODES, INITIAL_CONNECTIONS, generateId, DEFAULT_BRANCHES_SCRM, DEFAULT_BRANCH_START, DEFAULT_BRANCH_CONDITION_ELSE } from './constants';

export default function App() {
  const [nodes, setNodes] = useState<NodeData[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const handleAddNode = (type: NodeType) => {
    let newNode: NodeData = {
      id: generateId(),
      type: type,
      title: '新节点',
      position: { x: 250, y: 150 + (nodes.length * 30) },
      branches: []
    };

    if (type === NodeType.GUIDE) {
      newNode = {
        ...newNode,
        title: '新引导阶段',
        targetType: TargetType.SCRM,
        targetConfig: { scrmCondition: 'SUBMIT' },
        followUpEnabled: false,
        aiQuestionType: AIQuestionType.PROMPT,
        aiQuestionContent: '新提问...',
        branches: JSON.parse(JSON.stringify(DEFAULT_BRANCHES_SCRM)).map((b: Branch) => ({...b, id: generateId()})),
        wakeUpStrategies: []
      };
    } else if (type === NodeType.START) {
      newNode = {
        ...newNode,
        title: '开始',
        branches: JSON.parse(JSON.stringify(DEFAULT_BRANCH_START)).map((b: Branch) => ({...b, id: generateId()}))
      };
    } else if (type === NodeType.END) {
      newNode = {
        ...newNode,
        title: '结束',
        branches: [] // End node has no output branches
      };
    } else if (type === NodeType.CONDITION) {
      // Initialize with one logic branch + Else
      const logicId = generateId();
      newNode = {
        ...newNode,
        title: '条件判断',
        conditionBranches: [{ id: logicId, name: '条件1', conditions: [{ id: generateId(), field: '', operator: '=', value: '' }] }],
        branches: [
          { id: logicId, type: BranchType.CONDITION, name: '条件1', replyType: AIQuestionType.PROMPT, replyContent: '' },
          { ...DEFAULT_BRANCH_CONDITION_ELSE, id: generateId() }
        ]
      };
    }

    setNodes([...nodes, newNode]);
    handleSelectNode(newNode.id);
  };

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id || null);
    setDrawerOpen(!!id);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setConnections(connections.filter(c => c.sourceNodeId !== id && c.targetNodeId !== id));
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
      setDrawerOpen(false);
    }
  };

  const handleMoveNode = (id: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, position } : n));
  };

  const handleUpdateNode = (updatedNode: NodeData) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    
    // Check if any branches were removed; if so, remove connected lines
    const currentBranchIds = updatedNode.branches.map(b => b.id);
    setConnections(prev => prev.filter(c => {
      if (c.sourceNodeId === updatedNode.id) {
        return currentBranchIds.includes(c.sourceBranchId);
      }
      return true;
    }));
  };

  const handleConnect = (sourceNodeId: string, sourceBranchId: string, targetNodeId: string) => {
    if (sourceNodeId === targetNodeId) return; 

    // Remove existing connection from this specific output branch
    const filteredConnections = connections.filter(
      c => !(c.sourceNodeId === sourceNodeId && c.sourceBranchId === sourceBranchId)
    );

    const newConnection: Connection = {
      id: generateId(),
      sourceNodeId,
      sourceBranchId,
      targetNodeId
    };
    setConnections([...filteredConnections, newConnection]);
  };

  const handleDeleteConnection = (id: string) => {
    setConnections(connections.filter(c => c.id !== id));
  };

  const handleReorderNodes = (fromIndex: number, toIndex: number) => {
    const updatedNodes = [...nodes];
    const [movedNode] = updatedNodes.splice(fromIndex, 1);
    updatedNodes.splice(toIndex, 0, movedNode);
    setNodes(updatedNodes);
  };

  const handleSave = () => {
    console.log("Configuration Saved", { nodes, connections });
    setDrawerOpen(false);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-800 font-sans">
      <Sidebar 
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        onAddNode={handleAddNode}
        onSelectNode={handleSelectNode}
        onDeleteNode={handleDeleteNode}
        onReorderNodes={handleReorderNodes}
      />
      
      <main className="flex-1 flex relative">
        <Canvas 
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onMoveNode={handleMoveNode}
          onConnect={handleConnect}
          onDeleteConnection={handleDeleteConnection}
        />
        
        <ConfigDrawer 
          node={selectedNode}
          nodes={nodes}
          isOpen={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          onUpdateNode={handleUpdateNode}
          onSave={handleSave}
        />
      </main>
    </div>
  );
}
