import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { Button, ChipSelect, DateField, PickerField, Sheet, TextField } from '@/components/ui';
import { EQUIPMENT_STATUS_OPTIONS } from '@/constants/equipmentLabels';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createEquipment, updateEquipment } from '@/services/equipment';
import { listSuppliers } from '@/services/suppliers';
import type { EquipmentRow } from '@/types/database';

const equipmentSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire'),
  category: z.string(),
  brand: z.string(),
  model: z.string(),
  serialNumber: z.string(),
  purchaseDate: z.string().nullable(),
  installationDate: z.string().nullable(),
  warrantyUntil: z.string().nullable(),
  supplierId: z.string().nullable(),
  maintenanceCompany: z.string(),
  maintenancePhone: z.string(),
  status: z.enum(['functional', 'to_monitor', 'broken', 'maintenance_in_progress', 'out_of_service']),
  notes: z.string(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

function defaultsFor(equipment?: EquipmentRow): EquipmentFormValues {
  if (!equipment) {
    return {
      name: '',
      category: '',
      brand: '',
      model: '',
      serialNumber: '',
      purchaseDate: null,
      installationDate: null,
      warrantyUntil: null,
      supplierId: null,
      maintenanceCompany: '',
      maintenancePhone: '',
      status: 'functional',
      notes: '',
    };
  }
  return {
    name: equipment.name,
    category: equipment.category ?? '',
    brand: equipment.brand ?? '',
    model: equipment.model ?? '',
    serialNumber: equipment.serial_number ?? '',
    purchaseDate: equipment.purchase_date,
    installationDate: equipment.installation_date,
    warrantyUntil: equipment.warranty_until,
    supplierId: equipment.supplier_id,
    maintenanceCompany: equipment.maintenance_company ?? '',
    maintenancePhone: equipment.maintenance_phone ?? '',
    status: equipment.status,
    notes: equipment.notes ?? '',
  };
}

interface EquipmentFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  equipment?: EquipmentRow;
}

export function EquipmentFormSheet({ visible, onClose, onSaved, equipment }: EquipmentFormSheetProps) {
  const theme = useAppTheme();
  const isEditing = !!equipment;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const suppliersQuery = useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers, enabled: visible });
  const supplierOptions = (suppliersQuery.data ?? []).map((s) => ({ value: s.id, label: s.name }));

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: defaultsFor(equipment),
    values: visible ? defaultsFor(equipment) : undefined,
  });

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        name: values.name.trim(),
        category: values.category.trim() || null,
        brand: values.brand.trim() || null,
        model: values.model.trim() || null,
        serial_number: values.serialNumber.trim() || null,
        purchase_date: values.purchaseDate,
        installation_date: values.installationDate,
        warranty_until: values.warrantyUntil,
        supplier_id: values.supplierId,
        maintenance_company: values.maintenanceCompany.trim() || null,
        maintenance_phone: values.maintenancePhone.trim() || null,
        status: values.status,
        notes: values.notes.trim() || null,
      };
      if (isEditing) {
        await updateEquipment(equipment.id, payload);
      } else {
        await createEquipment(payload);
      }
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isEditing ? "Modifier l'équipement" : 'Nouvel équipement'}
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label={isEditing ? 'Enregistrer' : "Créer l'équipement"} onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Controller control={control} name="name" render={({ field }) => <TextField label="Nom" required value={field.value} onChangeText={field.onChange} error={errors.name?.message} placeholder="Autoclave, fauteuil 1..." />} />
      <Controller control={control} name="category" render={({ field }) => <TextField label="Catégorie" value={field.value} onChangeText={field.onChange} placeholder="Stérilisation, imagerie..." />} />
      <Controller control={control} name="status" render={({ field }) => <ChipSelect label="Statut" options={EQUIPMENT_STATUS_OPTIONS} value={field.value} onChange={field.onChange} />} />
      <Controller control={control} name="brand" render={({ field }) => <TextField label="Marque" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="model" render={({ field }) => <TextField label="Modèle" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="serialNumber" render={({ field }) => <TextField label="Numéro de série" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="purchaseDate" render={({ field }) => <DateField label="Date d'achat" value={field.value} onChange={field.onChange} clearable />} />
      <Controller control={control} name="installationDate" render={({ field }) => <DateField label="Date d'installation" value={field.value} onChange={field.onChange} clearable />} />
      <Controller control={control} name="warrantyUntil" render={({ field }) => <DateField label="Garantie jusqu'au" value={field.value} onChange={field.onChange} clearable />} />
      <Controller control={control} name="supplierId" render={({ field }) => <PickerField label="Fournisseur" options={supplierOptions} value={field.value} onChange={field.onChange} clearable />} />
      <Controller control={control} name="maintenanceCompany" render={({ field }) => <TextField label="Société de maintenance" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="maintenancePhone" render={({ field }) => <TextField label="Téléphone maintenance" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} />} />
      <Controller control={control} name="notes" render={({ field }) => <TextField label="Notes" multiline value={field.value} onChangeText={field.onChange} />} />
    </Sheet>
  );
}