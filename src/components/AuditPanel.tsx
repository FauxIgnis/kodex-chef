import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { 
  ClipboardDocumentListIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ShareIcon,
  ChatBubbleLeftIcon
} from "@heroicons/react/24/outline";

interface AuditPanelProps {
  documentId: string | null;
}

export function AuditPanel({ documentId }: AuditPanelProps) {
  const documentAuditLog = useQuery(
    api.audit.getDocumentAuditLog,
    documentId ? { documentId: documentId as Id<"documents"> } : "skip"
  ) || [];

  const userAuditLog = useQuery(api.audit.getUserAuditLog, {}) || [];

  const getActionIcon = (action: string) => {
    switch (action) {
      case "view": return <EyeIcon className="w-4 h-4" />;
      case "edit": return <PencilIcon className="w-4 h-4" />;
      case "create": return <PlusIcon className="w-4 h-4" />;
      case "delete": return <TrashIcon className="w-4 h-4" />;
      case "share": return <ShareIcon className="w-4 h-4" />;
      case "comment": return <ChatBubbleLeftIcon className="w-4 h-4" />;
      default: return <ClipboardDocumentListIcon className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "view": return "text-blue-600 bg-blue-50";
      case "edit": return "text-green-600 bg-green-50";
      case "create": return "text-purple-600 bg-purple-50";
      case "delete": return "text-red-600 bg-red-50";
      case "share": return "text-orange-600 bg-orange-50";
      case "comment": return "text-indigo-600 bg-indigo-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const displayLogs = documentId ? documentAuditLog : userAuditLog;

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {documentId ? "Document Audit Log" : "My Activity Log"}
          </h2>
          <p className="text-sm text-gray-600">
            {documentId 
              ? "Track all changes and activities for this document" 
              : "View your recent activities across all documents"
            }
          </p>
        </div>
      </div>

      {/* Audit Log */}
      <div className="flex-1 overflow-y-auto p-6">
        {displayLogs.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
            <p className="text-gray-600">
              {documentId 
                ? "Activity for this document will appear here"
                : "Your activity across documents will appear here"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayLogs.map((log) => (
              <div
                key={log._id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {(log as any).user?.name || 'Unknown User'} {log.action}ed {documentId ? 'this document' : ((log as any).document?.title || 'a document')}
                        </p>
                        {log.details && (
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    {!documentId && (log as any).document && (
                      <p className="text-xs text-gray-500 mt-2">
                        Document: {(log as any).document.title}
                      </p>
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
