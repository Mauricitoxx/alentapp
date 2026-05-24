import {
  Table, Button, Heading, HStack, Stack, Text, Box, Flex, Spinner, Center, Input, IconButton, Badge, SimpleGrid,
} from '@chakra-ui/react';
import { LuPlus, LuRefreshCw, LuPencil, LuTrash2, LuX } from 'react-icons/lu';
import { useEffect, useMemo, useState } from 'react';
import { disciplinesService } from '../services/disciplines';
import { membersService } from '../services/members';
import type {
  DisciplineDTO, CreateDisciplineRequest, UpdateDisciplineRequest, MemberDTO,
} from '@alentapp/shared';
import {
  DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
  DialogActionTrigger, DialogCloseTrigger,
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import { MemberCombobox } from '../components/MemberCombobox';

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// --- Helpers del feature de historial ---
type Vigencia = 'Vigente' | 'Cumplida' | 'Programada';

function getVigencia(d: DisciplineDTO): Vigencia {
  const now = new Date();
  const start = new Date(d.start_date);
  const end = new Date(d.end_date);
  if (now < start) return 'Programada';
  if (now > end) return 'Cumplida';
  return 'Vigente';
}

const vigenciaColor = (v: Vigencia) =>
  v === 'Vigente' ? 'green' : v === 'Cumplida' ? 'gray' : 'blue';

export function DisciplinesView() {
  const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Feature de historial: id del socio por el que se filtra ('' = ver todas)
  const [filterMemberId, setFilterMemberId] = useState<string>('');

  const [formData, setFormData] = useState<CreateDisciplineRequest>({
    reason: '', start_date: '', end_date: '',
    is_total_suspension: false, member_id: '',
  });

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [disc, mem] = await Promise.all([
        disciplinesService.getAll(),
        membersService.getAll(),
      ]);
      setDisciplines(disc);
      setMembers(mem);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const memberNameById = (id: string) =>
    members.find((m) => m.id === id)?.name || id;

  // Lista visible según el filtro
  const visibleDisciplines = useMemo(() => {
    if (!filterMemberId) return disciplines;
    return disciplines.filter((d) => d.member_id === filterMemberId);
  }, [disciplines, filterMemberId]);

  // Resumen del socio filtrado
  const summary = useMemo(() => {
    if (!filterMemberId) return null;
    const list = disciplines.filter((d) => d.member_id === filterMemberId);
    const vigentes = list.filter((d) => getVigencia(d) === 'Vigente');
    const suspendido = vigentes.some((d) => d.is_total_suspension);
    return { total: list.length, vigentes: vigentes.length, suspendido };
  }, [disciplines, filterMemberId]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ reason: '', start_date: '', end_date: '', is_total_suspension: false, member_id: '' });
    setIsDialogOpen(true);
  };

  const openEditModal = (d: DisciplineDTO) => {
    setEditingId(d.id);
    setFormData({
      reason: d.reason,
      start_date: isoToDatetimeLocal(d.start_date),
      end_date: isoToDatetimeLocal(d.end_date),
      is_total_suspension: d.is_total_suspension,
      member_id: d.member_id,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const startIso = new Date(formData.start_date).toISOString();
      const endIso = new Date(formData.end_date).toISOString();

      if (editingId) {
        const updateData: UpdateDisciplineRequest = {
          reason: formData.reason,
          start_date: startIso,
          end_date: endIso,
          is_total_suspension: formData.is_total_suspension,
        };
        await disciplinesService.update(editingId, updateData);
      } else {
        const createData: CreateDisciplineRequest = {
          ...formData, start_date: startIso, end_date: endIso,
        };
        await disciplinesService.create(createData);
      }

      setIsDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la sanción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (d: DisciplineDTO) => {
    const memberName = memberNameById(d.member_id);
    const ok = window.confirm(
      `¿Eliminar la sanción de ${memberName} por "${d.reason}"? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    try {
      await disciplinesService.delete(d.id);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la sanción');
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Tribunal de Disciplina</Heading>
            <Text color="fg.muted" fontSize="md">Gestiona las sanciones aplicadas a los socios.</Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchAll} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Nueva Sanción
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Sanción' : 'Registrar Nueva Sanción'}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required>
                  <MemberCombobox
                    key={editingId ?? 'create'}
                    members={members}
                    selectedId={formData.member_id}
                    onSelect={(id) => setFormData({ ...formData, member_id: id })}
                    disabled={!!editingId}
                  />
                </Field>
                <Field label="Motivo" required>
                  <Input
                    placeholder="Ej. Conducta antideportiva"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Fecha y hora de inicio" required>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Fecha y hora de fin" required>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </Field>
                <Field>
                  <HStack>
                    <input
                      type="checkbox"
                      id="is_total_suspension"
                      checked={formData.is_total_suspension}
                      onChange={(e) => setFormData({ ...formData, is_total_suspension: e.target.checked })}
                    />
                    <label htmlFor="is_total_suspension">
                      Suspensión total (restringe acceso del socio)
                    </label>
                  </HStack>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingId ? 'Guardar Cambios' : 'Crear Sanción'}
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text fontWeight="bold">Error:</Text>
            <Text>{error}</Text>
          </Box>
        )}

        {/* ===== Feature: Historial por socio ===== */}
        <Box bg="bg.panel" borderRadius="xl" borderWidth="1px" p="5">
          <Stack gap="4">
            <Flex justify="space-between" align="center" wrap="wrap" gap="3">
              <Stack gap="0">
                <Heading size="md">Historial por socio</Heading>
                <Text color="fg.muted" fontSize="sm">
                  Buscá un socio para ver solo sus sanciones y su estado.
                </Text>
              </Stack>
              {filterMemberId && (
                <Button variant="outline" size="sm" onClick={() => setFilterMemberId('')}>
                  <LuX /> Ver todas
                </Button>
              )}
            </Flex>

            <Box maxW="md">
              <MemberCombobox
                key={`filter-${filterMemberId}`}
                members={members}
                selectedId={filterMemberId}
                onSelect={(id) => setFilterMemberId(id)}
                placeholder="Filtrar: buscar socio por nombre o DNI..."
              />
            </Box>

            {summary && (
              <SimpleGrid columns={{ base: 1, sm: 3 }} gap="3">
                <Box p="4" borderRadius="lg" bg="bg.muted/40" borderWidth="1px">
                  <Text fontSize="xs" color="fg.muted" textTransform="uppercase">Sanciones totales</Text>
                  <Text fontSize="2xl" fontWeight="bold">{summary.total}</Text>
                </Box>
                <Box p="4" borderRadius="lg" bg="bg.muted/40" borderWidth="1px">
                  <Text fontSize="xs" color="fg.muted" textTransform="uppercase">Vigentes</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">{summary.vigentes}</Text>
                </Box>
                <Box p="4" borderRadius="lg" bg="bg.muted/40" borderWidth="1px">
                  <Text fontSize="xs" color="fg.muted" textTransform="uppercase">Estado</Text>
                  <Box mt="1">
                    <Badge colorPalette={summary.suspendido ? 'red' : 'green'} size="lg">
                      {summary.suspendido ? 'Suspendido' : 'Sin restricción activa'}
                    </Badge>
                  </Box>
                </Box>
              </SimpleGrid>
            )}
          </Stack>
        </Box>

        {/* ===== Tabla (ahora usa visibleDisciplines + columna Vigencia) ===== */}
        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px">
          {isLoading ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">Cargando sanciones...</Text>
              </Stack>
            </Center>
          ) : visibleDisciplines.length === 0 ? (
            <Center h="300px">
              <Text color="fg.muted">
                {filterMemberId
                  ? 'Este socio no tiene sanciones registradas.'
                  : 'No hay sanciones registradas.'}
              </Text>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Motivo</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Vigencia</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Inicio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fin</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Suspensión total</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {visibleDisciplines.map((d) => {
                  const v = getVigencia(d);
                  return (
                    <Table.Row key={d.id}>
                      <Table.Cell fontWeight="semibold">{memberNameById(d.member_id)}</Table.Cell>
                      <Table.Cell color="fg.muted">{d.reason}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={vigenciaColor(v)}>{v}</Badge>
                      </Table.Cell>
                      <Table.Cell color="fg.muted">{new Date(d.start_date).toLocaleString()}</Table.Cell>
                      <Table.Cell color="fg.muted">{new Date(d.end_date).toLocaleString()}</Table.Cell>
                      <Table.Cell>{d.is_total_suspension ? 'Sí' : 'No'}</Table.Cell>
                      <Table.Cell textAlign="end">
                        <HStack gap="2" justify="flex-end">
                          <IconButton variant="ghost" size="sm" aria-label="Editar sanción" onClick={() => openEditModal(d)}>
                            <LuPencil />
                          </IconButton>
                          <IconButton variant="ghost" size="sm" colorPalette="red" aria-label="Eliminar sanción" onClick={() => handleDelete(d)}>
                            <LuTrash2 />
                          </IconButton>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}