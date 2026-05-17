import {
  Table, Button, Heading, HStack, Stack, Text, Box, Flex, Spinner, Center, Input,
} from '@chakra-ui/react';
import { LuPlus, LuRefreshCw } from 'react-icons/lu';
import { useEffect, useState } from 'react';
import { disciplinesService } from '../services/disciplines';
import { membersService } from '../services/members';
import type { DisciplineDTO, CreateDisciplineRequest, MemberDTO } from '@alentapp/shared';
import {
  DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
  DialogActionTrigger, DialogCloseTrigger,
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import { MemberCombobox } from '../components/MemberCombobox';

export function DisciplinesView() {
  const [disciplines, setDisciplines] = useState<DisciplineDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateDisciplineRequest>({
    reason: '',
    start_date: '',
    end_date: '',
    is_total_suspension: false,
    member_id: '',
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

  useEffect(() => {
    fetchAll();
  }, []);

  const memberNameById = (id: string) =>
    members.find((m) => m.id === id)?.name || id;

  const openCreateModal = () => {
    setFormData({
      reason: '', start_date: '', end_date: '',
      is_total_suspension: false, member_id: '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: CreateDisciplineRequest = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };
      await disciplinesService.create(payload);
      setIsDialogOpen(false);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Error al guardar la sanción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Tribunal de Disciplina</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona las sanciones aplicadas a los miembros.
            </Text>
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
              <DialogTitle>Registrar Nueva Sanción</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Miembro" required>
                  <MemberCombobox
                    members={members}
                    selectedId={formData.member_id}
                    onSelect={(id) => setFormData({ ...formData, member_id: id })}
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
                      Suspensión total (restringe acceso del miembro)
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
                Crear Sanción
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

        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px">
          {isLoading ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">Cargando sanciones...</Text>
              </Stack>
            </Center>
          ) : disciplines.length === 0 ? (
            <Center h="300px">
              <Text color="fg.muted">No hay sanciones registradas.</Text>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Miembro</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Motivo</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Inicio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fin</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Suspensión total</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {disciplines.map((d) => (
                  <Table.Row key={d.id}>
                    <Table.Cell fontWeight="semibold">{memberNameById(d.member_id)}</Table.Cell>
                    <Table.Cell color="fg.muted">{d.reason}</Table.Cell>
                    <Table.Cell color="fg.muted">{new Date(d.start_date).toLocaleString()}</Table.Cell>
                    <Table.Cell color="fg.muted">{new Date(d.end_date).toLocaleString()}</Table.Cell>
                    <Table.Cell>{d.is_total_suspension ? 'Sí' : 'No'}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}