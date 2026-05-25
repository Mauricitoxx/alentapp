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
  IconButton,
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuPencil, LuTrash2 } from "react-icons/lu";
import { useEffect, useState } from "react";
import { sportsService } from "../services/sports"; 
import type { SportDTO, CreateSportRequest, UpdateSportRequest } from "@alentapp/shared";
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
  
  // Estados para el Modal (Compartido para Alta y Edición)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSportId, setEditingSportId] = useState<string | null>(null);

  // Estado del formulario (Estructura base del Request)
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    max_capacity: number | "";
    additional_price: number | "";
    requires_medical_certificate: boolean;
  }>({
    name: "",
    description: "",
    max_capacity: "", // Inicia vacío
    additional_price: "", // Inicia vacío
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
    setEditingSportId(null); // Modo alta
    setFormData({ 
      name: "", 
      description: "", 
      max_capacity: "", 
      additional_price: "", 
      requires_medical_certificate: false 
    });
    setIsDialogOpen(true);
  };

  const openEditModal = (sport: SportDTO) => {
    setEditingSportId(sport.id); // Modo edición
    setFormData({
      name: sport.name,
      description: sport.description,
      max_capacity: sport.max_capacity,
      additional_price: sport.additional_price,
      requires_medical_certificate: sport.requires_medical_certificate,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSport = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el deporte "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await sportsService.delete(id);
        fetchSports(); 
      } catch (err: any) {
        alert(err.message || "Error al eliminar el deporte");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de Regla de Negocio en Frontend
    const capacityValue = formData.max_capacity === "" ? 0 : Number(formData.max_capacity);
    const priceValue = formData.additional_price === "" ? 0 : Number(formData.additional_price);
    
    if (capacityValue <= 0) {
        alert("La capacidad máxima debe ser mayor a cero.");
        return;
    }

    setIsSubmitting(true);
    try {
      if (editingSportId) {
        // Mapeo estricto para actualizar según la regla de negocio
        const updateData: UpdateSportRequest = {
          description: formData.description,
          max_capacity: capacityValue,
        };
        await sportsService.update(editingSportId, updateData);
      } else {
        // Estructura completa para dar de alta
        const createData: CreateSportRequest = {
          ...formData,
          max_capacity: capacityValue,
          additional_price: priceValue,
        };
        await sportsService.create(createData);
      }
      setIsDialogOpen(false);
      fetchSports(); // Refrescar lista tras el éxito
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
              Consulta las disciplinas disponibles y administra las configuraciones de las actividades.
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

        {/* Modal Único Reutilizable */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSportId ? `Editar Deporte: ${formData.name}` : "Registrar Nuevo Deporte"}
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                
                {/* REGLA DE NEGOCIO: Bloqueado en Edición */}
                <Field label="Nombre del Deporte" required>
                  <Input 
                    placeholder="Ej. Básquet" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!!editingSportId}
                    required
                  />
                </Field>

                {/* Siempre Editable */}
                <Field label="Descripción" required>
                  <Input 
                    placeholder="Detalles de la disciplina" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Field>

                <HStack gap="4" width="full">
                    {/* Siempre Editable */}
                    <Field label="Capacidad Máxima" required>
                        <Input 
                            type="number"
                            placeholder="0"
                            value={formData.max_capacity}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({ 
                                ...formData, 
                                max_capacity: val === "" ? "" : parseInt(val, 10)
                              });
                            }}
                            required
                        />
                    </Field>

                    {/* REGLA DE NEGOCIO: Bloqueado en Edición */}
                    <Field label="Precio Adicional" required>
                        <Input 
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.additional_price}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({ 
                                ...formData, 
                                additional_price: val === "" ? "" : parseFloat(val)
                              });
                            }}
                            disabled={!!editingSportId}
                            required
                        />
                    </Field>
                </HStack>

                {/* REGLA DE NEGOCIO: Bloqueado en Edición */}
                <Field label="Requisitos de ingreso">
                    <Checkbox 
                        colorPalette="cyan"
                        checked={formData.requires_medical_certificate}
                        disabled={!!editingSportId}
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
                {editingSportId ? "Guardar Cambios" : "Crear Deporte"}
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

        {/* Tabla Principal */}
        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden">
          {isLoading ? (
            <Center h="300px"><Spinner size="xl" color="cyan.500" /></Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Deporte</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Descripción</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Capacidad</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Precio Adicional</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Certificado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sports.map((sport) => (
                  <Table.Row key={sport.id} _hover={{ bg: "bg.muted/30" }}>
                    <Table.Cell fontWeight="bold">{sport.name}</Table.Cell>
                    <Table.Cell color="fg.muted">{sport.description}</Table.Cell>
                    <Table.Cell>{sport.max_capacity}</Table.Cell>
                    <Table.Cell>${sport.additional_price}</Table.Cell>
                    <Table.Cell>
                        <Box px="2" py="0.5" display="inline-block" borderRadius="md" fontSize="xs" fontWeight="bold" 
                             bg={sport.requires_medical_certificate ? "red.50" : "green.50"} 
                             color={sport.requires_medical_certificate ? "red.700" : "green.700"}>
                          {sport.requires_medical_certificate ? "SÍ" : "NO"}
                        </Box>
                    </Table.Cell>
                    {/* Nueva columna de acciones idéntica a MembersView */}
                    <Table.Cell textAlign="end">
                      <HStack gap="2" justify="flex-end">
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          aria-label="Editar deporte"
                          onClick={() => openEditModal(sport)}
                        >
                          <LuPencil />
                        </IconButton>
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          colorPalette="red" 
                          aria-label="Eliminar deporte"
                          onClick={() => handleDeleteSport(sport.id, sport.name)}
                        >
                          <LuTrash2 />
                        </IconButton>
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