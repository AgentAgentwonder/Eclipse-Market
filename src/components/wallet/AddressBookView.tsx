import { useState } from 'react';
import { Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { useAddressBook } from '../../hooks/useAddressBook';

export function AddressBookView() {
  const {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    exportContacts,
    importContacts,
    searchTerm,
    setSearchTerm,
    selectedTag,
    setSelectedTag,
    refresh,
  } = useAddressBook();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [importData, setImportData] = useState('');

  const uniqueTags = Array.from(new Set(contacts.flatMap(contact => contact.tags)));

  const handleAddContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await addContact({
      address: String(formData.get('address')),
      label: String(formData.get('label')),
      nickname: String(formData.get('nickname') || '') || undefined,
      notes: String(formData.get('notes') || '') || undefined,
      tags: String(formData.get('tags') || '')
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    });

    setShowAddForm(false);
    event.currentTarget.reset();
  };

  const handleUpdateContact = async (event: React.FormEvent<HTMLFormElement>, contactId: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await updateContact(contactId, {
      label: String(formData.get('label')),
      nickname:
        formData.get('nickname') !== null ? String(formData.get('nickname')) || null : undefined,
      notes: formData.get('notes') !== null ? String(formData.get('notes')) || null : undefined,
      tags: String(formData.get('tags') || '')
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    });

    setEditingContactId(null);
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Remove this contact?')) return;
    await deleteContact(contactId);
  };

  const handleExport = async () => {
    const data = await exportContacts();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'address-book.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importData.trim()) return;
    await importContacts(importData);
    setImportData('');
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search address book"
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
          />
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Tags</option>
            {uniqueTags.map(tag => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddContact} className="bg-gray-700/50 rounded-2xl p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Address</label>
              <input
                name="address"
                required
                placeholder="Solana address"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Label</label>
              <input
                name="label"
                required
                placeholder="Contact name"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nickname</label>
              <input
                name="nickname"
                placeholder="Short alias"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tags</label>
              <input
                name="tags"
                placeholder="Comma separated tags"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
            >
              Save Contact
            </button>
          </div>
        </form>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No contacts found</div>
        ) : (
          contacts.map(contact => (
            <div key={contact.id} className="bg-gray-700/50 rounded-2xl p-6">
              {editingContactId === contact.id ? (
                <form onSubmit={event => handleUpdateContact(event, contact.id)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Label</label>
                      <input
                        name="label"
                        defaultValue={contact.label}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Nickname</label>
                      <input
                        name="nickname"
                        defaultValue={contact.nickname ?? ''}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Tags</label>
                      <input
                        name="tags"
                        defaultValue={contact.tags.join(', ')}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      defaultValue={contact.notes ?? ''}
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingContactId(null)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{contact.label}</h3>
                      {contact.nickname && <p className="text-sm text-gray-400">{contact.nickname}</p>}
                      <p className="font-mono text-sm text-gray-300 mt-2 break-all">{contact.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingContactId(contact.id)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-purple-500/20 text-purple-200 text-xs rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {contact.notes && (
                    <p className="text-sm text-gray-400">{contact.notes}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    {contact.lastUsed && <span>Last used: {new Date(contact.lastUsed).toLocaleString()}</span>}
                    <span>Added: {new Date(contact.createdAt).toLocaleDateString()}</span>
                    <span>Transactions: {contact.transactionCount}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-gray-700/50 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Import from JSON
        </h3>
        <textarea
          value={importData}
          onChange={e => setImportData(e.target.value)}
          rows={4}
          placeholder='Paste exported address book JSON here'
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500"
        />
        <div className="flex justify-end">
          <button
            onClick={handleImport}
            disabled={!importData.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Import Contacts
          </button>
        </div>
      </div>
    </div>
  );
}
