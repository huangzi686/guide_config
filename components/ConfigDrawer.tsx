
import React, { useEffect } from 'react';
import { X, Plus, Trash2, Save, Clock, MousePointerClick, GitFork } from 'lucide-react';
import { NodeData, TargetType, AIQuestionType, BranchType, Branch, WakeUpStrategy, NodeType, LogicBranch, LogicCondition, EndNodeConfig } from '../types';
import { DEFAULT_BRANCHES_SCRM, DEFAULT_BRANCHES_DYNAMIC, generateId } from '../constants';

interface ConfigDrawerProps {
  node: NodeData | null;
  nodes: NodeData[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateNode: (updatedNode: NodeData) => void;
  onSave: () => void;
}

export const ConfigDrawer: React.FC<ConfigDrawerProps> = ({ node, nodes, isOpen, onClose, onUpdateNode, onSave }) => {
  
  // Initialize End Node Config if missing
  useEffect(() => {
    if (node && node.type === NodeType.END && !node.endConfig) {
      const defaultConfig: EndNodeConfig = {
        closingRemarkType: AIQuestionType.PROMPT,
        closingRemarkContent: '',
        transferToHuman: false,
        continueQA: false
      };
      onUpdateNode({ ...node, endConfig: defaultConfig });
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleChange = <K extends keyof NodeData>(key: K, value: NodeData[K]) => {
    onUpdateNode({ ...node, [key]: value });
  };

  const handleEndConfigChange = <K extends keyof EndNodeConfig>(key: K, value: EndNodeConfig[K]) => {
    if (!node.endConfig) return;
    onUpdateNode({ ...node, endConfig: { ...node.endConfig, [key]: value } });
  };

  // --- Logic for Guide Nodes ---
  const handleTargetTypeChange = (newType: TargetType) => {
    let newBranches = [...node.branches];
    if (newType === TargetType.SCRM) {
      newBranches = JSON.parse(JSON.stringify(DEFAULT_BRANCHES_SCRM)).map((b: Branch) => ({...b, id: generateId()}));
    } else if (node.targetType === TargetType.SCRM) {
      newBranches = JSON.parse(JSON.stringify(DEFAULT_BRANCHES_DYNAMIC)).map((b: Branch) => ({...b, id: generateId()}));
    }
    onUpdateNode({ ...node, targetType: newType, branches: newBranches });
  };

  const handleAddGuideBranch = () => {
    const newBranch: Branch = {
      id: generateId(),
      type: BranchType.SUCCESS,
      name: `意图分支`,
      intent: '',
      replyType: AIQuestionType.PROMPT,
      replyContent: ''
    };
    const newBranches = [...node.branches];
    newBranches.splice(newBranches.length - 1, 0, newBranch); // Insert before 'Fail' which is usually last
    handleChange('branches', newBranches);
  };

  const handleRemoveBranch = (id: string) => {
    handleChange('branches', node.branches.filter(b => b.id !== id));
  };

  const updateBranch = (id: string, field: keyof Branch, value: any) => {
    handleChange('branches', node.branches.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleAddStrategy = () => {
    const newStrategy: WakeUpStrategy = {
      id: generateId(),
      triggerTime: '00:30',
      actionType: 'SEND_MATERIAL',
      actionContent: ''
    };
    handleChange('wakeUpStrategies', [...(node.wakeUpStrategies || []), newStrategy]);
  };

  const handleRemoveStrategy = (id: string) => {
    handleChange('wakeUpStrategies', (node.wakeUpStrategies || []).filter(s => s.id !== id));
  };

  const updateStrategy = (id: string, field: keyof WakeUpStrategy, value: any) => {
    handleChange('wakeUpStrategies', (node.wakeUpStrategies || []).map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // --- Logic for Condition Nodes ---
  const handleAddLogicBranch = () => {
    const branchId = generateId();
    const newLogicBranch: LogicBranch = {
      id: branchId,
      name: '新条件',
      conditions: [{ id: generateId(), field: '', operator: '=', value: '' }]
    };
    const newPortBranch: Branch = {
      id: branchId,
      type: BranchType.CONDITION,
      name: newLogicBranch.name,
      replyType: AIQuestionType.PROMPT,
      replyContent: ''
    };
    const updatedConditionBranches = [...(node.conditionBranches || []), newLogicBranch];
    const currentPorts = [...node.branches];
    const elsePort = currentPorts.pop();
    currentPorts.push(newPortBranch);
    if (elsePort) currentPorts.push(elsePort);
    onUpdateNode({ ...node, conditionBranches: updatedConditionBranches, branches: currentPorts });
  };

  const handleUpdateLogicBranchName = (branchId: string, name: string) => {
    const updatedLogics = (node.conditionBranches || []).map(b => b.id === branchId ? {...b, name} : b);
    const updatedPorts = node.branches.map(b => b.id === branchId ? {...b, name} : b);
    onUpdateNode({ ...node, conditionBranches: updatedLogics, branches: updatedPorts });
  };

  const handleAddCondition = (branchId: string) => {
    const updatedLogics = (node.conditionBranches || []).map(b => {
      if (b.id === branchId) {
        return {
          ...b,
          conditions: [...b.conditions, { id: generateId(), field: '', operator: '=', value: '' }]
        };
      }
      return b;
    });
    handleChange('conditionBranches', updatedLogics);
  };

  const handleUpdateCondition = (branchId: string, condId: string, field: keyof LogicCondition, value: string) => {
    const updatedLogics = (node.conditionBranches || []).map(b => {
      if (b.id === branchId) {
        return {
          ...b,
          conditions: b.conditions.map(c => c.id === condId ? { ...c, [field]: value } : c)
        };
      }
      return b;
    });
    handleChange('conditionBranches', updatedLogics);
  };

  const handleRemoveLogicBranch = (branchId: string) => {
    const updatedLogics = (node.conditionBranches || []).filter(b => b.id !== branchId);
    const updatedPorts = node.branches.filter(b => b.id !== branchId);
    onUpdateNode({ ...node, conditionBranches: updatedLogics, branches: updatedPorts });
  };

  // --- Renders ---

  const renderStartConfig = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-500">
        流程由此开始，请连接到第一个引导阶段。
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">节点标题</label>
        <input
          type="text"
          value={node.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>
    </div>
  );

  const renderEndConfig = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">节点标题</label>
        <input
          type="text"
          value={node.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <hr className="border-gray-100" />
      
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800">结束语</h3>
        <select 
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
          value={node.endConfig?.closingRemarkType}
          onChange={(e) => handleEndConfigChange('closingRemarkType', e.target.value as AIQuestionType)}
        >
          <option value={AIQuestionType.PROMPT}>提示词</option>
          <option value={AIQuestionType.MATERIAL}>素材</option>
          <option value={AIQuestionType.TABLE}>读取在线表格</option>
        </select>
        {node.endConfig?.closingRemarkType === AIQuestionType.MATERIAL ? (
          <div className="p-3 border rounded bg-gray-50 text-center text-sm text-blue-600 cursor-pointer hover:bg-gray-100">
            {node.endConfig.closingRemarkContent || '+ 选择素材'}
          </div>
        ) : (
          <textarea 
             className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-20 resize-none"
             placeholder={node.endConfig?.closingRemarkType === AIQuestionType.TABLE ? "输入搜索条件..." : "输入结束语..."}
             value={node.endConfig?.closingRemarkContent || ''}
             onChange={(e) => handleEndConfigChange('closingRemarkContent', e.target.value)}
          />
        )}
      </div>

      <hr className="border-gray-100" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-gray-800">是否转人工</label>
          <button 
            onClick={() => handleEndConfigChange('transferToHuman', !node.endConfig?.transferToHuman)}
            className={`w-10 h-5 rounded-full relative transition-colors ${node.endConfig?.transferToHuman ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${node.endConfig?.transferToHuman ? 'left-6' : 'left-1'}`}></div>
          </button>
        </div>
        
        {node.endConfig?.transferToHuman && (
          <div className="bg-gray-50 p-3 rounded border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
             <label className="text-xs text-gray-500 mb-1 block">转人工提醒消息</label>
             <input 
               type="text"
               className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
               placeholder="例如：正在为您连接客服..."
               value={node.endConfig.transferMessage || ''}
               onChange={(e) => handleEndConfigChange('transferMessage', e.target.value)}
             />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-gray-800">是否继续答疑</label>
          <button 
            onClick={() => handleEndConfigChange('continueQA', !node.endConfig?.continueQA)}
            className={`w-10 h-5 rounded-full relative transition-colors ${node.endConfig?.continueQA ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${node.endConfig?.continueQA ? 'left-6' : 'left-1'}`}></div>
          </button>
        </div>

    </div>
  );

  const renderConditionConfig = () => (
    <div className="space-y-6">
       <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">节点标题</label>
        <input
          type="text"
          value={node.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">条件分支</h3>
        <button onClick={handleAddLogicBranch} className="p-1 rounded bg-purple-100 text-purple-600 hover:bg-purple-200">
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {node.conditionBranches?.map((logicBranch) => (
          <div key={logicBranch.id} className="border border-purple-100 rounded-lg overflow-hidden">
             <div className="bg-purple-50 px-3 py-2 flex items-center justify-between border-b border-purple-100">
               <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-purple-600">如果</span>
                 <input 
                   value={logicBranch.name} 
                   onChange={(e) => handleUpdateLogicBranchName(logicBranch.id, e.target.value)}
                   className="text-sm bg-transparent border-none focus:outline-none font-medium text-gray-700 w-32"
                 />
               </div>
               <button onClick={() => handleRemoveLogicBranch(logicBranch.id)} className="text-gray-400 hover:text-red-500">
                 <Trash2 size={14} />
               </button>
             </div>
             
             <div className="p-3 space-y-2 bg-white">
                {logicBranch.conditions.map((cond, idx) => (
                  <div key={cond.id} className="flex items-center gap-2 relative">
                    {idx > 0 && <span className="absolute -left-3 top-2 text-[10px] text-gray-400">且</span>}
                    <select 
                      value={cond.operator}
                      onChange={(e) => handleUpdateCondition(logicBranch.id, cond.id, 'operator', e.target.value)}
                      className="w-16 border border-gray-200 rounded text-xs py-1 px-1"
                    >
                      <option value="=">=</option>
                      <option value="!=">!=</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                    </select>
                    <div className="flex-1 space-y-1">
                      <input 
                        placeholder="变量名 / 字段"
                        className="w-full border border-gray-200 rounded text-xs py-1 px-2"
                        value={cond.field}
                        onChange={(e) => handleUpdateCondition(logicBranch.id, cond.id, 'field', e.target.value)}
                      />
                      <input 
                        placeholder="值 / empty"
                        className="w-full bg-gray-50 border border-gray-200 rounded text-xs py-1 px-2 text-gray-500"
                        value={cond.value}
                        onChange={(e) => handleUpdateCondition(logicBranch.id, cond.id, 'value', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => handleAddCondition(logicBranch.id)}
                  className="w-full py-1 text-center text-xs text-purple-500 bg-purple-50 hover:bg-purple-100 rounded mt-2"
                >
                  + 新增条件
                </button>
             </div>
          </div>
        ))}

        <div className="border border-gray-200 rounded-md p-3 bg-white">
          <div className="text-sm font-medium text-gray-700">否则</div>
          <div className="text-xs text-gray-400 mt-1">
             上述条件都不满足时，执行此分支。
          </div>
        </div>
      </div>
    </div>
  );

  const renderGuideConfig = () => {
    // Current node index for filtering jump stages
    const currentNodeIndex = nodes.findIndex(n => n.id === node.id);
    const validJumpStages = nodes.filter((n, idx) => idx >= currentNodeIndex && n.type === NodeType.GUIDE);

    return (
      <div className="space-y-8">
        <section className="space-y-3">
          <label className="text-sm font-semibold text-gray-700">阶段标题</label>
          <input
            type="text"
            value={node.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </section>

        <hr className="border-gray-100" />

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div> 目标设定
          </h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">目标类型</label>
            <select
              value={node.targetType}
              onChange={(e) => handleTargetTypeChange(e.target.value as TargetType)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value={TargetType.SCRM}>SCRM 活动</option>
              <option value={TargetType.PMS}>PMS 标签</option>
              <option value={TargetType.CHAT}>聊天信息</option>
            </select>
          </div>

          <div className="bg-gray-50 p-3 rounded-md space-y-3 border border-gray-100">
             {node.targetType === TargetType.SCRM && (
               <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-600">SCRM表单配置</div>
                  <input type="text" placeholder="活动ID" className="w-full text-xs border rounded px-2 py-1" />
                  <select className="w-full text-xs border rounded px-2 py-1">
                    <option value="SUBMIT">提交</option>
                    <option value="VIEW">浏览</option>
                  </select>
               </div>
             )}
              {node.targetType === TargetType.PMS && (
                <div className="space-y-2">
                   <div className="text-xs font-semibold text-gray-600">PMS标签配置</div>
                   <input type="text" placeholder="选择标签组件(Mock)" className="w-full text-xs border rounded px-2 py-1" />
                   <input type="text" placeholder="判断提示词" className="w-full text-xs border rounded px-2 py-1" />
                </div>
             )}
             {node.targetType === TargetType.CHAT && (
                <div className="space-y-2">
                   <div className="text-xs font-semibold text-gray-600">聊天信息配置</div>
                   <input type="text" placeholder="提取字段名" className="w-full text-xs border rounded px-2 py-1" />
                   <input type="text" placeholder="提取提示词" className="w-full text-xs border rounded px-2 py-1" />
                </div>
             )}
          </div>
        </section>

        <hr className="border-gray-100" />

        <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full"></div> 追问机制
              </h3>
              <div className="flex items-center gap-2">
                 <span className="text-xs text-gray-500">启用</span>
                 <button 
                    onClick={() => handleChange('followUpEnabled', !node.followUpEnabled)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${node.followUpEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                 >
                   <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${node.followUpEnabled ? 'left-6' : 'left-1'}`}></div>
                 </button>
              </div>
            </div>
            {node.followUpEnabled && (
               <select className="w-full border rounded px-2 py-1 text-sm">
                 <option value="UNTIL_CORRECT">追问至正确</option>
                 <option value="MAX_1">最多追问1次</option>
                 <option value="MAX_2">最多追问2次</option>
               </select>
            )}
        </section>

        <hr className="border-gray-100" />

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <div className="w-1 h-4 bg-indigo-500 rounded-full"></div> AI 提问
          </h3>
          <div className="space-y-2">
             <select 
               value={node.aiQuestionType} 
               onChange={(e) => handleChange('aiQuestionType', e.target.value as AIQuestionType)}
               className="w-full text-sm border rounded px-2 py-1"
             >
                <option value={AIQuestionType.PROMPT}>提示词</option>
                <option value={AIQuestionType.MATERIAL}>素材</option>
                <option value={AIQuestionType.TABLE}>读取在线表格</option>
             </select>
             {node.aiQuestionType === AIQuestionType.MATERIAL ? (
               <button className="w-full border border-dashed rounded py-4 text-xs text-gray-500 hover:bg-gray-50">
                  {node.aiQuestionContent || '+ 选择素材'}
               </button>
             ) : (
                <textarea 
                  value={node.aiQuestionContent || ''}
                  onChange={(e) => handleChange('aiQuestionContent', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-20 resize-none"
                  placeholder="AI 提问内容..."
                />
             )}
          </div>
        </section>

        <hr className="border-gray-100" />

        <section className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <div className="w-1 h-4 bg-green-500 rounded-full"></div> 阶段结算与分支
          </h3>
          <div className="space-y-4">
            {node.branches.map((branch, index) => {
              const isDynamic = node.targetType !== TargetType.SCRM;
              const isSuccess = branch.type === BranchType.SUCCESS;
              const isFail = branch.type === BranchType.FAIL;

              // Title for the block
              let blockTitle = "";
              if (isSuccess) blockTitle = "目标完成";
              if (isFail) blockTitle = "目标未完成";
              if (isSuccess && isDynamic) blockTitle = "目标完成分支";

              return (
                <div key={branch.id} className="border border-gray-200 rounded-md overflow-hidden">
                  <div className={`px-3 py-2 flex items-center justify-between ${isSuccess ? 'bg-green-50 border-b border-green-100' : 'bg-yellow-50 border-b border-yellow-100'}`}>
                     <span className={`text-xs font-bold ${isSuccess ? 'text-green-700' : 'text-yellow-700'}`}>{blockTitle}</span>
                     
                     {/* Allow delete only for Dynamic Success branches, but keep at least one if needed (optional rule) */}
                     {isSuccess && isDynamic && (
                       <button onClick={() => handleRemoveBranch(branch.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                     )}
                  </div>
                  
                  <div className="p-3 bg-white space-y-3">
                     {/* User Intent Input for Dynamic Success Branches */}
                     {isSuccess && isDynamic && (
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">用户意图</label>
                          <input 
                              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                              placeholder="例如：想要预订..."
                              value={branch.intent || ''}
                              onChange={(e) => updateBranch(branch.id, 'intent', e.target.value)}
                          />
                        </div>
                     )}

                     {/* AI Reply Configuration */}
                     <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] text-gray-400">AI 回复</label>
                          <select 
                            className="text-[10px] border-none bg-transparent text-blue-600 focus:outline-none"
                            value={branch.replyType}
                            onChange={(e) => updateBranch(branch.id, 'replyType', e.target.value)}
                          >
                             <option value={AIQuestionType.PROMPT}>提示词</option>
                             <option value={AIQuestionType.MATERIAL}>素材</option>
                             <option value={AIQuestionType.TABLE}>读表</option>
                          </select>
                        </div>
                        
                        {branch.replyType === AIQuestionType.MATERIAL ? (
                           <div className="text-xs border rounded p-2 text-center text-gray-500 cursor-pointer hover:bg-gray-50">
                              {branch.replyContent || '选择素材'}
                           </div>
                        ) : (
                          <textarea 
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm h-16 resize-none" 
                            placeholder="回复内容..."
                            value={branch.replyContent || ''}
                            onChange={(e) => updateBranch(branch.id, 'replyContent', e.target.value)}
                          />
                        )}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
          {node.targetType !== TargetType.SCRM && (
            <button onClick={handleAddGuideBranch} className="w-full py-2 border border-dashed border-gray-300 rounded text-sm text-gray-500 flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-500 transition-colors">
              <Plus size={14} /> 添加目标完成分支
            </button>
          )}
        </section>
        
        <hr className="border-gray-100" />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <div className="w-1 h-4 bg-gray-500 rounded-full"></div> 唤醒策略
             </h3>
             <button onClick={handleAddStrategy} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"><Plus size={12} /> 添加</button>
          </div>
          <div className="space-y-3">
             {node.wakeUpStrategies?.map((s) => (
               <div key={s.id} className="border border-gray-200 rounded p-2 bg-gray-50 relative group">
                  <button onClick={() => handleRemoveStrategy(s.id)} className="absolute right-2 top-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">触发时间:</span>
                    <input type="time" value={s.triggerTime} onChange={(e) => updateStrategy(s.id, 'triggerTime', e.target.value)} className="border rounded px-1 text-xs"/>
                  </div>
                  <div className="space-y-2">
                    <select className="w-full text-xs border rounded p-1" value={s.actionType} onChange={(e) => updateStrategy(s.id, 'actionType', e.target.value)}>
                      <option value="SEND_MATERIAL">发送素材</option>
                      <option value="JUMP_STAGE">跳转阶段</option>
                    </select>
                    {s.actionType === 'SEND_MATERIAL' ? (
                       <div className="text-xs border rounded p-1.5 text-center bg-white text-gray-500 cursor-pointer">
                         {s.actionContent || '点击选择素材'}
                       </div>
                    ) : (
                       <select className="w-full text-xs border rounded p-1 bg-white" value={s.actionContent} onChange={(e) => updateStrategy(s.id, 'actionContent', e.target.value)}>
                         <option value="">选择阶段...</option>
                         {validJumpStages.map(n => (
                           <option key={n.id} value={n.id}>{n.title}</option>
                         ))}
                       </select>
                    )}
                  </div>
               </div>
             ))}
             {(!node.wakeUpStrategies || node.wakeUpStrategies.length === 0) && (
               <div className="text-xs text-gray-400 text-center py-2">暂无策略</div>
             )}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200 z-50 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-800">配置: {node.title}</h2>
          <p className="text-xs text-gray-500">ID: {node.id}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {node.type === NodeType.GUIDE && renderGuideConfig()}
        {node.type === NodeType.CONDITION && renderConditionConfig()}
        {node.type === NodeType.START && renderStartConfig()}
        {node.type === NodeType.END && renderEndConfig()}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <button 
          onClick={() => { onSave(); onClose(); }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Save size={18} /> 保存配置
        </button>
      </div>
    </div>
  );
};
