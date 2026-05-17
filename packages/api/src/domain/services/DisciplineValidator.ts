export class DisciplineValidator {
    validateDates(startDate: string | Date, endDate: string | Date): void {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end <= start) {
            throw new Error('La fecha de fin debe ser estrictamente posterior a la de inicio');
        }
    }
}