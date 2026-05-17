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
import { LuPlus, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { sportsService } from "../services/sports"; 
import type { SportDTO, CreateSportRequest } from "@alentapp/shared";
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
import { Checkbox } from "../components/ui/checkbox";

export function SportsView() {
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el Modal de Creación
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado del formulario (CreateSportRequest)
  const [formData, setFormData] = useState<CreateSportRequest>({
    name: "",
    description: "",
    max_capacity: 1, // Por defecto 1 para cumplir con > 0 
    additional_price: 0,
    requires_medical_certificate: false,
  });

  const fetchSports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sportsService.getAll();
      setSports(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los deportes");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ 
      name: "", 
      description: "", 
      max_capacity: 1, 
      additional_price: 0, 
      requires_medical_certificate: false 
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de Regla de Negocio: max_capacity > 0 
    if (formData.max_capacity <= 0) {
        alert("La capacidad máxima debe ser mayor a cero.");
        return;
    }

    setIsSubmitting(true);
    try {
      await sportsService.create(formData);
      setIsDialogOpen(false);
      fetchSports(); // Refrescar lista tras el alta
    } catch (err: any) {
      alert(err.message || "Error al guardar el deporte");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Gestión de Deportes</Heading>
            <Text color="fg.muted" fontSize="md">
              Consulta las disciplinas disponibles y registra nuevas actividades.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchSports} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="cyan" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Deporte
            </Button>
          </HStack>
        </Flex>

        {/* Modal Únicamente para Alta */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Deporte</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Nombre del Deporte" required>
                  <Input 
                    placeholder="Ej. Básquet" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Descripción" required>
                  <Input 
                    placeholder="Detalles de la disciplina" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Field>
                <HStack gap="4" width="full">
                    <Field label="Capacidad Máxima" required>
                        <Input 
                            type="number"
                            min="1"
                            value={formData.max_capacity}
                            onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                            required
                        />
                    </Field>
                    <Field label="Precio Adicional" required>
                        <Input 
                            type="number"
                            step="0.01"
                            value={formData.additional_price}
                            onChange={(e) => setFormData({ ...formData, additional_price: parseFloat(e.target.value) })}
                            required
                        />
                    </Field>
                </HStack>
                <Field label="Requisitos de ingreso">
                    <Checkbox 
                        colorPalette="cyan"
                        // Usamos 'checked' para el estado booleano
                        checked={formData.requires_medical_certificate}
                        // Sincronizamos con tu estado de React
                        onCheckedChange={(e) => 
                        setFormData({ 
                            ...formData, 
                            requires_medical_certificate: !!e.checked 
                        })
                        }
                    >
                        <Text fontSize="sm">Requiere Certificado Médico</Text>
                    </Checkbox>
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="cyan" loading={isSubmitting}>
                Crear Deporte
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
                  <Table.ColumnHeader py="4">Deporte</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Descripción</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Capacidad</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Precio Adicional</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Certificado</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sports.map((sport) => (
                  <Table.Row key={sport.id}>
                    <Table.Cell fontWeight="bold">{sport.name}</Table.Cell>
                    <Table.Cell color="fg.muted">{sport.description}</Table.Cell>
                    <Table.Cell>{sport.max_capacity}</Table.Cell>
                    <Table.Cell>${sport.additional_price}</Table.Cell>
                    <Table.Cell>
                        <Box px="2" py="0.5" borderRadius="md" fontSize="xs" fontWeight="bold" 
                             bg={sport.requires_medical_certificate ? "red.50" : "green.50"} 
                             color={sport.requires_medical_certificate ? "red.700" : "green.700"}>
                          {sport.requires_medical_certificate ? "SÍ" : "NO"}
                        </Box>
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