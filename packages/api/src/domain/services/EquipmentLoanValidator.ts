export class EquipmentLoanValidator {
  
  validateDueDateIsFuture(dueDate: string | Date): void {
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    
    // Setear horas a 0 para comparar solo días (opcional, pero buena práctica para due_date)
    dueDateObj.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    if (dueDateObj <= now) {
      throw new Error('La fecha de devolución debe ser posterior a la fecha actual');
    }
  }

  validateStatus(status: string): void {
    const validStatuses = ['Loaned', 'Returned', 'Damaged'];
    if (!validStatuses.includes(status)) {
      throw new Error('Estado de prestamo invalido');
    }
  }
}
