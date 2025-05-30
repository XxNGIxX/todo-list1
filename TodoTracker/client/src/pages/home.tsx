import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Trash2, Plus, Clock, Circle, Edit2, Save, X } from "lucide-react";
import type { Todo } from "@shared/schema";

type FilterType = "all" | "active" | "completed";

export default function Home() {
  const [newTodoText, setNewTodoText] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch todos
  const { data: todos = [], isLoading, error } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/todos", { text });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setNewTodoText("");
      toast({
        title: "Success",
        description: "Task added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update todo mutation
  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Todo> }) => {
      const response = await apiRequest("PUT", `/api/todos/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({
        title: "Success",
        description: "Task updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete todo mutation
  const deleteTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/todos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    createTodoMutation.mutate(newTodoText.trim());
  };

  const handleToggleComplete = (todo: Todo) => {
    updateTodoMutation.mutate({
      id: todo.id,
      updates: { completed: !todo.completed },
    });
  };

  const handleDeleteTodo = (id: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTodoMutation.mutate(id);
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEditing = () => {
    if (!editingText.trim()) return;
    updateTodoMutation.mutate({
      id: editingId!,
      updates: { text: editingText.trim() },
    });
    setEditingId(null);
    setEditingText("");
  };

  const handleClearCompleted = () => {
    const completedTodos = todos.filter(todo => todo.completed);
    if (completedTodos.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${completedTodos.length} completed task(s)?`)) {
      completedTodos.forEach(todo => {
        deleteTodoMutation.mutate(todo.id);
      });
    }
  };

  const getFilteredTodos = () => {
    switch (activeFilter) {
      case "active":
        return todos.filter(todo => !todo.completed);
      case "completed":
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  };

  const filteredTodos = getFilteredTodos();
  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const pendingTodos = totalTodos - completedTodos;

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const todoDate = new Date(date);
    const diffMs = now.getTime() - todoDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <Circle className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Unable to load todos</h3>
            <p className="text-slate-500 mb-4">Please check your connection and try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <CheckCircle className="text-primary-600" />
                Todo List
              </h1>
              <p className="text-slate-600 mt-1">Stay organized and productive</p>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{totalTodos}</div>
                <div className="text-slate-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500">{completedTodos}</div>
                <div className="text-slate-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{pendingTodos}</div>
                <div className="text-slate-500">Pending</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Todo Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add New Task</h2>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="What do you need to do?"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={createTodoMutation.isPending || !newTodoText.trim()}
                className="min-w-[120px]"
              >
                {createTodoMutation.isPending ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <Card className="mb-6">
          <CardContent className="p-2">
            <div className="flex flex-wrap gap-1">
              <Button
                variant={activeFilter === "all" ? "default" : "ghost"}
                onClick={() => setActiveFilter("all")}
                className="flex-1 sm:flex-none"
              >
                All Tasks
              </Button>
              <Button
                variant={activeFilter === "active" ? "default" : "ghost"}
                onClick={() => setActiveFilter("active")}
                className="flex-1 sm:flex-none"
              >
                Active
              </Button>
              <Button
                variant={activeFilter === "completed" ? "default" : "ghost"}
                onClick={() => setActiveFilter("completed")}
                className="flex-1 sm:flex-none"
              >
                Completed
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-5 h-5 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="w-8 h-8 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-2xl text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {activeFilter === "all" ? "No tasks yet" : 
                   activeFilter === "active" ? "No active tasks" : "No completed tasks"}
                </h3>
                <p className="text-slate-500 mb-4">
                  {activeFilter === "all" ? "Get started by adding your first task above" :
                   activeFilter === "active" ? "All your tasks are completed!" : "Complete some tasks to see them here"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTodos.map((todo) => (
                  <div key={todo.id} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleComplete(todo)}
                        disabled={updateTodoMutation.isPending}
                      />
                      <div className="flex-1 min-w-0">
                        {editingId === todo.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditing();
                                if (e.key === 'Escape') cancelEditing();
                              }}
                              className="flex-1"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={saveEditing}
                              disabled={!editingText.trim() || updateTodoMutation.isPending}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className={`font-medium ${todo.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {todo.text}
                            </p>
                            <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Created {formatRelativeTime(todo.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                {todo.completed ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-3 h-3 text-amber-400" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId !== todo.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(todo)}
                            disabled={updateTodoMutation.isPending}
                            className="text-slate-400 hover:text-blue-500"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTodo(todo.id)}
                          disabled={deleteTodoMutation.isPending}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {todos.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span>{pendingTodos} tasks remaining, {completedTodos} completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCompleted}
                    disabled={completedTodos === 0 || deleteTodoMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear Completed
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
