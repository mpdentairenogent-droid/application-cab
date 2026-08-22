-- CreateEnum
CREATE TYPE "GlobalRoleKey" AS ENUM ('SUPER_ADMIN', 'GERANT', 'SECRETAIRE', 'MONITEUR');

-- CreateEnum
CREATE TYPE "PermissionCategory" AS ENUM ('ORGANISATION', 'ELEVES', 'DOCUMENTS', 'PAIEMENTS', 'PLANNING', 'EXAMENS', 'SALARIES', 'CONGES', 'VEHICULES', 'FINANCES', 'RAPPORTS', 'PARAMETRES');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIF', 'SUSPENDU', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'ARCHIVE', 'UNARCHIVE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'VALIDATE', 'REFUSE', 'ASSIGN', 'UNASSIGN', 'TRANSFER', 'EXPORT');

-- CreateEnum
CREATE TYPE "Civility" AS ENUM ('M', 'MME');

-- CreateEnum
CREATE TYPE "LicenseCategory" AS ENUM ('AM', 'A1', 'A2', 'A', 'B1', 'B', 'BE', 'C1', 'C1E', 'C', 'CE', 'D1', 'D1E', 'D', 'DE');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('TRADITIONNELLE', 'CONDUITE_ACCOMPAGNEE', 'CONDUITE_SUPERVISEE', 'ACCELEREE');

-- CreateEnum
CREATE TYPE "StudentFileStatus" AS ENUM ('INCOMPLET', 'COMPLET', 'EN_VALIDATION', 'VALIDE');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIF', 'SUSPENDU', 'TERMINE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('EN_COURS', 'TERMINE', 'ABANDONNE', 'ANNULE');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('CONDUITE', 'CODE', 'EVALUATION', 'EXAMEN_BLANC', 'PERFECTIONNEMENT');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('PLANIFIEE', 'CONFIRMEE', 'REALISEE', 'ANNULEE_ELEVE', 'ANNULEE_ECOLE', 'ABSENCE_ELEVE', 'ABSENCE_MONITEUR');

-- CreateEnum
CREATE TYPE "ExamAllocationStatus" AS ENUM ('ACTIVE', 'CLOTUREE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "ExamSlotStatus" AS ENUM ('DISPONIBLE', 'RESERVEE', 'CONFIRMEE', 'CONSOMMEE', 'ANNULEE', 'PERDUE');

-- CreateEnum
CREATE TYPE "ExamCandidateStatus" AS ENUM ('LISTE_ATTENTE', 'AFFECTE', 'CONFIRME', 'CONSOMME', 'ANNULE');

-- CreateEnum
CREATE TYPE "ExamResult" AS ENUM ('REUSSI', 'ECHEC', 'ABSENT', 'ANNULE');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIF', 'ABSENT', 'SORTI', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CDI', 'CDD', 'APPRENTISSAGE', 'PROFESSIONNALISATION', 'STAGE', 'INDEPENDANT');

-- CreateEnum
CREATE TYPE "PayBasis" AS ENUM ('HORAIRE', 'MENSUEL');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIF', 'TERMINE', 'AVENANT');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('CONGES_PAYES', 'RTT', 'MALADIE', 'SANS_SOLDE', 'FORMATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "HalfDayPeriod" AS ENUM ('AUCUNE', 'MATIN', 'APRES_MIDI');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REFUSE', 'ANNULE');

-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('BROUILLON', 'SOUMIS', 'VALIDE');

-- CreateEnum
CREATE TYPE "PayrollPaymentStatus" AS ENUM ('EN_ATTENTE', 'PAYE');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('ESSENCE', 'DIESEL', 'ELECTRIQUE', 'HYBRIDE', 'GPL');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUELLE', 'AUTOMATIQUE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DISPONIBLE', 'EN_SERVICE', 'IMMOBILISE', 'EN_ENTRETIEN', 'HORS_SERVICE', 'CEDE');

-- CreateEnum
CREATE TYPE "FinancingMode" AS ENUM ('COMPTANT', 'CREDIT', 'LOCATION', 'LOA', 'LLD', 'LEASING');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('ENTRETIEN_PROGRAMME', 'VIDANGE', 'PNEUS', 'REPARATION', 'SINISTRE', 'NETTOYAGE', 'CONTROLE_TECHNIQUE');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DECLARE', 'EN_COURS', 'CLOTURE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ESPECES', 'CB', 'VIREMENT', 'CHEQUE', 'PRELEVEMENT', 'FINANCEMENT_CPF', 'AUTRE');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PAIEMENT', 'REMBOURSEMENT', 'AVOIR');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE', 'ANNULE');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SALAIRES', 'LOYER', 'LEASING', 'CARBURANT', 'ASSURANCE', 'ENTRETIEN', 'FOURNISSEURS', 'FRAIS_ADMINISTRATIFS', 'AUTRE');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PIECE_IDENTITE', 'JUSTIFICATIF_DOMICILE', 'PHOTO', 'ASSR', 'RECENSEMENT', 'JDC', 'PERMIS_EXISTANT', 'MANDAT_CONTRAT', 'CONTRAT_TRAVAIL', 'DIPLOME_QUALIFICATION', 'CONTRAT_VEHICULE', 'ASSURANCE_VEHICULE', 'FACTURE_ENTRETIEN', 'BULLETIN_PAIE', 'JUSTIFICATIF_CONGE', 'PIECE_EXAMEN', 'RECU_PAIEMENT', 'AUTRE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DOSSIER_INCOMPLET', 'DOCUMENT_EXPIRATION', 'EXAMEN_PROCHE', 'PLACE_NON_AFFECTEE', 'IMPAYE', 'CONTRAT_ECHEANCE', 'ENTRETIEN_A_PREVOIR', 'DEMANDE_CONGE', 'CONFLIT_PLANNING', 'VEHICULE_IMMOBILISE');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'ATTENTION', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('NON_LUE', 'LUE', 'TRAITEE', 'IGNOREE');

-- CreateEnum
CREATE TYPE "TransferEntityType" AS ENUM ('STUDENT', 'EMPLOYEE', 'VEHICLE');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driving_schools" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "siret" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "driving_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" "GlobalRoleKey" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "PermissionCategory" NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("userId","permissionId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "roleId" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIF',
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(3),
    "lastLoginAt" TIMESTAMPTZ(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_driving_schools" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_driving_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "drivingSchoolId" TEXT,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "internalNumber" TEXT NOT NULL,
    "civility" "Civility" NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "birthDate" TIMESTAMPTZ(3),
    "birthPlace" TEXT,
    "address" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "legalGuardianName" TEXT,
    "legalGuardianPhone" TEXT,
    "legalGuardianEmail" TEXT,
    "registeredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingType" "TrainingType" NOT NULL DEFAULT 'TRADITIONNELLE',
    "licenseCategory" "LicenseCategory" NOT NULL,
    "nephNumber" TEXT,
    "fileStatus" "StudentFileStatus" NOT NULL DEFAULT 'INCOMPLET',
    "referentInstructorId" TEXT,
    "hoursBalance" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "internalNotes" TEXT,
    "gdprConsentAt" TIMESTAMPTZ(3),
    "gdprConsentDetails" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_packages" (
    "id" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseCategory" "LicenseCategory" NOT NULL,
    "includedHours" DECIMAL(6,2) NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "training_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "trainingPackageId" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceAtEnrollmentCents" INTEGER NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'EN_COURS',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "scheduledStart" TIMESTAMPTZ(3) NOT NULL,
    "scheduledEnd" TIMESTAMPTZ(3) NOT NULL,
    "departureLocation" TEXT,
    "sessionType" "LessonType" NOT NULL DEFAULT 'CONDUITE',
    "status" "LessonStatus" NOT NULL DEFAULT 'PLANIFIEE',
    "pedagogicalNotes" TEXT,
    "cancelledReason" TEXT,
    "recurrenceGroupId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_evaluations" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "skillsAssessed" TEXT,
    "progressNotes" TEXT,
    "levelReached" TEXT,
    "nextObjectives" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "instructor_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_allocations" (
    "id" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "licenseCategory" "LicenseCategory" NOT NULL,
    "examCenter" TEXT NOT NULL,
    "examDate" TIMESTAMPTZ(3) NOT NULL,
    "timeSlotLabel" TEXT,
    "seatsReceived" INTEGER NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL,
    "deadlineAt" TIMESTAMPTZ(3),
    "comments" TEXT,
    "status" "ExamAllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "exam_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_slots" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "status" "ExamSlotStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "exam_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_candidates" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "examSlotId" TEXT,
    "studentId" TEXT NOT NULL,
    "waitingListPriority" INTEGER,
    "status" "ExamCandidateStatus" NOT NULL DEFAULT 'LISTE_ATTENTE',
    "accompagnyingEmployeeId" TEXT,
    "vehicleId" TEXT,
    "convocationReceivedAt" TIMESTAMPTZ(3),
    "convocationDetails" TEXT,
    "result" "ExamResult",
    "failureReason" TEXT,
    "resultRecordedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "exam_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_driving_schools" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_driving_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryDrivingSchoolId" TEXT NOT NULL,
    "userId" TEXT,
    "civility" "Civility" NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "adminNotes" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_qualifications" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "obtainedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_contracts" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3),
    "probationEndDate" TIMESTAMPTZ(3),
    "weeklyHours" DECIMAL(5,2) NOT NULL,
    "payBasis" "PayBasis" NOT NULL,
    "payRateCents" INTEGER NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIF',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employment_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3) NOT NULL,
    "halfDay" "HalfDayPeriod" NOT NULL DEFAULT 'AUCUNE',
    "daysCount" DECIMAL(4,1) NOT NULL,
    "comment" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "validatedById" TEXT,
    "validatedAt" TIMESTAMPTZ(3),
    "validatorComment" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "plannedMinutes" INTEGER NOT NULL DEFAULT 0,
    "workedMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "TimesheetStatus" NOT NULL DEFAULT 'BROUILLON',
    "validatedById" TEXT,
    "validatedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_variables" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "grossSalaryCents" INTEGER NOT NULL DEFAULT 0,
    "bonusesCents" INTEGER NOT NULL DEFAULT 0,
    "overtimeCents" INTEGER NOT NULL DEFAULT 0,
    "absenceDeductionCents" INTEGER NOT NULL DEFAULT 0,
    "advancesCents" INTEGER NOT NULL DEFAULT 0,
    "benefitsCents" INTEGER NOT NULL DEFAULT 0,
    "expenseReimbursementCents" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" "PayrollPaymentStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "paymentDate" TIMESTAMPTZ(3),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payroll_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" "LicenseCategory" NOT NULL,
    "fuelType" "FuelType" NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "firstRegistrationDate" TIMESTAMPTZ(3),
    "mileage" INTEGER NOT NULL DEFAULT 0,
    "status" "VehicleStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "acquisitionDate" TIMESTAMPTZ(3),
    "financingMode" "FinancingMode" NOT NULL DEFAULT 'COMPTANT',
    "purchasePriceCents" INTEGER,
    "supplier" TEXT,
    "usualDriverEmployeeId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_contracts" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "financingMode" "FinancingMode" NOT NULL,
    "organismName" TEXT NOT NULL,
    "contractReference" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3),
    "monthlyPaymentCents" INTEGER,
    "firstPaymentCents" INTEGER,
    "contractualMileage" INTEGER,
    "mileageCap" INTEGER,
    "residualValueCents" INTEGER,
    "securityDepositCents" INTEGER,
    "debitDay" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "vehicle_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_maintenances" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "performedAt" TIMESTAMPTZ(3) NOT NULL,
    "mileageAtService" INTEGER NOT NULL,
    "garage" TEXT,
    "costCents" INTEGER,
    "nextDueDate" TIMESTAMPTZ(3),
    "nextDueMileage" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_insurances" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3) NOT NULL,
    "amountCents" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_incidents" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "description" TEXT NOT NULL,
    "costCents" INTEGER,
    "status" "IncidentStatus" NOT NULL DEFAULT 'DECLARE',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "vehicle_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'PAIEMENT',
    "serviceDescription" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "paidAt" TIMESTAMPTZ(3) NOT NULL,
    "reference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'VALIDE',
    "notes" TEXT,
    "correctsPaymentId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "drivingSchoolId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paidAt" TIMESTAMPTZ(3) NOT NULL,
    "supplier" TEXT,
    "paymentMethod" "PaymentMethod",
    "reference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'VALIDE',
    "relatedVehicleId" TEXT,
    "relatedEmployeeId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "documentId" TEXT,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "drivingSchoolId" TEXT,
    "category" "DocumentCategory" NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "studentId" TEXT,
    "employeeId" TEXT,
    "vehicleId" TEXT,
    "examAllocationId" TEXT,
    "employmentContractId" TEXT,
    "leaveRequestId" TEXT,
    "vehicleContractId" TEXT,
    "vehicleMaintenanceId" TEXT,
    "vehicleInsuranceId" TEXT,
    "vehicleIncidentId" TEXT,
    "paymentId" TEXT,
    "payrollVariableId" TEXT,
    "uploadedById" TEXT,
    "expiresAt" TIMESTAMPTZ(3),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "drivingSchoolId" TEXT,
    "type" "NotificationType" NOT NULL,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_recipients" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'NON_LUE',
    "readAt" TIMESTAMPTZ(3),
    "treatedAt" TIMESTAMPTZ(3),

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_history" (
    "id" TEXT NOT NULL,
    "entityType" "TransferEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "fromDrivingSchoolId" TEXT NOT NULL,
    "toDrivingSchoolId" TEXT NOT NULL,
    "transferredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferredById" TEXT,
    "reason" TEXT,

    CONSTRAINT "transfer_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "driving_schools_organizationId_idx" ON "driving_schools"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organizationId_key_key" ON "roles"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_driving_schools_userId_drivingSchoolId_key" ON "user_driving_schools"("userId", "drivingSchoolId");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_internalNumber_key" ON "students"("internalNumber");

-- CreateIndex
CREATE INDEX "students_organizationId_drivingSchoolId_idx" ON "students"("organizationId", "drivingSchoolId");

-- CreateIndex
CREATE INDEX "students_lastName_firstName_idx" ON "students"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "students_phone_idx" ON "students"("phone");

-- CreateIndex
CREATE INDEX "students_email_idx" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_nephNumber_idx" ON "students"("nephNumber");

-- CreateIndex
CREATE INDEX "training_packages_drivingSchoolId_idx" ON "training_packages"("drivingSchoolId");

-- CreateIndex
CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");

-- CreateIndex
CREATE INDEX "lessons_drivingSchoolId_scheduledStart_idx" ON "lessons"("drivingSchoolId", "scheduledStart");

-- CreateIndex
CREATE INDEX "lessons_instructorId_scheduledStart_idx" ON "lessons"("instructorId", "scheduledStart");

-- CreateIndex
CREATE INDEX "lessons_vehicleId_scheduledStart_idx" ON "lessons"("vehicleId", "scheduledStart");

-- CreateIndex
CREATE INDEX "lessons_studentId_idx" ON "lessons"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_evaluations_lessonId_key" ON "instructor_evaluations"("lessonId");

-- CreateIndex
CREATE INDEX "exam_allocations_drivingSchoolId_examDate_idx" ON "exam_allocations"("drivingSchoolId", "examDate");

-- CreateIndex
CREATE UNIQUE INDEX "exam_slots_allocationId_sequenceNumber_key" ON "exam_slots"("allocationId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "exam_candidates_examSlotId_key" ON "exam_candidates"("examSlotId");

-- CreateIndex
CREATE INDEX "exam_candidates_allocationId_idx" ON "exam_candidates"("allocationId");

-- CreateIndex
CREATE INDEX "exam_candidates_studentId_idx" ON "exam_candidates"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_driving_schools_employeeId_drivingSchoolId_key" ON "employee_driving_schools"("employeeId", "drivingSchoolId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE INDEX "employees_organizationId_primaryDrivingSchoolId_idx" ON "employees"("organizationId", "primaryDrivingSchoolId");

-- CreateIndex
CREATE INDEX "employee_qualifications_employeeId_idx" ON "employee_qualifications"("employeeId");

-- CreateIndex
CREATE INDEX "employee_qualifications_expiresAt_idx" ON "employee_qualifications"("expiresAt");

-- CreateIndex
CREATE INDEX "employment_contracts_employeeId_idx" ON "employment_contracts"("employeeId");

-- CreateIndex
CREATE INDEX "leave_requests_employeeId_startDate_endDate_idx" ON "leave_requests"("employeeId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "leave_requests_drivingSchoolId_status_idx" ON "leave_requests"("drivingSchoolId", "status");

-- CreateIndex
CREATE INDEX "timesheets_drivingSchoolId_date_idx" ON "timesheets"("drivingSchoolId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "timesheets_employeeId_date_key" ON "timesheets"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_variables_employeeId_periodYear_periodMonth_key" ON "payroll_variables"("employeeId", "periodYear", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE INDEX "vehicles_organizationId_drivingSchoolId_idx" ON "vehicles"("organizationId", "drivingSchoolId");

-- CreateIndex
CREATE INDEX "vehicle_contracts_vehicleId_idx" ON "vehicle_contracts"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_contracts_endDate_idx" ON "vehicle_contracts"("endDate");

-- CreateIndex
CREATE INDEX "vehicle_maintenances_vehicleId_performedAt_idx" ON "vehicle_maintenances"("vehicleId", "performedAt");

-- CreateIndex
CREATE INDEX "vehicle_maintenances_nextDueDate_idx" ON "vehicle_maintenances"("nextDueDate");

-- CreateIndex
CREATE INDEX "vehicle_insurances_vehicleId_idx" ON "vehicle_insurances"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_insurances_endDate_idx" ON "vehicle_insurances"("endDate");

-- CreateIndex
CREATE INDEX "vehicle_incidents_vehicleId_idx" ON "vehicle_incidents"("vehicleId");

-- CreateIndex
CREATE INDEX "payments_studentId_idx" ON "payments"("studentId");

-- CreateIndex
CREATE INDEX "payments_drivingSchoolId_paidAt_idx" ON "payments"("drivingSchoolId", "paidAt");

-- CreateIndex
CREATE INDEX "expenses_drivingSchoolId_paidAt_idx" ON "expenses"("drivingSchoolId", "paidAt");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE UNIQUE INDEX "documents_storageKey_key" ON "documents"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "documents_employmentContractId_key" ON "documents"("employmentContractId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_leaveRequestId_key" ON "documents"("leaveRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_vehicleContractId_key" ON "documents"("vehicleContractId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_vehicleMaintenanceId_key" ON "documents"("vehicleMaintenanceId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_vehicleInsuranceId_key" ON "documents"("vehicleInsuranceId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_vehicleIncidentId_key" ON "documents"("vehicleIncidentId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_paymentId_key" ON "documents"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_payrollVariableId_key" ON "documents"("payrollVariableId");

-- CreateIndex
CREATE INDEX "documents_organizationId_drivingSchoolId_idx" ON "documents"("organizationId", "drivingSchoolId");

-- CreateIndex
CREATE INDEX "documents_studentId_idx" ON "documents"("studentId");

-- CreateIndex
CREATE INDEX "documents_employeeId_idx" ON "documents"("employeeId");

-- CreateIndex
CREATE INDEX "documents_vehicleId_idx" ON "documents"("vehicleId");

-- CreateIndex
CREATE INDEX "documents_expiresAt_idx" ON "documents"("expiresAt");

-- CreateIndex
CREATE INDEX "notifications_organizationId_drivingSchoolId_createdAt_idx" ON "notifications"("organizationId", "drivingSchoolId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_recipients_userId_status_idx" ON "notification_recipients"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipients_notificationId_userId_key" ON "notification_recipients"("notificationId", "userId");

-- CreateIndex
CREATE INDEX "transfer_history_entityType_entityId_idx" ON "transfer_history"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "driving_schools" ADD CONSTRAINT "driving_schools_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_driving_schools" ADD CONSTRAINT "user_driving_schools_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_driving_schools" ADD CONSTRAINT "user_driving_schools_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_referentInstructorId_fkey" FOREIGN KEY ("referentInstructorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_packages" ADD CONSTRAINT "training_packages_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_trainingPackageId_fkey" FOREIGN KEY ("trainingPackageId") REFERENCES "training_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_evaluations" ADD CONSTRAINT "instructor_evaluations_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_allocations" ADD CONSTRAINT "exam_allocations_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_slots" ADD CONSTRAINT "exam_slots_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "exam_allocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "exam_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_examSlotId_fkey" FOREIGN KEY ("examSlotId") REFERENCES "exam_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_accompagnyingEmployeeId_fkey" FOREIGN KEY ("accompagnyingEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_candidates" ADD CONSTRAINT "exam_candidates_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_driving_schools" ADD CONSTRAINT "employee_driving_schools_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_driving_schools" ADD CONSTRAINT "employee_driving_schools_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_primaryDrivingSchoolId_fkey" FOREIGN KEY ("primaryDrivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_qualifications" ADD CONSTRAINT "employee_qualifications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_variables" ADD CONSTRAINT "payroll_variables_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_variables" ADD CONSTRAINT "payroll_variables_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_usualDriverEmployeeId_fkey" FOREIGN KEY ("usualDriverEmployeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_contracts" ADD CONSTRAINT "vehicle_contracts_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_maintenances" ADD CONSTRAINT "vehicle_maintenances_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_insurances" ADD CONSTRAINT "vehicle_insurances_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_incidents" ADD CONSTRAINT "vehicle_incidents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_correctsPaymentId_fkey" FOREIGN KEY ("correctsPaymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_examAllocationId_fkey" FOREIGN KEY ("examAllocationId") REFERENCES "exam_allocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_employmentContractId_fkey" FOREIGN KEY ("employmentContractId") REFERENCES "employment_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "leave_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_vehicleContractId_fkey" FOREIGN KEY ("vehicleContractId") REFERENCES "vehicle_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_vehicleMaintenanceId_fkey" FOREIGN KEY ("vehicleMaintenanceId") REFERENCES "vehicle_maintenances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_vehicleInsuranceId_fkey" FOREIGN KEY ("vehicleInsuranceId") REFERENCES "vehicle_insurances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_vehicleIncidentId_fkey" FOREIGN KEY ("vehicleIncidentId") REFERENCES "vehicle_incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_payrollVariableId_fkey" FOREIGN KEY ("payrollVariableId") REFERENCES "payroll_variables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_drivingSchoolId_fkey" FOREIGN KEY ("drivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_history" ADD CONSTRAINT "transfer_history_fromDrivingSchoolId_fkey" FOREIGN KEY ("fromDrivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_history" ADD CONSTRAINT "transfer_history_toDrivingSchoolId_fkey" FOREIGN KEY ("toDrivingSchoolId") REFERENCES "driving_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
