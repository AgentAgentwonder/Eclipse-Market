import { useCallback, useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import type { AddressBookContact } from '../types/wallet';

interface AddressBookFilters {
  tag?: string;
  search?: string;
}

export function useAddressBook(initialFilters: AddressBookFilters = {}) {
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialFilters.search ?? '');
  const [selectedTag, setSelectedTag] = useState(initialFilters.tag ?? '');

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await invoke<AddressBookContact[]>('address_book_list_contacts');
      setContacts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesTag = selectedTag ? contact.tags.includes(selectedTag) : true;
      const matchesSearch = searchTerm
        ? contact.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (contact.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
        : true;

      return matchesTag && matchesSearch;
    });
  }, [contacts, searchTerm, selectedTag]);

  const addContact = useCallback(
    async (data: { address: string; label: string; nickname?: string; notes?: string; tags?: string[] }) => {
      try {
        await invoke('address_book_add_contact', {
          request: {
            address: data.address,
            label: data.label,
            nickname: data.nickname,
            notes: data.notes,
            tags: data.tags ?? [],
          },
        });
        await fetchContacts();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [fetchContacts]
  );

  const updateContact = useCallback(
    async (
      contactId: string,
      data: { label?: string; nickname?: string | null; notes?: string | null; tags?: string[] }
    ) => {
      try {
        await invoke('address_book_update_contact', {
          request: {
            contactId,
            label: data.label,
            nickname: data.nickname !== undefined ? data.nickname : undefined,
            notes: data.notes !== undefined ? data.notes : undefined,
            tags: data.tags,
          },
        });
        await fetchContacts();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [fetchContacts]
  );

  const deleteContact = useCallback(
    async (contactId: string) => {
      try {
        await invoke('address_book_delete_contact', { contactId });
        await fetchContacts();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [fetchContacts]
  );

  const importContacts = useCallback(
    async (json: string) => {
      try {
        await invoke('address_book_import', { data: json });
        await fetchContacts();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [fetchContacts]
  );

  const exportContacts = useCallback(async () => {
    try {
      return await invoke<string>('address_book_export');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, []);

  return {
    contacts: filteredContacts,
    allContacts: contacts,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedTag,
    setSelectedTag,
    addContact,
    updateContact,
    deleteContact,
    importContacts,
    exportContacts,
    refresh: fetchContacts,
  };
}
