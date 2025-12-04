
import { BranchType, NodeData, TargetType, AIQuestionType, Branch, NodeType } from './types';

export const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Default Branches ---

export const DEFAULT_BRANCHES_SCRM: Branch[] = [
  { id: 'b_success', type: BranchType.SUCCESS, name: '目标完成', replyType: AIQuestionType.PROMPT, replyContent: '' },
  { id: 'b_fail', type: BranchType.FAIL, name: '目标未完成', replyType: AIQuestionType.PROMPT, replyContent: '' },
];

export const DEFAULT_BRANCHES_DYNAMIC: Branch[] = [
  { id: 'b_default_success', type: BranchType.SUCCESS, name: '意图分支 1', intent: '', replyType: AIQuestionType.PROMPT, replyContent: '' },
  { id: 'b_fail', type: BranchType.FAIL, name: '目标未完成', replyType: AIQuestionType.PROMPT, replyContent: '' },
];

export const DEFAULT_BRANCH_START: Branch[] = [
  { id: 'b_start', type: BranchType.SUCCESS, name: '开始', replyType: AIQuestionType.PROMPT, replyContent: '' }
];

export const DEFAULT_BRANCH_CONDITION_ELSE: Branch = { 
  id: 'b_else', type: BranchType.ELSE, name: '否则', replyType: AIQuestionType.PROMPT, replyContent: '' 
};

// --- Initial Nodes ---

const START_NODE_ID = 'node_start';
const GUIDE_NODE_ID = 'node_guide_1';

export const INITIAL_NODES: NodeData[] = [
  {
    id: START_NODE_ID,
    type: NodeType.START,
    title: '流程开始',
    position: { x: 50, y: 150 },
    branches: JSON.parse(JSON.stringify(DEFAULT_BRANCH_START)).map((b: Branch) => ({...b, id: generateId()})),
  },
  {
    id: GUIDE_NODE_ID,
    type: NodeType.GUIDE,
    title: '欢迎阶段',
    position: { x: 300, y: 100 },
    targetType: TargetType.SCRM,
    targetConfig: {
      scrmCondition: 'SUBMIT'
    },
    followUpEnabled: false,
    aiQuestionType: AIQuestionType.PROMPT,
    aiQuestionContent: '您好！请问有什么可以帮您？',
    branches: JSON.parse(JSON.stringify(DEFAULT_BRANCHES_SCRM)).map((b: Branch) => ({...b, id: generateId()})),
    wakeUpStrategies: []
  }
];

export const INITIAL_CONNECTIONS = [
  {
    id: 'conn_init_1',
    sourceNodeId: START_NODE_ID,
    sourceBranchId: INITIAL_NODES[0].branches[0].id, // This ID is generated above, but we need it stable for init. 
    // Correction: In a real app we'd construct this better. For now we will rely on dynamic generation in App.tsx or use fixed IDs for init.
    targetNodeId: GUIDE_NODE_ID
  }
];
