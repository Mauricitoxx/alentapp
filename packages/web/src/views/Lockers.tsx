import { 
  Button, 
  Heading, 
  Stack, 
  Text, 
  Box,
  Flex,
  Input
} from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import { useState } from "react";
import { lockersService } from "../services/lockers";
import type { CreateLockerRequest } from "@alentapp/shared";
import { Field } from "../components/ui/field";

export function LockersView() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    number: "",
    location: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const parsedNumber = parseInt(formData.number, 10);

    // 🛑 VALIDACIÓN 1: Detectar si es negativo o igual a cero
    if (isNaN(parsedNumber) || parsedNumber <= 0) {
      setError("Está ingresando un valor negativo o un valor que es igual a cero, por lo cual no es válido.");
      setIsSubmitting(false);
      return;
    }

    // 🛑 VALIDACIÓN 2: Si la ubicación está vacía
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
    } catch (err: any) {
      setError(err.message || "Error al crear el casillero");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack gap="8" maxW="xl" mx="auto" mt="4">
      <Stack gap="4">
        <Heading size="2xl" fontWeight="bold">Registrar Nuevo Casillero</Heading>
        <Text color="fg.muted" fontSize="md">
          Registra un nuevo casillero con su número correspondiente y la ubicación exacta donde se encuentra.
        </Text>
      </Stack>

      <Box 
        bg="bg.panel" 
        borderRadius="xl" 
        boxShadow="sm" 
        borderWidth="1px" 
        p="6"
      >
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="5">
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
                // 👇 Modificado: Al borrar o escribir, limpia el error inmediatamente
                onChange={(e) => {
                  setFormData({ ...formData, number: e.target.value });
                  setError(null); 
                  setSuccess(false); // Por si venía de un éxito anterior
                }}
              />
            </Field>

            <Field label="Localidad / Ubicación" required>
              <Input 
                placeholder="Ej. Pasillo Central - Planta Alta" 
                value={formData.location}
                // 👇 Modificado: También limpia si estabas corrigiendo la ubicación
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  setError(null);
                  setSuccess(false);
                }}
              />
            </Field>

            <Flex justify="flex-end" mt="2">
              <Button type="submit" colorPalette="blue" size="md" loading={isSubmitting}>
                <LuCheck /> Crear Casillero
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Stack>
  );
}