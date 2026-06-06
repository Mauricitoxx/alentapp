//  inicializar OpenTelemetry (antes de cualquier otro import)
import './infrastructure/telemetry.js';

import Fastify from 'fastify';
import cors from '@fastify/cors';

// Imports de Socios
import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';

// Imports de Casilleros (Lockers)
import { PostgresLockerRepository } from './infrastructure/PostgresLockerRepository.js';
import { LockerValidator } from './domain/services/LockerValidator.js';
import { NewLockerUseCase } from './application/NewLockerUseCase.js';
import { GetLockersUseCase } from './application/GetLockersUseCase.js'; 
import { UpdateLockerUseCase } from './application/UpdateLockerUseCase.js'; // 🌟 AGREGADO
import { DeleteLockerUseCase } from './application/DeleteLockerUseCase.js';
import { LockerController } from './delivery/LockerController.js';

// Discipline
import { PostgresDisciplineRepository } from './infrastructure/PostgresDisciplineRepository.js';
import { DisciplineValidator } from './domain/services/DisciplineValidator.js';
import { CreateDisciplineUseCase } from './application/CreateDisciplineUseCase.js';
import { GetDisciplinesUseCase } from './application/GetDisciplinesUseCase.js';
import { DisciplineController } from './delivery/DisciplineController.js';
import { UpdateDisciplineUseCase } from './application/UpdateDisciplineUseCase.js';
import { DeleteDisciplineUseCase } from './application/DeleteDisciplineUseCase.js';

// Sport
import { PostgresSportRepository } from './infrastructure/PostgresSportRepository.js';
import { CreateSportUseCase } from './application/NewSportUseCase.js';
import { GetSportsUseCase } from './application/GetSportsUseCase.js';
import { SportController } from './delivery/SportController.js';
import { SportValidator } from './domain/services/SportValidator.js';
import { UpdateSportUseCase } from './application/UpdateSportUseCase.js';
import { DeleteSportUseCase } from './application/DeleteSportUseCase.js';

// Importaciones Equipment Loan
import { PostgresEquipmentLoanRepository } from './infrastructure/PostgresEquipmentLoanRepository.js';
import { EquipmentLoanValidator } from './domain/services/EquipmentLoanValidator.js';
import { CreateEquipmentLoanUseCase } from './application/NewEquipmentLoanUseCase.js';
import { GetEquipmentLoansUseCase } from './application/GetEquipmentLoansUseCase.js';
import { UpdateEquipmentLoanUseCase } from './application/UpdateEquipmentLoanUseCase.js';
import { DeleteEquipmentLoanUseCase } from './application/DeleteEquipmentLoanUseCase.js';
import { EquipmentLoanController } from './delivery/EquipmentLoanController.js';

// Métricas RED (OpenTelemetry)
import { metrics } from '@opentelemetry/api';

export function buildApp() {
    
    const server = Fastify({
        logger: {
            level: 'info',
            transport: process.env.NODE_ENV === 'development' 
            ? {
                target: 'pino-pretty',
                options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                } 
            : undefined,
        },
    });

    const meter = metrics.getMeter('alentapp-api');
    const requestCounter = meter.createCounter('http.server.requests', {
        description: 'Total de requests HTTP',
    });
    const errorCounter = meter.createCounter('http.server.errors', {
        description: 'Total de respuestas 4xx/5xx',
    });
    const requestDuration = meter.createHistogram('http.server.request.duration', {
        description: 'Duración de requests',
        unit: 'ms',
    });

    server.addHook('onRequest', async (req) => {
        (req as any).__start = process.hrtime.bigint();
    });
    server.addHook('onResponse', async (req, reply) => {
        const method = req.method;
        const route = (req as any).routeOptions?.url ?? req.url.split('?')[0];
        const status = String(reply.statusCode);
        requestCounter.add(1, { method, route, status });
        if (reply.statusCode >= 400) errorCounter.add(1, { method, route, status });
        const start = (req as any).__start;
        if (start) {
            const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
            requestDuration.record(ms, { method, route });
        }
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    // ----------------------------------------------------------------
    // 1. CABLEADO DE CAPAS (DEPENDENCY INJECTION)
    // ----------------------------------------------------------------

    // Miembros / Socios
    const memberRepo = new PostgresMemberRepository();
    const memberValidator = new MemberValidator(memberRepo);
    
    const createMemberUseCase = new CreateMemberUseCase(memberRepo, memberValidator);
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(memberRepo, memberValidator);
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);

    const memberController = new MemberController(
        createMemberUseCase, 
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase
    );

    // Discipline (Sanciones)
    const disciplineRepo = new PostgresDisciplineRepository();
    const disciplineValidator = new DisciplineValidator();

    const createDisciplineUseCase = new CreateDisciplineUseCase(
        disciplineRepo,
        memberRepo,
        disciplineValidator,
    );
    const getDisciplinesUseCase = new GetDisciplinesUseCase(disciplineRepo);
    const updateDisciplineUseCase = new UpdateDisciplineUseCase(disciplineRepo, disciplineValidator);
    const deleteDisciplineUseCase = new DeleteDisciplineUseCase(disciplineRepo, memberRepo);

    const disciplineController = new DisciplineController(
        createDisciplineUseCase,
        getDisciplinesUseCase,
        updateDisciplineUseCase,
        deleteDisciplineUseCase,
    );

    // Deportes (Sports)
    const sportRepo = new PostgresSportRepository();
    const sportValidator = new SportValidator(sportRepo);
    const createSportUseCase = new CreateSportUseCase(sportRepo, sportValidator);
    const getSportsUseCase = new GetSportsUseCase(sportRepo);
    const updateSportUseCase = new UpdateSportUseCase(sportRepo, sportValidator);
    const deleteSportUseCase = new DeleteSportUseCase(sportRepo);

    const sportController = new SportController(
        createSportUseCase,
        getSportsUseCase,
        updateSportUseCase,
        deleteSportUseCase
    );

    // Equipment Loans (Préstamos)
    const equipmentLoanRepo = new PostgresEquipmentLoanRepository();
    const equipmentLoanValidator = new EquipmentLoanValidator();
    const createEquipmentLoanUseCase = new CreateEquipmentLoanUseCase(
        equipmentLoanRepo, 
        memberRepo, 
        equipmentLoanValidator
    );
    const getEquipmentLoansUseCase = new GetEquipmentLoansUseCase(equipmentLoanRepo);
    const updateEquipmentLoanUseCase = new UpdateEquipmentLoanUseCase(equipmentLoanRepo, equipmentLoanValidator);
    const deleteEquipmentLoanUseCase = new DeleteEquipmentLoanUseCase(equipmentLoanRepo);

    const equipmentLoanController = new EquipmentLoanController(
        createEquipmentLoanUseCase,
        getEquipmentLoansUseCase,
        updateEquipmentLoanUseCase,
        deleteEquipmentLoanUseCase
    );

    // Casilleros (Lockers)
    const lockerRepo = new PostgresLockerRepository();
    const lockerValidator = new LockerValidator(lockerRepo);
    
    const newLockerUseCase = new NewLockerUseCase(lockerRepo, lockerValidator);
    const getLockersUseCase = new GetLockersUseCase(lockerRepo); 
    const updateLockerUseCase = new UpdateLockerUseCase(lockerRepo, lockerValidator); // 🌟 AGREGADO
    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepo);
    
    // Pasamos los casos de uso al controlador
    const lockerController = new LockerController(newLockerUseCase, getLockersUseCase, updateLockerUseCase, deleteLockerUseCase);

    // ----------------------------------------------------------------
    // 2. REGISTRO DE RUTAS EN EL SERVIDOR
    // ----------------------------------------------------------------
    
    // Endpoints de Socios
    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    // Endpoints de Deportes
    server.get('/api/v1/sports', sportController.getAll.bind(sportController));
    server.post('/api/v1/sports', sportController.create.bind(sportController));
    server.put('/api/v1/sports/:id', sportController.update.bind(sportController));
    server.delete('/api/v1/sports/:id', sportController.delete.bind(sportController));

    // Endpoints de Equipment Loans
    server.get('/api/v1/equipment-loans', equipmentLoanController.getAll.bind(equipmentLoanController));
    server.post('/api/v1/equipment-loans', equipmentLoanController.create.bind(equipmentLoanController));
    server.put('/api/v1/equipment-loans/:id', equipmentLoanController.update.bind(equipmentLoanController));
    server.delete('/api/v1/equipment-loans/:id', equipmentLoanController.delete.bind(equipmentLoanController))

    // Endpoints de Disciplinas (SÓLO QUEDAN ESTAS)
    server.get('/api/v1/disciplines', disciplineController.getAll.bind(disciplineController));
    server.post('/api/v1/disciplines', disciplineController.create.bind(disciplineController));
    server.put('/api/v1/disciplines/:id', disciplineController.update.bind(disciplineController));
    server.delete('/api/v1/disciplines/:id', disciplineController.delete.bind(disciplineController));

    // Endpoints de Casilleros
    server.get('/api/v1/lockers', lockerController.getAll.bind(lockerController)); 
    server.post('/api/v1/lockers', lockerController.create.bind(lockerController));
    server.put('/api/v1/lockers/:id', lockerController.update.bind(lockerController)); // 🌟 AGREGADO
    server.delete('/api/v1/lockers/:id', lockerController.delete.bind(lockerController));

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    return server;
}

if (process.argv[1] && (process.argv[1].endsWith('app.ts') || process.argv[1].endsWith('app.js'))) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`)
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}