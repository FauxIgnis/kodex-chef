import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { 
  FolderIcon,
  PlusIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface CasePanelProps {
  selectedCaseId: string | null;
  onCaseSelect: (caseId: string | null) => void;
}

export function CasePanel({ selectedCaseId, onCaseSelect }: CasePanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCaseName, setNewCaseName] = useState("");
  const [newCaseDescription, setNewCaseDescription] = useState("");
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);

  const cases = useQuery(api.cases.getUserCases) || [];
  const selectedCase = useQuery(
    api.cases.getCase,
    selectedCaseId ? { caseId: selectedCaseId as Id<"cases"> } : "skip"
  );
  const caseDocuments = useQuery(
    api.cases.getCaseDocuments,
    selectedCaseId ? { caseId: selectedCaseId as Id<"cases"> } : "skip"
  ) || [];
  const userDocuments = useQuery(api.documents.listUserDocuments) || [];

  const createCase = useMutation(api.cases.createCase);
  const updateCase = useMutation(api.cases.updateCase);
  const deleteCase = useMutation(api.cases.deleteCase);
  const addDocumentToCase = useMutation(api.cases.addDocumentToCase);
  const removeDocumentFromCase = useMutation(api.cases.removeDocumentFromCase);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseName.trim()) return;

    try {
      const caseId = await createCase({
        name: newCaseName,
        description: newCaseDescription || undefined,
      });
      onCaseSelect(caseId);
      setNewCaseName("");
      setNewCaseDescription("");
      setShowCreateForm(false);
      toast.success("Case created successfully");
    } catch (error) {
      toast.error("Failed to create case");
      console.error("Create case error:", error);
    }
  };

  const handleUpdateCase = async (caseId: string) => {
    try {
      await updateCase({
        caseId: caseId as Id<"cases">,
        name: editName,
        description: editDescription || undefined,
      });
      setEditingCase(null);
      toast.success("Case updated successfully");
    } catch (error) {
      toast.error("Failed to update case");
      console.error("Update case error:", error);
    }
  };

  const handleDeleteCase = async (caseId: string, caseName: string) => {
    if (!confirm(`Are you sure you want to delete the case "${caseName}"? This will remove all documents from the case but won't delete the documents themselves.`)) {
      return;
    }

    try {
      await deleteCase({ caseId: caseId as Id<"cases"> });
      if (selectedCaseId === caseId) {
        onCaseSelect(null);
      }
      toast.success("Case deleted successfully");
    } catch (error) {
      toast.error("Failed to delete case");
      console.error("Delete case error:", error);
    }
  };

  const handleAddDocument = async (documentId: string) => {
    if (!selectedCaseId) return;

    try {
      await addDocumentToCase({
        caseId: selectedCaseId as Id<"cases">,
        documentId: documentId as Id<"documents">,
      });
      toast.success("Document added to case");
    } catch (error: any) {
      toast.error(error.message || "Failed to add document to case");
      console.error("Add document error:", error);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    if (!selectedCaseId) return;

    try {
      await removeDocumentFromCase({
        caseId: selectedCaseId as Id<"cases">,
        documentId: documentId as Id<"documents">,
      });
      toast.success("Document removed from case");
    } catch (error) {
      toast.error("Failed to remove document from case");
      console.error("Remove document error:", error);
    }
  };

  const availableDocuments = userDocuments.filter(doc => 
    doc && !doc.caseId && !caseDocuments.some(caseDoc => caseDoc._id === doc._id)
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Case Management</h2>
            <p className="text-sm text-gray-600">
              Organize documents into cases for AI-powered legal analysis
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Case
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Cases List */}
        <div className="w-80 border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-4">Your Cases</h3>
            
            {showCreateForm && (
              <form onSubmit={handleCreateCase} className="mb-4 p-4 bg-white rounded-lg border">
                <input
                  type="text"
                  placeholder="Case name"
                  value={newCaseName}
                  onChange={(e) => setNewCaseName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newCaseDescription}
                  onChange={(e) => setNewCaseDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  rows={2}
                />
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
              </form>
            )}

            <div className="space-y-2">
              {cases.map((caseItem) => (
                <div
                  key={caseItem._id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCaseId === caseItem._id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => onCaseSelect(caseItem._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingCase === caseItem._id ? (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            rows={2}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleUpdateCase(caseItem._id)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                            >
                              <CheckIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingCase(null)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {caseItem.name}
                          </h4>
                          {caseItem.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {caseItem.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-500">
                              {caseItem.documentCount}/30 docs • {formatFileSize(caseItem.totalSize)}/50MB
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCase(caseItem._id);
                                  setEditName(caseItem.name);
                                  setEditDescription(caseItem.description || "");
                                }}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <PencilIcon className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCase(caseItem._id, caseItem.name);
                                }}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <TrashIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Case Details */}
        <div className="flex-1 flex flex-col">
          {selectedCase ? (
            <>
              {/* Case Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedCase.name}</h3>
                    {selectedCase.description && (
                      <p className="text-sm text-gray-600 mt-1">{selectedCase.description}</p>
                    )}
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <span>{selectedCase.documentCount}/30 documents</span>
                      <span className="mx-2">•</span>
                      <span>{formatFileSize(selectedCase.totalSize)}/50MB used</span>
                      {selectedCase.documentCount >= 30 && (
                        <>
                          <span className="mx-2">•</span>
                          <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 mr-1" />
                          <span className="text-amber-600">Document limit reached</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowAIChat(!showAIChat)}
                      className={`px-3 py-2 text-sm rounded-md hover:bg-purple-200 flex items-center transition-colors ${
                        showAIChat 
                          ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <SparklesIcon className="w-4 h-4 mr-1" />
                      Case AI Chat
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex">
                {/* Documents in Case */}
                <div className="flex-1 p-6">
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Documents in Case</h4>
                    {caseDocuments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FolderIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No documents in this case yet</p>
                        <p className="text-sm">Add documents from your library below</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {caseDocuments.map((doc) => (
                          <div key={doc._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <DocumentTextIcon className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
                                  <h5 className="text-sm font-medium text-gray-900 truncate">
                                    {doc.title}
                                  </h5>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Modified {new Date(doc.lastModifiedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveDocument(doc._id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded ml-2"
                                title="Remove from case"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Available Documents */}
                  {availableDocuments.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Add Documents to Case</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableDocuments.map((doc) => {
                          if (!doc) return null;
                          return (
                            <div key={doc._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center">
                                    <DocumentTextIcon className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                                    <h5 className="text-sm font-medium text-gray-900 truncate">
                                      {doc.title}
                                    </h5>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Modified {new Date(doc.lastModifiedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAddDocument(doc._id)}
                                  disabled={selectedCase && selectedCase.documentCount >= 30}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Add to case"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Case AI Chat */}
                {showAIChat && (
                  <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <SparklesIcon className="w-5 h-5 text-purple-600 mr-2" />
                          <h3 className="font-semibold text-gray-900">Case AI Assistant</h3>
                        </div>
                        <button
                          onClick={() => setShowAIChat(false)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <XMarkIcon className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Ask questions about all documents in this case
                      </p>
                    </div>
                    
                    <div className="flex-1 p-4 bg-gray-50">
                      <div className="text-center py-12">
                        <SparklesIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Case-Wide AI Analysis
                        </h4>
                        <p className="text-xs text-gray-600 max-w-xs mx-auto leading-relaxed">
                          Chat with AI about all {caseDocuments.length} documents in this case. 
                          Ask for summaries, comparisons, or legal analysis across the entire case.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Case Selected</h3>
                <p className="text-gray-600">Select a case from the sidebar or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
