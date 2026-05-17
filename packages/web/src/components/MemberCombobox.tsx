import { useEffect, useRef, useState } from 'react';
import { Box, Input, Text, VStack, IconButton, Flex } from '@chakra-ui/react';
import { LuSearch, LuX } from 'react-icons/lu';
import type { MemberDTO } from '@alentapp/shared';

interface MemberComboboxProps {
  members: MemberDTO[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MemberCombobox({
  members,
  selectedId,
  onSelect,
  disabled = false,
  placeholder = 'Buscar miembro por nombre o DNI...',
}: MemberComboboxProps) {
  const getDisplay = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m ? `${m.name} (${m.dni})` : '';
  };

  const [query, setQuery] = useState(() => getDisplay(selectedId));
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isShowingSelectedDisplay = selectedId && query === getDisplay(selectedId);
  const filtered =
    query.trim() === '' || isShowingSelectedDisplay
      ? members
      : members.filter((m) => {
          const q = query.toLowerCase().trim();
          return m.name.toLowerCase().includes(q) || m.dni.includes(q);
        });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery(getDisplay(selectedId));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, members]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setQuery(getDisplay(id));
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect('');
    setQuery('');
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && isOpen && filtered[highlightIdx]) {
      e.preventDefault();
      handleSelect(filtered[highlightIdx].id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery(getDisplay(selectedId));
    }
  };

  return (
    <Box ref={containerRef} position="relative" w="100%">
      <Flex position="relative" align="center">
        <Box position="absolute" left="3" color="fg.muted" pointerEvents="none" zIndex="1">
          <LuSearch size={16} />
        </Box>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightIdx(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (selectedId && query === getDisplay(selectedId)) {
              setQuery('');
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          pl="9"
          pr={selectedId && !disabled ? '9' : '3'}
        />
        {selectedId && !disabled && (
          <IconButton
            position="absolute"
            right="1"
            size="xs"
            variant="ghost"
            aria-label="Limpiar selección"
            onClick={handleClear}
          >
            <LuX size={14} />
          </IconButton>
        )}
      </Flex>

      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left="0"
          right="0"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.muted"
          borderRadius="md"
          boxShadow="lg"
          maxH="240px"
          overflowY="auto"
          zIndex="1500"
        >
          {filtered.length === 0 ? (
            <Box px="3" py="3">
              <Text color="fg.muted" fontSize="sm">Sin coincidencias</Text>
            </Box>
          ) : (
            <VStack gap="0" align="stretch">
              {filtered.map((m, idx) => (
                <Box
                  key={m.id}
                  px="3"
                  py="2"
                  cursor="pointer"
                  bg={idx === highlightIdx ? 'bg.muted' : undefined}
                  _hover={{ bg: 'bg.muted' }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(m.id);
                  }}
                >
                  <Text fontWeight="medium" fontSize="sm">{m.name}</Text>
                  <Text fontSize="xs" color="fg.muted">DNI: {m.dni}</Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      )}
    </Box>
  );
}