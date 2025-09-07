import React, { useState } from 'react';

interface KanbanTask {
  id: string;
  content: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
}

interface KanbanColumn {
  title: string;
  tasks: KanbanTask[];
}

interface KanbanBoardProps {
  data: { columns: KanbanColumn[] };
}

const priorityConfig = {
    'Urgent': { color: 'border-red-500', label: 'Urgent' },
    'High': { color: 'border-orange-500', label: 'High' },
    'Medium': { color: 'border-sky-500', label: 'Medium' },
    'Low': { color: 'border-slate-500', label: 'Low' },
};

type Priority = keyof typeof priorityConfig;
const priorities = Object.keys(priorityConfig) as Priority[];


export const KanbanBoard: React.FC<KanbanBoardProps> = ({ data }) => {
  const [activePriorityFilter, setActivePriorityFilter] = useState<Priority | null>(null);

  if (!data || !Array.isArray(data.columns) || data.columns.length === 0) {
    return <div className="p-4 text-slate-400">No Kanban board data provided or data is in the wrong format.</div>;
  }
  
  const toggleFilter = (priority: Priority) => {
    setActivePriorityFilter(prev => prev === priority ? null : priority);
  };

  const getPriorityClasses = (priority?: Priority): string => {
      if (!priority || !priorityConfig[priority]) {
          return 'border-transparent';
      }
      return priorityConfig[priority].color;
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-4 pt-4 pb-2 border-b border-slate-700 flex-shrink-0">
          <h3 className="text-sm font-bold text-slate-300 mb-2">Filter by Priority:</h3>
          <div className="flex items-center gap-2 flex-wrap">
              <button
                  onClick={() => setActivePriorityFilter(null)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                      activePriorityFilter === null 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                  All
              </button>
              {priorities.map(p => (
                  <button
                      key={p}
                      onClick={() => toggleFilter(p)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border-2 transition-colors ${
                          activePriorityFilter === p
                          ? `${priorityConfig[p].color.replace('border-', 'bg-').replace('-500', '-500/30')} ${priorityConfig[p].color} text-white`
                          : `bg-slate-700 border-transparent text-slate-300 hover:bg-slate-600`
                      }`}
                  >
                      {priorityConfig[p].label}
                  </button>
              ))}
          </div>
      </div>
      <div className="flex gap-4 p-4 overflow-x-auto h-full w-full bg-slate-900 rounded-b-xl">
        {data.columns.map((column, index) => {
          const filteredTasks = activePriorityFilter
            ? (column.tasks || []).filter(task => task.priority === activePriorityFilter)
            : (column.tasks || []);

          return (
            <div key={index} className="bg-slate-800 rounded-lg w-72 flex-shrink-0 flex flex-col h-full max-h-full">
              <h3 className="font-bold text-white p-3 border-b border-slate-700 flex-shrink-0">{column.title}</h3>
              <div className="p-3 space-y-3 overflow-y-auto">
                {filteredTasks.length > 0 ? filteredTasks.map(task => (
                  <div
                      key={task.id}
                      className={`bg-slate-700 rounded-md p-3 text-sm text-slate-200 shadow border-l-4 ${getPriorityClasses(task.priority)}`}
                  >
                      {task.content}
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 text-center p-4">
                    {activePriorityFilter ? `No tasks with "${activePriorityFilter}" priority.` : 'Empty'}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};