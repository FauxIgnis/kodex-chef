import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { 
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface TaskPanelProps {
  documentId: string | null;
}

export function TaskPanel({ documentId }: TaskPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
  });

  const tasks = useQuery(api.tasks.getUserTasks, { includeCompleted: false }) || [];
  const documentTasks = useQuery(
    api.tasks.getDocumentTasks,
    documentId ? { documentId: documentId as Id<"documents"> } : "skip"
  ) || [];

  const createTask = useMutation(api.tasks.createTask);
  const updateTaskStatus = useMutation(api.tasks.updateTaskStatus);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await createTask({
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).getTime() : undefined,
        documentId: documentId as Id<"documents"> | undefined,
      });

      setNewTask({ title: "", description: "", priority: "medium", dueDate: "" });
      setShowCreateForm(false);
      toast.success("Task created successfully");
    } catch (error) {
      toast.error("Failed to create task");
      console.error("Create task error:", error);
    }
  };

  const handleStatusChange = async (taskId: string, status: "todo" | "in_progress" | "completed") => {
    try {
      await updateTaskStatus({
        taskId: taskId as Id<"tasks">,
        status,
      });
      toast.success("Task status updated");
    } catch (error) {
      toast.error("Failed to update task status");
      console.error("Update task error:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-50";
      case "in_progress": return "text-blue-600 bg-blue-50";
      case "todo": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const displayTasks = documentId ? documentTasks : tasks;

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {documentId ? "Document Tasks" : "My Tasks"}
            </h2>
            <p className="text-sm text-gray-600">
              {documentId 
                ? "Tasks related to this document" 
                : "Manage your tasks and assignments"
              }
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <div className="border-b border-gray-200 p-6 bg-gray-50">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task title..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Task description..."
              />
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as "low" | "medium" | "high" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-6">
        {displayTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600">
              {documentId 
                ? "Create tasks related to this document to track progress"
                : "Create your first task to get started"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTasks.map((task) => (
              <div
                key={task._id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      {task.creator && (
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-1" />
                          Created by {task.creator.name}
                        </div>
                      )}
                      
                      {task.assignee && (
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-1" />
                          Assigned to {task.assignee.name}
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {task.status !== "completed" && (
                      <>
                        {task.status === "todo" && (
                          <button
                            onClick={() => handleStatusChange(task._id, "in_progress")}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Start
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleStatusChange(task._id, "completed")}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Complete
                        </button>
                      </>
                    )}
                    
                    {task.status === "completed" && (
                      <button
                        onClick={() => handleStatusChange(task._id, "todo")}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
