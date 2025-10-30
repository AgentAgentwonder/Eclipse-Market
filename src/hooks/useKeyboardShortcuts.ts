import { useEffect, useCallback } from 'react';
import { useShortcutStore } from '../store/shortcutStore';

interface UseKeyboardShortcutsOptions {
  onCommandPalette?: () => void;
  onHelp?: () => void;
  onEscape?: () => void;
  onAction?: (action: string) => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    Control: 'Ctrl',
    Meta: 'Cmd',
    Command: 'Cmd',
    Option: 'Alt',
    Return: 'Enter',
    ' ': 'Space',
  };
  return keyMap[key] || key;
}

function getModifierString(event: KeyboardEvent): string {
  const modifiers: string[] = [];

  if (event.ctrlKey || (isMac && event.metaKey)) {
    modifiers.push(isMac ? 'Cmd' : 'Ctrl');
  }
  if (event.shiftKey) {
    modifiers.push('Shift');
  }
  if (event.altKey) {
    modifiers.push('Alt');
  }

  return modifiers.join('+');
}

function matchesShortcut(event: KeyboardEvent, shortcutKeys: string): boolean {
  const parts = shortcutKeys.split('+');
  const modifiers = parts.slice(0, -1);
  const key = parts[parts.length - 1];

  const hasCtrl = modifiers.includes('Ctrl') || modifiers.includes('Cmd');
  const hasShift = modifiers.includes('Shift');
  const hasAlt = modifiers.includes('Alt');

  const eventModifiersMatch =
    (hasCtrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey) &&
    (hasShift ? event.shiftKey : !event.shiftKey) &&
    (hasAlt ? event.altKey : !event.altKey);

  const normalizedEventKey = normalizeKey(event.key);
  const keyMatch =
    normalizedEventKey.toLowerCase() === key.toLowerCase() || event.key === key;

  return eventModifiersMatch && keyMatch;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { shortcuts } = useShortcutStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        if (!shortcut.enabled) continue;

        if (matchesShortcut(event, shortcut.keys)) {
          if (isInput) {
            if (shortcut.action === 'general:escape') {
              event.preventDefault();
              target.blur();
              if (options.onEscape) {
                options.onEscape();
              }
              return;
            }
            if (shortcut.action === 'general:command-palette') {
              event.preventDefault();
              if (options.onCommandPalette) {
                options.onCommandPalette();
              }
              return;
            }
            continue;
          }

          event.preventDefault();

          switch (shortcut.action) {
            case 'general:command-palette':
              options.onCommandPalette?.();
              break;
            case 'general:help':
              options.onHelp?.();
              break;
            case 'general:escape':
              options.onEscape?.();
              break;
            default:
              if (options.onAction) {
                options.onAction(shortcut.action);
              }
              break;
          }

          return;
        }
      }

      if (!isInput && event.key === '?' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        options.onHelp?.();
      }
    },
    [shortcuts, options]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export function formatShortcutKeys(keys: string): string {
  return keys.replace(/Cmd|Ctrl/, isMac ? '⌘' : 'Ctrl');
}
