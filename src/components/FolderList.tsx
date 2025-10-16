import { Inbox, Send, Trash2, Archive, Folder } from 'lucide-react';

interface FolderListProps {
  folders: string[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
}

const folderIcons: { [key: string]: any } = {
  'INBOX': Inbox,
  'Sent': Send,
  'Trash': Trash2,
  'Archive': Archive,
};

export default function FolderList({ folders, selectedFolder, onSelectFolder }: FolderListProps) {
  const getIcon = (folderName: string) => {
    const Icon = folderIcons[folderName] || Folder;
    return <Icon size={18} />;
  };

  const getFolderDisplayName = (folder: string) => {
    const names: { [key: string]: string } = {
      'INBOX': 'Boîte de réception',
      'Sent': 'Envoyés',
      'Drafts': 'Brouillons',
      'Trash': 'Corbeille',
      'Spam': 'Indésirables',
      'Archive': 'Archives',
    };
    return names[folder] || folder;
  };

  return (
    <div className="w-64 bg-gray-50 border-r p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Dossiers
      </h3>
      <div className="space-y-1">
        {folders.map((folder) => (
          <button
            key={folder}
            onClick={() => onSelectFolder(folder)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition ${
              selectedFolder === folder
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getIcon(folder)}
            <span className="text-sm font-medium">{getFolderDisplayName(folder)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
