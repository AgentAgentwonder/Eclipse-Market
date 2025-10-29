import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AddressLabel } from '../types/alertNotifications';

interface AddressLabelState {
  labels: AddressLabel[];
  getLabel: (address: string) => AddressLabel | undefined;
  addLabel: (label: Omit<AddressLabel, 'addedAt'>) => void;
  updateLabel: (address: string, updates: Partial<Omit<AddressLabel, 'address' | 'addedAt'>>) => void;
  removeLabel: (address: string) => void;
  isKnownAddress: (address: string) => boolean;
}

export const useAddressLabelStore = create<AddressLabelState>()(
  persist(
    (set, get) => ({
      labels: [],

      getLabel: (address: string) => {
        return get().labels.find(l => l.address === address);
      },

      addLabel: (label) => {
        const existingLabel = get().getLabel(label.address);
        if (existingLabel) {
          // Update existing label
          set(state => ({
            labels: state.labels.map(l =>
              l.address === label.address
                ? { ...l, ...label, addedAt: l.addedAt }
                : l
            ),
          }));
        } else {
          // Add new label
          set(state => ({
            labels: [
              ...state.labels,
              {
                ...label,
                addedAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      updateLabel: (address, updates) => {
        set(state => ({
          labels: state.labels.map(l =>
            l.address === address ? { ...l, ...updates } : l
          ),
        }));
      },

      removeLabel: (address) => {
        set(state => ({
          labels: state.labels.filter(l => l.address !== address),
        }));
      },

      isKnownAddress: (address: string) => {
        return get().labels.some(l => l.address === address && l.isKnown);
      },
    }),
    {
      name: 'address-labels-storage',
    }
  )
);
