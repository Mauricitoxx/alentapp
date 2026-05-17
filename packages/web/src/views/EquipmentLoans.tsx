import { 
  Table, 
  Button, 
  Heading, 
  HStack, 
  Stack, 
  Text, 
  Box,
  Flex,
  Spinner,
  Center,
  Input,
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuPen, LuTrash } from "react-icons/lu";
import { useEffect, useState } from "react";
import { equipmentLoansService } from "../services/equipmentLoans"; 
import { membersService } from "../services/members";
import type { EquipmentLoanDTO, CreateEquipmentLoanRequest, MemberDTO } from "@alentapp/shared";
import { MemberCombobox } from "../components/MemberCombobox";
import { 
  DialogRoot, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter, 
  DialogActionTrigger,
  DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";

export function EquipmentLoansView() {
  const [loans, setLoans] = useState<EquipmentLoanDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    member_id: "",
    item_name: "",
    due_date: "", 
    status: "Loaned",
  });

  const fetchLoans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await equipmentLoansService.getAll();
      setLoans(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los préstamos");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLoanId(null);
    setFormData({ 
      member_id: "", 
      item_name: "", 
      due_date: "", 
      status: "Loaned",
    });
    setIsDialogOpen(true);
  };

  const openEditModal = (loan: EquipmentLoanDTO) => {
    setEditingLoanId(loan.id);
    const formattedDate = new Date(loan.due_date).toISOString().slice(0, 16);
    setFormData({
      member_id: loan.member_id,
      item_name: loan.item_name,
      due_date: formattedDate,
      status: loan.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const isoDate = new Date(formData.due_date).toISOString();
      if (editingLoanId) {
        await equipmentLoansService.update(editingLoanId, { 
          status: formData.status, 
          due_date: isoDate 
        });
      } else {
        await equipmentLoansService.create({ 
          member_id: formData.member_id,
          item_name: formData.item_name,
          due_date: isoDate 
        });
      }
      setIsDialogOpen(false);
      fetchLoans(); 
    } catch (err: any) {
      alert(err.message || "Error al procesar el préstamo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este préstamo?")) {
      try {
        await equipmentLoansService.delete(id);
        fetchLoans();
      } catch (err: any) {
        alert(err.message || "Error al eliminar el préstamo");
      }
    }
  };

  const fetchMembers = async () => {
    try {
      const data = await membersService.getAll();
      setMembers(data);
    } catch (err: any) {
      console.error("Error fetching members:", err);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchMembers();
  }, []);

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Gestión de Préstamos</Heading>
            <Text color="fg.muted" fontSize="md">
              Consulta y registra los préstamos de equipos a los socios.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchLoans} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Nuevo Préstamo
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingLoanId ? "Editar Préstamo" : "Registrar Nuevo Préstamo"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Socio" required>
                  {editingLoanId ? (
                    <Input value={formData.member_id.split('-')[0] + '...'} disabled />
                  ) : (
                    <MemberCombobox
                      members={members}
                      selectedId={formData.member_id}
                      onSelect={(id) => setFormData({ ...formData, member_id: id })}
                    />
                  )}
                </Field>
                <Field label="Artículo prestado" required>
                  <Input 
                    placeholder="Ej. Raqueta de Tenis" 
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                    required
                    disabled={!!editingLoanId}
                  />
                </Field>
                <Field label="Fecha de Devolución" required>
                  <Input 
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </Field>
                {editingLoanId && (
                  <Field label="Estado" required>
                    <Box 
                      as="select"
                      w="full"
                      p="2"
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor="border"
                      bg="bg.panel"
                      color="fg"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: (e.target as HTMLSelectElement).value })}
                    >
                      <Box as="option" value="Loaned" bg="bg.panel" color="fg">Prestado (Loaned)</Box>
                      <Box as="option" value="Returned" bg="bg.panel" color="fg">Devuelto (Returned)</Box>
                      <Box as="option" value="Damaged" bg="bg.panel" color="fg">Dañado (Damaged)</Box>
                    </Box>
                  </Field>
                )}
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingLoanId ? "Guardar Cambios" : "Crear Préstamo"}
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text>{error}</Text>
          </Box>
        )}

        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden">
          {isLoading ? (
            <Center h="300px"><Spinner size="xl" color="cyan.500" /></Center>
          ) : (
            <Table.Root size="md" variant="line">
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Artículo</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">ID Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fecha de Préstamo</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fecha de Devolución</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="right">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {loans.map((loan) => (
                  <Table.Row key={loan.id}>
                    <Table.Cell fontWeight="bold">{loan.item_name}</Table.Cell>
                    <Table.Cell color="fg.muted">{loan.member_id.split('-')[0]}...</Table.Cell>
                    <Table.Cell>
                        <Box px="2" py="0.5" borderRadius="md" fontSize="xs" fontWeight="bold" 
                             bg={loan.status === 'Loaned' ? "blue.50" : "green.50"} 
                             color={loan.status === 'Loaned' ? "blue.700" : "green.700"}>
                          {loan.status}
                        </Box>
                    </Table.Cell>
                    <Table.Cell>{new Date(loan.loan_date).toLocaleDateString()}</Table.Cell>
                    <Table.Cell>{new Date(loan.due_date).toLocaleDateString()}</Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack gap="2" justify="flex-end">
                        <Button size="sm" variant="ghost" colorPalette="blue" onClick={() => openEditModal(loan)}>
                          <LuPen />
                        </Button>
                        <Button size="sm" variant="ghost" colorPalette="red" onClick={() => handleDelete(loan.id)}>
                          <LuTrash />
                        </Button>
                      </HStack>
                    </Table.Cell>
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
