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
import { LuCheck, LuPlus, LuRotateCw, LuPencil, LuTrash2 } from "react-icons/lu"; 
import { useState, useEffect } from "react";
import { lockersService } from "../services/lockers";
import { membersService } from "../services/members"; 
import type { CreateLockerRequest, UpdateLockerRequest } from "@alentapp/shared"; 
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
  id: string; 
  number: number;
  location: string;
  status?: string;
  member_id?: string | null; 
}

export function LockersView() {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [members, setMembers] = useState<any[]>([]); 
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLockerId, setEditingLockerId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [lockerToDelete, setLockerToDelete] = useState<Locker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const [editFormData, setEditFormData] = useState({
    number: "",
    location: "",
    status: "Available",
    member_id: "" 
  });

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
      setLockers((data as any) || []);
    } catch (err: any) {
      console.error("Error al listar casilleros:", err);
      setError("No se pudieron cargar los casilleros.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLockers();
    
    if (typeof membersService !== "undefined" && membersService.getAll) {
      membersService.getAll()
        .then((data) => setMembers(data || []))
        .catch((err) => console.error("Error al cargar miembros en Casilleros:", err));
    }
  }, []);

  const openCreateModal = () => {
    setError(null);
    setSuccess(false);
    setFormData({ number: "", location: "" });
    setIsDialogOpen(true);
  };

  const openEditModal = (locker: Locker) => {
    setEditError(null);
    setEditSuccess(false);
    setEditingLockerId(locker.id);
    setEditFormData({
      number: locker.number.toString(),
      location: locker.location,
      status: locker.status || "Available",
      member_id: locker.member_id || "" 
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (locker: Locker) => {
    setDeleteError(null);
    setLockerToDelete(locker);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!lockerToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await lockersService.delete(lockerToDelete.id);
      setIsDeleteDialogOpen(false);
      setLockerToDelete(null);
      await fetchLockers();
    } catch (err: any) {
      setDeleteError(err.message || "Error al eliminar el casillero");
    } finally {
      setIsDeleting(false);
    }
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLockerId) return;

    setIsSubmitting(true);
    setEditError(null);
    setEditSuccess(false);

    const parsedNumber = parseInt(editFormData.number, 10);

    if (isNaN(parsedNumber) || parsedNumber < 1) {
      setEditError("El número de casillero debe ser un valor entero positivo mayor o igual a 1.");
      setIsSubmitting(false);
      return;
    }

    if (!editFormData.location.trim()) {
      setEditError("La ubicación no puede estar vacía.");
      setIsSubmitting(false);
      return;
    }

    try {
      const memberIdTrimmed = editFormData.member_id.trim();
      const finalMemberId = memberIdTrimmed === "" ? null : memberIdTrimmed;

      // 🌟 REGLA NUEVA: Validar un único casillero por socio
      if (finalMemberId !== null) {
        // Buscamos si el socio ya está asignado a OTRO casillero que no sea el actual
        const socioYaTieneLocker = lockers.some(
          (locker) => locker.member_id === finalMemberId && locker.id !== editingLockerId
        );

        if (socioYaTieneLocker) {
          setEditError("Este socio ya tiene un casillero asignado. Cada miembro puede tener un único casillero.");
          setIsSubmitting(false);
          return;
        }
      }

      // Automatización del estado a Ocupado si hay un socio seleccionado
      let finalStatus = editFormData.status;
      if (finalMemberId !== null) {
        finalStatus = "Occupied";
      }

      const payload: UpdateLockerRequest = {
        number: parsedNumber,
        location: editFormData.location.trim(),
        status: finalStatus as any,
        member_id: finalMemberId 
      };

      await lockersService.update(editingLockerId, payload);
      
      setEditSuccess(true);
      await fetchLockers();
      
      setTimeout(() => {
        setIsEditOpen(false);
        setEditSuccess(false);
      }, 1200);

    } catch (err: any) {
      const errorMsg = err.message || "";
      
      if (
        errorMsg.includes("Error interno") || 
        errorMsg.includes("already exists") || 
        errorMsg.includes("409") || 
        errorMsg.includes("ya existe") || 
        errorMsg.includes("unique")
      ) {
        setEditError("El número de casillero ya se encuentra en uso o está asignado a otra ubicación.");
      } else {
        setEditError(errorMsg || "Error al actualizar el casillero");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* MODAL DE ALTA ORIGINAL */}
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

          {/* VENTANITA / MODAL EMERGENTE DE ALTA */}
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
                  <Table.ColumnHeader py="4" fontWeight="bold">Estado / Miembro</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" fontWeight="bold" textAlign="right">Acciones</Table.ColumnHeader> 
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {isLoadingList ? (
                  <Table.Row>
                    <Table.Cell colSpan={4} textAlign="center" py="8" color="fg.muted">
                      Cargando casilleros...
                    </Table.Cell>
                  </Table.Row>
                ) : lockers.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={4} textAlign="center" py="12" color="fg.muted">
                      <Text fontWeight="medium">No se encontraron casilleros.</Text>
                      <Button variant="ghost" size="sm" mt="2" onClick={openCreateModal}>
                        Crear el primero
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  lockers.map((locker) => {
                    const socioAsignado = locker.member_id 
                      ? members.find(m => m.id === locker.member_id) 
                      : null;

                    return (
                      <Table.Row key={locker.id} _hover={{ bg: "bg.muted/30" }}>
                        <Table.Cell fontWeight="semibold" color="fg.emphasized">
                          {locker.number}
                        </Table.Cell>
                        <Table.Cell color="fg.muted">{locker.location}</Table.Cell>
                        <Table.Cell py="3">
                          <Stack align="flex-start" gap="1" direction="column">
                            <Box 
                              display="inline-block" 
                              px="2" 
                              py="0.5" 
                              borderRadius="md" 
                              fontSize="xs" 
                              fontWeight="bold"
                              bg={locker.status === "Maintenance" ? "red.50" : locker.status === "Occupied" ? "orange.50" : "green.50"} 
                              color={locker.status === "Maintenance" ? "red.700" : locker.status === "Occupied" ? "orange.700" : "green.700"}
                            >
                              {locker.status === "Available" || !locker.status ? "Disponible" : locker.status === "Maintenance" ? "Mantenimiento" : "Ocupado"}
                            </Box>
                            
                            {socioAsignado && (
                              <Stack gap="0" direction="column" mt="1">
                                <Text fontSize="xs" color="fg.emphasized" fontWeight="semibold">
                                  👤 {socioAsignado.name} {socioAsignado.lastName || ''}
                                </Text>
                                <Text fontSize="10px" color="fg.muted" ml="4">
                                  DNI: {socioAsignado.dni}
                                </Text>
                              </Stack>
                            )}
                          </Stack>
                        </Table.Cell>
                        <Table.Cell textAlign="right"> 
                          <Button size="sm" variant="ghost" onClick={() => openEditModal(locker)}>
                            <LuPencil /> Editar
                          </Button>
                          <Button size="sm" variant="ghost" colorPalette="red" onClick={() => openDeleteModal(locker)}>
                            <LuTrash2 /> Eliminar
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        </Stack>
      </DialogRoot>

      {/* MODAL EMERGENTE PARA LA EDICIÓN */}
      <DialogRoot open={isEditOpen} onOpenChange={(e) => setIsEditOpen(e.open)}>
        <DialogContent>
          <form onSubmit={handleEditSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>Modificar Casillero</DialogTitle>
            </DialogHeader>
            
            <DialogBody>
              <Stack gap="4">
                {editSuccess && (
                  <Box p="4" bg="green.50" color="green.700" borderRadius="md" border="1px solid" borderColor="green.200">
                    <Text fontWeight="bold">¡Casillero actualizado con éxito!</Text>
                  </Box>
                )}

                {editError && (
                  <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                    <Text fontWeight="bold">Error en la operación:</Text>
                    <Text>{editError}</Text>
                  </Box>
                )}

                <Field label="Número de Casillero" required>
                  <Input 
                    type="number" 
                    min="1"
                    value={editFormData.number}
                    onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                  />
                </Field>

                <Field label="Localidad / Ubicación" required>
                  <Input 
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  />
                </Field>

                <Field label="Estado del Casillero">
                  <select 
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      background: 'white',
                      fontSize: '14px'
                    }}
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  >
                    <option value="Available">Disponible</option>
                    <option value="Maintenance">Mantenimiento</option>
                    <option value="Occupied">Ocupado</option>
                  </select>
                </Field>

                <Field label="Socio Asignado (Identificado por DNI)">
                  <select 
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      background: 'white',
                      fontSize: '14px',
                      color: '#2D3748'
                    }}
                    value={editFormData.member_id}
                    onChange={(e) => setEditFormData({ ...editFormData, member_id: e.target.value })}
                  >
                    <option value="">-- Sin asignar / Casillero Libre --</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.lastName || ''} (DNI: {member.dni})
                      </option>
                    ))}
                  </select>
                </Field>
              </Stack>
            </DialogBody>

            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                <LuCheck style={{ marginRight: '8px' }} /> Guardar Cambios
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* MODAL EMERGENTE PARA ELIMINAR */}
      <DialogRoot open={isDeleteDialogOpen} onOpenChange={(e) => setIsDeleteDialogOpen(e.open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Casillero</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {deleteError && (
              <Box p="4" mb="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                <Text fontWeight="bold">Error en la operación:</Text>
                <Text>{deleteError}</Text>
              </Box>
            )}
            <Text>¿Estás seguro de que deseas eliminar el casillero <b>{lockerToDelete?.number}</b> de forma permanente?</Text>
            <Text mt="2" fontSize="sm" color="fg.muted">
              Esta acción no se puede deshacer.
            </Text>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            </DialogActionTrigger>
            <Button colorPalette="red" onClick={handleDelete} loading={isDeleting}>
              <LuTrash2 style={{ marginRight: '8px' }} /> Confirmar Eliminación
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </>
  );
}