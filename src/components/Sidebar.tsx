import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ShareIcon,
  LockClosedIcon,
  GlobeAltIcon,
  BellIcon
} from "@heroicons/react/24/outline";
import { NotificationCenter } from "./NotificationCenter";
import { SubscriptionModal } from "./SubscriptionModal";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeView: 'editor' | 'chat' | 'tasks' | 'calendar' | 'audit' | 'cases';
  onViewChange: (view: 'editor' | 'chat' | 'tasks' | 'calendar' | 'audit' | 'cases') => void;
  selectedDocumentId: string | null;
  onDocumentSelect: (documentId: string | null) => void;
  selectedCaseId: string | null;
  onCaseSelect: (caseId: string | null) => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  activeView,
  onViewChange,
  selectedDocumentId,
  onDocumentSelect,
  selectedCaseId,
  onCaseSelect,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocIsPublic, setNewDocIsPublic] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const documents = useQuery(api.documents.listUserDocuments) || [];
  const searchResults = useQuery(
    api.documents.searchDocuments,
    searchQuery.length > 2 ? { query: searchQuery } : "skip"
  ) || [];
  const unreadCount = useQuery(api.notifications.getUnreadCount) || 0;
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const usageCheck = useQuery(api.subscriptions.checkUsageLimit, { feature: "documentsCreated" });

  const createDocument = useMutation(api.documents.createDocument);
  const incrementUsage = useMutation(api.subscriptions.incrementUsage);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    // Check usage limits for free users
    if (usageCheck && !usageCheck.allowed) {
      setShowSubscriptionModal(true);
      return;
    }

    try {
      const docId = await createDocument({
        title: newDocTitle,
        content: "",
        isPublic: newDocIsPublic,
      });
      
      // Increment usage for free users
      if (subscription?.plan === "free") {
        await incrementUsage({ feature: "documentsCreated" });
      }
      
      onDocumentSelect(docId);
      setNewDocTitle("");
      setNewDocIsPublic(false);
      setShowCreateForm(false);
      onViewChange('editor');
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  const displayedDocuments = searchQuery.length > 2 ? searchResults : documents;

  const navigationItems = [
    { id: 'editor', label: 'Editor', icon: DocumentTextIcon },
    { id: 'cases', label: 'Cases', icon: FolderIcon },
    { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'tasks', label: 'Tasks', icon: CheckCircleIcon },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'audit', label: 'Audit Log', icon: ClipboardDocumentListIcon },
  ] as const;

  if (collapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
        <button
          onClick={onToggleCollapse}
          className="p-4 hover:bg-gray-50 border-b border-gray-200"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
        
        <nav className="flex-1 py-4">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full p-3 flex justify-center hover:bg-gray-50 ${
                activeView === item.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
              }`}
              title={item.label}
            >
              <item.icon className={`w-5 h-5 ${
                activeView === item.id ? 'text-blue-600' : 'text-gray-600'
              }`} />
            </button>
          ))}
        </nav>

        {/* Notifications Bell - Collapsed */}
        <div className="border-t border-gray-200 p-2">
          <button
            onClick={() => setShowNotifications(true)}
            className="w-full p-2 flex justify-center hover:bg-gray-50 relative"
            title="Notifications"
          >
            <BellIcon className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Navigation</h3>
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(true)}
                className="p-1 hover:bg-gray-100 rounded relative"
                title="Notifications"
              >
                <BellIcon className="w-4 h-4 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Subscription Status */}
              {subscription && (
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    subscription.plan === 'pro' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription.plan === 'pro' ? 'Pro' : 'Free'}
                  </span>
                  {subscription.plan === 'free' && (
                    <button
                      onClick={() => setShowSubscriptionModal(true)}
                      className="ml-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              )}
              
              <button
                onClick={onToggleCollapse}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-50 ${
                  activeView === item.id 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700'
                }`}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Documents</h3>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Create new document"
              >
                <PlusIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateDocument} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder="Document title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  autoFocus
                />
                <label className="flex items-center text-sm text-gray-600 mb-2">
                  <input
                    type="checkbox"
                    checked={newDocIsPublic}
                    onChange={(e) => setNewDocIsPublic(e.target.checked)}
                    className="mr-2"
                  />
                  Make public
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
                {usageCheck && !usageCheck.allowed && (
                  <p className="text-xs text-red-600 mt-2">
                    {usageCheck.reason}. Upgrade to Pro for unlimited documents.
                  </p>
                )}
              </form>
            )}

            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {displayedDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">
                    {searchQuery.length > 2 ? 'No documents found' : 'No documents yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {displayedDocuments.filter(Boolean).map((doc) => {
                if (!doc) return null;
                return (
                    <button
                      key={doc._id}
                      onClick={() => {
                        onDocumentSelect(doc._id);
                        onViewChange('editor');
                      }}
                      className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 border transition-colors ${
                        selectedDocumentId === doc._id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {doc.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(doc.lastModifiedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center ml-2">
                          {doc.isPublic ? (
                            <GlobeAltIcon className="w-3 h-3 text-green-500" title="Public" />
                          ) : (
                            <LockClosedIcon className="w-3 h-3 text-gray-400" title="Private" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
      
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)}
        feature={usageCheck && !usageCheck.allowed ? "document creation" : undefined}
        currentUsage={usageCheck?.currentUsage}
        limit={usageCheck?.limit}
      />
    </>
  );
}
