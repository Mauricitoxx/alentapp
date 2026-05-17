import { 
  Button, 
  Heading, 
  Stack, 
  Text, 
  Box,
  Flex,
  Input,
  Table
} from "@chakra-ui/react";
import { LuCheck, LuPlus, LuRotateCw } from "react-icons/lu";
import { useState, useEffect } from "react";
import { lockersService } from "../services/lockers";
import type { CreateLockerRequest } from "@alentapp/shared";
import { Field } from "../components/ui/field";
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

interface Locker {
  id: string | number;
  number: number;
  location: string;
  status?: string;
}

export function LockersView() {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    location: "",
  });

  const fetchLockers = async () => {
    setIsLoadingList(true);
    setError(null);
    try {
      const data = await lockersService.getAll();
      setLockers(data || []);
    } catch (err: any) {
      console.error("Error al listar casilleros:", err);
      setError("No se pudieron cargar los casilleros.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLockers();
  }, []);

  const openCreateModal = () => {
    setError(null);
    setSuccess(false);
    setFormData({ number: "", location: "" });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const parsedNumber = parseInt(formData.number, 10);

    if (isNaN(parsedNumber) || parsedNumber <= 0) {
      setError("Está ingresando un valor negativo o un valor que es igual a cero, por lo cual no es válido.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.location.trim()) {
      setError("La ubicación no puede estar vacía. Debe completar la ubicación para poder crear el casillero.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: CreateLockerRequest = {
        number: parsedNumber,
        location: formData.location.trim(),
      };

      await lockersService.create(payload);
      
      setSuccess(true);
      setFormData({ number: "", location: "" }); 
      await fetchLockers();
      
      setTimeout(() => {
        setIsDialogOpen(false);
        setSuccess(false);
      }, 1200);

    } catch (err: any) {
      setError(err.message || "Error al crear el casillero");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="6" w="full" mt="4">
        
        {/* CABECERA PRINCIPAL */}
        <Flex justify="space-between" align="center" w="full" wrap="wrap" gap="4">
          <Stack gap="1">
            <Heading size="3xl" fontWeight="bold">Gestión de Casilleros</Heading>
            <Text color="fg.muted" fontSize="sm">
              Consulta los casilleros disponibles y registra nuevas ubicaciones.
            </Text>
          </Stack>
          
          <Flex gap="3" ml="auto">
            <Button 
              variant="outline" 
              onClick={fetchLockers} 
              loading={isLoadingList}
            >
              <LuRotateCw style={{ marginRight: '8px' }} /> Actualizar
            </Button>
            <Button 
              colorPalette="blue" 
              onClick={openCreateModal}
            >
              <LuPlus style={{ marginRight: '8px' }} /> Agregar Casillero
            </Button>
          </Flex>
        </Flex>

        {/* VENTANITA / MODAL EMERGENTE */}
        <DialogContent>
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Casillero</DialogTitle>
            </DialogHeader>
            
            <DialogBody>
              <Stack gap="4">
                {success && (
                  <Box p="4" bg="green.50" color="green.700" borderRadius="md" border="1px solid" borderColor="green.200">
                    <Text fontWeight="bold">¡Casillero creado con éxito!</Text>
                  </Box>
                )}

                {error && (
                  <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                    <Text fontWeight="bold">Error de validación:</Text>
                    <Text>{error}</Text>
                  </Box>
                )}

                <Field label="Número de Casillero" required>
                  <Input 
                    type="number" 
                    min="1"          
                    step="1"         
                    placeholder="Ej. 104" 
                    value={formData.number}
                    onChange={(e) => {
                      setFormData({ ...formData, number: e.target.value });
                      setError(null); 
                      setSuccess(false);
                    }}
                  />
                </Field>

                <Field label="Localidad / Ubicación" required>
                  <Input 
                    placeholder="Ej. Pasillo Central - Planta Alta" 
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({ ...formData, location: e.target.value });
                      setError(null);
                      setSuccess(false);
                    }}
                  />
                </Field>
              </Stack>
            </DialogBody>

            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                <LuCheck style={{ marginRight: '8px' }} /> Crear Casillero
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        {/* CONTENEDOR DE LA TABLA CON ESTILO GRIS DE MIEMBROS */}
        <Box 
          bg="bg.panel" 
          borderRadius="xl" 
          boxShadow="sm" 
          borderWidth="1px" 
          overflow="hidden"
          position="relative"
        >
          <Table.Root size="md" variant="line" interactive>
            <Table.Header bg="bg.muted/50">
              <Table.Row>
                <Table.ColumnHeader py="4" fontWeight="bold">Casillero</Table.ColumnHeader>
                <Table.ColumnHeader py="4" fontWeight="bold">Ubicación / Localidad</Table.ColumnHeader>
                <Table.ColumnHeader py="4" fontWeight="bold">Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {isLoadingList ? (
                <Table.Row>
                  <Table.Cell colSpan={3} textAlign="center" py="8" color="fg.muted">
                    Cargando casilleros...
                  </Table.Cell>
                </Table.Row>
              ) : lockers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={3} textAlign="center" py="12" color="fg.muted">
                    <Text fontWeight="medium">No se encontraron casilleros.</Text>
                    <Button variant="ghost" size="sm" mt="2" onClick={openCreateModal}>
                      Crear el primero
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ) : (
                lockers.map((locker) => (
                  <Table.Row key={locker.id} _hover={{ bg: "bg.muted/30" }}>
                    <Table.Cell fontWeight="semibold" color="fg.emphasized">
                      {locker.number}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{locker.location}</Table.Cell>
                    <Table.Cell>
                      <Box 
                        display="inline-block" 
                        px="2" 
                        py="0.5" 
                        borderRadius="md" 
                        fontSize="xs" 
                        fontWeight="bold"
                        bg="green.50" 
                        color="green.700"
                      >
                       {locker.status === "Available" || !locker.status ? "Disponible" : locker.status}
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      </Stack>
    </DialogRoot>
  );
}