import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  currentUsage?: number;
  limit?: number;
}

export function SubscriptionModal({ 
  isOpen, 
  onClose, 
  feature, 
  currentUsage, 
  limit 
}: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const subscription = useQuery(api.subscriptions.getUserSubscription);
  const usage = useQuery(api.subscriptions.getUserUsage, {});

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    // In a real app, this would integrate with Stripe
    // For now, we'll just show a message
    alert("Stripe integration would be implemented here. For demo purposes, this would redirect to payment.");
    setIsLoading(false);
  };

  const freeFeatures = [
    "10 AI chatbot questions per month",
    "3 tasks",
    "5 document creations",
    "1 PDF export",
    "3 calendar events",
    "5 file uploads",
    "Basic document editing",
    "Public document sharing"
  ];

  const proFeatures = [
    "Unlimited AI chatbot questions",
    "Unlimited tasks",
    "Unlimited document creations",
    "Unlimited PDF exports",
    "Unlimited calendar events",
    "Unlimited file uploads",
    "Advanced collaboration features",
    "Real-time editing with presence",
    "Advanced commenting & suggestions",
    "Audit log access",
    "Priority support",
    "Case management (30 docs, 50MB)",
    "Workspace invitations & roles"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h2>
            {feature && (
              <p className="text-sm text-gray-600 mt-1">
                You've reached your free tier limit for {feature} ({currentUsage}/{limit})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Current Usage */}
        {usage && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Current Usage</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-600">AI Questions</div>
                <div className="text-lg font-semibold text-gray-900">
                  {usage.aiQuestions}/10
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-600">Tasks</div>
                <div className="text-lg font-semibold text-gray-900">
                  {usage.tasksCreated}/3
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-600">Documents</div>
                <div className="text-lg font-semibold text-gray-900">
                  {usage.documentsCreated}/5
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-600">PDF Exports</div>
                <div className="text-lg font-semibold text-gray-900">
                  {usage.pdfExports}/1
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-600">Calendar Events</div>
                <div className="text-lg font-semibold text-gray-900">
                  {usage.calendarEvents}/3
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm text-gray-600">File Uploads</div>
                <div className="text-lg font-semibold text-gray-900">
                  {usage.fileUploads}/5
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Free</h3>
                <div className="text-3xl font-bold text-gray-900 mt-2">$0</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                disabled
                className="w-full py-2 px-4 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
              >
                Current Plan
              </button>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-blue-500 rounded-lg p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Recommended
                </span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Pro</h3>
                <div className="text-3xl font-bold text-gray-900 mt-2">$30</div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CreditCardIcon className="w-5 h-5 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
          <div className="text-center">
            <SparklesIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unlock the Full Power of Kodex
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get unlimited access to all features, advanced collaboration tools, 
              and priority support to supercharge your legal workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
