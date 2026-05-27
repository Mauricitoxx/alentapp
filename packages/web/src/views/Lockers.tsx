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
import { LuCheck, LuPlus, LuRotateCw, LuPencil, LuTrash2, LuSearch, LuFilter } from "react-icons/lu"; 
import { useState, useEffect, useRef } from "react";
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
  
  // Modales independientes
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingLockerId, setEditingLockerId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  
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
  
  // Estado inicial del formulario de Alta según TDD-010
  const [formData, setFormData] = useState({
    number: "",
    location: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // =========================================================================
  // 🎨 ESTADOS Y REFS DE CONTROL DE UX PARA LOS DESPLEGABLES PERSONALIZADOS
  // =========================================================================
  const [showCreateSuggestions, setShowCreateSuggestions] = useState(false);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);

  // Expresión regular: Asegura que empiece con letras y previene strings numéricos, emails o basura aislada
  const formatoUbicacionValido = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]*$/;

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

    // Cerrar los desplegables si se hace click afuera del input o del menú
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setShowCreateSuggestions(false);
      }
      if (editMenuRef.current && !editMenuRef.current.contains(event.target as Node)) {
        setShowEditSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Opciones base fijas combinadas con el historial limpio de la DB sin duplicados
  const obtenerSugerenciasUbicacion = () => {
    const sugerenciasBase = ["Vestuario Masculino", "Vestuario Femenino", "Vestuario Niños"];
    const desdeBaseDatos = lockers
      .map(l => l.location)
      .filter(loc => loc && loc.trim().length >= 4 && isNaN(Number(loc)) && formatoUbicacionValido.test(loc));
    
    return Array.from(new Set([...sugerenciasBase, ...desdeBaseDatos]));
  };

  const sugerenciasFinales = obtenerSugerenciasUbicacion();

  const openCreateModal = () => {
    setError(null);
    setSuccess(false);
    setFormData({ number: "", location: "" });
    setShowCreateSuggestions(false);
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
    setShowEditSuggestions(false);
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
      setError("El número de casillero debe ser un entero positivo.");
      setIsSubmitting(false);
      return;
    }

    const ubicacionTrimmed = formData.location.trim();
    if (!ubicacionTrimmed) {
      setError("La ubicación del casillero es obligatoria.");
      setIsSubmitting(false);
      return;
    }

    if (ubicacionTrimmed.length < 4 || !formatoUbicacionValido.test(ubicacionTrimmed) || !isNaN(Number(ubicacionTrimmed))) {
      setError("La ubicación debe ser un texto descriptivo válido (mínimo 4 caracteres y no puede ser un número).");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: CreateLockerRequest = {
        number: parsedNumber,
        location: ubicacionTrimmed,
        status: "Available" // Requisito TDD: Por defecto Disponible
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
      const errorMsg = err.message || "";
      if (errorMsg.includes("409") || errorMsg.includes("already exists") || errorMsg.includes("ya existe")) {
        setError("Ya existe un casillero con el número proporcionado.");
      } else {
        setError(errorMsg || "Error interno, reintente más tarde.");
      }
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

    const ubicacionEditTrimmed = editFormData.location.trim();
    if (!ubicacionEditTrimmed) {
      setEditError("La ubicación no puede estar vacía.");
      setIsSubmitting(false);
      return;
    }

    if (ubicacionEditTrimmed.length < 4 || !formatoUbicacionValido.test(ubicacionEditTrimmed) || !isNaN(Number(ubicacionEditTrimmed))) {
      setEditError("La ubicación debe ser un texto descriptivo válido (mínimo 4 caracteres y no puede ser un número).");
      setIsSubmitting(false);
      return;
    }

    const memberIdTrimmed = editFormData.member_id.trim();
    const finalMemberId = memberIdTrimmed === "" ? null : memberIdTrimmed;
    const selectedStatus = editFormData.status;

    if (selectedStatus === "Occupied" && finalMemberId === null) {
      setEditError("Error: Un casillero en estado 'Ocupado' debe tener un miembro asignado.");
      setIsSubmitting(false);
      return;
    }

    if (selectedStatus === "Maintenance" && finalMemberId !== null) {
      setEditError("Error : No se puede asignar un socio a un casillero en mantenimiento.");
      setIsSubmitting(false);
      return;
    }

    if (selectedStatus === "Available" && finalMemberId !== null) {
      setEditError("Error: Un casillero en estado 'Disponible' no puede tener un miembro asignado.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (finalMemberId !== null) {
        const socioYaTieneLocker = lockers.some(
          (locker) => locker.member_id === finalMemberId && locker.id !== editingLockerId
        );

        if (socioYaTieneLocker) {
          setEditError("Este socio ya tiene un casillero asignado. Cada miembro puede tener un único casillero.");
          setIsSubmitting(false);
          return;
        }
      }

      const payload: UpdateLockerRequest = {
        number: parsedNumber,
        location: ubicacionEditTrimmed,
        status: selectedStatus as any,
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
      if (errorMsg.includes("Error interno") || errorMsg.includes("already exists") || errorMsg.includes("409") || errorMsg.includes("ya existe")) {
        setEditError("El número de casillero ya se encuentra en uso o está asignado a otra ubicación.");
      } else {
        setEditError(errorMsg || "Error al actualizar el casillero");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLockers = lockers.filter((locker) => {
    const matchesSearch = locker.number.toString().includes(searchQuery.trim());
    const matchesStatus = statusFilter === "All" || locker.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* SECCIÓN PRINCIPAL DE LA VISTA */}
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
            <Button variant="outline" onClick={fetchLockers} loading={isLoadingList}>
              <LuRotateCw style={{ marginRight: '8px' }} /> Actualizar
            </Button>
            <Button colorPalette="blue" onClick={openCreateModal}>
              <LuPlus style={{ marginRight: '8px' }} /> Agregar Casillero
            </Button>
          </Flex>
        </Flex>

        {/* BARRA DE BUSCADORES Y FILTROS */}
        <Flex gap="4" w="full" direction={{ base: "column", md: "row" }} align="center" mt="2">
          <Box position="relative" flex="1" w="full">
            <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" zIndex="1" color="fg.muted">
              <LuSearch size="16" />
            </Box>
            <Input
              placeholder="Buscar por número de casillero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              pl="10"
              bg="bg.panel"
              borderRadius="lg"
              borderWidth="1px"
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
            />
          </Box>

          <Flex align="center" gap="2" w={{ base: "full", md: "auto" }}>
            <Box color="fg.muted" display={{ base: "none", sm: "block" }}>
              <LuFilter size="16" />
            </Box>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                minWidth: '180px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: 'white',
                fontSize: '14px',
                fontWeight: 'medium',
                color: '#4A5568',
                cursor: 'pointer'
              }}
            >
              <option value="All">Todos los estados</option>
              <option value="Available">Disponible</option>
              <option value="Occupied">Ocupado</option>
              <option value="Maintenance">Mantenimiento</option>
            </select>
          </Flex>
        </Flex>

        {/* CONTENEDOR DE LA TABLA REESTRUCTURADO EN DOS COLUMNAS INDEPENDIENTES */}
        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden">
          <Table.Root size="md" variant="line" interactive>
            <Table.Header >
              <Table.Row bg="bg.muted/50">
                <Table.ColumnHeader py="4" fontWeight="bold">Casillero</Table.ColumnHeader>
                <Table.ColumnHeader py="4" fontWeight="bold">Ubicación del Casillero</Table.ColumnHeader>
                <Table.ColumnHeader py="4" fontWeight="bold">Estado</Table.ColumnHeader>
                <Table.ColumnHeader py="4" fontWeight="bold">Miembro</Table.ColumnHeader>
                <Table.ColumnHeader py="4" fontWeight="bold" textAlign="right">Acciones</Table.ColumnHeader> 
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {isLoadingList ? (
                <Table.Row>
                  <Table.Cell colSpan={5} textAlign="center" py="8" color="fg.muted">
                    Cargando casilleros...
                  </Table.Cell>
                </Table.Row>
              ) : filteredLockers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} textAlign="center" py="12" color="fg.muted">
                    <Text fontWeight="medium">
                      {lockers.length === 0 
                        ? "No se encontraron casilleros." 
                        : "No se encontraron casilleros que coincidan con la búsqueda."}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredLockers.map((locker) => {
                  const socioAsignado = locker.member_id 
                    ? members.find(m => m.id === locker.member_id) 
                    : null;

                  return (
                    <Table.Row key={locker.id} _hover={{ bg: "bg.muted/30" }}>
                      <Table.Cell fontWeight="semibold" color="fg.emphasized">{locker.number}</Table.Cell>
                      <Table.Cell color="fg.muted">{locker.location}</Table.Cell>
                      
                      {/* 🟢 COLUMNA ESTADO PURO */}
                      <Table.Cell py="3">
                        <Box 
                          display="inline-block" px="2" py="0.5" borderRadius="md" fontSize="xs" fontWeight="bold"
                          bg={locker.status === "Maintenance" ? "red.50" : locker.status === "Occupied" ? "orange.50" : "green.50"} 
                          color={locker.status === "Maintenance" ? "red.700" : locker.status === "Occupied" ? "orange.700" : "green.700"}
                        >
                          {locker.status === "Available" || !locker.status ? "Disponible" : locker.status === "Maintenance" ? "Mantenimiento" : "Ocupado"}
                        </Box>
                      </Table.Cell>

                      {/* 👤 COLUMNA MIEMBRO ASIGNADO CON RELLENADOR INTELIGENTE */}
                      <Table.Cell py="3">
                        {socioAsignado ? (
                          <Stack gap="0" direction="column">
                            <Text fontSize="xs" color="fg.emphasized" fontWeight="semibold" textTransform="capitalize">
                              👤 {socioAsignado.name} {socioAsignado.lastName || ''}
                            </Text>
                            <Text fontSize="10px" color="fg.muted" ml="4">DNI: {socioAsignado.dni}</Text>
                          </Stack>
                        ) : (
                          <Text fontSize="sm" color="gray.400" fontWeight="medium">—</Text>
                        )}
                      </Table.Cell>

                      <Table.Cell textAlign="right"> 
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(locker)}>
                          <LuPencil /> 
                        </Button>
                        <Button size="sm" variant="ghost" colorPalette="red" onClick={() => openDeleteModal(locker)}>
                          <LuTrash2 /> 
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

      {/* =========================================================================
          🆕 MODAL EMERGENTE PARA EL ALTA DE CASILLEROS (MAQUETACIÓN FINA UX/UI)
         ========================================================================= */}
      <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
        <DialogContent>
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Casillero</DialogTitle>
            </DialogHeader>
            
            <DialogBody>
              <Stack gap="4">
                {success && (
                  <Box p="4" bg="green.50" color="green.700" borderRadius="md" border="1px solid" borderColor="green.200">
                    <Text fontWeight="bold">¡Casillero registrado con éxito!</Text>
                  </Box>
                )}

                {error && (
                  <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                    <Text fontWeight="bold">Error en la operación:</Text>
                    <Text>{error}</Text>
                  </Box>
                )}

                <Field label="Número de Casillero" required>
                  <Input 
                    type="number" 
                    min="1"
                    placeholder="Ej: 14"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    autoComplete="off"
                  />
                </Field>

                <Field label="Ubicación del Casillero" required>
                  <Box position="relative" w="full" ref={createMenuRef}>
                    <Input 
                      placeholder="Ej: Vestuario Masculino"
                      value={formData.location}
                      onChange={(e) => {
                        setFormData({ ...formData, location: e.target.value });
                        setShowCreateSuggestions(true);
                      }}
                      onFocus={() => setShowCreateSuggestions(true)}
                      autoComplete="off" 
                    />
                    
                    {showCreateSuggestions && sugerenciasFinales.length > 0 && (
                      <Box
                        position="absolute"
                        top="100%"
                        left="0"
                        w="full"
                        bg="white"
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        boxShadow="lg"
                        mt="1"
                        zIndex="10"
                        maxH="200px"
                        overflowY="auto"
                      >
                        {sugerenciasFinales
                          .filter(sug => sug.toLowerCase().includes(formData.location.toLowerCase()))
                          .map((sugerencia) => (
                            <Box
                              key={sugerencia}
                              py="2"
                              px="3"
                              fontSize="sm"
                              color="gray.700"
                              _hover={{ bg: "gray.50", cursor: "pointer" }}
                              onMouseDown={() => {
                                setFormData({ ...formData, location: sugerencia });
                                setShowCreateSuggestions(false);
                              }}
                            >
                              {sugerencia}
                            </Box>
                          ))}
                      </Box>
                    )}
                  </Box>
                </Field>
              </Stack>
            </DialogBody>

            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                <LuCheck style={{ marginRight: '8px' }} /> Crear Casillero
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>
      </DialogRoot>

      {/* MODAL EMERGENTE PARA LA EDICIÓN (MAQUETACIÓN FINA UX/UI) */}
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
                    autoComplete="off"
                  />
                </Field>

                <Field label="Ubicación del Casillero" required>
                  <Box position="relative" w="full" ref={editMenuRef}>
                    <Input 
                      value={editFormData.location}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, location: e.target.value });
                        setShowEditSuggestions(true);
                      }}
                      onFocus={() => setShowEditSuggestions(true)}
                      autoComplete="off" 
                    />
                    
                    {showEditSuggestions && sugerenciasFinales.length > 0 && (
                      <Box
                        position="absolute"
                        top="100%"
                        left="0"
                        w="full"
                        bg="white"
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        boxShadow="lg"
                        mt="1"
                        zIndex="10"
                        maxH="200px"
                        overflowY="auto"
                      >
                        {sugerenciasFinales
                          .filter(sug => sug.toLowerCase().includes(editFormData.location.toLowerCase()))
                          .map((sugerencia) => (
                            <Box
                              key={sugerencia}
                              py="2"
                              px="3"
                              fontSize="sm"
                              color="gray.700"
                              _hover={{ bg: "gray.50", cursor: "pointer" }}
                              onMouseDown={() => {
                                setEditFormData({ ...editFormData, location: sugerencia });
                                setShowEditSuggestions(false);
                              }}
                            >
                              {sugerencia}
                            </Box>
                          ))}
                      </Box>
                    )}
                  </Box>
                </Field>

                <Field label="Estado del Casillero">
                  <select 
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E2E8F0', background: 'white', fontSize: '14px' }}
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
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #E2E8F0', background: 'white', fontSize: '14px', color: '#2D3748' }}
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
            <Text mt="2" fontSize="sm" color="fg.muted">Esta acción no se puede deshacer.</Text>
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