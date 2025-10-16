import { EmailMessage } from '../lib/emailService';
import { ArrowLeft, Reply } from 'lucide-react';

interface EmailViewerProps {
  email: EmailMessage | null;
  onClose: () => void;
  onReply: (email: EmailMessage) => void;
}

export default function EmailViewer({ email, onClose, onReply }: EmailViewerProps) {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Sélectionnez un message pour l'afficher</p>
        </div>
      </div>
    );
  }

  const formatFullDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="p-4 border-b flex items-center justify-between">
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1"></div>
        <button
          onClick={() => onReply(email)}
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
        >
          <Reply size={18} />
          <span>Répondre</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {email.subject || '(Sans objet)'}
          </h1>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-gray-900">
                  {email.from.replace(/<.*>/, '').trim() || email.from}
                </div>
                <div className="text-sm text-gray-600">
                  {email.from.match(/<(.*)>/)?.[1] || email.from}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {formatFullDate(email.date)}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">À:</span> {email.to}
            </div>
          </div>

          <div className="prose max-w-none">
            {email.html ? (
              <div
                dangerouslySetInnerHTML={{ __html: email.html }}
                className="email-content"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-gray-800">
                {email.text}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
