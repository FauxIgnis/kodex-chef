import { useState } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Sidebar } from "./components/Sidebar";
import { DocumentEditor } from "./components/DocumentEditor";
import { ChatPanel } from "./components/ChatPanel";
import { TaskPanel } from "./components/TaskPanel";
import { CalendarPanel } from "./components/CalendarPanel";
import { AuditPanel } from "./components/AuditPanel";
import { CasePanel } from "./components/CasePanel";
import { SharedDocument } from "./SharedDocument";
import { Toaster } from "sonner";

function MainApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'chat' | 'tasks' | 'calendar' | 'audit' | 'cases'>('editor');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const user = useQuery(api.auth.loggedInUser);

  const renderMainContent = () => {
    switch (activeView) {
      case 'editor':
        return (
          <DocumentEditor
            documentId={selectedDocumentId}
            onDocumentChange={setSelectedDocumentId}
          />
        );
      case 'cases':
        return (
          <CasePanel
            selectedCaseId={selectedCaseId}
            onCaseSelect={setSelectedCaseId}
          />
        );
      case 'chat':
        return <ChatPanel documentId={selectedDocumentId} />;
      case 'tasks':
        return <TaskPanel documentId={selectedDocumentId} />;
      case 'calendar':
        return <CalendarPanel />;
      case 'audit':
        return <AuditPanel documentId={selectedDocumentId} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Unauthenticated>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <h1 className="text-4xl font-bold text-gray-900">Kodex</h1>
                <span className="ml-2 text-sm text-gray-500 font-medium">v2.0</span>
              </div>
              <p className="text-gray-600">
                Professional legal document collaboration platform with AI assistance
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Kodex</h1>
              <span className="ml-2 text-sm text-gray-500 font-medium">v2.0</span>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-600">
                  Welcome, {user.name || user.email}
                </span>
              )}
              <SignOutButton />
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeView={activeView}
            onViewChange={setActiveView}
            selectedDocumentId={selectedDocumentId}
            onDocumentSelect={setSelectedDocumentId}
            selectedCaseId={selectedCaseId}
            onCaseSelect={setSelectedCaseId}
          />
          {renderMainContent()}
        </div>
      </Authenticated>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/shared/:shareableLink" element={<SharedDocument />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;
