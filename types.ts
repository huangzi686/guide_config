
export enum NodeType {
  START = 'START',
  END = 'END',
  GUIDE = 'GUIDE',
  CONDITION = 'CONDITION',
}

export enum TargetType {
  SCRM = 'SCRM',
  PMS = 'PMS',
  CHAT = 'CHAT',
}

export enum AIQuestionType {
  MATERIAL = 'MATERIAL',
  PROMPT = 'PROMPT',
  TABLE = 'TABLE',
}

export enum BranchType {
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  CONDITION = 'CONDITION',
  ELSE = 'ELSE',
}

// Data model for a single branch (Output port)
export interface Branch {
  id: string;
  type: BranchType;
  name: string; // "Goal Completed", "Branch 1", "Goal Failed", "Condition A"
  intent?: string; // For PMS/CHAT success branches
  replyType?: AIQuestionType;
  replyContent?: string;
}

// Data model for Wake-up strategy
export interface WakeUpStrategy {
  id: string;
  triggerTime: string; // "HH:MM"
  actionType: 'SEND_MATERIAL' | 'JUMP_STAGE';
  actionContent: string;
}

// Data model for Logic Conditions (Condition Node)
export interface LogicCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export interface LogicBranch {
  id: string; // Corresponds to a Branch ID
  name: string;
  conditions: LogicCondition[];
}

// End Node Configuration
export interface EndNodeConfig {
  closingRemarkType: AIQuestionType;
  closingRemarkContent: string;
  transferToHuman: boolean;
  transferMessage?: string;
  continueQA: boolean;
}

// Main Node Data Model
export interface NodeData {
  id: string;
  type: NodeType; // New field
  title: string;
  position: { x: number; y: number };
  
  // -- Guide Node Specific --
  targetType?: TargetType;
  targetConfig?: {
    scrmActivityId?: string;
    scrmCondition?: 'SUBMIT' | 'VIEW';
    pmsTag?: string;
    pmsPrompt?: string;
    chatField?: string;
    chatPrompt?: string;
  };

  followUpEnabled?: boolean;
  followUpStrategy?: 'UNTIL_CORRECT' | 'MAX_1' | 'MAX_2' | 'MAX_3' | 'MAX_4';

  aiQuestionType?: AIQuestionType;
  aiQuestionContent?: string;

  wakeUpStrategies?: WakeUpStrategy[];

  // -- Condition Node Specific --
  conditionBranches?: LogicBranch[]; // Logic definitions

  // -- End Node Specific --
  endConfig?: EndNodeConfig;

  // Common: Output Ports
  branches: Branch[];
}

// Connection Model
export interface Connection {
  id: string;
  sourceNodeId: string;
  sourceBranchId: string;
  targetNodeId: string;
}

export interface AppState {
  nodes: NodeData[];
  connections: Connection[];
  selectedNodeId: string | null;
}
